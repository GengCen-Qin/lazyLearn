class AddUniqueIndexToUserVideos < ActiveRecord::Migration[8.0]
  def change
    # 添加唯一索引，确保同一个用户不能重复关联同一个视频
    add_index :user_videos, [:user_id, :video_id], unique: true
  end
end
