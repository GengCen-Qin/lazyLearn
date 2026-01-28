# == Schema Information
#
# Table name: user_audios
#
#  id         :bigint           not null, primary key
#  user_id    :bigint           not null
#  audio_id   :bigint           not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_user_audios_on_user_id_and_audio_id  (user_id, audio_id) UNIQUE
#
class UserAudio < ApplicationRecord
  belongs_to :user
  belongs_to :audio
end