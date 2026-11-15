const assert=require('node:assert/strict');
const {blocks,assess}=require('./dist/date-window-rules.js');
function fixture(){return{samples:Array.from({length:168},()=>({ev:true,sv:true})),budget:{rows:Array.from({length:168},()=>({storedWh:100,powerW:8}))}};}
const a=fixture(),b=blocks(a,100,8);
assert.equal(b.length,28);assert.equal(b[27].end,168);assert(b.every(x=>x.compatible));
assert.equal(assess(b,[]).complete,false);assert.equal(assess(b,[0]).complete,true);
a.samples[5].ev=false;const partial=blocks(a,100,8);assert.equal(partial[0].earthHours,5);assert.equal(partial[0].compatible,false);assert.equal(assess(partial,[0,1]).complete,false);assert.equal(assess(partial,[1]).complete,true);
const dark=fixture();dark.samples.forEach(s=>s.sv=false);dark.budget.rows.forEach(r=>{r.powerW=0;r.storedWh=0;});const d=blocks(dark,8,8);assert.equal(d[0].poweredHours,1);assert.equal(d[0].compatible,false);
const emptyButPowered=fixture();emptyButPowered.budget.rows.forEach(r=>r.storedWh=0);assert(blocks(emptyButPowered,0,8).every(x=>x.compatible));
assert.equal(assess(b,[0,0]).selected,1);assert.throws(()=>assess(b,[-1]));assert.throws(()=>assess(b,[28]));assert.throws(()=>blocks({samples:[],budget:{rows:[]}},100,8));
console.log('16 comprobaciones de bloques horarios, contacto parcial, energía, duplicados y cobertura: OK');
