# == Schema Information
#
# Table name: users
#
#  id              :integer          not null, primary key
#  email_address   :string           not null
#  password_digest :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_users_on_email_address  (email_address) UNIQUE
#
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :user_videos, dependent: :destroy
  has_many :videos, through: :user_videos
  has_many :user_audios, dependent: :destroy
  has_many :audios, through: :user_audios
  has_many :favorites, dependent: :destroy
  has_many :user_quotas, dependent: :destroy
  has_many :usage_records, dependent: :destroy

  after_create :connect_free_video, :create_free_quota

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  validates :email_address, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

  def connect_free_video
    Video.free.each do |video|
      user_videos.create!(video: video)
    end
  end

  def create_free_quota
    UserQuota.create_free_quota_for_user(self)
  end

  def active_vip_quota
    user_quotas.vip.active.first
  end

  def active_free_quota
    user_quotas.free.active.first
  end

  def has_vip?
    active_vip_quota.present?
  end

  def can_use_quota?
    has_vip? || (active_free_quota&.has_remaining? == true)
  end

  def available_quota
    active_vip_quota || active_free_quota
  end

  def activate_vip(days = UserQuota::VIP_DURATION_DAYS)
    UserQuota.create_vip_quota_for_user(self, days)
  end

  def use_quota(status:, notes: nil, ip_address: nil, user_agent: nil)
    transaction do
      quota = available_quota
      raise "没有可用配额" unless quota

      if quota.free? && !quota.has_remaining?
        raise "免费额度已用完"
      end

      UsageRecord.create!(
        user: self,
        quota: quota,
        status: status,
        notes: notes,
        used_at: Time.current,
        ip_address: ip_address,
        user_agent: user_agent
      )

      quota
    end
  end
end
