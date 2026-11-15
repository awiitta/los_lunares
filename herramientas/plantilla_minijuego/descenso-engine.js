
(function(){
if(!window.THREE||!THREE.OrbitControls){document.getElementById('err').style.display='flex';return;}
const embedded=new URLSearchParams(location.search).get('embedded')==='1';
const D=window.SITE, R=1737400, DEG=Math.PI/180;
const fmt=(v,d=0)=>v.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});

// lat/lon -> xyz, misma convención que SphereGeometry (u=0 en lon -180)
function pos(lat,lon,r){const phi=(lon+180)*DEG, th=(90-lat)*DEG;
  return new THREE.Vector3(-r*Math.cos(phi)*Math.sin(th), r*Math.cos(th), r*Math.sin(phi)*Math.sin(th));}
// estereográfica polar sur inversa (esfera R, k0=1)
function inv(x,y){const rho=Math.hypot(x,y), c=2*Math.atan(rho/(2*R));
  return [-(90-c/DEG), Math.atan2(x,y)/DEG];}
const texLoader=new THREE.TextureLoader();
function tex(src){const t=texLoader.load(src);t.anisotropy=8;return t;}
const TEX={elev:tex(D.tex.elev),slope:tex(D.tex.slope),biv:tex(D.tex.biv)};
const GR=window.GRID;const TEXG={elev:tex(GR.tex.elev),slope:tex(GR.tex.slope),biv:tex(GR.tex.biv)};const GX0=-51000,GY1=28000;

function fit(renderer,camera,el){const r=el.getBoundingClientRect();
  renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();}
function place(tag,v,camera,el){const p=v.clone().project(camera);const r=el.getBoundingClientRect();
  if(p.z>1||p.z<-1){tag.style.display='none';return;}
  tag.style.display='block';tag.style.left=((p.x+1)/2*r.width)+'px';tag.style.top=((1-p.y)/2*r.height)+'px';}

/* ================= GLOBO ================= */
const gEl=document.getElementById('gStage'), gC=document.getElementById('cGlobe');
const gR=new THREE.WebGLRenderer({canvas:gC,antialias:true});gR.setPixelRatio(Math.min(2,devicePixelRatio));
const gS=new THREE.Scene(); gS.background=new THREE.Color(0x07080c);
const gCam=new THREE.PerspectiveCamera(38,1,0.0002,100);
gS.add(new THREE.AmbientLight(0xffffff,0.35));
const sun=new THREE.DirectionalLight(0xffffff,0.95); gCam.add(sun); sun.position.set(0.6,0.5,1); gS.add(gCam);
// estrellas
{const g=new THREE.BufferGeometry(),n=1500,a=new Float32Array(n*3);
 for(let i=0;i<n;i++){const v=new THREE.Vector3().randomDirection?new THREE.Vector3().randomDirection():new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();v.multiplyScalar(40+Math.random()*20);a.set([v.x,v.y,v.z],i*3);}
 g.setAttribute('position',new THREE.BufferAttribute(a,3));gS.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x8890a8,size:0.08})));}
const moon=new THREE.Mesh(new THREE.SphereGeometry(1,192,128),new THREE.MeshStandardMaterial({map:tex(D.moon),roughness:1,metalness:0}));
gS.add(moon);
// recuadros sobre la esfera (x,y en metros de la proyección estereográfica polar)
function patch(x0,x1,y1,y0,map,r,N){const g=new THREE.BufferGeometry(),P=[],U=[],I=[];
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=x0+(x1-x0)*i/N,y=y1-(y1-y0)*j/N,[la,lo]=inv(x,y);
   const v=pos(la,lo,r);P.push(v.x,v.y,v.z);U.push(i/N,1-j/N);}
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;I.push(a,c,b,b,c,d);}
 g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
 return new THREE.Mesh(g,new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));}
function outline(x0,x1,y1,y0,r,mat){const p=[],s=24;
 for(let i=0;i<s;i++)p.push([x0+(x1-x0)*i/s,y1]);for(let i=0;i<s;i++)p.push([x1,y1-(y1-y0)*i/s]);
 for(let i=0;i<s;i++)p.push([x1-(x1-x0)*i/s,y0]);for(let i=0;i<=s;i++)p.push([x0,y0+(y1-y0)*i/s]);
 const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.map(([x,y])=>{const[la,lo]=inv(x,y);return pos(la,lo,r);})),mat);
 if(mat.isLineDashedMaterial)l.computeLineDistances();return l;}
const extGroup=new THREE.Group();gS.add(extGroup);
const gExtPatch=patch(GX0,GX0+80000,GY1,GY1-80000,TEXG.elev,1.00008,80);extGroup.add(gExtPatch);
{const dm=new THREE.LineDashedMaterial({color:0xcfd5e6,dashSize:.0010,gapSize:.0007,transparent:true,opacity:.8});
 GR.sites.forEach(s=>{if(!s.real)extGroup.add(outline(s.x0,s.x0+16000,s.y1,s.y1-16000,1.00011,dm));});}
const gRealPatch=patch(-19000,-3000,-4000,-20000,TEX.elev,1.00012,40);gS.add(gRealPatch);
gS.add(outline(-19000,-3000,-4000,-20000,1.00015,new THREE.LineBasicMaterial({color:0xff5a3c})));
let gSel=null;const selMat=new THREE.LineBasicMaterial({color:0xffe14d});
function globeSelect(s){if(gSel){gS.remove(gSel);gSel.geometry.dispose();gSel=null;}
  if(s&&!s.real){gSel=outline(s.x0,s.x0+16000,s.y1,s.y1-16000,1.00017,selMat);gS.add(gSel);}}
const C=pos(D.center[0],D.center[1],1), Nrm=C.clone().normalize();
// anillo pulsante + aguja
const ringG=new THREE.RingGeometry(0.92,1,64);const ring=new THREE.Mesh(ringG,new THREE.MeshBasicMaterial({color:0xff5a3c,transparent:true,side:THREE.DoubleSide,depthTest:false}));
ring.position.copy(pos(D.center[0],D.center[1],1.0005));ring.lookAt(Nrm.clone().multiplyScalar(2));gS.add(ring);
const pin=new THREE.Line(new THREE.BufferGeometry().setFromPoints([C.clone().multiplyScalar(1.0002),C.clone().multiplyScalar(1.09)]),new THREE.LineBasicMaterial({color:0xff5a3c}));gS.add(pin);
// grilla lat/lon
const grid=new THREE.Group();gS.add(grid);
{const m=new THREE.LineBasicMaterial({color:0x5d6680,transparent:true,opacity:.55});
 for(let la=-80;la<=80;la+=20){const p=[];for(let lo=-180;lo<=180;lo+=3)p.push(pos(la,lo,1.0008));grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),m));}
 for(let la of [-89,-88,-85]){const p=[];for(let lo=-180;lo<=180;lo+=2)p.push(pos(la,lo,1.0003));grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineDashedMaterial({color:0x8d97b3,dashSize:.004,gapSize:.003})));grid.children.at(-1).computeLineDistances();}
 for(let lo=-180;lo<180;lo+=30){const p=[];for(let la=-90;la<=90;la+=2)p.push(pos(la,lo,1.0008));grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),m));}}
const poleV=pos(-90,0,1.0005);
const gCtl=new THREE.OrbitControls(gCam,gC);gCtl.enableDamping=true;gCtl.minDistance=1.004;gCtl.maxDistance=8;gCtl.rotateSpeed=0.5;gCtl.enablePan=false;
const PV=pos(-90,0,1),side=pos(0,-137.5,1).normalize();
const views={
  ext:{p:pos(D.center[0],D.center[1],1).multiplyScalar(1.09).add(side.clone().multiplyScalar(0.035)),t:pos(D.center[0],D.center[1],1)},
  whole:{p:pos(-35,-120,3.4),t:new THREE.Vector3()},
  pole:{p:pos(-58,-137.5,2.5),t:new THREE.Vector3()},
  site:{p:Nrm.clone().multiplyScalar(1.03).add(pos(0,-137.5,1).normalize().multiplyScalar(0.012)),t:C.clone()}};
let anim=null;
function go(k){const v=views[k];anim={t0:performance.now(),p0:gCam.position.clone(),q0:gCtl.target.clone(),p1:v.p.clone(),q1:v.t.clone()};
  gCtl.rotateSpeed=k==='site'?0.15:0.5;const near=k==='site'||k==='ext';gCtl.minDistance=near?0.006:1.05;gCtl.maxDistance=near?0.6:8;gCtl.rotateSpeed=near?0.15:0.5;gCtl.zoomSpeed=near?0.4:1;gCtl.zoomSpeed=k==='site'?0.4:1;
  ['bWhole','bPole','bExt','bSite'].forEach(id=>document.getElementById(id).classList.toggle('on',id==={whole:'bWhole',pole:'bPole',ext:'bExt',site:'bSite'}[k]));}
document.getElementById('bWhole').onclick=()=>go('whole');
document.getElementById('bPole').onclick=()=>go('pole');
document.getElementById('bSite').onclick=()=>go('site');
document.getElementById('bExt').onclick=()=>go('ext');
document.getElementById('cExt').onchange=e=>extGroup.visible=e.target.checked;
document.getElementById('cGrid').onchange=e=>grid.visible=e.target.checked;
gCam.position.copy(views.whole.p);gCam.up.set(0,1,0);
setTimeout(()=>go('pole'),700);setTimeout(()=>go('ext'),3600);
const tagSite=document.getElementById('tagSite'),tagPole=document.getElementById('tagPole');

/* ================= TERRENO ================= */
const tEl=document.getElementById('tStage'),tC=document.getElementById('cTerrain');
const tR=new THREE.WebGLRenderer({canvas:tC,antialias:true});tR.setPixelRatio(Math.min(2,devicePixelRatio));
const tS=new THREE.Scene();tS.background=new THREE.Color(0x07080c);
const tCam=new THREE.PerspectiveCamera(40,1,0.05,1000);
tS.add(new THREE.AmbientLight(0xffffff,0.55));const tl=new THREE.DirectionalLight(0xffffff,0.75);tl.position.set(-10,14,-6);tS.add(tl);
function dec(b64){const raw=atob(b64),u=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);return new Int16Array(u.buffer);}
const HG=dec(GR.h),NG=GR.n;              // 800x800 a 100 m, toda la grilla
const zmid=(GR.zmin+GR.zmax)/2;
const hG=(x,y)=>{const i=Math.round((GY1-y)/100-0.5),j=Math.round((x-GX0)/100-0.5);return HG[Math.min(NG-1,Math.max(0,i))*NG+Math.min(NG-1,Math.max(0,j))];};
function mkMesh(nv,sizeKm,map){const g=new THREE.PlaneGeometry(sizeKm,sizeKm,nv-1,nv-1);g.rotateX(-Math.PI/2);
  const mat=new THREE.MeshStandardMaterial({map,roughness:1,metalness:0,side:THREE.DoubleSide});const m=new THREE.Mesh(g,mat);tS.add(m);return m;}
