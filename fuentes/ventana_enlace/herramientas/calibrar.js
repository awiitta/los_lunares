const A=require("../src/astro.js");const site={lat:-89.46,lon:222.5};
const P={rtg:0.6,cap:60,base:0.75,tx:7.2,solar:6,margin:0.5,sunR:0.267,gb:54};
function frac(el,r){ if(el>=r) return 1; if(el<=-r) return 0; const h=r+el, x=h/r; // fracción del disco
  const a=Math.acos(1-x), seg=(a-Math.sin(2*a)/2)/Math.PI; return seg; }
function slots(start,days){const out=[];for(let i=0;i<days*4;i++){let e=0,s=0;for(let k=0;k<3;k++){const st=A.state(new Date(start+(i*6+k*3)*3600e3));e+=A.local(site,st.earthSub).el/3; s+=frac(A.local(site,st.sunSub).el,P.sunR)/3;} out.push({e,s});}return out;}
function greedy(sl){let b=P.cap,n=0,minb=b;for(const x of sl){const tx=x.e>P.margin && b+P.rtg+P.solar*x.s-P.base-P.tx> P.cap*0.15; b=Math.min(P.cap,b+P.rtg+P.solar*x.s-P.base-(tx?P.tx:0)); if(tx)n++; minb=Math.min(minb,b);}return {n,minb};}
for(const [name,d,days] of [["M1",Date.UTC(2026,11,1),30],["M2",Date.UTC(2027,0,10),40],["M3",Date.UTC(2027,5,20),45],["X",Date.UTC(2027,1,20),30]]){const sl=slots(d,days);const vis=sl.filter(x=>x.e>P.margin).length;const g=greedy(sl);console.log(name,"vis",vis,"greedy",g.n,"minb",g.minb.toFixed(1),"sunAvg",(sl.reduce((a,x)=>a+x.s,0)/sl.length).toFixed(2));}
