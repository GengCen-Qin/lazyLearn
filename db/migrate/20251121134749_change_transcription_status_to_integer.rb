class ChangeTranscriptionStatusToInteger < ActiveRecord::Migration[8.0]
  def change
    change_column :videos, :transcription_status, :integer, default: 0, null: false
  end
end
