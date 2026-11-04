# Mi campus · Gonzaloading

Web de estudio y progreso (DAM). Funciona en el navegador y se puede **instalar como app** en el móvil y en el PC.

## Verla en tu ordenador

```bash
cd campus
python3 -m http.server 8000
```

Abre http://localhost:8000. (Con doble clic sobre `index.html` no funciona: necesita un servidor.)

## Versión publicada (GitHub Pages)

Está en **https://gonzaloading.github.io/web-estudio/** (repositorio `gonzaloading/web-estudio`).
Ábrela en el móvil y pulsa **Compartir → Añadir a pantalla de inicio**.

Para publicar cambios, desde la carpeta `web estudio`:

```bash
git add -A && git commit -m "Añade tema X" && git push
```

En 1–2 minutos se actualiza sola: la publica `.github/workflows/publicar.yml`, que sube solo la carpeta `campus/`.
Los PDF de `recursos/` **no se suben nunca** (están en `.gitignore`).

## Añadir teoría nueva

Pásale tus apuntes a Codex o Claude y pídele: *"Añade este tema a <asignatura> siguiendo AGENTS.md"*.
Solo se crean o editan archivos dentro de `contenido/`, así que no se rehace la web ni se gastan tokens de más.

## Tus datos

El progreso (racha, repasos, fallos, notas, exámenes) se guarda en el navegador de cada dispositivo.
Haz una copia de vez en cuando en **Copia de seguridad → Descargar copia**.
