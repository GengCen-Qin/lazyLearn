class CreateAudioLearningMaterials < ActiveRecord::Migration[8.0]
  def change
    create_table :audio_learning_materials do |t|
      t.integer :audio_id, null: false, index: { unique: true }
      t.json :core_dialogue, default: {}
      t.json :key_expressions, default: []
      t.json :practice_segments, default: []
      t.integer :status, default: 0, null: false, index: true
      t.text :error_message

      t.timestamps
    end

    add_foreign_key :audio_learning_materials, :audios, on_delete: :cascade
  end
end
