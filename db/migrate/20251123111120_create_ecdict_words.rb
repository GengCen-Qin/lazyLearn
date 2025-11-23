class CreateEcdictWords < ActiveRecord::Migration[8.0]
  def change
    create_table :ecdict_words, id: false do |t|
      t.integer  :id,          primary_key: true, null: false
      t.string   :word,        null: false, limit: 64
      t.string   :sw,          null: false, limit: 64
      t.string   :phonetic,    limit: 64
      t.text     :definition
      t.text     :translation
      t.string   :pos,         limit: 16
      t.integer  :collins,     default: 0
      t.integer  :oxford,      default: 0
      t.string   :tag,         limit: 64
      t.integer  :bnc
      t.integer  :frq
      t.text     :exchange
      t.text     :detail
      t.text     :audio
    end

    add_index :ecdict_words, :word, unique: true, name: 'index_ecdict_words_on_word'
    add_index :ecdict_words, "lower(word)", name: 'index_ecdict_words_on_lower_word'
    add_index :ecdict_words, :oxford
    add_index :ecdict_words, :collins
  end

  def down
    drop_table :ecdict_words
  end
end
