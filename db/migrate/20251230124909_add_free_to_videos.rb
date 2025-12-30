class AddFreeToVideos < ActiveRecord::Migration[8.0]
  def change
    add_column :videos, :free, :boolean, default: false, null: false
    add_index :videos, :free
  end
end
