// Extrae el texto de un PDF página a página y, si se indica una carpeta, guarda cada página como PNG
// para poder MIRAR diagramas, capturas y diapositivas que son solo imagen.
// Solo macOS (usa PDFKit, sin instalar nada).
//
//   osascript -l JavaScript herramientas/pdf2txt.js "<archivo.pdf>" <salida.txt> [carpeta_png]
//
// En el .txt, las páginas con poco texto llevan la marca  [SOLO IMAGEN → p-07.png]  : míralas.
ObjC.import('PDFKit');
ObjC.import('AppKit');
ObjC.import('Foundation');

function run(argv) {
  const [pdf, txt, carpeta] = argv;
  if (!pdf || !txt) return 'Uso: osascript -l JavaScript pdf2txt.js <pdf> <salida.txt> [carpeta_png]';
  const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(pdf));
  if (!doc || doc.isNil()) return 'ERROR: no se pudo abrir ' + pdf;
  if (carpeta) $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(carpeta, true, $(), null);

  const n = doc.pageCount;
  let out = '', soloImagen = [];
  for (let i = 0; i < n; i++) {
    const page = doc.pageAtIndex(i);
    const s = page.string, texto = s && !s.isNil() ? s.js.trim() : '';
    const nombre = `p-${String(i + 1).padStart(2, '0')}.png`;
    const poco = texto.replace(/\s+/g, '').length < 60;
    if (poco) soloImagen.push(i + 1);
    out += `\n=== Página ${i + 1} ===${poco ? `  [SOLO IMAGEN → ${nombre}]` : ''}\n${texto}\n`;
    if (carpeta) {
      const img = page.thumbnailOfSizeForBox($.NSMakeSize(1400, 1400), 0); // 0 = media box
      const rep = $.NSBitmapImageRep.imageRepWithData(img.TIFFRepresentation);
      rep.representationUsingTypeProperties(4, $({})).writeToFileAtomically(`${carpeta}/${nombre}`, true); // 4 = PNG
    }
  }
  $(out).writeToFileAtomicallyEncodingError(txt, true, $.NSUTF8StringEncoding, null);
  return `${n} páginas, ${out.length} caracteres. Páginas casi sin texto: ${soloImagen.join(', ') || 'ninguna'}`;
}
