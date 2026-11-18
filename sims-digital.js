/* Section 5: Digital Circuits */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, si = GS.si, sin = Math.sin, PI = Math.PI, abs = Math.abs;

  GS.sim('numrep', function (S) {
    S.title('One number, every representation', 'Type any decimal number. The integer part is shown in the four 8-bit integer formats, and the full value in IEEE-754 single precision with its three fields coloured.');
    var num = S.number('Decimal number', -6.5), box = S.dom();
    [['−6.5', -6.5], ['0.1', 0.1], ['−37', -37], ['127', 127], ['1e−40', 1e-40]].forEach(function (e) { S.button(e[0], function () { num.set(e[1]); }); });
    var pad = function (s, n) { while (s.length < n) s = '0' + s; return s; };
    var row = function (label, bits, cls) { return '<div class="bitrow"><p>' + label + '</p><div class="bits">' + bits.split('').map(function (b, i) { return '<span class="' + (cls ? cls(i) : '') + '">' + b + '</span>'; }).join('') + '</div></div>'; };
    S.draw = function () {
      var v = num.v; if (isNaN(v)) v = 0;
      var iv = Math.trunc(v), h = '';
      if (iv >= -128 && iv <= 127) {
        var mag = abs(iv), two = pad(((iv + 256) % 256).toString(2), 8);
        h += row('8-bit two’s complement of ' + iv + '  (hex ' + pad(((iv + 256) % 256).toString(16).toUpperCase(), 2) + ')' + (iv < 0 ? ': invert the bits of ' + mag + ', then add 1' : ''), two, function (i) { return i === 0 ? 's' : ''; });
        if (mag <= 127) {
          h += row('8-bit sign-magnitude: sign bit, then |' + iv + '|', (iv < 0 ? '1' : '0') + pad(mag.toString(2), 7), function (i) { return i === 0 ? 's' : ''; });
          h += row('8-bit one’s complement' + (iv < 0 ? ': invert the bits of ' + mag : ''), iv < 0 ? pad((255 - mag).toString(2), 8) : pad(mag.toString(2), 8), function (i) { return i === 0 ? 's' : ''; });
        } else h += '<p class="bitrow">−128 exists only in two’s complement. Sign-magnitude and one’s complement stop at −127 because they spend a code on −0.</p>';
      } else h += '<p class="bitrow">The integer part ' + iv + ' is outside the 8-bit signed range −128 to +127' + (iv >= 0 && iv <= 255 ? ', but fits as unsigned: ' + pad(iv.toString(2), 8) : '') + '.</p>';
      var fa = new Float32Array(1), ua = new Uint32Array(fa.buffer); fa[0] = v;
      var bits = pad(ua[0].toString(2), 32), E = parseInt(bits.slice(1, 9), 2), fr = bits.slice(9), kind;
      if (E === 0) kind = /^0+$/.test(fr) ? 'zero (exponent field 0, fraction 0)' : 'denormal: (−1)^s × 0.f × 2^−126, no hidden 1';
      else if (E === 255) kind = /^0+$/.test(fr) ? 'infinity (exponent field all ones, fraction 0)' : 'NaN';
      else kind = '(−1)^' + bits[0] + ' × 1.' + fr.replace(/0+$/, '') + (/^0+$/.test(fr) ? '0' : '') + '₂ × 2^(' + E + ' − 127) = ' + (bits[0] === '1' ? '−' : '') + '1.f × 2^' + (E - 127);
      h += row('IEEE-754 single precision: 1 sign bit, 8 exponent bits, 23 fraction bits', bits, function (i) { return i === 0 ? 's' : (i < 9 ? 'e' : 'f'); });
      h += '<dl class="kv"><dt>hex</dt><dd>0x' + pad(ua[0].toString(16).toUpperCase(), 8) + '</dd><dt>exponent field</dt><dd>' + E + (E > 0 && E < 255 ? ' → true exponent ' + (E - 127) : '') + '</dd><dt>decoded as</dt><dd>' + kind + '</dd><dt>value stored</dt><dd>' + fa[0].toPrecision(17).replace(/\.?0+$/, '').replace(/\.?0+e/, 'e') + '</dd><dt>rounding error</dt><dd>' + (v === fa[0] ? 'none: exactly representable' : abs(v - fa[0]).toExponential(2) + ' (binary cannot write this number in 23 fraction bits)') + '</dd></dl>';
      box.innerHTML = h;
    };
  });

  GS.sim('kmap', function (S) {
    S.title('Karnaugh map solver, 4 variables', 'Click a cell to cycle 0 → 1 → X (don’t care). The minimal sum-of-products is recomputed each time. The coloured dots in a cell show which product terms cover it.');
    var st = [], i; for (i = 0; i < 16; i++) st.push(0);
    [0, 2, 5, 7, 8, 10, 13, 15].forEach(function (m) { st[m] = 1; });
    var box = S.dom(), gray = [0, 1, 3, 2], cols = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)', 'var(--crit)', 'var(--mute)', 'var(--ink)', 'var(--warn)'];
    S.button('Clear', function () { for (var j = 0; j < 16; j++) st[j] = 0; });
    S.button('All ones', function () { for (var j = 0; j < 16; j++) st[j] = 1; });
    S.button('Example: 7-segment “a” from BCD', function () { for (var j = 0; j < 16; j++) st[j] = j > 9 ? 2 : ([1, 4].indexOf(j) >= 0 ? 0 : 1); });
    S.button('Example: odd parity (XOR)', function () { for (var j = 0; j < 16; j++) { var b = j ^ (j >> 1); b ^= b >> 2; st[j] = b & 1; } });
    var grid = GS.add(box, 'div', 'kmap'), expr = GS.add(box, 'div', 'kexpr'), info = GS.add(box, 'p', 'ref'), btn = [];
    GS.add(grid, 'div', 'lab', 'AB \\ CD');
    ['00', '01', '11', '10'].forEach(function (c) { GS.add(grid, 'div', 'lab', c); });
    gray.forEach(function (gr, r) {
      GS.add(grid, 'div', 'lab', ['00', '01', '11', '10'][r]);
      gray.forEach(function (gc) {
        var m = gr * 4 + gc, b = GS.add(grid, 'button'); b.type = 'button'; btn[m] = b;
        b.addEventListener('click', function () { st[m] = (st[m] + 1) % 3; S.kick(); });
      });
    });
    function pop(x) { var n = 0; while (x) { n += x & 1; x >>= 1; } return n; }
    function solve(ones, dcs) {
      var cur = {}, primes = [], seen = {};
      ones.concat(dcs).forEach(function (v) { cur[v + '/0'] = { v: v, m: 0 }; });
      while (Object.keys(cur).length) {
        var arr = Object.keys(cur).map(function (k) { return cur[k]; }), used = {}, next = {}, a, b;
        for (a = 0; a < arr.length; a++) for (b = a + 1; b < arr.length; b++) if (arr[a].m === arr[b].m) {
          var d = arr[a].v ^ arr[b].v;
          if (d && (d & (d - 1)) === 0) { var nm = arr[a].m | d, nv = arr[a].v & ~d; next[nv + '/' + nm] = { v: nv, m: nm }; used[a] = used[b] = 1; }
        }
        arr.forEach(function (x, k) { if (!used[k] && !seen[x.v + '/' + x.m]) { seen[x.v + '/' + x.m] = 1; primes.push(x); } });
        cur = next;
      }
      var all = 0; ones.forEach(function (o) { all |= 1 << o; });
      primes.forEach(function (pi) { pi.mask = 0; ones.forEach(function (o) { if ((o & ~pi.m) === pi.v) pi.mask |= 1 << o; }); pi.lits = 4 - pop(pi.m); });
      primes = primes.filter(function (pi) { return pi.mask; });
      var best = null, bestCost = 1e9;
      (function rec(unc, chosen, cost) {
        if (!unc) { if (!best || chosen.length < best.length || (chosen.length === best.length && cost < bestCost)) { best = chosen.slice(); bestCost = cost; } return; }
        if (best && chosen.length + 1 > best.length) return;
        var pick = -1, fewest = 99, o, cand;
        for (o = 0; o < 16; o++) if (unc >> o & 1) { cand = primes.filter(function (pi) { return pi.mask >> o & 1; }); if (cand.length < fewest) { fewest = cand.length; pick = o; } }
        primes.filter(function (pi) { return pi.mask >> pick & 1; }).forEach(function (pi) { chosen.push(pi); rec(unc & ~pi.mask, chosen, cost + pi.lits); chosen.pop(); });
      })(all, [], 0);
      return { terms: best || [], nprime: primes.length };
    }
    function term(pi) { var s = '', names = 'ABCD', b; for (b = 3; b >= 0; b--) if (!(pi.m >> b & 1)) s += names[3 - b] + ((pi.v >> b & 1) ? '' : '′'); return s || '1'; }
    S.draw = function () {
      var ones = [], dcs = [], m;
      for (m = 0; m < 16; m++) { if (st[m] === 1) ones.push(m); else if (st[m] === 2) dcs.push(m); }
      var res = ones.length ? solve(ones, dcs) : { terms: [], nprime: 0 };
      for (m = 0; m < 16; m++) {
        var dots = '';
        res.terms.forEach(function (pi, k) { if ((m & ~pi.m) === pi.v) dots += '<i style="background:' + cols[k % cols.length] + '"></i>'; });
        btn[m].setAttribute('data-v', st[m]); btn[m].setAttribute('aria-label', 'minterm ' + m + ' is ' + ['0', '1', 'don’t care'][st[m]]);
        btn[m].innerHTML = '<small>' + m + '</small>' + ['0', '1', 'X'][st[m]] + '<span class="dots">' + dots + '</span>';
      }
      var lits = 0; res.terms.forEach(function (pi) { lits += pi.lits; });
      expr.innerHTML = 'F = ' + (ones.length ? res.terms.map(function (pi, k) { return '<span style="color:' + cols[k % cols.length] + '">' + term(pi) + '</span>'; }).join(' + ') : '0');
      info.innerHTML = 'F(A,B,C,D) = Σm(' + ones.join(', ') + ')' + (dcs.length ? ' + d(' + dcs.join(', ') + ')' : '') + '. ' + (ones.length ? res.terms.length + ' product term' + (res.terms.length > 1 ? 's' : '') + ', ' + lits + ' literal' + (lits !== 1 ? 's' : '') + ', chosen from ' + res.nprime + ' prime implicant' + (res.nprime !== 1 ? 's' : '') + '. A group of 2ᵏ cells removes k variables. Other equally small answers may exist.' : 'No minterms selected.');
    };
  });

  GS.sim('timing', function (S) {
    S.title('Setup and hold timing between two flip-flops', 'FF1 launches data on a clock edge, combinational logic delays it, FF2 captures it on the next edge. D2 must be steady inside the setup window before the edge and the hold window after it.');
    var T = S.slider('Clock period T', 2, 20, 0.5, 10, 'ns'), cq = S.slider('t_cq', 0.2, 3, 0.1, 1, 'ns'), pd = S.slider('Longest logic delay', 0.5, 15, 0.5, 5, 'ns'), cd = S.slider('Shortest logic delay', 0, 5, 0.1, 1, 'ns'), su = S.slider('t_setup', 0.2, 3, 0.1, 1, 'ns'), ho = S.slider('t_hold', 0, 3, 0.1, 0.5, 'ns');
    var p = S.canvas(290);
    S.draw = function () {
      var t = T.v, a = cq.v, b = pd.v, c = Math.min(cd.v, pd.v), s = su.v, h = ho.v, C, e, X1 = 2 * t + 2;
      var sSlack = t - (a + b + s), hSlack = a + c - h;
      p.begin(); C = p.C; p.frame({ x: [-1, X1], y: [0, 3.6], xl: 'time (ns)', noyt: true, m: [54, 12, 14, 40] });
      p.label('CLK', p.b.L - 8, p.Y(3), C.ink, 'right'); p.label('Q1', p.b.L - 8, p.Y(2), C.ink, 'right'); p.label('D2', p.b.L - 8, p.Y(1), C.ink, 'right');
      var cx = [-1], cy = [2.75];
      for (e = 0; e <= 2; e++) { cx.push(e * t, e * t, e * t + t / 2, e * t + t / 2); cy.push(2.75, 3.3, 3.3, 2.75); }
      cx.push(X1); cy.push(2.75); p.path(cx, cy, C.ink, 2);
      for (e = 0; e <= 2; e++) {
        p.vline(e * t, C.mute, [2, 4]);
        p.rect(e * t - s, 0.55, e * t, 1.45, sSlack < 0 && e > 0 ? C.bad : C.b, 0.3); p.rect(e * t, 0.55, e * t + h, 1.45, hSlack < 0 ? C.bad : C.c, 0.3);
      }
      p.text('setup', t - s / 2, 0.55, C.b, 'center', 0, 10); p.text('hold', t + h / 2, 1.45, C.c, 'center', 0, -9);
      p.seg(-1, 2.25, X1, 2.25, C.a, 2); p.seg(-1, 1.75, X1, 1.75, C.a, 2); p.seg(-1, 1.25, X1, 1.25, C.d, 2); p.seg(-1, 0.75, X1, 0.75, C.d, 2);
      var w = (X1 + 1) * 0.012;
      for (e = 0; e <= 2; e++) {
        var q = e * t + a; p.seg(q - w, 2.25, q + w, 1.75, C.a, 2); p.seg(q - w, 1.75, q + w, 2.25, C.a, 2);
        p.rect(q + c, 0.75, q + b, 1.25, C.d, 0.45);
        p.seg(q + b - w, 1.25, q + b + w, 0.75, C.d, 2); p.seg(q + b - w, 0.75, q + b + w, 1.25, C.d, 2);
      }
      p.text('D2 may be changing', a + (b + c) / 2, 1.25, C.d, 'center', 0, -9);
      S.show('<span>setup slack = T − (t_cq + t_pd + t_su) = <b>' + f(sSlack) + ' ns</b> <span class="pill ' + (sSlack >= 0 ? 'ok">met' : 'bad">violated') + '</span></span><span>hold slack = t_cq + t_cd − t_h = <b>' + f(hSlack) + ' ns</b> <span class="pill ' + (hSlack >= 0 ? 'ok">met' : 'bad">violated') + '</span></span><span>minimum period = <b>' + f(a + b + s) + ' ns</b></span><span>f_max = <b>' + si(1e9 / (a + b + s)) + 'Hz</b></span>' +
        '<span class="wide">Setup depends on the clock period and the longest path: slow the clock and it is fixed. Hold depends only on the shortest path and does not contain T at all: no clock speed can fix a hold violation, only added delay can.</span>');
    };
  });

  GS.sim('quantize', function (S) {
    S.title('Quantization: bits, step size and noise', 'A sine wave goes through a uniform quantizer with full-scale range ±1 V. Every extra bit halves the step and buys about 6 dB of signal-to-quantization-noise ratio.');
    var B = S.slider('Bits n', 1, 10, 1, 3), A = S.slider('Signal amplitude', 0.05, 1, 0.05, 1, 'V');
    var p = S.canvas(360);
    S.draw = function () {
      var n = B.v, L = Math.pow(2, n), D = 2 / L, a = A.v, C, i;
      var q = function (x) { return GS.clamp(D * (Math.floor(x / D) + 0.5), -1 + D / 2, 1 - D / 2); };
      p.begin(); C = p.C;
      p.frame({ box: [0, 0, 1, 0.62], x: [0, 2 * PI], y: [-1.12, 1.12], noxt: true, yl: 'volts' });
      p.fn(function (x) { return a * sin(x); }, C.mute, 1.6); p.fn(function (x) { return q(a * sin(x)); }, C.a, 2.2, null, 1400);
      p.legend([['input', C.mute], ['quantized', C.a]]);
      p.frame({ box: [0, 0.62, 1, 0.38], x: [0, 2 * PI], y: [-D * 0.75, D * 0.75], xl: 'one period of the input', yl: 'error' });
      p.hline(D / 2, C.mute); p.hline(-D / 2, C.mute); p.fn(function (x) { return q(a * sin(x)) - a * sin(x); }, C.b, 1.6, null, 1400);
      var N = 20000, pe = 0; for (i = 0; i < N; i++) { var x = a * sin(2 * PI * (i + 0.5) / N), e = q(x) - x; pe += e * e; }
      var meas = 10 * Math.log10(a * a / 2 / (pe / N));
      S.show('<span>levels L = 2ⁿ = <b>' + L + '</b></span><span>step Δ = 2V/L = <b>' + si(D) + 'V</b></span><span>max error = Δ/2 = <b>' + si(D / 2) + 'V</b></span><span>noise power Δ²/12 = <b>' + si(D * D / 12) + 'W</b></span><span class="k2">SQNR measured here = <b>' + f(meas, 4) + ' dB</b></span><span>full-scale formula 6.02n + 1.76 = <b>' + f(6.02 * n + 1.76, 4) + ' dB</b></span>' +
        '<span class="wide">Lower the amplitude and the SQNR drops, because the noise stays at Δ²/12 while the signal shrinks. Speech is mostly quiet, which is why telephone PCM compands (µ-law, A-law) before quantizing. Telephone PCM: 8 kHz × 8 bits = 64 kbit/s.</span>');
    };
  });

  GS.sim('pipeline', function (S) {
    S.title('Instruction pipeline, cycle by cycle', 'Each row is an instruction and each column a clock cycle. After the pipeline fills, one instruction finishes every cycle. Add stall cycles to instruction 3 to see what a hazard costs.');
    var K = S.slider('Stages k', 2, 8, 1, 5), N = S.slider('Instructions n', 1, 10, 1, 6), St = S.slider('Stall cycles before I3', 0, 3, 1, 0);
    var p = S.canvas(240); S.animate();
    S.draw = function (t) {
      var k = K.v, n = N.v, st = n >= 3 ? St.v : 0, tot = k + n - 1 + st, C, c, i, s;
      var names = k === 5 ? ['IF', 'ID', 'EX', 'MEM', 'WB'] : (k === 4 ? ['IF', 'ID', 'EX', 'WB'] : null);
      p.setH(34 + n * 30 + 10); p.begin(); C = p.C; c = p.ctx;
      var cw = Math.min(58, (p.w - 50) / tot), ch = 26, x0 = 44, y0 = 30, cols = [C.a, C.b, C.c, C.d];
      var now = Math.floor(t * 1.3) % (tot + 2);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (s = 0; s < tot; s++) {
        if (s === now) { c.fillStyle = C.grid; c.fillRect(x0 + s * cw, 4, cw, y0 + n * 30); }
        c.fillStyle = s === now ? C.ink : C.mute; c.fillText(String(s + 1), x0 + s * cw + cw / 2, 16);
      }
      var doneCount = 0;
      for (i = 0; i < n; i++) {
        var start = i + (i >= 2 ? st : 0), y = y0 + i * 30;
        c.fillStyle = C.ink; c.textAlign = 'right'; c.fillText('I' + (i + 1), x0 - 8, y + ch / 2); c.textAlign = 'center';
        if (i === 2 && st) for (s = 0; s < st; s++) { c.strokeStyle = C.bad; c.setLineDash([3, 3]); c.strokeRect(x0 + (i + s) * cw + 2, y + 1, cw - 4, ch - 2); c.setLineDash([]); c.fillStyle = C.bad; c.fillText('stall', x0 + (i + s) * cw + cw / 2, y + ch / 2); }
        for (s = 0; s < k; s++) {
          var col = start + s, x = x0 + col * cw;
          c.globalAlpha = col <= now ? 0.9 : 0.25; c.fillStyle = cols[s % 4]; c.fillRect(x + 2, y + 1, cw - 4, ch - 2); c.globalAlpha = 1;
          c.fillStyle = col <= now ? C.bg : C.ink; c.fillText(names ? names[s] : 'S' + (s + 1), x + cw / 2, y + ch / 2);
        }
        if (start + k - 1 <= now) doneCount++;
      }
      S.show('<span>pipelined: k + n − 1' + (st ? ' + stalls' : '') + ' = <b>' + tot + ' cycles</b></span><span>one at a time: n × k = <b>' + n * k + ' cycles</b></span><span class="k4">speedup = <b>' + f(n * k / tot) + '</b></span><span>limit for very long programs = <b>' + k + '</b></span><span>cycle ' + Math.min(now + 1, tot) + ': <b>' + doneCount + '</b> of ' + n + ' finished</span>' +
        '<span class="wide">This assumes every stage takes one equal clock period. In a real design the clock period is the slowest stage plus the pipeline-register delay, so the speedup is less than k even without stalls.</span>');
    };
  });
})();
