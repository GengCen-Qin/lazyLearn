class AudioLocalUploadJob < ApplicationJob
  queue_as :upload

  def perform(id)
    record = Audio.find_by(id: id)

    # 使用 Down gem 下载，设置适当的请求头
    file = Down.download(
      record.remote_url,
      headers: {
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer' => 'https://www.bilibili.com/',
        'Accept' => '*/*',
        'Accept-Language' => 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding' => 'gzip, deflate, br',
        'Connection' => 'keep-alive',
        'Origin' => 'https://www.bilibili.com'
      }
    )

    record.audio_file.attach(io: file, filename: record.title, content_type: Util.determine_audio_content_type(file))
  rescue StandardError => e
    Rails.logger.error "音频本地上传失败: #{e.message}, #{record.id}"
  end
end