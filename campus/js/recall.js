// Tarjetas de active recall: se usa en la página de cada tema y en las sesiones de repaso.
import { state, hoy, diasEntre } from './store.js';
import * as P from './progreso.js';
import { inline } from './md.js';
import { icon, esc, diasTxt, nombreAsig } from './ui.js';

export function estadoTxt(id) {
  const s = state.tarjetas[id];
  if (!s) return 'Nueva';
  if (s.due <= hoy()) return 'Toca repasar';
  return `${s.caja >= 2 ? 'Dominada · ' : ''}repaso ${diasTxt(s.due)}`;
}

export const ordenRepaso = cards => [...cards].sort((x, y) => peso(x) - peso(y));
function peso(c) {
  const s = state.tarjetas[c.id];
  if (!s) return 1;
  return s.due <= hoy() ? 0 : 2 + diasEntre(hoy(), s.due);
}

/**
 * opciones: cab (html encima), grande (modo sesión), repetir (los fallos vuelven al final),
 * teclado (espacio / 1 2 3), vacio (html si no hay tarjetas), fin (html extra al acabar), otra (callback)
 */
export function montarRecall(box, cards, o = {}) {
  let cola = [...cards], i = 0, ver = false, total = cola.length;
  const res = { bien: 0, dude: 0, falle: 0 };
  const kbd = t => (o.grande ? `<span class="kbd">${t}</span>` : '');

  function pintar() {
    const cab = o.cab || '';
    if (!cola.length) { box.innerHTML = cab + `<div class="vacio">${o.vacio || 'No hay tarjetas.'}</div>`; return; }
    if (i >= cola.length) {
      box.innerHTML = cab + `<div class="fc ${o.grande ? 'card fc-grande' : ''}">
        <div class="q">¡Ronda terminada! 🎉</div>
        <div class="resumen-r"><span class="c-bien">✅ ${res.bien} bien</span><span class="c-dude">🤔 ${res.dude} dudas</span><span class="c-falle">❌ ${res.falle} fallos</span></div>
        <div class="acc">${o.fin || ''}<button class="btn peq borde" data-otra>Otra ronda</button></div></div>`;
      return;
    }
    const c = cola[i], repe = i >= total;
    box.innerHTML = cab + `
      <div class="ses-top"><span>${repe ? 'Repite la que fallaste' : `Tarjeta ${i + 1} de ${total}`}</span><span>${estadoTxt(c.id)}</span></div>
      ${o.grande ? `<div class="barra fina"><i style="width:${Math.round(i / cola.length * 100)}%"></i></div>` : ''}
      <div class="fc ${o.grande ? 'card fc-grande' : ''}">
        ${o.grande ? `<div class="fc-meta">${esc(nombreAsig(c.asig))}${c.temaTitulo ? ' · ' + esc(c.temaTitulo) : ''}</div>` : ''}
        <div class="q">${inline(c.q)}</div>
        ${ver
          ? `<div class="a">${inline(c.a)}</div>
             <div class="califica"><button class="c-falle" data-r="falle">Fallé${kbd(1)}</button><button class="c-dude" data-r="dude">Dudé${kbd(2)}</button><button class="c-bien" data-r="bien">Bien${kbd(3)}</button></div>`
          : `<div class="acciones"><button class="btn ${o.grande ? 'lima' : 'peq borde'}" data-ver>${icon('eye')} Mostrar respuesta${kbd('espacio')}</button></div>`}
      </div>`;
  }

  function calificar(r) {
    const c = cola[i];
    if (i < total) { // las repeticiones dentro de la misma ronda no cuentan para el repaso espaciado
      P.calificar(c, r); res[r]++;
      if (r === 'falle' && o.repetir) cola.push(c);
    }
    i++; ver = false; pintar();
  }

  box.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if ('ver' in b.dataset) { ver = true; pintar(); }
    else if (b.dataset.r) calificar(b.dataset.r);
    else if ('otra' in b.dataset) {
      if (o.otra) return o.otra();
      cola = ordenRepaso(cards); total = cola.length; i = 0; ver = false;
      res.bien = res.dude = res.falle = 0; pintar();
    }
  };

  if (o.teclado) {
    const onKey = e => {
      if (!box.isConnected) return removeEventListener('keydown', onKey);
      if (e.target.closest?.('input,textarea,select,button') || e.metaKey || e.ctrlKey || i >= cola.length) return;
      if (!ver && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); ver = true; pintar(); }
      else if (ver && ['1', '2', '3'].includes(e.key)) calificar(['falle', 'dude', 'bien'][+e.key - 1]);
    };
    addEventListener('keydown', onKey);
  }
  pintar();
}
