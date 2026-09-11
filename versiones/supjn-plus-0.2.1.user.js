// ==UserScript==
// @name         SuPJN+ - Consulta Web del PJN ampliada
// @namespace    ignacio.kinbaum
// @version      0.2.1
// @description  Una sola ventana sobre la Consulta Web del PJN: Mis causas y Favoritos, en trámite y fuera de trámite, con búsqueda, filtros, orden y columnas movibles; etiquetas y anotaciones propias con respaldo manual; dejar nota en todas o en las seleccionadas; bajar expedientes en PDF eligiendo causas desde la lista o actuaciones desde el expediente; y acceso a las demás funciones del PJN.
// @author       Ignacio Kinbaum
// @license      GPL-3.0-or-later
// @copyright    2026, Ignacio Kinbaum (estudiojuridicokinbaum@gmail.com)
// @homepageURL  https://github.com/Elzas85/SUPJNPLUS
// @supportURL   https://github.com/Elzas85/SUPJNPLUS/issues
// @updateURL    https://raw.githubusercontent.com/Elzas85/SUPJNPLUS/main/supjn-plus.user.js
// @downloadURL  https://raw.githubusercontent.com/Elzas85/SUPJNPLUS/main/supjn-plus.user.js
// @match        https://scw.pjn.gov.ar/scw/*
// @run-at       document-idle
// @noframes
// @sandbox      JavaScript
// @require      https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js#sha384=weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==
/*
 * SuPJN+ - Consulta Web del PJN ampliada
 * Copyright (C) 2026  Ignacio Kinbaum  <estudiojuridicokinbaum@gmail.com>
 *
 * Este programa es software libre: usted puede redistribuirlo y/o modificarlo
 * bajo los términos de la Licencia Pública General GNU (GPL) publicada por la
 * Free Software Foundation, en su versión 3 o, a su elección, cualquier
 * versión posterior. Se distribuye SIN NINGUNA GARANTÍA. Véase
 * <https://www.gnu.org/licenses/> para el texto completo (archivo LICENSE).
 *
 * ---------------------------------------------------------------------------
 *
 * QUÉ ES
 *   Una sola ventana, movible, que junta todo: Mis causas (Relacionados) y
 *   Favoritos con búsqueda, filtros, orden y columnas movibles; etiquetas y
 *   anotaciones propias; dejar nota en todas o en las seleccionadas; bajar
 *   expedientes en un PDF, eligiendo causas desde la lista o actuaciones desde
 *   el expediente; y un menú con las demás funciones del PJN (escritos, DEOX,
 *   notificaciones y el resto).
 *   Arranca minimizada, en la pastilla de abajo a la derecha, y lee igual en
 *   segundo plano. Se abre sola solo si quedó una tanda de nota a medias.
 *
 *   Las dos tablas (causas y actuaciones) comparten la misma máquina de
 *   columnas: se ordenan tocando el título, se mueven arrastrándolo y se
 *   ensanchan desde el borde derecho. Con el encuadre puesto, que viene de
 *   fábrica, la tabla entra siempre en el ancho de la ventana: lo que gana una
 *   columna lo pierden las otras. El zoom de la barra de título agranda lo de
 *   adentro sin mover ni redimensionar la ventana; por eso la geometría se
 *   guarda en píxeles de pantalla y se divide por el factor al escribirla.
 *
 * CÓMO FUNCIONA EL SITIO (relevado el 11/09/2026, siempre en solo lectura)
 *
 *   Listas
 *     - Relacionados vive en /scw/consultaListaRelacionados.seam y Favoritos
 *       en /scw/consultaListaFavoritos.seam; las dos se abren por GET.
 *     - No hay JSON: JSF con RichFaces y PrimeFaces. El paginado es AJAX y los
 *       datos solo están en la tabla (Expediente, Dependencia, Carátula,
 *       Situación, Últ. Act.). Favoritos no tiene estrella sino "Descartar".
 *     - Las dos traen solo lo que está en trámite; "Ver todos los expedientes"
 *       más Consultar suma lo que está fuera de trámite.
 *     - Todo se lee en un MARCO OCULTO con la misma sesión: la página visible
 *       no se mueve y sus botones siguen apuntando a la causa correcta
 *       (probado abriendo expedientes desde la página visible después de leer
 *       en el marco, con Favoritos y con "Ver todos" puesto).
 *
 *   Lo que el PJN rechaza desde un marco
 *     - Abrir un expediente (el ojo), "Ver históricas" o el filtro de dejar
 *       nota, disparados como navegación de un marco, vuelven con error 503.
 *     - En cambio el mismo pedido hecho con fetch desde el marco sí anda. La
 *       respuesta es una redirección a http://.../expediente.seam?cid=N, que
 *       el navegador bloquea por contenido mixto; por eso, antes del fetch, se
 *       le pone al documento del marco la política upgrade-insecure-requests y
 *       la redirección sigue por https. Así se obtiene el cid sin mover nada.
 *     - Con el cid, /scw/expediente.seam?cid=N y
 *       /scw/actuacionesHistoricas.seam?cid=N se abren por GET, también en el
 *       marco, y su paginado AJAX funciona.
 *
 *   Expediente
 *     - Tabla de actuaciones con seis celdas: enlaces (Descargar y Ver, los dos
 *       a /scw/viewer.seam), Oficina, Fecha, Tipo, Detalle y A Fs.
 *     - El visor (/scw/viewer.seam) es el documento mismo: ahí SuPJN+ no
 *       arranca, para no dibujarse encima del PDF.
 *     - "Libro digital" es /scw/libroDigital.seam?cid=N. "Presentar escrito"
 *       es un formulario POST al Sistema de Escritos: el POST tiene que salir
 *       de un documento de primer nivel, así que la pestaña nueva arma el
 *       formulario adentro y lo envía; disparado desde esta pestaña vuelve en
 *       blanco.
 *
 *   Dejar nota (NOTATOMIC)
 *     - El botón "Dejar nota" de arriba NO deja nota: filtra y agrega una
 *       columna con un lápiz. Solo existe en Relacionados.
 *     - La nota se deja con el lápiz de cada fila y el cartel de confirmación.
 *       Confirmar RECARGA la página: el recorrido es una máquina de estados en
 *       sessionStorage que retoma en cada carga.
 *     - a) El botón Confirmar existe siempre en el DOM: hay que mirar el cartel.
 *       b) El lápiz no desaparece: el resultado sale del mensaje del PJN, y hay
 *       que comparar el número que nombra con el de la causa en curso.
 *       c) Se recorre por número de expediente, no por posición.
 *
 * DÓNDE SE GUARDA
 *   Todo en el almacén de Tampermonkey de esta PC: las listas leídas, la
 *   configuración, las etiquetas, las anotaciones y el último resultado de
 *   dejar nota por causa. Etiquetas y anotaciones se respaldan a mano con
 *   Exportar. No hay guardado automático.
 *
 * TERMINOLOGÍA
 *   ANOTACIONES son las notas privadas de trabajo. DEJAR NOTA es el acto
 *   procesal. Se llaman distinto a propósito.
 * ===========================================================================
 */
