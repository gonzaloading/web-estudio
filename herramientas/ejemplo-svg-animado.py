import sys
T = 12.0                       # duración del ciclo (s)
FIN, OUT = 93.0, 97.0          # % donde empieza y acaba el fundido final
pc = lambda t: round(t / T * 100, 2)
css, body = [], []
def aparece(nombre, t, dur=0.35):
    a, b = pc(t), pc(t + dur)
    css.append(f"@keyframes {nombre}{{0%,{a}%{{opacity:0}}{b}%,{FIN}%{{opacity:1}}{OUT}%,100%{{opacity:0}}}}"
               f".{nombre}{{animation:{nombre} {T}s infinite}}")
    return nombre
filas = [(45,22,1),(22,11,0),(11,5,1),(5,2,1),(2,1,0),(1,0,1)]
Y0, DY = 118, 38
body.append('<text x="40" y="38" class="tit">Pasar 45 a binario</text>')
body.append('<text x="40" y="62" class="sub">Divide entre 2 hasta que el cociente sea 0</text>')
body.append('<text x="40" y="88" class="cab">DIVISIÓN</text><text x="200" y="88" class="cab">COCIENTE</text><text x="318" y="88" class="cab">RESTO</text>')
for i,(n,c,r) in enumerate(filas):
    y = Y0 + i*DY
    k = aparece(f"f{i}", 0.4 + i*0.75)
    body.append(f'<g class="{k}"><text x="40" y="{y}" class="op">{n} ÷ 2</text><text x="226" y="{y}" class="op">{c}</text>'
                f'<rect x="322" y="{y-22}" width="34" height="30" rx="7" class="caja"/><text x="339" y="{y}" class="resto">{r}</text></g>')
# Resaltado de cada resto (de abajo arriba) a la vez que su dígito en el resultado
t_flecha = 0.4 + 6*0.75 + 0.3
yb, yt = Y0 + 5*DY - 6, Y0 - 22
L = yb - yt
css.append(f"@keyframes fl{{0%,{pc(t_flecha)}%{{stroke-dashoffset:{L}}}{pc(t_flecha+0.9)}%,{FIN}%{{stroke-dashoffset:0;opacity:1}}{OUT}%,100%{{stroke-dashoffset:0;opacity:0}}}}"
           f".fl{{stroke-dasharray:{L};animation:fl {T}s infinite}}")
punta = aparece("punta", t_flecha + 0.8, 0.2)
lbl = aparece("lbl", t_flecha + 0.3)
body.append(f'<line x1="392" y1="{yb}" x2="392" y2="{yt+8}" class="flecha fl"/>')
body.append(f'<polygon points="384,{yt+10} 392,{yt-4} 400,{yt+10}" class="punta-f {punta}"/>')
body.append(f'<text x="412" y="{Y0+2*DY+6}" class="aviso {lbl}">Lee los restos</text><text x="412" y="{Y0+2*DY+28}" class="aviso {lbl}">de abajo arriba ↑</text>')
yr = Y0 + 6*DY + 22
body.append(f'<text x="40" y="{yr}" class="res">(45)<tspan class="subi" dy="6">10</tspan><tspan dy="-6"> =</tspan></text>')
t0 = t_flecha + 1.4
for k in range(6):
    fila = 5 - k
    t = t0 + k*0.6
    h = aparece(f"h{k}", t, 0.25)
    d = aparece(f"d{k}", t, 0.25)
    y = Y0 + fila*DY
    body.insert(3, f'<rect x="316" y="{y-26}" width="46" height="38" rx="9" class="brillo {h}"/>')
    body.append(f'<text x="{164 + k*26}" y="{yr}" class="res dig {d}">{filas[fila][2]}</text>')
fin = aparece("fin", t0 + 6*0.6)
body.append(f'<text x="318" y="{yr}" class="res {fin}">)<tspan class="subi" dy="6">2</tspan></text>')
body.append(f'<text x="148" y="{yr}" class="res {fin}">(</text>')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img" aria-label="Conversión de 45 a binario por divisiones sucesivas entre 2: los restos leídos de abajo arriba dan 101101">
<style>
text{{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;fill:#13241c}}
.tit{{font-size:22px;font-weight:700;fill:#0d3a2b}} .sub{{font-size:15px;fill:#56645b}}
.cab{{font-size:12px;font-weight:700;letter-spacing:.08em;fill:#8a948d}}
.op{{font-size:19px}} .resto{{font-size:19px;font-weight:700;text-anchor:middle;fill:#0d3a2b}}
.caja{{fill:#eef5d6;stroke:#b3cf4c}} .brillo{{fill:#cbe56b}}
.flecha{{stroke:#cf3e3e;stroke-width:3;stroke-linecap:round}} .punta-f{{fill:#cf3e3e}}
.aviso{{font-size:15px;font-weight:650;fill:#cf3e3e}}
.res{{font-size:26px;font-weight:700;fill:#0d3a2b}} .dig{{fill:#1f7a4c}} .subi{{font-size:14px}}
{"".join(css)}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important}}}}
</style>
<rect width="600" height="400" fill="#fff"/>
{chr(10).join(body)}
</svg>
'''
open(sys.argv[1], 'w', encoding='utf-8').write(svg)
print(len(svg.encode()), 'bytes')
