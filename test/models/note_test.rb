# == Schema Information
#
# Table name: notes
#
#  id               :integer          not null, primary key
#  content          :text
#  last_review_time :datetime
#  note             :text
#  question         :text
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  user_id          :integer          not null
#
# Indexes
#
#  index_notes_on_created_at        (created_at)
#  index_notes_on_last_review_time  (last_review_time)
#  index_notes_on_user_id           (user_id)
#
# Foreign Keys
#
#  user_id  (user_id => users.id) ON DELETE => cascade
#
require "test_helper"

class NoteTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
