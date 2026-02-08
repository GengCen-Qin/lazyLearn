# frozen_string_literal: true

module TxtBookParsable
  extend ActiveSupport::Concern

  class_methods do
    def parse_from_io(io, user_id, title)
      lines = io.read.force_encoding("UTF-8").split(/\r?\n/).reject(&:empty?)

      book_title = title.presence || lines.first&.strip.presence || "未命名书籍"

      total_lines = lines.length

      book = Book.create!(
        title: book_title,
        total_lines: total_lines,
        encoding: "utf-8",
        user_id: user_id
      )

      book_contents = lines.each_with_index.map do |line_content, index|
        {
          book_id: book.id,
          content: line_content,
          line_number: index + 1
        }
      end

      BookContent.insert_all!(book_contents)

      book
    end
  end
end
