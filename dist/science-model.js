// Adaptador puro: intervalos de efemérides al modelo energético existente.
export function energySeries(result) {
  if(result.samples.length<2)throw Error('Se necesitan al menos dos muestras temporales.');
  const rows=result.samples;
  const step=(Date.parse(rows[1].time_utc)-Date.parse(rows[0].time_utc))/3600000;
  if(!Number.isFinite(step)||step<=0)throw Error('Intervalo temporal inválido.');
  if(rows.some((row,i)=>i&&Math.abs((Date.parse(row.time_utc)-Date.parse(rows[i-1].time_utc))/3600000-step)>1e-6))throw Error('El modelo energético necesita pasos temporales uniformes.');
  // El punto final delimita el último intervalo: 25 muestras horarias => 24 horas.
  const intervals=rows.slice(0,-1);
  if(intervals.some(r=>r.sun.status==='unknown'))throw Error('Hay cobertura solar desconocida; no se estima generación.');
  return {stepHours:step, durationHours:step*intervals.length,
    samples:intervals.map(r=>({sun:{az:r.sun.azimuth_deg,el:r.sun.elevation_deg},sv:r.sun.status==='clear_within_sampled_radius'}))};
}
