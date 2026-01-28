class CreateAudios < ActiveRecord::Migration[8.0]
  def change
    create_table :audios do |t|
      t.string :title
      t.text :description
      t.json :transcription_segments, default: []
      t.string :transcription_language, default: "zh"
      t.datetime :transcription_time
      t.integer :transcription_status, default: 0, null: false
      t.string :remote_url
      t.text :subtitle_content
      t.boolean :free, default: false, null: false

      t.timestamps
    end

    add_index :audios, :transcription_status
    add_index :audios, :transcription_language
    add_index :audios, :free
    add_index :audios, :remote_url, unique: true
  end
end
