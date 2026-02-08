# frozen_string_literal: true

# == Schema Information
#
# Table name: reading_progresses
#
#  id         :integer          not null, primary key
#  end_line   :integer          not null
#  start_line :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  book_id    :integer          not null
#  user_id    :integer          not null
#
# Indexes
#
#  index_reading_progresses_on_book_id              (book_id)
#  index_reading_progresses_on_user_id              (user_id)
#  index_reading_progresses_on_user_id_and_book_id  (user_id,book_id) UNIQUE
#
# Foreign Keys
#
#  book_id  (book_id => books.id)
#  user_id  (user_id => users.id)
#
class ReadingProgress < ApplicationRecord
  belongs_to :user
  belongs_to :book
end
