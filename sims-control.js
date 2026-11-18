/* Section 6: Control Systems */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, sin = Math.sin, cos = Math.cos, PI = Math.PI, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs, atan = Math.atan, log10 = Math.log10;

  GS.sim('secondorder', function (S) {
    S.title('Second-order step response and its poles', 'G(s) = ωₙ² / (s² + 2ζωₙs + ωₙ²). The damping ratio ζ sets the angle of the poles and therefore the overshoot. ωₙ sets their distance from the origin and therefore the speed.');
    var Z = S.slider('Damping ratio ζ', 0, 2, 0.01, 0.4), W = S.slider('Natural frequency ωₙ', 0.5, 10, 0.1, 4, 'rad/s');
    var p = S.canvas(300);
    S.draw = function () {
      var bx = GS.split(p, 0.4, 300, 560), z = Z.v, wn = W.v, C;
      var R = wn * Math.max(1.3, z + sqrt(Math.max(0, z * z - 1)) + 0.3);
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [-R * 1.1, R * 0.4], y: [-R * 0.75, R * 0.75], equal: true, xl: 'Re(s)', yl: 'Im(s)', title: 's-plane' });
      p.rect(0, p.yr[0], p.xr[1], p.yr[1], C.bad, 0.1); p.circle(0, 0, wn, C.mute, 1.2, [4, 4]);
      var poles, out;
      if (z < 1) { var wd = wn * sqrt(1 - z * z); poles = [[-z * wn, wd], [-z * wn, -wd]]; p.seg(0, 0, -z * wn, wd, C.c, 1.4); }
      else { var r = wn * sqrt(z * z - 1); poles = [[-z * wn + r, 0], [-z * wn - r, 0]]; }
      poles.forEach(function (q) { p.cross(q[0], q[1], C.a, 6); });
      var slow = z < 1 ? Math.max(z * wn, wn / 30) : wn * (z - sqrt(z * z - 1)), T = Math.max(8 / wn, 6 / slow);
      var Mp = z < 1 ? exp(-PI * z / sqrt(1 - z * z)) : 0;
      p.frame({ box: bx[1], x: [0, T], y: [0, 1.2 + Mp], xl: 'time (s)', yl: 'output' });
      p.rect(0, 0.98, T, 1.02, C.d, 0.25); p.hline(1, C.mute);
      p.fn(function (t) { return GS.step2(z, wn, t); }, C.a, 2.5, null, 900);
      out = '<span>poles: <b>' + (z < 1 ? f(-z * wn) + ' ± j' + f(wn * sqrt(1 - z * z)) : f(poles[0][0]) + ', ' + f(poles[1][0])) + '</b></span>';
      if (z < 1 && z > 0) {
        var wd2 = wn * sqrt(1 - z * z), tp = PI / wd2, th = Math.acos(z);
        p.dot(tp, 1 + Mp, C.b, 5); p.text('M_p', tp, 1 + Mp, C.b, 'left', 8, -4); p.vline(4 / (z * wn), C.d);
        out += '<span><span class="pill mid">underdamped</span></span><span class="k2">overshoot M_p = e^(−πζ/√(1−ζ²)) = <b>' + f(100 * Mp) + ' %</b></span><span>peak time π/ω_d = <b>' + f(tp) + ' s</b></span><span>rise time (π−θ)/ω_d = <b>' + f((PI - th) / wd2) + ' s</b></span><span class="k4">2 % settling ≈ 4/ζωₙ = <b>' + f(4 / (z * wn)) + ' s</b></span><span class="k3">pole angle θ = cos⁻¹ζ = <b>' + f(th * 180 / PI) + '°</b></span>';
      } else if (z === 0) out += '<span><span class="pill bad">undamped: poles on the jω axis</span></span><span>oscillates forever at ωₙ = <b>' + f(wn) + ' rad/s</b></span>';
      else out += '<span><span class="pill ok">' + (z === 1 ? 'critically damped' : 'overdamped') + '</span></span><span>no overshoot</span><span>time constants: <b>' + f(-1 / poles[0][0]) + ' s</b> and <b>' + f(-1 / poles[1][0]) + ' s</b></span>';
      S.show(out + '<span class="wide">Change only ωₙ: the overshoot does not move, only the time scale. Change only ζ: the poles slide along the dashed circle of radius ωₙ.</span>');
    };
  });

  /* complex roots of a real polynomial (highest power first), Durand-Kerner */
  function roots(co) {
    var n = co.length - 1, a = co.map(function (c) { return c / co[0]; }), z = [], i, j, it, mx = 0;
    for (i = 1; i <= n; i++) mx = Math.max(mx, abs(a[i]));
    for (i = 0; i < n; i++) z.push([(1 + mx) * cos(0.4 + 2 * PI * i / n), (1 + mx) * sin(0.4 + 2 * PI * i / n)]);
    for (it = 0; it < 120; it++) {
      var moved = 0;
      for (i = 0; i < n; i++) {
        var pr = 1, pi = 0, t;
        for (j = 1; j <= n; j++) { t = pr * z[i][0] - pi * z[i][1] + a[j]; pi = pr * z[i][1] + pi * z[i][0]; pr = t; }
        var qr = 1, qi = 0;
        for (j = 0; j < n; j++) if (j !== i) { var dr = z[i][0] - z[j][0], di = z[i][1] - z[j][1]; t = qr * dr - qi * di; qi = qr * di + qi * dr; qr = t; }
        var den = qr * qr + qi * qi || 1e-30, sr = (pr * qr + pi * qi) / den, sI = (pi * qr - pr * qi) / den;
        z[i][0] -= sr; z[i][1] -= sI; moved += abs(sr) + abs(sI);
      }
      if (moved < 1e-12) break;
    }
    return z;
  }
  GS.roots = roots;

  GS.sim('rootlocus', function (S) {
    S.title('Root locus: where the closed-loop poles go as gain rises', 'Crosses are open-loop poles, circles are open-loop zeros. The grey trail is every closed-loop pole position for K from 0 to ∞. Orange dots are the closed-loop poles at the K you choose.');
    var sys = {
      a: { num: [1], den: [1, 2, 0], s: 'K / [s(s+2)]', note: 'Two branches meet at the breakaway point s = −1 and leave vertically (asymptotes at ±90°, centroid −1). Stable for every K > 0, but higher K only adds oscillation.' },
      b: { num: [1], den: [1, 4, 3, 0], s: 'K / [s(s+1)(s+3)]', note: 'Three asymptotes at ±60° and 180° from the centroid −4/3. Breakaway at s = −0.451. Routh: stable only for 0 < K < 12, crossing the jω axis at ω = √3 rad/s.' },
      c: { num: [1, 3], den: [1, 1, 0], s: 'K(s+3) / [s(s+1)]', note: 'The zero pulls the locus to the left. The branches leave the real axis at −0.551, travel on a circle centred on the zero, and return at −5.449. Stable for every K > 0.' },
      d: { num: [1], den: [1, 3, 4, 2], s: 'K / [(s+1)(s²+2s+2)]', note: 'Complex open-loop poles at −1 ± j. Centroid −1, asymptotes ±60° and 180°. Routh: stable for K < 10, crossing at ω = 2 rad/s.' },
      e: { num: [1], den: [1, 4, 0, 0], s: 'K / [s²(s+4)]', note: 'A double integrator plus a pole. The two branches from the origin go straight into the right half-plane: unstable for every K > 0 (the s¹ term is missing from s³ + 4s² + K).' },
      g: { num: [1, 1], den: [1, 4, 0, 0], s: 'K(s+1) / [s²(s+4)]', note: 'The same plant with one added zero at −1 (a PD or lead controller). The branches now bend into the left half-plane: stable for every K > 0. This is what derivative action buys.' }
    };
    var sel = S.select('Open-loop G(s)H(s)', Object.keys(sys).map(function (k) { return [k, sys[k].s]; }), 'b'), K = S.lslider('Gain K', 0.01, 200, 2, '', function (v) { return f(v); });
    var p = S.canvas(360), cache = {};
    function cl(D, k) { var co = D.den.slice(), off = D.den.length - D.num.length, i; for (i = 0; i < D.num.length; i++) co[off + i] += k * D.num[i]; return roots(co); }
    S.draw = function () {
      var D = sys[sel.v], C, i;
      if (!cache[sel.v]) { var pts = []; for (i = 0; i <= 500; i++) cl(D, Math.pow(10, -3 + 6.5 * i / 500)).forEach(function (r) { pts.push(r); }); cache[sel.v] = pts; }
      p.begin(); C = p.C; p.frame({ x: [-7, 2.5], y: [-4.6, 4.6], equal: true, xl: 'Re(s)', yl: 'Im(s)' });
      p.rect(0, p.yr[0], p.xr[1], p.yr[1], C.bad, 0.1);
      var c = p.ctx; p.clip(function () { c.fillStyle = C.mute; cache[sel.v].forEach(function (r) { c.fillRect(p.X(r[0]) - 1, p.Y(r[1]) - 1, 2.2, 2.2); }); });
      roots(D.den).forEach(function (r) { p.cross(r[0], r[1], C.a, 6); });
      if (D.num.length > 1) roots(D.num).forEach(function (r) { p.dot(r[0], r[1], C.d, 6, true); });
      var now = cl(D, K.v), worst = -1e9;
      now.forEach(function (r) { p.dot(r[0], r[1], C.b, 6); worst = Math.max(worst, r[0]); });
      var st = worst < -1e-4 ? ['stable', 'ok'] : (worst > 1e-4 ? ['unstable', 'bad'] : ['marginally stable', 'mid']);
      S.show('<span>closed loop at K = ' + f(K.v) + ': <span class="pill ' + st[1] + '">' + st[0] + '</span></span><span class="k2">poles: <b>' + now.map(function (r) { return f(r[0]) + (abs(r[1]) > 1e-6 ? (r[1] > 0 ? ' + j' : ' − j') + f(abs(r[1])) : ''); }).join(',  ') + '</b></span><span class="wide">' + D.note + '</span>');
    };
  });

  GS.sim('bode', function (S) {
    S.title('Bode plot, Nyquist plot and stability margins', 'Open loop G(s) = K / [s(1 + s/p₁)(1 + s/p₂)] with unity feedback. Raise K: the magnitude curve lifts, the gain crossover moves right, and the phase margin shrinks until the Nyquist curve passes through −1.');
    var K = S.lslider('Gain K', 0.1, 200, 2, '', function (v) { return f(v); }), P1 = S.slider('Pole p₁', 0.5, 10, 0.1, 1, 'rad/s'), P2 = S.lslider('Pole p₂', 1, 100, 10, '', function (v) { return f(v) + ' rad/s'; });
    var p = S.canvas(390);
    S.draw = function () {
      var k = K.v, p1 = P1.v, p2 = P2.v, C, i;
      var narrow = (p.cv.clientWidth || 600) < 560; p.setH(narrow ? 680 : 390);
      var bx = narrow ? [[0, 0, 1, 0.3], [0, 0.3, 1, 0.3], [0, 0.6, 1, 0.4]] : [[0, 0, 0.6, 0.5], [0, 0.5, 0.6, 0.5], [0.6, 0, 0.4, 1]];
      var mag = function (w) { return k / (w * sqrt(1 + w * w / (p1 * p1)) * sqrt(1 + w * w / (p2 * p2))); };
      var ph = function (w) { return -90 - (atan(w / p1) + atan(w / p2)) * 180 / PI; };
      var wpc = sqrt(p1 * p2), gm = -20 * log10(mag(wpc)), lo = -4, hi = 5, mid;
      for (i = 0; i < 60; i++) { mid = (lo + hi) / 2; if (mag(Math.pow(10, mid)) > 1) lo = mid; else hi = mid; }
      var wgc = Math.pow(10, lo), pm = 180 + ph(wgc), xf = function (v) { return v === 0 ? '1' : '10^' + v; };
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [-1.5, 3], y: [-80, 60], yl: '|G| (dB)', noxt: true, xticks: [-1, 0, 1, 2, 3], yticks: [-80, -40, 0, 40] });
      p.hline(0, C.mute); p.fn(function (lw) { return 20 * log10(mag(Math.pow(10, lw))); }, C.a, 2.4);
      p.vline(log10(wgc), C.b); p.vline(log10(wpc), C.c);
      p.seg(log10(wpc), 0, log10(wpc), -gm, C.c, 3); p.text('GM', log10(wpc), -gm / 2, C.c, 'left', 6, 0);
      p.frame({ box: bx[1], x: [-1.5, 3], y: [-280, -80], xl: 'ω (rad/s)', yl: 'phase (°)', xticks: [-1, 0, 1, 2, 3], xfmt: xf, yticks: [-270, -180, -90] });
      p.hline(-180, C.mute); p.fn(function (lw) { return ph(Math.pow(10, lw)); }, C.a, 2.4);
      p.vline(log10(wgc), C.b); p.vline(log10(wpc), C.c);
      p.seg(log10(wgc), -180, log10(wgc), ph(wgc), C.b, 3); p.text('PM', log10(wgc), (ph(wgc) - 180) / 2, C.b, 'left', 6, 0);
      p.frame({ box: bx[2], x: [-2.6, 0.8], y: [-2.2, 1.2], equal: true, title: 'Nyquist (ω > 0)', xl: 'Re G(jω)' });
      p.circle(0, 0, 1, C.mute, 1, [3, 4]);
      var rx = [], ry = []; for (i = 0; i <= 500; i++) { var w = Math.pow(10, -2 + 5.5 * i / 500), m = mag(w), a = ph(w) * PI / 180; rx.push(m * cos(a)); ry.push(m * sin(a)); }
      p.path(rx, ry, C.a, 2.4); p.cross(-1, 0, C.bad, 6); p.text('−1', -1, 0, C.bad, 'center', 0, 15);
      p.dot(-mag(wpc), 0, C.c, 4.5); p.dot(mag(wgc) * cos(ph(wgc) * PI / 180), mag(wgc) * sin(ph(wgc) * PI / 180), C.b, 4.5);
      var st = pm > 0.05 ? ['closed loop stable', 'ok'] : (pm < -0.05 ? ['closed loop unstable', 'bad'] : ['marginal', 'mid']);
      S.show('<span><span class="pill ' + st[1] + '">' + st[0] + '</span></span><span class="k2">gain crossover ω_gc = <b>' + f(wgc) + ' rad/s</b>, PM = <b>' + f(pm) + '°</b></span><span class="k3">phase crossover ω_pc = √(p₁p₂) = <b>' + f(wpc) + ' rad/s</b>, GM = <b>' + f(gm) + ' dB</b></span><span>critical gain K = p₁ + p₂ = <b>' + f(p1 + p2) + '</b></span>' +
        '<span class="wide">On the Nyquist plot the orange dot is where the curve crosses the unit circle (its angle past −180° is the PM) and the pink dot is where it crosses the negative real axis (its distance from the origin is 1/GM). The plant has no right-half-plane poles, so the loop is stable exactly when the curve passes to the right of −1.</span>');
    };
  });

  GS.sim('pid', function (S) {
    S.title('PID controller on a second-order plant', 'Plant G(s) = 1 / [(s+1)(s+2)], unit step set-point. Start with K_p only and note the steady-state error. Add K_i to remove it, then K_d to calm the overshoot.');
    var Kp = S.slider('K_p', 0, 40, 0.5, 4), Ki = S.slider('K_i', 0, 60, 0.5, 0), Kd = S.slider('K_d', 0, 8, 0.1, 0), dis = S.check('Load disturbance at t = 6 s', true);
    var p = S.canvas(300);
    S.draw = function () {
      var kp = Kp.v, ki = Ki.v, kd = Kd.v, C, x1 = 0, x2 = 0, zi = 0, dt = 0.001, T = 12, xs = [], ys = [], us = [], i, n = Math.round(T / dt), peak = 0, ts = 0, y6 = 0;
      for (i = 0; i <= n; i++) {
        var t = i * dt, e = 1 - x1, d = dis.v && t >= 6 ? -1 : 0, u = kp * e + ki * zi - kd * x2;
        if (i % 20 === 0) { xs.push(t); ys.push(x1); us.push(u); }
        var a = -2 * x1 - 3 * x2 + u + d; x2 += a * dt; x1 += x2 * dt; zi += e * dt;
        if (abs(x1) > 1e6) break;
      }
      var stable = (3 + kd) * (2 + kp) > ki;
      for (i = 0; i < xs.length && xs[i] < 6; i++) y6 = ys[i];
      for (i = 0; i < xs.length && xs[i] < 6; i++) { if (ys[i] > peak) peak = ys[i]; if (abs(ys[i] - y6) > 0.02 * abs(y6)) ts = xs[i]; }
      p.begin(); C = p.C; p.frame({ x: [0, T], y: [0, 1.8], xl: 'time (s)', yl: 'output y(t)' });
      p.rect(0, 0.98, T, 1.02, C.d, 0.25); p.hline(1, C.mute);
      if (dis.v) { p.vline(6, C.c); p.text('disturbance', 6, 1.8, C.c, 'left', 6, 12); }
      p.path(xs, ys, C.a, 2.5);
      p.legend([['output', C.a], ['set-point ±2 %', C.d]]);
      var ess = 1 - y6;
      S.show('<span><span class="pill ' + (stable ? 'ok">stable' : 'bad">unstable') + '</span></span>' + (stable ? '<span>steady-state error before the disturbance = <b>' + f(abs(ess) < 5e-4 ? 0 : ess) + '</b></span><span>overshoot above the final value = <b>' + f(y6 > 0 ? Math.max(0, (peak - y6) / y6 * 100) : 0) + ' %</b></span><span>within 2 % of its final value after <b>' + (ts > 5.9 ? 'more than 6' : f(ts)) + ' s</b></span>' : '') +
        '<span>characteristic equation: s³ + ' + f(3 + kd) + 's² + ' + f(2 + kp) + 's + ' + f(ki) + ' = 0</span>' +
        '<span class="wide">' + (ki === 0 ? 'With no integral term the loop is type 0: error = 1/(1 + K_p·G(0)) = 1/(1 + K_p/2) = ' + f(1 / (1 + kp / 2)) + '. A larger K_p shrinks it but never removes it, and the disturbance leaves a permanent offset.' : (stable ? 'The integrator keeps pushing until the error is exactly zero, both for the set-point and after the disturbance. The price is one more pole: Routh requires (3 + K_d)(2 + K_p) > K_i.' : 'Routh fails: (3 + K_d)(2 + K_p) = ' + f((3 + kd) * (2 + kp)) + ' is not greater than K_i = ' + f(ki) + '. Too much integral action for this much proportional and derivative gain.')) + ' Derivative acts on the measured output here, so a set-point step does not cause a spike.</span>');
    };
  });
})();
