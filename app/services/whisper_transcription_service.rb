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

  def trans_audio(audio_path, language: nil)
    Rails.logger.info "开始转录音频: #{File.basename(audio_path)}"

    # 执行转录并直接返回结果
    result = execute_whisper_cli(audio_path, language)

    Rails.logger.info "音频转录完成 #{File.basename(audio_path)}"
    result
  end

  def trans_audio_with_whisper_cpp(audio_path, language: nil)
    Rails.logger.info "开始使用 whisper.cpp 转录音频: #{File.basename(audio_path)}"

    # 转换音频格式（m4a -> wav）
    wav_path = convert_audio_to_wav(audio_path)

    begin
      # 执行 whisper-cli 转录
      result = execute_whisper_cpp_cli(wav_path, language)

      Rails.logger.info "音频转录完成 #{File.basename(audio_path)}"
      result
    ensure
      # 清理临时 wav 文件
      File.delete(wav_path) if File.exist?(wav_path)
    end
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

  def convert_audio_to_wav(audio_path)
    output_dir = File.join(@temp_dir, "conversion_#{Time.now.to_i}")
    FileUtils.mkdir_p(output_dir)

    wav_path = File.join(output_dir, "#{File.basename(audio_path, '.*')}.wav")

    # 使用 ffmpeg 转换音频格式
    cmd = [
      "ffmpeg",
      "-i", audio_path,
      "-ar", "16000",
      "-ac", "1",
      "-c:a", "pcm_s16le",
      "-y",  # 覆盖已存在的文件
      wav_path
    ]

    Rails.logger.info "转换音频格式: #{cmd.join(' ')}"
    stdout, stderr, status = Open3.capture3(cmd.join(" "))

    unless status.success?
      FileUtils.rm_rf(output_dir)
      raise StandardError, "音频格式转换失败: #{stderr}"
    end

    unless File.exist?(wav_path)
      FileUtils.rm_rf(output_dir)
      raise StandardError, "转换后的音频文件不存在: #{wav_path}"
    end

    wav_path
  end

  def execute_whisper_cpp_cli(wav_path, language)
    output_dir = File.join(@temp_dir, "whisper_cpp_#{Time.now.to_i}")
    FileUtils.mkdir_p(output_dir)

    cmd = build_whisper_cpp_command(wav_path, language, output_dir)

    Rails.logger.info "执行 whisper-cli 命令: #{cmd}"
    stdout, stderr, status = Open3.capture3(cmd)

    unless status.success?
      FileUtils.rm_rf(output_dir)
      raise StandardError, "Whisper.cpp CLI 执行失败: #{stderr}"
    end

    # 解析 JSON 输出
    json_file = File.join(output_dir, "#{File.basename(wav_path)}.json")
    unless File.exist?(json_file)
      FileUtils.rm_rf(output_dir)
      raise StandardError, "未找到 Whisper.cpp 输出文件: #{json_file}"
    end

    result = JSON.parse(File.read(json_file))

    # 清理临时文件
    FileUtils.rm_rf(output_dir)

    # 标准化输出格式
    normalize_whisper_cpp_output(result)
  ensure
    FileUtils.rm_rf(output_dir) if output_dir && Dir.exist?(output_dir)
  end

  def build_whisper_cpp_command(wav_path, language, output_dir)
    cmd = [
      "/Users/qinsicheng/PythonProjects/whisper.cpp/build/bin/whisper-cli",
      "-m", "/Users/qinsicheng/PythonProjects/whisper.cpp/models/ggml-base.en.bin",
      "-f", wav_path,
      "-oj",  # 输出 JSON 格式
      "-l", language || "auto",  # 语言设置
      "-np",  # 不打印额外信息
      "-of", File.join(output_dir, File.basename(wav_path))  # 输出文件路径
    ]

    # 性能优化
    cpu_cores = Etc.nprocessors rescue 4
    cmd += [ "-t", [ cpu_cores, 8 ].min.to_s ]

    cmd.join(" ")
  end

  def normalize_whisper_cpp_output(whisper_cpp_result)
    transcription = whisper_cpp_result["transcription"] || []

    segments = transcription.map do |seg|
      # 解析时间戳 (格式: "00:00:00,000" -> 秒数)
      start_time = parse_timestamp(seg["timestamps"]["from"])
      end_time = parse_timestamp(seg["timestamps"]["to"])

      {
        "start" => start_time.round(2),
        "end" => end_time.round(2),
        "text" => seg["text"].strip,
        "time_str" => format_timestamp(start_time)
      }
    end

    {
      "segments" => segments,
      "language" => whisper_cpp_result.dig("result", "language") || "unknown"
    }
  end

  def parse_timestamp(time_str)
    # 解析时间戳格式 "HH:MM:SS,mmm" 为秒数
    parts = time_str.split(/[:,]/)
    hours = parts[0].to_i
    minutes = parts[1].to_i
    seconds = parts[2].to_i
    milliseconds = parts[3].to_i

    hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0
  end
end
