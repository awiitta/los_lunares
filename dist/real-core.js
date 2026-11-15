'use strict';
// Shared browser/Node core. Every forecast carries its spatial and temporal limits.
(function(root){
const R=1737400,r=Math.PI/180,d=180/Math.PI,dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function xy(lon,lat){const q=2*R*Math.tan(Math.PI/4+lat*r/2);return[q*Math.sin(lon*r),q*Math.cos(lon*r)];}
function ll(x,y){return{lat:(-Math.PI/2+2*Math.atan(Math.hypot(x,y)/(2*R)))*d,lon:Math.atan2(x,y)*d};}
function frame(site){const la=site.lat*r,lo=site.lon*r;return{u:[Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)],e:[-Math.sin(lo),Math.cos(lo),0],n:[-Math.sin(la)*Math.cos(lo),-Math.sin(la)*Math.sin(lo),Math.cos(la)]};}
function makeTerrain(meta,mean,peak,slope){if([mean,peak,slope].some(a=>a.length!==meta.width*meta.height))throw Error('Dimensiones del DEM inválidas.');const cache=new Map();
function cell(x,y){const i=Math.floor((x-meta.xmin)/meta.cellM),j=Math.floor((meta.ymax-y)/meta.cellM);return i<0||j<0||i>=meta.width||j>=meta.height?-1:j*meta.width+i;}
function ground(x,y){const px=(x-meta.xmin)/meta.cellM-.5,py=(meta.ymax-y)/meta.cellM-.5,i=Math.floor(px),j=Math.floor(py),a=px-i,b=py-j;if(i<0||j<0||i+1>=meta.width||j+1>=meta.height)return null;const k=j*meta.width+i;return mean[k]*(1-a)*(1-b)+mean[k+1]*a*(1-b)+mean[k+meta.width]*(1-a)*b+mean[k+meta.width+1]*a*b;}
function inspect(site,radius=3000){const [x,y]=xy(site.lon,site.lat),k=cell(x,y),z=ground(x,y),edge=Math.min(x-meta.xmin,meta.xmax-x,y-meta.ymin,meta.ymax-y);return{x,y,k,elevation:z,slope:k<0?null:slope[k],covered:z!==null&&Number.isFinite(z)&&edge>=radius+meta.cellM*2,edgeM:edge,radiusM:radius};}
function profile(site,height=5,radius=3000){const key=[site.lat.toFixed(7),site.lon.toFixed(7),height,radius].join(',');if(cache.has(key))return cache.get(key);const info=inspect(site,radius);if(!info.covered)throw Error('Fuera del área con cobertura completa del horizonte elegido.');const {u,e,n}=frame(site),obs=u.map(v=>v*(R+info.elevation+height)),rows=[];
 for(let az=0;az<360;az+=2){const a=az*r,t=e.map((v,k)=>v*Math.sin(a)+n[k]*Math.cos(a));let max=-90,obstacleM=0,valid=true;for(let dist=20;dist<=radius;dist+=20){const q=dist/R,v=u.map((v,k)=>v*Math.cos(q)+t[k]*Math.sin(q)),pos=llFromVector(v),[xx,yy]=xy(pos.lon,pos.lat),k=cell(xx,yy);if(k<0||!Number.isFinite(peak[k])){valid=false;break;}const ray=v.map((v,k2)=>v*(R+peak[k])-obs[k2]),angle=Math.atan2(dot(ray,u),Math.hypot(dot(ray,e),dot(ray,n)))*d;if(angle>max){max=angle;obstacleM=dist;}}rows.push({az,el:max,obstacleM,valid});}
 const out={...info,height,radius,rows};if(cache.size>100)cache.clear();cache.set(key,out);return out;}
function angle(p,az){const q=((az%360)+360)%360/2,i=Math.floor(q),f=q-i,a=p.rows[i],b=p.rows[(i+1)%180];return a.valid&&b.valid?a.el*(1-f)+b.el*f:null;}
function presets(radius=3000){const seeds=[[-14000,-14000],[-10000,-11000],[-13500,-8500]];return seeds.map(([xx,yy],i)=>{let best=null;for(let y=yy-700;y<=yy+700;y+=100)for(let x=xx-700;x<=xx+700;x+=100){const site=ll(x,y),info=inspect(site,radius);if(info.covered&&Number.isFinite(info.slope)&&(!best||info.slope<best.slope))best={...site,...info};}if(!best)throw Error('Sin candidato con cobertura.');return{name:'Site01 · Punto '+String.fromCharCode(65+i),lat:best.lat,lon:best.lon,real:true,elevation:best.elevation,slope:best.slope};});}
return{meta,mean,peak,slope,inspect,profile,angle,presets,ground,cell};}
function llFromVector(v){return{lat:Math.asin(Math.max(-1,Math.min(1,v[2])))*d,lon:Math.atan2(v[1],v[0])*d};}
function direction(site,p,distance=1e15,ground=0,height=1){const f=frame(site),la=p.lat*r,lo=p.lon*r,v=[Math.cos(la)*Math.cos(lo),Math.cos(la)*Math.sin(lo),Math.sin(la)].map((v,k)=>v*distance-f.u[k]*(R+ground+height));return{el:Math.atan2(dot(v,f.u),Math.hypot(dot(v,f.e),dot(v,f.n)))*d,az:(Math.atan2(dot(v,f.e),dot(v,f.n))*d+360)%360};}
function state(el,horizon,margin=.5){if(horizon===null||!Number.isFinite(el))return'unknown';return el>horizon+margin?'clear':el<horizon-margin?'blocked':'uncertain';}
function nextEvent(samples,key){const now=samples[0][key],i=samples.findIndex(s=>s[key]!==now);return{now,hours:i<0?null:i,event:now?'loss':'return',censored:i<0};}
root.LunarRealCore={makeTerrain,xy,ll,frame,direction,state,nextEvent};
})(typeof window==='undefined'?globalThis:window);
