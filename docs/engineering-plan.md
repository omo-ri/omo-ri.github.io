# 博客工程化方案菜单

> 创建于 2026-08-18 · 状态：待决策
>
> 本文档是这个博客仓库的工程化改造备选清单。每项独立可选、独立落地，不构成整体绑定。
> 已完成的项目请把「状态」改为 `已完成` 并补上落地位置；决定不做的改为 `作废` 并写明原因，
> 避免以后被重复提议。

## 一、背景：这些选项想解决什么

本仓库现状（2026-08-18 体检）：

- Hexo 8.1.2 + Stellar 1.42.1（**从 npm 安装**，`themes/` 只有 `.gitkeep`，无 submodule）
- 31 个提交、5 篇文章，GitHub Pages 自动部署（`.github/workflows/pages.yml`）
- 无任何构建前校验；无 AI 协作规范（`.claude/` 已被 gitignore）

**核心风险不是「写坏文章」，而是「主题升级把定制打碎」** —— 且已经发生过一次，
`source/_posts/daily/blog-log/blog-log-2.md` 整篇就是在记录这次事故。

当前的三处定制面：

| # | 位置 | 内容 | 脆弱性 |
|---|------|------|--------|
| 1 | `source/css/custom.css` | 5 条规则覆盖 Stellar 1.41+ 的文章卡片 hover 行为，恢复 1.38 的整卡阴影反馈 | **高**。依赖主题内部类名 `.post-card-wrap` / `.post-title::after` / `.post-list .post-card img`，这些不是对外 API，主题重构即**静默失效** |
| 2 | `_config.stellar.yml` | 6 处偏离主题默认值：`prefers_theme: dark`、`border-radius.bar: 8px`（默认 12px）、`site.blur-px: 5px`（默认 100px）、`blur-bg: var(--bg-a20)`（默认 a75）、`blur-sat: 100%`（默认 300%）、leftbar `ui-style: glass` | 中。走的是官方配置项，但「主题默认值」本身可能变 |
| 3 | `_config.stellar.yml` 的 `plugins.mathjax.inject` | 替换主题自带 MathJax partial（2.7.6 → 3.2.2，关闭 `matchFontHeight`，因霞鹜文楷 sxHeight 仅 468/2048 ≈ 0.23em 导致公式被压到约 50%） | 中。主题改动 mathjax 插件实现或配置结构时行为不可预测 |

已经在自发做「覆盖台账」——散落在上述文件注释里的「主题默认 xxx」。
问题是它们分散在三个文件中，升级时不会被逐条想起。

**复杂程度评级标准**：

- **低** —— 约 10~30 分钟，改动集中在 1~2 个文件，无设计取舍
- **中** —— 约 1~2 小时，需要先定规则或做取舍
- **高** —— 半天以上，或需要长期持续维护

---

## 二、总览

| ID | 名称 | 复杂程度 | 状态 |
|----|------|---------|------|
| B1 | 覆盖台账 `docs/overrides.md` | 中 | **已选定** |
| B2 | 漂移检查器 `tools/check-overrides.js` | 中 | **已选定** |
| B3 | 主题升级流程 | 低 | **已选定** |
| C | 内容校验 `tools/check-posts.js` | 中 | 待定 |
| D | `npm run check` 聚合 + CI 前置 | 低 | 待定 |
| E | `AGENTS.md` + `CLAUDE.md`（博客版） | 中 | 待定 |
| F | Conventional Commits 门禁 | 低 | 待定 |
| G | 部署加固 | 低 | 待定 |
| H | 图床 / 本地资源约定 | 低 | 待定 |
| A | 主题 symlink 联调 | — | **作废** |
| X1 | `docs/designs/` 方案三件套 | 中 | **不推荐** |
| X2 | 知识库 + 硬事实核查 | 高 | **不推荐** |

---

## 三、已选定项

### B1 · 覆盖台账 `docs/overrides.md`

**做什么**

建立一张表，把所有偏离 Stellar 默认行为的地方集中登记。每条记录五个字段：

