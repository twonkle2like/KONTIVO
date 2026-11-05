/* Review-Card 3D – three.js (r128, globales THREE). Aktiviert sich auf jedem [data-review-card-3d].
   Optionen per data-Attribut: data-qr-src="qr.png" (echter QR-Code), data-footer-text="…" */
(function () {
  'use strict';

  /* ===== Einstellungen: hier Größe, Neigung und Animation anpassen ===== */
  var CONFIG = {
    cardW: 1, cardH: 1.42, thickness: 0.03, radius: 0.07,
    leanDeg: 9,            // Rückneigung der Karte auf dem Standfuß
    baseYaw: 0.32,         // Grunddrehung (zeigt die linke Kante)
    fov: 30,
    fit: { w: 1.5, h: 1.95 },          // Platzbedarf im Bild (größer = Karte kleiner)
    float: { amp: 0.03, speed: 1.1 },  // Schweben
    tilt: { yaw: 0.2, pitch: 0.12 },   // Maus-/Touch-Neigung (rad)
    scrollYaw: 0.35,                   // Drehung beim Scrollen (rad)
    follow: 5                          // Weichheit der Bewegung (höher = direkter)
  };

  var FONT = 'Inter,Arial,sans-serif';
  var GOOGLE = ['#4285F4', '#EA4335', '#FBBC05', '#4285F4', '#34A853', '#EA4335'];

  /* ===== Kartenvorderseite per Canvas zeichnen ===== */
  function rr(x, X, Y, w, h, r) {
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
  }
  function star(x, cx, cy, R) {
    x.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.48 : R;
      x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    x.closePath(); x.fill();
  }
  function arcs(x, px, py, r, a0, a1, n) {
    for (var k = 1; k <= n; k++) { x.beginPath(); x.arc(px, py, r * k, a0, a1); x.stroke(); }
  }
  function phone(x, cx, cy, w, h, lw, withQr) {
    x.lineWidth = lw; rr(x, cx - w / 2, cy - h / 2, w, h, w * 0.16); x.stroke();
    x.beginPath(); x.moveTo(cx - w * 0.14, cy - h / 2 + lw * 2.4); x.lineTo(cx + w * 0.14, cy - h / 2 + lw * 2.4); x.stroke();
    if (withQr) {
      var s = w * 0.5, x0 = cx - s / 2, y0 = cy - s / 2, m = s / 5;
      x.lineWidth = lw * 0.6;
      [[0, 0], [3, 0], [0, 3]].forEach(function (p) { x.strokeRect(x0 + p[0] * m, y0 + p[1] * m, m * 2, m * 2); });
      x.fillRect(x0 + 3 * m, y0 + 3 * m, m, m);
    }
  }
  // Platzhalter-Muster – KEIN funktionierender QR-Code
  function qrPlaceholder(x, X, Y, S, pad) {
    var N = 25, m = (S - pad * 2) / N, s = 0x9e3779b9;
    function rnd() {
      s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    x.fillStyle = '#000';
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
      if ((i < 8 && j < 8) || (i > N - 9 && j < 8) || (i < 8 && j > N - 9)) continue;
      if (rnd() > 0.52) x.fillRect(X + pad + i * m, Y + pad + j * m, m + 0.5, m + 0.5);
    }
    [[0, 0], [N - 7, 0], [0, N - 7]].forEach(function (p) {
      var fx = X + pad + p[0] * m, fy = Y + pad + p[1] * m;
      x.fillStyle = '#000'; x.fillRect(fx, fy, 7 * m, 7 * m);
      x.fillStyle = '#fff'; x.fillRect(fx + m, fy + m, 5 * m, 5 * m);
      x.fillStyle = '#000'; x.fillRect(fx + 2 * m, fy + 2 * m, 3 * m, 3 * m);
    });
  }

  function drawFace(W, H, footer, qrImg) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'), u = W / 1000, cx = W / 2;
    x.fillStyle = '#050505'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';

    // NFC-Symbol oben rechts
    x.lineWidth = 6 * u; x.lineCap = 'round';
    x.beginPath(); x.arc(W - 128 * u, 112 * u, 6 * u, 0, 7); x.fill();
    arcs(x, W - 128 * u, 112 * u, 20 * u, -Math.PI / 2, 0, 3);

    // „Bewerte uns auf“
    x.font = '600 ' + 60 * u + 'px ' + FONT; x.fillText('Bewerte uns auf', cx, 0.115 * H);

    // Google-Schriftzug (mehrfarbig)
    x.font = '700 100px ' + FONT;
    var word = 'Google', widths = [], total = 0, i;
    for (i = 0; i < word.length; i++) { widths[i] = x.measureText(word[i]).width; total += widths[i]; }
    var fs = 100 * (610 * u) / total, px = cx - 305 * u;
    x.font = '700 ' + fs + 'px ' + FONT; x.textAlign = 'left';
    for (i = 0; i < word.length; i++) {
      x.fillStyle = GOOGLE[i]; x.fillText(word[i], px, 0.262 * H); px += widths[i] * fs / 100;
    }

    // Fünf Sterne
    x.fillStyle = '#FBBC05';
    for (i = 0; i < 5; i++) star(x, cx + (i - 2) * 96 * u, 0.317 * H, 40 * u);

    // Farbstreifen
    var sw = 700 * u / 4, sy = 0.388 * H;
    ['#4285F4', '#EA4335', '#FBBC05', '#34A853'].forEach(function (col, k) {
      x.fillStyle = col; x.fillRect(150 * u + k * sw, sy, sw + 1, 15 * u);
    });

    // QR-Feld mit Eckmarkierungen
    var S = 360 * u, X = cx - S / 2, Y = 0.585 * H - S / 2;
    x.fillStyle = '#fff'; rr(x, X, Y, S, S, 10 * u); x.fill();
    if (qrImg) x.drawImage(qrImg, X + 18 * u, Y + 18 * u, S - 36 * u, S - 36 * u); else qrPlaceholder(x, X, Y, S, 18 * u);
    x.strokeStyle = '#fff'; x.lineWidth = 6 * u; x.lineCap = 'round'; x.lineJoin = 'round';
    var g = 30 * u, a = 70 * u, L = X - g, R = X + S + g, T = Y - g, B = Y + S + g;
    [[L, T, 1, 1], [R, T, -1, 1], [L, B, 1, -1], [R, B, -1, -1]].forEach(function (p) {
      x.beginPath(); x.moveTo(p[0] + p[2] * a, p[1]); x.lineTo(p[0] + p[2] * 14 * u, p[1]);
      x.quadraticCurveTo(p[0], p[1], p[0], p[1] + p[3] * 14 * u); x.lineTo(p[0], p[1] + p[3] * a); x.stroke();
    });

    // Tap – OR – Scan
    var ry = 0.84 * H;
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '600 ' + 42 * u + 'px ' + FONT;
    x.fillText('Tap', 140 * u, ry + 14 * u); x.fillText('OR', cx, ry + 14 * u); x.fillText('Scan', W - 140 * u, ry + 14 * u);
    x.lineWidth = 5 * u; x.strokeStyle = '#fff';
    arcs(x, 262 * u, ry, 16 * u, -0.9, 0.9, 3);
    phone(x, 345 * u, ry, 78 * u, 130 * u, 5 * u, false);
    phone(x, 655 * u, ry, 78 * u, 130 * u, 5 * u, true);

    // Fußzeile
    x.font = '500 ' + 31 * u + 'px ' + FONT; x.fillStyle = '#fff'; x.fillText(footer, cx, 0.935 * H);
    return c;
  }

  /* ===== three.js-Helfer ===== */
  function roundedRect(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2, P = Math.PI;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -P / 2, 0, false);
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, P / 2, false);
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, P / 2, P, false);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, P, P * 1.5, false);
    return s;
  }
  // Kleine „Studio“-Umgebung für die Reflexionen auf dem schwarzen Glanz
  function makeEnv(renderer) {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    var g = c.getContext('2d'), bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#2b2d32'); bg.addColorStop(0.5, '#17181b'); bg.addColorStop(1, '#050506');
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#ffffff'; g.fillRect(650, 60, 170, 140);
    g.fillStyle = '#cfd8e6'; g.fillRect(890, 100, 28, 280);
    g.fillStyle = '#8a8f99'; g.fillRect(500, 150, 100, 60);
    var t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer), rt = pm.fromEquirectangular(t);
    t.dispose(); pm.dispose(); return rt.texture;
  }

  /* ===== Komponente ===== */
  function ReviewCard3D(root) {
    var self = this;
    this.root = root;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.footer = root.getAttribute('data-footer-text') || 'Powered by ABC RFID';
    var qrSrc = root.getAttribute('data-qr-src');

    var fontReady = (document.fonts && document.fonts.load)
      ? Promise.race([document.fonts.load('600 40px Inter'), new Promise(function (r) { setTimeout(r, 1500); })]).catch(function () {})
      : Promise.resolve();
    var qrReady = new Promise(function (resolve) {
      if (!qrSrc) return resolve(null);
      var img = new Image(); img.onload = function () { resolve(img); }; img.onerror = function () { resolve(null); }; img.src = qrSrc;
    });

    Promise.all([fontReady, qrReady]).then(function (r) {
      self.face = null; self.qrImg = r[1];
      try { self.initGL(); } catch (e) { self.fallback(); }
    });
  }

  ReviewCard3D.prototype.fallback = function () {
    var cv = drawFace(800, 1136, this.footer, this.qrImg);
    cv.className = 'rc3d__flat'; cv.setAttribute('aria-hidden', 'true');
    this.root.classList.add('is-fallback'); this.root.appendChild(cv);
    if (this.stop) this.stop();
  };

  ReviewCard3D.prototype.initGL = function () {
    if (!window.THREE) throw new Error('three.js fehlt');
    var self = this, C = CONFIG, root = this.root;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var canvas = renderer.domElement; canvas.className = 'rc3d__canvas'; canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(canvas);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); canvas.remove(); self.fallback(); });

    var scene = new THREE.Scene();
    scene.environment = makeEnv(renderer);
    var camera = new THREE.PerspectiveCamera(C.fov, 1, 0.1, 50);

    var sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(-1.8, 3.2, 2.4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006;
    var sc = sun.shadow.camera; sc.left = -2; sc.right = 2; sc.top = 2; sc.bottom = -2; sc.near = 0.5; sc.far = 10;
    scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x222222, 0.25));

    // Material
    var black = new THREE.MeshPhysicalMaterial({ color: 0x080808, roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3 });
    var W = C.cardW, H = C.cardH, T = C.thickness, BS = 0.012, BT = 0.012;

    // Kartenkörper mit abgerundeten Kanten
    var body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(W - 2 * BS, H - 2 * BS, C.radius - BS), {
      depth: T, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 6, curveSegments: 32
    }), black);
    body.geometry.translate(0, 0, -T / 2); body.castShadow = true;

    // Bedruckte Vorderseite
    var iw = W - 2 * BS - 0.01, ih = H - 2 * BS - 0.01;
    var CW = 1024, CH = Math.round(CW * ih / iw);
    var tex = new THREE.CanvasTexture(drawFace(CW, CH, this.footer, this.qrImg));
    tex.encoding = THREE.sRGBEncoding; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var fg = new THREE.ShapeGeometry(roundedRect(iw, ih, C.radius - BS - 0.005), 32), uv = fg.attributes.uv, pos = fg.attributes.position;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + iw / 2) / iw, (pos.getY(i) + ih / 2) / ih);
    var face = new THREE.Mesh(fg, new THREE.MeshPhysicalMaterial({
      map: tex, roughness: 0.4, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 0.9,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.45
    }));
    face.position.z = T / 2 + BT + 0.0006;

    var lean = C.leanDeg * Math.PI / 180;
    var card = new THREE.Group(); card.add(body, face);
    card.position.y = H / 2;
    var pivot = new THREE.Group(); pivot.add(card); pivot.rotation.x = -lean;

    // Dreieckiger Standfuß hinter der Karte
    var tt = T + 2 * BT, s = 0.5;
    var cz = -s * Math.sin(lean) - tt / 2 * Math.cos(lean), cy = s * Math.cos(lean) - tt / 2 * Math.sin(lean);
    var tri = new THREE.Shape(); tri.moveTo(-0.02, 0); tri.lineTo(-0.66, 0); tri.lineTo(cz, cy); tri.closePath();
    var fw = W * 0.62;
    var footGeo = new THREE.ExtrudeGeometry(tri, { depth: fw - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 4 });
    footGeo.translate(0, 0, -(fw - 0.03) / 2); footGeo.rotateY(-Math.PI / 2);
    var foot = new THREE.Mesh(footGeo, black); foot.position.y = 0.012; foot.castShadow = true;

    var rig = new THREE.Group(); rig.add(pivot, foot); rig.position.z = -0.1; scene.add(rig);

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.5 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true; scene.add(ground);

    // Größe & Kamera
    function resize() {
      var w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false);
      var asp = w / h, t = Math.tan(C.fov * Math.PI / 360);
      var dist = Math.max(C.fit.h / 2 / t, C.fit.w / 2 / (t * asp));
      camera.aspect = asp; camera.position.set(0, 0.95, dist); camera.lookAt(0, 0.66, 0); camera.updateProjectionMatrix();
      if (!self.running) renderer.render(scene, camera);
    }

    // Zustand
    var tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, scr = { t: 0, v: 0 };
    function pointer(e) {
      if (self.reduced.matches) return;
      var r = root.getBoundingClientRect();
      tgt.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      tgt.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    }
    function reset() { tgt.x = 0; tgt.y = 0; }
    root.addEventListener('pointermove', pointer); root.addEventListener('pointerdown', pointer);
    root.addEventListener('pointerleave', reset); root.addEventListener('pointercancel', reset); root.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') reset(); });
    function onScroll() {
      if (self.reduced.matches) return;
      var r = root.getBoundingClientRect(), vh = window.innerHeight || 1;
      scr.t = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / vh));
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    function pose(dt, t) {
      var k = 1 - Math.exp(-dt * C.follow), still = self.reduced.matches;
      cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k; scr.v += (scr.t - scr.v) * k;
      var f = still ? 0 : 1;
      rig.rotation.y = C.baseYaw + f * (cur.x * C.tilt.yaw + scr.v * C.scrollYaw + 0.03 * Math.sin(t * 0.6));
      rig.rotation.x = f * cur.y * C.tilt.pitch;
      rig.rotation.z = f * 0.01 * Math.sin(t * 0.8);
      rig.position.y = f * (C.float.amp * (1 + Math.sin(t * C.float.speed)));
    }

    var raf = 0, last = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      pose(dt, now / 1000); renderer.render(scene, camera);
    }
    this.running = false;
    function start() { if (self.running || self.reduced.matches) return; self.running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    this.stop = function () { self.running = false; cancelAnimationFrame(raf); };
    function still() { pose(0.016, 0); renderer.render(scene, camera); }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(root); else window.addEventListener('resize', resize);
    resize(); still(); root.classList.add('is-ready');

    // Nur rendern, solange die Karte sichtbar ist
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : self.stop(); }).observe(root);
    } else start();
    this.reduced.addEventListener && this.reduced.addEventListener('change', function () {
      if (self.reduced.matches) { self.stop(); reset(); scr.t = 0; still(); } else start();
    });
  };

  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-review-card-3d]'), function (el) { new ReviewCard3D(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
