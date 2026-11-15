// Integración con una interfaz existente (ES module).
// Servir outputs/ desde el mismo servidor o habilitar CORS para su origen.
export async function cargarTerreno(baseUrl = '/outputs/site04') {
  async function leer(archivo) {
    const response = await fetch(`${baseUrl}/${archivo}`);
    if (!response.ok) throw new Error(`${archivo}: HTTP ${response.status}`);
    return response.json();
  }
  const terreno = await leer('terrain.json');
  return {
    pendiente: terreno.slope_deg, // matriz; null = sin información
    limitesXY: terreno.bounds_xy_m,
    crsWkt: terreno.crs_wkt,
    resumen: terreno.summary,
    cargarPerfil: () => leer('profile.json'),
    cargarHorizonte: () => leer('horizon.json'),
    cargarCondiciones: () => leer('timeline.json'),
  };
}

export function colorPendiente(grados, umbral = 10) {
  if (grados === null || !Number.isFinite(grados)) return '#64748b';
  return grados <= umbral ? '#22c55e' : grados <= 20 ? '#f59e0b' : '#ef4444';
}

// Cliente de la API dinámica. El navegador consulta nuestro backend, no JPL.
export function crearClienteLunar(baseUrl = 'http://127.0.0.1:8891') {
  const base = baseUrl.replace(/\/$/, '');
  async function pedir(ruta, datos, signal) {
    const response = await fetch(`${base}/api/${ruta}`, {
      method: datos === undefined ? 'GET' : 'POST',
      headers: datos === undefined ? {} : { 'Content-Type': 'application/json' },
      body: datos === undefined ? undefined : JSON.stringify(datos),
      signal,
    });
    const resultado = await response.json();
    if (!response.ok) {
      const error = new Error(resultado.error || `HTTP ${response.status}`);
      error.code = resultado.code;
      error.status = response.status;
      throw error;
    }
    return resultado;
  }
  return {
    estado: (signal) => pedir('status', undefined, signal),
    terreno: (signal) => pedir('terrain', undefined, signal),
    sitio: (site, signal) => pedir('site', { site }, signal),
    perfil: (opciones, signal) => pedir('profile', opciones, signal),
    horizonte: (opciones, signal) => pedir('horizon', opciones, signal),
    condiciones: (opciones, signal) => pedir('conditions', opciones, signal),
  };
}

export function etiquetaVisibilidad(status) {
  return {
    blocked_sampled: 'Obstruido o sin el margen seleccionado',
    clear_within_sampled_radius: 'Despejado dentro del radio analizado',
    unknown: 'Información insuficiente',
    blocked: 'Trayectoria obstruida',
    clear_sampled: 'Trayectoria despejada en las muestras',
  }[status] || 'Estado desconocido';
}
