class CreateUserAudios < ActiveRecord::Migration[8.0]
  def change
    create_table :user_audios do |t|
      t.references :user, null: false, foreign_key: true
      t.references :audio, null: false, foreign_key: true

      t.timestamps
    end

    add_index :user_audios, [:user_id, :audio_id], unique: true
  end
end
