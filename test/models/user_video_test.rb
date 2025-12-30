# == Schema Information
#
# Table name: user_videos
#
#  id         :integer          not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :integer          not null
#  video_id   :integer          not null
#
# Indexes
#
#  index_user_videos_on_user_id               (user_id)
#  index_user_videos_on_user_id_and_video_id  (user_id,video_id) UNIQUE
#  index_user_videos_on_video_id              (video_id)
#
# Foreign Keys
#
#  user_id   (user_id => users.id)
#  video_id  (video_id => videos.id)
#
require "test_helper"

class UserVideoTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
