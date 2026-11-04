# Instrucciones para agentes (Codex, Claude…)

Esta web **ya está construida**. Tu trabajo casi siempre será **añadir o actualizar teoría**.
Para ahorrar tokens: **no regeneres la web, no reescribas archivos enteros y no leas el código si no hace falta.**
Las rutas de este archivo son relativas a la carpeta `campus/`.

## Regla de oro

| Quiero… | Archivos que se tocan | NO tocar |
|---|---|---|
| Añadir un tema | 1 archivo nuevo `contenido/<asig>/<id>.md` + 1 línea en `contenido/<asig>/temas.json` (+ sus imágenes en `contenido/<asig>/img/`) | `index.html`, `css/`, `js/`, `sw.js`, otros temas |
| Ampliar un tema | solo ese `.md` (edición puntual, añadiendo al final o en su apartado) | el resto |
| Cambiar la prioridad de un tema | su línea en `temas.json` | el resto |
| Añadir una asignatura | 1 línea en `data/asignaturas.json` + carpeta `contenido/<id>/` con `temas.json` = `[]` | el resto |

Solo toca `js/` o `css/` si el usuario pide **expresamente** un cambio de diseño o de funcionamiento.

## Asignaturas (id → carpeta)

`bd` Base de datos · `programacion` Programación · `marcas` Lenguaje de marcas · `sistemas` Sistemas informáticos ·
`entornos` Entornos de desarrollo · `ingles` Inglés · `sostenibilidad` Sostenibilidad

## Procesar recursos nuevos (sigue estos pasos)

Los apuntes originales (PDF, diapositivas, fotos…) están en `../recursos/<asig>/`, fuera de la web para que no se publiquen.
Lee solo los recursos nuevos que te indique el usuario; no reproceses los que ya tienen tema.

1. **Extraer.** PDF en macOS, sin instalar nada:
   `osascript -l JavaScript ../herramientas/pdf2txt.js "<pdf>" <tmp>/t.txt <tmp>/paginas`
   Saca el texto por página y cada página como PNG. **Mira las PNG marcadas `[SOLO IMAGEN]`** y las de páginas con esquemas o capturas: ahí suele haber contenido que el texto no recoge. Usa una carpeta temporal fuera de la web.
2. **Ordenar y priorizar** (ver «Cómo priorizar»). Resume y reorganiza: no copies el PDF literal.
3. **Analizar y mejorar** el tema antes de darlo por terminado (ver la sección siguiente). **Este paso es obligatorio.**
4. **Escribir** el `.md`, su línea en `temas.json`, las imágenes y las tarjetas.
5. **Comprobar** que se ve bien (ver «Comprobar»).
6. **Informar** al usuario, breve y por tema: qué has mejorado o añadido, qué errores de los apuntes has marcado y qué no has podido leer.

Si el usuario pide revisar temas que ya existen, aplica el paso 3 editando solo lo necesario: no reescribas el tema.

## Analizar y mejorar cada tema

Repasa el tema apartado por apartado como lo haría un buen profesor particular:

| Pregúntate | Si es que sí |
|---|---|
| ¿Se entiende a la primera? (muy abstracto, frases largas, términos sin definir, pasos que se saltan) | Reescríbelo más claro: frases cortas, define cada término la primera vez, añade una analogía de la vida diaria |
| ¿Falta un ejemplo? | `> [!ejemplo]` resuelto paso a paso. En código (bd, programacion, marcas, entornos): ejemplo mínimo que funcione, con su salida o resultado |
| ¿Se entendería mejor viéndolo? (jerarquías, estructuras, flujos, comparaciones, partes de algo) | Diagrama (ver «Imágenes»). Si es un **proceso por pasos**, que sea **animado** |
| ¿Hay errores o datos desactualizados? | Corrígelo en `> [!nota]`: qué dicen los apuntes (lo que conviene responder en el examen) y cómo es en realidad |
| ¿Hay huecos? (remite a un vídeo, a «lo visto en clase», diapositivas sin texto) | Complétalo dentro de un `> [!extra]`; si no puedes, díselo al usuario |
| ¿Hay un fallo típico o algo difícil de memorizar? | `> [!error]` o `> [!truco]` |

Límites:
- **Mejora, no rellenes.** Cada añadido tiene que ayudar a entender o a aprobar. Nada de párrafos genéricos.
- **No inventes.** Si no estás seguro de un dato, no lo pongas.
- **Separa lo que no es del profesor.** Contenido nuevo que no viene en los apuntes → `> [!extra]` (sale como «Ampliación · no viene en tus apuntes»), para que el usuario sepa qué entra seguro en el examen. Reformular, ejemplos y diagramas no necesitan esa marca.
- **Pocas imágenes y buenas**: de 0 a 3 por tema, donde más ayuden.

## Imágenes, diagramas y animaciones

- **Primera opción: un SVG hecho por ti**, en `contenido/<asig>/img/<id-tema>-<nombre>.svg`. Pesa poco, se ve nítido en el móvil y funciona sin conexión.
- **Para animar, SVG animado en lugar de GIF**: animaciones CSS (`@keyframes`) dentro del propio SVG.
  - Ciclo de 8–14 s, con una pausa al final para que se lea el resultado.
  - El estado **sin animar debe ser el diagrama completo**: la animación solo lo va revelando. Incluye `@media (prefers-reduced-motion:reduce){*{animation:none!important}}`.
