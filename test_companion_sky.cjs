const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {describe}=require('./dist/companion-sky.js');
const c={sstate:'clear',estate:'clear',sv:true,ev:true,sun:{el:1},earth:{el:3}};
assert.equal(describe(c,144,480).sun,'light');assert.equal(describe(c,144,480).earth,'clear');assert.match(describe(c,144,480).text,/144 W/);
const shadow={...c,sstate:'blocked',sv:false,sun:{el:1}};assert.equal(describe(shadow,0,200).sun,'shadow');assert.match(describe(shadow,0,200).text,/batería/);assert.match(describe(shadow,0,0).text,/agotó/);
for(const s of ['uncertain','unknown'])assert.equal(describe({...c,sstate:s,sv:false}).sun,'uncertain');
assert.equal(describe({...c,estate:'blocked',ev:false}).earth,'blocked');assert.equal(describe({...c,estate:'uncertain',ev:false}).earth,'uncertain');
assert.equal(describe({...c,sun:{el:-.1}}).sun,'light');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('./dist/companion-orbit-astro.js','utf8'),context);const astro=context.window.CompanionOrbitAstro;
for(const date of ['2025-01-01T00:00:00Z','2026-12-31T23:00:00Z']){const s=astro.state(new Date(date));assert(Number.isFinite(s.moon.lam)&&Number.isFinite(s.sun.lam)&&Number.isFinite(s.elong));assert(s.moon.dist>300000&&s.moon.dist<450000);}
console.log('15 comprobaciones: luz/sombra/margen, batería, Tierra y esquema orbital: OK');
