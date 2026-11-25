// Calculadora retro — lógica, sonidos, historial y teclado.

const $ = (sel) => document.querySelector(sel);
const valueEl = $('#value');
const exprEl = $('#expr');
const displayEl = $('#display');
const clearBtn = $('#clearBtn');
const soundBtn = $('#soundBtn');
const historyBtn = $('#historyBtn');
const toastEl = $('#toast');
const keysEl = $('#keys');
const tapeEl = $('#tape');
const tapeList = $('#tapeList');
const tapeClear = $('#tapeClear');

const MAX_DIGITS = 12;
const MAX_HISTORY = 30;
const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

// ---------- Estado ----------
const s = {
  current: '0',      // número en pantalla (texto con punto decimal)
  previous: null,    // primer operando
  operator: null,    // operación pendiente
  waiting: false,    // esperando el segundo número
  overwrite: false,  // el siguiente dígito sustituye al número en pantalla
  lastOp: null,      // para repetir "=" varias veces
  lastOperand: null,
  expr: '',
  error: false,
};

function reset() {
  Object.assign(s, {
    current: '0', previous: null, operator: null, waiting: false, overwrite: false,
    lastOp: null, lastOperand: null, expr: '', error: false,
  });
}

function setError() {
  Object.assign(s, {
    current: 'Error', previous: null, operator: null, waiting: false,
    overwrite: true, lastOp: null, error: true,
  });
  displayEl.classList.remove('shake');
  void displayEl.offsetWidth;
  displayEl.classList.add('shake');
}

// ---------- Números ----------
function clean(n) {
  if (!Number.isFinite(n)) return NaN;
  const r = parseFloat(n.toPrecision(12)); // evita cosas como 0,1 + 0,2 = 0,30000000000000004
  return Object.is(r, -0) ? 0 : r;
}

function compute(a, op, b) {
  switch (op) {
    case '+': return clean(a + b);
    case '-': return clean(a - b);
    case '*': return clean(a * b);
    case '/': return b === 0 ? NaN : clean(a / b);
  }
  return NaN;
}

function toRaw(n) {
  if (Number.isNaN(n)) return 'Error';
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e12 || a < 1e-6)) {
    return n.toExponential(5).replace(/\.?0+e/, 'e');
  }
  return String(n);
}

// Formato español: 1.234.567,89
function format(raw) {
  if (raw === 'Error') return 'Error';
  if (raw.includes('e')) return raw.replace('.', ',').replace('e+', 'e').replace('-', '−');
  const neg = raw.startsWith('-');
  const body = neg ? raw.slice(1) : raw;
  let [int, dec] = body.split('.');
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + int + (dec !== undefined ? ',' + dec : '');
}

// ---------- Acciones ----------
function inputDigit(d) {
  if (s.error) reset();
  if (s.waiting || s.overwrite) {
    s.current = d;
    s.waiting = s.overwrite = false;
    if (!s.operator) { s.expr = ''; s.lastOp = null; }
    return;
  }
  if (s.current.replace(/[-.]/g, '').length >= MAX_DIGITS) return;
  if (s.current === '0') s.current = d;
  else if (s.current === '-0') s.current = '-' + d;
  else s.current += d;
}

function inputDot() {
  if (s.error) reset();
  if (s.waiting || s.overwrite) {
    s.current = '0.';
    s.waiting = s.overwrite = false;
    if (!s.operator) { s.expr = ''; s.lastOp = null; }
    return;
  }
  if (!s.current.includes('.')) s.current += '.';
}

function setOperator(op) {
  if (s.error) return;
  const cur = parseFloat(s.current);
  if (s.operator && !s.waiting) {
    const r = compute(s.previous, s.operator, cur);
    if (Number.isNaN(r)) return setError();
    s.previous = r;
    s.current = toRaw(r);
  } else if (!s.operator) {
    s.previous = cur;
  }
  s.operator = op;
  s.waiting = true;
  s.overwrite = false;
  s.lastOp = null;
  s.expr = `${format(toRaw(s.previous))} ${SYM[op]}`;
}

