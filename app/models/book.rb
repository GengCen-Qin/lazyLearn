# frozen_string_literal: true

# == Schema Information
#
# Table name: books
#
#  id         :integer          not null, primary key
#  author     :string
#  language   :string
#  publisher  :string
#  title      :string           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :integer          not null
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
  include ::EpubParsable

  belongs_to :user
  has_many :chapters, dependent: :destroy
  has_one_attached :cover_image
  has_one :reading_progress, dependent: :destroy
end
