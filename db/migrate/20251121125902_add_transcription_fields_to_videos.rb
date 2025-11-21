class AddTranscriptionFieldsToVideos < ActiveRecord::Migration[8.0]
  def change
    add_column :videos, :transcription_segments, :json, default: []
    add_column :videos, :transcription_language, :string, default: 'zh'
    add_column :videos, :transcription_time, :datetime
    add_column :videos, :transcription_status, :string, default: 'pending'

    # 添加索引以提高查询性能
    add_index :videos, :transcription_status
    add_index :videos, :transcription_language
  end
end
