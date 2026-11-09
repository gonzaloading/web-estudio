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
4. **Escribir** el `.md` dividido en **segmentos con su test** (obligatorio, ver «Tests»), su línea en `temas.json`, las imágenes, las tarjetas y, en asignaturas prácticas, los ejercicios.
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
  - Ponle siempre fondo blanco propio: en modo oscuro la web enseña los diagramas sobre una tarjeta blanca, así que no hagas versión oscura.
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

```test          ← cierra el segmento anterior y es su test (ver «Tests»)
¿Pregunta?
- opción incorrecta
+ opción correcta
- opción incorrecta
- opción incorrecta
= Explicación breve de por qué (opcional, recomendada)

¿Siguiente pregunta?   ← las preguntas se separan con una línea en blanco
+ …
```

```ejercicio     ← ejercicio práctico que el usuario hace en IntelliJ y corrige con Claude Code
titulo: Suma de los números pares
nivel: fácil
Escribe un método `sumaPares(int n)` que devuelva la suma de los pares entre 1 y n.
ejemplo: sumaPares(10) → 30
ejemplo: sumaPares(1) → 0
pista: Un número es par si n % 2 == 0.
```

?? Pregunta de active recall || Respuesta corta y concreta
~~~

Las cajas (`> [!…]`) solo admiten párrafos; las tablas y listas van fuera.

## Cómo priorizar el contenido

- **alta**: lo que el profesor marca como importante, lo que sale en exámenes o prácticas, la base de los temas siguientes.
- **media**: contenido necesario pero que se entiende sin memorizar.
- **baja**: historia, curiosidades, ampliación.
- Dentro del tema, ordena los apartados de más a menos importante cuando el temario lo permita y usa `> [!clave]` en lo esencial.
- Resume y reorganiza: no copies el PDF literal. Frases cortas, ejemplos y tablas comparativas.

## Tests (obligatorios en cada tema)

Hacer test es el **método principal de estudio** del usuario. Todo tema nuevo lleva sus tests desde el primer momento.

- **Divide el tema en segmentos breves**: unos 5 minutos de lectura, normalmente un `##` o un grupo corto de `###`. Al final de cada segmento va un bloque ```` ```test ````. Ese bloque **cierra el segmento**: cuando el usuario lo termina, el segmento cuenta como «visto» y sube el % de teoría vista del tema y del total.
- **De 2 a 6 preguntas por segmento**, cubriendo todo lo `alta` del segmento. Suelen salir entre 10 y 30 por tema.
- **Cómo escribir buenas preguntas**:
  - Una sola opción correcta (`+`) y 3 incorrectas (`-`) creíbles: los errores típicos, no opciones absurdas.
  - Opciones cortas y de longitud parecida. Nada de «todas las anteriores» ni «ninguna de las anteriores».
  - Mejor preguntas aplicadas (un caso, una conversión, «¿de qué tipo es…?») que memorizar frases.
  - Si preguntas en negativo, escribe el NO en mayúsculas.
  - Responde según los apuntes del profesor (lo que cuenta en el examen). No preguntes por contenido `> [!extra]`.
  - Añade `=` con la explicación cuando ayude a entender el porqué.
- La web **baraja las opciones**: pon la correcta en cualquier posición.
- **No cambies el texto de una pregunta existente** salvo que tenga un error: su progreso está ligado a ese texto. Para añadir preguntas, añádelas al bloque.
- En el apartado **Test** de la web, el usuario hace tests de todo, de una asignatura o de un tema, y repite las que falló. No hay que hacer nada más para eso.

## Ejercicios prácticos (programación, bases de datos, marcas, entornos…)

- Con bloques ```` ```ejercicio ```` dentro del segmento al que corresponden, o en temas con `"tipo": "practica"`.
- Enunciado claro y cerrado: qué recibe, qué devuelve o muestra y en qué lenguaje.
- **Casos de prueba con el resultado exacto** (`ejemplo:`), incluidos casos límite (0, vacío, negativos…). Con ellos Claude Code decide si la solución es correcta.
- `nivel`: fácil, medio o difícil. `pista:` opcional, sin dar la solución.
- La web genera sola el texto para pegar en Claude Code («Copiar para Claude Code»). Si te piden corregir un ejercicio con ese texto: di si es correcto, da una pista en vez de la solución, sugiere mejoras y pon nota.

## Tarjetas (`?? pregunta || respuesta`)

- Una por cada idea importante: normalmente entre 8 y 20 por tema, empezando por los apartados `alta`. Una idea por tarjeta.
- Preguntas concretas que obliguen a recordar ("¿Qué diferencia hay entre…?", "¿Qué devuelve…?").
- **No cambies el texto de una pregunta existente** salvo que tenga un error: el progreso de la tarjeta está ligado a ese texto.

## Diseño: modo oscuro y colores

- La web tiene **modo claro y oscuro** (botón en el menú y en *Ajustes y copia*). Los colores están en variables al principio de `css/styles.css`, y el bloque `:root[data-tema="oscuro"]` del final les da los valores oscuros.
- **Si añades o cambias estilos, no pongas colores fijos** (`#fff`, `#eef1ea`…): usa las variables. Las principales son `--card`, `--sub`, `--hover`, `--campo`, `--borde`, `--txt`, `--suave`, `--tit` y `--osc`. Si hace falta un color nuevo, créalo como variable en los dos bloques.
- Comprueba cada cambio en los dos modos.
- El menú lateral se oculta solo en pantallas anchas (clase `nav-auto` en `<html>`) y en el móvil es el menú de siempre. Las preferencias de vista y tema se guardan en `gonzaloading-vista`, aparte del progreso.

## Comprobar

`python3 -m http.server 8000` en esta carpeta y abrir http://localhost:8000. No hace falta cambiar `sw.js` al añadir temas.

**Publicar**: la web está en https://gonzaloading.github.io/web-estudio/ y se actualiza sola con cada `git push` a `main` (ver README). Los PDF de `../recursos/` nunca se suben.

> **Siempre que termines un cambio en la web** (teoría, diseño o funciones), **recuérdale al usuario que está sin publicar** y ofrécete a publicarlo: es una petición expresa suya. Haz commit y push **solo cuando el usuario diga que sí**.
