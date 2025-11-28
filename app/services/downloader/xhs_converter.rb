class Downloader::XhsConverter
  INITIAL_STATE_XPATH = '//script/text()'
  KEYS_LINK = ['note', 'noteDetailMap', '[-1]', 'note'].freeze

  def run(content)
    filter_object(convert_object(extract_object(content)))
  end

  def extract_object(html)
    return '' if html.nil? || html.empty?

    doc = Nokogiri::HTML(html)
    scripts = doc.xpath(INITIAL_STATE_XPATH)
    get_script(scripts)
  end

  def convert_object(text)
    return {} unless text && !text.empty?

    # Remove the window.__INITIAL_STATE__= prefix
    json_str = text.sub(/^window\.__INITIAL_STATE__\s*=\s*/, '').strip

    begin
      # Try YAML first (like Python's yaml.safe_load)
      Psych.safe_load(json_str)
    rescue Psych::SyntaxError, Psych::DisallowedClass
      # Fallback to JSON parsing
      begin
        # Clean up JavaScript syntax that's not valid JSON
        cleaned_str = normalize_js_object(json_str)
        JSON.parse(cleaned_str)
      rescue JSON::ParserError
        {}
      end
    end
  end

  def filter_object(data)
    deep_get(data, KEYS_LINK) || {}
  end

  def deep_get(data, keys, default = nil)
    return default unless data.is_a?(Hash)

    begin
      keys.reduce(data) do |obj, key|
        if key.start_with?('[') && key.end_with?(']')
          # Handle array indexing like Python's [-1]
          index = key[1..-2].to_i
          safe_get(obj, index)
        else
          obj[key]
        end
      end
    rescue KeyError, IndexError, TypeError
      default
    end
  end

  def safe_get(data, index)
    case data
    when Hash
      # Get values array and access by index
      values = data.values
      values[index] if index < values.length
    when Array, Enumerable
      data[index]
    else
      raise TypeError, "Expected Hash, Array or Enumerable, got #{data.class}"
    end
  end

  def get_script(scripts)
    # Process scripts in reverse, like Python implementation
    scripts.reverse_each do |script|
      content = script.to_s.strip
      return content if content.start_with?('window.__INITIAL_STATE__')
    end
    ''
  end

  private

  # Normalize JavaScript object syntax to valid JSON
  def normalize_js_object(js_str)
    # Remove trailing commas before closing braces/brackets
    result = js_str.gsub(/,\s*([}\]])/m, '\1')

    # Handle single/double quoted strings that might not be valid in JSON
    # This is a simplified approach - more complex parsing may be needed for production
    result
  end
end