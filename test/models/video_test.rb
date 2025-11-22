# == Schema Information
#
# Table name: videos
#
#  id                     :integer          not null, primary key
#  description            :text
#  title                  :string
#  transcription_language :string           default("zh")
#  transcription_segments :json
#  transcription_status   :integer          default("pending"), not null
#  transcription_time     :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_videos_on_transcription_language  (transcription_language)
#  index_videos_on_transcription_status    (transcription_status)
#
require "test_helper"

class VideoTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
