class AddChapterIdToReadingProgresses < ActiveRecord::Migration[8.0]
  def change
    add_column :reading_progresses, :chapter_id, :integer
  end
end
