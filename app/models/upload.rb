# == Schema Information
#
# Table name: uploads
#
#  id         :integer          not null, primary key
#  info       :text
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Upload < ApplicationRecord
  has_one_attached :file, dependent: :purge
end
