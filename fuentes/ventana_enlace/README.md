# Ventana de enlace · Site01

Juego educativo para el navegador. El jugador opera una base lunar en Site01 (89,46° S, 222,5° E, a ~16 km del polo sur) y planifica cuándo transmitir datos a la Tierra. Para eso tiene que entender cómo se combinan los movimientos del Sol, la Tierra y la Luna en fechas reales.

Para jugar, abrí `dist/ventana_enlace.html` en cualquier navegador. Es un único archivo, funciona sin conexión y no necesita servidor (con conexión carga además la tipografía IBM Plex).

## Estructura

```
ventana_enlace/
├── README.md
├── build.py                  # arma dist/ a partir de src/
├── dist/
│   └── ventana_enlace.html   # el juego listo para abrir o publicar
├── src/
│   ├── template.html         # interfaz, lógica del juego y misiones
│   └── astro.js              # motor astronómico (Meeus)
└── herramientas/
    ├── test_astro.js         # verifica el motor contra los ejemplos de Meeus
    └── calibrar.js           # recorre misiones y mide visibilidad y energía
```

Para modificarlo, editá `src/` y corré `python3 build.py`. Las pruebas se corren con `node herramientas/test_astro.js` y `node herramientas/calibrar.js` (requieren Node.js).

## Cómo se juega

1. Mové la fecha (botones, barra o clic en la regla de fechas) y mirá el cielo desde la base: la Tierra tiene que estar arriba de la línea punteada de 0,5°. Fijate también si hay Sol.
2. Pintá en la fila **plan** los bloques de 6 h en los que querés transmitir. Para borrar, arrastrá sobre bloques ya pintados.
3. Apretá **Ejecutar misión**. La misión corre sola, dibuja la batería y explica cada bloque fallido.

**Ayudas:** el botón muestra en la línea de tiempo cuándo se ve la Tierra (franja azul) y cuándo hay Sol (franja amarilla). Si las usás, el máximo baja a ★★.

**Estrellas:** ★ cumplir el objetivo · ★ ningún bloque sin enlace · ★ batería siempre por encima del 20 %.

## Misiones

| Misión | Inicio | Días | Qué enseña |
|---|---|---|---|
| 1 · Verano polar | 01/12/2026 | 30 | Sol permanente: solo importa la libración en latitud |
| 2 · Se va el Sol | 10/01/2027 | 40 | El Sol se esconde: la energía empieza a mandar |
| 3 · Vuelve el Sol | 20/06/2027 | 45 | Arranca en noche polar: hay que guardar energía |
| Libre | elegible (2025–2035) | 30 | Cualquier fecha |

El objetivo de cada misión es el 90 % de los bloques que logra un planificador automático. Ese planificador transmite cada vez que ve la Tierra, siempre que la batería alcance para el resto de la misión.

Para agregar misiones, editá el arreglo `MISSIONS` en `src/template.html`.

## Modelo

**Astronomía** (`src/astro.js`)
- Luna: Meeus cap. 47, con los términos principales de longitud, latitud y distancia.
- Sol: Meeus cap. 25, versión de baja precisión.
- Puntos sub-terrestre y sub-solar: libración óptica, Meeus cap. 53, con inclinación del ecuador lunar I = 1,54242°. No incluye nutación ni libración física.
- Precisión: ~0,01° en la Luna y ~0,02° en la libración contra el ejemplo de Meeus. Ver `herramientas/test_astro.js`.
- Elevación y azimut locales: producto escalar entre la dirección del cuerpo y la vertical local del sitio, en coordenadas selenográficas.

**Ciclos que intervienen**
- Mes dracónico (27,21 d): libración en latitud. El polo sur se asoma a la Tierra y se esconde.
- Mes sinódico (29,53 d): el Sol da una vuelta completa al horizonte de la base.
- Año de eclipses (346,6 d): alterna el verano y la noche polar.
- Mes anomalístico (27,55 d): libración en longitud.

**Energía y enlace** (por bloque de 6 h, constante `P` en `src/template.html`)

| Parámetro | Valor |
|---|---|
| Batería | 60 kWh (arranca llena) |
| Panel solar | 1 kW × fracción visible del disco solar (6 kWh por bloque como máximo) |
| Generador de base | 0,1 kW (0,6 kWh por bloque) |
| Consumo de supervivencia | 0,125 kW (0,75 kWh por bloque) |
| Transmisor | 1,2 kW (7,2 kWh por bloque) |
| Enlace | Tierra ≥ 0,5° sobre el horizonte; 54 GB por bloque (~20 Mbps) |

Cada bloque se evalúa con el promedio de tres instantes dentro de las 6 h.

## Limitaciones

- **El horizonte es ideal (terreno plano).** El relieve real de Site01 todavía no tapa el cielo. Próxima fase: calcular el perfil de horizonte (elevación cada 1° de azimut) desde el DEM de la grilla de 80 km para cada uno de los 25 sitios y usar el minimapa de 5 × 5 como selector de niveles.
- Los valores de energía son ilustrativos y están calibrados para que el juego sea desafiante, no para un diseño de misión real.
- El récord y el plan se guardan en el navegador (localStorage) y no se comparten entre dispositivos.

## Créditos

- Algoritmos: Jean Meeus, *Astronomical Algorithms*, 2.ª ed. (1998), cap. 25, 47 y 53.
- Tipografía: IBM Plex Sans y Mono (SIL Open Font License), vía Google Fonts.
