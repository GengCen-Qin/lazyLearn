# == Schema Information
#
# Table name: ecdict_words
#
#  id          :integer          not null, primary key
#  audio       :text
#  bnc         :integer
#  collins     :integer          default(0)
#  definition  :text
#  detail      :text
#  exchange    :text
#  frq         :integer
#  oxford      :integer          default(0)
#  phonetic    :string(64)
#  pos         :string(16)
#  sw          :string(64)       not null
#  tag         :string(64)
#  translation :text
#  word        :string(64)       not null
#
# Indexes
#
#  index_ecdict_words_on_collins     (collins)
#  index_ecdict_words_on_lower_word  (lower(word))
#  index_ecdict_words_on_oxford      (oxford)
#  index_ecdict_words_on_word        (word) UNIQUE
#
class EcdictWord < ActiveRecord::Base
  self.abstract_class = true          # 告诉 Rails 这不是一张真表
  establish_connection :legacy

  self.table_name = "stardict"
  self.primary_key = "id"

  scope :core,    -> { where(oxford: 1) }
  scope :cet4,    -> { where("tag LIKE '%cet4%'") }
  scope :cet6,    -> { where("tag LIKE '%cet6%'") }
  scope :search,  ->(q) { where("lower(word) LIKE ?", "#{q.to_s.downcase.strip}%") }

  # 方便前端显示音标
  def uk_phonetic = phonetic
  def us_phonetic = phonetic # 目前 ECDICT 只有一套音标

  # sw 字段可能是简单的单词变体或拼写权重
  def simple_word = sw

  # 检查是否为核心词汇
  def core? = oxford == 1 || collins > 0
end
