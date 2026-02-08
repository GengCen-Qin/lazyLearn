class CreateBookContents < ActiveRecord::Migration[8.0]
  def change
    create_table :book_contents, comment: '电子书内容表，按行存储' do |t|
      t.text :content, null: false, comment: '该行文本内容'
      t.integer :line_number, null: false, comment: '行号'
      t.references :book, null: false, foreign_key: true, comment: '书籍ID'
      t.timestamps
    end

    add_index :book_contents, [:book_id, :line_number], unique: true unless index_exists?(:book_contents, [:book_id, :line_number])
  end
end
