# Site01 — Análisis de terreno lunar y grilla de sitios simulados

Proyecto para analizar el DEM LOLA de **Site01** (polo sur lunar, 16 × 16 km a 5 m/píxel), calcular la pendiente del terreno, extenderlo a una **grilla de 5 × 5 sitios de 16 km** con terreno simulado y verlo todo en una página 3D interactiva.

> **Importante:** solo el recuadro de Site01 (celda C3) es dato real. Los otros 24 sitios son terreno **sintético**: tiene la misma estadística que Site01, pero no representa la Luna real de esas zonas.

---

## Estructura

```
site01_luna/
├── README.md
├── requirements.txt
├── datos/
│   ├── entrada/
│   │   └── Site01_final_adj_5mpp_surf.tif        DEM original LOLA (5 m, 3200×3200)
│   └── salida/
│       ├── Site01_pendiente_grados.tif           pendiente de Site01 (°), misma grilla que el original
│       ├── Site01_grilla_80km_20m_SIMULADO.tif   grilla 80×80 km a 20 m (Site01 real + 24 sitios simulados)
│       ├── Site01_grilla_80km_20m_SIMULADO_mascara.tif   0 = simulado · 1 = real · 2 = borde mezclado
│       └── sitios_grilla_80km.csv                métricas de los 25 sitios
├── mapas/                                        mapas 2D (PNG) de Site01 y de la grilla
├── scripts/
│   ├── comun.py                                  rutas, paletas, constantes y funciones compartidas
│   ├── 01_inspeccionar_dem.py                    estructura interna del GeoTIFF y estadísticas
│   ├── 02_pendiente.py                           pendiente: arctan(√((∂z/∂x)² + (∂z/∂y)²))
│   ├── 03_mapas_site01.py                        elevación, elevación × pendiente, zonas planas
│   ├── 04_extender_grilla.py                     genera la grilla simulada de 80 km
│   ├── 05_sitios_y_mapas_grilla.py               métricas por sitio (CSV) y mapas de la grilla
│   └── 06_construir_web.py                       arma la página 3D
└── web/
    ├── template.html                             código de la página (HTML + JS con three.js)
    ├── site01_luna3d.html                        página final lista para abrir (datos incluidos)
    └── assets/moon_1024.jpg                      textura ilustrativa de la Luna
```

## Cómo correrlo

```bash
pip install -r requirements.txt
cd scripts
python 01_inspeccionar_dem.py
python 02_pendiente.py
python 03_mapas_site01.py
python 04_extender_grilla.py          # ~2–4 min; opcional: semilla → python 04_extender_grilla.py 123
python 05_sitios_y_mapas_grilla.py
python 06_construir_web.py
```

Después, abrí `web/site01_luna3d.html` en el navegador. Necesita conexión a internet, porque carga three.js desde un CDN.

Con la semilla por defecto (`20261114`) el resultado es idéntico al de la versión publicada. Si usás otra semilla, se genera otra grilla de sitios simulados.

---

## Datos y sistema de referencia

| | |
|---|---|
| Cuerpo | Luna, esfera de radio 1.737.400 m |
| Proyección | Estereográfica polar sur (latitud de origen −90°, meridiano central 0°, escala 1) |
| Site01 | X −19.000 a −3.000 m · Y −20.000 a −4.000 m · centro 89,46° S, 222,5° E · ~16 km del polo |
| Grilla | X −51.000 a 29.000 m · Y −52.000 a 28.000 m · 5 × 5 sitios de 16 km · 20 m/píxel |
| Celdas | Columnas A–E (oeste → este), filas 1–5 (norte → sur). Site01 = C3, el polo sur cae en D2 |
| Origen del DEM | Generado con GMT 5.4.5 (`xyz2grd`) a partir de puntos XYZ; no trae autor ni fecha en los metadatos |

## Métricas por sitio (`sitios_grilla_80km.csv`)

| Columna | Significado |
|---|---|
| `sitio`, `celda`, `tipo` | Nombre, celda de la grilla y si es real o simulado |
| `x0_m … y1_m` | Límites del sitio en metros (proyección polar) |
| `elev_media_m`, `elev_min_m`, `elev_max_m` | Elevación relativa al radio de referencia |
| `pend_mediana_deg` | Pendiente mediana a 20 m/píxel |
| `pct_menor_8deg`, `pct_menor_10deg` | % del sitio con pendiente < 8° y < 10° |
| `mayor_zona_plana_km2` | Mayor zona continua con pendiente < 8° (pendiente suavizada a 60 m) |
| `contiene_polo` | Si el polo sur cae dentro del sitio |

Los umbrales (8°, 10°, 800 m y 1.500 m) son puntos de partida y se cambian en `scripts/comun.py`.

## Cómo se simula el terreno (`04_extender_grilla.py`)

1. **Espectro de rugosidad**: se mide la potencia por escala del DEM real (40 m a 8 km). Para escalas mayores a 8 km Site01 no da información, así que se supone una caída con exponente 3.
2. **Superficie aleatoria**: se genera con ese espectro mediante síntesis por FFT.
3. **Cráteres**: la distribución de tamaños es N(>D) ∝ D⁻², entre 100 m y 18 km. Los perfiles son de cuenco con borde, con grados de degradación aleatorios.
4. **Calibración**: se escala la superficie para que la pendiente mediana coincida con la de Site01 (12,2°).
5. **Empalme**: el recuadro real se inserta con un corrimiento, una corrección armónica (Laplace) que elimina el escalón y una mezcla de 400 m en el borde.

**Validación** (pendiente a 20 m): la mediana da 12,2° en el real y 12,2° en el simulado. El área con menos de 10° es de 38 % en el real y 36–37 % en el simulado. El simulado tiene algo más de pendientes extremas (percentil 95: 25° contra 22°) y una textura fina un poco más granulada.

## Página 3D

- **Izquierda**: la Luna con la grilla ubicada en su posición real. Tiene vistas de Luna entera, polo sur, grilla y sitio, y casillas para mostrar u ocultar la grilla de coordenadas y los sitios simulados.
- **Derecha**: el relieve 3D del sitio elegido. Incluye un minimapa clicable de 5 × 5 coloreado por % del área con menos de 10°, una ficha de métricas, tres coloraciones (elevación, pendiente y elevación × pendiente) y control de exageración vertical. También tiene la vista general de 80 km y Site01 con el detalle original de 5 m.

## Créditos y licencias

- **DEM de Site01**: LOLA (Lunar Orbiter Laser Altimeter, NASA/GSFC). Los datos de NASA son de dominio público.
- **Textura de la Luna** (`web/assets/moon_1024.jpg`): tomada de los ejemplos del repositorio three.js (licencia MIT). Es solo una referencia visual de baja resolución y está deformada cerca del polo.
- **three.js r128**: licencia MIT, se carga desde cdnjs y jsDelivr.
- **Paleta de pendiente**: azul a naranja, apta para daltonismo.

## Normas de referencia

- ISO 19117:2012 (*Geographic information — Portrayal*): las reglas de color de este proyecto están separadas de los datos, en `comun.py`.
- IAU WGCCRE: coordenadas y forma de la Luna.
- FGDC-STD-013-2006 (capítulo 25) y el USGS Planetary Geologic Mapping Handbook (2022): simbología planetaria.
