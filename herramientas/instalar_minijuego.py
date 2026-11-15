"""Agrega el minijuego a una copia local del dashboard sin cambiar su motor."""
import argparse
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[1]


def install(dist):
    dist=Path(dist).resolve()
    index=dist/"index.html"
    html=index.read_text(encoding="utf-8")
    if 'id="publicMission"' not in html or 'id="gameContent"' not in html:
        raise ValueError("La carpeta no contiene la misión guiada esperada")
    assert (dist/"minijuego/descenso.html").is_file(), "Generar primero el minijuego"
    html=index.read_text(encoding="utf-8")
    tag='<script src="minijuego/mission-challenge.js"></script>'
    if tag not in html:html=html.replace('</body>',tag+'</body>',1)
    # Entrada voluntaria además del disparador de una decisión con advertencia.
    if 'id="openTerrainTraining"' not in html:
        link='<p id="openTerrainTraining" class="game-small"><a href="minijuego/descenso.html" target="_blank" rel="noopener">✦ Jugar a Descenso perfecto con Félicette ↗</a> · Alunizaje sobre un corte de Site01; simulación educativa.</p>'
        html=html.replace('<div id="gameProgress"',link+'<div id="gameProgress"',1)
    index.write_text(html,encoding="utf-8")
    print(dist)


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('dist');install(parser.parse_args().dist)
