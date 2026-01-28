class Downloader::BilibiliAudioFetcher
  def initialize
    @ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
  end

  def fetch_audio(url)
    puts "Fetching audio for: #{url}"

    # Determine video type and extract IDs
    case url
    when %r{https?://(www\.)?bilibili\.com/video/((av(\d+))|(bv(\S+))|(BV(\S+)))}
      # Regular video
      fetch_regular_video_audio(url)
    when %r{https?://(www\.)?bilibili\.com/bangumi/play/ep(\d+)}
      # Bangumi episode
      fetch_bangumi_audio(url)
    else
      puts "Unsupported URL format"
      nil
    end
  rescue => e
    puts "Error fetching audio: #{e.message}"
    puts "Backtrace: #{e.backtrace.first(5).join("\n")}"
    nil
  end

  # Public method to download audio
  def download_audio(audio_url, filename)
    puts "Downloading audio from: #{audio_url}"
    puts "Saving to: #{filename}"

    uri = URI(audio_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true if uri.scheme == 'https'

    request = Net::HTTP::Get.new(uri.request_uri)
    request['User-Agent'] = @ua
    request['Referer'] = 'https://www.bilibili.com/'

    File.open(filename, 'wb') do |file|
      http.request(request) do |response|
        response.read_body do |chunk|
          file.write(chunk)
        end
      end
    end

    puts "Download completed: #{filename}"
  end

  private

  def fetch_regular_video_audio(url)
    # Get the webpage content, handling redirects
    html_content, final_url = fetch_with_redirects(url)

    if !html_content
      puts "Failed to fetch content from #{url}"
      return nil
    end

    puts "Final URL after redirects: #{final_url}"
    puts "Content length: #{html_content.length}"

    # Check if we got a valid response
    if html_content.length < 100
      puts "Content too short, might be an error page"
      return nil
    end

    # Look for initial state in the HTML
    initial_state_match = html_content.match(/__INITIAL_STATE__=(.*?);\(function\(\)/)
    unless initial_state_match
      # Try alternative pattern for initial state
      initial_state_match = html_content.match(/window\.__INITIAL_STATE__\s*=\s*(.*?);\s*\(function/)
      unless initial_state_match
        # Try another pattern
        initial_state_match = html_content.match(/__INITIAL_STATE__\s*=\s*(\{.*?\});\s*var|const|let/)
        unless initial_state_match
          # Try a more flexible pattern
          initial_state_match = html_content.match(/__INITIAL_STATE__\s*=\s*(\{(?:[^{}]|{[^{}]*})*\})\s*;/)
          unless initial_state_match
            puts "Could not find __INITIAL_STATE__ in page content"
            puts "Looking for keywords in HTML..."
            puts "Has __INITIAL_STATE__: #{html_content.include?('__INITIAL_STATE__')}"
            puts "Has __playinfo__: #{html_content.include?('__playinfo__')}"

            # Try to find the video ID from the URL
            bv_match = final_url.match(/\/(BV\w+)/)
            av_match = final_url.match(/\/(av\d+)/)

            if bv_match
              video_id = bv_match[1]
              puts "Detected BV ID: #{video_id}"
            elsif av_match
              video_id = av_match[1]
              puts "Detected AV ID: #{video_id}"
            else
              puts "Could not extract video ID from URL"
              return nil
            end

            # Try to get the page content differently
            return fetch_video_info_directly(video_id)
          end
        end
      end
    end

    initial_state_json = initial_state_match[1]
    puts "Initial state JSON length: #{initial_state_json.length}"

    # Parse the JSON
    begin
      initial_state = JSON.parse(initial_state_json)
    rescue JSON::ParserError => e
      puts "JSON parsing error: #{e.message}"
      puts "JSON content preview: #{initial_state_json[0..200]}..."
      return nil
    end

    # Extract playinfo from JavaScript
    playinfo_match = html_content.match(/__playinfo__=(.*?)<\/script>/)
    playinfo = nil
    if playinfo_match
      playinfo_str = playinfo_match[1].gsub(/;$/, '') # Remove trailing semicolon
      begin
        playinfo = JSON.parse(playinfo_str)
      rescue JSON::ParserError
        # If direct parsing fails, try to handle the raw string
        playinfo_str = playinfo_str.gsub(/\n/, '').gsub(/\r/, '')
        begin
          playinfo = JSON.parse(playinfo_str)
        rescue JSON::ParserError
          puts "Could not parse __playinfo__"
        end
      end
    end

    # Get video ID and CID
    if initial_state.key?('videoData')
      video_data = initial_state['videoData']
      avid = initial_state['aid']

      # Determine which part of the video to get
      p_number = extract_p_number(final_url) || 1
      cid = video_data['pages'][p_number - 1]['cid']

      title = video_data['title']
      # Refine title for specific part if multi-part video
      if video_data['videos'] > 1
        part_title = video_data['pages'][p_number - 1]['part']
        title = "#{title} (P#{p_number}. #{part_title})"
      end

      puts "Video ID: #{avid}, CID: #{cid}, Title: #{title}"

      # Get audio streams
      audio_streams = get_audio_streams(avid, cid, playinfo)

      {
        title: title,
        audio_streams: audio_streams
      }
    elsif initial_state.key?('error')
      puts "Page reported an error: #{initial_state['error']}"
      nil
    else
      puts "Could not extract video data from page"
      puts "Available keys in initial state: #{initial_state.keys.join(', ')}"
      nil
    end
  end

  def fetch_video_info_directly(video_id)
    puts "Attempting to fetch video info directly using API..."

    # Try to get video info using API
    api_url = "https://api.bilibili.com/x/web-interface/view?bvid=#{video_id}"
    api_content = fetch_url(api_url)

    begin
      api_response = JSON.parse(api_content)
      if api_response['code'] == 0
        video_data = api_response['data']
        avid = video_data['aid']
        cid = video_data['cid']
        title = video_data['title']

        puts "Direct API - Video ID: #{avid}, CID: #{cid}, Title: #{title}"

        # Get audio streams
        audio_streams = get_audio_streams(avid, cid)

        return {
          title: title,
          audio_streams: audio_streams
        }
      else
        puts "API returned error: #{api_response['code']} - #{api_response['message']}"
        return nil
      end
    rescue JSON::ParserError => e
      puts "Failed to parse direct API response: #{e.message}"
      return nil
    end
  end

  def extract_p_number(url)
    # Extract p parameter from URL
    match = url.match(/[?&]p=(\d+)/)
    match ? match[1].to_i : nil
  end

  def fetch_bangumi_audio(url)
    # Get the webpage content, handling redirects
    html_content, final_url = fetch_with_redirects(url)

    if !html_content
      puts "Failed to fetch content from #{url}"
      return nil
    end

    # Extract initial state from JavaScript
    initial_state_match = html_content.match(/__INITIAL_STATE__=(.*?);\(function\(\)/)
    return nil unless initial_state_match

    initial_state_json = initial_state_match[1]
    initial_state = JSON.parse(initial_state_json)

    # Get episode info
    ep_info = initial_state['epInfo']
    ep_id = ep_info['id']
    avid = ep_info['aid']
    cid = ep_info['cid']
    title = initial_state['h1Title']

    # Get audio streams for bangumi
    audio_streams = get_bangumi_audio_streams(avid, cid, ep_id)

    {
      title: title,
      audio_streams: audio_streams
    }
  end

  def get_audio_streams(avid, cid, playinfo = nil)
    audio_streams = {}

    # Try to get streams from playinfo first
    if playinfo && playinfo['code'] == 0
      process_audio_from_playinfo(playinfo, audio_streams)
    end

    # Get additional formats from API
    [120, 112, 80, 64, 32, 16].each do |qn|
      next if audio_streams.any? # Skip if we already have audio streams

      api_url = "https://api.bilibili.com/x/player/playurl?avid=#{avid}&cid=#{cid}&qn=#{qn}&type=&otype=json&fnver=0&fnval=4048&fourk=1"
      api_content = fetch_url(api_url)

      begin
        api_playinfo = JSON.parse(api_content)
        if api_playinfo['code'] == 0 # success
          process_audio_from_playinfo(api_playinfo, audio_streams)
        else
          puts "API returned error: #{api_playinfo['code']} - #{api_playinfo['message']}"
        end
      rescue JSON::ParserError
        puts "Failed to parse API response for qn=#{qn}"
        puts "Response: #{api_content[0..200]}..."
      end
    end

    audio_streams
  end

  def get_bangumi_audio_streams(avid, cid, ep_id)
    audio_streams = {}

    # Get streams from bangumi API
    api_url = "https://api.bilibili.com/pgc/player/web/playurl?avid=#{avid}&cid=#{cid}&qn=0&type=&otype=json&ep_id=#{ep_id}&fnver=0&fnval=16"
    api_content = fetch_url(api_url)

    begin
      api_playinfo = JSON.parse(api_content)
      if api_playinfo['code'] == 0 # success
        process_audio_from_playinfo(api_playinfo, audio_streams, 'result')
      else
        puts "Bangumi API returned error: #{api_playinfo['code']} - #{api_playinfo['message']}"
      end
    rescue JSON::ParserError
      puts "Failed to parse bangumi API response"
      puts "Response: #{api_content[0..200]}..."
    end

    audio_streams
  end

  def process_audio_from_playinfo(playinfo, audio_streams, result_key = 'data')
    data = playinfo.dig(result_key)

    # Process DASH streams to extract audio
    if data && data.key?('dash') && data['dash'].key?('audio')
      data['dash']['audio'].each do |audio|
        # Create a unique identifier for this audio stream
        audio_quality = audio['id']
        audio_id = "audio_#{audio_quality}"

        audio_streams[audio_id] = {
          quality: audio_quality,
          base_url: audio['baseUrl'],
          size: estimate_size(audio['baseUrl']),
          bandwidth: audio['bandwidth'],
          mime_type: audio['mimeType'],
          codecs: audio['codecs']
        }
      end
    else
      puts "No audio found in playinfo data"
      if data
        puts "Available keys in data: #{data.keys.join(', ')}"
        if data.key?('dash')
          puts "Dash keys: #{data['dash'].keys.join(', ')}" if data['dash']
        end
      end
    end
  end

  def fetch_with_redirects(url, max_redirects = 5)
    current_url = url
    redirect_count = 0

    loop do
      uri = URI(current_url)
      # Handle relative redirects
      if uri.relative?
        # If it's a relative URI, join it with the original URL
        original_uri = URI(url)
        current_url = original_uri.merge(uri).to_s
        uri = URI(current_url)
      end

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true if uri.scheme == 'https'

      request = Net::HTTP::Get.new(uri.request_uri)
      request['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      request['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      request['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8'
      request['Accept-Encoding'] = 'gzip, deflate, br'
      request['Connection'] = 'keep-alive'
      request['Upgrade-Insecure-Requests'] = '1'
      request['Sec-Fetch-Dest'] = 'document'
      request['Sec-Fetch-Mode'] = 'navigate'
      request['Sec-Fetch-Site'] = 'none'
      request['Sec-Fetch-User'] = '?1'
      request['Cache-Control'] = 'max-age=0'

      # 关键：设置正确的Referer
      if current_url.include?('bilibili.com')
        request['Referer'] = 'https://www.bilibili.com/'
      else
        request['Referer'] = url
      end

      response = http.request(request)

      case response
      when Net::HTTPSuccess
        # Handle gzip compression
        body = response.body
        if response['Content-Encoding'] == 'gzip'
          body = Zlib::GzipReader.new(StringIO.new(body)).read
        end
        return [body, current_url]
      when Net::HTTPRedirection
        redirect_count += 1
        if redirect_count > max_redirects
          puts "Too many redirects"
          return [nil, nil]
        end
        current_url = response['location']
        puts "Redirecting to: #{current_url}"
      else
        puts "HTTP Error: #{response.code} #{response.message}"
        return [nil, nil]
      end
    end
  end

  def fetch_url(url)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true if uri.scheme == 'https'

    request = Net::HTTP::Get.new(uri.request_uri)
    request['User-Agent'] = @ua
    request['Referer'] = 'https://www.bilibili.com/'

    response = http.request(request)

    # Handle gzip compression
    body = response.body
    if response['Content-Encoding'] == 'gzip'
      body = Zlib::GzipReader.new(StringIO.new(body)).read
    end

    body
  end

  def estimate_size(url)
    # Estimate size by making a HEAD request
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true if uri.scheme == 'https'

    request = Net::HTTP::Head.new(uri.request_uri)
    request['User-Agent'] = @ua

    begin
      response = http.request(request)
      size = response['Content-Length']
      size ? size.to_i : 0
    rescue
      0 # Return 0 if unable to determine size
    end
  end
end

# Main execution
if __FILE__ == $0
  if ARGV.length < 1
    puts "Usage: ruby bilibili_audio_fetcher.rb <bilibili_video_url> [output_filename]"
    puts "Example: ruby bilibili_audio_fetcher.rb https://www.bilibili.com/video/BV1G4zLBtEAn/ output.m4a"
    exit 1
  end

  url = ARGV[0]
  output_filename = ARGV[1] || 'audio.m4a' # Default filename if not provided

  fetcher = BilibiliAudioFetcher.new
  audio_info = fetcher.fetch_audio(url)

  if audio_info
    puts "\nTitle: #{audio_info[:title]}"
    puts "\nAvailable audio streams:"

    audio_info[:audio_streams].each_with_index do |(id, audio_info), index|
      puts "\nAudio #{index + 1}:"
      puts "  ID: #{id}"
      puts "  Quality: #{audio_info[:quality]}"
      puts "  MIME Type: #{audio_info[:mime_type]}"
      puts "  Codecs: #{audio_info[:codecs]}"
      puts "  Bandwidth: #{audio_info[:bandwidth]}"
      puts "  Size: #{audio_info[:size]} bytes"
      puts "  URL: #{audio_info[:base_url]}"
    end

    # Download the first audio stream (usually highest quality)
    if audio_info[:audio_streams].any?
      first_audio = audio_info[:audio_streams].first
      audio_url = first_audio[1][:base_url]
      fetcher.download_audio(audio_url, output_filename)
    else
      puts "No audio streams found."
    end
  else
    puts "Failed to fetch audio information."
  end
end
