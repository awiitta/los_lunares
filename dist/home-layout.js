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
 const controls=document.getElementById('toControls'),old=controls.onclick;controls.onclick=e=>{if(!home.hidden){e.preventDefault();switchView('overview');place();requestAnimationFrame(()=>document.getElementById('missionControls').scrollIntoView({block:'start'}));}else old?.call(controls,e);};
})();
