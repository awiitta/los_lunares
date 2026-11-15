/* Traducciones locales; sin servicios externos ni cambios de unidades científicas. */
(()=>{'use strict';
const script=document.currentScript,base=new URL('.',script.src),supported=['es','en','pt'],key='los-lunares-language';let lang='es';try{const saved=localStorage.getItem(key);if(supported.includes(saved))lang=saved;}catch{}const catalogue=new Map(),upperCatalogue=new Map(),original=new WeakMap(),attributes=new WeakMap();let ready=false,scheduled=false,fragments=[];const normal=s=>s.replace(/\s+/g,' ').trim();
const patterns=[
 [/^Día (\d+)$/,(m)=>lang==='en'?`Day ${m[1]}`:`Dia ${m[1]}`],
 [/^hasta (\d\d:\d\d)$/,(m)=>lang==='en'?`until ${m[1]}`:`até ${m[1]}`],
 [/^(\d+) bloques elegidos · (\d+) horas propuestas\. Esta selección es una práctica, no una reserva de enlace\.$/,(m)=>lang==='en'?`${m[1]} blocks selected · ${m[2]} proposed hours. This selection is practice, not a link reservation.`:`${m[1]} blocos escolhidos · ${m[2]} horas propostas. Esta seleção é uma prática, não uma reserva de enlace.`],
 [/^Tenés (\d+) h de luz y (\d+) h de Tierra visible en siete días\. Tener menos horas que otra opción no vuelve incorrecta tu decisión: también importan el objetivo, la energía y el terreno\.$/,(m)=>lang==='en'?`You have ${m[1]} h of sunlight and ${m[2]} h of Earth visibility over seven days. Fewer hours do not make your choice incorrect: the goal, energy and terrain also matter.`:`Você tem ${m[1]} h de luz e ${m[2]} h de Terra visível em sete dias. Ter menos horas não torna sua decisão incorreta: objetivo, energia e terreno também importam.`],
 [/^El modelo estima (.+) W de generación\. Revisá si alcanza para el consumo y si queda energía para guardar\.(.*)$/,(m,t)=>(lang==='en'?`The model estimates ${m[1]} W of generation. Check whether it covers the load and leaves energy to store.`:`O modelo estima ${m[1]} W de geração. Veja se cobre o consumo e se sobra energia para guardar.`)+(m[2]?' '+t(m[2].trim()):'')],
 [/^Elevación (.+)° · azimut (.+)°$/,(m)=>lang==='en'?`Elevation ${m[1]}° · azimuth ${m[2]}°`:`Elevação ${m[1]}° · azimute ${m[2]}°`],
 [/^(\d{1,2}) de (\w+) de (\d{4}), (\d{2}):(\d{2}) UTC$/,(m)=>{const months=['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic'];const month=months.indexOf(m[2]);return month<0?m[0]:new Intl.DateTimeFormat(lang==='en'?'en-GB':'pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC',hour12:false}).format(new Date(Date.UTC(+m[3],month,+m[1],+m[4],+m[5])))+' UTC';}],
 [/^Probá ([A-D][1-4]): tiene (.+)% de píxeles bajo 8° y (.+) m de relieve local\. Seleccionalo y revisá tu elección\.$/,(m)=>lang==='en'?`Try ${m[1]}: ${m[2]}% of pixels are below 8° and local relief is ${m[3]} m. Select it and review your choice.`:`Teste ${m[1]}: tem ${m[2]}% dos pixels abaixo de 8° e ${m[3]} m de relevo local. Selecione e revise sua escolha.`],
 [/^([A-D][1-4]): pendiente mediana (.+)°\. (.+)% de píxeles bajo 8°\. Relieve local P95–P5: (.+) m\.$/,(m)=>lang==='en'?`${m[1]}: median slope ${m[2]}°. ${m[3]}% of pixels below 8°. Local relief P95–P5: ${m[4]} m.`:`${m[1]}: inclinação mediana ${m[2]}°. ${m[3]}% dos pixels abaixo de 8°. Relevo local P95–P5: ${m[4]} m.`],
 [/^([A-D][1-4]): (.+)% de píxeles bajo 8° y (.+) m de relieve local\.$/,(m)=>lang==='en'?`${m[1]}: ${m[2]}% of pixels below 8° and ${m[3]} m local relief.`:`${m[1]}: ${m[2]}% dos pixels abaixo de 8° e ${m[3]} m de relevo local.`],
 [/^Fecha aplicada: (.+)\.$/,(m)=>lang==='en'?`Applied date: ${translate(m[1])}.`:`Data aplicada: ${translate(m[1])}.`],
 [/^Cuadrante ([A-D][1-4])(, seleccionado)?$/,(m)=>lang==='en'?`Cell ${m[1]}${m[2]?', selected':''}`:`Quadrante ${m[1]}${m[2]?', selecionado':''}`],
 [/^DECISIÓN (\d+) DE (\d+) · (.+)$/,(m,t)=>lang==='en'?`DECISION ${m[1]} OF ${m[2]} · ${t(m[3])}`:`DECISÃO ${m[1]} DE ${m[2]} · ${t(m[3])}`],
 [/^Decisión (\d+) de (\d+)$/,(m)=>lang==='en'?`Decision ${m[1]} of ${m[2]}`:`Decisão ${m[1]} de ${m[2]}`],
 [/^ANTES DE EMPEZAR · DECISIÓN (\d+) DE (\d+)$/,(m)=>lang==='en'?`BEFORE YOU START · DECISION ${m[1]} OF ${m[2]}`:`ANTES DE COMEÇAR · DECISÃO ${m[1]} DE ${m[2]}`],
 [/^Sector (\d+) de Site01$/,(m)=>lang==='en'?`Site01 sector ${m[1]}`:`Setor ${m[1]} de Site01`],
 [/^(\d+) cuadrantes? seleccionados?$/,(m)=>lang==='en'?`${m[1]} cell${m[1]==='1'?'':'s'} selected`:`${m[1]} quadrante${m[1]==='1'?'':'s'} selecionado${m[1]==='1'?'':'s'}`],
 [/^Site01 · corte (\d+)\/(\d+)$/,(m)=>lang==='en'?`Site01 · profile ${m[1]}/${m[2]}`:`Site01 · perfil ${m[1]}/${m[2]}`],
 [/^Descenso perfecto · (.+)$/,(m)=>lang==='en'?`Perfect Descent · ${m[1]}`:`Descida perfeita · ${m[1]}`],
 [/^Otro corte \((\d+)\/(\d+)\)$/,(m)=>lang==='en'?`Another profile (${m[1]}/${m[2]})`:`Outro perfil (${m[1]}/${m[2]})`],
 [/^Site01 \(real\) · (.+) % <10°$/,(m)=>lang==='en'?`Site01 (real) · ${m[1]} % <10°`:`Site01 (real) · ${m[1]} % <10°`],
 [/^Site01 · detalle 5 m \(real\)$/,(m)=>lang==='en'?'Site01 · 5 m detail (real)':'Site01 · detalhe 5 m (real)'],
 [/^Velocidad vertical ≤ (.+) m\/s y horizontal ≤ (.+) m\/s$/,(m)=>lang==='en'?`Vertical speed ≤ ${m[1]} m/s and horizontal speed ≤ ${m[2]} m/s`:`Velocidade vertical ≤ ${m[1]} m/s e horizontal ≤ ${m[2]} m/s`],
 [/^Nave derecha \(± (.+)°\)$/,(m)=>lang==='en'?`Keep the module upright (± ${m[1]}°)`:`Mantenha o módulo na vertical (± ${m[1]}°)`],
 [/^descenso ≤ (.+) m\/s$/,(m)=>lang==='en'?`descent ≤ ${m[1]} m/s`:`descida ≤ ${m[1]} m/s`],
 [/^lateral ≤ (.+) m\/s$/,(m)=>`lateral ≤ ${m[1]} m/s`],
 [/^inclinación ≤ (.+)°$/,(m)=>lang==='en'?`tilt ≤ ${m[1]}°`:`inclinação ≤ ${m[1]}°`],
 [/^pendiente real < (.+)°$/,(m)=>lang==='en'?`real slope < ${m[1]}°`:`inclinação real < ${m[1]}°`],
 [/^pendiente real (.+)°$/,(m)=>lang==='en'?`real slope ${m[1]}°`:`inclinação real ${m[1]}°`],
 [/^suelo en ~(.+) s$/,(m)=>lang==='en'?`ground in ~${m[1]} s`:`solo em ~${m[1]} s`],
 [/^IMPACTO EN ~(.+) s$/,(m)=>lang==='en'?`IMPACT IN ~${m[1]} s`:`IMPACTO EM ~${m[1]} s`],
 [/^bajando (.+) m\/s · lateral (.+) m\/s$/,(m)=>lang==='en'?`descending ${m[1]} m/s · lateral ${m[2]} m/s`:`descendo ${m[1]} m/s · lateral ${m[2]} m/s`],
 [/^(.+) m\/s · (.+)° de inclinación$/,(m)=>lang==='en'?`${m[1]} m/s · ${m[2]}° tilt`:`${m[1]} m/s · ${m[2]}° de inclinação`],
 [/^velocidad vertical (.+) m\/s \(máx\. (.+)\)$/,(m)=>lang==='en'?`vertical speed ${m[1]} m/s (max. ${m[2]})`:`velocidade vertical ${m[1]} m/s (máx. ${m[2]})`],
 [/^velocidad horizontal (.+) m\/s \(máx\. (.+)\)$/,(m)=>lang==='en'?`horizontal speed ${m[1]} m/s (max. ${m[2]})`:`velocidade horizontal ${m[1]} m/s (máx. ${m[2]})`],
 [/^nave inclinada (.+)° \(máx\. (.+)°\)$/,(m)=>lang==='en'?`module tilted ${m[1]}° (max. ${m[2]}°)`:`módulo inclinado ${m[1]}° (máx. ${m[2]}°)`],
 [/^(.+) anotaciones? guardadas? solo en este navegador\.$/,(m)=>lang==='en'?`${m[1]} annotations saved only in this browser.`:`${m[1]} anotações salvas apenas neste navegador.`],
 [/^← (.+) metros →$/,(m)=>lang==='en'?`← ${m[1]} meters →`:`← ${m[1]} metros →`],
 [/^Cada cuadrante: (.+)$/,(m)=>lang==='en'?`Each cell: ${m[1]}`:`Cada quadrante: ${m[1]}`],
 [/^(SITIO|Sitio) ([ABC])$/,(m)=>lang==='en'?`SITE ${m[2]}`:`LOCAL ${m[2]}`]
];
function translate(value){if(lang==='es'||typeof value!=='string')return value;const text=normal(value);if(!text||!/[A-Za-zÀ-ÿ]/.test(text))return value;const entry=catalogue.get(text),index=lang==='en'?0:1;let out=entry?.[index];if(out===undefined&&text===text.toLocaleUpperCase('es')){const match=upperCatalogue.get(text);if(match)out=match[index].toLocaleUpperCase(lang);}if(out===undefined){for(const [pattern,format]of patterns){const m=text.match(pattern);if(m){out=format(m,translate);break;}}}if(out===undefined){const prefixed=text.match(/^([^A-Za-zÀ-ÿ0-9]+)(.+)$/);if(prefixed){const translated=translate(prefixed[2]);if(translated!==prefixed[2])out=prefixed[1]+translated;}}if(out===undefined){let composed=text;for(const [source,translations]of fragments)if(composed.includes(source))composed=composed.split(source).join(translations[index]);if(composed!==text)out=composed;}if(out===undefined)return value;return value.slice(0,value.indexOf(value.trimStart()))+out+(value.match(/\s*$/)?.[0]||'');}
function skip(el){return !el||el.closest('script,style,code,textarea,[data-no-i18n],.language-picker option');}
function textNode(node){if(skip(node.parentElement))return;const prior=original.get(node);const source=prior&&node.nodeValue===prior.result?prior.source:node.nodeValue;const result=translate(source);original.set(node,{source,result});if(node.nodeValue!==result)node.nodeValue=result;}
const attrNames=['aria-label','title','placeholder','alt'];
function element(el){if(!(el instanceof Element)||skip(el))return;let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}for(const name of attrNames){const value=el.getAttribute(name);if(!value)continue;const prior=saved[name],source=prior&&value===prior.result?prior.source:value,result=translate(source);saved[name]={source,result};if(value!==result)el.setAttribute(name,result);}}
function walk(root){if(root.nodeType===Node.TEXT_NODE){textNode(root);return;}if(root.nodeType!==Node.ELEMENT_NODE)return;element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)textNode(n);else element(n);}}
const pending=new Set();const observer=new MutationObserver(mutations=>{for(const m of mutations){if(m.type==='childList'){pending.add(m.target);for(const node of m.addedNodes)pending.add(node);}else pending.add(m.target);}if(!scheduled){scheduled=true;requestAnimationFrame(flush);}});const observe=()=>observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrNames});
function flush(){scheduled=false;if(!ready)return;observer.disconnect();for(const n of pending)if(n.isConnected)walk(n);pending.clear();observe();}
function apply(){if(!ready)return;observer.disconnect();document.documentElement.lang=lang;walk(document.body);const select=document.getElementById('languageSelect');if(select)select.value=lang;observe();dispatchEvent(new CustomEvent('lunar-language-change',{detail:{lang}}));}
function setLanguage(next){if(!supported.includes(next))return;lang=next;try{localStorage.setItem(key,lang);}catch{}apply();document.querySelectorAll('iframe').forEach(frame=>{try{frame.contentWindow.postMessage({type:'lunar-language',lang},location.origin);}catch{}});}
window.LunarI18n={t:translate,setLanguage,get language(){return lang;},get ready(){return ready;}};
document.getElementById('languageSelect')?.addEventListener('change',e=>setLanguage(e.target.value));addEventListener('storage',e=>{if(e.key===key&&supported.includes(e.newValue)){lang=e.newValue;apply();}});addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='lunar-language'&&supported.includes(e.data.lang)){lang=e.data.lang;apply();}});
// Los rótulos del canvas del rover usan el mismo catálogo que la interfaz.
if(window.CanvasRenderingContext2D){const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText,measure=proto.measureText;proto.fillText=function(text,...args){return fill.call(this,translate(String(text)),...args);};proto.measureText=function(text){return measure.call(this,translate(String(text)));};}
fetch(new URL('i18n-catalog.tsv',base)).then(r=>{if(!r.ok)throw Error('translation catalogue');return r.text();}).then(text=>{for(const line of text.split(/\r?\n/)){if(!line.trim())continue;const row=line.split('|');if(row.length===3){catalogue.set(normal(row[0]),row.slice(1));upperCatalogue.set(normal(row[0]).toLocaleUpperCase('es'),row.slice(1));}}fragments=[...catalogue].filter(([source])=>source.length>=32).sort((a,b)=>b[0].length-a[0].length);ready=true;apply();}).catch(()=>{lang='es';document.documentElement.lang='es';const select=document.getElementById('languageSelect');if(select){select.value='es';select.disabled=true;select.title='No se pudieron cargar las traducciones. Recargá la página.';}});
})();