// vistas: general (80 km, 200 m), sitio de la grilla (16 km, 100 m), Site01 detalle (16 km, 80 m de altura, textura 10 m)
const VG=mkMesh(400,80,TEXG.elev), VS=mkMesh(160,16,TEXG.elev), VD=mkMesh(D.n,16,TEX.elev);
const HD=dec(D.h);
const crop={};for(const k in GR.tex){const c=tex(GR.tex[k]);c.repeat.set(.2,.2);crop[k]=c;}
const extra=new THREE.Group();tS.add(extra);
const box=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x2e3548}));tS.add(box);
let cur={kind:'site',s:null}, ex=1.5, poleTop=null, poleLbl='Polo sur';
const toS=(x,y,cx,cy)=>[(x-cx)/1000,-(y-cy)/1000];
function drape(rect,cx,cy,col,lift,sampler){const[x0,x1,y1,y0]=rect,p=[],s=60;
  const P=(x,y)=>{const[a,b]=toS(x,y,cx,cy);p.push(new THREE.Vector3(a,(sampler(x,y)-zmid)/1000*ex+lift,b));};
  for(let i=0;i<s;i++)P(x0+(x1-x0)*i/s,y1);for(let i=0;i<s;i++)P(x1,y1-(y1-y0)*i/s);for(let i=0;i<s;i++)P(x1-(x1-x0)*i/s,y0);for(let i=0;i<=s;i++)P(x0,y0+(y1-y0)*i/s);
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:col}));}
function render3(){
  extra.clear();poleTop=null;[VG,VS,VD].forEach(m=>m.visible=false);
  const k=sel.value;let mesh,sizeKm,cx,cy,zlo;
  if(cur.kind==='all'){mesh=VG;sizeKm=80;cx=GX0+40000;cy=GY1-40000;zlo=GR.zmin;
    const p=mesh.geometry.attributes.position;for(let i=0;i<400;i++)for(let j=0;j<400;j++)p.setY(i*400+j,(HG[(2*i)*NG+2*j]-zmid)/1000*ex);
    mesh.material.map=TEXG[k];
    GR.sites.forEach(s=>{const r=[s.x0,s.x0+16000,s.y1,s.y1-16000];
      if(s.real)extra.add(drape(r,cx,cy,0xff5a3c,0.05*ex+0.05,hG));
      else if(cur.hl&&cur.hl===s)extra.add(drape(r,cx,cy,0xffe14d,0.05*ex+0.06,hG));
      else extra.add(drape(r,cx,cy,0x9aa3bd,0.05*ex+0.03,hG));});
  }else if(cur.kind==='detail'){mesh=VD;sizeKm=16;cx=-11000;cy=-12000;zlo=D.zmin;
    const p=mesh.geometry.attributes.position;for(let i=0;i<D.n*D.n;i++)p.setY(i,(HD[i]-zmid)/1000*ex);mesh.material.map=TEX[k];
  }else{const s=cur.s;mesh=VS;sizeKm=16;cx=s.x0+8000;cy=s.y1-8000;zlo=s.zmin;
    const p=mesh.geometry.attributes.position;for(let i=0;i<160;i++)for(let j=0;j<160;j++)p.setY(i*160+j,(HG[(s.r*160+i)*NG+s.c*160+j]-zmid)/1000*ex);
    const c=crop[k];c.offset.set(s.c*.2,1-(s.r+1)*.2);mesh.material.map=c;}
  mesh.visible=true;mesh.material.needsUpdate=true;mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();
  const h=sizeKm/2,yb=(zlo-zmid)/1000*ex-0.15*sizeKm/16;box.geometry.dispose();
  box.geometry=new THREE.BufferGeometry().setFromPoints([[-h,yb,-h],[h,yb,-h],[h,yb,h],[-h,yb,h],[-h,yb,-h]].map(a=>new THREE.Vector3(...a)));
  // polo sur: aguja si está dentro de la vista; si no, flecha hacia él
  const inside=Math.abs(cx)<=h*1000&&Math.abs(cy)<=h*1000;
  if(inside){const[px,pz]=toS(0,0,cx,cy),py=(hG(0,0)-zmid)/1000*ex;poleTop=new THREE.Vector3(px,py+3*sizeKm/16,pz);poleLbl='Polo sur';
    extra.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px,py,pz),poleTop]),new THREE.LineBasicMaterial({color:0xffffff})));}
  else{const d=Math.hypot(cx,cy),ux=-cx/d,uy=-cy/d,top=(Math.max(zlo,GR.zmax*0+zlo)-zmid)/1000*ex;
    const zmax=cur.kind==='detail'?D.zmax:cur.s.zmax,y=(zmax-zmid)/1000*ex+0.4;
    const a=new THREE.ArrowHelper(new THREE.Vector3(ux,0,-uy),new THREE.Vector3(ux*5.6,y,-uy*5.6),2.2,0xff5a3c,0.6,0.4);extra.add(a);
    poleTop=new THREE.Vector3(ux*8.6,y+0.3,-uy*8.6);poleLbl='→ polo sur (~'+fmt(d/1000)+' km)';}
  tagPoleT.textContent=poleLbl;
  leg.innerHTML=LEG(k);info.innerHTML=INFO();}
function INFO(){if(cur.kind==='all')return `<h3>Vista general · 80 × 80 km</h3>25 sitios de 16 km · Site01 al centro<br><span style="color:#ffb199">24 sitios simulados</span>`;
  const s=cur.kind==='detail'?GR.sites.find(q=>q.real):cur.s;
  const pill=s.real?'<span class="pill" style="background:#3a1a12;color:#ffb199;border:1px solid #ff5a3c">dato real</span>':'<span class="pill" style="background:#232838;color:#cfd5e6">simulado</span>';
  const rank=[...GR.sites].sort((a,b)=>b.p10-a.p10).indexOf(s)+1;
  return `<h3>${s.id}${pill}</h3><div class="k"><span>celda</span><b>${s.cell}${s.pole?' · polo sur':''}</b><span>elev. media</span><b>${fmt(s.zmean)} m</b><span>rango</span><b>${fmt(s.zmin)} a ${fmt(s.zmax)} m</b><span>pend. mediana</span><b>${fmt(s.smed,1)}°</b><span>área &lt; 8°</span><b>${fmt(s.p8,1)} %</b><span>área &lt; 10°</span><b>${fmt(s.p10,1)} %</b><span>mayor zona &lt; 8°</span><b>${fmt(s.flat,1)} km²</b><span>puesto (&lt; 10°)</span><b>${rank} de 25</b></div>${cur.kind==='detail'?'<div style="margin-top:5px">detalle con el DEM original de 5 m</div>':''}`;}
function LEG(k){const lo=cur.kind==='detail'?D.zmin:GR.zmin,hi=cur.kind==='detail'?D.zmax:GR.zmax;
 if(k==='elev')return `<b style="color:#e7e9ef">Elevación z (m)</b><div class="gr" style="background:linear-gradient(90deg,#3b0a5c,#7b2fbe,#3f6fd8,#2fb8c6,#7fd36b,#f2e14c,#f28c28,#d7191c,#7a0010)"></div><div class="row"><span>${fmt(lo)}</span><span>${fmt((lo+hi)/2)}</span><span>${fmt(hi)}</span></div><div style="margin-top:5px">${cur.kind==='detail'?'escala propia de Site01':'escala común a los 25 sitios'}</div>`;
 if(k==='slope')return `<b style="color:#e7e9ef">Pendiente (°)</b><div class="cls">${[['0–2','#08306b'],['2–5','#2171b5'],['5–8','#6baed6'],['8–10','#c6dbef'],['10–15','#fdd0a2'],['15–20','#fd8d3c'],['20–30','#d94801'],['>30','#7f2704']].map(([t,c])=>`<span><i class="sw" style="background:${c}"></i>${t}</span>`).join('')}</div>`;
 const hue=['#7b2fbe','#e8b923','#d7191c'],f=[1,.55,.18],lab=['>1500 m','800–1500','<800 m'];
 const mix=(h,kk)=>{const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255),g=.86;return 'rgb('+c.map(v=>Math.round((g+(v-g)*kk)*255)).join(',')+')';};
 let s='<b style="color:#e7e9ef">Elevación × pendiente</b><div class="biv"><span></span><span>&lt;8°</span><span>8–15°</span><span>&gt;15°</span>';
 [2,1,0].forEach((i,r)=>{s+=`<span>${lab[r]}</span>`;f.forEach(kk=>s+=`<div class="c" style="background:${mix(hue[i],kk)}"></div>`);});
 return s+'</div><div style="margin-top:5px">color pleno = plano · lavado = empinado</div>';}
const tCtl=new THREE.OrbitControls(tCam,tC);tCtl.enableDamping=true;tCtl.maxPolarAngle=Math.PI*0.49;tCtl.minDistance=3;tCtl.maxDistance=250;
const rEx=document.getElementById('rEx'),vEx=document.getElementById('vEx');
const tagDir=document.getElementById('tagDir'),tagPoleT=document.getElementById('tagPoleT'),tagRealT=document.getElementById('tagRealT');
tagDir.style.display='none';
const leg=document.getElementById('legend'),info=document.getElementById('info'),sel=document.getElementById('selTex'),selA=document.getElementById('selArea'),g5=document.getElementById('g5');
// opciones del selector y minimapa
selA.innerHTML='<option value="all">Vista general · 80 km</option><option value="detail">Site01 · detalle 5 m (real)</option>'+
  GR.sites.map((s,i)=>`<option value="${i}">${s.real?'Site01 (real)':s.id} · ${fmt(s.p10,0)} % &lt;10°</option>`).join('');