- **Reglas del SVG**:
  - Sin JavaScript ni archivos externos, porque dentro de `<img>` no funcionan.
  - Fuente `system-ui, sans-serif`.
  - Fondo blanco y colores de la web: verde oscuro `#0d3a2b`, verde `#1f7a4c`, lima `#cbe56b`, rojo `#cf3e3e`, gris `#56645b`.
  - `viewBox` de unos 600–800 px de ancho, texto de **12 px como mínimo** y menos de 20 KB.
- **Insértalo en una línea aparte**; el texto entre comillas es el pie de foto, que admite **negrita**:
  `![Descripción de la imagen](img/tema-02-division-binario.svg "Qué tiene que mirar el alumno")`
- **Para generarlos**: `../herramientas/svgkit.py` trae cajas, flechas y animaciones sincronizadas (`Anim`: aparece, desaparece y mueve). Ejemplo completo: `../herramientas/ejemplo-svg-animado.py`, que genera `contenido/sistemas/img/tema-02-division-binario.svg`.
- La web ya se encarga del móvil (el esquema se desliza) y de ampliarlo al pulsarlo: no hagas versiones aparte.
- **Fotos o GIF reales** solo con licencia libre (Wikimedia Commons, dominio público…). Descárgalos a `img/` en vez de enlazarlos, para que funcionen sin conexión, y cita autor y licencia en el pie. No copies imágenes de los PDF del profesor ni de webs con copyright: la web puede publicarse.

## temas.json (una entrada por tema, en el orden del temario)

```json
{ "id": "tema-04", "titulo": "Consultas SQL", "prioridad": "alta", "tipo": "teoria", "fuente": "PDF T4 del profesor", "actualizado": "2026-11-04" }
```

- `id`: nombre del archivo sin `.md` (minúsculas, sin espacios).
- `prioridad`: `alta` | `media` | `baja` (ver criterio abajo).
- `tipo` (opcional) agrupa los temas en la página de la asignatura:
  - plantilla `codigo` (bd, programacion, marcas, entornos): `teoria` · `practica` · `resumen`
  - plantilla `teoria` (sistemas, sostenibilidad): `teoria` · `practica` · `resumen`
  - plantilla `idiomas` (ingles): `gramatica` · `vocabulario` · `reading` · `writing`
- `fuente`: de qué recurso sale (PDF, diapositivas, clase…). `actualizado`: fecha AAAA-MM-DD.

## Formato del .md

El título del tema NO va en el .md (sale de `temas.json`). Empieza directamente por los apartados.

~~~
## Nombre del apartado {alta}        ← prioridad del apartado (opcional)
### Subapartado {media}

Texto normal con **negrita**, *cursiva*, `código`, ==resaltado== y [enlaces](https://…).

- listas            1. numeradas
| tablas | con | cabecera |
|---|---|---|

```sql            ← bloque de código con botón "Copiar" (sql, java, html, xml, bash…)
SELECT * FROM t;
```

```vocab          ← solo idiomas: cada línea crea una tarjeta automáticamente
to download = descargar
```

> [!clave] Lo que seguro cae en el examen.
> [!error] Error típico que hay que evitar.
> [!nota] Aclaración o corrección.   > [!ejemplo] Ejemplo.   > [!resumen] Resumen.   > [!truco] Regla mnemotécnica.
> [!extra] Contenido que NO viene en los apuntes del profesor.

![Descripción](img/tema-02-esquema.svg "Pie de foto opcional")   ← imagen en su propia línea

?? Pregunta de active recall || Respuesta corta y concreta
~~~

Las cajas (`> [!…]`) solo admiten párrafos; las tablas y listas van fuera.

## Cómo priorizar el contenido

- **alta**: lo que el profesor marca como importante, lo que sale en exámenes o prácticas, la base de los temas siguientes.
- **media**: contenido necesario pero que se entiende sin memorizar.
- **baja**: historia, curiosidades, ampliación.
- Dentro del tema, ordena los apartados de más a menos importante cuando el temario lo permita y usa `> [!clave]` en lo esencial.
- Resume y reorganiza: no copies el PDF literal. Frases cortas, ejemplos y tablas comparativas.

## Tarjetas (`?? pregunta || respuesta`)

- Una por cada idea importante: normalmente entre 8 y 20 por tema, empezando por los apartados `alta`. Una idea por tarjeta.
- Preguntas concretas que obliguen a recordar ("¿Qué diferencia hay entre…?", "¿Qué devuelve…?").
- **No cambies el texto de una pregunta existente** salvo que tenga un error: el progreso de la tarjeta está ligado a ese texto.

## Comprobar

`python3 -m http.server 8000` en esta carpeta y abrir http://localhost:8000. No hace falta cambiar `sw.js` al añadir temas.

**Publicar**: la web está en https://gonzaloading.github.io/web-estudio/ y se actualiza sola con cada `git push` a `main` (ver README). Los PDF de `../recursos/` nunca se suben.

> **Siempre que termines un cambio en la web** (teoría, diseño o funciones), **recuérdale al usuario que está sin publicar** y ofrécete a publicarlo: es una petición expresa suya. Haz commit y push **solo cuando él diga que sí**.
