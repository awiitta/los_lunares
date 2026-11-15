import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const engine=fs.readFileSync('dist/minijuego/descenso-engine.js','utf8');
// A user's start gesture must resume an existing suspended AudioContext.
let resumed=0;
const audio=vm.createContext({muted:false,AC:{state:'suspended',resume(){resumed++;}}});
vm.runInContext(engine.slice(engine.indexOf('function audioOn()'),engine.indexOf("addEventListener('keydown',()=>{if(mode==='game')audioOn();}")),audio);
vm.runInContext('audioOn()',audio);assert.equal(resumed,1);
audio.muted=true;vm.runInContext('audioOn()',audio);assert.equal(resumed,1);
assert.match(engine,/function start\(\)\{audioOn\(\)/);
// Preserve the original engine, alarm, explosion and success sound implementation.
const original=fs.readFileSync('fuentes/descenso-v4-original/site01_luna3d.html','utf8');
for(const [start,end] of [['function boom()','function sfxLand('],['function sfxLand(','function soundFrame(']]){
 assert.equal(engine.slice(engine.indexOf(start),engine.indexOf(end,engine.indexOf(start))),original.slice(original.indexOf(start),original.indexOf(end,original.indexOf(start))));
}
// Each landing gives four independent checks and an actionable first failed criterion.
const sites=Array.from({length:25},(_,i)=>({id:'Site'+i,p10:50,smed:3,flat:10}));
const report=vm.createContext({GR:{sites},Math,LIM:{vy:2,vx:1.2,ang:12},THR:4.3,G0:1.62,DEG:Math.PI/180,fmt:(v,d=0)=>Number(v).toFixed(d),inv:()=>[-89,0],horizon:()=>0,CURIO:['dato'],matchMedia:()=>({matches:false})});
vm.runInContext(engine.slice(engine.indexOf('function placeInfo('),engine.indexOf('let finPending=')),report);
const g={L:{s:sites[0],dxm:100,row:1,yreal:-12000},x:100,vx:3,fuel:60};sites[0].r=0;sites[0].c=0;sites[0].x0=-18000;
let html=report.placeInfo(g,-8,15,null,12,['velocidad vertical 8','velocidad horizontal 3','nave inclinada 15','fuera de plataforma']);
assert.equal((html.match(/class="practice"/g)||[]).length,4);assert.match(html,/Encendé el motor antes/);assert.match(html,/<details class="landing-science">/);assert.doesNotMatch(html,/<video/);
g.vx=.4;html=report.placeInfo(g,-1,2,{len:100},3,[]);
assert.equal((html.match(/class="passed"/g)||[]).length,4);assert.match(html,/Gracias, me salvaste/);assert.match(html,/final-exploracion.mp4/);
// Auto motion pauses on interaction and when hidden, resumes only through its button.
const listeners=new Map(),button={setAttribute(){}},cue={className:'',contains:t=>t===button,querySelector:()=>button,remove(){}};
const root={isConnected:true,append(){},addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t)};
let observer,interval,steps=0,cleared=false;
const doc={hidden:false,createElement:()=>cue,addEventListener(){},removeEventListener(){}};
const motion=vm.createContext({window:{},document:doc,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),IntersectionObserver:class{constructor(f){observer=f;}observe(){}disconnect(){}},setInterval:f=>(interval=f,1),clearInterval:()=>{cleared=true;}});
vm.runInContext(fs.readFileSync('dist/motion-hints.js','utf8'),motion);
const control=motion.window.LunaresMotion.attach(root,()=>steps++);
interval();assert.equal(steps,0);observer([{isIntersecting:true}]);interval();assert.equal(steps,1);
listeners.get('click')({target:{}});interval();assert.equal(steps,1);button.onclick();interval();assert.equal(steps,2);
doc.hidden=true;interval();assert.equal(steps,2);control.destroy();assert.equal(cleared,true);assert.equal(listeners.size,0);
// Every deployed clip matches the exact supplied binary recorded in the manifest.
const {createHash}=await import('node:crypto');
for(const row of JSON.parse(fs.readFileSync('dist/assets/videos/manifest.json'))){const bytes=fs.readFileSync('dist/assets/videos/'+row.name+'.mp4');assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);}
console.log('OK: audio original y desbloqueo, cuatro pistas, celebración solo al ganar, pausa/resumen del movimiento y 9 videos íntegros.');
