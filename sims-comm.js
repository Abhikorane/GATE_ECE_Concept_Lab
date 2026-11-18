/* Section 7: Communications */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, si = GS.si, sin = Math.sin, cos = Math.cos, PI = Math.PI, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs, log2 = Math.log2;
  function erfc(x) {
    var z = abs(x), t = 1 / (1 + 0.5 * z);
    var a = t * exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? a : 2 - a;
  }
  function Qf(x) { return 0.5 * erfc(x / Math.SQRT2); }
  GS.Q = Qf;
  function bessel(n, x) { var s = 0, N = 400, i; for (i = 0; i <= N; i++) { var t = PI * i / N, w = (i === 0 || i === N) ? 0.5 : 1; s += w * cos(n * t - x * sin(t)); } return s / N; }
  GS.bessel = bessel;

  GS.sim('noise', function (S) {
    S.title('White noise through an RC low-pass filter', 'Grey is wide-band noise, blue is the same noise after a first-order low-pass filter. Lowering the cut-off removes power and makes neighbouring samples more alike: the autocorrelation widens as the spectrum narrows.');
    var Fc = S.lslider('Filter cut-off f_c', 50, 4000, 300, 'Hz');
    var p = S.canvas(400), r = GS.rng(5), x = [], i, FS = 10000;
    for (i = 0; i < 6000; i++) x.push(GS.gauss(r));
    S.draw = function () {
      var fc = Fc.v, al = 1 - exp(-2 * PI * fc / FS), y = [], prev = 0, C, vx = 0, vy = 0, tx = [], RC = 1 / (2 * PI * fc);
      for (i = 0; i < x.length; i++) { prev += al * (x[i] - prev); y.push(prev); vx += x[i] * x[i]; vy += prev * prev; }
      for (i = 0; i < 600; i++) tx.push(i / FS * 1000);
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.5], x: [0, 60], y: [-3.5, 3.5], xl: 'time (ms)', yl: 'volts' });
      p.path(tx, x.slice(1000, 1600), C.mute, 0.9); p.path(tx, y.slice(1000, 1600), C.a, 2.2);
      p.legend([['white noise in', C.mute], ['filtered out', C.a]]);
      p.frame({ box: [0, 0.5, 0.5, 0.5], x: [0, 5000], y: [0, 1.25], xl: 'frequency (Hz)', title: 'power spectral density', noyt: true });
      p.hline(1, C.mute); p.fn(function (v) { return 1 / (1 + v * v / (fc * fc)); }, C.a, 2.2); p.vline(fc, C.b);
      p.rect(0, 0, PI / 2 * fc, 1, C.d, 0.15);
      p.frame({ box: [0.5, 0.5, 0.5, 0.5], x: [-5, 5], y: [0, 1.25], xl: 'lag τ (ms)', title: 'autocorrelation R(τ)/R(0)', noyt: true });
      p.fn(function (v) { return exp(-abs(v) / (RC * 1000)); }, C.a, 2.2, null, 600); p.vline(RC * 1000, C.b); p.vline(-RC * 1000, C.b);
      S.show('<span>RC = 1/(2πf_c) = <b>' + si(RC) + 's</b></span><span class="k4">noise-equivalent bandwidth = (π/2)f_c = 1/(4RC) = <b>' + si(PI / 2 * fc) + 'Hz</b></span><span>output power / input power (measured) = <b>' + f(vy / vx) + '</b></span>' +
        '<span class="wide">S_Y(f) = |H(f)|² S_X(f) = (N₀/2) / (1 + (f/f_c)²). Its inverse Fourier transform is R_Y(τ) = (N₀/4RC) e^(−|τ|/RC), so the output power is R_Y(0) = N₀/(4RC). The green rectangle is an ideal filter passing the same noise power: its width is the noise-equivalent bandwidth.</span>');
    };
  });

  GS.sim('am', function (S) {
    S.title('Amplitude modulation in time and frequency', 'A single-tone message on a carrier. In ordinary AM the envelope copies the message only while µ ≤ 1. The other two schemes drop the carrier, or the carrier and one sideband, to save power and bandwidth.');
    var ty = S.select('Scheme', [['am', 'AM (DSB with full carrier)'], ['sc', 'DSB-SC (carrier suppressed)'], ['ssb', 'SSB (upper sideband only)']]), Mu = S.slider('Modulation index µ', 0, 1.5, 0.05, 0.5), Fm = S.slider('Message f_m', 1, 5, 0.5, 2, 'kHz'), Fc = S.slider('Carrier f_c', 20, 60, 1, 30, 'kHz');
    var p = S.canvas(380);
    S.draw = function () {
      var k = ty.v, mu = Mu.v, fm = Fm.v, fc = Fc.v, C, out;
      var m = function (t) { return cos(2 * PI * fm * t); };
      var s = function (t) { return k === 'am' ? (1 + mu * m(t)) * cos(2 * PI * fc * t) : (k === 'sc' ? m(t) * cos(2 * PI * fc * t) : cos(2 * PI * (fc + fm) * t)); };
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.58], x: [0, 1], y: [-2.7, 2.7], xl: 'time (ms)', yl: 'volts' });
      p.fn(s, C.a, 1.3, null, 2400);
      if (k === 'am') { p.fn(function (t) { return abs(1 + mu * m(t)); }, C.b, 2.2); p.fn(function (t) { return 1 + mu * m(t); }, C.mute, 1.2, [5, 4]); }
      else if (k === 'sc') p.fn(function (t) { return abs(m(t)); }, C.b, 2.2); else p.hline(1, C.b, [1, 0], 2.2);
      p.legend([['modulated wave', C.a], ['what an envelope detector sees', C.b]].concat(k === 'am' ? [['1 + µ·m(t)', C.mute, [5, 4]]] : []));
      p.frame({ box: [0, 0.58, 1, 0.42], x: [10, 70], y: [0, 1.2], xl: 'frequency (kHz)', yl: 'amplitude' });
      if (k === 'am') { p.stem([fc], [1], C.c, 3.5); p.stem([fc - fm, fc + fm], [mu / 2, mu / 2], C.a, 3.5); p.text('carrier', fc, 1, C.c, 'center', 0, -9); }
      else if (k === 'sc') p.stem([fc - fm, fc + fm], [0.5, 0.5], C.a, 3.5); else { p.stem([fc + fm], [0.5], C.a, 3.5); p.stem([fc], [0], C.mute, 2); }
      if (k === 'am') out = '<span>' + (mu > 1 ? '<span class="pill bad">over-modulated: envelope is distorted</span>' : '<span class="pill ok">envelope = message</span>') + '</span><span>bandwidth = 2f_m = <b>' + f(2 * fm) + ' kHz</b></span><span>total power = P_c(1 + µ²/2) = <b>' + f(1 + mu * mu / 2) + ' P_c</b></span><span class="k1">each sideband = µ²P_c/4 = <b>' + f(mu * mu / 4) + ' P_c</b></span><span>efficiency µ²/(2+µ²) = <b>' + f(100 * mu * mu / (2 + mu * mu)) + ' %</b></span><span class="wide">Even at µ = 1 only one third of the transmitted power carries information. The carrier is the price of a receiver that needs just a diode, a capacitor and a resistor.</span>';
      else if (k === 'sc') out = '<span>bandwidth = 2f_m = <b>' + f(2 * fm) + ' kHz</b></span><span>all transmitted power is in the sidebands</span><span class="wide">The envelope is |m(t)|, not m(t): the carrier phase flips by 180° each time the message crosses zero. An envelope detector fails, so the receiver must regenerate the carrier in phase (coherent detection). A phase error φ scales the output by cos φ.</span>';
      else out = '<span>bandwidth = f_m = <b>' + f(fm) + ' kHz</b></span><span>half the bandwidth of AM, no carrier power</span><span class="wide">For a single tone, SSB is just one sinusoid at f_c + f_m with a constant envelope. Both sidebands of DSB carry the same information, so one of them is enough.</span>';
      S.show(out);
    };
  });

  GS.sim('fm', function (S) {
    S.title('Frequency modulation and its Bessel spectrum', 'The carrier amplitude never changes; only the spacing of its zero crossings does. Each spectral line is Jₙ(β) at f_c + n·f_m. Try β ≈ 2.4: the carrier line disappears.');
    var B = S.slider('Modulation index β = Δf / f_m', 0, 12, 0.05, 2.4), Fm = S.slider('Message f_m', 1, 4, 0.5, 2, 'kHz');
    var p = S.canvas(380);
    S.draw = function () {
      var b = B.v, fm = Fm.v, fc = 60, C, n, xs = [], ys = [], inx = [], iny = [], tot = 0, sig = 0;
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.52], x: [0, 1], y: [-1.5, 1.5], xl: 'time (ms)', yl: 'volts' });
      p.fn(function (t) { return cos(2 * PI * 20 * t + b * sin(2 * PI * fm * t)); }, C.a, 1.6, null, 2400);
      p.fn(function (t) { return 1.25 * cos(2 * PI * fm * t); }, C.b, 1.6, [5, 4]);
      p.legend([['FM wave (carrier drawn at 20 kHz)', C.a], ['message', C.b, [5, 4]]]);
      for (n = -22; n <= 22; n++) { var j = abs(bessel(abs(n), b)), fr = fc + n * fm; if (abs(n) <= b + 1) { inx.push(fr); iny.push(j); tot += j * j; } else { xs.push(fr); ys.push(j); } if (j > 0.01) sig++; }
      p.frame({ box: [0, 0.52, 1, 0.48], x: [0, 120], y: [0, 1.1], xl: 'frequency (kHz), carrier at 60 kHz', yl: '|Jₙ(β)|' });
      p.rect(fc - (b + 1) * fm, 0, fc + (b + 1) * fm, 1.1, C.d, 0.13);
      p.stem(xs, ys, C.mute, 2.4); p.stem(inx, iny, C.a, 3);
      p.text('Carson bandwidth', fc, 1.1, C.d, 'center', 0, 10);
      S.show('<span>peak deviation Δf = βf_m = <b>' + f(b * fm) + ' kHz</b></span><span class="k4">Carson bandwidth 2(β+1)f_m = <b>' + f(2 * (b + 1) * fm) + ' kHz</b></span><span>carrier line J₀(β) = <b>' + f(bessel(0, b)) + '</b></span><span>power inside the Carson band = <b>' + f(100 * tot, 4) + ' %</b></span><span>lines above 1 % of the unmodulated carrier: <b>' + sig + '</b></span>' +
        '<span class="wide">' + (b < 0.3 ? 'Narrow-band FM: only the carrier and one pair of sidebands matter, so the bandwidth is 2f_m, the same as AM.' : 'Total power is constant because the sum of Jₙ² over all n is 1: modulation only moves power from the carrier into sidebands.') + ' Broadcast FM uses Δf = 75 kHz and f_m up to 15 kHz, so β = 5 and the Carson bandwidth is 180 kHz.</span>');
    };
  });

  GS.sim('entropy', function (S) {
    S.title('Entropy and channel capacity', 'Left: a binary source with P(1) = p has entropy H(p), and a binary symmetric channel that flips bits with probability p has capacity 1 − H(p). Right: Shannon’s limit for a band-limited channel with Gaussian noise.');
    var P = S.slider('p', 0, 1, 0.005, 0.11), Bw = S.lslider('Bandwidth B', 1e3, 1e8, 3100, 'Hz'), Sn = S.slider('SNR', -10, 40, 0.5, 30, 'dB');
    var p = S.canvas(290);
    S.draw = function () {
      var bx = GS.split(p, 0.5, 290, 540), q = P.v, C;
      var H = function (x) { return x <= 0 || x >= 1 ? 0 : -x * log2(x) - (1 - x) * log2(1 - x); };
      p.begin(); C = p.C;
      p.frame({ box: bx[0], x: [0, 1], y: [0, 1.12], xl: 'p', yl: 'bits' });
      p.fn(H, C.a, 2.4, null, 400); p.fn(function (x) { return 1 - H(x); }, C.b, 2.4, null, 400);
      p.vline(q, C.mute, [3, 3]); p.dot(q, H(q), C.a, 5.5); p.dot(q, 1 - H(q), C.b, 5.5);
      p.legend([['H(p)', C.a], ['BSC capacity', C.b]]);
      var snr = Math.pow(10, Sn.v / 10), se = log2(1 + snr);
      p.frame({ box: bx[1], x: [-10, 40], y: [0, 14], xl: 'SNR (dB)', yl: 'C/B (bit/s per Hz)' });
      p.fn(function (d) { return log2(1 + Math.pow(10, d / 10)); }, C.c, 2.4); p.vline(Sn.v, C.mute, [3, 3]); p.dot(Sn.v, se, C.c, 5.5);
      S.show('<span class="k1">H(p) = <b>' + f(H(q), 4) + ' bit/symbol</b></span><span class="k2">BSC capacity 1 − H(p) = <b>' + f(1 - H(q), 4) + ' bit/use</b></span><span class="k3">C = B log₂(1 + S/N) = <b>' + si(Bw.v * se) + 'bit/s</b></span><span>S/N = <b>' + f(snr) + '</b> as a ratio</span>' +
        '<span class="wide">' + (abs(q - 0.5) < 0.006 ? 'At p = 0.5 the source is as unpredictable as possible (1 bit per symbol) and the channel output is independent of the input, so its capacity is zero.' : 'A channel with p = 0.9 is as good as one with p = 0.1: just invert every received bit.') + ' At high SNR every extra 3 dB of signal power buys only 1 more bit/s per Hz, while doubling the bandwidth doubles the capacity only if the SNR is held constant (the noise power N₀B grows with B).</span>');
    };
  });

  GS.sim('constellation', function (S) {
    S.title('Digital modulation in noise', 'Each dot is one received symbol: a constellation point plus Gaussian noise. A dot that lands in the wrong decision region (drawn in red) is a symbol error. Compare the schemes at the same E_b/N₀.');
    var sc = S.select('Scheme', [['bpsk', 'BPSK'], ['qpsk', 'QPSK'], ['psk8', '8-PSK'], ['qam16', '16-QAM']], 'qpsk'), G = S.slider('E_b / N₀', 0, 16, 0.5, 8, 'dB');
    var p = S.canvas(340); S.animate();
    var key = '', rx = [], errs = 0;
    function points(k) {
      var a = [], i, j;
      if (k === 'bpsk') return [[1, 0], [-1, 0]];
      if (k === 'qpsk') { for (i = 0; i < 4; i++) a.push([cos(PI / 4 + i * PI / 2), sin(PI / 4 + i * PI / 2)]); return a; }
      if (k === 'psk8') { for (i = 0; i < 8; i++) a.push([cos(i * PI / 4), sin(i * PI / 4)]); return a; }
      for (i = -3; i <= 3; i += 2) for (j = -3; j <= 3; j += 2) a.push([i / sqrt(10), j / sqrt(10)]);
      return a;
    }
    function g() { var u = 0; while (u === 0) u = Math.random(); return sqrt(-2 * Math.log(u)) * cos(2 * PI * Math.random()); }
    S.draw = function () {
      var k = sc.v, pts = points(k), bits = log2(pts.length), gam = Math.pow(10, G.v / 10), sg = sqrt(1 / (2 * bits * gam)), C, i, c;
      if (key !== k + G.v) { key = k + G.v; rx = []; errs = 0; }
      var batch = S.playing ? 30 : (rx.length ? 0 : 1500);
      for (i = 0; i < batch && rx.length < 3000; i++) {
        var a = Math.floor(Math.random() * pts.length), x = pts[a][0] + sg * g(), y = pts[a][1] + sg * g(), best = 0, bd = 1e9, j;
        for (j = 0; j < pts.length; j++) { var d = (x - pts[j][0]) * (x - pts[j][0]) + (y - pts[j][1]) * (y - pts[j][1]); if (d < bd) { bd = d; best = j; } }
        rx.push([x, y, best !== a]); if (best !== a) errs++;
      }
      p.begin(); C = p.C; c = p.ctx;
      p.frame({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, xl: 'in-phase', yl: 'quadrature' });
      if (k === 'bpsk') p.vline(0, C.mute);
      else if (k === 'qpsk') { p.vline(0, C.mute); p.hline(0, C.mute); }
      else if (k === 'psk8') for (i = 0; i < 8; i++) p.seg(0, 0, 4 * cos(PI / 8 + i * PI / 4), 4 * sin(PI / 8 + i * PI / 4), C.mute, 1.2, [5, 4]);
      else [-2, 0, 2].forEach(function (v) { p.vline(v / sqrt(10), C.mute); p.hline(v / sqrt(10), C.mute); });
      p.clip(function () {
        rx.forEach(function (r) { c.globalAlpha = r[2] ? 0.9 : 0.35; c.fillStyle = r[2] ? C.bad : C.a; c.fillRect(p.X(r[0]) - 1.3, p.Y(r[1]) - 1.3, 2.6, 2.6); });
        c.globalAlpha = 1;
      });
      pts.forEach(function (q) { p.dot(q[0], q[1], C.ink, 4); });
      var ber, ser, q1;
      if (k === 'bpsk') { ber = Qf(sqrt(2 * gam)); ser = ber; }
      else if (k === 'qpsk') { q1 = Qf(sqrt(2 * gam)); ber = q1; ser = 2 * q1 - q1 * q1; }
      else if (k === 'psk8') { ser = 2 * Qf(sqrt(6 * gam) * sin(PI / 8)); ber = ser / 3; }
      else { q1 = Qf(sqrt(0.8 * gam)); ser = 3 * q1 - 2.25 * q1 * q1; ber = 0.75 * q1; }
      S.show('<span><b>' + bits + '</b> bit' + (bits > 1 ? 's' : '') + ' per symbol</span><span>null-to-null bandwidth = <b>' + f(2 / bits) + ' R_b</b></span><span>bit error rate (theory' + (bits > 2 ? ', approx.' : '') + ') = <b>' + f(ber, 2) + '</b></span><span>symbol error rate (theory) = <b>' + f(Math.min(1, ser), 2) + '</b></span><span class="k1">simulated: <b>' + errs + '</b> errors in ' + rx.length + ' symbols (' + f(errs / Math.max(1, rx.length), 2) + ')</span>' +
        '<span class="wide">QPSK has the same bit error rate as BPSK in half the bandwidth, because its two axes are independent BPSK channels. 8-PSK and 16-QAM pack more bits into the same bandwidth, but their points sit closer together for the same energy per bit, so they need a higher E_b/N₀.</span>');
    };
  });

  GS.sim('hamming', function (S) {
    S.title('Hamming (7,4) encoder and decoder', 'Set the four data bits, then click any bit of the received word to corrupt it. The three parity checks form a binary number that points at the position of a single error.');
    var data = [1, 0, 1, 1], flip = [0, 0, 0, 0, 0, 0, 0], box = S.dom(), names = ['p1', 'p2', 'd1', 'p4', 'd2', 'd3', 'd4'];
    S.button('Clear the errors', function () { flip = [0, 0, 0, 0, 0, 0, 0]; });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var i = +b.getAttribute('data-i');
      if (b.getAttribute('data-k') === 'd') data[i] ^= 1; else flip[i] ^= 1;
      S.kick();
    });
    S.draw = function () {
      var d = data, c = [d[0] ^ d[1] ^ d[3], d[0] ^ d[2] ^ d[3], d[0], d[1] ^ d[2] ^ d[3], d[1], d[2], d[3]];
      var r = c.map(function (b, i) { return b ^ flip[i]; });
      var s1 = r[0] ^ r[2] ^ r[4] ^ r[6], s2 = r[1] ^ r[2] ^ r[5] ^ r[6], s4 = r[3] ^ r[4] ^ r[5] ^ r[6], pos = s1 + 2 * s2 + 4 * s4;
      var fix = r.slice(); if (pos) fix[pos - 1] ^= 1;
      var out = [fix[2], fix[4], fix[5], fix[6]], ok = out.join('') === d.join(''), ne = flip.reduce(function (a, b) { return a + b; }, 0);
      var cell = function (b, i, cls, tag, k) { return '<' + tag + (k ? ' type="button" data-k="' + k + '" data-i="' + i + '"' : '') + ' class="' + cls + '"><small>' + (k === 'd' ? 'd' + (i + 1) : (i + 1) + ' ' + names[i]) + '</small>' + b + '</' + tag + '>'; };
      var h = '<div class="bitrow"><p>Data bits (click to change)</p><div class="bits">' + d.map(function (b, i) { return cell(b, i, 'f', 'button', 'd'); }).join('') + '</div></div>';
      h += '<div class="bitrow"><p>Transmitted codeword: parity bits sit at positions 1, 2 and 4</p><div class="bits">' + c.map(function (b, i) { return cell(b, i, [0, 1, 3].indexOf(i) >= 0 ? 'p' : 'f', 'span'); }).join('') + '</div></div>';
      h += '<div class="bitrow"><p>Received word (click a bit to flip it in the channel)</p><div class="bits">' + r.map(function (b, i) { return cell(b, i, flip[i] ? 'x' : '', 'button', 'r'); }).join('') + '</div></div>';
      h += '<div class="bitrow"><p>After correction</p><div class="bits">' + fix.map(function (b, i) { return cell(b, i, pos === i + 1 ? 'g' : '', 'span'); }).join('') + '</div></div>';
      h += '<dl class="kv"><dt>check s1 (positions 1,3,5,7)</dt><dd>' + s1 + '</dd><dt>check s2 (positions 2,3,6,7)</dt><dd>' + s2 + '</dd><dt>check s4 (positions 4,5,6,7)</dt><dd>' + s4 + '</dd><dt>syndrome s4 s2 s1</dt><dd>' + s4 + s2 + s1 + ' = ' + pos + (pos ? ' → flip position ' + pos : ' → no error detected') + '</dd><dt>decoded data</dt><dd>' + out.join(' ') + ' <span class="pill ' + (ok ? 'ok">correct' : 'bad">wrong') + '</span></dd></dl>';
      h += '<p class="ref">' + (ne === 0 ? 'No channel errors. Flip one received bit and watch the syndrome spell its position in binary.' : (ne === 1 ? 'One error: the syndrome equals the position of the flipped bit, so it is corrected.' : (ne === 2 ? 'Two errors: the syndrome is non-zero, so the error is detected, but it points at a third, innocent bit and the “correction” makes things worse. Minimum distance 3 means correct 1 or detect 2, not both.' : 'With ' + ne + ' errors the decoder is beyond its ability. Three errors can turn one valid codeword into another, which goes completely unnoticed.'))) + '</p>';
      box.innerHTML = h;
    };
  });
})();
