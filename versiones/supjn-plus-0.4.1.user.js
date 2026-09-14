// ==UserScript==
// @name         SuPJN+ - Consulta Web del PJN ampliada
// @namespace    ignacio.kinbaum
// @version      0.4.1
// @description  Una sola ventana sobre la Consulta Web del PJN: Mis causas y Favoritos, en trámite y fuera de trámite, con búsqueda, filtros, orden y columnas movibles; etiquetas y anotaciones propias con respaldo manual; dejar nota en todas o en las seleccionadas; bajar expedientes en PDF eligiendo causas desde la lista o actuaciones desde el expediente; y acceso a las demás funciones del PJN.
// @author       Ignacio Kinbaum
// @license      GPL-3.0-or-later
// @copyright    2026, Ignacio Kinbaum (estudiojuridicokinbaum@gmail.com)
// @homepageURL  https://github.com/Elzas85/SuPJNPLUS
// @supportURL   https://github.com/Elzas85/SuPJNPLUS/issues
// @updateURL    https://raw.githubusercontent.com/Elzas85/SuPJNPLUS/main/supjn-plus.user.js
// @downloadURL  https://raw.githubusercontent.com/Elzas85/SuPJNPLUS/main/supjn-plus.user.js
// @match        https://scw.pjn.gov.ar/scw/*
// @match        https://portalpjn.pjn.gov.ar/*
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
 *   apuntes propios; partes, intervinientes, causas vinculadas y recursos de
 *   cada expediente; dejar nota en todas o en las seleccionadas; bajar
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
 *   configuración, las etiquetas, los apuntes y el último resultado de
 *   dejar nota por causa. Etiquetas, apuntes y notas se respaldan a mano con
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
  // Se aceptan text/html y application/xhtml+xml (JSF puede servir cualquiera
  // de los dos); se descarta todo lo demás.
  if (document.contentType && !/html/i.test(document.contentType)) return;

  // Con permisos de Tampermonkey el jsf del PJN se alcanza por unsafeWindow.
  const PAGINA = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  const APP = {
    nombre: 'SuPJN+',
    version: 'beta 0.4.1',
    autor: 'Ignacio Kinbaum',
    anio: '2026',
    mail: 'estudiojuridicokinbaum@gmail.com',
    licencia: 'GPL-3.0-or-later',
    licenciaUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    github: 'https://github.com/Elzas85/SuPJNPLUS'
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
  const K_HORAS = 'supjn.horas.v1';       // hora del último documento firmado, por causa
  // La tanda en curso va en una clave propia. NOTATOMIC usaba
  // 'notatomic_corrida': si quedó instalado, con clave propia cada uno hace lo
  // suyo y no se pisan los lápices.
  const S_CORRIDA = 'supjn_corrida';      // sessionStorage: tanda de notas en curso
  const S_ENCARGO = 'supjn_encargo';      // sessionStorage: algo que hacer al cargar la página
  // En el Portal del PJN (otro sitio) SuPJN+ no puede leer la Consulta Web: ahí
  // solo aparece la pastilla, para entrar de una.
  const EN_PORTAL = location.host !== 'scw.pjn.gov.ar';
  const VIEJA_DESPUES_DE = 30 * 60 * 1000;
  const BLOQUE_DESCARGAS = 5;             // causas seguidas antes del respiro
  const PAUSA_BLOQUE = 20 * 1000;         // cuánto dura el respiro
  const TOPE_DESCARGAS = 15;              // máximo de causas por vez
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
  // "recién", "hace 20 minutos", "hace 3 horas", "hace 2 días"
  function hace(ms) {
    const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 90) return 'recién';
    const m = Math.round(s / 60);
    if (m < 60) return 'hace ' + plural(m, 'minuto', 'minutos');
    const h = Math.round(m / 60);
    if (h < 24) return 'hace ' + plural(h, 'hora', 'horas');
    return 'hace ' + plural(Math.round(h / 24), 'día', 'días');
  }
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); };
  // Con la fecha local: en UTC, después de las 21 el archivo salía con la de mañana.
  const selloArchivo = () => hoyISO();
  const isoACorta = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] : ''; };
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  // "las 3 seleccionadas" / "la seleccionada"
  const lasN = (n, una, varias) => (n === 1 ? 'la ' + una : 'las ' + n + ' ' + varias);

  // Los errores propios de SuPJN+ ya vienen en castellano. Los del navegador o
  // de pdf-lib vienen en inglés: al usuario se le muestra un texto genérico.
  const INGLES = /\b(cannot|reading|properties|undefined|null|not a function|is not|failed|parse|expected|instance|header|network|abort(ed)?|invalid|unexpected token|permission|denied)\b/i;
  const mensajeDe = (e) => {
    const m = String(e && e.message ? e.message : e);
    if (!INGLES.test(m)) return m;
    try { console.warn('SuPJN+:', m); } catch (x) { /* sin consola */ }
    return 'error inesperado del navegador';
  };

  // Borra números de expediente de un texto que se va a mostrar o copiar (el
  // informe de la revisión no tiene que llevar datos de nadie). Las fechas
  // dd/mm/aaaa quedan como están. Sin lookbehind, que no todos los navegadores
  // entienden.
  const sinNumeroDeCausa = (s) => String(s == null ? '' : s)
    .replace(/([A-Z]{2,4}\s+)?(\d+)\s*\/\s*(\d{4})((?:\s*\/\s*[A-Za-z0-9]+)*)/g,
      (t, f, n, a, r, pos, todo) => (pos > 0 && /[\d/]/.test(todo.charAt(pos - 1)) ? t : 'la causa'));

  // ------------------------------------------------------------------ partes
  //
  // De la lista, el PJN manda la carátula y nada más: no manda los
  // intervinientes. Pero la carátula suele traer los roles escritos
  // ("IMPUTADO: X S/ROBO DAMNIFICADO: Y", "ACTOR: A DEMANDADO: B S/DAÑOS"), y
  // cuando no los trae viene armada como "ACTORA C/ DEMANDADA S/ OBJETO". De
  // ahí salen las partes sin pedirle nada más al PJN. Los roles de verdad están
  // en la solapa Intervinientes de cada expediente.

  // Roles que el PJN escribe en la carátula. Los letrados y demás no aparecen ahí.
  // Ojo con las terminaciones: IMPUTADA? solo toma "IMPUTAD" o "IMPUTADA", no
  // "IMPUTADO". Por eso van con [OA].
  const ROL_CARATULA = /\b(ACTORA?|DEMANDAD[OA]|IMPUTAD[OA]|DENUNCIANTE|DENUNCIAD[OA]|DAMNIFICAD[OA]|V[IÍ]CTIMA|QUERELLANTE|CAUSANTE|TERCERO|SOLICITANTE|PETICIONANTE|EJECUTANTE|EJECUTAD[OA]|CONCURSAD[OA]|FALLID[OA]|DEUDORA?|ACREEDORA?)\s*:\s*/gi;
  const FUEROS_PENALES = ['CCC', 'CFP', 'CPE'];
  const OBJETO_PENAL = /\b(robo|hurto|estafa|defraudaci|homicidio|lesiones|amenazas|encubrimiento|tenencia|portaci|abuso|usurpaci|incendio|estupefacientes|infraccion(es)? ley|averiguaci[oó]n de delito|delito)\b/i;

  // "IMPUTADO" -> "Imputado", "VICTIMA" -> "Víctima"
  const nombreRol = (r) => {
    const x = limpio(r).toLowerCase();
    const y = x.charAt(0).toUpperCase() + x.slice(1);
    return y === 'Victima' ? 'Víctima' : y;
  };

  function partesDeCaratula(exp, car) {
    const t = limpio(car).replace(/\s+/g, ' ');
    if (!t) return [];
    // 1. Si la carátula trae los roles escritos, se usan tal cual.
    const marcas = [];
    ROL_CARATULA.lastIndex = 0;
    let m;
    while ((m = ROL_CARATULA.exec(t)) !== null) marcas.push({ rol: m[1], ini: m.index, fin: m.index + m[0].length });
    if (marcas.length) {
      const out = [];
      marcas.forEach((x, i) => {
        const hasta = i + 1 < marcas.length ? marcas[i + 1].ini : t.length;
        // El objeto empieza en " S/" y no es parte del nombre.
        const nombre = t.slice(x.fin, hasta).split(/\s+S\//i)[0].replace(/\s*[-–]\s*$/, '').trim();
        if (nombre) out.push({ rol: nombreRol(x.rol), nombre });
      });
      if (out.length) return out;
    }
    // 2. Si no, "ACTORA C/ DEMANDADA S/ OBJETO".
    const cortar = (s) => {
      const c = /\s+S\/\s*/i.exec(s);
      return c ? [s.slice(0, c.index).trim(), s.slice(c.index + c[0].length).trim()] : [s.trim(), ''];
    };
    const mc = /\s+(?:C\/|CONTRA)\s+/i.exec(t);
    if (mc) {
      const izq = t.slice(0, mc.index).trim();
      const der = cortar(t.slice(mc.index + mc[0].length));
      return [{ rol: 'Actora', nombre: izq }, { rol: 'Demandada', nombre: der[0] }].filter((x) => x.nombre);
    }
    // 3. Una sola parte: el rol se deduce del objeto y del fuero.
    const uno = cortar(t);
    if (!uno[0]) return [];
    const objeto = uno[1];
    const rol = /sucesi/i.test(objeto) ? 'Causante'
      : (OBJETO_PENAL.test(objeto) || FUEROS_PENALES.indexOf(fueroDe(exp)) >= 0) ? 'Imputado'
        : objeto ? 'Parte' : '';
    return [{ rol, nombre: uno[0] }];
  }

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

  // Texto de una celda sin los rótulos para lectores de pantalla. El PJN pone
  // el rótulo pegado al valor (<span class="sr-only">Fecha:</span><span>…</span>)
  // y con textContent quedaría "Fecha:16/12/2020".
  function textoVisible(el) {
    if (!el) return '';
    let t = '';
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) t += n.nodeValue;
      else if (n.nodeType === 1 && !(n.classList && n.classList.contains('sr-only'))) t += textoVisible(n);
    });
    return limpio(t);
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
      const exp = textoVisible(c[0]);
      if (!/\d+\/\d{4}/.test(exp)) return;
      const estrella = tr.querySelector('a.favorite i, i.fa-star, i.fa-star-o');
      const cls = estrella ? ' ' + estrella.className + ' ' : '';
      out.push({
        exp: clave(exp),
        dep: textoVisible(c[1]),
        car: textoVisible(c[2]),
        sit: textoVisible(c[3]),
        ult: fechaPareja(textoVisible(c[4])),
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
        // Solo si acerca al destino: pedida una página que ya no existe (la lista
        // se achicó), desde la última se volvía a la anterior y se rebotaba.
        if (destino > act ? extremo.n > act : extremo.n < act) a = extremo.a;
      }
      if (!a) return false;
      const f = firma(doc);
      a.click();
      if (!(await esperarCambio(doc, act, f, 20000, firma, tablaFn))) return false;
    }
    return paginaActiva(doc, tablaFn) === destino;
  }

  // El PJN trae la lista ordenada por carátula y tiene un control "Ordenar Lista
  // Por" con un "Ordenar" al lado. Pidiéndole FECHA, el sitio la devuelve por
  // última actuación, de la más nueva a la más vieja, y ahí sí desempata por hora
  // (la hora no la muestra, pero la usa). Copiar ese orden es la única forma de
  // ver lo mismo que el PJN.
  function selectorOrden(doc) {
    const sel = [...doc.querySelectorAll('select')].find((s) => !esNuestro(s) &&
      [...s.options].some((o) => /^fecha$/i.test(limpio(o.textContent)) || /^fecha$/i.test(limpio(o.value))));
    if (!sel) return null;
    const opt = [...sel.options].find((o) => /^fecha$/i.test(limpio(o.textContent)) || /^fecha$/i.test(limpio(o.value)));
    const boton = [...doc.querySelectorAll('a, input[type=submit], input[type=button], button')]
      .find((b) => !esNuestro(b) && /^ordenar$/i.test(limpio(b.value || b.textContent)));
    return { sel, opt, boton };
  }

  // Deja la lista del marco ordenada por fecha. Devuelve true si hizo falta pedirlo.
  // El PJN puede resolverlo de tres formas: enviando el formulario (ahí se repite
  // el pedido por fetch, como con las demás acciones), navegando la página, o por
  // ajax. Las tres se esperan igual: hasta que la lista sea otra.
  async function ordenarPorFecha(fr, avisar) {
    const o = selectorOrden(fr.contentDocument);
    if (!o || !o.boton) return false;
    const puesto = () => {
      const s = selectorOrden(fr.contentDocument);
      if (!s) return false;
      const op = s.sel.options[s.sel.selectedIndex];
      return !!op && /^fecha$/i.test(limpio(op.textContent) || limpio(op.value));
    };
    if (puesto()) return false;
    avisar('Le pido al PJN la lista ordenada por fecha...');
    // Ojo: al elegir FECHA en el desplegable, el propio control ya "queda puesto",
    // así que eso no sirve para saber si el PJN contestó. Lo que se espera es otro
    // documento (si navega) o otras filas (si lo resuelve por ajax).
    const doc0 = fr.contentDocument;
    const antes = firmaLista(doc0);
    o.sel.value = o.opt.value;
    try { o.sel.dispatchEvent(new fr.contentWindow.Event('change', { bubbles: true })); } catch (e) { /* no todos lo necesitan */ }
    permitirUpgrade(fr.contentDocument);
    const url = await postComoClic(fr, () => { o.boton.click(); });
    if (url) await esperarCarga(fr, () => { fr.src = url; }, esLista);
    else {
      await esperarA(() => {
        const d = fr.contentDocument;
        if (!d || !d.body) return false;
        if (d !== doc0) return d.readyState === 'complete' && esLista(d);
        return firmaLista(d) !== antes;
      }, 25000);
    }
    return true;
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
        // pos: el lugar que ocupa en la lista del PJN. Con la misma fecha, el PJN
        // ordena por la hora de la última actuación, que no muestra: copiar su orden
        // es la única forma de desempatar igual que él.
        out.push({ exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, fav: f.fav, pag, pos: out.length });
      });
      avisar('Leyendo ' + que + ': página ' + pag + ' (' + plural(out.length, 'causa', 'causas') + ')');
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
      // Primero, que el PJN la ordene por fecha: así el orden que se guarda es el
      // mismo que se ve en el sitio, con la hora adentro.
      try { await ordenarPorFecha(fr, avisar); } catch (e) { /* si no se puede, se lee igual */ }
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
        try { await ordenarPorFecha(fr, avisar); } catch (e) { /* si no se puede, se lee igual */ }
        todas = await recorrerLista(fr, L.nombre + ' fuera de trámite', avisar);
      }

      const deTramite = {};
      tramite.forEach((f) => { deTramite[f.exp] = f; });
      const causas = (todas || tramite).map((f) => ({
        exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult,
        // Dos lugares: el que ocupa en la lista completa del PJN y el que ocupa en
        // la de solo en trámite. Según lo que se esté mirando, se copia uno u otro.
        pos: todas ? f.pos : null,
        posTramite: deTramite[f.exp] ? deTramite[f.exp].pos : null,
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
          causas.push({ exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, pos: todas.length + f.pos, posTramite: f.pos, fav: tipo === 'fav' ? true : f.fav, tramite: true, pagTodas: null, pagTramite: f.pag });
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

  // El marco de trabajo lo usan la cola de descargas y las acciones de cada
  // causa. De a uno por vez: si no, uno suelta el marco que el otro está usando
  // y fallan los dos.
  let turnoMarco = Promise.resolve();
  function conMarco(fn) {
    const p = turnoMarco.then(() => fn());
    turnoMarco = p.catch(() => { /* el error lo maneja quien llamó */ });
    return p;
  }

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
  function direccionDe(k, accion, avisar) {
    return conMarco(async () => {
      const u = await ubicarCausa(k, avisar, accion === 'libro');
      const a = accion === 'libro' ? enlaceMenu(u.tr, /libro digital/i) : enlaceOjo(u.tr);
      if (!a) throw new Error(accion === 'libro' ? 'la fila de ' + k + ' no tiene "Libro digital"' : 'la fila de ' + k + ' no tiene el enlace para ver el expediente');
      avisar((accion === 'libro' ? 'Pido el libro digital de ' : 'Abro ') + k + '...');
      let url;
      try {
        url = await postAccion(u.fr, a);
      } catch (e) {
        // La vista del marco pudo vencer en el servidor: el próximo pedido arranca de cero.
        soltarMarcoTrabajo();
        throw e;
      }
      let x = null;
      try { x = new URL(url); } catch (e) { x = null; }
      const ok = x && x.origin === location.origin && x.searchParams.get('cid') &&
        (accion === 'libro' ? /libroDigital/i.test(x.pathname) : /expediente\.seam$/i.test(x.pathname));
      if (!ok) {
        soltarMarcoTrabajo();
        throw new Error('el PJN no abrió ' + k + ' (si la sesión venció, recargá la página)');
      }
      return x.href;
    });
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

  // Por las dudas de que el rótulo no venga como sr-only, también se lo saca
  // del principio del texto si aparece.
  const sinRotulo = (td, re) => textoVisible(td).replace(re, '').trim();

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
          oficina: sinRotulo(c[1], /^oficina\s*:\s*/i),
          fecha: fechaPareja(sinRotulo(c[2], /^fecha\s*:\s*/i)),
          tipo: sinRotulo(c[3], /^tipo(\s+de)?\s+actuaci[oó]n\s*:\s*/i),
          detalle: sinRotulo(c[4], /^(descripci[oó]n\s*\/\s*)?detalle\s*:\s*/i),
          fojas: c[5] ? sinRotulo(c[5], /^a\s*fs\.?\s*:\s*/i) : '',
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

  // ------------------------------------- las otras solapas del expediente
  //
  // Intervinientes, Vinculados y Recursos vienen vacías en el HTML: el PJN las
  // llena recién cuando se las toca, y al tocarlas recarga el expediente con
  // otro número de consulta. Se las toca en un marco oculto, sin mover la página
  // que se está mirando. Las solapas se reconocen por su texto, no por su id,
  // porque los ids que arma JSF cambian.

  const SOLAPAS_EXP = { int: 'Intervinientes', vin: 'Vinculados', rec: 'Recursos' };

  function cabezaSolapa(doc, etiqueta) {
    const tds = [...doc.querySelectorAll('td[id*=":header:"]')].filter((td) => norm(textoVisible(td)) === norm(etiqueta));
    return tds.find((td) => td.offsetParent) || tds.find((td) => /:header:inactive$/.test(td.id)) || tds[0] || null;
  }
  const panelDeSolapa = (doc, td) => (td ? doc.getElementById(td.id.replace(/:header:(active|inactive|disabled)$/, '')) : null);
  const panelVivo = (fr, etiqueta) => {
    const d = fr.contentDocument;
    return panelDeSolapa(d, cabezaSolapa(d, etiqueta));
  };
  const firmaPanel = (p) => (p ? filasTabla(p.querySelector('table')).map((tr) => limpio(tr.textContent).slice(0, 50)).join('|') + '#' + paginaActiva(p) : '');
  // El PJN repite el rótulo en el encabezado ("TOMO/FOLIO :TOMO/FOLIO").
  const cabezaLimpia = (s) => { const m = /^(.*?)\s*:\s*\1$/.exec(limpio(s)); return m ? m[1] : limpio(s); };

  // Hace el clic y, si el PJN contesta enviando el formulario (que es lo que hace
  // RichFaces al cambiar de solapa), en vez de dejar navegar al marco se manda el
  // mismo pedido por fetch. Así se sigue la redirección del PJN, que va a http://
  // y de otro modo el navegador la corta por contenido mixto. Si el cambio fue por
  // ajax, no hay envío y se devuelve null.
  async function postComoClic(fr, disparar) {
    const d = fr.contentDocument, w = fr.contentWindow;
    permitirUpgrade(d);
    const form = d.getElementById('expediente') || d.forms[0];
    if (!form) throw new Error('no encuentro el formulario del expediente');
    let cuerpo = null;
    const propio = Object.prototype.hasOwnProperty.call(form, 'submit');
    const antes = form.submit;
    form.submit = function () {
      cuerpo = new w.URLSearchParams();
      new w.FormData(form).forEach((v, k) => { if (typeof v === 'string') cuerpo.append(k, v); });
    };
    try { disparar(); } finally {
      if (propio) form.submit = antes; else { try { delete form.submit; } catch (e) { form.submit = antes; } }
    }
    if (!cuerpo) return null;
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

  async function abrirSolapa(fr, etiqueta) {
    let td = cabezaSolapa(fr.contentDocument, etiqueta);
    if (!td) throw new Error('el expediente no tiene la solapa ' + etiqueta);
    if (/:header:inactive$/.test(td.id)) {
      const base = td.id.replace(/:header:inactive$/, '');
      const lleno = (dd) => {
        const p = dd.getElementById(base) || panelDeSolapa(dd, cabezaSolapa(dd, etiqueta));
        return !!(p && (p.querySelector('table') || limpio(p.textContent)));
      };
      const url = await postComoClic(fr, () => { td.click(); });
      if (url) await esperarCarga(fr, () => { fr.src = url; }, (dd) => lleno(dd) || esExpediente(dd));
      else if (!(await esperarA(() => lleno(fr.contentDocument), 20000))) throw new Error('el PJN no abrió ' + etiqueta);
      td = cabezaSolapa(fr.contentDocument, etiqueta) || td;
    }
    const p = panelDeSolapa(fr.contentDocument, td);
    if (!p) throw new Error('el PJN no abrió ' + etiqueta);
    return p;
  }

  // Lee una solapa entera, recorriendo su paginador propio.
  async function leerSolapaExp(cid, clave, avisar) {
    const etiqueta = SOLAPAS_EXP[clave];
    const fr = crearMarco();
    try {
      avisar('Abro el expediente en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      avisar('Pido ' + etiqueta + ' al PJN...');
      let p = await abrirSolapa(fr, etiqueta);
      const cabs = [];
      const filas = [];
      const vistos = {};
      for (let v = 0; v < 300; v++) {
        p = panelVivo(fr, etiqueta) || p;
        const t = p.querySelector('table');
        if (!t) break;
        if (!cabs.length) {
          const cab = (t.tHead && t.tHead.rows[0]) || t.rows[0];
          if (cab) [...cab.cells].forEach((c) => cabs.push(cabezaLimpia(textoVisible(c))));
        }
        filasTabla(t).forEach((tr) => {
          const c = [...tr.cells].map((x) => textoVisible(x));
          const k = c.join('|');
          if (!limpio(k.replace(/\|/g, ' ')) || vistos[k]) return;
          vistos[k] = true;
          filas.push(c);
        });
        avisar('Leyendo ' + etiqueta + ': ' + plural(filas.length, 'fila', 'filas'));
        const sig = enlaceSiguiente(p);
        if (!sig) break;
        const antes = firmaPanel(p);
        sig.click();
        if (!(await esperarA(() => firmaPanel(panelVivo(fr, etiqueta)) !== antes, 20000))) break;
      }
      return { cabs, filas };
    } finally {
      fr.remove();
    }
  }

  // Abre una causa vinculada: se vuelve a pedir la solapa y se usa el ojo de su fila.
  async function direccionVinculado(cid, exp, avisar) {
    const fr = crearMarco();
    try {
      avisar('Busco ' + exp + ' entre los vinculados...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      let p = await abrirSolapa(fr, SOLAPAS_EXP.vin);
      for (let v = 0; v < 300; v++) {
        p = panelVivo(fr, SOLAPAS_EXP.vin) || p;
        const t = p.querySelector('table');
        if (!t) break;
        const tr = filasTabla(t).find((x) => x.cells[0] && clave(textoVisible(x.cells[0])) === clave(exp));
        if (tr) {
          const a = enlaceOjo(tr);
          if (!a) throw new Error('la fila de ' + exp + ' no tiene el enlace para ver el expediente');
          avisar('Abro ' + exp + '...');
          const url = await postAccion(fr, a);
          let x = null;
          try { x = new URL(url); } catch (e) { x = null; }
          if (!x || x.origin !== location.origin || !x.searchParams.get('cid') || !/expediente\.seam$/i.test(x.pathname)) {
            throw new Error('el PJN no abrió ' + exp + ' (si la sesión venció, recargá la página)');
          }
          return x.href;
        }
        const sig = enlaceSiguiente(p);
        if (!sig) break;
        const antes = firmaPanel(p);
        sig.click();
        if (!(await esperarA(() => firmaPanel(panelVivo(fr, SOLAPAS_EXP.vin)) !== antes, 20000))) break;
      }
      throw new Error('no encuentro ' + exp + ' entre los vinculados');
    } finally {
      fr.remove();
    }
  }

  // La última actuación con PDF de una causa, sin leer el expediente entero: el
  // PJN las trae de la más nueva a la más vieja, así que alcanza la primera página.
  async function ultimaActuacionConPDF(k, avisar) {
    const url = await direccionDe(k, 'ojo', avisar);
    const cid = new URL(url).searchParams.get('cid');
    const fr = crearMarco();
    try {
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      return actuacionesDe(fr.contentDocument, false)[0] || null;
    } finally {
      fr.remove();
    }
  }

  const nombreArchivo = (exp) => 'Expediente-' + (clave(exp).replace(/[\s/]+/g, '-') || 'PJN');

  // ---------------------------------------------------------------- los PDF

  // Un PDF empieza con "%PDF-" (a veces con algunos bytes antes).
  function esPDF(buf) {
    if (!buf || !buf.byteLength) return false;
    const b = new Uint8Array(buf, 0, Math.min(buf.byteLength, 1024));
    for (let i = 0; i + 4 < b.length; i++) {
      if (b[i] === 0x25 && b[i + 1] === 0x50 && b[i + 2] === 0x44 && b[i + 3] === 0x46 && b[i + 4] === 0x2d) return true;
    }
    return false;
  }

  // La hora no está en el HTML del PJN, pero sí en el documento: las resoluciones
  // y los escritos van firmados digitalmente y la firma lleva fecha y hora
  // (/M (D:AAAAMMDDHHmmSS)). Si no hay firma, se prueba con la fecha de
  // modificación y con la de creación del archivo.
  function horaDePDF(buf) {
    let s = '';
    try {
      const b = new Uint8Array(buf);
      const trozo = b.length > 6000000 ? b.subarray(0, 6000000) : b;
      let t = '';
      for (let i = 0; i < trozo.length; i += 65536) t += String.fromCharCode.apply(null, trozo.subarray(i, Math.min(i + 65536, trozo.length)));
      s = t;
    } catch (e) { return null; }
    const halladas = { M: [], ModDate: [], CreationDate: [] };
    const re = /\/(M|ModDate|CreationDate)\s*\(\s*D:(\d{14})/g;
    let m;
    while ((m = re.exec(s)) !== null) halladas[m[1]].push(m[2]);
    // De las firmas, la más nueva: es la última vez que se firmó el documento.
    const v = (halladas.M.length ? halladas.M.sort().pop()
      : halladas.ModDate.length ? halladas.ModDate.sort().pop()
        : halladas.CreationDate.length ? halladas.CreationDate.sort().pop() : '') || '';
    if (!/^\d{14}$/.test(v)) return null;
    return {
      f: v.slice(6, 8) + '/' + v.slice(4, 6) + '/' + v.slice(0, 4),
      hh: v.slice(8, 10) + ':' + v.slice(10, 12),
      origen: halladas.M.length ? 'la firma del documento' : 'la fecha del archivo'
    };
  }

  // ¿Venció la sesión del PJN? Se pide la lista: si el PJN manda al ingreso
  // (que es otro sitio) el navegador corta el pedido, y si devuelve la página
  // de usuario y clave, también venció. Se recuerda medio minuto para no
  // preguntar por cada actuación.
  let sesionMirada = { ts: 0, vencida: false };
  async function sesionVencida() {
    if (Date.now() - sesionMirada.ts < 30000) return sesionMirada.vencida;
    let vencida;
    try {
      const r = await fetch(RUTA.rel, { credentials: 'include' });
      const t = await r.text();
      vencida = new URL(r.url).host !== location.host || /type=["']?password/i.test(t);
    } catch (e) {
      // Sin conexión no se puede saber; con conexión, el corte es la redirección al ingreso.
      vencida = window.navigator.onLine !== false;
    }
    sesionMirada = { ts: Date.now(), vencida };
    return vencida;
  }

  // Trae una actuación. Devuelve { buf } si llegó un PDF, { vencida: true } si
  // la sesión del PJN venció, y null si no hay PDF (actuación sin PDF real).
  async function traerPDF(u) {
    for (let i = 0; i < 2; i++) {
      let r;
      try {
        r = await fetch(u, { credentials: 'include' });
      } catch (e) {
        if (await sesionVencida()) return { vencida: true };
        await dormir(600);
        continue;
      }
      if (r.ok) {
        const tipo = (r.headers.get('content-type') || '').toLowerCase();
        let buf;
        try { buf = await r.arrayBuffer(); } catch (e) { buf = null; }
        if (esPDF(buf)) return { buf };
        // Llegó una página en vez del PDF: puede ser el ingreso del PJN.
        if (/html/.test(tipo) && (await sesionVencida())) return { vencida: true };
        return null;
      }
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
      const res = await traerPDF(urls[i]);
      if (res && res.vencida) throw new Error(VENCIDA);
      if (!res) { fallas++; continue; }
      const buf = res.buf;
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
  // De a cinco causas y un respiro entre bloque y bloque: bajar cincuenta
  // expedientes seguidos es maltratar al PJN y dejar la app ocupada horas.
  let hechasSeguidas = 0;
  let pausaHasta = 0;
  const saltarPausa = () => { pausaHasta = 0; pintarDescargas(); };

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
        // Respiro entre bloques, salvo que se corte o se pida seguir ahora.
        if (hechasSeguidas >= BLOQUE_DESCARGAS) {
          hechasSeguidas = 0;
          pausaHasta = Date.now() + PAUSA_BLOQUE;
          pintarDescargas();
          while (pausaHasta && Date.now() < pausaHasta && !cortarCola) await dormir(500);
          pausaHasta = 0;
          pintarDescargas();
        }
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
          t.archivo = (t.nombre || nombreArchivo(t.exp) + (t.parcial ? '-seleccion' : '')) + '.pdf';
          guardarArchivo(r.bytes, t.archivo);
          t.estado = 'listo';
          hechasSeguidas++;
          textoTrabajo(t, 'Listo: ' + t.archivo + ', ' + plural(r.ok, 'documento', 'documentos') + (r.fallas ? '; ' + r.fallas + ' sin PDF real' : '') + '.', 1);
        } catch (e) {
          const msg = String(e && e.message ? e.message : e);
          if (msg === 'cortado') {
            COLA.forEach((x) => { if (/en cola|abriendo|leyendo|bajando|a bajar/.test(x.estado)) { x.estado = 'cortado'; x.texto = 'Cortado por vos.'; } });
          } else {
            t.estado = 'error';
            t.texto = 'No se pudo: ' + mensajeDe(e) + '.';
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
      out.push({ fila: f, lapiz: a, expediente: clave(f.cells[0] ? textoVisible(f.cells[0]) : '') });
    }
    return out;
  }

  // Primero por id, que es el del PJN; el texto del botón queda de respaldo. El
  // documento es de esta página, o el de un marco oculto cuando se revisa el PJN.
  const primeroDe = (doc, ...sels) => {
    for (const s of sels) {
      const b = [...(doc || document).querySelectorAll(s)].find((x) => !esNuestro(x));
      if (b) return b;
    }
    return null;
  };
  const botonFiltroNota = (doc) => primeroDe(doc, 'input[id$="consultaFiltroSearchDejarNota"]', 'input[value="Dejar nota"]');
  const botonConfirmar = (doc) => primeroDe(doc, 'input[id$=":dejarNotaForm:botonAceptar"]', 'input[value="Confirmar"]');
  const cartelNota = (doc) => primeroDe(doc, 'div[id$=":dejarNotaPopupID:dejarNotaPopup"]', 'div[id$="dejarNotaPopup"]');

  // El botón Confirmar existe siempre: hay que mirar el cartel mismo.
  function popupAbierto() {
    const p = cartelNota(document);
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
    // Una última mirada al vencer el plazo.
    try { return !!condicion(); } catch (e) { return false; }
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

  // Una tanda guardada con forma rara (dañada o de otra versión) no se usa: el
  // motor que deja notas no puede arrancar con datos a medias.
  const listaDeTextos = (x) => Array.isArray(x) && x.every((e) => typeof e === 'string');
  const leerCorrida = () => {
    const c = leerSesion(S_CORRIDA);
    if (!c || typeof c !== 'object' || !listaDeTextos(c.hechos) || !listaDeTextos(c.problemas) ||
      (c.solo != null && !listaDeTextos(c.solo)) || (c.dudas != null && !listaDeTextos(c.dudas)) ||
      (c.enCurso != null && typeof c.enCurso !== 'string')) return null;
    return c;
  };
  // Al guardar una copia vieja no se pierde un "cortar" pedido mientras tanto.
  const guardarCorrida = (c) => {
    const actual = leerSesion(S_CORRIDA);
    if (actual && actual.cortar && actual.id === c.id) c.cortar = true;
    guardarSesion(S_CORRIDA, c);
  };
  const corridaActiva = () => { const c = leerCorrida(); return !!(c && c.activa); };

  // ----- turno entre pestañas
  //
  // La tanda vive en sessionStorage, y Chrome lo copia al duplicar una pestaña
  // o al restaurar una cerrada: sin control, dos pestañas dejarían la misma
  // nota dos veces. Por eso hay un turno en localStorage (compartido entre las
  // pestañas) con una ficha que cambia en cada paso. Una pestaña sigue solo si
  // su ficha es la del turno; justo antes de confirmar lo vuelve a mirar. Un
  // turno sin movimiento hace más de TURNO_VENCE no se retoma.
  const K_TURNO = 'supjn_nota_turno';
  const TURNO_VENCE = 3 * 60 * 1000;
  const leerTurno = () => {
    let t;
    try { t = JSON.parse(localStorage.getItem(K_TURNO) || 'null'); } catch (e) { return null; }
    if (!t || typeof t.corrida !== 'string' || typeof t.token !== 'string' || typeof t.ts !== 'number') return null;
    if (!listaDeTextos(t.hechos)) t.hechos = [];
    return t;
  };
  // El turno lleva también el avance (hechas y la que está en curso): si una
  // copia vieja de la tanda gana el turno, no repite lo que hizo la otra.
  const escribirTurno = (c) => {
    try { localStorage.setItem(K_TURNO, JSON.stringify({ corrida: c.id, token: c.token, ts: Date.now(), hechos: c.hechos, enCurso: c.enCurso || null, confirmado: !!c.confirmado })); } catch (e) { /* sin almacén */ }
  };
  const soltarTurno = (c) => {
    const t = leerTurno();
    if (t && c && t.corrida === c.id) { try { localStorage.removeItem(K_TURNO); } catch (e) { /* sin almacén */ } }
  };
  const ficha = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const esMiTurno = (c, t) => !!(t && t.corrida === c.id && t.token === c.token);
  const otraTandaViva = () => { const t = leerTurno(); return !!(t && Date.now() - t.ts < TURNO_VENCE); };

  // solo: null deja nota en todas las habilitadas; si no, las claves elegidas.
  function nuevaCorrida(solo) {
    return {
      id: ficha(),
      token: ficha(),
      activa: true,
      solo: solo || null,
      hechos: [],
      problemas: [],
      dudas: [],          // confirmadas sin respuesta clara del PJN: "a verificar"
      pausa: Math.max(300, parseInt(CFG.pausaNota, 10) || 700),
      enCurso: null,
      pagina: 0,
      inicio: Date.now()
    };
  }

  // Cada resultado se guarda apenas se conoce: si la pestaña se cierra a mitad
  // de la tanda, queda registrado lo que ya se hizo.
  function anotarResultado(e, ok, m) {
    refrescarNotas();
    NOTAS[e] = { f: hoyISO(), t: Date.now(), ok, m: m || '' };
    guardarAlmacen(K_NOTAS, NOTAS);
  }

  // Esta pestaña deja de manejar la tanda (la sigue otra). No escribe resultados.
  function perderTurno(motivo) {
    borrarSesion(S_CORRIDA);
    notaEnCurso = false;
    abortarNota = false;
    avisar(motivo + (popupAbierto() ? ' Quedó abierto el cartel del PJN: cerralo con Cancelar.' : ''), true);
    pintarNota();
    pintarTodo();
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
    if (!c.dudas) c.dudas = [];

    // 0. Turno: ¿esta pestaña es la que maneja la tanda?
    if (!c.id || !c.token) { c.id = c.id || ficha(); c.token = c.token || ficha(); guardarCorrida(c); escribirTurno(c); }
    const turno = leerTurno();
    const fresco = !!(turno && Date.now() - turno.ts < TURNO_VENCE);
    if (!turno || turno.corrida !== c.id) {
      // El turno es de otra tanda, o ya no hay turno (la tanda terminó en otra
      // pestaña): esta copia es vieja y no escribe resultados.
      perderTurno(fresco
        ? 'Esta pestaña no retoma la tanda: hay otra tanda de dejar nota en curso en otra pestaña del PJN.'
        : 'Había una tanda de dejar nota vieja en esta pestaña: no se retoma.');
      return;
    }
    if (!esMiTurno(c, turno)) {
      perderTurno(fresco
        ? 'Esta pestaña dejó de dejar nota: la tanda sigue en otra pestaña del PJN.'
        : 'Había una tanda de dejar nota vieja en esta pestaña: no se retoma.');
      return;
    }
    // Si se apretó el lápiz pero no se llegó a confirmar, esa nota no se dejó:
    // se vuelve a intentar como cualquier otra pendiente.
    if (c.enCurso && !c.confirmado) { c.enCurso = null; guardarCorrida(c); }
    if (!fresco) {
      // Es esta tanda, pero parada hace rato (pestaña restaurada, navegador que
      // se cerró): se cierra con lo que se llegó a hacer y no sigue sola.
      if (c.enCurso) {
        c.problemas.push(c.enCurso + ': no se llegó a ver la respuesta del PJN');
        c.dudas.push(c.enCurso);
        if (c.hechos.indexOf(c.enCurso) < 0) c.hechos.push(c.enCurso);
        c.enCurso = null;
      }
      terminarNota(c, 'La tanda estaba parada hace más de 3 minutos y no se retomó sola.');
      return;
    }
    // Lo que hizo otra copia de esta tanda (pestaña duplicada) se suma acá. Si
    // esa copia confirmó una nota que esta no llegó a ver, queda a verificar y
    // no se repite.
    (turno.hechos || []).forEach((e) => { if (c.hechos.indexOf(e) < 0) c.hechos.push(e); });
    if (turno.enCurso && turno.confirmado && turno.enCurso !== c.enCurso && c.hechos.indexOf(turno.enCurso) < 0) {
      const e = turno.enCurso;
      c.problemas.push(e + ': se confirmó desde otra pestaña');
      c.dudas.push(e);
      c.hechos.push(e);
      anotarResultado(e, null, 'se confirmó desde otra pestaña');
    }
    c.token = ficha();
    guardarCorrida(c);
    escribirTurno(c);

    notaEnCurso = true;
    pintarNota();
    if (VISTA === 'nota' && !q('[data-e="notaTxtPanel"]')) pintarTodo();

    const enRel = EN_LISTA && tipoLista(document) === 'rel';

    // 1. Si volvimos de confirmar, leer cómo salió la anterior.
    if (c.enCurso) {
      const e = c.enCurso;
      if (enRel) {
        await esperarA(() => !!mensajePJN(), 6000);
        const m = mensajePJN();
        if (m && m.ok && mismoExpediente(e, m.expediente)) {
          anotarResultado(e, true, '');
        } else if (m && !m.ok) {
          c.problemas.push(e + ': ' + m.texto.slice(0, 70));
          anotarResultado(e, false, m.texto.slice(0, 70));
        } else {
          // Sin respuesta clara: la nota pudo haberse dejado. Queda para verificar.
          const t = m && m.ok ? 'el PJN contestó por ' + m.expediente : 'sin respuesta visible del PJN';
          c.problemas.push(e + ': ' + t);
          c.dudas.push(e);
          anotarResultado(e, null, t);
        }
      } else if (abortarNota || c.cortar) {
        c.problemas.push(e + ': no se llegó a ver la respuesta del PJN');
        c.dudas.push(e);
        anotarResultado(e, null, 'no se llegó a ver la respuesta del PJN');
      } else {
        pausarNota();
        return;
      }
      if (c.hechos.indexOf(e) < 0) c.hechos.push(e);
      c.enCurso = null;
      c.confirmado = false;
      guardarCorrida(c);
      pintarSolapas();
      estadoNota('Van ' + progresoNota(c) + '...');
    }

    if (abortarNota || c.cortar) { terminarNota(c, 'Cortado por vos.'); return; }
    if (!quedanElegidos(c)) { terminarNota(c, null); return; }

    // 1 bis. La tanda solo avanza sobre la lista de Relacionados del PJN.
    if (!enRel) { pausarNota(); return; }

    // 1 ter. Si la recarga nos devolvió a la primera página, volver a la que iba.
    if ((c.pagina || 0) !== paginaActualNota()) {
      estadoNota('Vuelvo a la página ' + ((c.pagina || 0) + 1) + '...');
      const ok = await irAPaginaNota(c.pagina || 0);
      if (!ok) { c.pagina = paginaActualNota(); guardarCorrida(c); }
    }

    // 2. Si la recarga se llevó el filtro, volver a ponerlo.
    if (!filasConLapiz().length) {
      const f = botonFiltroNota(document);
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
        const act = paginaActualNota();
        // Si el paginado no avanza, no se da vueltas para siempre.
        if (c.ultimaPagina === act) c.vueltasPagina = (c.vueltasPagina || 0) + 1;
        else { c.ultimaPagina = act; c.vueltasPagina = 0; }
        if (c.vueltasPagina >= 3) { terminarNota(c, 'El paginado del PJN no responde.'); return; }
        estadoNota('Página ' + (act + 1) + ' lista. Paso a la siguiente...');
        c.pagina = act + 1;
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
    c.confirmado = false;
    guardarCorrida(c);

    const delLapiz = esperarAjax(20000);
    prox.lapiz.click();
    await delLapiz;

    const hayCartel = await esperarA(popupAbierto, 15000);
    if (!hayCartel) {
      c.problemas.push(prox.expediente + ': el cartel no llegó a abrirse');
      anotarResultado(prox.expediente, false, 'el cartel no llegó a abrirse');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      c.fallosCartel = (c.fallosCartel || 0) + 1;
      guardarCorrida(c);
      if (c.fallosCartel >= 3) { terminarNota(c, 'El cartel de confirmación del PJN no se abre.'); return; }
      // Se sigue desde una carga limpia: una respuesta atrasada del lápiz no
      // puede abrir el cartel de otra causa.
      estadoNota('El cartel no se abrió para ' + prox.expediente + '. Recargo la lista y sigo...');
      location.href = RUTA.rel;
      return;
    }
    c.fallosCartel = 0;

    await dormir(350);
    const b = botonConfirmar(document);
    if (!b) {
      c.problemas.push(prox.expediente + ': no encuentro el botón Confirmar');
      anotarResultado(prox.expediente, false, 'no encuentro el botón Confirmar');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      guardarCorrida(c);
      terminarNota(c, 'No encuentro el botón Confirmar del cartel del PJN.');
      return;
    }

    await dormir(c.pausa || 700);
    const c2 = leerCorrida();
    if (abortarNota || (c2 && c2.cortar)) { c.enCurso = null; guardarCorrida(c); terminarNota(c, 'Cortado por vos.'); return; }
    // Justo antes de confirmar: el turno tiene que seguir siendo de esta pestaña.
    if (!esMiTurno(c, leerTurno())) { perderTurno('Esta pestaña dejó de dejar nota: la tanda sigue en otra pestaña del PJN.'); return; }
    c.confirmado = true;
    guardarCorrida(c);
    escribirTurno(c);
    const exp = prox.expediente;
    b.click();
    // A partir de acá la página se recarga y el arranque retoma. Si en un minuto
    // no se recargó, se cierra la tanda y esa causa queda para verificar.
    setTimeout(() => {
      const c3 = leerCorrida();
      if (!c3 || !c3.activa || c3.enCurso !== exp) return;
      if (!c3.dudas) c3.dudas = [];
      c3.problemas.push(exp + ': la página del PJN no se recargó después de confirmar');
      c3.dudas.push(exp);
      if (c3.hechos.indexOf(exp) < 0) c3.hechos.push(exp);
      c3.enCurso = null;
      anotarResultado(exp, null, 'la página del PJN no se recargó después de confirmar');
      guardarCorrida(c3);
      terminarNota(c3, 'La página del PJN no se recargó después de confirmar.');
    }, 60000);
  }

  // La tanda queda en pausa (sigue activa) mientras no se esté en Relacionados.
  function pausarNota() {
    notaEnCurso = false;
    estadoNota('En pausa: esta página no es la lista de Relacionados del PJN. Volvé a Relacionados para seguir, o cortá la tanda.');
    pintarNota();
    if (VISTA === 'nota') pintarTodo();
  }

  function terminarNota(c, motivo) {
    const dudas = c.dudas || [];
    const malos = {};
    c.problemas.forEach((p) => { const i = p.indexOf(': '); malos[p.slice(0, i)] = p.slice(i + 2); });
    // Las elegidas que no aparecieron con lápiz en ninguna página. Si se cortó a
    // mano no se cuentan: no se llegó a ellas.
    const noVistas = (c.solo && !motivo) ? c.solo.filter((e) => c.hechos.indexOf(e) < 0) : [];
    const hoy = hoyISO();
    const ahora = Date.now();
    refrescarNotas();
    c.hechos.forEach((e) => {
      // Lo anotado durante esta tanda (acá o en otra pestaña) ya es el resultado.
      const ya = NOTAS[e];
      if (ya && ya.t && ya.t >= (c.inicio || 0)) return;
      NOTAS[e] = { f: hoy, t: ahora, ok: dudas.indexOf(e) >= 0 ? null : !malos[e], m: malos[e] || '' };
    });
    noVistas.forEach((e) => { NOTAS[e] = { f: hoy, t: ahora, ok: false, m: 'no apareció con lápiz en la lista del PJN' }; });
    guardarAlmacen(K_NOTAS, NOTAS);
    borrarSesion(S_CORRIDA);
    soltarTurno(c);
    notaEnCurso = false;
    abortarNota = false;
    // El resumen sale de lo guardado, que es lo que se ve en la tabla.
    const res = (e) => NOTAS[e] || { ok: false, m: '' };
    const detalle = (e) => e + (res(e).m ? ': ' + res(e).m : '');
    const ok = c.hechos.filter((e) => res(e).ok === true).length;
    const aVerificar = c.hechos.filter((e) => res(e).ok === null);
    const fallas = c.hechos.filter((e) => res(e).ok === false).concat(noVistas);
    avisar((motivo ? motivo + ' ' : '') + 'Terminado: ' + plural(ok, 'nota dejada', 'notas dejadas') +
      (aVerificar.length ? '. A verificar en el expediente ' + aVerificar.length + ': ' + aVerificar.map(detalle).join(' | ') : '') +
      (fallas.length ? '. No salieron ' + fallas.length + ': ' + fallas.map(detalle).join(' | ') : '') + '.' +
      (popupAbierto() ? ' Quedó abierto el cartel del PJN: cerralo con Cancelar.' : ''), !!(fallas.length || aVerificar.length));
    pintarNota();
    pintarTodo();
  }

  // Arranca una tanda. Siempre desde una carga limpia de Relacionados, para que
  // ningún filtro del PJN esconda causas.
  function iniciarNota(solo) {
    if (notaEnCurso || corridaActiva()) return;
    if (solo && !solo.length) { avisar('No hay ninguna causa seleccionada.', true); return; }
    // Con la lista leída y vacía no hay dónde dejar nota: no vale la pena tocar
    // el filtro del PJN ni recargar la página.
    if (!solo && DATOS.rel && !DATOS.rel.total) { avisar('No hay causas en Mis causas: no hay dónde dejar nota. Actualizá la lista y probá de nuevo.', true); return; }
    // La tanda recarga la página en cada nota: con descargas en curso se cortarían.
    if (bajandoAlgo()) { avisar('Hay descargas en curso: esperá a que terminen, o cortalas, antes de dejar nota.', true); return; }
    if (otraTandaViva()) { avisar('Hay una tanda de dejar nota en curso en otra pestaña del PJN.', true); return; }
    guardarSesion(S_ENCARGO, { tipo: 'nota', solo: solo || null, ts: Date.now() });
    avisar('Voy a la lista de Relacionados del PJN para dejar nota...');
    location.href = RUTA.rel;
  }

  function arrancarNotaDesdeEncargo(enc) {
    if (tipoLista(document) !== 'rel' || (!botonConfirmar(document) && !botonFiltroNota(document))) {
      avisar('La lista de Relacionados del PJN no tiene la función de dejar nota en este momento.', true);
      return;
    }
    if (otraTandaViva()) { avisar('No empiezo: hay una tanda de dejar nota en curso en otra pestaña del PJN.', true); return; }
    abortarNota = false;
    const c = nuevaCorrida(enc.solo);
    guardarCorrida(c);
    escribirTurno(c);
    pasoNota();
  }

  // Cortar no borra la tanda: la marca, para que la próxima carga la cierre con
  // el resultado de lo que se llegó a hacer.
  function cortarNota() {
    abortarNota = true;
    const c = leerCorrida();
    if (c) { c.cortar = true; guardarSesion(S_CORRIDA, c); }
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

  // Lo guardado se revisa pieza por pieza: una etiqueta o una fila con forma
  // rara se descarta en vez de romper la ventana.
  const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  function normalizarMarcas(m) {
    const out = { etiquetas: [], filas: {} };
    if (!esObjeto(m)) return out;
    (Array.isArray(m.etiquetas) ? m.etiquetas : []).forEach((e) => {
      if (esObjeto(e) && typeof e.id === 'string' && e.id && typeof e.nom === 'string' && e.nom.trim()) {
        out.etiquetas.push({ id: e.id, nom: e.nom.slice(0, 28), color: typeof e.color === 'string' ? e.color : COLORES[0].id });
      }
    });
    if (esObjeto(m.filas)) {
      Object.keys(m.filas).forEach((k) => {
        const f = m.filas[k];
        if (!esObjeto(f)) return;
        const et = Array.isArray(f.et) ? f.et.filter((x) => typeof x === 'string') : [];
        const nota = typeof f.nota === 'string' ? f.nota : '';
        if (et.length || nota.trim()) out.filas[k] = { et, nota };
      });
    }
    return out;
  }

  let MARCAS = normalizarMarcas(leerAlmacen(K_MARCAS, null));
  let RESPALDO = leerAlmacen(K_RESPALDO, null);
  // Con dos pestañas abiertas cada una tiene su copia en memoria. Antes de
  // cambiar algo se vuelve a leer lo guardado: si no, la última pestaña que
  // guarda borra lo que anotó la otra.
  const refrescarMarcas = () => { MARCAS = normalizarMarcas(leerAlmacen(K_MARCAS, null)); RESPALDO = leerAlmacen(K_RESPALDO, null); };

  const guardarMarcas = () => {
    if (!guardarAlmacen(K_MARCAS, MARCAS)) avisar('No se pudieron guardar las etiquetas y los apuntes.', true);
  };
  const marcaDe = (k) => MARCAS.filas[k] || { et: [], nota: '' };
  const etiquetaDe = (id) => MARCAS.etiquetas.find((e) => e.id === id);
  const etiquetasDe = (k) => (marcaDe(k).et || []).map(etiquetaDe).filter(Boolean);

  function fijarMarca(k, cambio) {
    refrescarMarcas();
    const m = Object.assign({ et: [], nota: '' }, MARCAS.filas[k] || {}, cambio);
    if (!m.et.length && !String(m.nota || '').trim()) delete MARCAS.filas[k];
    else MARCAS.filas[k] = { et: m.et, nota: m.nota };
    guardarMarcas();
  }

  function alternarEtiqueta(k, id) {
    refrescarMarcas();
    const et = (marcaDe(k).et || []).slice();
    const i = et.indexOf(id);
    if (i >= 0) et.splice(i, 1); else et.push(id);
    fijarMarca(k, { et });
  }

  function crearEtiqueta(nombre, color) {
    nombre = limpio(nombre).slice(0, 28);
    if (!nombre) return null;
    refrescarMarcas();
    const ya = MARCAS.etiquetas.find((e) => norm(e.nom) === norm(nombre));
    if (ya) return ya.id;
    const id = 'et' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    MARCAS.etiquetas.push({ id, nom: nombre, color: color || COLORES[0].id });
    guardarMarcas();
    return id;
  }

  function borrarEtiqueta(id) {
    refrescarMarcas();
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
    refrescarMarcas();
    refrescarNotas();
    guardarArchivo(JSON.stringify({
      formato: 'supjn+/marcas', version: 2, fecha: new Date().toISOString(),
      etiquetas: MARCAS.etiquetas, filas: MARCAS.filas, notas: NOTAS
    }, null, 1), 'SuPJN+-etiquetas-' + selloArchivo() + '.json', 'application/json');
    RESPALDO = { fecha: Date.now() };
    guardarAlmacen(K_RESPALDO, RESPALDO);
  }

  function importarMarcas(texto) {
    let d;
    try { d = JSON.parse(texto); } catch (e) { return 'El archivo no es un JSON válido.'; }
    if (!d || d.formato !== 'supjn+/marcas' || !d.filas || typeof d.filas !== 'object') return 'El archivo no es una exportación de SuPJN+.';
    refrescarMarcas();
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
    // El registro de dejar nota también viaja en la copia: de cada causa queda
    // el resultado más nuevo, se haya hecho en esta PC o en la otra.
    let notas = 0;
    const dn = normalizarNotas(d.notas);
    if (Object.keys(dn).length) {
      refrescarNotas();
      Object.keys(dn).forEach((k) => {
        const aca = NOTAS[k], otra = dn[k];
        if (aca && !((otra.t || 0) > (aca.t || 0) || (!otra.t && !aca.t && otra.f > aca.f))) return;
        NOTAS[k] = otra;
        notas++;
      });
      guardarAlmacen(K_NOTAS, NOTAS);
    }
    return { filas, etiquetas: MARCAS.etiquetas.length, notas };
  }

  // ------------------------------------------------------------ datos leídos

  const validarDatos = (d) => {
    if (!esObjeto(d) || !Array.isArray(d.causas)) return null;
    const causas = d.causas.filter((c) => esObjeto(c) && typeof c.exp === 'string' && c.exp.trim());
    return Object.assign({}, d, {
      causas,
      fecha: typeof d.fecha === 'number' ? d.fecha : 0,
      total: causas.length,
      enTramite: causas.filter((c) => c.tramite).length
    });
  };
  const DATOS = { rel: validarDatos(leerAlmacen(K_REL, null)), fav: validarDatos(leerAlmacen(K_FAV, null)) };
  const INDICE = { rel: new Map(), fav: new Map() };
  function indexar(tipo) {
    INDICE[tipo] = new Map();
    if (DATOS[tipo]) DATOS[tipo].causas.forEach((c) => INDICE[tipo].set(c.exp, c));
  }
  indexar('rel');
  indexar('fav');

  // Registro de dejar nota: { exp: { f: 'aaaa-mm-dd', t: marca de tiempo, ok: true | false | null, m: motivo } }.
  function normalizarNotas(n) {
    const out = {};
    if (!esObjeto(n)) return out;
    Object.keys(n).forEach((k) => {
      const v = n[k];
      if (!esObjeto(v) || typeof v.f !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.f)) return;
      if (v.ok !== true && v.ok !== false && v.ok !== null) return;
      out[k] = { f: v.f, t: typeof v.t === 'number' ? v.t : 0, ok: v.ok, m: typeof v.m === 'string' ? v.m : '' };
    });
    return out;
  }
  let NOTAS = normalizarNotas(leerAlmacen(K_NOTAS, {}));
  const refrescarNotas = () => { NOTAS = normalizarNotas(leerAlmacen(K_NOTAS, {})); };

  // Hora del último documento firmado, por causa:
  // { exp: { f: 'dd/mm/aaaa', hh: 'HH:MM', t, origen } }
  function normalizarHoras(h) {
    const out = {};
    if (!esObjeto(h)) return out;
    Object.keys(h).forEach((k) => {
      const v = h[k];
      if (!esObjeto(v) || !/^\d{2}\/\d{2}\/\d{4}$/.test(v.f || '') || !/^\d{2}:\d{2}$/.test(v.hh || '')) return;
      out[k] = { f: v.f, hh: v.hh, t: typeof v.t === 'number' ? v.t : 0, origen: typeof v.origen === 'string' ? v.origen : '' };
    });
    return out;
  }
  let HORAS = normalizarHoras(leerAlmacen(K_HORAS, {}));
  const refrescarHoras = () => { HORAS = normalizarHoras(leerAlmacen(K_HORAS, {})); };
  function guardarHora(k, dato) {
    refrescarHoras();
    HORAS[k] = dato;
    guardarAlmacen(K_HORAS, HORAS);
  }

  // Las partes de una causa. En la lista salen de la carátula, que es lo único
  // que manda el PJN; adentro del expediente salen de la solapa Intervinientes.
  const partesDe = (c) => partesDeCaratula(c.exp, c.car);

  const causaEn = (tipo, k) => INDICE[tipo].get(k) || null;
  const causaPorClave = (k) => causaEn(VISTA === 'fav' ? 'fav' : 'rel', k) || causaEn('rel', k) || causaEn('fav', k);

  // ------------------------------------------------------ configuración

  // w es el ancho de fábrica y m el mínimo al que se la puede achicar: el
  // encuadre reparte hasta ahí y no más, para que la fecha o el expediente no
  // queden cortados.
  const COLS_DEF = [
    { k: 'exp', t: 'Expediente', w: 132, m: 94 },
    { k: 'et', t: 'Etiquetas', w: 110, m: 62 },
    { k: 'dep', t: 'Dependencia', w: 210, m: 84 },
    { k: 'car', t: 'Carátula', w: 280, m: 112 },
    { k: 'partes', t: 'Partes', w: 210, m: 92 },
    { k: 'sit', t: 'Situación', w: 112, m: 70 },
    { k: 'ult', t: 'Últ. act.', w: 94, m: 80, ayuda: 'El PJN solo muestra el día de la última actuación, nunca la hora. Con el mismo día, las causas quedan en el orden que manda el sitio, que sí desempata por hora: es lo mismo que hace el botón Orden cronológico.' },
    { k: 'nota', t: 'Nota', w: 104, m: 78 },
    { k: 'anot', t: 'Apuntes', w: 108, m: 56 }
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
  // Las columnas que trae una versión nueva nacen apagadas: se prenden en
  // Columnas, y a nadie se le reacomoda la tabla sola al actualizar.
  COLS_DEF.forEach((c) => {
    const nueva = Array.isArray(CFG_GUARDADA.cols) ? CFG_GUARDADA.cols.indexOf(c.k) < 0 : !!c.oculta;
    if (nueva && c.oculta !== false && CFG.ocultas.indexOf(c.k) < 0) CFG.ocultas.push(c.k);
  });
  // Una sola vez: Etiquetas queda pegada a Expediente y Partes al lado de
  // Carátula. Después, cada columna queda donde el usuario la deje.
  if (!(CFG.mig >= 1)) {
    if (Array.isArray(CFG.cols)) {
      CFG.cols = CFG.cols.filter((k) => k !== 'et' && k !== 'partes');
      CFG.cols.splice(Math.max(0, CFG.cols.indexOf('exp')) + 1, 0, 'et');
      const iCar = CFG.cols.indexOf('car');
      CFG.cols.splice(iCar >= 0 ? iCar + 1 : CFG.cols.length, 0, 'partes');
      CFG.ocultas = CFG.ocultas.filter((k) => k !== 'partes');
    }
    CFG.mig = 1;
  }
  // Una sola vez: el orden de la app vuelve a ser el del PJN, por última
  // actuación y de la más nueva a la más vieja.
  if (!(CFG.mig >= 2)) {
    CFG.orden = { col: 'ult', desc: true };
    CFG.mig = 2;
  }
  if (!CFG.anchos || typeof CFG.anchos !== 'object') CFG.anchos = {};
  if (!esObjeto(CFG.tam)) CFG.tam = {};
  Object.keys(CFG.tam).forEach((k) => {
    const t = CFG.tam[k];
    if (!esObjeto(t) || !(t.w > 0) || !(t.h > 0)) delete CFG.tam[k];
  });
  if ([10, 15, 20, 25, 30, 40, 50, 75, 100].indexOf(Number(CFG.porPagina)) < 0) CFG.porPagina = 25;
  CFG.porPagina = Number(CFG.porPagina);
  ['texto', 'fuero', 'sit', 'etiqueta', 'desde', 'hasta'].forEach((k) => { if (typeof CFG[k] !== 'string') CFG[k] = ''; });
  if (['todas', 'si', 'no'].indexOf(CFG.tramite) < 0) CFG.tramite = 'todas';
  if (!esObjeto(CFG.anchos)) CFG.anchos = {};
  CFG.encuadrar = CFG.encuadrar !== false;
  CFG.maxi = CFG.maxi === true;
  if (!Array.isArray(CFG.ocultasAct)) CFG.ocultasAct = [];
  if (!CFG.anchosAct || typeof CFG.anchosAct !== 'object') CFG.anchosAct = {};
  if (!CFG.ordenAct || typeof CFG.ordenAct !== 'object' || (CFG.ordenAct.col && !COLS_ACT_DEF.some((c) => c.k === CFG.ordenAct.col))) CFG.ordenAct = { col: '', desc: true };
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

  let VISTA = 'rel';            // rel | fav | exp | nota | desc | marcas | acerca
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
    // Sin columna: como vino del PJN (el orden de lectura, que la tabla conserva).
    if (!k) return '';
    if (k === 'exp') return ordenExp(c.exp);
    if (k === 'partes') { const p = partesDe(c); return norm(p.map((x) => x.nombre).join(' ')); }
    // Con la fecha empatada, se respeta el orden del PJN (que desempata por la
    // hora, que no muestra). Si se está mirando solo lo que está en trámite, se
    // copia el orden de esa lista del PJN, que es la que se ve en el sitio. Va
    // invertido porque el orden normal es descendente.
    if (k === 'ult') {
      const p = (CFG.tramite === 'si' && c.posTramite != null) ? c.posTramite : (c.pos != null ? c.pos : (c.posTramite || 0));
      // Si se averiguó la hora del último documento y es del mismo día, manda la hora.
      const h = HORAS[c.exp];
      const hh = (h && h.f === c.ult) ? h.hh : '00:00';
      return String(numFecha(c.ult)).padStart(8, '0') + '|' + hh + '|' + String(999999 - p).padStart(6, '0');
    }
    if (k === 'et') return norm(etiquetasDe(c.exp).map((e) => e.nom).join(' '));
    if (k === 'anot') return norm(marcaDe(c.exp).nota);
    if (k === 'nota') { const n = NOTAS[c.exp]; return n ? n.f + (n.ok === true ? '2' : n.ok === null ? '1' : '0') : ''; }
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
    // Arranca minimizada: un error tiene que verse en la pastilla.
    '#supjn-pastilla.alerta{background:#b3261e}',
    '#supjn-pastilla.alerta:hover{background:#8c1d18}',
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
    '.sj-tit .fn.peligro{background:#b3261e;border-color:#b3261e}',
    '.sj-tit .zm{margin-left:auto;display:flex;align-items:center;gap:1px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);border-radius:5px;padding:1px}',
    '.sj-tit .zm button{background:transparent;border:0;color:#fff;height:22px;min-width:24px;padding:0 4px;border-radius:4px;cursor:pointer;font:600 13px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .zm button:hover{background:rgba(255,255,255,.22)}',
    '.sj-tit .zm button.pc{font-size:11px;min-width:44px;opacity:.85}',
    '.sj-tit .zm button.pc.act{opacity:1;background:rgba(255,255,255,.22)}',
    '.sj-tit .ctrl{margin-left:8px;display:flex;gap:2px}',
    '.sj-tit .ctrl button{background:transparent;border:0;color:#fff;width:30px;height:26px;border-radius:4px;cursor:pointer;font:400 15px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .ctrl button:hover{background:rgba(255,255,255,.18)}',
    '.sj-tit .ctrl button.x:hover{background:#c93b3b}',
    // Si la ventana es angosta, las solapas pasan a una segunda línea en vez de esconderse.
    '.sj-solapas{display:flex;flex-wrap:wrap;gap:2px;padding:0 10px;background:#e9f0f6;border-bottom:1px solid #c9d7e3;flex:none}',
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
    '.sj-barra .der{margin-left:auto;display:flex;gap:6px 8px;align-items:center;height:30px}',
    '.sj-b.prim{background:' + AZUL_CLARO + ';border-color:' + AZUL_CLARO + ';color:#fff}',
    // Un botón que está puesto no es lo mismo que el botón principal de la barra.
    '.sj-b.act{background:#d6e6f7;border-color:' + AZUL_CLARO + ';color:' + AZUL + ';box-shadow:inset 0 0 0 1px ' + AZUL_CLARO + '}',
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
    '.sj-cuerpo{flex:1;min-height:0;overflow:auto;background:#fff;position:relative}',
    // Barras de siempre, visibles y anchas. Ojo: no se puede usar
    // scrollbar-width ni scrollbar-color, porque con eso Chrome ignora estas
    // reglas y vuelve a las barras que flotan y no ocupan lugar.
    '#supjn ::-webkit-scrollbar{width:14px;height:14px}',
    '#supjn ::-webkit-scrollbar-track{background:#eef3f6;border-radius:7px}',
    '#supjn ::-webkit-scrollbar-thumb{background:#9fb3bd;border-radius:7px;border:3px solid #eef3f6}',
    '#supjn ::-webkit-scrollbar-thumb:hover{background:#7c939e}',
    '#supjn ::-webkit-scrollbar-corner{background:#eef3f6}',
    'table.sj-t{border-collapse:collapse;table-layout:fixed}',
    'table.sj-t th{position:sticky;top:0;z-index:2;background:' + AZUL + ';color:#fff;text-align:left;font-weight:600;font-size:12px;padding:8px 9px;white-space:nowrap;user-select:none;overflow:hidden;text-overflow:ellipsis}',
    'table.sj-t th.mov{cursor:grab}',
    'table.sj-t th.mov:hover{background:#1c5591}',
    // El nombre se recorta, pero la flecha de ordenar queda siempre a la vista:
    // sin ella la columna parece que no se pudiera ordenar.
    'table.sj-t th .tt{display:inline-block;max-width:calc(100% - 18px);overflow:hidden;text-overflow:ellipsis;vertical-align:bottom}',
    'table.sj-t th .fl{opacity:.5;margin-left:4px;font-size:10px;vertical-align:bottom}',
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
    // En la tabla el número puede cortar después de cada barra: nunca queda tapado.
    'table.sj-t td .sj-exp{white-space:normal}',
    '.sj-fav{color:#d39e00;margin-left:4px}',
    '.sj-badge{display:inline-block;margin-top:3px;font-size:10.5px;font-weight:600;color:#6b7c85;background:#eef2f4;border-radius:8px;padding:0 7px}',
    '.sj-elegir td.acc{text-align:right;white-space:nowrap}',
    '.sj-elegir td.acc .sj-b{margin-right:6px;padding:1px 6px}',
    '.sj-rol{color:#6b7c85;font-size:11px;text-transform:uppercase;letter-spacing:.02em}',
    '.sj-sep{color:#b9c6cc;margin:0 5px}',
    '.sj-exp-cab .c .p{margin-top:2px;font-size:12.5px;color:#24414f}',
    '.sj-hora{color:#0a6cab;font-weight:600}',
    '.sj-leido{color:#3a4c54}',
    '.sj-leido.vieja{color:#b3261e;font-weight:600}',
    '.sj-res{font-size:11.5px;font-weight:600;white-space:nowrap}',
    '.sj-res.ok{color:#1b6b3a}',
    '.sj-res.mal{color:#b3261e}',
    '.sj-res.duda{color:#8a5a00}',
    '.sj-chip{display:inline-block;padding:1px 9px;border-radius:10px;font:600 11px "Segoe UI",Arial,sans-serif;margin:0 4px 3px 0;border:1px solid rgba(0,0,0,.12);white-space:nowrap}',
    'button.sj-chip{cursor:pointer}',
    '.sj-chip.off{background:transparent!important;color:#8a98a8!important;border-style:dashed}',
    '.sj-toque{cursor:pointer;min-height:20px;border-radius:4px;margin:-3px -5px;padding:3px 5px}',
    '.sj-toque:hover{background:#e3eefa;box-shadow:inset 0 0 0 1px #b9cde0}',
    '.sj-poner{color:#9fb0ba;font-size:11.5px;font-weight:600;visibility:hidden}',
    'table.sj-t tr:hover .sj-poner{visibility:visible}',
    '.sj-nota-txt{color:#3a4c54;font-size:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.sj-acc{display:flex;gap:3px;justify-content:flex-end;flex-wrap:nowrap}',
    '.sj-abrir{height:26px;padding:0 8px;white-space:nowrap;border-radius:4px;border:1px solid ' + AZUL_CLARO + ';background:' + AZUL_CLARO + ';color:#fff;font:600 12px "Segoe UI",Arial,sans-serif;cursor:pointer}',
    '.sj-abrir:hover{background:#3f72bb}',
    '.sj-mas{height:26px;width:26px;flex:none;border-radius:4px;border:1px solid #b9cde0;background:#eaf1f8;color:' + AZUL + ';font:700 14px/1 "Segoe UI",Arial,sans-serif;cursor:pointer}',
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
    '.sj-informe{width:100%;min-height:150px;border:1px solid #b9c9d0;border-radius:5px;padding:8px 10px;font:12px/1.5 Consolas,monospace;resize:vertical;margin-top:4px}',
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
    // --sj-h es el alto de la pantalla corregido por el zoom (lo pone medidas()).
    '.sj-menu{position:absolute;z-index:30;background:#fff;border:1px solid #b9cde0;border-radius:6px;box-shadow:0 8px 26px rgba(0,0,0,.22);padding:5px 0;min-width:230px;max-height:calc(var(--sj-h,100vh) * .7);overflow:auto}',
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
    '.sj-solapa-exp h4{margin:0}',
    '.sj-desplegar{background:none;border:0;padding:0;color:' + AZUL + ';font:700 13px "Segoe UI",Arial,sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px}',
    '.sj-desplegar:hover{text-decoration:underline}',
    '.sj-sol-txt{font-size:12.5px;color:#3a4c54;margin-top:6px}',
    '.sj-sol-txt.mal{color:#b3261e}',
    '.lst-sol{max-height:calc(var(--sj-h,100vh) * .4);overflow:auto;margin-top:8px}',
    '.lst-sol table.sj-t{width:100%;table-layout:auto}',
    '.lst-sol table.sj-t td{vertical-align:middle}',
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
    '.sj-elegir .lst{max-height:calc(var(--sj-h,100vh) * .46);overflow:auto}',
    '.sj-elegir table{border-collapse:collapse;width:100%}',
    '.sj-elegir td{padding:5px 8px;border-bottom:1px solid #eef2f4;font-size:12px;vertical-align:top}',
    '.sj-elegir tr:hover td{background:#eef5fc}',
    '.sj-elegir td.f{white-space:nowrap;font-family:Consolas,monospace;font-size:11.5px}',
    '.sj-elegir td.t{white-space:nowrap;color:' + AZUL + ';font-weight:600;font-size:11.5px}',
    '.sj-elegir table.sj-t td{padding:5px 8px;font-size:12px}',
    '.sj-elegir table.sj-t th{padding:6px 8px;font-size:11.5px}',
    '.sj-elegir table.sj-t td.cs,.sj-elegir table.sj-t th.cs{padding-left:4px;padding-right:4px;text-overflow:clip}',
    '.sj-elegir table.sj-t td.t{color:' + AZUL + ';font-weight:600;font-size:11.5px;white-space:normal}',
    '.sj-elegir .pie{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;border-top:1px solid #e6ecef;background:#f5f8fa}',
    '.sj-redim{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;z-index:40;background:linear-gradient(135deg,transparent 50%,#9fb3c4 50%,#9fb3c4 60%,transparent 60%,transparent 70%,#9fb3c4 70%,#9fb3c4 80%,transparent 80%)}',
    '#supjn.maxi .sj-redim{display:none}',
    '#supjn a{color:#0a6cab}'
  ].join('\n');

  // ------------------------------------------------------------------ ventana

  let win = null;
  let pastilla = null;
  let alertaPastilla = '';       // error ocurrido con la ventana minimizada
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
    // SuPJN+ arranca minimizada: un error con la ventana cerrada se marca en la
    // pastilla, que queda roja hasta que se abre la ventana.
    if (pastilla && win.style.display === 'none' && malo && txt) { alertaPastilla = txt; pintarPastilla(); }
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
    if (alertaPastilla) extra = '¡hay un aviso!';
    pastilla.classList.toggle('alerta', !!alertaPastilla);
    pastilla.title = alertaPastilla ? 'SuPJN+: ' + alertaPastilla : 'Abrir SuPJN+';
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
    const et = opciones(q('[data-f="etiqueta"]'), [['', 'Todas las etiquetas'], ['@sin', 'Sin etiqueta'], ['@anot', 'Con apuntes'], ['@nota', 'Con resultado de dejar nota']]
      .concat(MARCAS.etiquetas.map((e) => [e.id, e.nom])), CFG.etiqueta);
    // Solo se corrige lo guardado si hay datos: sin lista leída no se sabe qué opciones existen.
    if (D) { CFG.fuero = fuero; CFG.sit = sit; }
    CFG.etiqueta = et;
    q('[data-f="tramite"]').value = CFG.tramite;
    q('[data-f="texto"]').value = CFG.texto;
    q('[data-f="desde"]').value = CFG.desde;
    q('[data-f="hasta"]').value = CFG.hasta;
    pintarOrdenPJN();
  }

  // El PJN no avisa cuando algo cambia: lo que se ve es la última lectura. Por eso
  // la antigüedad va a la vista, y en rojo cuando ya pasó el rato.
  function pintarOrdenPJN() {
    const cro = q('[data-e="ordenCrono"]');
    if (cro) cro.classList.toggle('act', CFG.orden.col === 'ult' && CFG.orden.desc !== false);
    const pjn = q('[data-e="ordenPJN"]');
    if (pjn) pjn.classList.toggle('act', !CFG.orden.col);
  }

  function pintarEstado() {
    if (leyendo) return;
    const e = q('[data-e="estado"]');
    if (!e) return;
    const D = datosVista();
    const L = LISTAS[VISTA === 'fav' ? 'fav' : 'rel'];
    if (!D) { estadoTxt('Todavía no se leyó ' + L.nombre + '.'); return; }
    const fuera = D.total - D.enTramite;
    const vieja = Date.now() - D.fecha > VIEJA_DESPUES_DE;
    e.innerHTML = esc(plural(D.total, 'causa', 'causas') + ' (' + D.enTramite + ' en trámite, ' + fuera + ' fuera de trámite) · ') +
      '<span class="sj-leido' + (vieja ? ' vieja' : '') + '" title="' + esc('Leídas el ' + fechaHora(D.fecha) + '. El PJN no avisa cuando cambia algo: esto es lo que había en esa lectura.') + '">' +
      esc('leídas ' + hace(D.fecha)) + '</span>' +
      (vieja ? ' <button class="sj-b chico" data-a="actualizar" title="Volver a leer las listas del PJN">Volver a leer</button>' : '');
  }

  function pintarCopia() {
    const e = q('[data-e="copia"]');
    if (!e) return;
    const hayMarcas = Object.keys(MARCAS.filas).length > 0;
    if (!RESPALDO || !RESPALDO.fecha) {
      e.className = 'sj-copia ' + (hayMarcas ? 'nunca' : 'ok');
      e.textContent = hayMarcas ? 'Sin copia de etiquetas y apuntes' : 'Todavía no hay etiquetas ni apuntes';
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
    const sinBajar = b ? ' title="Durante una tanda de dejar nota no se baja nada: la página se recarga en cada nota"' : '';
    e.innerHTML = '<span class="cuenta">' + (n ? plural(n, 'seleccionada', 'seleccionadas') : 'Ninguna seleccionada') + '</span>' +
      '<button class="sj-b" data-a="notaSel"' + dis(!n || b) + ' title="Lleva a la solapa Dejar nota con estas causas">Dejar nota en las seleccionadas</button>' +
      '<button class="sj-b" data-a="bajarSel"' + dis(!n || b) + sinBajar + '>Bajar PDF de las seleccionadas</button>' +
      '<button class="sj-b" data-a="elegirSel"' + dis(n !== 1 || b) + (sinBajar || ' title="Con una causa seleccionada: elegir qué actuaciones bajar"') + '>Elegir actuaciones</button>' +
      '<button class="sj-b" data-a="quitarSel"' + dis(!n) + '>Quitar selección</button>';
    // El número de la solapa Dejar nota sigue a la selección.
    pintarSolapas();
  }

  // Resultado de dejar nota: dejada, no salió o a verificar (sin respuesta clara).
  const resNota = (n) => (n.ok === true ? { c: 'ok', t: 'dejada' } : n.ok === null ? { c: 'duda', t: 'a verificar' } : { c: 'mal', t: 'no salió' });

  // ------------------------------------------------------- vista dejar nota

  function confirmaNotaHTML() {
    const solo = confirmaNota.solo;
    const fueraRel = solo ? solo.filter((k) => !causaEn('rel', k)).length : 0;
    const hoy = hoyISO();
    const yaHoy = (solo || Object.keys(NOTAS)).filter((k) => NOTAS[k] && NOTAS[k].f === hoy && NOTAS[k].ok === true).length;
    const avisoHoy = !yaHoy ? '' : ' Ojo: ' + (solo
      ? plural(yaHoy, 'de estas causas ya tiene', 'de estas causas ya tienen')
      : plural(yaHoy, 'causa ya tiene', 'causas ya tienen')) + ' nota dejada hoy desde SuPJN+, y la tanda la vuelve a dejar si el PJN la habilita.';
    return '<div class="sj-confirma" style="border-radius:6px;border:1px solid #f0dca0">' +
      '<span>' + (solo
        ? 'Vas a dejar nota en <b>' + plural(solo.length, 'causa elegida', 'causas elegidas') + '</b>'
        : 'Vas a dejar nota en <b>todas las causas que el PJN habilite hoy</b>') +
      '. Es el acto procesal. La página del PJN se recarga una vez por nota.' +
      (fueraRel ? ' Ojo: ' + plural(fueraRel, 'no está', 'no están') + ' en Mis causas, y el PJN solo deja nota desde ahí.' : '') + avisoHoy + '</span>' +
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
        ? '<span class="sj-res ' + resNota(n).c + '" title="' + esc(n.m || '') + '">' + (n.ok === true ? 'nota dejada' : resNota(n).t) + '</span>'
        : '') + '</td>' +
      (quitable ? '<td style="text-align:right;width:1%"><button class="sj-b chico" data-a="quitarUna" data-k="' + esc(k) + '" title="Sacarla de la selección">Quitar</button></td>' : '<td></td>') +
      '</tr>';
  }

  function panelNotaHTML() {
    refrescarNotas();
    const c = leerCorrida();
    const corriendo = !!(c && c.activa) || notaEnCurso;
    const sel = [...selVista()];
    const hoy = hoyISO();
    const deHoy = Object.keys(NOTAS).filter((k) => NOTAS[k].f === hoy);
    const bien = deHoy.filter((k) => NOTAS[k].ok === true);
    const dudosas = deHoy.filter((k) => NOTAS[k].ok === null);
    const otra = listaActual() === 'fav' ? 'rel' : 'fav';
    const nOtra = SEL[otra].size;
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
        '<button class="sj-b" data-a="notaSel"' + (sel.length ? '' : ' disabled') + '>Dejar nota en ' + (sel.length ? lasN(sel.length, 'seleccionada', 'seleccionadas') : 'las seleccionadas') + '</button>' +
        (sel.length ? '<button class="sj-b" data-a="quitarSel">Vaciar la selección</button>' : '') +
        '</div>';
      h += sel.length
        ? '<h3>Seleccionadas en ' + esc(LISTAS[listaActual()].nombre) + '</h3><table class="lista">' + sel.map((k) => filaNotaHTML(k, true)).join('') + '</table>'
        : '<p style="color:#6b7c85">No hay causas seleccionadas en ' + esc(LISTAS[listaActual()].nombre) + '.' + (nOtra
          ? ' Hay ' + plural(nOtra, 'seleccionada', 'seleccionadas') + ' en ' + esc(LISTAS[otra].nombre) + '. <button class="sj-b chico" data-a="usarLista" data-lista="' + otra + '">Usar esas</button>'
          : ' Tildalas en <b>Mis causas</b> o en <b>Favoritos</b> y volvé acá, o dejá nota en todas las habilitadas.') + '</p>';
    }

    h += '<h3>Notas de hoy</h3>';
    h += deHoy.length
      ? '<p>' + plural(bien.length, 'nota dejada', 'notas dejadas') +
        (dudosas.length ? ', ' + plural(dudosas.length, 'a verificar en el expediente', 'a verificar en el expediente') : '') +
        (deHoy.length - bien.length - dudosas.length ? ' y ' + plural(deHoy.length - bien.length - dudosas.length, 'que no salió', 'que no salieron') : '') + '.</p>' +
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
      '<h4>Apuntes</h4>' +
      '<textarea class="sj-nota" placeholder="Apuntes privados sobre esta causa. Quedan en esta PC y no se escriben en el expediente.">' + esc(m.nota) + '</textarea>' +
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

  // Las partes, con su rol adelante: "Actora: A · Demandada: B".
  const partesHTML = (ps) => ps.map((p) => (p.rol ? '<span class="sj-rol">' + esc(p.rol) + ':</span> ' : '') + esc(p.nombre)).join('<span class="sj-sep">·</span>');

  function celdaHTML(c, k, tipo) {
    if (k === 'exp') {
      const fav = tipo === 'rel' && (c.fav || !!causaEn('fav', c.exp));
      return '<span class="sj-exp">' + esc(c.exp).replace(/ /g, '&nbsp;').replace(/\//g, '/<wbr>') + '</span>' + (fav ? '<span class="sj-fav" title="Está en tus Favoritos del PJN">★</span>' : '') +
        (c.tramite ? '' : '<br><span class="sj-badge">fuera de trámite</span>');
    }
    if (k === 'partes') return partesHTML(partesDe(c));
    if (k === 'ult') {
      const h = HORAS[c.exp];
      return esc(c.ult) + (h && h.f === c.ult
        ? ' <span class="sj-hora" title="' + esc('Hora sacada de ' + h.origen + ', del último documento de la causa') + '">' + esc(h.hh) + '</span>'
        : '');
    }
    if (k === 'nota') {
      const n = NOTAS[c.exp];
      if (!n) return '';
      const r = resNota(n);
      return '<span class="sj-res ' + r.c + '" title="' + esc(n.m || r.t) + '">' + r.t + ' ' + isoACorta(n.f) + '</span>';
    }
    if (k === 'et') {
      return '<div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="et" title="Poner o sacar etiquetas">' +
        (chipsDe(c.exp) || '<span class="sj-poner">+ etiqueta</span>') + '</div>';
    }
    if (k === 'anot') {
      const nota = String(marcaDe(c.exp).nota || '').trim();
      return '<div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="nota" title="' + (nota ? esc(nota) : 'Escribir un apunte') + '">' +
        (nota ? '<span class="sj-nota-txt">' + esc(nota) + '</span>' : '<span class="sj-poner">+ apunte</span>') + '</div>';
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
        '" title="' + esc('Clic para ordenar. Arrastrá el título para mover la columna y su borde derecho para cambiar el ancho.' +
          (tabla === 'act' ? ' Un tercer clic vuelve al orden en que las trae el PJN, que es el del PDF.' : '') +
          (defCol(tabla, k).ayuda ? ' ' + defCol(tabla, k).ayuda : '')) + '">' +
        '<span class="tt">' + esc(defCol(tabla, k).t) + '</span><span class="fl">' + (act ? (o.desc ? '▼' : '▲') : '▽') + '</span>' +
        '<span class="rs" data-tabla="' + tabla + '" data-rs="' + esc(k) + '"></span></th>';
    }).join('');
  }

  function grupoColumnas(tabla, cols, antes, despues, anchos) {
    return '<colgroup>' + (antes ? '<col style="width:' + antes + 'px">' : '') +
      cols.map((k) => '<col data-tabla="' + tabla + '" data-col="' + esc(k) + '" style="width:' +
        ((anchos && anchos[k]) || anchoDe(tabla, k)) + 'px">').join('') +
      (despues ? '<col style="width:' + despues + 'px">' : '') + '</colgroup>';
  }

  // Reparte `objetivo` píxeles entre las columnas en proporción a `f`, con
  // enteros que suman exacto (el resto va a las de fracción más grande) y sin
  // bajar de los mínimos. Redondear columna por columna se pasaba 1 o 2 px y
  // aparecía la barra de desplazamiento horizontal.
  function enterosExactos(cols, f, min, objetivo) {
    const out = {};
    let suma = 0;
    cols.forEach((k) => { out[k] = Math.max(min[k], Math.floor(f[k])); suma += out[k]; });
    let dif = Math.round(objetivo) - suma;
    const porFraccion = cols.slice().sort((a, b) => (f[b] - Math.floor(f[b])) - (f[a] - Math.floor(f[a])));
    for (let i = 0; dif > 0 && porFraccion.length; i = (i + 1) % porFraccion.length) { out[porFraccion[i]]++; dif--; }
    while (dif < 0) {
      let quite = false;
      for (let i = porFraccion.length - 1; i >= 0 && dif < 0; i--) {
        const k = porFraccion[i];
        if (out[k] > min[k]) { out[k]--; dif++; quite = true; }
      }
      if (!quite) break;
    }
    return out;
  }

  // Encuadre: con el encuadre puesto la tabla ocupa justo el ancho visible. Si
  // las columnas no entran, se achican en proporción a lo que tienen por encima
  // de su mínimo; si sobra lugar, se agrandan en proporción. Las columnas fijas
  // (casilla y botones) no cambian. Si ni con los mínimos entran, la tabla se
  // corre de costado.
  function anchosEncuadrados(tabla, cols, fijos, disponible) {
    const w = {}, min = {};
    cols.forEach((k) => { w[k] = anchoDe(tabla, k); min[k] = minCol(tabla, k); });
    const suma = cols.reduce((s, k) => s + w[k], 0);
    const libre = disponible - fijos;
    if (!CFG.encuadrar || !disponible || !cols.length || libre <= 0) return { anchos: w, total: fijos + suma };
    const sumaMin = cols.reduce((s, k) => s + min[k], 0);
    if (sumaMin >= libre) return { anchos: Object.assign({}, min), total: fijos + sumaMin };
    const f = {};
    if (suma > libre) {
      const margen = suma - sumaMin;
      const quita = suma - libre;
      cols.forEach((k) => { f[k] = w[k] - (w[k] - min[k]) / margen * quita; });
    } else {
      cols.forEach((k) => { f[k] = w[k] * libre / suma; });
    }
    return { anchos: enterosExactos(cols, f, min, libre), total: disponible };
  }

  // Con el encuadre puesto la tabla no cambia de ancho: lo que se le da a una
  // columna se le saca a las otras, y al revés.
  function repartirEncuadre(tabla, base, cols, k, ancho) {
    const min = {};
    cols.forEach((x) => { min[x] = minCol(tabla, x); });
    const otras = cols.filter((x) => x !== k);
    const total = cols.reduce((s, x) => s + base[x], 0);
    const out = {};
    cols.forEach((x) => { out[x] = base[x]; });
    if (!otras.length) { out[k] = Math.max(min[k], Math.round(ancho)); return out; }
    let d = Math.max(min[k], Math.round(ancho)) - base[k];
    const f = {};
    if (d > 0) {
      const margen = otras.reduce((s, x) => s + Math.max(0, base[x] - min[x]), 0);
      d = Math.min(d, margen);
      otras.forEach((x) => { f[x] = margen > 0 ? base[x] - Math.max(0, base[x] - min[x]) / margen * d : base[x]; });
    } else {
      const suma = otras.reduce((s, x) => s + base[x], 0);
      otras.forEach((x) => { f[x] = suma > 0 ? base[x] + base[x] / suma * (-d) : base[x]; });
    }
    out[k] = base[k] + d;
    Object.assign(out, enterosExactos(otras, f, min, total - out[k]));
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

  // Si hay una anotación a medio escribir, se guarda antes de redibujar (si no,
  // la tabla nueva sale con el texto viejo y después lo pisa) y se le devuelve
  // el foco con el cursor donde estaba.
  function focoAnotacion() {
    const a = document.activeElement;
    if (!a || !win || !win.contains(a) || !a.classList || !a.classList.contains('sj-nota')) return null;
    const caja = a.closest('[data-marca]');
    return caja ? { k: caja.dataset.marca, ini: a.selectionStart, fin: a.selectionEnd, arriba: a.scrollTop } : null;
  }
  function devolverFoco(f) {
    if (!f || !win) return;
    const t = [...win.querySelectorAll('[data-marca] .sj-nota')].find((x) => x.closest('[data-marca]').dataset.marca === f.k);
    if (!t) return;
    try { t.focus({ preventScroll: true }); t.setSelectionRange(f.ini, f.fin); t.scrollTop = f.arriba; } catch (e) { /* sin foco */ }
  }

  function pintarTabla() {
    const cuerpo = q('[data-e="cuerpo"]'), pie = q('[data-e="pie"]');
    if (!cuerpo) return;
    const foco = focoAnotacion();
    guardarNotaAbierta();
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
    const ANCHO_SEL = 30, ANCHO_ACC = 128;

    const cab = '<th class="cs fija"><input type="checkbox" data-a="selTodas" title="Seleccionar o quitar ' + lasN(L.length, 'causa filtrada', 'causas filtradas') + '"' + (todasSel ? ' checked' : '') + '></th>' +
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
      (filas || '<tr><td colspan="' + (cols.length + 2) + '" class="sj-vacio">' + (D.total
        ? 'Ninguna causa coincide con los filtros.'
        : 'El PJN no tiene causas en ' + esc(LISTAS[tipo].pjn) + ' (ni en trámite ni fuera de trámite).') + '</td></tr>') +
      '</tbody></table>';
    encuadrarAlVuelo('lista', cuerpo);
    devolverFoco(foco);

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
    const anchoWin = rw.width / z, altoWin = rw.height / z;
    // El menú nunca más alto que la ventana: con zoom se cortaba y no se llegaba al final.
    m.style.maxHeight = Math.max(120, Math.floor(altoWin - 16)) + 'px';
    const ancho = m.offsetWidth, alto = m.offsetHeight;
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
      it('bajarUna', 'Bajar el expediente completo en PDF', b, b ? 'Durante una tanda de dejar nota no se baja nada' : '') +
      it('elegirUna', 'Elegir qué actuaciones bajar', b, b ? 'Durante una tanda de dejar nota no se baja nada' : '') +
      '<div class="sep"></div>' +
      it('notaUna', 'Dejar nota en esta causa', !enRel || b, soloRel) +
      it('marcasUna', 'Etiquetas y apuntes');
  }

  // ------------------------------------------------------- vista expediente

  const EXP = { estado: 'nada', texto: '', datos: null, acts: null, elegidas: new Set(), filtro: { texto: '', desde: '', hasta: '' }, cortar: false,
    // Las otras tres solapas del PJN: se piden de a una y se guardan mientras dure la página.
    solapas: { int: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false }, vin: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false }, rec: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false } } };

  // Roles de acompañamiento: no son partes, son quienes las asisten o intervienen por oficio.
  const ROL_ACCESORIO = /letrad|apoderad|patrocinante|perit|defensor|fiscal|ministerio|s[ií]ndic|martiller|mediador|curador|tutor|auxiliar|secretari|^juez|consultor|traductor|int[eé]rprete|oficial|asesor/i;

  // De la solapa Intervinientes salen las partes de verdad, con el rol que pone el PJN.
  function partesDeIntervinientes(s) {
    if (!s || s.estado !== 'listo' || !s.filas.length) return null;
    const iTipo = Math.max(0, s.cabs.findIndex((c) => /tipo|car[aá]cter|rol|intervin/i.test(c)));
    const iNom = s.cabs.findIndex((c) => /nombre|denominaci/i.test(c));
    const out = [];
    s.filas.forEach((f) => {
      const rol = limpio(f[iTipo] || '');
      const nombre = limpio(f[iNom >= 0 ? iNom : 1] || '');
      if (!nombre || ROL_ACCESORIO.test(rol)) return;
      out.push({ rol: nombreRol(rol), nombre });
    });
    return out.length ? out : null;
  }

  const partesExp = () => partesDeIntervinientes(EXP.solapas.int) || partesDeCaratula((EXP.datos || {}).exp || '', (EXP.datos || {}).car || '');

  const botonPJN = (re) => [...document.querySelectorAll('a, input[type=button], input[type=submit], button')]
    .find((x) => !esNuestro(x) && re.test(limpio(x.value || x.textContent))) || null;

  function pintarExpediente() {
    const p = q('[data-e="vPanel"]');
    const foco = focoAnotacion();
    guardarNotaAbierta();
    const d = EXP.datos || (EXP.datos = datosExpediente(document));
    const k = d.exp;
    p.innerHTML =
      '<div class="sj-sec"><div class="sj-exp-cab"><span class="n">' + esc(k || 'Expediente') + '</span>' +
      '<div class="c">' + esc(d.car) +
      '<div class="p" data-e="partesExp">' + partesHTML(partesExp()) + '</div>' +
      '<div class="d">' + esc([d.dep, d.sit].filter(Boolean).join(' · ')) + '</div></div></div>' +
      '<div class="sj-exp-bts"><button class="sj-b" data-a="volverLista">Volver a Mis causas</button>' +
      (botonPJN(/^dejar nota$/i) ? '<button class="sj-b" data-a="notaPJN" title="Usa el botón del PJN, que pide confirmar">Dejar nota en esta causa</button>' : '') +
      (botonPJN(/presentar escrito/i) ? '<button class="sj-b" data-a="escritoPJN">Presentar escrito</button>' : '') +
      '<button class="sj-b" data-a="recargar">Recargar la página</button></div></div>' +
      '<div class="sj-sec"><h4>Actuaciones con PDF</h4><div data-e="expEstado"></div><div data-e="expElegir"></div></div>' +
      solapaExpHTML('int') + solapaExpHTML('vin') + solapaExpHTML('rec') +
      (k ? '<div class="sj-sec" data-marca="' + esc(k) + '">' + editorMarcasHTML(k) + '</div>' : '');
    pintarExpEstado();
    pintarElegir('exp');
    devolverFoco(foco);
  }

  const TITULO_SOLAPA = { int: 'Intervinientes', vin: 'Causas vinculadas', rec: 'Recursos' };
  const AYUDA_SOLAPA = {
    int: 'Todas las partes y quienes intervienen, tal como los lista el PJN.',
    vin: 'Las causas vinculadas a esta. Se abren y se bajan como cualquier otra.',
    rec: 'Los recursos de esta causa, con su tipo y su estado.'
  };

  function solapaExpHTML(clave) {
    const s = EXP.solapas[clave];
    return '<div class="sj-sec sj-solapa-exp" data-solapa="' + clave + '">' +
      '<h4><button class="sj-desplegar" data-a="verSolapa" data-sol="' + clave + '">' + (s.abierta ? '▾' : '▸') + ' ' + esc(TITULO_SOLAPA[clave]) +
      (s.estado === 'listo' ? '<span class="sj-badge">' + s.filas.length + '</span>' : '') + '</button></h4>' +
      '<div data-e="solapa-' + clave + '">' + (s.abierta ? cuerpoSolapaHTML(clave) : '') + '</div></div>';
  }

  function cuerpoSolapaHTML(clave) {
    const s = EXP.solapas[clave];
    if (s.estado === 'leyendo') return '<div class="sj-sol-txt">' + esc(s.texto || 'Pidiéndoselo al PJN...') + '</div><div class="sj-prog"><i style="width:35%"></i></div>';
    if (s.estado === 'error') return '<div class="sj-sol-txt mal">' + esc(s.texto) + '</div><div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + clave + '" data-otra="1">Probar de nuevo</button></div>';
    if (s.estado !== 'listo') return '<div class="sj-sol-txt">' + esc(AYUDA_SOLAPA[clave]) + '</div>';
    if (!s.filas.length) return '<div class="sj-sol-txt">' + esc('El PJN no tiene nada en ' + TITULO_SOLAPA[clave] + ' para esta causa.') + '</div>';
    const acciones = clave === 'vin';
    return '<div class="lst-sol"><table class="sj-t sj-fija"><thead><tr>' +
      s.cabs.map((c) => '<th>' + esc(c) + '</th>').join('') + (acciones ? '<th></th>' : '') + '</tr></thead><tbody>' +
      s.filas.map((f) => '<tr>' + f.map((v, i) => '<td' + (i === 0 ? ' class="sj-exp"' : '') + '>' + esc(v) + '</td>').join('') +
        (acciones ? '<td class="acc"><div class="sj-acc"><button class="sj-abrir" data-a="abrirVinc" data-k="' + esc(f[0]) + '" title="Abrir esta causa vinculada en esta pestaña">Abrir</button>' +
          '<button class="sj-mas" data-a="abrirVincNueva" data-k="' + esc(f[0]) + '" title="Abrirla en una pestaña nueva">↗</button>' +
          '<button class="sj-mas" data-a="bajarVinc" data-k="' + esc(f[0]) + '" title="Bajar el expediente completo de esta causa vinculada">⇩</button></div></td>' : '') +
        '</tr>').join('') + '</tbody></table></div>' +
      '<div class="sj-sol-txt">' + esc('Leído ' + hace(s.fecha || Date.now())) + '. ' +
      '</div><div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + clave + '" data-otra="1">Volver a leer</button></div>';
  }

  function pintarSolapaExp(clave) {
    const cont = q('[data-e="solapa-' + clave + '"]');
    const s = EXP.solapas[clave];
    if (cont) cont.innerHTML = s.abierta ? cuerpoSolapaHTML(clave) : '';
    const b = q('[data-a="verSolapa"][data-sol="' + clave + '"]');
    if (b) b.innerHTML = (s.abierta ? '▾' : '▸') + ' ' + esc(TITULO_SOLAPA[clave]) + (s.estado === 'listo' ? '<span class="sj-badge">' + s.filas.length + '</span>' : '');
    const p = q('[data-e="partesExp"]');
    if (p) p.innerHTML = partesHTML(partesExp());
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
      // Se busca en lo que se ve: la oficina no es una columna.
      if (t && norm([a.fecha, a.tipo, a.detalle, a.fojas].join(' ')).indexOf(t) < 0) return;
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
    const ANCHO_SEL = 30, ANCHO_VER = 104;   // entran Bajar y Ver
    const enc = anchosEncuadrados('act', cols, ANCHO_SEL + ANCHO_VER, anchoUtil(q('[data-elegir="' + id + '"] .lst')));
    const filas = V.map((i) => {
      const a = ctx.acts[i];
      return '<tr><td class="cs"><input type="checkbox" data-ei="' + i + '"' + (ctx.elegidas.has(i) ? ' checked' : '') + '></td>' +
        cols.map((k) => '<td class="' + claseAct(k) + '">' + celdaAct(a, k) + '</td>').join('') +
        '<td class="acc">' +
        '<button class="sj-b chico" data-ea="bajarUna" data-i="' + i + '" title="Bajar solo esta actuación en un PDF">Bajar</button>' +
        (a.ver ? '<a href="' + esc(a.ver) + '" target="_blank" rel="noopener" title="Abrir esta actuación en el visor del PJN, en una pestaña nueva">Ver</a>' : '') +
        '</td></tr>';
    }).join('');
    return '<div class="sj-elegir" data-elegir="' + esc(id) + '">' +
      '<div class="fil"><input type="text" data-ef="texto" placeholder="Filtrar por fecha, tipo o detalle" value="' + esc(ctx.filtro.texto) + '">' +
      '<label>Desde <input type="date" data-ef="desde" value="' + esc(ctx.filtro.desde) + '"></label>' +
      '<label>hasta <input type="date" data-ef="hasta" value="' + esc(ctx.filtro.hasta) + '"></label>' +
      '<button class="sj-b chico" data-ea="todas" title="Elegir las que se ven">Todas</button>' +
      '<button class="sj-b chico" data-ea="ninguna" title="Quitar las que se ven">Ninguna</button>' +
      '<button class="sj-b chico" data-ea="invertir" title="Invertir las que se ven">Invertir</button>' +
      '<button class="sj-b chico" data-a="menuColsAct" data-id="' + esc(id) + '" title="Elegir qué columnas se ven">Columnas ▾</button>' +

      '<span class="cnt" data-e="cnt">' + esc(cuentaElegir(ctx, V.length)) + '</span></div>' +
      '<div class="lst"><table class="sj-t" style="' + estiloTabla(enc.total) + '">' +
      grupoColumnas('act', cols, ANCHO_SEL, ANCHO_VER, enc.anchos) +
      '<thead><tr><th class="cs fija"><input type="checkbox" data-ea="todasCb" title="Elegir o quitar ' + lasN(V.length, 'actuación que se ve', 'actuaciones que se ven') + '"' + (todasV ? ' checked' : '') + '></th>' +
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
    const modo = t.modo === 'elegir' ? 'eligiendo actuaciones' : t.modo === 'seleccion' ? (t.una ? 'una actuación' : t.parcial ? 'actuaciones elegidas' : 'expediente completo') : 'expediente completo';
    return '<div class="sj-trab ' + clase + '" data-trab="' + esc(t.id) + '" data-estado="' + esc(t.estado) + '">' +
      '<div class="cab"><b class="sj-exp">' + esc(t.exp) + '</b><span class="car">' + esc(t.car) + '</span><span class="sj-badge">' + esc(modo) + '</span></div>' +
      '<div class="txt" data-e="ttxt">' + esc(t.texto) + '</div>' +
      (/abriendo|leyendo|bajando/.test(t.estado) ? '<div class="sj-prog"><i data-e="tprog" style="width:' + Math.round((t.frac || 0) * 100) + '%"></i></div>' : '') +
      (t.estado === 'eligiendo' ? elegirHTML(t.id) : '') +
      '</div>';
  }

  const pausaHTML = () => (pausaHasta && Date.now() < pausaHasta
    ? '<div class="sj-trab"><div class="txt">Respiro entre bloques: de a ' + BLOQUE_DESCARGAS + ' causas por vez, para no saturar al PJN. Sigo en ' +
      Math.max(1, Math.round((pausaHasta - Date.now()) / 1000)) + ' segundos.</div>' +
      '<div class="bts" style="margin-top:8px"><button class="sj-b chico" data-a="seguirAhora">Seguir ahora</button></div></div>'
    : '');

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
      pausaHTML() +
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
      '<p>Las etiquetas y los apuntes son datos tuyos, no del PJN: quedan en el almacén de Tampermonkey de esta PC y no se escriben en ningún expediente. Hoy hay <b>' +
      plural(et.length, 'etiqueta', 'etiquetas') + '</b> y <b>' + plural(marcadas, 'causa marcada', 'causas marcadas') + '</b>.</p>' +
      '<h3>Copia de respaldo</h3>' +
      '<p>' + (d === null ? 'Todavía no se exportó ninguna copia.' : 'Última copia: <b>' + soloFecha(RESPALDO.fecha) + '</b> (' + (d === 0 ? 'hoy' : d === 1 ? 'hace 1 día' : 'hace ' + d + ' días') + ').') +
      ' Si se limpia el navegador o se reinstala Tampermonkey, lo que no esté en una copia se pierde. La copia se hace a mano: no hay guardado automático.</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="exportar">Exportar etiquetas, apuntes y notas</button>' +
      '<button class="sj-b" data-a="importar">Importar desde un archivo</button></div>' +
      '<p style="color:#6b7c85;font-size:12px">La copia lleva las etiquetas, los apuntes y el registro de dejar nota de cada causa. La importación no pisa nada: suma las etiquetas que falten, si un apunte es distinto conserva los dos, y de cada causa deja el resultado de nota más nuevo. El archivo sale sin cifrar: guardalo donde guardes cualquier otro papel de trabajo.</p>' +
      '<h3>Etiquetas</h3>' +
      (et.length
        ? '<table class="lista">' + et.map((e) => '<tr><td><span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span></td>' +
          '<td style="color:#6b7c85">' + plural(usoDe(e.id), 'causa', 'causas') + '</td>' +
          '<td style="text-align:right;width:1%;white-space:nowrap"><button class="sj-b chico" data-a="borrarEt" data-id="' + esc(e.id) + '">Eliminar</button></td></tr>').join('') + '</table>'
        : '<p style="color:#6b7c85">Todavía no hay etiquetas. Se crean tocando la columna Etiquetas de cualquier causa.</p>') +
      '</div>';
  }

  // ------------------------------------------------ revisar el PJN

  const DIAG = { estado: 'nada', items: [], fecha: 0 };

  const marcaDiag = (i) => (i.aviso || (i.ok === true ? 'bien' : i.ok === false ? 'cambió' : 'no se probó'));

  const informeDiag = () => 'SuPJN+ ' + APP.version + ' · revisión del PJN · ' + fechaHora(DIAG.fecha) + '\n' +
    DIAG.items.map((i) => '[' + marcaDiag(i) + '] ' + i.nombre + ': ' + i.detalle).join('\n');

  function diagHTML() {
    if (DIAG.estado === 'nada') return '';
    const clase = (i) => (i.ok === true ? 'ok' : i.ok === false ? 'mal' : 'duda');
    let h = '<table class="lista">' + DIAG.items.map((i) => '<tr><td style="white-space:nowrap;width:1%;padding-right:12px"><span class="sj-res ' + clase(i) + '">' + esc(marcaDiag(i)) + '</span></td>' +
      '<td><b>' + esc(i.nombre) + '</b><br><span style="color:#5a7581">' + esc(i.detalle) + '</span></td></tr>').join('') + '</table>';
    if (DIAG.estado === 'corriendo') return h + '<p style="margin-top:8px">Revisando en segundo plano, sin dejar notas ni cambiar nada...</p>' +
      '<div class="bts"><button class="sj-b" data-a="cortarDiag">Cortar la revisión</button></div>';
    const aviso = DIAG.items.find((i) => i.aviso);
    const cambios = DIAG.items.filter((i) => i.ok === false && !i.aviso).length;
    const sinProbar = DIAG.items.filter((i) => i.ok !== true && i.ok !== false).length;
    const partes = [];
    const aMedias = DIAG.items.length > 1;
    if (aviso) partes.push(aviso.aviso === 'venció'
      ? 'La sesión del PJN venció' + (aMedias ? ' y la revisión quedó a medias' : '') + ': recargá la página, volvé a entrar si lo pide y tocá de nuevo "Revisar el PJN".'
      : 'El navegador está sin conexión: probá de nuevo cuando vuelva.');
    if (cambios) partes.push('Hay ' + plural(cambios, 'cosa que cambió', 'cosas que cambiaron') + '. Copiá el informe y pasáselo a quien mantiene SuPJN+: no trae números de causa ni datos tuyos.');
    else if (!aviso) partes.push(sinProbar
      ? 'No encontré cambios en lo que se pudo probar (' + plural(sinProbar, 'cosa quedó', 'cosas quedaron') + ' sin probar).'
      : 'Todo lo que se pudo probar está en su lugar.');
    h += '<p style="margin-top:8px">' + partes.join(' ') + '</p>';
    if (aviso && !cambios) return h;
    return h + '<textarea class="sj-informe" readonly data-e="diagTexto">' + esc(informeDiag()) + '</textarea>' +
      '<div class="bts"><button class="sj-b" data-a="copiarDiag">Copiar el informe</button></div>';
  }

  function pintarDiag() {
    const e = q('[data-e="diag"]');
    if (e) e.innerHTML = diagHTML();
    const b = q('[data-a="diagnostico"]');
    if (b) { b.disabled = DIAG.estado === 'corriendo'; b.textContent = DIAG.estado === 'corriendo' ? 'Revisando...' : 'Revisar el PJN'; }
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
      '<h3>¿Algo dejó de andar?</h3>' +
      '<p>SuPJN+ depende de cómo está armada la página del PJN. Si el PJN la cambia, algo puede dejar de andar. Este botón revisa, una por una y sin dejar notas ni cambiar nada, las piezas que SuPJN+ necesita (la tabla de causas, el paginador, el enlace para abrir, lo de dejar nota, la tabla de actuaciones y un PDF) y dice cuáles cambiaron.</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="diagnostico"' + (DIAG.estado === 'corriendo' ? ' disabled' : '') + '>' + (DIAG.estado === 'corriendo' ? 'Revisando...' : 'Revisar el PJN') + '</button></div>' +
      '<div data-e="diag">' + diagHTML() + '</div>' +
      '<h3>Qué no hace</h3>' +
      '<p>No deja notas sin que lo confirmes, no presenta escritos, no cambia favoritos y no sube nada. Los apuntes son notas privadas de trabajo: se llaman así para no confundirlos con dejar nota, que es el acto procesal.</p>' +
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
      // Si hay una revisión en curso, que el botón vuelva a mostrarse ocupado.
      pintarDiag();
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
        errores.push(LISTAS[tipo].nombre + ': ' + mensajeDe(e));
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
      pintarOrdenPJN();
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
    if (DIAG.estado === 'corriendo') { avisar('Estoy revisando el PJN: esperá a que termine, o cortá la revisión en Acerca de.', true); return true; }
    if (accionEnCurso) { avisar('Esperá un momento: estoy abriendo otra causa.', true); return true; }
    return false;
  }

  // Pestañas nuevas que todavía esperan la dirección. Si esta pestaña cambia de
  // página antes, se les deja dicho qué pasó en vez de quedar colgadas.
  const PENDIENTES = new Set();

  function pestanaNueva(nombre, k) {
    const w = window.open('', nombre || '_blank');
    if (!w) { avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true); return null; }
    try {
      w.document.title = 'SuPJN+';
      w.document.body.innerHTML = '<p style="font:15px Segoe UI,Arial,sans-serif;padding:24px;color:#14416f">SuPJN+ está abriendo ' + esc(k) + '...</p>';
    } catch (e) { /* la pestaña puede no dejarse escribir */ }
    PENDIENTES.add(w);
    return w;
  }

  const listaPestana = (w) => { PENDIENTES.delete(w); };
  const cerrarPestana = (w) => { PENDIENTES.delete(w); try { if (w) w.close(); } catch (e) { /* ya cerrada */ } };

  async function abrirCausa(k, nueva) {
    if (ocupado()) return;
    const w = nueva ? pestanaNueva('_blank', k) : null;
    if (nueva && !w) return;
    accionEnCurso = true;
    try {
      const url = await direccionDe(k, 'ojo', (t) => avisar(t));
      if (w) { listaPestana(w); w.location.replace(url); avisar('Abrí ' + k + ' en una pestaña nueva.'); }
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
      listaPestana(w);
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
      const { accion, campos } = await conMarco(async () => {
        const u = await ubicarCausa(k, (t) => avisar(t), true);
        const a = enlaceMenu(u.tr, /presentar escrito/i);
        if (!a) throw new Error('la fila no tiene "Presentar escrito"');
        const p = paramsDeEnlace(a);
        const form = p && u.fr.contentDocument.getElementById(p.formId);
        if (!form) throw new Error('no encuentro el formulario del PJN');
        const lista = [];
        new u.fr.contentWindow.FormData(form).forEach((v, n) => { if (typeof v === 'string') lista.push([n, v]); });
        p.pares.forEach(([n, v]) => lista.push([n, v]));
        return { accion: form.action, campos: lista };
      });
      listaPestana(w);
      enviarEnPestana(w, accion, campos);
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

  // Durante una tanda de dejar nota la página se recarga en cada nota: una
  // descarga en curso se cortaría, y su aviso de salida frenaría la tanda.
  function sinBajarPorNota() {
    if (!bloqueoNota()) return false;
    avisar('Durante una tanda de dejar nota no se baja nada: esperá a que termine o cortala.', true);
    return true;
  }

  function bajarCausas(claves) {
    if (sinBajarPorNota()) return;
    if (claves.length > TOPE_DESCARGAS) {
      avisar('Son demasiadas de una vez: el tope es ' + TOPE_DESCARGAS + ' causas. Elegí hasta ' + TOPE_DESCARGAS + ' y, cuando terminen, seguí con las demás.', true);
      return;
    }
    const n = encolarCausas(claves, 'todo');
    avisar(n ? plural(n, 'causa agregada', 'causas agregadas') + ' a Descargas. Se bajan de a una en segundo plano: podés seguir trabajando en esta pestaña.' : 'Esas causas ya estaban en Descargas.');
    pintarSolapas();
  }

  function elegirActuaciones(k) {
    if (sinBajarPorNota()) return;
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

  // El alto y el ancho útiles de la página, sin contar las barras del navegador:
  // con innerWidth la ventana se metía abajo de la barra de costado de Chrome y
  // las dos barras quedaban una encima de la otra.
  const anchoPantalla = () => (document.documentElement && document.documentElement.clientWidth) || innerWidth;
  const altoPantalla = () => (document.documentElement && document.documentElement.clientHeight) || innerHeight;

  // Que la ventana entre entera en la pantalla: los botones de la barra y la
  // esquina para agrandar tienen que quedar a la vista.
  function acomodarVentana() {
    if (!win) return;
    medidas();
    if (CFG.maxi || win.style.display === 'none') return;
    const W = anchoPantalla(), H = altoPantalla();
    const r = geom();
    if (r.w > W - 8) fijarGeom({ w: W - 8 });
    if (r.h > H - 8) fijarGeom({ h: H - 8 });
    const r2 = geom();
    if (r2.x + r2.w > W - 4) fijarGeom({ x: Math.max(4, W - r2.w - 4) });
    else if (r2.x < 0) fijarGeom({ x: 4 });
    if (r2.y + r2.h > H - 4) fijarGeom({ y: Math.max(4, H - r2.h - 4) });
    else if (r2.y < 0) fijarGeom({ y: 4 });
  }

  // Zoom de la ventana: la ventana no se mueve ni cambia de tamaño en pantalla;
  // lo que cambia es el tamaño de lo que hay adentro y cuánto entra.
  // Maximizada el tamaño lo pone el CSS con estas dos variables, corregidas por
  // el zoom para que la ventana siga midiendo lo que mide la pantalla.
  // También los mínimos de la ventana van corregidos por el zoom: el CSS los
  // aplica en píxeles locales y con zoom 2 la ventana no bajaba de 1040 px.
  function medidas() {
    const z = zoomAct();
    win.style.setProperty('--sj-w', anchoPantalla() / z + 'px');
    win.style.setProperty('--sj-h', altoPantalla() / z + 'px');
    win.style.minWidth = Math.min(520, Math.max(200, anchoPantalla() - 8)) / z + 'px';
    win.style.minHeight = Math.min(320, Math.max(160, altoPantalla() - 8)) / z + 'px';
  }

  function aplicarZoom(repintar, zAnterior) {
    if (!win) return;
    // Minimizada no hay nada en pantalla que conservar: medirla daría cero.
    const r = (CFG.maxi || win.style.display === 'none') ? null : geom();
    // Maximizada, la posición y el tamaño de restaurar quedaron escritos con el
    // zoom anterior: se pasan al nuevo para que restaurar vuelva al mismo lugar.
    if (!r && zAnterior && zAnterior !== zoomAct()) {
      const f = zAnterior / zoomAct();
      ['left', 'top', 'width', 'height'].forEach((p) => {
        const v = parseFloat(win.style[p]);
        if (!isNaN(v)) win.style[p] = v * f + 'px';
      });
    }
    win.style.zoom = zoomAct() === 1 ? '' : String(zoomAct());
    medidas();
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
    const antes = zoomAct();
    CFG.zoom = nuevo;
    guardarCfg();
    aplicarZoom(true, antes);
  }

  // Pedido del autor: la posición no se guarda; arranca siempre en su lugar.
  // El tamaño elegido sí queda, uno para las listas y otro para el expediente.
  function ubicarVentana() {
    const W = anchoPantalla(), H = altoPantalla();
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
    // Abrir la ventana es el momento de mirar: si la lectura quedó vieja, se rehace.
    setTimeout(refrescarSiHaceFalta, 0);
    alertaPastilla = '';
    // Si el navegador cambió de tamaño mientras estaba minimizada.
    acomodarVentana();
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
    if (!CFG.maxi) acomodarVentana();
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
      '<button class="fn" data-a="recargarApp" title="Volver a cargar la página del PJN y arrancar SuPJN+ de cero">Recargar</button>' +
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
      '<input type="text" data-f="texto" placeholder="Buscar en cualquier campo, incluidos etiquetas y apuntes">' +
      '<select data-f="fuero" title="Fuero"></select>' +
      '<select data-f="sit" title="Situación"></select>' +
      '<select data-f="tramite" title="Trámite"><option value="todas">En trámite y fuera de trámite</option>' +
      '<option value="si">Solo en trámite</option><option value="no">Solo fuera de trámite</option></select>' +
      '<select data-f="etiqueta" title="Etiqueta"></select>' +
      '<label>Últ. act. <input type="date" data-f="desde" title="Desde"></label>' +
      '<label>a <input type="date" data-f="hasta" title="Hasta"></label>' +
      '<button class="sj-b" data-a="limpiar">Limpiar filtros</button>' +
      // A la derecha, separado de los filtros, lo que cambia cómo se ve la tabla.
      '<span class="der"><button class="sj-b" data-a="menuCols">Columnas ▾</button>' +
      '<button class="sj-b" data-a="ordenPJNlista2" data-e="ordenPJN" title="Orden PJN: las muestra en el mismo orden en que las manda el PJN cuando se le pide la lista ordenada por FECHA, que es como las ves en el sitio.">Orden PJN</button>' +
      '<button class="sj-b" data-a="horas" title="Baja el último documento firmado de las causas que empatan en la fecha y le lee la hora a la firma. De a cinco, con tope de quince.">Averiguar la hora</button>' +
      '<button class="sj-b" data-a="ordenPJNLista" data-e="ordenCrono" title="Orden cronológico: por la última actuación, de la más nueva a la más vieja. Con la misma fecha, las causas quedan en el orden que manda el PJN, que desempata por la hora. Es el orden con el que arranca la app.">Orden cronológico</button></span>' +
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
          x: Math.max(120 - r.w, Math.min(anchoPantalla() - 120, r.x + ev.clientX - sx)),
          y: Math.max(0, Math.min(altoPantalla() - 38, r.y + ev.clientY - sy))
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
          w: Math.max(520, Math.min(anchoPantalla() - r.x - 2, r.w + ev.clientX - sx)),
          h: Math.max(320, Math.min(altoPantalla() - r.y - 2, r.h + ev.clientY - sy))
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
        const escrito = parseInt(c.style.width, 10);
        base[c.dataset.col] = Math.max(minCol(tab, c.dataset.col), escrito || Math.round(c.getBoundingClientRect().width / zoomAct()));
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

    // Al escribir en una búsqueda se espera un instante después de la última
    // letra antes de redibujar; los desplegables y las fechas van al toque.
    const ESPERA_BUSQUEDA = 120;
    let tBuscar = null, tElegir = null;

    // filtros de la lista
    win.querySelector('.sj-barra').addEventListener('input', (e) => {
      const f = e.target.dataset && e.target.dataset.f;
      if (!f) return;
      CFG[f] = e.target.value;
      PAGINA_VISTA[VISTA === 'fav' ? 'fav' : 'rel'] = 1;
      abierta = null;
      clearTimeout(tBuscar);
      const aplicar = () => { guardarCfg(); pintarTabla(); };
      if (f === 'texto') tBuscar = setTimeout(aplicar, ESPERA_BUSQUEDA); else aplicar();
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
      clearTimeout(tElegir);
      const aplicar = () => {
        const actual = q('[data-elegir="' + id + '"] [data-ef="' + ef + '"]');
        const enFoco = !!actual && actual === document.activeElement;
        const pos = enFoco ? actual.selectionStart : null;
        pintarElegir(id);
        const nuevo = q('[data-elegir="' + id + '"] [data-ef="' + ef + '"]');
        if (nuevo && enFoco) { nuevo.focus(); try { if (ef === 'texto') nuevo.setSelectionRange(pos, pos); } catch (x) { /* fecha */ } }
      };
      if (ef === 'texto') tElegir = setTimeout(aplicar, ESPERA_BUSQUEDA); else aplicar();
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
        avisar('Importadas ' + plural(r.filas, 'causa marcada', 'causas marcadas') + '. Quedan ' + plural(r.etiquetas, 'etiqueta', 'etiquetas') + '.' +
          (r.notas ? ' Se sumaron ' + plural(r.notas, 'nota dejada', 'notas dejadas') + '.' : ''));
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

    window.addEventListener('pagehide', () => {
      PENDIENTES.forEach((w) => {
        try { w.document.body.innerHTML = '<p style="font:15px Segoe UI,Arial,sans-serif;padding:24px;color:#8c1d18">SuPJN+ no llegó a abrir la causa: la pestaña del PJN cambió de página antes. Cerrá esta pestaña y probá de nuevo.</p>'; } catch (e) { /* ya no se deja escribir */ }
      });
    });

    // Al volver a esta pestaña se releen etiquetas, anotaciones y resultados de
    // dejar nota, por si se cambiaron desde otra.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      guardarNotaAbierta();
      refrescarMarcas();
      refrescarNotas();
      // Lo propio ya quedó guardado: los campos abiertos toman lo último guardado,
      // así redibujar no pisa lo que se anotó en la otra pestaña.
      if (win) win.querySelectorAll('[data-marca] .sj-nota').forEach((t) => { t.value = marcaDe(t.closest('[data-marca]').dataset.marca).nota || ''; });
      if (win && win.style.display !== 'none' && !menuAbierto) pintarTodo();
      // Al volver a esta pestaña, si las listas quedaron viejas se leen de nuevo.
      refrescarSiHaceFalta();
    });

    // Mientras haya descargas, salir de la página las corta: el navegador avisa.
    window.addEventListener('beforeunload', (e) => {
      if (!bajandoAlgo()) return;
      e.preventDefault();
      e.returnValue = '';
    });
    return true;
  }

  // Baja una sola actuación, sin tocar lo que haya elegido: va como un trabajo
  // más de la cola, con nombre propio de archivo.
  function bajarUnaActuacion(id, i) {
    if (sinBajarPorNota()) return;
    const ctx = ctxElegir(id);
    const a = ctx && ctx.acts && ctx.acts[i];
    if (!a) return;
    const d = (id === 'exp' ? EXP.datos : COLA.find((x) => x.id === id)) || {};
    const exp = d.exp || '';
    const ya = COLA.find((x) => x.una && x.urls && x.urls[0] === a.url && /a bajar|bajando/.test(x.estado));
    if (ya) { avisar('Esa actuación ya se está bajando.'); return; }
    const partes = [nombreArchivo(exp), (a.fecha || '').replace(/\//g, '-'), a.tipo || ''].filter(Boolean);
    nuevoTrabajo({
      exp, car: d.car || '', modo: 'seleccion', origen: 'una', acts: [a], urls: [a.url], parcial: true, una: true,
      nombre: partes.join('-').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim(),
      estado: 'a bajar', texto: 'Esperando turno...'
    });
    avisar('Bajando la actuación' + (a.fecha ? ' del ' + a.fecha : '') + '. Se ve en Descargas.');
    pintarSolapas();
    procesarCola();
  }

  function trabajoDesdeElegir(id, urls, parcial) {
    if (sinBajarPorNota()) return;
    if (id === 'exp') {
      const d = EXP.datos || {};
      // Un doble clic no baja dos veces lo mismo.
      const igual = COLA.find((x) => x.origen === 'exp' && x.exp === (d.exp || '') && /a bajar|bajando/.test(x.estado) &&
        x.urls && x.urls.length === urls.length && x.urls.every((u, i) => u === urls[i]));
      if (igual) { avisar('Eso ya se está bajando.'); return; }
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
      if (a === 'bajarUna') { bajarUnaActuacion(id, parseInt(ea.dataset.i, 10)); return; }
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
        CFG[T.ocultas] = T.def.filter((c) => c.oculta).map((c) => c.k);
        CFG[T.anchos] = {};
        guardarCfg();
        repintarTabla(tab);
        return;
      }
      case 'ordenPJNLista': {
        // Como el PJN: por fecha de la última actuación, de la más nueva a la más
        // vieja, y con la misma fecha en el orden en que las manda el sitio.
        const yaEstaba = CFG.orden.col === 'ult' && CFG.orden.desc !== false;
        CFG.orden = { col: 'ult', desc: true };
        guardarCfg();
        PAGINA_VISTA.rel = 1;
        PAGINA_VISTA.fav = 1;
        pintarTabla();
        pintarFiltros();
        const cuerpo = q('.sj-cuerpo');
        if (cuerpo) cuerpo.scrollTop = 0;
        // El PJN no manda la hora: si hay causas que empatan en la fecha y todavía
        // no se les averiguó, se ofrece hacerlo (baja el último documento de cada una).
        const faltan = causasSinHora();
        avisar((yaEstaba
          ? 'Ya estaban en orden cronológico: por última actuación, de la más nueva a la más vieja.'
          : 'Ordenadas por última actuación, de la más nueva a la más vieja.') +
          (faltan.length ? ' Hay ' + plural(faltan.length, 'causa que empata', 'causas que empatan') + ' en la fecha y sin hora: tocá "Averiguar la hora" para leerla del último documento firmado.' : ''));
        return;
      }
      case 'ordenPJNlista2': {
        // El orden en que las manda el PJN (la lista se lee pidiéndosela por fecha).
        CFG.orden = { col: '', desc: false };
        guardarCfg();
        PAGINA_VISTA.rel = 1;
        PAGINA_VISTA.fav = 1;
        pintarTabla();
        pintarFiltros();
        const c2 = q('.sj-cuerpo');
        if (c2) c2.scrollTop = 0;
        avisar('En el orden en que las manda el PJN.');
        return;
      }
      case 'horas': averiguarHoras(); return;
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
      case 'usarLista': irALista(b.dataset.lista); pintarTodo(); return;
      case 'verSolapa': {
        const clave = b.dataset.sol;
        const s = EXP.solapas[clave];
        if (!s) return;
        if (b.dataset.otra) { s.estado = 'nada'; s.abierta = true; } else s.abierta = !s.abierta;
        if (s.abierta && s.estado === 'nada') leerSolapa(clave);
        else pintarSolapaExp(clave);
        return;
      }
      case 'abrirVinc': abrirVinculado(k, false); return;
      case 'abrirVincNueva': abrirVinculado(k, true); return;
      case 'bajarVinc': bajarVinculado(k); return;
      case 'diagnostico': revisarPJN(); return;
      case 'cortarDiag': cortarDiag(); return;
      case 'copiarDiag': {
        const t = q('[data-e="diagTexto"]');
        if (!t) return;
        const copiado = () => avisar('Informe copiado.');
        const aMano = () => {
          t.select();
          let fue = false;
          try { fue = document.execCommand('copy'); } catch (x) { fue = false; }
          if (fue) copiado(); else avisar('Seleccioná el texto del informe y copialo con Ctrl+C.');
        };
        try { window.navigator.clipboard.writeText(t.value).then(copiado, aMano); } catch (x) { aMano(); }
        return;
      }
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
      case 'seguirAhora': saltarPausa(); return;
      case 'cortarCola': cortarCola = true; COLA.forEach((x) => { if (x.estado === 'en cola' || x.estado === 'a bajar') { x.estado = 'cortado'; x.texto = 'Cortado por vos.'; } }); pintarDescargas(); return;
      case 'limpiarCola':
        for (let i = COLA.length - 1; i >= 0; i--) if (/listo|error|cortado/.test(COLA[i].estado)) COLA.splice(i, 1);
        pintarDescargas();
        return;
      case 'volverLista': location.href = RUTA.rel; return;
      case 'recargar': location.reload(); return;
      case 'recargarApp': {
        // Recargar corta lo que esté en curso: si hay trabajo, se pide confirmar.
        if ((bloqueoNota() || bajandoAlgo()) && !b.classList.contains('peligro')) {
          b.classList.add('peligro');
          b.textContent = 'Confirmar: se corta lo que está en curso';
          avisar('Hay trabajo en curso (dejar nota o descargas). Si recargás, se corta.', true);
          return;
        }
        location.reload();
        return;
      }
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

  // ---------------------------------------------------- la hora del documento
  //
  // El PJN no manda la hora en ninguna pantalla, pero las resoluciones y los
  // escritos van firmados y la firma la lleva. Para las causas que empatan en la
  // fecha se baja el último documento y se le lee la hora de la firma.

  let horasEnCurso = false;

  // Causas de la vista que empatan en fecha con otra y todavía no tienen hora.
  function causasSinHora() {
    const porFecha = {};
    filtradas().forEach((c) => { (porFecha[c.ult] = porFecha[c.ult] || []).push(c); });
    const out = [];
    Object.keys(porFecha).sort((a, b) => numFecha(b) - numFecha(a)).forEach((f) => {
      if (porFecha[f].length < 2) return;
      porFecha[f].forEach((c) => {
        const h = HORAS[c.exp];
        if (!h || h.f !== c.ult) out.push(c.exp);
      });
    });
    return out.slice(0, TOPE_DESCARGAS);
  }

  async function averiguarHoras() {
    if (horasEnCurso) return;
    if (sinBajarPorNota() || ocupado()) return;
    const claves = causasSinHora();
    if (!claves.length) { avisar('No hay causas que empaten en la fecha sin hora averiguada.'); return; }
    horasEnCurso = true;
    let hechas = 0, fallas = 0, cortado = '';
    for (let i = 0; i < claves.length; i++) {
      if (i && i % BLOQUE_DESCARGAS === 0) {
        estadoTxt('Respiro de ' + Math.round(PAUSA_BLOQUE / 1000) + ' segundos para no saturar al PJN...');
        await dormir(PAUSA_BLOQUE);
      }
      const k = claves[i];
      estadoTxt('Averiguando la hora de ' + k + ' (' + (i + 1) + ' de ' + claves.length + ')...');
      try {
        const a = await ultimaActuacionConPDF(k, () => { /* sin avisos */ });
        if (!a) { fallas++; continue; }
        const r = await traerPDF(a.url);
        if (r && r.vencida) { cortado = VENCIDA; break; }
        const h = r && r.buf ? horaDePDF(r.buf) : null;
        if (!h) { fallas++; continue; }
        guardarHora(k, { f: h.f, hh: h.hh, t: Date.now(), origen: h.origen });
        hechas++;
        if (esVistaLista()) pintarTabla();
      } catch (e) {
        fallas++;
        if (String(e && e.message) === VENCIDA) { cortado = VENCIDA; break; }
      }
    }
    horasEnCurso = false;
    if (esVistaLista()) { pintarTabla(); pintarEstado(); }
    avisar(cortado ? 'Se cortó: ' + cortado + '.'
      : plural(hechas, 'hora averiguada', 'horas averiguadas') +
        (fallas ? '. En ' + plural(fallas, 'causa', 'causas') + ' no se pudo: la última actuación puede no tener documento firmado.' : '.') +
        (hechas ? ' ' + compararConElPJN() : ''), !!cortado);
  }

  // ¿El PJN ordena por la hora de la firma? Se compara, con las causas que
  // empatan en la fecha y ya tienen hora, el orden en que las manda el PJN contra
  // el orden de las horas. Es la única forma de saberlo: el criterio no lo publica.
  function compararConElPJN() {
    const porFecha = {};
    filtradas().forEach((c) => {
      const h = HORAS[c.exp];
      if (!h || h.f !== c.ult || c.pos == null) return;
      (porFecha[c.ult] = porFecha[c.ult] || []).push({ pos: c.pos, hh: h.hh });
    });
    let grupos = 0, coinciden = 0, pares = 0, bien = 0;
    Object.keys(porFecha).forEach((f) => {
      const g = porFecha[f];
      if (g.length < 2) return;
      grupos++;
      g.sort((a, b) => a.pos - b.pos);
      let ok = true;
      for (let i = 1; i < g.length; i++) {
        pares++;
        if (g[i - 1].hh >= g[i].hh) bien++; else ok = false;
      }
      if (ok) coinciden++;
    });
    if (!grupos) return 'Todavía no hay dos causas del mismo día con hora para comparar el orden del PJN.';
    if (coinciden === grupos) return 'El orden del PJN coincide con la hora de la firma en ' + plural(grupos, 'grupo de causas del mismo día', 'grupos de causas del mismo día') + ': ordena por esa hora.';
    return 'El orden del PJN coincide con la hora de la firma en ' + bien + ' de ' + pares + ' comparaciones (' + coinciden + ' de ' + grupos + ' grupos enteros): no ordena por la hora de la firma, sino por otra cosa, probablemente la hora en que se cargó el movimiento.';
  }

  // ------------------------------------------- las otras solapas del expediente

  async function leerSolapa(clave, auto) {
    const s = EXP.solapas[clave];
    if (!s || s.estado === 'leyendo') return;
    if (!auto) s.abierta = true;
    if (!CID_PAGINA) {
      s.estado = 'error';
      s.texto = 'No encuentro el número de la consulta (cid) en la dirección de la página: recargala desde la lista.';
      pintarSolapaExp(clave);
      return;
    }
    s.estado = 'leyendo';
    s.texto = 'Pidiéndoselo al PJN...';
    pintarSolapaExp(clave);
    try {
      const r = await leerSolapaExp(CID_PAGINA, clave, (t) => { s.texto = t; pintarSolapaExp(clave); });
      s.cabs = r.cabs;
      s.filas = r.filas;
      s.fecha = Date.now();
      s.estado = 'listo';
      s.texto = '';
    } catch (e) {
      s.estado = 'error';
      s.texto = 'No se pudo leer ' + TITULO_SOLAPA[clave] + ': ' + mensajeDe(e) + '.';
    }
    pintarSolapaExp(clave);
  }

  async function abrirVinculado(k, nueva) {
    if (ocupado()) return;
    const w = nueva ? pestanaNueva('_blank', k) : null;
    if (nueva && !w) return;
    accionEnCurso = true;
    try {
      const url = await direccionVinculado(CID_PAGINA, k, (t) => avisar(t));
      if (w) { listaPestana(w); w.location.replace(url); avisar('Abrí ' + k + ' en una pestaña nueva.'); }
      else { avisar('Abro ' + k + '...'); location.href = url; }
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  async function bajarVinculado(k) {
    if (sinBajarPorNota() || ocupado()) return;
    accionEnCurso = true;
    try {
      const url = await direccionVinculado(CID_PAGINA, k, (t) => avisar(t));
      const cid = new URL(url).searchParams.get('cid');
      nuevoTrabajo({ exp: k, car: '', modo: 'todo', cid, estado: 'en cola', texto: 'En cola' });
      avisar(k + ' se agregó a Descargas. Se baja en segundo plano.');
      pintarSolapas();
      procesarCola();
    } catch (e) {
      avisar('No se pudo bajar ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  // ------------------------------------------------ revisar el PJN
  //
  // Mira, en solo lectura y en marcos ocultos, las piezas del PJN de las que
  // depende SuPJN+ y dice cuáles están y cuáles cambiaron. No deja notas, no
  // pone el filtro de dejar nota y no guarda nada. El informe no lleva números
  // de causa.

  let diagN = 0;

  function cortarDiag() {
    if (DIAG.estado !== 'corriendo') return;
    diagN++;                                   // lo que quede corriendo ya no anota nada
    DIAG.items.push({ nombre: 'Revisión', ok: null, detalle: 'la cortaste vos', aviso: '' });
    DIAG.estado = 'listo';
    pintarDiag();
  }

  async function revisarPJN() {
    if (DIAG.estado === 'corriendo') { pintarDiag(); return; }
    if (bloqueoNota()) { avisar('Hay una tanda de dejar nota en curso: revisá el PJN cuando termine.', true); return; }
    const mia = ++diagN;
    const vivo = () => diagN === mia;
    DIAG.estado = 'corriendo';
    DIAG.items = [];
    DIAG.fecha = Date.now();
    // aviso: algo que impide revisar (la sesión venció, no hay internet) y que
    // no es un cambio del PJN.
    const anotar = (nombre, ok, detalle, aviso) => {
      if (!vivo()) return;
      DIAG.items.push({ nombre, ok, detalle: sinNumeroDeCausa(detalle), aviso: aviso || '' });
      pintarDiag();
    };
    const esVencida = (e) => String(e && e.message ? e.message : e) === VENCIDA;
    // Un error puede ser un cambio del PJN, pero también la sesión vencida o
    // datos viejos: eso no se anuncia como cambio.
    const fallo = async (nombre, e) => {
      sesionMirada.ts = 0;
      if (esVencida(e) || (await sesionVencida())) { anotar(nombre, false, 'la sesión del PJN venció en medio de la revisión', 'venció'); return; }
      const m = String(e && e.message ? e.message : e);
      if (/no encuentro .* en (las listas|Relacionados)/i.test(m)) anotar(nombre, null, 'la causa de prueba ya no está en la lista: actualizá las listas y revisá de nuevo');
      else anotar(nombre, false, mensajeDe(e));
    };
    // Los marcos de la revisión aceptan cualquier página del PJN: si cambió la
    // tabla, se quiere saber eso y no solo que la página "no era la esperada".
    const cualquiera = () => true;
    const diceSinCausas = (d) => /no se encontraron|no posee|sin resultados/i.test(limpio(textoPJN(d)).slice(0, 6000));
    const esFecha = (t) => /^\d{2}\/\d{2}\/\d{4}$/.test(t || '');
    pintarDiag();
    let fr = null;
    const soltar = () => { if (fr) { fr.remove(); fr = null; } };
    let primeras = new Set();
    try {
      if (window.navigator.onLine === false) { anotar('Conexión', false, 'el navegador está sin conexión a internet', 'sin conexión'); return; }
      sesionMirada.ts = 0;
      if (await sesionVencida()) { anotar('Sesión del PJN', false, 'venció: recargá la página, volvé a entrar si lo pide y probá de nuevo', 'venció'); return; }
      anotar('Sesión del PJN', true, 'activa');
      if (!vivo()) return;

      // La lista de Relacionados y lo que SuPJN+ usa de ella.
      fr = crearMarco();
      try {
        await esperarCarga(fr, () => { fr.src = RUTA.rel; }, cualquiera);
      } catch (e) {
        await fallo('Lista de Relacionados', e);
        return;
      }
      if (!vivo()) return;
      const d = fr.contentDocument;
      const esRel = tipoLista(d) === 'rel';
      anotar('Lista de Relacionados', esRel, esRel ? 'se abre y tiene su título' : 'se abre, pero no aparece el título "Lista de Expedientes Relacionados"');
      const tabla = tablaDe(d);
      const filas = filasDe(d);
      primeras = new Set(filas.map((f) => f.exp));
      const crudas = tabla ? filasTabla(tabla).filter((t) => t.cells && t.cells.length > 1).length : 0;
      if (tabla && filas.length) anotar('Tabla de causas', crudas === filas.length, crudas === filas.length
        ? plural(filas.length, 'causa', 'causas') + ' en la primera página, y se leen'
        : 'de ' + plural(crudas, 'fila', 'filas') + ' se leen ' + filas.length + ': puede haber cambiado alguna columna');
      else if (tabla && crudas) anotar('Tabla de causas', false, 'tiene filas, pero en ninguna se lee un número de expediente en la primera columna');
      else if (tabla) anotar('Tabla de causas', true, 'está, sin causas');
      else if (diceSinCausas(d)) anotar('Tabla de causas', null, 'el PJN dice que no hay causas: no se puede mirar la tabla');
      else anotar('Tabla de causas', false, 'no encuentro la tabla con "Expediente" y "Carátula" en el encabezado');
      if (filas.length) {
        const mal = [];
        if (filas.some((f) => /:/.test(f.exp))) mal.push('el número de expediente trae un rótulo pegado');
        if (!filas.some((f) => f.car)) mal.push('la carátula viene vacía en todas');
        // Que una causa nueva no tenga última actuación es normal; que ninguna
        // de las que tienen algo se lea como fecha, no.
        if (filas.some((f) => f.ult) && !filas.some((f) => esFecha(f.ult))) mal.push('la última actuación no se lee como fecha');
        anotar('Columnas de la lista', !mal.length, mal.length ? mal.join('; ') : 'expediente, dependencia, carátula, situación y última actuación se leen');
      }
      const pag = paginadorDe(d);
      anotar('Paginador', pag ? true : null, pag ? 'está' : 'no hay: la lista entra en una sola página');
      const casilla = casillaVerTodos(d), consultar = botonConsultar(d);
      anotar('"Ver todos los expedientes" y Consultar', !!(casilla && consultar), casilla && consultar ? 'están (sirven para leer las causas fuera de trámite)' : (casilla ? 'falta el botón Consultar' : 'falta la casilla "Ver todos los expedientes"'));
      const tr = filas[0] && filas[0].tr;
      if (tr) {
        const ojo = enlaceOjo(tr);
        const pr = ojo && paramsDeEnlace(ojo);
        const form = pr && d.getElementById(pr.formId);
        anotar('Enlace para abrir la causa', !!form, form ? 'está y se entiende' : (ojo ? (pr ? 'está, pero no encuentro su formulario' : 'está, pero cambió la forma del enlace') : 'no encuentro el ojo en la fila'));
        const libro = enlaceMenu(tr, /libro digital/i), escrito = enlaceMenu(tr, /presentar escrito/i);
        anotar('Libro digital y Presentar escrito', !!(libro && escrito), libro && escrito ? 'están en el menú de la fila' : 'falta ' + [libro ? '' : '"Libro digital"', escrito ? '' : '"Presentar escrito"'].filter(Boolean).join(' y '));
      } else {
        anotar('Enlace para abrir la causa', null, 'no hay causas en la lista para mirarlo');
      }
      // Las mismas búsquedas que usa el motor de dejar nota, sobre el marco.
      const filtro = botonFiltroNota(d), cartel = cartelNota(d), confirmar = botonConfirmar(d);
      const faltan = [filtro ? '' : 'el botón "Dejar nota"', cartel ? '' : 'el cartel de confirmación', confirmar ? '' : 'el botón Confirmar'].filter(Boolean);
      anotar('Dejar nota', !faltan.length, faltan.length ? 'falta ' + faltan.join(', ') : 'están el filtro, el cartel y Confirmar (el lápiz aparece con el filtro puesto, y eso no se prueba para no dejar ninguna nota)');
      soltar();

      // Favoritos.
      fr = crearMarco();
      try {
        await esperarCarga(fr, () => { fr.src = RUTA.fav; }, cualquiera);
        const df = fr.contentDocument;
        const esFav = tipoLista(df) === 'fav', seLee = !!tablaDe(df) || diceSinCausas(df);
        anotar('Lista de Favoritos', esFav && seLee, esFav && seLee ? 'se abre y se lee' : (!esFav ? 'se abre, pero no aparece el título "Lista de Expedientes Favoritos"' : 'se abre, pero no encuentro su tabla'));
      } catch (e) {
        await fallo('Lista de Favoritos', e);
        if (esVencida(e)) return;
      }
      soltar();
      if (!vivo()) return;

      // Un expediente: abrirlo, sus datos, sus actuaciones y un PDF. Se prueba
      // con una causa en trámite ya leída, mejor de la primera página.
      const leidas = (DATOS.rel && DATOS.rel.causas) || [];
      const causa = leidas.find((c) => c.tramite && primeras.has(c.exp)) || leidas.find((c) => c.tramite);
      if (!causa) {
        anotar('Abrir una causa', null, 'no hay causas en trámite leídas en Mis causas para probar');
        return;
      }
      let url = null;
      try {
        // Sin reusar el marco de trabajo que haya quedado de antes: la revisión
        // tiene que abrir la lista de nuevo y no mirar una copia vieja. Va en su
        // propio turno porque conMarco no se puede anidar.
        await conMarco(async () => { soltarMarcoTrabajo(); });
        url = await direccionDe(causa.exp, 'ojo', () => { /* sin avisos */ });
        anotar('Abrir una causa', true, 'se abre en segundo plano');
      } catch (e) {
        await fallo('Abrir una causa', e);
        return;
      }
      if (!vivo()) return;
      fr = crearMarco();
      try {
        await esperarCarga(fr, () => { fr.src = url; }, cualquiera);
      } catch (e) {
        await fallo('Página del expediente', e);
        return;
      }
      if (!vivo()) return;
      const de = fr.contentDocument;
      const dx = datosExpediente(de);
      anotar('Datos del expediente', !!dx.exp, !dx.exp ? 'no encuentro "Expediente:" en los datos generales' : dx.car ? 'se leen el número y la carátula' : 'se lee el número, pero no la carátula');
      const ta = tablaActuaciones(de);
      const acts = actuacionesDe(de, false);
      anotar('Tabla de actuaciones', !!ta, ta ? (acts.length ? plural(acts.length, 'actuación', 'actuaciones') + ' con PDF en la primera página' : 'está, sin actuaciones con PDF en la primera página') : 'no encuentro la tabla con "Fecha" y "Tipo" en el encabezado');
      if (acts.length) {
        const conFecha = acts.some((a) => esFecha(a.fecha));
        const conTipo = acts.some((a) => a.tipo);
        const rotulo = acts.some((a) => /:/.test(a.fojas));
        anotar('Columnas de las actuaciones', conFecha && conTipo && !rotulo,
          !conFecha ? 'la fecha no se lee como día/mes/año' : !conTipo ? 'el tipo de actuación viene vacío' : rotulo ? 'aparecen rótulos pegados a los valores: el PJN cambió cómo los marca' : 'fecha, tipo de actuación, descripción y fojas se leen');
        // Hasta tres actuaciones: alguna puede no tener un PDF de verdad.
        const n = Math.min(3, acts.length);
        let pdf = null;
        for (let i = 0; i < n && vivo() && !(pdf && (pdf.buf || pdf.vencida)); i++) pdf = await traerPDF(acts[i].url);
        if (pdf && pdf.vencida) anotar('Bajar un PDF', false, 'la sesión del PJN venció en medio de la revisión', 'venció');
        else if (pdf && pdf.buf) anotar('Bajar un PDF', true, 'llega un PDF de ' + Math.max(1, Math.round(pdf.buf.byteLength / 1024)) + ' KB');
        else anotar('Bajar un PDF', false, 'no llegó un PDF de ' + (n === 1 ? 'la actuación probada' : 'ninguna de las ' + n + ' actuaciones probadas'));
      } else if (ta) {
        anotar('Columnas de las actuaciones', null, 'no hay actuaciones con PDF en la primera página para mirarlas');
        anotar('Bajar un PDF', null, 'no hay actuaciones con PDF en la primera página para probar');
      }
    } catch (e) {
      await fallo('Revisión', e);
    } finally {
      soltar();
      if (vivo()) { DIAG.estado = 'listo'; pintarDiag(); }
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
      // Las partes tienen que estar siempre a la vista: Intervinientes se lee sola,
      // sin abrir la sección. Vinculados y Recursos, recién cuando se los pide.
      leerSolapa('int', true);
    } catch (e) {
      EXP.estado = 'error';
      EXP.texto = 'No se pudieron leer las actuaciones: ' + mensajeDe(e) + '.';
    }
    pintarExpEstado();
    pintarElegir('exp');
  }

  // --------------------------------------------------------------- arranque

  // En el Portal del PJN: solo la pastilla, que lleva a la Consulta Web. Lo demás
  // no se puede hacer desde ahí, porque es otro sitio y el navegador no deja
  // leer las páginas del scw desde acá.
  function lanzadorPortal() {
    if (document.getElementById('supjn-pastilla')) return;
    const st = document.createElement('style');
    st.id = 'supjn-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
    const p = document.createElement('button');
    p.id = 'supjn-pastilla';
    p.type = 'button';
    p.title = 'Abrir SuPJN+ en la Consulta Web del PJN';
    const n = DATOS.rel ? DATOS.rel.total : null;
    p.innerHTML = 'SuPJN+' + (n == null ? '' : '<span class="cant">' + esc(String(n)) + '</span>');
    p.addEventListener('click', () => { location.href = 'https://scw.pjn.gov.ar' + RUTA.rel; });
    document.body.appendChild(p);
  }

  function arrancar() {
    if (EN_PORTAL) { lanzadorPortal(); return; }
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
        VISTA = 'nota';
        abrirVentana();
        avisar('No se pudo empezar a dejar nota: el PJN no mostró la lista de Relacionados.', true);
      }
    }

    if (EN_EXPEDIENTE) leerExpedienteActual().then(refrescarSiHaceFalta);
    else refrescarSiHaceFalta();
    // El "leídas hace..." tiene que envejecer solo, sin recargar nada.
    setInterval(() => { if (win && win.style.display !== 'none' && esVistaLista() && !leyendo) pintarEstado(); }, 60000);
    // La cuenta atrás del respiro entre bloques.
    setInterval(() => { if (pausaHasta && VISTA === 'desc' && win && win.style.display !== 'none') pintarDescargas(); }, 1000);
  }

  // Enganche para las pruebas unitarias. Solo existe en el sitio de pruebas
  // (pruebas.supjn.invalid, un dominio que no puede existir en la red); en el
  // PJN esta condición nunca se cumple y no hace nada.
  if (location.hostname === 'pruebas.supjn.invalid' && typeof window.__SUPJN_PRUEBAS__ === 'function') {
    window.__SUPJN_PRUEBAS__({
      limpio, norm, clave, fueroDe, numFecha, fechaPareja, ordenExp, isoACorta, plural, lasN, mensajeDe,
      mismoExpediente, textoVisible, sinRotulo, esPDF, sinNumeroDeCausa, partesDeCaratula, notas: () => NOTAS, normalizarNotas, normalizarMarcas, validarDatos,
      enterosExactos, anchosEncuadrados, repartirEncuadre, minCol, anchoDe, columnasVisibles, CFG, COLS_DEF, COLS_ACT_DEF, BLOQUE_DESCARGAS, TOPE_DESCARGAS,
      importarMarcas, marcas: () => MARCAS, valorOrdenAct, esMiTurno, resNota, acotarZoom, zoomVecino
    });
    return;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
