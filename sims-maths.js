/* Section 1: Engineering Mathematics */
(function () {
  'use strict';
  var GS = window.GS, f = GS.f, sin = Math.sin, cos = Math.cos, PI = Math.PI, sqrt = Math.sqrt, exp = Math.exp, abs = Math.abs;

  GS.sim('eigen', function (S) {
    S.title('Eigenvectors of a 2×2 matrix', 'A maps the dashed unit circle to the solid ellipse. The grey arrow x sweeps round the circle and the orange arrow is Ax. Along the two dotted lines, Ax stays on the same line as x: those directions are the eigenvectors.');
    var a = S.slider('a₁₁', -3, 3, 0.1, 2), b = S.slider('a₁₂', -3, 3, 0.1, 1), c = S.slider('a₂₁', -3, 3, 0.1, 1), d = S.slider('a₂₂', -3, 3, 0.1, 2);
    var p = S.canvas(340); S.animate();
    S.draw = function (t) {
      var A = [a.v, b.v, c.v, d.v], tr = A[0] + A[3], det = A[0] * A[3] - A[1] * A[2], disc = tr * tr - 4 * det, C;
      p.begin(); C = p.C; p.frame({ x: [-5, 5], y: [-5, 5], equal: true });
      var xs = [], ys = [], us = [], vs = [], i;
      for (i = 0; i <= 160; i++) { var th = i / 160 * 2 * PI, x = cos(th), y = sin(th); xs.push(x); ys.push(y); us.push(A[0] * x + A[1] * y); vs.push(A[2] * x + A[3] * y); }
      p.path(xs, ys, C.mute, 1.5, [4, 4]); p.path(us, vs, C.a, 2);
      var out = '<span>trace = <b>' + f(tr) + '</b></span><span>det = <b>' + f(det) + '</b></span>';
      if (disc >= -1e-12) {
        var r = sqrt(Math.max(0, disc)), lam = [(tr + r) / 2, (tr - r) / 2], cols = [C.c, C.d], cls = ['k3', 'k4'];
        lam.forEach(function (l, k) {
          var vx = A[1], vy = l - A[0];
          if (abs(vx) + abs(vy) < 1e-9) { vx = l - A[3]; vy = A[2]; }
          var n = sqrt(vx * vx + vy * vy);
          if (n > 1e-9) { vx /= n; vy /= n; p.seg(-8 * vx, -8 * vy, 8 * vx, 8 * vy, cols[k], 1.6, [2, 5]); }
          out += '<span class="' + cls[k] + '">λ' + (k + 1) + ' = <b>' + f(l) + '</b>' + (n > 1e-9 ? ', v = (' + f(vx, 2) + ', ' + f(vy, 2) + ')' : ', every vector') + '</span>';
        });
        out += '<span class="wide">Check: λ₁ + λ₂ = trace and λ₁λ₂ = det. ' + (abs(det) < 0.005 ? 'det = 0, so one eigenvalue is 0 and the ellipse collapses to a line (rank 1).' : (abs(A[1] - A[2]) < 1e-9 ? 'The matrix is symmetric, so the eigenvectors are perpendicular.' : '')) + '</span>';
      } else {
        out += '<span>λ = <b>' + f(tr / 2) + ' ± j' + f(sqrt(-disc) / 2) + '</b></span><span class="wide">Complex eigenvalues: A rotates every real vector, so no real direction is preserved.</span>';
      }
      var th2 = t * 0.6, x2 = cos(th2), y2 = sin(th2);
      p.arrow(0, 0, x2, y2, C.mute, 2); p.arrow(0, 0, A[0] * x2 + A[1] * y2, A[2] * x2 + A[3] * y2, C.b, 2.5);
      p.legend([['x', C.mute], ['Ax', C.b], ['image of circle', C.a]]);
      S.show(out);
    };
  });

  GS.sim('taylor', function (S) {
    S.title('Taylor polynomial building up', 'Add terms and watch the polynomial hug the function over a wider range. For ln(1+x) and 1/(1−x) it never works outside |x| < 1, however many terms you add.');
    var fn = S.select('Function', [['sin', 'sin x'], ['cos', 'cos x'], ['exp', 'e^x'], ['ln', 'ln(1+x)'], ['geo', '1/(1−x)']]);
    var N = S.slider('Terms', 1, 12, 1, 3);
    var p = S.canvas(300);
    var defs = {
      sin: { f: sin, x: [-7, 7], y: [-2.5, 2.5], term: function (k, x) { var n = 2 * k + 1, v = (k % 2 ? -1 : 1) * Math.pow(x, n); for (var i = 2; i <= n; i++) v /= i; return v; }, s: 'x − x³/3! + x⁵/5! − …' },
      cos: { f: cos, x: [-7, 7], y: [-2.5, 2.5], term: function (k, x) { var n = 2 * k, v = (k % 2 ? -1 : 1) * Math.pow(x, n); for (var i = 2; i <= n; i++) v /= i; return v; }, s: '1 − x²/2! + x⁴/4! − …' },
      exp: { f: exp, x: [-4, 3], y: [-2, 12], term: function (k, x) { var v = Math.pow(x, k); for (var i = 2; i <= k; i++) v /= i; return v; }, s: '1 + x + x²/2! + x³/3! + …' },
      ln: { f: function (x) { return x > -1 ? Math.log(1 + x) : NaN; }, x: [-1.5, 2.5], y: [-3, 3], term: function (k, x) { var n = k + 1; return (n % 2 ? 1 : -1) * Math.pow(x, n) / n; }, s: 'x − x²/2 + x³/3 − …  (|x| < 1)', R: 1 },
      geo: { f: function (x) { return abs(1 - x) < 1e-3 ? NaN : 1 / (1 - x); }, x: [-2, 2], y: [-4, 6], term: function (k, x) { return Math.pow(x, k); }, s: '1 + x + x² + x³ + …  (|x| < 1)', R: 1 }
    };
    S.draw = function () {
      var D = defs[fn.v], n = N.v, C;
      p.begin(); C = p.C; p.frame({ x: D.x, y: D.y, xl: 'x' });
      if (D.R) p.rect(-D.R, D.y[0], D.R, D.y[1], C.d, 0.1);
      p.fn(D.f, C.mute, 2.5);
      var P = function (x) { var s = 0; for (var k = 0; k < n; k++) s += D.term(k, x); return s; };
      p.fn(P, C.a, 2);
      p.legend([['exact', C.mute], [n + '-term polynomial', C.a]].concat(D.R ? [['converges here', C.d]] : []));
      var x0 = fn.v === 'ln' || fn.v === 'geo' ? 0.5 : 2;
      S.show('<span>Series about x = 0: <b>' + D.s + '</b></span><span>At x = ' + x0 + ': exact <b>' + f(D.f(x0), 5) + '</b>, polynomial <b>' + f(P(x0), 5) + '</b>, error <b>' + f(abs(D.f(x0) - P(x0)), 2) + '</b></span>');
    };
  });

  GS.sim('vfield', function (S) {
    S.title('Divergence and curl of a vector field', 'Dots are carried by the field like dust in a flow. Divergence means dots spread out from every point. Curl means a small paddle wheel placed in the flow would spin.');
    var fields = {
      source: { F: function (x, y) { return [x, y]; }, s: 'F = xî + yĵ', div: 2, curl: 0, note: 'Pure source: spreads, no rotation. Like the E field around positive charge.' },
      rot: { F: function (x, y) { return [-y, x]; }, s: 'F = −yî + xĵ', div: 0, curl: 2, note: 'Pure rotation: nothing is created or destroyed. Like the H field inside a current-carrying wire.' },
      shear: { F: function (x, y) { return [y, 0]; }, s: 'F = yî', div: 0, curl: -1, note: 'Straight flow lines, yet the curl is not zero: a paddle wheel turns because the flow is faster on one side.' },
      saddle: { F: function (x, y) { return [x, -y]; }, s: 'F = xî − yĵ', div: 0, curl: 0, note: 'Solenoidal and irrotational: what enters along y leaves along x. F = ∇(x²/2 − y²/2).' },
      spiral: { F: function (x, y) { return [x - y, x + y]; }, s: 'F = (x−y)î + (x+y)ĵ', div: 2, curl: 2, note: 'Source plus rotation together.' }
    };
    var sel = S.select('Field', [['source', 'Source'], ['rot', 'Rotation'], ['shear', 'Shear flow'], ['saddle', 'Saddle'], ['spiral', 'Spiral']]);
    var p = S.canvas(340); S.animate();
    var rnd = GS.rng(7), pts = [];
    function spawn(q) { q.x = (rnd() * 2 - 1) * 2.4; q.y = (rnd() * 2 - 1) * 2.4; q.life = 1 + rnd() * 3; }
    for (var i = 0; i < 260; i++) { var q = {}; spawn(q); pts.push(q); }
    S.draw = function (t, dt) {
      var D = fields[sel.v], C, ix, iy;
      p.begin(); C = p.C; p.frame({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true });
      for (ix = -2; ix <= 2; ix += 0.5) for (iy = -2; iy <= 2; iy += 0.5) {
        var v = D.F(ix, iy), m = sqrt(v[0] * v[0] + v[1] * v[1]);
        if (m > 1e-6) { var s = 0.2 * Math.min(1, m / 1.5) / m; p.arrow(ix - v[0] * s, iy - v[1] * s, ix + v[0] * s, iy + v[1] * s, C.mute, 1.2); }
      }
      var c = p.ctx; c.fillStyle = C.a;
      pts.forEach(function (q) {
        var v2 = D.F(q.x, q.y); q.x += v2[0] * dt * 0.5; q.y += v2[1] * dt * 0.5; q.life -= dt;
        if (q.life < 0 || abs(q.x) > 2.4 || abs(q.y) > 2.4) spawn(q);
        c.globalAlpha = Math.min(1, q.life); c.beginPath(); c.arc(p.X(q.x), p.Y(q.y), 2.2, 0, 6.2832); c.fill();
      });
      c.globalAlpha = 1;
      S.show('<span><b>' + D.s + '</b></span><span>∇·F = <b>' + D.div + '</b></span><span>(∇×F)<sub>z</sub> = <b>' + D.curl + '</b></span><span class="wide">' + D.note + '</span>');
    };
  });

  GS.sim('distrib', function (S) {
    S.title('Binomial, with its Poisson and Normal approximations', 'Bars are the exact Binomial(n, p). The Poisson approximation works when n is large and p is small. The Normal approximation works when np and n(1−p) are both large.');
    var n = S.slider('n trials', 1, 80, 1, 20), pr = S.slider('p success', 0.01, 0.99, 0.01, 0.2);
    var sp = S.check('Poisson(λ = np)', true), sn = S.check('Normal(np, npq)', true);
    var p = S.canvas(300);
    S.draw = function () {
      var N = n.v, P = pr.v, q = 1 - P, mu = N * P, v = N * P * q, sd = sqrt(v), C, k;
      var pm = [Math.pow(q, N)]; for (k = 0; k < N; k++) pm.push(pm[k] * (N - k) / (k + 1) * P / q);
      var po = [exp(-mu)]; for (k = 0; k < N; k++) po.push(po[k] * mu / (k + 1));
      var ymax = Math.max.apply(null, pm) * 1.25;
      p.begin(); C = p.C; p.frame({ x: [-0.7, N + 0.7], y: [0, ymax], xl: 'k successes', yl: 'P(X = k)' });
      for (k = 0; k <= N; k++) p.rect(k - 0.38, 0, k + 0.38, pm[k], C.a, 0.55);
      var items = [['Binomial', C.a]];
      if (sn.v) { p.fn(function (x) { return exp(-(x - mu) * (x - mu) / (2 * v)) / (sd * sqrt(2 * PI)); }, C.c, 2); items.push(['Normal', C.c]); }
      if (sp.v) { for (k = 0; k <= N; k++) p.dot(k, po[k], C.b, 3.2); items.push(['Poisson', C.b]); }
      p.legend(items);
      var errP = 0, errN = 0;
      for (k = 0; k <= N; k++) { errP = Math.max(errP, abs(pm[k] - po[k])); errN = Math.max(errN, abs(pm[k] - exp(-(k - mu) * (k - mu) / (2 * v)) / (sd * sqrt(2 * PI)))); }
      S.show('<span>mean np = <b>' + f(mu) + '</b></span><span>variance npq = <b>' + f(v) + '</b></span><span>σ = <b>' + f(sd) + '</b></span>' +
        '<span class="k2">worst Poisson error ' + f(errP, 2) + '</span><span class="k3">worst Normal error ' + f(errN, 2) + '</span>' +
        '<span class="wide">Poisson has variance equal to its mean (' + f(mu) + '), but the Binomial variance is smaller by the factor q = ' + f(q) + '. That is why Poisson fits only when p is small.</span>');
    };
  });
})();
