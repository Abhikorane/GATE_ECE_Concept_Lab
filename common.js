/* GATE EC Concept Lab: shared runtime (router, progress, math rendering, simulation toolkit) */
(function () {
  'use strict';
  var GS = window.GS = { sims: {} };

  GS.sections = [
    { id: 'maths', n: 1, title: 'Engineering Mathematics', short: 'Engineering Maths', marks: 'about 13', sims: 4,
      blurb: 'Linear algebra, calculus, differential equations, vector and complex analysis, probability.',
      topics: [['m-linalg', 'Linear algebra'], ['m-calc', 'Calculus'], ['m-de', 'Differential equations'], ['m-vec', 'Vector analysis'], ['m-complex', 'Complex analysis'], ['m-prob', 'Probability and statistics']] },
    { id: 'networks-signals', n: 2, title: 'Networks, Signals and Systems', short: 'Networks, Signals', marks: '14 to 18', sims: 7,
      blurb: 'Circuit theorems, phasors, transients, LTI systems, Fourier, sampling, z-transform and filters.',
      topics: [['n-circuit', 'Circuit analysis'], ['n-sss', 'Sinusoidal steady state'], ['n-transient', 'Transients and two-ports'], ['n-lti', 'LTI systems'], ['n-ct', 'Continuous-time signals'], ['n-dt', 'Discrete-time signals']] },
    { id: 'devices', n: 3, title: 'Electronic Devices', short: 'Electronic Devices', marks: '7 to 10', sims: 5,
      blurb: 'Energy bands, carrier transport, PN junction, BJT, MOSFET, LED, photodiode and solar cell.',
      topics: [['d-bands', 'Energy bands and carriers'], ['d-transport', 'Carrier transport'], ['d-pn', 'P-N junction and Zener'], ['d-bjt', 'BJT'], ['d-mos', 'MOS capacitor and MOSFET'], ['d-opto', 'LED, photodiode, solar cell']] },
    { id: 'analog', n: 4, title: 'Analog Circuits', short: 'Analog Circuits', marks: '9 to 12', sims: 5,
      blurb: 'Diode circuits, BJT and MOSFET amplifiers, current mirrors, differential pairs, op-amp circuits.',
      topics: [['a-diode', 'Diode circuits'], ['a-amp', 'BJT and MOSFET amplifiers'], ['a-mirror', 'Current mirrors and differential amplifiers'], ['a-opamp', 'Op-amp circuits'], ['a-comp', 'Filters, oscillators, compensation']] },
    { id: 'digital', n: 5, title: 'Digital Circuits', short: 'Digital Circuits', marks: '8 to 11', sims: 5,
      blurb: 'Number systems, K-maps, CMOS gates, flip-flops, timing, data converters, memories, pipelining.',
      topics: [['g-num', 'Number representations'], ['g-comb', 'Combinational circuits'], ['g-seq', 'Sequential circuits and timing'], ['g-conv', 'Data converters'], ['g-mem', 'Semiconductor memories'], ['g-co', 'Computer organization']] },
    { id: 'control', n: 6, title: 'Control Systems', short: 'Control Systems', marks: '8 to 10', sims: 4,
      blurb: 'Feedback, block diagrams, time response, Routh and Nyquist stability, Bode, root locus, PID, state space.',
      topics: [['c-model', 'Feedback and system models'], ['c-time', 'Transient and steady-state response'], ['c-stab', 'Routh-Hurwitz and root locus'], ['c-freq', 'Bode, Nyquist and margins'], ['c-comp', 'Compensators and PID'], ['c-state', 'State-variable model']] },
    { id: 'communications', n: 7, title: 'Communications', short: 'Communications', marks: '9 to 13', sims: 7,
      blurb: 'Random processes, AM and FM, superheterodyne receivers, information theory, digital modulation, coding.',
      topics: [['k-random', 'Random processes'], ['k-analog', 'Analog communications'], ['k-info', 'Information theory'], ['k-digital', 'Digital communications'], ['k-coding', 'Error correction']] },
    { id: 'electromagnetics', n: 8, title: 'Electromagnetics', short: 'Electromagnetics', marks: '6 to 9', sims: 7,
      blurb: 'Maxwell’s equations, plane waves, transmission lines, Smith chart, waveguides, fibres, antennas.',
      topics: [['e-maxwell', 'Maxwell’s equations'], ['e-plane', 'Plane waves'], ['e-tl', 'Transmission lines'], ['e-wg', 'Waveguides and optical fibres'], ['e-ant', 'Antennas and arrays']] }
  ];

  /* ---------- small helpers ---------- */
  function add(parent, tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  }
  GS.add = add;
  GS.f = function (v, d) {
    if (!isFinite(v)) return v > 0 ? '∞' : (v < 0 ? '−∞' : '—');
    var a = Math.abs(v);
    if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential((d || 3) - 1).replace('e+', 'e').replace('-', '−');
    return String(+v.toPrecision(d || 3)).replace('-', '−');
  };
  GS.si = function (v, d) {
    if (!isFinite(v)) return v > 0 ? '∞ ' : '— ';
    if (v === 0) return '0 ';
    var a = Math.abs(v), P = [[1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f']];
    for (var i = 0; i < P.length; i++) if (a >= P[i][0] * 0.9995) return String(+(v / P[i][0]).toPrecision(d || 3)).replace('-', '−') + ' ' + P[i][1];
    return v.toExponential(2) + ' ';
  };
  GS.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  GS.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* deterministic pseudo-random generator so plots do not flicker between redraws */
  GS.rng = function (seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  };
  GS.gauss = function (r) { var u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ---------- theme colours for canvas ---------- */
  var _c = null;
  GS.colors = function () {
    if (_c) return _c;
    var s = getComputedStyle(document.documentElement), g = function (n) { return s.getPropertyValue(n).trim(); };
    _c = { ink: g('--ink'), mute: g('--mute'), grid: g('--grid'), line: g('--line'), bg: g('--surface'), sunk: g('--sunk'),
      a: g('--t1'), b: g('--t2'), c: g('--t3'), d: g('--t4'), bad: g('--crit'), good: g('--good') };
    return _c;
  };

  /* ---------- Plot: thin canvas helper ---------- */
  var FONT = '11.5px "IBM Plex Mono", ui-monospace, Menlo, monospace';
  function niceTicks(a, b, n) {
    var raw = (b - a) / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p, out = [];
    for (var v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }
  function tfmt(v) {
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1e5 || a < 1e-3) return v.toExponential(0).replace('e+', 'e');
    return String(+v.toPrecision(4));
  }
  function Plot(parent, h) {
    this.cv = document.createElement('canvas');
    this.h = h; this.cv.style.height = h + 'px';
    parent.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d');
    this.w = 600; this.b = { L: 0, T: 0, W: 600, H: h }; this.xr = [0, 1]; this.yr = [0, 1];
  }
  Plot.prototype = {
    setH: function (h) { if (h !== this.h) { this.h = h; this.cv.style.height = h + 'px'; } return this; },
    begin: function () {
      var w = this.cv.clientWidth || 600, d = window.devicePixelRatio || 1;
      var W = Math.round(w * d), H = Math.round(this.h * d);
      if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
      this.w = w; var c = this.ctx;
      c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, this.h); c.font = FONT; c.lineJoin = 'round'; c.lineCap = 'round';
      this.C = GS.colors();
      return this;
    },
    frame: function (o) {
      var c = this.ctx, C = this.C, fb = o.box || [0, 0, 1, 1];
      var m = o.m || [o.yl ? 58 : 46, 12, 14, o.xl ? 40 : 24];
      var L = fb[0] * this.w + m[0], T = fb[1] * this.h + m[1], W = fb[2] * this.w - m[0] - m[2], H = fb[3] * this.h - m[1] - m[3];
      if (W < 20) W = 20; if (H < 20) H = 20;
      var x = o.x.slice(), y = o.y.slice();
      if (o.equal) {
        var sx = W / (x[1] - x[0]), sy = H / (y[1] - y[0]), half;
        if (sx > sy) { var cx = (x[0] + x[1]) / 2; half = W / sy / 2; x = [cx - half, cx + half]; }
        else { var cy = (y[0] + y[1]) / 2; half = H / sx / 2; y = [cy - half, cy + half]; }
      }
      this.b = { L: L, T: T, W: W, H: H }; this.xr = x; this.yr = y;
      if (o.bare) return this;
      var self = this;
      var xt = o.xticks || niceTicks(x[0], x[1], o.nx || Math.max(2, Math.round(W / 75)));
      var yt = o.yticks || niceTicks(y[0], y[1], o.ny || Math.max(2, Math.round(H / 38)));
      c.setLineDash([]); c.lineWidth = 1; c.strokeStyle = C.grid; c.beginPath();
      xt.forEach(function (v) { var px = Math.round(self.X(v)) + 0.5; c.moveTo(px, T); c.lineTo(px, T + H); });
      yt.forEach(function (v) { var py = Math.round(self.Y(v)) + 0.5; c.moveTo(L, py); c.lineTo(L + W, py); });
      c.stroke();
      c.strokeStyle = C.mute; c.globalAlpha = 0.6; c.beginPath();
      if (y[0] < 0 && y[1] > 0) { var py0 = Math.round(this.Y(0)) + 0.5; c.moveTo(L, py0); c.lineTo(L + W, py0); }
      if (x[0] < 0 && x[1] > 0) { var px0 = Math.round(this.X(0)) + 0.5; c.moveTo(px0, T); c.lineTo(px0, T + H); }
      c.stroke(); c.globalAlpha = 1;
      c.strokeStyle = C.line; c.strokeRect(Math.round(L) + 0.5, Math.round(T) + 0.5, Math.round(W), Math.round(H));
      c.fillStyle = C.mute; c.font = FONT; c.textAlign = 'center'; c.textBaseline = 'top';
      var xf = o.xfmt || tfmt, yf = o.yfmt || tfmt;
      if (!o.noxt) xt.forEach(function (v) { c.fillText(xf(v), self.X(v), T + H + 5); });
      c.textAlign = 'right'; c.textBaseline = 'middle';
      if (!o.noyt) yt.forEach(function (v) { c.fillText(yf(v), L - 6, self.Y(v)); });
      if (o.xl) { c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(o.xl, L + W / 2, T + H + m[3] - 3); }
      if (o.yl) { c.save(); c.translate(fb[0] * this.w + 11, T + H / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.yl, 0, 0); c.restore(); }
      if (o.title) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = C.ink; c.fillText(o.title, L + 7, T + 6); }
      return this;
    },
    X: function (x) { return this.b.L + (x - this.xr[0]) / (this.xr[1] - this.xr[0]) * this.b.W; },
    Y: function (y) { return this.b.T + this.b.H - (y - this.yr[0]) / (this.yr[1] - this.yr[0]) * this.b.H; },
    clip: function (fn) { var c = this.ctx, b = this.b; c.save(); c.beginPath(); c.rect(b.L, b.T, b.W, b.H); c.clip(); fn(); c.restore(); },
    _stroke: function (col, lw, dash) { var c = this.ctx; c.strokeStyle = col; c.lineWidth = lw || 2; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); },
    path: function (xs, ys, col, lw, dash) {
      var self = this, c = this.ctx;
      this.clip(function () {
        c.beginPath(); var pen = false;
        for (var i = 0; i < xs.length; i++) {
          var y = ys[i];
          if (!isFinite(y) || !isFinite(xs[i])) { pen = false; continue; }
          var px = self.X(xs[i]), py = GS.clamp(self.Y(y), -4000, 4000);
          if (pen) c.lineTo(px, py); else c.moveTo(px, py);
          pen = true;
        }
        self._stroke(col, lw, dash);
      });
      return this;
    },
    fn: function (f, col, lw, dash, n) {
      n = n || Math.max(240, Math.round(this.b.W * 1.5));
      var xs = new Array(n + 1), ys = new Array(n + 1), a = this.xr[0], w = this.xr[1] - a;
      for (var i = 0; i <= n; i++) { xs[i] = a + w * i / n; ys[i] = f(xs[i]); }
      return this.path(xs, ys, col, lw, dash);
    },
    area: function (xs, ys, col, alpha, base) {
      var self = this, c = this.ctx; base = base || 0;
      this.clip(function () {
        c.beginPath(); c.moveTo(self.X(xs[0]), self.Y(base));
        for (var i = 0; i < xs.length; i++) c.lineTo(self.X(xs[i]), GS.clamp(self.Y(isFinite(ys[i]) ? ys[i] : base), -4000, 4000));
        c.lineTo(self.X(xs[xs.length - 1]), self.Y(base)); c.closePath();
        c.globalAlpha = alpha == null ? 0.18 : alpha; c.fillStyle = col; c.fill(); c.globalAlpha = 1;
      });
      return this;
    },
    rect: function (x0, y0, x1, y1, col, alpha) {
      var self = this, c = this.ctx;
      this.clip(function () {
        c.globalAlpha = alpha == null ? 0.15 : alpha; c.fillStyle = col;
        var px = self.X(x0), py = self.Y(y1); c.fillRect(px, py, self.X(x1) - px, self.Y(y0) - py); c.globalAlpha = 1;
      });
      return this;
    },
    seg: function (x1, y1, x2, y2, col, lw, dash) {
      var self = this, c = this.ctx;
      this.clip(function () { c.beginPath(); c.moveTo(self.X(x1), self.Y(y1)); c.lineTo(self.X(x2), self.Y(y2)); self._stroke(col, lw || 1.5, dash); });
      return this;
    },
    vline: function (x, col, dash, lw) { return this.seg(x, this.yr[0], x, this.yr[1], col, lw || 1.2, dash || [5, 4]); },
    hline: function (y, col, dash, lw) { return this.seg(this.xr[0], y, this.xr[1], y, col, lw || 1.2, dash || [5, 4]); },
    dot: function (x, y, col, r, hollow) {
      var c = this.ctx, px = this.X(x), py = this.Y(y), b = this.b;
      if (px < b.L - 1 || px > b.L + b.W + 1 || py < b.T - 1 || py > b.T + b.H + 1) return this;
      c.beginPath(); c.arc(px, py, r || 4.5, 0, 6.2832);
      if (hollow) { c.fillStyle = this.C.bg; c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke(); }
      else { c.fillStyle = col; c.fill(); }
      return this;
    },
    cross: function (x, y, col, r) {
      var c = this.ctx, px = this.X(x), py = this.Y(y); r = r || 6;
      c.beginPath(); c.moveTo(px - r, py - r); c.lineTo(px + r, py + r); c.moveTo(px - r, py + r); c.lineTo(px + r, py - r);
      c.strokeStyle = col; c.lineWidth = 2.5; c.stroke(); return this;
    },
    circle: function (x, y, r, col, lw, dash) {
      var self = this, c = this.ctx;
      this.clip(function () { c.beginPath(); c.arc(self.X(x), self.Y(y), Math.abs(self.X(x + r) - self.X(x)), 0, 6.2832); self._stroke(col, lw || 1.2, dash); });
      return this;
    },
    arrow: function (x1, y1, x2, y2, col, lw) {
      var c = this.ctx, ax = this.X(x1), ay = this.Y(y1), bx = this.X(x2), by = this.Y(y2);
      var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); this._stroke(col, lw || 2);
      if (len > 6) {
        var ux = dx / len, uy = dy / len, s = Math.min(9, len * 0.5);
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - ux * s - uy * s * 0.5, by - uy * s + ux * s * 0.5); c.lineTo(bx - ux * s + uy * s * 0.5, by - uy * s - ux * s * 0.5); c.closePath();
        c.fillStyle = col; c.fill();
      }
      return this;
    },
    stem: function (xs, ys, col, r) {
      var self = this, c = this.ctx;
      this.clip(function () {
        c.beginPath();
        for (var i = 0; i < xs.length; i++) { c.moveTo(self.X(xs[i]), self.Y(0)); c.lineTo(self.X(xs[i]), self.Y(ys[i])); }
        self._stroke(col, 2);
        c.fillStyle = col;
        for (var j = 0; j < xs.length; j++) { c.beginPath(); c.arc(self.X(xs[j]), self.Y(ys[j]), r || 3.2, 0, 6.2832); c.fill(); }
      });
      return this;
    },
    text: function (s, x, y, col, align, dx, dy) {
      var c = this.ctx; c.font = FONT; c.fillStyle = col || this.C.ink; c.textAlign = align || 'left'; c.textBaseline = 'middle';
      c.fillText(s, this.X(x) + (dx || 0), this.Y(y) + (dy || 0)); return this;
    },
    label: function (s, px, py, col, align) {
      var c = this.ctx; c.font = FONT; c.fillStyle = col || this.C.ink; c.textAlign = align || 'left'; c.textBaseline = 'middle';
      c.fillText(s, px, py); return this;
    },
    legend: function (items, corner) {
      var c = this.ctx, b = this.b; c.font = FONT; c.textBaseline = 'middle';
      var left = corner === 'left';
      for (var i = 0; i < items.length; i++) {
        var y = b.T + 12 + i * 15, tw = c.measureText(items[i][0]).width;
        var x = left ? b.L + 10 : b.L + b.W - 10 - tw - 20;
        c.fillStyle = this.C.bg; c.globalAlpha = 0.75; c.fillRect(x - 3, y - 7, tw + 26, 14); c.globalAlpha = 1;
        c.strokeStyle = items[i][1]; c.lineWidth = 2.5; c.setLineDash(items[i][2] || []); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 15, y); c.stroke(); c.setLineDash([]);
        c.fillStyle = this.C.ink; c.textAlign = 'left'; c.fillText(items[i][0], x + 20, y);
      }
      return this;
    }
  };
  GS.Plot = Plot;

  /* ---------- Sim: one interactive panel ---------- */
  var uid = 0, live = [], io = null, ro = null;
  function Sim(el, name) {
    this.el = el; this.name = name; el.innerHTML = '';
    this.t = 0; this.playing = false; this.anim = false; this.visible = false; this.dirty = true; this.draw = null; this.id = 'sim' + (++uid); this.n = 0;
    this.hd = add(el, 'div', 'sim-hd'); this.ctl = add(el, 'div', 'sim-ctl'); this.stage = add(el, 'div', 'sim-stage'); this.out = add(el, 'div', 'sim-out');
  }
  Sim.prototype = {
    title: function (t, d) { this.hd.innerHTML = '<span class="sim-tag">Interactive</span><h4>' + t + '</h4>' + (d ? '<p>' + d + '</p>' : ''); },
    kick: function () { this.dirty = true; },
    _id: function () { return this.id + '-' + (++this.n); },
    slider: function (label, min, max, step, val, unit, f) {
      var S = this, id = this._id(), w = add(this.ctl, 'label', 'ctl'); w.htmlFor = id;
      var top = add(w, 'span', 'ctl-l', '<span>' + label + '</span>'), out = add(top, 'output');
      var inp = add(w, 'input'); inp.type = 'range'; inp.id = id; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
      var show = function () { out.textContent = (f ? f(+inp.value) : GS.f(+inp.value, 4)) + (unit ? ' ' + unit : ''); };
      inp.addEventListener('input', function () { show(); S.kick(); }); show();
      return { el: inp, get v() { return +inp.value; }, set: function (v) { inp.value = v; show(); } };
    },
    lslider: function (label, min, max, val, unit, f) {
      var S = this, id = this._id(), w = add(this.ctl, 'label', 'ctl'); w.htmlFor = id;
      var top = add(w, 'span', 'ctl-l', '<span>' + label + '</span>'), out = add(top, 'output');
      var inp = add(w, 'input'); inp.type = 'range'; inp.id = id; inp.min = Math.log10(min); inp.max = Math.log10(max); inp.step = 0.01; inp.value = Math.log10(val);
      var get = function () { return Math.pow(10, +inp.value); };
      var show = function () { out.textContent = f ? f(get()) : GS.si(get()) + (unit || ''); };
      inp.addEventListener('input', function () { show(); S.kick(); }); show();
      return { el: inp, get v() { return get(); }, set: function (v) { inp.value = Math.log10(v); show(); } };
    },
    select: function (label, opts, val) {
      var S = this, id = this._id(), w = add(this.ctl, 'label', 'ctl'); w.htmlFor = id;
      add(w, 'span', 'ctl-l', '<span>' + label + '</span>');
      var sel = add(w, 'select'); sel.id = id;
      opts.forEach(function (o) { var op = add(sel, 'option'); op.value = o[0]; op.textContent = o[1]; });
      if (val != null) sel.value = val;
      var api = { el: sel, get v() { return sel.value; }, set: function (v) { sel.value = v; }, onchange: null };
      sel.addEventListener('change', function () { if (api.onchange) api.onchange(sel.value); S.kick(); });
      return api;
    },
    check: function (label, val) {
      var S = this, id = this._id(), w = add(this.ctl, 'label', 'ctl chk'); w.htmlFor = id;
      var inp = add(w, 'input'); inp.type = 'checkbox'; inp.id = id; inp.checked = !!val; add(w, 'span', '', label);
      inp.addEventListener('change', function () { S.kick(); });
      return { el: inp, get v() { return inp.checked; } };
    },
    number: function (label, val, step) {
      var S = this, id = this._id(), w = add(this.ctl, 'label', 'ctl'); w.htmlFor = id;
      add(w, 'span', 'ctl-l', '<span>' + label + '</span>');
      var inp = add(w, 'input'); inp.type = 'number'; inp.id = id; inp.value = val; inp.step = step || 'any';
      inp.addEventListener('input', function () { S.kick(); });
      return { el: inp, get v() { return parseFloat(inp.value); }, set: function (v) { inp.value = v; } };
    },
    button: function (label, fn, cls) {
      var S = this, b = add(this.ctl, 'button', 'btn' + (cls ? ' ' + cls : ''), label); b.type = 'button';
      b.addEventListener('click', function () { fn(); S.kick(); });
      return b;
    },
    canvas: function (h) { return new Plot(this.stage, h); },
    dom: function (cls) { return add(this.stage, 'div', 'sim-dom' + (cls ? ' ' + cls : '')); },
    animate: function () {
      var S = this; this.anim = true; this.playing = !GS.reduced;
      var b = add(this.ctl, 'button', 'btn play'); b.type = 'button';
      var lab = function () { b.textContent = S.playing ? 'Pause' : 'Play'; b.setAttribute('aria-pressed', S.playing ? 'true' : 'false'); };
      b.addEventListener('click', function () { S.playing = !S.playing; lab(); S.kick(); }); lab();
      this.playBtn = b; return this;
    },
    show: function (html) { if (this._last !== html) { this.out.innerHTML = html; this._last = html; } },
    fail: function (e) { this.draw = null; this.out.innerHTML = '<span class="wide">This simulation hit an error and stopped: ' + String(e && e.message || e) + '</span>'; }
  };

  function loop(ts) {
    var dt = Math.min(0.05, (ts - (loop.last || ts)) / 1000); loop.last = ts;
    for (var i = 0; i < live.length; i++) {
      var s = live[i];
      if (!s.visible || !s.draw) continue;
      var step = 0;
      if (s.anim && s.playing) { step = dt; s.t += dt; s.dirty = true; }
      if (s.dirty) { s.dirty = false; try { s.draw(s.t, step); } catch (e) { console.error('sim ' + s.name, e); s.fail(e); } }
    }
    requestAnimationFrame(loop);
  }
  GS.redrawAll = function () { live.forEach(function (s) { s.dirty = true; }); };
  function themeChanged() { _c = null; GS.redrawAll(); }

  function mountSims(root) {
    if (io) io.disconnect(); if (ro) ro.disconnect();
    live.length = 0;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var s = e.target._sim; if (s) { s.visible = e.isIntersecting; if (s.visible) s.dirty = true; } });
    }, { rootMargin: '150px 0px' });
    ro = new ResizeObserver(function (es) { es.forEach(function (e) { var s = e.target._sim; if (s) s.dirty = true; }); });
    Array.prototype.forEach.call(root.querySelectorAll('.sim[data-sim]'), function (el) {
      var name = el.getAttribute('data-sim'), fn = GS.sims[name];
      if (!fn) { el.textContent = 'Simulation "' + name + '" is not available.'; return; }
      var s = new Sim(el, name); el._sim = s;
      try { fn(s); } catch (e) { console.error('sim init ' + name, e); s.fail(e); }
      live.push(s); io.observe(el); ro.observe(el);
    });
  }
  GS.sim = function (name, fn) { GS.sims[name] = fn; };

  /* ---------- math ---------- */
  GS.math = function (root) {
    if (!window.katex) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf('\\(') >= 0 || n.nodeValue.indexOf('\\[') >= 0) nodes.push(n);
    var re = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
    nodes.forEach(function (node) {
      var s = node.nodeValue, frag = document.createDocumentFragment(), i = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(s))) {
        if (m.index > i) frag.appendChild(document.createTextNode(s.slice(i, m.index)));
        var disp = m[2] !== undefined, sp = document.createElement('span');
        if (disp) sp.className = 'eq';
        try { window.katex.render(disp ? m[2] : m[1], sp, { displayMode: disp, throwOnError: false }); } catch (e) { sp.textContent = m[0]; }
        frag.appendChild(sp); i = m.index + m[0].length;
      }
      if (i < s.length) frag.appendChild(document.createTextNode(s.slice(i)));
      node.parentNode.replaceChild(frag, node);
    });
  };

  /* ---------- progress ---------- */
  var KEY = 'gate-ec-lab-done', done;
  try { done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { done = new Set(); }
  function saveDone() { try { localStorage.setItem(KEY, JSON.stringify(Array.from(done))); } catch (e) { /* storage unavailable: progress lasts for this visit only */ } }
  function secDone(sec) { return sec.topics.filter(function (t) { return done.has(t[0]); }).length; }
  function paintProgress() {
    var all = 0, got = 0;
    GS.sections.forEach(function (sec) {
      var d = secDone(sec), n = sec.topics.length; all += n; got += d;
      Array.prototype.forEach.call(document.querySelectorAll('[data-pg="' + sec.id + '"]'), function (el) {
        el.textContent = d + '/' + n; el.classList.toggle('full', d === n);
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-bar="' + sec.id + '"]'), function (el) { el.style.width = (100 * d / n) + '%'; });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-bar="all"]'), function (el) { el.style.width = (100 * got / all) + '%'; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pg="all"]'), function (el) { el.textContent = got + ' of ' + all + ' topics done'; });
  }

  /* ---------- router ---------- */
  var cache = {}, current = null, homeEl, viewEl;
  function decorate(sec) {
    var idx = GS.sections.indexOf(sec);
    var hd = viewEl.querySelector('.sec-hd');
    var chips = document.createElement('ul'); chips.className = 'chips'; chips.setAttribute('aria-label', 'Topics in this section');
    Array.prototype.forEach.call(viewEl.querySelectorAll('.topic'), function (tp) {
      var id = tp.id, h2 = tp.querySelector('h2');
      var wrap = document.createElement('div'); wrap.className = 'topic-hd'; tp.insertBefore(wrap, h2); wrap.appendChild(h2);
      var lab = add(wrap, 'label', 'done-box'), cb = add(lab, 'input'); cb.type = 'checkbox'; cb.id = 'done-' + id; cb.checked = done.has(id);
      add(lab, 'span', '', 'Done');
      var li = add(chips, 'li'), btn = add(li, 'button', done.has(id) ? 'done' : '', h2.textContent); btn.type = 'button';
      btn.addEventListener('click', function () { tp.scrollIntoView({ behavior: GS.reduced ? 'auto' : 'smooth', block: 'start' }); });
      cb.addEventListener('change', function () { if (cb.checked) done.add(id); else done.delete(id); btn.classList.toggle('done', cb.checked); saveDone(); paintProgress(); });
    });
    if (hd) hd.appendChild(chips);
    var pager = add(viewEl, 'nav', 'pager'); pager.setAttribute('aria-label', 'Sections');
    var prev = GS.sections[idx - 1], next = GS.sections[idx + 1];
    pager.innerHTML = (prev ? '<a href="#' + prev.id + '">← ' + prev.n + '. ' + prev.title + '</a>' : '<a href="#home">← Overview</a>') +
      (next ? '<a href="#' + next.id + '">' + next.n + '. ' + next.title + ' →</a>' : '<a href="#home">Back to overview →</a>');
    GS.math(viewEl);
    mountSims(viewEl);
  }
  function route() {
    var id = (location.hash || '').replace('#', '') || 'home';
    var sec = GS.sections.filter(function (s) { return s.id === id; })[0];
    current = sec ? id : 'home';
    Array.prototype.forEach.call(document.querySelectorAll('.rail nav a'), function (a) {
      if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    if (!sec) {
      if (io) io.disconnect(); live.length = 0; viewEl.innerHTML = ''; viewEl.hidden = true; homeEl.hidden = false;
      document.title = 'GATE EC Concept Lab'; paintProgress(); return;
    }
    homeEl.hidden = true; viewEl.hidden = false; document.title = sec.title + ' · GATE EC Concept Lab';
    if (cache[id]) { viewEl.innerHTML = cache[id]; decorate(sec); return; }
    viewEl.innerHTML = '<p class="loading">Loading ' + sec.title + '…</p>';
    fetch('sections/' + id + '.html').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(function (html) {
      cache[id] = html; if (current !== id) return; viewEl.innerHTML = html; decorate(sec);
    }).catch(function (e) {
      if (current !== id) return;
      viewEl.innerHTML = '<p class="err">This section could not be loaded (' + e.message + '). Check your connection and reload the page.</p>';
    });
  }

  GS.boot = function () {
    homeEl = document.getElementById('home'); viewEl = document.getElementById('view');
    var nav = document.getElementById('nav');
    nav.innerHTML = '<a href="#home"><span class="n">0</span><span>Overview</span><span></span></a>' + GS.sections.map(function (s) {
      return '<a href="#' + s.id + '"><span class="n">' + s.n + '</span><span>' + s.short + '</span><span class="pg" data-pg="' + s.id + '"></span></a>';
    }).join('');
    var cards = document.getElementById('cards');
    if (cards) cards.innerHTML = GS.sections.map(function (s) {
      return '<a class="card" href="#' + s.id + '"><span class="n">Section ' + s.n + ' · ' + s.marks + ' marks</span><b>' + s.title + '</b><p>' + s.blurb + '</p>' +
        '<span class="row"><span>' + s.topics.length + ' topics · ' + s.sims + ' simulations</span><span data-pg="' + s.id + '"></span></span>' +
        '<span class="meter"><i data-bar="' + s.id + '"></i></span></a>';
    }).join('');
    GS.math(homeEl);
    new MutationObserver(themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', themeChanged); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(GS.redrawAll);
    window.addEventListener('hashchange', route);
    window.addEventListener('resize', GS.redrawAll);
    route(); paintProgress();
    requestAnimationFrame(loop);
  };
})();
