class AddOriVideoUrlToVideo < ActiveRecord::Migration[8.0]
  def change
    add_column :videos, :ori_video_url, :string, comment: '小红书视频地址'
  end
end
