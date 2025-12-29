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
require "test_helper"

class EmailVerificationTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
