import { state, exportar, importar, reiniciar } from '../store.js';
import { icon, toast, refrescar, vista, ponerTema, alternarVista } from '../ui.js';

export default function ajustes(el) {
  const kb = Math.max(1, Math.round(JSON.stringify(state).length / 1024));
  el.innerHTML = `
  <header class="cab"><h1>Ajustes y copia de seguridad</h1>
    <p>Tu progreso se guarda en este navegador. Descarga una copia de vez en cuando para no perderlo, o para pasarlo a otro dispositivo.</p></header>
  <div class="g2">
    <section class="card pad"><h3 class="titulo-sec">Apariencia</h3>
      <p class="tenue">Se guarda en este dispositivo.</p>
      <div class="ajuste"><b>Tema</b>
        <div class="seg" role="group" aria-label="Tema">${[['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']].map(([v, n]) =>
          `<button type="button" data-pon-tema="${v}" class="${vista.tema === v ? 'on' : ''}" aria-pressed="${vista.tema === v}">${n}</button>`).join('')}</div>
        <small class="tenue">Automático sigue el modo claro u oscuro de tu ordenador o móvil.</small></div>
      <div class="ajuste solo-pc"><b>Menú lateral</b>
        <div class="seg" role="group" aria-label="Menú lateral">${[[false, 'Se oculta solo'], [true, 'Siempre visible']].map(([v, n]) =>
          `<button type="button" data-fijo="${v}" class="${vista.fijo === v ? 'on' : ''}" aria-pressed="${vista.fijo === v}">${n}</button>`).join('')}</div>
        <small class="tenue">Oculto, aparece al llevar el ratón al borde izquierdo de la pantalla.</small></div>
    </section>
    <section class="card pad"><h3 class="titulo-sec">Exportar / importar</h3>
      <p class="tenue">${kb} KB · ${Object.keys(state.tarjetas).length} tarjetas con progreso · ${state.fallos.length} fallos · ${state.notas.length} notas · ${state.examenes.length} exámenes · ${state.trabajos.length} trabajos</p>
      <div class="acc"><button class="btn lima" data-exp>${icon('download')} Descargar copia</button>
        <label class="btn borde">${icon('upload')} Importar copia<input type="file" accept="application/json,.json" hidden data-imp></label></div>
    </section>
    <section class="card pad"><h3 class="titulo-sec">Instalar como aplicación</h3>
      <p class="tenue">En el móvil: menú del navegador → <b>Añadir a pantalla de inicio</b>. En el PC (Chrome o Edge): icono de instalar en la barra de direcciones. Funciona también sin conexión.</p>
      ${window.instalarApp ? `<button class="btn osc" data-inst>${icon('download')} Instalar ahora</button>` : ''}
    </section>
    <section class="card pad"><h3 class="titulo-sec">Empezar de cero</h3>
      <p class="tenue">Borra todo tu progreso de este dispositivo. La teoría no se toca.</p>
      <button class="btn rojo" data-reset>${icon('trash')} Borrar mi progreso</button>
    </section>
  </div>`;

  el.onclick = async e => {
    const t = e.target.closest("[data-pon-tema]"), f = e.target.closest('[data-fijo]');
    if (t) { ponerTema(t.dataset.ponTema); refrescar(); }
    else if (f) { if (String(vista.fijo) !== f.dataset.fijo) alternarVista('menu'); refrescar(); }
    else if (e.target.closest('[data-exp]')) exportar();
    else if (e.target.closest('[data-inst]')) { await window.instalarApp.prompt(); window.instalarApp = null; refrescar(); }
    else if (e.target.closest('[data-reset]') && confirm('¿Seguro? Se borrará todo tu progreso (racha, fallos, notas, exámenes…). Descarga antes una copia si la quieres.')) {
      reiniciar(); toast('Progreso borrado'); refrescar();
    }
  };
  el.onchange = async e => {
    const inp = e.target.closest('[data-imp]');
    if (!inp?.files[0]) return;
    try { importar(await inp.files[0].text()); toast('Copia importada'); refrescar(); }
    catch (err) { alert('No se pudo importar: ' + err.message); }
  };
}
