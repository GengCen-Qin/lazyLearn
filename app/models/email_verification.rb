# == Schema Information
#
# Table name: email_verifications
#
#  id             :integer          not null, primary key
#  attempts_count :integer          default(0), not null
#  code_digest    :string           not null
#  email          :string           not null
#  expires_at     :datetime         not null
#  ip_address     :string
#  used           :boolean          default(FALSE), not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
# Indexes
#
#  index_email_verifications_on_created_at  (created_at)
#  index_email_verifications_on_email       (email)
#  index_email_verifications_on_expires_at  (expires_at)
#
class EmailVerification < ApplicationRecord
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :code_digest, presence: true
  validates :expires_at, presence: true
  validates :attempts_count, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(used: false).where("expires_at > ?", Time.current) }
  scope :for_email, ->(email) { where(email: email) }
  scope :recent, ->(minutes = 1) { where("created_at > ?", minutes.minutes.ago) }

  # 检查是否过期
  def expired?
    expires_at < Time.current
  end

  # 增加尝试次数
  def increment_attempts!
    increment!(:attempts_count)
  end

  # 检查是否超过最大尝试次数
  def max_attempts_reached?(max_attempts = 5)
    attempts_count >= max_attempts
  end
end
