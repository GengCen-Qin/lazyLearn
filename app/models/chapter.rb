# frozen_string_literal: true

# == Schema Information
#
# Table name: chapters
#
#  id          :integer          not null, primary key
#  content     :json
#  order_index :integer          not null
#  title       :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  book_id     :integer          not null
#
# Indexes
#
#  index_chapters_on_book_id                  (book_id)
#  index_chapters_on_book_id_and_order_index  (book_id,order_index)
#
# Foreign Keys
#
#  book_id  (book_id => books.id)
#
class Chapter < ApplicationRecord
  belongs_to :book
  has_many_attached :images, dependent: :purge
end
