// Carga del catálogo: data/asignaturas.json + contenido/<asignatura>/temas.json + cada .md
import { parseTema } from './md.js';

// Cada plantilla define cómo se agrupan los temas en la página de la asignatura.
// Un tema elige grupo con "tipo" en su temas.json. Una asignatura puede añadir "grupos" propios.
export const PLANTILLAS = {
  teoria:  { teoria: 'Temas', practica: 'Prácticas', resumen: 'Resúmenes' },
  codigo:  { teoria: 'Teoría', practica: 'Prácticas y ejercicios', resumen: 'Chuletas y resúmenes' },
  idiomas: { gramatica: 'Grammar', vocabulario: 'Vocabulary', reading: 'Reading & Listening', writing: 'Writing & Speaking' },
};

export const cat = { asignaturas: [], porId: {}, temas: {}, preguntas: {}, ejercicios: {} };

const pedir = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r; };

export async function cargarCatalogo() {
  const asigs = await (await pedir('data/asignaturas.json')).json();
  await Promise.all(asigs.map(async a => {
    a.temas = [];
    try { a.temas = await (await pedir(`contenido/${a.id}/temas.json`)).json(); } catch { /* asignatura sin temas */ }
    await Promise.all(a.temas.map(async (t, i) => {
      t.asig = a.id; t.key = `${a.id}/${t.id}`; t.n = t.numero ?? i + 1;
      let src;
      try { src = await (await pedir(`contenido/${a.id}/${t.archivo || t.id + '.md'}`)).text(); }
      catch { src = `> [!error] No se encontró el archivo \`contenido/${a.id}/${t.archivo || t.id + '.md'}\`.`; }
      const p = parseTema(src, t.key, `contenido/${a.id}/`);
      for (const k in p.meta) if (t[k] === undefined) t[k] = p.meta[k];
      Object.assign(t, { html: p.html, cards: p.cards, toc: p.toc, segs: p.segs, preguntas: p.preguntas, ejercicios: p.ejercicios });
      for (const x of [...t.cards, ...t.preguntas, ...t.ejercicios]) { x.asig = a.id; x.temaTitulo = t.titulo; }
    }));
  }));
  cat.asignaturas = asigs;
  for (const a of asigs) {
    cat.porId[a.id] = a;
    for (const t of a.temas) {
      cat.temas[t.key] = t;
      t.preguntas.forEach(q => { cat.preguntas[q.id] = q; });
      t.ejercicios.forEach(ej => { cat.ejercicios[ej.id] = ej; });
    }
  }
}

export const todosTemas = asig => cat.asignaturas.filter(a => !asig || a.id === asig).flatMap(a => a.temas);
export const todasTarjetas = asig => todosTemas(asig).flatMap(t => t.cards);
export const todasPreguntas = (asig, tema) => todosTemas(asig).filter(t => !tema || t.key === tema).flatMap(t => t.preguntas);
export const todosEjercicios = asig => todosTemas(asig).flatMap(t => t.ejercicios);

export function gruposDe(a) {
  const def = { ...(PLANTILLAS[a.plantilla] || PLANTILLAS.teoria), ...(a.grupos || {}) };
  const orden = Object.keys(def);
  const mapa = new Map();
  for (const t of a.temas) {
    const k = t.tipo || orden[0];
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(t);
  }
  const pos = k => (orden.indexOf(k) + 1) || 99;
  return [...mapa.keys()].sort((x, y) => pos(x) - pos(y)).map(k => ({ nombre: def[k] || k, temas: mapa.get(k) }));
}