- 位置（文件 + 具体位置）
- 覆盖了什么（主题默认行为 → 改成了什么）
- 为什么（原始动机，含排查结论）
- 依赖主题的哪些内部实现（选择器 / 配置键 / 插件名 —— 这是 B2 的检查输入）
- 如何回退（删掉什么就能回到主题默认）

**解决什么**

升级主题时有一张明确的复查清单，而不是靠回忆「我好像改过什么」。
目前这些信息散在 `custom.css` 注释、`_config.stellar.yml` 注释两处，
没有任何一处能一眼看全。

**理由**

这是 Stellar 主题仓库 `docs/knowledge/VERIFICATION.md` 台账思路的博客版。
主题仓库用它记录「文档与代码的偏差修正」，博客对应的就是「我与主题默认值的偏差」。
现有注释质量已经很高（`custom.css` 开头那段背景说明、mathjax 那段 sxHeight 分析），
缺的只是**集中**和**结构化**——结构化之后 B2 才能自动读取。

**复杂程度：中**

写文档本身不难，1 小时内。难在两个决策：
① 每条覆盖是「长期锁死」还是「临时补丁 + 撤销条件」，这决定 B2 报警时该修补丁还是删补丁；
② 台账的粒度（是否连 `inject.head` 的字体 CDN、custom.css 引入也记）。

---

### B2 · 漂移检查器 `tools/check-overrides.js`

**做什么**

零依赖 Node 脚本。从 B1 台账中读出每条覆盖「依赖的主题内部实现」，
到 `node_modules/hexo-theme-stellar/` 里实际查找，找不到就报告。

可行性已验证（对当前安装的 1.42.1）：

```
post-card-wrap  → source/css/_components/list.styl                        ✓ 存在
post-title      → list.styl / _common/title.styl / partial/article-footer.styl  ✓ 存在
post-list       → list.styl 等 4 处                                        ✓ 存在
hoverable-card  → func.styl / tag-plugins/link.styl / grid.styl / ghrepo.styl
                  （已不在 list.styl —— 与 custom.css 注释描述一致）
```

**解决什么**

主题升级后，一条命令告诉你哪条定制**可能已经失效**。
现在的失效方式是静默的：不报错、不构建失败，某天发现样式变了，还不知道是哪次升级导致的。

**理由**

这是 Stellar 仓库 `docs/knowledge/tools/verify.py` 的博客版，
核心思路一模一样：**文档声明的事实 vs 代码真相，不一致以代码为准**。
主题仓库用它校验知识库里的文件路径、配置键、行号是否还成立；
博客用它校验「我的覆盖所依赖的主题内部结构」是否还成立。

这是整套方案里唯一能长期持续产生价值的部分——每次升级主题都会用到。

**复杂程度：中**

脚本本身不复杂（grep + 报告，100 行量级），但有两个待定设计：
① 检测到漂移是**警告**还是**构建失败**（做成硬失败可能在每次升级后红一片）；
② 是否连「主题默认值本身变了」也检出来（需要解析主题 `_config.yml`，成本明显更高）。

---

### B3 · 主题升级流程

**做什么**

把主题升级固化成一份检查表（写进 `docs/overrides.md` 或独立 `docs/upgrade.md`）：

1. 读 Stellar `CHANGELOG.md` 对应版本的「样式 / 升级注意」章节
2. `npm i hexo-theme-stellar@x.y.z`
3. 跑 B2 漂移检查
4. 逐条核对 B1 台账中的每项覆盖
5. 本地 `hexo s` 预览重点页面（首页列表 / 文章页 / 数学公式页 / 关于页）
6. 单独提交，提交信息写明版本跨度

**解决什么**

把上次踩坑的经验变成可重复的流程，而不是每次凭直觉。

**理由**

成本极低（一份 checklist），但它是 B1/B2 产生价值的**触发点**——
台账和检查器只有在升级时被真正执行才有意义。三者绑定交付。

**复杂程度：低**

---

## 四、待定项

### C · 内容校验 `tools/check-posts.js`

**做什么**

零依赖 Node 脚本，校验 `source/_posts/` 下的文章：

- front-matter 必填项非空（`title` / `date` / `tags` / `categories`）
- 日期格式合法；`updated` 不早于 `date`
- 本地图片引用的文件确实存在
- 孤儿资源（存在于文章目录但无人引用的图片）
- 站内链接有效性

