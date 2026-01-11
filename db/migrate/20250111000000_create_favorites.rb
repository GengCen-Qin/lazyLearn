class CreateFavorites < ActiveRecord::Migration[8.0]
  def change
    create_table :favorites do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.integer :word_id, null: false, index: true
      t.timestamps

      t.index [:user_id, :word_id], unique: true
    end
  end
end