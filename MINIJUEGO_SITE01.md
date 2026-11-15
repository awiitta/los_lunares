# Minijuego Site01 · Los Lunares

Integrado el 15/11/2026 en este proyecto. Abrí `iniciar_dashboard.bat` para jugar dentro de la misión o `iniciar_minijuego.bat` para probar el entrenamiento de manera independiente.

## Qué se agregó
- `dist/minijuego/`: interfaz, mapas reales, métricas y juego de selección.
- `dist/minijuego/mission-challenge.js`: integración aditiva; no reemplaza el motor de la misión ni el de videos.
- Cuatro ventanas del DEM original Site01, cada una de 400 × 400 m, con 16 cuadrantes de 100 × 100 m. Resolución fuente: 5 m/píxel.
- Al tomar una decisión que recibe una advertencia de Félicette, continuar abre el entrenamiento. Se puede volver a revisar la elección original. Para continuar con esa elección se completa un ejercicio.
- Resolver exige al menos una zona candidata seleccionada y ninguna selección que incumpla la regla. No es necesario marcar todas las candidatas. Los cuatro sectores rotan.
- Al completar, se vuelve a la misión sin borrar decisiones y los microvideos conservan su funcionamiento.
- El visor 3D de los compañeros se conserva, con estética adaptada, y usa las librerías locales del dashboard.

## Regla y límites
Se calcula la pendiente con la fórmula del proyecto y diferencias centrales a resolución nativa, con corrección de escala de la proyección. Una celda es candidata del ejercicio cuando al menos el 80% de sus píxeles tiene pendiente <8° y el relieve P95–P5 de altura es ≤20 m. Se exige 99% de datos válidos. Son parámetros didácticos, no requisitos certificados de un rover.

El relieve P95–P5 NO es profundidad de cráter. Una altura negativa no implica un peligro. No se identifican automáticamente cráteres, rocas o rugosidad a escala del aterrizador. Candidato no significa seguro ni apto para vuelo.

Del demo original 5 × 5, solo C3 contiene Site01 real; los otros 24 sitios son simulados. El juego usa únicamente recortes interiores del DEM real. Su grilla A–D / 1–4 es local a cada ventana; no es la grilla 5 × 5 original.

## Aportes y consentimiento
Las elecciones solo se guardan si la persona marca la casilla de consentimiento. Se almacenan en su navegador y se exportan a JSON para compartir voluntariamente con el equipo; no hay servidor receptor ni envío a NASA. Incluyen hash del DEM, coordenadas, sector, intento y marca de asistencia. Se registran antes de mostrar la devolución.

La interfaz permite inspeccionar las métricas al elegir, de modo que los registros son entrenamiento asistido y autocorregido. No equivalen a una revisión humana independiente. Los cuadrantes no marcados NO deben interpretarse como votos negativos. Para un conjunto científico de anotaciones hacen falta un protocolo distinto, duplicación de revisores, control de calidad, manejo de incertidumbre y un canal de colaboración acordado. No se presenta como contribución oficial a NASA.

## Mantener el proyecto
Las plantillas editables están en `herramientas/plantilla_minijuego/`. Si modificás la interfaz compilada, trasladá esos cambios a las plantillas antes de regenerar.
El DEM y el visor originales están en `fuentes/site01_luna/`. La fuente y créditos del proyecto recibido se conservan en esa carpeta.

Para regenerar: instalar las librerías de `herramientas/requirements-terreno.txt` en un entorno Python y ejecutar `python herramientas/preparar_minijuego.py` desde la raíz del proyecto. Después, `python herramientas/instalar_minijuego.py dist` confirma la inclusión del módulo en el HTML.

Para verificar: `python -m unittest test_minijuego -v` y `node test_minijuego.mjs`.

## Verificación realizada
- Cuatro pruebas Python y las comprobaciones JavaScript del criterio, selección y trazabilidad pasaron.
- Se comprobó una selección que necesita revisión, una candidata, la devolución, el consentimiento y el conteo de registros.
- Se comprobó el flujo de la carpeta correcta: decisión con advertencia → minijuego → candidato → regreso → microvideo original.
- Los nueve MP4 existentes permanecen sin cambios; sus hashes están en `VALIDACION_MINIJUEGO.json`.
- La publicación no se actualizó: el conector Sites no pudo iniciar su conexión. El código está listo y probado en este proyecto local.


## Ventana compacta
El rescate se abre sobre las elecciones de la misión. El mapa, la revisión y el regreso quedan en la misma ventana, sin desplazar la página. En celulares el mapa conserva sus proporciones. Los criterios, el consentimiento y la exportación siguen disponibles en «Datos y aportes». La práctica independiente conserva su presentación completa.


## Juego recibido: Descenso perfecto
La ventana de rescate combina selección de zonas y `dist/minijuego/descenso.html`, adaptado del aporte del equipo. La fuente vigente se conserva en `fuentes/descenso-v4-original/site01_luna3d.html`. Los datos, física, puntuación y cortes provienen de ese juego.

La misión usa únicamente Site01 real. Girar, controlar el motor y alunizar dentro de los límites completa el rescate y habilita el regreso a la elección original. La selección de cuadrantes es el primer paso y el alunizaje del rover es el segundo.

Los registros del juego se guardan localmente con la clave `los-lunares-descenso-v1` y se pueden exportar desde «Cómo jugar · Datos». No se envían a NASA. La vista del juego usa cortes muestreados a 100 m y relieve exagerado ×2; no es un cálculo de seguridad operacional.

Verificación específica: `node test_descenso.mjs`.


## Rescate en dos pasos
La misión abre primero la selección de zonas y, al completar ese ejercicio, habilita Descenso perfecto. El agradecimiento y el regreso aparecen después de lograr el alunizaje. Ambas prácticas usan Site01, pero el corte del descenso no reproduce exactamente el cuadrante elegido. Se valida origen, ventana emisora, orden de etapas y final de descenso sobre sitio real.


## Actualización a versión 4
Integrado el juego de `site01_luna_proyecto (4).zip`: altímetro, palanca, objetivos, alarmas, sonido, cámara de seguimiento y repetición del contacto en tres fotogramas, con explicación final. Se conservan la paleta del dashboard, la ayuda, la exportación local y la conexión al rescate de dos pasos. Las explicaciones sobre energía y comunicación son estimaciones ilustrativas del juego; no sustituyen las ventanas temporales del dashboard.

Original recibido: `fuentes/descenso-v4-original/`. Versión integrada anterior: `fuentes/descenso-v3-integrado/`. Pruebas: `node test_descenso.mjs`, `node test_rescate_secuencia.mjs`, `node test_rescates.cjs`.
