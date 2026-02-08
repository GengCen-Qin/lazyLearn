# frozen_string_literal: true

# == Schema Information
#
# Table name: books
#
#  id          :integer          not null, primary key
#  encoding    :string           default("utf-8")
#  title       :string           not null
#  total_lines :integer          not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :integer          not null
#
# Indexes
#
#  index_books_on_user_id  (user_id)
#
# Foreign Keys
#
#  user_id  (user_id => users.id)
#
class Book < ApplicationRecord
  belongs_to :user
  has_many :book_contents, dependent: :destroy
  has_one :reading_progress, dependent: :destroy
end