function equals() {
  if (s.error) return false;
  let a, op, b;
  if (s.operator) {
    a = s.previous;
    op = s.operator;
    b = s.waiting ? s.previous : parseFloat(s.current);
  } else if (s.lastOp) {
    a = parseFloat(s.current);
    op = s.lastOp;
    b = s.lastOperand;
  } else {
    return false;
  }
  const r = compute(a, op, b);
  const line = `${format(toRaw(a))} ${SYM[op]} ${format(toRaw(b))}`;
  s.expr = `${line} =`;
  if (Number.isNaN(r)) { setError(); return false; }
  Object.assign(s, {
    current: toRaw(r), previous: null, operator: null,
    waiting: false, overwrite: true, lastOp: op, lastOperand: b,
  });
  addHistory(line, s.current);
  return true;
}

function percent() {
  if (s.error) return;
  let v = parseFloat(s.current);
  if (s.operator && !s.waiting && (s.operator === '+' || s.operator === '-')) {
    v = (s.previous * v) / 100; // 200 + 10% = 220
  } else {
    v = v / 100;
  }
  s.current = toRaw(clean(v));
  s.waiting = false;
  s.overwrite = true;
}

function toggleSign() {
  if (s.error) return;
  if (s.waiting) { s.current = '-0'; s.waiting = false; return; }
  s.current = s.current.startsWith('-') ? s.current.slice(1) : '-' + s.current;
}

function canClearEntry() {
  return !s.error && !s.waiting && !s.overwrite && s.current !== '0';
}

function clear() {
  if (canClearEntry() && s.operator) s.current = '0';
  else reset();
}

function backspace() {
  if (s.error || s.waiting || s.overwrite) return;
  s.current = s.current.slice(0, -1);
  if (s.current === '' || s.current === '-') s.current = '0';
}

// ---------- Pantalla ----------
function fitText() {
  let size = 52;
  valueEl.style.fontSize = size + 'px';
  while (valueEl.scrollWidth > valueEl.clientWidth && size > 18) {
    size -= 2;
    valueEl.style.fontSize = size + 'px';
  }
}

function render() {
  valueEl.textContent = format(s.current);
  exprEl.textContent = s.expr || '\u00a0';
  clearBtn.textContent = canClearEntry() ? 'C' : 'AC';
  document.querySelectorAll('.key.op').forEach((b) => {
    b.classList.toggle('active', s.waiting && b.dataset.op === s.operator);
  });
  fitText();
  save();
}

function flash() {
  valueEl.classList.remove('flash');
  void valueEl.offsetWidth;
  valueEl.classList.add('flash');
}

let toastTimer;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1200);
}

// Recordar el último resultado
function save() {
  if (s.operator || s.error) return;
  try {
    localStorage.setItem('calc.last', JSON.stringify({ current: s.current, expr: s.expr }));
  } catch {}
}

function restore() {
  try {
    const data = JSON.parse(localStorage.getItem('calc.last'));
    if (data && typeof data.current === 'string' && !Number.isNaN(parseFloat(data.current))) {
      s.current = data.current;
      s.expr = data.expr || '';
      s.overwrite = true;
    }
  } catch {}
}

// ---------- Historial ----------
let history = [];
try {
  const h = JSON.parse(localStorage.getItem('calc.history'));
  if (Array.isArray(h)) history = h.filter((x) => x && typeof x.e === 'string' && typeof x.r === 'string');
} catch {}

function saveHistory() {
  try { localStorage.setItem('calc.history', JSON.stringify(history)); } catch {}
}

function addHistory(e, r) {
  history.unshift({ e, r });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  saveHistory();
  renderTape();
}

function renderTape() {
  tapeList.textContent = '';
  tapeClear.disabled = history.length === 0;
  if (!history.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Aún no hay operaciones. Haz una cuenta y pulsa =';
    tapeList.append(li);
    return;
  }
  history.forEach((item, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;
    li.title = 'Usar este resultado';
    const e = document.createElement('div');
    e.className = 'e';
    e.textContent = item.e + ' =';
    const r = document.createElement('div');
    r.className = 'r';
    r.textContent = format(item.r);
    li.append(e, r);
    tapeList.append(li);
  });
}

function useHistory(i) {
  const item = history[i];
  if (!item) return;
  if (s.error) reset();
  s.current = item.r;
  s.waiting = false;
  s.overwrite = true;
  if (!s.operator) { s.expr = item.e + ' ='; s.lastOp = null; }
  toggleTape(false);
  sound.play('fn');
  flash();
  render();
}

function isTapeOpen() {
  return tapeEl.classList.contains('open');
}

