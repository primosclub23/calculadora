# Calculadora — notas técnicas

Extensión de Chrome (Manifest V3). Sin permisos especiales y sin código remoto.

## Archivos
- `manifest.json` — configuración de la extensión. Popup = `popup.html`. Service worker = `background.js`. Atajo para abrirla: `Alt+Shift+C` (Mac: `Ctrl+Shift+C`).
- `popup.html` — estructura: cabecera (marca, "placa solar" decorativa, botones de historial y sonido), pantalla, 19 teclas y el panel de historial (`.tape`) encima de las teclas. La marca "CALCULADORA·66" es un enlace a `iconos.html` (para ver el icono desde la vista previa).
- `popup.css` — estilo retro premium: cuerpo oscuro, pantalla ámbar con brillo, líneas de escaneo y reflejo, teclas con relieve. El historial es un "rollo de papel" color crema que se despliega sobre las teclas (clip-path animado).
- `popup.js` — lógica de la calculadora, sonidos, historial y teclado.
- `icon-draw.js` — dibuja el icono en canvas (`self.drawCalcIcon(ctx, size)`). Script clásico (no módulo) para que funcione en el service worker (importScripts) y abriendo iconos.html con doble clic (file://).
- `background.js` — al instalar/arrancar dibuja el icono a 16 y 32 px con OffscreenCanvas y lo pone con `chrome.action.setIcon` (no necesita permisos).
- `iconos.html` + `iconos.js` — página de herramienta: vista previa del icono (tamaños y barra de Chrome clara/oscura) y descarga de icon16/48/128.png. Tiene botón "← Volver a la calculadora" (enlace a popup.html).

## Tamaño del popup (versión compacta)
- Ancho 272 px (antes 380), unos 395 px de alto. Teclas de 42 px, pantalla de 78 px, cifras de 38 px.
- Sin marco negro: body sin padding y con el mismo degradado que la carcasa, así la calculadora ocupa toda la ventanita.
- Las ventanas emergentes de Chrome no pueden ser transparentes: las esquinas redondeadas exteriores las pone Chrome (en Mac la ventana ya sale redondeada).
- `VALUE_FONT` en popup.js debe coincidir con el tamaño de `.value` en popup.css (ajuste automático del texto largo).

## Icono
- Mini calculadora: carcasa oscura redondeada, pantalla oscura con "123" ámbar brillante y reflejo, 3×2 teclas (crema, gris, naranja "=").
- Versiones simplificadas: <48 px pantalla ámbar sólida sin cifras; <24 px solo 2 teclas.
- 128 px con ~9 % de margen transparente (recomendación de la Chrome Web Store).
- Todavía NO hay `"icons"` en el manifest: si se declaran PNG que no existen, Chrome no carga la extensión. Cuando estén icons/icon16.png, icon48.png, icon128.png en el proyecto, añadir `"icons"` y `action.default_icon` al manifest.

## Decisiones
- Sonidos generados con Web Audio (sin archivos de audio). 4 estilos + silencio, se van cambiando con el botón del altavoz o la tecla S (al cambiar suena una muestra y la pantalla dice el nombre):
  - Clásico: "toc" + clic, "ding" en "=".
  - Mecánico: clac de bajada y subida, campanita de máquina de escribir en "=".
  - Suave: burbuja discreta, acorde tranquilo en "=".
  - 8-bit: pitidos cuadrados, arpegio en "=".
  - Se guarda en localStorage `calc.sound` (el antiguo valor "on" pasa a Clásico).
- Historial: últimas 30 operaciones en localStorage `calc.history` ({e: expresión formateada, r: resultado en bruto}). Botón del recibo o tecla H para abrirlo; Esc lo cierra; al teclear números se recoge solo. Tocar una línea reutiliza ese resultado (si hay una operación pendiente, entra como segundo número). Botón "Borrar".
- Formato español: miles con punto y decimales con coma. Desde el teclado vale "." o ",".
- Redondeo a 12 cifras significativas para evitar errores tipo 0,1+0,2.
- "=" repetido repite la última operación. "200 + 10 %" = 220.
- Clic en la pantalla o Cmd+C copia el resultado (con coma decimal).
- Se recuerda el último resultado en localStorage (no necesita permiso "storage").
- Teclado: números, + − * / x, Enter/=, Backspace, Esc/C, %, S (sonido), H (historial).

## Pendiente
- Subir los PNG (icon16/48/128) a la carpeta icons/ y declararlos en el manifest antes de publicar.
- Decidir si el enlace de la marca a iconos.html se queda (es discreto) o se quita antes de publicar.
