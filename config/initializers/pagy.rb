# Pagy 分页配置
# 文档: https://github.com/ddnexus/pagy

# 默认每页显示数量
Pagy.options[:limit] = 10

# 客户端可以请求的最大每页数量
Pagy.options[:client_max_limit] = 100

# 最大页数限制
Pagy.options[:max_pages] = 500

# 分页参数名
Pagy.options[:page_key] = 'page'
Pagy.options[:limit_key] = 'limit'

# 分页系列大小 [左, 中左, 中右, 右]
# 这会控制在分页导航中显示的页码数量
Pagy.options[:size] = [1, 4, 4, 1]

# 间隙标签(当页码太多时显示的省略号)
Pagy.options[:gap] = '...'
