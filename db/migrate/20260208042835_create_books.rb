class CreateBooks < ActiveRecord::Migration[8.0]
  def change
    create_table :books, comment: '电子书书籍表' do |t|
      t.string :title, null: false, comment: '书籍标题'
      t.integer :total_lines, null: false, comment: '文件总行数'
      t.string :encoding, default: 'utf-8', comment: '文件编码'
      t.references :user, null: false, foreign_key: true, comment: '用户ID'
      t.timestamps
    end

    add_index :books, :user_id unless index_exists?(:books, :user_id)
  end
end
