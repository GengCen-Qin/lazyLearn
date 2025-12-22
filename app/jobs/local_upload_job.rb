class LocalUploadJob < ApplicationJob
  queue_as :upload

  def perform(id)
    record = Video.find_by(id: id)
    file = Down.download(record.ori_video_url)
    record.video_file.attach(io: file, filename: record.title, content_type: Util.determine_content_type(file))
  rescue StandardError => e
    Rails.logger.error "本地上传失败: #{e.message}, #{record.id}"
  end
end