function toggleTape(open = !isTapeOpen()) {
  tapeEl.classList.toggle('open', open);
  tapeEl.setAttribute('aria-hidden', String(!open));
  historyBtn.classList.toggle('on', open);
  if (open) tapeList.scrollTop = 0;
}

tapeList.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-index]');
  if (li) useHistory(Number(li.dataset.index));
});

tapeClear.addEventListener('click', () => {
  history = [];
  saveHistory();
  renderTape();
  sound.play('fn');
});

historyBtn.addEventListener('click', () => {
  toggleTape();
  sound.play('fn');
});

// ---------- Copiar ----------
async function copyResult() {
  if (s.error) return;
  try {
    await navigator.clipboard.writeText(s.current.replace('.', ','));
    showToast('COPIADO');
    sound.play('fn');
  } catch {}
}

// ---------- Sonidos (generados, sin archivos) ----------
const sound = (() => {
  const PROFILES = ['clasico', 'mecanico', 'suave', 'retro', 'off'];
  const NAMES = { clasico: 'Clásico', mecanico: 'Mecánico', suave: 'Suave', retro: '8-bit', off: 'Silencio' };

  let ctx, master, noise;
  let profile = localStorage.getItem('calc.sound');
  if (!PROFILES.includes(profile)) profile = 'clasico'; // también convierte el antiguo "on"

  function init() {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 0.05);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }

  // Un tono con envolvente; opcionalmente desliza el tono y pasa por un filtro
  function osc({ type = 'sine', f, to, glide = 0.03, start, peak, dur, attack = 0.004, lp }) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, start);
    if (to) o.frequency.exponentialRampToValueAtTime(to, start + glide);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    let node = o;
    if (lp) {
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = lp;
      node = node.connect(f2);
    }
    node.connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  // Un golpe de ruido filtrado (el "clic")
  function click({ start, freq, q = 1, peak, dur, type = 'bandpass' }) {
    const n = ctx.createBufferSource();
    n.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    n.connect(f).connect(g).connect(master);
    n.start(start);
    n.stop(start + dur + 0.02);
  }

  const voices = {
    // El de siempre: "toc" de madera + clic suave, "ding" al dar el resultado
    clasico(kind, t, v) {
      const base = ({ num: 300, fn: 360, op: 420, eq: 480 }[kind] || 300) * v;
      osc({ f: base * 2.2, to: base, glide: 0.025, start: t, peak: 0.35, dur: 0.08, attack: 0.003 });
      click({ start: t, freq: 3200 * v, q: 0.9, peak: 0.18, dur: 0.03 });
      if (kind === 'eq') {
        osc({ f: 880, start: t + 0.03, peak: 0.08, dur: 0.45, attack: 0.01 });
        osc({ f: 1318.5, start: t + 0.09, peak: 0.06, dur: 0.55, attack: 0.01 });
      }
    },

    // Teclado mecánico / máquina de escribir: clac al bajar y al subir, campanita al final
    mecanico(kind, t, v) {
      const thud = ({ num: 150, fn: 170, op: 135, eq: 120 }[kind] || 150) * v;
      click({ start: t, freq: 4200 * v, q: 0.7, peak: 0.4, dur: 0.018 });
      osc({ f: thud * 1.6, to: thud * 0.6, glide: 0.04, start: t, peak: 0.3, dur: 0.06, attack: 0.002 });
      click({ start: t + 0.05, freq: 2600 * v, q: 1.2, peak: 0.12, dur: 0.014 });
      if (kind === 'eq') {
        osc({ f: 2093, start: t + 0.06, peak: 0.07, dur: 0.9, attack: 0.002 });
        osc({ f: 5230, start: t + 0.06, peak: 0.02, dur: 0.4, attack: 0.002 });
      }
    },

    // Burbuja suave, muy discreta; acorde tranquilo al dar el resultado
    suave(kind, t, v) {
      const base = ({ num: 520, fn: 440, op: 660, eq: 784 }[kind] || 520) * v;
      osc({ f: base, to: base * 1.6, glide: 0.04, start: t, peak: 0.2, dur: 0.12, attack: 0.008 });
      if (kind === 'eq') {
        [523.25, 659.25, 783.99].forEach((f, i) =>
          osc({ f, start: t + 0.04 + i * 0.05, peak: 0.06, dur: 0.8, attack: 0.02 }));
      }
    },

    // Pitidos de videojuego antiguo; arpegio al dar el resultado
    retro(kind, t) {
      const f = { num: 880, fn: 660, op: 1046.5, eq: 1318.5 }[kind] || 880;
      osc({ type: 'square', f, start: t, peak: 0.07, dur: 0.05, attack: 0.002, lp: 3500 });
      if (kind === 'eq') {
        [523.25, 659.25, 783.99, 1046.5].forEach((n, i) =>
          osc({ type: 'square', f: n, start: t + 0.06 + i * 0.06, peak: 0.06, dur: 0.07, attack: 0.002, lp: 3500 }));
      }
    },
  };

  function play(kind = 'num') {
    if (profile === 'off') return;
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + 0.002;
    const v = 1 + (Math.random() - 0.5) * 0.06; // pequeña variación natural
    voices[profile](kind, t, v);
  }

  return {
    play,
    get on() { return profile !== 'off'; },
    get name() { return NAMES[profile]; },
    next() {
      profile = PROFILES[(PROFILES.indexOf(profile) + 1) % PROFILES.length];
      localStorage.setItem('calc.sound', profile);
    },
  };
})();

