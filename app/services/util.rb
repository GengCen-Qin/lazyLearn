class Util
  class << self
    def determine_content_type(downloaded_file)
      ext = File.extname(downloaded_file.path).downcase
      case ext
      when ".mp4"
        "video/mp4"
      when ".mov"
        "video/quicktime"
      when ".avi"
        "video/x-msvideo"
      when ".mkv"
        "video/x-matroska"
      when ".webm"
        "video/webm"
      when ".m4v"
        "video/x-m4v"
      else
        "video/mp4"
      end
    end
  end
end
