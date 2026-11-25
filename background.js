// Pone el icono propio de la Calculadora en la barra de Chrome,
// dibujándolo al momento (no necesita ningún permiso).
importScripts("icon-draw.js");

function paintIcon() {
  try {
    const imageData = {};
    for (const s of [16, 32]) {
      const canvas = new OffscreenCanvas(s, s);
      const ctx = canvas.getContext("2d");
      self.drawCalcIcon(ctx, s);
      imageData[s] = ctx.getImageData(0, 0, s, s);
    }
    chrome.action.setIcon({ imageData }).catch(() => {});
  } catch (e) {
    console.warn("No se pudo dibujar el icono", e);
  }
}

chrome.runtime.onInstalled.addListener(paintIcon);
chrome.runtime.onStartup.addListener(paintIcon);
paintIcon();