/* global PDFLib */
(function () {
  'use strict';

  // Nunca dentro de un marco: SuPJN+ lee en marcos ocultos y ahí no arranca nada.
  if (window.top !== window.self) return;
  if (!document.body) return;

  // El visor (viewer.seam) es el documento de la actuación: ahí no va nada
  // encima. Tampoco en respuestas que no sean HTML, como los PDF.
  if (/\/scw\/viewer\.seam/i.test(location.pathname)) return;
  if (document.contentType && document.contentType !== 'text/html') return;

  // Con permisos de Tampermonkey el jsf del PJN se alcanza por unsafeWindow.
  const PAGINA = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  const APP = {
    nombre: 'SuPJN+',
    version: 'beta 0.2.1',
    autor: 'Ignacio Kinbaum',
    anio: '2026',
    mail: 'estudiojuridicokinbaum@gmail.com',
    licencia: 'GPL-3.0-or-later',
    licenciaUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    github: 'https://github.com/Elzas85/SUPJNPLUS'
  };

  // Paleta del propio PJN: el azul de la barra superior y el de las tablas.
  const AZUL = '#14416f';
  const AZUL_CLARO = '#5084ce';

  const K_REL = 'supjn.causas.v1';        // Relacionados (mismo formato que la 0.1.0)
  const K_FAV = 'supjn.favoritos.v1';
  const K_CFG = 'supjn.cfg.v1';
  const K_MARCAS = 'supjn.marcas.v1';
  const K_RESPALDO = 'supjn.respaldo.v1';
  const K_NOTAS = 'supjn.notas.v1';       // último resultado de dejar nota por causa
  // La tanda en curso va en una clave propia. NOTATOMIC usaba
  // 'notatomic_corrida': si quedó instalado, con clave propia cada uno hace lo
  // suyo y no se pisan los lápices.
  const S_CORRIDA = 'supjn_corrida';      // sessionStorage: tanda de notas en curso
  const S_ENCARGO = 'supjn_encargo';      // sessionStorage: algo que hacer al cargar la página
  const VIEJA_DESPUES_DE = 30 * 60 * 1000;
  const DIAS_AVISO_COPIA = 15;

  const RUTA = {
    rel: '/scw/consultaListaRelacionados.seam',
    fav: '/scw/consultaListaFavoritos.seam',
    rad: '/scw/consultaListaNoIniciados.seam',
    exp: '/scw/expediente.seam',
    hist: '/scw/actuacionesHistoricas.seam'
  };

  const LISTAS = {
    rel: { nombre: 'Mis causas', pjn: 'Relacionados', clave: K_REL },
    fav: { nombre: 'Favoritos', pjn: 'Favoritos', clave: K_FAV }
  };

  // Aplicaciones del PJN, tal como las lista el Portal PJN (relevado 11/09/2026).
  const APPS_PJN = [
    { t: 'Mis eventos (Portal PJN)', u: 'https://portalpjn.pjn.gov.ar/inicio' },
    { t: 'Notificaciones electrónicas', u: 'https://notif.pjn.gov.ar/' },
    { t: 'Escritos (presentar y ver presentados)', u: 'https://escritos.pjn.gov.ar/' },
    { t: 'DEOX (oficios electrónicos)', u: 'https://deox.pjn.gov.ar/deox/' },
    { t: 'IWECS (recursos directos ante la CSJN)', u: 'https://iwecs.csjn.gov.ar/' },
    { t: 'Autorizados', u: 'https://autorizados.pjn.gov.ar/' },
    { t: 'Todas las aplicaciones del Portal PJN', u: 'https://portalpjn.pjn.gov.ar/apps' }
  ];

  const EN_LISTA = /\/scw\/consultaLista/i.test(location.pathname);
  const EN_EXPEDIENTE = /\/scw\/(expediente|actuacionesHistoricas)\.seam/i.test(location.pathname);
  const CID_PAGINA = new URLSearchParams(location.search).get('cid');

  // --------------------------------------------------------------- utilidades

  const limpio = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => limpio(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const clave = (exp) => limpio(exp).toUpperCase();
  const fueroDe = (exp) => { const m = /^([A-Z]{2,4})\s/.exec(clave(exp)); return m ? m[1] : ''; };
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const dos = (n) => String(n).padStart(2, '0');

  // "26/06/2025" -> 20250626, para ordenar y comparar con los campos de fecha
  function numFecha(t) {
    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t || '');
    return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0;
  }
  const numDeInput = (v) => (v ? parseInt(String(v).replace(/-/g, ''), 10) || 0 : 0);

  // El PJN escribe la fecha a veces sin el cero del día ("5/09/2026"). Se deja
  // siempre como dd/mm/aaaa para que se vea parejo y la búsqueda la encuentre.
  function fechaPareja(t) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
    return m ? dos(m[1]) + '/' + dos(m[2]) + '/' + m[3] : t;
  }

  // "CIV 012345/2023/1" -> "CIV|2023|00012345|001", para ordenar por fuero, año y número
  function ordenExp(exp) {
    const m = /^([A-Z]{2,4})\s+0*(\d+)\/(\d{4})(?:\/(\S+))?/.exec(clave(exp));
    if (!m) return clave(exp);
    return m[1] + '|' + m[3] + '|' + m[2].padStart(8, '0') + '|' + (m[4] || '0').padStart(3, '0');
  }

  function fechaHora(ms) {
    const d = new Date(ms);
    return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  }
  const soloFecha = (ms) => fechaHora(ms).slice(0, 10);
  const diasDesde = (ms) => Math.floor((Date.now() - ms) / 86400000);
  const selloArchivo = () => new Date().toISOString().slice(0, 10);
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); };
  const isoACorta = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] : ''; };
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);

  // ------------------------------------------------------------------ almacén

  const GM_OK = (typeof GM_getValue === 'function' && typeof GM_setValue === 'function');

  function leerAlmacen(k, def) {
    try {
      const v = GM_OK ? GM_getValue(k, null) : localStorage.getItem(k);
      if (v == null) return def;
      return typeof v === 'string' ? JSON.parse(v) : v;
    } catch (e) { return def; }
  }
  function guardarAlmacen(k, v) {
    try {
      const t = JSON.stringify(v);
      if (GM_OK) GM_setValue(k, t); else localStorage.setItem(k, t);
      return true;
    } catch (e) { return false; }
  }
  const leerSesion = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const guardarSesion = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin persistencia */ } };
  const borrarSesion = (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* sin persistencia */ } };

  // --------------------------------------------------------- la página del PJN
  //
  // Toda búsqueda en la página visible deja afuera la ventana de SuPJN+: tiene
  // su propia tabla con "Expediente" y "Carátula" y sus propios textos, y no
  // se puede confundir con la del PJN.

  const esNuestro = (el) => !!(el && el.closest && el.closest('#supjn, #supjn-pastilla'));

  function textoPJN(doc) {
    const b = doc && doc.body;
    if (!b) return '';
    return [...b.children]
      .filter((e) => !esNuestro(e) && !/^(SCRIPT|STYLE|IFRAME|NOSCRIPT)$/.test(e.tagName))
      .map((e) => e.innerText || '').join('\n');
  }

  // La tabla de expedientes es la que tiene "Expediente" y "Carátula" en la
  // cabecera. Si hubiera más de una, la más larga.
  function tablaDe(doc) {
    let mejor = null;
    doc.querySelectorAll('table').forEach((t) => {
      if (esNuestro(t)) return;
      const cab = (t.tHead && t.tHead.rows[0]) || t.rows[0];
      if (!cab) return;
      const txt = norm(cab.textContent);
      if (txt.indexOf('expediente') < 0 || txt.indexOf('caratula') < 0) return;
      if (!mejor || t.rows.length > mejor.rows.length) mejor = t;
    });
    return mejor;
  }

  function filasTabla(t) {
    if (!t) return [];
    if (t.tBodies && t.tBodies.length) {
      const out = [];
      [...t.tBodies].forEach((b) => out.push(...b.rows));
      return out;
    }
    return [...t.rows].slice(1);
  }

  function filasDe(doc) {
    const out = [];
    filasTabla(tablaDe(doc)).forEach((tr) => {
      const c = tr.cells;
      if (!c || c.length < 5) return;
      const exp = limpio(c[0].textContent);
      if (!/\d+\/\d{4}/.test(exp)) return;
      const estrella = tr.querySelector('a.favorite i, i.fa-star, i.fa-star-o');
      const cls = estrella ? ' ' + estrella.className + ' ' : '';
      out.push({
        exp: clave(exp),
        dep: limpio(c[1].textContent),
        car: limpio(c[2].textContent),
        sit: limpio(c[3].textContent),
        ult: fechaPareja(limpio(c[4].textContent)),
        fav: / fa-star /.test(cls),
        tr
      });
    });
    return out;
  }

  const firmaLista = (doc) => filasDe(doc).map((f) => f.exp).join('|');

  function tipoLista(doc) {
    const t = limpio(textoPJN(doc)).slice(0, 8000);
    if (/lista de expedientes relacionados/i.test(t)) return 'rel';
    if (/lista de expedientes favoritos/i.test(t)) return 'fav';
    return null;
  }

  // El paginador de una tabla es el primer ul.pagination que viene después de
  // ella y antes de la tabla siguiente. En el expediente hay dos (actuaciones y
  // notas) y no se pueden mezclar.
  function paginadorDe(doc, tablaFn) {
    const uls = [...doc.querySelectorAll('ul.pagination')].filter((u) => !esNuestro(u));
    // En las listas hay un solo paginador y se usa ese. En el expediente se
    // exige que sea el de la tabla de actuaciones: con una sola página de
    // actuaciones, el único paginador que queda es el de las notas.
    const estricto = tablaFn === tablaActuaciones;
    if (!estricto && uls.length <= 1) return uls[0] || null;
    if (!uls.length) return null;
    const tabla = (tablaFn || tablaDe)(doc);
    if (!tabla) return estricto ? null : uls[0];
    const dentro = uls.find((u) => tabla.contains(u));
    if (dentro) return dentro;
    const SIGUE = 4; // Node.DOCUMENT_POSITION_FOLLOWING
    const siguientes = uls.filter((u) => tabla.compareDocumentPosition(u) & SIGUE);
    // La próxima tabla con encabezados (en el expediente, la de notas) marca el
    // límite: un paginador que viene después ya no es de esta tabla.
    const proxima = [...doc.querySelectorAll('table')].find((t) => t !== tabla && !esNuestro(t) &&
      !t.contains(tabla) && !tabla.contains(t) && (tabla.compareDocumentPosition(t) & SIGUE) &&
      t.querySelector('th') && !uls.some((u) => t.contains(u)));
    const propios = proxima ? siguientes.filter((u) => u.compareDocumentPosition(proxima) & SIGUE) : siguientes;
    return propios[0] || (estricto ? null : uls[0]);
  }

  function paginaActiva(doc, tablaFn) {
    const ul = paginadorDe(doc, tablaFn);
    const li = ul ? ul.querySelector('li.active') : null;
    const n = li ? parseInt(limpio(li.textContent), 10) : NaN;
    return isNaN(n) ? 1 : n;
  }

  function enlacesPagina(doc, tablaFn) {
    const ul = paginadorDe(doc, tablaFn);
    if (!ul) return [];
    return [...ul.querySelectorAll('li a')].map((a) => {
      const t = a.querySelector('[title]');
      return { a, n: parseInt(limpio(a.textContent), 10), tit: t ? (t.getAttribute('title') || '') : (a.getAttribute('title') || '') };
    });
  }

  function enlaceSiguiente(doc, tablaFn) {
    const act = paginaActiva(doc, tablaFn);
    const ls = enlacesPagina(doc, tablaFn);
    const directo = ls.find((x) => x.n === act + 1);
    if (directo) return directo.a;
    const flecha = ls.find((x) => /siguiente/i.test(x.tit));
    return flecha ? flecha.a : null;
  }

  // Espera a que el PJN termine de cambiar de página: tiene que cambiar el
  // número activo y también las filas, porque RichFaces no los redibuja juntos.
  // Va con MutationObserver y no preguntando cada tanto: con la pestaña en
  // segundo plano Chrome frena los temporizadores hasta uno por minuto.
  function esperarCambio(doc, antes, firmaAntes, ms, firmaFn, tablaFn) {
    const firma = firmaFn || firmaLista;
    const listo = () => paginaActiva(doc, tablaFn) !== antes && firma(doc) !== firmaAntes;
    return new Promise((resolve) => {
      if (listo()) { resolve(true); return; }
      let hecho = false;
      const fin = (v) => { if (hecho) return; hecho = true; obs.disconnect(); clearTimeout(vence); resolve(v); };
      const obs = new MutationObserver(() => { try { if (listo()) fin(true); } catch (e) { /* el DOM se está rearmando */ } });
      obs.observe(doc.documentElement, { childList: true, subtree: true, characterData: true });
      const vence = setTimeout(() => { let v = false; try { v = listo(); } catch (e) { v = false; } fin(v); }, ms);
    });
  }

  async function irAPagina(doc, destino, firmaFn, tablaFn) {
    const firma = firmaFn || firmaLista;
    for (let vueltas = 0; vueltas < 40; vueltas++) {
      const act = paginaActiva(doc, tablaFn);
      if (act === destino) return true;
      const ls = enlacesPagina(doc, tablaFn).filter((x) => !isNaN(x.n));
      let a = (ls.find((x) => x.n === destino) || {}).a;
      if (!a && ls.length) {
        const extremo = destino > act
          ? ls.reduce((m, x) => (x.n > m.n ? x : m), ls[0])
          : ls.reduce((m, x) => (x.n < m.n ? x : m), ls[0]);
        if (extremo.n !== act) a = extremo.a;
      }
      if (!a) return false;
      const f = firma(doc);
      a.click();
      if (!(await esperarCambio(doc, act, f, 20000, firma, tablaFn))) return false;
    }
    return paginaActiva(doc, tablaFn) === destino;
  }

  const casillaVerTodos = (doc) => [...doc.querySelectorAll('input[type=checkbox]')]
    .find((c) => !esNuestro(c) && /ver todos los expedientes/i.test(limpio((c.closest('tr') || c.parentElement || {}).textContent)));

  const botonConsultar = (doc) => [...doc.querySelectorAll('input[type=submit], input[type=button], button')]
    .find((b) => !esNuestro(b) && /^consultar$/i.test(limpio(b.value || b.textContent)));

  const enlaceOjo = (tr) => [...tr.querySelectorAll('a')].find((a) => a.querySelector('.fa-eye') || /visualizar/i.test(a.textContent));
  const enlaceMenu = (tr, re) => [...tr.querySelectorAll('a')].find((a) => re.test(limpio(a.textContent)));

  // ------------------------------------------------------------ marco oculto

  const VENCIDA = 'la sesión del PJN venció. Recargá la página, volvé a entrar si lo pide y probá de nuevo';

  function crearMarco() {
    const fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true');
    fr.tabIndex = -1;
    fr.className = 'supjn-marco';
    fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1280px;height:900px;border:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(fr);
    return fr;
  }

  const esLista = (d) => !!tablaDe(d) || /no se encontraron|no posee|sin resultados/i.test(limpio(textoPJN(d)).slice(0, 6000));
  const esExpediente = (d) => /Expediente:/.test(textoPJN(d));
  const esHistoricas = (d) => /actuaciones hist[oó]ricas/i.test(textoPJN(d));

  // Espera a que el marco tenga cargada la página esperada. disparar() hace lo
  // que provoca la carga. Va por el evento load y no por temporizadores.
  function esperarCarga(fr, disparar, esperado) {
    return new Promise((resolve, reject) => {
      let hecho = false;
      const terminar = (err) => {
        if (hecho) return;
        hecho = true;
        clearTimeout(vence);
        fr.removeEventListener('load', alCargar);
        if (err) reject(err); else resolve();
      };
      const alCargar = () => {
        let d;
        try { d = fr.contentDocument; } catch (e) { d = null; }
        // Con la sesión vencida el marco termina en el login del SSO, que es otro
        // origen y no se deja leer.
        if (!d) { terminar(new Error(VENCIDA)); return; }
        if (!d.body || d.location.href === 'about:blank') return;
        if (d.querySelector('input[type=password]')) { terminar(new Error(VENCIDA)); return; }
        if ((esperado || esLista)(d)) { terminar(); return; }
        terminar(new Error('el PJN devolvió una página inesperada'));
      };
      fr.addEventListener('load', alCargar);
      const vence = setTimeout(() => terminar(new Error('el PJN no terminó de cargar la página')), 60000);
      try { disparar(); } catch (e) { terminar(e); }
    });
  }

  // La redirección que devuelve el PJN al abrir una causa va a http://; con
  // esta política el navegador la sigue por https en vez de bloquearla.
  function permitirUpgrade(doc) {
    if (doc.querySelector('meta[http-equiv="Content-Security-Policy"][data-supjn]')) return;
    const m = doc.createElement('meta');
    m.httpEquiv = 'Content-Security-Policy';
    m.content = 'upgrade-insecure-requests';
    m.setAttribute('data-supjn', '1');
    (doc.head || doc.documentElement).appendChild(m);
  }

  // Los enlaces de fila del PJN son del tipo
  //   jsf.util.chain(this,event,'PF(\'dialog\').show();','mojarra.jsfcljs(document.getElementById(\'FORM\'),{\'ID\':\'ID\'},\'\')')
  // De ahí salen el formulario y el parámetro que identifica la acción.
  function paramsDeEnlace(a) {
    const oc = String((a && a.getAttribute('onclick')) || '').replace(/\\'/g, "'");
    const m = /mojarra\.jsfcljs\(document\.getElementById\('([^']+)'\),\{([^}]*)\}/.exec(oc);
    if (!m) return null;
    const pares = [];
    (m[2].match(/'([^']*)'\s*:\s*'([^']*)'/g) || []).forEach((p) => {
      const x = /'([^']*)'\s*:\s*'([^']*)'/.exec(p);
      pares.push([x[1], x[2]]);
    });
    return { formId: m[1], pares };
  }

  // Hace con fetch, desde el marco, lo mismo que el clic en el enlace, y
  // devuelve la dirección a la que redirige el PJN.
  async function postAccion(fr, a) {
    const d = fr.contentDocument;
    const w = fr.contentWindow;
    const p = paramsDeEnlace(a);
    if (!p) throw new Error('no reconozco el enlace del PJN');
    const form = d.getElementById(p.formId);
    if (!form) throw new Error('no encuentro el formulario del PJN');
    permitirUpgrade(d);
    const cuerpo = new w.URLSearchParams();
    new w.FormData(form).forEach((v, k) => { if (typeof v === 'string') cuerpo.append(k, v); });
    p.pares.forEach(([k, v]) => cuerpo.append(k, v));
    let r;
    try {
      r = await w.fetch(form.action, {
        method: 'POST', body: cuerpo, credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } catch (e) {
      throw new Error('el PJN no respondió (si la sesión venció, recargá la página)');
    }
    if (!r.ok) throw new Error('el PJN contestó con error ' + r.status);
    try { await r.text(); } catch (e) { /* solo interesa la dirección */ }
    return r.url;
  }

  // ---------------------------------------------------- lectura de una lista

  let cancelarLectura = false;

  async function recorrerLista(fr, que, avisar) {
    const doc = fr.contentDocument;
    if (paginaActiva(doc) !== 1 && !(await irAPagina(doc, 1))) throw new Error('no pude volver a la primera página');
    const out = [];
    const vistos = {};
    for (let vuelta = 0; vuelta < 400; vuelta++) {
      if (cancelarLectura) throw new Error('cortado');
      const pag = paginaActiva(doc);
      filasDe(doc).forEach((f) => {
        if (vistos[f.exp]) return;
        vistos[f.exp] = true;
        out.push({ exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, fav: f.fav, pag });
      });
      avisar('Leyendo ' + que + ': página ' + pag + ' (' + out.length + ' causas)');
      const sig = enlaceSiguiente(doc);
      if (!sig) break;
      const fAntes = firmaLista(doc);
      sig.click();
      if (!(await esperarCambio(doc, pag, fAntes, 25000))) throw new Error('la página ' + (pag + 1) + ' no respondió');
    }
    return out;
  }

  // Lee una lista entera: primero lo que está en trámite y después, con "Ver
  // todos los expedientes", lo que está fuera de trámite.
  async function leerLista(tipo, avisar) {
    const L = LISTAS[tipo];
    const fr = crearMarco();
    try {
      avisar('Abro ' + L.pjn + ' en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA[tipo]; }, esLista);
      if (tipoLista(fr.contentDocument) !== tipo) throw new Error('el PJN no devolvió la lista de ' + L.pjn);
      const casilla0 = casillaVerTodos(fr.contentDocument);
      if (casilla0 && casilla0.checked) throw new Error('la lista de ' + L.pjn + ' vino con "Ver todos" tildado');
      const tramite = await recorrerLista(fr, L.nombre + ' en trámite', avisar);

      const casilla = casillaVerTodos(fr.contentDocument);
      const consultar = botonConsultar(fr.contentDocument);
      let todas = null;
      if (casilla && consultar) {
        if (cancelarLectura) throw new Error('cortado');
        avisar('Pido también las causas fuera de trámite de ' + L.pjn + '...');
        await esperarCarga(fr, () => { casilla.checked = true; consultar.click(); }, esLista);
        const casilla2 = casillaVerTodos(fr.contentDocument);
        if (!casilla2 || !casilla2.checked) throw new Error('el PJN no tomó "Ver todos los expedientes"');
        todas = await recorrerLista(fr, L.nombre + ' fuera de trámite', avisar);
      }

      const deTramite = {};
      tramite.forEach((f) => { deTramite[f.exp] = f; });
      const causas = (todas || tramite).map((f) => ({
        exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult,
        fav: tipo === 'fav' ? true : f.fav,
        tramite: todas ? !!deTramite[f.exp] : true,
        pagTodas: todas ? f.pag : null,
        pagTramite: deTramite[f.exp] ? deTramite[f.exp].pag : null
      }));
      if (todas) {
        const enTodas = {};
        causas.forEach((c) => { enTodas[c.exp] = true; });
        tramite.forEach((f) => {
          if (enTodas[f.exp]) return;
          causas.push({ exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, fav: tipo === 'fav' ? true : f.fav, tramite: true, pagTodas: null, pagTramite: f.pag });
        });
      }
      return { fecha: Date.now(), causas, enTramite: causas.filter((c) => c.tramite).length, total: causas.length };
    } finally {
      fr.remove();
    }
  }

  // ------------------------------------------- ubicar una causa en un marco
  //
  // Para abrir una causa, verla en el libro digital o bajarla hace falta la
  // fila de la lista del PJN. Se usa un marco de trabajo que queda abierto y
  // se reutiliza mientras sirva.

  const MT = { fr: null, tipo: null, todas: false, ts: 0 };

  function marcoVivo(tipo, todas) {
    if (!MT.fr || !MT.fr.isConnected || MT.tipo !== tipo || MT.todas !== todas) return false;
    if (Date.now() - MT.ts > 8 * 60 * 1000) return false;
    try { return !!tablaDe(MT.fr.contentDocument); } catch (e) { return false; }
  }

  function soltarMarcoTrabajo() {
    if (MT.fr) MT.fr.remove();
    MT.fr = null; MT.tipo = null; MT.todas = false; MT.ts = 0;
  }

  async function marcoLista(tipo, todas, avisar) {
    if (marcoVivo(tipo, todas)) return MT.fr;
    soltarMarcoTrabajo();
    const fr = crearMarco();
    MT.fr = fr;
    avisar('Abro ' + LISTAS[tipo].pjn + ' en segundo plano...');
    await esperarCarga(fr, () => { fr.src = RUTA[tipo]; }, esLista);
    if (tipoLista(fr.contentDocument) !== tipo) throw new Error('el PJN no devolvió la lista de ' + LISTAS[tipo].pjn);
    if (todas) {
      const casilla = casillaVerTodos(fr.contentDocument);
      const consultar = botonConsultar(fr.contentDocument);
      if (casilla && consultar && !casilla.checked) {
        avisar('Pido las causas fuera de trámite...');
        await esperarCarga(fr, () => { casilla.checked = true; consultar.click(); }, esLista);
      }
    }
    MT.tipo = tipo; MT.todas = todas; MT.ts = Date.now();
    return fr;
  }

  const filaEn = (doc, k) => (filasDe(doc).find((f) => f.exp === k) || {}).tr || null;

  async function buscarFila(fr, dc, todas, avisar) {
    const doc = fr.contentDocument;
    const esperada = todas ? (dc.pagTodas || dc.pagTramite) : (dc.pagTramite || dc.pagTodas);
    let tr = filaEn(doc, dc.exp);
    if (!tr && esperada) {
      avisar('Busco ' + dc.exp + ' en la página ' + esperada + '...');
      if (await irAPagina(doc, esperada)) tr = filaEn(doc, dc.exp);
    }
    if (!tr && (await irAPagina(doc, 1))) {
      for (let i = 0; i < 400 && !tr; i++) {
        tr = filaEn(doc, dc.exp);
        if (tr) break;
        const sig = enlaceSiguiente(doc);
        if (!sig) break;
        const pag = paginaActiva(doc), f = firmaLista(doc);
        avisar('Busco ' + dc.exp + ': página ' + (pag + 1) + '...');
        sig.click();
        if (!(await esperarCambio(doc, pag, f, 25000))) break;
      }
    }
    return tr;
  }

  // Devuelve { fr, tr, tipo } con la fila de la causa en una lista del PJN.
  // soloRel: para lo que solo existe en Relacionados (presentar escrito).
  async function ubicarCausa(k, avisar, soloRel) {
    const tipos = (VISTA === 'fav' ? ['fav', 'rel'] : ['rel', 'fav']).filter((t) => !soloRel || t === 'rel');
    for (const tipo of tipos) {
      const dc = causaEn(tipo, k);
      if (!dc) continue;
      for (let intento = 0; intento < 2; intento++) {
        const fr = await marcoLista(tipo, !dc.tramite, avisar);
        const tr = await buscarFila(fr, dc, !dc.tramite, avisar);
        if (tr) return { fr, tr, tipo };
        // La vista del marco puede haber vencido en el servidor: se abre de nuevo.
        soltarMarcoTrabajo();
      }
    }
    throw new Error('no encuentro ' + k + (soloRel ? ' en Relacionados' : ' en las listas del PJN') + '. Probá con Actualizar');
  }

  // Abre la causa en segundo plano y devuelve la dirección del expediente.
  async function direccionDe(k, accion, avisar) {
    const u = await ubicarCausa(k, avisar, accion === 'libro');
    const a = accion === 'libro' ? enlaceMenu(u.tr, /libro digital/i) : enlaceOjo(u.tr);
    if (!a) throw new Error(accion === 'libro' ? 'la fila de ' + k + ' no tiene "Libro digital"' : 'la fila de ' + k + ' no tiene el enlace para ver el expediente');
    avisar((accion === 'libro' ? 'Pido el libro digital de ' : 'Abro ') + k + '...');
    const url = await postAccion(u.fr, a);
    let x = null;
    try { x = new URL(url); } catch (e) { x = null; }
    const ok = x && x.origin === location.origin && x.searchParams.get('cid') &&
      (accion === 'libro' ? /libroDigital/i.test(x.pathname) : /expediente\.seam$/i.test(x.pathname));
    if (!ok) {
      soltarMarcoTrabajo();
      throw new Error('el PJN no abrió ' + k + ' (si la sesión venció, recargá la página)');
    }
    return x.href;
  }

  // ------------------------------------------------------------- actuaciones

  function tablaActuaciones(doc) {
    let mejor = null;
    doc.querySelectorAll('table').forEach((t) => {
      if (esNuestro(t)) return;
      const cab = (t.tHead && t.tHead.rows[0]) || t.rows[0];
      if (!cab) return;
      const x = norm(cab.textContent);
      if (x.indexOf('fecha') < 0 || x.indexOf('tipo') < 0) return;
      if (!mejor || t.rows.length > mejor.rows.length) mejor = t;
    });
    return mejor;
  }

  const sinRotulo = (s, re) => limpio(s).replace(re, '').trim();

  function actuacionesDe(doc, hist) {
    const out = [];
    filasTabla(tablaActuaciones(doc)).forEach((tr) => {
      const links = [...tr.querySelectorAll('a[href]')];
      const bajar = links.find((a) => /viewer\.seam/i.test(a.href) && /descargar/i.test(a.textContent));
      if (!bajar) return;
      const ver = links.find((a) => /viewer\.seam/i.test(a.href) && /^ver$/i.test(limpio(a.textContent)));
      const c = tr.cells;
      const texto = limpio(tr.textContent);
      if (c && c.length >= 5) {
        out.push({
          url: bajar.href, ver: ver ? ver.href : '',
          oficina: sinRotulo(c[1].textContent, /^oficina:\s*/i),
          fecha: fechaPareja(sinRotulo(c[2].textContent, /^fecha:\s*/i)),
          tipo: sinRotulo(c[3].textContent, /^tipo actuaci[oó]n:\s*/i),
          detalle: sinRotulo(c[4].textContent, /^detalle:\s*/i),
          fojas: c[5] ? limpio(c[5].textContent) : '',
          hist: !!hist
        });
      } else {
        const f = /(\d{1,2}\/\d{1,2}\/\d{4})/.exec(texto);
        out.push({ url: bajar.href, ver: ver ? ver.href : '', oficina: '', fecha: f ? fechaPareja(f[1]) : '', tipo: '', detalle: texto.replace(/descargar|\bver\b/ig, '').slice(0, 160), fojas: '', hist: !!hist });
      }
    });
    return out;
  }

  const firmaActuaciones = (doc) => filasTabla(tablaActuaciones(doc)).map((tr) => limpio(tr.textContent).slice(0, 60)).join('|');

  async function recorrerActuaciones(doc, hist, avisar, cortar) {
    if (paginaActiva(doc, tablaActuaciones) !== 1) await irAPagina(doc, 1, firmaActuaciones, tablaActuaciones);
    const out = [];
    const vistos = {};
    for (let v = 0; v < 500; v++) {
      if (cortar && cortar()) throw new Error('cortado');
      const pag = paginaActiva(doc, tablaActuaciones);
      actuacionesDe(doc, hist).forEach((a) => {
        if (vistos[a.url]) return;
        vistos[a.url] = true;
        out.push(a);
      });
      avisar('Leyendo actuaciones' + (hist ? ' históricas' : '') + ': página ' + pag + ' (' + out.length + ' con PDF)');
      const sig = enlaceSiguiente(doc, tablaActuaciones);
      if (!sig) break;
      const f = firmaActuaciones(doc);
      sig.click();
      if (!(await esperarCambio(doc, pag, f, 25000, firmaActuaciones, tablaActuaciones))) throw new Error('la página ' + (pag + 1) + ' de actuaciones no respondió');
    }
    return out;
  }

  // Datos generales del expediente: cada rótulo va en una línea y el valor en
  // la siguiente.
  function datosExpediente(doc) {
    const lineas = textoPJN(doc).split('\n').map(limpio).filter(Boolean);
    const valor = (re) => {
      const i = lineas.findIndex((l) => re.test(l));
      if (i < 0) return '';
      const resto = lineas[i].replace(re, '').trim();
      return resto || lineas[i + 1] || '';
    };
    const expTxt = valor(/^Expediente:\s*/i);
    const m = /([A-Z]{0,4}\s*\d+\/\d{4}(?:\/[A-Z0-9]+)*)/.exec(expTxt);
    return {
      exp: m ? clave(m[1]) : '',
      jurisdiccion: valor(/^Jurisdicci[oó]n:\s*/i),
      dep: valor(/^Dependencia:\s*/i),
      sit: valor(/^Sit\. Actual:\s*/i),
      car: valor(/^Car[aá]tula:\s*/i)
    };
  }

  const tieneHistoricas = (doc) => [...doc.querySelectorAll('a')].some((a) => !esNuestro(a) && /ver\s+hist[oó]ric/i.test(a.textContent));

  // Lee todas las actuaciones con PDF de un expediente, actuales e históricas,
  // en un marco oculto y a partir de su cid.
  async function leerActuaciones(cid, avisar, cortar) {
    const fr = crearMarco();
    try {
      avisar('Abro el expediente en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      const d1 = fr.contentDocument;
      const datos = datosExpediente(d1);
      const hayHist = tieneHistoricas(d1);
      const actuales = await recorrerActuaciones(d1, false, avisar, cortar);
      let historicas = [];
      if (hayHist) {
        if (cortar && cortar()) throw new Error('cortado');
        avisar('Abro las actuaciones históricas...');
        await esperarCarga(fr, () => { fr.src = RUTA.hist + '?cid=' + encodeURIComponent(cid); }, esHistoricas);
        historicas = await recorrerActuaciones(fr.contentDocument, true, avisar, cortar);
      }
      const vistos = {};
      const todas = [];
      actuales.concat(historicas).forEach((a) => { if (!vistos[a.url]) { vistos[a.url] = true; todas.push(a); } });
      return Object.assign(datos, { cid, actuaciones: todas });
    } finally {
      fr.remove();
    }
  }

  const nombreArchivo = (exp) => 'Expediente-' + (clave(exp).replace(/[\s/]+/g, '-') || 'PJN');

  // ---------------------------------------------------------------- los PDF

  async function traerPDF(u) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(u, { credentials: 'include' });
        if (r.ok) return await r.arrayBuffer();
      } catch (e) { /* reintenta */ }
      await dormir(600);
    }
    return null;
  }

  async function unirPDF(urls, avance, cortar) {
    const { PDFDocument } = PDFLib;
    const final = await PDFDocument.create();
    let ok = 0, fallas = 0;
    for (let i = 0; i < urls.length; i++) {
      if (cortar && cortar()) throw new Error('cortado');
      avance(i, urls.length);
      const buf = await traerPDF(urls[i]);
      if (!buf) { fallas++; continue; }
      try {
        const d = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pags = await final.copyPages(d, d.getPageIndices());
        pags.forEach((p) => final.addPage(p));
        ok++;
      } catch (e) { fallas++; }
    }
    if (!ok) throw new Error('no se pudo procesar ningún PDF (suelen ser actuaciones sin PDF real)');
    avance(urls.length, urls.length);
    return { bytes: await final.save(), ok, fallas };
  }

  function guardarArchivo(datos, nombre, tipo) {
    const url = URL.createObjectURL(new Blob([datos], { type: tipo || 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  }

  // -------------------------------------------------------- cola de descargas
  //
  // Cada causa es un trabajo. modo 'todo' baja el expediente completo; modo
  // 'elegir' lee las actuaciones y espera a que se elijan. Los trabajos corren
  // de a uno, en segundo plano, sin mover la página del PJN.

  const COLA = [];
  let colaCorriendo = false;
  let cortarCola = false;
  let idTrabajo = 0;

  function nuevoTrabajo(datos) {
    const t = Object.assign({ id: 't' + (++idTrabajo), exp: '', car: '', modo: 'todo', estado: 'en cola', texto: 'En cola', frac: 0, acts: null, elegidas: null, filtro: { texto: '', desde: '', hasta: '' }, urls: null, parcial: false }, datos);
    COLA.push(t);
    return t;
  }

  function encolarCausas(claves, modo) {
    let n = 0;
    claves.forEach((k) => {
      const ya = COLA.find((t) => t.exp === k && t.modo === modo && /en cola|abriendo|leyendo|bajando|eligiendo|a bajar/.test(t.estado));
      if (ya) return;
      const c = causaPorClave(k);
      nuevoTrabajo({ exp: k, car: c ? c.car : '', modo });
      n++;
    });
    procesarCola();
    return n;
  }

  function textoTrabajo(t, texto, frac) {
    t.texto = texto;
    if (typeof frac === 'number') t.frac = frac;
    pintarTrabajo(t);
  }

  async function procesarCola() {
    if (colaCorriendo) return;
    colaCorriendo = true;
    pintarPastilla();
    try {
      for (;;) {
        const t = COLA.find((x) => x.estado === 'en cola' || x.estado === 'a bajar');
        if (!t) break;
        cortarCola = false;
        try {
          if (t.estado === 'en cola') {
            if (!t.acts) {
              if (!t.cid) {
                t.estado = 'abriendo';
                textoTrabajo(t, 'Busco la causa en el PJN...', 0);
                const url = await direccionDe(t.exp, 'ojo', (x) => textoTrabajo(t, x));
                t.cid = new URL(url).searchParams.get('cid');
              }
              if (cortarCola) throw new Error('cortado');
              t.estado = 'leyendo';
              textoTrabajo(t, 'Leyendo actuaciones...', 0);
              const r = await leerActuaciones(t.cid, (x) => textoTrabajo(t, x), () => cortarCola);
              t.acts = r.actuaciones;
              t.car = t.car || r.car;
              t.exp = t.exp || r.exp;
            }
            if (t.modo === 'elegir') {
              t.estado = 'eligiendo';
              t.elegidas = new Set();
              textoTrabajo(t, plural(t.acts.length, 'actuación con PDF', 'actuaciones con PDF') + '. Elegí cuáles bajar.', 0);
              pintarDescargas();
              continue;
            }
            t.urls = t.acts.map((a) => a.url);
            t.parcial = false;
          }
          if (!t.urls || !t.urls.length) throw new Error('no hay actuaciones con PDF para bajar');
          t.estado = 'bajando';
          textoTrabajo(t, 'Uniendo 0 de ' + t.urls.length, 0);
          const r = await unirPDF(t.urls, (i, n) => textoTrabajo(t, i < n ? 'Uniendo ' + (i + 1) + ' de ' + n : 'Generando el PDF...', i / n), () => cortarCola);
          t.archivo = nombreArchivo(t.exp) + (t.parcial ? '-seleccion' : '') + '.pdf';
          guardarArchivo(r.bytes, t.archivo);
          t.estado = 'listo';
          textoTrabajo(t, 'Listo: ' + t.archivo + ', ' + plural(r.ok, 'documento', 'documentos') + (r.fallas ? '; ' + r.fallas + ' sin PDF real' : '') + '.', 1);
        } catch (e) {
          const msg = String(e && e.message ? e.message : e);
          if (msg === 'cortado') {
            COLA.forEach((x) => { if (/en cola|abriendo|leyendo|bajando|a bajar/.test(x.estado)) { x.estado = 'cortado'; x.texto = 'Cortado por vos.'; } });
          } else {
            t.estado = 'error';
            t.texto = 'No se pudo: ' + msg + '.';
          }
          pintarTrabajo(t);
        }
        pintarDescargas();
      }
    } finally {
      colaCorriendo = false;
      cortarCola = false;
      pintarDescargas();
      pintarPastilla();
    }
  }

  const bajandoAlgo = () => colaCorriendo || COLA.some((t) => /en cola|abriendo|leyendo|bajando|a bajar/.test(t.estado));

  // ------------------------------------------------------------- dejar nota
  //
  // Motor de NOTATOMIC. Trabaja sobre la lista de Relacionados VISIBLE, porque
  // es la única que tiene el lápiz, y como confirmar recarga la página, deja
  // UNA nota por carga y retoma en la siguiente.

  let notaEnCurso = false;
  let abortarNota = false;

  function tablaNota() {
    let mejor = null;
    document.querySelectorAll('table').forEach((t) => {
      if (esNuestro(t) || t.rows.length < 2 || columnaNota(t) < 0) return;
      if (!mejor || t.rows.length > mejor.rows.length) mejor = t;
    });
    return mejor;
  }

  // La columna se ubica por el texto del encabezado: los id del PJN cambian.
  function columnaNota(t) {
    if (!t || !t.rows.length) return -1;
    const cab = [...t.rows[0].cells];
    for (let i = 0; i < cab.length; i++) {
      if (/dejar\s*nota/i.test(cab[i].textContent || '')) return i;
    }
    return -1;
  }

  function filasConLapiz() {
    const t = tablaNota();
    const col = columnaNota(t);
    if (!t || col < 0) return [];
    const out = [];
    for (let i = 1; i < t.rows.length; i++) {
      const f = t.rows[i];
      if (!f.cells[col]) continue;
      const a = f.cells[col].querySelector('a[onclick], a[href], button');
      if (!a) continue;
      out.push({ fila: f, lapiz: a, expediente: clave(f.cells[0] ? f.cells[0].textContent : '') });
    }
    return out;
  }

  const botonFiltroNota = () => [...document.querySelectorAll('input[id$="consultaFiltroSearchDejarNota"], input[value="Dejar nota"]')].find((b) => !esNuestro(b)) || null;
  const botonConfirmar = () => [...document.querySelectorAll('input[id$=":dejarNotaForm:botonAceptar"], input[value="Confirmar"]')].find((b) => !esNuestro(b)) || null;

  // El botón Confirmar existe siempre: hay que mirar el cartel mismo.
  function popupAbierto() {
    const p = document.querySelector('div[id$=":dejarNotaPopupID:dejarNotaPopup"], div[id$="dejarNotaPopup"]');
    return !!(p && getComputedStyle(p).display !== 'none');
  }

  // exito -> "Ya se ha dejado nota con el usuario N en el expediente: 32733/1980"
  // falla -> "No se pudo realizar la acción de dejar nota ..."
  function mensajePJN() {
    const t = textoPJN(document).replace(/\s+/g, ' ');
    const ok = /Ya se ha dejado nota[^]{0,80}?expediente:\s*([\d]+\/[\d]+)/i.exec(t);
    if (ok) return { ok: true, expediente: ok[1], texto: ok[0].slice(0, 120) };
    const mal = /No se pudo realizar la acci[^]{0,140}/i.exec(t);
    if (mal) return { ok: false, texto: mal[0].slice(0, 140) };
    return null;
  }

  // "CIV 032733/1980" en la tabla y "32733/1980" en el mensaje.
  function mismoExpediente(deLaTabla, delMensaje) {
    const n = (x) => String(x || '').replace(/^[A-Z]+\s*/i, '').replace(/^0+/, '').replace(/\s/g, '');
    return n(deLaTabla).split('/').slice(0, 2).join('/') === n(delMensaje);
  }

  function esperarAjax(msMax) {
    return new Promise((resolve) => {
      let listo = false;
      const fin = (data) => {
        if (listo) return;
        if (data && (data.status === 'success' || data.status === 'error')) {
          listo = true;
          setTimeout(() => resolve(data.status), 250);
        }
      };
      try {
        if (PAGINA.jsf && PAGINA.jsf.ajax && PAGINA.jsf.ajax.addOnEvent) PAGINA.jsf.ajax.addOnEvent(fin);
      } catch (e) { /* queda el vencimiento */ }
      setTimeout(() => { if (!listo) { listo = true; resolve('timeout'); } }, msMax || 20000);
    });
  }

  async function esperarA(condicion, msMax, paso) {
    const t0 = Date.now();
    while (Date.now() - t0 < (msMax || 12000)) {
      try { if (condicion()) return true; } catch (e) { /* el DOM se está rearmando */ }
      await dormir(paso || 200);
    }
    return false;
  }

  // El paginador de la lista: cada página es un elemento de una lista repetida
  // y su id trae el índice (...:0:... es la página 1). Sirve para volver directo
  // a la página en la que se estaba después de cada recarga.
  function indiceDe(el) {
    const m = /:(\d+):[^:]+$/.exec((el && el.id) || '');
    return m ? parseInt(m[1], 10) : null;
  }
  const paginadorNota = () => [...document.querySelectorAll('ul.pagination')].find((u) => !esNuestro(u)) || null;

  function paginaActualNota() {
    const ul = paginadorNota();
    if (!ul) return 0;
    const act = ul.querySelector('li.active span[id], li.active');
    const i = indiceDe(act && act.id ? act : (act ? act.querySelector('[id]') : null));
    return i === null ? 0 : i;
  }

  function cuantasPaginasNota() {
    const ul = paginadorNota();
    if (!ul) return 1;
    const idx = [...ul.querySelectorAll('[id]')].map(indiceDe).filter((x) => x !== null);
    return idx.length ? Math.max.apply(null, idx) + 1 : 1;
  }

  function enlaceAPaginaNota(idx) {
    const ul = paginadorNota();
    if (!ul) return null;
    const directo = [...ul.querySelectorAll('a')].filter((a) => indiceDe(a) === idx)[0];
    if (directo) return directo;
    return [...ul.querySelectorAll('a')].filter((a) => /siguiente|»|>/i.test((a.textContent || '').trim() + ' ' + ((a.querySelector('[title]') || {}).title || '')))[0] || null;
  }

  async function irAPaginaNota(idx) {
    let vueltas = 0;
    while (paginaActualNota() !== idx && vueltas < 12) {
      const a = enlaceAPaginaNota(idx);
      if (!a) return false;
      const espera = esperarAjax(20000);
      a.click();
      await espera;
      await dormir(700);
      vueltas++;
    }
    return paginaActualNota() === idx;
  }

  function paginaSiguienteNota() {
    const act = paginaActualNota();
    if (act + 1 >= cuantasPaginasNota()) return null;
    return enlaceAPaginaNota(act + 1);
  }

  const leerCorrida = () => leerSesion(S_CORRIDA);
  const guardarCorrida = (c) => guardarSesion(S_CORRIDA, c);
  const corridaActiva = () => { const c = leerCorrida(); return !!(c && c.activa); };

  // solo: null deja nota en todas las habilitadas; si no, las claves elegidas.
  function nuevaCorrida(solo) {
    return {
      activa: true,
      solo: solo || null,
      hechos: [],
      problemas: [],
      pausa: Math.max(300, parseInt(CFG.pausaNota, 10) || 700),
      enCurso: null,
      pagina: 0,
      inicio: Date.now()
    };
  }

  const pendientesAqui = (c) => filasConLapiz().filter((x) => c.hechos.indexOf(x.expediente) < 0 &&
    (!c.solo || c.solo.indexOf(x.expediente) >= 0));

  const quedanElegidos = (c) => !c.solo || c.solo.some((e) => c.hechos.indexOf(e) < 0);

  function progresoNota(c) {
    return c.solo ? c.hechos.length + ' de ' + c.solo.length : String(c.hechos.length);
  }

  async function pasoNota() {
    const c = leerCorrida();
    if (!c || !c.activa) return;
    notaEnCurso = true;
    pintarNota();

    // 1. Si volvimos de confirmar, leer cómo salió la anterior.
    if (c.enCurso) {
      await esperarA(() => !!mensajePJN(), 6000);
      const m = mensajePJN();
      if (m && m.ok && mismoExpediente(c.enCurso, m.expediente)) {
        // salió bien
      } else if (m && !m.ok) {
        c.problemas.push(c.enCurso + ': ' + m.texto.slice(0, 70));
      } else if (m && m.ok) {
        c.problemas.push(c.enCurso + ': el PJN contestó por ' + m.expediente);
      } else {
        c.problemas.push(c.enCurso + ': sin respuesta visible');
      }
      if (c.hechos.indexOf(c.enCurso) < 0) c.hechos.push(c.enCurso);
      c.enCurso = null;
      guardarCorrida(c);
    }

    if (abortarNota || c.cortar) { terminarNota(c, 'Cortado por vos.'); return; }
    if (!quedanElegidos(c)) { terminarNota(c, null); return; }

    // 1 bis. Si la recarga nos devolvió a la primera página, volver a la que iba.
    if ((c.pagina || 0) !== paginaActualNota()) {
      estadoNota('Vuelvo a la página ' + ((c.pagina || 0) + 1) + '...');
      const ok = await irAPaginaNota(c.pagina || 0);
      if (!ok) { c.pagina = paginaActualNota(); guardarCorrida(c); }
    }

    // 2. Si la recarga se llevó el filtro, volver a ponerlo.
    if (!filasConLapiz().length) {
      const f = botonFiltroNota();
      if (f) {
        estadoNota('Pongo el filtro "Dejar nota" del PJN...');
        const espera = esperarAjax(20000);
        f.click();
        await espera;
        await esperarA(() => filasConLapiz().length > 0, 8000);
        if (!filasConLapiz().length) {
          terminarNota(c, 'Con el filtro puesto no aparece ninguna causa con lápiz.');
          return;
        }
        pasoNota();
        return;
      }
    }

    // 3. Buscar la próxima pendiente de esta página.
    const prox = pendientesAqui(c)[0];

    // 4. Si no queda ninguna, probar la página siguiente.
    if (!prox) {
      const sig = paginaSiguienteNota();
      if (sig) {
        estadoNota('Página ' + (paginaActualNota() + 1) + ' de ' + cuantasPaginasNota() + ' lista. Paso a la siguiente...');
        c.pagina = paginaActualNota() + 1;
        guardarCorrida(c);
        const espera = esperarAjax(20000);
        sig.click();
        await espera;
        await dormir(900);
        pasoNota();
        return;
      }
      terminarNota(c, null);
      return;
    }

    // 5. Dejar la nota: lápiz, esperar el cartel, confirmar.
    estadoNota('Dejando nota en ' + prox.expediente + ' (van ' + progresoNota(c) + ')...');
    c.enCurso = prox.expediente;
    guardarCorrida(c);

    const delLapiz = esperarAjax(20000);
    prox.lapiz.click();
    await delLapiz;

    const hayCartel = await esperarA(popupAbierto, 15000);
    if (!hayCartel) {
      c.problemas.push(prox.expediente + ': el cartel no llegó a abrirse');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      guardarCorrida(c);
      await dormir(800);
      pasoNota();
      return;
    }

    await dormir(350);
    const b = botonConfirmar();
    if (!b) {
      c.problemas.push(prox.expediente + ': no encuentro el botón Confirmar');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      guardarCorrida(c);
      pasoNota();
      return;
    }

    await dormir(c.pausa || 700);
    const c2 = leerCorrida();
    if (abortarNota || (c2 && c2.cortar)) { c.enCurso = null; guardarCorrida(c); terminarNota(c, 'Cortado por vos.'); return; }
    b.click();
    // A partir de acá la página se recarga y el arranque retoma.
  }

  function terminarNota(c, motivo) {
    const malos = {};
    c.problemas.forEach((p) => { const i = p.indexOf(': '); malos[p.slice(0, i)] = p.slice(i + 2); });
    // Las elegidas que no aparecieron con lápiz en ninguna página. Si se cortó a
    // mano no se cuentan: no se llegó a ellas.
    const noVistas = (c.solo && !motivo) ? c.solo.filter((e) => c.hechos.indexOf(e) < 0) : [];
    const hoy = hoyISO();
    c.hechos.forEach((e) => { NOTAS[e] = { f: hoy, ok: !malos[e], m: malos[e] || '' }; });
    noVistas.forEach((e) => { NOTAS[e] = { f: hoy, ok: false, m: 'no apareció con lápiz en la lista del PJN' }; });
    guardarAlmacen(K_NOTAS, NOTAS);
    borrarSesion(S_CORRIDA);
    notaEnCurso = false;
    abortarNota = false;
    const ok = c.hechos.length - Object.keys(malos).length;
    const fallas = Object.keys(malos).map((k) => k + ': ' + malos[k]).concat(noVistas.map((e) => e + ': no apareció con lápiz'));
    avisar((motivo ? motivo + ' ' : '') + 'Terminado: ' + plural(ok, 'nota dejada', 'notas dejadas') +
      (fallas.length ? '. No salieron ' + fallas.length + ': ' + fallas.join(' | ') : '.'), !!fallas.length);
    pintarNota();
    pintarTodo();
  }

  // Arranca una tanda. Siempre desde una carga limpia de Relacionados, para que
  // ningún filtro del PJN esconda causas.
  function iniciarNota(solo) {
    if (notaEnCurso || corridaActiva()) return;
    if (solo && !solo.length) { avisar('No hay ninguna causa seleccionada.', true); return; }
    guardarSesion(S_ENCARGO, { tipo: 'nota', solo: solo || null, ts: Date.now() });
    avisar('Voy a la lista de Relacionados del PJN para dejar nota...');
    location.href = RUTA.rel;
  }

  function arrancarNotaDesdeEncargo(enc) {
    if (tipoLista(document) !== 'rel' || (!botonConfirmar() && !botonFiltroNota())) {
      avisar('La lista de Relacionados del PJN no tiene la función de dejar nota en este momento.', true);
      return;
    }
    abortarNota = false;
    guardarCorrida(nuevaCorrida(enc.solo));
    pasoNota();
  }

  // Cortar no borra la tanda: la marca, para que la próxima carga la cierre con
  // el resultado de lo que se llegó a hacer.
  function cortarNota() {
    abortarNota = true;
    const c = leerCorrida();
    if (c) { c.cortar = true; guardarCorrida(c); }
    estadoNota('Cortando: freno después de la que está en curso.');
    // Si la página recién cargó y el paso todavía no arrancó, se arranca ahora:
    // primero lee cómo salió la última nota confirmada y después cierra.
    if (c && !notaEnCurso) pasoNota();
  }

  // ------------------------------------------------- etiquetas y anotaciones
  //
  // Van indexadas por número de expediente ("CIV 012345/2023"). Se guardan en
  // el almacén de Tampermonkey de esta PC y se llevan a otra con Exportar e
  // Importar. La importación no pisa nada: suma etiquetas y, si una anotación
  // difiere, conserva las dos.

  const COLORES = [
    { id: 'amarillo', nom: 'Amarillo', hex: '#ffe299' },
    { id: 'rojo', nom: 'Rojo', hex: '#ff9f9f' },
    { id: 'rojofuerte', nom: 'Rojo fuerte', hex: '#c93b3b', txt: '#ffffff' },
    { id: 'naranja', nom: 'Naranja', hex: '#ffc38f' },
    { id: 'rosa', nom: 'Rosa', hex: '#ffa8e1' },
    { id: 'violeta', nom: 'Violeta', hex: '#dcb0ff' },
    { id: 'lavanda', nom: 'Lavanda', hex: '#b3c3ff' },
    { id: 'celeste', nom: 'Celeste', hex: '#a7e3ff' },
    { id: 'agua', nom: 'Agua', hex: '#a3f2dc' },
    { id: 'verde', nom: 'Verde', hex: '#b2eab4' },
    { id: 'azul', nom: 'Azul', hex: AZUL, txt: '#ffffff' }
  ];
  const colorDe = (id) => COLORES.find((c) => c.id === id) || COLORES[0];
  const estiloChip = (id) => {
    const c = colorDe(id);
    return 'background:' + c.hex + ';color:' + (c.txt || '#1d2b36') + (c.txt ? ';border-color:' + c.hex : '');
  };

  const normalizarMarcas = (m) => (!m || typeof m !== 'object')
    ? { etiquetas: [], filas: {} }
    : { etiquetas: Array.isArray(m.etiquetas) ? m.etiquetas : [], filas: (m.filas && typeof m.filas === 'object') ? m.filas : {} };

  let MARCAS = normalizarMarcas(leerAlmacen(K_MARCAS, null));
  let RESPALDO = leerAlmacen(K_RESPALDO, null);

  const guardarMarcas = () => {
    if (!guardarAlmacen(K_MARCAS, MARCAS)) avisar('No se pudieron guardar las etiquetas y anotaciones.', true);
  };
  const marcaDe = (k) => MARCAS.filas[k] || { et: [], nota: '' };
  const etiquetaDe = (id) => MARCAS.etiquetas.find((e) => e.id === id);
  const etiquetasDe = (k) => (marcaDe(k).et || []).map(etiquetaDe).filter(Boolean);

  function fijarMarca(k, cambio) {
    const m = Object.assign({ et: [], nota: '' }, MARCAS.filas[k] || {}, cambio);
    if (!m.et.length && !String(m.nota || '').trim()) delete MARCAS.filas[k];
    else MARCAS.filas[k] = { et: m.et, nota: m.nota };
    guardarMarcas();
  }

  function alternarEtiqueta(k, id) {
    const et = (marcaDe(k).et || []).slice();
    const i = et.indexOf(id);
    if (i >= 0) et.splice(i, 1); else et.push(id);
    fijarMarca(k, { et });
  }

  function crearEtiqueta(nombre, color) {
    nombre = limpio(nombre).slice(0, 28);
    if (!nombre) return null;
    const ya = MARCAS.etiquetas.find((e) => norm(e.nom) === norm(nombre));
    if (ya) return ya.id;
    const id = 'et' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    MARCAS.etiquetas.push({ id, nom: nombre, color: color || COLORES[0].id });
    guardarMarcas();
    return id;
  }

  function borrarEtiqueta(id) {
    MARCAS.etiquetas = MARCAS.etiquetas.filter((e) => e.id !== id);
    Object.keys(MARCAS.filas).forEach((k) => {
      const f = MARCAS.filas[k];
      f.et = (f.et || []).filter((x) => x !== id);
      if (!f.et.length && !String(f.nota || '').trim()) delete MARCAS.filas[k];
    });
    guardarMarcas();
  }

  const usoDe = (id) => Object.values(MARCAS.filas).filter((f) => (f.et || []).indexOf(id) >= 0).length;

  function exportarMarcas() {
    guardarArchivo(JSON.stringify({
      formato: 'supjn+/marcas', version: 1, fecha: new Date().toISOString(),
      etiquetas: MARCAS.etiquetas, filas: MARCAS.filas
    }, null, 1), 'SuPJN+-etiquetas-' + selloArchivo() + '.json', 'application/json');
    RESPALDO = { fecha: Date.now() };
    guardarAlmacen(K_RESPALDO, RESPALDO);
  }

  function importarMarcas(texto) {
    let d;
    try { d = JSON.parse(texto); } catch (e) { return 'El archivo no es un JSON válido.'; }
    if (!d || d.formato !== 'supjn+/marcas' || !d.filas || typeof d.filas !== 'object') return 'El archivo no es una exportación de SuPJN+.';
    const mapa = {};
    (d.etiquetas || []).forEach((e) => {
      if (!e || !e.id || !e.nom) return;
      const igual = MARCAS.etiquetas.find((x) => norm(x.nom) === norm(e.nom));
      mapa[e.id] = igual ? igual.id : crearEtiqueta(e.nom, e.color);
    });
    let filas = 0;
    Object.keys(d.filas).forEach((k) => {
      const orig = d.filas[k] || {};
      const aca = marcaDe(k);
      const et = (aca.et || []).slice();
      (orig.et || []).forEach((x) => {
        const id = mapa[x] || x;
        if (etiquetaDe(id) && et.indexOf(id) < 0) et.push(id);
      });
      let nota = aca.nota || '';
      const otra = String(orig.nota || '').trim();
      if (otra && otra !== nota.trim()) nota = nota ? nota + '\n\n' + otra : otra;
      if (et.length || nota.trim()) { MARCAS.filas[k] = { et, nota }; filas++; }
    });
    guardarMarcas();
    return { filas, etiquetas: MARCAS.etiquetas.length };
  }

  // ------------------------------------------------------------ datos leídos

  const validarDatos = (d) => (d && Array.isArray(d.causas)) ? d : null;
  const DATOS = { rel: validarDatos(leerAlmacen(K_REL, null)), fav: validarDatos(leerAlmacen(K_FAV, null)) };
  const INDICE = { rel: new Map(), fav: new Map() };
  function indexar(tipo) {
    INDICE[tipo] = new Map();
    if (DATOS[tipo]) DATOS[tipo].causas.forEach((c) => INDICE[tipo].set(c.exp, c));
  }
  indexar('rel');
  indexar('fav');

  let NOTAS = leerAlmacen(K_NOTAS, {}) || {};

  const causaEn = (tipo, k) => INDICE[tipo].get(k) || null;
  const causaPorClave = (k) => causaEn(VISTA === 'fav' ? 'fav' : 'rel', k) || causaEn('rel', k) || causaEn('fav', k);

  // ------------------------------------------------------ configuración

  // w es el ancho de fábrica y m el mínimo al que se la puede achicar: el
  // encuadre reparte hasta ahí y no más, para que la fecha o el expediente no
  // queden cortados.
  const COLS_DEF = [
    { k: 'exp', t: 'Expediente', w: 158, m: 118 },
    { k: 'dep', t: 'Dependencia', w: 230, m: 96 },
    { k: 'car', t: 'Carátula', w: 330, m: 130 },
    { k: 'sit', t: 'Situación', w: 118, m: 78 },
    { k: 'ult', t: 'Últ. act.', w: 96, m: 86 },
    { k: 'nota', t: 'Nota', w: 108, m: 88 },
    { k: 'et', t: 'Etiquetas', w: 160, m: 78 },
    { k: 'anot', t: 'Anotación', w: 190, m: 78 }
  ];
  const COL = {};
  COLS_DEF.forEach((c) => { COL[c.k] = c; });

  // Las actuaciones del expediente van en columnas de verdad, con el mismo
  // manejo que la tabla de causas: se ordenan, se mueven y se ensanchan.
  const COLS_ACT_DEF = [
    { k: 'fecha', t: 'Fecha', w: 92, m: 88 },
    { k: 'tipo', t: 'Tipo de actuación', w: 200, m: 94 },
    { k: 'detalle', t: 'Descripción / detalle', w: 430, m: 120 },
    { k: 'fojas', t: 'Fs.', w: 74, m: 62 }
  ];

  // Cada tabla guarda su orden de columnas, sus anchos, las ocultas y su orden
  // de filas en su propia clave de la configuración.
  const TABLAS = {
    lista: { def: COLS_DEF, cols: 'cols', ocultas: 'ocultas', anchos: 'anchos', orden: 'orden' },
    act: { def: COLS_ACT_DEF, cols: 'colsAct', ocultas: 'ocultasAct', anchos: 'anchosAct', orden: 'ordenAct' }
  };
  const defCol = (tabla, k) => TABLAS[tabla].def.find((c) => c.k === k);

  const CFG_DEF = {
    vista: 'rel', texto: '', fuero: '', sit: '', tramite: 'todas', etiqueta: '', desde: '', hasta: '',
    orden: { col: 'ult', desc: true }, porPagina: 25, maxi: false,
    cols: null, ocultas: [], anchos: {}, pausaNota: 700, tam: {},
    colsAct: null, ocultasAct: [], anchosAct: {}, ordenAct: { col: '', desc: true },
    zoom: 1, encuadrar: true
  };
  const CFG_GUARDADA = leerAlmacen(K_CFG, {}) || {};
  let CFG = Object.assign({}, CFG_DEF, CFG_GUARDADA);
  // La 0.1.0 llamaba "nota" a la columna de la anotación.
  if (!CFG_GUARDADA.cols && CFG.orden && CFG.orden.col === 'nota') CFG.orden = { col: 'anot', desc: CFG.orden.desc };
  if (!CFG_GUARDADA.cols && CFG.etiqueta === '@nota') CFG.etiqueta = '@anot';
  if (!CFG_GUARDADA.cols) CFG.cols = COLS_DEF.map((c) => c.k);
  if (!CFG.orden || !COL[CFG.orden.col]) CFG.orden = { col: 'ult', desc: true };
  if (!Array.isArray(CFG.ocultas)) CFG.ocultas = [];
  if (!CFG.anchos || typeof CFG.anchos !== 'object') CFG.anchos = {};
  if (!CFG.tam || typeof CFG.tam !== 'object') CFG.tam = {};
  if (!Array.isArray(CFG.ocultasAct)) CFG.ocultasAct = [];
  if (!CFG.anchosAct || typeof CFG.anchosAct !== 'object') CFG.anchosAct = {};
  if (!CFG.ordenAct || typeof CFG.ordenAct !== 'object') CFG.ordenAct = { col: '', desc: true };
  const guardarCfg = () => guardarAlmacen(K_CFG, CFG);

  // Zoom de la ventana. La geometría se guarda en píxeles de pantalla y se
  // divide por el factor al escribirla, así la ventana no se mueve ni cambia
  // de tamaño al acercar o alejar: lo que cambia es cuánto entra adentro.
  const ZOOMS = [0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
  const acotarZoom = (z) => Math.max(ZOOMS[0], Math.min(ZOOMS[ZOOMS.length - 1], Math.round((Number(z) || 1) * 100) / 100));
  CFG.zoom = acotarZoom(CFG.zoom);
  const zoomAct = () => CFG.zoom || 1;
  const zoomVecino = (paso) => {
    const z = zoomAct();
    if (paso > 0) return ZOOMS.find((x) => x > z + 0.001) || z;
    const menores = ZOOMS.filter((x) => x < z - 0.001);
    return menores.length ? menores[menores.length - 1] : z;
  };

  function ordenColumnas(tabla) {
    const T = TABLAS[tabla];
    const guardado = CFG[T.cols];
    const vistas = {};
    const out = [];
    (Array.isArray(guardado) ? guardado : []).forEach((k) => { if (defCol(tabla, k) && !vistas[k]) { vistas[k] = true; out.push(k); } });
    T.def.forEach((c) => { if (!vistas[c.k]) out.push(c.k); });
    return out;
  }
  const columnasVisibles = (tabla) => ordenColumnas(tabla).filter((k) => (CFG[TABLAS[tabla].ocultas] || []).indexOf(k) < 0);
  const minCol = (tabla, k) => { const d = defCol(tabla, k); return Math.min(d.w, d.m || 58); };
  const anchoDe = (tabla, k) => Math.max(minCol(tabla, k), parseInt((CFG[TABLAS[tabla].anchos] || {})[k], 10) || defCol(tabla, k).w);

  function moverColumna(tabla, k, destino, despues) {
    const orden = ordenColumnas(tabla).filter((x) => x !== k);
    let i = orden.indexOf(destino);
    if (i < 0) i = orden.length; else if (despues) i++;
    orden.splice(i, 0, k);
    CFG[TABLAS[tabla].cols] = orden;
    guardarCfg();
  }

  // Clic en un título: un sentido, el otro y, en actuaciones, de vuelta al
  // orden en que las trae el PJN.
  function alternarOrden(tabla, k) {
    const clave = TABLAS[tabla].orden;
    const o = CFG[clave] || { col: '', desc: true };
    const d0 = tabla === 'lista' ? (k === 'ult' || k === 'nota') : (k === 'fecha');
    if (o.col !== k) CFG[clave] = { col: k, desc: d0 };
    else if (o.desc === d0) CFG[clave] = { col: k, desc: !d0 };
    else CFG[clave] = tabla === 'act' ? { col: '', desc: true } : { col: k, desc: d0 };
    guardarCfg();
  }

  // Valor por el que se ordena cada columna de actuaciones.
  function valorOrdenAct(a, k) {
    if (k === 'fecha') return String(numFecha(a.fecha)).padStart(8, '0');
    if (k === 'fojas') return String(parseInt(limpio(a.fojas), 10) || 0).padStart(6, '0');
    return norm(a[k]);
  }

  // ------------------------------------------------------- estado de la vista

  let VISTA = 'rel';            // rel | fav | exp | desc | marcas | acerca
  const SEL = { rel: new Set(), fav: new Set() };
  const PAGINA_VISTA = { rel: 1, fav: 1 };
  let abierta = null;           // causa con el detalle de etiquetas desplegado
  let leyendo = false;

  let ULTIMA_LISTA = 'rel';     // la última lista mirada, para las vistas que no son tabla
  const esVistaLista = () => VISTA === 'rel' || VISTA === 'fav';
  // Desde Dejar nota o Descargas, "las seleccionadas" son las de la lista de
  // la que se viene: si estaba mirando Favoritos, las de Favoritos.
  const irALista = (v) => { if (v === 'rel' || v === 'fav') ULTIMA_LISTA = v; };
  const listaActual = () => (esVistaLista() ? VISTA : ULTIMA_LISTA);
  const datosVista = () => DATOS[listaActual()];
  const selVista = () => SEL[listaActual()];

  // Nombres de los fueros, tomados del desplegable de Cámara del propio PJN.
  const NOMBRES_FUERO = {};
  document.querySelectorAll('select option').forEach((o) => {
    const m = /^([A-Z]{2,4})\s*-\s*(.+)$/.exec(limpio(o.textContent));
    if (m) NOMBRES_FUERO[m[1]] = m[2];
  });

  function valorOrden(c, k) {
    if (k === 'exp') return ordenExp(c.exp);
    if (k === 'ult') return String(numFecha(c.ult)).padStart(8, '0');
    if (k === 'et') return norm(etiquetasDe(c.exp).map((e) => e.nom).join(' '));
    if (k === 'anot') return norm(marcaDe(c.exp).nota);
    if (k === 'nota') { const n = NOTAS[c.exp]; return n ? n.f + (n.ok ? '1' : '0') : ''; }
    return norm(c[k]);
  }

  function filtradas() {
    const D = datosVista();
    if (!D) return [];
    const t = norm(CFG.texto);
    const desde = numDeInput(CFG.desde), hasta = numDeInput(CFG.hasta);
    const L = D.causas.filter((c) => {
      if (CFG.fuero === '@sin' ? !!fueroDe(c.exp) : (CFG.fuero && fueroDe(c.exp) !== CFG.fuero)) return false;
      if (CFG.sit && c.sit !== CFG.sit) return false;
      if (CFG.tramite === 'si' && !c.tramite) return false;
      if (CFG.tramite === 'no' && c.tramite) return false;
      if (desde || hasta) {
        const f = numFecha(c.ult);
        if (!f || (desde && f < desde) || (hasta && f > hasta)) return false;
      }
      const m = marcaDe(c.exp);
      if (CFG.etiqueta === '@sin' && (m.et || []).length) return false;
      if (CFG.etiqueta === '@anot' && !String(m.nota || '').trim()) return false;
      if (CFG.etiqueta === '@nota' && !NOTAS[c.exp]) return false;
      if (CFG.etiqueta && CFG.etiqueta[0] !== '@' && (m.et || []).indexOf(CFG.etiqueta) < 0) return false;
      if (t) {
        const todo = norm([c.exp, c.dep, c.car, c.sit, c.ult, etiquetasDe(c.exp).map((e) => e.nom).join(' '), m.nota].join(' '));
        if (todo.indexOf(t) < 0) return false;
      }
      return true;
    });
    const { col, desc } = CFG.orden;
    L.sort((a, b) => {
      const x = valorOrden(a, col), y = valorOrden(b, col);
      return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
    });
    return L;
  }

  // ------------------------------------------------------------------ estilos

  const CSS = [
    '#supjn-pastilla{position:fixed;right:16px;bottom:16px;z-index:2147483000;background:' + AZUL + ';color:#fff;padding:7px 13px;border-radius:16px;cursor:pointer;font:600 13px "Segoe UI",Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);user-select:none;border:0}',
    '#supjn-pastilla:hover{background:#1c5591}',
    '#supjn-pastilla .cant{background:rgba(255,255,255,.22);border-radius:9px;padding:0 7px;margin-left:7px;font-weight:600}',
    '#supjn{box-sizing:border-box;position:fixed;z-index:2147483100;background:#fff;border:1px solid #0d2f52;border-radius:8px;box-shadow:0 18px 60px rgba(0,0,0,.42);display:flex;flex-direction:column;font:13px/1.45 "Segoe UI",Arial,sans-serif;color:#1d2b36;overflow:hidden;min-width:520px;min-height:320px}',
    // Maximizada, el tamaño va en variables: con zoom, 100vw se multiplicaría
    // por el factor y la ventana se iría de la pantalla.
    '#supjn.maxi{left:0!important;top:0!important;width:var(--sj-w,100vw)!important;height:var(--sj-h,100vh)!important;border-radius:0}',
    '#supjn *{box-sizing:border-box}',
    '#supjn button{font-family:"Segoe UI",Arial,sans-serif;text-transform:none;letter-spacing:normal}',
    '#supjn label{margin:0;font-weight:inherit;max-width:none}',
    '#supjn input[type=checkbox]{margin:0}',
    '#supjn h2,#supjn h3,#supjn h4{font-family:"Segoe UI",Arial,sans-serif;line-height:1.3}',
    '#supjn p{font-size:13px}',
    '.sj-tit{display:flex;align-items:center;gap:10px;background:' + AZUL + ';color:#fff;height:38px;padding:0 6px 0 14px;flex:none;user-select:none;cursor:move}',
    '.sj-tit b{letter-spacing:.03em;font-size:14px}',
    '.sj-tit .v{opacity:.7;font-size:11px}',
    '.sj-tit .fn{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);color:#fff;border-radius:5px;height:26px;padding:0 10px;cursor:pointer;font:600 12px "Segoe UI",Arial,sans-serif}',
    '.sj-tit .fn:hover{background:rgba(255,255,255,.26)}',
    '.sj-tit .zm{margin-left:auto;display:flex;align-items:center;gap:1px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);border-radius:5px;padding:1px}',
    '.sj-tit .zm button{background:transparent;border:0;color:#fff;height:22px;min-width:24px;padding:0 4px;border-radius:4px;cursor:pointer;font:600 13px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .zm button:hover{background:rgba(255,255,255,.22)}',
    '.sj-tit .zm button.pc{font-size:11px;min-width:44px;opacity:.85}',
    '.sj-tit .zm button.pc.act{opacity:1;background:rgba(255,255,255,.22)}',
    '.sj-tit .ctrl{margin-left:8px;display:flex;gap:2px}',
    '.sj-tit .ctrl button{background:transparent;border:0;color:#fff;width:30px;height:26px;border-radius:4px;cursor:pointer;font:400 15px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .ctrl button:hover{background:rgba(255,255,255,.18)}',
    '.sj-tit .ctrl button.x:hover{background:#c93b3b}',
    '.sj-solapas{display:flex;gap:2px;padding:0 10px;background:#e9f0f6;border-bottom:1px solid #c9d7e3;flex:none;overflow-x:auto}',
    '.sj-solapas button{background:transparent;border:0;border-bottom:3px solid transparent;color:#4a6272;padding:8px 12px 6px;cursor:pointer;font:600 12.5px "Segoe UI",Arial,sans-serif;white-space:nowrap}',
    '.sj-solapas button:hover{color:' + AZUL + '}',
    '.sj-solapas button.act{color:' + AZUL + ';border-bottom-color:' + AZUL + ';background:#fff}',
    '.sj-solapas .cant{background:#d4e1ec;color:' + AZUL + ';border-radius:9px;padding:0 6px;margin-left:5px;font-size:11px}',
    '.sj-barra{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;padding:8px 12px;border-bottom:1px solid #dbe4e8;background:#f5f8fa;flex:none}',
    '.sj-barra > *{height:30px;font:12px "Segoe UI",Arial,sans-serif}',
    '.sj-barra input[type=text]{flex:1 1 220px;min-width:160px;border:1px solid #b9c9d0;border-radius:5px;padding:0 9px}',
    '.sj-barra select,.sj-barra input[type=date]{height:30px;border:1px solid #b9c9d0;border-radius:5px;padding:0 6px;background:#fff;color:#1d2b36;max-width:200px}',
    '.sj-barra label{display:inline-flex;align-items:center;gap:5px;color:#5a7581}',
    '.sj-b{border:1px solid #b9cde0;background:#eaf1f8;color:' + AZUL + ';border-radius:5px;padding:0 11px;cursor:pointer;font:600 12px "Segoe UI",Arial,sans-serif;height:30px;white-space:nowrap}',
    '.sj-b:hover{background:#dbe8f5}',
    '.sj-b.prim{background:' + AZUL_CLARO + ';border-color:' + AZUL_CLARO + ';color:#fff}',
    '.sj-b.prim:hover{background:#3f72bb}',
    '.sj-b.peligro{background:#b3261e;border-color:#b3261e;color:#fff}',
    '.sj-b.chico{height:26px;padding:0 8px}',
    '.sj-b:disabled{opacity:.45;cursor:default}',
    '.sj-est{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:6px 12px;border-bottom:1px solid #e6ecef;flex:none;font-size:12px;color:#3a4c54}',
    '.sj-est .txt{flex:1 1 300px}',
    '.sj-copia{border-radius:12px;padding:3px 10px;font-weight:600;cursor:pointer;border:1px solid transparent;font-size:11.5px}',
    '.sj-copia.ok{background:#e6f4ea;color:#1b6b3a;border-color:#b8dfc4}',
    '.sj-copia.vieja{background:#fdecea;color:#b3261e;border-color:#f3c3be}',
    '.sj-copia.nunca{background:#fff4d6;color:#7a5a00;border-color:#f0dca0}',
    '.sj-accion{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;padding:6px 12px;border-bottom:1px solid #e6ecef;background:#fbfcfd;flex:none;font-size:12px}',
    '.sj-accion .cuenta{font-weight:700;color:' + AZUL + ';margin-right:4px}',
    '.sj-accion .der{margin-left:auto;display:flex;gap:6px;align-items:center}',
    '.sj-confirma{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:9px 12px;background:#fff4d6;border-bottom:1px solid #f0dca0;color:#5c4400;flex:none;font-size:12.5px}',
    '.sj-confirma input{width:64px;height:26px;border:1px solid #d9c38a;border-radius:4px;padding:0 6px}',
    '.sj-aviso{padding:7px 12px;font-size:12px;background:#e8f1fb;color:#123f6b;border-bottom:1px solid #c7dbef;flex:none;white-space:pre-wrap}',
    '.sj-aviso.malo{background:#fdecea;color:#8c1d18;border-color:#f3c3be}',
    '.sj-nota-barra{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;background:#fff4d6;border-bottom:1px solid #f0dca0;flex:none;font-size:12.5px;color:#5c4400}',
    '.sj-nota-barra b{color:#5c4400}',
    '.sj-cuerpo{flex:1;overflow:auto;background:#fff;position:relative}',
    'table.sj-t{border-collapse:collapse;table-layout:fixed}',
    'table.sj-t th{position:sticky;top:0;z-index:2;background:' + AZUL + ';color:#fff;text-align:left;font-weight:600;font-size:12px;padding:8px 9px;white-space:nowrap;user-select:none;overflow:hidden;text-overflow:ellipsis}',
    'table.sj-t th.mov{cursor:grab}',
    'table.sj-t th.mov:hover{background:#1c5591}',
    'table.sj-t th .fl{opacity:.5;margin-left:5px;font-size:10px}',
    'table.sj-t th.act .fl{opacity:1}',
    'table.sj-t th.arrastrando{opacity:.45}',
    'table.sj-t th.drop-izq{box-shadow:inset 3px 0 0 #ffd24d}',
    'table.sj-t th.drop-der{box-shadow:inset -3px 0 0 #ffd24d}',
    'table.sj-t th .rs{position:absolute;right:0;top:0;width:7px;height:100%;cursor:col-resize}',
    'table.sj-t th .rs:hover{background:rgba(255,255,255,.35)}',
    'table.sj-t th.fija{cursor:default}',
    'table.sj-t td{padding:7px 9px;border-bottom:1px solid #edf1f3;vertical-align:top;font-size:12.5px;overflow-wrap:anywhere;overflow:hidden}',
    'table.sj-t tr:nth-child(even) td{background:#fafcfd}',
    'table.sj-t tr:hover td{background:#eef5fc}',
    'table.sj-t tr.sel td{background:#fff8dc}',
    'table.sj-t tr.fuera td{color:#6b7c85}',
    'table.sj-t td.cs,table.sj-t th.cs{text-align:center;padding-left:4px;padding-right:4px}',
    'table.sj-t input[type=checkbox]{width:15px;height:15px;cursor:pointer;margin:0}',
    '.sj-exp{font-family:Consolas,monospace;font-size:12px;white-space:nowrap}',
    '.sj-fav{color:#d39e00;margin-left:4px}',
    '.sj-badge{display:inline-block;margin-top:3px;font-size:10.5px;font-weight:600;color:#6b7c85;background:#eef2f4;border-radius:8px;padding:0 7px}',
    '.sj-res{font-size:11.5px;font-weight:600;white-space:nowrap}',
    '.sj-res.ok{color:#1b6b3a}',
    '.sj-res.mal{color:#b3261e}',
    '.sj-chip{display:inline-block;padding:1px 9px;border-radius:10px;font:600 11px "Segoe UI",Arial,sans-serif;margin:0 4px 3px 0;border:1px solid rgba(0,0,0,.12);white-space:nowrap}',
    'button.sj-chip{cursor:pointer}',
    '.sj-chip.off{background:transparent!important;color:#8a98a8!important;border-style:dashed}',
    '.sj-toque{cursor:pointer;min-height:20px;border-radius:4px;margin:-3px -5px;padding:3px 5px}',
    '.sj-toque:hover{background:#e3eefa;box-shadow:inset 0 0 0 1px #b9cde0}',
    '.sj-poner{color:#9fb0ba;font-size:11.5px;font-weight:600;visibility:hidden}',
    'table.sj-t tr:hover .sj-poner{visibility:visible}',
    '.sj-nota-txt{color:#3a4c54;font-size:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.sj-acc{display:flex;gap:4px;justify-content:flex-end}',
    '.sj-abrir{height:26px;padding:0 10px;border-radius:4px;border:1px solid ' + AZUL_CLARO + ';background:' + AZUL_CLARO + ';color:#fff;font:600 12px "Segoe UI",Arial,sans-serif;cursor:pointer}',
    '.sj-abrir:hover{background:#3f72bb}',
    '.sj-mas{height:26px;width:28px;border-radius:4px;border:1px solid #b9cde0;background:#eaf1f8;color:' + AZUL + ';font:700 14px/1 "Segoe UI",Arial,sans-serif;cursor:pointer}',
    '.sj-mas:hover{background:#dbe8f5}',
    'table.sj-t tr.sj-det td{background:#f7fafc!important;border-bottom:2px solid ' + AZUL_CLARO + ';padding:0}',
    '.sj-det-in{padding:12px 16px 16px;max-width:920px}',
    '.sj-det-in h4,.sj-sec h4{margin:14px 0 5px;font-size:11.5px;color:' + AZUL + ';text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #b9cde0;padding-bottom:3px}',
    '.sj-nueva{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}',
    '.sj-nueva input{height:28px;border:1px solid #b9c9d0;border-radius:5px;padding:0 9px;width:220px}',
    '.sj-cols{display:inline-flex;gap:5px;align-items:center;flex-wrap:wrap}',
    '.sj-col{width:20px;height:20px;border-radius:50%;cursor:pointer;padding:0;border:2px solid rgba(0,0,0,.15)}',
    '.sj-col.sel{box-shadow:0 0 0 2px #fff,0 0 0 4px ' + AZUL + '}',
    '.sj-nota{width:100%;min-height:80px;border:1px solid #b9c9d0;border-radius:5px;padding:8px 10px;font:13px/1.5 "Segoe UI",Arial,sans-serif;resize:vertical}',
    '.sj-nota-pie{display:flex;align-items:center;gap:10px;margin-top:6px}',
    '.sj-ok{color:#1b6b3a;font-weight:600;font-size:12px;opacity:0;transition:opacity .15s}',
    '.sj-ok.si{opacity:1}',
    '.sj-pie{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:7px 12px;border-top:1px solid #dbe4e8;background:#f5f8fa;flex:none;font-size:12px;color:#5a7581}',
    '.sj-pie button{height:26px;min-width:26px;padding:0 8px;border:1px solid #b9cde0;background:#eaf1f8;color:' + AZUL + ';border-radius:5px;cursor:pointer;font:600 12px "Segoe UI",Arial,sans-serif}',
    '.sj-pie button.act{background:' + AZUL + ';border-color:' + AZUL + ';color:#fff;cursor:default}',
    '.sj-pie button:disabled{opacity:.45;cursor:default}',
    '.sj-pie .der{margin-left:auto;display:flex;align-items:center;gap:6px}',
    '.sj-pie select{height:26px;border:1px solid #b9c9d0;border-radius:5px}',
    '.sj-panel{flex:1;overflow:auto;background:#fff}',
    '.sj-panel-in{max-width:820px;margin:0 auto;padding:20px 24px 34px}',
    '.sj-panel-in h2{margin:0 0 6px;font-size:18px;color:' + AZUL + '}',
    '.sj-panel-in h3{margin:22px 0 6px;font-size:13px;color:' + AZUL + ';border-bottom:1px solid #b9cde0;padding-bottom:4px}',
    '.sj-panel-in p{margin:0 0 9px;line-height:1.55;color:#3a4c54}',
    '.sj-panel-in .bts{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 4px}',
    '.sj-panel-in table.lista{border-collapse:collapse;width:100%}',
    '.sj-panel-in table.lista td{padding:6px 8px 6px 0;border-bottom:1px solid #edf1f3}',
    '.sj-vacio{padding:34px;text-align:center;color:#6b7c85}',
    '.sj-menu{position:absolute;z-index:30;background:#fff;border:1px solid #b9cde0;border-radius:6px;box-shadow:0 8px 26px rgba(0,0,0,.22);padding:5px 0;min-width:230px;max-height:70vh;overflow:auto}',
    '.sj-menu .it{display:block;width:100%;text-align:left;background:transparent;border:0;padding:7px 14px;color:#1d2b36;font:13px "Segoe UI",Arial,sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap}',
    '.sj-menu .it:hover{background:#eaf1f8;color:' + AZUL + '}',
    '.sj-menu .it:disabled{color:#9aa8b2;cursor:default;background:transparent}',
    '.sj-menu .sep{height:1px;background:#e3eaef;margin:5px 0}',
    '.sj-menu .tit{padding:6px 14px 3px;font-size:10.5px;font-weight:700;color:#6b7c85;text-transform:uppercase;letter-spacing:.05em}',
    '.sj-menu label.it{display:flex;gap:8px;align-items:center}',
    '.sj-prog{height:5px;background:#e3ebef;border-radius:3px;overflow:hidden;margin-top:5px}',
    '.sj-prog i{display:block;height:100%;background:' + AZUL_CLARO + ';width:0;transition:width .25s}',
    '.sj-trab{border:1px solid #dbe4e8;border-radius:6px;padding:10px 12px;margin:0 0 10px;background:#fbfdfe}',
    '.sj-trab .cab{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}',
    '.sj-trab .cab .car{color:#5a7581;flex:1 1 200px}',
    '.sj-trab .txt{font-size:12px;color:#3a4c54;margin-top:4px}',
    '.sj-trab.error .txt{color:#b3261e}',
    '.sj-trab.listo .txt{color:#1b6b3a}',
    '.sj-sec{padding:12px 16px;border-bottom:1px solid #e6ecef}',
    '.sj-exp-cab{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}',
    '.sj-exp-cab .n{font:700 17px Consolas,monospace;color:' + AZUL + '}',
    '.sj-exp-cab .c{flex:1 1 320px;color:#1d2b36;font-weight:600}',
    '.sj-exp-cab .d{color:#5a7581;font-size:12px;margin-top:2px;font-weight:400}',
    '.sj-exp-bts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}',
    '.sj-elegir{border:1px solid #dbe4e8;border-radius:6px;margin-top:8px;background:#fff}',
    '.sj-elegir .fil{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;padding:8px 10px;border-bottom:1px solid #e6ecef;background:#f5f8fa}',
    '.sj-elegir .fil input[type=text]{flex:1 1 180px;min-width:140px;height:28px;border:1px solid #b9c9d0;border-radius:5px;padding:0 8px}',
    '.sj-elegir .fil input[type=date]{height:28px;border:1px solid #b9c9d0;border-radius:5px;padding:0 5px}',
    '.sj-elegir .fil .cnt{margin-left:auto;color:#5a7581;font-size:12px}',
    '.sj-elegir .lst{max-height:46vh;overflow:auto}',
    '.sj-elegir table{border-collapse:collapse;width:100%}',
    '.sj-elegir td{padding:5px 8px;border-bottom:1px solid #eef2f4;font-size:12px;vertical-align:top}',
    '.sj-elegir tr:hover td{background:#eef5fc}',
    '.sj-elegir td.f{white-space:nowrap;font-family:Consolas,monospace;font-size:11.5px}',
    '.sj-elegir td.t{white-space:nowrap;color:' + AZUL + ';font-weight:600;font-size:11.5px}',
    '.sj-elegir table.sj-t td{padding:5px 8px;font-size:12px}',
    '.sj-elegir table.sj-t th{padding:6px 8px;font-size:11.5px}',
    '.sj-elegir table.sj-t td.t{color:' + AZUL + ';font-weight:600;font-size:11.5px;white-space:normal}',
    '.sj-elegir .pie{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;border-top:1px solid #e6ecef;background:#f5f8fa}',
    '.sj-redim{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;z-index:40;background:linear-gradient(135deg,transparent 50%,#9fb3c4 50%,#9fb3c4 60%,transparent 60%,transparent 70%,#9fb3c4 70%,#9fb3c4 80%,transparent 80%)}',
    '#supjn.maxi .sj-redim{display:none}',
    '#supjn a{color:#0a6cab}'
  ].join('\n');

  // ------------------------------------------------------------------ ventana

  let win = null;
  let pastilla = null;
  let menuAbierto = null;
  let confirmaNota = null;      // { solo: [...] | null } mientras se pide confirmar
  let ultimoEstadoNota = '';
  let colorElegido = COLORES[0].id;
  const TIPO_PAG = EN_EXPEDIENTE ? 'exp' : 'lista';

  const q = (sel) => (win ? win.querySelector(sel) : null);

  function avisar(txt, malo) {
    const e = q('[data-e="aviso"]');
    if (!e) return;
    e.style.display = txt ? '' : 'none';
    e.textContent = txt || '';
    e.classList.toggle('malo', !!malo);
  }

  const estadoTxt = (t) => { const e = q('[data-e="estado"]'); if (e) e.textContent = t; };

  function estadoNota(t) {
    ultimoEstadoNota = t;
    const x = q('[data-e="notaTxt"]');
    if (x) x.textContent = t; else pintarNota();
    // La solapa Dejar nota, si está a la vista, avanza con la barra.
    const p = q('[data-e="notaTxtPanel"]');
    if (p) {
      p.textContent = t;
      const c = leerCorrida(), v = q('[data-e="notaVan"]');
      if (v && c) v.textContent = 'van ' + progresoNota(c);
    }
    pintarPastilla();
  }

  // ------------------------------------------------------------- solapas

  function pintarSolapas() {
    const e = q('[data-e="solapas"]');
    if (!e) return;
    const s = [['rel', 'Mis causas', DATOS.rel ? DATOS.rel.total : null], ['fav', 'Favoritos', DATOS.fav ? DATOS.fav.total : null]];
    if (EN_EXPEDIENTE) s.push(['exp', 'Este expediente', null]);
    const c = leerCorrida();
    s.push(['nota', 'Dejar nota', (c && c.activa) ? progresoNota(c) : (SEL[listaActual()].size || null)]);
    const activos = COLA.filter((t) => /en cola|abriendo|leyendo|bajando|a bajar|eligiendo/.test(t.estado)).length;
    s.push(['desc', 'Descargas', COLA.length ? (activos || COLA.length) : null]);
    s.push(['marcas', 'Etiquetas', null, 'Etiquetas y respaldo']);
    s.push(['acerca', 'Acerca de', null]);
    e.innerHTML = s.map(([k, t, n, tit]) => '<button data-vista="' + k + '" class="' + (VISTA === k ? 'act' : '') + '"' +
      (tit ? ' title="' + esc(tit) + '"' : '') + '>' + esc(t) +
      (n == null ? '' : '<span class="cant">' + n + '</span>') + '</button>').join('');
  }

  function pintarPastilla() {
    if (!pastilla) return;
    let extra = '';
    const c = leerCorrida();
    if (c && c.activa) extra = 'nota ' + progresoNota(c);
    else if (bajandoAlgo()) extra = 'bajando';
    else if (leyendo) extra = 'leyendo';
    else if (DATOS.rel) extra = String(DATOS.rel.total);
    pastilla.innerHTML = 'SuPJN+' + (extra ? '<span class="cant">' + esc(extra) + '</span>' : '');
  }

  function pintarNota() {
    const e = q('[data-e="notaBarra"]');
    if (!e) return;
    const c = leerCorrida();
    if (!(c && c.activa) && !notaEnCurso) {
      e.style.display = 'none';
      e.innerHTML = '';
    } else {
      e.style.display = '';
      e.innerHTML = '<b>Dejando nota' + (c && c.solo ? ' en ' + plural(c.solo.length, 'causa elegida', 'causas elegidas') : ' en todas las habilitadas') + '.</b>' +
        '<span data-e="notaTxt">' + esc(ultimoEstadoNota || 'Retomando la tanda...') + '</span>' +
        '<button class="sj-b peligro chico" data-a="cortarNota">Cortar</button>';
    }
    pintarAccion();
    pintarPastilla();
  }

  // ------------------------------------------------------------ vista lista

  function opciones(sel, lista, valor) {
    sel.innerHTML = lista.map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + '</option>').join('');
    if (!lista.some(([v]) => v === valor)) valor = lista[0][0];
    sel.value = valor;
    return valor;
  }

  function pintarFiltros() {
    const D = datosVista();
    const causas = D ? D.causas : [];
    const fueros = [...new Set(causas.map((c) => fueroDe(c.exp)).filter(Boolean))].sort();
    const sinFuero = causas.some((c) => !fueroDe(c.exp));
    const f = q('[data-f="fuero"]');
    if (!f) return;
    const fuero = opciones(f, [['', 'Todos los fueros']]
      .concat(fueros.map((x) => [x, x + (NOMBRES_FUERO[x] ? ' · ' + NOMBRES_FUERO[x] : '')]))
      .concat(sinFuero ? [['@sin', 'Sin sigla de fuero']] : []), CFG.fuero);
    const sits = [...new Set(causas.map((c) => c.sit).filter(Boolean))].sort();
    const sit = opciones(q('[data-f="sit"]'), [['', 'Todas las situaciones']].concat(sits.map((s) => [s, s])), CFG.sit);
    const et = opciones(q('[data-f="etiqueta"]'), [['', 'Todas las etiquetas'], ['@sin', 'Sin etiqueta'], ['@anot', 'Con anotación'], ['@nota', 'Con resultado de dejar nota']]
      .concat(MARCAS.etiquetas.map((e) => [e.id, e.nom])), CFG.etiqueta);
    // Solo se corrige lo guardado si hay datos: sin lista leída no se sabe qué opciones existen.
    if (D) { CFG.fuero = fuero; CFG.sit = sit; }
    CFG.etiqueta = et;
    q('[data-f="tramite"]').value = CFG.tramite;
    q('[data-f="texto"]').value = CFG.texto;
    q('[data-f="desde"]').value = CFG.desde;
    q('[data-f="hasta"]').value = CFG.hasta;
  }

  function pintarEstado() {
    if (leyendo) return;
    const D = datosVista();
    const L = LISTAS[VISTA === 'fav' ? 'fav' : 'rel'];
    if (!D) { estadoTxt('Todavía no se leyó ' + L.nombre + '.'); return; }
    const fuera = D.total - D.enTramite;
    estadoTxt(plural(D.total, 'causa', 'causas') + ' (' + D.enTramite + ' en trámite, ' + fuera + ' fuera de trámite) · leídas el ' + fechaHora(D.fecha));
  }

  function pintarCopia() {
    const e = q('[data-e="copia"]');
    if (!e) return;
    const hayMarcas = Object.keys(MARCAS.filas).length > 0;
    if (!RESPALDO || !RESPALDO.fecha) {
      e.className = 'sj-copia ' + (hayMarcas ? 'nunca' : 'ok');
      e.textContent = hayMarcas ? 'Sin copia de etiquetas y anotaciones' : 'Todavía no hay etiquetas ni anotaciones';
    } else {
      const d = diasDesde(RESPALDO.fecha);
      e.className = 'sj-copia ' + (d > DIAS_AVISO_COPIA ? 'vieja' : 'ok');
      e.textContent = 'Última copia: ' + soloFecha(RESPALDO.fecha) + ' (' + (d === 0 ? 'hoy' : d === 1 ? 'hace 1 día' : 'hace ' + d + ' días') + ')';
    }
    e.title = 'Abre Etiquetas y respaldo';
  }

  function pintarBotonesLectura() {
    const a = q('[data-a="actualizar"]'), c = q('[data-a="cortarLectura"]');
    if (a) { a.disabled = leyendo; a.textContent = leyendo ? 'Leyendo...' : 'Actualizar'; }
    if (c) c.style.display = leyendo ? '' : 'none';
    pintarPastilla();
  }

  const bloqueoNota = () => notaEnCurso || corridaActiva();

  function pintarAccion() {
    const e = q('[data-e="accion"]');
    if (!e) return;
    const n = selVista().size;
    const b = bloqueoNota();
    const dis = (x) => (x ? ' disabled' : '');
    e.innerHTML = '<span class="cuenta">' + (n ? plural(n, 'seleccionada', 'seleccionadas') : 'Ninguna seleccionada') + '</span>' +
      '<button class="sj-b" data-a="notaSel"' + dis(!n || b) + ' title="Lleva a la solapa Dejar nota con estas causas">Dejar nota en las seleccionadas</button>' +
      '<button class="sj-b" data-a="bajarSel"' + dis(!n) + '>Bajar PDF de las seleccionadas</button>' +
      '<button class="sj-b" data-a="elegirSel"' + dis(n !== 1) + ' title="Con una causa seleccionada: elegir qué actuaciones bajar">Elegir actuaciones</button>' +
      '<button class="sj-b" data-a="quitarSel"' + dis(!n) + '>Quitar selección</button>';
  }

  // ------------------------------------------------------- vista dejar nota

  function confirmaNotaHTML() {
    const solo = confirmaNota.solo;
    const fueraRel = solo ? solo.filter((k) => !causaEn('rel', k)).length : 0;
    return '<div class="sj-confirma" style="border-radius:6px;border:1px solid #f0dca0">' +
      '<span>' + (solo
        ? 'Vas a dejar nota en <b>' + plural(solo.length, 'causa elegida', 'causas elegidas') + '</b>'
        : 'Vas a dejar nota en <b>todas las causas que el PJN habilite hoy</b>') +
      '. Es el acto procesal. La página del PJN se recarga una vez por nota.' +
      (fueraRel ? ' Ojo: ' + plural(fueraRel, 'no está', 'no están') + ' en Mis causas, y el PJN solo deja nota desde ahí.' : '') + '</span>' +
      '<label>pausa <input type="text" data-e="pausa" value="' + esc(CFG.pausaNota) + '"> ms</label>' +
      '<button class="sj-b peligro" data-a="confirmarNota">Confirmar y dejar nota</button>' +
      '<button class="sj-b" data-a="cancelarNota">Cancelar</button></div>';
  }

  function filaNotaHTML(k, quitable) {
    const c = causaPorClave(k);
    const n = NOTAS[k];
    const enRel = !!causaEn('rel', k);
    return '<tr><td class="sj-exp">' + esc(k) + '</td>' +
      '<td>' + esc(c ? c.car : '') + (enRel ? '' : '<br><span class="sj-badge">no está en Mis causas</span>') + '</td>' +
      '<td style="white-space:nowrap">' + (n && n.f === hoyISO()
        ? '<span class="sj-res ' + (n.ok ? 'ok' : 'mal') + '" title="' + esc(n.m || '') + '">' + (n.ok ? 'nota dejada' : 'no salió') + '</span>'
        : '') + '</td>' +
      (quitable ? '<td style="text-align:right;width:1%"><button class="sj-b chico" data-a="quitarUna" data-k="' + esc(k) + '" title="Sacarla de la selección">Quitar</button></td>' : '<td></td>') +
      '</tr>';
  }

  function panelNotaHTML() {
    const c = leerCorrida();
    const corriendo = !!(c && c.activa) || notaEnCurso;
    const sel = [...selVista()];
    const hoy = hoyISO();
    const deHoy = Object.keys(NOTAS).filter((k) => NOTAS[k].f === hoy);
    const bien = deHoy.filter((k) => NOTAS[k].ok);
    let h = '<div class="sj-panel-in" style="max-width:980px"><h2>Dejar nota</h2>' +
      '<p>Hace lo mismo que harías a mano en la lista de Relacionados del PJN: pone el filtro "Dejar nota", aprieta el lápiz de cada causa y confirma el cartel, recorriendo todas las páginas. El PJN recarga la página después de cada nota; el avance se ve acá. Solo entran las causas que el PJN habilite hoy.</p>';

    if (corriendo) {
      h += '<div class="sj-trab"><div class="cab"><b>Tanda en curso</b>' +
        '<span class="sj-badge">' + (c && c.solo ? plural(c.solo.length, 'causa elegida', 'causas elegidas') : 'todas las habilitadas') + '</span>' +
        (c ? '<span class="car" data-e="notaVan">van ' + esc(progresoNota(c)) + '</span>' : '') + '</div>' +
        '<div class="txt" data-e="notaTxtPanel">' + esc(ultimoEstadoNota || 'Retomando la tanda...') + '</div>' +
        '<div class="bts" style="margin-top:8px"><button class="sj-b peligro" data-a="cortarNota">Cortar</button></div></div>';
    } else if (confirmaNota) {
      h += confirmaNotaHTML();
      if (confirmaNota.solo && confirmaNota.solo.length) {
        h += '<table class="lista" style="margin-top:10px">' + confirmaNota.solo.map((k) => filaNotaHTML(k, false)).join('') + '</table>';
      }
    } else {
      h += '<div class="bts">' +
        '<button class="sj-b prim" data-a="notaTodas">Dejar nota en todas las habilitadas</button>' +
        '<button class="sj-b" data-a="notaSel"' + (sel.length ? '' : ' disabled') + '>Dejar nota en las ' + sel.length + ' seleccionadas</button>' +
        (sel.length ? '<button class="sj-b" data-a="quitarSel">Vaciar la selección</button>' : '') +
        '</div>';
      h += sel.length
        ? '<h3>Seleccionadas en ' + esc(LISTAS[listaActual()].nombre) + '</h3><table class="lista">' + sel.map((k) => filaNotaHTML(k, true)).join('') + '</table>'
        : '<p style="color:#6b7c85">No hay causas seleccionadas. Tildalas en <b>Mis causas</b> o en <b>Favoritos</b> y volvé acá, o dejá nota en todas las habilitadas.</p>';
    }

    h += '<h3>Notas de hoy</h3>';
    h += deHoy.length
      ? '<p>' + plural(bien.length, 'nota dejada', 'notas dejadas') + (deHoy.length - bien.length ? ' y ' + plural(deHoy.length - bien.length, 'que no salió', 'que no salieron') : '') + '.</p>' +
        '<table class="lista">' + deHoy.map((k) => filaNotaHTML(k, false)).join('') + '</table>'
      : '<p style="color:#6b7c85">Todavía no dejaste ninguna nota hoy desde acá.</p>';
    return h + '</div>';
  }

  const chipsDe = (k) => etiquetasDe(k).map((e) => '<span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span>').join('');

  function editorMarcasHTML(k) {
    const m = marcaDe(k);
    const puestas = m.et || [];
    return '<h4>Etiquetas</h4>' +
      (MARCAS.etiquetas.length
        ? '<div>' + MARCAS.etiquetas.map((e) => {
          const si = puestas.indexOf(e.id) >= 0;
          return '<button class="sj-chip' + (si ? '' : ' off') + '" data-et="' + esc(e.id) + '" style="' + estiloChip(e.color) +
            '" title="' + (si ? 'Quitar' : 'Poner') + ' esta etiqueta">' + esc(e.nom) + '</button>';
        }).join('') + '</div>'
        : '<p style="color:#6b7c85;margin:4px 0">Todavía no hay etiquetas. Escribí un nombre abajo y creala.</p>') +
      '<div class="sj-nueva"><input type="text" class="sj-et-nombre" maxlength="28" placeholder="Nombre de una etiqueta nueva">' +
      '<span class="sj-cols">' + COLORES.map((col) => '<button class="sj-col' + (col.id === colorElegido ? ' sel' : '') +
        '" data-color="' + col.id + '" style="background:' + col.hex + '" title="' + esc(col.nom) + '"></button>').join('') + '</span>' +
      '<button class="sj-b" data-a="crearEt">Crear y poner</button></div>' +
      '<h4>Anotación</h4>' +
      '<textarea class="sj-nota" placeholder="Anotación privada sobre esta causa. Queda en esta PC y no se escribe en el expediente.">' + esc(m.nota) + '</textarea>' +
      '<div class="sj-nota-pie"><button class="sj-b prim" data-a="guardarAnot">Guardar</button>' +
      '<button class="sj-b" data-a="borrarAnot">Borrar</button><span class="sj-ok">Guardado</span></div>';
  }

  function detalleHTML(c, colspan) {
    return '<tr class="sj-det"><td colspan="' + colspan + '"><div class="sj-det-in" data-marca="' + esc(c.exp) + '">' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b class="sj-exp">' + esc(c.exp) + '</b>' +
      '<span style="color:#5a7581">' + esc(c.car) + '</span>' +
      '<button class="sj-b chico" data-a="cerrarDet" style="margin-left:auto">Cerrar</button></div>' +
      editorMarcasHTML(c.exp) + '</div></td></tr>';
  }

  function celdaHTML(c, k, tipo) {
    if (k === 'exp') {
      const fav = tipo === 'rel' && (c.fav || !!causaEn('fav', c.exp));
      return '<span class="sj-exp">' + esc(c.exp) + '</span>' + (fav ? '<span class="sj-fav" title="Está en tus Favoritos del PJN">★</span>' : '') +
        (c.tramite ? '' : '<br><span class="sj-badge">fuera de trámite</span>');
    }
    if (k === 'nota') {
      const n = NOTAS[c.exp];
      if (!n) return '';
      return '<span class="sj-res ' + (n.ok ? 'ok' : 'mal') + '" title="' + esc(n.m || (n.ok ? 'Nota dejada' : 'No salió')) + '">' +
        (n.ok ? 'dejada ' : 'no salió ') + isoACorta(n.f) + '</span>';
    }
    if (k === 'et') {
      return '<div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="et" title="Poner o sacar etiquetas">' +
        (chipsDe(c.exp) || '<span class="sj-poner">+ etiqueta</span>') + '</div>';
    }
    if (k === 'anot') {
      const nota = String(marcaDe(c.exp).nota || '').trim();
      return '<div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="nota" title="' + (nota ? esc(nota) : 'Escribir una anotación') + '">' +
        (nota ? '<span class="sj-nota-txt">' + esc(nota) + '</span>' : '<span class="sj-poner">+ anotar</span>') + '</div>';
    }
    return esc(c[k]);
  }

  // ------------------------------------------------- columnas de las tablas

  // Las dos tablas (causas y actuaciones) usan la misma cabecera: clic en el
  // título para ordenar, arrastre del título para mover la columna y arrastre
  // del borde derecho para el ancho.
  function cabeceraHTML(tabla, cols) {
    const o = CFG[TABLAS[tabla].orden] || { col: '', desc: true };
    return cols.map((k) => {
      const act = o.col === k;
      return '<th class="mov' + (act ? ' act' : '') + '" draggable="true" data-tabla="' + tabla + '" data-k="' + esc(k) +
        '" title="Clic para ordenar. Arrastrá el título para mover la columna y su borde derecho para cambiar el ancho.">' +
        esc(defCol(tabla, k).t) + '<span class="fl">' + (act ? (o.desc ? '▼' : '▲') : '▽') + '</span>' +
        '<span class="rs" data-tabla="' + tabla + '" data-rs="' + esc(k) + '"></span></th>';
    }).join('');
  }

  function grupoColumnas(tabla, cols, antes, despues, anchos) {
    return '<colgroup>' + (antes ? '<col style="width:' + antes + 'px">' : '') +
      cols.map((k) => '<col data-tabla="' + tabla + '" data-col="' + esc(k) + '" style="width:' +
        ((anchos && anchos[k]) || anchoDe(tabla, k)) + 'px">').join('') +
      (despues ? '<col style="width:' + despues + 'px">' : '') + '</colgroup>';
  }

  // Encuadre: cuando las columnas no entran en el ancho visible, se achican en
  // proporción hasta el mínimo, así la tabla queda dentro de la ventana en vez
  // de irse por el costado. Si ni así entran, la tabla se corre de costado.
  function anchosEncuadrados(tabla, cols, fijos, disponible) {
    const w = {};
    cols.forEach((k) => { w[k] = anchoDe(tabla, k); });
    const suma = cols.reduce((s, k) => s + w[k], 0);
    const libre = disponible - fijos;
    if (!CFG.encuadrar || !disponible || !cols.length || suma <= libre) return { anchos: w, total: fijos + suma };
    const min = {};
    cols.forEach((k) => { min[k] = minCol(tabla, k); });
    let sobra = suma - libre;
    let elasticas = cols.filter((k) => w[k] > min[k]);
    while (sobra > 0.5 && elasticas.length) {
      const margen = elasticas.reduce((s, k) => s + (w[k] - min[k]), 0);
      if (margen <= 0.5) break;
      const quita = Math.min(sobra, margen);
      elasticas.forEach((k) => { w[k] -= (w[k] - min[k]) / margen * quita; });
      sobra -= quita;
      elasticas = elasticas.filter((k) => w[k] > min[k] + 0.5);
    }
    cols.forEach((k) => { w[k] = Math.max(min[k], Math.round(w[k])); });
    return { anchos: w, total: fijos + cols.reduce((s, k) => s + w[k], 0) };
  }

  // Con el encuadre puesto la tabla no cambia de ancho: lo que se le da a una
  // columna se le saca a las otras, y al revés.
  function repartirEncuadre(tabla, base, cols, k, ancho) {
    const min = {};
    cols.forEach((x) => { min[x] = minCol(tabla, x); });
    const otras = cols.filter((x) => x !== k);
    const out = {};
    cols.forEach((x) => { out[x] = base[x]; });
    if (!otras.length) { out[k] = Math.max(min[k], ancho); return out; }
    let d = Math.max(min[k], ancho) - base[k];
    if (d > 0) {
      const margen = otras.reduce((s, x) => s + Math.max(0, base[x] - min[x]), 0);
      d = Math.min(d, margen);
      if (margen > 0) otras.forEach((x) => { out[x] = base[x] - Math.max(0, base[x] - min[x]) / margen * d; });
    } else if (d < 0) {
      const suma = otras.reduce((s, x) => s + base[x], 0);
      if (suma > 0) otras.forEach((x) => { out[x] = base[x] + base[x] / suma * (-d); });
    }
    out[k] = base[k] + d;
    cols.forEach((x) => { out[x] = Math.max(min[x], Math.round(out[x])); });
    return out;
  }

  // Ancho útil del recuadro donde va la tabla, en píxeles de la ventana.
  function anchoUtil(cont) {
    if (!cont) return 0;
    const w = cont.clientWidth;
    return w > 40 ? w : 0;
  }

  function estiloTabla(total) {
    return 'width:' + Math.round(total) + 'px;min-width:100%';
  }

  // Ya dibujada, la tabla se mide contra su recuadro y se vuelve a encuadrar.
  // Hace falta porque al armar el HTML el recuadro puede no existir todavía (la
  // primera vez que se dibuja el selector de actuaciones) y porque la barra de
  // desplazamiento se lleva unos píxeles recién cuando están las filas.
  function encuadrarAlVuelo(tabla, caja) {
    const t = caja && caja.querySelector('table.sj-t');
    const disp = caja ? caja.clientWidth : 0;
    if (!t || !disp) return;
    const cols = [...t.querySelectorAll('col[data-col]')].map((c) => c.dataset.col);
    if (!cols.length) return;
    const fijos = [...t.querySelectorAll('col:not([data-col])')].reduce((s, c) => s + (parseInt(c.style.width, 10) || 0), 0);
    const enc = anchosEncuadrados(tabla, cols, fijos, disp);
    t.querySelectorAll('col[data-col]').forEach((c) => { c.style.width = enc.anchos[c.dataset.col] + 'px'; });
    t.style.width = Math.round(enc.total) + 'px';
  }

  function pintarTabla() {
    const cuerpo = q('[data-e="cuerpo"]'), pie = q('[data-e="pie"]');
    if (!cuerpo) return;
    const tipo = VISTA === 'fav' ? 'fav' : 'rel';
    const D = DATOS[tipo];
    if (!D) {
      cuerpo.innerHTML = '<div class="sj-vacio">' + (leyendo
        ? 'Leyendo ' + LISTAS[tipo].pjn + ' en segundo plano. La primera vez tarda un poco.'
        : 'Todavía no se leyó ' + LISTAS[tipo].nombre + '. Tocá "Actualizar".') + '</div>';
      pie.innerHTML = '';
      return;
    }
    const L = filtradas();
    const porPag = CFG.porPagina;
    const paginas = Math.max(1, Math.ceil(L.length / porPag));
    const pagina = Math.max(1, Math.min(PAGINA_VISTA[tipo], paginas));
    PAGINA_VISTA[tipo] = pagina;
    const trozo = L.slice((pagina - 1) * porPag, pagina * porPag);
    const cols = columnasVisibles('lista');
    const sel = SEL[tipo];
    const todasSel = L.length > 0 && L.every((c) => sel.has(c.exp));
    const ANCHO_SEL = 34, ANCHO_ACC = 146;

    const cab = '<th class="cs fija"><input type="checkbox" data-a="selTodas" title="Seleccionar o quitar las ' + L.length + ' causas filtradas"' + (todasSel ? ' checked' : '') + '></th>' +
      cabeceraHTML('lista', cols) + '<th class="fija"></th>';

    const filas = trozo.map((c) => {
      const s = sel.has(c.exp);
      return '<tr class="' + (c.tramite ? '' : 'fuera') + (s ? ' sel' : '') + '">' +
        '<td class="cs"><input type="checkbox" data-sel="' + esc(c.exp) + '"' + (s ? ' checked' : '') + '></td>' +
        cols.map((k) => '<td>' + celdaHTML(c, k, tipo) + '</td>').join('') +
        '<td><div class="sj-acc"><button class="sj-abrir" data-abrir="' + esc(c.exp) + '" title="Abre el expediente en esta pestaña (con Ctrl, en una nueva)">Abrir</button>' +
        '<button class="sj-mas" data-abrirnueva="' + esc(c.exp) + '" title="Abrir el expediente en una pestaña nueva">↗</button>' +
        '<button class="sj-mas" data-mas="' + esc(c.exp) + '" title="Más acciones: libro digital, presentar escrito, bajar, dejar nota">⋯</button></div></td>' +
        '</tr>' + (abierta === c.exp ? detalleHTML(c, cols.length + 2) : '');
    }).join('');

    const enc = anchosEncuadrados('lista', cols, ANCHO_SEL + ANCHO_ACC, anchoUtil(cuerpo));
    cuerpo.innerHTML = '<table class="sj-t" style="' + estiloTabla(enc.total) + '">' +
      grupoColumnas('lista', cols, ANCHO_SEL, ANCHO_ACC, enc.anchos) +
      '<thead><tr>' + cab + '</tr></thead><tbody>' +
      (filas || '<tr><td colspan="' + (cols.length + 2) + '" class="sj-vacio">Ninguna causa coincide con los filtros.</td></tr>') +
      '</tbody></table>';
    encuadrarAlVuelo('lista', cuerpo);

    const nums = [];
    const ventana = 9;
    let ini = Math.max(1, pagina - Math.floor(ventana / 2));
    const fin = Math.min(paginas, ini + ventana - 1);
    ini = Math.max(1, fin - ventana + 1);
    for (let i = ini; i <= fin; i++) {
      nums.push('<button data-pag="' + i + '"' + (i === pagina ? ' class="act" disabled' : '') + '>' + i + '</button>');
    }
    const desdeN = L.length ? (pagina - 1) * porPag + 1 : 0;
    pie.innerHTML =
      '<button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button>' +
      (ini > 1 ? '<button data-pag="1">1</button><span>…</span>' : '') + nums.join('') +
      (fin < paginas ? '<span>…</span><button data-pag="' + paginas + '">' + paginas + '</button>' : '') +
      '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button>' +
      '<span class="der">Mostrando ' + desdeN + ' a ' + Math.min(L.length, pagina * porPag) + ' de ' + L.length +
      (L.length !== D.total ? ' (filtradas de ' + D.total + ')' : '') +
      ' <select data-pp title="Causas por página">' + [10, 15, 20, 25, 30, 40, 50, 75, 100]
        .map((n) => '<option value="' + n + '"' + (n === porPag ? ' selected' : '') + '>' + n + ' por página</option>').join('') +
      '</select></span>';
  }

  // ---------------------------------------------------------------- menús

  function abrirMenu(ancla, html) {
    cerrarMenu();
    const m = document.createElement('div');
    m.className = 'sj-menu';
    m.innerHTML = html;
    win.appendChild(m);
    // Los rectángulos vienen en píxeles de pantalla y la posición se escribe en
    // los de la ventana: con zoom puesto, hay que dividir por el factor.
    const z = zoomAct();
    const rw = win.getBoundingClientRect(), ra = ancla.getBoundingClientRect();
    const ancho = m.offsetWidth, alto = m.offsetHeight;
    const anchoWin = rw.width / z, altoWin = rw.height / z;
    let left = (ra.left - rw.left) / z;
    if (left + ancho > anchoWin - 8) left = Math.max(8, (ra.right - rw.left) / z - ancho);
    let top = (ra.bottom - rw.top) / z + 4;
    if (top + alto > altoWin - 8) top = Math.max(8, (ra.top - rw.top) / z - alto - 4);
    m.style.left = left + 'px';
    m.style.top = top + 'px';
    menuAbierto = m;
    menuAbierto.dataset.ancla = ancla.dataset.a || ancla.dataset.mas || '';
  }

  function cerrarMenu() {
    if (menuAbierto) { menuAbierto.remove(); menuAbierto = null; }
  }

  function enlacePJN(selector, re) {
    const a = [...document.querySelectorAll(selector)].find((x) => !esNuestro(x) && (!re || re.test(limpio(x.textContent))));
    return a && a.href && !/^javascript/i.test(a.getAttribute('href') || '') ? a.href : null;
  }

  function menuPJNHTML() {
    const it = (u, t, ext) => '<a class="it" href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(t) + (ext ? ' ↗' : '') + '</a>';
    const nueva = enlacePJN('a[id$="menuNuevaConsulta"]');
    const rad = enlacePJN('a[id$="btn-lista-noIniciados"]') || RUTA.rad;
    const datos = enlacePJN('a', /^datos personales$/i);
    return '<div class="tit">Consulta Web</div>' +
      it(RUTA.rel, 'Relacionados (lista del PJN)') + it(RUTA.fav, 'Favoritos (lista del PJN)') + it(rad, 'Radicaciones') +
      (nueva ? it(nueva, 'Nueva consulta pública') : '') + (datos ? it(datos, 'Datos personales') : '') +
      '<div class="sep"></div><div class="tit">Otras aplicaciones del PJN (pestaña nueva)</div>' +
      APPS_PJN.map((x) => it(x.u, x.t, true)).join('');
  }

  function menuColsHTML(tabla) {
    const ocultas = CFG[TABLAS[tabla].ocultas] || [];
    return '<div class="tit">Columnas visibles</div>' +
      ordenColumnas(tabla).map((k) => '<label class="it"><input type="checkbox" data-tabla="' + tabla + '" data-colvis="' + esc(k) + '"' +
        (ocultas.indexOf(k) < 0 ? ' checked' : '') + '> ' + esc(defCol(tabla, k).t) + '</label>').join('') +
      '<div class="sep"></div>' +
      '<label class="it" title="Achica las columnas lo necesario para que la tabla entre en el ancho de la ventana">' +
      '<input type="checkbox" data-enc="1"' + (CFG.encuadrar ? ' checked' : '') + '> Encuadrar en la ventana</label>' +
      '<button class="it" data-a="colsReset" data-tabla="' + tabla + '">Restablecer orden, anchos y columnas</button>' +
      '<div class="tit" style="text-transform:none;font-weight:400;white-space:normal;max-width:260px">Para mover una columna arrastrá su título; para cambiar el ancho, su borde derecho. Con el encuadre puesto, las columnas se achican para entrar en la ventana.</div>';
  }

  function menuFilaHTML(k) {
    const enRel = !!causaEn('rel', k);
    const b = bloqueoNota();
    const it = (a, t, dis, tit) => '<button class="it" data-a="' + a + '" data-k="' + esc(k) + '"' + (dis ? ' disabled' : '') + (tit ? ' title="' + esc(tit) + '"' : '') + '>' + esc(t) + '</button>';
    const soloRel = enRel ? '' : 'Solo para causas que están en Mis causas (Relacionados)';
    return '<div class="tit">' + esc(k) + '</div>' +
      it('abrir', 'Abrir en esta pestaña') +
      it('abrirNueva', 'Abrir en una pestaña nueva') +
      it('libro', 'Libro digital (pestaña nueva)', !enRel, soloRel) +
      it('escrito', 'Presentar escrito (pestaña nueva)', !enRel, soloRel) +
      '<div class="sep"></div>' +
      it('bajarUna', 'Bajar el expediente completo en PDF') +
      it('elegirUna', 'Elegir qué actuaciones bajar') +
      '<div class="sep"></div>' +
      it('notaUna', 'Dejar nota en esta causa', !enRel || b, soloRel) +
      it('marcasUna', 'Etiquetas y anotación');
  }

  // ------------------------------------------------------- vista expediente

  const EXP = { estado: 'nada', texto: '', datos: null, acts: null, elegidas: new Set(), filtro: { texto: '', desde: '', hasta: '' }, cortar: false };

  const botonPJN = (re) => [...document.querySelectorAll('a, input[type=button], input[type=submit], button')]
    .find((x) => !esNuestro(x) && re.test(limpio(x.value || x.textContent))) || null;

  function pintarExpediente() {
    const p = q('[data-e="vPanel"]');
    const d = EXP.datos || (EXP.datos = datosExpediente(document));
    const k = d.exp;
    p.innerHTML =
      '<div class="sj-sec"><div class="sj-exp-cab"><span class="n">' + esc(k || 'Expediente') + '</span>' +
      '<div class="c">' + esc(d.car) + '<div class="d">' + esc([d.dep, d.sit].filter(Boolean).join(' · ')) + '</div></div></div>' +
      '<div class="sj-exp-bts"><button class="sj-b" data-a="volverLista">Volver a Mis causas</button>' +
      (botonPJN(/^dejar nota$/i) ? '<button class="sj-b" data-a="notaPJN" title="Usa el botón del PJN, que pide confirmar">Dejar nota en esta causa</button>' : '') +
      (botonPJN(/presentar escrito/i) ? '<button class="sj-b" data-a="escritoPJN">Presentar escrito</button>' : '') +
      '<button class="sj-b" data-a="recargar">Recargar la página</button></div></div>' +
      '<div class="sj-sec"><h4>Actuaciones con PDF</h4><div data-e="expEstado"></div><div data-e="expElegir"></div></div>' +
      (k ? '<div class="sj-sec" data-marca="' + esc(k) + '">' + editorMarcasHTML(k) + '</div>' : '');
    pintarExpEstado();
    pintarElegir('exp');
  }

  function pintarExpEstado() {
    const e = q('[data-e="expEstado"]');
    if (!e) return;
    const k = EXP.datos ? EXP.datos.exp : '';
    const t = [...COLA].reverse().find((x) => x.origen === 'exp' && x.exp === k);
    let h = '<div style="font-size:12.5px;color:' + (EXP.estado === 'error' ? '#b3261e' : '#3a4c54') + '">' + esc(EXP.texto) + '</div>';
    if (EXP.estado === 'leyendo') h += '<div class="sj-prog"><i style="width:35%"></i></div>';
    if (t) {
      h += '<div style="margin-top:6px;font-size:12.5px;color:' + (t.estado === 'error' ? '#b3261e' : t.estado === 'listo' ? '#1b6b3a' : '#3a4c54') + '">' + esc(t.texto) + '</div>';
      if (/bajando/.test(t.estado)) h += '<div class="sj-prog"><i style="width:' + Math.round((t.frac || 0) * 100) + '%"></i></div>';
      if (/bajando|a bajar/.test(t.estado)) h += '<button class="sj-b peligro chico" data-a="cortarCola" style="margin-top:6px">Cortar</button>';
    }
    e.innerHTML = h;
  }

  // ------------------------------------------------ elegir actuaciones

  const ctxElegir = (id) => (id === 'exp' ? EXP : COLA.find((t) => t.id === id));

  function actsFiltradas(ctx) {
    const t = norm(ctx.filtro.texto);
    const d = numDeInput(ctx.filtro.desde), h = numDeInput(ctx.filtro.hasta);
    const out = [];
    ctx.acts.forEach((a, i) => {
      if (t && norm([a.fecha, a.tipo, a.detalle, a.fojas, a.oficina].join(' ')).indexOf(t) < 0) return;
      if (d || h) {
        const f = numFecha(a.fecha);
        if (!f || (d && f < d) || (h && f > h)) return;
      }
      out.push(i);
    });
    // Sin orden elegido quedan como las trae el PJN, que es como se arma el PDF.
    const o = CFG.ordenAct || { col: '' };
    if (o.col) {
      out.sort((i, j) => {
        const x = valorOrdenAct(ctx.acts[i], o.col), y = valorOrdenAct(ctx.acts[j], o.col);
        return (x < y ? -1 : x > y ? 1 : 0) * (o.desc ? -1 : 1);
      });
    }
    return out;
  }

  function celdaAct(a, k) {
    if (k === 'tipo') return esc(a.tipo) + (a.hist ? ' <span class="sj-badge">histórica</span>' : '');
    return esc(a[k]);
  }

  const claseAct = (k) => (k === 'fecha' || k === 'fojas' ? 'f' : k === 'tipo' ? 't' : '');

  function cuentaElegir(ctx, visibles) {
    return ctx.elegidas.size + ' de ' + ctx.acts.length + ' elegidas' + (visibles !== ctx.acts.length ? ' · se ven ' + visibles : '');
  }

  function elegirHTML(id) {
    const ctx = ctxElegir(id);
    if (!ctx || !ctx.acts) return '';
    const V = actsFiltradas(ctx);
    const n = ctx.elegidas.size;
    const cols = columnasVisibles('act');
    const todasV = V.length > 0 && V.every((i) => ctx.elegidas.has(i));
    const ANCHO_SEL = 30, ANCHO_VER = 48;
    const enc = anchosEncuadrados('act', cols, ANCHO_SEL + ANCHO_VER, anchoUtil(q('[data-elegir="' + id + '"] .lst')));
    const o = CFG.ordenAct || { col: '' };
    const filas = V.map((i) => {
      const a = ctx.acts[i];
      return '<tr><td class="cs"><input type="checkbox" data-ei="' + i + '"' + (ctx.elegidas.has(i) ? ' checked' : '') + '></td>' +
        cols.map((k) => '<td class="' + claseAct(k) + '">' + celdaAct(a, k) + '</td>').join('') +
        '<td style="text-align:right">' + (a.ver ? '<a href="' + esc(a.ver) + '" target="_blank" rel="noopener">Ver</a>' : '') + '</td></tr>';
    }).join('');
    return '<div class="sj-elegir" data-elegir="' + esc(id) + '">' +
      '<div class="fil"><input type="text" data-ef="texto" placeholder="Filtrar por fecha, tipo o detalle" value="' + esc(ctx.filtro.texto) + '">' +
      '<label>Desde <input type="date" data-ef="desde" value="' + esc(ctx.filtro.desde) + '"></label>' +
      '<label>hasta <input type="date" data-ef="hasta" value="' + esc(ctx.filtro.hasta) + '"></label>' +
      '<button class="sj-b chico" data-ea="todas" title="Elegir las que se ven">Todas</button>' +
      '<button class="sj-b chico" data-ea="ninguna" title="Quitar las que se ven">Ninguna</button>' +
      '<button class="sj-b chico" data-ea="invertir" title="Invertir las que se ven">Invertir</button>' +
      '<button class="sj-b chico" data-a="menuColsAct" data-id="' + esc(id) + '" title="Elegir qué columnas se ven">Columnas ▾</button>' +
      (o.col ? '<button class="sj-b chico" data-ea="ordenPJN" title="Volver al orden en que las trae el PJN, que es el del PDF">Orden del PJN</button>' : '') +
      '<span class="cnt" data-e="cnt">' + esc(cuentaElegir(ctx, V.length)) + '</span></div>' +
      '<div class="lst"><table class="sj-t" style="' + estiloTabla(enc.total) + '">' +
      grupoColumnas('act', cols, ANCHO_SEL, ANCHO_VER, enc.anchos) +
      '<thead><tr><th class="cs fija"><input type="checkbox" data-ea="todasCb" title="Elegir o quitar las ' + V.length + ' actuaciones que se ven"' + (todasV ? ' checked' : '') + '></th>' +
      cabeceraHTML('act', cols) + '<th class="fija"></th></tr></thead><tbody>' +
      (filas || '<tr><td colspan="' + (cols.length + 2) + '" class="sj-vacio">' + (ctx.acts.length ? 'Ninguna actuación coincide con el filtro.' : 'No hay actuaciones con PDF.') + '</td></tr>') + '</tbody></table></div>' +
      '<div class="pie"><button class="sj-b prim" data-ea="bajarElegidas"' + (n ? '' : ' disabled') + '>Bajar las elegidas (' + n + ')</button>' +
      '<button class="sj-b" data-ea="bajarTodo"' + (ctx.acts.length ? '' : ' disabled') + '>Bajar todo en 1 PDF</button>' +
      (id === 'exp' ? '<button class="sj-b" data-ea="releer">Volver a leer</button>' : '<button class="sj-b" data-ea="descartar">Descartar</button>') +
      '</div></div>';
  }

  function pintarElegir(id) {
    if (id === 'exp') {
      const e = q('[data-e="expElegir"]');
      if (e) e.innerHTML = EXP.acts ? elegirHTML('exp') : '';
    } else {
      const e = q('[data-trab="' + id + '"] [data-elegir]');
      if (e) e.outerHTML = elegirHTML(id);
    }
    encuadrarAlVuelo('act', q('[data-elegir="' + id + '"] .lst'));
  }

  // Vuelve a dibujar la tabla que corresponda después de tocar sus columnas.
  function repintarTabla(tabla) {
    if (tabla !== 'act') { if (esVistaLista()) pintarTabla(); return; }
    if (EXP.acts) pintarElegir('exp');
    COLA.forEach((t) => { if (t.estado === 'eligiendo') pintarElegir(t.id); });
  }

  function actualizarCuentaElegir(id) {
    const ctx = ctxElegir(id);
    const cont = q('[data-elegir="' + id + '"]');
    if (!ctx || !cont) return;
    const V = actsFiltradas(ctx);
    const c = cont.querySelector('[data-e="cnt"]');
    if (c) c.textContent = cuentaElegir(ctx, V.length);
    const b = cont.querySelector('[data-ea="bajarElegidas"]');
    if (b) { b.disabled = !ctx.elegidas.size; b.textContent = 'Bajar las elegidas (' + ctx.elegidas.size + ')'; }
    const t = cont.querySelector('[data-ea="todasCb"]');
    if (t) t.checked = V.length > 0 && V.every((i) => ctx.elegidas.has(i));
  }

  // ------------------------------------------------------- vista descargas

  function trabajoHTML(t) {
    const clase = t.estado === 'listo' ? 'listo' : /error|cortado/.test(t.estado) ? 'error' : '';
    const modo = t.modo === 'elegir' ? 'eligiendo actuaciones' : t.modo === 'seleccion' ? (t.parcial ? 'actuaciones elegidas' : 'expediente completo') : 'expediente completo';
    return '<div class="sj-trab ' + clase + '" data-trab="' + esc(t.id) + '" data-estado="' + esc(t.estado) + '">' +
      '<div class="cab"><b class="sj-exp">' + esc(t.exp) + '</b><span class="car">' + esc(t.car) + '</span><span class="sj-badge">' + esc(modo) + '</span></div>' +
      '<div class="txt" data-e="ttxt">' + esc(t.texto) + '</div>' +
      (/abriendo|leyendo|bajando/.test(t.estado) ? '<div class="sj-prog"><i data-e="tprog" style="width:' + Math.round((t.frac || 0) * 100) + '%"></i></div>' : '') +
      (t.estado === 'eligiendo' ? elegirHTML(t.id) : '') +
      '</div>';
  }

  function pintarDescargas() {
    pintarSolapas();
    pintarPastilla();
    pintarExpEstado();
    if (VISTA !== 'desc' || !win) return;
    const p = q('[data-e="vPanel"]');
    const hayTerminadas = COLA.some((t) => /listo|error|cortado/.test(t.estado));
    p.innerHTML = '<div class="sj-panel-in" style="max-width:1100px"><h2>Descargas</h2>' +
      '<p>Cada causa se abre y se lee en segundo plano, sin mover la página del PJN, y se baja en un PDF. Si Chrome pregunta si el sitio puede descargar varios archivos, aceptá. Mientras haya descargas, no cierres ni cambies esta pestaña de página.</p>' +
      '<div class="bts">' + (bajandoAlgo() ? '<button class="sj-b peligro" data-a="cortarCola">Cortar las descargas</button>' : '') +
      (hayTerminadas ? '<button class="sj-b" data-a="limpiarCola">Quitar las terminadas</button>' : '') + '</div>' +
      (COLA.length ? COLA.map(trabajoHTML).join('')
        : '<p class="sj-vacio">No hay descargas. Seleccioná causas en Mis causas o Favoritos y tocá "Bajar PDF de las seleccionadas", o usá el menú ⋯ de una causa para elegir actuaciones.</p>') +
      '</div>';
    p.querySelectorAll('[data-elegir] .lst').forEach((c) => encuadrarAlVuelo('act', c));
  }

  function pintarTrabajo(t) {
    if (t.origen === 'exp') pintarExpEstado();
    pintarPastilla();
    const el = q('[data-trab="' + t.id + '"]');
    if (!el) return;
    if (el.dataset.estado !== t.estado) { pintarDescargas(); return; }
    const tx = el.querySelector('[data-e="ttxt"]');
    if (tx) tx.textContent = t.texto;
    const pr = el.querySelector('[data-e="tprog"]');
    if (pr) pr.style.width = Math.round((t.frac || 0) * 100) + '%';
  }

  // -------------------------------------------------------------- paneles

  function panelMarcasHTML() {
    const et = MARCAS.etiquetas;
    const marcadas = Object.keys(MARCAS.filas).length;
    const d = RESPALDO && RESPALDO.fecha ? diasDesde(RESPALDO.fecha) : null;
    return '<div class="sj-panel-in">' +
      '<h2>Etiquetas y respaldo</h2>' +
      '<p>Las etiquetas y las anotaciones son datos tuyos, no del PJN: quedan en el almacén de Tampermonkey de esta PC y no se escriben en ningún expediente. Hoy hay <b>' +
      plural(et.length, 'etiqueta', 'etiquetas') + '</b> y <b>' + plural(marcadas, 'causa marcada', 'causas marcadas') + '</b>.</p>' +
      '<h3>Copia de respaldo</h3>' +
      '<p>' + (d === null ? 'Todavía no se exportó ninguna copia.' : 'Última copia: <b>' + soloFecha(RESPALDO.fecha) + '</b> (' + (d === 0 ? 'hoy' : d === 1 ? 'hace 1 día' : 'hace ' + d + ' días') + ').') +
      ' Si se limpia el navegador o se reinstala Tampermonkey, lo que no esté en una copia se pierde. La copia se hace a mano: no hay guardado automático.</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="exportar">Exportar etiquetas y anotaciones</button>' +
      '<button class="sj-b" data-a="importar">Importar desde un archivo</button></div>' +
      '<p style="color:#6b7c85;font-size:12px">La importación no pisa nada: suma las etiquetas que falten y, si una anotación es distinta, conserva las dos. El archivo sale sin cifrar: guardalo donde guardes cualquier otro papel de trabajo.</p>' +
      '<h3>Etiquetas</h3>' +
      (et.length
        ? '<table class="lista">' + et.map((e) => '<tr><td><span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span></td>' +
          '<td style="color:#6b7c85">' + plural(usoDe(e.id), 'causa', 'causas') + '</td>' +
          '<td style="text-align:right;width:1%;white-space:nowrap"><button class="sj-b chico" data-a="borrarEt" data-id="' + esc(e.id) + '">Eliminar</button></td></tr>').join('') + '</table>'
        : '<p style="color:#6b7c85">Todavía no hay etiquetas. Se crean tocando la columna Etiquetas de cualquier causa.</p>') +
      '</div>';
  }

  function panelAcercaHTML() {
    return '<div class="sj-panel-in">' +
      '<h2>SuPJN+ <span style="font-size:12px;color:#6b7c85;font-weight:400">' + esc(APP.version) + '</span></h2>' +
      '<p>Una sola ventana sobre la Consulta Web del PJN. Arranca minimizada, en la pastilla de abajo a la derecha, y mientras tanto lee tus causas en segundo plano. Se mueve arrastrando la barra azul, se agranda desde la esquina de abajo a la derecha, y tiene zoom, minimizar, maximizar y cerrar.</p>' +
      '<h3>Qué hace</h3>' +
      '<p><b>Mis causas y Favoritos:</b> lee las dos listas del PJN, en trámite y fuera de trámite, en segundo plano y sin mover la página que estás viendo. Se busca, se filtra, se ordena por cualquier columna y las columnas se mueven, se ensanchan y se ocultan. Lo mismo vale para las actuaciones del expediente: fecha, tipo de actuación, descripción y fojas son columnas, y se ordenan y se mueven igual.</p>' +
      '<p><b>Encuadre y zoom:</b> de fábrica la tabla entra siempre en el ancho de la ventana, así que lo que le das a una columna se lo sacás a las otras; se saca desde <b>Columnas</b>. El zoom de la barra de título agranda lo de adentro sin mover la ventana.</p>' +
      '<p><b>Dejar nota:</b> tiene su propia solapa. En todas las causas que el PJN habilite o solo en las seleccionadas. Pide confirmar antes de empezar y guarda el resultado de cada causa en la columna Nota.</p>' +
      '<p><b>Bajar:</b> desde la lista, el expediente completo de las causas seleccionadas o las actuaciones que elijas de una causa; desde el expediente, todo o las actuaciones elegidas. Cada causa sale en un PDF.</p>' +
      '<p><b>Funciones del PJN:</b> el menú de la barra azul lleva a las listas del PJN, a Radicaciones, a la consulta pública y a las otras aplicaciones: Escritos, DEOX, Notificaciones, IWECS, Autorizados y Mis eventos del Portal. Por causa: abrir en esta pestaña o en una nueva, libro digital y presentar escrito.</p>' +
      '<h3>Qué no hace</h3>' +
      '<p>No deja notas sin que lo confirmes, no presenta escritos, no cambia favoritos y no sube nada. Las anotaciones son notas privadas de trabajo: se llaman así para no confundirlas con dejar nota, que es el acto procesal.</p>' +
      '<h3>Autoría y licencia</h3>' +
      '<p>Creado por <b>' + esc(APP.autor) + '</b> con Claude. <a href="mailto:' + esc(APP.mail) + '">' + esc(APP.mail) + '</a></p>' +
      '<p>Copyleft, ' + esc(APP.licencia) + '. Copyright (C) ' + esc(APP.anio) + ' ' + esc(APP.autor) + '. Software libre: se permite y se alienta su uso, copia, modificación y distribución gratuita, siempre que las obras derivadas conserven esta misma licencia. Sin garantía. ' +
      '<a href="' + esc(APP.licenciaUrl) + '" target="_blank" rel="noopener noreferrer">Texto de la licencia</a> · ' +
      '<a href="' + esc(APP.github) + '" target="_blank" rel="noopener noreferrer">Repositorio en GitHub</a></p>' +
      '</div>';
  }

  // ---------------------------------------------------------- pintar todo

  function pintarTodo() {
    if (!win) return;
    pintarSolapas();
    pintarNota();
    const lista = esVistaLista();
    q('[data-e="vLista"]').style.display = lista ? 'flex' : 'none';
    q('[data-e="vPanel"]').style.display = lista ? 'none' : '';
    if (lista) {
      pintarFiltros();
      pintarEstado();
      pintarCopia();
      pintarBotonesLectura();
      pintarAccion();
      pintarTabla();
    } else if (VISTA === 'exp') {
      pintarExpediente();
    } else if (VISTA === 'nota') {
      q('[data-e="vPanel"]').innerHTML = panelNotaHTML();
    } else if (VISTA === 'desc') {
      pintarDescargas();
    } else if (VISTA === 'marcas') {
      q('[data-e="vPanel"]').innerHTML = panelMarcasHTML();
    } else if (VISTA === 'acerca') {
      q('[data-e="vPanel"]').innerHTML = panelAcercaHTML();
    }
    pintarPastilla();
  }

  function guardarNotaAbierta() {
    if (!win) return;
    win.querySelectorAll('[data-marca] .sj-nota').forEach((t) => {
      const k = t.closest('[data-marca]').dataset.marca;
      if (t.value !== (marcaDe(k).nota || '')) fijarMarca(k, { nota: t.value });
    });
  }

  function irAVista(v) {
    guardarNotaAbierta();
    cerrarMenu();
    VISTA = v;
    irALista(v);
    if (v === 'rel' || v === 'fav') { CFG.vista = v; guardarCfg(); }
    abierta = null;
    // El pedido de confirmación vive en la solapa Dejar nota: salir de ahí lo cancela.
    if (v !== 'nota') confirmaNota = null;
    pintarTodo();
    const panel = q('[data-e="vPanel"]');
    if (panel) panel.scrollTop = 0;
  }

  // ------------------------------------------------------- leer las listas

  async function actualizar(tipos) {
    if (leyendo) return;
    if (corridaActiva()) { avisar('Hay una tanda de dejar nota en curso. Las listas se leen cuando termine.', true); return; }
    tipos = tipos && tipos.length ? tipos : ['rel', 'fav'];
    leyendo = true;
    cancelarLectura = false;
    pintarBotonesLectura();
    if (esVistaLista() && !datosVista()) pintarTabla();
    const errores = [];
    let cortada = false;
    for (const tipo of tipos) {
      if (cancelarLectura) { cortada = true; break; }
      try {
        const r = await leerLista(tipo, (t) => { if (esVistaLista()) estadoTxt(t); });
        DATOS[tipo] = r;
        indexar(tipo);
        if (!guardarAlmacen(LISTAS[tipo].clave, r)) errores.push(LISTAS[tipo].nombre + ' se leyó pero no se pudo guardar en esta PC');
        pintarSolapas();
        if (VISTA === tipo) { pintarFiltros(); pintarTabla(); }
      } catch (e) {
        const msg = String(e && e.message ? e.message : e);
        if (msg === 'cortado') { cortada = true; break; }
        errores.push(LISTAS[tipo].nombre + ': ' + msg);
        if (msg === VENCIDA) break;
      }
    }
    leyendo = false;
    cancelarLectura = false;
    if (errores.length) avisar('No se pudo leer todo. ' + errores.join('. ') + '. Queda lo que ya estaba leído.', true);
    else if (cortada) avisar('Lectura cortada. Queda lo que ya estaba leído.');
    pintarSolapas();
    pintarPastilla();
    if (esVistaLista()) {
      pintarFiltros();
      pintarEstado();
      pintarBotonesLectura();
      pintarAccion();
      pintarTabla();
    }
  }

  function refrescarSiHaceFalta() {
    const viejas = ['rel', 'fav'].filter((t) => !DATOS[t] || Date.now() - DATOS[t].fecha > VIEJA_DESPUES_DE);
    if (viejas.length) actualizar(viejas);
  }

  // ----------------------------------------------------- acciones por causa

  let accionEnCurso = false;

  function ocupado() {
    if (bloqueoNota()) { avisar('Hay una tanda de dejar nota en curso: esperá a que termine.', true); return true; }
    if (accionEnCurso) { avisar('Esperá un momento: estoy abriendo otra causa.', true); return true; }
    return false;
  }

  function pestanaNueva(nombre, k) {
    const w = window.open('', nombre || '_blank');
    if (!w) { avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true); return null; }
    try {
      w.document.title = 'SuPJN+';
      w.document.body.innerHTML = '<p style="font:15px Segoe UI,Arial,sans-serif;padding:24px;color:#14416f">SuPJN+ está abriendo ' + esc(k) + '...</p>';
    } catch (e) { /* la pestaña puede no dejarse escribir */ }
    return w;
  }

  const cerrarPestana = (w) => { try { if (w) w.close(); } catch (e) { /* ya cerrada */ } };
  const mensajeDe = (e) => String(e && e.message ? e.message : e);

  async function abrirCausa(k, nueva) {
    if (ocupado()) return;
    const w = nueva ? pestanaNueva('_blank', k) : null;
    if (nueva && !w) return;
    accionEnCurso = true;
    try {
      const url = await direccionDe(k, 'ojo', (t) => avisar(t));
      if (w) { w.location.replace(url); avisar('Abrí ' + k + ' en una pestaña nueva.'); }
      else { avisar('Abro ' + k + '...'); location.href = url; }
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  async function libroDigital(k) {
    if (ocupado()) return;
    const w = pestanaNueva('_blank', k);
    if (!w) return;
    accionEnCurso = true;
    try {
      const url = await direccionDe(k, 'libro', (t) => avisar(t));
      w.location.replace(url);
      avisar('Abrí el libro digital de ' + k + ' en una pestaña nueva.');
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir el libro digital de ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  // "Presentar escrito" lleva a otra aplicación del PJN (Sistema de Escritos).
  // El pedido lo hace la PESTAÑA NUEVA con un formulario propio, armado con los
  // mismos campos que manda el enlace del PJN: así la navegación es de una
  // pestaña común (el PJN rechaza la misma acción si la dispara un marco) y no
  // depende de que el marco de lectura siga vivo.
  async function presentarEscrito(k) {
    if (ocupado()) return;
    const w = pestanaNueva('_blank', k);
    if (!w) return;
    accionEnCurso = true;
    try {
      const u = await ubicarCausa(k, (t) => avisar(t), true);
      const a = enlaceMenu(u.tr, /presentar escrito/i);
      if (!a) throw new Error('la fila no tiene "Presentar escrito"');
      const p = paramsDeEnlace(a);
      const form = p && u.fr.contentDocument.getElementById(p.formId);
      if (!form) throw new Error('no encuentro el formulario del PJN');
      const campos = [];
      new u.fr.contentWindow.FormData(form).forEach((v, n) => { if (typeof v === 'string') campos.push([n, v]); });
      p.pares.forEach(([n, v]) => campos.push([n, v]));
      enviarEnPestana(w, form.action, campos);
      avisar('Abrí "Presentar escrito" de ' + k + ' en una pestaña nueva.');
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir "Presentar escrito" de ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  // Arma y envía un formulario dentro de la pestaña nueva (que es about:blank y
  // del mismo origen, así que se puede escribir).
  function enviarEnPestana(w, accion, campos) {
    const d = w.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>SuPJN+</title></head><body style="font:15px Segoe UI,Arial,sans-serif;padding:24px;color:#14416f">Abriendo en el PJN...</body></html>');
    d.close();
    const f = d.createElement('form');
    f.method = 'POST';
    f.action = accion;
    campos.forEach(([n, v]) => {
      const i = d.createElement('input');
      i.type = 'hidden';
      i.name = n;
      i.value = v;
      f.appendChild(i);
    });
    d.body.appendChild(f);
    f.submit();
  }

  function bajarCausas(claves) {
    const n = encolarCausas(claves, 'todo');
    avisar(n ? plural(n, 'causa agregada', 'causas agregadas') + ' a Descargas. Se bajan de a una en segundo plano: podés seguir trabajando en esta pestaña.' : 'Esas causas ya estaban en Descargas.');
    pintarSolapas();
  }

  function elegirActuaciones(k) {
    encolarCausas([k], 'elegir');
    irAVista('desc');
  }

  function pedirNota(solo) {
    if (bloqueoNota()) { avisar('Ya hay una tanda de dejar nota en curso.', true); return; }
    confirmaNota = { solo };
    irAVista('nota');
  }

  // -------------------------------------------------------------- construir

  // La geometría se piensa siempre en píxeles de pantalla; al escribirla se
  // divide por el zoom, porque el navegador multiplica por él lo que le damos.
  const fijarGeom = (g) => {
    const z = zoomAct();
    if (g.x != null) win.style.left = Math.round(g.x) / z + 'px';
    if (g.y != null) win.style.top = Math.round(g.y) / z + 'px';
    if (g.w != null) win.style.width = Math.round(g.w) / z + 'px';
    if (g.h != null) win.style.height = Math.round(g.h) / z + 'px';
  };
  const geom = () => {
    const r = win.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };

  function acomodarVentana() {
    if (!win) return;
    medidaMaxi();
    if (CFG.maxi || win.style.display === 'none') return;
    const r = geom();
    if (r.w > innerWidth - 8) fijarGeom({ w: Math.max(520, innerWidth - 8) });
    if (r.h > innerHeight - 8) fijarGeom({ h: Math.max(320, innerHeight - 8) });
    const r2 = geom();
    if (r2.x > innerWidth - 120) fijarGeom({ x: Math.max(4, innerWidth - r2.w - 4) });
    if (r2.y > innerHeight - 40) fijarGeom({ y: Math.max(4, innerHeight - r2.h - 4) });
  }

  // Zoom de la ventana: la ventana no se mueve ni cambia de tamaño en pantalla;
  // lo que cambia es el tamaño de lo que hay adentro y cuánto entra.
  // Maximizada el tamaño lo pone el CSS con estas dos variables, corregidas por
  // el zoom para que la ventana siga midiendo lo que mide la pantalla.
  function medidaMaxi() {
    const z = zoomAct();
    win.style.setProperty('--sj-w', innerWidth / z + 'px');
    win.style.setProperty('--sj-h', innerHeight / z + 'px');
  }

  function aplicarZoom(repintar) {
    if (!win) return;
    // Minimizada no hay nada en pantalla que conservar: medirla daría cero.
    const r = (CFG.maxi || win.style.display === 'none') ? null : geom();
    win.style.zoom = zoomAct() === 1 ? '' : String(zoomAct());
    medidaMaxi();
    if (r) fijarGeom(r);
    const pc = q('[data-e="zoomPc"]');
    if (pc) {
      pc.textContent = Math.round(zoomAct() * 100) + '%';
      pc.classList.toggle('act', zoomAct() !== 1);
    }
    acomodarVentana();
    if (repintar) { pintarTodo(); reencuadrar(); }
  }

  function cambiarZoom(z) {
    const nuevo = acotarZoom(z);
    if (nuevo === zoomAct()) return;
    guardarNotaAbierta();
    cerrarMenu();
    CFG.zoom = nuevo;
    guardarCfg();
    aplicarZoom(true);
  }

  // Pedido del autor: la posición no se guarda; arranca siempre en su lugar.
  // El tamaño elegido sí queda, uno para las listas y otro para el expediente.
  function ubicarVentana() {
    const W = innerWidth, H = innerHeight;
    const tam = CFG.tam[TIPO_PAG] || {};
    let w, h;
    if (EN_EXPEDIENTE) {
      w = tam.w || Math.max(560, Math.round(W * 0.5));
      h = tam.h || Math.round(H * 0.9);
    } else {
      w = tam.w || Math.round(W * 0.96);
      h = tam.h || Math.round(H * 0.93);
    }
    w = Math.max(520, Math.min(w, W - 8));
    h = Math.max(320, Math.min(h, H - 8));
    const left = EN_EXPEDIENTE ? W - w - 12 : Math.round((W - w) / 2);
    fijarGeom({ x: Math.max(4, left), y: Math.max(4, Math.round((H - h) / 2)), w, h });
  }

  function abrirVentana() {
    if (!win) return;
    win.style.display = 'flex';
    pastilla.style.display = 'none';
    pintarTodo();
  }

  function minimizar() {
    if (!win) return;
    guardarNotaAbierta();
    cerrarMenu();
    win.style.display = 'none';
    pastilla.style.display = '';
    pintarPastilla();
  }

  function cerrarVentana() {
    confirmaNota = null;
    abierta = null;
    minimizar();
  }

  // Las tablas se vuelven a encuadrar cada vez que cambia el ancho útil.
  function reencuadrar() {
    if (!win || win.style.display === 'none') return;
    if (esVistaLista()) pintarTabla();
    if (VISTA === 'exp') pintarElegir('exp');
    if (VISTA === 'desc') pintarDescargas();
  }

  function alternarMaxi() {
    CFG.maxi = !CFG.maxi;
    win.classList.toggle('maxi', CFG.maxi);
    guardarCfg();
    cerrarMenu();
    reencuadrar();
  }

  function arrastrar(e, alMover, alSoltar) {
    e.preventDefault();
    document.body.style.userSelect = 'none';
    const mover = (ev) => alMover(ev);
    const soltar = (ev) => {
      document.removeEventListener('mousemove', mover, true);
      document.removeEventListener('mouseup', soltar, true);
      document.body.style.userSelect = '';
      if (alSoltar) alSoltar(ev);
    };
    document.addEventListener('mousemove', mover, true);
    document.addEventListener('mouseup', soltar, true);
  }

  let recienRedim = false;
  let colArrastrada = null;

  function construir() {
    if (document.getElementById('supjn')) return false;
    const st = document.createElement('style');
    st.id = 'supjn-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);

    win = document.createElement('div');
    win.id = 'supjn';
    win.style.display = 'none';
    if (CFG.maxi) win.classList.add('maxi');
    win.innerHTML =
      '<div class="sj-tit" data-e="tit" title="Arrastrá para mover la ventana. Doble clic para maximizar o restaurar.">' +
      '<b>SuPJN+</b><span class="v">' + esc(APP.version) + '</span>' +
      '<button class="fn" data-a="menuPJN">Funciones del PJN ▾</button>' +
      '<span class="zm" data-e="zoom"><button data-a="zoomMenos" title="Alejar: entra más en la ventana">−</button>' +
      '<button class="pc" data-a="zoomCien" title="Volver al tamaño normal" data-e="zoomPc">100%</button>' +
      '<button data-a="zoomMas" title="Acercar: se ve más grande">+</button></span>' +
      '<span class="ctrl"><button data-a="min" title="Minimizar">–</button>' +
      '<button data-a="max" title="Maximizar o restaurar">□</button>' +
      '<button data-a="cerrar" class="x" title="Cerrar">×</button></span></div>' +
      '<div class="sj-solapas" data-e="solapas"></div>' +
      '<div class="sj-nota-barra" data-e="notaBarra" style="display:none"></div>' +
      '<div class="sj-aviso" data-e="aviso" style="display:none"></div>' +
      '<div data-e="vLista" style="display:flex;flex-direction:column;flex:1;min-height:0">' +
      '<div class="sj-barra">' +
      '<input type="text" data-f="texto" placeholder="Buscar en cualquier campo, incluidas etiquetas y anotaciones">' +
      '<select data-f="fuero" title="Fuero"></select>' +
      '<select data-f="sit" title="Situación"></select>' +
      '<select data-f="tramite" title="Trámite"><option value="todas">En trámite y fuera de trámite</option>' +
      '<option value="si">Solo en trámite</option><option value="no">Solo fuera de trámite</option></select>' +
      '<select data-f="etiqueta" title="Etiqueta"></select>' +
      '<label>Últ. act. <input type="date" data-f="desde" title="Desde"></label>' +
      '<label>a <input type="date" data-f="hasta" title="Hasta"></label>' +
      '<button class="sj-b" data-a="limpiar">Limpiar filtros</button>' +
      '<button class="sj-b" data-a="menuCols">Columnas ▾</button>' +
      '</div>' +
      '<div class="sj-est"><span class="txt" data-e="estado"></span>' +
      '<button class="sj-b prim" data-a="actualizar" title="Vuelve a leer Mis causas y Favoritos del PJN">Actualizar</button>' +
      '<button class="sj-b peligro" data-a="cortarLectura" style="display:none">Cortar</button>' +
      '<span class="sj-copia" data-a="irMarcas" data-e="copia"></span></div>' +
      '<div class="sj-accion" data-e="accion"></div>' +
      '<div class="sj-cuerpo" data-e="cuerpo"></div>' +
      '<div class="sj-pie" data-e="pie"></div>' +
      '</div>' +
      '<div class="sj-panel" data-e="vPanel" style="display:none"></div>' +
      '<div class="sj-redim" data-e="redim" title="Arrastrá para cambiar el tamaño"></div>' +
      '<input type="file" data-e="archivo" accept=".json,application/json" style="display:none">';
    document.body.appendChild(win);
    ubicarVentana();

    pastilla = document.createElement('button');
    pastilla.id = 'supjn-pastilla';
    pastilla.title = 'Abrir SuPJN+';
    pastilla.style.display = 'none';
    document.body.appendChild(pastilla);
    pastilla.addEventListener('click', abrirVentana);

    // mover la ventana
    q('[data-e="tit"]').addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || CFG.maxi) return;
      const r = geom();
      const sx = e.clientX, sy = e.clientY;
      arrastrar(e, (ev) => {
        fijarGeom({
          x: Math.max(120 - r.w, Math.min(innerWidth - 120, r.x + ev.clientX - sx)),
          y: Math.max(0, Math.min(innerHeight - 38, r.y + ev.clientY - sy))
        });
      });
    });
    q('[data-e="tit"]').addEventListener('dblclick', (e) => { if (!e.target.closest('button')) alternarMaxi(); });

    // cambiar el tamaño
    q('[data-e="redim"]').addEventListener('mousedown', (e) => {
      if (e.button !== 0 || CFG.maxi) return;
      const r = geom();
      const sx = e.clientX, sy = e.clientY;
      arrastrar(e, (ev) => {
        fijarGeom({
          w: Math.max(520, Math.min(innerWidth - r.x - 2, r.w + ev.clientX - sx)),
          h: Math.max(320, Math.min(innerHeight - r.y - 2, r.h + ev.clientY - sy))
        });
      }, () => {
        const f = geom();
        CFG.tam[TIPO_PAG] = { w: Math.round(f.w), h: Math.round(f.h) };
        guardarCfg();
        reencuadrar();
      });
    });

    // ancho de columna: borde derecho del título
    win.addEventListener('mousedown', (e) => {
      const rs = e.target.closest && e.target.closest('[data-rs]');
      if (!rs || e.button !== 0) return;
      const k = rs.dataset.rs, tab = rs.dataset.tabla || 'lista';
      const th = rs.closest('th');
      const tabla = th.closest('table');
      const cajaTabla = tabla.parentElement;
      // Con el encuadre puesto, el ancho dibujado no es el guardado: se parte
      // de lo que se ve en pantalla.
      const cols = [];
      const base = {};
      tabla.querySelectorAll('col[data-col]').forEach((c) => {
        cols.push(c.dataset.col);
        base[c.dataset.col] = Math.max(minCol(tab, c.dataset.col), Math.round(c.getBoundingClientRect().width / zoomAct()));
      });
      const ancho0 = base[k];
      const total0 = parseInt(tabla.style.width, 10) || Math.round(tabla.offsetWidth);
      // Si la tabla ya entra justa, se mantiene así: la columna crece a costa
      // de las otras en vez de empujar la tabla fuera de la ventana.
      const ajustado = CFG.encuadrar && total0 <= (cajaTabla ? cajaTabla.clientWidth : 0) + 1;
      const sx = e.clientX;
      th.draggable = false;
      recienRedim = true;
      arrastrar(e, (ev) => {
        const w = Math.max(minCol(tab, k), Math.round(ancho0 + (ev.clientX - sx) / zoomAct()));
        const anchos = ajustado ? repartirEncuadre(tab, base, cols, k, w) : Object.assign({}, base, { [k]: w });
        tabla.querySelectorAll('col[data-col]').forEach((c) => { c.style.width = anchos[c.dataset.col] + 'px'; });
        // Ajustada la tabla no cambia de ancho; si no, crece o se achica con la columna.
        if (!ajustado) tabla.style.width = Math.round(total0 - ancho0 + anchos[k]) + 'px';
        Object.assign(CFG[TABLAS[tab].anchos], anchos);
      }, () => {
        th.draggable = true;
        guardarCfg();
        setTimeout(() => { recienRedim = false; }, 50);
      });
    }, true);

    // mover columnas: arrastrar el título
    win.addEventListener('dragstart', (e) => {
      const th = e.target.closest && e.target.closest('th[data-k]');
      if (!th) return;
      colArrastrada = { k: th.dataset.k, tabla: th.dataset.tabla || 'lista' };
      th.classList.add('arrastrando');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', colArrastrada.k); } catch (x) { /* sin datos */ }
    });
    const limpiarDrop = () => win.querySelectorAll('th.drop-izq, th.drop-der').forEach((t) => t.classList.remove('drop-izq', 'drop-der'));
    // Una columna se suelta solo dentro de su propia tabla.
    const destinoCol = (e) => {
      const th = e.target.closest && e.target.closest('th[data-k]');
      return th && colArrastrada && (th.dataset.tabla || 'lista') === colArrastrada.tabla ? th : null;
    };
    win.addEventListener('dragover', (e) => {
      const th = destinoCol(e);
      if (!th) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (x) { /* sin efecto */ }
      const r = th.getBoundingClientRect();
      const der = e.clientX > r.left + r.width / 2;
      limpiarDrop();
      if (th.dataset.k !== colArrastrada.k) th.classList.add(der ? 'drop-der' : 'drop-izq');
    });
    win.addEventListener('drop', (e) => {
      if (!colArrastrada) return;
      const th = destinoCol(e);
      e.preventDefault();
      const { k, tabla } = colArrastrada;
      colArrastrada = null;
      limpiarDrop();
      if (th && th.dataset.k !== k) {
        const r = th.getBoundingClientRect();
        moverColumna(tabla, k, th.dataset.k, e.clientX > r.left + r.width / 2);
      }
      repintarTabla(tabla);
    });
    win.addEventListener('dragend', () => {
      colArrastrada = null;
      limpiarDrop();
      win.querySelectorAll('th.arrastrando').forEach((t) => t.classList.remove('arrastrando'));
    });

    // filtros de la lista
    win.querySelector('.sj-barra').addEventListener('input', (e) => {
      const f = e.target.dataset && e.target.dataset.f;
      if (!f) return;
      CFG[f] = e.target.value;
      PAGINA_VISTA[VISTA === 'fav' ? 'fav' : 'rel'] = 1;
      abierta = null;
      guardarCfg();
      pintarTabla();
    });

    // filtros de elegir actuaciones
    win.addEventListener('input', (e) => {
      const ef = e.target.dataset && e.target.dataset.ef;
      if (!ef) return;
      const cont = e.target.closest('[data-elegir]');
      const id = cont.dataset.elegir;
      const ctx = ctxElegir(id);
      if (!ctx) return;
      ctx.filtro[ef] = e.target.value;
      const pos = e.target.selectionStart;
      pintarElegir(id);
      const nuevo = q('[data-elegir="' + id + '"] [data-ef="' + ef + '"]');
      if (nuevo) { nuevo.focus(); try { if (ef === 'texto') nuevo.setSelectionRange(pos, pos); } catch (x) { /* fecha */ } }
    });

    win.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-pp]')) {
        CFG.porPagina = parseInt(t.value, 10) || 25;
        PAGINA_VISTA.rel = 1;
        PAGINA_VISTA.fav = 1;
        guardarCfg();
        pintarTabla();
        return;
      }
      if (t.matches('[data-sel]')) {
        const s = selVista();
        if (t.checked) s.add(t.dataset.sel); else s.delete(t.dataset.sel);
        const tr = t.closest('tr');
        if (tr) tr.classList.toggle('sel', t.checked);
        const todas = q('[data-a="selTodas"]');
        if (todas) { const L = filtradas(); todas.checked = L.length > 0 && L.every((c) => s.has(c.exp)); }
        pintarAccion();
        return;
      }
      if (t.matches('[data-a="selTodas"]')) {
        const s = selVista();
        const L = filtradas();
        L.forEach((c) => { if (t.checked) s.add(c.exp); else s.delete(c.exp); });
        pintarTabla();
        pintarAccion();
        return;
      }
      if (t.matches('[data-enc]')) {
        CFG.encuadrar = !!t.checked;
        guardarCfg();
        repintarTabla('lista');
        repintarTabla('act');
        return;
      }
      if (t.matches('[data-colvis]')) {
        const k = t.dataset.colvis, tab = t.dataset.tabla || 'lista';
        const clave = TABLAS[tab].ocultas;
        CFG[clave] = CFG[clave].filter((x) => x !== k);
        if (!t.checked) {
          if (columnasVisibles(tab).length <= 1) { t.checked = true; return; }
          CFG[clave].push(k);
        }
        guardarCfg();
        repintarTabla(tab);
        return;
      }
      if (t.matches('[data-ei]')) {
        const cont = t.closest('[data-elegir]');
        const ctx = ctxElegir(cont.dataset.elegir);
        if (!ctx) return;
        const i = parseInt(t.dataset.ei, 10);
        if (t.checked) ctx.elegidas.add(i); else ctx.elegidas.delete(i);
        actualizarCuentaElegir(cont.dataset.elegir);
        return;
      }
      if (t.matches('[data-e="pausa"]')) {
        CFG.pausaNota = Math.max(300, parseInt(t.value, 10) || 700);
        guardarCfg();
      }
    });

    // anotación: al salir del campo se guarda
    win.addEventListener('focusout', (e) => {
      if (!e.target.classList || !e.target.classList.contains('sj-nota')) return;
      const caja = e.target.closest('[data-marca]');
      if (!caja || e.target.value === (marcaDe(caja.dataset.marca).nota || '')) return;
      fijarMarca(caja.dataset.marca, { nota: e.target.value });
      const ok = caja.querySelector('.sj-ok');
      if (ok) { ok.classList.add('si'); setTimeout(() => ok.classList.remove('si'), 2200); }
      pintarCopia();
    });

    win.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sj-et-nombre')) {
        e.preventDefault();
        const b = e.target.closest('[data-marca]').querySelector('[data-a="crearEt"]');
        if (b) b.click();
      }
    });

    const archivo = q('[data-e="archivo"]');
    archivo.addEventListener('change', () => {
      const f = archivo.files && archivo.files[0];
      if (!f) return;
      const lector = new FileReader();
      lector.onload = () => {
        const r = importarMarcas(String(lector.result || ''));
        archivo.value = '';
        if (typeof r === 'string') { avisar(r, true); return; }
        avisar('Importadas ' + plural(r.filas, 'causa marcada', 'causas marcadas') + '. Quedan ' + plural(r.etiquetas, 'etiqueta', 'etiquetas') + '.');
        pintarTodo();
      };
      lector.onerror = () => { archivo.value = ''; avisar('No se pudo leer el archivo.', true); };
      lector.readAsText(f);
    });

    win.addEventListener('click', alClic);

    // un clic afuera cierra el menú abierto
    document.addEventListener('mousedown', (e) => {
      if (!menuAbierto) return;
      if (menuAbierto.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-a="menuPJN"], [data-a="menuCols"], [data-a="menuColsAct"], [data-mas]')) return;
      cerrarMenu();
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !win || win.style.display === 'none') return;
      if (menuAbierto) { cerrarMenu(); return; }
      if (confirmaNota) { confirmaNota = null; pintarTodo(); return; }
      if (abierta) { guardarNotaAbierta(); abierta = null; pintarTabla(); return; }
      minimizar();
    });

    let tRedim = null;
    window.addEventListener('resize', () => {
      acomodarVentana();
      clearTimeout(tRedim);
      tRedim = setTimeout(reencuadrar, 200);
    });

    // Mientras haya descargas, salir de la página las corta: el navegador avisa.
    window.addEventListener('beforeunload', (e) => {
      if (!bajandoAlgo()) return;
      e.preventDefault();
      e.returnValue = '';
    });
    return true;
  }

  function trabajoDesdeElegir(id, urls, parcial) {
    if (id === 'exp') {
      const d = EXP.datos || {};
      nuevoTrabajo({ exp: d.exp || '', car: d.car || '', modo: 'seleccion', origen: 'exp', acts: EXP.acts, urls, parcial, estado: 'a bajar', texto: 'Esperando turno...' });
      pintarExpEstado();
    } else {
      const t = COLA.find((x) => x.id === id);
      if (!t) return;
      t.urls = urls;
      t.parcial = parcial;
      t.estado = 'a bajar';
      t.texto = 'Esperando turno...';
      pintarDescargas();
    }
    pintarSolapas();
    procesarCola();
  }

  function alClic(e) {
    const t = e.target;

    const sol = t.closest('[data-vista]');
    if (sol) { irAVista(sol.dataset.vista); return; }

    const th = t.closest('th[data-k]');
    if (th && !t.closest('[data-rs]')) {
      if (recienRedim) return;
      const tab = th.dataset.tabla || 'lista';
      alternarOrden(tab, th.dataset.k);
      repintarTabla(tab);
      return;
    }

    const pg = t.closest('[data-pag]');
    if (pg && !pg.disabled) {
      PAGINA_VISTA[VISTA === 'fav' ? 'fav' : 'rel'] = parseInt(pg.dataset.pag, 10) || 1;
      abierta = null;
      pintarTabla();
      q('[data-e="cuerpo"]').scrollTop = 0;
      return;
    }

    const abn = t.closest('[data-abrirnueva]');
    if (abn) { abrirCausa(abn.dataset.abrirnueva, true); return; }

    const ab = t.closest('[data-abrir]');
    if (ab) { abrirCausa(ab.dataset.abrir, !!(e.ctrlKey || e.metaKey)); return; }

    const mas = t.closest('[data-mas]');
    if (mas) {
      if (menuAbierto && menuAbierto.dataset.ancla === mas.dataset.mas) { cerrarMenu(); return; }
      abrirMenu(mas, menuFilaHTML(mas.dataset.mas));
      return;
    }

    const det = t.closest('[data-det]');
    if (det) {
      guardarNotaAbierta();
      abierta = abierta === det.dataset.det ? null : det.dataset.det;
      pintarTabla();
      const caja = abierta && q('.sj-det-in[data-marca]');
      if (caja) {
        const campo = caja.querySelector(det.dataset.foco === 'nota' ? '.sj-nota' : '.sj-et-nombre');
        caja.scrollIntoView({ block: 'nearest' });
        if (campo) campo.focus();
      }
      return;
    }

    const colBtn = t.closest('.sj-col');
    if (colBtn) {
      colorElegido = colBtn.dataset.color;
      colBtn.parentElement.querySelectorAll('.sj-col').forEach((b) => b.classList.toggle('sel', b === colBtn));
      return;
    }

    const chip = t.closest('button[data-et]');
    if (chip) {
      const caja = chip.closest('[data-marca]');
      guardarNotaAbierta();
      alternarEtiqueta(caja.dataset.marca, chip.dataset.et);
      if (VISTA === 'exp') pintarExpediente(); else pintarTabla();
      pintarCopia();
      return;
    }

    const ea = t.closest('[data-ea]');
    if (ea && !ea.disabled) {
      const cont = ea.closest('[data-elegir]');
      const id = cont.dataset.elegir;
      const ctx = ctxElegir(id);
      if (!ctx) return;
      const a = ea.dataset.ea;
      const V = actsFiltradas(ctx);
      if (a === 'todas') V.forEach((i) => ctx.elegidas.add(i));
      if (a === 'ninguna') V.forEach((i) => ctx.elegidas.delete(i));
      if (a === 'invertir') V.forEach((i) => { if (ctx.elegidas.has(i)) ctx.elegidas.delete(i); else ctx.elegidas.add(i); });
      if (a === 'todasCb') {
        if (ea.checked) V.forEach((i) => ctx.elegidas.add(i)); else V.forEach((i) => ctx.elegidas.delete(i));
        pintarElegir(id);
        return;
      }
      if (a === 'todas' || a === 'ninguna' || a === 'invertir') { pintarElegir(id); return; }
      if (a === 'ordenPJN') { CFG.ordenAct = { col: '', desc: true }; guardarCfg(); pintarElegir(id); return; }
      if (a === 'bajarElegidas') {
        const idx = [...ctx.elegidas].sort((x, y) => x - y);
        trabajoDesdeElegir(id, idx.map((i) => ctx.acts[i].url), idx.length < ctx.acts.length);
        return;
      }
      if (a === 'bajarTodo') { trabajoDesdeElegir(id, ctx.acts.map((x) => x.url), false); return; }
      if (a === 'releer') { leerExpedienteActual(); return; }
      if (a === 'descartar') {
        const i = COLA.findIndex((x) => x.id === id);
        if (i >= 0) COLA.splice(i, 1);
        pintarDescargas();
      }
      return;
    }

    const b = t.closest('[data-a]');
    if (!b || b.disabled) return;
    const a = b.dataset.a;
    const k = b.dataset.k;
    if (b.closest('.sj-menu')) cerrarMenu();

    switch (a) {
      case 'min': minimizar(); return;
      case 'cerrar': cerrarVentana(); return;
      case 'max': alternarMaxi(); return;
      case 'menuPJN':
        if (menuAbierto && menuAbierto.dataset.ancla === 'menuPJN') { cerrarMenu(); return; }
        abrirMenu(b, menuPJNHTML());
        return;
      case 'menuCols':
      case 'menuColsAct': {
        if (menuAbierto && menuAbierto.dataset.ancla === a) { cerrarMenu(); return; }
        abrirMenu(b, menuColsHTML(a === 'menuColsAct' ? 'act' : 'lista'));
        return;
      }
      case 'colsReset': {
        const tab = b.dataset.tabla || 'lista';
        const T = TABLAS[tab];
        CFG[T.cols] = T.def.map((c) => c.k);
        CFG[T.ocultas] = [];
        CFG[T.anchos] = {};
        guardarCfg();
        repintarTabla(tab);
        return;
      }
      case 'zoomMas': cambiarZoom(zoomVecino(1)); return;
      case 'zoomMenos': cambiarZoom(zoomVecino(-1)); return;
      case 'zoomCien': cambiarZoom(1); return;
      case 'actualizar': avisar(''); actualizar(); return;
      case 'cortarLectura': cancelarLectura = true; estadoTxt('Cortando...'); return;
      case 'limpiar':
        Object.assign(CFG, { texto: '', fuero: '', sit: '', tramite: 'todas', etiqueta: '', desde: '', hasta: '' });
        PAGINA_VISTA.rel = 1;
        PAGINA_VISTA.fav = 1;
        guardarCfg();
        pintarFiltros();
        pintarTabla();
        return;
      case 'irMarcas': irAVista('marcas'); return;
      case 'quitarSel': selVista().clear(); pintarTodo(); return;
      case 'quitarUna': selVista().delete(k); pintarTodo(); return;
      case 'notaSel': pedirNota([...selVista()]); return;
      case 'notaTodas': pedirNota(null); return;
      case 'bajarSel': bajarCausas([...selVista()]); return;
      case 'elegirSel': elegirActuaciones([...selVista()][0]); return;
      case 'confirmarNota': {
        const pausa = q('[data-e="pausa"]');
        if (pausa) { CFG.pausaNota = Math.max(300, parseInt(pausa.value, 10) || 700); guardarCfg(); }
        const solo = confirmaNota ? confirmaNota.solo : null;
        confirmaNota = null;
        pintarTodo();
        iniciarNota(solo);
        return;
      }
      case 'cancelarNota': confirmaNota = null; pintarTodo(); return;
      case 'cortarNota': cortarNota(); return;
      case 'abrir': abrirCausa(k, false); return;
      case 'abrirNueva': abrirCausa(k, true); return;
      case 'libro': libroDigital(k); return;
      case 'escrito': presentarEscrito(k); return;
      case 'bajarUna': bajarCausas([k]); return;
      case 'elegirUna': elegirActuaciones(k); return;
      case 'notaUna': pedirNota([k]); return;
      case 'marcasUna':
        abierta = k;
        pintarTabla();
        setTimeout(() => { const c = q('.sj-det-in[data-marca]'); if (c) { c.scrollIntoView({ block: 'nearest' }); const n = c.querySelector('.sj-et-nombre'); if (n) n.focus(); } }, 30);
        return;
      case 'cortarCola': cortarCola = true; COLA.forEach((x) => { if (x.estado === 'en cola' || x.estado === 'a bajar') { x.estado = 'cortado'; x.texto = 'Cortado por vos.'; } }); pintarDescargas(); return;
      case 'limpiarCola':
        for (let i = COLA.length - 1; i >= 0; i--) if (/listo|error|cortado/.test(COLA[i].estado)) COLA.splice(i, 1);
        pintarDescargas();
        return;
      case 'volverLista': location.href = RUTA.rel; return;
      case 'recargar': location.reload(); return;
      case 'notaPJN': {
        const x = botonPJN(/^dejar nota$/i);
        if (!x) { avisar('No encuentro el botón "Dejar Nota" del PJN en esta página.', true); return; }
        minimizar();
        x.click();
        return;
      }
      case 'escritoPJN': {
        const x = botonPJN(/presentar escrito/i);
        if (!x) { avisar('No encuentro "Presentar escrito" en esta página.', true); return; }
        x.click();
        return;
      }
      case 'exportar': exportarMarcas(); pintarCopia(); irAVista('marcas'); avisar('Copia exportada. Guardá el archivo en un lugar seguro.'); return;
      case 'importar': q('[data-e="archivo"]').click(); return;
      case 'borrarEt':
        if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar: se quita de todas'; return; }
        borrarEtiqueta(b.dataset.id);
        irAVista('marcas');
        return;
      case 'cerrarDet': guardarNotaAbierta(); abierta = null; pintarTabla(); return;
      default: break;
    }

    const caja = b.closest('[data-marca]');
    if (!caja) return;
    const km = caja.dataset.marca;
    if (a === 'crearEt') {
      const campo = caja.querySelector('.sj-et-nombre');
      guardarNotaAbierta();
      const id = crearEtiqueta(campo.value, colorElegido);
      if (!id) { campo.focus(); return; }
      if ((marcaDe(km).et || []).indexOf(id) < 0) alternarEtiqueta(km, id);
      if (VISTA === 'exp') pintarExpediente(); else { pintarFiltros(); pintarTabla(); }
      pintarCopia();
      return;
    }
    if (a === 'guardarAnot') {
      fijarMarca(km, { nota: caja.querySelector('.sj-nota').value });
      if (VISTA !== 'exp') pintarTabla();
      pintarCopia();
      const ok = q('[data-marca] .sj-ok');
      if (ok) { ok.classList.add('si'); setTimeout(() => ok.classList.remove('si'), 2200); }
      return;
    }
    if (a === 'borrarAnot') {
      if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar el borrado'; return; }
      fijarMarca(km, { nota: '' });
      if (VISTA === 'exp') pintarExpediente(); else pintarTabla();
      pintarCopia();
    }
  }

  // ------------------------------------------------ el expediente abierto

  async function leerExpedienteActual() {
    if (EXP.estado === 'leyendo') return;
    if (!CID_PAGINA) {
      EXP.estado = 'error';
      EXP.texto = 'No encuentro el número de la consulta (cid) en la dirección de la página: recargala desde la lista.';
      pintarExpEstado();
      return;
    }
    EXP.estado = 'leyendo';
    EXP.cortar = false;
    EXP.texto = 'Leyendo las actuaciones en segundo plano...';
    pintarExpEstado();
    try {
      const r = await leerActuaciones(CID_PAGINA, (t) => { EXP.texto = t; pintarExpEstado(); }, () => EXP.cortar);
      EXP.acts = r.actuaciones;
      EXP.elegidas = new Set();
      EXP.estado = 'listo';
      const hist = r.actuaciones.filter((x) => x.hist).length;
      EXP.texto = plural(r.actuaciones.length, 'actuación con PDF', 'actuaciones con PDF') + (hist ? ' (' + hist + ' históricas)' : '') + '. Elegí cuáles bajar o bajá todo.';
      if (!EXP.datos || !EXP.datos.exp) EXP.datos = r;
    } catch (e) {
      EXP.estado = 'error';
      EXP.texto = 'No se pudieron leer las actuaciones: ' + mensajeDe(e) + '.';
    }
    pintarExpEstado();
    pintarElegir('exp');
  }

  // --------------------------------------------------------------- arranque

  function arrancar() {
    if (!construir()) return;
    if (EN_EXPEDIENTE) {
      VISTA = 'exp';
      EXP.datos = datosExpediente(document);
    } else {
      const tl = EN_LISTA ? tipoLista(document) : null;
      VISTA = tl || (CFG.vista === 'fav' ? 'fav' : 'rel');
      irALista(VISTA);
    }
    // Pedido del autor: SuPJN+ arranca minimizado y lee igual en segundo plano.
    // Queda la pastilla abajo a la derecha, que muestra en qué anda.
    aplicarZoom(false);
    pastilla.style.display = '';
    pintarTodo();

    // Con una tanda de nota en curso sí se abre sola: hay que poder seguirla y cortarla.
    const c = leerCorrida();
    if (c && c.activa) {
      VISTA = 'nota';
      abrirVentana();
      estadoNota(c.cortar ? 'Cerrando la tanda...' : 'Retomando la tanda...');
      pintarNota();
      setTimeout(() => { if (!notaEnCurso) pasoNota(); }, 900);
      return;
    }

    const enc = leerSesion(S_ENCARGO);
    if (enc) {
      borrarSesion(S_ENCARGO);
      if (enc.tipo === 'nota' && Date.now() - (enc.ts || 0) < 60000) {
        if (EN_LISTA && tipoLista(document) === 'rel') {
          VISTA = 'nota';
          abrirVentana();
          estadoNota('Empezando...');
          setTimeout(() => arrancarNotaDesdeEncargo(enc), 700);
          return;
        }
        avisar('No se pudo empezar a dejar nota: el PJN no mostró la lista de Relacionados.', true);
      }
    }

    if (EN_EXPEDIENTE) leerExpedienteActual().then(refrescarSiHaceFalta);
    else refrescarSiHaceFalta();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
