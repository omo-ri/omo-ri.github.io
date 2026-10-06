---
title: Go中的channel
tags: [go, 后端, 技术]
categories: [技术]
date: 2026-10-06 23:06:20
description: 总结一下关于channel的知识点：缓冲、关闭、WaitGroup、select与死锁
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


总结一下关于channel的知识点

## 基本概念

channel是goroutine之间负责通信的工具

channel分为带缓冲区的和无缓冲区的。

{% grid w:280px gap:16px bg:box %}

<!-- cell -->

**不带缓冲区的channel**

- 数据传输是瞬时的，如果读和写不同时那么将会有一方阻塞

<!-- cell -->

**带缓冲区的channel**

- 在缓冲区没满时可以一直写入
- 在缓冲区有数据时可以一直读取
- 缓冲区满时写入方会阻塞
- 缓冲区空时读取方会阻塞

{% endgrid %}

## 创建channel

channel初始化靠`make(chan T, cap)`，例如`make(chan int, 10)`。cap可以省略，如果大于0，创建的channel将是带缓冲区的；省略或为0就是无缓冲区的。

channel可能是nil，例如`var ch chan int`

{% note color:warning nil channel
写入和读取nil channel都会永久阻塞，close nil channel会直接panic。
%}

## 关闭channel

如果要关闭channel需要使用`close(channel)`，重复close会导致panic。

关闭之后：
- 再写入会panic
- 读取会先读完缓冲区剩下的数据，之后立即返回零值，`v, ok := <-ch`中ok为false
- `for range ch`会正常退出

{% note color:green 关闭原则
由发送方关闭，接收方不关。只有一个worker发送时它自己关没问题，但有多个worker时不能让worker关闭channel，因为可能触发多次close，或者别的worker往已关闭的channel写入，都会造成panic。这时要由协调者统一关闭。
%}

## master-worker与WaitGroup

经典channel用法是一个主协程master创建channel和多个worker，使worker工作。当要结束任务时使用`WaitGroup`来同步结束时间。可以想象成一个用来等待一组任务的工具。本质可以看成一个计数器，开始任务时设定一个数量（worker数量），每当一个worker结束任务时让值减1,到0时负责关闭channel的协程知道所有任务完成，就可以关闭channel。

正确结构为

```
workers
   │
   │ Done()
   ▼
WaitGroup
   │
   │ Wait()
   ▼
close(results)
```

比较重要的有

```go
var wg sync.WaitGroup // 声明

wg.Add(1)
wg.Done()
wg.Wait()

// 1.25 新增了 Go 方法，自动 Add 和 Done，声明方式不变
wg.Go(func() {
    // 任务逻辑
})

wg.Wait()
```

{% note color:warning 注意
`wg.Add`要在启动goroutine之前调用，不能放在goroutine里面，否则`Wait`可能在`Add`之前就返回了。
另外`Wait()`+`close(results)`通常放在一个单独的goroutine里，如果主协程既要读results又先同步`Wait`，results满了之后worker会阻塞，最终死锁。
%}

## select

channel 负责 goroutine 之间通信，select 负责一个 goroutine 同时监听多个 channel。

简单来说，select 让一个 goroutine 同时等待多个 channel 操作，哪个 case 先 ready，就执行哪个。

- 假如有多个case可以执行，那么runtime会伪随机选择一个执行（不包括default）。
- default只有在所有case都没就绪时才会执行，没有default时select会一直阻塞，空的`select {}`会永久阻塞。

{% tabs %}

<!-- tab 同时监听多个channel -->

```go
select {
case x := <-ch1:
    fmt.Println("from ch1:", x)

case y := <-ch2:
    fmt.Println("from ch2:", y)
}
```

<!-- tab 取消与超时 -->

```go
select {
case msg := <-dataCh:
    // 收数据

case <-ctx.Done():
    // 被取消

case <-time.After(time.Second):
    // 超时
}
```

{% endtabs %}

## 死锁

死锁会让协程永久阻塞，但单个协程永久阻塞不一定是死锁，更常见的是goroutine泄漏。

{% note color:red all goroutines are asleep
如果所有协程都阻塞了，runtime会直接结束程序，报`fatal error: all goroutines are asleep - deadlock!`。这是fatal error不是panic，recover不了。只有部分协程阻塞时runtime检测不出来。
%}

## sync包

关于同步比较重要的有：
- sync.WaitGroup
- sync.Mutex
- sync.RWMutex
- sync.Once
- sync.Cond
- atomic（在`sync/atomic`包里）和mutex区别

sync中也有并发安全的`sync.Map`，以及用来复用临时对象、减轻GC压力的`sync.Pool`
