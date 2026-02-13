class ChangeChaptersContentToJson < ActiveRecord::Migration[8.0]
  def change
    change_column :chapters, :content, :json
  end
end
