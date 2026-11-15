// Motor astronómico simplificado (Meeus, Astronomical Algorithms, cap. 25, 47 y 53)
// Precisión aprox.: Luna ~0,05°, libración ~0,1°. Sin nutación ni libración física.
const ASTRO = (() => {
  const R = Math.PI / 180;
  const norm = a => ((a % 360) + 360) % 360;
  const LON = [ // D M M' F  coef(1e-6°)  usaE
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],
    [0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],
    [0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],
    [0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],
    [4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
    [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048]];
  const LAT = [
    [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],
    [2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],
    [2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],
    [2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794]];
  const DIST = [
    [0,0,1,0,-20905355],[2,0,-1,0,-3699111],[2,0,0,0,-2955968],[0,0,2,0,-569925],[0,1,0,0,48888],
    [2,0,-2,0,246158],[2,-1,-1,0,-152138],[2,0,1,0,-170733],[2,-1,0,0,-204586],[0,1,-1,0,-129620],
    [1,0,0,0,108743],[0,1,1,0,104755],[0,0,1,-2,79661],[4,0,-1,0,-34782],[4,0,-2,0,-23210]];

  function jd(date) { return date.getTime() / 86400000 + 2440587.5; }

  function moon(T) {
    const Lp = norm(218.3164477 + 481267.88123421 * T);
    const D = norm(297.8501921 + 445267.1114034 * T);
    const M = norm(357.5291092 + 35999.0502909 * T);
    const Mp = norm(134.9633964 + 477198.8675055 * T);
    const F = norm(93.2720950 + 483202.0175233 * T);
    const E = 1 - 0.002516 * T;
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
    const arg = t => (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * R;
    const ef = t => Math.abs(t[1]) === 1 ? E : Math.abs(t[1]) === 2 ? E * E : 1;
    let sl = 0, sb = 0, sr = 0;
    for (const t of LON) sl += t[4] * ef(t) * Math.sin(arg(t));
    for (const t of LAT) sb += t[4] * ef(t) * Math.sin(arg(t));
    for (const t of DIST) sr += t[4] * ef(t) * Math.cos(arg(t));
    sl += 3958 * Math.sin(A1 * R) + 1962 * Math.sin((Lp - F) * R) + 318 * Math.sin(A2 * R);
    sb += -2235 * Math.sin(Lp * R) + 382 * Math.sin(A3 * R) + 175 * Math.sin((A1 - F) * R)
        + 175 * Math.sin((A1 + F) * R) + 127 * Math.sin((Lp - Mp) * R) - 115 * Math.sin((Lp + Mp) * R);
    return { lam: norm(Lp + sl / 1e6), bet: sb / 1e6, dist: 385000.56 + sr / 1000, F, D, Mp };
  }

  function sun(T) {
    const L0 = 280.46646 + 36000.76983 * T;
    const M = 357.52911 + 35999.05029 * T;
    const C = (1.914602 - 0.004817 * T) * Math.sin(M * R) + 0.019993 * Math.sin(2 * M * R) + 0.000289 * Math.sin(3 * M * R);
    const e = 0.016708634 - 0.000042037 * T;
    const v = M + C;
    const r = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(v * R)); // UA
    return { lam: norm(L0 + C), dist: r * 149597870.7 };
  }

  // Coordenadas selenográficas del punto que mira hacia la dirección (lam, bet) vista desde la Luna
  function seleno(lam, bet, F, Om) {
    const I = 1.54242 * R;
    const W = (lam - Om) * R, b = bet * R;
    const A = Math.atan2(Math.sin(W) * Math.cos(b) * Math.cos(I) - Math.sin(b) * Math.sin(I), Math.cos(W) * Math.cos(b));
    let l = norm(A / R - F); if (l > 180) l -= 360;
    const sb = -Math.sin(W) * Math.cos(b) * Math.sin(I) - Math.sin(b) * Math.cos(I);
    return { l, b: Math.asin(sb) / R };
  }

  function state(date) {
    const T = (jd(date) - 2451545.0) / 36525;
    const m = moon(T), s = sun(T);
    const Om = 125.0445479 - 1934.1362891 * T;
    const earth = seleno(m.lam, m.bet, m.F, Om); // punto sub-Tierra
    // Luna heliocéntrica (Meeus 53): dirección Sol→Luna
    const k = m.dist / s.dist;
    const lamH = s.lam + 180 + k * 57.296 * Math.cos(m.bet * R) * Math.sin((s.lam - m.lam) * R);
    const betH = k * m.bet;
    const sunS = seleno(lamH, betH, m.F, Om); // punto sub-solar
    const elong = norm(m.lam - s.lam); // 0 = luna nueva, 180 = llena
    return { T, moon: m, sun: s, earthSub: earth, sunSub: sunS, elong };
  }

  // Elevación/azimut local en un sitio (lat, lon en grados) de un cuerpo con punto sub-cuerpo (l, b)
  function local(site, sub) {
    const p = site.lat * R, q = site.lon * R, l = sub.l * R, b = sub.b * R;
    const d = [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)];
    const up = [Math.cos(p) * Math.cos(q), Math.cos(p) * Math.sin(q), Math.sin(p)];
    const east = [-Math.sin(q), Math.cos(q), 0];
    const north = [-Math.sin(p) * Math.cos(q), -Math.sin(p) * Math.sin(q), Math.cos(p)];
    const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const el = Math.asin(dot(d, up)) / R;
    const az = norm(Math.atan2(dot(d, east), dot(d, north)) / R);
    return { el, az };
  }

  return { jd, state, local, norm };
})();
if (typeof module !== 'undefined') module.exports = ASTRO;
