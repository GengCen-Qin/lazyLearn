class AudioLearningAnalysisJob < ApplicationJob
  queue_as :default

  def perform(audio_id)
    audio = Audio.find_by(id: audio_id)
    return unless audio&.transcription_completed?

    # 创建或获取学习材料记录
    material = AudioLearningMaterial.find_or_create_by(audio_id: audio.id) do |m|
      m.status = :processing
    end

    # 如果已经是完成状态，跳过
    return if material.completed?

    # 执行分析
    analyzer = AudioLearningAnalyzer.new(audio)
    result = analyzer.analyze

    # 处理错误情况
    if result["error"].present?
      material.update!(
        status: :failed,
        error_message: result["error"],
        updated_at: Time.current
      )
      return
    end

    # 保存结果
    material.update!(
      core_dialogue: result["core_dialogue"] || {},
      key_expressions: result["key_expressions"] || [],
      practice_segments: result["practice_segments"] || [],
      status: :completed,
      updated_at: Time.current
    )

    Rails.logger.info "音频学习材料分析完成 audio_id=#{audio_id}"
  rescue => e
    material&.update!(
      status: :failed,
      error_message: e.message,
      updated_at: Time.current
    )
    Rails.logger.error "音频学习材料分析失败 audio_id=#{audio_id}: #{e.message}"
    raise e
  end
end
