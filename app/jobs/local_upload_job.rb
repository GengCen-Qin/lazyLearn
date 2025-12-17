class LocalUploadJob < ApplicationJob
  queue_as :default

  def perform(id)
    record = Video.find(id)
    file = Down.download(record.ori_video_url)
    video_file.attach(io: file, filename: record.title, content_type: Util.determine_content_type(file))
  end
end
