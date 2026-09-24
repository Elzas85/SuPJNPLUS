// Las dos funciones tal como están en SuPJN+ 1.3.1
const limpio = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const norm = (s) => limpio(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// Causas parecidas a las de verdad
const FUEROS = ['CIV','CCF','CCC','COM','CNT','CAF','CPE','CFP'];
const PAL = ['GONZÁLEZ','MARTÍNEZ','PÉREZ','RODRÍGUEZ','S.A.','ASOCIACIÓN CIVIL','c/','s/ DAÑOS Y PERJUICIOS','s/ EJECUCIÓN','INCIDENTE','MUNICIPALIDAD','SUCESIÓN AB-INTESTATO'];
function causas(n) {
  const L = [];
  for (let i = 0; i < n; i++) {
    const car = [];
    for (let k = 0; k < 6; k++) car.push(PAL[(i * 7 + k * 3) % PAL.length]);
    L.push({
      exp: FUEROS[i % FUEROS.length] + ' ' + (10000 + i) + '/20' + (18 + (i % 8)),
      dep: 'JUZGADO NACIONAL EN LO CIVIL Nº ' + (1 + (i % 110)),
      car: car.join(' '),
      sit: i % 3 ? 'En Trámite' : 'Archivado',
      ult: (1 + i % 28) + '/0' + (1 + i % 9) + '/2026',
      pos: i, tramite: i % 3 !== 0
    });
  }
  return L;
}

function reloj(nom, f, vueltas) {
  f(); // calentar
  const t = process.hrtime.bigint();
  for (let i = 0; i < vueltas; i++) f();
  const ms = Number(process.hrtime.bigint() - t) / 1e6 / vueltas;
  console.log('  %s: %s ms por vuelta', nom.padEnd(42), ms.toFixed(2));
  return ms;
}

for (const N of [500, 2000, 6000]) {
  const L = causas(N);
  const t = norm('gonzalez');
  console.log('\n=== ' + N + ' causas');

  // --- filtrar por texto, como ahora
  const ahoraFiltro = () => L.filter((c) => norm([c.exp, c.dep, c.car, c.sit, c.ult, '', ''].join(' ')).indexOf(t) >= 0).length;
  // --- filtrar por texto, con el texto normalizado guardado por causa
  const cache = new Map();
  const textoDe = (c) => { let v = cache.get(c); if (v === undefined) { v = norm([c.exp, c.dep, c.car, c.sit, c.ult, '', ''].join(' ')); cache.set(c, v); } return v; };
  textoDe(L[0]);
  const conCache = () => L.filter((c) => textoDe(c).indexOf(t) >= 0).length;

  const a = reloj('filtrar por texto, como ahora', ahoraFiltro, 20);
  const b = reloj('filtrar por texto, guardando lo normalizado', conCache, 20);
  console.log('     -> %sx mas rapido', (a / b).toFixed(1));

  // --- ordenar por carátula, como ahora (norm dentro del comparador)
  const ahoraOrden = () => { const x = L.slice(); x.sort((p, q) => { const i = norm(p.car), j = norm(q.car); return i < j ? -1 : i > j ? 1 : 0; }); return x.length; };
  // --- ordenar calculando la clave una sola vez por causa
  const ordenClave = () => { const x = L.map((c) => [norm(c.car), c]); x.sort((p, q) => (p[0] < q[0] ? -1 : p[0] > q[0] ? 1 : 0)); return x.length; };
  const c1 = reloj('ordenar por carátula, como ahora', ahoraOrden, 10);
  const c2 = reloj('ordenar calculando la clave una sola vez', ordenClave, 10);
  console.log('     -> %sx mas rapido', (c1 / c2).toFixed(1));
}
