'use strict';
// Illustrative motion only: never changes a chosen mission date or simulation result.
window.LunaresMotion={attach(root,step,options={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),cue=document.createElement('div');cue.className='motion-cue';
 cue.innerHTML='<span>↔ Se puede mover · arrastrá o usá los botones</span><button type="button"></button>';(options.mount||root).append(cue);
 const button=cue.querySelector('button');let auto=!reduced.matches,visible=false,closed=false;
 function label(){button.textContent=auto?'❚❚ Pausar movimiento':'▶ Activar movimiento';button.setAttribute('aria-pressed',String(auto));options.onState?.(auto&&visible&&!document.hidden);}
 function stop(e){if(cue.contains(e.target))return;auto=false;label();}
 for(const type of ['pointerdown','wheel','keydown','input','change','click'])root.addEventListener(type,stop,{capture:true,passive:true});
 button.onclick=()=>{auto=!auto;label();};
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;label();});observer.observe(root);
 const timer=setInterval(()=>{if(!root.isConnected){destroy();return;}if(auto&&visible&&!document.hidden)step();},options.interval||100);
 function hidden(){label();}document.addEventListener('visibilitychange',hidden);
 function preference(){if(reduced.matches){auto=false;label();}}reduced.addEventListener('change',preference);
 function destroy(){if(closed)return;closed=true;clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',hidden);reduced.removeEventListener('change',preference);for(const type of ['pointerdown','wheel','keydown','input','change','click'])root.removeEventListener(type,stop,true);cue.remove();options.onState?.(false);}
 label();return{stop:()=>{auto=false;label();},destroy};
}};
