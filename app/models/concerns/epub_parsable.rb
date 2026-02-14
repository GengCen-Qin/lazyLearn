# frozen_string_literal: true

module EpubParsable
  extend ActiveSupport::Concern

  # Markdown中图片的模型匹配
  MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/

  class_methods do
    def parse_from_io(io, user_id)
      temp_dir = Dir.mktmpdir("epub_#{SecureRandom.hex(8)}_")
      epub_path = File.join(temp_dir, "book.epub")
      File.open(epub_path, "wb") { |f| f.write(io.read) }

      file_info = get_epub_info(epub_path)
      file_info[:user_id] = user_id
      book = Book.create!(file_info)

      output_base = Rails.root.join("storage", "epub_output", book.id.to_s)
      FileUtils.mkdir_p(output_base)

      epub_copy = File.join(output_base, "book.epub")
      FileUtils.cp(epub_path, epub_copy)

      Dir.chdir(output_base) do
        system("epub2md -c \"#{epub_copy}\"")
      end

      parse_chapters(book, output_base)

      book
    ensure
      FileUtils.rm_rf(temp_dir) if Dir.exist?(temp_dir)
      FileUtils.rm_rf(output_base) if Dir.exist?(output_base)
    end

    private

    def get_epub_info(epub_path)
      json, stderr, status = Open3.capture3("epub2md -i #{epub_path}")
      json = json.gsub(/\e\[[0-9;]*[a-zA-Z]/, "")
      info = eval json.split("book info:").last.gsub("\n", "").gsub("},", "}")
      author = info[:author]
      title = info[:title]
      language = info[:language]
      publisher = info[:publisher]

      {
        title: title,
        author: author,
        language: language,
        publisher: publisher
      }
    end

    # 解析章节并处理图片
    def parse_chapters(book, output_dir)
      md_files = glob_md_files(output_dir)
      image_map = build_image_map(output_dir)

      md_files.each_with_index do |md_path, index|
        content = File.read(md_path, encoding: "UTF-8")
        title = extract_title(md_path)
        content = normalize_content(content)

        chapter = Chapter.create!(
          book_id: book.id,
          title: title,
          content: content,
          order_index: index + 1
        )

        process_images(chapter, content, image_map)
      end
    end

    # 获取所有md文件
    def glob_md_files(output_dir)
      Dir.glob(File.join(output_dir.to_s, "book", "*.md")).sort
    end

    # 构建文件名到路径的映射
    def build_image_map(output_dir)
      image_extensions = %w[.jpg .jpeg .png .gif .webp .svg]
      map = {}

      Dir.glob(File.join(output_dir.to_s, "book", "**", "*")).each do |path|
        next unless File.file?(path)
        ext = File.extname(path).downcase
        map[File.basename(path)] = path if image_extensions.include?(ext)
      end

      map
    end

    # 从文件名提取标题
    def extract_title(md_path)
      File.basename(md_path).gsub(/\.md$/, "")
    end

    # 规范化内容（去掉多余空行 和 #）
    def normalize_content(content)
      content.gsub(/\n{3,}/, "\n").gsub(/^#\s+/, "")
    end

    # 处理章节中的图片，上传到ActiveStorage并替换路径
    def process_images(chapter, content, image_map)
      new_content = content.gsub(MARKDOWN_IMAGE_PATTERN) do
        alt_text = $1
        image_path = $2
        next $& if external_url?(image_path)

        image_full_path = image_map[File.basename(image_path)]
        next $& unless image_full_path

        url = image_url(chapter, image_full_path)
        img_tag(alt_text, url)
      end
      chapter.update(content: format_content(new_content))
    end

    def format_content(new_content)
      new_content.split("\n").map do |line|
        if match = line.match(/\[.*?\]\(\.\/(.*?)\.md\)/)
          { type: :link, content: match[1] }
        elsif line.start_with?("<img")
          { type: :image, content: line }
        else
          { type: :txt, content: line }
        end
      end
    end

    # 判断是否为外部URL
    def external_url?(path)
      path.start_with?("http://", "https://")
    end

    # 获取图片的ActiveStorage URL
    def image_url(chapter, image_path)
      attachment = attach_image(chapter, image_path)
      Rails.application.routes.url_helpers.rails_blob_path(attachment, only_path: true)
    end

    # 生成img标签
    def img_tag(alt_text, url)
      "<img class=\"my-3 mx-auto\" src=\"#{url}\" alt=\"#{alt_text}\">"
    end

    # 上传图片到章节，返回attachment
    def attach_image(chapter, image_path)
      filename = File.basename(image_path)
      existing = chapter.images.attachments.find { |a| a.filename.to_s == filename }
      return existing if existing

      File.open(image_path) do |file|
        chapter.images.attach(io: file, filename: filename, content_type: mime_type(filename))
      end

      chapter.images.last
    end

    # 根据扩展名获取MIME类型
    def mime_type(filename)
      ext = File.extname(filename).downcase
      { ".jpg" => "image/jpeg", ".jpeg" => "image/jpeg", ".png" => "image/png",
        ".gif" => "image/gif", ".webp" => "image/webp", ".svg" => "image/svg+xml" }[ext] ||
        "application/octet-stream"
    end
  end
end
