/* Section 4: Analog Circuits */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, si = GS.si, sin = Math.sin, PI = Math.PI, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs;
  GS.hz = function (v) { var e = Math.round(v), l = ['1', '10', '100', '1k', '10k', '100k', '1M', '10M', '100M', '1G', '10G']; return l[e] || ('1e' + e); };

  GS.sim('diodeckt', function (S) {
    S.title('Diode wave-shaping circuits', 'One sine-wave input, six classic circuits. Blue is the input, orange is the output. Set the diode drop to 0 to see the ideal-diode answer.');
    var ck = S.select('Circuit', [['hw', 'Half-wave rectifier'], ['fw', 'Bridge full-wave rectifier'], ['clip', 'Shunt clipper (clips the top)'], ['dclip', 'Double-ended clipper'], ['cup', 'Clamper (shifts the wave up)'], ['cdn', 'Clamper (shifts the wave down)']]);
    var Vm = S.slider('Input peak V_m', 1, 15, 0.5, 10, 'V'), VB = S.slider('Bias battery V_B', 0, 8, 0.5, 2, 'V'), Vg = S.slider('Diode drop V_γ', 0, 0.7, 0.1, 0.7, 'V');
    var p = S.canvas(290);
    S.draw = function () {
      var m = Vm.v, b = VB.v, g = Vg.v, k = ck.v, C, note;
      var vo = function (x) {
        var vi = m * sin(x);
        if (k === 'hw') return Math.max(vi - g, 0);
        if (k === 'fw') return Math.max(abs(vi) - 2 * g, 0);
        if (k === 'clip') return Math.min(vi, b + g);
        if (k === 'dclip') return GS.clamp(vi, -(b + g), b + g);
        if (k === 'cup') return vi + m + b - g;
        return vi - m + b + g;
      };
      var lo = -m * 1.15, hi = m * 1.15;
      if (k === 'cup') hi = Math.max(hi, (2 * m + b) * 1.08); if (k === 'cdn') { lo = Math.min(lo, (-2 * m + b) * 1.08); hi = Math.max(hi, (b + g) * 1.3); }
      p.begin(); C = p.C; p.frame({ x: [0, 4 * PI], y: [lo, hi], xl: 'ωt', yl: 'volts', xticks: [0, PI, 2 * PI, 3 * PI, 4 * PI], xfmt: function (v) { var n = Math.round(v / PI); return n === 0 ? '0' : (n === 1 ? 'π' : n + 'π'); } });
      p.fn(function (x) { return m * sin(x); }, C.a, 1.6); p.fn(vo, C.b, 2.6, null, 900);
      p.legend([['input', C.a], ['output', C.b]]);
      var n = 2000, sum = 0, sq = 0, i; for (i = 0; i < n; i++) { var y = vo(2 * PI * i / n); sum += y; sq += y * y; }
      var dc = sum / n, rms = sqrt(sq / n);
      if (k === 'hw') note = 'Ideal diode: V_dc = V_m/π, V_rms = V_m/2, ripple factor 1.21, PIV = V_m. The diode conducts for slightly less than half a cycle because the input must first exceed V_γ.';
      else if (k === 'fw') note = 'Ideal diodes: V_dc = 2V_m/π, V_rms = V_m/√2, ripple factor 0.48, ripple at twice the input frequency. Two diodes conduct in series, so the peak is V_m − 2V_γ. PIV of each diode is about V_m.';
      else if (k === 'clip') { p.hline(b + g, C.mute); note = 'The diode turns on when the input exceeds V_B + V_γ = ' + f(b + g) + ' V and holds the output there. Below that level the diode is off and the output follows the input.'; }
      else if (k === 'dclip') { p.hline(b + g, C.mute); p.hline(-(b + g), C.mute); note = 'Two opposite diode-battery branches limit the output to ±(V_B + V_γ) = ±' + f(b + g) + ' V. With a large input this turns a sine into a near square wave.'; }
      else if (k === 'cup') { p.hline(b - g, C.mute); note = 'The capacitor charges to V_m + V_B − V_γ = ' + f(m + b - g) + ' V and then acts like a battery in series. The shape and the peak-to-peak swing (2V_m) are unchanged. The lowest point sits at V_B − V_γ = ' + f(b - g) + ' V. Assumes RC is much longer than the period.'; }
      else { p.hline(b + g, C.mute); note = 'Diode reversed: now the highest point is pinned at V_B + V_γ = ' + f(b + g) + ' V and the whole wave hangs below it. Peak-to-peak swing is still 2V_m.'; }
      S.show('<span>output average (DC) = <b>' + f(dc) + ' V</b></span><span>output rms = <b>' + f(rms) + ' V</b></span><span>output peak = <b>' + f(k === 'cdn' ? b + g : vo(PI / 2)) + ' V</b></span><span class="wide">' + note + '</span>');
    };
  });

  GS.sim('csamp', function (S) {
    S.title('Common-source amplifier: Q-point, load line and clipping', 'k_n = 1 mA/V² and V_T = 1 V are fixed. The operating point slides along the load line as the gate voltage wiggles. Move the bias until the output clips, first on one side and then on the other.');
    var VDD = S.slider('V_DD', 5, 15, 0.5, 10, 'V'), RD = S.slider('R_D', 1, 10, 0.5, 4, 'kΩ'), VG = S.slider('Gate bias V_GS', 1, 4, 0.02, 2, 'V'), A = S.slider('Signal amplitude', 0, 1, 0.02, 0.2, 'V');
    var p = S.canvas(300); S.animate();
    S.draw = function (t) {
      var bx = GS.split(p, 0.5, 300, 540), vdd = VDD.v, rd = RD.v, vg = VG.v, a = A.v, C;
      var op = function (vgs) {
        var ov = vgs - 1; if (ov <= 0) return [0, vdd, 0];
        var id = 0.5 * ov * ov, vds = vdd - id * rd; if (vds >= ov) return [id, vds, 1];
        var q = rd * ov + 1; vds = (q - sqrt(q * q - 2 * rd * vdd)) / rd; return [(vdd - vds) / rd, vds, 2];
      };
      var idc = function (vgs, vds) { var ov = vgs - 1; if (ov <= 0) return 0; return vds < ov ? ov * vds - vds * vds / 2 : 0.5 * ov * ov; };
      var Qp = op(vg), ph = t * 2.2, now = op(vg + a * sin(ph));
      p.begin(); C = p.C;
      var im = Math.max(vdd / rd * 1.15, 1);
      p.frame({ box: bx[0], x: [0, vdd * 1.05], y: [0, im], xl: 'V_DS (V)', yl: 'I_D (mA)' });
      p.fn(function (x) { return idc(vg + a, x); }, C.mute, 1.1); p.fn(function (x) { return idc(vg - a, x); }, C.mute, 1.1);
      p.fn(function (x) { return idc(vg, x); }, C.a, 2);
      p.seg(0, vdd / rd, vdd, 0, C.ink, 1.8); p.text('load line', vdd * 0.5, vdd / rd * 0.5, C.ink, 'left', 6, -8);
      p.dot(Qp[1], Qp[0], C.a, 5, true); p.text('Q', Qp[1], Qp[0], C.a, 'left', 8, -8); p.dot(now[1], now[0], C.b, 5.5);
      p.frame({ box: bx[1], x: [0, 4 * PI], y: [0, vdd * 1.05], xl: 'ωt', yl: 'v_out = v_DS (V)', xticks: [0, 2 * PI, 4 * PI], xfmt: function (v) { return ['0', '', '2π', '', '4π'][Math.round(v / PI)]; } });
      var gm = Qp[2] === 1 ? (vg - 1) : 0;
      p.fn(function (x) { return Qp[1] - gm * rd * a * sin(x); }, C.mute, 1.3, [5, 4]);
      p.fn(function (x) { return op(vg + a * sin(x))[1]; }, C.b, 2.5, null, 700);
      var cur = ph % (4 * PI); p.dot(cur, now[1], C.b, 5);
      p.legend([['actual output', C.b], ['small-signal prediction', C.mute, [5, 4]]]);
      var hi = op(vg - a), lo = op(vg + a), st;
      if (Qp[2] === 0) st = ['biased in cut-off: no gain', 'bad'];
      else if (Qp[2] === 2) st = ['biased in triode: gain collapses', 'bad'];
      else if (hi[2] === 0 && lo[2] === 2) st = ['clipping at both ends', 'bad'];
      else if (hi[2] === 0) st = ['top clips: transistor cuts off', 'mid'];
      else if (lo[2] === 2) st = ['bottom flattens: transistor enters triode', 'mid'];
      else st = ['whole swing in saturation', 'ok'];
      S.show('<span><span class="pill ' + st[1] + '">' + st[0] + '</span></span><span>Q-point: I_D = <b>' + f(Qp[0]) + ' mA</b>, V_DS = <b>' + f(Qp[1]) + ' V</b></span><span>g_m = k_n V_ov = <b>' + f(gm) + ' mS</b></span><span>A_v = −g_m R_D = <b>' + f(-gm * rd) + '</b></span><span>output swing: <b>' + f(lo[1]) + ' V to ' + f(hi[1]) + ' V</b></span>' +
        '<span class="wide">Even inside saturation the output is not a perfect sine, because I_D depends on V_ov squared. The small-signal model is the tangent at Q, so it is accurate only when the signal is much smaller than 2V_ov.</span>');
    };
  });

  GS.sim('diffpair', function (S) {
    S.title('BJT differential pair: steering the tail current', 'The tail current I_EE is shared between the two transistors. A differential input of only a few V_T (about 26 mV) steers nearly all of it to one side.');
    var I = S.slider('Tail current I_EE', 0.2, 2, 0.1, 1, 'mA'), R = S.slider('R_C', 1, 10, 0.5, 5, 'kΩ'), V = S.slider('v_id = v_B1 − v_B2', -150, 150, 1, 10, 'mV');
    var p = S.canvas(280);
    S.draw = function () {
      var VT = 25.85, ie = I.v, C;
      var i1 = function (v) { return ie / (1 + exp(-v / VT)); }, i2 = function (v) { return ie / (1 + exp(v / VT)); };
      p.begin(); C = p.C; p.frame({ x: [-150, 150], y: [0, ie * 1.15], xl: 'differential input v_id (mV)', yl: 'collector current (mA)' });
      p.rect(-VT, 0, VT, ie * 1.15, C.d, 0.12);
      p.fn(i1, C.a, 2.4); p.fn(i2, C.b, 2.4); p.hline(ie, C.mute);
      p.vline(V.v, C.mute, [3, 3]); p.dot(V.v, i1(V.v), C.a, 5.5); p.dot(V.v, i2(V.v), C.b, 5.5);
      p.legend([['i_C1', C.a], ['i_C2', C.b], ['|v_id| < V_T', C.d]], 'left');
      var gm = ie / 2 / VT * 1000, vod = -R.v * (i1(V.v) - i2(V.v)), lin = -gm * R.v * V.v / 1000;
      S.show('<span class="k1">i_C1 = <b>' + f(i1(V.v)) + ' mA</b></span><span class="k2">i_C2 = <b>' + f(i2(V.v)) + ' mA</b></span><span>g_m of each transistor = (I_EE/2)/V_T = <b>' + f(gm) + ' mS</b></span><span>A_d = −g_m R_C = <b>' + f(-gm * R.v) + '</b></span><span>v_od actual = <b>' + f(vod) + ' V</b>, linear estimate = <b>' + f(lin) + ' V</b></span>' +
        '<span class="wide">Exact law: v_od = −I_EE R_C tanh(v_id / 2V_T). The linear estimate is good inside the green band and badly wrong outside it. By |v_id| ≈ 4V_T (about 100 mV) the pair is fully switched, which is how emitter-coupled logic and analog multipliers work.</span>');
    };
  });

  GS.sim('schmitt', function (S) {
    S.title('Schmitt trigger against a noisy input', 'An inverting Schmitt trigger (V_sat = ±12 V) with thresholds ±βV_sat. The thin grey trace is a plain comparator fed the same noisy signal: it chatters at every crossing. Widen the hysteresis until the orange output switches cleanly once per half cycle.');
    var B = S.slider('Feedback fraction β', 0, 0.6, 0.01, 0.2), A = S.slider('Input amplitude', 1, 10, 0.5, 6, 'V'), Nz = S.slider('Noise', 0, 3, 0.1, 1.2, 'V');
    var p = S.canvas(300); S.animate();
    S.draw = function (t) {
      var bx = GS.split(p, 0.64, 300, 540), th = B.v * 12, a = A.v, nz = Nz.v, C;
      var vin = function (x) { return a * sin(PI * x) + nz * (0.5 * sin(14.6 * PI * x) + 0.3 * sin(23.4 * PI * x + 1) + 0.2 * sin(34.2 * PI * x + 2)); };
      var t0 = t - 4, st = 1, xs = [], ys = [], cs = [], n1 = 0, n2 = 0, prev = 0, x, last = 0;
      for (x = t0 - 2; x <= t; x += 0.004) {
        var v = vin(x), old = st;
        if (st === 1 && v > th) st = -1; else if (st === -1 && v < -th) st = 1;
        var cmp = v > 0 ? -1 : 1;
        if (x >= t0) { xs.push(x - t0); ys.push(12 * st); cs.push(10.5 * cmp); if (old !== st) n1++; if (prev && cmp !== prev) n2++; }
        prev = cmp; last = v;
      }
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [0, 4], y: [-14, 14], xl: 'time (s)', yl: 'volts' });
      p.hline(th, C.c); p.hline(-th, C.c);
      p.path(xs, cs, C.mute, 1); p.fn(function (u) { return vin(u + t0); }, C.a, 1.6, null, 900); p.path(xs, ys, C.b, 2.6);
      p.legend([['input', C.a], ['Schmitt output', C.b], ['thresholds', C.c, [5, 4]], ['plain comparator', C.mute]], 'left');
      p.frame({ box: bx[1], x: [-11, 11], y: [-14, 14], xl: 'v_in (V)', title: 'transfer' });
      p.path([-11, th, th, 11], [12, 12, -12, -12], C.b, 2); p.path([11, -th, -th, -11], [-12, -12, 12, 12], C.b, 2);
      p.arrow(th, 3, th, -3, C.b, 2); p.arrow(-th, -3, -th, 3, C.b, 2);
      p.dot(GS.clamp(last, -11, 11), 12 * st, C.a, 5.5);
      S.show('<span class="k3">thresholds = ±βV_sat = <b>±' + f(th) + ' V</b></span><span>hysteresis width = <b>' + f(2 * th) + ' V</b></span><span class="k2">Schmitt switched <b>' + n1 + '</b> times in 4 s</span><span>plain comparator switched <b>' + n2 + '</b> times</span>' +
        '<span class="wide">' + (th >= a + nz ? 'The input never reaches the threshold, so the output is stuck. Hysteresis must be smaller than the signal swing.' : (n1 <= 4 ? 'Clean: the hysteresis is wider than the noise, so each real crossing gives exactly one transition.' : 'Still chattering: the peak-to-peak noise is larger than the hysteresis width.')) + ' Positive feedback is what creates the two thresholds, and it means the virtual-short rule does not apply here.</span>');
    };
  });

  GS.sim('gbw', function (S) {
    S.title('Gain–bandwidth trade-off of an op-amp', 'A single-pole op-amp with DC gain 10⁵ (100 dB). Feedback lowers the gain and widens the bandwidth by the same factor, so gain × bandwidth stays constant.');
    var G = S.lslider('Closed-loop gain 1 + R₂/R₁', 1, 1000, 10, '', function (v) { return f(v) + ' (' + f(20 * Math.log10(v)) + ' dB)'; }), GB = S.lslider('Unity-gain frequency f_T', 1e5, 1e8, 1e6, 'Hz');
    var p = S.canvas(300);
    S.draw = function () {
      var g = G.v, gb = GB.v, A0 = 1e5, fp = gb / A0, C;
      var ol = function (lf) { var x = Math.pow(10, lf) / fp; return 20 * Math.log10(A0 / sqrt(1 + x * x)); };
      var fc = gb / g * (1 + g / A0), g0 = g / (1 + g / A0);
      var cl = function (lf) { var x = Math.pow(10, lf) / fc; return 20 * Math.log10(g0 / sqrt(1 + x * x)); };
      p.begin(); C = p.C; p.frame({ x: [0, 8.5], y: [-20, 110], xl: 'frequency (Hz)', yl: 'gain (dB)', xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8], xfmt: GS.hz, yticks: [-20, 0, 20, 40, 60, 80, 100] });
      var xs = [], a1 = [], a2 = [], i; for (i = 0; i <= 340; i++) { var lf = i / 40; xs.push(lf); a1.push(ol(lf)); a2.push(cl(lf)); }
      p.clip(function () {
        var c = p.ctx, j; c.beginPath();
        for (j = 0; j < xs.length; j++) c.lineTo(p.X(xs[j]), p.Y(a1[j]));
        for (j = xs.length - 1; j >= 0; j--) c.lineTo(p.X(xs[j]), p.Y(a2[j]));
        c.closePath(); c.globalAlpha = 0.16; c.fillStyle = C.d; c.fill(); c.globalAlpha = 1;
      });
      p.path(xs, a1, C.mute, 2); p.path(xs, a2, C.a, 2.6);
      p.vline(Math.log10(fc), C.b); p.dot(Math.log10(fc), cl(Math.log10(fc)), C.b, 5); p.dot(Math.log10(gb), 0, C.mute, 4);
      p.text('f_T', Math.log10(gb), 0, C.mute, 'left', 6, -8);
      p.legend([['open loop', C.mute], ['closed loop', C.a], ['loop gain (the gap)', C.d]]);
      S.show('<span>bandwidth = f_T / gain = <b>' + si(fc) + 'Hz</b></span><span>open-loop pole = <b>' + si(fp) + 'Hz</b></span><span>loop gain at DC = <b>' + f(20 * Math.log10(A0 / g)) + ' dB</b></span><span>gain error at DC ≈ 1/loop gain = <b>' + f(100 * g / A0, 2) + ' %</b></span><span>10–90 % rise time ≈ 0.35/BW = <b>' + si(0.35 / fc) + 's</b></span>' +
        '<span class="wide">The inverting amplifier with gain −R₂/R₁ has the same bandwidth f_T/(1 + R₂/R₁): bandwidth is set by the noise gain, not the signal gain.</span>');
    };
  });
})();
