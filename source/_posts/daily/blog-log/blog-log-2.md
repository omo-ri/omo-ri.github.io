---
title: 建站日志【2】 Stellar主题1.41+ hover样式恢复
tags: []
categories: [日常]
date: 2026-08-16 23:12:10
description:
cover:
subtitle:
banner:
sticky:
mermaid:
katex:
mathjax:
topic:
author:
references:
comments:
indexing:
breadcrumb:
leftbar:
rightbar:
h1:
type:
---

麻了，没想到这个主题更新的这么快，很多配置都不一样了，文档也没有老版本，只能硬着头皮改配置了，遇到好多问题

首先就是主页hover样式变得怎么这么丑，原本是这样的：

{% image https://cdn.jsdmirror.com/gh/omo-ri/blog-img/source/assets/images/20260816-231453-8887-20260816231453138.png 更新前 ratio:1159/570 %}

更新完直接这样了

{% image https://cdn.jsdmirror.com/gh/omo-ri/blog-img/source/assets/images/20260816-215959-74ad-20260816215958273.png 更新后 width:558px ratio:558/333 %}

原本好好的辉光效果没了，直接一个莫名其妙的半截荧光笔，然后更新日志里也没提，代码里也没看到有相关的配置，用claude code 查了一下发现是主题从 1.41 起在 source/css/_components/list.styl 里移除了 .post-card-wrap 的 hoverable-card()，改用标题下方一根 12px 高, 50% 透明度的主题色横条（.post-title::after）作为唯一 hover 反馈

也是借助claude code神力自定义了一个css来恢复原本的辉光效果，代码如下：

{% folding child:codeblock open:false color:green 自定义主页辉光hover %}
```css
/* 1. 彻底去掉标题下的主题色横条 */
.l_main .post-list .post-card .post-title::after {
  display: none;
}

/* 顺带把标题盒子还原成 1.38 的整行块级（1.41 改成了 width: fit-content，
   那是为了让横条宽度贴合文字才加的，横条没了就不需要） */
.l_main .post-list .post-card .post-title {
  width: auto;
}

/* 2. 恢复整卡 hover 反馈，对应 1.38 的 hoverable-card() */
.l_main .post-list .post-card-wrap {
  transition: box-shadow 0.2s ease-out;
}

/* 亮色：阴影加深 */
:root[data-theme="light"] .l_main .post-list .post-card-wrap:hover {
  box-shadow: 0 12px 20px -4px rgba(0, 0, 0, 0.15);
}

/* 暗色：主题色辉光 */
:root[data-theme="dark"] .l_main .post-list .post-card-wrap:hover {
  box-shadow: 0 0 4px -2px var(--theme), 0 0 24px -8px var(--theme);
}

/* 跟随系统配色时的兜底 */
:root:not([data-theme]) .l_main .post-list .post-card-wrap:hover {
  box-shadow: 0 12px 20px -4px rgba(0, 0, 0, 0.15);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .l_main .post-list .post-card-wrap:hover {
    box-shadow: 0 0 4px -2px var(--theme), 0 0 24px -8px var(--theme);
  }
}

/* 3. 封面缩放动画改回 0.5s（1.41 拖长到了 1.5s，hover 时显得迟钝） */
.l_main .post-list .post-card img {
  transition: all 0.2s ease-out, transform 0.5s ease-out;
}
```
{% endfolding %}



最后也恢复了原本的样子，然后也是清了很多无用配置

{% note P.S. 本文对应的主题版本是 **Stellar 1.42.1**，1.41 及以上应该都适用。%}

