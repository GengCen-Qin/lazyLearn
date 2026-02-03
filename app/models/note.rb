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
class Note < ApplicationRecord
  belongs_to :user

  validates :content, presence: true
  validates :question, presence: true

  def mark_as_reviewed
    update(last_review_time: Time.current)
  end
end
