json.extract! upload, :id, :file, :info, :created_at, :updated_at
json.url upload_url(upload, format: :json)
json.file url_for(upload.file)
