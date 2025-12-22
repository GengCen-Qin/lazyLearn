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

  # Scopes
  scope :core,    -> { where(oxford: 1) }
  scope :cet4,    -> { where("tag LIKE '%cet4%'") }
  scope :cet6,    -> { where("tag LIKE '%cet6%'") }
  scope :search,  ->(q) { where("lower(word) LIKE ?", "#{q.to_s.downcase.strip}%") }

  # Class Methods
  class << self
    def lookup(word)
      clean_word = word.to_s.strip.gsub(/[^a-zA-Z]/, "").downcase
      return nil if clean_word.blank?

      word_record = find_by(word: clean_word)
      return word_record if word_record

      word_record = find_by("lower(word) = ?", clean_word)
      return word_record if word_record

      # 尝试模糊匹配
      search(clean_word).first
    end
  end

  # Instance Methods
  def uk_phonetic = phonetic
  def us_phonetic = phonetic # 目前 ECDICT 只有一套音标
  def simple_word = sw

  def core?
    oxford.to_i == 1 || collins.to_i > 0
  end

  # 序列化方法 - 返回格式化的单词数据
  def serialized
    {
      id: id,
      word: word,
      phonetic: phonetic,
      definition: definition,
      translation: translation,
      detail: detail,
      pos: pos,
      audio: audio,
      oxford: oxford,
      collins: collins,
      core: core?,
      tag: tag,
      exchange: exchange,
      word_forms: word_forms, # 添加解析后的变形信息
      formatted_definition: formatted_definition, # 添加格式化定义
      bnc: bnc,
      frq: frq
    }
  end

  # 格式化定义 - 简化版
  def formatted_definition
    return "" if definition.blank?

    # 清理：移除网络标记和word标签，按分号或换行分割
    cleaned = definition.gsub(/\[网络\]/i, '').gsub(/\[\/?word\]/, '').strip

    # 按分号或换行分割，然后清理空格
    items = cleaned.split(/[;\n]/).map(&:strip).reject(&:blank?)

    # 用分号加空格连接
    items.join('; ')
  end

  # 格式化翻译 - 分割并清理
  def formatted_translation
    return [] if translation.blank?
    translation.split(";").map(&:strip).reject(&:blank?)
  end

  # 格式化标签 - 分割并清理
  def formatted_tags
    return [] if tag.blank?
    tag.split(",").map(&:strip).reject(&:blank?)
  end

  # 解析单词变形信息
  def parsed_exchange
    return {} if exchange.blank?

    exchange_types = {
      'p' => '过去式',
      'd' => '过去分词',
      'i' => '现在分词',
      '3' => '第三人称单数',
      'r' => '形容词比较级',
      't' => '形容词最高级',
      's' => '名词复数',
      '0' => '词根',
      '1' => '词根变形'
    }

    result = {}
    exchange.split('/').each do |item|
      next if item.blank?

      if item.include?(':')
        type, form = item.split(':', 2)
        if exchange_types[type] && form.present?
          result[type] = {
            type: exchange_types[type],
            form: form,
            type_code: type
          }
        end
      end
    end

    result
  end

  # 获取单词变形信息，用于前端显示
  def word_forms
    parsed_exchange.values
  end
end