const pmin=Math.min(...GR.sites.map(s=>s.p10)),pmax=Math.max(...GR.sites.map(s=>s.p10));
const ramp=v=>{const t=(v-pmin)/(pmax-pmin),a=[35,45,70],b=[30,120,200];return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*t)).join(',')})`;};
GR.sites.forEach((s,i)=>{const b=document.createElement('button');b.style.background=ramp(s.p10);if(s.real)b.classList.add('real');
  b.innerHTML=`${s.cell}<br>${fmt(s.p10,0)}%`;b.title=s.id;b.onclick=()=>pick(String(i));g5.appendChild(b);});
function pick(v){selA.value=v;const btn=[...g5.children];btn.forEach(b=>b.classList.remove('sel'));
  if(v==='all'){cur={kind:'all',hl:cur.s||null};globeSelect(cur.hl);}
  else if(v==='detail'){cur={kind:'detail',s:GR.sites.find(q=>q.real)};btn[GR.sites.indexOf(cur.s)].classList.add('sel');globeSelect(null);}
  else{const s=GR.sites[+v];cur={kind:'site',s};btn[+v].classList.add('sel');globeSelect(s);}
  render3();const k=cur.kind==='all'?5:1;tCam.position.set(-17*k,15*k,19*k);tCtl.target.set(0,0,0);if(window.__gameReady)onSitePicked();}
selA.onchange=()=>pick(selA.value);sel.onchange=()=>{setView();render3();};
rEx.oninput=()=>{ex=+rEx.value;vEx.textContent=fmt(ex,1)+'×';render3();};
function setView(){gExtPatch.material.map=TEXG[sel.value];gRealPatch.material.map=TEX[sel.value];gExtPatch.material.needsUpdate=gRealPatch.material.needsUpdate=true;}
pick(String(GR.sites.findIndex(s=>s.real)));


/* ================= JUEGO: Descenso perfecto ================= */
// Terreno = corte real del sitio (grilla de 100 m). Escala 1:20 en ambos ejes: las pendientes quedan reales.
const SC=1/20, EXV=2, G0=1.62, THR=4.3, ROT=1.8, BURN=6, LIM={vy:2.0,vx:1.2,ang:12}, LEGS=[3.6,4.2];
let mode='relief', game=null, keys={left:false,right:false,up:false};
const gameEl=document.getElementById('game'),gc=document.getElementById('cGame'),gx=gc.getContext('2d');
const hud=document.getElementById('hud'),gmsg=document.getElementById('gmsg');
const STARS=Array.from({length:140},()=>[Math.random(),Math.random()*0.8,Math.random()*1.3+0.3]);
function bestGet(id){try{return +(localStorage.getItem('site01_descenso_'+id)||0);}catch(e){return 0;}}
function bestSet(id,v){try{localStorage.setItem('site01_descenso_'+id,String(v));}catch(e){}}
function gameSite(){return cur.kind==='site'?cur.s:GR.sites.find(s=>s.real);}
function siteSlopes(s){const o=new Float32Array(160*160);
  for(let i=0;i<160;i++)for(let j=0;j<160;j++){const r=s.r*160+i,c=s.c*160+j;
    const c0=Math.max(0,c-1),c1=Math.min(NG-1,c+1),r0=Math.max(0,r-1),r1=Math.min(NG-1,r+1);
    const zx=(HG[r*NG+c1]-HG[r*NG+c0])/((c1-c0)*100),zy=(HG[r1*NG+c]-HG[r0*NG+c])/((r1-r0)*100);
    o[i*160+j]=Math.atan(Math.hypot(zx,zy))*180/Math.PI;}return o;}
function padsOf(sl){const P=[];let a=-1;
  for(let j=0;j<=160;j++){const f=j<160&&sl[j]<8;if(f&&a<0)a=j;if(!f&&a>=0){if(j-a>=4)P.push([a,j-1]);a=-1;}}return P;}
// cortes candidatos (filas con al menos una plataforma), de más fácil a más difícil
function cutsOf(s,SL){const L=[];for(let i=6;i<154;i++){const row=SL.subarray(i*160,i*160+160),P=padsOf(row);if(!P.length)continue;
    L.push({i,best:Math.max(...P.map(p=>p[1]-p[0]+1)),n:P.length});}
  L.sort((a,b)=>b.best-a.best||b.n-a.n);const out=[];
  for(const c of L){if(out.every(o=>Math.abs(o.i-c.i)>=12))out.push(c);if(out.length>=8)break;}return out;}
function buildLevel(s,ci){const SL=siteSlopes(s),cuts=cutsOf(s,SL);if(!cuts.length)return null;
  const cut=cuts[ci%cuts.length],i=cut.i,h=[],sl=[];
  for(let j=0;j<160;j++){h.push(HG[(s.r*160+i)*NG+s.c*160+j]);sl.push(SL[i*160+j]);}
  const hmin=Math.min(...h),W=159*100*SC,ys=h.map(v=>(v-hmin)*SC*EXV),dxm=100*SC;
  const pads=padsOf(sl).map(([a,b])=>{const len=(b-a+1)*100;return {x0:a*dxm,x1:b*dxm,len,mult:len<600?3:len<1200?2:1,
     y:Math.max(...ys.slice(a,b+1))};});
  const ymax=Math.max(...ys);return {s,cuts,ci:ci%cuts.length,row:i,ys,sl,W,dxm,pads,ymax,yreal:s.y1-(i+0.5)*100};}
function ground(L,x){const f=Math.max(0,Math.min(L.ys.length-1.001,x/L.dxm)),j=Math.floor(f),t=f-j;return L.ys[j]*(1-t)+L.ys[j+1]*t;}
function slopeAt(L,x){return L.sl[Math.max(0,Math.min(159,Math.round(x/L.dxm)))];}
function newGame(ci){const s=gameSite(),L=buildLevel(s,ci==null?(game&&game.L&&game.L.s===s?game.L.ci:0):ci);
  if(!L){game={L:null,state:'none'};showMsg(`<h2>${s.id}</h2>Este sitio no tiene tramos con pendiente &lt; 8° suficientemente largos para aterrizar. Elegí otro en el minimapa.`);return;}
  const startX=L.pads[0].x0>L.W/2?L.W*0.08:L.W*0.92;
  game={L,state:'ready',x:startX,y:L.ymax+175,vx:startX<L.W/2?7:-7,vy:0,a:0,fuel:100,thr:false,t:0,zoom:1,cx:L.W/2,cy:(L.ymax+140)/2,res:null,best:bestGet(s.id)};
  showMsg(`<h2>Descenso perfecto · ${s.id}</h2>
   Aterrizá suave sobre una <b style="color:#7fd3ff">plataforma celeste</b>: son los tramos de este corte con pendiente real &lt; 8°. Las chicas valen más (×2, ×3).
   <ul><li>Velocidad vertical ≤ ${fmt(LIM.vy,1)} m/s y horizontal ≤ ${fmt(LIM.vx,1)} m/s</li><li>Nave derecha (± ${LIM.ang}°)</li><li>Gravedad lunar: 1,62 m/s² · combustible limitado</li></ul>
   <kbd>←</kbd> <kbd>→</kbd> girar · <kbd>↑</kbd> o <kbd>espacio</kbd> motor · <kbd>R</kbd> reiniciar · <kbd>N</kbd> otro corte
   <div class="btns"><button class="pri" data-a="go">Empezar</button><button data-a="next">Otro corte (${L.ci+1}/${L.cuts.length})</button></div>`);}
function showMsg(h){gmsg.querySelectorAll('video').forEach(v=>v.pause());gmsg.innerHTML=h;gmsg.hidden=false;
  gmsg.querySelectorAll('button[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
    if(a==='go')start();if(a==='retry')newGame(game.L.ci),start();if(a==='next')newGame(game.L.ci+1);if(a==='site')setMode('relief');if(a==='return'&&game?.res==='ok'&&embedded)window.parent.postMessage({type:'lunar-descent-complete',version:1,site_id:game.L.s.id,real:!!game.L.s.real},location.origin);});}
function start(){audioOn();if(!game||!game.L)return;gmsg.hidden=true;game.state='fly';game.last=null;gc.focus();}
function feet(g){const c=Math.cos(g.a),s=Math.sin(g.a);return [[-LEGS[0],-LEGS[1]],[LEGS[0],-LEGS[1]]].map(([px,py])=>[g.x+px*c+py*s,g.y-px*s+py*c]);}
function step(g,dt){const L=g.L;g.thr=keys.up&&g.fuel>0;
  g.a+=((keys.right?1:0)-(keys.left?1:0))*ROT*dt;g.a=Math.max(-1.4,Math.min(1.4,g.a));
  let ax=0,ay=-G0;if(g.thr){ax+=Math.sin(g.a)*THR;ay+=Math.cos(g.a)*THR;g.fuel=Math.max(0,g.fuel-BURN*dt);}
  g.vx+=ax*dt;g.vy+=ay*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;g.t+=dt;
  if(g.x<4){g.x=4;g.vx=Math.abs(g.vx)*0.3;}if(g.x>L.W-4){g.x=L.W-4;g.vx=-Math.abs(g.vx)*0.3;}
  const F=feet(g);if(F.some(([fx,fy])=>fy<=ground(L,fx))||g.y-1<=ground(L,g.x))land(g,F);}
function land(g,F){const vy0=g.vy,L=g.L,ang=Math.abs(g.a*180/Math.PI),pad=L.pads.find(p=>F[0][0]>=p.x0-0.5&&F[1][0]<=p.x1+0.5&&F[1][0]>=p.x0&&F[0][0]<=p.x1),
  sreal=slopeAt(L,g.x),why=[];
  if(Math.abs(vy0)>LIM.vy)why.push(`velocidad vertical ${fmt(Math.abs(vy0),1)} m/s (máx. ${fmt(LIM.vy,1)})`);
  if(Math.abs(g.vx)>LIM.vx)why.push(`velocidad horizontal ${fmt(Math.abs(g.vx),1)} m/s (máx. ${fmt(LIM.vx,1)})`);
  if(ang>LIM.ang)why.push(`nave inclinada ${fmt(ang)}° (máx. ${LIM.ang}°)`);
  if(!pad)why.push(`fuera de plataforma: pendiente real del lugar ${fmt(sreal,1)}°${sreal<8?' (tramo plano demasiado corto)':' (máx. 8°)'}`);
  pitchLog(g,vy0,ang,pad,sreal,why);cineShow(g,vy0,ang,pad,sreal,why);g.state='done';g.vx=g.vy=0;const s=L.s;
  if(!why.length){const score=Math.round((60+g.fuel*1.6+(LIM.vy-Math.min(LIM.vy,Math.abs(vy0)))*25)*pad.mult);
    const rec=score>g.best;if(rec){bestSet(s.id,score);g.best=score;}
    g.res='ok';showMsg(`<h2 style="color:#7fd3ff">¡Aterrizaje perfecto!</h2><div class="big">${fmt(score)} pts</div><p>¡Félicette llegó a salvo! Es un logro del juego; el terreno todavía necesita evaluación.</p>
     plataforma ×${pad.mult} · ${fmt(pad.len)} m reales · combustible ${fmt(g.fuel)} %${rec?'<br><b style="color:#ffb14a">¡Nuevo récord en '+s.id+'!</b>':''}
     <div class="btns">${embedded?'<button class="pri" data-a="return">Volver a mi misión →</button>':''}<button data-a="retry">Otra vez</button><button data-a="next">Otro corte</button>${embedded?'':'<button data-a="site">Elegir sitio</button>'}</div>`);}
  else{g.res='crash';showMsg(`<h2 style="color:#ffca91">¡Podés mejorar este alunizaje!</h2><p>Mirá las cuatro pistas de Félicette y elegí qué vas a practicar en tu próximo intento.</p>
     <div class="btns"><button class="pri" data-a="retry">Reintentar</button><button data-a="next">Otro corte</button>${embedded?'':'<button data-a="site">Elegir sitio</button>'}</div>`);}}
function sizeGame(){const r=tEl.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);gc.width=Math.round(r.width*d);gc.height=Math.round(r.height*d);gc.dataset.d=d;}
new ResizeObserver(()=>{if(mode==='game')sizeGame();}).observe(tEl);
function gameFrame(now){if(!game||!game.L){gx.fillStyle='#07080c';gx.fillRect(0,0,gc.width,gc.height);return;}
  if(game.state==='fly'&&(document.hidden||document.getElementById('descentInfo').open)){game.last=null;if(engG)engG.gain.value=0;drawGame(game);drawHud(game);return;}
  const g=game,L=g.L;
  if(g.state==='fly'){if(g.last==null)g.last=now;let dt=Math.min(0.1,(now-g.last)/1000);g.last=now;
    while(dt>0&&g.state==='fly'){const h=Math.min(dt,1/120);g.lastVy=g.vy;step(g,h);dt-=h;}}
  drawGame(g);drawHud(g);pitchFrame(g);instFrame(g);}
function drawGame(g){const L=g.L,d=+gc.dataset.d||1,cw=gc.width,ch=gc.height;
  const ymin=-8,ymax=L.ymax+200,F=Math.min(cw/(L.W*1.04),ch/(ymax-ymin));
  // cámara de seguimiento: la nave siempre al centro; zoom según la altura (abierto > 150 m, primer plano en los últimos 5 m)
  const alt=g.y-ground(L,g.x),ZMIN=0.8,ZMAX=9,tz=Math.max(0,Math.min(1,Math.log(Math.max(5,alt)/5)/Math.log(150/5))),zt=ZMIN*Math.pow(ZMAX/ZMIN,1-tz);
  if(!g.cam){g.cam={x:g.x,y:g.y};g.zoom=zt;}g.zoom+=(zt-g.zoom)*0.05;g.cam.x+=(g.x-g.cam.x)*0.2;g.cam.y+=(g.y-g.cam.y)*0.2;
  const S=F*g.zoom,cx=g.cam.x,cy=g.cam.y;
  const X=x=>(x-cx)*S+cw/2,Y=y=>ch*0.45-(y-cy)*S;g._X=X;g._Y=Y;g._d=d;
  gx.fillStyle='#091426';gx.fillRect(0,0,cw,ch);
  for(const[sx,sy,r]of STARS){gx.fillStyle='rgba(200,210,235,'+(0.25+r*0.3)+')';gx.fillRect(((sx*cw-cx*S*0.06)%cw+cw)%cw,((sy*ch+cy*S*0.06)%ch+ch)%ch,r*d,r*d);}
  // Tierra baja sobre el horizonte (desde el polo sur se ve rasante)
  const er=Math.max(14,cw*0.03);gx.beginPath();gx.arc(cw*0.6,ch*0.2,er,0,7);gx.fillStyle='#2b6fd6';gx.fill();
  gx.beginPath();gx.arc(cw*0.6+er*0.25,ch*0.2-er*0.1,er*0.55,0,7);gx.fillStyle='rgba(120,190,120,.55)';gx.fill();
  // terreno
  gx.beginPath();gx.moveTo(X(-900),Y(-4000));gx.lineTo(X(-900),Y(L.ys[0]));for(let j=0;j<L.ys.length;j++)gx.lineTo(X(j*L.dxm),Y(L.ys[j]));gx.lineTo(X(L.W+900),Y(L.ys[L.ys.length-1]));gx.lineTo(X(L.W+900),Y(-4000));gx.closePath();
  const gr=gx.createLinearGradient(0,Y(L.ymax),0,Y(-80));gr.addColorStop(0,'#5c606b');gr.addColorStop(1,'#1c1e24');gx.fillStyle=gr;gx.fill();
  gx.lineWidth=1.2*d;gx.strokeStyle='#a9aebb';gx.stroke();
  // plataformas
  gx.font=`600 ${11*d}px IBM Plex Mono, monospace`;gx.textAlign='center';
  for(const p of L.pads){gx.beginPath();const j0=Math.round(p.x0/L.dxm),j1=Math.round(p.x1/L.dxm);
    for(let j=j0;j<=j1;j++){const px=X(j*L.dxm),py=Y(L.ys[j]);j===j0?gx.moveTo(px,py):gx.lineTo(px,py);}
    gx.lineWidth=4*d;gx.strokeStyle='#22d3ee';gx.stroke();
    gx.fillStyle='#bfe9ff';gx.fillText('×'+p.mult,(X(p.x0)+X(p.x1))/2,Y(p.y)-8*d);}
  // nave
  const ls=Math.max(S,2.4*d);gx.save();gx.translate(X(g.x),Y(g.y));gx.rotate(g.a);gx.scale(ls,-ls);
  if(g.thr&&g.state==='fly'){gx.beginPath();gx.moveTo(-1.3,-2.6);gx.lineTo(0,-2.6-(4+Math.random()*2.5));gx.lineTo(1.3,-2.6);gx.closePath();gx.fillStyle='rgba(255,170,60,.9)';gx.fill();}
  gx.lineWidth=0.45;gx.strokeStyle='#e8e9ee';
  gx.beginPath();gx.moveTo(-2.2,-1.6);gx.lineTo(-LEGS[0],-LEGS[1]);gx.moveTo(2.2,-1.6);gx.lineTo(LEGS[0],-LEGS[1]);gx.moveTo(-LEGS[0]-0.8,-LEGS[1]);gx.lineTo(-LEGS[0]+0.8,-LEGS[1]);gx.moveTo(LEGS[0]-0.8,-LEGS[1]);gx.lineTo(LEGS[0]+0.8,-LEGS[1]);gx.stroke();
  gx.fillStyle=g.res==='crash'?'#ff7a5c':'#8bd6ad';gx.fillRect(-2.4,-2.6,4.8,2.6);
  gx.fillStyle='#cfd5e6';gx.beginPath();gx.arc(0,1.4,2,Math.PI,0);gx.fill();gx.fillRect(-2,0,4,1.4);
  gx.restore();
  if(S<2.5*d){gx.beginPath();gx.arc(X(g.x),Y(g.y),10*d,0,7);gx.strokeStyle='rgba(34,211,238,.7)';gx.lineWidth=1.2*d;gx.stroke();}
  gx.textAlign='left';gx.fillStyle='rgba(160,168,190,.8)';gx.font=`${10*d}px IBM Plex Sans, sans-serif`;
  gx.fillText('Corte real de '+L.s.id+' en Y = '+fmt(L.yreal/1000,1)+' km · escala 1:20, relieve exagerado ×2 · plataformas = pendiente real < 8°',12*d,ch-10*d);}
function drawHud(g){const L=g.L,alt=g.y-ground(L,g.x),sr=slopeAt(L,g.x),vyb=Math.abs(g.vy)>LIM.vy,vxb=Math.abs(g.vx)>LIM.vx,ab=Math.abs(g.a*180/Math.PI)>LIM.ang;
  hud.innerHTML=`<h3>${L.s.id} · corte ${L.ci+1}/${L.cuts.length}</h3>
   <div class="r"><span>altura</span><b>${fmt(Math.max(0,alt))} m</b></div>
   <div class="r"><span>vel. de descenso</span><b class="${vyb?'bad':'ok'}">${fmt(-g.vy,1)} m/s</b></div>
   <div class="r"><span>vel. horizontal</span><b class="${vxb?'bad':'ok'}">${fmt(g.vx,1)} m/s</b></div>
   <div class="r"><span>inclinación</span><b class="${ab?'bad':'ok'}">${fmt(g.a*180/Math.PI)}°</b></div>
   <div class="r"><span>pendiente debajo</span><b class="${sr<8?'ok':'bad'}">${fmt(sr,1)}°</b></div>
   <div class="fuel"><i style="width:${g.fuel}%"></i></div><div class="r"><span>combustible</span><b>${fmt(g.fuel)} %</b></div>
   <div class="r"><span>récord del sitio</span><b>${g.best?fmt(g.best)+' pts':'—'}</b></div>`;}
// controles
const KM={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',Space:'up'};
addEventListener('keydown',e=>{if(mode!=='game')return;if(e.target&&(e.target.tagName==='SELECT'||e.target.tagName==='INPUT'))return;
  if(KM[e.code]){keys[KM[e.code]]=true;e.preventDefault();if(game&&game.state==='ready'&&(e.code==='Space'||e.code==='ArrowUp'))start();}
  if(e.code==='Enter'&&game&&game.state!=='fly'){e.preventDefault();game.state==='ready'?start():(newGame(game.L.ci),start());}
  if(e.code==='KeyR'&&game&&game.L){newGame(game.L.ci);start();}
  if(e.code==='KeyN'&&game&&game.L){newGame(game.L.ci+1);}});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=false;});
document.querySelectorAll('.touch button').forEach(b=>{const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;if(game&&game.state==='ready'&&k==='up')start();});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));});
function setMode(m){mode=m;document.getElementById('mRel').classList.toggle('on',m==='relief');document.getElementById('mGame').classList.toggle('on',m==='game');
  gameEl.hidden=m!=='game';tC.style.visibility=m==='game'?'hidden':'visible';
  document.querySelectorAll('.relOnly').forEach(el=>el.style.display=m==='game'?'none':'');
  ['legend','info'].forEach(id=>document.getElementById(id).style.display=m==='game'?'none':'');
  [tagPoleT,tagRealT,tagDir].forEach(el=>el.style.visibility=m==='game'?'hidden':'visible');
  if(m==='game'){sizeGame();newGame(0);}else{keys.left=keys.right=keys.up=false;gmsg.hidden=true;}}
function onSitePicked(){if(mode==='game')newGame(0);}
document.getElementById('mRel').onclick=()=>setMode('relief');
document.getElementById('mGame').onclick=()=>setMode('game');
/* ================= MODO PITCH: ecuación en vivo, dataset y cierre ================= */
let pitch=false,pFrame=0,botQ=0,lastRec=null,hereKey='',here=[];
const eqEl=document.getElementById('eq'),dsEl=document.getElementById('dset'),capEl=document.getElementById('pcap'),endEl=document.getElementById('pend'),bPitch=document.getElementById('bPitch');
const DKEY='los-lunares-descenso-v1';
let DS=(()=>{try{const a=JSON.parse(localStorage.getItem(DKEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}})();
function dsSave(){if(DS.length>5000)DS=DS.slice(-5000);try{localStorage.setItem(DKEY,JSON.stringify(DS));}catch(e){}}
function judge(L,x,a,vx,vy,F){const ang=Math.abs(a*180/Math.PI),pad=L.pads.find(p=>F[0][0]>=p.x0-0.5&&F[1][0]<=p.x1+0.5&&F[1][0]>=p.x0&&F[0][0]<=p.x1),sreal=slopeAt(L,x),why=[];
  if(Math.abs(vy)>LIM.vy)why.push('vy');if(Math.abs(vx)>LIM.vx)why.push('vx');if(ang>LIM.ang)why.push('ang');if(!pad)why.push('pad');return {ang,pad,sreal,why};}
function rec(src,L,x,vy,vx,ang,fuel,sreal,why,t){const r={src,site:L.s.id,real:!!L.s.real,row:L.row,x:+x.toFixed(2),xm:Math.round(x/SC),vy:+Math.abs(vy).toFixed(2),vx:+Math.abs(vx).toFixed(2),ang:+ang.toFixed(1),fuel:+fuel.toFixed(1),slope:+sreal.toFixed(1),ok:!why.length,why:why.join(','),t:+t.toFixed(1),ts:Date.now()};DS.push(r);return r;}
function botRun(L){const sx=L.pads[0].x0>L.W/2?L.W*0.08:L.W*0.92,wt=L.pads.map(p=>1/(Math.abs((p.x0+p.x1)/2-sx)+80));
  let u=Math.random()*wt.reduce((a,b)=>a+b,0),k=0;while(k<wt.length-1&&(u-=wt[k])>0)k++;const tp=L.pads[k];
  const near=Math.abs(tp.x0-sx)<Math.abs(tp.x1-sx)?tp.x0:tp.x1,tx=Math.random()<0.85?near+(tp.x0+tp.x1-2*near)*(0.08+Math.random()*0.3):4+Math.random()*(L.W-8);
  const sk=0.5+Math.random()*1.5,noise=Math.random()*0.3;
  const g={L,x:sx,y:L.ymax+175,vx:sx<L.W/2?7:-7,vy:0,a:0,fuel:100,t:0},dt=1/60;
  for(let i=0;i<60*240;i++){const alt=g.y-ground(L,g.x),ex=tx-g.x,dvx=Math.max(-30,Math.min(30,ex*0.12));
    const ta=alt<4?0:Math.max(-0.9,Math.min(0.9,(dvx-g.vx)*0.3+(Math.random()-.5)*noise));
    const da=ta-g.a;g.a+=Math.sign(da)*Math.min(Math.abs(da),ROT*dt);
    const far=Math.abs(ex)>12||Math.abs(g.vx)>3,dvy=far?Math.max(-14,Math.min(1,-(alt-15)/Math.max(1,Math.abs(ex)/Math.max(3,Math.abs(g.vx))))):-Math.min(14,Math.max(0.3+sk*0.95,alt*0.15)),thr=g.fuel>0&&g.vy<dvy;
    let ax=0,ay=-G0;if(thr){ax+=Math.sin(g.a)*THR;ay+=Math.cos(g.a)*THR;g.fuel=Math.max(0,g.fuel-BURN*dt);}
    g.vx+=ax*dt;g.vy+=ay*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;g.t+=dt;
    if(g.x<4){g.x=4;g.vx=Math.abs(g.vx)*0.3;}if(g.x>L.W-4){g.x=L.W-4;g.vx=-Math.abs(g.vx)*0.3;}
    const F=feet(g);if(F.some(([fx,fy])=>fy<=ground(L,fx))||g.y-1<=ground(L,g.x)){const j=judge(L,g.x,g.a,g.vx,g.vy,F);return rec("bot",L,g.x,g.vy,g.vx,j.ang,g.fuel,j.sreal,j.why,g.t);}}
  return null;}
function pitchLog(g,vy0,ang,pad,sreal,why){
  const codes=why.map(w=>w.startsWith('velocidad vertical')?'vy':w.startsWith('velocidad horizontal')?'vx':w.startsWith('nave')?'ang':'pad');
  lastRec=rec('humano',g.L,g.x,vy0,g.vx,ang,g.fuel,sreal,codes,g.t);dsSave();}
function glow(c){const s=document.createElement('canvas');s.width=s.height=32;const x=s.getContext('2d'),gr=x.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,`rgba(${c},1)`);gr.addColorStop(.35,`rgba(${c},.5)`);gr.addColorStop(1,`rgba(${c},0)`);x.fillStyle=gr;x.fillRect(0,0,32,32);return s;}
const SPR={ok:glow('90,225,150'),bad:glow('255,95,70')};
dsEl.innerHTML=`<span>Dataset</span><span class="n" id="dsN">0</span><span id="dsT"></span>
  <button data-p="bots" title="Piloto automático: suma descensos simulados en este corte">+100 simulados</button><button data-p="exp">Copiar JSON</button><button data-p="end" title="Tecla P">Cierre</button><button data-p="clr">Borrar</button>`;
const dsN=document.getElementById('dsN'),dsT=document.getElementById('dsT');
dsEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.p;
  if(a==='bots')botQ+=100;
  if(a==='end')showEnd(true);
  if(a==='exp'){const txt=JSON.stringify({fuente:'Site01 · Descenso perfecto',terreno:'LOLA DEM (NASA LRO), corte a 100 m, escala 1:20, relieve ×2',limites:LIM,gravedad:G0,empuje:THR,descensos:DS});
    const fallback=()=>{endEl.innerHTML=`<h2 style="font-size:22px">Dataset (${fmt(DS.length)} descensos)</h2><p class="m">Seleccioná todo y copiá</p><textarea readonly>${txt.replace(/</g,'&lt;')}</textarea><p class="m s">clic afuera del texto para volver</p>`;endEl.classList.add('show');const ta=endEl.querySelector('textarea');ta.onclick=e=>e.stopPropagation();ta.select();};
    try{navigator.clipboard.writeText(txt).then(()=>{b.textContent='¡Copiado!';setTimeout(()=>b.textContent='Copiar JSON',1800);},fallback);}catch(e){fallback();}}
  if(a==='clr'){if(b.dataset.sure){DS=[];lastRec=null;dsSave();b.textContent='Borrar';delete b.dataset.sure;}else{b.dataset.sure=1;b.textContent='¿Seguro? clic de nuevo';setTimeout(()=>{b.textContent='Borrar';delete b.dataset.sure;},3000);}}
  gc.focus();});
function showEnd(on){if(on){const h=DS.filter(r=>r.src==='humano').length;
    endEl.innerHTML=`<h2>Vos jugás. La ciencia aprende.</h2><div class="n">${fmt(DS.length)}</div><p>descensos registrados sobre terreno real del polo sur lunar</p>
     <p class="m">${fmt(h)} humanos · ${fmt(DS.length-h)} simulados · ${fmt(DS.filter(r=>r.ok).length)} aterrizajes válidos</p><p class="m s">Terreno: LOLA (NASA LRO) · P o clic para volver</p>`;}
  endEl.classList.toggle('show',on);}
endEl.onclick=()=>showEnd(false);
function setPitch(on){pitch=on;document.body.classList.toggle('pitch',on);tEl.classList.toggle('pitch',on);bPitch.classList.toggle('on',on);
  bPitch.textContent=on?'✕ Salir del modo pitch':'🎬 Modo pitch';showEnd(false);hereKey='';
  if(on&&mode!=='game')setMode('game');requestAnimationFrame(()=>{resize();if(mode==='game')sizeGame();});}
bPitch.onclick=()=>setPitch(!pitch);
const _setMode=setMode;setMode=function(m){_setMode(m);if(m!=='game'&&pitch)setPitch(false);};
addEventListener('keydown',e=>{if(!pitch||mode!=='game')return;if(e.code==='KeyP'){e.preventDefault();showEnd(!endEl.classList.contains('show'));}});
function renderEq(g){const L=g.L,on=g.thr&&g.state==='fly',deg=g.a*180/Math.PI,ay=(on?THR*Math.cos(g.a):0)-G0;
  const done=g.state==='done'&&lastRec,R=done?lastRec:null;
  const vy=R?R.vy:Math.abs(g.vy),vx=R?R.vx:Math.abs(g.vx),an=R?R.ang:Math.abs(deg),sl=R?R.slope:slopeAt(L,g.x),padOk=R?!R.why.includes('pad'):sl<8;
  const row=(lab,val,ok)=>`<span>${lab}</span><b class="${ok?'ok':'bad'}">${val}</b><span class="${ok?'ok':'bad'}">${ok?'✓':'✗'}</span>`;
  eqEl.className='eq'+(done?' final':'');
  eqEl.innerHTML=`<h4>Física en vivo</h4>
   <div class="sym">a<sub>y</sub> = T·cos θ − g</div>
   <div class="num">a<sub>y</sub> = <span class="tm thr${on?' on':''}">${on?'4,3·cos('+fmt(deg)+'°)':'0 <small>(motor apagado)</small>'}</span> − <span class="tm grav">1,62</span></div>
   <div class="num res">a<sub>y</sub> = ${ay>=0?'+':'−'}${fmt(Math.abs(ay),2)} m/s²</div>
   <div class="num">v<sub>y</sub> ← v<sub>y</sub> + a<sub>y</sub>·Δt = <b>${fmt(done?-R.vy:g.vy,1)} m/s</b></div>
   <div class="num">combustible <b>${fmt(g.fuel)} %</b></div>`;}
function renderDs(L){const h=DS.filter(r=>r.src==='humano').length,ok=here.filter(r=>r.ok).length;
  dsN.textContent=fmt(DS.length);
  dsT.textContent=`descensos · ${fmt(h)} humanos · ${fmt(DS.length-h)} simulados · en este corte ${fmt(here.length)}${here.length?' ('+Math.round(ok/here.length*100)+'% válidos)':''}`;
  capEl.innerHTML=L.s.real?`<i></i>Terreno real · NASA LRO / LOLA · polo sur lunar · ${L.s.id}`:`<i style="background:#9aa3bd"></i>Sitio simulado (parecido estadísticamente a Site01) · ${L.s.id}`;}
function pitchFrame(g){if(!pitch||!g.L)return;const L=g.L;
  if(botQ>0){const k=Math.min(botQ,4);for(let i=0;i<k;i++)botRun(L);botQ-=k;if(!botQ)dsSave();}
  const key=L.s.id+'|'+L.row+'|'+DS.length;if(key!==hereKey){hereKey=key;here=DS.filter(r=>r.site===L.s.id&&r.row===L.row);}
  if(g._X){const X=g._X,Y=g._Y,d=g._d,sz=18*d;
    for(const r of here){gx.globalAlpha=r.src==='bot'?0.4:0.85;gx.drawImage(r.ok?SPR.ok:SPR.bad,X(r.x)-sz/2,Y(ground(L,r.x))-sz/2-2*d,sz,sz);}
    gx.globalAlpha=1;
    if(lastRec&&g.state==='done'&&lastRec.site===L.s.id&&lastRec.row===L.row){gx.beginPath();gx.arc(X(lastRec.x),Y(ground(L,lastRec.x))-2*d,14*d,0,7);gx.strokeStyle='#fff';gx.lineWidth=2*d;gx.stroke();}}
  if(++pFrame%3===0)renderEq(g);
  if(pFrame%10===0)renderDs(L);}

/* ================= INSTRUMENTOS: palanca de mando, altímetro y alarma ================= */
const instC=document.getElementById('alti'),ix=instC.getContext('2d'),stickEl=document.getElementById('stick'),dangerEl=document.getElementById('danger'),muteB=document.getElementById('mute');
const ALT_MAX=200,APPROACH=45;
stickEl.innerHTML=`<svg viewBox="0 0 124 132">
  <text x="62" y="11" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="#8a91a6" id="stUp">▲ MOTOR</text>
  <circle cx="62" cy="66" r="46" fill="#0b0d13" stroke="#2e3548" stroke-width="2"/>
  <circle cx="62" cy="66" r="34" fill="none" stroke="#232838" stroke-dasharray="3 4"/>
  <line x1="16" y1="66" x2="108" y2="66" stroke="#232838"/><line x1="62" y1="20" x2="62" y2="112" stroke="#232838"/>
  <circle cx="62" cy="66" r="9" fill="#1a1f2c" stroke="#39415a"/>
  <line id="stShaft" x1="62" y1="66" x2="62" y2="66" stroke="#9aa3bd" stroke-width="7" stroke-linecap="round"/>
  <circle id="stGlow" cx="62" cy="66" r="22" fill="rgba(255,177,74,.35)" opacity="0"/>
  <circle id="stKnob" cx="62" cy="66" r="15" fill="#2a3042" stroke="#cfd5e6" stroke-width="2"/>
  <circle id="stBtn" cx="62" cy="66" r="5" fill="#ff5a3c"/>
  <text x="62" y="128" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="#8a91a6"><tspan id="stL">◀</tspan> GIRO <tspan id="stR">▶</tspan></text></svg>`;
const stShaft=document.getElementById('stShaft'),stKnob=document.getElementById('stKnob'),stBtn=document.getElementById('stBtn'),stGlow=document.getElementById('stGlow'),stL=document.getElementById('stL'),stR=document.getElementById('stR'),stUp=document.getElementById('stUp');
let kx=0,ky=0,drag=null;
function stickInput(e){const r=stickEl.querySelector('svg').getBoundingClientRect(),s=r.width/124;
  let dx=(e.clientX-(r.left+62*s))/(34*s),dy=(e.clientY-(r.top+66*s))/(34*s);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}
  drag={dx,dy};keys.left=dx<-0.35;keys.right=dx>0.35;keys.up=dy<-0.35;
  if(keys.up&&game&&game.state==='ready')start();}
stickEl.addEventListener('pointerdown',e=>{e.preventDefault();audioOn();stickEl.setPointerCapture(e.pointerId);stickEl.style.cursor='grabbing';stickInput(e);});
stickEl.addEventListener('pointermove',e=>{if(drag)stickInput(e);});
['pointerup','pointercancel'].forEach(ev=>stickEl.addEventListener(ev,()=>{if(!drag)return;drag=null;keys.left=keys.right=keys.up=false;stickEl.style.cursor='grab';}));
function drawStick(g){const on=g.thr&&g.state==='fly';
  const tx=drag?drag.dx:(keys.right?1:0)-(keys.left?1:0),ty=drag?drag.dy:(keys.up?-1:0);
  kx+=(tx-kx)*0.35;ky+=(ty-ky)*0.35;const X=62+kx*30,Y=66+ky*30;
  stShaft.setAttribute('x2',X);stShaft.setAttribute('y2',Y);stKnob.setAttribute('cx',X);stKnob.setAttribute('cy',Y);stBtn.setAttribute('cx',X);stBtn.setAttribute('cy',Y);
  stGlow.setAttribute('cx',X);stGlow.setAttribute('cy',Y);stGlow.setAttribute('opacity',on?1:0);stBtn.setAttribute('fill',on?'#ffb14a':'#ff5a3c');
  stL.setAttribute('fill',keys.left?'#ffd9cf':'#8a91a6');stR.setAttribute('fill',keys.right?'#ffd9cf':'#8a91a6');stUp.setAttribute('fill',on?'#ffb14a':keys.up?'#ff7a5c':'#8a91a6');}
// sonido de alarma (Web Audio; arranca con la primera tecla o toque)
let AC=null,muted=false,nextBeep=0;
try{muted=localStorage.getItem('site01_mute')==='1';}catch(e){}
muteB.textContent=muted?'🔇 Sonido apagado':'🔊 Sonido activo';muteB.setAttribute('aria-pressed',String(!muted));
function audioOn(){if(muted)return;if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;}}
addEventListener('keydown',()=>{if(mode==='game')audioOn();});addEventListener('pointerdown',()=>{if(mode==='game')audioOn();});
muteB.onclick=e=>{e.stopPropagation();muted=!muted;muteB.textContent=muted?'🔇 Sonido apagado':'🔊 Sonido activo';muteB.setAttribute('aria-pressed',String(!muted));try{localStorage.setItem('site01_mute',muted?'1':'0');}catch(err){}if(!muted)audioOn();gc.focus();};
function beep(f,dur){if(!AC||muted)return;try{if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),v=AC.createGain(),t=AC.currentTime;
  o.type='square';o.frequency.value=f;v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(0.08,t+0.01);v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(v).connect(AC.destination);o.start(t);o.stop(t+dur+0.02);}catch(e){}}
function alarms(g){if(g.state!=='fly')return {lvl:'',msg:[]};
  const L=g.L,alt=g.y-ground(L,g.x),d=-g.vy,red=[],amb=[];
  if(d>LIM.vy&&(alt<APPROACH||alt/d<4))red.push(alt<APPROACH?'DESCENSO RÁPIDO':'IMPACTO EN ~'+fmt(alt/d)+' s');
  if(alt<APPROACH){if(Math.abs(g.vx)>LIM.vx)red.push('DERIVA LATERAL');if(Math.abs(g.a*180/Math.PI)>LIM.ang)red.push('NAVE INCLINADA');}
  if(alt<APPROACH&&slopeAt(L,g.x)>=8)amb.push('TERRENO EMPINADO');
  if(g.fuel<15)amb.push(g.fuel<=0?'SIN COMBUSTIBLE':'COMBUSTIBLE BAJO');
  return red.length?{lvl:'red',msg:red.concat(amb)}:amb.length?{lvl:'amber',msg:amb}:{lvl:'',msg:[]};}
let alLvl='';
function drawAlarm(g,A){if(A.lvl!==alLvl){alLvl=A.lvl;gameEl.classList.toggle('al-red',A.lvl==='red');gameEl.classList.toggle('al-amber',A.lvl==='amber');dangerEl.className='danger '+A.lvl;}
  if(A.lvl)dangerEl.innerHTML=(A.lvl==='red'?'⚠ DANGER':'⚠ ATENCIÓN')+`<small>${A.msg.join(' · ')}</small>`;
  const now=performance.now();if(A.lvl&&now>nextBeep){if(A.lvl==='red'){beep(880,0.12);nextBeep=now+380;}else{beep(520,0.18);nextBeep=now+1100;}}}
function drawAlti(g){const d=Math.min(2,devicePixelRatio||1),W=220,H=178;if(instC.width!==W*d){instC.width=W*d;instC.height=H*d;}
  const c=ix;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,W,H);const L=g.L,alt=Math.max(0,g.y-ground(L,g.x)),des=-g.vy,fly=g.state==='fly';
  c.font="600 9.5px 'IBM Plex Sans',sans-serif";c.fillStyle='#8a91a6';c.fillText('ALTÍMETRO',6,11);
  // cinta vertical
  const x0=14,top=22,bot=166,h=bot-top,yA=a=>bot-Math.min(1,a/ALT_MAX)*h;
  c.fillStyle='#0b0d13';c.fillRect(x0,top,26,h);
  c.fillStyle='rgba(255,177,74,.16)';c.fillRect(x0,yA(APPROACH),26,bot-yA(APPROACH));
  c.fillStyle='#5c606b';c.fillRect(x0-2,bot,30,4);
  c.strokeStyle='#2e3548';c.strokeRect(x0+.5,top+.5,25,h);
  c.font="9px 'IBM Plex Mono',monospace";c.textAlign='left';
  for(let a=0;a<=ALT_MAX;a+=40){const y=yA(a);c.fillStyle='#3a4258';c.fillRect(x0+26,y,4,1);c.fillStyle='#6b7288';c.fillText(a,x0+32,y+3);}
  const ym=yA(alt);c.fillStyle=fly?'#e7e9ef':'#8a91a6';c.beginPath();c.moveTo(x0+1,ym);c.lineTo(x0+12,ym-6);c.lineTo(x0+12,ym+6);c.closePath();c.fill();
  c.fillStyle='rgba(127,211,255,.35)';c.fillRect(x0+1,ym,24,bot-ym);
  // número grande
  c.textAlign='left';c.fillStyle='#fff';c.font="600 24px 'IBM Plex Mono',monospace";c.fillText(fmt(alt),74,40);
  c.font="11px 'IBM Plex Sans',sans-serif";c.fillStyle='#8a91a6';c.fillText('m sobre el suelo',74,54);
  // reloj de velocidad de bajada 0..8 m/s
  const cx=146,cy=134,R=42,V=8,ang=v=>Math.PI+Math.min(1,Math.max(0,v)/V)*Math.PI;
  const arc=(a,b,col)=>{c.beginPath();c.arc(cx,cy,R,ang(a),ang(b));c.strokeStyle=col;c.lineWidth=9;c.stroke();};
  arc(0,2,'#2f9e63');arc(2,4,'#d99a2b');arc(4,8,'#c8402c');
  c.fillStyle='#6b7288';c.font="8.5px 'IBM Plex Mono',monospace";c.textAlign='center';
  [0,2,4,8].forEach(v=>{const a=ang(v);c.fillText(v,cx+Math.cos(a)*(R+11),cy+Math.sin(a)*(R+11)+3);});
  const na=ang(des);c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(na)*(R-4),cy+Math.sin(na)*(R-4));c.strokeStyle='#fff';c.lineWidth=2.5;c.stroke();
  c.beginPath();c.arc(cx,cy,4,0,7);c.fillStyle='#fff';c.fill();
  const st=des<0.05?(des<-0.3?['subiendo','#7fd3ff']:['flotando','#7fd3ff']):des<=LIM.vy?['suave','#7fd3a0']:des<=4?['rápido','#ffb14a']:['peligroso','#ff7a5c'];
  c.fillStyle=st[1];c.font="600 13px 'IBM Plex Sans',sans-serif";c.fillText(st[0],cx,cy-14);
  c.fillStyle='#e7e9ef';c.font="500 11px 'IBM Plex Mono',monospace";c.fillText(fmt(Math.abs(des),1)+' m/s',cx,cy+16);
  c.fillStyle='#8a91a6';c.font="9.5px 'IBM Plex Sans',sans-serif";c.fillText('velocidad de bajada',cx,cy+30);
  c.textAlign='left';c.fillStyle='#6b7288';c.font="10px 'IBM Plex Sans',sans-serif";
  c.fillText(fly&&des>0.3?'suelo en ~'+fmt(alt/des)+' s':fly?'':'—',74,70);}
function instFrame(g){if(!g||!g.L)return;drawStick(g);drawAlti(g);const A=alarms(g);drawAlarm(g,A);cineFrame(g);soundFrame(g,A);popFrame(g);}
/* ================= REPETICIÓN EN 3 FOTOGRAMAS ================= */
const cineEl=document.getElementById('cine');
cineEl.innerHTML=`<div class="ct"><span>Repetición del aterrizaje</span><span>ilustración sobre el perfil real</span></div><div class="fr">${[0,1,2].map(i=>`<figure><canvas width="472" height="300"></canvas><figcaption></figcaption></figure>`).join('')}</div>`;
const cineFig=[...cineEl.querySelectorAll('figure')];let cineT=[];
function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,2246822507)^Math.imul(s^s>>>13,3266489909),(s^=s>>>16)>>>0)/4294967296);}
function lander(c,s,a,thr,broken){c.save();c.rotate(a);c.scale(s,s);c.lineCap='round';
  if(thr){const fl=c.createLinearGradient(0,-2.6,0,-8.5);fl.addColorStop(0,'rgba(255,240,200,.95)');fl.addColorStop(.4,'rgba(255,170,60,.9)');fl.addColorStop(1,'rgba(255,80,30,0)');
    c.beginPath();c.moveTo(-1.4,-2.6);c.lineTo(0,-8.5);c.lineTo(1.4,-2.6);c.closePath();c.fillStyle=fl;c.fill();}
  c.lineWidth=0.35;c.strokeStyle='#e8e9ee';c.beginPath();
  if(!broken){c.moveTo(-2.2,-1.6);c.lineTo(-LEGS[0],-LEGS[1]);c.moveTo(-LEGS[0]-0.8,-LEGS[1]);c.lineTo(-LEGS[0]+0.8,-LEGS[1]);}
  c.moveTo(2.2,-1.6);c.lineTo(LEGS[0],-LEGS[1]);c.moveTo(LEGS[0]-0.8,-LEGS[1]);c.lineTo(LEGS[0]+0.8,-LEGS[1]);c.stroke();
  c.fillStyle=broken?'#6b4a2a':'#8bd6ad';c.fillRect(-2.4,-2.6,4.8,2.6);c.fillStyle='rgba(0,0,0,.25)';for(let i=-2;i<2.4;i+=0.8)c.fillRect(i,-2.6,0.12,2.6);
  c.fillStyle=broken?'#4a4f5c':'#cfd5e6';c.beginPath();c.arc(0,1.4,2,Math.PI,0);c.fill();c.fillRect(-2,0,4,1.4);
  c.fillStyle=broken?'#222':'#2b3a55';c.fillRect(-0.9,0.4,1.8,0.8);
  if(broken){c.strokeStyle='#111';c.lineWidth=0.25;c.beginPath();c.moveTo(-1.5,1.6);c.lineTo(0.2,0.2);c.lineTo(-0.4,-1.2);c.lineTo(1.2,-2.4);c.stroke();}
  c.restore();}
function frame(cv,L,st,kind,seed){const c=cv.getContext('2d'),W=cv.width,H=cv.height,R=rng(seed),half=16,ppm=W/(half*2),gx0=st.x,base=H*0.74,g0=ground(L,gx0);
  const X=x=>(x-gx0)*ppm+W/2,Y=y=>base-(y-g0)*ppm;
  const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#020308');sky.addColorStop(1,'#0b0d16');c.fillStyle=sky;c.fillRect(0,0,W,H);
  for(let i=0;i<60;i++){c.fillStyle=`rgba(210,220,240,${.2+R()*.5})`;c.fillRect(R()*W,R()*H*0.6,1.2,1.2);}
  c.beginPath();c.arc(W*0.82,H*0.16,13,0,7);c.fillStyle='#2b6fd6';c.fill();c.beginPath();c.arc(W*0.82+3,H*0.16-2,7,0,7);c.fillStyle='rgba(120,190,120,.55)';c.fill();
  // terreno real alrededor del punto (mismo corte, misma escala del juego)
  c.beginPath();c.moveTo(0,H);for(let px=0;px<=W;px+=3){const x=gx0+(px-W/2)/ppm;c.lineTo(px,Y(ground(L,x)));}c.lineTo(W,H);c.closePath();
  const gr=c.createLinearGradient(0,base-40,0,H);gr.addColorStop(0,'#8a8d96');gr.addColorStop(1,'#2a2c33');c.fillStyle=gr;c.fill();
  c.strokeStyle='#c4c8d2';c.lineWidth=1.5;c.stroke();
  for(let i=0;i<70;i++){const px=R()*W,x=gx0+(px-W/2)/ppm,py=Y(ground(L,x))+4+R()*(H-Y(ground(L,x)));c.fillStyle=`rgba(${R()<.5?'40,42,50':'170,174,184'},${.25+R()*.35})`;c.beginPath();c.arc(px,py,0.8+R()*2.2,0,7);c.fill();}
  const lx=X(st.x),ly=Y(st.y),s=ppm;
  const dust=(n,spread,hgt,alpha)=>{for(let i=0;i<n;i++){const dx=(R()-.5)*2*spread,gy=Y(ground(L,st.x+dx/ppm));const r=6+R()*16;
      const gd=c.createRadialGradient(lx+dx,gy-R()*hgt,0,lx+dx,gy-R()*hgt,r);gd.addColorStop(0,`rgba(190,186,176,${alpha})`);gd.addColorStop(1,'rgba(190,186,176,0)');c.fillStyle=gd;c.fillRect(lx+dx-r,gy-hgt-r,r*2,hgt+r*2);}};
  if(kind==='approach'){if(st.thr)dust(26,70,18,.28);c.save();c.translate(lx,ly);c.scale(1,-1);lander(c,s,-st.a,st.thr,false);c.restore();}
  if(kind==='contact'){dust(st.ok?60:40,st.ok?120:80,st.ok?26:18,st.ok?.42:.35);
    c.save();c.translate(lx,ly);c.scale(1,-1);lander(c,s,-st.a,false,false);c.restore();
    if(!st.ok){for(let i=0;i<40;i++){const a=-Math.PI*R(),r=10+R()*60;c.strokeStyle=`rgba(255,${180+R()*60|0},80,${.5+R()*.5})`;c.lineWidth=1.2;c.beginPath();c.moveTo(lx,ly+LEGS[1]*s*0.6);c.lineTo(lx+Math.cos(a)*r,ly+LEGS[1]*s*0.6+Math.sin(a)*r);c.stroke();}}}
  if(kind==='result'){if(st.ok){dust(30,150,10,.22);c.save();c.translate(lx,ly);c.scale(1,-1);lander(c,s,-st.a,false,false);c.restore();
      c.strokeStyle='#cfd5e6';c.lineWidth=1.2;c.beginPath();c.moveTo(lx+s*6,Y(ground(L,st.x+6))); c.lineTo(lx+s*6,Y(ground(L,st.x+6))-34);c.stroke();
      c.fillStyle='#22d3ee';c.fillRect(lx+s*6,Y(ground(L,st.x+6))-34,16,10);
      c.fillStyle='rgba(143,240,181,.95)';c.font='600 22px IBM Plex Sans,sans-serif';c.textAlign='center';c.fillText('✓',lx,ly-s*7);}
    else{const gy=Y(ground(L,st.x));
      for(let i=0;i<14;i++){const r=10+R()*26,dx=(R()-.5)*90,dy=-R()*60;c.fillStyle=`rgba(${30+R()*30|0},${30+R()*30|0},${35+R()*30|0},${.5+R()*.4})`;c.beginPath();c.arc(lx+dx,gy-20+dy,r,0,7);c.fill();}
      const fb=c.createRadialGradient(lx,gy-14,2,lx,gy-14,70);fb.addColorStop(0,'rgba(255,255,230,1)');fb.addColorStop(.25,'rgba(255,214,90,.95)');fb.addColorStop(.55,'rgba(255,110,30,.8)');fb.addColorStop(1,'rgba(160,30,10,0)');
      c.fillStyle=fb;c.beginPath();c.arc(lx,gy-14,70,0,7);c.fill();
      c.save();c.translate(lx+s*3,gy-s*1.6);c.scale(1,-1);lander(c,s,-0.9-st.a,false,true);c.restore();
      for(let i=0;i<18;i++){const a=-Math.PI*(0.05+R()*0.9),r=40+R()*80,px=lx+Math.cos(a)*r,py=gy-14+Math.sin(a)*r;
        c.save();c.translate(px,py);c.rotate(R()*6);c.fillStyle=R()<.5?'#8bd6ad':'#9aa3bd';c.fillRect(-3,-2,4+R()*7,2+R()*4);c.restore();}
      c.fillStyle='rgba(255,138,112,.95)';c.font='600 22px IBM Plex Sans,sans-serif';c.textAlign='center';c.fillText('✗',lx,gy-86);}}
  c.fillStyle='rgba(7,8,12,.7)';c.fillRect(0,H-22,W,22);c.fillStyle='#8a91a6';c.font='11px IBM Plex Mono,monospace';c.textAlign='left';
  c.fillText(`pendiente real ${fmt(slopeAt(L,st.x),1)}°`,8,H-7);c.textAlign='right';c.fillText(['A 5 m','CONTACTO','RESULTADO'][['approach','contact','result'].indexOf(kind)],W-8,H-7);}
function cineHide(){cineT.forEach(clearTimeout);cineT=[];cineEl.classList.remove('show');gmsg.classList.remove('low');}
function cineShow(g,vy0,ang,pad,sreal,why){cineHide();finPending=placeInfo(g,vy0,ang,pad,sreal,why);sfxLand(!why.length);const L=g.L,ok=!why.length,seed=(Date.now()&0xffff)+1;
  const s5=g.snap5||{x:g.x,y:ground(L,g.x)+5+LEGS[1],a:g.a,vy:vy0,vx:g.vx,thr:false};
  const sc={x:g.x,y:g.y,a:g.a,ok},sr={x:g.x,y:ground(L,g.x)+LEGS[1],a:ok?0:g.a,ok};
  const cap=[`<b>1 · a 5 m</b><br>bajando ${fmt(Math.abs(s5.vy),1)} m/s · lateral ${fmt(Math.abs(s5.vx),1)} m/s`,
    `<b>2 · contacto</b><br>${fmt(Math.abs(vy0),1)} m/s · ${fmt(ang)}° de inclinación`,
    ok?`<b class="ok">3 · aterrizaje válido</b><br>polvo lunar · pendiente ${fmt(sreal,1)}°`:`<b class="bad">3 · módulo destruido</b><br>${why[0].replace(/ \(.*\)/,'')}`];
  [[s5,'approach'],[sc,'contact'],[sr,'result']].forEach(([st,k],i)=>{const f=cineFig[i];f.classList.remove('on');frame(f.querySelector('canvas'),L,st,k,seed+i);f.querySelector('figcaption').innerHTML=cap[i];});
  cineEl.classList.add('show');gmsg.classList.add('low');popEl.classList.add('show');cineEl.style.zoom='';const cw0=cineEl.offsetWidth,av=tEl.clientWidth-40;if(cw0>av)cineEl.style.zoom=(av/cw0).toFixed(3);
  cineFig.forEach((f,i)=>cineT.push(setTimeout(()=>{f.classList.add('on');},150+i*650)));}
function cineFrame(g){if(g.state==='fly'){if(cineEl.classList.contains('show'))cineHide();
    const alt=g.y-ground(g.L,g.x);if(!g.snap5&&alt<=5+LEGS[1])g.snap5={x:g.x,y:g.y,a:g.a,vy:g.vy,vx:g.vx,thr:g.thr};}
  else if(g.state==='ready'&&cineEl.classList.contains('show'))cineHide();}
/* ================= MENSAJE FINAL: física, lugar, energía y comunicación ================= */
const RM=1737400,CURIO=['En los cráteres con sombra permanente cerca del polo sur se midieron temperaturas cercanas a −240 °C, de las más bajas del sistema solar.',
 'Ese frío permanente puede conservar hielo de agua: por eso el polo sur lunar es el destino de las próximas misiones tripuladas.',
 'Algunas crestas cerca del polo sur reciben luz solar más del 80 % del tiempo: son los mejores lugares para paneles solares.',
 'Un día lunar dura 29,5 días terrestres: en el ecuador son unas dos semanas de luz y dos de noche; en el polo, el Sol gira rasante alrededor del horizonte.',
 'Sin atmósfera, el polvo que levanta el motor no frena con el aire: sale en línea recta a cientos de metros por segundo.',
 'La gravedad lunar es 1/6 de la terrestre: el mismo módulo pesa en la Luna lo que pesaría un sexto en la Tierra.'];
function horizon(r,c,di,dj){const h0=HG[r*NG+c]+2;let best=-90;
  for(let k=1;k<400;k++){const i=r+di*k,j=c+dj*k;if(i<0||j<0||i>=NG||j>=NG)break;const dd=k*100*Math.hypot(di,dj);
    const a=Math.atan((HG[i*NG+j]-h0-dd*dd/(2*RM))/dd)*180/Math.PI;if(a>best)best=a;}return best;}
function placeInfo(g,vy0,ang,pad,sreal,why){const L=g.L,s=L.s,ok=!why.length,v=Math.abs(vy0),vx=Math.abs(g.vx),f=x=>fmt(x,1);
  const j0=Math.max(0,Math.min(159,Math.round(g.x/L.dxm))),r=s.r*160+L.row,c=s.c*160+j0;
  const e=v*v/2,eLim=LIM.vy*LIM.vy/2,codes=why.map(w=>w.startsWith('velocidad vertical')?'vy':w.startsWith('velocidad horizontal')?'vx':w.startsWith('nave')?'ang':'pad');
  // física
  let fis=[];
  if(ok)fis.push(`Tocaste a <b>${f(v)} m/s</b>: el choque fue de ${f(e)} J por kg, dentro de los ${f(eLim)} J/kg que absorben las patas. Te sobró ${fmt(g.fuel)} % de combustible.`);
  if(codes.includes('vy')){const dist=(v*v-LIM.vy*LIM.vy)/(2*(THR-G0));
    fis.push(`Tocaste a <b>${f(v)} m/s</b>: el choque fue de ${f(e)} J por kg, <b>${fmt(e/eLim)} veces</b> lo que absorben las patas. `+(g.fuel<=0?`Te quedaste sin combustible y caíste libre con g = 1,62 m/s².`:`Con el motor a fondo frenás ${f(THR-G0)} m/s por segundo: para llegar a 2 m/s tenías que empezar a frenar unos ${fmt(dist)} m antes.`));}
  if(codes.includes('vx'))fis.push(`Ibas de costado a <b>${f(vx)} m/s</b>: al tocar, una pata se clava y la nave vuelca. Inclinando la nave hacia el lado contrario, el empuje frena el movimiento horizontal.`);
  if(codes.includes('ang'))fis.push(`Estabas inclinado <b>${fmt(ang)}°</b>: el centro de masa queda afuera de la base de las patas y la nave se tumba. Hay que enderezarla antes de los últimos 10 m.`);
  if(codes.includes('pad'))fis.push(sreal>=8?`El suelo tenía una pendiente real de <b>${f(sreal)}°</b>: con más de 8° la nave se desliza o vuelca.`:`El suelo era plano (${f(sreal)}°) pero el tramo era demasiado corto para apoyar las dos patas.`);
  // lugar
  const rank=[...GR.sites].sort((a,b)=>b.p10-a.p10).indexOf(s)+1,med=[...GR.sites].map(q=>q.p10).sort((a,b)=>a-b)[12];
  const lugar=`<b>${s.id}</b>${s.real?' (terreno real, LOLA)':' (terreno simulado)'}: ${fmt(s.p10)} % del sitio tiene pendiente &lt; 10° (puesto ${rank} de 25), pendiente mediana ${f(s.smed)}°, mayor zona plana de ${f(s.flat)} km². `+
    (s.p10>=med?'Es <b>más plano que la mayoría</b> de los sitios: buen candidato para bajar.':'Es <b>más accidentado que la mayoría</b>: hay que elegir bien la plataforma.')+
    ` Donde tocaste: pendiente ${f(sreal)}°${pad?`, sobre una plataforma de ${fmt(pad.len)} m`:', fuera de las plataformas'}.`;
  // energía: horizonte en 8 direcciones vs Sol (≤ 1,5°)
  const D8=[[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1]],H8=D8.map(([a,b])=>horizon(r,c,a,b)),sunB=H8.filter(h=>h>1.5).length;
  const ene=`El Sol nunca sube más de ~1,5° y da la vuelta completa al horizonte cada 29,5 días. Desde este punto, el relieve lo tapa en <b>${sunB} de 8 direcciones</b> (horizonte máximo ${f(Math.max(...H8))}°): `+
    (sunB<=2?'tendrías sol buena parte del mes; los paneles van verticales y siguiendo al Sol.':sunB<=5?'tendrías sol a ratos: hacen falta baterías para las horas de sombra.':'quedaría a la sombra casi todo el mes: haría falta otra fuente de energía.');
  // comunicación: la Tierra está hacia el meridiano 0 (+y en la grilla)
  const x=s.x0+(j0+0.5)*100,y=L.yreal,[lat,lon]=inv(x,y),e0=(90-Math.abs(lat))*Math.cos(lon*DEG),hE=horizon(r,c,-1,0);
  const frac=Math.max(0,Math.min(1,Math.acos(Math.max(-1,Math.min(1,(hE-e0)/6.7)))/Math.PI));
  const com=`La Tierra nunca sube más de ~${fmt(e0+6.7)}° sobre el horizonte acá y, por la libración, aparece y se esconde cada ~27 días. Hacia la Tierra el relieve sube hasta ${f(hE)}°: tendrías <b>enlace directo ~${fmt(frac*100)} % del tiempo</b>`+
    (frac<0.35?'; haría falta un satélite relé.':frac<0.6?'; conviene sumar un satélite relé.':'.')+` Cada mensaje tarda ~1,3 s en llegar (2,6 s ida y vuelta).`;
  const cur=CURIO[Math.floor(Math.random()*CURIO.length)];
  const lessons=[
   {icon:'↓',title:'Bajá despacito',value:f(v)+' m/s',limit:'Meta: hasta '+LIM.vy+' m/s',good:v<=LIM.vy,tip:'Encendé el motor antes de estar cerca del suelo. No esperes al último segundo.'},
   {icon:'↔',title:'Frená de costado',value:f(vx)+' m/s',limit:'Meta: hasta '+LIM.vx+' m/s',good:vx<=LIM.vx,tip:'Incliná un poco la nave hacia el lado contrario al movimiento y luego enderezala.'},
   {icon:'↥',title:'Llegá derechito',value:fmt(ang)+'°',limit:'Meta: hasta '+LIM.ang+'°',good:ang<=LIM.ang,tip:'Enderezá el módulo antes de tocar: las dos patas necesitan apoyar juntas.'},
   {icon:'▱',title:'Buscá una plataforma',value:f(sreal)+'°',limit:'Meta: las dos patas en celeste',good:!!pad,tip:'Apuntá al centro de un tramo celeste. Un punto llano puede ser demasiado angosto.'}
  ];
  const next=lessons.find(q=>!q.good);
  const tip=ok?'¡Gracias, me salvaste! ¡Sabía que podías lograrlo! Bajaste suave y apoyaste las dos patas. Ahora podemos continuar.':next.tip;
  return `<section class="landing-lesson"><div class="landing-cat"><img src="../assets/felicette-terrain.png" alt="Félicette te acompaña"><div><span>FÉLICETTE · APRENDEMOS EN CADA INTENTO</span><h3>${ok?'¡Lo logramos!':'¡Probemos una vez más!'}</h3><p>${tip}</p></div></div>
  <div class="landing-checks">${lessons.map(q=>`<article class="${q.good?'passed':'practice'}"><span class="lesson-symbol" aria-hidden="true">${q.icon}</span><h4>${q.title}</h4><strong>${q.value}</strong><small>${q.limit}</small><b>${q.good?'✓ Lo lograste':'↻ Para practicar'}</b></article>`).join('')}</div>
  <div class="landing-world"><article><h4>☀ ¿Y la energía?</h4><p>Las montañas pueden tapar el Sol. Cuando no llega luz al panel, el rover necesita una batería.</p><div class="horizon-picture" aria-label="Sol bajo, montaña y panel"><span>☀</span><i>◢</i><b>▱ → ▰</b></div></article><article><h4>🌍 ¿Cómo volvemos a hablar?</h4><p>Necesitamos ver la Tierra por encima de las montañas. Si queda tapada, guardamos los datos o usamos un relé.</p><div class="radio-picture" aria-label="Antena, obstáculo y Tierra">📡 · · · ◢ · · 🌍</div></article></div>
  ${ok?`<video class="landing-celebration" controls playsinline muted ${matchMedia('(prefers-reduced-motion: reduce)').matches?'':'autoplay'} preload="metadata" poster="../assets/videos/final-exploracion_portada.jpg" src="../assets/videos/final-exploracion.mp4" aria-label="Félicette celebra: sabía que podías lograrlo"></video>`:''}
  <details class="landing-science"><summary>Ver los datos de mi intento y del terreno</summary><div class="fin"><div><h4>Mi alunizaje</h4>${fis.map(p=>'<p>'+p+'</p>').join('')}</div><div><h4>El lugar</h4><p>${lugar}</p></div><div><h4>Energía · modelo simplificado</h4><p>${ene}</p></div><div><h4>Comunicación · modelo simplificado</h4><p>${com}</p></div></div><p>Estimaciones didácticas con relieve muestreado a 100 m; parte del horizonte puede usar sitios vecinos simulados. Los porcentajes no son ventanas calculadas con efemérides. Compará tu plan en el laboratorio.</p></details><p class="landing-note">Los límites son reglas de este juego, no una certificación de seguridad para una misión real.</p></section>`;}

let finPending=null;const _showMsg=showMsg;showMsg=function(h){if(finPending){h=h+finPending;finPending=null;gmsg.classList.add('wide');}else gmsg.classList.remove('wide');_showMsg(h);};
/* ================= SONIDOS ================= */
let engG=null,lastPing=0;
function audioGraph(){if(!AC||engG)return;try{const n=AC.sampleRate*2,b=AC.createBuffer(1,n,AC.sampleRate),dd=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+0.02*(Math.random()*2-1))/1.02;dd[i]=l*3.5;}
  const src=AC.createBufferSource();src.buffer=b;src.loop=true;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320;engG=AC.createGain();engG.gain.value=0;src.connect(lp).connect(engG).connect(AC.destination);src.start();}catch(e){engG=null;}}
function tone(f,dur,type,vol,f2){if(!AC||muted)return;try{if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),v=AC.createGain(),t=AC.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(vol||0.1,t+0.01);v.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(v).connect(AC.destination);o.start(t);o.stop(t+dur+0.02);}catch(e){}}
function boom(){if(!AC||muted)return;try{const n=AC.sampleRate*1.4,b=AC.createBuffer(1,n,AC.sampleRate),dd=b.getChannelData(0);for(let i=0;i<n;i++)dd[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5);
  const s=AC.createBufferSource();s.buffer=b;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(1800,AC.currentTime);lp.frequency.exponentialRampToValueAtTime(120,AC.currentTime+1.2);const v=AC.createGain();v.gain.value=0.5;s.connect(lp).connect(v).connect(AC.destination);s.start();}catch(e){}tone(70,1.1,'sine',0.35,30);}
function sfxLand(ok){if(ok){tone(95,0.25,'sine',0.25,60);[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.35,'triangle',0.09),250+i*120));}else boom();}
function soundFrame(g,A){if(!AC||muted){if(engG)engG.gain.value=0;return;}audioGraph();if(!engG)return;
  const on=g.thr&&g.state==='fly'&&mode==='game';engG.gain.setTargetAtTime(on?0.22:0,AC.currentTime,0.05);
  if(g.state==='fly'&&A.lvl!=='red'){const alt=g.y-ground(g.L,g.x),now=performance.now();if(alt<60&&now-lastPing>120+alt*14){lastPing=now;tone(1500,0.05,'sine',0.05);}}}
/* ================= OBJETIVOS (lateral derecho) Y VENTANA EMERGENTE ================= */
const goalsEl=document.getElementById('goals'),popEl=document.getElementById('popwrap');
popEl.appendChild(cineEl);popEl.appendChild(gmsg);
let gFrame=0;
function renderGoals(g){const L=g.L,ready=g.state==='ready',done=g.state==='done'&&lastRec,R=done?lastRec:null;
  const vy=R?R.vy:Math.abs(g.vy),vx=R?R.vx:Math.abs(g.vx),an=R?R.ang:Math.abs(g.a*180/Math.PI),sl=R?R.slope:slopeAt(L,g.x),padOk=R?!R.why.includes('pad'):sl<8;
  const row=(lab,val,ok)=>ready?`<span>${lab}</span><b class="na">—</b><span class="na">·</span>`:`<span>${lab}</span><b class="${ok?'ok':'bad'}">${val}</b><span class="${ok?'ok':'bad'}">${ok?'✓':'✗'}</span>`;
  goalsEl.innerHTML=`<h4>${done?'Resultado del contacto':'Objetivos para un buen alunizaje'}</h4>
   <div class="chk">${row('descenso ≤ 2,0 m/s',fmt(vy,1),vy<=LIM.vy)}${row('lateral ≤ 1,2 m/s',fmt(vx,1),vx<=LIM.vx)}${row('inclinación ≤ 12°',fmt(an)+'°',an<=LIM.ang)}${row('pendiente real < 8°',fmt(sl,1)+'°',padOk)}</div>
   ${done?`<div class="verdict ${R.ok?'vok':'vbad'}">${R.ok?'✓ Aterrizaje válido':'✗ Módulo dañado'}</div>`:`<div class="gn">Apoyá las dos patas sobre una <b>plataforma celeste</b> cumpliendo las cuatro condiciones.</div>`}`;}
function popFrame(g){popEl.classList.toggle('show',!gmsg.hidden||cineEl.classList.contains('show'));if(++gFrame%3===0)renderGoals(g);}
const _sm2=setMode;setMode=function(m){_sm2(m);if(engG)engG.gain.value=0;};
window.__gameReady=true;
document.body.classList.add('lunares-game');
document.body.classList.toggle('embedded',embedded);
if(embedded){[...selA.options].forEach(o=>{if(o.value!==String(GR.sites.findIndex(s=>s.real))&&o.value!=='detail')o.remove();});}
document.getElementById('descentHelp').onclick=()=>document.getElementById('descentInfo').showModal();
document.getElementById('closeDescentInfo').onclick=()=>document.getElementById('descentInfo').close();
document.getElementById('exportDescent').onclick=()=>{const blob=new Blob([JSON.stringify({source:'Descenso perfecto — equipo Los Lunares',note:'Registros locales de simulación didáctica; no son observaciones ni envíos a NASA.',descensos:DS},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='los-lunares-descensos.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
addEventListener('blur',()=>{keys.left=keys.right=keys.up=false;});
document.addEventListener('visibilitychange',()=>{keys.left=keys.right=keys.up=false;if(game)game.last=null;});
setMode('game');




/* ================= loop ================= */
function resize(){fit(gR,gCam,gEl);fit(tR,tCam,tEl);}
new ResizeObserver(resize).observe(gEl);new ResizeObserver(resize).observe(tEl);resize();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function loop(now){requestAnimationFrame(loop);
  if(anim){let t=Math.min(1,(now-anim.t0)/2200),e=ease(t);
    // interpolación esférica de la posición para no atravesar la Luna
    const r0=anim.p0.length(),r1=anim.p1.length(),d=anim.p0.clone().normalize().lerp(anim.p1.clone().normalize(),e).normalize();
    const lift=Math.sin(Math.PI*e)*Math.max(0,Math.min(1.2,anim.p0.distanceTo(anim.p1)*0.35));
    gCam.position.copy(d.multiplyScalar(r0+(r1-r0)*e+lift));gCtl.target.lerpVectors(anim.q0,anim.q1,e);if(t>=1)anim=null;}
  const dist=gCam.position.distanceTo(C);const s=Math.max(0.006,dist*0.035)*(1+0.35*Math.sin(now/300));
  ring.scale.setScalar(s);ring.material.opacity=dist<0.06?0.35:0.95;pin.visible=dist>0.3;
  gCtl.update();tCtl.update();
  if(!embedded)gR.render(gS,gCam);if(mode==='relief')tR.render(tS,tCam);else gameFrame(now);
  place(tagSite,C.clone().multiplyScalar(dist>0.08?1.09:1.0004),gCam,gEl);
  const pv=poleV.clone();place(tagPole,pv,gCam,gEl);if(pv.clone().sub(gCam.position).dot(pv)>0)tagPole.style.display='none';
  if(C.clone().sub(gCam.position).dot(C)>0.0001)tagSite.style.display='none';
  if(poleTop)place(tagPoleT,poleTop,tCam,tEl);else tagPoleT.style.display='none';tagRealT.style.display='none';}
requestAnimationFrame(loop);
})();
