# frozen_string_literal: true

class AlterBooksForEpub < ActiveRecord::Migration[8.0]
  def change
    # 修改books表
    remove_column :books, :total_lines, :integer
    remove_column :books, :encoding, :string

    add_column :books, :author, :string
    add_column :books, :language, :string
    add_column :books, :publisher, :string

    # 删除book_contents表
    drop_table :book_contents, if_exists: true

    # 创建chapters表
    create_table :chapters do |t|
      t.references :book, null: false, foreign_key: true
      t.string :title, null: false
      t.text :content
      t.integer :order_index, null: false

      t.timestamps
    end

    add_index :chapters, [:book_id, :order_index]
  end
end
