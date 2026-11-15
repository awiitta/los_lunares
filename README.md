# Los Lunares

Web educativa de planificación de misiones lunares, con experiencia guiada, Félicette, minijuego de terreno y laboratorio técnico.

## Ver localmente
Desde esta carpeta: `python -m http.server 8876 --bind 127.0.0.1 --directory dist`.
Abrir http://127.0.0.1:8876. También se puede ejecutar `iniciar_dashboard.bat`.

## Publicar en Vercel desde GitHub
Importar este repositorio en Vercel. Usar la raíz del repositorio como Root Directory, Framework Preset **Other**, Output Directory **dist**, sin instalación ni compilación. El archivo `vercel.json` deja estos valores configurados. No se necesita ejecutar Python para publicar la web: los scripts Python son herramientas de preparación local.

## Contenido
- `dist/`: sitio y todos los recursos de ejecución. Debe estar en Git.
- `herramientas/`: preparación de terreno y plantillas del minijuego.
- `fuentes/`: material original para regenerar datos.
- `LEEME.md`, `MINIJUEGO_SITE01.md` y `FEEDBACK_RESCATES.md`: alcance, fuentes y cambios.
- `outputs/`: capturas y respaldos locales, excluidos de Git.

## Validación
`node test_minijuego.mjs` y `node test_rescates.cjs`.
Para las pruebas Python, instalar `herramientas/requirements-terreno.txt` en un entorno virtual y ejecutar `python -m unittest test_minijuego -v`.

Prototipo educativo. Los colores y cálculos no certifican un sitio de aterrizaje ni un enlace operativo de radio.
