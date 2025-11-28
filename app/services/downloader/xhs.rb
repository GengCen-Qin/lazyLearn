class Downloader::Xhs
  def parse(url)
    Downloader::XhsUrlParser.new.parse_url(url)
  end
end