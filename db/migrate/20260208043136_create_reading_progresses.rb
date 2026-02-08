class CreateReadingProgresses < ActiveRecord::Migration[8.0]
  def change
    create_table :reading_progresses, comment: '用户阅读进度表' do |t|
      t.references :user, null: false, foreign_key: true, comment: '用户ID'
      t.references :book, null: false, foreign_key: true, comment: '书籍ID'
      t.integer :start_line, null: false, comment: '当前阅读起始行'
      t.integer :end_line, null: false, comment: '当前阅读结束行'
      t.timestamps
    end

    add_index :reading_progresses, [:user_id, :book_id], unique: true unless index_exists?(:reading_progresses, [:user_id, :book_id])
  end
end
