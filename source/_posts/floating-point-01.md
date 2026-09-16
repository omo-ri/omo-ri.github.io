---
title: 浮点数：金额被误存成 float32，还能无损还原吗？
tags: []
categories: [技术]
date: 2026-09-17 21:00:00
description:
cover:
subtitle:
banner:
sticky:
mermaid:
katex:
mathjax: true
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

# 题目

一道作业题，背景是金融相关的。

{% note 题意 有一个金额 $x$，范围是 $0.01$ 到 $100000.00$，输入精度为小数点后两位，用 float64 保存。某处不小心把它强行转换成了 float32，能不能把原来的 float64 还原回来？ %}

下面只用到 IEEE 754 的规定，所以不只是 Go，C、Java、Rust 里的 float 也一样，代码用 Go 写。

# 刻度步伐

<div class="fpv" data-fig="bits"></div>

IEEE 754 里 float64 的尾数是 52 位，float32 的尾数是 23 位。在 $[2^{e}, 2^{e+1})$ 这个区间里，尾数把区间等分，相邻两个数之间的步伐就是区间长度除以尾数能表示的份数。

$x$ 最大是 $100000$，比 $2^{17} = 131072$ 小，所以最粗的刻度在 $[2^{16}, 2^{17})$ 这个区间：

$$\text{float64}: \frac{2^{16}}{2^{52}} = 2^{-36} \qquad \text{float32}: \frac{2^{16}}{2^{23}} = 2^{-7} \approx 0.0078$$

更小的区间刻度更细，只要这一段没问题，整个范围就没问题。

float64 转 float32 的时候，尾数并不是直接截断的，而是舍入到离它最近的 float32，刚好在正中间时取尾数为偶数的那个。

<div class="fpv" data-fig="ruler"></div>

# 推导

设 $x$ 是原始值，$x'$ 是转换后的 float32。因为是找最近的刻度，偏移最多是半个刻度：

$$x' = x + \delta, \qquad |\delta| \le 2^{-8} \approx 0.0039$$

$x$ 的步伐是 $0.01$，两个相邻金额就算往中间各偏 $0.0039$，也碰不到一起：

$$2 \times 0.0039 \lt 0.01$$

也就是说任意两个不同的 $x_1$、$x_2$ 都对应不同的 float32，信息其实没有丢，可以尝试还原。

<div class="fpv" data-fig="gap"></div>

两边同乘 100：

$$100x' = 100x + 100\delta = y + \delta'$$

$y = 100x$ 是整数，也就是以分为单位的金额，而

$$|\delta'| \le 0.39 \lt 0.5$$

此时可以发现 $100x'$ 离 $y$ 不超过 $0.5$，对 $100x'$ 四舍五入就能拿到 $y$，再用 $y / 100$ 就是原来的 float64。

<div class="fpv" data-fig="round"></div>

# 代码

假设输入都是正确的，不考虑输入错误的情况：

```go
func RestoreAmount(stored float32) float64 {
    y := int64(100*float64(stored) + 0.5)
    return float64(y) / 100
}
```

金额都是正数，所以：

- `int64` 截断就是向下取整
- `+0.5` 再截断就是四舍五入，不需要 `math.Round`

## 为什么要先转 float64

运算本身也是浮点运算，所以要小心 ulp 的问题（ulp 就是当前位置的刻度步伐）。

$100x'$ 最大接近 $10^7$，在 $[2^{23}, 2^{24})$ 区间里，float32 的刻度是 $2^{23} / 2^{23} = 1$，只能表示整数。如果直接写 `100*stored + 0.5`，`100*stored` 的小数部分会先被舍掉，变成一个整数，再加 0.5 又刚好落在两个整数正中间，奇数会被舍入成下一个偶数。

拿 $87654.33$ 算一下：

| | float32 计算 | float64 计算 |
| ---- | ---- | ---- |
| `stored` | 87654.328125 | 87654.328125 |
| `100 * stored` | 8765433 | 8765432.8125 |
| `+ 0.5` | 8765434 | 8765433.3125 |
| `int64` 后 `/ 100` | 87654.34 | 87654.33 |

float32 这边多了一分钱。

换成 float64 就没有这个问题：

- $x'$ 最多 24 位有效位，乘 100 最多 31 位，float64 有 53 位放得下，乘法和加 0.5 都是精确的。
- 最后的 `float64(y) / 100` 也不是近似。$y$ 和 $100$ 在 float64 里都是精确的，IEEE 754 规定除法结果是离真实值最近的 float64；而原来输入的金额（比如用 `strconv.ParseFloat` 解析 `"87654.33"`）也是离这个十进制数最近的 float64，所以两者是同一个数，可以直接用 `==` 比较。

# 边界

推导里用到了 $x \lt 2^{17}$。到了 $[2^{17}, 2^{18})$，float32 的刻度变成 $2^{-6} \approx 0.0156$，半个刻度约 $0.0078$，乘 100 后超过了 $0.5$，四舍五入就可能取错。而且 $2 \times 0.0078 \gt 0.01$，两个相邻金额可能变成同一个 float32，这时候已经还原不回来了。

<div class="fpv" data-fig="overlap"></div>

{% note color:warning 反例 比如 $131072.01$ 会被存成 $131072.015625$，乘 100 是 $13107201.5625$，四舍五入得到 $13107202$，还原成了 $131072.02$。 %}

所以这个方法只在 $x \lt 131072$ 时成立，题目的 $100000$ 在范围内。

<div class="fpv" data-fig="widget"></div>

# 验证

1 分到 1000 万分一共 1000 万个金额，直接全部跑一遍：

{% folding child:codeblock open:false 完整代码 %}
```go
package main

import (
	"fmt"
	"strconv"
)

func RestoreAmount(stored float32) float64 {
	y := int64(100*float64(stored) + 0.5)
	return float64(y) / 100
}

func main() {
	wrong64, wrong32 := 0, 0
	for cents := 1; cents <= 10000000; cents++ {
		s := strconv.Itoa(cents/100) + "." + fmt.Sprintf("%02d", cents%100)
		x, _ := strconv.ParseFloat(s, 64)
		stored := float32(x)

		if RestoreAmount(stored) != x {
			wrong64++
		}
		if float64(int64(100*stored+0.5))/100 != x {
			wrong32++
		}
	}
	fmt.Println("float64 还原出错:", wrong64)
	fmt.Println("float32 还原出错:", wrong32)

	for cents := 10000001; ; cents++ {
		x := float64(cents) / 100
		if RestoreAmount(float32(x)) != x {
			fmt.Printf("第一个出错的金额: %.2f\n", x)
			break
		}
	}
}
```
{% endfolding %}

输出：

```
float64 还原出错: 0
float32 还原出错: 1099297
第一个出错的金额: 131072.01
```

float64 的写法全部还原正确，全程用 float32 算错了一百多万个，超过 100000 之后第一个出错的就是 131072.01，和上面推的一样。

# 最后

{% note 最后 误存成 float32 的金额在这个范围里是能救回来的，但实际的金融系统里金额还是应该用 int64 存分，或者用 decimal 类型，就不会有这些问题。 %}

<link rel="stylesheet" href="/css/float-viz.css">
<script src="/js/float-viz.js" defer></script>
