# Los Lunares · misión didáctica y laboratorio

Abrir con iniciar_dashboard.bat (Python 3). Luego http://127.0.0.1:8876. No abrir index.html directamente: los datos se leen por HTTP. La versión publicada no necesita Python ni un backend propio.

## Qué cambió
Juego y laboratorio comparten un único motor: sitio + fecha → elevación real → horizonte → Sol/Tierra → ventanas → energía. Tres ubicaciones de Site01 y coordenadas personalizadas dentro de la cobertura. El público recibe contexto y devolución con Félicette; los detalles técnicos quedan en el laboratorio y metodología.

Luna global 3D y relieve real local 3D: rotación, zoom, exageración vertical, capas de altura/pendiente, selección de punto y aplicación a la misión. Verde significa cumplir un criterio de pendiente, nunca un aterrizaje certificado. Los 24 sitios simulados del ZIP original fueron excluidos.

La comparación A/B informa diferencias de horas de luz/contacto y déficit eléctrico con parámetros equivalentes. Se indica la próxima pérdida o recuperación de ventana confirmada, aproximada al paso horario. Antena y panel tienen alturas independientes.

## Terreno y alcance
Origen: Site01_final_adj_5mpp_surf.tif entregado en site01_luna_proyecto.zip. DEM de 3200×3200 a 5 m, 16×16 km, estereográfica polar sur, esfera R=1.737.400 m. Metadatos y SHA-256 en assets/site01/metadata.json.

Se agregan bloques 4×4 a 20 m: altura media para geometría/observador, máxima para el horizonte y máxima pendiente nativa para colorear cada celda. Malla 3D visual ≈80 m. No hay relleno sintético. Horizonte radial cada 20 m y azimutal cada 2°, con radio de 1–3 km. Fuera de cobertura se rechaza la ubicación; no se convierten datos faltantes en visibilidad.

La categoría de pendiente no modela rocas ni rugosidad subpíxel. El muestreo no garantiza detectar todo obstáculo. No se propagan las incertidumbres por píxel: esos mapas no se suministraron. El margen angular es una hipótesis de diseño.

## Fechas y astronomía
NASA SVS 5415 (2025) y 5587 (2026), 17.520 registros horarios. Inicios de misión entre 01/01/2025 y 24/12/2026 para disponer de siete días completos. La fecha se confirma explícitamente. Se usan los puntos subsolar/subterrestre y la distancia Tierra–Luna en una geometría esférica con altura del terreno y del observador; sin refracción atmosférica. No es una consulta Horizons/SPICE a demanda.

La visibilidad confirmada está limitada al radio/muestreo del horizonte y al margen elegido. El relieve lejano puede bloquear una dirección que aquí lo supera. Los estados marginales se tratan conservadoramente como no confirmados. Los tiempos de cambio son aproximados a muestras de una hora; no resuelven disco solar ni eclipses.

## Energía y comunicación
Incidencia del panel, eficiencia, área, pérdidas supuestas y balance de batería. Irradiancia constante 1.361 W/m², sin temperatura, polvo, envejecimiento ni control térmico. Visibilidad geométrica no equivale a servicio de radio. El laboratorio RF adicional conserva un perfil de práctica o CSV propio; no debe confundirse con el cálculo Tierra–sitio.

## Validación
Informe descargable: Los_Lunares_Validacion_Modelo.json. Pruebas de proyección reversible, horizonte de una esfera plana contra cálculo analítico, cobertura, estados marginales, eventos censurados, tres puntos reales y balance energético. Contraste astronómico con 50 muestras JPL de dos ubicaciones: máxima diferencia observada <0,001°. Esto no constituye garantía global de precisión ni validación de vuelo.

## Feedback con personas
En el juego hay tres retos con respuestas y tiempos exportables. Todo queda en el navegador hasta descargar el archivo. No se envía a nadie. Los tiempos incluyen pausas y son autoinformados. El equipo todavía debe realizar las pruebas con participantes y documentar resultados.

## Fuentes y créditos
- LOLA: https://pgda.gsfc.nasa.gov/products/78
- NASA SVS: https://svs.gsfc.nasa.gov/5415/ y https://svs.gsfc.nasa.gov/5587/
- Contexto global LOLA: https://svs.gsfc.nasa.gov/4720/
- Referencia JPL: https://ssd.jpl.nasa.gov/horizons/manual.html
- Modelos Tierra y Sol de NASA; model-viewer 1.10.1 Apache 2.0.
- Three.js r128 y OrbitControls MIT, incluidos localmente con licencia.
- Textura Clementine de MoonDemo MIT.
- Catálogo histórico LROC 2016 como contexto; sus puntos fuera de Site01 no se evalúan con el DEM local.
- Félicette: personaje ficticio original generado con IA bajo dirección del equipo.
- Identidad Los Lunares y estilo adaptado del dashboard del equipo. Sin bases privadas ni credenciales del dashboard original.

No usar para navegación, operaciones ni certificación de aterrizaje.

## Cierres animados de Félicette (15/11/2026)
Se integraron los seis microcierres después de cada decisión y antes de avanzar. Se pueden omitir; también hay controles de reproducción y pausa. Con movimiento reducido no se reproducen automáticamente.

Al completar el plan se elige una de tres escenas: exploración, comunicación o revisión. La revisión aparece si falta energía, no hay ventana confirmada de Tierra, se pide tiempo real con cortes, se prioriza energía solar sin luz o la pendiente supera 10°. Las escenas son narrativas: los resultados calculados y advertencias permanecen visibles debajo. La animación no valida un aterrizaje ni un enlace de radio.

Recursos: videos entregados por el equipo en videos_finales.rar. El original final-comunicacion.mp4 tenía solo 48 bytes y no era reproducible; se regeneró desde el proyecto de animación incluido, conservando su diseño y sin texto incrustado. Se usa también el final de exploración sin texto. Se conservaron los archivos originales fuera de esta entrega.

Validación de esta entrega: nueve MP4 decodificados completos, H.264, sin audio, 1920×1080, 24 fps, fast start y menos de 4 MB cada uno. Portadas y huellas SHA-256 en dist/assets/videos/manifest.json. Comprobadas las reglas de selección y la reproducción/avance en navegador.


## Minijuego de terreno Site01
Se incorporó el entrenamiento de selección de cuadrantes con estética Los Lunares, datos reales y devolución de Félicette. Ver `MINIJUEGO_SITE01.md`. Los cierres en video se conservan.


### Juego actualizado: Descenso perfecto
El rescate combina dos partes: elegir una zona candidata y después completar el alunizaje del rover, con la estética de Los Lunares. Abrí `iniciar_dashboard.bat` para jugar dentro de la misión, o `iniciar_minijuego.bat` para practicar. Si tenés la página abierta, recargala con Ctrl+F5. La ayuda, los límites y la exportación local están en «Cómo jugar · Datos».