**解决什么**

现存的具体问题：`source/_posts/codeforces/cf-1117.md` 的 `tags` 和 `categories` **全空**
（其他四篇有 `[日常]` / `[游戏]`）；`source/_posts/codeforces/image.png` 在 md 里
**没有任何引用**，是个孤儿文件；五篇文章的 `description` 全部为空。

**理由**

把「记住写作规范」变成机器检查。同样是 `verify.py` 思路的应用，
只不过对象从「主题内部结构」换成「文章元数据」。
优先级低于 B 组，因为写坏 front-matter 的后果远小于定制静默失效。

**复杂程度：中**

脚本不难，但需要先定规则：哪些字段是硬性必填（`description` 现在全空，
要不要强制？），以及和 H 项的资源约定绑定（图床链接要不要检查可达性）。

---

### D · `npm run check` 聚合 + CI 前置

**做什么**

`package.json` 加 `"check": "node tools/check-overrides.js && node tools/check-posts.js"`；
`.github/workflows/pages.yml` 在 `npm run build` 之前插入 `npm run check`。

**解决什么**

一条命令跑完所有校验（AI 和你都只需要记一个命令）；坏内容进不了线上。

**理由**

照搬 Stellar 仓库的 `npm run check`（它聚合了 lint + 单测 + 依赖检查 + 知识库核查）。
单独的检查脚本很容易被忘记执行，聚合成一个命令并挂到 CI 上才会真正生效。
依赖 B2 / C 至少落地一个才有意义。

**复杂程度：低**

---

### E · `AGENTS.md` + `CLAUDE.md`（博客版）

**做什么**

仓库根写一份 AI 协作规范，`CLAUDE.md` 用 `@AGENTS.md` 导入（Stellar 仓库的做法）。核心内容：

1. **边界**：`node_modules/` 绝不直接修改
2. **定制只走三个口子**：`_config.stellar.yml` / `source/css/custom.css` / `inject`
3. **任何新增覆盖必须同步登记进 B1 台账**
4. 写作约定、资源约定（承接 H）
5. 不自动提交原则——改动留在工作区供审查

**解决什么**

防止 AI（和自己图省事时）去改 `node_modules/hexo-theme-stellar/`。
那种改动不在任何 git 仓库里、无法提交，且下次 `npm install` 直接蒸发。

**理由**

Stellar 仓库 `AGENTS.md` 的三段式边界（本仓库负责 / 不负责 / 协作边界）值得照搬，
但内容要换：对使用者而言，边界是「内容和配置归我，主题实现归上游」。
排在 B 组之后，是因为规范应该固化**已经验证有效**的做法，
先写规范再去遵守，容易写出一份自己都不执行的文档。

**复杂程度：中**

写起来不难，难在想清楚约定本身。

---

### F · Conventional Commits 门禁

**做什么**

移植 Stellar 仓库的 `ci/check-commit-msg.js`（零依赖，约 60 行），
type 白名单改成博客版：`content` / `post` / `style` / `config` / `fix` / `docs` / `chore`。

**解决什么**

现有历史噪音较多：`Fix`、`Update bg`、`Update config` 这类零信息量提交，
外加 4 条 PicGo 自动生成的 `Upload xxx by PicGo - 2026-08-16 01:15:54`。

**理由**

最新一条提交 `content(blog-log): 统一建站日志系列的标题与标签元数据` 已经是规范格式，
说明方向已经自发形成，只需要用脚本固化下来。

**复杂程度：低**

但**有前置决策**：PicGo 的自动提交怎么处理——正则豁免、还是改配置让 PicGo 只上传不提交。

---

### G · 部署加固

**做什么**

改 `.github/workflows/pages.yml`：

- `npm install` → `npm ci`
- cache key `${{ runner.OS }}-npm-cache` → 加上 `package-lock.json` 的 hash
- build 前加 `hexo clean`

**解决什么**

现在的 cache key 是写死的，改依赖后会吃到陈旧缓存；
`npm install` 可能装到与 lockfile 不一致的版本。

**理由**

纯粹的即时收益，无设计决策，顺手就做了。

**复杂程度：低**

