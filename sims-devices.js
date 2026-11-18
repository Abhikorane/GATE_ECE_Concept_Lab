/* Section 3: Electronic Devices */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, si = GS.si, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs, log = Math.log, log10 = Math.log10;
  var KB = 8.617e-5, Q = 1.602e-19, EPS = 11.7 * 8.854e-14, NI = 1.5e10;
  function sci(v) { if (!isFinite(v) || v <= 0) return '0'; var e = Math.floor(log10(v)), m = v / Math.pow(10, e); if (m >= 9.995) { m = 1; e++; } return m.toFixed(2) + '×10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }); }
  GS.sci = sci;

  GS.sim('fermi', function (S) {
    S.title('Doping, temperature and the Fermi level in silicon', 'Dope the silicon and the Fermi level moves toward the band holding the majority carriers. Heat it enough and nᵢ overtakes the doping: the material behaves as intrinsic again.');
    var ty = S.select('Dopant', [['n', 'Donor (n-type)'], ['p', 'Acceptor (p-type)']]), N = S.lslider('Doping', 1e13, 1e19, 1e16, '', function (v) { return sci(v) + ' cm⁻³'; }), T = S.slider('Temperature', 200, 700, 5, 300, 'K');
    var p = S.canvas(300), rnd = GS.rng(3), px = []; for (var i = 0; i < 24; i++) px.push([rnd(), rnd()]);
    S.draw = function () {
      var bx = GS.split(p, 0.55, 300, 520), t = T.v, kT = KB * t, C;
      var ni = NI * Math.pow(t / 300, 1.5) * exp(-(1.12 / (2 * KB)) * (1 / t - 1 / 300));
      var maj = N.v / 2 + sqrt(N.v * N.v / 4 + ni * ni), mino = ni * ni / maj, n = ty.v === 'n' ? maj : mino, h = ty.v === 'n' ? mino : maj;
      var dE = kT * log(n / ni), Ef = 0.56 + dE;
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [0, 1], y: [-0.25, 1.4], noxt: true, yl: 'energy (eV)' });
      p.rect(0, 1.12, 1, 1.4, C.a, 0.1); p.rect(0, -0.25, 1, 0, C.b, 0.1);
      p.seg(0, 1.12, 1, 1.12, C.ink, 2); p.seg(0, 0, 1, 0, C.ink, 2); p.seg(0, 0.56, 1, 0.56, C.mute, 1.2, [5, 4]); p.seg(0, Ef, 1, Ef, C.c, 2.4);
      p.text('E_c', 0.02, 1.12, C.ink, 'left', 0, -9); p.text('E_v', 0.02, 0, C.ink, 'left', 0, 10); p.text('E_i', 0.98, 0.56, C.mute, 'right', 0, -8); p.text('E_F', 0.5, Ef, C.c, 'center', 0, Ef > 0.56 ? -9 : 10);
      var ne = Math.round(GS.clamp((log10(n) - 5) * 1.5, 0, 24)), nh = Math.round(GS.clamp((log10(h) - 5) * 1.5, 0, 24)), j;
      for (j = 0; j < ne; j++) p.dot(0.05 + 0.9 * px[j][0], 1.16 + 0.2 * px[j][1], C.a, 3.5);
      for (j = 0; j < nh; j++) p.dot(0.05 + 0.9 * px[j][1], -0.04 - 0.17 * px[j][0], C.b, 3.5, true);
      p.frame({ box: bx[1], x: [0, 3], y: [0, 20], noxt: true, yl: 'log₁₀ of concentration (cm⁻³)' });
      p.rect(0.2, 0, 0.9, log10(n), C.a, 0.7); p.rect(1.15, 0, 1.85, log10(Math.max(1, h)), C.b, 0.7); p.rect(2.1, 0, 2.8, log10(ni), C.mute, 0.5);
      p.text('n', 0.55, 0, C.ink, 'center', 0, 12); p.text('p', 1.5, 0, C.ink, 'center', 0, 12); p.text('nᵢ', 2.45, 0, C.ink, 'center', 0, 12);
      var reg = ni > N.v ? ['intrinsic region: nᵢ exceeds the doping', 'bad'] : (ni > 0.05 * N.v ? ['leaving the extrinsic region', 'mid'] : ['extrinsic: majority ≈ doping', 'ok']);
      S.show('<span><span class="pill ' + reg[1] + '">' + reg[0] + '</span></span><span>nᵢ = <b>' + sci(ni) + '</b></span><span class="k1">n = <b>' + sci(n) + '</b></span><span class="k2">p = <b>' + sci(h) + '</b></span><span class="k3">E_F − E_i = <b>' + f(dE) + ' eV</b></span><span>kT = <b>' + f(kT * 1000, 3) + ' meV</b></span>' +
        '<span class="wide">n·p = nᵢ² always holds here: pushing one carrier up by doping pushes the other down by the same factor. Model: nᵢ = 1.5×10¹⁰ cm⁻³ at 300 K, E_g = 1.12 eV taken as constant, all dopants ionised.</span>');
    };
  });

  GS.sim('driftdiff', function (S) {
    S.title('Drift and diffusion of carriers', 'Each dot is a carrier jittering with thermal motion. An electric field adds a steady sideways drift. Bunch the carriers at one side with no field and they still spread out: that is diffusion, driven only by the concentration gradient.');
    var E = S.slider('Electric field', -1, 1, 0.05, 0), D = S.slider('Thermal agitation', 0.2, 2, 0.1, 1);
    var pts = [], rnd = GS.rng(11), i;
    for (i = 0; i < 320; i++) pts.push({ x: rnd(), y: rnd() });
    S.button('Bunch carriers at the left', function () { pts.forEach(function (q) { q.x = 0.08 * Math.random(); }); });
    S.button('Spread evenly', function () { pts.forEach(function (q) { q.x = Math.random(); }); });
    var p = S.canvas(330); S.animate();
    function g() { var u = 0; while (u === 0) u = Math.random(); return sqrt(-2 * log(u)) * Math.cos(6.2832 * Math.random()); }
    S.draw = function (t, dt) {
      var C, bins = [], nb = 20, c;
      p.begin(); C = p.C; c = p.ctx;
      p.frame({ box: [0, 0, 1, 0.6], x: [0, 1], y: [0, 1], noxt: true, noyt: true, m: [46, 12, 14, 8] });
      for (i = 0; i < nb; i++) bins.push(0);
      c.fillStyle = C.a;
      pts.forEach(function (q) {
        if (dt > 0) {
          q.x += E.v * 0.35 * dt + sqrt(2 * 0.012 * D.v * dt) * g(); q.y += sqrt(2 * 0.012 * D.v * dt) * g();
          if (q.x < 0) q.x = -q.x; if (q.x > 1) q.x = 2 - q.x; if (q.y < 0) q.y = -q.y; if (q.y > 1) q.y = 2 - q.y;
          q.x = GS.clamp(q.x, 0, 1); q.y = GS.clamp(q.y, 0, 1);
        }
        bins[Math.min(nb - 1, Math.floor(q.x * nb))]++;
        c.beginPath(); c.arc(p.X(q.x), p.Y(q.y), 2.4, 0, 6.2832); c.fill();
      });
      if (abs(E.v) > 0.01) { p.arrow(0.5 - 0.18 * E.v, 0.94, 0.5 + 0.18 * E.v, 0.94, C.b, 2.5); p.text('force on carriers', 0.5, 0.94, C.b, 'center', 0, 13); }
      p.frame({ box: [0, 0.6, 1, 0.4], x: [0, 1], y: [0, Math.max(40, Math.max.apply(null, bins) * 1.15)], xl: 'position x', yl: 'carriers per slice' });
      for (i = 0; i < nb; i++) p.rect(i / nb + 0.004, 0, (i + 1) / nb - 0.004, bins[i], C.a, 0.6);
      var grad = (bins.slice(nb / 2).reduce(function (a, b) { return a + b; }, 0) - bins.slice(0, nb / 2).reduce(function (a, b) { return a + b; }, 0));
      S.show('<span>drift velocity v_d = μE = <b>' + f(E.v * 0.35, 2) + '</b> (box widths per second)</span><span>right half minus left half = <b>' + grad + '</b> carriers</span>' +
        '<span class="wide">Drift current: J = q n μ E, needs a field. Diffusion current: J = q D dn/dx, needs a slope in concentration. The two constants are tied by Einstein’s relation D/μ = kT/q ≈ 25.9 mV at 300 K. With a field on and walls at the ends, carriers pile up until diffusion pushing back balances drift: that balance is what sets the built-in voltage of a p-n junction.</span>');
    };
  });

  GS.sim('pn', function (S) {
    S.title('Abrupt silicon p-n junction: depletion region', 'The p side is on the left. Reverse bias (negative V) widens the depletion region and raises the peak field. Make one side much more heavily doped and nearly all of the depletion region moves to the lightly doped side.');
    var Na = S.lslider('N_A (p side)', 1e15, 1e18, 1e17, '', function (v) { return sci(v) + ' cm⁻³'; }), Nd = S.lslider('N_D (n side)', 1e15, 1e18, 1e16, '', function (v) { return sci(v) + ' cm⁻³'; }), V = S.slider('Applied voltage V', -20, 0.6, 0.05, 0, 'V');
    var p = S.canvas(340);
    S.draw = function () {
      var na = Na.v, nd = Nd.v, Vt = 0.0259, Vbi = Vt * log(na * nd / (NI * NI)), v = Math.min(V.v, Vbi - 0.05), C;
      var W = sqrt(2 * EPS / Q * (1 / na + 1 / nd) * (Vbi - v)), xn = W * na / (na + nd), xp = W * nd / (na + nd), Em = Q * nd * xn / EPS;
      var um = 1e4, X = Math.max(W * um * 0.75, 0.02);
      p.begin(); C = p.C;
      var hA = log10(na) - 14, hD = log10(nd) - 14;
      p.frame({ box: [0, 0, 1, 0.48], x: [-X, X], y: [-4.6, 4.6], noxt: true, yl: 'space charge (cm\u207b\u00b3)', m: [78, 12, 14, 10], yticks: [-4, -2, 0, 2, 4], yfmt: function (y) { return y === 0 ? '0' : (y < 0 ? '−' : '+') + '10^' + (abs(y) + 14); } });
      p.rect(-xp * um, -hA, 0, 0, C.b, 0.55); p.rect(0, 0, xn * um, hD, C.a, 0.55);
      p.text('−qN_A (ionised acceptors)', -X, -4.6, C.b, 'left', 6, -10); p.text('+qN_D (ionised donors)', X, 4.6, C.a, 'right', -6, 10);
      p.vline(0, C.mute, [2, 3]);
      p.frame({ box: [0, 0.48, 1, 0.52], x: [-X, X], y: [0, Em * 1.2 / 1e3], xl: 'distance from the junction (µm)', yl: '|E| (kV/cm)', m: [78, 12, 14, 40] });
      p.area([-xp * um, 0, xn * um], [0, Em / 1e3, 0], C.c, 0.2); p.path([-X, -xp * um, 0, xn * um, X], [0, 0, Em / 1e3, 0, 0], C.c, 2.4);
      p.text('area under |E| = V_bi − V = ' + f(Vbi - v) + ' V', -X, Em * 1.2 / 1e3, C.mute, 'left', 6, 10);
      var st = v > 0.005 ? ['forward bias', 'mid'] : (v < -0.005 ? ['reverse bias', 'ok'] : ['equilibrium', 'ok']);
      S.show('<span><span class="pill ' + st[1] + '">' + st[0] + '</span></span><span>V_bi = <b>' + f(Vbi) + ' V</b></span><span>W = <b>' + f(W * um) + ' µm</b></span><span class="k2">x_p = <b>' + f(xp * um) + ' µm</b></span><span class="k1">x_n = <b>' + f(xn * um) + ' µm</b></span><span class="k3">E_max = <b>' + sci(Em) + ' V/cm</b></span><span>C_j = ε/W = <b>' + f(EPS / W * 1e9) + ' nF/cm²</b></span>' +
        '<span class="wide">Charge balance N_A·x_p = N_D·x_n fixes how W is shared. ' + (Em > 3e5 ? 'The peak field is above roughly 3×10⁵ V/cm, where silicon junctions break down (avalanche, or Zener tunnelling when both sides are very heavily doped).' : 'C_j falls as reverse bias grows because W widens: this is how a varactor diode tunes a circuit.') + '</span>');
    };
  });

  GS.sim('mosfet', function (S) {
    S.title('n-MOSFET output characteristics', 'The dashed parabola V_DS = V_GS − V_T separates triode (left) from saturation (right). Move V_GS and V_DS and see which region the operating point falls in.');
    var G = S.slider('V_GS', 0, 5, 0.05, 2.5, 'V'), Dd = S.slider('V_DS', 0, 5, 0.05, 3, 'V'), Vt = S.slider('V_T', 0.4, 2, 0.05, 1, 'V'), K = S.slider('k_n = µC_ox W/L', 0.2, 4, 0.1, 1, 'mA/V²'), Lm = S.slider('λ', 0, 0.1, 0.005, 0.02, 'V⁻¹');
    var p = S.canvas(310);
    S.draw = function () {
      var vt = Vt.v, k = K.v, lam = Lm.v, C, g;
      var id = function (vgs, vds) { var ov = vgs - vt; if (ov <= 0) return 0; return (vds < ov ? k * (ov * vds - vds * vds / 2) : 0.5 * k * ov * ov) * (1 + lam * vds); };
      var ym = Math.max(0.2, id(5, 5) * 1.08);
      p.begin(); C = p.C; p.frame({ x: [0, 5], y: [0, ym], xl: 'V_DS (V)', yl: 'I_D (mA)' });
      for (g = 1; g <= 5; g++) { (function (vg) { p.fn(function (x) { return id(vg, x); }, C.mute, 1.2); if (vg > vt) p.text('V_GS=' + vg, 5, id(vg, 5), C.mute, 'right', -4, -8); })(g); }
      p.fn(function (x) { return 0.5 * k * x * x * (1 + lam * x); }, C.c, 1.4, [5, 4]);
      p.fn(function (x) { return id(G.v, x); }, C.a, 2.6);
      var I = id(G.v, Dd.v), ov = G.v - vt; p.dot(Dd.v, I, C.b, 6);
      var reg, out;
      if (ov <= 0) { reg = ['cut-off', 'bad']; out = '<span>I_D = <b>0</b> (square-law model ignores subthreshold current)</span>'; }
      else if (Dd.v < ov) { reg = ['triode (linear)', 'mid']; out = '<span>I_D = k_n[(V_ov)V_DS − V_DS²/2] = <b>' + f(I) + ' mA</b></span><span>g_m = k_n V_DS = <b>' + f(k * Dd.v) + ' mS</b></span><span>channel resistance near V_DS = 0: 1/(k_n V_ov) = <b>' + f(1 / (k * ov)) + ' kΩ</b></span>'; }
      else { reg = ['saturation', 'ok']; out = '<span>I_D = ½ k_n V_ov²(1+λV_DS) = <b>' + f(I) + ' mA</b></span><span>g_m = <b>' + f(k * ov * (1 + lam * Dd.v)) + ' mS</b></span><span>r_o = 1/(λI_D) = <b>' + (lam > 0 ? f(1 / (lam * 0.5 * k * ov * ov)) + ' kΩ' : '∞') + '</b></span>'; }
      S.show('<span><span class="pill ' + reg[1] + '">' + reg[0] + '</span></span><span>V_ov = V_GS − V_T = <b>' + f(ov) + ' V</b></span>' + out +
        '<span class="wide">An amplifier needs saturation, where I_D is set by V_GS and barely by V_DS. A switch uses cut-off (open) and deep triode (closed, a small resistance). The factor (1+λV_DS) is applied in both regions here so the curves join smoothly.</span>');
    };
  });

  GS.sim('solar', function (S) {
    S.title('Solar cell I–V curve and maximum power point', 'An illuminated p-n junction: I = I_L − I_s(e^{V/V_T} − 1). The load decides where on the curve the cell sits. Find the voltage that delivers the most power.');
    var sun = S.slider('Sunlight', 0.05, 1.2, 0.05, 1, 'sun'), V = S.slider('Load voltage', 0, 0.65, 0.005, 0.45, 'V');
    var p = S.canvas(300);
    S.draw = function () {
      var IL = 3 * sun.v, Is = 1e-9, Vt = 0.0259, C, v, best = [0, 0];
      var I = function (x) { return IL - Is * (exp(x / Vt) - 1); };
      var Voc = Vt * log(IL / Is + 1);
      for (v = 0; v <= Voc; v += 0.0005) if (v * I(v) > best[1]) best = [v, v * I(v)];
      p.begin(); C = p.C; p.frame({ x: [0, 0.68], y: [0, 3.9], xl: 'cell voltage (V)', yl: 'current (A), power (W)' });
      p.rect(0, 0, best[0], I(best[0]), C.d, 0.12);
      p.fn(function (x) { return I(x) >= 0 ? I(x) : NaN; }, C.a, 2.4, null, 700); p.fn(function (x) { return I(x) >= 0 ? x * I(x) : NaN; }, C.b, 2.2, null, 700);
      p.dot(best[0], best[1], C.b, 4, true); p.dot(best[0], I(best[0]), C.a, 4, true); p.text('max power', best[0], best[1], C.b, 'right', -8, -8);
      var vv = Math.min(V.v, Voc), ii = Math.max(0, I(vv));
      p.vline(vv, C.mute, [3, 3]); p.dot(vv, ii, C.a, 5.5); p.dot(vv, vv * ii, C.b, 5.5);
      p.legend([['current', C.a], ['power', C.b]], 'left');
      S.show('<span>I_sc = I_L = <b>' + f(IL) + ' A</b></span><span>V_oc = <b>' + f(Voc) + ' V</b></span><span class="k2">P_max = <b>' + f(best[1]) + ' W</b> at ' + f(best[0]) + ' V</span><span>fill factor = <b>' + f(best[1] / (Voc * IL)) + '</b></span><span>now: <b>' + f(vv * ii) + ' W</b> into R = ' + (ii > 1e-6 ? f(vv / ii) + ' Ω' : '∞') + '</span>' +
        '<span class="wide">Double the light and I_sc doubles, but V_oc rises only by V_T ln 2 ≈ 18 mV. A maximum power point tracker in a solar inverter keeps adjusting the load to stay on the peak of the orange curve. Model: I_s = 1 nA, ideality factor 1, no series or shunt resistance.</span>');
    };
  });
})();
