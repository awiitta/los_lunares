const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'dist/minijuego/mission-challenge.js'),'utf8');const body=source.slice(source.indexOf(' function problem()'),source.indexOf(' function narrative('));
const mission={step:1,goal:'explore',site:0,store:true},a={light:84,earth:126,outage:42,budget:{unservedWh:0}},terrain={slope:3};
const ctx={mission,missionAnalysis:()=>a,RM:{ready:true,terrain:{inspect:()=>terrain},radius:3000},sites:[{}],stamp:()=> 'test'};vm.createContext(ctx);vm.runInContext(body,ctx);
assert.equal(ctx.problem(),null);a.light=0;assert.match(ctx.problem().reason,/luz solar/);a.light=13;assert.equal(ctx.problem(),null);
mission.step=3;a.budget.unservedWh=20;assert.match(ctx.problem().reason,/20 Wh/);a.budget.unservedWh=0;assert.equal(ctx.problem(),null);
mission.step=4;mission.store=false;assert.match(ctx.problem().reason,/continua/);mission.store=true;assert.equal(ctx.problem(),null);a.earth=0;assert.match(ctx.problem().reason,/enviarlas/);a.earth=126;
mission.step=5;a.budget.unservedWh=20;assert.equal(ctx.problem().target,3);a.budget.unservedWh=0;mission.store=false;assert.equal(ctx.problem().target,4);mission.store=true;terrain.slope=12;assert.equal(ctx.problem().target,1);terrain.slope=3;assert.equal(ctx.problem(),null);
console.log('12 comprobaciones: rescates de luz, energía, comunicación, terreno y regreso a decisión correcta: OK');
