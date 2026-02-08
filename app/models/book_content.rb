# frozen_string_literal: true

# == Schema Information
#
# Table name: book_contents
#
#  id          :integer          not null, primary key
#  content     :text             not null
#  line_number :integer          not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  book_id     :integer          not null
#
# Indexes
#
#  index_book_contents_on_book_id                  (book_id)
#  index_book_contents_on_book_id_and_line_number  (book_id,line_number) UNIQUE
#
# Foreign Keys
#
#  book_id  (book_id => books.id)
#
class BookContent < ApplicationRecord
  belongs_to :book
end