function updateSoundBtn() {
  soundBtn.classList.toggle('muted', !sound.on);
  soundBtn.title = `Sonido: ${sound.name} — clic para cambiar (tecla S)`;
}

function nextSound() {
  sound.next();
  updateSoundBtn();
  showToast(`SONIDO · ${sound.name.toUpperCase()}`);
  sound.play('eq'); // muestra cómo suena, con su final incluido
}

soundBtn.addEventListener('click', nextSound);

// ---------- Pulsar teclas ----------
function press(btn) {
  const { digit, op, action } = btn.dataset;
  let kind = 'num';
  if (digit !== undefined) inputDigit(digit);
  else if (op) { setOperator(op); kind = 'op'; }
  else if (action === 'dot') inputDot();
  else if (action === 'equals') { kind = 'eq'; if (equals()) flash(); }
  else if (action === 'clear') { clear(); kind = 'fn'; }
  else if (action === 'sign') { toggleSign(); kind = 'fn'; }
  else if (action === 'percent') { percent(); kind = 'fn'; }
  sound.play(kind);
  render();
}

function visualPress(btn) {
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 110);
}

// Ratón / trackpad
keysEl.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('.key');
  if (!btn) return;
  e.preventDefault();
  btn.classList.add('pressed');
  press(btn);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
  keysEl.addEventListener(ev, () => {
    keysEl.querySelectorAll('.key.pressed').forEach((b) => b.classList.remove('pressed'));
  })
);

// Teclado del ordenador
document.addEventListener('keydown', (e) => {
  const k = e.key;

  if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'c') {
    e.preventDefault();
    copyResult();
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // Escape cierra el historial si está abierto
  if (k === 'Escape' && isTapeOpen()) {
    e.preventDefault();
    toggleTape(false);
    return;
  }
  if (k === 'h' || k === 'H') {
    toggleTape();
    sound.play('fn');
    return;
  }

  let sel = null;
  if (/^[0-9]$/.test(k)) sel = `[data-digit="${k}"]`;
  else if (k === '.' || k === ',') sel = '[data-action="dot"]';
  else if (k === '+' || k === '-' || k === '*' || k === '/') sel = `[data-op="${k}"]`;
  else if (k === 'x' || k === 'X') sel = '[data-op="*"]';
  else if (k === 'Enter' || k === '=') sel = '[data-action="equals"]';
  else if (k === 'Escape' || k === 'Delete' || k === 'c' || k === 'C') sel = '[data-action="clear"]';
  else if (k === '%') sel = '[data-action="percent"]';

  if (sel) {
    e.preventDefault();
    if (isTapeOpen()) toggleTape(false); // al seguir calculando, se recoge el papel
    const btn = keysEl.querySelector(sel);
    visualPress(btn);
    press(btn);
    return;
  }

  if (k === 'Backspace') {
    e.preventDefault();
    backspace();
    sound.play('fn');
    render();
  } else if (k === 's' || k === 'S') {
    nextSound();
  }
});

displayEl.addEventListener('click', copyResult);

// ---------- Inicio ----------
restore();
updateSoundBtn();
renderTape();
render();
