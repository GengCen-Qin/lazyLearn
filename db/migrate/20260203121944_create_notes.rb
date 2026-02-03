class CreateNotes < ActiveRecord::Migration[8.0]
  def change
    create_table :notes do |t|
      t.text :content
      t.text :question
      t.text :note
      t.datetime :last_review_time
      t.references :user, null: false, foreign_key: { on_delete: :cascade }

      t.timestamps
    end

    add_index :notes, :created_at
    add_index :notes, :last_review_time
  end
end
