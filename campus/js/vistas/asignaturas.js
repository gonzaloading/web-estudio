import { cat, todosTemas, todasTarjetas } from '../data.js';
import { tarjetaAsig } from '../ui.js';

export default function asignaturas(el) {
  el.innerHTML = `
  <header class="cab"><h1>Asignaturas</h1>
    <p>${cat.asignaturas.length} asignaturas · ${todosTemas().length} temas · ${todasTarjetas().length} tarjetas de repaso</p></header>
  <div class="asigs">${cat.asignaturas.map(a => tarjetaAsig(a, true)).join('')}</div>`;
}
