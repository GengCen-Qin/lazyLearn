# 腾讯云 音频解析 服务
class TencentAsrService
  attr_reader :secret_id, :secret_key, :token

  def initialize(secret_id: nil, secret_key: nil, token: nil)
    @secret_id = secret_id || ENV["TENCENTCLOUD_SECRET_ID"]
    @secret_key = secret_key || ENV["TENCENTCLOUD_SECRET_KEY"]
    @token = token || ""
  end

  # 需要解析的URL
  def parse(url)
    request_transcription(url).dig("Response", "Data", "TaskId")
  end

  # 查询任务是否完成
  # @return [Symbol, Array] 返回任务状态和结果
  def query(task_id)
    data = query_task_status(task_id).dig("Response", "Data")
    return [ :failed, "request return nil" ] if data.nil?

    case data["Status"]
    when 1
      Rails.logger.info("Task #{task_id} is in progress")
      [ :processing, nil ]
    when 2
      result = data["ResultDetail"].map do |detail|
        {
          start: detail["StartMs"].to_i / 1000.0,
          end: detail["EndMs"].to_i / 1000.0,
          text: detail["FinalSentence"],
          time_str: format_timestamp(detail["StartMs"].to_i / 1000.0)
        }
      end
      [ :success, { "segments": result, "language": "en" } ]
    when 3
      Rails.logger.info("Task #{task_id} is failed")
      [ :failed, data["ErrorMsg"] ]
    else
      [ :progressing, nil ]
    end
  end

  def format_timestamp(seconds)
    hours = (seconds / 3600).to_i
    minutes = ((seconds % 3600) / 60).to_i
    secs = (seconds % 60).to_i
    sprintf("%02d:%02d:%02d", hours, minutes, secs)
  end

  # 发起语音识别请求
  # @param video_url [String] 视频或音频文件的URL
  # @param engine_type [String] 识别引擎类型，默认为 "16k_en"
  # @param channel_num [Integer] 声道数，默认为 1
  # @param res_text_format [Integer] 返回文本格式，默认为 3
  # @return [Hash] API响应结果
  # {{"Response" => {"RequestId" => "xx", "Data" => {"TaskId" => 13764974301}}}}
  def request_transcription(video_url, engine_type: "16k_en", channel_num: 1, res_text_format: 3)
    service = "asr"
    host = "asr.tencentcloudapi.com"
    endpoint = "https://" + host
    region = ""
    action = "CreateRecTask"
    version = "2019-06-14"

    timestamp = Time.now.to_i
    date = Time.at(timestamp).utc.strftime("%Y-%m-%d")

    # 构建请求参数
    payload = {
      "Url" => video_url,
      "EngineModelType" => engine_type,
      "ChannelNum" => channel_num,
      "ResTextFormat" => res_text_format,
      "SourceType" => 0
    }.to_json

    # 计算签名
    signature_result = calculate_signature(
      service: service,
      host: host,
      action: action,
      version: version,
      region: region,
      timestamp: timestamp,
      payload: payload
    )

    # 发起请求
    url = URI.parse(endpoint)
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new("/")
    request.body = payload
    request["Authorization"] = signature_result[:authorization]
    request["Content-Type"] = "application/json; charset=utf-8"
    request["Host"] = host
    request["X-TC-Action"] = action
    request["X-TC-Timestamp"] = timestamp
    request["X-TC-Version"] = version
    request["X-TC-Region"] = region
    request["X-TC-Token"] = @token if @token.present?

    response = http.request(request)
    JSON.parse(response.body)
  end

  # 查询语音识别任务状态
  # @param task_id [Integer] 任务ID
  # @return [Hash] 查询结果
  def query_task_status(task_id)
    service = "asr"
    host = "asr.tencentcloudapi.com"
    endpoint = "https://" + host
    region = ""
    action = "DescribeTaskStatus"
    version = "2019-06-14"

    timestamp = Time.now.to_i
    date = Time.at(timestamp).utc.strftime("%Y-%m-%d")

    # 构建请求参数
    payload = { "TaskId" => task_id }.to_json

    # 计算签名
    signature_result = calculate_signature(
      service: service,
      host: host,
      action: action,
      version: version,
      region: region,
      timestamp: timestamp,
      payload: payload
    )

    # 发起请求
    url = URI.parse(endpoint)
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new("/")
    request.body = payload
    request["Authorization"] = signature_result[:authorization]
    request["Content-Type"] = "application/json; charset=utf-8"
    request["Host"] = host
    request["X-TC-Action"] = action
    request["X-TC-Timestamp"] = timestamp
    request["X-TC-Version"] = version
    request["X-TC-Region"] = region
    request["X-TC-Token"] = @token if @token.present?

    response = http.request(request)
    JSON.parse(response.body)
  rescue => e
    { "Error" => { "Code" => "RequestFailed", "Message" => e.message } }
  end

  private

  # 计算腾讯云TC3-HMAC-SHA256签名
  def calculate_signature(service:, host:, action:, version:, region:, timestamp:, payload:)
    algorithm = "TC3-HMAC-SHA256"
    date = Time.at(timestamp).utc.strftime("%Y-%m-%d")

    # ************* 步骤 1：拼接规范请求串 *************
    http_request_method = "POST"
    canonical_uri = "/"
    canonical_querystring = ""
    canonical_headers = "content-type:application/json; charset=utf-8\nhost:#{host}\nx-tc-action:#{action.downcase}\n"
    signed_headers = "content-type;host;x-tc-action"
    hashed_request_payload = Digest::SHA256.hexdigest(payload)
    canonical_request = [
      http_request_method,
      canonical_uri,
      canonical_querystring,
      canonical_headers,
      signed_headers,
      hashed_request_payload
    ].join("\n")

    # ************* 步骤 2：拼接待签名字符串 *************
    credential_scope = date + "/" + service + "/" + "tc3_request"
    hashed_request_payload = Digest::SHA256.hexdigest(canonical_request)
    string_to_sign = [
      algorithm,
      timestamp.to_s,
      credential_scope,
      hashed_request_payload
    ].join("\n")

    # ************* 步骤 3：计算签名 *************
    digest = OpenSSL::Digest.new("sha256")
    secret_date = OpenSSL::HMAC.digest(digest, "TC3" + @secret_key, date)
    secret_service = OpenSSL::HMAC.digest(digest, secret_date, service)
    secret_signing = OpenSSL::HMAC.digest(digest, secret_service, "tc3_request")
    signature = OpenSSL::HMAC.hexdigest(digest, secret_signing, string_to_sign)

    # ************* 步骤 4：拼接 Authorization *************
    authorization = "#{algorithm} Credential=#{@secret_id}/#{credential_scope}, SignedHeaders=#{signed_headers}, Signature=#{signature}"

    {
      authorization: authorization,
      timestamp: timestamp,
      version: version,
      region: region
    }
  end
end
