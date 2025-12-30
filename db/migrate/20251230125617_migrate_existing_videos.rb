class MigrateExistingVideos < ActiveRecord::Migration[8.0]
  def up
    # 策略: 将所有现有视频标记为免费
    # 这样现有用户和新用户都能看到这些视频
    Video.update_all(free: true)

    # 可选: 为现有用户创建与现有视频的关联
    # 如果你想让现有用户"拥有"这些视频，可以取消下面的注释
    # User.find_each do |user|
    #   Video.find_each do |video|
    #     UserVideo.find_or_create_by(user: user, video: video)
    #   end
    # end
  end

  def down
    # 回滚: 将所有视频设为非免费
    Video.update_all(free: false)
  end
end
