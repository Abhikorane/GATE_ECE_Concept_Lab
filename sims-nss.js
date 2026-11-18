/* Section 2: Networks, Signals and Systems */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, si = GS.si, sin = Math.sin, cos = Math.cos, PI = Math.PI, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs;

  /* unit-step response of wn^2/(s^2+2 z wn s+wn^2) */
  GS.step2 = function (z, wn, t) {
    if (t < 0) return 0;
    var a = z * wn;
    if (z < 1 - 1e-6) { var wd = wn * sqrt(1 - z * z); return 1 - exp(-a * t) * (cos(wd * t) + a / wd * sin(wd * t)); }
    if (z < 1 + 1e-6) return 1 - exp(-wn * t) * (1 + wn * t);
    var r = wn * sqrt(z * z - 1), s1 = -a + r, s2 = -a - r;
    return 1 - (s2 * exp(s1 * t) - s1 * exp(s2 * t)) / (s2 - s1);
  };
  /* two-panel layout that stacks on narrow screens */
  GS.split = function (p, wide, hWide, hNarrow) {
    var narrow = (p.cv.clientWidth || 600) < 540;
    p.setH(narrow ? hNarrow : hWide);
    return narrow ? [[0, 0, 1, 0.46], [0, 0.46, 1, 0.54]] : [[0, 0, wide, 1], [wide, 0, 1 - wide, 1]];
  };

  GS.sim('maxpower', function (S) {
    S.title('Maximum power transfer', 'A source with Thevenin resistance Rₜₕ drives a load Rₗ. Slide the load and watch the power it receives.');
    var V = S.slider('Vₜₕ', 1, 24, 1, 12, 'V'), R = S.slider('Rₜₕ', 1, 100, 1, 6, 'Ω'), k = S.slider('Rₗ / Rₜₕ', 0.05, 5, 0.05, 1);
    var p = S.canvas(270);
    S.draw = function () {
      var v = V.v, r = R.v, rl = k.v * r, pm = v * v / (4 * r), C;
      var P = function (x) { return v * v * x / ((r + x) * (r + x)); };
      p.begin(); C = p.C; p.frame({ x: [0, 5 * r], y: [0, pm * 1.2], xl: 'load resistance Rₗ (Ω)', yl: 'load power (W)' });
      p.fn(P, C.a, 2.2); p.hline(pm, C.mute); p.vline(r, C.mute); p.text('Rₗ = Rₜₕ', r, pm * 1.2, C.mute, 'left', 5, 12);
      p.dot(rl, P(rl), C.b, 5.5);
      var i = v / (r + rl), eta = rl / (r + rl);
      S.show('<span>Rₗ = <b>' + f(rl) + ' Ω</b></span><span>I = <b>' + si(i) + 'A</b></span><span>Pₗ = <b>' + si(P(rl)) + 'W</b></span><span>Pₘₐₓ = V²/4R = <b>' + si(pm) + 'W</b></span><span>efficiency = <b>' + f(100 * eta) + ' %</b></span>' +
        '<span class="wide">At the peak the efficiency is only 50 %: as much power is burned in Rₜₕ as reaches the load. Efficiency keeps rising as Rₗ grows, which is why power grids never run matched.</span>');
    };
  });

  GS.sim('phasor', function (S) {
    S.title('Phasors, power factor and complex power', 'A 230 V (rms), 50 Hz supply feeds an impedance |Z|∠φ. Positive φ is an inductive load: the current phasor trails the voltage phasor.');
    var Z = S.slider('|Z|', 5, 100, 1, 23, 'Ω'), ph = S.slider('φ', -90, 90, 1, 37, '°');
    var p = S.canvas(300); S.animate();
    S.draw = function (t) {
      var bx = GS.split(p, 0.36, 300, 520), phi = ph.v * PI / 180, th = t * 1.6, C;
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, noxt: true, noyt: true, m: [14, 12, 10, 14] });
      p.circle(0, 0, 1, C.grid, 1);
      p.arrow(0, 0, cos(th), sin(th), C.a, 2.5); p.arrow(0, 0, 0.75 * cos(th - phi), 0.75 * sin(th - phi), C.b, 2.5);
      p.text('V', 1.1 * cos(th), 1.1 * sin(th), C.a, 'center'); p.text('I', 0.9 * cos(th - phi), 0.9 * sin(th - phi), C.b, 'center');
      var cur = th % (4 * PI);
      p.frame({ box: bx[1], x: [0, 4 * PI], y: [-1.15, 1.15], xl: 'ωt (rad)', xticks: [0, PI, 2 * PI, 3 * PI, 4 * PI], xfmt: function (v) { var n = Math.round(v / PI); return n === 0 ? '0' : (n === 1 ? 'π' : n + 'π'); } });
      var xs = [], pv = [], i; for (i = 0; i <= 300; i++) { var x = i / 300 * 4 * PI; xs.push(x); pv.push(cos(x) * 0.75 * cos(x - phi)); }
      p.area(xs, pv, C.d, 0.22);
      p.fn(function (x) { return cos(x); }, C.a, 2); p.fn(function (x) { return 0.75 * cos(x - phi); }, C.b, 2); p.path(xs, pv, C.d, 1.6);
      p.hline(0.375 * cos(phi), C.d); p.vline(cur, C.mute, [3, 3]);
      p.dot(cur, cos(cur), C.a, 4); p.dot(cur, 0.75 * cos(cur - phi), C.b, 4);
      p.legend([['v(t)', C.a], ['i(t)', C.b], ['p(t) = v·i', C.d]]);
      var I = 230 / Z.v, Sva = 230 * I, P = Sva * cos(phi), Q = Sva * sin(phi), pf = cos(phi);
      var kind = abs(ph.v) < 0.5 ? 'unity' : (ph.v > 0 ? 'lagging' : 'leading');
      S.show('<span>I = <b>' + f(I) + ' A</b></span><span class="k4">P = <b>' + si(P) + 'W</b></span><span>Q = <b>' + si(Q) + 'VAR</b></span><span>|S| = <b>' + si(Sva) + 'VA</b></span><span>pf = <b>' + f(pf) + ' ' + kind + '</b></span><span>Z = <b>' + f(Z.v * cos(phi)) + (phi < 0 ? ' − j' : ' + j') + f(abs(Z.v * sin(phi))) + ' Ω</b></span>' +
        '<span class="wide">' + (ph.v > 0.5 ? 'To correct this load to unity power factor, a parallel capacitor must supply ' + si(Q) + 'VAR: C = Q/(ωV²) = ' + si(Q / (2 * PI * 50 * 230 * 230)) + 'F.' : (ph.v < -0.5 ? 'A capacitive load: the current leads. Average power is still V·I·cosφ.' : 'Purely resistive: p(t) never goes negative, so no energy sloshes back to the source.')) + ' The dashed green line is the average of p(t), which is P.</span>');
    };
  });

  GS.sim('rlc', function (S) {
    S.title('Series RLC step response', 'A 1 V step is applied to a series RLC circuit and the capacitor voltage is plotted. Reduce R to see it ring. The dashed line shows the critically damped response for the same L and C.');
    var R = S.slider('R', 0, 200, 1, 8, 'Ω'), L = S.slider('L', 1, 100, 1, 10, 'mH'), Cc = S.slider('C', 1, 100, 1, 100, 'µF');
    var p = S.canvas(290);
    S.draw = function () {
      var r = R.v, l = L.v * 1e-3, c = Cc.v * 1e-6, w0 = 1 / sqrt(l * c), al = r / (2 * l), z = al / w0, C;
      var slow = z < 1 ? Math.max(al, w0 / 40) : w0 * (z - sqrt(Math.max(0, z * z - 1)));
      var T = Math.max(6 / slow, 8 / w0), ymax = z < 1 ? 2.05 : 1.3;
      p.begin(); C = p.C; p.frame({ x: [0, T * 1e3], y: [0, ymax], xl: 'time (ms)', yl: 'v_C (V)' });
      p.hline(1, C.mute);
      p.fn(function (ms) { return GS.step2(1, w0, ms * 1e-3); }, C.mute, 1.5, [6, 4]);
      p.fn(function (ms) { return GS.step2(z, w0, ms * 1e-3); }, C.a, 2.4, null, 800);
      var kind = z < 1 - 1e-6 ? ['underdamped', 'mid'] : (z < 1 + 1e-6 ? ['critically damped', 'ok'] : ['overdamped', 'ok']);
      if (r === 0) kind = ['undamped: oscillates forever', 'bad'];
      var out = '<span><span class="pill ' + kind[1] + '">' + kind[0] + '</span></span><span>ζ = (R/2)√(C/L) = <b>' + f(z) + '</b></span><span>ω₀ = <b>' + f(w0) + ' rad/s</b> (' + f(w0 / (2 * PI)) + ' Hz)</span><span>α = R/2L = <b>' + f(al) + ' s⁻¹</b></span><span>R for critical damping = 2√(L/C) = <b>' + f(2 * sqrt(l / c)) + ' Ω</b></span>';
      if (z < 1 - 1e-6) out += '<span>ω_d = <b>' + f(w0 * sqrt(1 - z * z)) + ' rad/s</b></span><span>overshoot = <b>' + (z > 0 ? f(100 * exp(-PI * z / sqrt(1 - z * z))) : '100') + ' %</b></span><span>Q = 1/2ζ = <b>' + (z > 0 ? f(1 / (2 * z)) : '∞') + '</b></span>';
      S.show(out);
    };
  });

  GS.sim('convolution', function (S) {
    S.title('Convolution: flip, slide, multiply, integrate', 'h is flipped to h(t−τ) and slid along the τ axis. At each position t, the shaded area under the product x(τ)·h(t−τ) is the output y(t).');
    var sig = {
      rect: function (t) { return t >= 0 && t <= 1 ? 1 : 0; },
      wide: function (t) { return t >= 0 && t <= 2 ? 1 : 0; },
      exp: function (t) { return t >= 0 ? exp(-t) : 0; },
      tri: function (t) { return t >= 0 && t <= 2 ? 1 - abs(t - 1) : 0; },
      ramp: function (t) { return t >= 0 && t <= 1 ? t : 0; }
    };
    var opts = [['rect', 'Pulse, width 1'], ['wide', 'Pulse, width 2'], ['exp', 'e^(−t) u(t)'], ['tri', 'Triangle'], ['ramp', 'Ramp 0 to 1']];
    var xs = S.select('x(t)', opts, 'rect'), hs = S.select('h(t)', opts, 'exp'), ts = S.slider('t', -1, 6, 0.02, 0.8);
    var p = S.canvas(360); S.animate();
    var key = '', Y = [], T0 = -1, DT = 0.02, d = 0.01;
    function conv(x, h, t) { var s = 0; for (var u = -0.5; u <= 6.5; u += d) s += x(u) * h(t - u); return s * d; }
    S.draw = function (t, dt) {
      var x = sig[xs.v], h = sig[hs.v], C, i;
      if (key !== xs.v + hs.v) { key = xs.v + hs.v; Y = []; for (i = 0; i <= 350; i++) Y.push(conv(x, h, T0 + i * DT)); }
      if (S.playing) { var nv = ts.v + dt * 0.7; if (nv > 6) nv = -1; ts.set(nv); }
      var tt = ts.v;
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.5], x: [-3, 6.5], y: [-0.15, 1.3], xl: 'τ' });
      var us = [], pr = []; for (i = 0; i <= 475; i++) { var u = -3 + i * 0.02; us.push(u); pr.push(x(u) * h(tt - u)); }
      p.area(us, pr, C.d, 0.35);
      p.fn(x, C.a, 2.2, null, 950); p.fn(function (u2) { return h(tt - u2); }, C.b, 2.2, null, 950);
      p.vline(tt, C.mute, [3, 3]); p.text('τ = t', tt, 1.3, C.mute, 'left', 4, 10);
      p.legend([['x(τ)', C.a], ['h(t−τ)', C.b], ['product', C.d]]);
      var ymax = Math.max.apply(null, Y) * 1.25 || 1;
      p.frame({ box: [0, 0.5, 1, 0.5], x: [-3, 6.5], y: [-0.08 * ymax, ymax], xl: 't' });
      var tx = [], seen = []; for (i = 0; i < Y.length; i++) { tx.push(T0 + i * DT); seen.push(T0 + i * DT <= tt ? Y[i] : NaN); }
      p.path(tx, Y, C.mute, 1.3, [4, 4]); p.path(tx, seen, C.d, 2.6);
      var yi = Y[GS.clamp(Math.round((tt - T0) / DT), 0, Y.length - 1)];
      p.dot(tt, yi, C.d, 5.5); p.legend([['y(t) = x(t) * h(t)', C.d]]);
      S.show('<span>t = <b>' + f(tt) + '</b></span><span>y(t) = shaded area = <b>' + f(yi) + '</b></span><span class="wide">The output is non-zero only while the two shapes overlap, so the output starts at (start of x + start of h) and its duration is the sum of the two durations.</span>');
    };
  });

  GS.sim('fourier', function (S) {
    S.title('Fourier series: building a waveform from harmonics', 'Raise the number of harmonics. The overshoot next to each jump (Gibbs phenomenon) gets narrower but its height stays near 9 % of the jump.');
    var w = S.select('Waveform', [['sq', 'Square'], ['saw', 'Sawtooth'], ['tri', 'Triangle']]), N = S.slider('Highest harmonic', 1, 49, 1, 5);
    var p = S.canvas(380);
    var def = {
      sq: { ideal: function (x) { return sin(x) >= 0 ? 1 : -1; }, b: function (k) { return k % 2 ? 4 / (PI * k) : 0; }, s: '(4/π) Σ sin(kω₀t)/k, odd k only: amplitudes fall as 1/k' },
      saw: { ideal: function (x) { var u = ((x / PI + 1) % 2 + 2) % 2 - 1; return u; }, b: function (k) { return (k % 2 ? 1 : -1) * 2 / (PI * k); }, s: '(2/π) Σ (−1)^(k+1) sin(kω₀t)/k: all harmonics, falling as 1/k' },
      tri: { ideal: function (x) { return 2 / PI * Math.asin(sin(x)); }, b: function (k) { return k % 2 ? 8 / (PI * PI * k * k) * ((k - 1) / 2 % 2 ? -1 : 1) : 0; }, s: '(8/π²) Σ ±sin(kω₀t)/k², odd k only: amplitudes fall as 1/k² (no jumps, so it converges fast)' }
    };
    S.draw = function () {
      var D = def[w.v], n = N.v, C, k;
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.6], x: [0, 4 * PI], y: [-1.45, 1.45], xl: 'ω₀t', xticks: [0, PI, 2 * PI, 3 * PI, 4 * PI], xfmt: function (v) { var m = Math.round(v / PI); return m === 0 ? '0' : (m === 1 ? 'π' : m + 'π'); } });
      p.fn(D.ideal, C.mute, 1.5, null, 1600);
      var sum = function (x) { var s = 0; for (var j = 1; j <= n; j++) { var b = D.b(j); if (b) s += b * sin(j * x); } return s; };
      p.fn(sum, C.a, 2.2, null, 1600);
      p.legend([['ideal', C.mute], ['sum up to k = ' + n, C.a]]);
      var ks = [], bs = []; for (k = 1; k <= 49; k++) { ks.push(k); bs.push(abs(D.b(k))); }
      p.frame({ box: [0, 0.6, 1, 0.4], x: [0, 50], y: [0, 1.4], xl: 'harmonic number k', yl: '|b_k|' });
      p.stem(ks.slice(n), bs.slice(n), C.mute, 2.2); p.stem(ks.slice(0, n), bs.slice(0, n), C.a, 3);
      var peak = 0; for (k = 0; k <= 4000; k++) peak = Math.max(peak, sum(k / 4000 * PI));
      S.show('<span>x(t) = <b>' + D.s + '</b></span><span>peak of the partial sum = <b>' + f(peak, 4) + '</b>' + (w.v === 'sq' ? ' (overshoot ' + f((peak - 1) * 50, 3) + ' % of the jump of 2)' : '') + '</span>');
    };
  });

  GS.sim('sampling', function (S) {
    S.title('Sampling and aliasing', 'A cosine of frequency f₀ is sampled at fₛ. Drop fₛ below 2f₀ and the samples fit a slower cosine just as well: that impostor is the alias.');
    var f0 = S.slider('Signal f₀', 1, 20, 0.5, 3, 'Hz'), fs = S.slider('Sampling rate fₛ', 2, 50, 0.5, 20, 'Hz');
    var p = S.canvas(380);
    S.draw = function () {
      var a = f0.v, s = fs.v, fa = abs(a - s * Math.round(a / s)), alias = s < 2 * a, C, n;
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.55], x: [0, 1], y: [-1.3, 1.3], xl: 'time (s)' });
      p.fn(function (t) { return cos(2 * PI * a * t); }, C.mute, 1.6, null, 1200);
      if (alias) p.fn(function (t) { return cos(2 * PI * fa * t); }, C.b, 2.2, [7, 4], 600);
      var tx = [], ty = []; for (n = 0; n / s <= 1.0001; n++) { tx.push(n / s); ty.push(cos(2 * PI * a * n / s)); }
      p.stem(tx, ty, C.a, 3.4);
      p.legend([['signal ' + f(a) + ' Hz', C.mute], ['samples', C.a]].concat(alias ? [['alias ' + f(fa) + ' Hz', C.b, [7, 4]]] : []));
      var F = Math.max(1.6 * s, 1.25 * a);
      p.frame({ box: [0, 0.55, 1, 0.45], x: [-F, F], y: [0, 1.25], xl: 'frequency (Hz)', noyt: true });
      p.rect(-s / 2, 0, s / 2, 1.25, C.d, 0.14); p.text('−fₛ/2 to fₛ/2', 0, 1.25, C.d, 'center', 0, 10);
      var rx = [], ry = [], k;
      for (k = -4; k <= 4; k++) { if (k === 0) continue; rx.push(a + k * s, -a + k * s); ry.push(0.8, 0.8); }
      p.stem(rx, ry, C.b, 3); p.stem([a, -a], [1, 1], C.a, 3.6);
      S.show('<span>Nyquist rate 2f₀ = <b>' + f(2 * a) + ' Hz</b></span><span>' + (alias ? '<span class="pill bad">aliasing</span>' : (s === 2 * a ? '<span class="pill mid">exactly at the limit</span>' : '<span class="pill ok">no aliasing</span>')) + '</span>' +
        (alias ? '<span>appears as |f₀ − k·fₛ| = <b>' + f(fa) + ' Hz</b></span>' : '') +
        '<span class="wide">Bottom plot: sampling copies the spectrum (blue) at every multiple of fₛ (orange copies). A low-pass filter keeps only the green band. ' + (alias ? 'An orange copy has landed inside the green band, so the filter outputs the wrong frequency.' : 'Only the original pair is inside the green band, so the signal is recovered exactly.') + '</span>');
    };
  });

  GS.sim('polezero', function (S) {
    S.title('Poles and zeros shape the frequency response', 'The point e^(jω) walks along the unit circle. |H| is the product of its distances to the zeros divided by the product of its distances to the poles. Passing close to a pole gives a peak; touching a zero gives a null.');
    var pr = S.slider('Pole radius', 0, 1.2, 0.01, 0.9), pa = S.slider('Pole angle', 0, 180, 1, 60, '°'), zr = S.slider('Zero radius', 0, 1.5, 0.01, 1), za = S.slider('Zero angle', 0, 180, 1, 120, '°');
    var p = S.canvas(300); S.animate();
    S.draw = function (t) {
      var bx = GS.split(p, 0.4, 300, 540), C;
      var P = [pr.v * cos(pa.v * PI / 180), pr.v * sin(pa.v * PI / 180)], Zr = [zr.v * cos(za.v * PI / 180), zr.v * sin(za.v * PI / 180)];
      var mag = function (w) {
        var x = cos(w), y = sin(w), dist = function (q, sgn) { return sqrt((x - q[0]) * (x - q[0]) + (y - sgn * q[1]) * (y - sgn * q[1])); };
        return dist(Zr, 1) * dist(Zr, -1) / Math.max(1e-9, dist(P, 1) * dist(P, -1));
      };
      var db = function (w) { return GS.clamp(20 * Math.log10(Math.max(1e-6, mag(w))), -60, 60); };
      var w0 = (t * 0.45) % PI, pt = [cos(w0), sin(w0)];
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, m: [30, 12, 10, 22], title: 'z-plane' });
      p.circle(0, 0, 1, C.mute, 1.4, [4, 3]);
      [1, -1].forEach(function (sg) { p.seg(pt[0], pt[1], P[0], sg * P[1], C.c, 1); p.seg(pt[0], pt[1], Zr[0], sg * Zr[1], C.d, 1); });
      [1, -1].forEach(function (sg) { p.cross(P[0], sg * P[1], C.c, 6); p.dot(Zr[0], sg * Zr[1], C.d, 5.5, true); });
      p.dot(pt[0], pt[1], C.b, 5);
      p.frame({ box: bx[1], x: [0, PI], y: [-50, 50], xl: 'ω (rad/sample)', yl: '|H| (dB)', xticks: [0, PI / 4, PI / 2, 3 * PI / 4, PI], xfmt: function (v) { return ['0', 'π/4', 'π/2', '3π/4', 'π'][Math.round(v / (PI / 4))]; } });
      p.fn(db, C.a, 2.3, null, 500); p.vline(w0, C.mute, [3, 3]); p.dot(w0, db(w0), C.b, 5);
      var st = pr.v < 1 ? ['stable', 'ok'] : (pr.v === 1 ? ['marginally stable', 'mid'] : ['unstable', 'bad']);
      S.show('<span>causal filter: <span class="pill ' + st[1] + '">' + st[0] + '</span></span><span class="k3">poles at ' + f(pr.v) + '∠±' + pa.v + '°</span><span class="k4">zeros at ' + f(zr.v) + '∠±' + za.v + '°</span><span>|H| at ω = ' + f(w0, 2) + ': <b>' + f(db(w0)) + ' dB</b></span>' +
        '<span class="wide">Pole angle θ maps to the frequency f = (θ/360°)·fₛ. Zeros exactly on the unit circle make a notch: with fₛ = 500 Hz, zeros at ±36° remove 50 Hz mains hum.</span>');
    };
  });
})();
