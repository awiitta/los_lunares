"""Arma dist/ventana_enlace.html: inserta src/astro.js dentro de src/template.html."""
from pathlib import Path
base = Path(__file__).parent
t = (base / 'src/template.html').read_text(encoding='utf-8')
a = (base / 'src/astro.js').read_text(encoding='utf-8').replace("if (typeof module !== 'undefined') module.exports = ASTRO;", '')
assert '/*ASTRO*/' in t
(base / 'dist').mkdir(exist_ok=True)
(base / 'dist/ventana_enlace.html').write_text(t.replace('/*ASTRO*/', a), encoding='utf-8')
print('OK → dist/ventana_enlace.html')
