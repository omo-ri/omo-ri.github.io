# 棉花NYX 的blog

基于 [Hexo](https://hexo.io/) + [Stellar](https://github.com/xaoxuu/hexo-theme-stellar) 主题搭建的个人博客。

- 站点地址：<https://blog.mianhua.ru>
- 语言 / 时区：zh-CN / Europe/Moscow

## 版本信息

### 运行环境

| 项目 | 当前版本 | Stellar 要求 |
| --- | --- | --- |
| Node.js | v24.19.0 | 22 及以上（推荐 LTS） |
| npm | 11.17.0 | 10 及以上 |
| CI 环境 Node.js | 24（GitHub Actions `actions/setup-node@v4`） | — |

### 框架与主题

| 项目 | 当前版本 | Stellar 要求 |
| --- | --- | --- |
| Hexo | 8.1.2 | 6.3.0 及以上 |
| hexo-cli | 4.3.2 | 4.3.0 及以上 |
| 当前主题 | Stellar 1.38.0 | — |


## 常用命令

```bash
hexo server                 # 本地预览 http://localhost:4000
hexo generate               # 生成静态文件到 public/
hexo clean                  # 清除缓存 db.json 和 public/
```

写文章：

```bash
hexo new "文章标题"          # 新建文章 → source/_posts/
hexo new draft "标题"        # 新建草稿 → source/_drafts/
hexo publish "标题"          # 草稿转正 → source/_posts/
hexo server --draft         # 预览草稿（草稿默认不渲染）
```

改完 `_config.stellar.yml` 后页面没变化，一般是缓存问题，先 `hexo clean` 再 `hexo generate`。

