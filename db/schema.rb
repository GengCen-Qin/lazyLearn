# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_12_30_125617) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "ecdict_words", force: :cascade do |t|
    t.string "word", limit: 64, null: false
    t.string "sw", limit: 64, null: false
    t.string "phonetic", limit: 64
    t.text "definition"
    t.text "translation"
    t.string "pos", limit: 16
    t.integer "collins", default: 0
    t.integer "oxford", default: 0
    t.string "tag", limit: 64
    t.integer "bnc"
    t.integer "frq"
    t.text "exchange"
    t.text "detail"
    t.text "audio"
    t.index "lower(word)", name: "index_ecdict_words_on_lower_word"
    t.index ["collins"], name: "index_ecdict_words_on_collins"
    t.index ["oxford"], name: "index_ecdict_words_on_oxford"
    t.index ["word"], name: "index_ecdict_words_on_word", unique: true
  end

  create_table "email_verifications", force: :cascade do |t|
    t.string "email", null: false
    t.string "code_digest", null: false
    t.datetime "expires_at", null: false
    t.boolean "used", default: false, null: false
    t.integer "attempts_count", default: 0, null: false
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_email_verifications_on_created_at"
    t.index ["email"], name: "index_email_verifications_on_email"
    t.index ["expires_at"], name: "index_email_verifications_on_expires_at"
  end

  create_table "guest_users", force: :cascade do |t|
    t.string "fingerprint", null: false
    t.string "ip_address"
    t.text "user_agent"
    t.datetime "last_active_at"
    t.integer "converted_to_user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["converted_to_user_id"], name: "index_guest_users_on_converted_to_user_id"
    t.index ["fingerprint"], name: "index_guest_users_on_fingerprint", unique: true
  end

  create_table "rails_pulse_operations", force: :cascade do |t|
    t.integer "request_id", null: false
    t.integer "query_id"
    t.string "operation_type", null: false
    t.string "label", null: false
    t.decimal "duration", precision: 15, scale: 6, null: false
    t.string "codebase_location"
    t.float "start_time", default: 0.0, null: false
    t.datetime "occurred_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at", "query_id"], name: "idx_operations_for_aggregation"
    t.index ["created_at"], name: "idx_operations_created_at"
    t.index ["occurred_at", "duration", "operation_type"], name: "index_rails_pulse_operations_on_time_duration_type"
    t.index ["occurred_at"], name: "index_rails_pulse_operations_on_occurred_at"
    t.index ["operation_type"], name: "index_rails_pulse_operations_on_operation_type"
    t.index ["query_id", "duration", "occurred_at"], name: "index_rails_pulse_operations_query_performance"
    t.index ["query_id", "occurred_at"], name: "index_rails_pulse_operations_on_query_and_time"
    t.index ["query_id"], name: "index_rails_pulse_operations_on_query_id"
    t.index ["request_id"], name: "index_rails_pulse_operations_on_request_id"
  end

  create_table "rails_pulse_queries", force: :cascade do |t|
    t.string "normalized_sql", limit: 1000, null: false
    t.datetime "analyzed_at"
    t.text "explain_plan"
    t.text "issues"
    t.text "metadata"
    t.text "query_stats"
    t.text "backtrace_analysis"
    t.text "index_recommendations"
    t.text "n_plus_one_analysis"
    t.text "suggestions"
    t.text "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["normalized_sql"], name: "index_rails_pulse_queries_on_normalized_sql", unique: true
  end

  create_table "rails_pulse_requests", force: :cascade do |t|
    t.integer "route_id", null: false
    t.decimal "duration", precision: 15, scale: 6, null: false
    t.integer "status", null: false
    t.boolean "is_error", default: false, null: false
    t.string "request_uuid", null: false
    t.string "controller_action"
    t.datetime "occurred_at", null: false
    t.text "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at", "route_id"], name: "idx_requests_for_aggregation"
    t.index ["created_at"], name: "idx_requests_created_at"
    t.index ["occurred_at"], name: "index_rails_pulse_requests_on_occurred_at"
    t.index ["request_uuid"], name: "index_rails_pulse_requests_on_request_uuid", unique: true
    t.index ["route_id", "occurred_at"], name: "index_rails_pulse_requests_on_route_id_and_occurred_at"
    t.index ["route_id"], name: "index_rails_pulse_requests_on_route_id"
  end

  create_table "rails_pulse_routes", force: :cascade do |t|
    t.string "method", null: false
    t.string "path", null: false
    t.text "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["method", "path"], name: "index_rails_pulse_routes_on_method_and_path", unique: true
  end

  create_table "rails_pulse_summaries", force: :cascade do |t|
    t.datetime "period_start", null: false
    t.datetime "period_end", null: false
    t.string "period_type", null: false
    t.string "summarizable_type", null: false
    t.integer "summarizable_id", null: false
    t.integer "count", default: 0, null: false
    t.float "avg_duration"
    t.float "min_duration"
    t.float "max_duration"
    t.float "p50_duration"
    t.float "p95_duration"
    t.float "p99_duration"
    t.float "total_duration"
    t.float "stddev_duration"
    t.integer "error_count", default: 0
    t.integer "success_count", default: 0
    t.integer "status_2xx", default: 0
    t.integer "status_3xx", default: 0
    t.integer "status_4xx", default: 0
    t.integer "status_5xx", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_rails_pulse_summaries_on_created_at"
    t.index ["period_type", "period_start"], name: "index_rails_pulse_summaries_on_period"
    t.index ["summarizable_type", "summarizable_id", "period_type", "period_start"], name: "idx_pulse_summaries_unique", unique: true
    t.index ["summarizable_type", "summarizable_id"], name: "index_rails_pulse_summaries_on_summarizable"
  end

  create_table "sessions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "uploads", force: :cascade do |t|
    t.text "info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "usage_limits", force: :cascade do |t|
    t.integer "user_id"
    t.integer "guest_user_id"
    t.string "plan_type", null: false
    t.integer "total_limit", null: false
    t.integer "used_count", default: 0
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["guest_user_id"], name: "index_usage_limits_on_guest_user_id"
    t.index ["plan_type"], name: "index_usage_limits_on_plan_type"
    t.index ["user_id"], name: "index_usage_limits_on_user_id"
  end

  create_table "user_videos", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "video_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "video_id"], name: "index_user_videos_on_user_id_and_video_id", unique: true
    t.index ["user_id"], name: "index_user_videos_on_user_id"
    t.index ["video_id"], name: "index_user_videos_on_video_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  create_table "videos", force: :cascade do |t|
    t.string "title"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "transcription_segments", default: []
    t.string "transcription_language", default: "zh"
    t.datetime "transcription_time"
    t.integer "transcription_status", default: 0, null: false
    t.string "download_link"
    t.string "ori_video_url"
    t.boolean "free", default: false, null: false
    t.index ["download_link"], name: "index_videos_on_download_link", unique: true
    t.index ["free"], name: "index_videos_on_free"
    t.index ["transcription_language"], name: "index_videos_on_transcription_language"
    t.index ["transcription_status"], name: "index_videos_on_transcription_status"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "rails_pulse_operations", "rails_pulse_queries", column: "query_id"
  add_foreign_key "rails_pulse_operations", "rails_pulse_requests", column: "request_id"
  add_foreign_key "rails_pulse_requests", "rails_pulse_routes", column: "route_id"
  add_foreign_key "sessions", "users"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "usage_limits", "guest_users"
  add_foreign_key "usage_limits", "users"
  add_foreign_key "user_videos", "users"
  add_foreign_key "user_videos", "videos"
end
