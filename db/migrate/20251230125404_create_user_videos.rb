class CreateUserVideos < ActiveRecord::Migration[8.0]
  def change
    create_table :user_videos do |t|
      t.references :user, null: false, foreign_key: true
      t.references :video, null: false, foreign_key: true

      t.timestamps
    end
  end
end
