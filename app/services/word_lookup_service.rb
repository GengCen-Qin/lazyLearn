class WordLookupService
  include ActiveModel::Model
  include ActiveModel::Attributes

  attr_reader :word, :result

  def initialize(word)
    @word = word
    @result = nil
  end

  def self.call(word)
    new(word).call
  end

  def call
    return failure_result(I18n.t("word_lookup.word_required"), :bad_request) if word.blank?

    word_record = EcdictWord.lookup(word)

    if word_record
      success_result(word_record.serialized)
    else
      failure_result(I18n.t("word_lookup.not_found", word: word), :not_found)
    end
  rescue StandardError => e
    Rails.logger.error "Word lookup error: #{e.message}"
    failure_result(I18n.t("word_lookup.lookup_failed"), :internal_server_error)
  end

  def success?
    result&.dig(:success) || false
  end

  def word_data
    result&.dig(:word)
  end

  def message
    result&.dig(:message)
  end

  def http_status
    result&.dig(:status) || :ok
  end

  private

  def success_result(word_data)
    @result = { success: true, word: word_data }
    self
  end

  def failure_result(message, status = :not_found)
    @result = { success: false, message: message, status: status }
    self
  end
end
