/* Section 8: Electromagnetics */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, si = GS.si, sin = Math.sin, cos = Math.cos, PI = Math.PI, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs, atan2 = Math.atan2;
  var MU0 = 4e-7 * PI, EPS0 = 8.854e-12, C0 = 2.998e8, DEG = 180 / PI;
  function piTicks(v) { var n = Math.round(v / PI); return n === 0 ? '0' : (abs(n) === 1 ? (n < 0 ? '−π' : 'π') : String(n).replace('-', '−') + 'π'); }

  GS.sim('planewave', function (S) {
    S.title('Plane wave in a lossy medium', 'E (blue) and H (orange) travel in the +z direction. Conductivity makes the wave decay as e^(−αz) and makes H lag behind E. Try sea water at 1 kHz and at 1 GHz, then copper.');
    var med = S.select('Medium', [['air', 'Air'], ['soil', 'Wet soil'], ['sea', 'Sea water'], ['cu', 'Copper'], ['custom', 'Custom']]);
    var F = S.lslider('Frequency', 1e3, 1e11, 1e9, 'Hz'), Er = S.slider('ε_r', 1, 81, 1, 1), Sg = S.lslider('Conductivity σ', 1e-6, 1e8, 1e-6, 'S/m');
    var presets = { air: [1, 1e-6], soil: [20, 0.01], sea: [81, 4], cu: [1, 5.8e7] };
    med.onchange = function (v) { if (presets[v]) { Er.set(presets[v][0]); Sg.set(presets[v][1]); } };
    var p = S.canvas(300); S.animate();
    S.draw = function (t) {
      var w = 2 * PI * F.v, e = Er.v * EPS0, tn = Sg.v / (w * e), b0 = w * sqrt(MU0 * e), rt = sqrt(1 + tn * tn), C;
      var al = b0 * sqrt((rt - 1) / 2), be = b0 * sqrt((rt + 1) / 2), eta = sqrt(MU0 / e) / sqrt(rt), th = 0.5 * Math.atan(tn);
      var lam = 2 * PI / be, dl = 1 / al, zm = Math.min(3 * lam, 6 * dl), ph = t * 2.5;
      p.begin(); C = p.C; p.frame({ x: [0, zm], y: [-1.2, 1.2], xl: 'distance z', xfmt: function (v) { return v === 0 ? '0' : si(v, 2) + 'm'; }, noyt: true });
      p.fn(function (z) { return exp(-al * z); }, C.mute, 1.2, [5, 4]); p.fn(function (z) { return -exp(-al * z); }, C.mute, 1.2, [5, 4]);
      p.fn(function (z) { return 0.7 * exp(-al * z) * cos(ph - be * z - th); }, C.b, 2.2, null, 900);
      p.fn(function (z) { return exp(-al * z) * cos(ph - be * z); }, C.a, 2.4, null, 900);
      if (dl < zm) { p.vline(dl, C.d); p.text('δ', dl, 1.2, C.d, 'left', 5, 10); }
      p.legend([['E', C.a], ['H (scaled)', C.b], ['e^(−αz)', C.mute, [5, 4]]]);
      var kind = tn < 0.01 ? ['low-loss dielectric', 'ok'] : (tn > 100 ? ['good conductor', 'bad'] : ['lossy medium (in between)', 'mid']);
      S.show('<span><span class="pill ' + kind[1] + '">' + kind[0] + '</span></span><span>loss tangent σ/ωε = <b>' + f(tn) + '</b></span><span>α = <b>' + f(al) + ' Np/m</b></span><span>β = <b>' + f(be) + ' rad/m</b></span><span>λ = <b>' + si(lam) + 'm</b></span><span>v_p = <b>' + f(w / be) + ' m/s</b></span><span class="k4">skin depth δ = 1/α = <b>' + si(dl) + 'm</b></span><span>η = <b>' + f(eta) + ' Ω ∠ ' + f(th * DEG) + '°</b></span>' +
        '<span class="wide">The loss tangent compares conduction current σE with displacement current ωεE. The same material can be a dielectric at one frequency and a conductor at another. In a good conductor α = β = √(πfµσ) and H lags E by 45°.</span>');
    };
  });

  GS.sim('polarization', function (S) {
    S.title('Polarization of a plane wave', 'E_x = a cos ωt and E_y = b cos(ωt + δ). The wave is coming out of the screen toward you (+z). The arrow is the tip of the E vector at a fixed point in space.');
    var A = S.slider('E_x amplitude a', 0, 1, 0.05, 1), B = S.slider('E_y amplitude b', 0, 1, 0.05, 1), D = S.slider('Phase δ of E_y', -180, 180, 5, 90, '°');
    var p = S.canvas(320); S.animate();
    S.draw = function (t) {
      var a = A.v, b = B.v, d = D.v / DEG, C, xs = [], ys = [], i, wt = t * 1.8;
      for (i = 0; i <= 200; i++) { var u = i / 200 * 2 * PI; xs.push(a * cos(u)); ys.push(b * cos(u + d)); }
      p.begin(); C = p.C; p.frame({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, xl: 'E_x', yl: 'E_y' });
      p.path(xs, ys, C.mute, 1.6, [4, 4]);
      var ex = a * cos(wt), ey = b * cos(wt + d);
      p.seg(ex, 0, ex, ey, C.grid, 1.5); p.seg(0, ey, ex, ey, C.grid, 1.5);
      p.arrow(0, 0, ex, 0, C.b, 1.6); p.arrow(0, 0, 0, ey, C.c, 1.6); p.arrow(0, 0, ex, ey, C.a, 2.8);
      var root = sqrt(a * a * a * a + b * b * b * b + 2 * a * a * b * b * cos(2 * d)), maj = sqrt((a * a + b * b + root) / 2), mnr = sqrt(Math.max(0, (a * a + b * b - root) / 2));
      var tilt = 0.5 * atan2(2 * a * b * cos(d), a * a - b * b) * DEG, sd = sin(d), kind, hand = '';
      if (a < 0.01 || b < 0.01 || abs(sd) < 0.02) kind = ['linear', 'ok'];
      else { kind = (abs(a - b) < 0.02 && abs(abs(D.v) - 90) < 2) ? ['circular', 'ok'] : ['elliptical', 'mid']; hand = sd > 0 ? 'left-handed (E_y leads; turns clockwise as you face the oncoming wave)' : 'right-handed (E_y lags; turns counter-clockwise as you face the oncoming wave)'; }
      S.show('<span><span class="pill ' + kind[1] + '">' + kind[0] + '</span></span>' + (hand ? '<span><b>' + hand + '</b></span>' : '') + '<span>axial ratio = <b>' + (mnr < 1e-3 ? '∞' : f(maj / mnr)) + '</b></span><span>tilt of major axis = <b>' + f(tilt) + '°</b></span>' +
        '<span class="wide">Handedness follows the IEEE convention: curl the fingers in the direction E rotates, and the thumb must point along the direction of travel. For +z travel, E = (x̂ − j ŷ)e^(−jβz) is right-hand circular and (x̂ + j ŷ) is left-hand circular. Linear needs δ = 0° or 180°. Circular needs equal amplitudes and δ = ±90°. Everything else is elliptical.</span>');
    };
  });

  GS.sim('snell', function (S) {
    S.title('Reflection and refraction at a dielectric boundary', 'A ray goes from medium 1 (top) into medium 2 (bottom). Line thickness shows how much power each ray carries, averaged over the two polarizations. Set n₁ > n₂ and raise the angle to reach total internal reflection.');
    var N1 = S.slider('n₁ (top)', 1, 2.5, 0.01, 1.5), N2 = S.slider('n₂ (bottom)', 1, 2.5, 0.01, 1), Th = S.slider('Angle of incidence θᵢ', 0, 89, 0.5, 30, '°');
    var p = S.canvas(300);
    S.draw = function () {
      var bx = GS.split(p, 0.45, 300, 560), n1 = N1.v, n2 = N2.v, ti = Th.v / DEG, C;
      var R = function (th) {
        var s = n1 / n2 * sin(th); if (s >= 1) return [1, 1, NaN];
        var ci = cos(th), ct = sqrt(1 - s * s), te = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), tm = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
        return [te * te, tm * tm, Math.asin(s)];
      };
      var r = R(ti), avg = (r[0] + r[1]) / 2;
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, noxt: true, noyt: true, m: [12, 12, 10, 12] });
      p.rect(p.xr[0], p.yr[0], p.xr[1], 0, C.a, 0.12); p.seg(p.xr[0], 0, p.xr[1], 0, C.ink, 1.6); p.seg(0, -1.1, 0, 1.1, C.mute, 1, [4, 4]);
      p.arrow(-sin(ti), cos(ti), 0, 0, C.ink, 3);
      p.arrow(0, 0, sin(ti), cos(ti), C.b, 0.6 + 3 * avg);
      if (!isNaN(r[2])) p.arrow(0, 0, sin(r[2]), -cos(r[2]), C.a, 0.6 + 3 * (1 - avg));
      p.text('n₁ = ' + f(n1), p.xr[0], 1.1, C.mute, 'left', 6, 10); p.text('n₂ = ' + f(n2), p.xr[0], -1.1, C.mute, 'left', 6, -10);
      p.frame({ box: bx[1], x: [0, 90], y: [0, 1.05], xl: 'angle of incidence (°)', yl: 'reflected power fraction', xticks: [0, 15, 30, 45, 60, 75, 90] });
      p.fn(function (d) { return R(d / DEG)[0]; }, C.c, 2.2, null, 720); p.fn(function (d) { return R(d / DEG)[1]; }, C.d, 2.2, null, 720);
      p.vline(Th.v, C.mute, [3, 3]); p.dot(Th.v, r[0], C.c, 5); p.dot(Th.v, r[1], C.d, 5);
      p.legend([['⊥ (TE)', C.c], ['∥ (TM)', C.d]], 'left');
      var tb = Math.atan(n2 / n1) * DEG, tc = n1 > n2 ? Math.asin(n2 / n1) * DEG : NaN;
      S.show('<span>' + (isNaN(r[2]) ? '<span class="pill bad">total internal reflection</span>' : 'refracted angle θₜ = <b>' + f(r[2] * DEG) + '°</b>') + '</span><span class="k3">R⊥ = <b>' + f(100 * r[0]) + ' %</b></span><span class="k4">R∥ = <b>' + f(100 * r[1]) + ' %</b></span><span>Brewster angle tan⁻¹(n₂/n₁) = <b>' + f(tb) + '°</b></span><span>critical angle = <b>' + (isNaN(tc) ? 'none (needs n₁ > n₂)' : f(tc) + '°') + '</b></span>' +
        '<span class="wide">At the Brewster angle the parallel-polarized reflection drops to zero, so the reflected light is purely perpendicular-polarized. Beyond the critical angle everything is reflected: this is what traps light inside the core of an optical fibre.</span>');
    };
  });

  GS.sim('standing', function (S) {
    S.title('Standing waves on a transmission line', 'The load is at the right-hand end. The incident wave travels right, the reflected wave travels left, and their sum (blue) pulses inside the dashed envelope. A matched load leaves a pure travelling wave.');
    var R = S.lslider('R_L / Z₀', 0.01, 100, 2, '', function (v) { return f(v); }), X = S.slider('X_L / Z₀', -3, 3, 0.05, 0);
    S.button('Matched', function () { R.set(1); X.set(0); }); S.button('Short circuit', function () { R.set(0.01); X.set(0); }); S.button('Open circuit', function () { R.set(100); X.set(0); });
    var show = S.check('Show incident and reflected waves', false);
    var p = S.canvas(300); S.animate();
    S.draw = function (t) {
      var r = R.v, x = X.v, den = (r + 1) * (r + 1) + x * x, gr = ((r - 1) * (r + 1) + x * x) / den, gi = 2 * x / den, g = sqrt(gr * gr + gi * gi), tg = atan2(gi, gr), C, wt = t * 3;
      p.begin(); C = p.C; p.frame({ x: [-1.5, 0], y: [-2.25, 2.25], xl: 'position along the line, in wavelengths (load at 0)', yl: 'voltage / |V⁺|' });
      var env = function (z) { var bd = -2 * PI * z; return sqrt(1 + g * g + 2 * g * cos(2 * bd - tg)); };
      p.fn(env, C.mute, 1.4, [5, 4], 600); p.fn(function (z) { return -env(z); }, C.mute, 1.4, [5, 4], 600);
      if (show.v) { p.fn(function (z) { return cos(wt - 2 * PI * z); }, C.d, 1.2, null, 600); p.fn(function (z) { return g * cos(wt + 2 * PI * z + tg); }, C.c, 1.2, null, 600); }
      p.fn(function (z) { var bd = -2 * PI * z; return cos(wt + bd) + g * cos(wt - bd + tg); }, C.a, 2.5, null, 600);
      p.legend([['total voltage', C.a], ['envelope |V|', C.mute, [5, 4]]].concat(show.v ? [['incident', C.d], ['reflected', C.c]] : []), 'left');
      var swr = g > 0.9999 ? Infinity : (1 + g) / (1 - g), dmax = ((tg >= 0 ? tg : tg + 2 * PI) / (4 * PI));
      S.show('<span>Γ = <b>' + f(g) + ' ∠ ' + f(tg * DEG) + '°</b></span><span>VSWR = <b>' + f(swr) + '</b></span><span>return loss = <b>' + (g < 1e-6 ? '∞' : f(-20 * Math.log10(g))) + ' dB</b></span><span class="k4">power delivered to the load = <b>' + f(100 * (1 - g * g)) + ' %</b></span><span>first voltage maximum at <b>' + f(dmax) + ' λ</b> from the load, first minimum at <b>' + f(dmax >= 0.25 ? dmax - 0.25 : dmax + 0.25) + ' λ</b></span>' +
        '<span class="wide">Maxima and minima are a quarter wavelength apart and the pattern repeats every half wavelength. A short circuit forces a voltage null at the load. An open circuit forces a voltage maximum there. A quarter wavelength back from the load, the line sees Z₀²/Z_L, which is ' + f(r / (r * r + x * x)) + (x !== 0 ? (x > 0 ? ' − j' : ' + j') + f(abs(x) / (r * r + x * x)) : '') + ' times Z₀ here.</span>');
    };
  });

  GS.sim('smith', function (S) {
    S.title('Smith chart', 'The chart is the reflection-coefficient plane with circles of constant resistance and arcs of constant reactance drawn on it. Moving along a lossless line toward the generator rotates the point clockwise on a circle of constant |Γ|: one full turn per half wavelength.');
    var R = S.lslider('Load r = R_L / Z₀', 0.02, 20, 0.5, '', function (v) { return f(v); }), X = S.slider('Load x = X_L / Z₀', -5, 5, 0.05, 1), L = S.slider('Line length', 0, 0.5, 0.005, 0.125, 'λ');
    var p = S.canvas(380);
    S.draw = function () {
      var r = R.v, x = X.v, den = (r + 1) * (r + 1) + x * x, gr = ((r - 1) * (r + 1) + x * x) / den, gi = 2 * x / den, g = sqrt(gr * gr + gi * gi), a0 = atan2(gi, gr), C, c;
      var a1 = a0 - 4 * PI * L.v, ir = g * cos(a1), ii = g * sin(a1), d2 = (1 - ir) * (1 - ir) + ii * ii, zr = (1 - ir * ir - ii * ii) / d2, zx = 2 * ii / d2;
      p.begin(); C = p.C; c = p.ctx;
      p.frame({ x: [-1.18, 1.18], y: [-1.18, 1.18], equal: true, bare: true, m: [8, 8, 8, 8] });
      var sc = abs(p.X(1) - p.X(0));
      c.save(); c.beginPath(); c.arc(p.X(0), p.Y(0), sc, 0, 2 * PI); c.clip();
      c.strokeStyle = C.line; c.lineWidth = 1;
      [0.2, 0.5, 1, 2, 5].forEach(function (v) {
        c.beginPath(); c.arc(p.X(v / (1 + v)), p.Y(0), sc / (1 + v), 0, 2 * PI); c.stroke();
        [1, -1].forEach(function (sg) { c.beginPath(); c.arc(p.X(1), p.Y(sg / v), sc / v, 0, 2 * PI); c.stroke(); });
      });
      c.beginPath(); c.moveTo(p.X(-1), p.Y(0)); c.lineTo(p.X(1), p.Y(0)); c.stroke();
      c.restore();
      c.beginPath(); c.arc(p.X(0), p.Y(0), sc, 0, 2 * PI); c.strokeStyle = C.ink; c.lineWidth = 1.6; c.stroke();
      [0.2, 0.5, 1, 2, 5].forEach(function (v) { var gx = (v - 1) / (v + 1); p.text(String(v), gx, 0, C.mute, 'center', 0, 9); var an = 2 * Math.atan(1 / v); p.text('j' + v, 1.08 * cos(an), 1.08 * sin(an), C.mute, 'center'); p.text('−j' + v, 1.08 * cos(an), -1.08 * sin(an), C.mute, 'center'); });
      p.text('short', -1, 0, C.mute, 'left', 4, -9); p.text('open', 1, 0, C.mute, 'right', -4, -9);
      p.circle(0, 0, g, C.mute, 1.3, [4, 4]);
      c.beginPath(); c.arc(p.X(0), p.Y(0), g * sc, -a0, -a1, false); c.strokeStyle = C.b; c.lineWidth = 3.2; c.stroke();
      p.dot(-gr, -gi, C.d, 5, true); p.dot(gr, gi, C.a, 6); p.dot(ir, ii, C.b, 6);
      p.text('z_L', gr, gi, C.a, 'left', 9, -9); p.text('z_in', ir, ii, C.b, 'left', 9, 10); p.text('y_L', -gr, -gi, C.d, 'left', 9, 0);
      var swr = g > 0.9999 ? Infinity : (1 + g) / (1 - g), yd = r * r + x * x;
      var cj = function (re, im) { return f(re) + (im < 0 ? ' − j' : ' + j') + f(abs(im)); };
      S.show('<span class="k1">z_L = <b>' + cj(r, x) + '</b></span><span>Γ_L = <b>' + f(g) + ' ∠ ' + f(a0 * DEG) + '°</b></span><span>VSWR = <b>' + f(swr) + '</b></span><span class="k2">z_in = <b>' + cj(zr, zx) + '</b></span><span>with Z₀ = 50 Ω: Z_in = <b>' + cj(50 * zr, 50 * zx) + ' Ω</b></span><span class="k4">y_L = 1/z_L = <b>' + cj(r / yd, -x / yd) + '</b></span>' +
        '<span class="wide">Upper half: inductive. Lower half: capacitive. Centre: matched. The admittance of any point is the point diametrically opposite. The VSWR equals the r value where the dashed |Γ| circle crosses the right-hand real axis.</span>');
    };
  });

  GS.sim('waveguide', function (S) {
    S.title('Rectangular waveguide: cut-off and dispersion', 'An air-filled guide with inner width a and height b. Each mode propagates only above its own cut-off frequency. The default size is the standard X-band guide WR-90.');
    var A = S.slider('Width a', 1, 10, 0.002, 2.286, 'cm'), B = S.slider('Height b', 0.5, 5, 0.002, 1.016, 'cm'), F = S.slider('Frequency', 1, 40, 0.1, 10, 'GHz');
    var p = S.canvas(260);
    S.draw = function () {
      var a = A.v / 100, b = B.v / 100, fr = F.v, C, m, n, modes = [];
      for (m = 0; m <= 4; m++) for (n = 0; n <= 4; n++) { if (!m && !n) continue; modes.push({ fc: C0 / 2 * sqrt(m * m / (a * a) + n * n / (b * b)) / 1e9, name: 'TE' + m + n + (m && n ? ', TM' + m + n : '') }); }
      modes.sort(function (u, v) { return u.fc - v.fc; });
      var f1 = modes[0].fc, f2 = modes[1].fc;
      p.begin(); C = p.C; p.frame({ x: [0, 40], y: [0, 3], xl: 'frequency (GHz)', yl: 'velocity / c' });
      p.rect(0, 0, f1, 3, C.bad, 0.1); p.rect(f1, 0, f2, 3, C.d, 0.14); p.hline(1, C.mute);
      p.fn(function (x) { return x > f1 ? 1 / sqrt(1 - f1 * f1 / (x * x)) : NaN; }, C.a, 2.4, null, 1200); p.fn(function (x) { return x > f1 ? sqrt(1 - f1 * f1 / (x * x)) : NaN; }, C.b, 2.4, null, 1200);
      p.vline(fr, C.mute, [3, 3]);
      p.legend([['phase velocity', C.a], ['group velocity', C.b], ['single-mode band', C.d]]);
      var out = '<span>dominant mode <b>' + modes[0].name + '</b>, cut-off <b>' + f(f1, 4) + ' GHz</b></span><span class="k4">single-mode band: <b>' + f(f1, 4) + ' to ' + f(f2, 4) + ' GHz</b></span>';
      if (fr > f1) {
        var k = sqrt(1 - f1 * f1 / (fr * fr)), l0 = C0 / (fr * 1e9);
        p.dot(fr, 1 / k, C.a, 5.5); p.dot(fr, k, C.b, 5.5);
        out += '<span>free-space λ = <b>' + f(l0 * 100) + ' cm</b></span><span>guide λ_g = <b>' + f(l0 / k * 100) + ' cm</b></span><span class="k1">v_p = <b>' + f(1 / k) + ' c</b></span><span class="k2">v_g = <b>' + f(k) + ' c</b></span><span>Z_TE = <b>' + f(376.7 / k) + ' Ω</b></span>';
      } else out += '<span><span class="pill bad">below cut-off: the field decays, nothing propagates</span></span>';
      out += '<div class="wide"><div class="tw"><table><thead><tr><th>Mode</th><th class="num">Cut-off (GHz)</th><th>At ' + f(fr) + ' GHz</th></tr></thead><tbody>' + modes.slice(0, 6).map(function (q) { return '<tr><td>' + q.name + '</td><td class="num">' + q.fc.toFixed(3) + '</td><td>' + (fr > q.fc ? '<span class="pill ok">propagates</span>' : '<span class="pill bad">cut off</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>v_p is faster than light and v_g is slower, with v_p · v_g = c². Energy and information travel at v_g, so nothing physical exceeds c.</div>';
      S.show(out);
    };
  });

  GS.sim('array', function (S) {
    S.title('Uniform linear antenna array', 'N identical elements in a row along the horizontal axis, spaced d apart, each fed with a phase step α relative to its neighbour. Left: the radiation pattern. Right: the same array factor against ψ = βd cosθ + α, with the range of ψ that real angles can reach shaded.');
    var N = S.slider('Elements N', 2, 16, 1, 4), D = S.slider('Spacing d', 0.1, 2, 0.05, 0.5, 'λ'), Al = S.slider('Phase step α', -360, 360, 5, 0, '°');
    S.button('Broadside', function () { Al.set(0); }); S.button('End-fire', function () { Al.set(-Math.round(360 * D.v / 5) * 5); });
    var p = S.canvas(320);
    S.draw = function () {
      var bx = GS.split(p, 0.5, 320, 600), n = N.v, kd = 2 * PI * D.v, al = Al.v / DEG, C, i;
      var af = function (ps) { var s = sin(ps / 2); return abs(s) < 1e-9 ? 1 : abs(sin(n * ps / 2) / (n * s)); };
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, noxt: true, noyt: true, m: [10, 10, 10, 12] });
      p.circle(0, 0, 1, C.line, 1); p.circle(0, 0, 0.5, C.line, 1); p.circle(0, 0, 0.707, C.grid, 1, [3, 3]);
      var xs = [], ys = []; for (i = 0; i <= 720; i++) { var th = i / 720 * 2 * PI, rr = af(kd * cos(th) + al); xs.push(rr * cos(th)); ys.push(rr * sin(th)); }
      p.area(xs, ys, C.a, 0.12); p.path(xs, ys, C.a, 2.4);
      for (i = 0; i < n; i++) p.dot((i - (n - 1) / 2) * 0.09, 0, C.ink, 2.6);
      p.text('θ = 0°', 1.12, 0, C.mute, 'right', -2, -9); p.text('θ = 90°', 0, 1.12, C.mute, 'center', 0, 9);
      p.frame({ box: bx[1], x: [-3 * PI, 3 * PI], y: [0, 1.1], xl: 'ψ (rad)', yl: '|AF|', xticks: [-3 * PI, -2 * PI, -PI, 0, PI, 2 * PI, 3 * PI], xfmt: piTicks });
      p.rect(al - kd, 0, al + kd, 1.1, C.d, 0.16); p.fn(af, C.a, 2.2, null, 900);
      p.text('visible region', GS.clamp(al, -2.4 * PI, 2.4 * PI), 1.1, C.d, 'center', 0, 10);
      var lobes = [], mm; for (mm = -3; mm <= 3; mm++) { var cs = (2 * PI * mm - al) / kd; if (abs(cs) <= 1 + 1e-9) lobes.push(Math.acos(GS.clamp(cs, -1, 1)) * DEG); }
      var kind = lobes.length === 0 ? 'no full-strength lobe: the main peak lies outside the visible region' : (lobes.length > 1 ? 'grating lobes: ' + lobes.length + ' full-strength beams' : (abs(lobes[0] - 90) < 1 ? 'broadside' : (lobes[0] < 1 || lobes[0] > 179 ? 'end-fire' : 'scanned beam')));
      var u = 1 / (n * D.v);
      S.show('<span><span class="pill ' + (lobes.length === 1 ? 'ok' : 'bad') + '">' + kind + '</span></span><span>full-strength beam at θ = <b>' + (lobes.length ? lobes.map(function (v) { return f(v) + '°'; }).join(', ') : '—') + '</b></span><span>βd = <b>' + f(kd * DEG) + '°</b></span>' + (abs(al) < 1e-9 && u <= 1 ? '<span>first-null beamwidth = 2 sin⁻¹(λ/Nd) = <b>' + f(2 * Math.asin(u) * DEG) + '°</b></span>' : '') +
        '<span class="wide">AF = sin(Nψ/2) / [N sin(ψ/2)] has a full-strength peak wherever ψ is a multiple of 2π. Real directions only reach ψ between α − βd and α + βd. Keep d below λ for broadside (below λ/2 if the beam must scan to end-fire) so that only one peak fits inside that window. More elements make the beam narrower. The phase step steers it: cosθ₀ = −α/βd.</span>');
    };
  });
})();
