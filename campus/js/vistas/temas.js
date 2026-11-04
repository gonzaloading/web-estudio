import { cat, todosTemas } from '../data.js';
import { state } from '../store.js';
import { esc, filaTema } from '../ui.js';

const ORDEN = { alta: 0, media: 1, baja: 2 };

export default function temas(el, r) {
  const f = { asig: r.q.get('asig') || '', prio: r.q.get('prio') || '', estado: r.q.get('estado') || '' };
  const lista = todosTemas().filter(t =>
    (!f.asig || t.asig === f.asig) && (!f.prio || t.prioridad === f.prio) &&
    (!f.estado || (f.estado === 'estudiados') === !!state.leidos[t.key]));
  lista.sort((a, b) => (ORDEN[a.prioridad] ?? 1) - (ORDEN[b.prioridad] ?? 1)
    || !!state.leidos[a.key] - !!state.leidos[b.key] || a.asig.localeCompare(b.asig) || a.n - b.n);

  const url = (k, v) => {
    const p = new URLSearchParams({ ...f, [k]: v });
    for (const key of [...p.keys()]) if (!p.get(key)) p.delete(key);
    return '#/temas' + (p.toString() ? '?' + p : '');
  };
  const sel = (k, ops) => `<select data-f="${k}">${ops.map(([v, n]) => `<option value="${v}" ${f[k] === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;

  el.innerHTML = `
  <header class="cab"><h1>Temas</h1><p>Todos los temas ordenados por prioridad: lo importante y lo pendiente, primero.</p></header>
  <div class="tabs">${[['', 'Todas'], ...cat.asignaturas.map(a => [a.id, a.nombre])]
    .map(([id, n]) => `<a href="${url('asig', id)}" class="${f.asig === id ? 'on' : ''}">${esc(n)}</a>`).join('')}</div>
  <div class="filtros">
    ${sel('prio', [['', 'Cualquier prioridad'], ['alta', 'Prioridad alta'], ['media', 'Prioridad media'], ['baja', 'Prioridad baja']])}
    ${sel('estado', [['', 'Todos'], ['pendientes', 'Pendientes'], ['estudiados', 'Estudiados']])}
    <span class="tenue">${lista.length} tema${lista.length === 1 ? '' : 's'}</span>
  </div>
  <div class="card temas-l">${lista.length ? lista.map(t => filaTema(t, true)).join('') : '<p class="vacio pad">No hay temas con estos filtros.</p>'}</div>`;

  el.onchange = e => { const s = e.target.closest('[data-f]'); if (s) location.hash = url(s.dataset.f, s.value); };
}
