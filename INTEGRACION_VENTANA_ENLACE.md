# Ventana de enlace integrada

La decisión 3 incorpora el recorrido temporal y la planificación por bloques del aporte del equipo, con la identidad visual de Los Lunares y Félicette.

- Misma fecha, ubicación y horizonte real que el laboratorio. Cobertura NASA 2025–2026, siete días completos.
- Recorrido del cielo con controles de tiempo, esquema Sol–Luna–Tierra y tablero de 28 bloques de seis horas. Pistas sin penalización y devolución por bloque.
- Un bloque compatible requiere las seis muestras horarias con Tierra visible y consumo cubierto. No se promedian elevaciones para afirmar contacto continuo.
- Batería y curva desde el balance horario compartido. En esta práctica seleccionar transmisiones no agrega consumo de radio: no hay potencia separada del transmisor ni estimación de GB. Los resultados de radio son compatibilidad geométrica, no servicio garantizado.
- No se reutilizan la batería de 60 kWh, el generador, las fechas 2027–2035 ni el horizonte plano del demo original. La fuente original se conserva en fuentes/ventana_enlace para trazabilidad; sus renderizadores y astronomía aproximada se usan solo en las vistas ilustrativas, como se detalla abajo.
- Las selecciones del tablero son práctica en memoria; no se envían a un servidor ni modifican las decisiones de energía del rover. El calendario sigue requiriendo confirmación explícita.

Origen: ventana_enlace_proyecto_seccion.zip aportado por el equipo. La adaptación conserva los conceptos interactivos; reemplaza el motor del demo por el motor común de Los Lunares.


## Vistas originales recuperadas y ayuda por etapa
- Se recuperaron los renderizadores de órbitas, fases y perfiles del aporte original. Se sincronizan con el mismo reloj de la decisión 3. El cálculo analítico original se usa solo para ilustrar la órbita; el perfil usa puntos subsolar/subterrestre NASA y las etiquetas de visibilidad usan el horizonte real del sitio.
- La escena del rover distingue luz confirmada, sombra y estado incierto. El cielo sigue negro en todas las condiciones, como corresponde a una Luna sin atmósfera significativa. El paisaje es ilustrativo; no representa el terreno medido. El horizonte cuantitativo sigue debajo.
- Panel y batería muestran la potencia y energía del balance horario existente; no se inventa carga ni consumo de radio adicional. Tierra visible/oculta cambia el camino de comunicación de la escena.
- Una pestaña superior abre las instrucciones específicas de cada una de las seis etapas. Se presenta al entrar por primera vez y puede reabrirse; no bloquea reintentos ni modifica las decisiones.
