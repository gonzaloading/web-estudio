// Mini-intérprete de Markdown para los temas. Ver AGENTS.md para la sintaxis admitida.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const seguro = u => (/^\s*javascript:/i.test(u) ? '#' : u);
let BASE = '';
const ruta = u => (/^(https?:|\/|#|data:)/.test(u) ? u : BASE + u);

export function inline(s = '') {
  const codes = [];
  s = String(s).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, u) => `<img alt="${alt}" src="${seguro(ruta(u))}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${seguro(u)}" target="_blank" rel="noopener">${t}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}

export function hash(s) {
  let h = 5381;
  for (const c of s) h = ((h << 5) + h + c.codePointAt(0)) | 0;
  return (h >>> 0).toString(36);
}

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CALLOUTS = {
  clave: '🔑 Clave de examen', error: '⚠️ Error típico', nota: '💡 Nota',
  ejemplo: '🧪 Ejemplo', resumen: '📌 Resumen', truco: '🧠 Truco para recordar',
  extra: '➕ Ampliación · no viene en tus apuntes',
};
// Imagen sola en su línea → figura con pie:  ![alt](img/x.svg "Pie de foto")
const FIGURA = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const ES_LISTA = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const CORTA_PARRAFO = /^(```|#{1,4}\s|>|\|.*\|\s*$|\?\?\s|\s*([-*+]|\d+[.)])\s+|(-{3,}|\*{3,})\s*$|!\[[^\]]*\]\([^)]*\)\s*$)/;

function lista(L, i) {
  const items = [];
  while (i < L.length) {
    const m = L[i].match(ES_LISTA);
    if (!m) {
      if (items.length && /^\s{2,}\S/.test(L[i])) { items[items.length - 1].text += ' ' + L[i].trim(); i++; continue; }
      break;
    }
    items.push({ ind: m[1].replace(/\t/g, '  ').length, ord: /\d/.test(m[2]), text: m[3] });
    i++;
  }
  let html = '';
  const pila = [];
  for (const it of items) {
    while (pila.length && it.ind < pila[pila.length - 1].ind) html += `</li></${pila.pop().tag}>`;
    const top = pila[pila.length - 1];
    if (!top || it.ind > top.ind) { const tag = it.ord ? 'ol' : 'ul'; pila.push({ ind: it.ind, tag }); html += `<${tag}><li>`; }
    else html += '</li><li>';
    html += inline(it.text);
  }
  while (pila.length) html += `</li></${pila.pop().tag}>`;
  return [html, i];
}

/** Convierte el .md de un tema en { html, cards, toc, meta } */
export function parseTema(src, key, base = '') {
  BASE = base;
  src = String(src || '').replace(/\r/g, '');
  const meta = {};
  if (src.startsWith('---\n')) {
    const fin = src.indexOf('\n---', 4);
    if (fin > 0) {
      src.slice(4, fin).split('\n').forEach(l => { const m = l.match(/^(\w+):\s*(.*)$/); if (m) meta[m[1]] = m[2].trim(); });
      src = src.slice(fin + 4).replace(/^[^\n]*\n/, '');
    }
  }
  const L = src.split('\n'), out = [], cards = [], toc = [], ids = new Set();
  const addCard = (q, a) => {
    const id = hash(key + '|' + q);
    if (!cards.some(c => c.id === id)) cards.push({ id, q: q.trim(), a: a.trim(), tema: key });
  };
  let i = 0, m;
  while (i < L.length) {
    const line = L[i];
    if (!line.trim()) { i++; continue; }

    // Bloque de código (o de vocabulario)
    if ((m = line.match(/^```\s*([\w+#-]*)/))) {
      const lang = m[1].toLowerCase(), buf = [];
      i++;
      while (i < L.length && !/^```/.test(L[i])) buf.push(L[i++]);
      i++;
      if (lang === 'vocab') {
        const items = buf.filter(x => x.includes('=')).map(x => { const [w, ...r] = x.split('='); return [w.trim(), r.join('=').trim()]; });
        out.push(`<div class="vocab">${items.map(([w, t]) => `<div><b>${inline(w)}</b><span>${inline(t)}</span></div>`).join('')}</div>`);
        items.forEach(([w, t]) => addCard(`¿Cómo se dice «${t}»?`, w));
      } else {
        out.push(`<div class="code"><div class="code-h"><span>${esc(lang || 'código')}</span><button class="copiar" type="button">Copiar</button></div><pre><code>${esc(buf.join('\n'))}</code></pre></div>`);
      }
      continue;
    }
    // Tarjeta de active recall:  ?? pregunta || respuesta
    if ((m = line.match(/^\?\?\s*(.+?)\s*\|\|\s*(.+)$/))) { addCard(m[1], m[2]); i++; continue; }
    // Título de apartado (con prioridad opcional {alta|media|baja})
    if ((m = line.match(/^(#{1,4})\s+(.+)$/))) {
      const lvl = Math.max(2, m[1].length);
      let t = m[2], pr = '';
      const pm = t.match(/\s*\{(alta|media|baja)\}\s*$/i);
      if (pm) { pr = pm[1].toLowerCase(); t = t.slice(0, pm.index); }
      let id = 's-' + (slug(t) || 'apartado'); while (ids.has(id)) id += '-'; ids.add(id);
      if (lvl <= 3) toc.push({ id, t, lvl, pr });
      out.push(`<h${lvl} id="${id}">${inline(t)}${pr ? ` <span class="prio ${pr}">${pr}</span>` : ''}</h${lvl}>`);
      i++; continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    // Figura (imagen, diagrama SVG o GIF con pie de foto opcional)
    if ((m = line.trim().match(FIGURA))) {
      out.push(`<figure class="fig"><div class="fig-img"><img alt="${esc(m[1])}" src="${seguro(ruta(m[2]))}" loading="lazy" title="Pulsa para ampliar"></div><span class="fig-pista">↔ Desliza para ver el esquema entero · pulsa para ampliar</span>${m[3] ? `<figcaption>${inline(m[3])}</figcaption>` : ''}</figure>`);
      i++; continue;
    }
    // Cita / caja destacada:  > [!clave] texto
    if (/^>/.test(line)) {
      const buf = [];
      while (i < L.length && /^>/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ''));
      let tipo = '';
      const cm = buf[0].match(/^\[!(\w+)\]\s*(.*)$/);
      if (cm) { tipo = cm[1].toLowerCase(); buf[0] = cm[2]; }
      const cuerpo = buf.join('\n').trim().split(/\n\s*\n/).map(p => `<p>${p.split('\n').map(inline).join('<br>')}</p>`).join('');
      out.push(`<div class="callout ${CALLOUTS[tipo] ? tipo : (tipo ? 'nota' : 'cita')}">${tipo ? `<b class="callout-t">${CALLOUTS[tipo] || esc(tipo)}</b>` : ''}${cuerpo}</div>`);
      continue;
    }
    // Tabla
    if (/^\|/.test(line) && i + 1 < L.length && /^\|?\s*:?-{2,}/.test(L[i + 1])) {
      const fila = s => s.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const cab = fila(line); i += 2;
      const filas = [];
      while (i < L.length && /^\|/.test(L[i])) filas.push(fila(L[i++]));
      out.push(`<div class="tabla"><table><thead><tr>${cab.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${filas.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    // Lista
    if (ES_LISTA.test(line)) { const [html, j] = lista(L, i); out.push(html); i = j; continue; }
    // Párrafo
    const buf = [L[i++]];
    while (i < L.length && L[i].trim() && !CORTA_PARRAFO.test(L[i])) buf.push(L[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), cards, toc, meta };
}
