class AddDownloadLinkToVideos < ActiveRecord::Migration[8.0]
  def change
    add_column :videos, :download_link, :string
    add_index :videos, :download_link, unique: true
  end
end
