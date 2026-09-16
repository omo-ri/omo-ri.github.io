/* 浮点数文章（floating-point-01）的配图和交互组件
 * 占位：<div class="fpv" data-fig="bits|ruler|gap|round|overlap|widget"></div>
 * 样式见 /css/float-viz.css */
(function () {
  'use strict';

  var NARROW_AT = 560;
  var PAD_X = 24;

  // ---------- 小工具 ----------

  // h('div', { class: 'a', style: {...} }, [子节点或文字])
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'style') Object.assign(el.style, v);
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v);
      });
    }
    [].concat(children == null ? [] : children).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  var px = function (v) { return v + 'px'; };

  // 数轴上的绝对定位小块
  function box(left, top, width, height, style) {
    var s = { left: px(left), top: px(top) };
    if (width != null) s.width = px(width);
    if (height != null) s.height = px(height);
    return h('div', { style: Object.assign(s, style) });
  }

  // 数轴上的文字，center 为 true 时以 left 为中心
  function label(left, top, text, color, center, style) {
    return h('div', {
      class: 'mono fpv-label' + (center ? ' fpv-center' : ''),
      style: Object.assign({ left: px(left), top: px(top), color: color }, style)
    }, text);
  }

  function legendItem(swatchStyle, text) {
    return h('div', { class: 'fpv-legend-item' }, [h('span', { style: swatchStyle }), text]);
  }

  function sup(base, exp) {
    return [base, h('sup', { text: String(exp).replace('-', '−') })];
  }

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var scale = function (span, W) {
    return function (rel) { return Math.round(rel / span * W * 10) / 10; };
  };
  var V = function (name) { return 'var(--fpv-' + name + ')'; };

  // x → x' 的箭头和两端标签，方向按左右自动
  function arrow(storedX, amountX, top, labelTop) {
    var right = storedX > amountX;
    var head = right
      ? { marginLeft: '-8px', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid ' + V('accent') }
      : { borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '8px solid ' + V('accent') };
    var before = { transform: 'translateX(-100%)', marginLeft: '-4px' };
    var after = { marginLeft: '4px' };
    return [
      box(Math.min(storedX, amountX), top, Math.abs(storedX - amountX), 2, { background: V('accent') }),
      box(storedX, top - 4, 0, 0, head),
      label(amountX, labelTop, 'x', V('text'), false, right ? before : after),
      label(storedX, labelTop, "x'", V('accent-text'), false, right ? after : before)
    ];
  }

  function body(children) {
    return h('div', { class: 'fpv-body' }, children);
  }

  function caption(children) {
    return h('div', { class: 'fpv-caption' }, children);
  }

  // ---------- 图 1 位布局 ----------

  function renderBits(el) {
    function seg(n, color) {
      var cells = [];
      for (var i = 0; i < n; i++) cells.push(h('span', { style: { background: color } }));
      return h('div', { class: 'fpv-seg' }, [
        h('div', { class: 'fpv-cells' }, cells),
        h('div', { class: 'mono', style: { color: color }, text: String(n) })
      ]);
    }
    function row(name, e, m) {
      return h('div', { class: 'fpv-bits-row' }, [
        h('div', { class: 'mono fpv-bits-name', text: name }),
        h('div', { class: 'fpv-bits-segs' }, [seg(1, V('sign')), seg(e, V('exp')), seg(m, V('man'))])
      ]);
    }
    var sw = function (c) { return { width: '12px', height: '12px', borderRadius: '2px', background: c }; };
    el.replaceChildren(body([
      h('div', { class: 'fpv-legend', style: { flexDirection: 'row', fontSize: '14px' } }, [
        legendItem(sw(V('sign')), '符号'),
        legendItem(sw(V('exp')), '阶码'),
        legendItem(sw(V('man')), '尾数')
      ]),
      h('div', { class: 'fpv-bits' }, [row('float32', 8, 23), row('float64', 11, 52)]),
      caption('图 1 · 一格是一位，float32 是 1 + 8 + 23，float64 是 1 + 11 + 52')
    ]));
  }

  // ---------- 图 2 两把尺子 ----------

  function renderRuler(el, W, narrow) {
    var lo = 87654.30, span = 0.06, X = scale(span, W);
    var kids = [
      label(0, 0, '金额的刻度：0.01', V('p2'), false, { fontFamily: 'inherit', fontSize: '14px' }),
      box(0, 40, W, 2, { background: V('line') })
    ];
    for (var i = 0; i <= 6; i++) {
      kids.push(box(X(i / 100), 32, 2, 18, { marginLeft: '-1px', background: V('text') }));
      kids.push(label(X(i / 100), 56, '.' + (30 + i), V('p2'), true, { fontSize: '12px' }));
    }
    var xPos = X(0.03);
    kids.push(box(xPos, 33, 16, 16, { marginLeft: '-8px', borderRadius: '50%', background: V('cyan') }));
    kids.push(label(xPos, 8, 'x = 87654.33', V('cyan-text'), true));

    kids.push(h('div', {
      class: 'fpv-label',
      style: { left: 0, top: '100px', fontSize: '14px', color: V('p2') }
    }, sup('float32 的刻度：2', -7).concat(' ≈ 0.0078')));
    kids.push(box(0, 140, W, 2, { background: V('line') }));
    var ks = [];
    for (var k = Math.ceil(lo * 128); k / 128 <= lo + span; k++) ks.push(k);
    ks.forEach(function (k, j) {
      var x = X(k / 128 - lo);
      kids.push(box(x, 132, 2, 18, { marginLeft: '-1px', background: V('accent') }));
      // 窄屏放不下，只标首尾两个 float32 刻度
      if (!narrow || j === 0 || j === ks.length - 1) {
        kids.push(label(x, 156, '.' + ((k % 128) / 128).toFixed(4).slice(2), V('p2'), true, { fontSize: '12px' }));
      }
    });
    var storedPos = X(Math.fround(87654.33) - lo);
    kids.push(box(storedPos, 133, 16, 16, { marginLeft: '-8px', borderRadius: '50%', background: V('accent') }));
    kids.push(label(clamp(storedPos, 80, W - 80), 186, "x' = 87654.328125", V('accent-text'), true));

    el.replaceChildren(body([
      h('div', { class: 'fpv-axis', style: { width: px(W), height: '214px', overflow: 'visible' } }, kids),
      caption(['图 2 · 在 ['].concat(sup('2', 16), ', ', sup('2', 17), ') 里截出一小段，上面是 1 分钱的刻度，下面是 float32 的刻度'))
    ]));
  }

  // ---------- 图 3 / 图 5 相邻金额的范围 ----------

  var GAP = {
    lo: 87654.315, amounts: ['87654.32', '87654.33', '87654.34'], den: 128, half: 1 / 256, halfLabel: '±0.0039',
    ineq: '2 × 0.0039 < 0.01',
    caption: function () { return ['图 3 · ['].concat(sup('2', 16), ', ', sup('2', 17), ") 里相邻的三个金额，x' 的范围互相碰不到"); }
  };
  var OVERLAP = {
    lo: 131071.995, amounts: ['131072.00', '131072.01', '131072.02'], den: 64, half: 1 / 128, halfLabel: '±0.0078',
    ineq: '2 × 0.0078 > 0.01',
    caption: function () { return ['图 5 · 同样的比例换到 ['].concat(sup('2', 17), ', ', sup('2', 18), ')，相邻金额的范围重叠了'); }
  };

  function renderBands(el, W, narrow, P) {
    var span = 0.03, half = P.half, X = scale(span, W);
    var rels = [0.005, 0.015, 0.025];
    var kids = [];
    rels.forEach(function (a, i) {
      var l = Math.max(0, a - half), r = Math.min(span, a + half);
      kids.push(box(X(l), 28, X(r) - X(l), 90, { border: '1px solid ' + V('cyan'), background: V('cyan-a') }));
      kids.push(box(X(a), 118, 2, 12, { marginLeft: '-1px', background: V('text') }));
      kids.push(label(X(a), 136, P.amounts[i], V('p2'), true));
    });
    kids.push(label(X(0.015), 62, P.halfLabel, V('cyan-text'), true));
    var ineqX = 0, ineqOk = true;
    for (var i = 0; i < 2; i++) {
      var g = (rels[i + 1] - half) - (rels[i] + half);
      var from = Math.min(rels[i] + half, rels[i + 1] - half);
      var ok = g > 0;
      kids.push(box(X(from), 28, X(Math.abs(g)), 90, { background: ok ? V('ok-a') : V('bad-a') }));
      if (i === 0) { ineqX = clamp(X(from + Math.abs(g) / 2), 80, W - 80); ineqOk = ok; }
    }
    kids.push(label(ineqX, 4, P.ineq, ineqOk ? V('ok') : V('bad'), true));
    kids.push(box(0, 118, W, 2, { background: V('line') }));
    for (var k = Math.ceil(P.lo * P.den); k / P.den <= P.lo + span; k++) {
      kids.push(box(X(k / P.den - P.lo), 108, 2, 12, { marginLeft: '-1px', background: V('accent') }));
    }
    var stored = Math.fround(Number(P.amounts[1]));
    var storedX = X(stored - P.lo), amountX = X(0.015);
    kids.push(box(storedX, 113, 12, 12, { marginLeft: '-6px', borderRadius: '50%', background: V('accent') }));
    kids.push(box(amountX, 168, 2, 18, { marginLeft: '-1px', background: V('text') }));
    kids = kids.concat(arrow(storedX, amountX, 176, 184));
    kids.push(label(clamp((storedX + amountX) / 2, 110, W - 110), 204, P.amounts[1] + ' → ' + stored, V('accent-text'), true));

    el.replaceChildren(body([
      h('div', { class: 'fpv-legend' }, [
        legendItem({ width: '18px', height: '12px', borderRadius: '2px', border: '1px solid ' + V('cyan'), background: V('cyan-a') },
          "x' 最多可能在的范围（离 x 不超过半个刻度）"),
        legendItem({ width: '2px', height: '12px', margin: '0 8px', background: V('accent') }, 'float32 刻度'),
        legendItem({ width: '18px', height: '2px', background: V('accent') }, "x 挪到最近的刻度，就是 x'")
      ]),
      h('div', { class: 'fpv-axis', style: { width: px(W), height: '230px' } }, kids),
      caption(P.caption())
    ]));
  }

  // ---------- 图 4 四舍五入 ----------

  function renderRound(el, W) {
    var span = 3, X = scale(span, W); // rel 以 y - 1.5 为 0
    var pX = X(8765432.8125 - 8765431.5);
    var kids = [
      box(X(1.0), 10, X(2.0) - X(1.0), 116, { background: V('ok-a') })
    ];
    [[X(0), V('line')], [X(1), V('ok')], [X(2), V('ok')], [X(3) - 1.5, V('line')]].forEach(function (d) {
      kids.push(box(d[0], 10, null, 116, { borderLeft: '1.5px dashed ' + d[1] }));
    });
    kids.push(box(X(1.5 - 0.39), 46, X(1.5 + 0.39) - X(1.5 - 0.39), 80, { border: '1px solid ' + V('cyan'), background: V('cyan-a') }));
    kids.push(label(X(1.5), 20, '±0.5', V('ok'), true));
    kids.push(label(X(1.5), 72, '±0.39', V('cyan-text'), true));
    kids.push(box(0, 126, W, 2, { background: V('line') }));
    [[0.5, '8765432', V('p2')], [1.5, 'y = 8765433', V('text')], [2.5, '8765434', V('p2')]].forEach(function (t) {
      kids.push(box(X(t[0]), 126, 2, 12, { marginLeft: '-1px', background: V('text') }));
      kids.push(label(X(t[0]), 144, t[1], t[2], true));
    });
    kids.push(box(pX, 121, 12, 12, { marginLeft: '-6px', borderRadius: '50%', background: V('accent') }));
    kids.push(box(pX, 134, null, 42, { borderLeft: '1.5px solid ' + V('accent') }));
    kids.push(label(clamp(pX, 84, W - 84), 180, "100x' = 8765432.8125", V('accent-text'), true));

    el.replaceChildren(body([
      h('div', { class: 'fpv-legend' }, [
        legendItem({ width: '18px', height: '12px', borderRadius: '2px', border: '1px dashed ' + V('ok'), background: V('ok-a') }, '四舍五入会得到 y 的范围 ±0.5'),
        legendItem({ width: '18px', height: '12px', borderRadius: '2px', border: '1px solid ' + V('cyan'), background: V('cyan-a') }, "y + δ' 可能落的范围 ±0.39"),
        legendItem({ width: '10px', height: '10px', margin: '0 4px', borderRadius: '50%', background: V('accent') }, "87654.33 的 100x'")
      ]),
      h('div', { class: 'fpv-axis', style: { width: px(W), height: '214px' } }, kids),
      caption("图 4 · 乘 100 以后，y + δ' 离 y 最多 0.39，四舍五入一定回到 y")
    ]));
  }

  // ---------- 交互组件 ----------

  var f = Math.fround;
  var PRESETS = ['0.01', '87654.33', '100000', '131072.01'];
  var minus = function (s) { return s.replace('-', '−'); };
  var approx = function (v) {
    if (v >= 1e-4) {
      var r = Number(v.toFixed(4));
      return (r === v ? '= ' : '≈ ') + r;
    }
    return '≈ ' + v.toExponential(1);
  };

  function compute(text) {
    var m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(text.trim());
    if (!m) return { err: '填一个正数，最多两位小数' };
    var cents = Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0'));
    if (cents === 0) return { err: '金额要大于 0' };
    var x = parseFloat(text.trim());
    var stored = f(x);
    var delta = (stored * 100 - cents) / 100;
    var e = Math.floor(Math.log2(stored));
    while (Math.pow(2, e) > stored) e--;
    while (Math.pow(2, e + 1) <= stored) e++;
    var step = Math.pow(2, e - 23);
    // float64：100*float64(stored) + 0.5
    var a64 = 100 * stored, b64 = a64 + 0.5, y64 = Math.trunc(b64);
    // float32：100*stored + 0.5，每一步都舍入回 float32
    var a32 = f(100 * stored), b32 = f(a32 + 0.5), y32 = Math.trunc(b32);
    return {
      cents: cents, x: x, rawStored: stored, rawStep: step, stored: String(stored),
      delta: minus(delta === 0 ? '0' : Math.abs(delta) < 1e-4 ? delta.toExponential(2) : String(Number(delta.toFixed(6)))),
      half: approx(step / 2).replace('= ', '').replace('≈ ', ''),
      e: e, e1: e + 1, se: e - 23, step: approx(step),
      cols: [
        { title: 'float64 计算', code: 'int64(100*float64(stored) + 0.5)', a: a64, b: b64, y: y64 },
        { title: 'float32 计算', code: 'int64(100*stored + 0.5)', a: a32, b: b32, y: y32 }
      ]
    };
  }

  // 组件内的小数轴：当前金额前后各 2 分
  function widgetRuler(r, W, narrow) {
    var span = 0.04, lo = (r.cents - 2) / 100, half = r.rawStep / 2;
    var S = scale(span, W), X = function (v) { return S(v - lo); };
    var clipL = function (v) { return Math.max(0, Math.min(W, X(v))); };
    var cs = [];
    for (var i = -3; i <= 3; i++) if (r.cents + i > 0) cs.push(r.cents + i);
    var dense = r.rawStep < span / 200;
    var kids = [];
    if (!dense) {
      cs.forEach(function (k) {
        var l = clipL(k / 100 - half);
        kids.push(box(l, 10, clipL(k / 100 + half) - l, 60, { border: '1px solid ' + V('cyan'), background: V('cyan-a') }));
      });
      for (var j = 0; j + 1 < cs.length; j++) {
        var a = cs[j] / 100 + half, b = cs[j + 1] / 100 - half;
        var left = clipL(Math.min(a, b));
        kids.push(box(left, 10, clipL(Math.max(a, b)) - left, 60, { background: b > a ? V('ok-a') : V('bad-a') }));
      }
    }
    kids.push(box(0, 70, W, 2, { background: V('line') }));
    if (!dense) {
      for (var k = Math.ceil(lo / r.rawStep); k * r.rawStep <= lo + span; k++) {
        kids.push(box(X(k * r.rawStep), 60, 2, 12, { marginLeft: '-1px', background: V('accent') }));
      }
    }
    cs.filter(function (k) { return Math.abs(k - r.cents) <= 2; }).forEach(function (k) {
      var x = X(k / 100);
      kids.push(box(x, 70, 2, 10, { marginLeft: '-1px', background: V('text') }));
      if (!narrow || k === r.cents) {
        kids.push(label(x, 84, (k / 100).toFixed(2), k === r.cents ? V('text') : V('p3'), true, { fontSize: '12px' }));
      }
    });
    var storedX = X(r.rawStored), amountX = X(r.cents / 100);
    if (!dense && storedX >= 0 && storedX <= W) {
      kids.push(box(storedX, 65, 12, 12, { marginLeft: '-6px', borderRadius: '50%', background: V('accent') }));
      kids = kids.concat(arrow(storedX, amountX, 118, 108));
    }
    if (dense) {
      kids.push(h('div', {
        style: { left: 0, top: '16px', width: px(W), textAlign: 'center', fontSize: '13px', color: V('p2') },
        text: 'float32 刻度比 1 分钱细得多，这个比例下看不出来'
      }));
    }
    return h('div', { class: 'fpv-axis', style: { width: px(W), height: '140px' } }, kids);
  }

  function widgetResult(r, W, narrow) {
    var info = h('div', { class: 'fpv-panel fpv-info' }, [
      h('div', { class: 'fpv-muted', text: '存成 float32' }),
      h('div', { class: 'mono fpv-big', style: { color: V('accent-text') }, text: r.stored }),
      h('div', { class: 'fpv-muted', text: '偏移 δ' }),
      h('div', null, [
        h('span', { class: 'mono', style: { fontSize: '17px' }, text: r.delta }),
        h('span', { class: 'fpv-muted', text: '（最多半个刻度 ' + r.half + '）' })
      ]),
      h('div', { class: 'fpv-muted', text: '所在区间' }),
      h('div', null, [
        h('span', { class: 'mono', style: { fontSize: '15px' } }, ['['].concat(sup('2', r.e), ', ', sup('2', r.e1), ')')),
        h('span', { class: 'fpv-muted', text: '，float32 刻度 ' }),
        h('span', { class: 'mono', style: { fontSize: '15px' } }, sup('2', r.se).concat(' ' + r.step))
      ])
    ]);

    var sw = function (s) { return Object.assign({ width: '14px', height: '10px' }, s); };
    var ruler = h('div', { class: 'fpv-panel fpv-ruler' }, [
      widgetRuler(r, W, narrow),
      h('div', { class: 'fpv-legend' }, [
        legendItem(sw({ border: '1px solid ' + V('cyan'), background: V('cyan-a') }), "x' 最多可能在的范围"),
        legendItem({ width: '2px', height: '10px', margin: '0 6px', background: V('accent') }, 'float32 刻度'),
        legendItem(sw({ background: V('ok-a') }), '空出来'),
        legendItem(sw({ background: V('bad-a') }), '重叠')
      ])
    ]);

    var colors = [V('cyan'), V('accent')];
    var cols = h('div', { class: 'fpv-cols' }, r.cols.map(function (k, i) {
      var diff = k.y - r.cents;
      return h('div', { class: 'fpv-panel fpv-col' }, [
        h('div', { class: 'fpv-col-head' }, [h('span', { style: { background: colors[i] } }), k.title]),
        h('div', { class: 'mono fpv-code', text: k.code }),
        [['100 * stored', String(k.a)], ['+ 0.5', String(k.b)], ['int64 后 / 100', (k.y / 100).toFixed(2)]].map(function (s) {
          return h('div', { class: 'fpv-step' }, [
            h('div', { class: 'mono', text: s[0] }),
            h('div', { class: 'mono', text: s[1] })
          ]);
        }),
        h('div', {
          class: 'fpv-badge' + (diff === 0 ? '' : ' is-bad'),
          text: diff === 0 ? '还原正确' : (diff > 0 ? '多了 ' + diff + ' 分' : '少了 ' + (-diff) + ' 分')
        })
      ].reduce(function (acc, c) { return acc.concat(c); }, []));
    }));

    return [info, ruler, cols];
  }

  function renderWidget(el, W, narrow) {
    var st = el._fpv;
    if (!st) {
      st = el._fpv = { width: 0, narrow: false };
      st.input = h('input', {
        id: 'fpv-amount', class: 'fpv-input', type: 'text', inputmode: 'decimal',
        autocomplete: 'off', spellcheck: 'false', value: '87654.33'
      });
      st.err = h('div', { class: 'fpv-err', role: 'alert' });
      st.result = h('div', { class: 'fpv-result' });
      st.buttons = PRESETS.map(function (p) {
        return h('button', {
          class: 'fpv-preset', type: 'button', text: p,
          onclick: function () { st.input.value = p; update(); }
        });
      });
      st.input.addEventListener('input', update);
      el.replaceChildren(body([
        h('div', { class: 'fpv-row' }, [h('label', { for: 'fpv-amount', text: '金额' }), st.input]),
        st.err,
        h('div', { class: 'fpv-row fpv-presets' }, [h('span', { text: '试试' })].concat(st.buttons)),
        st.result
      ]));
    }
    st.width = W;
    st.narrow = narrow;
    update();

    // 只重建结果区，输入框节点保持不动
    function update() {
      var text = st.input.value;
      var r = compute(text);
      st.buttons.forEach(function (b) { b.classList.toggle('is-active', b.textContent === text); });
      st.err.textContent = r.err || '';
      st.err.style.display = r.err ? '' : 'none';
      st.result.replaceChildren.apply(st.result, r.err ? [] : widgetResult(r, st.width - 34, st.narrow));
    }
  }

  // ---------- 入口 ----------

  var RENDER = {
    bits: renderBits,
    ruler: renderRuler,
    gap: function (el, W, narrow) { renderBands(el, W, narrow, GAP); },
    round: renderRound,
    overlap: function (el, W, narrow) { renderBands(el, W, narrow, OVERLAP); },
    widget: renderWidget
  };

  function mount(el) {
    var render = RENDER[el.getAttribute('data-fig')];
    if (!render) return;
    var last = -1;
    function draw() {
      var width = el.clientWidth;
      if (!width || width === last) return;
      last = width;
      var narrow = width < NARROW_AT;
      el.classList.toggle('is-narrow', narrow);
      render(el, Math.floor(width - PAD_X * 2), narrow);
    }
    // 占位是空的会被 CSS 隐藏，先放一个空 body 让它有宽度
    if (!el.firstChild) el.appendChild(h('div', { class: 'fpv-body' }));
    draw();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(draw).observe(el);
  }

  function init() {
    document.querySelectorAll('.fpv[data-fig]').forEach(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
