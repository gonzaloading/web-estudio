import { state, exportar, importar, reiniciar } from '../store.js';
import { icon, toast, refrescar } from '../ui.js';

export default function ajustes(el) {
  const kb = Math.max(1, Math.round(JSON.stringify(state).length / 1024));
  el.innerHTML = `
  <header class="cab"><h1>Copia de seguridad</h1>
    <p>Tu progreso se guarda en este navegador. Descarga una copia de vez en cuando para no perderlo, o para pasarlo a otro dispositivo.</p></header>
  <div class="g2">
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
    if (e.target.closest('[data-exp]')) exportar();
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
