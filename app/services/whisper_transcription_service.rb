class WhisperTranscriptionService
  def initialize(model = "base")
    @model = model
    @temp_dir = File.join(Dir.pwd, "temp_whisper")
    @validate_whisper_installation
    setup_temp_directory
  end

  def trans_video(video_path, language: nil)
    Rails.logger.info "开始转录视频: #{File.basename(video_path)}"

    # 执行转录并直接返回结果
    result = execute_whisper_cli(video_path, language)

    Rails.logger.info "转录完成 #{File.basename(video_path)}"
    result
  end

  def health_check
    stdout, stderr, status = Open3.capture3("whisper --help")
    {
      status: status.success? ? "healthy" : "unhealthy",
      whisper_available: status.success?,
      model: @model
    }
  end

  private

  def execute_whisper_cli(video_path, language)
    output_dir = File.join(@temp_dir, "temp_#{Time.now.to_i}")
    FileUtils.mkdir_p(output_dir)

    cmd = build_whisper_command(video_path, language, output_dir)

    Rails.logger.info "执行命令: #{cmd}"
    stdout, stderr, status = Open3.capture3(cmd)

    unless status.success?
      raise StandardError, "Whisper CLI 执行失败: #{stderr}"
    end

    # 解析JSON输出
    json_file = Dir.glob("#{output_dir}/*.json").first
    unless json_file
      raise StandardError, "未找到Whisper输出文件"
    end

    result = JSON.parse(File.read(json_file))

    # 清理临时文件
    FileUtils.rm_rf(output_dir)

    # 标准化输出格式
    normalize_output(result)
  ensure
    FileUtils.rm_rf(output_dir) if output_dir && Dir.exist?(output_dir)
  end

  def build_whisper_command(video_path, language, output_dir)
    cmd = [
      "whisper",
      video_path,
      "--model", @model,
      "--output_format", "json",
      "--output_dir", output_dir,
      "--word_timestamps", "True",
      "--verbose", "False"
    ]

    cmd.concat([ "--language", language ]) if language.present?

    # 性能优化
    cpu_cores = Etc.nprocessors rescue 4
    cmd += [ "--threads", [ cpu_cores, 8 ].min.to_s ]

    cmd.join(" ")
  end

  def normalize_output(whisper_result)
    segments = (whisper_result["segments"] || []).map do |seg|
      {
        "start" => seg["start"].round(2),
        "end" => seg["end"].round(2),
        "text" => seg["text"].strip,
        "time_str" => format_timestamp(seg["start"])
      }
    end

    {
      "segments" => segments,
      "language" => whisper_result["language"] || "unknown"
    }
  end

  def format_timestamp(seconds)
    hours = (seconds / 3600).to_i
    minutes = ((seconds % 3600) / 60).to_i
    secs = (seconds % 60).to_i
    sprintf("%02d:%02d:%02d", hours, minutes, secs)
  end

  def setup_temp_directory
    FileUtils.mkdir_p(@temp_dir) unless Dir.exist?(@temp_dir)
  end

  def validate_whisper_installation
    stdout, stderr, status = Open3.capture3("which whisper")
    unless status.success?
      raise StandardError, "Whisper CLI未安装。请安装: pip install openai-whisper"
    end
  end
end
