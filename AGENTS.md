

# AGENTS.md — 博客仓库 AI 规范

> 本文件是 当前博客仓库的 **AI 协作唯一权威规范**，供所有 AI 编码工具（Codex、Claude Code、Cursor、Copilot、Trae 等）与开发者共同遵守。`CLAUDE.md` 是兼容入口，冲突以本文件为准。

---

## Git提交规范

### 格式

使用 Conventional Commits：

```
<type>(<scope>): <description>
```

| Type       | 说明            |
| ---------- | --------------- |
| `feat`     | 新功能          |
| `fix`      | Bug 修复        |
| `refactor` | 重构            |
| `perf`     | 性能优化        |
| `style`    | CSS/样式修改    |
| `docs`     | 文档更新        |
| `chore`    | 构建/依赖等杂项 |
| `content`  | 内容维护        |
| `release`  | 发版提交        |

> type 的完整白名单以 `ci/check-commit-msg.js` 为准（CI 强制执行）。

- 一次提交对应一个需求点；逻辑相似的需求可以合并为一次提交
- 合并代码时，把合并提交 / PR 标题改为 Conventional Commits 格式（`<type>(<scope>): <description>`，类型见上表），不保留默认的 `Merge branch ...` / `Merge pull request ...` 标题。CI 对合并提交同样不豁免
  - 避免产生：本地执行一次 `git config pull.rebase true`，之后 `git pull` 走 rebase 不再生成合并提交
  - 已经产生了：**push 之前**用 `git commit --amend -m "chore(git): 合并远端改动"` 改写标题即可，只换 message 不动 parent，无需 force push
- 每个需求完成后不自动提交，改动保留在工作区供用户审查
- 只有用户明确要求时才 push
- 提交信息中禁止任何 AI 署名水印：不写 `Co-Authored-By: Claude ...`，不加 🤖 生成标记
