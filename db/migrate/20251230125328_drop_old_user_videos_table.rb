class DropOldUserVideosTable < ActiveRecord::Migration[8.0]
  def change
    drop_table :user_videos, if_exists: true
  end
end
