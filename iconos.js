// Página de iconos: muestra el icono en varios tamaños y permite descargarlo en PNG.
(function () {
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // Vista previa nítida (en pantallas Retina se dibuja al doble).
  document.querySelectorAll("canvas[data-size]").forEach((cv) => {
    const size = Number(cv.dataset.size);
    const px = Math.round(size * dpr);
    cv.width = px;
    cv.height = px;
    if (!cv.style.width) {
      cv.style.width = size + "px";
      cv.style.height = size + "px";
    }
    const ctx = cv.getContext("2d");
    window.drawCalcIcon(ctx, px);
  });

  function pngFor(size) {
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    window.drawCalcIcon(cv.getContext("2d"), size);
    return cv.toDataURL("image/png");
  }

  function download(size) {
    const a = document.createElement("a");
    a.href = pngFor(size);
    a.download = `icon${size}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  document.getElementById("dlAll").addEventListener("click", () => {
    [16, 48, 128].forEach((s, i) => setTimeout(() => download(s), i * 250));
  });
  document.querySelectorAll("[data-dl]").forEach((btn) => {
    btn.addEventListener("click", () => download(Number(btn.dataset.dl)));
  });
})();
