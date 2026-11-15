import {sceneMarkup,drawScene,drawSiteMap} from './mission-scenes.js';
import { crearClienteLunar, etiquetaVisibilidad, colorPendiente } from './science-client.js';
import { energySeries } from './science-model.js';

const byId = id => document.getElementById(id);
const format = (n, digits = 1) => Number.isFinite(n) ? n.toFixed(digits) : 'Sin datos';
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const asset = file => `assets/science/${file}`;
const count = (result, body, status) => result.samples.filter(r => r[body].status === status).length;
const clear = (result, body) => count(result,body,'clear_within_sampled_radius');
let data, selected = 0, sampleIndex = 0, profileResult, publicBody = 'sun';

function panel(id, title, contents) {
  const section = document.createElement('section');
  section.id = id;
  section.className = 'panel science-panel';
  section.innerHTML = `<div class="panelhead"><div><span class="eyebrow">DATOS REALES · LOLA + JPL</span><h2>${title}</h2></div><span class="pill science-badge">CONSULTA GUARDADA</span></div>${contents}`;
  return section;
}

function mount() {
  byId('overview')?.prepend(panel('scienceOverview', 'Caso NASA de Shackleton', `
    <p>Explorá un cálculo real con terreno lunar. Este caso tiene sus propias coordenadas y fechas; los controles de práctica de 2025 conservan su carácter demostrativo.</p>
    <div class="science-case-picker"><label>Caso de referencia<select id="scienceCase"><option value="0">A · Punto de ejemplo · antena 2 m</option><option value="1">B · 500 m al este en la grilla · antena 20 m</option></select></label><button id="scienceDownload">↓ Descargar cálculo NASA</button></div>
    <div id="scienceFacts" class="science-facts"></div>
    <label>Recorrer muestras UTC <input id="scienceTime" type="range" min="0" max="24" value="0" step="1"></label>
    <p id="scienceTimeLabel" class="science-time"></p><div id="scienceNow" class="science-facts"></div>
    <svg id="scienceHorizonChart" viewBox="0 0 720 300" role="img" aria-label="Horizonte calculado con LOLA y posiciones Tierra y Sol"></svg>
    <div id="scienceTimeline" class="science-timeline"></div>
    <p id="scienceSource" class="footnote"></p>
    <details class="science-api"><summary>Recalcular con la API del equipo</summary><p>La consulta guardada funciona sin servidor. Para cambiar coordenadas, fecha o antena, conectá el backend Python. En la página pública se necesita un backend HTTPS accesible.</p>
    <div class="science-inputs"><label>URL de la API<input id="scienceApiUrl" type="url" placeholder="https://tu-backend.example"></label>
    <label>Longitud este (°)<input id="scienceLon" type="number" step="any"></label><label>Latitud (°)<input id="scienceLat" type="number" step="any"></label>
    <label>Antena sobre suelo (m)<input id="scienceAntenna" type="number" min="0" max="1000" step="1"></label>
    <label>Inicio UTC<input id="scienceStart" type="datetime-local" step="60"></label><label>Duración (horas)<input id="scienceHours" type="number" min="1" max="744" value="24"></label>
    <label>Paso temporal (min)<input id="scienceStep" type="number" min="1" max="1440" value="60"></label>
    <label>Radio del horizonte (km)<input id="scienceRadius" type="number" min="1" max="100" value="30"></label></div>
    <button id="scienceRecalculate" class="primary">Consultar Tierra y Sol</button><p id="scienceApiStatus" role="status"></p></details>
    <p class="footnote">Los puntos son ejemplos de cálculo, con pendientes pronunciadas; no son recomendaciones de alunizaje. Visibilidad geométrica no equivale a enlace de radio disponible.</p>`));

  byId('terrain')?.prepend(panel('scienceTerrain','Pendientes calculadas sobre LOLA', `
    <div class="science-two"><div><canvas id="scienceSlopeMap" width="640" height="420" aria-label="Mapa de pendientes reales de Site04, Shackleton"></canvas><div class="science-legend"><span>■ ≤ 10°</span><span>■ 10–20°</span><span>■ > 20°</span><span>■ Sin datos</span></div></div>
    <div><div class="formula">θ = atan √[(∂z/∂x)² + (∂z/∂y)²]</div><div id="scienceSlopeFacts" class="science-facts"></div><p>DEM de 16 × 16 km, 5 m/píxel. La previsualización está reducida; la pendiente se calculó primero a resolución nativa.</p><p class="footnote">Umbral de demostración: 10°. Un píxel bajo ese límite no garantiza un terreno seguro. NASA informa interpolación e incertidumbre en el DEM.</p></div></div>`));

  byId('link')?.prepend(panel('scienceLink','Perfil real rover ↔ base', `
    <p id="scienceProfileDescription">Dos puntos del DEM separados unos 500 m. Antenas A y B a 2 m sobre el suelo. Este gráfico conserva la geometría esférica exacta del backend.</p>
    <svg id="scienceProfileChart" viewBox="0 0 720 290" role="img" aria-label="Perfil LOLA real y línea entre dos antenas"></svg>
    <div id="scienceLinkFacts" class="science-facts"></div><p class="footnote">Despeje radial muestreado. No incluye zona de Fresnel ni pérdidas por obstrucción. Los controles RF de práctica que siguen no modifican este caso guardado.</p>
    <details class="science-api"><summary>Cambiar extremos con la API</summary><div class="science-inputs"><label>Longitud A<input id="scienceProfileALon" type="number" step="any"></label><label>Latitud A<input id="scienceProfileALat" type="number" step="any"></label><label>Longitud B<input id="scienceProfileBLon" type="number" step="any"></label><label>Latitud B<input id="scienceProfileBLat" type="number" step="any"></label><label>Antena A (m)<input id="scienceProfileHA" type="number" value="2" min="0" max="1000"></label><label>Antena B (m)<input id="scienceProfileHB" type="number" value="2" min="0" max="1000"></label></div><p>Usa la URL del backend configurada en Centro de misión → Caso NASA.</p><button id="scienceProfileCalculate">Calcular perfil LOLA</button><p id="scienceProfileStatus" role="status"></p></details>`));

  byId('compare')?.prepend(panel('scienceComparison','Comparación A/B con datos reales', `
    <p id="scienceComparisonExplanation">Dos puntos del mismo DEM y el mismo día: 14–15 de noviembre de 2026 UTC. Cambian la ubicación y la altura de antena; la comparación no aísla el efecto de una sola variable.</p>
    <div class="tablewrap"><table><thead><tr><th>Caso</th><th>Pendiente</th><th>Antena</th><th>Tierra despejada</th><th>Sol despejado</th><th>Cobertura</th></tr></thead><tbody id="scienceComparisonRows"></tbody></table></div>
    <p class="footnote">Conteos de muestras horarias, no horas de servicio. “Despejado” significa por encima del horizonte muestreado y con margen de 0,5°. No se elige automáticamente un ganador.</p>`));

  byId('energy')?.prepend(panel('scienceEnergy','La posición del Sol viene de JPL', `
    <div id="scienceSolarFacts" class="science-facts"></div><p>Estos ángulos alimentan el mismo modelo de orientación, panel y batería del laboratorio. Ajustá los parámetros energéticos de abajo para comparar su efecto sobre el caso NASA seleccionado en Centro de misión.</p>
    <div id="scienceEnergyBudget" class="science-facts"></div><p id="scienceEnergyPeriod" class="footnote"></p>
    <p class="footnote">Geometría de NASA y generación eléctrica estimada con los parámetros del laboratorio, irradiancia supuesta y estados solares muestreados. No se calcula temperatura. El Sol se trata como una dirección puntual; no se resuelven discos ni eclipses.</p>`));

  byId('sources')?.prepend(panel('scienceSources','Fuentes conectadas y alcance del caso NASA', `
    <ul><li><a href="https://pgda.gsfc.nasa.gov/products/78" target="_blank" rel="noopener">LOLA Site04</a>: elevaciones locales de 5 m/píxel, pendientes y perfil.</li>
    <li><a href="https://pgda.gsfc.nasa.gov/products/90" target="_blank" rel="noopener">LOLA regional</a>: relleno de 80 m/píxel fuera del detalle local.</li>
    <li><a href="https://ssd-api.jpl.nasa.gov/doc/horizons.html" target="_blank" rel="noopener">JPL Horizons</a>: direcciones aparentes sin refracción de Tierra y Sol, observador lunar mean-Earth.</li></ul>
    <p>El backend verifica el centro lunar, radio y marco de la respuesta. Altura enviada a JPL = elevación del terreno + antena, convertida a kilómetros. Las consultas públicas incluidas son archivos guardados, no telemetría en vivo.</p>
    <p>La API Python permite recalcular. Usa solicitudes secuenciales, caché y errores explícitos; los datos faltantes se muestran como desconocidos. El contacto técnico permanece fuera del frontend.</p>
    <p>MAE de pendientes frente al mapa oficial: 0,000217°. Pasaron 19 tests y la prueba del cliente JavaScript contra la API.</p><p class="footnote">El laboratorio de práctica y la misión guiada conservan sus escenarios demostrativos de 2025; los paneles “DATOS REALES · LOLA + JPL” identifican la nueva fuente. No se propagan aún las incertidumbres a las predicciones ni se corrigen automáticamente sesgos entre los productos.</p>`));

  const publicRoot=byId('publicMission');
  if(publicRoot){
    const card=panel('sciencePublic','Mirá el escenario con datos reales',`<p>Hay un rover, un relieve y dos direcciones importantes. Explorá el mapa y elegí el caso A o B para ver por qué la luz y las comunicaciones cambian.</p><div class="public-real-intro"><div><canvas id="sciencePublicMap" width="480" height="320" role="img" aria-label="Mapa real de pendientes LOLA de Shackleton con los casos A y B"></canvas><p class="game-small">Mapa LOLA · 16 × 16 km · norte de la grilla arriba. Verde ≤10°, naranja 10–20°, rojo >20°. Los puntos A/B están a unos 500 m; los símbolos se amplían para distinguirlos.</p></div><div class="public-case-cards"><button data-science-public="0" aria-pressed="true"><span class="case-letter">A</span><strong>Rover en el punto A</strong><span>Antena a 2 m · ver su cielo y su relieve.</span><b>Explorar este escenario →</b></button><button data-science-public="1" aria-pressed="false"><span class="case-letter">B</span><strong>Rover en el punto B</strong><span>Otro lugar cercano · antena a 20 m.</span><b>Comparar el escenario →</b></button><small>Cambian ubicación y altura: la comparación no aísla el efecto de una sola variable. No son sitios recomendados para alunizaje.</small></div></div><div id="sciencePublicScene">${sceneMarkup()}</div><div id="sciencePublicFacts"></div><p id="sciencePublicDate" class="footnote"></p><button id="scienceOpenLab">Ver el detalle en el laboratorio →</button>`);
    card.classList.add('science-public');publicRoot.append(card);
  }
}

