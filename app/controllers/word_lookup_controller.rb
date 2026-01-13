class WordLookupController < ApplicationController
  allow_unauthenticated_access only: [ :create ]
  try_user

  # POST /word_lookup
  def create
    word_param = params[:word].to_s.strip

    if word_param.blank?
      respond_to do |format|
        format.turbo_stream { render_error("单词不能为空") }
        format.json { render json: { success: false, message: "单词不能为空" }, status: :bad_request }
      end
      return
    end

    # 查询本地单词数据
    @word = EcdictWord.find_by_word(word_param)

    unless @word
      respond_to do |format|
        format.turbo_stream { render_error("未找到单词释义") }
        format.json { render json: { success: false, message: "未找到单词释义" }, status: :not_found }
      end
      return
    end

    # 获取外部 API 数据
    @external_data = fetch_external_word_data(word_param)

    # 是否被当前用户收藏了该单词
    @favorited = Current.user && Current.user.favorites.exists?(word_id: @word.id)

    respond_to do |format|
      format.turbo_stream
      format.json { render json: { success: true, word: @word } }
    end
  end

  private

  # 调用外部 API 获取单词数据
  def fetch_external_word_data(word)
    begin
      uri = URI("https://v2.xxapi.cn/api/englishwords?word=#{ERB::Util.url_encode(word)}")
      response = Net::HTTP.get_response(uri)

      if response.is_a?(Net::HTTPSuccess)
        data = JSON.parse(response.body)

        if data["code"] == 200 && data["data"]
          # 清理音标中的额外说明文字
          ukphone = clean_phonetic(data["data"]["ukphone"])
          usphone = clean_phonetic(data["data"]["usphone"])

          return {
            sentences: data["data"]["sentences"] || [],
            ukphone: ukphone,
            ukspeech: data["data"]["ukspeech"],
            usphone: usphone,
            usspeech: data["data"]["usspeech"]
          }
        end
      end

      nil
    rescue => error
      Rails.logger.warn("Failed to fetch external word data: #{error.message}")
      nil
    end
  end

  # 清理音标中的额外说明文字
  def clean_phonetic(phone)
    return nil if phone.blank?

    # 移除类似 "(for v.) ˈsepəreɪt; (for adj.) ˈseprət" 中的说明文字
    phone
      .gsub(/\(for\s+[^\)]+\)\s*/, '') # 移除 (for xxx) 说明
      .gsub(/;\s*\(for\s+[^\)]+\)\s*/, '; ') # 移除分号后的说明
      .gsub(/;\s*/, '; ') # 标准化分号
      .strip
  end

  def render_error(message)
    render turbo_stream: turbo_stream.update("wordDetail", template: "word_lookup/_error", locals: { message: message })
  end
end
