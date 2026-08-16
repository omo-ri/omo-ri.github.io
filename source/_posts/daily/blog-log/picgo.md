---
title: 建站日志【3】
tags: [PicGo, 图床, GitHub]
categories: [日常]
date: 2026-08-17 00:02:42
description:
cover:
subtitle: GitHub + PicGo 图床
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
repo: Molunerfinn/picgo
---

今天也是把图床搞定了，用的是github + PicGo，这一篇内容实则比上一篇早，是我今天下午完成的

原本的图片都是放在博客自己的库里，也就是 `source/assets/images` 里，但是这样有几个问题：

1. 博客本体编译后的体积会变得很大，因为图片文件比较占空间。
2. 图片和博客内容在一个库里，很不方便也不利于管理，主要我感觉有点强迫症。

所以最后选择新开一个库专门存放图片，然后所有图片都放在一个文件夹里。这里我思考了很久，需不需要分一下类，开几个文件夹，但是一想到这样的话我用PicGo的意义就没有了，写博客要的就是即拿即用，有想用的图片直接上传，然后引用url就行了，分文件夹的话还得去找路径，太麻烦了

为了方便管理，安装了两个PicGo插件，一个是 `picgo-plugin-github-plus`，一个是 `picgo-plugin-rename-file`，前者上传和删除都可以与github同步，后者可以在上传的时候自动按照格式重命名文件，避免重复文件名覆盖的问题，管理也方便

{% grid c:2 %}
<!-- cell -->
{% link https://github.com/zWingz/picgo-plugin-github-plus picgo-plugin-github-plus %}
<!-- cell -->
{% link https://github.com/liuwave/picgo-plugin-rename-file picgo-plugin-rename-file %}
{% endgrid %}

