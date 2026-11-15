'use strict';
(function(root){
 function blocks(analysis,capacity,loadW){
  if(!analysis||analysis.samples.length!==168||analysis.budget.rows.length!==168)throw Error('Se necesitan siete días completos.');
  return Array.from({length:28},(_,i)=>{const start=i*6,end=start+6,rows=analysis.samples.slice(start,end);let powered=0;
   for(let h=start;h<end;h++){const stored=h===0?capacity:analysis.budget.rows[h-1].storedWh;if(stored+analysis.budget.rows[h].powerW+1e-7>=loadW)powered++;}
   const earthHours=rows.filter(s=>s.ev).length,sunHours=rows.filter(s=>s.sv).length;
   return {index:i,start,end,earthHours,sunHours,poweredHours:powered,compatible:earthHours===6&&powered===6};
  });
 }
 function assess(blocks,selection){const indices=[...new Set(selection)];if(indices.some(i=>!Number.isInteger(i)||i<0||i>=blocks.length))throw Error('Bloque fuera del período.');const good=indices.filter(i=>blocks[i].compatible),review=indices.filter(i=>!blocks[i].compatible);return{selected:indices.length,good,review,complete:good.length>0&&review.length===0};}
 const api={blocks,assess};root.DateWindowRules=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
