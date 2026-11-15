// Adaptación visual de Ventana de enlace; las ventanas se deciden con el DEM/NASA compartido.
(function(root){
 'use strict';
 function describe(c,powerW=0,storedWh=0){
  const sun=c.sstate==='clear'?'light':c.sstate==='blocked'?'shadow':'uncertain';
  const earth=c.estate==='clear'?'clear':c.estate==='blocked'?'blocked':'uncertain';
  const title=sun==='light'?'¡El panel tiene luz!':sun==='shadow'?'El Sol quedó oculto.':'El Sol está cerca del borde.';
  const text=sun==='light'?`El modelo estima ${Math.round(powerW)} W de generación. Revisá si alcanza para el consumo y si queda energía para guardar.`:sun==='shadow'?(storedWh>0?'La montaña o el horizonte oculta al Sol. Ahora usamos la energía guardada en la batería.':'No hay generación solar confirmada y el balance agotó la batería. En energía podremos ajustar el plan.'):'El Sol está dentro del margen del horizonte. No podemos asegurar luz ni sombra: el balance no cuenta generación en esta muestra.';
  return{sun,earth,title,text,key:sun+'|'+earth,earthText:earth==='clear'?'Hay una dirección despejada hacia la Tierra dentro del área analizada.':earth==='blocked'?'La Tierra quedó oculta por el horizonte: guardemos las fotos para una próxima ventana.':'La Tierra está cerca del horizonte. Todavía no confirmamos una ventana.'};
 }
 const markup=()=>`<section class="sky-gallery"><div class="sky-gallery-head"><div><span class="eyebrow">TRES MIRADAS, EL MISMO RELOJ</span><h2>¿Qué está pasando allá afuera?</h2><p>Mové el tiempo y cambiá de vista para descubrirlo.</p></div><span class="sky-gallery-time"></span></div><div class="sky-view-tabs" role="tablist" aria-label="Vistas de la misión"><button type="button" role="tab" id="skyTabSurface" aria-controls="skySurfacePanel" aria-selected="true" data-sky-view="surface">🐾 Desde el rover</button><button type="button" role="tab" id="skyTabOrbit" aria-controls="skyOrbitPanel" aria-selected="false" tabindex="-1" data-sky-view="orbit">◎ Desde arriba · órbitas</button><button type="button" role="tab" id="skyTabSide" aria-controls="skySidePanel" aria-selected="false" tabindex="-1" data-sky-view="side">◐ La Luna de perfil</button></div><div role="tabpanel" id="skySurfacePanel" aria-labelledby="skyTabSurface"><div class="sky-landscape"></div><div class="sky-story-caption" aria-live="polite"><h3></h3><p></p><p class="sky-earth-caption"></p></div><small class="sky-visual-note">Paisaje ilustrativo, sin escala. La Luna no tiene un cielo azul: el cielo permanece negro, incluso con luz solar. Las posiciones exactas están en el horizonte de abajo.</small></div><div role="tabpanel" id="skyOrbitPanel" aria-labelledby="skyTabOrbit" hidden><div class="sky-orbit-canvas"><canvas id="companionOrb" role="img" aria-label="Vista superior ilustrativa de la órbita de la Luna, la Tierra y la dirección del Sol"></canvas></div><p>La Luna recorre su órbita y cambia su relación con la Tierra y el Sol. El dibujo se mueve con la fecha del reloj; los tamaños y las distancias están exagerados para entenderlo.</p><small class="sky-visual-note">Vista orbital analítica aproximada del aporte original (Meeus), usada solo para esta ilustración. La luz, la batería y las ventanas usan NASA y el relieve real de nuestra misión.</small></div><div role="tabpanel" id="skySidePanel" aria-labelledby="skyTabSide" hidden><div class="sky-side-canvas"><canvas id="companionSide" role="img" aria-label="Perfiles ilustrativos de la Luna hacia la Tierra y hacia el Sol"></canvas></div><p>Desde el polo sur, el Sol y la Tierra pueden quedar muy cerca del horizonte. Un pequeño cambio de dirección o una montaña cambia lo que ve el rover.</p><small class="sky-visual-note">Perfil esquemático y balanceo aparente exagerado ×4. Coordenadas subsolar y subterrestre de NASA. Las etiquetas de visibilidad incluyen el relieve local; este perfil no dibuja cada montaña.</small></div></section>`;
 function landscape(c,story,power,stored){const lit=story.sun==='light',maybe=story.sun==='uncertain',ground=lit?'#b1b8bd':maybe?'#59616a':'#283647',highlight=lit?'#dfd2ad':'#617084';
  const sun=lit?'<circle cx="144" cy="72" r="27" fill="#ffe3a0"/><g stroke="#f9ca62" stroke-width="3"><path d="M144 31V19M144 113V125M103 72H91M185 72H197M115 43L106 34M173 101L182 110M173 43L182 34M115 101L106 110"/></g>':`<circle cx="144" cy="184" r="24" fill="#f2c363" opacity="${maybe?.45:.17}" stroke="#f2c363" stroke-dasharray="4 4"/>`;
  const earth=story.earth==='clear'?'<g><circle cx="566" cy="69" r="25" fill="#4eadd9"/><path d="M549 49L568 48 580 63 565 68 572 83 555 88 547 69" fill="#a8d8a7"/></g>':`<circle cx="566" cy="183" r="22" fill="#427d9f" opacity=".3" stroke="#8acbd9" stroke-dasharray="4 4"/>`;
  const radios=story.earth==='clear'?'<path d="M425 213L545 87" stroke="#5bdeed" stroke-width="3" stroke-dasharray="7 7"/>':'<path d="M425 213L490 145" stroke="#ddbc7c" stroke-width="2" stroke-dasharray="6 6"/><path d="M480 140L494 154M494 140L480 154" stroke="#ddbc7c" stroke-width="3"/>';
  return `<svg viewBox="0 0 720 340" role="img" aria-label="${story.title} ${story.earthText}"><rect width="720" height="340" rx="18" fill="#060c18"/><g fill="#d8e8ef" opacity=".55"><circle cx="52" cy="28" r="1.3"/><circle cx="280" cy="40" r="1"/><circle cx="345" cy="22" r="1.7"/><circle cx="650" cy="33" r="1"/><circle cx="450" cy="90" r="1.1"/><circle cx="68" cy="114" r="1"/><circle cx="610" cy="115" r="1.4"/></g>${sun}${earth}<path d="M0 230L74 194 145 146 214 218 294 190 373 239 484 141 570 216 648 178 720 205V340H0Z" fill="${ground}"/><path d="M0 270Q210 218 360 263T720 249V340H0Z" fill="${lit?'#8c969e':'#1b2939'}"/><path d="M74 194L145 146 168 183 155 172 127 185Z" fill="${highlight}"/><ellipse cx="103" cy="290" rx="30" ry="7" fill="#07111c55"/><ellipse cx="604" cy="269" rx="38" ry="9" fill="#07111c55"/>${lit?'<path d="M167 95L359 230" stroke="#ffe093" stroke-width="3" stroke-dasharray="9 7" opacity=".8"/>':''}${radios}<g><path d="M318 252L335 228H410L434 252Z" fill="#a5cfd8" stroke="#ecf9fb" stroke-width="1.5"/><rect x="332" y="248" width="91" height="22" rx="7" fill="#6a9bab"/><g fill="#172534" stroke="#b9d1d7" stroke-width="3">${[333,351,369,387,405,423].map(x=>`<circle cx="${x}" cy="276" r="8"/>`).join('')}</g><path d="M359 226L370 197H409L400 226Z" fill="${lit?'#287fa6':'#234052'}" stroke="#a0d8ed" stroke-width="2"/><path d="M372 205H406M368 215H403M384 198L374 226M397 198L389 226" stroke="#90c3d5"/><path d="M420 230V207L431 199" stroke="#d0ebee" stroke-width="3"/><circle cx="433" cy="197" r="5" fill="#77e0d2"/></g><g font-family="system-ui,sans-serif" font-size="14" fill="#e6eef6"><text x="45" y="139">${lit?'☼ Sol visible':maybe?'☼ Luz por confirmar':'☼ Sol oculto'}</text><text x="490" y="118">${story.earth==='clear'?'◎ Tierra visible':story.earth==='blocked'?'◎ Tierra oculta':'◎ Tierra por confirmar'}</text></g><rect x="25" y="303" width="670" height="27" rx="10" fill="#071322bb"/><text x="40" y="322" fill="#d4eee1" font-family="system-ui,sans-serif" font-size="12">Panel: ${Math.round(power)} W · batería: ${Math.round(stored)} Wh · ${lit?'la luz llega al panel':maybe?'luz sin confirmar en el margen del horizonte':'sin generación solar confirmada'}</text></svg>`;
 }
 function create(box){let last=null,lastKey=null,currentView=null;const $=id=>document.getElementById(id),ASTRO=root.CompanionOrbitAstro;
 const fmt=(x,d=1)=>x.toFixed(d).replace('.',',').replace('-','−');
 function prep(c){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,r.width,r.height);return[g,r.width,r.height];}
 function drawPhase(g, x, y, r, k, ang, lit, dark){
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = dark; g.beginPath(); g.arc(0,0,r,0,Math.PI*2); g.fill();
  if (k > 0.002){
    g.fillStyle = lit; g.beginPath(); g.arc(0,0,r,-Math.PI/2,Math.PI/2,false);
    const rx = Math.abs(2*k-1)*r;
    if (k >= 0.5) g.ellipse(0,0,rx,r,0,Math.PI/2,3*Math.PI/2,false);
    else g.ellipse(0,0,rx,r,0,Math.PI/2,-Math.PI/2,true);
    g.fill();
  }
  g.restore();
}

function drawOrb(x){
  const [g, W, H] = prep($('companionOrb')); const cx = W/2, cy = H/2 + 6, R = Math.min(W, H) * 0.32;
  const st = x.st, ls = st.sun.lam * Math.PI/180, lm = st.moon.lam * Math.PI/180;
  // dirección del Sol
  const sx = cx + Math.cos(ls) * Math.min(W*0.46, H*0.40), sy = cy - Math.sin(ls) * Math.min(W*0.46, H*0.40);
  const grd = g.createRadialGradient(sx,sy,0,sx,sy,22); grd.addColorStop(0,'#fff3c4'); grd.addColorStop(.4,'#ffc43d'); grd.addColorStop(1,'rgba(255,196,61,0)');
  g.fillStyle = grd; g.beginPath(); g.arc(sx,sy,22,0,7); g.fill();
  g.fillStyle = '#ffc43d'; g.font = '11px IBM Plex Sans, sans-serif'; g.textAlign = 'center'; g.fillText('al Sol', sx, sy + (sy > cy ? 32 : -26));
  // línea de nodos
  const Om = (125.0445479 - 1934.1362891 * st.T) * Math.PI/180;
  g.setLineDash([3,4]); g.strokeStyle = '#3a4258'; g.beginPath();
  g.moveTo(cx - Math.cos(Om)*R*1.25, cy + Math.sin(Om)*R*1.25); g.lineTo(cx + Math.cos(Om)*R*1.25, cy - Math.sin(Om)*R*1.25); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#5c6580'; g.font = '10px IBM Plex Sans, sans-serif';
  g.fillText('nodo ☊', cx + Math.cos(Om)*R*1.32, cy - Math.sin(Om)*R*1.32 + 3);
  // órbita
  g.strokeStyle = '#2e3548'; g.lineWidth = 1; g.beginPath(); g.arc(cx,cy,R,0,7); g.stroke();
  // trayectoria de la misión
  // Tierra
  const dirS = Math.atan2(-(sy-cy), sx-cx);
  drawPhase(g, cx, cy, 13, 0.5, -dirS, '#4da3ff', '#0d2747');
  g.fillStyle = '#9aa3b8'; g.font = '11px IBM Plex Sans, sans-serif'; g.fillText('Tierra', cx, cy + 28);
  // Luna
  const mx = cx + Math.cos(lm)*R, my = cy - Math.sin(lm)*R;
  drawPhase(g, mx, my, 8, 0.5, -dirS, '#d9dbe2', '#2a2e3a');
  const above = st.moon.bet >= 0;
  g.fillStyle = above ? '#c9d2ff' : '#ffb39f'; g.font = '10.5px IBM Plex Mono, monospace';
  g.fillText((above ? '▲ ' : '▼ ') + fmt(Math.abs(st.moon.bet)) + '°', mx, my - 14);
  g.fillStyle = '#9aa3b8'; g.font = '11px IBM Plex Sans, sans-serif'; g.fillText('Luna', mx, my + 22);
  // leyenda
  g.textAlign = 'left'; g.fillStyle = '#8a91a6'; g.font = '11px IBM Plex Sans, sans-serif';
  const k = (1 - Math.cos(st.elong*Math.PI/180)) / 2;
  g.fillText(`Elongación ${fmt(st.elong,0)}° · ${phaseName(st.elong)}`, 10, 18);
  g.fillText(`Luna ${above ? 'sobre' : 'bajo'} la eclíptica (β ${fmt(st.moon.bet)}°)`, 10, 34);
  g.fillText('☊ = donde la órbita cruza la eclíptica', 10, H - 10);
}
function phaseName(e){ if (e < 12 || e > 348) return 'luna nueva'; if (e < 80) return 'creciente'; if (e < 100) return 'cuarto creciente';
  if (e < 168) return 'gibosa creciente'; if (e < 192) return 'luna llena'; if (e < 260) return 'gibosa menguante'; if (e < 280) return 'cuarto menguante'; return 'menguante'; }

function drawMoonTilt(g, cx, cy, r, b, label, color, el, body){
  const EX = 4, t = b * EX * Math.PI/180;
  g.fillStyle = '#1c2030'; g.strokeStyle = '#3a4258'; g.beginPath(); g.arc(cx,cy,r,0,7); g.fill(); g.stroke();
  // eje (norte en ángulo 90°+b·EX medido desde +x hacia arriba; la dirección del cuerpo está a la izquierda)
  const nx = Math.cos(Math.PI/2 + t), ny = -Math.sin(Math.PI/2 + t);
  g.strokeStyle = '#8a91a6'; g.setLineDash([4,3]); g.beginPath(); g.moveTo(cx - nx*r*1.35, cy - ny*r*1.35); g.lineTo(cx + nx*r*1.35, cy + ny*r*1.35); g.stroke(); g.setLineDash([]);
  // ecuador
  g.strokeStyle = '#2e3548'; g.beginPath(); g.moveTo(cx - ny*r, cy + nx*r); g.lineTo(cx + ny*r, cy - nx*r); g.stroke();
  g.fillStyle = '#8a91a6'; g.font = '10px IBM Plex Sans, sans-serif'; g.textAlign = 'center';
  g.fillText('N', cx + nx*r*1.5, cy + ny*r*1.5 + 3);
  // polo sur y base
  const px = cx - nx*r, py = cy - ny*r;
  // plano del horizonte (tangente)
  g.strokeStyle = '#6b7390'; g.beginPath(); g.moveTo(px - ny*44, py + nx*44); g.lineTo(px + ny*44, py - nx*44); g.stroke();
  g.fillStyle = '#8ce0b0'; g.beginPath(); g.arc(px,py,3.5,0,7); g.fill();
  g.fillStyle = '#c7f1d9'; g.fillText('base', px + 18, py + 14);
  // rayo al cuerpo (hacia la izquierda)
  const vis = body === 'Tierra' ? currentView.ev : currentView.sv;
  g.strokeStyle = vis ? color : '#5a3030'; g.lineWidth = 1.6; g.setLineDash(vis ? [] : [4,4]);
  g.beginPath(); g.moveTo(px, py); g.lineTo(px - r*1.6, py); g.stroke(); g.setLineDash([]); g.lineWidth = 1;
  g.fillStyle = color; g.beginPath(); g.arc(px - r*1.6 - 7, py, 6, 0, 7); g.fill();
  g.textAlign = 'center'; g.fillStyle = '#e7e9ef'; g.font = '11.5px IBM Plex Sans, sans-serif';
  g.fillText(label, cx, cy - r - 26);
  g.font = '10.5px IBM Plex Mono, monospace'; g.fillStyle = vis ? color : '#ff9b9b';
  g.fillText(`${body} a ${fmt(el)}° ${vis ? '· ventana confirmada' : '· sin despeje confirmado'}`, cx, cy + r + 46);
  g.fillStyle = '#8a91a6'; g.fillText(`latitud sub-${body === 'Tierra' ? 'terrestre' : 'solar'} ${fmt(b)}°`, cx, cy + r + 62);
}
function drawSide(x){
  const [g, W, H] = prep($('companionSide')); const r = Math.min(W/7, H/4.2);
  drawMoonTilt(g, W*0.27, H*0.43, r, x.st.earthSub.b, 'Hacia la Tierra', '#4da3ff', x.E.el, 'Tierra');
  drawMoonTilt(g, W*0.75, H*0.43, r, x.st.sunSub.b, 'Hacia el Sol', '#ffc43d', x.S.el, 'Sol');
}


 function paint(){if(!last)return;const {sample:c,row,dateLabel,powerW,storedWh}=last,story=describe(c,powerW,storedWh);currentView=c;box.querySelector('.sky-gallery-time').textContent=dateLabel;box.querySelector('.sky-landscape').innerHTML=landscape(c,story,powerW,storedWh);box.querySelector('.sky-story-caption h3').textContent=story.title;box.querySelector('.sky-story-caption>p').textContent=story.text;box.querySelector('.sky-earth-caption').textContent=story.earthText;
  const st=ASTRO.state(new Date(last.iso));st.earthSub={l:row.subearth.lon,b:row.subearth.lat};st.sunSub={l:row.subsolar.lon,b:row.subsolar.lat};const x={st,E:c.earth,S:c.sun};
  if(!box.querySelector('#skyOrbitPanel').hidden)drawOrb(x);if(!box.querySelector('#skySidePanel').hidden)drawSide(x);
  return story;
 }
 const tabs=[...box.querySelectorAll('[role=tab]')];function activate(tab){for(const b of tabs){const active=b===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;document.getElementById(b.getAttribute('aria-controls')).hidden=!active;}paint();}
 tabs.forEach((b,i)=>{b.onclick=()=>activate(b);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;activate(tabs[n]);tabs[n].focus();};});
 const resize=new ResizeObserver(()=>paint());resize.observe(box);
 return{update(data){last=data;const story=paint(),changed=lastKey!==null&&lastKey!==story.key;lastKey=story.key;return{...story,changed};},dispose(){resize.disconnect();}};
 }
 const api={markup,create,describe};root.CompanionSkyViews=api;if(typeof module!=='undefined'&&module.exports)module.exports={describe};
})(typeof window==='undefined'?globalThis:window);
