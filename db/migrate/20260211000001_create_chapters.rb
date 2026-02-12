# frozen_string_literal: true

class CreateChapters < ActiveRecord::Migration[8.0]
  def change
    create_table :chapters, comment: '书籍章节表' do |t|
      t.references :book, null: false, foreign_key: true, comment: '书籍ID'
      t.string :title, null: false, comment: '章节标题'
      t.text :content, comment: '章节内容'
      t.integer :order_index, null: false, comment: '章节顺序'
      t.timestamps
    end

    add_index :chapters, [:book_id, :order_index] unless index_exists?(:chapters, [:book_id, :order_index])
  end
end
