# == Schema Information
#
# Table name: user_audios
#
#  id         :integer          not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  audio_id   :integer          not null
#  user_id    :integer          not null
#
# Indexes
#
#  index_user_audios_on_audio_id              (audio_id)
#  index_user_audios_on_user_id               (user_id)
#  index_user_audios_on_user_id_and_audio_id  (user_id,audio_id) UNIQUE
#
# Foreign Keys
#
#  audio_id  (audio_id => audios.id)
#  user_id   (user_id => users.id)
#
class UserAudio < ApplicationRecord
  belongs_to :user
  belongs_to :audio
end
