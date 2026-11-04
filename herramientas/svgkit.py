# Utilidades para generar los SVG de los temas (estáticos y animados)
FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'
BASE_CSS = f'''text{{font-family:{FONT};fill:#13241c}}
.tit{{font-size:20px;font-weight:700;fill:#0d3a2b}} .sub{{font-size:14px;fill:#56645b}}
.lbl{{font-size:14px;font-weight:600;text-anchor:middle}} .peq{{font-size:12px;fill:#56645b;text-anchor:middle}}
.fl{{stroke:#56645b;stroke-width:2;fill:none}}'''
DEFS = '''<defs><marker id="pf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#56645b"/></marker>
<marker id="pr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#cf3e3e"/></marker></defs>'''
RM = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'

def svg(w, h, label, body, css=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{label}">\n'
            f'<style>\n{BASE_CSS}\n{css}\n{RM}\n</style>\n{DEFS}\n<rect width="{w}" height="{h}" fill="#fff"/>\n' + '\n'.join(body) + '\n</svg>\n')

def caja(x, y, w, h, txt, fill='#eef5d6', stroke='#b3cf4c', color='#13241c', fs=14, rx=10, cls='', bold=True):
    lines = txt.split('\n'); n = len(lines); lh = fs * 1.2
    y0 = y + h / 2 - (n - 1) * lh / 2 + fs * 0.35
    t = ''.join(f'<text x="{x + w / 2}" y="{y0 + i * lh:.1f}" style="font-size:{fs}px;font-weight:{650 if bold else 400};text-anchor:middle;fill:{color}">{l}</text>' for i, l in enumerate(lines))
    c = f' class="{cls}"' if cls else ''
    return f'<g{c}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>{t}</g>'

def flecha(x1, y1, x2, y2, doble=False, color='pf', cls='fl'):
    s = f' marker-start="url(#{color})"' if doble else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}"{s} marker-end="url(#{color})"/>'

class Anim:
    """Genera keyframes sincronizados: cada elemento aparece en t y desaparece todo junto al final."""
    def __init__(self, T, fin=93.0, out=97.0):
        self.T, self.fin, self.out, self.css, self.n = T, fin, out, [], 0
    def pc(self, t): return round(t / self.T * 100, 2)
    def _name(self): self.n += 1; return f'a{self.n}'
    def aparece(self, t, dur=0.35):
        k = self._name(); a, b = self.pc(t), self.pc(t + dur)
        self.css.append(f'@keyframes {k}{{0%,{a}%{{opacity:0}}{b}%,{self.fin}%{{opacity:1}}{self.out}%,100%{{opacity:0}}}}.{k}{{animation:{k} {self.T}s infinite}}')
        return k
    def desaparece(self, t, dur=0.3):
        """Visible desde el principio hasta t (para valores que luego se sustituyen). Base CSS: opacity 0."""
        k = self._name(); a, b = self.pc(t), self.pc(t + dur)
        self.css.append(f'@keyframes {k}{{0%,{a}%{{opacity:1}}{b}%,100%{{opacity:0}}}}.{k}{{opacity:0;animation:{k} {self.T}s infinite}}')
        return k
    def mueve(self, puntos):
        """puntos = [(t, dx, dy), ...] → translate a trozos; la base CSS queda en el último punto."""
        k = self._name(); fr = []
        for t, dx, dy in puntos: fr.append(f'{self.pc(t)}%{{transform:translate({dx}px,{dy}px)}}')
        last = puntos[-1]
        fr.append(f'100%{{transform:translate({last[1]}px,{last[2]}px)}}')
        self.css.append(f'@keyframes {k}{{{"".join(fr)}}}.{k}{{transform:translate({last[1]}px,{last[2]}px);animation:{k} {self.T}s infinite}}')
        return k
    def styles(self): return '\n'.join(self.css)
