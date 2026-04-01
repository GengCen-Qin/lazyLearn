# == Schema Information
#
# Table name: audio_learning_materials
#
#  id                 :integer          not null, primary key
#  audio_id           :integer          not null
#  core_dialogue      :json             default: {}
#  key_expressions    :json             default: []
#  practice_segments  :json             default: []
#  status             :integer          default: 0, not null
#  error_message      :text
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class AudioLearningMaterial < ApplicationRecord
  belongs_to :audio

  enum :status, { pending: 0, processing: 1, completed: 2, failed: 3 }

  # 核心对话数据结构
  # {
  #   "title": "请求延期",
  #   "scenario": "Casey 的老板询问工作进度...",
  #   "segments": [...]
  # }

  # 关键表达数据结构
  # [
  #   {
  #     "expression": "ask for an extension",
  #     "meaning": "请求延期",
  #     "note": "工作中常用"
  #   }
  # ]

  # 练习片段（核心对话 + 关键句）
  # [
  #   {
  #     "type": "dialogue",  # 或 "key_sentence"
  #     "role": "Boss",
  #     "text": "How are things going?",
  #     "cn_hint": "事情进展得怎么样？",
  #     "start": 65
  #   }
  # ]

  def has_content?
    core_dialogue.present? && practice_segments.present?
  end

  def dialogue_segments
    return [] unless core_dialogue.present?
    core_dialogue["segments"] || []
  end

  def ready?
    completed? && has_content?
  end
end
