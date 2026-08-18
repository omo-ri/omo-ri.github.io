---
name: commit-plan
description: 根据当前工作区改动生成提交计划（只出计划，不提交）。用户要求整理/拆分待提交改动时使用。
disable-model-invocation: true
---

# 提交计划

格式、type 表与提交门禁以 `AGENTS.md`「Git提交规范」为准，先读它。

## 边界

只出计划：不 `git add`/`commit`/`push`，不改任何文件，不输出可直接执行的命令。

## 步骤

1. `git status --porcelain -uall` 和 `git diff --stat` 收集改动
2. 读内容：新增文件只读 front-matter + 开头约 20 行；修改文件读完整 diff；二进制只看路径
3. 草稿（front-matter `published: false` 或位于 `source/_drafts/`）不生成提交建议 —— 只认这两个显式标记，不做其他推断
4. 分组，一条提交一个需求点：新增文章一篇一条（配图并入同条）；`_config.stellar.yml` 按功能点拆；工程脚本（`ci/`、`tools/`、`.github/`）不与内容混在一条

## 输出

三节都要有，为空也写明「无」：

- **提交计划** —— 每条写：说明 / 涉及文件 / 建议 message（`<type>(<scope>): <中文描述>`，一行）。按建议提交顺序编号，工程配置类排在内容类之前
- **未纳入的改动** —— 逐条写明原因（草稿、临时文件、孤儿资源、用途不明等），不得静默省略任何改动
- **待确认** —— front-matter 必填项为空的文章，仅提醒，不影响上面的分组

输出后停下等用户挑选。确认后才可提交，提交信息中不得包含任何 AI 署名水印。
