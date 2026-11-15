// Compara el motor con los ejemplos 47.a y 53.a de Meeus (1992-04-12 0h TD)
const A = require('../src/astro.js');
const s = A.state(new Date(Date.UTC(1992, 3, 12) - 59000));
const chk = (n, v, e, tol) => console.log(Math.abs(v - e) <= tol ? 'OK ' : 'MAL', n, v.toFixed(4), 'esperado', e);
chk('Luna λ', s.moon.lam, 133.1627, 0.05);
chk('Luna β', s.moon.bet, -3.2291, 0.02);
chk('libración l', s.earthSub.l, -1.206, 0.05);
chk('libración b', s.earthSub.b, 4.194, 0.05);
chk('sub-solar b0', s.sunSub.b, 1.46, 0.05);
