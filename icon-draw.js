/*
  Dibuja el icono de la Calculadora en un canvas.
  Lo usan background.js (icono de la barra de Chrome) e iconos.html (descarga de PNG).
  Diseño: carcasa oscura, pantalla con cifras ámbar brillantes y teclas con relieve
  (una crema, una gris y la naranja de "=") — igual que la calculadora.
*/
(function () {
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function vgrad(ctx, y0, y1, c0, c1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    return g;
  }

  const KEY = {
    dark: ["#4a423c", "#2f2924", "#110e0c"],
    fn:   ["#f1e8d8", "#cfc3ae", "#7d725f"],
    op:   ["#7a6d61", "#564b42", "#211b17"],
    eq:   ["#ffae5a", "#e9701a", "#7a3505"],
  };

  function drawCalcIcon(ctx, size) {
    const compact = size < 48; // pantalla ámbar sólida, sin cifras
    const tiny = size < 24;    // solo dos teclas
    const pad = size >= 128 ? size * 0.09 : size >= 48 ? size * 0.04 : 0;
    const b = size - pad * 2;
    const X = (v) => pad + v * b;
    const L = (v) => v * b;

    ctx.clearRect(0, 0, size, size);

    // ---- Carcasa ----
    const bodyR = L(compact ? 0.2 : 0.23);
    ctx.save();
    if (!compact) {
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = L(0.06);
      ctx.shadowOffsetY = L(0.025);
    }
    rr(ctx, X(0), X(0), L(1), L(1), bodyR);
    ctx.fillStyle = vgrad(ctx, X(0), X(1), "#3f3833", "#181513");
    ctx.fill();
    ctx.restore();

    if (!compact) {
      // brillo del borde superior
      ctx.save();
      rr(ctx, X(0), X(0), L(1), L(1), bodyR);
      ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(X(0), X(0), L(1), Math.max(1, L(0.012)));
      ctx.restore();
    }

    // ---- Pantalla ----
    const sx = X(0.13), sy = X(0.13), sw = L(0.74), sh = L(compact ? 0.34 : 0.31);
    const sr = L(0.08);
    if (compact) {
      ctx.save();
      ctx.shadowColor = "rgba(255,150,40,0.6)";
      ctx.shadowBlur = tiny ? 0 : L(0.06);
      rr(ctx, sx, sy, sw, sh, sr);
      ctx.fillStyle = vgrad(ctx, sy, sy + sh, "#ffcb75", "#ff9426");
      ctx.fill();
      ctx.restore();
    } else {
      rr(ctx, sx, sy, sw, sh, sr);
      ctx.fillStyle = vgrad(ctx, sy, sy + sh, "#231a10", "#0a0806");
      ctx.fill();

      ctx.save();
      rr(ctx, sx, sy, sw, sh, sr);
      ctx.clip();
      // cifras ámbar con brillo
      ctx.font = `500 ${L(0.2)}px "SF Mono", Menlo, Monaco, Consolas, monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ffb547";
      ctx.shadowColor = "rgba(255,150,40,0.95)";
      ctx.shadowBlur = L(0.05);
      ctx.fillText("123", sx + sw - L(0.06), sy + sh - L(0.07));
      ctx.shadowBlur = 0;
      // reflejo del cristal
      const g = ctx.createLinearGradient(sx, sy, sx + sw * 0.6, sy + sh);
      g.addColorStop(0, "rgba(255,255,255,0.13)");
      g.addColorStop(0.5, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.restore();
    }

    // ---- Teclas ----
    const kx = X(0.13);
    const ky = X(compact ? 0.56 : 0.53);
    const kw = L(0.74);
    const kh = L(compact ? 0.31 : 0.34);
    const cols = tiny ? 2 : 3;
    const rows = tiny ? 1 : 2;
    const gap = L(tiny ? 0.12 : 0.06);
    const w = (kw - gap * (cols - 1)) / cols;
    const h = (kh - gap * (rows - 1)) / rows;
    const edge = Math.max(1, L(0.025));
    const kr = L(tiny ? 0.06 : 0.05);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type = "dark";
        if (r === rows - 1 && c === cols - 1) type = "eq";
        else if (!tiny && r === 0 && c === cols - 1) type = "op";
        else if (!tiny && r === 0 && c === 0) type = "fn";
        const [c0, c1, ce] = KEY[type];
        const x = kx + c * (w + gap);
        const y = ky + r * (h + gap);

        ctx.save();
        if (type === "eq" && !compact) {
          ctx.shadowColor = "rgba(255,130,30,0.55)";
          ctx.shadowBlur = L(0.05);
        }
        // canto inferior (relieve)
        rr(ctx, x, y + edge, w, h - edge, kr);
        ctx.fillStyle = ce;
        ctx.fill();
        ctx.restore();
        // cara de la tecla
        rr(ctx, x, y, w, h - edge, kr);
        ctx.fillStyle = vgrad(ctx, y, y + h - edge, c0, c1);
        ctx.fill();
      }
    }
  }

  self.drawCalcIcon = drawCalcIcon;
})();
