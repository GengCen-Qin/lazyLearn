# == Schema Information
#
# Table name: favorites
#
#  id         :integer          not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :integer          not null
#  word_id    :integer          not null
#
# Indexes
#
#  index_favorites_on_user_id              (user_id)
#  index_favorites_on_user_id_and_word_id  (user_id,word_id) UNIQUE
#  index_favorites_on_word_id              (word_id)
#
# Foreign Keys
#
#  user_id  (user_id => users.id)
#
class Favorite < ApplicationRecord
  belongs_to :user
  belongs_to :word, class_name: 'EcdictWord', foreign_key: :word_id

  validates :user_id, uniqueness: { scope: :word_id }
end
