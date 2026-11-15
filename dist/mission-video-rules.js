'use strict';
(function(root){
 const microNames=['objetivo','terreno','fecha','energia','conexion','plan'];
 const titles=['Tu objetivo ya tiene rumbo.','Conociste el terreno.','El tiempo también cambia la misión.','Panel y batería trabajan juntos.','Buscaste un camino hacia la Tierra.','Reuniste las decisiones de tu plan.'];
 function micro(step){if(!Number.isInteger(step)||step<0||step>5)return null;return{name:'cierre-'+microNames[step],title:titles[step],caption:'Una ilustración de lo aprendido. Tus elecciones y sus límites siguen en el plan; esta escena no significa que toda opción sea correcta.'};}
 function ending(plan,analysis,terrainSlope,limit=10){const reasons=[];
  if(!analysis||!analysis.budget||!Number.isFinite(analysis.budget.unservedWh)||!Number.isFinite(analysis.light)||!Number.isFinite(analysis.earth)||!Number.isFinite(analysis.outage))reasons.push('Faltan resultados válidos para revisar esta configuración.');
  else{if(analysis.budget.unservedWh>.01)reasons.push('El balance deja '+Math.round(analysis.budget.unservedWh)+' Wh de consumo sin cubrir.');if(analysis.earth<=0)reasons.push('No hay una ventana de Tierra visible confirmada en el período.');if(!plan.store&&analysis.outage>0)reasons.push('Pediste tiempo real, pero hay un corte de hasta '+analysis.outage+' h.');if(plan.goal==='explore'&&analysis.light<=0)reasons.push('Tu prioridad es la energía solar y no hay horas de luz confirmadas en el período.');}
  if(Number.isFinite(terrainSlope)&&terrainSlope>limit)reasons.push('La celda supera el criterio ilustrativo de pendiente de '+limit+'°.');
  if(reasons.length)return{name:'final-revisar',kind:'review',title:'Una oportunidad para mejorar tu plan.',caption:'Félicette y el rover revisan las decisiones. Probá otra combinación y mirá qué cambia.',reasons};
  return plan.goal==='connect'?{name:'final-comunicacion',kind:'communication',title:'Tu plan busca noticias para la Tierra.',caption:'Esta escena representa tu objetivo de comunicación. Una ventana geométrica no garantiza una estación ni un enlace de radio real.',reasons:[]}:{name:'final-exploracion',kind:'exploration',title:'Tu rover tiene un plan para explorar.',caption:'Esta escena representa tu objetivo de exploración. No simula un descenso real ni certifica un sitio de aterrizaje.',reasons:[]};
 }
 root.MissionVideoRules={micro,ending};
})(typeof window==='undefined'?globalThis:window);
