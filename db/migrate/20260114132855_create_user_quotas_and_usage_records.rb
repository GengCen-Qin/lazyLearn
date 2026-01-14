class CreateUserQuotasAndUsageRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :user_quotas do |t|
      t.integer :user_id, null: false
      t.string :quota_type, null: false
      t.integer :total_limit, null: false
      t.datetime :expires_at
      t.timestamps
    end

    add_index :user_quotas, :user_id
    add_index :user_quotas, :quota_type
    add_index :user_quotas, [:user_id, :quota_type]

    create_table :usage_records do |t|
      t.integer :user_id, null: false
      t.integer :quota_id, null: false
      t.string :status, null: false
      t.text :notes
      t.datetime :used_at, null: false
      t.string :ip_address
      t.text :user_agent
      t.timestamps
    end

    add_index :usage_records, :user_id
    add_index :usage_records, :quota_id
    add_index :usage_records, :status
    add_index :usage_records, :used_at
  end
end
