// Añadir exámenes y trabajos al calendario del móvil u ordenador.
//  - Apple (y cualquier otro calendario): archivo .ics. En Safari se abre directamente "Añadir a Calendario";
//    desde la app instalada en el iPhone eso no funciona, así que se abre calendario.html en Safari con el evento.
//  - Google Calendar: enlace que abre el evento ya rellenado.
import { nombreAsig } from './ui.js';

const WEB = 'https://gonzaloading.github.io/web-estudio/';
const pad = n => String(n).padStart(2, '0');
const compacta = f => f.replace(/-/g, ''); // 2026-12-10 -> 20261210
const fechaHora = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const aDate = (f, h) => { const [y, m, d] = f.split('-').map(Number), [hh, mm] = h.split(':').map(Number); return new Date(y, m - 1, d, hh, mm); };
const diaSiguiente = f => { const [y, m, d] = f.split('-').map(Number); const x = new Date(y, m - 1, d + 1); return `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`; };

// Datos comunes del evento: título, inicio/fin (o día entero), descripción y recordatorios
function evento(e) {
  const tr = e.clase === 'trabajo', asig = nombreAsig(e.asig);
  const ev = {
    uid: `${e.id}@mi-campus-gonzaloading`,
    // «Examen: …» salvo que el título ya empiece por «Examen»
    titulo: `${tr ? 'Entrega: ' : /^examen/i.test(e.titulo) ? '' : 'Examen: '}${e.titulo} (${asig})`,
    desc: [
      tr ? `Entrega de trabajo de ${asig}.` : `Examen de ${asig}.`,
      tr && e.hora ? `Hora límite: ${e.hora}.` : '',
      !tr && e.temas ? `Temas: ${e.temas}.` : '',
      tr && e.desc ? e.desc : '',
      `Mi campus: ${WEB}#/examenes?mes=${e.fecha.slice(0, 7)}`,
    ].filter(Boolean).join('\n'),
    // recordatorios: examen 1 semana y 1 día antes; trabajo 3 días y 1 día antes (a las 9:00 si es de día entero)
    avisos: e.hora ? (tr ? ['-P3D', '-P1D'] : ['-P7D', '-P1D']) : (tr ? ['-P2DT15H', '-PT15H'] : ['-P6DT15H', '-PT15H']),
  };
  if (!e.hora) { ev.diaEntero = true; ev.ini = compacta(e.fecha); ev.fin = diaSiguiente(e.fecha); }
  else {
    // examen: 1 h desde la hora; trabajo: la hora que acaba en la hora límite
    const h = aDate(e.fecha, e.hora), ini = tr ? new Date(h - 36e5) : h, fin = tr ? h : new Date(+h + 36e5);
    ev.ini = fechaHora(ini); ev.fin = fechaHora(fin);
  }
  return ev;
}

// ---- .ics (Apple, Outlook…) ----
const txt = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Las líneas de un .ics no deben pasar de 75 bytes: se parten y la continuación empieza por un espacio
function plegar(linea) {
  const out = []; let actual = '', bytes = 0;
  for (const ch of linea) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(actual); actual = ''; bytes = 0; }
    actual += ch; bytes += b;
  }
  out.push(actual);
  return out.join('\r\n ');
}
export function ics(items) {
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const l = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gonzaloading//Mi campus//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of items) {
    const ev = evento(e);
    l.push('BEGIN:VEVENT', `UID:${ev.uid}`, `DTSTAMP:${ahora}`,
      ev.diaEntero ? `DTSTART;VALUE=DATE:${ev.ini}` : `DTSTART:${ev.ini}`,
      ev.diaEntero ? `DTEND;VALUE=DATE:${ev.fin}` : `DTEND:${ev.fin}`,
      `SUMMARY:${txt(ev.titulo)}`, `DESCRIPTION:${txt(ev.desc)}`);
    for (const a of ev.avisos) l.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${txt(ev.titulo)}`, `TRIGGER:${a}`, 'END:VALARM');
    l.push('END:VEVENT');
  }
  l.push('END:VCALENDAR');
  return l.map(plegar).join('\r\n') + '\r\n';
}

// Devuelve 'safari' (se abre en Safari) o 'descargado' (se descargó un .ics que hay que abrir)
export function anadirApple(items, nombre = 'evento') {
  const contenido = ics(items);
  // App instalada en el iPhone: el .ics no se abre desde ahí, así que se pasa a Safari
  if (navigator.standalone) { window.open(`calendario.html#${encodeURIComponent(contenido)}`, '_blank'); return 'safari'; }
  const a = document.createElement('a');
  a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(contenido);
  a.download = `${nombre.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().slice(0, 60) || 'evento'}.ics`;
  document.body.append(a); a.click(); a.remove();
  return 'descargado';
}

// ---- Google Calendar ----
export function urlGoogle(e) {
  const ev = evento(e), p = new URLSearchParams({ action: 'TEMPLATE', text: ev.titulo, dates: `${ev.ini}/${ev.fin}`, details: ev.desc });
  if (!ev.diaEntero) p.set('ctz', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid');
  return `https://calendar.google.com/calendar/render?${p}`;
}
