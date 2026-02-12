# == Schema Information
#
# Table name: user_quotas
#
#  id          :integer          not null, primary key
#  expires_at  :datetime
#  quota_type  :string           not null
#  total_limit :integer          not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :integer          not null
#
# Indexes
#
#  index_user_quotas_on_quota_type              (quota_type)
#  index_user_quotas_on_user_id                 (user_id)
#  index_user_quotas_on_user_id_and_quota_type  (user_id,quota_type)
#
class UserQuota < ApplicationRecord
  self.table_name = "user_quotas"
  belongs_to :user
  has_many :usage_records, dependent: :nullify

  QUOTA_TYPES = {
    free: "free",
    vip: "vip"
  }.freeze

  validates :quota_type, presence: true, inclusion: { in: QUOTA_TYPES.values }
  validates :total_limit, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where("expires_at IS NULL OR expires_at > ?", Time.current) }
  scope :for_user, ->(user) { where(user: user) }
  scope :free, -> { where(quota_type: QUOTA_TYPES[:free]) }
  scope :vip, -> { where(quota_type: QUOTA_TYPES[:vip]) }

  FREE_QUOTA_COUNT = 2
  VIP_DURATION_DAYS = 30

  def self.create_free_quota_for_user(user)
    create!(
      user: user,
      quota_type: QUOTA_TYPES[:free],
      total_limit: FREE_QUOTA_COUNT,
      expires_at: nil
    )
  end

  def self.create_vip_quota_for_user(user, days = VIP_DURATION_DAYS)
    create!(
      user: user,
      quota_type: QUOTA_TYPES[:vip],
      total_limit: 0,
      expires_at: Time.current + days.days
    )
  end

  def active?
    expires_at.nil? || expires_at > Time.current
  end

  def remaining_count
    return Float::INFINITY if quota_type == QUOTA_TYPES[:vip] && active?
    [ total_limit - usage_records.success.count, 0 ].max
  end

  def has_remaining?
    remaining_count > 0
  end

  def vip?
    quota_type == QUOTA_TYPES[:vip]
  end

  def free?
    quota_type == QUOTA_TYPES[:free]
  end
end