---

### H · 图床 / 本地资源约定

**做什么**

定一条规则并写进规范，由 C 项的校验器执行。三个候选：

- 配图一律走 PicGo 图床
- 配图一律放本地 `source/assets/`
- 图床为主，允许文章同目录放本地图

**解决什么**

现在两套混用：文章里是 PicGo 图床 CDN 链接
（`cdn.jsdmirror.com/gh/omo-ri/blog-img/...`），
同时 `source/_posts/codeforces/` 里躺着一个没人引用的本地 `image.png`。

**理由**

规则不明确时，每篇文章都要重新决策一次，且会持续产生孤儿文件。
规则本身没有优劣，定了就行。

**复杂程度：低**（决策本身需要你拍板）

---

## 五、作废与不推荐

### A · 主题 symlink 联调 —— **作废**

**原提议**：把主题源码仓库 symlink 到 `themes/stellar`，让本地预览使用开发版主题。

**作废原因**：基于「本人是 Stellar 主题贡献者」的错误前提。
实际情况是**只使用不开发**，`~/repos/hexo-theme-stellar` 仅作参考阅读。
使用者不需要联调链路，主题始终从 npm 消费即可。

> 技术事实备查（Hexo 8.1.2，`node_modules/hexo/dist/hexo/load_config.js:55-65`）：
> `themes/<theme>/` 的优先级高于 `node_modules/hexo-theme-<theme>/`，
> 前者存在时后者完全不被加载。将来若需要本地覆盖主题，这是可用的机制。

### X1 · `docs/designs/` 方案三件套 —— **不推荐**

**原提议**：每个改动建 `docs/designs/{YYYY-MM-DD}-{名称}/`，含 `spec.md` / `plan.md` / `checklist.md`。

**不推荐原因**：Stellar 仓库 11 天里产出了 118 个方案条目、175 个提交，
这个密度下方案文档是 AI 每次冷启动的上下文契约，划算。
本博客的改动频率和复杂度都低一个数量级，全套三件套是纯负担。

若将来出现「站点结构大改」「多文件配置重构」这类改动，可以单独为那一次写方案，
但**日常写文章绝对不要走这个流程**。

### X2 · 知识库 + 硬事实核查 —— **不推荐**

**原提议**：仿 `docs/knowledge/`（60 个页面、10 个领域）+ `tools/verify.py`。

**不推荐原因**：规模完全不匹配（5 篇文章的博客）。
且 Stellar 的知识库已经存在于主题仓库中，需要时直接查阅即可，重建一份只会产生漂移。
其中真正有价值的部分（硬事实核查思路）已经以 B2 的形式被吸收。

---

## 六、建议顺序

| 批次 | 项目 | 说明 |
|------|------|------|
| 第一批 | B1 + B2 + B3 | 直击已发生过的事故，三者绑定交付 |
| 第二批 | C + D + G | 内容质量与部署可靠性 |
| 第三批 | E + F + H | 规范固化——放在最后，固化已验证有效的做法 |

---

## 七、待拍板问题

以下问题不解决则对应项目无法开工：

| # | 关联 | 问题 |
|---|------|------|
| 1 | B1 | `custom.css` 的 5 条覆盖，目标是**永久锁死** 1.38 hover 行为，还是**临时补丁**（上游修复中文糊字后即撤销）？决定台账字段和 B2 报警后的处置方式 |
| 2 | B1 | 台账粒度：是否连 `inject.head` 的两条（LXGW 字体 CDN、custom.css 引入）也登记？ |
| 3 | B2 | 检测到漂移是**警告**还是**构建失败**？ |
| 4 | B2 | 是否检测「主题默认值本身变了」？（需解析主题 `_config.yml`，成本更高） |
| 5 | C / H | 配图规则：图床 / 本地 / 混合？ |
| 6 | F | PicGo 自动提交：正则豁免，还是改成只上传不提交？ |

## 八、其他待处理

与本方案无关但悬置中的工作区状态（截至 2026-08-18）：

- `_config.stellar.yml` 的 mathjax 覆盖配置尚未提交
- `source/_posts/codeforces/` 整个目录未跟踪（含孤儿文件 `image.png`）
