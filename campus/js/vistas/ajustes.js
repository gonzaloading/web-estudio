import { state, exportar, importar, reiniciar } from '../store.js';
import { icon, esc, toast, refrescar, vista, ponerTema, alternarVista, datosForm } from '../ui.js';
import { conectado, conectar, desconectar, sincronizar, textoEstado, errorSync, claveActual, URL_CLAVE } from '../sync.js';

const tarjetaSync = () => conectado()
  ? `<section class="card pad"><h3 class="titulo-sec">Sincronizar dispositivos</h3>
      <p class="sync-linea"><b data-sync-estado class="${errorSync() ? 'sync-mal' : ''}">${textoEstado()}</b></p>
      <p class="error-txt" data-sync-error>${esc(errorSync())}</p>
      <p class="tenue">Tu progreso se une con el de tus otros dispositivos al abrir la app, al volver a ella y unos segundos después de cada cambio.</p>
      <div class="acc"><button class="btn lima" data-sync-ya>${icon('refresh')} Sincronizar ahora</button>
        <button class="btn borde" data-sync-copiar>Copiar clave</button>
        <button class="btn borde" data-sync-off>Desconectar</button></div>
      <p class="tenue peq">Para añadir otro dispositivo: pulsa «Copiar clave», abre Mi campus en él y pégala en esta misma pantalla.</p>
    </section>`
  : `<section class="card pad"><h3 class="titulo-sec">Sincronizar dispositivos</h3>
      <p class="tenue">Ten el mismo progreso en el Mac y en el iPhone. Se guarda en un gist secreto de tu cuenta de GitHub, que además guarda un historial de versiones y te sirve de copia de seguridad.</p>
      <ol class="pasos">
        <li><a class="link" href="${URL_CLAVE}" target="_blank" rel="noopener">Crea una clave en GitHub</a>: deja marcado solo <b>gist</b>, elige cuándo caduca y pulsa <b>Generate token</b>.</li>
        <li>Cópiala y pégala aquí. En tus otros dispositivos pega la misma clave.</li>
      </ol>
      <form class="form" id="f-sync">
        <label class="ancho">Clave de GitHub<input name="clave" type="password" required autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ghp_…"></label>
        <div class="form-acc"><button class="btn osc">Conectar</button></div>
      </form>
      <p class="error-txt" id="sync-msg"></p>
    </section>`;

export default function ajustes(el) {
  const kb = Math.max(1, Math.round(JSON.stringify(state).length / 1024));
  el.innerHTML = `
  <header class="cab"><h1>Ajustes y copia de seguridad</h1>
    <p>${conectado() ? 'Tu progreso se sincroniza entre tus dispositivos.' : 'Tu progreso se guarda en este navegador. Activa la sincronización para tenerlo también en tus otros dispositivos, o descarga una copia de vez en cuando.'}</p></header>
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
    ${tarjetaSync()}
    <section class="card pad"><h3 class="titulo-sec">Exportar / importar</h3>
      <p class="tenue">${kb} KB · ${Object.keys(state.tarjetas).length} tarjetas con progreso · ${state.fallos.length} fallos · ${state.notas.length} notas · ${state.examenes.length} exámenes · ${state.trabajos.length} trabajos</p>
      <div class="acc"><button class="btn lima" data-exp>${icon('download')} Descargar copia</button>
        <label class="btn borde">${icon('upload')} Importar copia<input type="file" accept="application/json,.json" hidden data-imp></label></div>
    </section>
    <section class="card pad"><h3 class="titulo-sec">Instalar como aplicación</h3>
      <p class="tenue">En el iPhone: abre la web en Safari → botón Compartir → <b>Añadir a pantalla de inicio</b>. En el PC (Chrome o Edge): icono de instalar en la barra de direcciones. Funciona también sin conexión.</p>
      ${window.instalarApp ? `<button class="btn osc" data-inst>${icon('download')} Instalar ahora</button>` : ''}
    </section>
    <section class="card pad"><h3 class="titulo-sec">Empezar de cero</h3>
      <p class="tenue">Borra todo tu progreso${conectado() ? ', también en tus otros dispositivos sincronizados' : ' de este dispositivo'}. La teoría no se toca.</p>
      <button class="btn rojo" data-reset>${icon('trash')} Borrar mi progreso</button>
    </section>
  </div>`;

  el.onclick = async e => {
    const t = e.target.closest("[data-pon-tema]"), f = e.target.closest('[data-fijo]');
    if (t) { ponerTema(t.dataset.ponTema); refrescar(); }
    else if (f) { if (String(vista.fijo) !== f.dataset.fijo) alternarVista('menu'); refrescar(); }
    else if (e.target.closest('[data-exp]')) exportar();
    else if (e.target.closest('[data-inst]')) { await window.instalarApp.prompt(); window.instalarApp = null; refrescar(); }
    else if (e.target.closest('[data-sync-ya]')) {
      await sincronizar();
      if (!errorSync()) toast('Progreso sincronizado');
      refrescar();
    }
    else if (e.target.closest('[data-sync-copiar]')) {
      try { await navigator.clipboard.writeText(claveActual()); toast('Clave copiada: pégala en tu otro dispositivo'); }
      catch { prompt('Copia la clave:', claveActual()); }
    }
    else if (e.target.closest('[data-sync-off]') && confirm('¿Dejar de sincronizar este dispositivo? Tu progreso se queda aquí; solo deja de compartirse.')) {
      desconectar(); toast('Sincronización desactivada en este dispositivo'); refrescar();
    }
    else if (e.target.closest('[data-reset]') && confirm(`¿Seguro? Se borrará todo tu progreso (racha, fallos, notas, exámenes…)${conectado() ? ' en todos tus dispositivos sincronizados' : ''}. Descarga antes una copia si la quieres.`)) {
      reiniciar(); toast('Progreso borrado'); refrescar();
    }
  };
  el.onsubmit = async e => {
    e.preventDefault();
    const bt = e.target.querySelector('button'), msg = el.querySelector('#sync-msg');
    bt.disabled = true; bt.textContent = 'Conectando…'; msg.textContent = '';
    try { await conectar(datosForm(e.target).clave); toast('¡Sincronización activada!'); refrescar(); }
    catch (err) { msg.textContent = err.message; bt.disabled = false; bt.textContent = 'Conectar'; }
  };
  el.onchange = async e => {
    const inp = e.target.closest('[data-imp]');
    if (!inp?.files[0]) return;
    try { importar(await inp.files[0].text()); toast('Copia importada'); refrescar(); }
    catch (err) { alert('No se pudo importar: ' + err.message); }
  };
}
