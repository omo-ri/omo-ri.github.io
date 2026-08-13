---
title: 建站 Hexo + Stellar
tags: []
categories: [日常]
poster:
  topic: null
  headline: 大标题
  caption: null
  color: white
date: 2026-08-13 13:30:28
description: 
cover:
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

这次遇到了一个喜欢的主题，而且也在搞自己的一个服务器，加上有了一个域名，于是就打算搞一个比较稳定的博客

<!-- more -->

# 起因

这次的博客是基于 Hexo + Stellar 主题搭建。动机是在找Deltarune汉化的时候看到了大佬的博客：

{% link https://blog.sheepyuhang.top/ %}

其实原因还有很多，这次回国遇到好多特别好的小伙伴（想你们了），想要记录一下自己的生活，顺便也想写一些技术文章

原本是想从0开始搞一个自己的网站，然后想搞一些功能来着，例如相册 菜谱等，但是发现搞起来太麻烦了，当时还不知道怎么存图片

然后搞这个博客的时候发现cdn代理这么方便，直接存github就行了，不过这不是长久之计，但先存在这吧

# 目标

目前打算是写一些日常的东西，吐槽，或者一些自己做的东西。至于有没有人看，我自己看就行

现在目标是把这个博客整合到我的网站上，加个入口之类的。那个网站现在叫Vellum

{% button color:theme Vellum https://vellum.mianhua.ru/ icon:solar:planet-bold-duotone %}

刚把vps还有github工作流搞好，但是感觉这么直接放到服务器上也没法监控。是不是还是得搞一下kubernetes啊...

以及今年已经大四了，总感觉做事情比别人都晚那么一步，九月份或者十月份应该会有yandex的技术面试，希望能过，现在也在刷题了

> 以前竞赛的时候还比较得心应手，自从vibe coding开始写代码就少了。。

也要看看国内现在公司都需要会什么，有些东西跟俄罗斯用的还不太一样，得学一下，想去国内游戏公司工作

# 版本记录 

在这记录一下自己搭建时候使用的版本

{% tabs %}

<!-- tab 运行环境 -->

| 项目            | 当前版本                                   | Stellar 要求          |
| --------------- | ------------------------------------------ | --------------------- |
| Node.js         | v24.19.0                                   | 22 及以上（推荐 LTS） |
| npm             | 11.17.0                                    | 10 及以上             |
| CI 环境 Node.js | 24（GitHub Actions） | —                     |

<!-- tab 框架与主题 -->

| 项目     | 当前版本       | Stellar 要求 |
| -------- | -------------- | ------------ |
| Hexo     | 8.1.2          | 6.3.0 及以上 |
| hexo-cli | 4.3.2          | 4.3.0 及以上 |
| 当前主题 | Stellar 1.38.0 | —            |

<!-- tab 域名及cdn代理 -->

TimeWeb + jsdmirror

{% endtabs %}
