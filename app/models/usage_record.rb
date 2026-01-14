# == Schema Information
#
# Table name: usage_records
#
#  id         :integer          not null, primary key
#  user_id    :integer          not null
#  quota_id   :integer          not null
#  status     :string           not null
#  notes      :text
#  used_at    :datetime         not null
#  ip_address :string
#  user_agent :text
#  created_at :datetime         not null
#
class UsageRecord < ApplicationRecord
  belongs_to :user
  belongs_to :quota, class_name: "UserQuota"

  validates :status, presence: true, inclusion: { in: STATUS_TYPES.values }
  validates :used_at, presence: true

  scope :success, -> { where(status: STATUS_TYPES[:success]) }
  scope :failed, -> { where(status: STATUS_TYPES[:failed]) }
  scope :for_user, ->(user) { where(user: user) }
  scope :recent, -> { order(used_at: :desc) }

  STATUS_TYPES = {
    success: "success",
    failed: "failed"
  }.freeze

  def self.create_success_record(user:, quota:, ip_address: nil, user_agent: nil)
    create!(
      user: user,
      quota: quota,
      status: STATUS_TYPES[:success],
      used_at: Time.current,
      ip_address: ip_address,
      user_agent: user_agent
    )
  end

  def self.create_failed_record(user:, quota:, notes:, ip_address: nil, user_agent: nil)
    create!(
      user: user,
      quota: quota,
      status: STATUS_TYPES[:failed],
      notes: notes,
      used_at: Time.current,
      ip_address: ip_address,
      user_agent: user_agent
    )
  end

  def success?
    status == STATUS_TYPES[:success]
  end

  def failed?
    status == STATUS_TYPES[:failed]
  end
end
