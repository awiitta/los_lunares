// Rescates narrativos: practicar no modifica los resultados físicos de la misión.
(function(){
 'use strict';
 const $=id=>document.getElementById(id), script=document.currentScript;
 const gameURL=new URL('index.html?embedded=1',script.src).href;
 let pending=null,round=0,handled=new Set(),reviewRequired=null;
 const dialog=document.createElement('dialog');dialog.className='rescue-dialog';dialog.id='felicetteRescue';dialog.setAttribute('aria-labelledby','rescueTitle');
 dialog.innerHTML=`<div class="rescue-story"><img src="assets/felicette-terrain.png" alt="Félicette pide tu ayuda"><div><span class="eyebrow">UNA AVENTURA CON FÉLICETTE</span><h2 id="rescueTitle"></h2><p id="rescueText"></p><p class="game-small">Es un rescate de nuestra historia: podés probar sin límite de tiempo.</p><button id="startRescue" class="primary">¡Voy a ayudarte! →</button><button id="rechooseRescue">Volver a elegir</button></div></div><iframe title="Rescate: encontrá una zona candidata" hidden></iframe>`;
 const exit=document.createElement('button');exit.type='button';exit.className='rescue-exit';exit.textContent='← Volver a las elecciones';dialog.prepend(exit);
 document.body.append(dialog);const frame=dialog.querySelector('iframe');exit.onclick=()=>rechoose();
 function stamp(){return JSON.stringify([mission.step,mission.goal,sites[mission.site],mission.date,mission.capacity,mission.tracking,mission.height,mission.store,RM.radius,RM.margin,RM.panelHeight]);}
 function problem(){const a=missionAnalysis();if(!a||!RM.ready)return null;let reason='',target=mission.step;const info=RM.terrain.inspect(sites[mission.site],RM.radius);
  if(mission.step===1&&info.slope>10)reason=`La pendiente de esta celda es ${info.slope.toFixed(1)}° y supera el límite de práctica de 10°. Busquemos un suelo menos inclinado.`;
  else if((mission.step===1||mission.step===2)&&a[mission.goal==='connect'?'earth':'light']<=0)reason=mission.goal==='connect'?'En este lugar y fecha no encontramos horas de Tierra visible en los siete días. Necesitamos cambiar el lugar o el momento.':'En este lugar y fecha no encontramos luz solar confirmada en los siete días. Probemos otro lugar o fecha para explorar con el panel.';
  else if(mission.step===3&&a.budget.unservedWh>.01)reason=`El rover necesita energía que esta configuración no alcanza a entregar: quedan ${Math.round(a.budget.unservedWh)} Wh sin cubrir. Probá otra batería, seguimiento solar, lugar o fecha.`;
  else if(mission.step===4&&(a.earth<=0||(!mission.store&&a.outage>0)))reason=a.earth<=0?'Podemos guardar las fotos, pero no hay una ventana para enviarlas en estos siete días. Cambiemos el lugar o la fecha.':`Elegiste comunicación continua, pero la Tierra queda oculta hasta ${a.outage} horas seguidas. Podemos guardar los datos y enviarlos después, o buscar otro escenario.`;
  else if(mission.step===5){if(a.budget.unservedWh>.01){target=3;reason=`Nos faltan ${Math.round(a.budget.unservedWh)} Wh para cubrir el consumo. Volvamos a energía para ajustar el plan.`;}else if(a.earth<=0||(!mission.store&&a.outage>0)){target=4;reason='La estrategia de comunicación todavía necesita una ventana compatible. Volvamos a la conexión.';}else if(info.slope>10){target=1;reason='El terreno supera el límite de pendiente de la práctica. Volvamos a elegir lugar.';}}
  return reason?{reason,target,key:stamp()}:null;
 }
 function narrative(p){dialog.dataset.playing='false';pending=p;frame.hidden=true;frame.removeAttribute('src');dialog.querySelector('.rescue-story').hidden=false;$('rescueTitle').textContent='¡Oh, no! Tenemos un contratiempo espacial.';$('rescueText').textContent=p.reason+' Ayudame a encontrar una zona candidata en el minijuego y después ajustamos esta elección.';$('startRescue').hidden=false;$('rechooseRescue').textContent='Volver a elegir';guideClosed=false;setGuideBubble('terrain','¡Necesito tu ayuda!',p.reason);if(!dialog.open)dialog.showModal();}
 function rechoose(){const p=pending;dialog.close();frame.removeAttribute('src');frame.hidden=true;if(p){handled.add(p.key);reviewRequired=p.key;mission.step=p.target;missionFeedback=null;}pending=null;renderMission();if(p){guideClosed=false;setGuideBubble('terrain','Volvamos a elegir.',p.reason);} $('gameStageTitle')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 $('rechooseRescue').onclick=rechoose;
 $('startRescue').onclick=()=>{dialog.dataset.playing='true';dialog.querySelector('.rescue-story').hidden=true;frame.hidden=false;frame.src=gameURL+'&sector='+(round++%4);};
 dialog.addEventListener('cancel',e=>{e.preventDefault();rechoose();});
 window.addEventListener('message',e=>{if(!dialog.open||!pending||frame.hidden||e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='lunar-terrain-complete'||e.data?.version!==1)return;handled.add(pending.key);dialog.dataset.playing='false';frame.hidden=true;frame.removeAttribute('src');dialog.querySelector('.rescue-story').hidden=false;$('rescueTitle').textContent='¡Gracias, me salvaste!';$('rescueText').textContent='Encontraste una zona candidata en la práctica. Ahora sabemos qué revisar: '+pending.reason+' El juego entrena tu mirada; todavía tenemos que cambiar la elección original.';$('startRescue').hidden=true;$('rechooseRescue').textContent='Volver a elegir y continuar →';$('rechooseRescue').focus();});
 const assess=assessDecision;
 assessDecision=function(key,before,after){const f=assess(key,before,after);if(!f||!after)return f;const metric=mission.goal==='connect'?'earth':'light';if((key==='site'||key==='date')&&after[metric]>0&&!(key==='site'&&RM.terrain.inspect(sites[mission.site],RM.radius).slope>10)){f.kind='neutral';f.title='Una opción para comparar.';f.reason=`Tenés ${after.light} h de luz y ${after.earth} h de Tierra visible en siete días. Tener menos horas que otra opción no vuelve incorrecta tu decisión: también importan el objetivo, la energía y el terreno.`;}return f;};
 const render=renderMission,next=$('gameNext').onclick,restart=$('restartMission').onclick;
 renderMission=function(...args){render.apply(this,args);const p=journeyStarted&&mission.step<6?problem():null;
  if(mission.step>=5){const list=$('gameContent').querySelector('.game-checklist');if(list){list.querySelector('h2').textContent='Tu plan, de un vistazo';$('gameContent').prepend(list);}}
  const final=$('missionFinalMovie');if(final){final.querySelector('h2').textContent='Tu aventura continúa.';final.querySelector('.mission-ending-reasons').hidden=true;}
  $('gameNext').onclick=()=>{const issue=problem();if(issue){narrative(issue);return;}reviewRequired=null;next();};
  if(p&&reviewRequired===p.key){$('gameNext').textContent='Elegí otra configuración para seguir';$('gameNext').disabled=true;}
  if(p&&missionFeedback?.kind==='caution'&&!handled.has(p.key)){handled.add(p.key);narrative(p);}
 };
 $('restartMission').onclick=()=>{pending=null;reviewRequired=null;handled.clear();if(dialog.open)dialog.close();frame.removeAttribute('src');restart();};
 window.addEventListener('hashchange',()=>{if(location.hash!=='#mission'&&dialog.open){dialog.close();frame.removeAttribute('src');pending=null;}});
 if(journeyStarted)renderMission();
})();
