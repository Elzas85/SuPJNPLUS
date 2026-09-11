// ==UserScript==
// @name         SuPJN+ - Consulta Web del PJN ampliada
// @namespace    ignacio.kinbaum
// @version      0.1.0
// @description  Todo PJN+ (el expediente en un único PDF, completo o eligiendo, y NOTATOMIC para dejar nota en todos o en los que elijas) más una vista propia de la lista de expedientes relacionados, en trámite y fuera de trámite, con búsqueda, filtros por fuero, situación y fecha, orden por cualquier columna, y etiquetas y anotaciones propias con respaldo manual.
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
// @require      https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js#sha384=weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==
/*
 * SuPJN+ - Consulta Web del PJN ampliada
 * Incluye todo PJN+ (descarga y NOTATOMIC) y le suma la vista de causas.
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
 * CÓMO USARLO
 *   1) Instalar Tampermonkey en Chrome/Edge.
 *   2) Instalar este script.
 *   3) Entrar a scw.pjn.gov.ar, abrir el expediente (vista "Actuaciones").
 *   4) En el expediente, panel abajo a la derecha, tres solapas:
 *        · Descargar todo  -> baja el expediente completo en 1 PDF (original).
 *        · Elegir descarga -> arma una lista; elegís por fechas o a mano.
 *        · About           -> versión, autoría, licencia y repositorio.
 *
 *   5) En la lista de Relacionados, dos pastillas abajo a la derecha:
 *        · SuPJN+ CAUSAS    -> la vista propia de todas las causas.
 *        · SuPJN+ NOTATOMIC -> dejar nota en todos o en los que elijas.
 *
 * QUÉ CAPTURA: la solapa "Despachos/Escritos" de todas las páginas + todas las
 * actuaciones históricas. Las cédulas de "Notificaciones" son una vista aparte.
 * ===========================================================================
 */
