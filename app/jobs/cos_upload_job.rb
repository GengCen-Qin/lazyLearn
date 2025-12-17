class CosUploadJob < ApplicationJob
  queue_as :upload

  def perform(video_id)
    video = Video.find_by(id: video_id)
    return if video.nil? || video.ori_video_url.blank? || !Rails.env.production?

    response = Typhoeus.post(
      "http://new_web-cos:8080/api/v1/upload",
      headers: { "Content-Type" => "application/json" },
      body: { file_url: video.ori_video_url }.to_json
    )
    if response.success?
      video.video_file.purge_later
    else
      Rails.logger.error "OSS 上传失败: #{response.body}, #{video.ori_video_url}"
    end
  rescue StandardError => e
    Rails.logger.error "OSS 上传失败: #{e.message}, #{video.ori_video_url}"
  end
end