function metric(title,value){return `<article><small>${escape(title)}</small><b>${escape(value)}</b></article>`;}
function chartAxes(points, ymin,ymax, xmax, labels){
  const x=v=>48+v/xmax*640, y=v=>250-(v-ymin)/(ymax-ymin)*220;
  let markup='';
  for(let i=0;i<=4;i++){const value=ymin+(ymax-ymin)*i/4;markup+=`<line x1="48" x2="688" y1="${y(value)}" y2="${y(value)}" class="grid"/><text x="2" y="${y(value)+4}">${format(value,0)}${labels}</text>`;}
  for(let i=0;i<=4;i++){const value=xmax*i/4;markup+=`<text x="${x(value)-10}" y="278">${format(value,0)}</text>`;}
  return {x,y,markup};
}
function drawHorizon(result,row){
  const h=result.horizon.horizon.filter(r=>Number.isFinite(r.elevation_deg));
  const vals=[...h.map(r=>r.elevation_deg),row.earth.elevation_deg,row.sun.elevation_deg];
  const min=Math.floor(Math.min(-5,...vals)-2), max=Math.ceil(Math.max(10,...vals)+2);
  const {x,y,markup}=chartAxes(h,min,max,360,'°');
  const last=h[0]?{...h[0],azimuth_deg:360}:null;
  let svg=markup+`<path d="M${[...h,...(last?[last]:[])].map(r=>`${x(r.azimuth_deg)} ${y(r.elevation_deg)}`).join(' L')}" fill="none" stroke="#8aa6c1" stroke-width="2"/>`;
  for(const [name,p,color]of [['Tierra',row.earth,'#22d3ee'],['Sol',row.sun,'#fbbf24']])svg+=`<circle cx="${x(p.azimuth_deg)}" cy="${y(p.elevation_deg)}" r="6" fill="${color}"/><text x="${Math.max(50,Math.min(570,x(p.azimuth_deg)+9))}" y="${y(p.elevation_deg)-10}">${name} ${format(p.elevation_deg)}°</text>`;
  byId('scienceHorizonChart').innerHTML=svg;
}
function drawProfile(result){
  byId('scienceProfileDescription').textContent=`Distancia ${format(result.distance_m.at(-1),0)} m. Antena A: ${format(result.antenna_a_m,0)} m; B: ${format(result.antenna_b_m,0)} m sobre el suelo. Geometría esférica del backend.`;
  const vals=[...result.terrain_elevation_m,...result.ray_elevation_m].filter(Number.isFinite);
  const {x,y,markup}=chartAxes([],Math.min(...vals)-8,Math.max(...vals)+8,result.distance_m.at(-1),' m');
  let svg=markup;
  for(const[key,color]of [['terrain_elevation_m','#8aa6c1'],['ray_elevation_m','#22d3ee']]){
    let path='',previous=false;
    result.distance_m.forEach((d,i)=>{const value=result[key][i];if(!Number.isFinite(value)){previous=false;return;}path+=`${previous?'L':'M'}${x(d)} ${y(value)} `;previous=true;});
    svg+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>`;
  }
  byId('scienceProfileChart').innerHTML=svg;
  const clearance=result.radial_clearance_m.filter(Number.isFinite);
  byId('scienceLinkFacts').innerHTML=metric('Distancia',`${format(result.distance_m.at(-1),0)} m`)+metric('Resultado',etiquetaVisibilidad(result.status))+metric('Despeje radial mínimo',`${format(Math.min(...clearance))} m`);
}
function drawSlope(terrain){
  const canvas=byId('scienceSlopeMap'),ctx=canvas.getContext('2d'),grid=terrain.slope_deg;
  grid.forEach((row,j)=>row.forEach((value,i)=>{ctx.fillStyle=colorPendiente(value);ctx.fillRect(i*canvas.width/row.length,j*canvas.height/grid.length,Math.ceil(canvas.width/row.length),Math.ceil(canvas.height/grid.length));}));
  const s=terrain.summary;
  byId('scienceSlopeFacts').innerHTML=metric('Celdas válidas',s.valid_pixels.toLocaleString('es-AR'))+metric('Pendiente media',`${format(s.mean_slope_deg)}°`)+metric('Píxeles ≤10°',`${format(s.fraction_of_valid_pixels_below_threshold*100)}%`);
}
function drawEnergy(){
  const root=byId('scienceEnergyBudget');
  if(!data||!root)return;
  const ids=['battery','batteryInitial','solarTracking','panelAzimuth','panelTilt','panelArea','panelEfficiency','panelLoss','load','chargeEfficiency'];
  if(!ids.every(byId)||typeof window.solarBudget!=='function'){root.textContent='El modelo energético se habilitará al cargar el laboratorio de paneles.';return;}
  try{
    const bounded=id=>{const e=byId(id),n=Number(e.value);if(e.value.trim()===''||!Number.isFinite(n))throw Error('Completá los parámetros energéticos.');return Math.max(e.min===''?-Infinity:Number(e.min),Math.min(e.max===''?Infinity:Number(e.max),n));};
    const temporal=energySeries(data.cases[selected]);
    const params={capacityWh:bounded('battery'),initialFraction:bounded('batteryInitial')/100,tracking:byId('solarTracking').value==='tracking',azimuth:bounded('panelAzimuth'),tilt:bounded('panelTilt'),areaM2:bounded('panelArea'),efficiency:bounded('panelEfficiency')/100,lossFraction:bounded('panelLoss')/100,irradiance:1361,stepHours:temporal.stepHours,loadW:bounded('load'),chargeEfficiency:bounded('chargeEfficiency')/100};
    const budget=window.solarBudget(temporal.samples,params);
    root.innerHTML=metric('Generación estimada',`${format(budget.generatedWh,0)} Wh`)+metric('Carga almacenada',`${format(budget.chargedWh,0)} Wh`)+metric('Batería final',`${format(budget.finalStoredWh,0)} Wh`)+metric('Demanda no cubierta',`${format(budget.unservedWh,0)} Wh`);
    byId('scienceEnergyPeriod').textContent=`Caso ${selected===0?'A':'B'} · ${temporal.durationHours} horas integradas por retención del valor inicial de cada intervalo. ${data.cases[selected].samples.length} muestras delimitan ${temporal.samples.length} intervalos. Irradiancia supuesta: 1361 W/m². No se resuelven transiciones entre muestras; resultados de diseño, no mediciones de potencia.`;
  }catch(error){root.textContent=error.message;byId('scienceEnergyPeriod').textContent='No se calculó un presupuesto energético con datos insuficientes.';}
}
function render(){
  const result=data.cases[selected],row=result.samples[Math.min(sampleIndex,result.samples.length-1)];
  byId('scienceOverview').querySelector('.science-badge').textContent=result.client_mode==='api'?'CONSULTA A LA API':'CONSULTA GUARDADA';
  byId('scienceFacts').innerHTML=metric('Elevación del terreno',`${format(result.site.elevation_m)} m`)+metric('Pendiente local',`${format(result.site.slope_deg)}°`)+metric('Antena',`${format(result.horizon.antenna_m,0)} m`)+metric('Cobertura hasta el radio',`${format(result.horizon.coverage_complete_fraction*100,0)}%`);
  byId('scienceTimeLabel').textContent=row.time_utc.replace('T',' ').replace('Z',' UTC');
  byId('scienceNow').innerHTML=metric('Tierra',etiquetaVisibilidad(row.earth.status))+metric('Sol',etiquetaVisibilidad(row.sun.status));
  byId('scienceSolarFacts').innerHTML=metric('Caso',selected===0?'A':'B')+metric('Azimut del Sol',`${format(row.sun.azimuth_deg)}°`)+metric('Elevación del Sol',`${format(row.sun.elevation_deg)}°`)+metric('Condición',etiquetaVisibilidad(row.sun.status));
  const colors={blocked_sampled:'#b87b36',clear_within_sampled_radius:'#22d3ee',unknown:'#64748b'};
  byId('scienceTimeline').innerHTML=['earth','sun'].map(body=>`<div><b>${body==='earth'?'Tierra':'Sol'}</b><span>${result.samples.map((r,i)=>`<button data-science-time="${i}" aria-label="${escape(r.time_utc)}: ${escape(etiquetaVisibilidad(r[body].status))}" title="${escape(r.time_utc)} · ${escape(etiquetaVisibilidad(r[body].status))}" style="background:${colors[r[body].status]}"></button>`).join('')}</span></div>`).join('');
  byId('scienceSource').textContent=`${result.source.provider} · generado ${result.source.earth_generated_at_utc} · ${result.samples.length} muestras · radio ${result.horizon.radius_m/1000} km · margen ${result.margin_deg}°. Azimut desde el norte lunar.`;
  byId('scienceComparisonRows').innerHTML=data.cases.map((r,i)=>`<tr><td>${String.fromCharCode(65+i)} · ${format(r.site.site_lon_lat[0],4)}°, ${format(r.site.site_lon_lat[1],4)}°</td><td>${format(r.site.slope_deg)}°</td><td>${r.horizon.antenna_m} m</td><td>${clear(r,'earth')} / ${r.samples.length}</td><td>${clear(r,'sun')} / ${r.samples.length}</td><td>${format(r.horizon.coverage_complete_fraction*100,0)}%</td></tr>`).join('');
  byId('scienceComparisonExplanation').textContent=data.cases.map((r,i)=>`${String.fromCharCode(65+i)}: ${r.samples[0].time_utc} → ${r.samples.at(-1).time_utc}, antena ${r.horizon.antenna_m} m`).join(' · ')+'. Si cambian varios parámetros, esta comparación no aísla el efecto de una sola variable.';
  drawHorizon(result,row);
  const publicRow=row;
  drawScene(byId('sciencePublicScene'),result,row,publicBody);
  drawSiteMap(byId('sciencePublicMap'),data.terrain,data.cases,selected,colorPendiente);
  document.querySelectorAll('[data-science-public]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.sciencePublic===selected)));
  if(byId('sciencePublicFacts'))byId('sciencePublicFacts').innerHTML=`<p><b>Punto ${selected===0?'A':'B'}:</b> el suelo tiene ${format(result.site.slope_deg)}° de inclinación. En esta muestra, ${publicRow.sun.status==='clear_within_sampled_radius'?'el Sol supera el horizonte analizado':'el Sol no tiene el despeje elegido sobre el terreno'}. ${publicRow.earth.status==='clear_within_sampled_radius'?'La Tierra supera ese horizonte.':'La dirección hacia la Tierra no está despejada con el margen elegido.'}</p><p>¿Qué nos enseña? Cambiar unos cientos de metros puede cambiar el relieve que tenemos enfrente. Elegir una antena más alta tampoco garantiza comunicación.</p>`;
  if(byId('sciencePublicDate'))byId('sciencePublicDate').textContent=`Muestra: ${publicRow.time_utc}. Es independiente del puntaje y las decisiones del juego de práctica.`;
  drawEnergy();
  window.dispatchEvent(new CustomEvent('lunar-science-sample',{detail:{site:result.site,row,horizon:result.horizon,source:result.source}}));
}
function fillInputs(){
  const r=data.cases[selected];
  byId('scienceLon').value=r.site.site_lon_lat[0];byId('scienceLat').value=r.site.site_lon_lat[1];
  byId('scienceAntenna').value=r.horizon.antenna_m;byId('scienceStart').value=r.samples[0].time_utc.slice(0,16);
  byId('scienceTime').max=r.samples.length-1;
  byId('scienceTime').value=sampleIndex;
}
function client(){
  const url=byId('scienceApiUrl').value.trim();
  if(!url)throw Error('Ingresá la URL del backend Python. La consulta guardada ya está disponible.');
  const parsed=new URL(url);
  if(parsed.protocol!=='https:' && !(parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))throw Error('Usá HTTPS o una API local en localhost.');
  if(location.protocol==='https:'&&parsed.protocol==='http:')throw Error('La página publicada necesita un backend HTTPS; usá el dashboard local para conectar la API HTTP local.');
  return crearClienteLunar(url);
}
function value(id){const text=byId(id).value.trim();if(!text||!Number.isFinite(Number(text)))throw Error('Completá los parámetros numéricos.');return Number(text);}
async function main(){
  mount();
  try{
    const files=['conditions-a.json','conditions-b.json','terrain.json','profile.json'];
    const loaded=await Promise.all(files.map(async file=>{const r=await fetch(asset(file));if(!r.ok)throw Error('No se pudo cargar '+file);return r.json();}));
    data={cases:loaded.slice(0,2),terrain:loaded[2]};profileResult=loaded[3];
    fillInputs();render();drawSlope(data.terrain);drawProfile(profileResult);
    const a=profileResult.a_lon_lat,b=profileResult.b_lon_lat;
    for(const[id,n]of [['scienceProfileALon',a[0]],['scienceProfileALat',a[1]],['scienceProfileBLon',b[0]],['scienceProfileBLat',b[1]]])byId(id).value=n;
    if(['localhost','127.0.0.1'].includes(location.hostname))byId('scienceApiUrl').value='http://127.0.0.1:8891';
    byId('scienceCase').onchange=()=>{selected=Number(byId('scienceCase').value);sampleIndex=0;byId('scienceTime').value=0;fillInputs();render();};
    byId('scienceTime').oninput=()=>{sampleIndex=Number(byId('scienceTime').value);render();};
    byId('scienceTimeline').onclick=e=>{const target=e.target.closest('[data-science-time]');if(target){sampleIndex=Number(target.dataset.scienceTime);byId('scienceTime').value=sampleIndex;render();}};
    document.querySelectorAll('[data-science-public]').forEach(button=>button.onclick=()=>{selected=Number(button.dataset.sciencePublic);sampleIndex=0;byId('scienceCase').value=selected;fillInputs();render();});
    byId('sciencePublicScene').querySelector('[data-scene-time]').oninput=e=>{sampleIndex=+e.target.value;byId('scienceTime').value=sampleIndex;render();};
    byId('sciencePublicScene').querySelectorAll('[data-scene-body]').forEach(b=>b.onclick=()=>{publicBody=b.dataset.sceneBody;render();});
    byId('scienceOpenLab')?.addEventListener('click',()=>{byId('enterTechnical')?.click();document.querySelector('[data-view="overview"]')?.click();byId('scienceOverview').scrollIntoView({behavior:'smooth'});});
    byId('scienceDownload').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data.cases[selected],null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='caso-nasa-shackleton.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    byId('scienceRecalculate').onclick=async()=>{
      const status=byId('scienceApiStatus'),button=byId('scienceRecalculate');button.disabled=true;status.textContent='Calculando relieve y consultando JPL…';
      try{const start=new Date(byId('scienceStart').value+'Z');if(!Number.isFinite(start.getTime()))throw Error('Elegí una fecha UTC válida.');const stop=new Date(start.getTime()+value('scienceHours')*3600000);
        const result=await client().condiciones({site:{lon:value('scienceLon'),lat:value('scienceLat')},antenna_m:value('scienceAntenna'),radius_m:value('scienceRadius')*1000,radial_step_m:20,azimuth_step_deg:2,start_utc:start.toISOString(),stop_utc:stop.toISOString(),step_minutes:value('scienceStep'),margin_deg:0.5});
        data.cases[selected]={...result,client_mode:'api'};byId('scienceCase').options[selected].textContent=`${selected===0?'A':'B'} · Consulta personalizada`;sampleIndex=0;byId('scienceTime').value=0;byId('scienceTime').max=result.samples.length-1;render();status.textContent='Consulta completa. Los resultados y su procedencia ya están actualizados.';
      }catch(error){status.textContent='No se actualizó: '+error.message;}finally{button.disabled=false;}
    };
    byId('scienceProfileCalculate').onclick=async()=>{const button=byId('scienceProfileCalculate'),status=byId('scienceProfileStatus');button.disabled=true;status.textContent='Calculando perfil…';try{profileResult=await client().perfil({a:{lon:value('scienceProfileALon'),lat:value('scienceProfileALat')},b:{lon:value('scienceProfileBLon'),lat:value('scienceProfileBLat')},antenna_a_m:value('scienceProfileHA'),antenna_b_m:value('scienceProfileHB'),step_m:5});drawProfile(profileResult);status.textContent='Perfil actualizado desde el backend.';}catch(error){status.textContent='No se actualizó: '+error.message;}finally{button.disabled=false;}};
    for(const id of ['battery','batteryInitial','solarTracking','panelAzimuth','panelTilt','panelArea','panelEfficiency','panelLoss','load','chargeEfficiency'])byId(id)?.addEventListener('input',drawEnergy);
    window.lunarScience={ready:true,getSnapshot:()=>data.cases[selected]};
  }catch(error){byId('scienceOverview').append(Object.assign(document.createElement('p'),{textContent:'Datos reales no disponibles: '+error.message}));window.lunarScience={ready:false,error:error.message};}
}
main();
