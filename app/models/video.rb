class Video < ApplicationRecord
  has_one_attached :video_file

  def local_path
    video_file.blob.service.send(:path_for, video_file.blob.key)
  end
end