/* global PDFLib */
(function () {
  'use strict';

  // Nunca dentro de un marco: SuPJN+ lee la lista en un marco oculto y ahi no
  // tiene que arrancar nada (ademas del @noframes de la cabecera).
  if (window.top !== window.self) return;

  // Este es el modulo de descarga: solo trabaja en la pantalla del expediente
  // y en la de actuaciones historicas. Notatomic, al final del archivo, se
  // ocupa de las listas.
  if (!/\/scw\/(expediente|actuacionesHistoricas)\.seam/i.test(location.pathname)) return;

  const APP = {
    nombre: 'SuPJN+ - Descargar expediente del PJN',
    version: 'beta 0.1.0',
    autor: 'Ignacio Kinbaum',
    anio: '2026',
    mail: 'estudiojuridicokinbaum@gmail.com',
    licencia: 'GPL-3.0-or-later',
    licenciaUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    github: 'https://github.com/Elzas85/SUPJNPLUS'
  };

  const KEY = '__pjn_dl_state';
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } };
  const save = (s) => sessionStorage.setItem(KEY, JSON.stringify(s));
  const clear = () => sessionStorage.removeItem(KEY);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const enHistoricas = () => location.pathname.includes('actuacionesHistoricas');
  const log = (...a) => console.log('%c[PJN]', 'color:#14416f;font-weight:bold', ...a);
  const escapar = (s) => (s || '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function parsearFecha(t) {
    const m = (t || '').match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
    if (!m) return null;
    let y = +m[3]; if (y < 100) y += 2000;
    const f = new Date(y, +m[2] - 1, +m[1]);
    return isNaN(f) ? null : f;
  }
  const fechaTxtDe = (t) => {
    const m = (t || '').match(/(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
    return m ? m[1] : '';
  };
  const yyyymmdd = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

  // ─────────────────────────────────────────────────────────────────────
  // Recolección: cada botón "Descargar" con la fila que lo contiene
  // ─────────────────────────────────────────────────────────────────────
  function entradasAqui() {
    const out = [];
    [...document.querySelectorAll('a')]
      .filter((a) => /descargar/i.test(a.textContent) && a.href)
      .forEach((a) => {
        const fila = a.closest('tr') || a.closest('li') || a.parentElement;
        const texto = ((fila ? fila.innerText : a.textContent) || '').replace(/\s+/g, ' ').trim();
        const fechaTexto = fechaTxtDe(texto);
        let desc = texto.replace(/descargar/ig, '').replace(/\bver\b/ig, '').trim();
        if (fechaTexto) desc = desc.replace(fechaTexto, '').trim();
        desc = desc.replace(/^[-–—•\s|]+/, '').slice(0, 160) || 'actuación';
        out.push({ url: a.href, fechaTexto, descripcion: desc });
      });
    return out;
  }

  function fusionar(catalogo, nuevas) {
    const vistas = new Set(catalogo.map((e) => e.url));
    nuevas.forEach((e) => { if (!vistas.has(e.url)) { vistas.add(e.url); catalogo.push(e); } });
  }

  // Recorre TODAS las páginas (paginación Bootstrap), como el script original.
  async function recorrerPaginas(catalogo, prefijo) {
    const p1 = [...document.querySelectorAll('ul.pagination a')].find((a) => a.textContent.trim() === '1');
    if (p1) { p1.click(); await wait(1600); }
    let guard = 0;
    while (guard++ < 500) {
      fusionar(catalogo, entradasAqui());
      ui.estado(`${prefijo}… (${catalogo.length} docs)`);
      const ul = document.querySelector('ul.pagination');
      if (!ul) break;
      const active = ul.querySelector('li.active');
      const cur = active ? (parseInt(active.textContent.trim()) || 1) : 1;
      let next = [...ul.querySelectorAll('li')]
        .find((li) => li.querySelector('a') && li.textContent.trim() === String(cur + 1));
      if (!next) {
        const lis = [...ul.querySelectorAll('li')];
        const ai = lis.indexOf(active);
        const hayMas = lis.some((li) => li.querySelector('a') && /^\d+$/.test(li.textContent.trim()) && parseInt(li.textContent.trim()) > cur);
        const trailing = ai >= 0 ? lis.slice(ai + 1).filter((li) => li.querySelector('a')) : [];
        next = (hayMas && trailing[0]) ? trailing[0] : null;
      }
      if (!next) break;
      next.querySelector('a').click();
      await wait(1700);
    }
  }

  function nombreArchivo() {
    const m = (document.body.innerText.match(/Expediente:\s*([A-Z]{0,4}\s*\d{4,6}\/\d{4})/) || [])[1];
    return m ? 'Expediente-' + m.replace(/[\s/]/g, '-') : 'Expediente';
  }

  // ─────────────────────────────────────────────────────────────────────
  // Descarga (con 1 reintento) y fusión de las URLs indicadas
  // ─────────────────────────────────────────────────────────────────────
  async function bajar(u) {
    for (let i = 0; i < 2; i++) {
      try { const r = await fetch(u, { credentials: 'include' }); if (r.ok) return await r.arrayBuffer(); }
      catch (e) { /* reintenta */ }
      await wait(500);
    }
    return null;
  }

  async function unirYDescargar(urls, filename) {
    const { PDFDocument } = PDFLib;
    if (!urls.length) { ui.estado('No hay actuaciones para descargar.'); return; }
    ui.corriendo(true);
    try {
      const merged = await PDFDocument.create();
      let ok = 0, fail = 0;
      for (let i = 0; i < urls.length; i++) {
        ui.progreso(i / urls.length, `Uniendo ${i + 1}/${urls.length}…`);
        const buf = await bajar(urls[i]);
        if (!buf) { fail++; continue; }
        try {
          const d = await PDFDocument.load(buf, { ignoreEncryption: true });
          const pg = await merged.copyPages(d, d.getPageIndices());
          pg.forEach((p) => merged.addPage(p));
          ok++;
        } catch (e) { fail++; }
      }
      if (ok === 0) { ui.estado('No se pudo procesar ningún PDF (¿las actuaciones tienen PDF real?).'); return; }
      ui.estado('Generando PDF final…');
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (filename || 'Expediente') + '.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 120000);
      clear();
      ui.progreso(1, `Listo — ${filename}.pdf: ${ok} documento(s) unido(s)` +
        (fail ? `, ${fail} fallido(s) (suelen ser actuaciones sin PDF real).` : '.'));
    } catch (e) {
      console.error('[PJN]', e); ui.estado('Error: ' + e.message);
    } finally {
      ui.corriendo(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Recolección compartida por los dos modos.
  //   modo 'todo'   -> al terminar, baja TODO.
  //   modo 'elegir' -> al terminar, muestra la lista.
  // La navegación a "históricas" recarga la página; el estado en sessionStorage
  // recuerda el modo y auto() retoma del otro lado.
  // ─────────────────────────────────────────────────────────────────────
  async function recolectar(modo) {
    clear();
    ui.corriendo(true);
    ui.estado('Recorriendo actuaciones…');
    try {
      const st = { modo, phase: 'main', catalogo: [], filename: nombreArchivo(), running: true };
      save(st);
      await recorrerPaginas(st.catalogo, 'Recolectando');
      if (!enHistoricas()) {
        const hist = [...document.querySelectorAll('a')].find((a) => /ver\s+hist[óo]ric/i.test(a.textContent));
        if (hist) {
          st.phase = 'hist'; save(st);
          ui.estado('Cargando históricas…');
          hist.click(); // navega -> auto() reanuda en la otra página
          return;
        }
      }
      st.phase = 'ready'; save(st);
      ui.corriendo(false);
      if (modo === 'todo') await unirYDescargar(st.catalogo.map((e) => e.url), st.filename);
      else ui.mostrarLista(st.catalogo);
    } catch (e) {
      console.error('[PJN]', e); ui.estado('Error recolectando: ' + e.message);
      ui.corriendo(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Panel — 3 solapas
  // ─────────────────────────────────────────────────────────────────────
  const ui = (function () {
    const miniBtn = 'padding:4px 7px;cursor:pointer;background:#eaf5ee;color:#12303a;border:1px solid #b9d8c4;border-radius:4px;font-size:10px;font-weight:600';
    const tabBtn = 'flex:1;padding:6px 3px;cursor:pointer;background:transparent;border:0;border-bottom:2px solid transparent;font-size:11.5px;font-weight:600;color:#5a7581';
    const bigBtn = 'width:100%;padding:9px;cursor:pointer;background:#5084ce;color:#fff;border:0;border-radius:5px;font-weight:600';
    const winBtn = 'width:22px;height:19px;line-height:1;padding:0;margin-left:1px;border:0;background:transparent;color:#5a7581;font-size:14px;cursor:pointer;border-radius:3px;font-weight:700';

    const aboutHTML =
      '<div style="font-size:12px;line-height:1.65;padding:4px 2px 2px">' +
      '<div style="font-weight:700;color:#14416f;font-size:13px">' + escapar(APP.nombre) + '</div>' +
      '<div style="color:#5a7581;margin-bottom:9px">Versión ' + escapar(APP.version) + '</div>' +
      '<div>Creado por <b>' + escapar(APP.autor) + '</b> con Claude.</div>' +
      '<div><a href="mailto:' + escapar(APP.mail) + '" style="color:#0a6cab">' + escapar(APP.mail) + '</a></div>' +
      '<div style="margin:9px 0;padding:8px 10px;background:#f1f7f3;border-radius:6px;color:#3a4c54;font-size:11px">' +
      '<b>Copyleft &#8212; ' + escapar(APP.licencia) + '.</b><br>' +
      'Copyright (C) ' + escapar(APP.anio) + ' ' + escapar(APP.autor) + '. Software libre: se permite y se alienta su uso, copia, ' +
      'modificación y distribución de forma gratuita, siempre que las obras derivadas conserven esta misma licencia. ' +
      'Sin garantía. <a href="' + escapar(APP.licenciaUrl) + '" target="_blank" rel="noopener noreferrer" style="color:#0a6cab">Texto de la licencia &#8599;</a>' +
      '</div>' +
      '<a href="' + escapar(APP.github) + '" target="_blank" rel="noopener noreferrer" ' +
      'style="display:inline-block;padding:7px 11px;background:#24292f;color:#fff;border-radius:5px;text-decoration:none;font-size:11px;font-weight:600">Ver en GitHub &#8599;</a>' +
      '</div>';

    const caja = document.createElement('div');
    caja.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483647',
      'background:#fff', 'border:1px solid #14416f', 'border-radius:8px',
      'box-shadow:0 6px 20px rgba(0,0,0,.28)', 'padding:11px 13px',
      'font:12px/1.45 system-ui,Segoe UI,sans-serif', 'width:365px', 'color:#12303a'
    ].join(';');
    caja.innerHTML =
      // Barra de título con controles de ventana
      '<div data-e="hdr" style="display:flex;justify-content:space-between;align-items:center">' +
      '<span data-e="titulo" style="font-weight:800;color:#14416f;font-size:15px;letter-spacing:.5px;cursor:pointer" title="Clic para minimizar/restaurar">SuPJN+ DESCARGAS</span>' +
      '<span style="display:flex;gap:1px;flex:none">' +
      '<button data-e="min" title="Minimizar" style="' + winBtn + '">&#8211;</button>' +
      '<button data-e="max" title="Maximizar" style="' + winBtn + '">&#9633;</button>' +
      '<button data-e="cerrar" title="Cerrar" style="' + winBtn + '">&#10005;</button>' +
      '</span>' +
      '</div>' +
      '<div data-e="cuerpo">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin:1px 0 8px">' +
      '<span style="font-size:10px;color:#5a7581">Descargar Expediente del PJN</span>' +
      '<span data-e="recargar" title="Recargar la página" style="font-size:10px;font-weight:500;color:#0a6cab;cursor:pointer;text-decoration:underline">recargar página</span>' +
      '</div>' +
      '<div data-e="estado" style="min-height:32px;color:#33505c">Elegí un modo abajo.</div>' +
      '<div style="background:#e3ebef;border-radius:3px;height:5px;margin:9px 0">' +
      '<div data-e="barra" style="background:#5084ce;height:5px;width:0;border-radius:3px;transition:width .25s"></div></div>' +
      // Solapas
      '<div style="display:flex;gap:3px;margin-bottom:9px;border-bottom:1px solid #dbe4e8">' +
      '<button data-e="navTodo" style="' + tabBtn + '">Descargar todo</button>' +
      '<button data-e="navElegir" style="' + tabBtn + '">Elegir descarga</button>' +
      '<button data-e="navAbout" style="' + tabBtn + '">About</button>' +
      '</div>' +
      // Solapa "Descargar todo"
      '<div data-e="tabTodo">' +
      '<div style="font-size:11px;color:#3a4c54;margin-bottom:9px;line-height:1.5">Baja el expediente <b>completo</b>: recorre todas las páginas y las históricas y une todo en un único PDF. Es la versión original, sin elegir.</div>' +
      '<button data-e="irTodo" style="' + bigBtn + '">Descargar expediente completo (1 PDF)</button>' +
      '</div>' +
      // Solapa "Elegir descarga"
      '<div data-e="tabElegir" style="display:none">' +
      '<div style="display:flex;justify-content:flex-end;margin:-2px 0 5px">' +
      '<span data-e="rehacer" title="Rehacer la lista desde cero" style="font-size:10px;font-weight:500;color:#0a6cab;cursor:pointer;text-decoration:underline">rehacer lista</span>' +
      '</div>' +
      '<div data-e="preNota" style="font-size:11px;color:#3a4c54;margin-bottom:9px;line-height:1.5">Primero <b>Preparar lista</b> (recorre páginas e históricas sin bajar). Después elegís por fechas o a mano y bajás.</div>' +
      '<div data-e="controles" style="display:none">' +
      '<input data-e="buscar" type="text" placeholder="Filtrar por fecha o texto…" ' +
      'style="width:100%;box-sizing:border-box;padding:5px;border:1px solid #b9c9d0;border-radius:4px;font-size:11px;margin-bottom:6px">' +
      '<div style="display:flex;gap:5px;align-items:center;margin-bottom:6px">' +
      '<button data-e="todas" style="' + miniBtn + '">Todas</button>' +
      '<button data-e="ninguna" style="' + miniBtn + '">Ninguna</button>' +
      '<button data-e="invertir" style="' + miniBtn + '">Invertir</button>' +
      '<span data-e="contador" style="margin-left:auto;font-size:11px;color:#5a7581">0 de 0</span>' +
      '</div>' +
      '<div style="display:flex;gap:5px;align-items:center;margin-bottom:8px;font-size:11px">' +
      '<span style="color:#5a7581">Fechas</span>' +
      '<input data-e="fdesde" type="date" style="flex:1;min-width:0;padding:3px;border:1px solid #b9c9d0;border-radius:4px;font-size:11px">' +
      '<span>a</span>' +
      '<input data-e="fhasta" type="date" style="flex:1;min-width:0;padding:3px;border:1px solid #b9c9d0;border-radius:4px;font-size:11px">' +
      '<button data-e="aplicarf" title="Tildar las actuaciones dentro del rango" style="' + miniBtn + '">Marcar</button>' +
      '<button data-e="mostrarf" title="Mostrar en la lista solo las actuaciones dentro del rango. Con los dos campos vacíos vuelve a mostrar todo" style="' + miniBtn + '">Mostrar</button>' +
      '</div>' +
      '<div data-e="lista" style="max-height:240px;overflow:auto;border:1px solid #dbe4e8;border-radius:5px;margin-bottom:8px;background:#fbfdfc"></div>' +
      '</div>' +
      '<button data-e="ir" style="' + bigBtn + '">Preparar lista</button>' +
      '</div>' +
      // Solapa About
      '<div data-e="tabAbout" style="display:none">' + aboutHTML + '</div>' +
      '</div>'; // cierra cuerpo

    const q = (n) => caja.querySelector('[data-e="' + n + '"]');

    // ── Controles de ventana: minimizar / maximizar / cerrar ──
    const WKEY = '__pjn_win';
    let estadoWin = 'normal';
    const pill = document.createElement('button');
    pill.textContent = '⬇ SuPJN+ DESCARGAS';
    pill.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;display:none;' +
      'padding:8px 12px;background:#5084ce;color:#fff;border:0;border-radius:8px;cursor:pointer;' +
      'font:600 12px system-ui,Segoe UI,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)';
    function setEstadoWin(s) {
      estadoWin = s;
      if (s !== 'closed') { try { localStorage.setItem(WKEY, s); } catch (e) { /* sin persistencia */ } }
      if (s === 'closed') { caja.style.display = 'none'; pill.style.display = ''; return; }
      caja.style.display = ''; pill.style.display = 'none';
      q('cuerpo').style.display = s === 'min' ? 'none' : '';
      caja.style.width = s === 'max' ? '470px' : '365px';
      const lst = caja.querySelector('[data-e="lista"]');
      if (lst) lst.style.maxHeight = s === 'max' ? '62vh' : '240px';
      q('max').textContent = s === 'max' ? '❐' : '□';
    }

    // ── Arrastre libre desde la barra de título (fijo si está maximizado) ──
    let justDragged = false;
    function habilitarArrastre(POSKEY) {
      const handle = q('hdr');
      handle.style.cursor = 'move';
      let sx, sy, ox, oy, moviendo = false, arrastro = false;
      const aplicarPos = (left, top) => {
        const w = caja.offsetWidth;
        left = Math.max(4, Math.min(left, window.innerWidth - Math.min(w, 90) - 4));
        top = Math.max(4, Math.min(top, window.innerHeight - 28));
        caja.style.left = left + 'px'; caja.style.top = top + 'px';
        caja.style.right = 'auto'; caja.style.bottom = 'auto';
      };
      handle.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // los botones de ventana no arrastran
        e.preventDefault();
        justDragged = false;
        const r = caja.getBoundingClientRect();
        ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY; moviendo = true; arrastro = false;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      function onMove(e) {
        if (!moviendo) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!arrastro && Math.abs(dx) + Math.abs(dy) < 4) return; // umbral: distingue click de arrastre
        arrastro = true; caja.style.userSelect = 'none';
        aplicarPos(ox + dx, oy + dy);
      }
      function onUp() {
        moviendo = false; caja.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (arrastro) justDragged = true;
      }
      // Pedido del autor, para todas las apps: al cargar, el panel aparece
      // SIEMPRE abajo a la derecha. Se puede arrastrar, pero la posicion ya no
      // se guarda ni se restaura; se borra la que haya quedado de antes.
      try { localStorage.removeItem(POSKEY); } catch (e) { /* sin persistencia */ }
    }
    let activa = false;
    let listo = false; // catálogo armado (modo elegir)
    let catalogoRef = null;

    const lista = () => q('lista');
    const filas = () => [...lista().querySelectorAll('label')];
    const visibles = () => filas().filter((l) => l.style.display !== 'none');

    function irASolapa(cual) {
      q('tabTodo').style.display = cual === 'todo' ? '' : 'none';
      q('tabElegir').style.display = cual === 'elegir' ? '' : 'none';
      q('tabAbout').style.display = cual === 'about' ? '' : 'none';
      const act = (btn, on) => { btn.style.color = on ? '#14416f' : '#5a7581'; btn.style.borderBottomColor = on ? '#14416f' : 'transparent'; };
      act(q('navTodo'), cual === 'todo');
      act(q('navElegir'), cual === 'elegir');
      act(q('navAbout'), cual === 'about');
    }

    function actualizarContador() {
      const total = catalogoRef ? catalogoRef.length : 0;
      const sel = lista().querySelectorAll('input:checked').length;
      q('contador').textContent = sel + ' de ' + total;
      if (!activa && listo) q('ir').textContent = 'Bajar seleccionadas (' + sel + ')';
    }

    // Filtro de VISTA: combina el texto y, si hay, el rango de fechas.
    // No toca las tildes: para eso está "Marcar".
    let rangoVista = null;

    function renderLista() {
      rangoVista = null;
      const cont = lista();
      cont.innerHTML = '';
      if (!catalogoRef || !catalogoRef.length) {
        cont.innerHTML = '<div style="padding:9px;font-size:11px;color:#8a2b2b">No se encontraron actuaciones con botón “Descargar”.</div>';
        actualizarContador();
        return;
      }
      const frag = document.createDocumentFragment();
      catalogoRef.forEach((m, i) => {
        const fila = document.createElement('label');
        fila.style.cssText = 'display:flex;gap:7px;align-items:flex-start;padding:4px 6px;border-bottom:1px solid #eef2f4;cursor:pointer';
        fila.dataset.txt = ((m.fechaTexto || '') + ' ' + (m.descripcion || '')).toLowerCase();
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = true; cb.dataset.idx = i; cb.style.marginTop = '2px';
        cb.addEventListener('change', actualizarContador);
        const txt = document.createElement('span');
        txt.style.cssText = 'font-size:11px;line-height:1.35';
        txt.innerHTML = '<b>' + String(i + 1).padStart(3, '0') + '.</b> ' +
          (m.fechaTexto ? escapar(m.fechaTexto) + ' — ' : '') + escapar(m.descripcion || 'actuación');
        fila.appendChild(cb); fila.appendChild(txt);
        frag.appendChild(fila);
      });
      cont.appendChild(frag);
      const fechas = catalogoRef.map((m) => parsearFecha(m.fechaTexto)).filter(Boolean).sort((a, b) => a - b);
      if (fechas.length) {
        q('fdesde').min = q('fhasta').min = yyyymmdd(fechas[0]);
        q('fdesde').max = q('fhasta').max = yyyymmdd(fechas[fechas.length - 1]);
      }
      actualizarContador();
    }

    function aplicarFiltros() {
      const t = q('buscar').value.trim().toLowerCase();
      const d = rangoVista && rangoVista.d ? new Date(rangoVista.d + 'T00:00:00') : null;
      const h = rangoVista && rangoVista.h ? new Date(rangoVista.h + 'T23:59:59') : null;
      filas().forEach((l) => {
        const cb = l.querySelector('input');
        let ok = !t || l.dataset.txt.includes(t);
        if (ok && (d || h)) {
          const f = parsearFecha(catalogoRef[+cb.dataset.idx].fechaTexto);
          ok = !!(f && (!d || f >= d) && (!h || f <= h));
        }
        l.style.display = ok ? 'flex' : 'none';
      });
    }

    // Lee el rango de los date-picker. Si vino al revés (desde después de hasta)
    // se corrige solo: las fechas ISO (yyyy-mm-dd) se comparan como texto =
    // cronológico. Sin esto, un rango invertido no marcaba ni mostraba nada.
    function leerRango() {
      let vd = q('fdesde').value, vh = q('fhasta').value;
      if (vd && vh && vd > vh) { const t = vd; vd = vh; vh = t; }
      return { vd, vh, d: vd ? new Date(vd + 'T00:00:00') : null, h: vh ? new Date(vh + 'T23:59:59') : null };
    }

    function marcarPorFecha() {
      if (!catalogoRef) return;
      const { d, h } = leerRango();
      if (!d && !h) { api.estado('Poné al menos una fecha en el rango.'); return; }
      let n = 0;
      filas().forEach((l) => {
        const cb = l.querySelector('input');
        const f = parsearFecha(catalogoRef[+cb.dataset.idx].fechaTexto);
        cb.checked = !!(f && (!d || f >= d) && (!h || f <= h));
        if (cb.checked) n++;
      });
      actualizarContador();
      api.estado(`${n} actuación(es) en el rango de fechas.`);
    }

    const api = {
      estado: (t) => { q('estado').textContent = t; log(t); },
      progreso: (frac, t) => { q('barra').style.width = Math.round(frac * 100) + '%'; if (t) { q('estado').textContent = t; log(t); } },
      corriendo: (b) => {
        if (b === undefined) return activa;
        activa = b;
        ['ir', 'irTodo'].forEach((n) => { const el = q(n); el.disabled = b; el.style.opacity = b ? 0.6 : 1; });
        ['todas', 'ninguna', 'invertir', 'buscar', 'rehacer', 'fdesde', 'fhasta', 'aplicarf', 'mostrarf', 'navTodo', 'navElegir'].forEach((n) => {
          const el = q(n); if (el) { el.style.pointerEvents = b ? 'none' : ''; el.style.opacity = b ? 0.5 : 1; }
        });
        if (!b && listo) actualizarContador();
        return activa;
      },
      mostrarLista: (catalogo) => {
        catalogoRef = catalogo || [];
        listo = true;
        irASolapa('elegir');
        q('controles').style.display = '';
        q('preNota').style.display = 'none';
        renderLista();
        api.estado(`${catalogoRef.length} actuación(es). Destildá las que no quieras y bajá.`);
      },
      irA: (cual) => irASolapa(cual),
      seleccion: () => [...lista().querySelectorAll('input:checked')].map((c) => catalogoRef[+c.dataset.idx].url),
      estaListo: () => listo
    };

    (function montar() {
      if (!document.body) return setTimeout(montar, 250);
      document.body.appendChild(caja);
      document.body.appendChild(pill);

      // Controles de ventana
      q('min').addEventListener('click', () => setEstadoWin('min'));
      q('max').addEventListener('click', () => setEstadoWin(estadoWin === 'max' ? 'normal' : 'max'));
      q('cerrar').addEventListener('click', () => setEstadoWin('closed'));
      q('titulo').addEventListener('click', () => {
        if (justDragged) { justDragged = false; return; } // si venís de arrastrar, no minimiza
        setEstadoWin(estadoWin === 'min' ? 'normal' : 'min');
      });
      [q('min'), q('max'), q('cerrar')].forEach((b) => {
        b.addEventListener('mouseenter', () => { b.style.background = b === q('cerrar') ? '#f2c4c4' : '#e3ebef'; });
        b.addEventListener('mouseleave', () => { b.style.background = 'transparent'; });
      });
      habilitarArrastre('__pjn_pos');
      // Pedido del autor: abre SIEMPRE minimizado. Se puede expandir con el
      // botón de la barra o clic en el título; al recargar vuelve a minimizado.
      setEstadoWin('min');

      q('navTodo').addEventListener('click', () => irASolapa('todo'));
      q('navElegir').addEventListener('click', () => irASolapa('elegir'));
      q('navAbout').addEventListener('click', () => irASolapa('about'));
      irASolapa('todo');

      q('irTodo').addEventListener('click', () => {
        if (activa) return;
        recolectar('todo').catch((e) => { console.error('[PJN]', e); api.estado('Error: ' + e.message); });
      });

      q('ir').addEventListener('click', () => {
        if (activa) return;
        if (!listo) {
          recolectar('elegir').catch((e) => { console.error('[PJN]', e); api.estado('Error: ' + e.message); });
        } else {
          const st = load() || {};
          unirYDescargar(api.seleccion(), st.filename || nombreArchivo());
        }
      });

      q('recargar').addEventListener('click', () => { if (!activa) location.reload(); });
      q('rehacer').addEventListener('click', () => {
        if (activa) return;
        clear(); listo = false; catalogoRef = null;
        q('controles').style.display = 'none';
        q('preNota').style.display = '';
        q('ir').textContent = 'Preparar lista';
        api.progreso(0, 'Tocá “Preparar lista” para leer todas las actuaciones.');
      });
      q('buscar').addEventListener('input', aplicarFiltros);
      q('mostrarf').addEventListener('click', () => {
        const { vd, vh } = leerRango();
        rangoVista = (vd || vh) ? { d: vd, h: vh } : null;
        aplicarFiltros();
        api.estado(rangoVista
          ? `Mostrando ${visibles().length} de ${filas().length} actuación(es) en el rango.`
          : 'Rango de fechas quitado, se muestran todas.');
      });
      q('todas').addEventListener('click', () => { visibles().forEach((l) => { l.querySelector('input').checked = true; }); actualizarContador(); });
      q('ninguna').addEventListener('click', () => { visibles().forEach((l) => { l.querySelector('input').checked = false; }); actualizarContador(); });
      q('invertir').addEventListener('click', () => { visibles().forEach((l) => { const c = l.querySelector('input'); c.checked = !c.checked; }); actualizarContador(); });
      q('aplicarf').addEventListener('click', marcarPorFecha);
    })();

    return api;
  })();

  // ─────────────────────────────────────────────────────────────────────
  // Reanudar en la página de históricas (segunda parte de la recolección)
  // ─────────────────────────────────────────────────────────────────────
  (async function auto() {
    const st = load();
    if (!st || !st.running) return;
    if (st.phase === 'hist' && enHistoricas()) {
      ui.irA(st.modo === 'todo' ? 'todo' : 'elegir');
      ui.corriendo(true);
      ui.estado('Recolectando históricas…');
      try {
        await wait(1500); // esperar el render de la tabla
        st.catalogo = st.catalogo || [];
        await recorrerPaginas(st.catalogo, 'Recolectando históricas');
        st.phase = 'ready'; save(st);
        ui.corriendo(false);
        if (st.modo === 'todo') await unirYDescargar(st.catalogo.map((e) => e.url), st.filename);
        else ui.mostrarLista(st.catalogo);
      } catch (e) {
        console.error('[PJN]', e); ui.estado('Error en históricas: ' + e.message); ui.corriendo(false);
      }
    } else if (st.phase === 'ready' && st.modo === 'elegir' && Array.isArray(st.catalogo)) {
      ui.mostrarLista(st.catalogo);
    }
  })();

  log(`v${APP.version} cargado`);
})();

/* ===========================================================================
 * NOTATOMIC - Dejar nota en lote en la Consulta Web del PJN
 * ---------------------------------------------------------------------------
 * Modulo de SuPJN+ (viene de PJN+). Corre en las listas de expedientes (Relacionados, Favoritos,
 * Radicaciones). El otro modulo, el de descarga, corre en la pantalla del
 * expediente y en la de actuaciones historicas. No se pisan.
 *
 * QUE RESUELVE
 *   En un dia de nota, con quince expedientes en la lista, hay que hacer
 *   treinta clics: quince lapices y quince confirmaciones. Notatomic los hace.
 *
 * COMO FUNCIONA EL SITIO (relevado el 08/09/2026 sobre la lista de Relacionados)
 *   1. El boton "Dejar nota" de arriba NO deja ninguna nota. Filtra la lista
 *      dejando solo los expedientes donde hoy se puede dejar, y agrega una
 *      columna con un lapiz por fila. Se revierte con "Quitar filtro dejar nota".
 *   2. La nota se deja con el lapiz de cada fila. Cada lapiz dispara un pedido
 *      RichFaces que abre un cartel de confirmacion.
 *   3. El cartel dice "Libro de Notas Electronicas. Confirma dejar nota en el
 *      expediente seleccionado?" y hay que aceptar.
 *   4. Al confirmar, el PJN escribe en la pantalla:
 *        exito -> "Ya se ha dejado nota con el usuario <cuit> en el
 *                  expediente: 32733/1980"
 *        falla -> "No se pudo realizar la accion de dejar nota ya que se
 *                  produjo un error al validar el expediente"
 *
 * TRES COSAS QUE SE APRENDIERON A LOS GOLPES Y NO HAY QUE DESHACER
 *
 *   a) El boton "Confirmar" existe en el DOM SIEMPRE, aunque el cartel este
 *      cerrado. Usarlo como señal de "el cartel ya abrio" hace que se confirme
 *      antes de que el servidor sepa sobre que expediente es, y el PJN contesta
 *      "error al validar el expediente". Hay que mirar el cartel mismo, que
 *      es el div cuyo id termina en dejarNotaPopup y que pasa de display:none
 *      a visible.
 *
 *   b) El lapiz NO desaparece despues de dejar la nota. La fila queda igual.
 *      Asi que la unica forma de saber como salio es leer el mensaje del PJN,
 *      y ademas comparar el numero que nombra ese mensaje con el expediente que
 *      se estaba procesando: si no se compara, el mensaje del anterior, que
 *      sigue en pantalla, se toma como exito del actual.
 *
 *   c) El recorrido va por NUMERO DE EXPEDIENTE, no por posicion en la tabla.
 *      Si al dejar la nota la fila se mueve o desaparece del listado filtrado,
 *      los indices se corren y trabajar por posicion saltearia expedientes.
 *
 * DECISION DE DISEÑO (1.10.0, pedido del autor)
 *   Dos modos, igual que la descarga: "Nota en todos" y "Elegir expedientes".
 *   Para elegir, "Preparar lista" recorre todas las paginas SIN dejar ninguna
 *   nota y arma en el panel la lista de los expedientes con lapiz; ahi se
 *   tildan y se deja nota solo en esos. La lista va en el panel y no en la
 *   tabla del PJN: las casillas por fila se probaron antes y se sacaron porque
 *   sumaban pantalla. Nada viene tildado ni se recuerda la eleccion anterior:
 *   cada vez se elige.
 *   El panel arranca SIEMPRE minimizado abajo a la derecha, como todas las
 *   apps. Solo se abre solo si hay una tanda en curso, para mostrar el avance.
 *   NOTATOMIC no es una app aparte: es parte de SuPJN+ (y de PJN+) y lleva el
 *   mismo numero de version que el resto del script.
 *
 * COMO SE UBICAN LAS COSAS EN LA PAGINA
 *   La columna del lapiz se busca por el TEXTO del encabezado ("Dejar Nota"),
 *   no por el id. Los id del PJN son generados (j_idt273 y parecidos) y cambian
 *   cuando redespliegan la aplicacion; el encabezado, no.
 * =========================================================================== */
(function () {
  'use strict';

  // Nunca dentro de un marco: una tanda de notas en curso no puede retomarse
  // desde el marco oculto donde SuPJN+ lee la lista.
  if (window.top !== window.self) return;

  // Solo en las listas. La pantalla del expediente es del otro modulo.
  if (!/\/scw\/consultaLista/i.test(location.pathname)) return;

  // Con permisos de Tampermonkey el script corre aislado de la pagina: el jsf
  // del PJN se alcanza por unsafeWindow. Sin eso, esperarAjax no se entera de
  // nada y cada paso esperaria el vencimiento completo.
  const PAGINA = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  // Paleta del propio sitio del PJN: el azul oscuro de la barra superior y el
  // azul del encabezado de las tablas.
  const AZUL = '#14416f';
  const AZUL_CLARO = '#5084ce';
  const APP = {
    nombre: 'SuPJN+ NOTATOMIC',
    version: 'beta 0.1.0', // es SuPJN+: mismo numero que el resto del script
    autor: 'Ignacio Kinbaum',
    anio: '2026',
    mail: 'estudiojuridicokinbaum@gmail.com',
    licencia: 'GPL-3.0-or-later',
    licenciaUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    github: 'https://github.com/Elzas85/SUPJNPLUS'
  };

  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let corriendo = false;
  let abortar = false;
  let elEstado = null;
  let elPanel = null;
  let listaRef = null;       // expedientes leidos con "Preparar lista"
  let minimizarPanel = null; // se asigna al construir el panel
  let mensajeAuto = '';      // ultimo aviso puesto por revisar(), que se puede pisar

  // ------------------------------------------------------------- la tabla

  function tabla() {
    let mejor = null;
    [...document.querySelectorAll('table')].forEach((t) => {
      if (t.rows.length < 2) return;
      if (!mejor || t.rows.length > mejor.rows.length) mejor = t;
    });
    return mejor;
  }

  // La columna se ubica por el texto del encabezado, no por un id generado:
  // los id del tipo j_idt273 cambian cuando el PJN redespliega la aplicacion.
  function columnaNota(t) {
    if (!t || !t.rows.length) return -1;
    const cab = [...t.rows[0].cells];
    for (let i = 0; i < cab.length; i++) {
      if (/dejar\s*nota/i.test((cab[i].textContent || ''))) return i;
    }
    return -1;
  }

  function filasConLapiz() {
    const t = tabla();
    const col = columnaNota(t);
    if (!t || col < 0) return [];
    const out = [];
    for (let i = 1; i < t.rows.length; i++) {
      const f = t.rows[i];
      if (!f.cells[col]) continue;
      const a = f.cells[col].querySelector('a[onclick], a[href], button');
      if (!a) continue;
      out.push({
        fila: f,
        lapiz: a,
        expediente: (f.cells[0] ? (f.cells[0].textContent || '') : '').replace(/\s+/g, ' ').trim(),
        caratula: (f.cells[2] ? (f.cells[2].textContent || '') : '').replace(/\s+/g, ' ').trim()
      });
    }
    return out;
  }

  function botonFiltroNota() {
    return document.querySelector('input[id$="consultaFiltroSearchDejarNota"], input[value="Dejar nota"]');
  }

  function botonConfirmar() {
    return document.querySelector('input[id$=":dejarNotaForm:botonAceptar"], input[value="Confirmar"]');
  }

  // El boton Confirmar existe en la pantalla SIEMPRE, aunque el cartel este
  // cerrado. Mirarlo a el es una señal falsa: hay que mirar el cartel.
  function popupAbierto() {
    const p = document.querySelector('div[id$=":dejarNotaPopupID:dejarNotaPopup"], div[id$="dejarNotaPopup"]');
    return !!(p && getComputedStyle(p).display !== 'none');
  }

  // Lo que contesta el PJN despues de confirmar:
  //   exito -> "Ya se ha dejado nota con el usuario N en el expediente: 32733/1980"
  //   falla -> "No se pudo realizar la accion de dejar nota ... error al validar"
  // El lapiz NO desaparece al dejar la nota, asi que el mensaje es la unica
  // forma de saber como salio.
  function mensajePJN() {
    const t = (document.body.innerText || '').replace(/\s+/g, ' ');
    const ok = /Ya se ha dejado nota[^]{0,80}?expediente:\s*([\d]+\/[\d]+)/i.exec(t);
    if (ok) return { ok: true, expediente: ok[1], texto: ok[0].slice(0, 120) };
    const mal = /No se pudo realizar la acci[^]{0,140}/i.exec(t);
    if (mal) return { ok: false, texto: mal[0].slice(0, 140) };
    return null;
  }

  // El numero de la tabla viene "CIV 032733/1980"; el mensaje dice "32733/1980".
  function mismoExpediente(deLaTabla, delMensaje) {
    const n = (x) => String(x || '').replace(/^[A-Z]+\s*/i, '').replace(/^0+/, '').replace(/\s/g, '');
    return n(deLaTabla) === n(delMensaje);
  }

  // --------------------------------------------------- espera de la respuesta

  // El PJN usa JSF con RichFaces. Escuchar el evento de fin de peticion es mas
  // seguro que esperar una cantidad fija de segundos.
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
      } catch (e) { /* si no se puede enganchar, queda el vencimiento */ }
      setTimeout(() => { if (!listo) { listo = true; resolve('timeout'); } }, msMax || 20000);
    });
  }

  async function esperarA(condicion, msMax, paso) {
    const t0 = Date.now();
    while (Date.now() - t0 < (msMax || 12000)) {
      try { if (condicion()) return true; } catch (e) { /* el DOM se esta rearmando */ }
      await dormir(paso || 200);
    }
    return false;
  }

  // ------------------------------------------------------------- el recorrido
  //
  // OJO: confirmar la nota RECARGA la pagina. Por eso esto no puede ser un
  // bucle: el bucle muere con la recarga y quedaria una sola nota puesta.
  // Se trabaja como maquina de estados guardada en sessionStorage: se deja UNA
  // nota, la pagina se recarga, el script arranca de nuevo, lee como salio la
  // anterior y sigue con la que falta. Igual que hace el modulo de descarga
  // para pasar a las actuaciones historicas.

  // ------------------------------------------------------------- paginado
  //
  // El paginador del PJN es un ul.pagination. Cada pagina es un elemento de una
  // lista repetida y su id trae el indice: ...j_idt285:0:j_idt287 es la pagina 1,
  // :1: la 2, y asi. Ese indice es lo que permite VOLVER DIRECTO a la pagina en
  // la que estabamos, en vez de caminar desde la primera.
  //
  // Hace falta porque confirmar una nota recarga la pagina, y la recarga puede
  // devolverte a la primera. Con tres paginas, caminar seria un clic de mas por
  // cada nota; saltando derecho es uno solo y siempre el mismo.

  function indiceDe(el) {
    const m = /:(\d+):[^:]+$/.exec((el && el.id) || '');
    return m ? parseInt(m[1], 10) : null;
  }

  function paginaActual() {
    const ul = document.querySelector('ul.pagination');
    if (!ul) return 0;
    const act = ul.querySelector('li.active span[id], li.active');
    const i = indiceDe(act && act.id ? act : (act ? act.querySelector('[id]') : null));
    return i === null ? 0 : i;
  }

  function cuantasPaginas() {
    const ul = document.querySelector('ul.pagination');
    if (!ul) return 1;
    const idx = [...ul.querySelectorAll('[id]')].map(indiceDe).filter((x) => x !== null);
    return idx.length ? Math.max.apply(null, idx) + 1 : 1;
  }

  function enlaceAPagina(idx) {
    const ul = document.querySelector('ul.pagination');
    if (!ul) return null;
    const directo = [...ul.querySelectorAll('a')].filter((a) => indiceDe(a) === idx)[0];
    if (directo) return directo;
    // Si el paginador muestra solo una ventana de paginas, se avanza de a una.
    return [...ul.querySelectorAll('a')].filter((a) => /siguiente|»|>/i.test((a.textContent || '').trim()))[0] || null;
  }

  async function irAPagina(idx) {
    let vueltas = 0;
    while (paginaActual() !== idx && vueltas < 12) {
      const a = enlaceAPagina(idx);
      if (!a) return false;
      const espera = esperarAjax(20000);
      a.click();
      await espera;
      await dormir(700);
      vueltas++;
    }
    return paginaActual() === idx;
  }

  function paginaSiguiente() {
    const act = paginaActual();
    if (act + 1 >= cuantasPaginas()) return null;
    return enlaceAPagina(act + 1);
  }

  const LLAVE = 'notatomic_corrida';
  const leerCorrida = () => { try { return JSON.parse(sessionStorage.getItem(LLAVE)); } catch (e) { return null; } };
  const guardarCorrida = (c) => { try { sessionStorage.setItem(LLAVE, JSON.stringify(c)); } catch (e) { /* sin persistencia */ } };
  const borrarCorrida = () => { try { sessionStorage.removeItem(LLAVE); } catch (e) { /* sin persistencia */ } };

  // La lista armada con "Preparar lista". Va en sessionStorage porque cada nota
  // recarga la pagina y la lista tiene que seguir en el panel. Lo que NO se
  // guarda es que estaba tildado: cada vez se elige de nuevo.
  const LLAVE_LISTA = 'notatomic_lista';
  const LLAVE_PREPARAR = 'notatomic_preparando';
  const leerLista = () => { try { return JSON.parse(sessionStorage.getItem(LLAVE_LISTA)); } catch (e) { return null; } };
  const guardarLista = (l) => { try { sessionStorage.setItem(LLAVE_LISTA, JSON.stringify(l)); } catch (e) { /* sin persistencia */ } };
  const borrarLista = () => { try { sessionStorage.removeItem(LLAVE_LISTA); } catch (e) { /* sin persistencia */ } };
  const marcarPreparando = (si) => {
    try { if (si) sessionStorage.setItem(LLAVE_PREPARAR, '1'); else sessionStorage.removeItem(LLAVE_PREPARAR); } catch (e) { /* sin persistencia */ }
  };
  const preparando = () => { try { return sessionStorage.getItem(LLAVE_PREPARAR) === '1'; } catch (e) { return false; } };

  // solo: null deja nota en todos; si no, la lista de numeros elegidos.
  function nuevaCorrida(solo) {
    return {
      activa: true,
      solo: solo || null,
      hechos: [], // numeros de expediente ya resueltos
      problemas: [],
      pausa: parseInt((elPanel.querySelector('[data-b="pausa"]') || {}).value, 10) || 700,
      enCurso: null, // expediente que se acaba de confirmar, para leer su resultado al volver
      pagina: 0 // indice de la pagina en la que se esta trabajando
    };
  }

  function pendientesAqui(c) {
    return filasConLapiz().filter((x) => c.hechos.indexOf(x.expediente) < 0 &&
      (!c.solo || c.solo.indexOf(x.expediente) >= 0));
  }

  // Con seleccion, cuando ya se paso por todos los elegidos no hace falta
  // seguir caminando paginas.
  const quedanElegidos = (c) => !c.solo || c.solo.some((e) => c.hechos.indexOf(e) < 0);

  async function paso() {
    const c = leerCorrida();
    if (!c || !c.activa) return;
    corriendo = true;
    botones(true);

    // 1. Si volvimos de confirmar, leer como salio el anterior.
    if (c.enCurso) {
      await esperarA(() => !!mensajePJN(), 6000);
      const m = mensajePJN();
      if (m && m.ok && mismoExpediente(c.enCurso, m.expediente)) {
        // salio bien
      } else if (m && !m.ok) {
        c.problemas.push(c.enCurso + ': ' + m.texto.slice(0, 70));
      } else if (m && m.ok) {
        c.problemas.push(c.enCurso + ': el PJN contesto por ' + m.expediente);
      } else {
        c.problemas.push(c.enCurso + ': sin respuesta visible');
      }
      if (c.hechos.indexOf(c.enCurso) < 0) c.hechos.push(c.enCurso);
      c.enCurso = null;
      guardarCorrida(c);
    }

    if (abortar) { terminar(c, 'Cortado por vos.'); return; }
    if (!quedanElegidos(c)) { terminar(c, null); return; }

    // 1 bis. Si la recarga nos devolvio a la primera pagina, volver a la que iba.
    if ((c.pagina || 0) !== paginaActual()) {
      estado('Vuelvo a la pagina ' + ((c.pagina || 0) + 1) + '...');
      const ok = await irAPagina(c.pagina || 0);
      if (!ok) {
        c.pagina = paginaActual();
        guardarCorrida(c);
      }
    }

    // 2. Si la recarga se llevo el filtro, volver a ponerlo.
    if (!filasConLapiz().length) {
      const f = botonFiltroNota();
      if (f) {
        estado('La pagina volvio sin el filtro de nota. Lo pongo de nuevo...');
        const espera = esperarAjax(20000);
        f.click();
        await espera;
        // Si el filtro se re-aplica por AJAX (sin recargar), hay que seguir a
        // mano: el observer esta en pausa mientras corre y no reengancha solo.
        // Si en cambio hubo recarga completa, este frame muere y iniciar()
        // retoma la corrida por su cuenta.
        await esperarA(() => filasConLapiz().length > 0, 8000);
        // Si con el filtro puesto sigue sin haber lapices, no hay donde dejar
        // nota: se termina aca en vez de volver a apretar el filtro sin fin.
        if (!filasConLapiz().length) {
          terminar(c, 'Con el filtro puesto no aparece ningun expediente con lapiz.');
          return;
        }
        return paso();
      }
    }

    // 3. Buscar el proximo pendiente de esta pagina.
    const prox = pendientesAqui(c)[0];

    // 4. Si no queda ninguno, probar la pagina siguiente.
    if (!prox) {
      const sig = paginaSiguiente();
      if (sig) {
        estado('Pagina ' + (paginaActual() + 1) + ' de ' + cuantasPaginas() + ' lista. Paso a la siguiente...');
        c.pagina = paginaActual() + 1;
        guardarCorrida(c);
        const espera = esperarAjax(20000);
        sig.click();
        await espera;
        await dormir(900);
        return paso();
      }
      terminar(c, null);
      return;
    }

    // 5. Dejar la nota en ese: lapiz, esperar el cartel, confirmar.
    estado('Dejando nota en ' + prox.expediente + ' (van ' + c.hechos.length + ')...');
    c.enCurso = prox.expediente;
    guardarCorrida(c);

    const delLapiz = esperarAjax(20000);
    prox.lapiz.click();
    await delLapiz;

    const hayCartel = await esperarA(popupAbierto, 15000);
    if (!hayCartel) {
      c.problemas.push(prox.expediente + ': el cartel no llego a abrirse');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      guardarCorrida(c);
      await dormir(800);
      return paso();
    }

    await dormir(350);
    const b = botonConfirmar();
    if (!b) {
      c.problemas.push(prox.expediente + ': no encuentro el boton Confirmar');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      guardarCorrida(c);
      return paso();
    }

    await dormir(c.pausa || 700);
    b.click();
    // A partir de aca la pagina se recarga. El resto lo retoma el arranque.
  }

  function terminar(c, motivo) {
    const ok = c.hechos.length - c.problemas.length;
    // Los elegidos que no aparecieron con lapiz en ninguna pagina. Si se corto
    // a mano no se cuentan: simplemente no se llego a ellos.
    const noVistos = (c.solo && !motivo) ? c.solo.filter((e) => c.hechos.indexOf(e) < 0) : [];
    const fallas = c.problemas.concat(noVistos.map((e) => e + ': no aparecio con lapiz en la lista'));
    borrarCorrida();
    corriendo = false;
    botones(false);
    revisar();
    // Si hay lista armada, se vuelve a mostrar con el resultado de cada uno y
    // sin nada tildado.
    const lista = leerLista();
    if (lista) {
      const resultado = {};
      c.hechos.forEach((e) => { resultado[e] = 'ok'; });
      fallas.forEach((f) => { resultado[f.split(': ')[0]] = 'mal'; });
      mostrarLista(lista, resultado);
    }
    estado((motivo ? motivo + ' ' : '') + 'Terminado: ' + ok + ' nota(s) dejada(s)' +
      (fallas.length ? '. No salieron ' + fallas.length + ': ' + fallas.join(' | ') : '.'));
  }

  // solo: null para todos; si no, los numeros tildados en la lista.
  function arrancar(solo) {
    if (corriendo) return;
    if (!botonConfirmar() && !botonFiltroNota()) {
      estado('Esta pantalla no tiene la funcion de dejar nota.', true);
      return;
    }
    if (solo && !solo.length) {
      estado('No hay ningun expediente tildado.', true);
      return;
    }
    abortar = false;
    guardarCorrida(nuevaCorrida(solo));
    paso();
  }

  // ------------------------------------------------------ preparar la lista
  //
  // Recorre todas las paginas SIN dejar ninguna nota y arma la lista de los
  // expedientes con lapiz. El paginado es por AJAX y no recarga. Lo que puede
  // recargar es el boton de filtro "Dejar nota": por eso, antes de apretarlo,
  // queda una marca en sessionStorage y, si la pagina se recarga, iniciar()
  // retoma la preparacion.
  async function preparar() {
    if (corriendo) return;
    const retomando = preparando(); // ya se habia apretado el filtro antes de una recarga
    corriendo = true;
    abortar = false;
    botones(true);
    try {
      if (!filasConLapiz().length) {
        // Si el filtro ya se apreto, recargo la pagina y aun asi no hay
        // lapices, no se aprieta de nuevo: seria una recarga sin fin.
        if (retomando) {
          estado('Se puso el filtro "Dejar nota" pero la lista volvio sin lapices. Apretalo a mano y despues Preparar lista.', true);
          return;
        }
        const f = botonFiltroNota();
        if (!f) {
          // Sin boton de filtro puede ser que el filtro ya este puesto y no
          // haya ningun expediente disponible: la columna de nota lo delata.
          const conFiltro = columnaNota(tabla()) >= 0 || !!document.querySelector('input[value*="Quitar filtro"]');
          estado(conFiltro
            ? 'Con el filtro puesto no aparece ningun expediente con lapiz.'
            : 'Esta lista no tiene la funcion de dejar nota.', true);
          return;
        }
        estado('Pongo el filtro "Dejar nota" para ver los lapices...');
        marcarPreparando(true);
        const espera = esperarAjax(20000);
        f.click();
        await espera;
        await esperarA(() => filasConLapiz().length > 0, 8000);
        if (!filasConLapiz().length) {
          estado('Con el filtro puesto no aparece ningun expediente con lapiz.', true);
          return;
        }
      }
      marcarPreparando(false);

      if (paginaActual() !== 0) {
        estado('Voy a la primera pagina...');
        await irAPagina(0);
      }

      const lista = [];
      const vistos = {};
      let trabada = null;
      for (let vueltas = 0; vueltas < 200; vueltas++) {
        filasConLapiz().forEach((x) => {
          if (!x.expediente || vistos[x.expediente]) return;
          vistos[x.expediente] = true;
          lista.push({ expediente: x.expediente, caratula: x.caratula });
        });
        estado('Leyendo pagina ' + (paginaActual() + 1) + ' de ' + cuantasPaginas() +
          '... (' + lista.length + ' expediente/s)');
        if (abortar) break;
        const sig = paginaSiguiente();
        if (!sig) break;
        const antes = paginaActual();
        const espera = esperarAjax(20000);
        sig.click();
        await espera;
        if (!(await esperarA(() => paginaActual() !== antes, 8000))) { trabada = antes + 1; break; }
        await dormir(500);
      }

      if (abortar) {
        estado('Cortado por vos. La lista no se armo.');
        return;
      }
      if (paginaActual() !== 0) await irAPagina(0);
      guardarLista(lista);
      mostrarLista(lista, null);
      irASolapa('elegir');
      estado((lista.length
        ? lista.length + ' expediente(s) con nota disponible. Tilda en cuales dejar nota.'
        : 'No hay expedientes con lapiz en esta lista.') +
        (trabada ? ' Ojo: no pude pasar de la pagina ' + trabada + ', la lista puede estar incompleta.' : ''),
        !!trabada);
    } catch (e) {
      estado('No se pudo preparar la lista: ' + (e && e.message ? e.message : e), true);
    } finally {
      marcarPreparando(false);
      corriendo = false;
      botones(false);
      // Mientras corria, el observador no repinta: se actualiza la cuenta ahora.
      revisar();
    }
  }

  // ------------------------------------------------------------------ panel

  function estado(txt, malo) {
    if (!elEstado) return;
    elEstado.textContent = txt;
    elEstado.style.color = malo ? '#b3261e' : '#123';
  }

  // Aviso automatico de revisar(). No pisa un mensaje propio (un resultado, un
  // error, el avance): solo reemplaza al aviso automatico anterior.
  function estadoAuto(txt) {
    if (!elEstado) return;
    const actual = elEstado.textContent;
    if (actual && actual !== mensajeAuto) return;
    mensajeAuto = txt;
    estado(txt);
  }

  const qp = (n) => (elPanel ? elPanel.querySelector('[data-b="' + n + '"]') : null);

  function botones(activo) {
    ['todos', 'elegir', 'navTodos', 'navElegir', 'rehacer', 'marcarTodas', 'marcarNinguna', 'marcarInvertir', 'buscar'].forEach((n) => {
      const b = qp(n);
      if (!b) return;
      if ('disabled' in b) b.disabled = activo;
      b.style.opacity = activo ? 0.6 : 1;
      b.style.pointerEvents = activo ? 'none' : '';
    });
    const l = qp('lista');
    if (l) l.querySelectorAll('input').forEach((i) => { i.disabled = activo; });
    const c = qp('cortar');
    if (c) c.style.display = activo ? '' : 'none';
  }

  // Dos solapas, igual que la descarga: "Nota en todos" y "Elegir expedientes".
  function irASolapa(cual) {
    if (!elPanel) return;
    qp('tabTodos').style.display = cual === 'todos' ? '' : 'none';
    qp('tabElegir').style.display = cual === 'elegir' ? '' : 'none';
    qp('navTodos').classList.toggle('act', cual === 'todos');
    qp('navElegir').classList.toggle('act', cual === 'elegir');
  }

  // resultado (opcional): { 'CIV 032733/1980': 'ok' | 'mal' } de la ultima tanda.
  function mostrarLista(lista, resultado) {
    if (!elPanel) return;
    listaRef = Array.isArray(lista) ? lista : [];
    qp('preLista').style.display = 'none';
    qp('controles').style.display = '';
    const cont = qp('lista');
    cont.innerHTML = '';
    if (!listaRef.length) {
      cont.innerHTML = '<div style="padding:.6em;font-size:.85em;color:#8a2b2b">No hay expedientes con lapiz en esta lista.</div>';
    }
    listaRef.forEach((x, i) => {
      const fila = document.createElement('label');
      fila.dataset.txt = ((x.expediente || '') + ' ' + (x.caratula || '')).toLowerCase();
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = false; // nada viene tildado: cada vez se elige
      cb.dataset.idx = String(i);
      cb.addEventListener('change', contarElegidos);
      const txt = document.createElement('span');
      txt.innerHTML = '<b>' + esc(x.expediente) + '</b>' +
        (x.caratula ? '<br><span class="car">' + esc(x.caratula) + '</span>' : '');
      fila.appendChild(cb);
      fila.appendChild(txt);
      const r = resultado && resultado[x.expediente];
      if (r) {
        const s = document.createElement('span');
        s.className = 'res';
        s.textContent = r === 'ok' ? 'nota dejada' : 'no salio';
        s.style.color = r === 'ok' ? '#1b6b3a' : '#b3261e';
        fila.appendChild(s);
      }
      cont.appendChild(fila);
    });
    qp('buscar').value = '';
    contarElegidos();
  }

  function contarElegidos() {
    if (!elPanel) return;
    const total = listaRef ? listaRef.length : 0;
    const sel = qp('lista').querySelectorAll('input:checked').length;
    qp('contador').textContent = sel + ' de ' + total;
    if (listaRef) qp('elegir').textContent = 'Dejar nota en seleccionados (' + sel + ')';
  }

  const elegidos = () => [...qp('lista').querySelectorAll('input:checked')]
    .map((c) => listaRef[+c.dataset.idx].expediente);

  const filasVisibles = () => [...qp('lista').querySelectorAll('label')]
    .filter((l) => l.style.display !== 'none');

  function filtrarLista() {
    const t = (qp('buscar').value || '').trim().toLowerCase();
    [...qp('lista').querySelectorAll('label')].forEach((l) => {
      l.style.display = (!t || l.dataset.txt.indexOf(t) >= 0) ? '' : 'none';
    });
  }

  function rehacerLista() {
    if (corriendo) return;
    borrarLista();
    listaRef = null;
    qp('lista').innerHTML = '';
    qp('controles').style.display = 'none';
    qp('preLista').style.display = '';
    qp('elegir').textContent = 'Preparar lista';
    estado('Toca "Preparar lista" para volver a leer los expedientes.');
  }

  function construir() {
    if (document.getElementById('notatomic')) return;
    const st = document.createElement('style');
    st.textContent = [
      '#notatomic{position:fixed;right:16px;bottom:16px;z-index:2147483000;font-family:Segoe UI,Arial,sans-serif}',
      '#notatomic .caja{background:#fff;border:2px solid ' + AZUL + ';border-radius:8px;box-shadow:0 5px 18px rgba(0,0,0,.3);' +
      'width:340px;min-width:270px;max-width:96vw;min-height:150px;max-height:88vh;overflow:auto;resize:both;font-size:13px}',
      '#notatomic .caja::-webkit-resizer{background:' + AZUL + '}',
      '#notatomic .barra{background:' + AZUL + ';color:#fff;padding:.45em .8em;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;font-size:1.05em}',
      '#notatomic .cuerpo{padding:.7em}',
      '#notatomic button{background:' + AZUL_CLARO + ';color:#fff;border:0;border-radius:5px;padding:.5em .8em;cursor:pointer;font-size:1em;margin:0 .3em .4em 0}',
      '#notatomic button.sec{background:#5a7581}',
      '#notatomic .est{font-size:.92em;border-top:1px solid #e6ecef;padding-top:.5em;margin-top:.3em;min-height:2.4em;line-height:1.4}',
      '#notatomic .pie{font-size:.82em;color:#777;border-top:1px solid #eee;margin-top:.4em;padding-top:.35em}',
      '#notatomic .pie a{color:' + AZUL + ';text-decoration:none}',
      '#notatomic .pastilla{background:' + AZUL + ';color:#fff;padding:7px 12px;border-radius:16px;cursor:move;font-weight:600;box-shadow:0 3px 10px rgba(0,0,0,.3);user-select:none;font-size:13px}',
      // solapas, lista y botones chicos del modo "Elegir expedientes"
      '#notatomic .solapas{display:flex;gap:3px;margin:-.2em 0 .6em;border-bottom:1px solid #dbe4e8}',
      '#notatomic .solapas button{flex:1;background:transparent;color:#5a7581;border:0;border-bottom:2px solid transparent;border-radius:0;padding:.45em .2em;margin:0;font-weight:600;font-size:.92em}',
      '#notatomic .solapas button.act{color:' + AZUL + ';border-bottom-color:' + AZUL + '}',
      '#notatomic button.mini{background:#eaf1f8;color:' + AZUL + ';border:1px solid #b9cde0;border-radius:4px;padding:.3em .55em;font-size:.8em;font-weight:600;margin:0}',
      '#notatomic .lista{max-height:240px;overflow:auto;border:1px solid #dbe4e8;border-radius:5px;margin:.45em 0 .5em;background:#fbfdfe}',
      '#notatomic .lista label{display:flex;gap:.5em;align-items:flex-start;padding:.3em .45em;border-bottom:1px solid #eef2f4;cursor:pointer;font-size:.85em;line-height:1.35}',
      '#notatomic .lista input{margin-top:.15em;flex:none}',
      '#notatomic .lista .car{color:#5a7581}',
      '#notatomic .lista .res{margin-left:auto;padding-left:.4em;font-weight:700;white-space:nowrap;font-size:.9em}',
      '#notatomic .link{font-size:.8em;color:#0a6cab;cursor:pointer;text-decoration:underline}',
      '#notatomic .expl{font-size:.88em;color:#3a4c54;margin-bottom:.6em;line-height:1.45}'
    ].join('\n');
    document.head.appendChild(st);

    const cont = document.createElement('div');
    cont.id = 'notatomic';
    cont.innerHTML =
      '<div class="caja">' +
      '<div class="barra"><b>SuPJN+ NOTATOMIC</b><span><span data-b="min" style="cursor:pointer;padding:0 .4em">&#9472;</span>' +
      '<span data-b="cerrar" style="cursor:pointer;padding:0 .25em">&#10005;</span></span></div>' +
      '<div class="cuerpo">' +
      '<div class="solapas">' +
      '<button data-b="navTodos">Nota en todos</button>' +
      '<button data-b="navElegir">Elegir expedientes</button>' +
      '</div>' +
      // Solapa "Nota en todos": el modo de siempre
      '<div data-b="tabTodos" style="display:none">' +
      '<div class="expl">Deja nota en <b>todos</b> los expedientes con lapiz, recorriendo todas las paginas.</div>' +
      '<button data-b="todos" style="width:100%;padding:.7em;font-size:1.05em;font-weight:600">Dejar nota en TODOS</button>' +
      '</div>' +
      // Solapa "Elegir expedientes": primero la lista, despues la nota
      '<div data-b="tabElegir" style="display:none">' +
      '<div data-b="preLista" class="expl">Primero <b>Preparar lista</b>: recorre todas las paginas sin dejar ninguna nota. Despues tildas en cuales dejar nota.</div>' +
      '<div data-b="controles" style="display:none">' +
      '<div style="display:flex;justify-content:flex-end;margin:-.2em 0 .3em"><span data-b="rehacer" class="link" title="Volver a leer los expedientes desde cero">rehacer lista</span></div>' +
      '<input data-b="buscar" type="text" placeholder="Filtrar por numero o caratula..." ' +
      'style="width:100%;box-sizing:border-box;padding:.35em;border:1px solid #b9c9d0;border-radius:4px;font-size:.9em">' +
      '<div style="display:flex;gap:.35em;align-items:center;margin-top:.45em">' +
      '<button data-b="marcarTodas" class="mini">Todas</button>' +
      '<button data-b="marcarNinguna" class="mini">Ninguna</button>' +
      '<button data-b="marcarInvertir" class="mini">Invertir</button>' +
      '<span data-b="contador" style="margin-left:auto;font-size:.85em;color:#5a7581">0 de 0</span>' +
      '</div>' +
      '<div data-b="lista" class="lista"></div>' +
      '</div>' +
      '<button data-b="elegir" style="width:100%;padding:.7em;font-size:1.05em;font-weight:600">Preparar lista</button>' +
      '</div>' +
      '<button data-b="cortar" class="sec" style="display:none;background:#b3261e;width:100%">Cortar</button>' +
      '<div data-b="cuenta" style="font-size:.85em;color:#5a7581;margin:.2em 0 .3em"></div>' +
      '<div style="font-size:.85em;color:#5a7581;margin-top:.3em">pausa entre uno y otro ' +
      '<input data-b="pausa" type="text" value="700" style="width:4em;padding:.2em;border:1px solid #b9c9d0;border-radius:4px;font-size:1em"> ms</div>' +
      '<div class="est" data-b="estado"></div>' +
      '<div class="pie">' + esc(APP.version) + ' | ' + esc(APP.autor) + ' | ' +
      '<a href="' + esc(APP.licenciaUrl) + '" target="_blank" rel="noopener">' + esc(APP.licencia) + '</a> | ' +
      '<a href="' + esc(APP.github) + '" target="_blank" rel="noopener">repositorio</a></div>' +
      '</div></div>' +
      '<div class="pastilla" style="display:none">SuPJN+ NOTATOMIC</div>';
    document.body.appendChild(cont);

    elPanel = cont;
    elEstado = cont.querySelector('[data-b="estado"]');
    const caja = cont.querySelector('.caja');
    const pastilla = cont.querySelector('.pastilla');
    const barra = cont.querySelector('.barra');

    const minimizar = (v) => {
      caja.style.display = v ? 'none' : 'block';
      pastilla.style.display = v ? 'block' : 'none';
    };

    // El tamano que elijas queda guardado para la proxima vez.
    const CLAVE_TAM = 'notatomic_tam';
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_TAM) || 'null');
      if (g && g.w) { caja.style.width = g.w + 'px'; caja.style.height = g.h ? g.h + 'px' : ''; }
    } catch (e) { /* sin tamano guardado */ }
    // Accesibilidad: la letra acompaña al tamaño del cuadro. Estirandolo se
    // agranda todo el panel, no solo el recuadro vacio. Arranca en 13 px con el
    // ancho de fabrica (340) y llega hasta 30 px.
    const escalarLetra = () => {
      const w = caja.offsetWidth || 340;
      const px = Math.max(13, Math.min(30, 13 * (w / 340)));
      caja.style.fontSize = px.toFixed(1) + 'px';
    };
    escalarLetra();

    let guardarTam = null;
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        escalarLetra();
        clearTimeout(guardarTam);
        guardarTam = setTimeout(() => {
          try {
            localStorage.setItem(CLAVE_TAM, JSON.stringify({
              w: Math.round(caja.offsetWidth), h: Math.round(caja.offsetHeight)
            }));
          } catch (e) { /* sin persistencia */ }
        }, 400);
      }).observe(caja);
    }
    const aplicarPos = (l, t) => {
      const a = cont.offsetWidth || 140;
      cont.style.left = Math.max(4, Math.min(l, window.innerWidth - Math.min(a, 100) - 4)) + 'px';
      cont.style.top = Math.max(4, Math.min(t, window.innerHeight - 28)) + 'px';
      cont.style.right = 'auto'; cont.style.bottom = 'auto';
    };
    let arrastrado = false;
    const arrastre = (mango) => {
      let sx, sy, ox, oy, mov = false, arr = false;
      mango.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-b]')) return;
        e.preventDefault();
        arrastrado = false;
        const r = cont.getBoundingClientRect();
        ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY; mov = true; arr = false;
        document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
      });
      function mm(e) {
        if (!mov) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!arr && Math.abs(dx) + Math.abs(dy) < 4) return;
        arr = true; cont.style.userSelect = 'none';
        aplicarPos(ox + dx, oy + dy);
      }
      function mu() {
        mov = false; cont.style.userSelect = '';
        document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu);
        if (arr) arrastrado = true;
      }
    };
    arrastre(barra); arrastre(pastilla);

    cont.querySelector('[data-b="min"]').addEventListener('click', () => minimizar(true));
    cont.querySelector('[data-b="cerrar"]').addEventListener('click', () => { cont.style.display = 'none'; });
    pastilla.addEventListener('click', () => { if (arrastrado) { arrastrado = false; return; } minimizar(false); });
    cont.querySelector('[data-b="todos"]').addEventListener('click', () => arrancar(null));
    // Al cambiar de solapa, el aviso de la otra deja de valer: se reemplaza
    // por el aviso automatico de la pantalla.
    const cambiarSolapa = (cual) => {
      irASolapa(cual);
      if (corriendo) return;
      mensajeAuto = elEstado ? elEstado.textContent : '';
      revisar();
    };
    qp('navTodos').addEventListener('click', () => cambiarSolapa('todos'));
    qp('navElegir').addEventListener('click', () => cambiarSolapa('elegir'));
    // El mismo boton hace las dos cosas: sin lista, la prepara; con lista,
    // deja nota en los tildados.
    qp('elegir').addEventListener('click', () => {
      if (corriendo) return;
      if (!listaRef) { preparar(); return; }
      arrancar(elegidos());
    });
    qp('rehacer').addEventListener('click', rehacerLista);
    qp('buscar').addEventListener('input', filtrarLista);
    // Todas / Ninguna / Invertir actuan sobre lo que se ve con el filtro puesto.
    qp('marcarTodas').addEventListener('click', () => {
      filasVisibles().forEach((l) => { l.querySelector('input').checked = true; });
      contarElegidos();
    });
    qp('marcarNinguna').addEventListener('click', () => {
      filasVisibles().forEach((l) => { l.querySelector('input').checked = false; });
      contarElegidos();
    });
    qp('marcarInvertir').addEventListener('click', () => {
      filasVisibles().forEach((l) => { const i = l.querySelector('input'); i.checked = !i.checked; });
      contarElegidos();
    });
    cont.querySelector('[data-b="cortar"]').addEventListener('click', () => {
      abortar = true;
      const c = leerCorrida();
      if (c) { c.activa = false; guardarCorrida(c); }
      estado('Cortando: freno despues de la que esta en curso.');
    });

    // Pedido del autor, para todas las apps: arranca SIEMPRE minimizado abajo
    // a la derecha. Queda elegida la solapa de elegir, que no deja ninguna
    // nota hasta que se prepare la lista y se tilde algo.
    minimizarPanel = minimizar;
    irASolapa('elegir');
    minimizar(true);
  }

  // ------------------------------------------------------------ ciclo de vida

  function revisar() {
    const hayLapices = filasConLapiz().length;
    const cuenta = qp('cuenta');
    if (!hayLapices) {
      if (elEstado && !corriendo) {
        if (cuenta) cuenta.textContent = '';
        estadoAuto(botonFiltroNota()
          ? 'La lista no tiene puesto el filtro "Dejar nota". Los dos modos lo ponen solos.'
          : 'Esta lista no tiene la columna de nota.');
      }
      return;
    }
    if (corriendo) return;
    if (cuenta) cuenta.textContent = hayLapices + ' expediente(s) con nota disponible en esta pagina';
    estadoAuto('Todo listo para dejar nota. Si hay mas paginas, sigue solo.');
  }

  let pendiente = null;
  function iniciar() {
    construir();
    // La lista armada sigue en el panel aunque la pagina se recargue.
    const lista = leerLista();
    if (lista) mostrarLista(lista, null);
    revisar();
    // Si veniamos de confirmar una nota, la pagina se recargo: se sigue solo.
    // Es el unico caso en que el panel se abre sin tocarlo, para ver el avance.
    const c = leerCorrida();
    if (c && c.activa) {
      if (minimizarPanel) minimizarPanel(false);
      irASolapa(c.solo ? 'elegir' : 'todos');
      // Durante la tanda se ven tildados los elegidos, para saber sobre cuales trabaja.
      if (c.solo && listaRef) {
        qp('lista').querySelectorAll('input').forEach((i) => {
          i.checked = c.solo.indexOf(listaRef[+i.dataset.idx].expediente) >= 0;
        });
        contarElegidos();
      }
      estado('Retomando la corrida...');
      setTimeout(paso, 900);
    } else if (preparando()) {
      // El filtro "Dejar nota" recargo la pagina en medio de "Preparar lista".
      if (minimizarPanel) minimizarPanel(false);
      irASolapa('elegir');
      estado('Retomando la preparacion de la lista...');
      setTimeout(preparar, 900);
    }
    const obs = new MutationObserver(() => {
      if (corriendo) return; // durante el recorrido no se repinta, para no pisar el proceso
      clearTimeout(pendiente);
      pendiente = setTimeout(revisar, 600);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

/* ===========================================================================
 * CAUSAS - Vista propia de la lista de expedientes relacionados
 * ---------------------------------------------------------------------------
 * Modulo de SuPJN+. Corre en la lista de expedientes (consultaLista...).
 *
 * QUE RESUELVE
 *   La lista del PJN muestra de a 15 expedientes y filtra y ordena del lado
 *   del servidor, de a un criterio por vez. Esta vista trae todos los
 *   relacionados, en tramite y fuera de tramite, y deja buscar, filtrar,
 *   ordenar, etiquetar y anotar sobre una sola tabla.
 *
 * COMO SE LEE (relevado el 11/09/2026 sobre la lista de Relacionados)
 *   - No hay endpoint JSON. La Consulta Web es JSF (RichFaces y PrimeFaces):
 *     el paginado es un POST a la misma pagina que devuelve HTML parcial. Los
 *     datos solo estan en la tabla.
 *   - La lista se lee en un MARCO OCULTO con la misma sesion. El marco pagina
 *     por su cuenta y la pestaña visible no se mueve: probado, la pestaña
 *     siguio paginando normal mientras el marco leia.
 *   - Primero se lee tal como viene (en tramite). Despues se tilda "Ver todos
 *     los expedientes" y se aprieta Consultar, que recarga el marco, y se lee
 *     de nuevo: lo que aparece solo en la segunda pasada esta fuera de
 *     tramite. Tildarlo en el marco no cambia la lista visible ni la proxima
 *     carga de la pagina (probado).
 *   - Paginador: ul.pagination; la pagina activa es li.active; los numeros son
 *     enlaces con el numero como texto, en ventanas de 10; "Siguiente" y
 *     "Ultima pagina" son enlaces con un span[title].
 *   - Fila: tbody tr con cinco td.column (Expediente, Dependencia, Caratula,
 *     Situacion, Ult. Act.), la columna de acciones (el ojo es "visualizar
 *     expediente") y la estrella de favoritos (fa-star-o o fa-star).
 *
 * DONDE SE GUARDA
 *   Todo en el almacen de Tampermonkey de esta PC (GM_setValue): la lista
 *   leida, la configuracion de la vista, las etiquetas y las anotaciones. Nada
 *   sale de la PC. Etiquetas y anotaciones se respaldan A MANO con Exportar, y
 *   la vista muestra la fecha de la ultima copia. No hay guardado automatico.
 *
 * TERMINOLOGIA
 *   ANOTACIONES son las notas privadas de trabajo. Se llaman asi para no
 *   confundirlas con "dejar nota", que es el acto procesal (NOTATOMIC).
 *
 * ABRIR UN EXPEDIENTE
 *   El PJN abre un expediente solo desde el ojo de su fila en la lista
 *   visible. Se lleva el paginador visible a la pagina donde estaba la causa,
 *   se verifica el numero y se aprieta el ojo. Si es fuera de tramite y la
 *   lista visible no tiene tildado "Ver todos", se deja un encargo, se tilda,
 *   se consulta y se sigue al recargar.
 * =========================================================================== */
(function () {
  'use strict';

  if (window.top !== window.self) return;
  if (!/\/scw\/consultaLista/i.test(location.pathname)) return;

  const APP = {
    nombre: 'SuPJN+ CAUSAS',
    version: 'beta 0.1.0', // mismo numero que el resto del script
    autor: 'Ignacio Kinbaum',
    anio: '2026',
    mail: 'estudiojuridicokinbaum@gmail.com',
    licencia: 'GPL-3.0-or-later',
    licenciaUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    github: 'https://github.com/Elzas85/SUPJNPLUS'
  };

  const AZUL = '#14416f';
  const AZUL_CLARO = '#5084ce';

  const K_CAUSAS = 'supjn.causas.v1';
  const K_CFG = 'supjn.cfg.v1';
  const K_MARCAS = 'supjn.marcas.v1';
  const K_RESPALDO = 'supjn.respaldo.v1';
  const K_ENCARGO = 'supjn_abrir';          // sessionStorage: causa a abrir tras recargar
  const VIEJA_DESPUES_DE = 30 * 60 * 1000;  // al abrir la vista, se relee si la lista tiene mas de 30 minutos
  const DIAS_AVISO_COPIA = 15;              // la copia se pide cada 15 dias

  // --------------------------------------------------------------- utilidades

  const limpio = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => limpio(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const clave = (exp) => limpio(exp).toUpperCase();
  const fueroDe = (exp) => { const m = /^([A-Z]{2,4})\s/.exec(clave(exp)); return m ? m[1] : ''; };

  // "26/06/2025" -> 20250626, para ordenar y comparar con los campos de fecha
  function numFecha(t) {
    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t || '');
    return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0;
  }
  const numDeInput = (v) => (v ? parseInt(String(v).replace(/-/g, ''), 10) || 0 : 0);

  // "CIV 012345/2023/1" -> "CIV|2023|012345|1", para ordenar por fuero, año y numero
  function ordenExp(exp) {
    const m = /^([A-Z]{2,4})\s+0*(\d+)\/(\d{4})(?:\/(\d+))?/.exec(clave(exp));
    if (!m) return clave(exp);
    return m[1] + '|' + m[3] + '|' + m[2].padStart(8, '0') + '|' + (m[4] || '0').padStart(3, '0');
  }

  function fechaHora(ms) {
    const d = new Date(ms);
    const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '/' + mm + '/' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  const soloFecha = (ms) => fechaHora(ms).slice(0, 10);
  const diasDesde = (ms) => Math.floor((Date.now() - ms) / 86400000);
  const selloArchivo = () => new Date().toISOString().slice(0, 10);

  // ------------------------------------------------------------------ almacen

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

  // --------------------------------------------------- lectura de la lista

  // La tabla de expedientes es la que tiene "Expediente" y "Caratula" en la
  // cabecera. Si hubiera mas de una, la mas larga.
  function tablaDe(doc) {
    let mejor = null;
    doc.querySelectorAll('table').forEach((t) => {
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
        fav: / fa-star /.test(cls)
      });
    });
    return out;
  }

  // El PJN escribe la fecha a veces sin el cero del dia ("5/09/2026", visto
  // el 11/09/2026 en 66 de 232 causas). Se deja siempre como dd/mm/aaaa, para
  // que se vea parejo y la busqueda por texto encuentre la fecha igual.
  function fechaPareja(t) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
    return m ? m[1].padStart(2, '0') + '/' + m[2].padStart(2, '0') + '/' + m[3] : t;
  }

  const firma = (doc) => filasDe(doc).map((f) => f.exp).join('|');

  function paginaActiva(doc) {
    const li = doc.querySelector('ul.pagination li.active');
    const n = li ? parseInt(limpio(li.textContent), 10) : NaN;
    return isNaN(n) ? 1 : n;
  }

  function enlacesPagina(doc) {
    return [...doc.querySelectorAll('ul.pagination li a')].map((a) => {
      const t = a.querySelector('[title]');
      return { a, n: parseInt(limpio(a.textContent), 10), tit: t ? (t.getAttribute('title') || '') : (a.getAttribute('title') || '') };
    });
  }

  function enlaceSiguiente(doc) {
    const act = paginaActiva(doc);
    const ls = enlacesPagina(doc);
    const directo = ls.find((x) => x.n === act + 1);
    if (directo) return directo.a;
    const flecha = ls.find((x) => /siguiente/i.test(x.tit));
    return flecha ? flecha.a : null;
  }

  // Espera a que el PJN termine de cambiar de pagina: tiene que cambiar el
  // numero activo y tambien las filas, porque RichFaces no los redibuja juntos.
  // Se escucha el DOM con un MutationObserver en lugar de preguntar cada tanto:
  // con la pestaña en segundo plano Chrome frena los temporizadores hasta uno
  // por minuto, y los observadores no (visto el 11/09/2026 sobre la lista real).
  function esperarCambio(doc, antes, firmaAntes, ms) {
    const listo = () => paginaActiva(doc) !== antes && firma(doc) !== firmaAntes;
    return new Promise((resolve) => {
      if (listo()) { resolve(true); return; }
      let hecho = false;
      const fin = (v) => { if (hecho) return; hecho = true; obs.disconnect(); clearTimeout(vence); resolve(v); };
      const obs = new MutationObserver(() => { try { if (listo()) fin(true); } catch (e) { /* el DOM se esta rearmando */ } });
      obs.observe(doc.documentElement, { childList: true, subtree: true, characterData: true });
      const vence = setTimeout(() => { let v = false; try { v = listo(); } catch (e) { v = false; } fin(v); }, ms);
    });
  }

  async function irAPagina(doc, destino) {
    for (let vueltas = 0; vueltas < 40; vueltas++) {
      const act = paginaActiva(doc);
      if (act === destino) return true;
      const ls = enlacesPagina(doc).filter((x) => !isNaN(x.n));
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
      if (!(await esperarCambio(doc, act, f, 20000))) return false;
    }
    return paginaActiva(doc) === destino;
  }

  const casillaVerTodos = (doc) => [...doc.querySelectorAll('input[type=checkbox]')]
    .find((c) => /ver todos los expedientes/i.test(limpio((c.closest('tr') || c.parentElement || {}).textContent)));

  const botonConsultar = (doc) => [...doc.querySelectorAll('input[type=submit], input[type=button], button')]
    .find((b) => /^consultar$/i.test(limpio(b.value || b.textContent)));

  const esListaRelacionados = (doc) => /expedientes relacionados/i.test(limpio(doc.body ? doc.body.innerText : '').slice(0, 6000));

  const VENCIDA = 'la sesión del PJN venció. Recargá la página del PJN, volvé a entrar si lo pide y tocá Actualizar lista';

  // Espera a que el marco tenga la lista cargada. disparar() hace lo que
  // provoca la carga (poner la direccion o apretar Consultar). Va por el
  // evento load y no por temporizadores, por el mismo motivo que esperarCambio.
  function esperarCarga(fr, disparar) {
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
        // Si la sesion del PJN vencio, el marco termina en el login del SSO
        // (sso.pjn.gov.ar), que es otro origen y no se deja leer. Probado el
        // 11/09/2026: sin este control, la lectura esperaba un minuto en vano.
        if (!d) { terminar(new Error(VENCIDA)); return; }
        if (!d.body || d.location.href === 'about:blank') return; // carga inicial del marco vacio
        if (d.querySelector('input[type=password]')) { terminar(new Error(VENCIDA)); return; }
        if (tablaDe(d) || /no se encontraron|no posee|sin resultados/i.test(limpio(d.body.innerText).slice(0, 6000))) { terminar(); return; }
        terminar(new Error('el PJN devolvió una página inesperada en lugar de la lista'));
      };
      fr.addEventListener('load', alCargar);
      const vence = setTimeout(() => terminar(new Error('la lista del PJN no terminó de cargar')), 60000);
      try { disparar(); } catch (e) { terminar(e); }
    });
  }

  let cancelar = false;

  async function recorrer(fr, que, avisar) {
    const doc = fr.contentDocument;
    if (paginaActiva(doc) !== 1 && !(await irAPagina(doc, 1))) throw new Error('no pude volver a la primera página');
    const out = [];
    const vistos = {};
    for (let vuelta = 0; vuelta < 400; vuelta++) {
      if (cancelar) throw new Error('cortado');
      const pag = paginaActiva(doc);
      filasDe(doc).forEach((f) => {
        if (vistos[f.exp]) return;
        vistos[f.exp] = true;
        f.pag = pag;
        out.push(f);
      });
      avisar('Leyendo ' + que + ': página ' + pag + ' (' + out.length + ' causas)');
      const sig = enlaceSiguiente(doc);
      if (!sig) break;
      const fAntes = firma(doc);
      sig.click();
      if (!(await esperarCambio(doc, pag, fAntes, 25000))) throw new Error('la página ' + (pag + 1) + ' no respondió');
    }
    return out;
  }

  async function leerTodo(avisar) {
    const fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true');
    fr.tabIndex = -1;
    fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1280px;height:900px;border:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(fr);
    try {
      avisar('Abriendo la lista de Relacionados en segundo plano...');
      await esperarCarga(fr, () => { fr.src = '/scw/consultaListaRelacionados.seam'; });
      if (!esListaRelacionados(fr.contentDocument)) throw new Error('el PJN no devolvió la lista de Relacionados');
      const casilla0 = casillaVerTodos(fr.contentDocument);
      if (casilla0 && casilla0.checked) throw new Error('la lista vino con "Ver todos" tildado');
      const tramite = await recorrer(fr, 'en trámite', avisar);

      const casilla = casillaVerTodos(fr.contentDocument);
      const consultar = botonConsultar(fr.contentDocument);
      if (!casilla || !consultar) throw new Error('no encuentro "Ver todos los expedientes" en la lista');
      if (cancelar) throw new Error('cortado');
      avisar('Pido también las causas fuera de trámite...');
      await esperarCarga(fr, () => { casilla.checked = true; consultar.click(); });
      const casilla2 = casillaVerTodos(fr.contentDocument);
      if (!casilla2 || !casilla2.checked) throw new Error('el PJN no tomó "Ver todos los expedientes"');
      const todas = await recorrer(fr, 'fuera de trámite', avisar);

      const deTramite = {};
      tramite.forEach((f) => { deTramite[f.exp] = f; });
      const causas = todas.map((f) => ({
        exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, fav: f.fav,
        tramite: !!deTramite[f.exp],
        pagTodas: f.pag,
        pagTramite: deTramite[f.exp] ? deTramite[f.exp].pag : null
      }));
      const enTodas = {};
      causas.forEach((c) => { enTodas[c.exp] = true; });
      tramite.forEach((f) => {
        if (enTodas[f.exp]) return;
        causas.push({ exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, fav: f.fav, tramite: true, pagTodas: null, pagTramite: f.pag });
      });
      return {
        fecha: Date.now(),
        causas,
        enTramite: causas.filter((c) => c.tramite).length,
        total: causas.length
      };
    } finally {
      fr.remove();
    }
  }

  // ------------------------------------------------- etiquetas y anotaciones
  //
  // Van indexadas por numero de expediente ("CIV 012345/2023"). Se guardan en
  // el almacen de Tampermonkey de esta PC y se llevan a otra con Exportar e
  // Importar. La importacion no pisa nada: suma etiquetas y, si una anotacion
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
  let RESPALDO = leerAlmacen(K_RESPALDO, null); // { fecha } de la ultima exportacion

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

  function bajarArchivo(texto, nombre) {
    const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function exportarMarcas() {
    bajarArchivo(JSON.stringify({
      formato: 'supjn+/marcas', version: 1, fecha: new Date().toISOString(),
      etiquetas: MARCAS.etiquetas, filas: MARCAS.filas
    }, null, 1), 'SuPJN+-etiquetas-' + selloArchivo() + '.json');
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

  // ---------------------------------------------------------- estado de vista

  const CFG_DEF = {
    texto: '', fuero: '', sit: '', tramite: 'todas', etiqueta: '', desde: '', hasta: '',
    orden: { col: 'ult', desc: true }, porPagina: 25, maxi: false
  };
  let CFG = Object.assign({}, CFG_DEF, leerAlmacen(K_CFG, {}) || {});
  const guardarCfg = () => guardarAlmacen(K_CFG, CFG);

  let DATOS = leerAlmacen(K_CAUSAS, null);
  if (!DATOS || !Array.isArray(DATOS.causas)) DATOS = null;

  let pagina = 1;
  let abierta = null;     // clave de la causa con el detalle desplegado
  let leyendo = false;
  let win = null, pastilla = null, elAviso = null, panelActual = 'lista';

  // Nombres de los fueros, tomados del propio desplegable de Camara del PJN.
  const NOMBRES_FUERO = {};
  document.querySelectorAll('select option').forEach((o) => {
    const m = /^([A-Z]{2,4})\s*-\s*(.+)$/.exec(limpio(o.textContent));
    if (m) NOMBRES_FUERO[m[1]] = m[2];
  });

  const COLS = [
    { k: 'exp', t: 'Expediente', an: 13 },
    { k: 'dep', t: 'Dependencia', an: 17 },
    { k: 'car', t: 'Carátula', an: 24 },
    { k: 'sit', t: 'Situación', an: 9 },
    { k: 'ult', t: 'Últ. act.', an: 8 },
    { k: 'et', t: 'Etiquetas', an: 11 },
    { k: 'nota', t: 'Anotación', an: 12 }
  ];

  const valorOrden = (c, k) =>
    k === 'exp' ? ordenExp(c.exp) :
    k === 'ult' ? String(numFecha(c.ult)).padStart(8, '0') :
    k === 'et' ? norm(etiquetasDe(c.exp).map((e) => e.nom).join(' ')) :
    k === 'nota' ? norm(marcaDe(c.exp).nota) :
    norm(c[k]);

  function filtradas() {
    if (!DATOS) return [];
    const t = norm(CFG.texto);
    const desde = numDeInput(CFG.desde), hasta = numDeInput(CFG.hasta);
    const L = DATOS.causas.filter((c) => {
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
      if (CFG.etiqueta === '@nota' && !String(m.nota || '').trim()) return false;
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
  //
  // Paleta del propio PJN: el azul oscuro de la barra superior y el azul del
  // encabezado de las tablas, igual que los paneles de descarga y NOTATOMIC.

  const CSS = [
    '#supjn-pastilla{position:fixed;right:16px;bottom:16px;z-index:2147482600;background:' + AZUL + ';color:#fff;padding:7px 12px;border-radius:16px;cursor:pointer;font:600 13px "Segoe UI",Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);user-select:none;border:0}',
    '#supjn-pastilla:hover{background:#1c5591}',
    '#supjn-pastilla .cant{background:rgba(255,255,255,.22);border-radius:9px;padding:0 6px;margin-left:6px;font-weight:600}',
    // La ventana va por encima de la pastilla de NOTATOMIC: abierta, la tapa; cerrada, las dos pastillas quedan a la vista.
    '#supjn-fondo{position:fixed;inset:0;background:rgba(10,30,50,.45);z-index:2147483050}',
    '#supjn{position:fixed;z-index:2147483100;left:4vw;top:5vh;width:92vw;height:88vh;background:#fff;border-radius:8px;box-shadow:0 18px 60px rgba(0,0,0,.45);display:flex;flex-direction:column;font:13px/1.45 "Segoe UI",Arial,sans-serif;color:#1d2b36;overflow:hidden}',
    '#supjn.maxi{left:0;top:0;width:100vw;height:100vh;border-radius:0}',
    '#supjn *{box-sizing:border-box}',
    '.sj-tit{display:flex;align-items:center;gap:10px;background:' + AZUL + ';color:#fff;height:38px;padding:0 6px 0 14px;flex:none;user-select:none}',
    '.sj-tit b{letter-spacing:.03em;font-size:14px}',
    '.sj-tit .v{opacity:.7;font-size:11px}',
    '.sj-tit .ctrl{margin-left:auto;display:flex;gap:2px}',
    '.sj-tit .ctrl button{background:transparent;border:0;color:#fff;width:30px;height:26px;border-radius:4px;cursor:pointer;font:400 15px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .ctrl button:hover{background:rgba(255,255,255,.18)}',
    '.sj-tit .ctrl button.x:hover{background:#c93b3b}',
    '.sj-barra{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;padding:8px 12px;border-bottom:1px solid #dbe4e8;background:#f5f8fa;flex:none}',
    '.sj-barra > *{height:30px;font:12px "Segoe UI",Arial,sans-serif}',
    '.sj-barra input[type=text]{flex:1 1 220px;min-width:180px;border:1px solid #b9c9d0;border-radius:5px;padding:0 9px}',
    '.sj-barra select,.sj-barra input[type=date]{height:30px;border:1px solid #b9c9d0;border-radius:5px;padding:0 6px;background:#fff;color:#1d2b36;max-width:200px}',
    '.sj-barra label{display:inline-flex;align-items:center;gap:5px;color:#5a7581}',
    '.sj-b{border:1px solid #b9cde0;background:#eaf1f8;color:' + AZUL + ';border-radius:5px;padding:0 11px;cursor:pointer;font:600 12px "Segoe UI",Arial,sans-serif;height:30px}',
    '.sj-b:hover{background:#dbe8f5}',
    '.sj-b.prim{background:' + AZUL_CLARO + ';border-color:' + AZUL_CLARO + ';color:#fff}',
    '.sj-b.prim:hover{background:#3f72bb}',
    '.sj-b.peligro{background:#b3261e;border-color:#b3261e;color:#fff}',
    '.sj-b:disabled{opacity:.5;cursor:default}',
    '.sj-est{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;padding:6px 12px;border-bottom:1px solid #e6ecef;flex:none;font-size:12px;color:#3a4c54}',
    '.sj-est .txt{flex:1 1 320px}',
    '.sj-copia{border-radius:12px;padding:3px 10px;font-weight:600;cursor:pointer;border:1px solid transparent;font-size:11.5px}',
    '.sj-copia.ok{background:#e6f4ea;color:#1b6b3a;border-color:#b8dfc4}',
    '.sj-copia.vieja{background:#fdecea;color:#b3261e;border-color:#f3c3be}',
    '.sj-copia.nunca{background:#fff4d6;color:#7a5a00;border-color:#f0dca0}',
    '.sj-aviso{padding:7px 12px;font-size:12px;background:#fff4d6;color:#5c4400;border-bottom:1px solid #f0dca0;flex:none}',
    '.sj-aviso.malo{background:#fdecea;color:#8c1d18;border-color:#f3c3be}',
    '.sj-cuerpo{flex:1;overflow:auto;background:#fff}',
    'table.sj-t{width:100%;min-width:1100px;border-collapse:collapse;table-layout:fixed}',
    'table.sj-t th{position:sticky;top:0;z-index:2;background:' + AZUL + ';color:#fff;text-align:left;font-weight:600;font-size:12px;padding:8px 9px;cursor:pointer;white-space:nowrap;user-select:none}',
    'table.sj-t th:hover{background:#1c5591}',
    'table.sj-t th .fl{opacity:.5;margin-left:5px;font-size:10px}',
    'table.sj-t th.act .fl{opacity:1}',
    'table.sj-t th.acc{cursor:default}',
    'table.sj-t td{padding:7px 9px;border-bottom:1px solid #edf1f3;vertical-align:top;font-size:12.5px;overflow-wrap:anywhere}',
    'table.sj-t tr:nth-child(even) td{background:#fafcfd}',
    'table.sj-t tr:hover td{background:#eef5fc}',
    'table.sj-t tr.fuera td{color:#6b7c85}',
    '.sj-exp{font-family:Consolas,monospace;font-size:12px;white-space:nowrap}',
    '.sj-fav{color:#d39e00;margin-left:4px}',
    '.sj-badge{display:inline-block;margin-top:3px;font-size:10.5px;font-weight:600;color:#6b7c85;background:#eef2f4;border-radius:8px;padding:0 7px}',
    '.sj-chip{display:inline-block;padding:1px 9px;border-radius:10px;font:600 11px "Segoe UI",Arial,sans-serif;margin:0 4px 3px 0;border:1px solid rgba(0,0,0,.12);white-space:nowrap}',
    'button.sj-chip{cursor:pointer}',
    '.sj-chip.off{background:transparent!important;color:#8a98a8!important;border-style:dashed}',
    '.sj-toque{cursor:pointer;min-height:20px;border-radius:4px;margin:-3px -5px;padding:3px 5px}',
    '.sj-toque:hover{background:#e3eefa;box-shadow:inset 0 0 0 1px #b9cde0}',
    '.sj-poner{color:#9fb0ba;font-size:11.5px;font-weight:600;visibility:hidden}',
    'table.sj-t tr:hover .sj-poner{visibility:visible}',
    '.sj-nota-txt{color:#3a4c54;font-size:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.sj-abrir{height:26px;padding:0 10px;border-radius:4px;border:1px solid ' + AZUL_CLARO + ';background:' + AZUL_CLARO + ';color:#fff;font:600 12px "Segoe UI",Arial,sans-serif;cursor:pointer}',
    '.sj-abrir:hover{background:#3f72bb}',
    '.sj-abrir:disabled{opacity:.5;cursor:default}',
    'table.sj-t tr.sj-det td{background:#f7fafc!important;border-bottom:2px solid ' + AZUL_CLARO + ';padding:0}',
    '.sj-det-in{padding:12px 16px 16px;max-width:920px}',
    '.sj-det-in h4{margin:14px 0 5px;font-size:11.5px;color:' + AZUL + ';text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #b9cde0;padding-bottom:3px}',
    '.sj-nueva{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}',
    '.sj-nueva input{height:28px;border:1px solid #b9c9d0;border-radius:5px;padding:0 9px;width:220px}',
    '.sj-cols{display:inline-flex;gap:5px;align-items:center}',
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
    '.sj-panel-in{max-width:780px;margin:0 auto;padding:22px 26px 34px}',
    '.sj-panel-in h2{margin:0 0 6px;font-size:18px;color:' + AZUL + '}',
    '.sj-panel-in h3{margin:22px 0 6px;font-size:13px;color:' + AZUL + ';border-bottom:1px solid #b9cde0;padding-bottom:4px}',
    '.sj-panel-in p{margin:0 0 9px;line-height:1.55;color:#3a4c54}',
    '.sj-panel-in .bts{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 4px}',
    '.sj-panel-in table{border-collapse:collapse;width:100%}',
    '.sj-panel-in td{padding:6px 8px 6px 0;border-bottom:1px solid #edf1f3}',
    '.sj-vacio{padding:34px;text-align:center;color:#6b7c85}'
  ].join('\n');

  // ------------------------------------------------------------------ ventana

  const q = (sel) => (win ? win.querySelector(sel) : null);

  function avisar(txt, malo) {
    elAviso = elAviso || q('[data-e="aviso"]');
    if (!elAviso) return;
    elAviso.style.display = txt ? '' : 'none';
    elAviso.textContent = txt || '';
    elAviso.classList.toggle('malo', !!malo);
  }

  const estadoTxt = (t) => { const e = q('[data-e="estado"]'); if (e) e.textContent = t; };

  function pintarEstado() {
    if (leyendo) return;
    if (!DATOS) { estadoTxt('Todavía no se leyó la lista de Relacionados.'); return; }
    const fuera = DATOS.total - DATOS.enTramite;
    estadoTxt(DATOS.total + ' causas (' + DATOS.enTramite + ' en trámite, ' + fuera + ' fuera de trámite) · leídas el ' + fechaHora(DATOS.fecha));
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

  function pintarBotones() {
    const a = q('[data-a="actualizar"]'), c = q('[data-a="cortar"]');
    if (a) { a.disabled = leyendo; a.textContent = leyendo ? 'Leyendo...' : 'Actualizar lista'; }
    if (c) c.style.display = leyendo ? '' : 'none';
    pintarPastilla();
  }

  function pintarPastilla() {
    if (!pastilla) return;
    pastilla.innerHTML = 'SuPJN+ CAUSAS' + (leyendo
      ? '<span class="cant">leyendo...</span>'
      : (DATOS ? '<span class="cant">' + DATOS.total + '</span>' : ''));
  }

  function opciones(sel, lista, valor) {
    sel.innerHTML = lista.map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + '</option>').join('');
    if (!lista.some(([v]) => v === valor)) valor = lista[0][0];
    sel.value = valor;
    return valor;
  }

  function pintarFiltros() {
    const causas = DATOS ? DATOS.causas : [];
    const fueros = [...new Set(causas.map((c) => fueroDe(c.exp)).filter(Boolean))].sort();
    const sinFuero = causas.some((c) => !fueroDe(c.exp));
    CFG.fuero = opciones(q('[data-f="fuero"]'), [['', 'Todos los fueros']]
      .concat(fueros.map((f) => [f, f + (NOMBRES_FUERO[f] ? ' · ' + NOMBRES_FUERO[f] : '')]))
      .concat(sinFuero ? [['@sin', 'Sin sigla de fuero']] : []), CFG.fuero);
    const sits = [...new Set(causas.map((c) => c.sit).filter(Boolean))].sort();
    CFG.sit = opciones(q('[data-f="sit"]'), [['', 'Todas las situaciones']].concat(sits.map((s) => [s, s])), CFG.sit);
    CFG.etiqueta = opciones(q('[data-f="etiqueta"]'), [['', 'Todas las etiquetas'], ['@sin', 'Sin etiqueta'], ['@nota', 'Con anotación']]
      .concat(MARCAS.etiquetas.map((e) => [e.id, e.nom])), CFG.etiqueta);
    q('[data-f="tramite"]').value = CFG.tramite;
    q('[data-f="texto"]').value = CFG.texto;
    q('[data-f="desde"]').value = CFG.desde;
    q('[data-f="hasta"]').value = CFG.hasta;
  }

  function chipsDe(k) {
    return etiquetasDe(k).map((e) => '<span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span>').join('');
  }

  let colorElegido = COLORES[0].id;

  function detalleHTML(c) {
    const m = marcaDe(c.exp);
    const puestas = m.et || [];
    return '<tr class="sj-det"><td colspan="' + (COLS.length + 1) + '"><div class="sj-det-in" data-marca="' + esc(c.exp) + '">' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b class="sj-exp">' + esc(c.exp) + '</b>' +
      '<span style="color:#5a7581">' + esc(c.car) + '</span>' +
      '<button class="sj-b" data-a="cerrarDet" style="margin-left:auto;height:26px">Cerrar</button></div>' +
      '<h4>Etiquetas</h4>' +
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
      '<div class="sj-nota-pie"><button class="sj-b prim" data-a="guardarNota">Guardar</button>' +
      '<button class="sj-b" data-a="borrarNota">Borrar</button><span class="sj-ok">Guardado</span></div>' +
      '</div></td></tr>';
  }

  function pintarTabla() {
    const cuerpo = q('[data-e="cuerpo"]');
    if (!DATOS) {
      cuerpo.innerHTML = '<div class="sj-vacio">' + (leyendo ? 'Leyendo la lista de Relacionados. La primera vez tarda un poco.' : 'Todavía no se leyó la lista. Tocá "Actualizar lista".') + '</div>';
      q('[data-e="pie"]').innerHTML = '';
      return;
    }
    const L = filtradas();
    const porPag = CFG.porPagina;
    const paginas = Math.max(1, Math.ceil(L.length / porPag));
    if (pagina > paginas) pagina = paginas;
    const trozo = L.slice((pagina - 1) * porPag, pagina * porPag);
    const { col, desc } = CFG.orden;

    const cab = COLS.map((c) => '<th data-k="' + c.k + '" class="' + (col === c.k ? 'act' : '') + '" style="width:' + c.an + '%">' +
      esc(c.t) + '<span class="fl">' + (col === c.k ? (desc ? '▼' : '▲') : '▽') + '</span></th>').join('') +
      '<th class="acc" style="width:6%"></th>';

    const filas = trozo.map((c) => {
      const nota = String(marcaDe(c.exp).nota || '').trim();
      return '<tr class="' + (c.tramite ? '' : 'fuera') + '">' +
        '<td><span class="sj-exp">' + esc(c.exp) + '</span>' + (c.fav ? '<span class="sj-fav" title="Está en tus favoritos del PJN">★</span>' : '') +
        (c.tramite ? '' : '<br><span class="sj-badge">fuera de trámite</span>') + '</td>' +
        '<td>' + esc(c.dep) + '</td><td>' + esc(c.car) + '</td><td>' + esc(c.sit) + '</td><td>' + esc(c.ult) + '</td>' +
        '<td><div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="et" title="Poner o sacar etiquetas">' +
          (chipsDe(c.exp) || '<span class="sj-poner">+ etiqueta</span>') + '</div></td>' +
        '<td><div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="nota" title="' + (nota ? esc(nota) : 'Escribir una anotación') + '">' +
          (nota ? '<span class="sj-nota-txt">' + esc(nota) + '</span>' : '<span class="sj-poner">+ anotar</span>') + '</div></td>' +
        '<td style="text-align:right"><button class="sj-abrir" data-abrir="' + esc(c.exp) + '" title="Abre el expediente en el PJN">Abrir</button></td>' +
        '</tr>' + (abierta === c.exp ? detalleHTML(c) : '');
    }).join('');

    cuerpo.innerHTML = '<table class="sj-t"><thead><tr>' + cab + '</tr></thead><tbody>' +
      (filas || '<tr><td colspan="' + (COLS.length + 1) + '" class="sj-vacio">Ninguna causa coincide con los filtros.</td></tr>') +
      '</tbody></table>';

    // pie: paginas de la vista
    const nums = [];
    const ventana = 9;
    let ini = Math.max(1, pagina - Math.floor(ventana / 2));
    const fin = Math.min(paginas, ini + ventana - 1);
    ini = Math.max(1, fin - ventana + 1);
    for (let i = ini; i <= fin; i++) {
      nums.push('<button data-pag="' + i + '"' + (i === pagina ? ' class="act" disabled' : '') + '>' + i + '</button>');
    }
    const desdeN = L.length ? (pagina - 1) * porPag + 1 : 0;
    q('[data-e="pie"]').innerHTML =
      '<button data-pag="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>Anterior</button>' +
      (ini > 1 ? '<button data-pag="1">1</button><span>…</span>' : '') + nums.join('') +
      (fin < paginas ? '<span>…</span><button data-pag="' + paginas + '">' + paginas + '</button>' : '') +
      '<button data-pag="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>Siguiente</button>' +
      '<span class="der">Mostrando ' + desdeN + ' a ' + Math.min(L.length, pagina * porPag) + ' de ' + L.length +
      (L.length !== DATOS.total ? ' (filtradas de ' + DATOS.total + ')' : '') +
      ' <select data-pp title="Causas por página">' + [5, 10, 15, 20, 25, 30, 40, 50]
        .map((n) => '<option value="' + n + '"' + (n === porPag ? ' selected' : '') + '>' + n + ' por página</option>').join('') +
      '</select></span>';
  }

  function panelMarcasHTML() {
    const et = MARCAS.etiquetas;
    const marcadas = Object.keys(MARCAS.filas).length;
    const d = RESPALDO && RESPALDO.fecha ? diasDesde(RESPALDO.fecha) : null;
    return '<div class="sj-panel-in">' +
      '<h2>Etiquetas y respaldo</h2>' +
      '<p>Las etiquetas y las anotaciones son datos tuyos, no del PJN: quedan en el almacén de Tampermonkey de esta PC y no se escriben en ningún expediente. Hoy hay <b>' +
      et.length + '</b> ' + (et.length === 1 ? 'etiqueta' : 'etiquetas') + ' y <b>' + marcadas + '</b> ' + (marcadas === 1 ? 'causa marcada' : 'causas marcadas') + '.</p>' +
      '<h3>Copia de respaldo</h3>' +
      '<p>' + (d === null ? 'Todavía no se exportó ninguna copia.' : 'Última copia: <b>' + soloFecha(RESPALDO.fecha) + '</b> (' + (d === 0 ? 'hoy' : d === 1 ? 'hace 1 día' : 'hace ' + d + ' días') + ').') +
      ' Si se limpia el navegador o se reinstala Tampermonkey, lo que no esté en una copia se pierde. La copia se hace a mano: no hay guardado automático.</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="exportar">Exportar etiquetas y anotaciones</button>' +
      '<button class="sj-b" data-a="importar">Importar desde un archivo</button></div>' +
      '<p style="color:#6b7c85;font-size:12px">La importación no pisa nada: suma las etiquetas que falten y, si una anotación es distinta, conserva las dos. El archivo sale sin cifrar: guardalo donde guardes cualquier otro papel de trabajo.</p>' +
      '<h3>Etiquetas</h3>' +
      (et.length
        ? '<table>' + et.map((e) => '<tr><td><span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span></td>' +
          '<td style="color:#6b7c85">' + usoDe(e.id) + ' ' + (usoDe(e.id) === 1 ? 'causa' : 'causas') + '</td>' +
          '<td style="text-align:right;width:1%;white-space:nowrap"><button class="sj-b" data-a="borrarEt" data-id="' + esc(e.id) + '" style="height:26px">Eliminar</button></td></tr>').join('') + '</table>'
        : '<p style="color:#6b7c85">Todavía no hay etiquetas. Se crean tocando la columna Etiquetas de cualquier causa.</p>') +
      '<div class="bts" style="margin-top:20px"><button class="sj-b" data-a="volver">Volver a la lista</button></div>' +
      '</div>';
  }

  function panelAcercaHTML() {
    return '<div class="sj-panel-in">' +
      '<h2>SuPJN+ <span style="font-size:12px;color:#6b7c85;font-weight:400">' + esc(APP.version) + '</span></h2>' +
      '<p>Vista propia de la lista de expedientes relacionados de la Consulta Web del PJN. Lee todas las causas, en trámite y fuera de trámite, y deja buscar, filtrar, ordenar, etiquetar y anotar sobre una sola tabla. Incluye además todo PJN+: la descarga del expediente en un PDF y NOTATOMIC para dejar nota.</p>' +
      '<h3>Qué hace y qué no</h3>' +
      '<p>La lista se lee en segundo plano, con tu sesión, sin mover la página que estás viendo. No modifica nada en el PJN: no deja notas, no presenta escritos y no cambia favoritos. "Abrir" hace lo mismo que el ojo de la fila en la lista del PJN.</p>' +
      '<p>Las anotaciones son notas privadas de trabajo. Se llaman así para no confundirlas con dejar nota, que es el acto procesal.</p>' +
      '<h3>Autoría y licencia</h3>' +
      '<p>Creado por <b>' + esc(APP.autor) + '</b> con Claude. <a href="mailto:' + esc(APP.mail) + '">' + esc(APP.mail) + '</a></p>' +
      '<p>Copyleft, ' + esc(APP.licencia) + '. Copyright (C) ' + esc(APP.anio) + ' ' + esc(APP.autor) + '. Software libre: se permite y se alienta su uso, copia, modificación y distribución gratuita, siempre que las obras derivadas conserven esta misma licencia. Sin garantía. ' +
      '<a href="' + esc(APP.licenciaUrl) + '" target="_blank" rel="noopener noreferrer">Texto de la licencia</a> · ' +
      '<a href="' + esc(APP.github) + '" target="_blank" rel="noopener noreferrer">Repositorio en GitHub</a></p>' +
      '<div class="bts" style="margin-top:20px"><button class="sj-b" data-a="volver">Volver a la lista</button></div>' +
      '</div>';
  }

  function mostrarPanel(cual) {
    panelActual = cual;
    const lista = cual === 'lista';
    q('[data-e="cuerpo"]').style.display = lista ? '' : 'none';
    q('[data-e="pie"]').style.display = lista ? '' : 'none';
    const p = q('[data-e="panel"]');
    p.style.display = lista ? 'none' : '';
    if (cual === 'marcas') p.innerHTML = panelMarcasHTML();
    if (cual === 'acerca') p.innerHTML = panelAcercaHTML();
    if (lista) pintarTabla();
  }

  function pintarTodo() {
    pintarFiltros();
    pintarEstado();
    pintarCopia();
    pintarBotones();
    if (panelActual === 'lista') pintarTabla(); else mostrarPanel(panelActual);
  }

  // ------------------------------------------------------- leer y actualizar

  function notatomicCorriendo() {
    try { const c = JSON.parse(sessionStorage.getItem('notatomic_corrida') || 'null'); return !!(c && c.activa); } catch (e) { return false; }
  }

  async function actualizar() {
    if (leyendo) return;
    if (notatomicCorriendo()) {
      avisar('Hay una tanda de NOTATOMIC en curso. La lista se puede leer cuando termine.', true);
      return;
    }
    leyendo = true;
    cancelar = false;
    avisar('');
    pintarBotones();
    if (!DATOS) pintarTabla();
    try {
      const r = await leerTodo((t) => { estadoTxt(t); });
      DATOS = r;
      if (!guardarAlmacen(K_CAUSAS, DATOS)) avisar('La lista se leyó pero no se pudo guardar en esta PC.', true);
      pagina = Math.min(pagina, Math.max(1, Math.ceil(filtradas().length / CFG.porPagina)));
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      if (msg === 'cortado') avisar('Lectura cortada.' + (DATOS ? ' Queda la lista anterior.' : ''));
      else avisar('No se pudo leer la lista: ' + msg + '.' + (DATOS ? ' Queda la lista anterior.' : ''), true);
    } finally {
      leyendo = false;
      cancelar = false;
      pintarTodo();
    }
  }

  // ------------------------------------------------ abrir en la lista del PJN

  let abriendo = false;

  function filaVisible(k) {
    return filasTabla(tablaDe(document)).find((tr) => tr.cells && tr.cells[0] && clave(tr.cells[0].textContent) === k) || null;
  }

  function abrirCausa(k) {
    if (abriendo) return;
    const c = DATOS && DATOS.causas.find((x) => x.exp === k);
    if (!c) { avisar('Esa causa ya no está en la lista leída.', true); return; }
    if (notatomicCorriendo()) { avisar('Hay una tanda de NOTATOMIC en curso: esperá a que termine para abrir una causa.', true); return; }
    if (!esListaRelacionados(document)) { avisar('Para abrir una causa desde acá, la lista que se ve en el PJN tiene que ser la de Relacionados.', true); return; }
    const casilla = casillaVerTodos(document);
    if (!c.tramite && casilla && !casilla.checked) {
      const consultar = botonConsultar(document);
      if (!consultar) { avisar('Esa causa está fuera de trámite y no encuentro cómo mostrarla en la lista del PJN.', true); return; }
      try { sessionStorage.setItem(K_ENCARGO, JSON.stringify({ exp: c.exp, ts: Date.now() })); } catch (e) { /* sin persistencia */ }
      avisar('Esa causa está fuera de trámite: tildo "Ver todos los expedientes" en la lista del PJN y la abro al recargar...');
      casilla.checked = true;
      consultar.click();
      return;
    }
    llevarYAbrir(c);
  }

  async function llevarYAbrir(c) {
    abriendo = true;
    try {
      avisar('Busco ' + c.exp + ' en la lista del PJN...');
      const casilla = casillaVerTodos(document);
      const conTodas = !!(casilla && casilla.checked);
      const esperada = conTodas ? (c.pagTodas || c.pagTramite) : (c.pagTramite || c.pagTodas);
      let fila = filaVisible(c.exp);
      if (!fila && esperada && (await irAPagina(document, esperada))) fila = filaVisible(c.exp);
      if (!fila) {
        // La lista visible puede tener otro orden o filtros: se recorre entera.
        if (await irAPagina(document, 1)) {
          for (let i = 0; i < 400 && !fila; i++) {
            fila = filaVisible(c.exp);
            if (fila) break;
            const sig = enlaceSiguiente(document);
            if (!sig) break;
            const pag = paginaActiva(document), f = firma(document);
            sig.click();
            if (!(await esperarCambio(document, pag, f, 25000))) break;
          }
        }
      }
      if (!fila) {
        avisar('No encuentro ' + c.exp + ' en la lista del PJN. Si tiene puesto algún filtro (cámara, situación o el de dejar nota), sacalo y probá de nuevo.', true);
        return;
      }
      const ojo = [...fila.querySelectorAll('a')].find((a) => a.querySelector('.fa-eye') || /visualizar/i.test(a.textContent));
      if (!ojo) { avisar('La fila de ' + c.exp + ' no tiene el enlace para visualizar el expediente.', true); return; }
      avisar('Abro ' + c.exp + '...');
      ojo.click();
    } finally {
      abriendo = false;
    }
  }

  // --------------------------------------------------------------- construir

  let fondo = null;

  function abrirVentana() {
    if (!win) return;
    fondo.style.display = '';
    win.style.display = 'flex';
    pastilla.style.display = 'none';
    if (!leyendo) avisar(''); // un aviso de la vez anterior ya no vale
    pintarTodo();
    const campo = q('[data-f="texto"]');
    if (campo) setTimeout(() => campo.focus(), 50);
    if (!leyendo && (!DATOS || Date.now() - DATOS.fecha > VIEJA_DESPUES_DE)) actualizar();
  }

  function cerrarVentana() {
    if (!win) return;
    guardarNotaAbierta();
    win.style.display = 'none';
    fondo.style.display = 'none';
    pastilla.style.display = '';
    acomodarPastilla();
  }

  // La pastilla va a la izquierda de la de NOTATOMIC, las dos abajo a la derecha.
  function acomodarPastilla() {
    if (!pastilla || pastilla.style.display === 'none') return;
    let derecha = 16;
    const n = document.getElementById('notatomic');
    if (n && n.style.display !== 'none') {
      const r = n.getBoundingClientRect();
      const abajoDerecha = r.width && r.right > window.innerWidth - 60 && r.bottom > window.innerHeight - 60;
      if (abajoDerecha) derecha = Math.round(window.innerWidth - r.left) + 10;
    }
    pastilla.style.right = derecha + 'px';
  }

  function guardarNotaAbierta() {
    const caja = q('.sj-det-in[data-marca]');
    if (!caja) return;
    const t = caja.querySelector('.sj-nota');
    if (t && t.value !== (marcaDe(caja.dataset.marca).nota || '')) fijarMarca(caja.dataset.marca, { nota: t.value });
  }

  function construir() {
    if (document.getElementById('supjn')) return;
    const st = document.createElement('style');
    st.id = 'supjn-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);

    fondo = document.createElement('div');
    fondo.id = 'supjn-fondo';
    fondo.style.display = 'none';
    document.body.appendChild(fondo);

    win = document.createElement('div');
    win.id = 'supjn';
    win.style.display = 'none';
    if (CFG.maxi) win.classList.add('maxi');
    win.innerHTML =
      '<div class="sj-tit"><b>SuPJN+ CAUSAS</b><span class="v">' + esc(APP.version) + '</span>' +
      '<span class="ctrl"><button data-a="min" title="Minimizar">–</button>' +
      '<button data-a="max" title="Maximizar o restaurar">□</button>' +
      '<button data-a="cerrar" class="x" title="Cerrar">×</button></span></div>' +
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
      '</div>' +
      '<div class="sj-est"><span class="txt" data-e="estado"></span>' +
      '<button class="sj-b prim" data-a="actualizar">Actualizar lista</button>' +
      '<button class="sj-b peligro" data-a="cortar" style="display:none">Cortar</button>' +
      '<span class="sj-copia" data-a="panelMarcas" data-e="copia"></span>' +
      '<button class="sj-b" data-a="panelMarcas">Etiquetas y respaldo</button>' +
      '<button class="sj-b" data-a="panelAcerca">Acerca de</button></div>' +
      '<div class="sj-aviso" data-e="aviso" style="display:none"></div>' +
      '<div class="sj-cuerpo" data-e="cuerpo"></div>' +
      '<div class="sj-panel" data-e="panel" style="display:none"></div>' +
      '<div class="sj-pie" data-e="pie"></div>' +
      '<input type="file" data-e="archivo" accept=".json,application/json" style="display:none">';
    document.body.appendChild(win);

    pastilla = document.createElement('button');
    pastilla.id = 'supjn-pastilla';
    pastilla.title = 'Abrir la vista de causas';
    document.body.appendChild(pastilla);
    pastilla.addEventListener('click', abrirVentana);
    fondo.addEventListener('click', cerrarVentana);

    // filtros de la barra
    win.querySelector('.sj-barra').addEventListener('input', (e) => {
      const f = e.target.dataset && e.target.dataset.f;
      if (!f) return;
      CFG[f] = e.target.value;
      pagina = 1;
      abierta = null;
      guardarCfg();
      if (panelActual !== 'lista') mostrarPanel('lista'); else pintarTabla();
    });

    // cantidad por pagina
    win.addEventListener('change', (e) => {
      if (e.target.matches('[data-pp]')) {
        CFG.porPagina = parseInt(e.target.value, 10) || 25;
        pagina = 1;
        guardarCfg();
        pintarTabla();
      }
    });

    // anotacion: al salir del campo se guarda, para no perder lo escrito
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
        avisar('Importadas ' + r.filas + ' causas marcadas. Quedan ' + r.etiquetas + ' etiquetas.');
        pintarTodo();
      };
      lector.onerror = () => { archivo.value = ''; avisar('No se pudo leer el archivo.', true); };
      lector.readAsText(f);
    });

    win.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-k]');
      if (th) {
        const k = th.dataset.k;
        if (CFG.orden.col === k) CFG.orden.desc = !CFG.orden.desc;
        else CFG.orden = { col: k, desc: k === 'ult' };
        guardarCfg();
        pintarTabla();
        return;
      }

      const pg = e.target.closest('[data-pag]');
      if (pg && !pg.disabled) { pagina = parseInt(pg.dataset.pag, 10) || 1; abierta = null; pintarTabla(); q('[data-e="cuerpo"]').scrollTop = 0; return; }

      const ab = e.target.closest('[data-abrir]');
      if (ab) { abrirCausa(ab.dataset.abrir); return; }

      const det = e.target.closest('[data-det]');
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

      const colBtn = e.target.closest('.sj-col');
      if (colBtn) {
        colorElegido = colBtn.dataset.color;
        colBtn.parentElement.querySelectorAll('.sj-col').forEach((b) => b.classList.toggle('sel', b === colBtn));
        return;
      }

      const chip = e.target.closest('button[data-et]');
      if (chip) {
        const caja = chip.closest('[data-marca]');
        guardarNotaAbierta();
        alternarEtiqueta(caja.dataset.marca, chip.dataset.et);
        pintarTabla();
        pintarCopia();
        return;
      }

      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'min' || a === 'cerrar') { cerrarVentana(); return; }
      if (a === 'max') { CFG.maxi = !CFG.maxi; win.classList.toggle('maxi', CFG.maxi); guardarCfg(); return; }
      if (a === 'actualizar') { actualizar(); return; }
      if (a === 'cortar') { cancelar = true; estadoTxt('Cortando...'); return; }
      if (a === 'limpiar') {
        Object.assign(CFG, { texto: '', fuero: '', sit: '', tramite: 'todas', etiqueta: '', desde: '', hasta: '' });
        pagina = 1; guardarCfg(); pintarFiltros(); mostrarPanel('lista'); return;
      }
      if (a === 'panelMarcas') { guardarNotaAbierta(); mostrarPanel('marcas'); return; }
      if (a === 'panelAcerca') { guardarNotaAbierta(); mostrarPanel('acerca'); return; }
      if (a === 'volver') { mostrarPanel('lista'); pintarFiltros(); return; }
      if (a === 'exportar') { exportarMarcas(); pintarCopia(); mostrarPanel('marcas'); avisar('Copia exportada. Guardá el archivo en un lugar seguro.'); return; }
      if (a === 'importar') { archivo.click(); return; }
      if (a === 'borrarEt') {
        if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar: se quita de todas'; return; }
        borrarEtiqueta(b.dataset.id);
        mostrarPanel('marcas');
        pintarFiltros();
        return;
      }
      if (a === 'cerrarDet') { guardarNotaAbierta(); abierta = null; pintarTabla(); return; }
      const caja = b.closest('[data-marca]');
      if (!caja) return;
      const k = caja.dataset.marca;
      if (a === 'crearEt') {
        const campo = caja.querySelector('.sj-et-nombre');
        guardarNotaAbierta();
        const id = crearEtiqueta(campo.value, colorElegido);
        if (!id) { campo.focus(); return; }
        if ((marcaDe(k).et || []).indexOf(id) < 0) alternarEtiqueta(k, id);
        pintarFiltros();
        pintarTabla();
        pintarCopia();
        return;
      }
      if (a === 'guardarNota') {
        fijarMarca(k, { nota: caja.querySelector('.sj-nota').value });
        pintarTabla();
        pintarCopia();
        const ok = q('.sj-det-in[data-marca] .sj-ok');
        if (ok) { ok.classList.add('si'); setTimeout(() => ok.classList.remove('si'), 2200); }
        return;
      }
      if (a === 'borrarNota') {
        if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar el borrado'; return; }
        fijarMarca(k, { nota: '' });
        pintarTabla();
        pintarCopia();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !win || win.style.display === 'none') return;
      if (panelActual !== 'lista') { mostrarPanel('lista'); return; }
      if (abierta) { guardarNotaAbierta(); abierta = null; pintarTabla(); return; }
      cerrarVentana();
    });

    pintarPastilla();
  }

  // ------------------------------------------------------------------ arranque

  function arrancar() {
    construir();
    // Pedido del autor, para todas las apps: arranca minimizado abajo a la derecha.
    acomodarPastilla();
    setInterval(acomodarPastilla, 1000);
    window.addEventListener('resize', acomodarPastilla);

    // Si se recargo la pagina para mostrar una causa fuera de tramite, se sigue.
    let enc = null;
    try { enc = JSON.parse(sessionStorage.getItem(K_ENCARGO) || 'null'); } catch (e) { enc = null; }
    if (enc) {
      try { sessionStorage.removeItem(K_ENCARGO); } catch (e) { /* sin persistencia */ }
      const c = DATOS && DATOS.causas.find((x) => x.exp === enc.exp);
      if (c && Date.now() - (enc.ts || 0) < 90000) {
        abrirVentana();
        setTimeout(() => llevarYAbrir(c), 900);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
