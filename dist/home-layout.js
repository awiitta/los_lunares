'use strict';
(function(){
 const home=document.getElementById('audienceWelcome'),scene=document.getElementById('spaceIntro'),copy=home.querySelector('.hub-copy');
 for(const id of ['earthModel','sunModel']){const model=document.getElementById(id);for(const name of ['poster','progress-bar']){const slot=document.createElement('span');slot.slot=name;slot.setAttribute('aria-hidden','true');model.append(slot);}model.addEventListener('load',()=>{model.dismissPoster?.();model.parentElement.classList.add('model-ready');});}
 const technicalDock=document.createElement('div');technicalDock.id='technicalSceneDock';scene.before(technicalDock);
 const dock=document.createElement('div');dock.id='homeSceneDock';copy.after(dock);
 // Reuse the complete viewer and its existing handlers; no second 3D scene is needed.
 copy.querySelectorAll('h1 br').forEach(br=>br.after(document.createTextNode(' ')));
 document.getElementById('homeWorlds')?.remove();home.querySelector('.worlds-caption')?.remove();
 const choices=home.querySelector('.audience-choices'),game=home.querySelector('.citizen-game-card');choices.insertBefore(game,choices.children[1]);
 game.querySelector('h2').textContent='¿Querés ayudar a NASA jugando?';game.querySelector('.citizen-copy>p').textContent='¡Félicette tiene una misión para vos! Pilotá el rover y explorá dónde podríamos alunizar.';game.querySelector('.eyebrow').textContent='MISIÓN ESPECIAL · TU CURIOSIDAD CUENTA';game.querySelector('.citizen-art span').textContent='¿Venís conmigo?';game.querySelector('#playHomeRover').textContent='🐾 ¡Quiero jugar con Félicette!';
 for(const card of choices.children){const ul=card.querySelector('ul');if(ul){const details=document.createElement('details');details.className='home-card-details';const summary=document.createElement('summary');summary.textContent='Qué vas a descubrir';details.append(summary,ul);const button=card.querySelector('button');button.before(details);}}
 function place(){const onHome=!home.hidden;document.body.classList.toggle('home-scene-open',onHome);if(onHome){if(scene.parentElement!==dock)dock.append(scene);scene.hidden=false;scene.classList.add('home-scene');}else{if(scene.parentElement===dock)technicalDock.after(scene);scene.classList.remove('home-scene');}}
 const observer=new MutationObserver(place);observer.observe(home,{attributes:true,attributeFilter:['hidden']});window.addEventListener('hashchange',place);place();
 const rover='<svg viewBox="0 0 100 64" fill="none" aria-hidden="true"><path d="M22 39h55l-6-21H33z" fill="#163b50" stroke="currentColor" stroke-width="2"/><path d="M43 18V6h16v12M64 18l12-9M20 40l-6 9m66-9 6 9M38 27h27" stroke="currentColor" stroke-width="3"/><path d="M35 32h30" stroke="#9cdbce" stroke-width="3"/><g fill="#0a1729" stroke="currentColor" stroke-width="3"><circle cx="20" cy="51" r="8"/><circle cx="49" cy="51" r="8"/><circle cx="79" cy="51" r="8"/></g></svg>';
 const screen='<svg viewBox="0 0 100 64" fill="none" aria-hidden="true"><rect x="13" y="5" width="74" height="44" rx="6" fill="#132b43" stroke="currentColor" stroke-width="2"/><path d="M39 59h22M50 49v10M23 36l13-12 12 6 16-13 12 5" stroke="currentColor" stroke-width="3"/><circle cx="66" cy="32" r="6" stroke="#9cdbce" stroke-width="2"/></svg>';
 for(const [card,svg]of [[choices.children[0],rover],[choices.children[2],screen]]){const art=document.createElement('div');art.className='home-route-art';art.innerHTML=svg;card.prepend(art);}
 choices.children[0].querySelector('h2').textContent='¡Tu primera misión lunar!';
 choices.children[0].querySelector('p').textContent='Elegí tu destino, prepará el rover y descubrí cómo darle energía y conexión. Félicette te acompaña paso a paso.';
 LunaresMotion.attach(scene,()=>{rotation+=.008;drawGlobe();},{mount:scene.querySelector('.globe-caption'),onState:auto=>{for(const id of ['earthModel','sunModel'])document.getElementById(id).autoRotate=auto;}});
 LunaresMotion.attach(document.getElementById('sunDialog'),()=>{},{mount:document.getElementById('sunDialog').querySelector('.sun-dialog-foot'),onState:auto=>{const model=document.getElementById('sunExpandedMount').querySelector('model-viewer');if(model)model.autoRotate=auto;}});
 const controls=document.getElementById('toControls'),old=controls.onclick;controls.onclick=e=>{if(!home.hidden){e.preventDefault();switchView('overview');place();requestAnimationFrame(()=>document.getElementById('missionControls').scrollIntoView({block:'start'}));}else old?.call(controls,e);};
})();
