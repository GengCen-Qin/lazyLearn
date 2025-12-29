class CreateEmailVerifications < ActiveRecord::Migration[8.0]
  def change
    create_table :email_verifications do |t|
      t.string :email, null: false
      t.string :code_digest, null: false
      t.datetime :expires_at, null: false
      t.boolean :used, default: false, null: false
      t.integer :attempts_count, default: 0, null: false
      t.string :ip_address

      t.timestamps
    end

    add_index :email_verifications, :email
    add_index :email_verifications, :expires_at
    add_index :email_verifications, :created_at
  end
end
