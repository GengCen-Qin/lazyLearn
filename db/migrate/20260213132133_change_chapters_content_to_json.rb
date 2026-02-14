class ChangeChaptersContentToJson < ActiveRecord::Migration[8.0]
  def up
    if connection.adapter_name == 'PostgreSQL'
      change_column :chapters, :content, :json, using: 'content::json'
    else
      # SQLite 和其他数据库的处理
      change_column :chapters, :content, :json
    end
  end

  def down
    if connection.adapter_name == 'PostgreSQL'
      change_column :chapters, :content, :text
    else
      change_column :chapters, :content, :text
    end
  end
end
