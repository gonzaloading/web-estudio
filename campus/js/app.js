// Arranque y navegación (#/ruta/arg?param=valor)
import { cargarCatalogo } from './data.js';
import { icon } from './ui.js';
import inicio from './vistas/inicio.js';
import asignaturas from './vistas/asignaturas.js';
import asignatura from './vistas/asignatura.js';
import repaso from './vistas/repaso.js';
import temas from './vistas/temas.js';
import fallos from './vistas/fallos.js';
import historial from './vistas/historial.js';
import examenes from './vistas/examenes.js';
import notas from './vistas/notas.js';
import ajustes from './vistas/ajustes.js';

const RUTAS = { '': inicio, asignaturas, asignatura, repaso, temas, fallos, historial, examenes, notas, ajustes };
const NAV = [
  ['', 'home', 'Inicio'], ['asignaturas', 'layers', 'Asignaturas'], ['repaso', 'calendar', 'Plan de repaso'],
  ['temas', 'list', 'Temas'], ['fallos', 'xcircle', 'Mis fallos'], ['historial', 'bars', 'Historial'],
  null, ['examenes', 'calcheck', 'Exámenes y trabajos'], ['notas', 'grad', 'Notas'],
];

const app = document.getElementById('app');

document.getElementById('sidebar').innerHTML = `
  <a class="marca" href="#/">${icon('book')}<div><b>Gonzaloading</b><small>MI CAMPUS · DAM</small></div></a>
  <nav class="nav">${NAV.map(n => (n ? `<a href="#/${n[0]}" data-r="${n[0]}">${icon(n[1])}<span>${n[2]}</span></a>` : '<div class="sep"></div>')).join('')}</nav>
  <div class="pie"><a href="#/ajustes" data-r="ajustes">${icon('download')}<span>Copia de seguridad</span></a>
    <small>Tu progreso se guarda en este dispositivo.</small></div>`;
document.getElementById('abrir').innerHTML = icon('menu');
document.getElementById('abrir').onclick = () => document.body.classList.add('menu');
document.getElementById('velo').onclick = () => document.body.classList.remove('menu');

function leerRuta() {
  const [path, qs = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const partes = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { ruta: partes[0] || '', args: partes.slice(1), q: new URLSearchParams(qs) };
}

function render(arriba = true) {
  const r = leerRuta();
  app.onclick = app.onsubmit = app.onchange = null;
  try { (RUTAS[r.ruta] || inicio)(app, r); }
  catch (e) { console.error(e); app.innerHTML = `<div class="card pad"><b>Error al mostrar esta página</b><p class="tenue">${e.message}</p></div>`; }
  const activa = r.ruta === 'asignatura' ? 'asignaturas' : r.ruta;
  document.querySelectorAll('#sidebar [data-r]').forEach(a => a.classList.toggle('on', a.dataset.r === activa));
  document.body.classList.remove('menu');
  if (arriba) scrollTo(0, 0);
}

cargarCatalogo()
  .then(() => {
    addEventListener('hashchange', () => render(true));
    addEventListener('refrescar', () => render(false));
    render();
  })
  .catch(e => {
    console.error(e);
    app.innerHTML = `<div class="card pad"><h2>No se pudo cargar el contenido</h2>
      <p>Abre la web desde un servidor (GitHub Pages, o <code>python3 -m http.server</code> dentro de la carpeta), no con doble clic en el archivo.</p>
      <p class="tenue">${e.message}</p></div>`;
  });

// Ampliar imágenes y diagramas de los temas: clic para abrir, clic o Esc para cerrar
addEventListener('click', e => {
  const img = e.target.closest?.('.fig img');
  if (img) {
    const v = document.createElement('div');
    v.className = 'zoom';
    v.innerHTML = `<img src="${img.src}" alt="${img.alt.replace(/"/g, '&quot;')}">`;
    v.onclick = () => v.remove();
    document.body.append(v);
  }
});
addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('.zoom')?.remove(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.instalarApp = e; });
