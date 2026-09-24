// ==UserScript==
// @name         SuPJN+ - Consulta Web del PJN ampliada
// @namespace    ignacio.kinbaum
// @version      1.1.0
// @description  Ventana única sobre la Consulta Web del PJN: Mis causas y Favoritos, en trámite y fuera de trámite, con búsqueda, filtros, ordenamiento y columnas configurables; etiquetas y anotaciones propias, con copia manual o guardado automático en una carpeta designada; dejar nota en todas las causas habilitadas o en las seleccionadas; descarga de expedientes en PDF eligiendo causas desde la lista o actuaciones desde el expediente; escritos presentados, notificaciones electrónicas y DEOX, generales o de una causa, con sus PDF; dejar cédula con el expediente ya cargado en el formulario del PJN; la Guía judicial navegable y enlazada a cada causa; y acceso a las demás aplicaciones del PJN.
// @author       Ignacio Kinbaum
// @license      GPL-3.0-or-later
// @copyright    2026, Ignacio Kinbaum (estudiojuridicokinbaum@gmail.com)
// @homepageURL  https://github.com/Elzas85/SuPJNPLUS
// @supportURL   https://github.com/Elzas85/SuPJNPLUS/issues
// @updateURL    https://raw.githubusercontent.com/Elzas85/SuPJNPLUS/main/supjn-plus.user.js
// @downloadURL  https://raw.githubusercontent.com/Elzas85/SuPJNPLUS/main/supjn-plus.user.js
// @match        https://scw.pjn.gov.ar/scw/*
// @match        https://portalpjn.pjn.gov.ar/*
// @match        https://escritos.pjn.gov.ar/*
// @match        https://notif.pjn.gov.ar/*
// @match        https://deox.pjn.gov.ar/*
// @match        https://www.pjn.gov.ar/guia*
// @run-at       document-idle
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
 *   Una ventana única y desplazable que reúne el trabajo diario sobre la
 *   Consulta Web: Mis causas (Relacionados) y Favoritos con búsqueda, filtros,
 *   ordenamiento y columnas configurables; etiquetas y anotaciones propias;
 *   partes, intervinientes, causas vinculadas y recursos de cada expediente;
 *   dejar nota en todas las causas habilitadas o solo en las seleccionadas;
 *   descarga de expedientes en un PDF, eligiendo causas desde la lista o
 *   actuaciones desde el expediente; solapas propias para los escritos
 *   presentados, las notificaciones electrónicas y los DEOX, en general o de
 *   una causa, con su PDF; dejar cédula, abriendo el formulario de
 *   Notificaciones del PJN con el expediente ya elegido; la Guía judicial,
 *   navegable y enlazada al juzgado de cada causa; y un menú con las demás
 *   aplicaciones del PJN, que se abren en una pestaña nueva.
 *   Se inicia minimizada, como indicador en el extremo inferior derecho, y aun
 *   así lee las listas en segundo plano. Se despliega por sí sola únicamente
 *   cuando quedó una tanda de dejar nota sin terminar.
 *
 *   Las dos tablas (causas y actuaciones) comparten el mismo motor de columnas:
 *   se ordenan pulsando el título, se reubican arrastrándolo y se ensanchan
 *   desde el borde derecho. Con el encuadre activo, que es el comportamiento
 *   predeterminado, la tabla siempre entra en el ancho de la ventana: el ancho
 *   que gana una columna lo pierden las otras. El zoom de la barra de título
 *   amplía el contenido sin mover ni redimensionar la ventana; por eso la
 *   geometría se guarda en píxeles de pantalla y se divide por el factor de
 *   zoom al escribirla.
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
 *     - Abrir un expediente (el ícono de vista), "Ver históricas" o el filtro
 *       de dejar nota, ejecutados como navegación de un marco, responden con
 *       error 503.
 *     - El mismo pedido hecho con fetch desde el marco, en cambio, funciona. La
 *       respuesta es una redirección a http://.../expediente.seam?cid=N, que
 *       el navegador bloquea por contenido mixto; por eso, antes del fetch, se
 *       aplica al documento del marco la política upgrade-insecure-requests y
 *       la redirección continúa por https. Así se obtiene el cid sin alterar la
 *       página visible.
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
 *     - El botón "Dejar nota" del encabezado NO deja nota: filtra la lista y
 *       agrega una columna con un lápiz. Solo existe en Relacionados.
 *     - La nota se deja con el lápiz de cada fila y el cartel de confirmación.
 *       Confirmar RECARGA la página: el recorrido está implementado como una
 *       máquina de estados en sessionStorage que se retoma en cada carga.
 *     - a) El botón Confirmar está siempre presente en el DOM: lo que hay que
 *       observar es el cartel.
 *       b) El lápiz no desaparece: el resultado se obtiene del mensaje del PJN,
 *       y hay que cotejar el número que menciona con el de la causa en curso.
 *       c) El recorrido se hace por número de expediente, no por posición.
 *
 * ESCRITOS, NOTIFICACIONES, DEOX Y GUÍA (relevado el 17/09/2026, en solo lectura)
 *   Son aplicaciones aparte, cada una en su sitio: escritos.pjn.gov.ar,
 *   notif.pjn.gov.ar y deox.pjn.gov.ar. Las tres tienen una API JSON propia
 *   (/api/escritos, /api/notificaciones, /api/deox) que pide una credencial
 *   del SSO del PJN; la aplicación la obtiene sola con la sesión ya iniciada
 *   y la guarda en su sessionStorage. Las listas se piden por bandeja, con
 *   fechas ddmmaaaa y de a 100 por página como máximo, y se pueden acotar a
 *   una causa por número, año y cámara (la cámara va por su número interno,
 *   que da /api/camaras). El PDF de cada elemento sale de su propia ruta.
 *   La Guía judicial (www.pjn.gov.ar/guia) es pública: /api/dependencia/...
 *   y /api/persona/find.
 *   Ninguno de esos sitios deja que otro lea sus respuestas. Por eso SuPJN+
 *   abre cada aplicación en un MARCO OCULTO: la propia aplicación del PJN
 *   entra con la sesión del SSO, y SuPJN+, que también corre dentro del
 *   marco, hace ahí las consultas y le devuelve los datos a la ventana por
 *   postMessage. Ese puente solo atiende a la Consulta Web, solo cuando es
 *   ella la que abrió el marco, y solo consultas de lectura de una lista
 *   cerrada. Antes de mostrar nada se comprueba que la sesión del marco sea
 *   de la misma cuenta que la de la Consulta Web.
 *   El expediente se abre con /scw/consultaNovedad.seam?identificacion=CUIT
 *   &eid=ID, que es el mismo enlace que usan esas aplicaciones.
 *
 * DESCARGA DE DOCUMENTOS
 *   Las actuaciones se piden con fetch a su propia dirección y se validan por
 *   contenido: un PDF empieza con "%PDF-". Una respuesta correcta que no es un
 *   PDF corresponde a una actuación sin documento y no se reintenta. Los fallos
 *   de red o de servidor sí se reintentan, hasta tres veces, con esperas
 *   crecientes. Todo fallo queda anotado en el registro de fallas, que se
 *   consulta en Acerca de.
 *
 * LA SESIÓN DEL PJN
 *   El sitio cierra la sesión por inactividad y eso corta una tanda de nota o
 *   una descarga a la mitad. Mientras se trabaja se le toca la sesión cada
 *   pocos minutos, descartando el cuerpo de la respuesta. La condición es que
 *   haya habido actividad del usuario hace poco, o trabajo en curso: con el
 *   equipo desatendido el latido se detiene y la sesión caduca sola. Una sesión
 *   que no caduca nunca deja la cuenta a mano de cualquiera que se siente
 *   frente a la máquina. El menú de funciones del PJN tiene, además, un botón
 *   para cerrar la sesión al terminar.
 *
 * EL ARCHIVO QUE SALE DEL EQUIPO
 *   La exportación, y desde la 0.7.1 también el archivo de la carpeta de
 *   respaldo, va en formato propio (.supjn), binario y cifrado con una
 *   contraseña del usuario: AES-GCM con clave derivada por PBKDF2, sal distinta
 *   en cada archivo. No se abre con un editor de texto ni lo leen los
 *   indexadores, y sin la contraseña no se recupera en ninguna parte. La
 *   contraseña queda guardada en este equipo, de modo que acá no se la pide;
 *   sí hace falta escribirla al importar en otra máquina. Lo que se protege es
 *   el archivo cuando sale, que es donde queda fuera del control del usuario.
 *
 * DÓNDE SE GUARDA
 *   Todo en el almacén de Tampermonkey de este equipo: las listas leídas, la
 *   configuración, las etiquetas, las anotaciones, el último resultado de dejar
 *   nota por causa y el registro de fallas.
 *   SEPARADO POR CUENTA DEL PJN. El almacén de Tampermonkey pertenece al
 *   navegador y no a la sesión del PJN, y además se comparte con las ventanas
 *   de incógnito: sin esa separación, al ingresar con otra cuenta se veían las
 *   causas y las anotaciones de la anterior. La cuenta se lee de la barra de
 *   usuario del PJN y actúa como sufijo de cada clave. Si no se la puede
 *   identificar, no se lee ni se escribe nada de lo guardado. Solo la
 *   configuración de la ventana es común a todas las cuentas, y el texto del
 *   buscador no se guarda, porque puede ser el nombre de un cliente.
 *   Las etiquetas, las anotaciones y las notas se copian con Exportar; y, si se
 *   designa una carpeta de respaldo (solapa Respaldo), se escriben ahí en
 *   cada cambio, cifradas con la misma contraseña, y se leen al abrir. Esa carpeta la elige el usuario una vez y
 *   conviene que esté fuera del directorio del programa, para que las
 *   anotaciones no terminen en un repositorio.
 *
 * TERMINOLOGÍA
 *   ANOTACIONES son las notas privadas de trabajo. DEJAR NOTA es el acto
 *   procesal. La distinción es deliberada.
 *
 * CÓMO ESTÁ ARMADO EL ARCHIVO
 *   Todo el programa es una sola función. Adentro está dividido en las partes
 *   que siguen, en este orden. Cada título figura igual en el cuerpo del
 *   archivo, así que buscando su número se llega directo a la parte.
 *
 *   1. FUERA DE LA VENTANA. Lo que corre en las otras páginas del PJN.
 *      1.1 el puente, dentro del marco
 *      1.2 dejar cédula, en Notificaciones
 *   2. BASE. Herramientas que usa todo lo demás.
 *      2.1 utilidades · 2.2 partes del expediente · 2.3 almacén
 *      2.4 la cuenta del PJN
 *   3. LECTURA DEL PJN. De dónde sale cada dato.
 *      3.1 la página del PJN · 3.2 marco oculto · 3.3 lectura de una lista
 *      3.4 ubicar una causa en un marco · 3.5 actuaciones
 *      3.6 las otras solapas del expediente: cómo se leen · 3.7 los PDF
 *      3.8 la sesión mientras se trabaja
 *   4. TRABAJOS LARGOS. Lo que avanza solo y se puede cortar.
 *      4.1 cola de descargas · 4.2 dejar nota · 4.3 turno entre pestañas
 *   5. DATOS PROPIOS. Lo que guarda el programa, siempre por cuenta.
 *      5.1 etiquetas y anotaciones · 5.2 el archivo que sale del programa
 *      5.3 carpeta de respaldo · 5.4 datos leídos
 *      5.5 registro de fallas: cómo se anotan · 5.6 novedades
 *      5.7 configuración · 5.8 estado de la vista
 *   6. LA VENTANA. Cómo se dibuja cada pantalla.
 *      6.1 estilos · 6.2 ventana · 6.3 solapas · 6.4 vista lista
 *      6.5 vista dejar nota · 6.6 columnas de las tablas · 6.7 menús
 *      6.8 vista expediente · 6.9 elegir actuaciones · 6.10 vista descargas
 *      6.11 paneles · 6.12 revisar el PJN: lo que se muestra
 *      6.13 registro de fallas: lo que se muestra · 6.14 pintar todo
 *   7. ACCIONES. Lo que pasa al tocar algo de una causa.
 *      7.1 leer las listas · 7.2 acciones por causa
 *   8. LAS OTRAS APLICACIONES DEL PJN. Escritos, Notificaciones, DEOX y la Guía.
 *      8.1 el puente, del lado de la ventana · 8.2 datos comunes
 *      8.3 las tres bandejas · 8.4 la Guía judicial
 *   9. ARMADO Y MANEJO DE LA VENTANA.
 *      9.1 construir la ventana y atender lo que se toca
 *      9.2 la hora del documento
 *  10. EN EL EXPEDIENTE ABIERTO, Y EL ARRANQUE.
 *      10.1 las otras solapas del expediente: en pantalla
 *      10.2 revisar el PJN: la revisión · 10.3 el expediente abierto
 *      10.4 arranque
 *
 *   Un tema que aparece dos veces, con dos números, es porque tiene dos
 *   mitades: la que lee o trabaja y la que dibuja. Los títulos lo dicen.
 * ===========================================================================
 */
/* global PDFLib */
(function () {
  'use strict';

  // ----------------------------------------- 1.1 el puente, dentro del marco
  //
  // En Escritos, Notificaciones, DEOX y la Guía, SuPJN+ no dibuja nada: solo
  // atiende consultas cuando la Consulta Web abrió esa aplicación en un marco
  // oculto (ver ESCRITOS, NOTIFICACIONES, DEOX Y GUÍA). Abierta a mano, en su
  // propia pestaña, la aplicación queda tal cual.

  const ORIGEN_SCW = 'https://scw.pjn.gov.ar';
  const APPS_PUENTE = {
    'escritos.pjn.gov.ar': 'escritos',
    'notif.pjn.gov.ar': 'notif',
    'deox.pjn.gov.ar': 'deox',
    'www.pjn.gov.ar': 'guia'
  };
  const NOMBRE_MARCO = 'supjn-puente-';

  // Lo que el puente acepta. Todo es de lectura: listas, PDF y datos de la
  // Guía. Las búsquedas de la Guía van por POST porque así las pide el propio
  // sitio, pero no cambian nada.
  const RUTAS_PUENTE = {
    escritos: { lista: /^\/api\/escritos\?bandeja=[A-Z_]+(&[a-zA-Z]+=[0-9]+)*$/, pdf: /^\/api\/escritos\/\d+\/pdf$/, json: /^\/api\/camaras$/ },
    notif: { lista: /^\/api\/notificaciones\?bandeja=[A-Z_]+(&[a-zA-Z]+=[0-9]+)*$/, pdf: /^\/api\/notificaciones\/[A-Z_]+\/\d+\/pdf$/, json: /^\/api\/camaras$/ },
    deox: { lista: /^\/api\/deox\?bandeja=[A-Z_]+(&[a-zA-Z]+=[0-9]+)*$/, pdf: /^\/api\/deox\/[A-Z_]+\/\d+\/pdf$/, json: /^\/api\/camaras$/ },
    guia: { json: /^\/api\/dependencia\/codigo\/(?!\.)[A-Za-z0-9_.%-]+$/, buscar: /^\/api\/(dependencia|persona)\/find$/ }
  };
  const TOPE_PUENTE = 3000;                 // elementos como máximo por consulta

  // La credencial del SSO la obtiene y la renueva la propia aplicación del PJN;
  // SuPJN+ solo la lee, en el momento de usarla, y nunca la saca de su sitio.
  // Estas tres funciones no usan nada de lo que se define más abajo: corren
  // también en las aplicaciones, donde el resto del programa no arranca.
  function credencialSSO() {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (!/^oidc\.user:/.test(k || '')) continue;
        const u = JSON.parse(sessionStorage.getItem(k) || 'null');
        if (u && u.access_token && (!u.expires_at || u.expires_at * 1000 > Date.now() + 15000)) return u;
      }
    } catch (e) { /* sin acceso al almacén */ }
    return null;
  }
  async function esperarCredencialSSO(msMax) {
    const tope = Date.now() + (msMax || 0);
    for (;;) {
      const u = credencialSSO();
      if (u) return u;
      if (Date.now() >= tope) return null;
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  // De la credencial solo se usa el CUIT, para comprobar que la cuenta es la
  // misma que la de la Consulta Web.
  const cuitSSO = (u) => String((u && u.profile && (u.profile.cuil || u.profile.preferred_username)) || '').replace(/\D/g, '');

  function puenteEnMarco(app) {
    const publica = app === 'guia';
    const R = RUTAS_PUENTE[app];
    const credencialVigente = esperarCredencialSSO;
    const cuitDe = cuitSSO;

    const enviar = (m) => {
      try { window.parent.postMessage(Object.assign({ supjn: 'puente', app }, m), ORIGEN_SCW); } catch (e) { /* la ventana ya no está */ }
    };

    async function pedir(ruta, cuerpo) {
      const h = { Accept: 'application/json, text/plain, */*' };
      if (!publica) {
        const u = await credencialVigente(10000);
        if (!u) throw new Error('sesion');
        h.Authorization = 'Bearer ' + u.access_token;
      }
      const init = { headers: h, credentials: 'same-origin', cache: 'no-store' };
      if (cuerpo) {
        init.method = 'POST';
        h['Content-Type'] = 'application/json';
        init.body = JSON.stringify(cuerpo);
      }
      const r = await fetch(ruta, init);
      if (r.status === 401 || r.status === 403) throw new Error('sesion');
      if (!r.ok) {
        let m = '';
        try { const j = await r.json(); m = j && typeof j.message === 'string' ? j.message : ''; } catch (e) { /* sin detalle */ }
        throw new Error('el sistema respondió con error ' + r.status + (m ? ' (' + m + ')' : ''));
      }
      return r;
    }

    const aJSON = async (r) => {
      try { return await r.json(); } catch (e) { throw new Error('la respuesta no se pudo leer'); }
    };

    async function atender(p) {
      if (p.op === 'estado') {
        if (publica) return { listo: true };
        const u = await credencialVigente(p.espera || 0);
        return { listo: !!u, cuit: cuitDe(u) };
      }
      if (p.op === 'json') {
        if (!(R.json && R.json.test(p.ruta))) throw new Error('consulta no admitida');
        return aJSON(await pedir(p.ruta));
      }
      if (p.op === 'buscar') {
        if (!(R.buscar && R.buscar.test(p.ruta)) || !p.cuerpo || typeof p.cuerpo !== 'object') throw new Error('consulta no admitida');
        return aJSON(await pedir(p.ruta, p.cuerpo));
      }
      if (p.op === 'lista') {
        if (!(R.lista && R.lista.test(p.ruta)) || /[?&](page|pageSize)=/.test(p.ruta)) throw new Error('consulta no admitida');
        const tope = Math.max(1, Math.min(Number(p.tope) || 1000, TOPE_PUENTE));
        const porPagina = Math.max(1, Math.min(Number(p.porPagina) || 100, 100));
        const items = [];
        let total = null;
        for (let pag = 0; ; pag++) {
          const j = await aJSON(await pedir(p.ruta + '&page=' + pag + '&pageSize=' + porPagina));
          if (!j || !Array.isArray(j.items)) throw new Error('la respuesta no trae la lista');
          if (typeof j.numberOfItems === 'number') total = j.numberOfItems;
          items.push(...j.items);
          enviar({ tipo: 'avance', id: p.id, van: items.length, total });
          if (!j.hasNext || !j.items.length || items.length >= tope) break;
        }
        return { items: items.slice(0, tope), total: total == null ? items.length : total };
      }
      if (p.op === 'pdf') {
        if (!(R.pdf && R.pdf.test(p.ruta))) throw new Error('consulta no admitida');
        const r = await pedir(p.ruta);
        const buf = await r.arrayBuffer();
        const b = new Uint8Array(buf, 0, Math.min(5, buf.byteLength));
        if (String.fromCharCode.apply(null, b) !== '%PDF-') throw new Error('el sistema no devolvió un PDF');
        return { buf };
      }
      throw new Error('consulta no admitida');
    }

    window.addEventListener('message', (e) => {
      if (e.origin !== ORIGEN_SCW || e.source !== window.parent) return;
      const p = e.data;
      if (!p || p.supjn !== 'pedido' || p.app !== app || typeof p.id !== 'string') return;
      atender(p).then(
        (res) => enviar({ tipo: 'respuesta', id: p.id, ok: true, res }),
        (err) => enviar({ tipo: 'respuesta', id: p.id, ok: false, error: String(err && err.message ? err.message : err) })
      );
    });

    // Aviso a la ventana de que el marco ya puede atender: la Guía enseguida;
    // las otras, cuando la aplicación terminó de entrar con el SSO.
    if (publica) enviar({ tipo: 'listo' });
    else credencialVigente(30000).then((u) => { if (u) enviar({ tipo: 'listo', cuit: cuitDe(u) }); });
  }

  // ------------------------------------- 1.2 dejar cédula, en Notificaciones
  //
  // SuPJN+ no envía cédulas: abre el formulario de Notificaciones del PJN en una
  // pestaña nueva, le carga la jurisdicción, el número y el año, pasa al paso
  // de selección (que solo busca) y elige el expediente o el incidente exacto.
  // Lo demás (los destinatarios, los despachos, el texto y el envío) se hace en
  // el formulario del PJN. Relevado el 17/09/2026: el paso 1 tiene la
  // jurisdicción (#camara-autocomplete), el número y el año; Siguiente busca en
  // /api/expedientes y, si el PJN no ofrece la causa (solo ofrece aquellas en
  // las que el letrado constituyó domicilio electrónico), avisa "No hay
  // resultados para la selección actual" y no avanza. El paso 2 lista la causa
  // y sus incidentes como "CIV 76436/2025 : carátula".
  //
  // El pedido viaja en el almacén de Tampermonkey, que es el mismo en todos los
  // sitios del programa: la dirección no sirve, porque el ingreso por el SSO la
  // pierde. Vale cinco minutos, se usa una sola vez y solo con la misma cuenta.
  const K_CEDULA = 'supjn.cedula.v1';
  const VIDA_CEDULA = 5 * 60 * 1000;
  const RUTA_CEDULA = '/nueva';

  function cedulaEnNotif() {
    if (typeof GM_getValue !== 'function' || typeof GM_setValue !== 'function') return;
    let p = null;
    // La Consulta Web lo guarda como texto JSON, igual que el resto del almacén.
    try { p = GM_getValue(K_CEDULA, null); if (typeof p === 'string') p = JSON.parse(p); } catch (e) { p = null; }
    if (!p || typeof p !== 'object') return;
    const vigente = Date.now() - (Number(p.ts) || 0) < VIDA_CEDULA && /^[A-Z]{2,4}$/.test(String(p.sigla || '')) &&
      Number(p.num) > 0 && Number(p.anio) > 1900 && /^\d{11}$/.test(String(p.cuenta || ''));
    if (!vigente) return;
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const olvidar = () => { try { GM_setValue(K_CEDULA, null); } catch (e) { /* sin almacén */ } };
    const corta = (c) => { const x = String(c || ''); return x ? x.slice(0, 2) + '...' + x.slice(-3) : 'sin identificar'; };

    // Un cartel propio, encima del formulario (no tapa ningún botón), que se
    // cierra con su cruz.
    const cartel = (texto, malo) => {
      let c = document.getElementById('supjn-cedula');
      if (!c) {
        c = document.createElement('div');
        c.id = 'supjn-cedula';
        c.setAttribute('role', 'status');
        const main = document.querySelector('main');
        c.style.cssText = (main ? 'position:relative;margin:8px 16px 0;' : 'position:fixed;top:72px;right:16px;z-index:2147483000;max-width:420px;box-shadow:0 8px 24px rgba(0,0,0,.25);') +
          'padding:10px 34px 10px 14px;border-radius:8px;font:13px/1.45 "Segoe UI",Arial,sans-serif;background:#fff;color:#1d2b36;border:2px solid #14416f';
        const x = document.createElement('button');
        x.type = 'button';
        x.textContent = '×';
        x.title = 'Cerrar';
        x.style.cssText = 'position:absolute;top:4px;right:6px;border:0;background:transparent;font:700 18px/1 "Segoe UI",Arial,sans-serif;cursor:pointer;color:#14416f';
        x.addEventListener('click', () => c.remove());
        const t = document.createElement('div');
        t.className = 'txt';
        c.appendChild(t);
        c.appendChild(x);
        if (main) main.insertBefore(c, main.firstChild); else document.body.appendChild(c);
      }
      c.style.borderColor = malo ? '#b3261e' : '#14416f';
      c.querySelector('.txt').textContent = 'SuPJN+: ' + texto;
    };

    const esperarQue = async (f, msMax) => {
      const tope = Date.now() + msMax;
      for (;;) {
        let v = null;
        try { v = f(); } catch (e) { v = null; }
        if (v) return v;
        if (Date.now() >= tope) return null;
        await esperar(200);
      }
    };

    // React solo toma el valor si se lo escribe como lo haría el teclado.
    const escribir = (el, v) => {
      const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      d.set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    // "CIV - Cámara Nacional de Apelaciones en lo Civil", "CIV- Cámara...",
    // "CIV: Cámara..." o "CIV" son la misma jurisdicción: se compara la sigla
    // del principio y nada más, porque el PJN escribe el resto como quiere.
    const sigla = (t) => { const m = /^\s*([A-Za-z]{2,4})\b/.exec(String(t || '')); return m ? m[1].toUpperCase() : ''; };
    const opcionCamara = () => [...document.querySelectorAll('[role="option"]')]
      .find((o) => sigla(o.textContent) === p.sigla) || null;

    // "CIV 076436/2025/1" y "CIV 76436/2025/1" son el mismo expediente.
    const sinCeros = (t) => String(t || '').toUpperCase().replace(/\s+/g, ' ').trim().replace(/^([A-Z]{2,4}) 0*(\d)/, '$1 $2');
    const buscado = sinCeros(p.exp);
    const opcionesExp = () => [...document.querySelectorAll('[id^="form-list-autocomplete-listbox-expediente"] [role="option"]')];
    const sinResultados = () => [...document.querySelectorAll('[role="alert"], .MuiAlert-message, .MuiSnackbarContent-message, .MuiSnackbar-root')]
      .some((e) => /no hay resultados/i.test(e.textContent || ''));

    // Siguiente, en el paso 1, solo busca la causa. Después: o aparece la lista
    // del paso 2, o el PJN dice que no hay resultados.
    async function elegirExpediente() {
      const sig = document.getElementById('StepperNextBtn') ||
        [...document.querySelectorAll('button')].find((b) => /^siguiente$/i.test(String(b.textContent || '').trim()));
      if (!sig) return 'sin boton';
      sig.click();
      const r = await esperarQue(() => (opcionesExp().length ? 'lista' : sinResultados() ? 'nada' : null), 15000);
      if (r !== 'lista') return r || 'sin respuesta';
      const exacta = opcionesExp().find((o) => sinCeros(String(o.textContent || '').split(' : ')[0]) === buscado);
      if (!exacta) return 'sin exacta';
      exacta.click();
      await esperar(300);
      return 'elegida';
    }

    // El campo de jurisdicción es un desplegable de Material UI. Según la
    // versión se abre de distinta manera, y el PJN la cambia sin avisar, así
    // que se prueban las cuatro formas conocidas antes de darlo por perdido:
    // el clic en el campo, el botón de la flecha, la tecla de abajo y escribir
    // la sigla, que también filtra la lista.
    async function elegirCamara(cam) {
      const formas = [
        () => {
          cam.focus();
          cam.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          cam.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          cam.click();
        },
        () => {
          const raiz = cam.closest('.MuiAutocomplete-root') || cam.parentElement;
          const abrir = raiz && (raiz.querySelector('.MuiAutocomplete-popupIndicator') ||
            raiz.querySelector('[class*="popupIndicator"]') ||
            [...raiz.querySelectorAll('button')].find((b) => !b.className || !/clear/i.test(b.className)));
          if (abrir) abrir.click();
        },
        () => { cam.focus(); cam.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); },
        () => { escribir(cam, p.sigla); }
      ];
      for (const abrir of formas) {
        try { abrir(); } catch (e) { /* si esta forma falla, se prueba la siguiente */ }
        const op = await esperarQue(opcionCamara, 2500);
        if (!op) continue;
        op.click();
        await esperar(250);
        cam.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        cam.blur();
        if (sigla(cam.value) === p.sigla) return true;
      }
      return false;
    }

    // El número y el año se cargan siempre, aunque la jurisdicción no se haya
    // podido elegir: media carga adelanta trabajo, y el cartel dice qué falta.
    async function completar(campos) {
      const [cam, num, anio] = campos;
      const camara = await elegirCamara(cam);
      escribir(num, String(p.num));
      escribir(anio, String(p.anio));
      await esperar(250);
      return { camara, num: num.value === String(p.num), anio: anio.value === String(p.anio) };
    }

    (async () => {
      // Hasta que la aplicación entra con el SSO no se hace nada. Si pide
      // ingresar, la página se va y el pedido sigue esperando.
      const u = await esperarCredencialSSO(60000);
      if (!u) return;
      const cuit = cuitSSO(u);
      if (cuit !== String(p.cuenta)) {
        olvidar();
        cartel('no se cargó ' + p.exp + ': Notificaciones está abierto con otra cuenta (' + corta(cuit) + ') y no con la de la Consulta Web (' + corta(p.cuenta) + ').', true);
        return;
      }
      if (location.pathname !== RUTA_CEDULA) { location.assign(RUTA_CEDULA); return; }
      olvidar();
      const campos = await esperarQue(() => {
        const c = [document.getElementById('camara-autocomplete'), document.querySelector('input[name="numeroExpediente"]'), document.querySelector('input[name="anioExpediente"]')];
        return c.every(Boolean) ? c : null;
      }, 20000);
      if (!campos) { cartel('no se encontró el formulario para cargar ' + p.exp + '. Completalo a mano.', true); return; }
      let r0 = { camara: false, num: false, anio: false };
      try { r0 = await completar(campos); } catch (e) { /* queda como no cargado */ }
      if (!r0.num || !r0.anio) {
        cartel('no se pudieron cargar los datos de ' + p.exp + ' en el formulario. Completalo a mano.', true);
        return;
      }
      if (!r0.camara) {
        cartel('se cargaron el número y el año de ' + buscado + ', pero el formulario no dejó elegir la jurisdicción: elegí ' + p.sigla + ' y pulsá Siguiente.', true);
        return;
      }
      let r = '';
      try { r = await elegirExpediente(); } catch (e) { r = ''; }
      const sigue = ' Seguí con Siguiente: los destinatarios, los despachos y el texto. La cédula se envía desde este formulario; SuPJN+ no envía nada.';
      if (r === 'elegida') cartel('se eligió ' + buscado + '.' + sigue);
      else if (r === 'sin exacta') cartel('el PJN ofrece la causa, pero no ' + buscado + ' con ese número exacto: elegí en la lista el expediente o el incidente.' + sigue);
      else if (r === 'nada') cartel('el PJN no ofrece ' + buscado + ' para dejar cédula con esta cuenta. En Notificaciones solo aparecen las causas en las que constituiste domicilio electrónico.', true);
      else cartel('se cargaron la jurisdicción, el número y el año de ' + buscado + '. Pulsá Siguiente y elegí el expediente o el incidente.' + sigue);
    })();
  }

  const APP_PUENTE = APPS_PUENTE[location.hostname];
  if (APP_PUENTE) {
    let deLaConsulta = false;
    try {
      // En Chrome, ancestorOrigins dice quién abrió el marco. Aunque faltara, el
      // puente igual solo le contesta a la Consulta Web.
      const anc = location.ancestorOrigins;
      deLaConsulta = window.top !== window.self && (!anc || !anc.length || anc[0] === ORIGEN_SCW);
    } catch (e) { deLaConsulta = false; }
    if (deLaConsulta && String(window.name || '').indexOf(NOMBRE_MARCO) === 0) puenteEnMarco(APP_PUENTE);
    else if (APP_PUENTE === 'notif' && window.top === window.self) cedulaEnNotif();
    return;
  }

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
    version: 'beta 1.1.0',
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
  const K_VISTO = 'supjn.visto.v1';       // cómo estaba cada causa la última vez que la miraste
  const K_FALLAS = 'supjn.fallas.v1';     // registro de descargas fallidas, para diagnóstico
  const K_CONTRA = 'supjn.contra.v1';     // contraseña del archivo de respaldo, por cuenta
  // La tanda en curso va en una clave propia. NOTATOMIC usaba
  // 'notatomic_corrida': si quedó instalado, con clave propia cada uno hace lo
  // suyo y no se pisan los lápices.
  const S_CORRIDA = 'supjn_corrida';      // sessionStorage: tanda de notas en curso
  const S_ENCARGO = 'supjn_encargo';      // sessionStorage: algo que hacer al cargar la página
  // En el Portal del PJN (otro sitio) SuPJN+ no puede leer la Consulta Web: ahí
  // solo aparece el indicador, que lleva directamente a la Consulta Web.
  const EN_PORTAL = location.host !== 'scw.pjn.gov.ar';
  const VIEJA_DESPUES_DE = 10 * 60 * 1000;
  const BLOQUE_DESCARGAS = 5;             // causas seguidas antes del pausa
  const PAUSA_BLOQUE = 20 * 1000;         // cuánto dura el pausa
  const TOPE_DESCARGAS = 15;              // máximo de causas por vez
  const DIAS_AVISO_COPIA = 15;
  // Mantener viva la sesión del PJN mientras se trabaja. Cada CADA_LATIDO se le
  // toca la sesión al sitio, pero SOLO si hubo actividad del usuario en los
  // últimos LATIDO_SI_ACTIVO. Con el equipo desatendido el latido se corta solo
  // y la sesión vence como siempre: una sesión que no caduca nunca es una
  // puerta abierta para cualquiera que se siente frente a la máquina.
  const CADA_LATIDO = 5 * 60 * 1000;
  const LATIDO_SI_ACTIVO = 15 * 60 * 1000;

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
    { t: 'Nueva cédula electrónica', u: 'https://notif.pjn.gov.ar/nueva' },
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

  // ---------------------------------------------------------- 2.1 utilidades

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

  // ----------------------------------------------- 2.2 partes del expediente
  //
  // De la lista, el PJN manda la carátula y nada más: no manda los
  // intervinientes. Pero la carátula suele traer los roles escritos
  // ("IMPUTADO: X S/ROBO DAMNIFICADO: Y", "ACTOR: A DEMANDADO: B S/DAÑOS"), y
  // cuando no los trae viene armada como "ACTORA C/ DEMANDADA S/ OBJETO". De
  // ahí salen las partes sin pedirle nada más al PJN. Los roles de verdad están
  // en la solapa Intervinientes de cada expediente.

  // Roles que el PJN escribe en la carátula. Los letrados y demás no aparecen ahí.
  // Atención a las terminaciones: IMPUTADA? solo toma "IMPUTAD" o "IMPUTADA", no
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

  // ------------------------------------------------------------- 2.3 almacén

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

  // --------------------------------------------------- 2.4 la cuenta del PJN
  //
  // El almacén de Tampermonkey es del navegador, no de la sesión del PJN: la
  // misma copia se ve con cualquier cuenta y también en incógnito. Por eso todo
  // lo que es de las causas se guarda separado por cuenta, y sin cuenta
  // identificada no se lee ni se escribe nada. Mostrar las causas de una cuenta
  // en la sesión de otra es exactamente lo que esto evita.
  //
  // La cuenta la muestra el encabezado de la Consulta Web arriba a la derecha
  // (el CUIT, al lado del ícono de usuario). Se la busca por texto y no por el
  // marcado, para que un cambio de maquetado del PJN no la haga perder.

  const RE_CUENTA = /(?:^|[^\d-])(\d{2}-?\d{8}-?\d)(?:[^\d-]|$)/;

  function cuentaEnTexto(t) {
    const m = RE_CUENTA.exec(' ' + String(t || '').replace(/\s+/g, ' ') + ' ');
    return m ? m[1].replace(/-/g, '') : '';
  }

  // Solo se mira la barra de usuario: ahí el PJN pone la cuenta. En el resto de
  // la página hay CUIT de las partes, y tomar uno de esos por la cuenta sería
  // peor que no identificarla (se armaría un compartimento falso).
  function cajasDeUsuario() {
    const out = [];
    const agregar = (e) => {
      if (!e || out.indexOf(e) >= 0) return;
      if (e.closest && e.closest('#supjn, #supjn-pastilla')) return;
      out.push(e);
    };
    document.querySelectorAll('nav, header, .navbar').forEach(agregar);
    // Por si el PJN cambia el marcado: lo que rodea al ícono de usuario.
    document.querySelectorAll('.fa-user, .glyphicon-user, [class*="icon-user"]').forEach((i) => {
      agregar((i.closest && i.closest('a, li, span, div')) || i.parentNode);
    });
    return out;
  }

  let ULTIMO_TXT = '';

  // Se recorren nodos de texto y no el textContent del contenedor: así no se
  // pegan dígitos de dos elementos distintos y se inventa una cuenta. Y se
  // exige que el nodo sea el número y nada más.
  function cuentaEnNodos(raiz, tope) {
    let n, vistos = 0, hallada = '';
    const it = document.createNodeIterator(raiz, 4);
    while ((n = it.nextNode())) {
      if (++vistos > tope) break;
      const p = n.parentNode;
      if (!p || !p.closest) continue;
      if (p.closest('#supjn, #supjn-pastilla')) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(p.nodeName)) continue;
      const t = String(n.nodeValue || '').trim();
      if (!/^\d{2}-?\d{8}-?\d$/.test(t)) continue;
      const c = t.replace(/-/g, '');
      if (hallada && hallada !== c) return '\u0000';   // dos distintas en la misma caja
      if (!hallada) {
        hallada = c;
        const cerca = p.textContent ? String(p.textContent).replace(/\s+/g, ' ').trim() : t;
        ULTIMO_TXT = (cerca.length > 3 && cerca.length <= 60 ? cerca : t).replace(/[\u25BE\u25BC\u2304]/g, '').trim();
      }
    }
    return hallada;
  }

  // Si aparecen dos números distintos, no se adivina: se sigue sin cuenta, que
  // es el estado seguro (no se muestra ni se guarda nada).
  function buscarCuentaEnLaPagina() {
    ULTIMO_TXT = '';
    let hallada = '';
    const cajas = cajasDeUsuario();
    for (let i = 0; i < cajas.length; i++) {
      const c = cuentaEnNodos(cajas[i], 400);
      if (c === '\u0000') { ULTIMO_TXT = ''; return ''; }
      if (!c) continue;
      if (hallada && hallada !== c) { ULTIMO_TXT = ''; return ''; }
      hallada = hallada || c;
    }
    return hallada;
  }

  let CUENTA = '';
  let CUENTA_TXT = '';     // lo que dice el encabezado: puede traer el nombre

  // La cuenta sale siempre de la página que se está viendo, nunca de algo
  // guardado: una cuenta recordada queda pegada después de cerrar sesión y se
  // le mostraría a la siguiente persona que entre en esa misma pestaña.
  function resolverCuenta() {
    const enPagina = buscarCuentaEnLaPagina();
    CUENTA = enPagina;
    CUENTA_TXT = enPagina ? (ULTIMO_TXT || enPagina) : '';
    return CUENTA;
  }

  // Para mostrarla sin escribir el número entero en pantalla.
  const cuentaCorta = (c) => { const x = String(c || CUENTA || ''); return x ? x.slice(0, 2) + '...' + x.slice(-3) : ''; };

  const SIN_CUENTA = 'No se pudo identificar con qué cuenta se ingresó al PJN. Lo que se lee del PJN puede usarse igual, pero no se guarda nada ni se muestra lo guardado (etiquetas, anotaciones, notas): los datos de dos cuentas no deben mezclarse. Recargá la página; si el aviso persiste, informá en qué pantalla ocurre.';

  const claveDe = (k) => k + '@' + CUENTA;
  const leerDeCuenta = (k, def) => (CUENTA ? leerAlmacen(claveDe(k), def) : def);
  const guardarEnCuenta = (k, v) => (CUENTA ? guardarAlmacen(claveDe(k), v) : false);

  // Solo para el banco de pruebas: cambia la cuenta en caliente y relee lo de esa
  // cuenta, como si se hubiera entrado con otra.
  function cuentaDePrueba(c) {
    CUENTA = String(c || '');
    CUENTA_TXT = CUENTA;
    DATOS.rel = validarDatos(leerDeCuenta(K_REL, null));
    DATOS.fav = validarDatos(leerDeCuenta(K_FAV, null));
    indexar('rel');
    indexar('fav');
    refrescarMarcas();
    refrescarNotas();
    refrescarHoras();
    refrescarVisto();
    refrescarFallas();
  }

  resolverCuenta();

  // Migración de la 0.5.2 y anteriores: lo guardado no tenía cuenta. Las
  // etiquetas, las anotaciones, las notas y las horas son suyos y van a la cuenta
  // con la que está entrando ahora. Las listas NO se migran: pueden haber
  // quedado de otra cuenta (el almacén era compartido) y se releen en segundos.
  function migrarACuenta() {
    if (!CUENTA) return false;
    if (leerAlmacen('supjn.mig.cuenta@' + CUENTA, null)) return false;
    let algo = false;
    [K_MARCAS, K_NOTAS, K_HORAS, K_VISTO, K_RESPALDO].forEach((k) => {
      const v = leerAlmacen(k, null);
      if (v == null) return;
      if (leerAlmacen(claveDe(k), null) == null) guardarAlmacen(claveDe(k), v);
      algo = true;
    });
    guardarAlmacen('supjn.mig.cuenta@' + CUENTA, { fecha: Date.now() });
    return algo;
  }
  migrarACuenta();

  // --------------------------------------------------- 3.1 la página del PJN
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
    avisar('Pidiendo al PJN la lista ordenada por fecha...');
    // Advertencia: al elegir FECHA en el desplegable, el propio control ya "queda puesto",
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

  // -------------------------------------------------------- 3.2 marco oculto

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
    if (!p) throw new Error('no se reconoce el enlace del PJN');
    const form = d.getElementById(p.formId);
    if (!form) throw new Error('no se encuentra el formulario del PJN');
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

  // ------------------------------------------------ 3.3 lectura de una lista

  let cancelarLectura = false;

  async function recorrerLista(fr, que, avisar) {
    const doc = fr.contentDocument;
    if (paginaActiva(doc) !== 1 && !(await irAPagina(doc, 1))) throw new Error('no se pudo volver a la primera página');
    const out = [];
    const vistos = {};
    for (let vuelta = 0; vuelta < 400; vuelta++) {
      if (cancelarLectura) throw new Error('cancelado');
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
      avisar('Abriendo ' + L.pjn + ' en segundo plano...');
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
        if (cancelarLectura) throw new Error('cancelado');
        avisar('Pidiendo también las causas fuera de trámite de ' + L.pjn + '...');
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

  // ---------------------------------------- 3.4 ubicar una causa en un marco
  //
  // Para abrir una causa, verla en el libro digital o descargarla hace falta la
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
    avisar('Abriendo ' + LISTAS[tipo].pjn + ' en segundo plano...');
    await esperarCarga(fr, () => { fr.src = RUTA[tipo]; }, esLista);
    if (tipoLista(fr.contentDocument) !== tipo) throw new Error('el PJN no devolvió la lista de ' + LISTAS[tipo].pjn);
    if (todas) {
      const casilla = casillaVerTodos(fr.contentDocument);
      const consultar = botonConsultar(fr.contentDocument);
      if (casilla && consultar && !casilla.checked) {
        avisar('Pidiendo las causas fuera de trámite...');
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
      avisar('Buscando ' + dc.exp + ' en la página ' + esperada + '...');
      if (await irAPagina(doc, esperada)) tr = filaEn(doc, dc.exp);
    }
    if (!tr && (await irAPagina(doc, 1))) {
      for (let i = 0; i < 400 && !tr; i++) {
        tr = filaEn(doc, dc.exp);
        if (tr) break;
        const sig = enlaceSiguiente(doc);
        if (!sig) break;
        const pag = paginaActiva(doc), f = firmaLista(doc);
        avisar('Buscando ' + dc.exp + ': página ' + (pag + 1) + '...');
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
    throw new Error('no se encuentra ' + k + (soloRel ? ' en Relacionados' : ' en las listas del PJN') + '. Probá con Actualizar');
  }

  // Abre la causa en segundo plano y devuelve la dirección del expediente.
  function direccionDe(k, accion, avisar) {
    return conMarco(async () => {
      const u = await ubicarCausa(k, avisar, accion === 'libro');
      const a = accion === 'libro' ? enlaceMenu(u.tr, /libro digital/i) : enlaceOjo(u.tr);
      if (!a) throw new Error(accion === 'libro' ? 'la fila de ' + k + ' no tiene "Libro digital"' : 'la fila de ' + k + ' no tiene el enlace para ver el expediente');
      avisar((accion === 'libro' ? 'Pidiendo el libro digital de ' : 'Abriendo ') + k + '...');
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

  // --------------------------------------------------------- 3.5 actuaciones

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
      const descargar = links.find((a) => /viewer\.seam/i.test(a.href) && /descargar/i.test(a.textContent));
      if (!descargar) return;
      const ver = links.find((a) => /viewer\.seam/i.test(a.href) && /^ver$/i.test(limpio(a.textContent)));
      const c = tr.cells;
      const texto = limpio(tr.textContent);
      if (c && c.length >= 5) {
        out.push({
          url: descargar.href, ver: ver ? ver.href : '',
          oficina: sinRotulo(c[1], /^oficina\s*:\s*/i),
          fecha: fechaPareja(sinRotulo(c[2], /^fecha\s*:\s*/i)),
          tipo: sinRotulo(c[3], /^tipo(\s+de)?\s+actuaci[oó]n\s*:\s*/i),
          detalle: sinRotulo(c[4], /^(descripci[oó]n\s*\/\s*)?detalle\s*:\s*/i),
          fojas: c[5] ? sinRotulo(c[5], /^a\s*fs\.?\s*:\s*/i) : '',
          hist: !!hist
        });
      } else {
        const f = /(\d{1,2}\/\d{1,2}\/\d{4})/.exec(texto);
        out.push({ url: descargar.href, ver: ver ? ver.href : '', oficina: '', fecha: f ? fechaPareja(f[1]) : '', tipo: '', detalle: texto.replace(/descargar|\bver\b/ig, '').slice(0, 160), fojas: '', hist: !!hist });
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
      if (cortar && cortar()) throw new Error('cancelado');
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
      avisar('Abriendo el expediente en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      const d1 = fr.contentDocument;
      const datos = datosExpediente(d1);
      const hayHist = tieneHistoricas(d1);
      const actuales = await recorrerActuaciones(d1, false, avisar, cortar);
      let historicas = [];
      if (hayHist) {
        if (cortar && cortar()) throw new Error('cancelado');
        avisar('Abriendo las actuaciones históricas...');
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

  // ---------------------- 3.6 las otras solapas del expediente: cómo se leen
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
    if (!form) throw new Error('no se encuentra el formulario del expediente');
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

  // Devuelve el panel de la solapa. seLleno queda en el propio panel: dice si el
  // PJN alcanzó a poner algo adentro.
  async function abrirSolapa(fr, etiqueta) {
    let seLleno = true;
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
      // La espera de arriba se conforma con que haya cargado el expediente, así
      // que la solapa puede seguir vacía. Se le da otra oportunidad y, si igual no
      // se llena, se sigue pero avisando: una solapa que no se llenó no es lo
      // mismo que una solapa sin nada, y decir que no hay nada sería mentir.
      if (!(await esperarA(() => lleno(fr.contentDocument), url ? 8000 : 20000))) seLleno = false;
      td = cabezaSolapa(fr.contentDocument, etiqueta) || td;
    }
    const p = panelDeSolapa(fr.contentDocument, td);
    if (!p) throw new Error('el PJN no abrió ' + etiqueta);
    p.__seLleno = seLleno;
    return p;
  }

  // Lee una solapa entera, recorriendo su paginador propio.
  async function leerSolapaExp(cid, clave, avisar) {
    const etiqueta = SOLAPAS_EXP[clave];
    const fr = crearMarco();
    try {
      avisar('Abriendo el expediente en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      avisar('Pidiendo ' + etiqueta + ' al PJN...');
      let p = await abrirSolapa(fr, etiqueta);
      const seLleno = p.__seLleno !== false;
      const cabs = [];
      const filas = [];
      const vistos = {};
      // Si el paginador del PJN se corta a mitad de camino, lo leído no es toda
      // la lista: hay que decirlo y no mostrarlo como si estuviera completo.
      let completa = true;
      let v = 0;
      for (; v < 300; v++) {
        p = panelVivo(fr, etiqueta) || p;
        const t = p.querySelector('table');
        if (!t) { if (v) completa = false; break; }
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
        // Se pide un panel vivo de verdad: sin panel, la firma vacía daba por
        // cumplida la espera al instante y el bucle giraba en falso.
        if (!(await esperarA(() => { const pv = panelVivo(fr, etiqueta); return !!pv && firmaPanel(pv) !== antes; }, 20000))) { completa = false; break; }
      }
      if (v >= 300) completa = false;
      // Sin filas y sin haberse llenado, no se sabe si la solapa está vacía.
      if (!filas.length && !seLleno) completa = false;
      return { cabs, filas, completa };
    } finally {
      fr.remove();
    }
  }

  // Abre una causa vinculada: se vuelve a pedir la solapa y se usa el ojo de su fila.
  async function direccionVinculado(cid, exp, avisar) {
    const fr = crearMarco();
    try {
      avisar('Buscando ' + exp + ' entre los vinculados...');
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
          avisar('Abriendo ' + exp + '...');
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
      throw new Error('no se encuentra ' + exp + ' entre los vinculados');
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

  // ------------------------------------------------------------- 3.7 los PDF

  // Un PDF empieza con "%PDF-" (a veces con algunos bytes antes).
  function esPDF(buf) {
    if (!buf || !buf.byteLength) return false;
    const b = new Uint8Array(buf, 0, Math.min(buf.byteLength, 1024));
    for (let i = 0; i + 4 < b.length; i++) {
      if (b[i] === 0x25 && b[i + 1] === 0x50 && b[i + 2] === 0x44 && b[i + 3] === 0x46 && b[i + 4] === 0x2d) return true;
    }
    return false;
  }

  // Una fecha de PDF: D:AAAAMMDDHHmmSS seguida, si está, del huso horario
  // (-03'00' o Z). El formato admite escribir de menos, así que se completa.
  // Se devuelve el instante, para poder compararlo y mostrarlo en hora de acá.
  function fechaPDF(cruda, huso) {
    // Se completa lo que falte: el mes y el día arrancan en 01, la hora en 00.
    const d = (cruda + '0101'.slice(Math.min(4, Math.max(0, cruda.length - 4))) + '00000000000000').slice(0, 14);
    const a = +d.slice(0, 4), me = +d.slice(4, 6), dd = +d.slice(6, 8);
    const hh = +d.slice(8, 10), mi = +d.slice(10, 12), ss = +d.slice(12, 14);
    // Una fecha fuera de rango no es una fecha: ocurre cuando los bytes de un
    // archivo comprimido forman por azar algo con esa apariencia. Si se aceptara,
    // desplazaría a la fecha real de la firma.
    if (a < 1990 || a > 2100 || me < 1 || me > 12 || dd < 1 || dd > 31 || hh > 23 || mi > 59 || ss > 59) return null;
    let ms;
    if (huso) {
      const signo = huso[0] === '-' ? -1 : 1;
      const min = /^[+-](\d{2})'?(\d{2})?/.exec(huso);
      const desfase = huso[0] === 'Z' || !min ? 0 : signo * ((+min[1]) * 60 + (+(min[2] || 0)));
      ms = Date.UTC(a, me - 1, dd, hh, mi, ss) - desfase * 60000;
    } else {
      // Sin huso escrito, el formato dice que es hora local: se la toma como está.
      ms = new Date(a, me - 1, dd, hh, mi, ss).getTime();
    }
    return isNaN(ms) ? null : ms;
  }

  // La hora no está en el HTML del PJN, pero sí en el documento: las resoluciones
  // y los escritos van firmados digitalmente y la firma lleva fecha y hora
  // (/M (D:AAAAMMDDHHmmSS)). Si no hay firma, se prueba con la fecha de
  // modificación y con la de creación del archivo.
  function horaDePDF(buf) {
    let s = '';
    try {
      const b = new Uint8Array(buf);
      // La firma digital se agrega al final del archivo, no al principio: en un
      // expediente escaneado grande, leer la cabeza devolvía la fecha del escáner.
      // Se leen las dos puntas.
      const TOPE = 3000000;
      const partes = b.length > TOPE * 2 ? [b.subarray(0, TOPE), b.subarray(b.length - TOPE)] : [b];
      partes.forEach((trozo) => {
        for (let i = 0; i < trozo.length; i += 8192) s += String.fromCharCode.apply(null, trozo.subarray(i, Math.min(i + 8192, trozo.length)));
      });
    } catch (e) { return null; }
    const halladas = { M: [], ModDate: [], CreationDate: [] };
    const re = /\/(M|ModDate|CreationDate)\s*\(\s*D:(\d{4,14})(Z|[+-]\d{2}'?\d{0,2})?/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      const ms = fechaPDF(m[2], m[3] || '');
      if (ms === null) continue;
      // La /M de una firma vive cerca del /ByteRange que dice qué se firmó. La
      // /M suelta también la usan las anotaciones del PDF, que no son la firma.
      const cerca = m[1] === 'M' && /\/(ByteRange|SubFilter|Type\s*\/\s*Sig)/.test(s.slice(Math.max(0, m.index - 1500), m.index + 1500));
      halladas[m[1]].push({ ms, firma: cerca });
    }
    const firmas = halladas.M.filter((x) => x.firma);
    // La más nueva de las firmas: es la última vez que se firmó el documento.
    const mayor = (l) => l.slice().sort((x, y) => x.ms - y.ms).pop();
    const elegida = firmas.length ? mayor(firmas)
      : halladas.M.length ? mayor(halladas.M)
        : halladas.ModDate.length ? mayor(halladas.ModDate)
          : halladas.CreationDate.length ? mayor(halladas.CreationDate) : null;
    if (!elegida) return null;
    const d = new Date(elegida.ms);
    const dos = (n) => String(n).padStart(2, '0');
    return {
      f: dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear(),
      hh: dos(d.getHours()) + ':' + dos(d.getMinutes()),
      origen: firmas.length ? 'la firma del documento' : halladas.M.length ? 'la fecha del documento' : 'la fecha del archivo'
    };
  }

  // ¿Venció la sesión del PJN? Se pide la lista: si el PJN manda al ingreso
  // (que es otro sitio) el navegador corta el pedido, y si devuelve la página
  // de usuario y clave, también venció. Se recuerda medio minuto para no
  // preguntar por cada actuación.
  let sesionMirada = { ts: 0, vencida: false };
  async function sesionVencida() {
    if (Date.now() - sesionMirada.ts < 30000) return sesionMirada.vencida;
    let vencida = false;
    // Se prueba dos veces: una interrupción momentánea de la red no es una
    // sesión vencida, y afirmar que venció cuando no venció obliga al usuario a
    // ingresar de nuevo sin necesidad.
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(RUTA.rel, { credentials: 'include' });
        const t = await r.text();
        vencida = new URL(r.url).host !== location.host || /type=["']?password/i.test(t);
        break;
      } catch (e) {
        // Sin conexión no se puede saber; con conexión, el corte es la redirección al ingreso.
        vencida = window.navigator.onLine !== false;
        if (!vencida) break;
        if (i === 0) await dormir(800);
      }
    }
    sesionMirada = { ts: Date.now(), vencida };
    return vencida;
  }

  // --------------------------------------- 3.8 la sesión mientras se trabaja
  //
  // El PJN cierra la sesión por inactividad, y eso corta una tanda de nota o una
  // descarga a la mitad. Mientras se está trabajando se le toca la sesión cada
  // tanto, con un pedido del que se descarta el cuerpo: alcanza con que el
  // servidor la vea viva.
  //
  // La condición es que haya habido actividad del usuario hace poco. Si dejó el
  // equipo, el latido se detiene y la sesión caduca sola, que es lo que
  // corresponde: mantenerla viva sin nadie delante deja la cuenta a mano de
  // cualquiera.

  let ultimaActividad = Date.now();
  const huboActividad = () => { ultimaActividad = Date.now(); };
  const activoHacePoco = () => (Date.now() - ultimaActividad) < LATIDO_SI_ACTIVO;
  // Solo para el banco de pruebas: deja la actividad como si hiciera rato
  // que el usuario no toca nada.
  const olvidarActividad = () => { ultimaActividad = 0; };

  // La regla: hay alguien trabajando. Un trabajo en curso cuenta como actividad,
  // porque una tanda de nota o una descarga larga no tienen por qué morir
  // porque el usuario no toque el teclado durante un rato.
  const hayQueMantenerViva = () => activoHacePoco() || bajandoAlgo() || corridaActiva();

  // Y las condiciones del entorno: estar en la Consulta Web, con cuenta
  // identificada y con la pestaña a la vista.
  const convieneLatir = () => !EN_PORTAL && !!CUENTA && !document.hidden && hayQueMantenerViva();

  // El pedido en sí. Se descarta el cuerpo: alcanza con que el servidor vea la
  // sesión viva, y la lista de Relacionados es una página grande.
  async function tocarSesion() {
    try {
      const r = await fetch(RUTA.rel, { credentials: 'include' });
      if (r.body && typeof r.body.cancel === 'function') { try { r.body.cancel(); } catch (e) { /* ya se cerró */ } }
      return true;
    } catch (e) { return false; }
  }

  // Devuelve true si se tocó la sesión, y false si se decidió no hacerlo.
  async function latirSesion() {
    if (!convieneLatir()) return false;
    return tocarSesion();
  }

  // Esperas entre intentos, en milisegundos. Crecen porque las dos causas
  // habituales de una respuesta fallida necesitan tiempos distintos: una
  // interrupción momentánea de la red se recupera enseguida, pero un servidor saturado
  // responde peor si se insiste de inmediato. Tres intentos y no más: a partir
  // de ahí la falla es estable y conviene informarla en lugar de seguir
  // ocupando la cola.
  const ESPERAS_REINTENTO = [600, 1500, 3000];

  // Trae una actuación. Devuelve { buf } si llegó un PDF, { vencida: true } si
  // la sesión del PJN venció, y null si no llegó un PDF (actuación sin documento).
  // El contexto es opcional: cuando se pasa, las fallas quedan registradas con
  // el expediente y la actuación de los que provienen.
  async function traerPDF(u, ctx) {
    const c = ctx || {};
    // Registrar la falla es diagnóstico, nunca motivo de interrupción.
    const anotar = (d) => {
      if (c.mudo) return;
      try { anotarFalla(Object.assign({ exp: c.exp || '', act: c.act || '', url: u, etapa: 'descarga' }, d)); } catch (e) { /* el registro no debe interrumpir la descarga */ }
    };
    let ultimo = null;
    for (let i = 0; i < ESPERAS_REINTENTO.length; i++) {
      const intento = i + 1;
      let r;
      try {
        r = await fetch(u, { credentials: 'include' });
      } catch (e) {
        if (await sesionVencida()) return { vencida: true };
        ultimo = { motivo: 'no hubo respuesta del servidor: ' + mensajeDe(e), intentos: intento };
        await dormir(ESPERAS_REINTENTO[i]);
        continue;
      }
      if (r.ok) {
        const tipo = (r.headers.get('content-type') || '').toLowerCase();
        let buf;
        try { buf = await r.arrayBuffer(); } catch (e) { buf = null; }
        if (esPDF(buf)) return { buf };
        // Llegó una página en vez del PDF: puede ser el ingreso del PJN.
        if (/html/.test(tipo) && (await sesionVencida())) return { vencida: true };
        // Respuesta correcta pero sin documento: es el caso de la actuación sin
        // PDF. No se reintenta, porque insistir daría siempre el mismo resultado.
        anotar({ http: r.status, tipo, bytes: buf ? buf.byteLength : 0, intentos: intento,
          motivo: buf && buf.byteLength ? 'la respuesta no es un PDF' : 'la respuesta llegó vacía' });
        return null;
      }
      ultimo = { http: r.status, tipo: (r.headers.get('content-type') || '').toLowerCase(), intentos: intento,
        motivo: 'el servidor respondió con el estado ' + r.status };
      await dormir(ESPERAS_REINTENTO[i]);
    }
    anotar(ultimo || { intentos: ESPERAS_REINTENTO.length, motivo: 'se agotaron los intentos' });
    return null;
  }

  async function unirPDF(urls, avance, cortar, ctx) {
    const { PDFDocument } = PDFLib;
    const final = await PDFDocument.create();
    const c = ctx || {};
    // Las direcciones que se unen pueden ser un subconjunto de las actuaciones
    // leídas (cuando el usuario elige cuáles descargar), así que la actuación se
    // busca por su dirección y no por la posición en la lista.
    const porUrl = new Map();
    if (Array.isArray(c.acts)) c.acts.forEach((a) => { if (a && a.url) porUrl.set(a.url, a); });
    const contexto = (i) => ({ exp: c.exp || '', act: descripcionActuacion(porUrl.get(urls[i])) });
    let ok = 0, fallas = 0;
    for (let i = 0; i < urls.length; i++) {
      if (cortar && cortar()) throw new Error('cancelado');
      avance(i, urls.length);
      const res = await traerPDF(urls[i], contexto(i));
      if (res && res.vencida) throw new Error(VENCIDA);
      if (!res) { fallas++; continue; }
      const buf = res.buf;
      try {
        const d = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pags = await final.copyPages(d, d.getPageIndices());
        pags.forEach((p) => final.addPage(p));
        ok++;
      } catch (e) {
        // El documento llegó, pero no se puede leer: PDF dañado o cifrado.
        // Es una falla distinta de la anterior y conviene distinguirla.
        fallas++;
        try {
          anotarFalla(Object.assign({ url: urls[i], etapa: 'lectura del PDF', bytes: buf ? buf.byteLength : 0,
            motivo: 'el documento llegó pero no se pudo leer: ' + mensajeDe(e) }, contexto(i)));
        } catch (e2) { /* el registro no debe interrumpir la unión */ }
      }
    }
    // El motivo de cada documento quedó en el registro de fallas: el mensaje no
    // afirma una causa, porque lo mismo puede deberse a actuaciones sin PDF que
    // a un problema del PJN, y confundirlos lleva a buscar el error donde no está.
    if (!ok) throw new Error('no se pudo obtener ningún documento; el detalle de cada uno está en el registro de fallas, en Acerca de');
    avance(urls.length, urls.length);
    return { bytes: await final.save(), ok, fallas };
  }

  // Cómo se nombra una actuación en el registro de fallas: fecha y tipo bastan
  // para ubicarla en la tabla del expediente.
  function descripcionActuacion(a) {
    if (!a) return '';
    const partes = [a.fecha, a.tipo].filter(Boolean);
    return limpio(partes.length ? partes.join(' ') : (a.detalle || '')).slice(0, 120);
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
    // No se suelta antes: con "preguntar dónde guardar cada archivo" prendido, la
    // descarga recién arranca cuando el usuario elige la carpeta.
    setTimeout(() => URL.revokeObjectURL(url), 180000);
  }

  // --------------------------------------------------- 4.1 cola de descargas
  //
  // Cada causa es un trabajo. modo 'todo' descarga el expediente completo; modo
  // 'elegir' lee las actuaciones y espera a que se elijan. Los trabajos corren
  // de a uno, en segundo plano, sin mover la página del PJN.

  const COLA = [];
  let colaCorriendo = false;
  let cortarCola = false;
  let idTrabajo = 0;
  // De a cinco causas y una pausa entre bloque y bloque: descargar cincuenta
  // expedientes seguidos sobrecarga al servidor del PJN y deja la aplicación
  // ocupada durante horas.
  let hechasSeguidas = 0;
  let ultimaBajada = 0;
  let pausaHasta = 0;
  const saltarPausa = () => { pausaHasta = 0; pintarDescargas(); };

  function nuevoTrabajo(datos) {
    const t = Object.assign({ id: 't' + (++idTrabajo), creado: Date.now(), exp: '', car: '', modo: 'todo', estado: 'en cola', texto: 'En cola', frac: 0, acts: null, elegidas: null, filtro: { texto: '', desde: '', hasta: '' }, urls: null, parcial: false }, datos);
    COLA.push(t);
    return t;
  }

  // Lo que va a descargar solo: cuenta para el tope. "eligiendo" no, porque espera al
  // usuario y podría bloquear el tope para siempre.
  const PENDIENTE = /en cola|abriendo|leyendo|descargando|a descargar/;
  let cortePedidoEn = 0;
  const EN_JUEGO = /en cola|abriendo|leyendo|descargando|eligiendo|a descargar/;
  const pendientesCola = () => COLA.filter((t) => PENDIENTE.test(t.estado)).length;

  // El tope es sobre lo que queda por descargar, no sobre la tanda que se pide: si
  // no, seleccionando de a quince dos veces se encolaban treinta.
  function hayLugarPara(n) {
    const esperando = pendientesCola();
    const libres = TOPE_DESCARGAS - esperando;
    if (n <= libres) return true;
    avisar(libres <= 0
      ? 'Ya hay ' + plural(esperando, 'causa esperando', 'causas esperando') + ' en Descargas y el tope es ' + TOPE_DESCARGAS + ' por vez: esperá a que terminen.'
      : 'Son demasiadas de una vez: entran ' + plural(libres, 'causa más', 'causas más') + ', porque el tope es ' + TOPE_DESCARGAS + ' por vez contando las que ya están en Descargas.', true);
    return false;
  }

  function encolarCausas(claves, modo) {
    const nuevas = claves.filter((k) => !COLA.find((t) => t.exp === k && t.modo === modo && EN_JUEGO.test(t.estado)));
    if (!nuevas.length) return 0;
    if (!hayLugarPara(nuevas.length)) return -1;
    nuevas.forEach((k) => {
      const c = causaPorClave(k);
      nuevoTrabajo({ exp: k, car: c ? c.car : '', modo });
    });
    procesarCola();
    return nuevas.length;
  }

  function textoTrabajo(t, texto, frac) {
    t.texto = texto;
    if (typeof frac === 'number') t.frac = frac;
    pintarTrabajo(t);
  }

  async function procesarCola() {
    if (colaCorriendo) return;
    colaCorriendo = true;
    // Un corte pedido con la cola parada no alcanza a lo que se encole después:
    // si quedara prendido, la tanda siguiente se cortaría sola al empezar.
    cortarCola = false;
    pintarPastilla();
    try {
      for (;;) {
        const t = COLA.find((x) => x.estado === 'en cola' || x.estado === 'a descargar');
        if (!t) break;
        // Si entre bloque y bloque pasó más tiempo que el pausa, la cuenta
        // arranca de nuevo: no tiene sentido hacer esperar a quien encola una
        // sola causa media hora después.
        if (hechasSeguidas && Date.now() - ultimaBajada > PAUSA_BLOQUE) hechasSeguidas = 0;
        // Pausa entre bloques, salvo que se corte o se pida seguir ahora.
        if (hechasSeguidas >= BLOQUE_DESCARGAS) {
          hechasSeguidas = 0;
          pausaHasta = Date.now() + PAUSA_BLOQUE;
          pintarDescargas();
          while (pausaHasta && Date.now() < pausaHasta && !cortarCola) await dormir(500);
          pausaHasta = 0;
          pintarDescargas();
        }
        // Cancelar durante el pausa corta de verdad. Antes el pedido se perdía
        // acá y la causa que seguía se descargaba igual.
        if (cortarCola) {
          cortarCola = false;
          pintarDescargas();
          continue;
        }
        try {
          if (t.estado === 'en cola') {
            if (!t.acts) {
              if (!t.cid) {
                t.estado = 'abriendo';
                textoTrabajo(t, 'Buscando la causa en el PJN...', 0);
                const url = await direccionDe(t.exp, 'ojo', (x) => textoTrabajo(t, x));
                t.cid = new URL(url).searchParams.get('cid');
              }
              if (cortarCola) throw new Error('cancelado');
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
              textoTrabajo(t, plural(t.acts.length, 'actuación con PDF', 'actuaciones con PDF') + '. Elegí cuáles descargar.', 0);
              pintarDescargas();
              continue;
            }
            t.urls = t.acts.map((a) => a.url);
            t.parcial = false;
          }
          if (!t.urls || !t.urls.length) throw new Error('no hay actuaciones con PDF para descargar');
          t.estado = 'descargando';
          textoTrabajo(t, 'Uniendo 0 de ' + t.urls.length, 0);
          const r = await unirPDF(t.urls, (i, n) => textoTrabajo(t, i < n ? 'Uniendo ' + (i + 1) + ' de ' + n : 'Generando el PDF...', i / n), () => cortarCola, { exp: t.exp, acts: t.acts });
          t.archivo = (t.nombre || nombreArchivo(t.exp) + (t.parcial ? '-seleccion' : '')) + '.pdf';
          guardarArchivo(r.bytes, t.archivo);
          t.estado = 'listo';
          hechasSeguidas++;
          ultimaBajada = Date.now();
          textoTrabajo(t, 'Listo: ' + t.archivo + ', ' + plural(r.ok, 'documento', 'documentos') + (r.fallas ? '; ' + r.fallas + ' sin documento' : '') + '.', 1);
        } catch (e) {
          const msg = String(e && e.message ? e.message : e);
          // Qué se estaba haciendo cuando falló: distingue un problema al
          // ubicar la causa de uno al leer las actuaciones o al armar el
          // archivo. Se toma antes de marcar el trabajo como fallido.
          const etapa = t.estado;
          if (msg === 'cancelado') {
            COLA.forEach((x) => {
              if (x.creado > cortePedidoEn) return;   // encolada después del corte
              if (/en cola|abriendo|leyendo|descargando|a descargar/.test(x.estado)) { x.estado = 'cancelado'; x.texto = 'Cancelado.'; }
            });
          } else {
            t.estado = 'error';
            t.texto = 'No se pudo: ' + mensajeDe(e) + '.';
            try {
              anotarFalla({ exp: t.exp, etapa: 'trabajo, ' + etapa, motivo: mensajeDe(e) });
            } catch (e2) { /* el registro no debe interrumpir la cola */ }
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

  // "eligiendo" también cuenta: es una lectura hecha que se pierde si la
  // página cambia, y antes se iba sin avisar al arrancar una tanda de nota.
  const bajandoAlgo = () => colaCorriendo || COLA.some((t) => EN_JUEGO.test(t.estado));

  // ---------------------------------------------------------- 4.2 dejar nota
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
    // Se toma el número entero, con el incidente si lo trae (32733/1980/1): si se
    // cortaba en dos tramos, la confirmación de un incidente se leía como la del
    // expediente principal.
    const ok = /Ya se ha dejado nota[^]{0,80}?expediente:\s*([\d]+\/[\d]+(?:\/[A-Z0-9]+)*)/i.exec(t);
    if (ok) return { ok: true, expediente: ok[1], texto: ok[0].slice(0, 120) };
    const mal = /No se pudo realizar la acci[^]{0,140}/i.exec(t);
    if (mal) return { ok: false, texto: mal[0].slice(0, 140) };
    return null;
  }

  // "CIV 032733/1980" en la tabla y "32733/1980" en el mensaje. El PJN suele
  // mandar solo número y año; cuando además manda el incidente, se compara
  // entero, para no dar por dejada en el principal una nota de su incidente.
  function mismoExpediente(deLaTabla, delMensaje) {
    const n = (x) => String(x || '').replace(/^[A-Z]+\s*/i, '').replace(/\s/g, '').toUpperCase()
      .split('/').map((p) => p.replace(/^0+(?=.)/, '')).join('/');
    const tabla = n(deLaTabla).split('/');
    const msg = n(delMensaje).split('/');
    if (msg.length < 2 || !msg[0] || !msg[1]) return false;
    const largo = Math.max(2, Math.min(msg.length, tabla.length));
    if (msg.length > 2 && msg.length !== tabla.length) return false;
    return tabla.slice(0, largo).join('/') === msg.slice(0, largo).join('/');
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
  // Al guardar una copia anterior no se pierde una cancelación pedida mientras tanto.
  const guardarCorrida = (c) => {
    const actual = leerSesion(S_CORRIDA);
    if (actual && actual.cortar && actual.id === c.id) c.cortar = true;
    guardarSesion(S_CORRIDA, c);
  };
  const corridaActiva = () => { const c = leerCorrida(); return !!(c && c.activa); };

  // ------------------------------------------------ 4.3 turno entre pestañas
  //
  // La tanda vive en sessionStorage, y Chrome lo copia al duplicar una pestaña
  // o al restaurar una cerrada: sin control, dos pestañas dejarían la misma
  // nota dos veces. Por eso hay un turno en localStorage (compartido entre las
  // pestañas) con una ficha que cambia en cada paso. Una pestaña sigue solo si
  // su ficha es la del turno; justo antes de confirmar lo vuelve a mirar. Un
  // turno sin movimiento hace más de TURNO_VENCE no se retoma.
  const K_TURNO_BASE = 'supjn_nota_turno';
  const K_TURNO = K_TURNO_BASE + (CUENTA ? '@' + CUENTA : '');
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

  // Mientras la tanda está en pausa (esta pestaña está mirando otra cosa del PJN)
  // el turno se mantiene vivo. Sin esto, a los tres minutos la tanda se daba por
  // abandonada y no seguía cuando el usuario volvía a Relacionados.
  let latido = 0;
  const pararLatido = () => { if (latido) { clearInterval(latido); latido = 0; } };
  function latirTurno() {
    pararLatido();
    latido = setInterval(() => {
      const a = leerCorrida();
      const t = leerTurno();
      if (!a || !a.activa || !t || !esMiTurno(a, t)) { pararLatido(); return; }
      escribirTurno(a);
    }, 30000);
  }

  // solo: null deja nota en todas las habilitadas; si no, las claves elegidas.
  function nuevaCorrida(solo) {
    return {
      id: ficha(),
      token: ficha(),
      cuenta: CUENTA,
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
    guardarEnCuenta(K_NOTAS, NOTAS);
    respaldarPronto();
  }

  // Esta pestaña deja de manejar la tanda (la sigue otra). No escribe resultados.
  function perderTurno(motivo) {
    pararLatido();
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

  // Si algo falla en medio de un paso, la tanda se cierra con lo que se llegó a
  // hacer. Antes quedaba trabada: notaEnCurso se quedaba en true, "Cancelar" no
  // hacía nada y no se podían descargar expedientes hasta recargar la página.
  async function pasoNota() {
    try {
      await pasoNotaInterno();
    } catch (e) {
      notaEnCurso = false;
      const c = leerCorrida();
      try {
        if (c && c.activa) {
          if (c.enCurso) {
            const e0 = c.enCurso;
            // Solo es "a verificar" si se llegó a confirmar. Si no, la nota no se
            // dejó, y decir otra cosa sería afirmar algo que el PJN no recibió.
            if (c.confirmado) { (c.dudas = c.dudas || []).push(e0); c.problemas.push(e0 + ': se confirmó y no se llegó a ver la respuesta del PJN'); }
            else c.problemas.push(e0 + ': no se llegó a apretar Confirmar');
            if (c.hechos.indexOf(e0) < 0) c.hechos.push(e0);
            c.enCurso = null;
          }
          terminarNota(c, 'Se canceló la tanda: ' + mensajeDe(e) + '.');
        } else {
          avisar('No se pudo seguir dejando nota: ' + mensajeDe(e) + '.', true);
        }
      } catch (e2) {
        borrarSesion(S_CORRIDA);
        avisar('No se pudo seguir dejando nota: ' + mensajeDe(e) + '.', true);
      }
    }
  }

  async function pasoNotaInterno() {
    const c = leerCorrida();
    if (!c || !c.activa) return;
    // La tanda es de la cuenta con la que se empezó. Si en esta pestaña se entró
    // con otra, no se retoma ni se escribe nada: sus causas no son de esta cuenta.
    if (!CUENTA || (c.cuenta && c.cuenta !== CUENTA)) {
      borrarSesion(S_CORRIDA);
      notaEnCurso = false;
      pararLatido();
      if (c.cuenta && CUENTA) avisar('Había una tanda de dejar nota de otra cuenta del PJN en esta pestaña: no se retoma.', true);
      return;
    }
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

    if (abortarNota || c.cortar) { terminarNota(c, 'Cancelado.'); return; }
    if (!quedanElegidos(c)) { terminarNota(c, null); return; }

    // 1 bis. La tanda solo avanza sobre la lista de Relacionados del PJN.
    if (!enRel) { pausarNota(); return; }

    // 1 ter. Si la recarga nos devolvió a la primera página, volver a la que iba.
    if ((c.pagina || 0) !== paginaActualNota()) {
      estadoNota('Volviendo a la página ' + ((c.pagina || 0) + 1) + '...');
      const ok = await irAPaginaNota(c.pagina || 0);
      if (!ok) { c.pagina = paginaActualNota(); guardarCorrida(c); }
    }

    // 2. Si la recarga se llevó el filtro, volver a ponerlo.
    if (!filasConLapiz().length) {
      const f = botonFiltroNota(document);
      if (f) {
        estadoNota('Aplicando el filtro "Dejar nota" del PJN...');
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
      estadoNota('El cartel no se abrió para ' + prox.expediente + '. Se recarga la lista y se continúa...');
      location.href = RUTA.rel;
      return;
    }
    c.fallosCartel = 0;

    await dormir(350);
    const b = botonConfirmar(document);
    if (!b) {
      c.problemas.push(prox.expediente + ': no se encuentra el botón Confirmar');
      anotarResultado(prox.expediente, false, 'no se encuentra el botón Confirmar');
      if (c.hechos.indexOf(prox.expediente) < 0) c.hechos.push(prox.expediente);
      c.enCurso = null;
      guardarCorrida(c);
      terminarNota(c, 'No se encuentra el botón Confirmar del cartel del PJN.');
      return;
    }

    await dormir(c.pausa || 700);
    const c2 = leerCorrida();
    if (abortarNota || (c2 && c2.cortar)) { c.enCurso = null; guardarCorrida(c); terminarNota(c, 'Cancelado.'); return; }
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
    latirTurno();
    estadoNota('En pausa: esta página no es la lista de Relacionados del PJN. La tanda queda a la espera mientras esta pestaña siga abierta: volvé a Relacionados para seguir, o cancelala.');
    pintarNota();
    if (VISTA === 'nota') pintarTodo();
  }

  function terminarNota(c, motivo) {
    pararLatido();
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
      // Sin un resultado propio anotado, la nota queda "a verificar", nunca
      // "dejada": darla por buena sería afirmar algo que el PJN no confirmó acá.
      // Pasa con lo que hizo otra pestaña que no llegó a escribir su resultado.
      const enDuda = dudas.indexOf(e) >= 0;
      NOTAS[e] = { f: hoy, t: ahora, ok: (enDuda || !malos[e]) ? null : false,
        m: malos[e] || 'no se vio la respuesta del PJN en esta pestaña' };
    });
    // Una causa elegida que no apareció con lápiz y que hoy ya tenía nota dejada
    // no es una falla: que el PJN le saque el lápiz es la consecuencia de la nota.
    const yaEstaban = [];
    const noSalieron = [];
    noVistas.forEach((e) => {
      const ya = NOTAS[e];
      if (ya && ya.f === hoy && ya.ok !== false) { yaEstaban.push(e); return; }
      NOTAS[e] = { f: hoy, t: ahora, ok: false, m: 'no apareció con lápiz en la lista del PJN' };
      noSalieron.push(e);
    });
    guardarEnCuenta(K_NOTAS, NOTAS);
    borrarSesion(S_CORRIDA);
    soltarTurno(c);
    notaEnCurso = false;
    abortarNota = false;
    // El resumen sale de lo guardado, que es lo que se ve en la tabla.
    const res = (e) => NOTAS[e] || { ok: false, m: '' };
    const detalle = (e) => e + (res(e).m ? ': ' + res(e).m : '');
    const ok = c.hechos.filter((e) => res(e).ok === true).length;
    const aVerificar = c.hechos.filter((e) => res(e).ok === null);
    const fallas = c.hechos.filter((e) => res(e).ok === false).concat(noSalieron);
    avisar((motivo ? motivo + ' ' : '') + 'Terminado: ' + plural(ok, 'nota dejada', 'notas dejadas') +
      (yaEstaban.length ? '. ' + plural(yaEstaban.length, 'ya tenía', 'ya tenían') + ' nota dejada hoy y el PJN no le' + (yaEstaban.length > 1 ? 's' : '') + ' pone lápiz: ' + yaEstaban.join(' | ') : '') +
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
    if (bajandoAlgo()) { avisar('Hay descargas en curso: esperá a que terminen, o cancelalas, antes de dejar nota.', true); return; }
    if (otraTandaViva()) { avisar('Hay una tanda de dejar nota en curso en otra pestaña del PJN.', true); return; }
    guardarSesion(S_ENCARGO, { tipo: 'nota', solo: solo || null, ts: Date.now() });
    avisar('Abriendo la lista de Relacionados del PJN para dejar nota...');
    location.href = RUTA.rel;
  }

  function arrancarNotaDesdeEncargo(enc) {
    if (tipoLista(document) !== 'rel' || (!botonConfirmar(document) && !botonFiltroNota(document))) {
      avisar('La lista de Relacionados del PJN no tiene la función de dejar nota en este momento.', true);
      return;
    }
    if (otraTandaViva()) { avisar('No se inicia: hay una tanda de dejar nota en curso en otra pestaña del PJN.', true); return; }
    abortarNota = false;
    const c = nuevaCorrida(enc.solo);
    guardarCorrida(c);
    escribirTurno(c);
    pasoNota();
  }

  // Cancelar no borra la tanda: la marca, para que la próxima carga la cierre con
  // el resultado de lo que se llegó a hacer.
  function cortarNota() {
    abortarNota = true;
    const c = leerCorrida();
    if (c) { c.cortar = true; guardarSesion(S_CORRIDA, c); }
    estadoNota('Cancelando: se detiene al terminar la causa en curso.');
    // Si la página recién cargó y el paso todavía no arrancó, se arranca ahora:
    // primero lee cómo salió la última nota confirmada y después cierra.
    if (c && !notaEnCurso) pasoNota();
  }

  // --------------------------------------------- 5.1 etiquetas y anotaciones
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
        // t: cuándo se modificó por última vez. Permite determinar, entre dos
        // equipos que comparten la carpeta, cuál anotación es la más reciente.
        // Lo guardado por versiones anteriores no lo tiene y se trata aparte.
        const t = typeof f.t === 'number' && f.t > 0 ? f.t : 0;
        if (et.length || nota.trim()) out.filas[k] = t ? { et, nota, t } : { et, nota };
      });
    }
    return out;
  }

  let MARCAS = normalizarMarcas(leerDeCuenta(K_MARCAS, null));
  let RESPALDO = leerDeCuenta(K_RESPALDO, null);
  // Con dos pestañas abiertas cada una tiene su copia en memoria. Antes de
  // cambiar algo se vuelve a leer lo guardado: si no, la última pestaña que
  // guarda borra lo que anotó la otra.
  const refrescarMarcas = () => { MARCAS = normalizarMarcas(leerDeCuenta(K_MARCAS, null)); RESPALDO = leerDeCuenta(K_RESPALDO, null); };

  const guardarMarcas = () => {
    if (!guardarEnCuenta(K_MARCAS, MARCAS)) avisar(CUENTA ? 'No se pudieron guardar las etiquetas y las anotaciones.' : SIN_CUENTA, true);
    respaldarPronto();
  };
  const marcaDe = (k) => MARCAS.filas[k] || { et: [], nota: '' };
  const etiquetaDe = (id) => MARCAS.etiquetas.find((e) => e.id === id);
  const etiquetasDe = (k) => (marcaDe(k).et || []).map(etiquetaDe).filter(Boolean);

  function fijarMarca(k, cambio) {
    refrescarMarcas();
    const ant = MARCAS.filas[k] || {};
    const m = Object.assign({ et: [], nota: '' }, ant, cambio);
    if (!m.et.length && !String(m.nota || '').trim()) delete MARCAS.filas[k];
    else {
      const cambioLaAnotacion = String(m.nota || '') !== String(ant.nota || '');
      const t = cambioLaAnotacion ? Date.now() : (ant.t || 0);
      MARCAS.filas[k] = t ? { et: m.et, nota: m.nota, t } : { et: m.et, nota: m.nota };
    }
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

  // ------------------------------------ 5.2 el archivo que sale del programa
  //
  // El archivo exportado lleva anotaciones sobre causas, que son materia de
  // secreto profesional, y termina en carpetas sincronizadas, en un pendrive o
  // adjunto en un correo. Va cifrado con una contraseña del usuario: quien
  // consiga el archivo no puede leerlo sin ella.
  //
  // La contraseña se guarda en este equipo, de modo que acá no se la pide nunca
  // más, ni al exportar ni al importar. Al abrir el archivo en otra máquina sí
  // hace falta escribirla. Guardarla en el equipo no debilita lo que importa:
  // lo que se protege es el archivo que sale, no el almacén local, que ya tiene
  // los mismos datos y está detrás de la sesión de Windows.
  //
  // AES-GCM con clave derivada por PBKDF2, todo del propio navegador. La sal es
  // distinta en cada archivo y viaja con él; sin la contraseña no sirve de nada.
  //
  // Está separado de importarMarcas a propósito: esta capa solo cifra y descifra
  // el texto del archivo, y la fusión de los datos sigue siendo la de siempre.

  // El archivo tiene formato propio y es binario: no se abre con el Bloc de
  // notas, los indexadores de escritorio y de la nube no leen su contenido, y
  // Windows no lo asocia a ningún programa. La extensión es .supjn.
  //
  //   bytes 0 a 6    la marca "SUPJN\x01", que identifica el formato
  //   byte  7        versión del formato
  //   bytes 8 a 23   sal de la contraseña, distinta en cada archivo
  //   bytes 24 a 35  vector de inicialización
  //   resto          el contenido cifrado con AES-GCM
  const MARCA = [0x53, 0x55, 0x50, 0x4a, 0x4e, 0x2b, 0x01];   // SUPJN+\x01
  const VERSION_ARCHIVO = 1;
  const VUELTAS_CLAVE = 250000;
  const EXT_ARCHIVO = '.supjn';

  const cripto = () => (ventana().crypto || window.crypto);
  const bytesDe = (s) => new TextEncoder().encode(s);

  async function claveDesde(contra, sal) {
    const base = await cripto().subtle.importKey('raw', bytesDe(contra), 'PBKDF2', false, ['deriveKey']);
    return cripto().subtle.deriveKey(
      { name: 'PBKDF2', salt: sal, iterations: VUELTAS_CLAVE, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // La contraseña del respaldo va por cuenta, como el resto de los datos. Queda
  // guardada en este equipo para no pedirla en cada exportación: lo que se
  // protege es el archivo cuando sale de acá, no el almacén local.
  const leerContra = () => { const v = leerDeCuenta(K_CONTRA, null); return (v && typeof v.c === 'string') ? v.c : ''; };
  const guardarContra = (c) => guardarEnCuenta(K_CONTRA, { c: String(c || ''), t: Date.now() });
  const hayContra = () => !!leerContra();

  const esArchivoNuestro = (bytes) => {
    if (!bytes || bytes.length < MARCA.length + 29) return false;
    for (let i = 0; i < MARCA.length; i++) if (bytes[i] !== MARCA[i]) return false;
    return true;
  };

  // Devuelve los bytes del archivo listo para guardar.
  async function protegerTexto(txt, contra) {
    const clave = String(contra || '');
    if (!clave) throw new Error('falta la contraseña del respaldo');
    const sal = cripto().getRandomValues(new Uint8Array(16));
    const iv = cripto().getRandomValues(new Uint8Array(12));
    const k = await claveDesde(clave, sal);
    const cifrado = new Uint8Array(await cripto().subtle.encrypt({ name: 'AES-GCM', iv }, k, bytesDe(txt)));
    const out = new Uint8Array(MARCA.length + 1 + sal.length + iv.length + cifrado.length);
    out.set(MARCA, 0);
    out[MARCA.length] = VERSION_ARCHIVO;
    out.set(sal, MARCA.length + 1);
    out.set(iv, MARCA.length + 1 + sal.length);
    out.set(cifrado, MARCA.length + 1 + sal.length + iv.length);
    return out;
  }

  // Recibe los bytes del archivo y devuelve el texto. Una copia anterior, que
  // era un JSON en claro, se sigue leyendo: no se pierde nada de lo exportado
  // con versiones viejas.
  async function desprotegerTexto(bytes, contra) {
    const b = (bytes instanceof Uint8Array) ? bytes : new Uint8Array(bytes);
    if (!esArchivoNuestro(b)) return new TextDecoder().decode(b);
    const clave = String(contra || '');
    if (!clave) throw new Error('ese archivo tiene contraseña y todavía no pusiste la tuya');
    const p = MARCA.length + 1;
    const k = await claveDesde(clave, b.subarray(p, p + 16));
    let claro;
    try {
      claro = await cripto().subtle.decrypt({ name: 'AES-GCM', iv: b.subarray(p + 16, p + 28) }, k, b.subarray(p + 28));
    } catch (e) {
      throw new Error('la contraseña no abre ese archivo');
    }
    return new TextDecoder().decode(claro);
  }

  const datosMarcas = () => JSON.stringify({
    formato: 'supjn+/marcas', version: 2, fecha: new Date().toISOString(), cuenta: CUENTA,
    etiquetas: MARCAS.etiquetas, filas: MARCAS.filas, notas: NOTAS
  }, null, 1);

  async function exportarMarcas() {
    refrescarMarcas();
    refrescarNotas();
    guardarArchivo(await protegerTexto(datosMarcas(), leerContra()), 'SuPJN+-datos-' + selloArchivo() + EXT_ARCHIVO, 'application/octet-stream');
    RESPALDO = { fecha: Date.now() };
    guardarEnCuenta(K_RESPALDO, RESPALDO);
  }

  // ------------------------------------------------- 5.3 carpeta de respaldo
  //
  // El navegador no deja escribir en el disco por su cuenta: la carpeta la elige
  // el usuario una vez y Chrome guarda el permiso. La carpeta conviene que esté
  // lejos de la del programa (por ejemplo en OneDrive o en el Drive), para que
  // las anotaciones no terminen en un repositorio.

  // Un archivo por cuenta: en la misma carpeta pueden convivir dos cuentas sin
  // pisarse, y el archivo de una cuenta no se importa en la otra. El nombre
  // incluye el número de cuenta, que también figura dentro del archivo y es lo
  // que se coteja al importar.
  //
  // Desde la 0.7.1 el archivo de la carpeta va cifrado, con la misma contraseña
  // y el mismo formato que la exportación (pedido del autor, 17/09/2026): la
  // carpeta suele estar sincronizada con la nube, y ahí el archivo sale del
  // equipo. En el uso diario no se pide nada, porque se usa la contraseña
  // guardada en esta PC. Sin contraseña no se escribe en la carpeta, y un
  // respaldo cifrado que esta PC no puede abrir tampoco se pisa. El JSON en
  // claro de las versiones anteriores se lee una vez y se borra cuando ya quedó
  // escrito el cifrado.
  const archivoRespaldo = () => 'SuPJN+-datos-' + CUENTA + EXT_ARCHIVO;
  const archivoRespaldoViejo = () => 'SuPJN+-datos-' + CUENTA + '.json';
  let carpetaBloqueada = false;  // hay un respaldo cifrado que esta PC no pudo abrir
  let viejoLeido = false;        // el JSON en claro ya se importó y se puede borrar
  let CARPETA = null;            // la carpeta elegida (handle del navegador)
  let carpetaEstado = 'nada';    // nada | lista | pedir | falta | contra | error
  let carpetaTexto = '';
  let carpetaAviso = '';         // por qué falló la última vez, en castellano

  const ventana = () => (typeof unsafeWindow !== 'undefined' && unsafeWindow) || window;

  // Si el almacén del navegador no contesta, no se cuelga la app: se sigue sin
  // carpeta y el respaldo se hace manualmente.
  function abrirIDB() {
    return new Promise((res, rej) => {
      let p;
      try { p = ventana().indexedDB.open('supjn', 1); } catch (e) { rej(e); return; }
      let listo = false;
      const corte = setTimeout(() => { if (!listo) { listo = true; rej(new Error('el navegador no contesta con su almacén')); } }, 8000);
      const fin = (f) => (v) => { if (listo) return; listo = true; clearTimeout(corte); f(v); };
      const bien = fin((v) => res(v));
      const mal = fin((e) => rej(e));
      p.onupgradeneeded = () => { try { p.result.createObjectStore('carpeta'); } catch (e) { /* ya estaba */ } };
      p.onsuccess = () => bien(p.result);
      p.onerror = () => mal(p.error || new Error('no se pudo abrir el almacén'));
      p.onblocked = () => mal(new Error('otra pestaña de SuPJN+ está usando el almacén'));
    });
  }

  async function guardarCarpetaEn(h) {
    const db = await abrirIDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('carpeta', 'readwrite');
      tx.objectStore('carpeta').put(h, 'respaldo');
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  async function leerCarpetaGuardada() {
    try {
      const db = await abrirIDB();
      return await new Promise((res) => {
        const tx = db.transaction('carpeta', 'readonly');
        const r = tx.objectStore('carpeta').get('respaldo');
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => res(null);
      });
    } catch (e) { return null; }
  }

  async function permisoCarpeta(h, pedir) {
    if (!h || typeof h.queryPermission !== 'function') return false;
    const o = { mode: 'readwrite' };
    try {
      if ((await h.queryPermission(o)) === 'granted') return true;
      if (!pedir) return false;
      return (await h.requestPermission(o)) === 'granted';
    } catch (e) { return false; }
  }

  const datosRespaldo = () => {
    refrescarMarcas();
    refrescarNotas();
    return JSON.stringify({
      formato: 'supjn+/marcas', version: 2, fecha: new Date().toISOString(), cuenta: CUENTA,
      etiquetas: MARCAS.etiquetas, filas: MARCAS.filas, notas: NOTAS
    }, null, 1);
  };

  // Una escritura por vez. Si se pide otra mientras una está en curso (el guardado
  // automático y el botón Guardar ahora, por ejemplo), espera a la anterior: dos
  // escrituras a la vez sobre el mismo archivo las rechaza el navegador.
  let leyoLaCarpeta = false;     // recién después de leerla se la puede pisar
  let colaRespaldo = Promise.resolve(false);
  function escribirEnCarpeta() {
    const turno = colaRespaldo.then(escribirAhora, escribirAhora);
    colaRespaldo = turno.catch(() => false);
    return turno;
  }

  async function escribirAhora() {
    if (!CARPETA) return false;
    if (!CUENTA) { carpetaAviso = 'no se pudo identificar la cuenta del PJN'; return false; }
    // Nunca se escribe antes de haber leído lo que hay en la carpeta. Si no, una
    // limpieza del navegador dejaría la copia buena pisada por una vacía.
    if (!leyoLaCarpeta) { carpetaAviso = 'todavía se está leyendo el contenido de la carpeta'; return false; }
    if (carpetaBloqueada) { carpetaEstado = 'contra'; return false; }
    const contra = leerContra();
    if (!contra) {
      carpetaEstado = 'contra';
      carpetaAviso = 'para guardar en la carpeta hace falta la contraseña de tus copias';
      return false;
    }
    if (!(await permisoCarpeta(CARPETA, false))) {
      carpetaEstado = 'pedir';
      carpetaAviso = 'Chrome pide confirmar otra vez el permiso de la carpeta.';
      return false;
    }
    let datos;
    try {
      datos = await protegerTexto(datosRespaldo(), contra);
    } catch (e) {
      carpetaEstado = 'error';
      carpetaAviso = mensajeDe(e);
      return false;
    }
    let w = null;
    try {
      const fh = await CARPETA.getFileHandle(archivoRespaldo(), { create: true });
      w = await fh.createWritable();
      await w.write(datos);
      await w.close();
      w = null;
    } catch (e) {
      // Si quedó a medias, se descarta: el navegador escribe en un archivo aparte
      // y recién al cerrar lo pone en su lugar, así que el anterior queda entero.
      if (w) { try { await w.abort(); } catch (e2) { /* ya estaba cerrado */ } }
      const n = String((e && e.name) || '');
      if (/NotFound/i.test(n)) {
        carpetaEstado = 'falta';
        carpetaAviso = 'No se encuentra la carpeta: puede haberse movido, cambiado de nombre o estar sin descargar de la nube.';
      } else if (/NotAllowed|Security/i.test(n)) {
        carpetaEstado = 'pedir';
        carpetaAviso = 'Chrome pide confirmar otra vez el permiso de la carpeta.';
      } else {
        carpetaEstado = 'error';
        carpetaAviso = mensajeDe(e);
      }
      return false;
    }
    RESPALDO = { fecha: Date.now(), auto: true };
    guardarEnCuenta(K_RESPALDO, RESPALDO);
    carpetaEstado = 'lista';
    carpetaAviso = '';
    // Con el cifrado ya escrito, la copia en claro de las versiones anteriores
    // se borra, pero solo si se la leyó y era de esta cuenta: si no, quedaría
    // algo sin traer. Si no se puede borrar, se reintenta en la próxima escritura.
    if (viejoLeido && typeof CARPETA.removeEntry === 'function') {
      try { await CARPETA.removeEntry(archivoRespaldoViejo()); viejoLeido = false; } catch (e) {
        if (/NotFound/i.test(String((e && e.name) || ''))) viejoLeido = false;
      }
    }
    return true;
  }

  // Guardado automático, sin apurar: se junta lo que haya cambiado en unos segundos.
  let tRespaldo = 0;
  let respaldoPendiente = false;
  function respaldarPronto() {
    if (!CARPETA) return;
    respaldoPendiente = true;
    clearTimeout(tRespaldo);
    tRespaldo = setTimeout(respaldarYa, 4000);
  }

  // Lo que esté esperando se guarda ya. Se llama también al irse de la pestaña,
  // para no perder lo último anotado.
  function respaldarYa() {
    clearTimeout(tRespaldo);
    if (!respaldoPendiente || !CARPETA) return;
    respaldoPendiente = false;
    escribirEnCarpeta()
      .then((ok) => { if (!ok) respaldoPendiente = true; pintarCopia(); })
      .catch(() => { respaldoPendiente = true; carpetaEstado = 'error'; carpetaAviso = 'No se pudo guardar en la carpeta.'; pintarCopia(); });
  }

  // Solo se importa lo que dice ser de esta cuenta. Un archivo sin cuenta
  // adentro es de una versión anterior: se trae manualmente con Importar.
  function importarTextoCarpeta(texto) {
    let d = null;
    try { d = JSON.parse(texto); } catch (e) { d = null; }
    if (!d || d.cuenta !== CUENTA) {
      if (d) carpetaAviso = 'el archivo de la carpeta no dice ser de esta cuenta, así que no se importó automáticamente';
      return null;
    }
    const r = importarMarcas(texto);
    return typeof r === 'string' ? null : r;
  }

  const bytesDeCarpeta = async (nombre) => {
    try {
      const fh = await CARPETA.getFileHandle(nombre);
      return new Uint8Array(await (await fh.getFile()).arrayBuffer());
    } catch (e) { return null; }   // no hay archivo
  };

  async function importarDeCarpeta() {
    if (!CARPETA || !CUENTA) return null;
    if (!(await permisoCarpeta(CARPETA, false))) return null;
    carpetaBloqueada = false;
    viejoLeido = false;
    // Primero el respaldo cifrado.
    const cifrado = await bytesDeCarpeta(archivoRespaldo());
    if (cifrado) {
      let texto;
      try {
        texto = await desprotegerTexto(cifrado, leerContra());
      } catch (e) {
        // Sin poder leerlo tampoco se escribe: se pisaría el respaldo bueno.
        carpetaBloqueada = true;
        carpetaAviso = hayContra()
          ? 'la contraseña guardada en esta PC no abre el respaldo de la carpeta'
          : 'el respaldo de la carpeta tiene contraseña y en esta PC todavía no está puesta';
        return null;
      }
      return importarTextoCarpeta(texto);
    }
    // Si no hay, el JSON en claro de las versiones anteriores.
    const viejo = await bytesDeCarpeta(archivoRespaldoViejo());
    if (!viejo) return null;
    const r = importarTextoCarpeta(new TextDecoder().decode(viejo));
    if (r) viejoLeido = true;
    return r;
  }

  // Reemplazar el respaldo de la carpeta que esta PC no puede abrir (por
  // ejemplo, después de cambiar la contraseña) con los datos de esta PC. Lo
  // que estuviera solo en ese archivo se pierde: por eso se pide confirmar.
  async function pisarCarpeta() {
    if (!CARPETA || !CUENTA || !hayContra()) return false;
    carpetaBloqueada = false;
    leyoLaCarpeta = true;
    return escribirEnCarpeta();
  }

  // Elegir la carpeta: la pide el navegador y tiene que salir de un clic.
  async function elegirCarpeta() {
    const w = ventana();
    if (typeof w.showDirectoryPicker !== 'function') throw new Error('este navegador no deja elegir una carpeta: usá Exportar e Importar manualmente');
    const h = await w.showDirectoryPicker({ id: 'supjn-respaldo', mode: 'readwrite', startIn: 'documents' });
    // Si la carpeta es un repositorio, las anotaciones podrían terminar publicados.
    let git = false;
    try {
      if (typeof h.entries === 'function') {
        for await (const par of h.entries()) { if (par[0] === '.git') { git = true; break; } }
      }
    } catch (e) { /* si no se puede mirar, se sigue igual */ }
    await guardarCarpetaEn(h);
    CARPETA = h;
    leyoLaCarpeta = false;       // a la carpeta nueva se la lee antes de escribirla
    carpetaEstado = 'lista';
    carpetaAviso = '';
    carpetaTexto = h.name || 'la carpeta elegida';
    return { git, nombre: carpetaTexto };
  }

  // Al arrancar: si ya había una carpeta elegida y el permiso sigue en pie, se lee
  // lo que haya y se guarda lo de acá.
  async function conectarCarpeta(pedir) {
    try {
      if (!CARPETA) CARPETA = await leerCarpetaGuardada();
      if (!CARPETA) { carpetaEstado = 'nada'; return false; }
      carpetaTexto = CARPETA.name || 'la carpeta elegida';
      if (!(await permisoCarpeta(CARPETA, !!pedir))) {
        carpetaEstado = 'pedir';
        carpetaAviso = 'Chrome pide confirmar otra vez el permiso de la carpeta.';
        return false;
      }
      carpetaEstado = 'lista';
      carpetaAviso = '';
      const r = await importarDeCarpeta();
      if (carpetaBloqueada) { carpetaEstado = 'contra'; return false; }
      leyoLaCarpeta = true;
      await escribirEnCarpeta();
      return r || true;
    } catch (e) {
      carpetaEstado = 'error';
      carpetaAviso = mensajeDe(e);
      return false;
    }
  }

  // Solo para el banco de pruebas: instala una carpeta simulada, para probar la
  // escritura sin pedirle nada al disco ni al usuario.
  function ponerCarpetaDePrueba(h, leida) {
    CARPETA = h;
    leyoLaCarpeta = !!leida;
    carpetaBloqueada = false;
    viejoLeido = false;
    carpetaEstado = h ? 'lista' : 'nada';
    carpetaAviso = '';
    colaRespaldo = Promise.resolve(false);
  }

  function importarMarcas(texto) {
    let d;
    try { d = JSON.parse(texto); } catch (e) { return 'El archivo no es un JSON válido.'; }
    if (!d || d.formato !== 'supjn+/marcas' || !d.filas || typeof d.filas !== 'object') return 'El archivo no es una exportación de SuPJN+.';
    // Un archivo de otra cuenta no se importa: son causas de otro y mezclarlas
    // es justamente lo que hay que evitar. Sin cuenta identificada tampoco, que
    // es lo mismo pero a ciegas.
    if (!CUENTA) return 'No se pudo identificar con qué cuenta del PJN se ingresó, así que no se importa nada: los datos de dos cuentas no deben mezclarse.';
    if (d.cuenta && d.cuenta !== CUENTA) {
      return 'Ese archivo corresponde a la cuenta ' + d.cuenta + ' y la sesión actual es la de la cuenta ' + CUENTA + '. No se importa, para no mezclar los datos de dos cuentas.';
    }
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
      // Anotaciones: si las dos partes saben cuándo se tocaron, gana el más nuevo (es
      // el caso de la carpeta compartida, que se importa sola cada vez que se abre:
      // si se pegaran, la anotación crecería solo en cada sincronización). Cuando
      // alguno viene de una copia vieja, sin fecha, se conservan los dos.
      let nota = aca.nota || '';
      let t = aca.t || 0;
      const otra = String(orig.nota || '').trim();
      const tOtra = typeof orig.t === 'number' && orig.t > 0 ? orig.t : 0;
      if (otra && otra !== nota.trim()) {
        if (t && tOtra) {
          if (tOtra > t) { nota = otra; t = tOtra; }
        } else {
          nota = nota ? nota + '\n\n' + otra : otra;
          t = Math.max(t, tOtra);
        }
      } else if (tOtra > t) { t = tOtra; }
      if (et.length || nota.trim()) { MARCAS.filas[k] = t ? { et, nota, t } : { et, nota }; filas++; }
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
      guardarEnCuenta(K_NOTAS, NOTAS);
    }
    return { filas, etiquetas: MARCAS.etiquetas.length, notas };
  }

  // -------------------------------------------------------- 5.4 datos leídos

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
  const DATOS = { rel: validarDatos(leerDeCuenta(K_REL, null)), fav: validarDatos(leerDeCuenta(K_FAV, null)) };
  // Por si al arrancar todavía no estaba el encabezado: se vuelve a mirar la
  // cuenta y, si apareció o cambió, se relee todo lo de esa cuenta. Nunca se
  // muestra lo de una cuenta en la sesión de otra.
  function revisarCuenta() {
    const antes = CUENTA;
    resolverCuenta();
    if (CUENTA === antes) return false;
    migrarACuenta();
    DATOS.rel = validarDatos(leerDeCuenta(K_REL, null));
    DATOS.fav = validarDatos(leerDeCuenta(K_FAV, null));
    indexar('rel');
    indexar('fav');
    refrescarMarcas();
    refrescarNotas();
    refrescarHoras();
    refrescarVisto();
    refrescarFallas();
    return true;
  }

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
  let NOTAS = normalizarNotas(leerDeCuenta(K_NOTAS, {}));
  const refrescarNotas = () => { NOTAS = normalizarNotas(leerDeCuenta(K_NOTAS, {})); };

  // Hora del último documento firmado, por causa:
  // { exp: { f: 'dd/mm/aaaa', hh: 'HH:MM', t, origen } }
  function normalizarHoras(h) {
    const out = {};
    if (!esObjeto(h)) return out;
    Object.keys(h).forEach((k) => {
      const v = h[k];
      if (!esObjeto(v)) return;
      const pedida = typeof v.pedida === 'string' ? v.pedida : '';
      const hayHora = /^\d{2}\/\d{2}\/\d{4}$/.test(v.f || '') && /^\d{2}:\d{2}$/.test(v.hh || '');
      // Sin hora pero con "pedida" es una causa que ya se probó y no dio: queda
      // anotada para no volver a descargarle el documento en cada vuelta.
      if (!hayHora && !pedida) return;
      out[k] = { f: hayHora ? v.f : '', hh: hayHora ? v.hh : '', t: typeof v.t === 'number' ? v.t : 0,
        origen: typeof v.origen === 'string' ? v.origen : '', pedida };
    });
    return out;
  }
  let HORAS = normalizarHoras(leerDeCuenta(K_HORAS, {}));
  const refrescarHoras = () => { HORAS = normalizarHoras(leerDeCuenta(K_HORAS, {})); };
  function guardarHora(k, dato) {
    refrescarHoras();
    HORAS[k] = dato;
    guardarEnCuenta(K_HORAS, HORAS);
  }

  // ---------------------------------- 5.5 registro de fallas: cómo se anotan
  //
  // Cuando una descarga no se completa, el motivo se pierde apenas cambia el
  // texto del trabajo en pantalla. El registro conserva las circunstancias de
  // cada falla para poder diagnosticarla después: qué expediente y qué
  // actuación, a qué dirección se pidió el documento, qué respondió el
  // servidor (código de estado, tipo de contenido, tamaño) y cuántos intentos
  // hicieron falta. Se guarda por cuenta y con tope, porque su utilidad es el
  // diagnóstico reciente, no el archivo histórico.

  const TOPE_FALLAS = 200;

  function normalizarFallas(f) {
    if (!Array.isArray(f)) return [];
    const out = [];
    f.forEach((v) => {
      if (!esObjeto(v) || typeof v.t !== 'number') return;
      const txt = (x) => (typeof x === 'string' ? x.slice(0, 300) : '');
      const num = (x) => (typeof x === 'number' && isFinite(x) ? x : 0);
      out.push({
        t: v.t,
        exp: txt(v.exp),
        act: txt(v.act),
        url: txt(v.url),
        etapa: txt(v.etapa) || 'descarga',
        http: num(v.http),
        tipo: txt(v.tipo),
        bytes: num(v.bytes),
        intentos: num(v.intentos),
        motivo: txt(v.motivo)
      });
    });
    return out.slice(0, TOPE_FALLAS);
  }
  let FALLAS = normalizarFallas(leerDeCuenta(K_FALLAS, []));
  const refrescarFallas = () => { FALLAS = normalizarFallas(leerDeCuenta(K_FALLAS, [])); };

  // Las más recientes primero: al diagnosticar interesa lo último que pasó.
  function anotarFalla(d) {
    if (!CUENTA) return null;
    refrescarFallas();
    const f = normalizarFallas([Object.assign({ t: Date.now() }, d || {})])[0];
    if (!f) return null;
    FALLAS.unshift(f);
    if (FALLAS.length > TOPE_FALLAS) FALLAS.length = TOPE_FALLAS;
    guardarEnCuenta(K_FALLAS, FALLAS);
    return f;
  }

  function borrarFallas() {
    FALLAS = [];
    guardarEnCuenta(K_FALLAS, FALLAS);
  }

  // La dirección de una actuación lleva el identificador de la consulta y, en
  // algunos fueros, el número de expediente. Para compartir el registro se
  // recortan los parámetros y queda solo la ruta.
  function urlCorta(u) {
    const s = String(u || '');
    if (!s) return '';
    try { const x = new URL(s, location.href); return x.pathname + (x.search ? '?...' : ''); } catch (e) { return s.split('?')[0]; }
  }

  // Texto del registro, listo para pegar en un correo. Sin número de causa ni
  // dirección completa cuando se pide la versión compartible.
  function textoFallas(reservado) {
    if (!FALLAS.length) return 'No hay fallas registradas.';
    const cab = 'SuPJN+ ' + APP.version + ' - registro de fallas de descarga (' +
      plural(FALLAS.length, 'entrada', 'entradas') + ')';
    const filas = FALLAS.map((f) => {
      const partes = [fechaHora(f.t)];
      partes.push(reservado ? 'causa reservada' : (f.exp || 'sin expediente'));
      if (f.act) partes.push(reservado ? 'actuación reservada' : f.act);
      partes.push('etapa: ' + f.etapa);
      if (f.http) partes.push('estado HTTP ' + f.http);
      if (f.tipo) partes.push('tipo ' + f.tipo);
      if (f.bytes) partes.push(f.bytes + ' bytes');
      if (f.intentos) partes.push(plural(f.intentos, 'intento', 'intentos'));
      if (f.url) partes.push(reservado ? urlCorta(f.url) : f.url);
      if (f.motivo) partes.push('motivo: ' + f.motivo);
      return '- ' + partes.join(' | ');
    });
    return cab + '\n\n' + filas.join('\n');
  }

  // ----------------------------------------------------------- 5.6 novedades
  //
  // El PJN no avisa nada. SuPJN+ guarda cómo estaba cada causa la última vez que
  // la miraste y marca las que se movieron desde entonces. Una causa deja de ser
  // novedad cuando la abrís, o con "Marcar todo como visto".

  function normalizarVisto(v) {
    const out = {};
    if (!esObjeto(v)) return out;
    Object.keys(v).forEach((k) => {
      const x = v[k];
      if (!esObjeto(x) || typeof x.ult !== 'string') return;
      out[k] = { ult: x.ult, sit: typeof x.sit === 'string' ? x.sit : '', t: typeof x.t === 'number' ? x.t : 0 };
    });
    return out;
  }
  let VISTO = normalizarVisto(leerDeCuenta(K_VISTO, {}));
  // Se pregunta una vez por fila al dibujar la tabla: contar las claves cada vez
  // se nota con muchas causas guardadas.
  let HAY_FOTO = Object.keys(VISTO).length > 0;
  const refrescarVisto = () => { VISTO = normalizarVisto(leerDeCuenta(K_VISTO, {})); HAY_FOTO = Object.keys(VISTO).length > 0; };
  const hayFoto = () => HAY_FOTO;

  function marcarVisto(claves) {
    refrescarVisto();
    const ahora = Date.now();
    (Array.isArray(claves) ? claves : [claves]).forEach((k) => {
      const c = causaPorClave(k);
      if (!c) return;
      VISTO[c.exp] = { ult: c.ult, sit: c.sit, t: ahora };
    });
    HAY_FOTO = Object.keys(VISTO).length > 0;
    guardarVisto();
  }

  // La foto completa: todo lo leído pasa a estar visto.
  function fotoVisto() {
    refrescarVisto();
    const ahora = Date.now();
    ['rel', 'fav'].forEach((t) => {
      if (!DATOS[t]) return;
      DATOS[t].causas.forEach((c) => { VISTO[c.exp] = { ult: c.ult, sit: c.sit, t: ahora }; });
    });
    HAY_FOTO = Object.keys(VISTO).length > 0;
    guardarVisto();
  }

  // Al guardar se sacan las causas que ya no están en ninguna de las dos listas
  // (archivadas, sacadas de Favoritos): si no, el almacén crece para siempre y,
  // cuando se llena, las novedades dejan de limpiarse sin decir nada.
  function guardarVisto() {
    // Se poda lo que ya no está en ninguna de las dos listas y además hace más de
    // medio año que no se toca. Las dos condiciones juntas: por ausencia sola, una
    // lectura recortada del PJN borraría la línea de partida; por antigüedad sola,
    // una causa dormida volvería a aparecer como novedad sin haberse movido.
    if (DATOS.rel && DATOS.fav) {
      const vivas = {};
      ['rel', 'fav'].forEach((t) => DATOS[t].causas.forEach((c) => { vivas[c.exp] = true; }));
      const limite = Date.now() - 180 * 24 * 60 * 60 * 1000;
      Object.keys(VISTO).forEach((k) => { const v = VISTO[k]; if (!vivas[k] && v && v.t && v.t < limite) delete VISTO[k]; });
      HAY_FOTO = Object.keys(VISTO).length > 0;
    }
    if (!guardarEnCuenta(K_VISTO, VISTO)) avisar(CUENTA ? 'No se pudieron guardar las novedades: el almacén del navegador está lleno.' : SIN_CUENTA, true);
  }

  // Sin foto previa no hay novedades: la primera lectura es la línea de partida.
  // Si la causa se dio por vista después de leída la lista, no es novedad aunque
  // lo guardado no coincida: pasa con una causa que está en Mis causas y en
  // Favoritos y las dos listas se leyeron en momentos distintos. Sin esto,
  // "Marcar todo como visto" decía "listo" y el indicador quedaba igual.
  function esNovedad(c, fechaLista) {
    if (!hayFoto()) return false;
    const v = VISTO[c.exp];
    if (!v) return true;                       // causa nueva en la lista
    const f = fechaLista || (datosVista() || {}).fecha || 0;
    if (v.t && f && v.t >= f) return false;
    return v.ult !== c.ult || v.sit !== c.sit;
  }

  // Se cuenta sobre lo que se está viendo (con la búsqueda y los filtros puestos),
  // para que el número del botón sea el de las filas que van a aparecer.
  const contarNovedades = () => {
    const D = datosVista();
    if (!D) return 0;
    if (!CFG.texto && !CFG.fuero && !CFG.sit && !CFG.etiqueta && !CFG.desde && !CFG.hasta && CFG.tramite === 'todas') {
      return D.causas.filter((c) => esNovedad(c, D.fecha)).length;
    }
    const antes = CFG.novedades;
    CFG.novedades = false;
    try { return filtradas().filter((c) => esNovedad(c, D.fecha)).length; } finally { CFG.novedades = antes; }
  };

  // Las partes de una causa. En la lista salen de la carátula, que es lo único
  // que manda el PJN; adentro del expediente salen de la solapa Intervinientes.
  const partesDe = (c) => partesDeCaratula(c.exp, c.car);

  const causaEn = (tipo, k) => INDICE[tipo].get(k) || null;
  const causaPorClave = (k) => causaEn(VISTA === 'fav' ? 'fav' : 'rel', k) || causaEn('rel', k) || causaEn('fav', k);

  // ------------------------------------------------------- 5.7 configuración

  // w es el ancho de manera predeterminada y m el mínimo al que se la puede achicar: el
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
    { k: 'anot', t: 'Anotaciones', w: 108, m: 56 }
  ];
  const COL = {};
  COLS_DEF.forEach((c) => { COL[c.k] = c; });

  // Las actuaciones del expediente van en columnas de verdad, con el mismo
  // manejo que la tabla de causas: se ordenan, se mueven y se ensanchan.
  const COLS_ACT_DEF = [
    { k: 'fecha', t: 'Fecha', w: 92, m: 88 },
    // "Tipo" y no "Tipo de actuación": es el nombre que le da el propio PJN en
    // su tabla, y el rótulo largo obligaba a una columna ancha para no quedar
    // cortado, a costa de la descripción, que es lo que conviene leer entero.
    { k: 'tipo', t: 'Tipo', w: 118, m: 94, ayuda: 'Tipo de actuación, tal como lo informa el PJN.' },
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
    orden: { col: 'ult', desc: true }, porPagina: 25, maxi: false, novedades: false,
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
  // La columna vacía es Orden PJN y vale: sin esto, al recargar la página el
  // orden elegido se perdía y volvía al cronológico.
  if (!CFG.orden || (CFG.orden.col !== '' && !COL[CFG.orden.col])) CFG.orden = { col: 'ult', desc: true };
  if (!Array.isArray(CFG.ocultas)) CFG.ocultas = [];
  // Las columnas que trae una versión nueva nacen apagadas: se prenden en
  // Columnas, y a nadie se le reacomoda la tabla sola al actualizar.
  COLS_DEF.forEach((c) => {
    const nueva = Array.isArray(CFG_GUARDADA.cols) ? CFG_GUARDADA.cols.indexOf(c.k) < 0 : !!c.oculta;
    if (nueva && c.oculta !== false && CFG.ocultas.indexOf(c.k) < 0) CFG.ocultas.push(c.k);
  });
  // Una sola vez: Etiquetas queda pegada a Expediente y Partes al lado de
  // Carátula. Después, cada columna queda donde el usuario la deje.
  let migroAlgo = false;
  if (!(CFG.mig >= 1)) {
    if (Array.isArray(CFG.cols)) {
      CFG.cols = CFG.cols.filter((k) => k !== 'et' && k !== 'partes');
      CFG.cols.splice(Math.max(0, CFG.cols.indexOf('exp')) + 1, 0, 'et');
      const iCar = CFG.cols.indexOf('car');
      CFG.cols.splice(iCar >= 0 ? iCar + 1 : CFG.cols.length, 0, 'partes');
      CFG.ocultas = CFG.ocultas.filter((k) => k !== 'partes');
    }
    CFG.mig = 1;
    migroAlgo = true;
  }
  // Una sola vez: el orden de la app vuelve a ser el del PJN, por última
  // actuación y de la más nueva a la más vieja.
  if (!(CFG.mig >= 2)) {
    CFG.orden = { col: 'ult', desc: true };
    CFG.mig = 2;
    migroAlgo = true;
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
  // Lo que se escribe en el buscador no se guarda: puede ser el nombre de un
  // cliente y la configuración es común a todas las cuentas.
  CFG.texto = '';
  if (['todas', 'si', 'no'].indexOf(CFG.tramite) < 0) CFG.tramite = 'todas';
  if (!esObjeto(CFG.anchos)) CFG.anchos = {};
  CFG.encuadrar = CFG.encuadrar !== false;
  CFG.novedades = CFG.novedades === true;
  CFG.maxi = CFG.maxi === true;
  if (!Array.isArray(CFG.ocultasAct)) CFG.ocultasAct = [];
  if (!CFG.anchosAct || typeof CFG.anchosAct !== 'object') CFG.anchosAct = {};
  // Las migraciones se guardan ya, con todo lo demás ya revisado. Si no, vuelven
  // a correr en cada carga y le pisan al usuario el orden que haya elegido.
  if (migroAlgo) guardarAlmacen(K_CFG, CFG);
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

  // -------------------------------------------------- 5.8 estado de la vista

  let VISTA = 'rel';            // rel | fav | exp | escr | notif | deox | guia | nota | desc | marcas | acerca
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

  // ----- dónde estaba
  //
  // La página del PJN se recarga entera cada vez que se abre una causa, se deja
  // una nota o se pulsa Recargar, y con ella arranca SuPJN+ de cero. Para no
  // perder el hilo se anota la solapa, la página, la causa desplegada y hasta
  // dónde estaba corrida la pantalla, y al volver se retoma ese punto. Se anota
  // en el almacén de sesión, que es de esta pestaña y se borra al cerrarla.
  const S_LUGAR = 'supjn_lugar';
  const VIDA_LUGAR = 60 * 60 * 1000;      // pasada una hora se arranca arriba de todo

  // Lo que se corre en cada vista: la tabla en las listas, el panel en el resto.
  const desplazable = () => (esVistaLista() ? q('[data-e="cuerpo"]') : q('[data-e="vPanel"]'));

  // Se guarda un lugar por vista, porque el camino de ida y vuelta pasa por
  // las dos: se sale de la lista hacia una causa y se vuelve de la causa a la
  // lista, y cada una tiene que retomar el suyo.
  const LUGARES = (() => {
    const l = leerSesion(S_LUGAR);
    const vacio = { ultima: '', sitios: {} };
    if (!l || typeof l !== 'object' || Date.now() - (Number(l.ts) || 0) > VIDA_LUGAR) return vacio;
    if (!l.sitios || typeof l.sitios !== 'object') return vacio;
    const sitios = {};
    Object.keys(l.sitios).forEach((v) => {
      const s = l.sitios[v];
      if (!s || typeof s !== 'object') return;
      sitios[v] = {
        pagina: (s.pagina && typeof s.pagina === 'object') ? s.pagina : {},
        abierta: typeof s.abierta === 'string' ? s.abierta : null,
        arriba: Number(s.arriba) > 0 ? Number(s.arriba) : 0
      };
    });
    return { ultima: typeof l.ultima === 'string' ? l.ultima : '', sitios };
  })();

  function guardarLugar() {
    if (!win) return;
    const el = desplazable();
    LUGARES.ultima = VISTA;
    LUGARES.sitios[VISTA] = {
      pagina: { rel: PAGINA_VISTA.rel, fav: PAGINA_VISTA.fav },
      abierta: abierta || null,
      arriba: el ? Math.round(el.scrollTop) : 0
    };
    guardarSesion(S_LUGAR, { ultima: LUGARES.ultima, sitios: LUGARES.sitios, ts: Date.now() });
  }

  // Se llama al terminar de dibujar una vista: si hay un lugar guardado de esa
  // vista, se vuelve a ese punto. Vale una sola vez, la primera que se dibuja:
  // después manda lo que pase en pantalla.
  function retomarLugar(vista, el) {
    // Minimizada no hay pantalla que correr: lo guardado espera a que se abra.
    if (!win || win.style.display === 'none') return false;
    const s = LUGARES.sitios[vista];
    if (!s || !el) return false;
    delete LUGARES.sitios[vista];
    if (!(s.arriba > 0)) return false;   // sin nada que retomar, manda lo que había en pantalla
    el.scrollTop = s.arriba;
    return true;
  }

  // Nombres de los fueros, tomados del desplegable de Cámara del propio PJN.
  const NOMBRES_FUERO = {};
  document.querySelectorAll('select option').forEach((o) => {
    const m = /^([A-Z]{2,4})\s*-\s*(.+)$/.exec(limpio(o.textContent));
    if (m) NOMBRES_FUERO[m[1]] = m[2];
  });

  // Los días en los que se sabe la hora de todas las causas que empatan. Se
  // recalcula antes de cada orden, sobre las causas que se están mirando.
  let FECHAS_CON_HORA = {};
  function marcarFechasConHora(lista) {
    const cuenta = {};
    lista.forEach((c) => {
      const f = c.ult;
      if (!numFecha(f)) return;
      if (!cuenta[f]) cuenta[f] = { total: 0, conHora: 0 };
      cuenta[f].total++;
      const h = HORAS[c.exp];
      if (h && h.f === f) cuenta[f].conHora++;
    });
    FECHAS_CON_HORA = {};
    Object.keys(cuenta).forEach((f) => { if (cuenta[f].conHora === cuenta[f].total) FECHAS_CON_HORA[f] = true; });
  }

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
      // La hora manda solo si se la sabe de TODAS las causas de ese día. Con
      // algunas sabidas y otras no, las sabidas saltarían en bloque arriba de las
      // demás y el orden saldría peor que el del PJN: en ese caso se deja el del PJN.
      const h = FECHAS_CON_HORA[c.ult] ? HORAS[c.exp] : null;
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
      if (CFG.novedades && !esNovedad(c)) return false;
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
    marcarFechasConHora(D.causas);
    L.sort((a, b) => {
      const x = valorOrden(a, col), y = valorOrden(b, col);
      return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
    });
    return L;
  }

  // ------------------------------------------------------------- 6.1 estilos

  const CSS = [
    '#supjn-pastilla{position:fixed;right:16px;bottom:16px;z-index:2147483000;background:' + AZUL + ';color:#fff;padding:7px 13px;border-radius:16px;cursor:pointer;font:600 13px "Segoe UI",Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);user-select:none;border:0}',
    '#supjn-pastilla:hover{background:#1c5591}',
    '#supjn-pastilla .cant{background:rgba(255,255,255,.22);border-radius:9px;padding:0 7px;margin-left:7px;font-weight:600}',
    // Arranca minimizada: un error tiene que verse en el indicador.
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
    '.sj-tit b{letter-spacing:.03em;font-size:14px;flex:none}',
    '.sj-tit .v{opacity:.7;font-size:11px;flex:0 1 auto;min-width:0;overflow:hidden;white-space:nowrap}',
    '.sj-tit .fn{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);color:#fff;border-radius:5px;height:26px;padding:0 10px;cursor:pointer;font:600 12px "Segoe UI",Arial,sans-serif;flex:0 1 auto;min-width:0;overflow:hidden;white-space:nowrap}',
    '.sj-tit .cta{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:5px;height:26px;display:inline-flex;align-items:center;padding:0 8px;font:600 11px "Segoe UI",Arial,sans-serif;letter-spacing:.3px;white-space:nowrap;flex:0 1 auto;min-width:0;max-width:230px;overflow:hidden;text-overflow:ellipsis;gap:5px}',
    '.sj-tit .cta::before{content:"\\1F464";font-size:12px;opacity:.9}',
    '.sj-tit .cta.sin{background:#8c1d18;border-color:#a83a33}',
    '.sj-tit .fn:hover{background:rgba(255,255,255,.26)}',
    '.sj-tit .fn.peligro{background:#b3261e;border-color:#b3261e}',
    '.sj-tit .zm{flex:none;margin-left:auto;display:flex;align-items:center;gap:1px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);border-radius:5px;padding:1px}',
    '.sj-tit .zm button{background:transparent;border:0;color:#fff;height:22px;min-width:24px;padding:0 4px;border-radius:4px;cursor:pointer;font:600 13px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .zm button:hover{background:rgba(255,255,255,.22)}',
    '.sj-tit .zm button.pc{font-size:11px;min-width:44px;opacity:.85}',
    '.sj-tit .zm button.pc.act{opacity:1;background:rgba(255,255,255,.22)}',
    '.sj-tit .ctrl{flex:none;margin-left:8px;display:flex;gap:2px}',
    '.sj-tit .ctrl button{background:transparent;border:0;color:#fff;width:30px;height:26px;border-radius:4px;cursor:pointer;font:400 15px/1 "Segoe UI",Arial,sans-serif}',
    '.sj-tit .ctrl button:hover{background:rgba(255,255,255,.18)}',
    '.sj-tit .ctrl button.x:hover{background:#c93b3b}',
    // Si la ventana es angosta, las solapas pasan a una segunda línea en vez de esconderse.
    '.sj-solapas{display:flex;flex-wrap:wrap;gap:2px;padding:0 10px;background:#e9f0f6;border-bottom:1px solid #c9d7e3;flex:none}',
    '.sj-solapas button{background:transparent;border:0;border-bottom:3px solid transparent;color:#4a6272;padding:8px 12px 6px;cursor:pointer;font:600 12.5px "Segoe UI",Arial,sans-serif;white-space:nowrap}',
    '.sj-solapas button:hover{color:' + AZUL + '}',
    '.sj-solapas button.act{color:' + AZUL + ';border-bottom-color:' + AZUL + ';background:#fff}',
    '.sj-solapas .cant{background:#d4e1ec;color:' + AZUL + ';border-radius:9px;padding:0 6px;margin-left:5px;font-size:11px}',
    // La cruz de la solapa del expediente: se ve siempre, y se resalta al pasar por encima.
    '.sj-solapas .cerrar{margin-left:7px;padding:0 3px;border-radius:3px;font-size:13px;line-height:1;opacity:.55}',
    '.sj-solapas .cerrar:hover{opacity:1;background:#c93b3b;color:#fff}',
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
    // Barras de siempre, visibles y anchas. Advertencia: no se puede usar
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
    // En la tabla el número puede partirse después de cada barra: nunca queda tapado.
    'table.sj-t td .sj-exp{white-space:normal}',
    '.sj-fav{color:#d39e00;margin-left:4px}',
    '.sj-badge{display:inline-block;margin-top:3px;font-size:10.5px;font-weight:600;color:#6b7c85;background:#eef2f4;border-radius:8px;padding:0 7px}',
    '.sj-elegir td.acc{text-align:right;white-space:nowrap}',
    // Descargar es un botón y Ver un enlace, porque abre una pestaña nueva. Se
    // los dibuja igual para que la columna no quede despareja: el enlace toma
    // la misma caja, el mismo color y la misma alineación que el botón.
    '.sj-elegir td.acc .sj-b{padding:1px 8px;height:26px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:' + AZUL + ';vertical-align:middle}',
    '.sj-elegir td.acc .sj-b + .sj-b{margin-left:6px}',
    '.sj-elegir td.acc a.sj-b:hover{background:#dbe8f5;text-decoration:none}',
    '.sj-rol{color:#6b7c85;font-size:11px;text-transform:uppercase;letter-spacing:.02em}',
    '.sj-sep{color:#b9c6cc;margin:0 5px}',
    '.sj-exp-cab .c .p{margin-top:2px;font-size:12.5px;color:#24414f}',
    '.sj-nuevo{background:#1b6b3a;color:#fff;border-radius:8px;padding:0 6px;font-size:10.5px;font-weight:700;margin-right:6px;vertical-align:1px}',
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
    '.sj-contra{flex:1 1 260px;min-width:200px;height:30px;border:1px solid #b9c9d0;border-radius:5px;padding:0 8px;font:13px Consolas,monospace}',
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
    // Número y carátula de las listas de Dejar nota: son botones, porque la
    // dirección del expediente se le pide al PJN en el momento, pero se dibujan
    // como enlace. Toman la letra de la celda (el número sigue en Consolas) y
    // llevan el prefijo #supjn para ganarle al estilo general de los botones.
    '#supjn .sj-ir{display:inline;border:0;border-radius:2px;background:transparent;box-shadow:none;padding:0;margin:0;min-width:0;height:auto;font:inherit;line-height:inherit;text-align:left;white-space:inherit;color:' + AZUL + ';cursor:pointer;text-decoration:none}',
    '#supjn .sj-ir:hover{text-decoration:underline;background:transparent}',
    '#supjn .sj-ir:focus-visible{outline:2px solid ' + AZUL_CLARO + ';outline-offset:2px}',
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
    // El tipo de actuación va en dos palabras cortas ("CEDULA ELECTRONICA"):
    // puede pasar al renglón siguiente, pero no partirse por la mitad, que es
    // lo que haría el overflow-wrap de la tabla.
    '.sj-elegir table.sj-t td.t{color:' + AZUL + ';font-weight:600;font-size:11.5px;white-space:normal;overflow-wrap:break-word}',
    '.sj-elegir .pie{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;border-top:1px solid #e6ecef;background:#f5f8fa}',
    '.sj-redim{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;z-index:40;background:linear-gradient(135deg,transparent 50%,#9fb3c4 50%,#9fb3c4 60%,transparent 60%,transparent 70%,#9fb3c4 70%,#9fb3c4 80%,transparent 80%)}',
    '#supjn.maxi .sj-redim{display:none}',
    '#supjn a{color:#0a6cab}',
    // Escritos, Notificaciones, DEOX y Guía.
    '.sj-bandeja{display:flex;flex-direction:column;height:100%;min-height:0}',
    '.sj-barra a.sj-b,.sj-guia a.sj-b{display:inline-flex;align-items:center;text-decoration:none;color:' + AZUL + '}',
    '.sj-barra a.sj-b:hover,.sj-guia a.sj-b:hover{background:#dbe8f5;text-decoration:none}',
    '.sj-causa{display:inline-flex;align-items:center;gap:6px;background:#fff4d6;color:#5c4400;border:1px solid #f0dca0;border-radius:15px;padding:0 4px 0 11px;font:600 12px "Segoe UI",Arial,sans-serif;white-space:nowrap}',
    '.sj-causa button{border:0;background:transparent;color:#5c4400;cursor:pointer;font:700 15px/1 "Segoe UI",Arial,sans-serif;padding:2px 6px;border-radius:10px}',
    '.sj-causa button:hover{background:#f0dca0}',
    'table.sj-tb{width:100%}',
    'table.sj-tb th{position:sticky;cursor:pointer}',
    'table.sj-tb th:hover{background:#1c5591}',
    'table.sj-tb th.fija{cursor:default}',
    'table.sj-tb td.acc{white-space:nowrap}',
    '.sj-car{margin-top:2px;color:#3a4c54;font-size:12px}',
    '.sj-sub{margin-top:2px;color:#6b7c85;font-size:11.5px}',
    '.sj-vinculo{background:none;border:0;padding:0;color:#0a6cab;cursor:pointer;text-align:left;font:inherit}',
    '.sj-vinculo:hover{text-decoration:underline}',
    'a.sj-mas{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}',
    'a.sj-mas:hover{text-decoration:none}',
    '.sj-urg{background:#b3261e;color:#fff;border-radius:8px;padding:0 6px;font-size:10.5px;font-weight:700;margin-left:6px}',
    '.sj-info{padding:7px 16px;font-size:12px;color:#123f6b;background:#e8f1fb;border-bottom:1px solid #c7dbef}',
    '.sj-guia h3{margin:0 0 6px;font-size:16px;color:' + AZUL + '}',
    '.sj-guia p{margin:2px 0}',
    '.sj-guia .bts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
    '.sj-guia-nav{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
    '.sj-guia-nav:empty{display:none}',
    '.sj-guia table.sj-t{width:100%;table-layout:auto}',
    '.sj-guia table.sj-t tr.res td{background:#fff8dc}'
  ].join('\n');

  // ------------------------------------------------------------- 6.2 ventana

  let win = null;
  let pastilla = null;
  let mostrarContra = false;   // el campo de la contraseña, a la vista o no
  // La solapa del expediente abierto se puede cerrar con su cruz. Dura lo que
  // dura esta carga de la página: al abrir otra causa vuelve a aparecer.
  let expCerrado = false;
  let alertaPastilla = '';       // error ocurrido con la ventana minimizada
  let menuAbierto = null;
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
    // indicador, que queda rojo hasta que se abre la ventana.
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

  // ------------------------------------------------------------- 6.3 solapas

  function pintarSolapas() {
    const e = q('[data-e="solapas"]');
    if (!e) return;
    const s = [['rel', 'Mis causas', DATOS.rel ? DATOS.rel.total : null], ['fav', 'Favoritos', DATOS.fav ? DATOS.fav.total : null]];
    if (EN_EXPEDIENTE && !expCerrado) s.push(['exp', 'Este expediente', null, '', true]);
    // Las otras aplicaciones del PJN: el número es lo consultado, si ya se consultó.
    const cantBandeja = (v) => (BAND[v].estado === 'listo' ? BAND[v].filas.length : BAND[v].estado === 'leyendo' ? '...' : null);
    s.push(['escr', 'Escritos', cantBandeja('escr'), 'Escritos presentados, del sistema de Escritos del PJN']);
    s.push(['notif', 'Notificaciones', cantBandeja('notif'), 'Notificaciones electrónicas']);
    s.push(['deox', 'DEOX', cantBandeja('deox'), 'Oficios electrónicos (DEOX)']);
    s.push(['guia', 'Guía', null, 'Guía judicial del PJN: dependencias, domicilios, teléfonos e integrantes']);
    const c = leerCorrida();
    s.push(['nota', 'Dejar nota', (c && c.activa) ? progresoNota(c) : (SEL[listaActual()].size || null)]);
    const activos = COLA.filter((t) => /en cola|abriendo|leyendo|descargando|a descargar|eligiendo/.test(t.estado)).length;
    s.push(['desc', 'Descargas', COLA.length ? (activos || COLA.length) : null]);
    s.push(['marcas', 'Respaldo', null, 'Respaldo, etiquetas y anotaciones']);
    s.push(['acerca', 'Acerca de', null]);
    e.innerHTML = s.map(([k, t, n, tit, cerrable]) => '<button data-vista="' + k + '" class="' + (VISTA === k ? 'act' : '') + '"' +
      (tit ? ' title="' + esc(tit) + '"' : '') + '>' + esc(t) +
      (n == null ? '' : '<span class="cant">' + n + '</span>') +
      (cerrable ? '<span class="cerrar" data-cerrar="' + k + '" title="Cerrar esta solapa">\u00d7</span>' : '') + '</button>').join('');
  }

  function pintarPastilla() {
    if (!pastilla) return;
    let extra = '';
    const c = leerCorrida();
    if (c && c.activa) extra = 'nota ' + progresoNota(c);
    else if (bajandoAlgo()) extra = 'descargando';
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
        '<button class="sj-b peligro chico" data-a="cortarNota">Cancelar</button>';
    }
    pintarAccion();
    pintarPastilla();
  }

  // --------------------------------------------------------- 6.4 vista lista

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
    const et = opciones(q('[data-f="etiqueta"]'), [['', 'Todas las etiquetas'], ['@sin', 'Sin etiqueta'], ['@anot', 'Con anotaciones'], ['@nota', 'Con resultado de dejar nota']]
      .concat(MARCAS.etiquetas.map((e) => [e.id, e.nom])), CFG.etiqueta);
    // Solo se corrige lo guardado si hay datos: sin lista leída no se sabe qué opciones existen.
    if (D) { CFG.fuero = fuero; CFG.sit = sit; }
    CFG.etiqueta = et;
    q('[data-f="tramite"]').value = CFG.tramite;
    q('[data-f="texto"]').value = CFG.texto;
    q('[data-f="desde"]').value = CFG.desde;
    q('[data-f="hasta"]').value = CFG.hasta;
    pintarOrdenPJN();
    pintarNovedades();
  }

  // El PJN no avisa cuando algo cambia: lo que se ve es la última lectura. Por eso
  // la antigüedad va a la vista, y en rojo cuando ya pasó el rato.
  // El botón de novedades lleva la cuenta y se enciende cuando está puesto el filtro.
  function pintarNovedades() {
    const b = q('[data-e="novedades"]');
    if (!b) return;
    const n = contarNovedades();
    b.textContent = n ? 'Novedades (' + n + ')' : 'Novedades';
    b.classList.toggle('act', CFG.novedades);
    b.disabled = !n && !CFG.novedades;
    const m = q('[data-a="vistoTodo"]');
    if (m) m.style.display = n ? '' : 'none';
  }

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
    if (CARPETA && carpetaEstado === 'contra') {
      e.className = 'sj-copia vieja';
      e.textContent = 'La carpeta de respaldo espera la contraseña';
    } else if (!RESPALDO || !RESPALDO.fecha) {
      e.className = 'sj-copia ' + (hayMarcas ? 'nunca' : 'ok');
      e.textContent = hayMarcas ? 'Sin copia de etiquetas y anotaciones' : 'Todavía no hay etiquetas ni anotaciones';
    } else {
      const d = diasDesde(RESPALDO.fecha);
      e.className = 'sj-copia ' + (d > DIAS_AVISO_COPIA ? 'vieja' : 'ok');
      e.textContent = 'Última copia: ' + soloFecha(RESPALDO.fecha) + ' (' + (d === 0 ? 'hoy' : d === 1 ? 'hace 1 día' : 'hace ' + d + ' días') + ')';
    }
    e.title = 'Abre la solapa Respaldo';
  }

  // La placa de la barra azul: con qué cuenta del PJN se está trabajando.
  function pintarPlacaCuenta() {
    const e = q('[data-e="cuenta"]');
    if (!e) return;
    e.textContent = CUENTA ? (CUENTA_TXT || CUENTA) : 'sin cuenta';
    e.classList.toggle('sin', !CUENTA);
    e.title = CUENTA
      ? 'Estás viendo los datos de la cuenta ' + CUENTA + ' del PJN. Las causas, etiquetas y anotaciones de cada cuenta se guardan por separado: con otra cuenta no se ve nada de esta.'
      : 'No se pudo identificar la cuenta del PJN: no se guarda nada ni se muestra lo guardado, para no mezclar los datos de dos cuentas.';
  }

  function pintarBotonesLectura() {
    const a = q('[data-a="actualizar"]'), c = q('[data-a="cortarLectura"]');
    if (a) { a.disabled = leyendo; a.textContent = leyendo ? 'Leyendo...' : 'Actualizar'; }
    // La tanda de horas puede durar varios minutos: el mismo botón la corta.
    if (c) c.style.display = (leyendo || horasEnCurso) ? '' : 'none';
    pintarPastilla();
  }

  const bloqueoNota = () => notaEnCurso || corridaActiva();

  function pintarAccion() {
    const e = q('[data-e="accion"]');
    if (!e) return;
    const n = selVista().size;
    const b = bloqueoNota();
    const dis = (x) => (x ? ' disabled' : '');
    const sinBajar = b ? ' title="Durante una tanda de dejar nota no se descarga nada: la página se recarga en cada nota"' : '';
    e.innerHTML = '<span class="cuenta">' + (n ? plural(n, 'seleccionada', 'seleccionadas') : 'Ninguna seleccionada') + '</span>' +
      '<button class="sj-b" data-a="notaSel"' + dis(!n || b) + ' title="Lleva a la solapa Dejar nota con estas causas">Dejar nota en las seleccionadas</button>' +
      '<button class="sj-b" data-a="bajarSel"' + dis(!n || b) + sinBajar + '>Descargar PDF de las seleccionadas</button>' +
      '<button class="sj-b" data-a="elegirSel"' + dis(n !== 1 || b) + (sinBajar || ' title="Con una causa seleccionada: elegir qué actuaciones descargar"') + '>Elegir actuaciones</button>' +
      '<button class="sj-b" data-a="quitarSel"' + dis(!n) + '>Quitar selección</button>';
    // El número de la solapa Dejar nota sigue a la selección.
    pintarSolapas();
  }

  // Resultado de dejar nota: dejada, no salió o a verificar (sin respuesta clara).
  const resNota = (n) => (n.ok === true ? { c: 'ok', t: 'dejada' } : n.ok === null ? { c: 'duda', t: 'a verificar' } : { c: 'mal', t: 'no salió' });

  // ---------------------------------------------------- 6.5 vista dejar nota

  // Advertencia previa a dejar nota. Está siempre a la vista, y no detrás de un
  // paso de confirmación: dejar nota es irreversible, de modo que lo que hay que
  // saber antes de apretar tiene que leerse antes de apretar, no después.
  // Cubre los dos destinos posibles, porque desde esta solapa se puede dejar
  // nota en todas las habilitadas o solo en las seleccionadas.
  function avisoNotaHTML(sel) {
    const hoy = hoyISO();
    const cuenta = (claves) => claves.filter((k) => NOTAS[k] && NOTAS[k].f === hoy && NOTAS[k].ok === true).length;
    const partes = ['Dejar nota es el acto procesal. La página del PJN se recarga una vez por nota, ' +
      'y solo entran las causas que el PJN habilite hoy.'];
    if (sel.length) {
      const fueraRel = sel.filter((k) => !causaEn('rel', k)).length;
      const yaSel = cuenta(sel);
      if (fueraRel) {
        partes.push('De las seleccionadas, ' + plural(fueraRel, 'no está', 'no están') +
          ' en Mis causas, y el PJN solo deja nota desde ahí.');
      }
      if (yaSel) {
        partes.push(plural(yaSel, 'de las seleccionadas ya tiene', 'de las seleccionadas ya tienen') +
          ' nota dejada hoy, y se la vuelve a dejar si el PJN la habilita.');
      }
    } else {
      const yaTodas = cuenta(Object.keys(NOTAS));
      if (yaTodas) {
        partes.push(plural(yaTodas, 'causa ya tiene', 'causas ya tienen') +
          ' nota dejada hoy, y se la vuelve a dejar si el PJN la habilita.');
      }
    }
    return '<div class="sj-confirma" style="border-radius:6px;border:1px solid #f0dca0">' +
      '<span>' + partes.join(' ') + '</span>' +
      '<label>pausa <input type="text" data-e="pausa" value="' + esc(CFG.pausaNota) + '"> ms</label></div>';
  }

  // El número y la carátula abren la causa en una pestaña nueva, para revisar
  // la nota sin perder esta lista. La marca va en el botón y no en la fila: el
  // manejador de clics atiende la apertura antes que "Quitar", y marcar la fila
  // entera haría que "Quitar" también abriera la causa.
  function filaNotaHTML(k, quitable) {
    const c = causaPorClave(k);
    const n = NOTAS[k];
    const enRel = !!causaEn('rel', k);
    const ir = (txt) => '<button type="button" class="sj-ir" data-abrirnueva="' + esc(k) + '" title="Abrir el expediente en una pestaña nueva">' + esc(txt) + '</button>';
    return '<tr><td class="sj-exp">' + ir(k) + '</td>' +
      '<td>' + (c && c.car ? ir(c.car) : '') + (enRel ? '' : '<br><span class="sj-badge">no está en Mis causas</span>') + '</td>' +
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
      '<p>Hace lo mismo que harías manualmente en la lista de Relacionados del PJN: pone el filtro "Dejar nota", aprieta el lápiz de cada causa y confirma el cartel, recorriendo todas las páginas. El PJN recarga la página después de cada nota; el avance se ve acá. Solo entran las causas que el PJN habilite hoy.</p>';

    if (corriendo) {
      h += '<div class="sj-trab"><div class="cab"><b>Tanda en curso</b>' +
        '<span class="sj-badge">' + (c && c.solo ? plural(c.solo.length, 'causa elegida', 'causas elegidas') : 'todas las habilitadas') + '</span>' +
        (c ? '<span class="car" data-e="notaVan">van ' + esc(progresoNota(c)) + '</span>' : '') + '</div>' +
        '<div class="txt" data-e="notaTxtPanel">' + esc(ultimoEstadoNota || 'Retomando la tanda...') + '</div>' +
        '<div class="bts" style="margin-top:8px"><button class="sj-b peligro" data-a="cortarNota">Cancelar</button></div></div>';
    } else {
      // Los botones de esta solapa ejecutan: el aviso ya está arriba. Van en
      // rojo porque no hay paso atrás una vez que la tanda arranca.
      h += avisoNotaHTML(sel);
      h += '<div class="bts">' +
        '<button class="sj-b peligro" data-a="notaTodas">Dejar nota en todas las habilitadas</button>' +
        '<button class="sj-b' + (sel.length ? ' peligro' : '') + '" data-a="notaSel"' + (sel.length ? '' : ' disabled') + '>Dejar nota en ' + (sel.length ? lasN(sel.length, 'seleccionada', 'seleccionadas') : 'las seleccionadas') + '</button>' +
        (sel.length ? '<button class="sj-b" data-a="quitarSel">Vaciar la selección</button>' : '') +
        '</div>';
      h += sel.length
        ? '<h3>Seleccionadas en ' + esc(LISTAS[listaActual()].nombre) + '</h3><table class="lista">' + sel.map((k) => filaNotaHTML(k, true)).join('') + '</table>'
        : '<p style="color:#6b7c85">No hay causas seleccionadas en ' + esc(LISTAS[listaActual()].nombre) + '.' + (nOtra
          ? ' Hay ' + plural(nOtra, 'seleccionada', 'seleccionadas') + ' en ' + esc(LISTAS[otra].nombre) + '. <button class="sj-b chico" data-a="usarLista" data-lista="' + otra + '">Usar esas</button>'
          : ' Seleccionalas en <b>Mis causas</b> o en <b>Favoritos</b> y volvé a esta solapa, o dejá nota en todas las habilitadas.') + '</p>';
    }

    h += '<h3>Notas de hoy</h3>';
    h += deHoy.length
      ? '<p>' + plural(bien.length, 'nota dejada', 'notas dejadas') +
        (dudosas.length ? ', ' + plural(dudosas.length, 'a verificar en el expediente', 'a verificar en el expediente') : '') +
        (deHoy.length - bien.length - dudosas.length ? ' y ' + plural(deHoy.length - bien.length - dudosas.length, 'que no salió', 'que no salieron') : '') + '.</p>' +
        '<table class="lista">' + deHoy.map((k) => filaNotaHTML(k, false)).join('') + '</table>'
      : '<p style="color:#6b7c85">Todavía no se dejó ninguna nota hoy desde SuPJN+.</p>';
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
      '<h4>Anotaciones</h4>' +
      '<textarea class="sj-nota" placeholder="Anotaciones privados sobre esta causa. Quedan en esta PC y no se escriben en el expediente.">' + esc(m.nota) + '</textarea>' +
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
      return (esNovedad(c) ? '<span class="sj-nuevo" title="Cambió la fecha de la última actuación o la situación desde la última vez que la miraste. Deja de estar marcada cuando la abrís.">nuevo</span>' : '') +
        '<span class="sj-exp">' + esc(c.exp).replace(/ /g, '&nbsp;').replace(/\//g, '/<wbr>') + '</span>' + (fav ? '<span class="sj-fav" title="Está en tus Favoritos del PJN">★</span>' : '') +
        (c.tramite ? '' : '<br><span class="sj-badge">fuera de trámite</span>');
    }
    if (k === 'partes') return partesHTML(partesDe(c));
    if (k === 'ult') {
      const h = HORAS[c.exp];
      return esc(c.ult) + (h && h.f === c.ult
        ? ' <span class="sj-hora" title="' + esc('Hora obtenida de ' + h.origen + ', del último documento de la causa.' +
          (FECHAS_CON_HORA[c.ult] ? '' : ' Todavía faltan horas de otras causas de ese mismo día, así que el orden sigue siendo el del PJN.')) + '">' + esc(h.hh) + '</span>'
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
      return '<div class="sj-toque" data-det="' + esc(c.exp) + '" data-foco="nota" title="' + (nota ? esc(nota) : 'Escribir una anotación') + '">' +
        (nota ? '<span class="sj-nota-txt">' + esc(nota) + '</span>' : '<span class="sj-poner">+ anotación</span>') + '</div>';
    }
    return esc(c[k]);
  }

  // ---------------------------------------------- 6.6 columnas de las tablas

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
  // descargar de los mínimos. Redondear columna por columna se pasaba 1 o 2 px y
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
    // Rehacer la tabla la devuelve al primer renglón. Se anota dónde estaba
    // para dejarla donde estaba: quien quiera llevarla arriba (cambiar de
    // página, de orden o de solapa) lo hace después de pintarla.
    const arriba = cuerpo.scrollTop;
    const foco = focoAnotacion();
    guardarNotaAbierta();
    const tipo = VISTA === 'fav' ? 'fav' : 'rel';
    const D = DATOS[tipo];
    if (!D) {
      cuerpo.innerHTML = '<div class="sj-vacio">' + (leyendo
        ? 'Leyendo ' + LISTAS[tipo].pjn + ' en segundo plano. La primera vez tarda un poco.'
        : 'Todavía no se leyó ' + LISTAS[tipo].nombre + '. Pulsá "Actualizar".') + '</div>';
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
        '<button class="sj-mas" data-mas="' + esc(c.exp) + '" title="Más acciones: libro digital, presentar escrito, descargar, dejar nota">⋯</button></div></td>' +
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
    // Al volver de una causa o de una recarga, la primera vez que se dibuja la
    // tabla se retoma el punto donde había quedado.
    if (!retomarLugar(VISTA, cuerpo)) cuerpo.scrollTop = arriba;

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

  // --------------------------------------------------------------- 6.7 menús

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

  const RE_SALIR = /^(cerrar sesi[oó]n|salir|cerrar la sesi[oó]n|logout|log out|desconectar)$/i;
  const enlaceSalirPJN = () => enlacePJN('a', RE_SALIR);

  // Todas las funciones del PJN se abren en una pestaña nueva, pedido del
  // autor: la pestaña donde está SuPJN+ no se mueve. Las de la Consulta Web
  // llevan noopener pero no noreferrer, que el sitio es el mismo.
  function menuPJNHTML() {
    const it = (u, t, ext) => '<a class="it" href="' + esc(u) + '" target="_blank" rel="' + (ext ? 'noopener noreferrer' : 'noopener') + '">' + esc(t) + ' ↗</a>';
    const nueva = enlacePJN('a[id$="menuNuevaConsulta"]');
    const rad = enlacePJN('a[id$="btn-lista-noIniciados"]') || RUTA.rad;
    const datos = enlacePJN('a', /^datos personales$/i);
    // El enlace de salida del PJN: se lo busca por el texto, porque el sitio no
    // le pone un identificador estable. Si cambia, "Revisar el PJN" lo marca.
    const salir = enlaceSalirPJN();
    return '<div class="tit">Consulta Web (pestaña nueva)</div>' +
      it(RUTA.rel, 'Relacionados (lista del PJN)') + it(RUTA.fav, 'Favoritos (lista del PJN)') + it(rad, 'Radicaciones') +
      (nueva ? it(nueva, 'Nueva consulta pública') : '') + (datos ? it(datos, 'Datos personales') : '') +
      (salir ? '<div class="sep"></div><button class="it" data-a="salirPJN">Cerrar sesión del PJN</button>' : '') +
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
      it('bajarUna', 'Descargar el expediente completo en PDF', b, b ? 'Durante una tanda de dejar nota no se descarga nada' : '') +
      it('elegirUna', 'Elegir qué actuaciones descargar', b, b ? 'Durante una tanda de dejar nota no se descarga nada' : '') +
      '<div class="sep"></div>' +
      it('notaUna', 'Dejar nota en esta causa', !enRel || b, soloRel) +
      it('marcasUna', 'Etiquetas y anotaciones') +
      '<div class="sep"></div>' +
      it('cedulaUna', 'Dejar cédula (Notificaciones, pestaña nueva)') +
      it('verEscr', 'Escritos presentados en esta causa') +
      it('verNotif', 'Notificaciones de esta causa') +
      it('verDeox', 'DEOX de esta causa') +
      it('verGuia', 'Datos del juzgado (Guía judicial)', !depDe(k), depDe(k) ? '' : 'No se conoce la dependencia de esta causa') +
      ((causaPorClave(k) && esNovedad(causaPorClave(k))) ? it('vistoUna', 'Marcar como vista') : '');
  }

  // ---------------------------------------------------- 6.8 vista expediente

  const EXP = { estado: 'nada', texto: '', datos: null, acts: null, elegidas: new Set(), filtro: { texto: '', desde: '', hasta: '' }, cortar: false,
    // Las otras tres solapas del PJN: se piden de a una y se guardan mientras dure la página.
    solapas: { int: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false }, vin: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false }, rec: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false } } };

  // Roles de acompañamiento: no son partes, son quienes las asisten o intervienen por oficio.
  const ROL_ACCESORIO = /letrad|apoderad|patrocinante|perit|defensor|fiscal|ministerio|s[ií]ndic|martiller|mediador|curador|tutor|auxiliar|secretari|^juez|consultor|traductor|int[eé]rprete|oficial|asesor/i;

  // De la solapa Intervinientes salen las partes de verdad, con el rol que pone el PJN.
  function partesDeIntervinientes(s) {
    if (!s || s.estado !== 'listo' || !s.filas.length) return null;
    // Si no se reconoce la columna del rol, se usa la primera, pero solo cuando
    // hay otra para el nombre: dar por rol la columna 0 a ciegas daba vuelta las
    // dos cosas y mostraba "Juan perez: ACTOR".
    const iNom = s.cabs.findIndex((c) => /nombre|denominaci/i.test(c));
    let iTipo = s.cabs.findIndex((c) => /tipo|car[aá]cter|rol|intervin/i.test(c));
    if (iTipo < 0) iTipo = (iNom === 0 && s.cabs.length > 1) ? 1 : 0;
    if (iTipo === iNom) return null;
    const out = [];
    s.filas.forEach((f) => {
      const rol = limpio(f[iTipo] || '');
      const nombre = limpio(f[iNom >= 0 ? iNom : 1] || '');
      if (!nombre || ROL_ACCESORIO.test(rol)) return;
      out.push({ rol: nombreRol(rol), nombre });
    });
    return out.length ? out : null;
  }

  // Las partes que salen de la solapa las pone el PJN; las que salen de la
  // carátula las deduce SuPJN+. No es lo mismo y hay que decirlo: si la solapa
  // falló, mostrar unas por otras sin aclarar es afirmar de más.
  function partesExpHTML() {
    const s = EXP.solapas.int;
    const dePJN = partesDeIntervinientes(s);
    if (dePJN) {
      return s.completa === false
        ? '<span title="El PJN interrumpió la lectura de Intervinientes: pueden faltar partes. Abrí Intervinientes y pulsá Volver a leer.">' +
          partesHTML(dePJN) + ' <span class="sj-badge">puede faltar</span></span>'
        : partesHTML(dePJN);
    }
    const d = EXP.datos || {};
    const ps = partesDeCaratula(d.exp || '', d.car || '');
    if (!ps.length) return '';
    const vacia = s.estado === 'listo' && !s.filas.length;
    const dudoso = s.estado === 'error' || s.estado === 'listo' || (s.estado === 'nada' && EXP.estado === 'error');
    return '<span title="' + esc(vacia
      ? 'El PJN no informa intervinientes para esta causa: estas partes se obtienen de la carátula.'
      : dudoso
        ? 'Obtenidas de la carátula: no se pudieron leer los intervinientes del PJN. Abrí Intervinientes para ver los que manda el PJN.'
        : 'Obtenidas de la carátula mientras se leen los intervinientes del PJN.') + '">' +
      partesHTML(ps) + (dudoso ? ' <span class="sj-badge">de la carátula</span>' : '') + '</span>';
  }

  const botonPJN = (re) => [...document.querySelectorAll('a, input[type=button], input[type=submit], button')]
    .find((x) => !esNuestro(x) && re.test(limpio(x.value || x.textContent))) || null;

  function pintarExpediente() {
    const p = q('[data-e="vPanel"]');
    // Igual que en la lista: volver a dibujar el expediente no tiene por qué
    // devolver la pantalla al principio.
    const arriba = p ? p.scrollTop : 0;
    const foco = focoAnotacion();
    guardarNotaAbierta();
    const d = EXP.datos || (EXP.datos = datosExpediente(document));
    const k = d.exp;
    p.innerHTML =
      '<div class="sj-sec"><div class="sj-exp-cab"><span class="n">' + esc(k || 'Expediente') + '</span>' +
      '<div class="c">' + esc(d.car) +
      '<div class="p" data-e="partesExp">' + partesExpHTML() + '</div>' +
      '<div class="d">' + esc([d.dep, d.sit].filter(Boolean).join(' · ')) + '</div></div></div>' +
      '<div class="sj-exp-bts"><button class="sj-b" data-a="volverLista">Volver a Mis causas</button>' +
      (botonPJN(/^dejar nota$/i) ? '<button class="sj-b" data-a="notaPJN" title="Usa el botón del PJN, que pide confirmar">Dejar nota en esta causa</button>' : '') +
      (botonPJN(/presentar escrito/i) ? '<button class="sj-b" data-a="escritoPJN">Presentar escrito</button>' : '') +
      '<button class="sj-b" data-a="recargar">Recargar la página</button></div>' +
      (k ? '<div class="sj-exp-bts"><button class="sj-b prim" data-a="cedulaUna" data-k="' + esc(k) + '" title="Abre Notificaciones en una pestaña nueva, con este expediente cargado">Dejar cédula</button>' +
        '<button class="sj-b" data-a="verEscr" data-k="' + esc(k) + '" title="Los escritos presentados en esta causa, de cualquier fecha">Escritos</button>' +
        '<button class="sj-b" data-a="verNotif" data-k="' + esc(k) + '" title="Las notificaciones electrónicas de esta causa, de cualquier fecha">Notificaciones</button>' +
        '<button class="sj-b" data-a="verDeox" data-k="' + esc(k) + '" title="Los oficios electrónicos de esta causa, de cualquier fecha">DEOX</button>' +
        (d.dep ? '<button class="sj-b" data-a="verGuia" data-k="' + esc(k) + '" title="Domicilio, teléfono e integrantes de la dependencia, según la Guía judicial">Juzgado en la Guía</button>' : '') +
        '</div>' : '') +
      '</div>' +
      '<div class="sj-sec"><h4>Actuaciones con PDF</h4><div data-e="expEstado"></div><div data-e="expElegir"></div></div>' +
      solapaExpHTML('int') + solapaExpHTML('vin') + solapaExpHTML('rec') +
      (k ? '<div class="sj-sec" data-marca="' + esc(k) + '">' + editorMarcasHTML(k) + '</div>' : '');
    pintarExpEstado();
    pintarElegir('exp');
    devolverFoco(foco);
    if (p && !retomarLugar('exp', p)) p.scrollTop = arriba;
  }

  const TITULO_SOLAPA = { int: 'Intervinientes', vin: 'Causas vinculadas', rec: 'Recursos' };
  const AYUDA_SOLAPA = {
    int: 'Todas las partes y quienes intervienen, tal como los lista el PJN.',
    vin: 'Las causas vinculadas a esta. Se abren y se descargan como cualquier otra.',
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
    if (s.estado === 'leyendo') return '<div class="sj-sol-txt">' + esc(s.texto || 'Consultando al PJN...') + '</div><div class="sj-prog"><i style="width:35%"></i></div>';
    if (s.estado === 'error') return '<div class="sj-sol-txt mal">' + esc(s.texto) + '</div><div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + clave + '" data-otra="1">Probar de nuevo</button></div>';
    if (s.estado !== 'listo') return '<div class="sj-sol-txt">' + esc(AYUDA_SOLAPA[clave]) + '</div>';
    if (!s.filas.length) {
      return s.completa === false
        ? '<div class="sj-sol-txt mal">' + esc('El PJN no llegó a llenar ' + TITULO_SOLAPA[clave] + ': no se sabe si hay algo o no. Probá "Volver a leer".') + '</div>' +
          '<div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + clave + '" data-otra="1">Volver a leer</button></div>'
        : '<div class="sj-sol-txt">' + esc('El PJN no tiene nada en ' + TITULO_SOLAPA[clave] + ' para esta causa.') + '</div>';
    }
    const acciones = clave === 'vin';
    return '<div class="lst-sol"><table class="sj-t sj-fija"><thead><tr>' +
      s.cabs.map((c) => '<th>' + esc(c) + '</th>').join('') + (acciones ? '<th></th>' : '') + '</tr></thead><tbody>' +
      s.filas.map((f) => '<tr>' + f.map((v, i) => '<td' + (i === 0 ? ' class="sj-exp"' : '') + '>' + esc(v) + '</td>').join('') +
        (acciones ? '<td class="acc"><div class="sj-acc"><button class="sj-abrir" data-a="abrirVinc" data-k="' + esc(f[0]) + '" title="Abrir esta causa vinculada en esta pestaña">Abrir</button>' +
          '<button class="sj-mas" data-a="abrirVincNueva" data-k="' + esc(f[0]) + '" title="Abrirla en una pestaña nueva">↗</button>' +
          '<button class="sj-mas" data-a="bajarVinc" data-k="' + esc(f[0]) + '" title="Descargar el expediente completo de esta causa vinculada">⇩</button>' +
          '<button class="sj-mas" data-a="cedulaUna" data-k="' + esc(f[0]) + '" title="Dejar cédula en esta causa vinculada (Notificaciones, pestaña nueva)">✉</button></div></td>' : '') +
        '</tr>').join('') + '</tbody></table></div>' +
      '<div class="sj-sol-txt' + (s.completa === false ? ' mal' : '') + '">' +
      esc(s.completa === false
        ? 'El PJN dejó de contestar mientras se pasaban las páginas: esto es lo que se alcanzó a leer y puede faltar. Probá "Volver a leer".'
        : 'Leído ' + hace(s.fecha || Date.now()) + '.') +
      '</div><div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + clave + '" data-otra="1">Volver a leer</button></div>';
  }

  function pintarSolapaExp(clave) {
    const cont = q('[data-e="solapa-' + clave + '"]');
    const s = EXP.solapas[clave];
    if (cont) cont.innerHTML = s.abierta ? cuerpoSolapaHTML(clave) : '';
    const b = q('[data-a="verSolapa"][data-sol="' + clave + '"]');
    if (b) b.innerHTML = (s.abierta ? '▾' : '▸') + ' ' + esc(TITULO_SOLAPA[clave]) + (s.estado === 'listo' ? '<span class="sj-badge">' + s.filas.length + '</span>' : '');
    const p = q('[data-e="partesExp"]');
    if (p) p.innerHTML = partesExpHTML();
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
      if (/descargando/.test(t.estado)) h += '<div class="sj-prog"><i style="width:' + Math.round((t.frac || 0) * 100) + '%"></i></div>';
      if (/descargando|a descargar/.test(t.estado)) h += '<button class="sj-b peligro chico" data-a="cortarCola" style="margin-top:6px">Cancelar</button>';
    }
    e.innerHTML = h;
  }

  // -------------------------------------------------- 6.9 elegir actuaciones

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
    // La columna de acciones tiene ancho fijo: tiene que entrar el botón más
    // largo de los dos, más la separación y el relleno de la celda.
    const ANCHO_SEL = 30, ANCHO_VER = 136;
    const enc = anchosEncuadrados('act', cols, ANCHO_SEL + ANCHO_VER, anchoUtil(q('[data-elegir="' + id + '"] .lst')));
    const filas = V.map((i) => {
      const a = ctx.acts[i];
      return '<tr><td class="cs"><input type="checkbox" data-ei="' + i + '"' + (ctx.elegidas.has(i) ? ' checked' : '') + '></td>' +
        cols.map((k) => '<td class="' + claseAct(k) + '">' + celdaAct(a, k) + '</td>').join('') +
        '<td class="acc">' +
        '<button class="sj-b chico" data-ea="bajarUna" data-i="' + i + '" title="Descargar solo esta actuación en un PDF">Descargar</button>' +
        (a.ver ? '<a class="sj-b chico" href="' + esc(a.ver) + '" target="_blank" rel="noopener" title="Abrir esta actuación en el visor del PJN, en una pestaña nueva">Ver</a>' : '') +
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
      '<div class="pie"><button class="sj-b prim" data-ea="bajarElegidas"' + (n ? '' : ' disabled') + '>Descargar las elegidas (' + n + ')</button>' +
      '<button class="sj-b" data-ea="bajarTodo"' + (ctx.acts.length ? '' : ' disabled') + '>Descargar todo en 1 PDF</button>' +
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
    if (b) { b.disabled = !ctx.elegidas.size; b.textContent = 'Descargar las elegidas (' + ctx.elegidas.size + ')'; }
    const t = cont.querySelector('[data-ea="todasCb"]');
    if (t) t.checked = V.length > 0 && V.every((i) => ctx.elegidas.has(i));
  }

  // ---------------------------------------------------- 6.10 vista descargas

  function trabajoHTML(t) {
    const clase = t.estado === 'listo' ? 'listo' : /error|cancelado/.test(t.estado) ? 'error' : '';
    const modo = t.modo === 'elegir' ? 'eligiendo actuaciones' : t.modo === 'seleccion' ? (t.una ? 'una actuación' : t.parcial ? 'actuaciones elegidas' : 'expediente completo') : 'expediente completo';
    return '<div class="sj-trab ' + clase + '" data-trab="' + esc(t.id) + '" data-estado="' + esc(t.estado) + '">' +
      '<div class="cab"><b class="sj-exp">' + esc(t.exp) + '</b><span class="car">' + esc(t.car) + '</span><span class="sj-badge">' + esc(modo) + '</span></div>' +
      '<div class="txt" data-e="ttxt">' + esc(t.texto) + '</div>' +
      (/abriendo|leyendo|descargando/.test(t.estado) ? '<div class="sj-prog"><i data-e="tprog" style="width:' + Math.round((t.frac || 0) * 100) + '%"></i></div>' : '') +
      (t.estado === 'eligiendo' ? elegirHTML(t.id) : '') +
      '</div>';
  }

  const textoPausa = () => 'Pausa entre bloques: de a ' + BLOQUE_DESCARGAS + ' causas por vez, para no saturar al PJN. Sigo en ' +
    Math.max(1, Math.round((pausaHasta - Date.now()) / 1000)) + ' segundos.';

  const pausaHTML = () => (pausaHasta && Date.now() < pausaHasta
    ? '<div class="sj-trab" data-e="pausa"><div class="txt" data-e="pausaTxt">' + esc(textoPausa()) + '</div>' +
      '<div class="bts" style="margin-top:8px"><button class="sj-b chico" data-a="seguirAhora">Seguir ahora</button></div></div>'
    : '');

  // La cuenta atrás cambia sola cada segundo: se toca solo ese texto. Redibujar
  // toda la vista le borraba al usuario lo que estuviera escribiendo o eligiendo.
  function pintarCuentaPausa() {
    const caja = q('[data-e="pausa"]');
    if (!pausaHasta || Date.now() >= pausaHasta) { if (caja) pintarDescargas(); return; }
    if (!caja) { pintarDescargas(); return; }
    const t = caja.querySelector('[data-e="pausaTxt"]');
    if (t) t.textContent = textoPausa();
  }

  function pintarDescargas() {
    pintarSolapas();
    pintarPastilla();
    pintarExpEstado();
    if (VISTA !== 'desc' || !win) return;
    const p = q('[data-e="vPanel"]');
    const hayTerminadas = COLA.some((t) => /listo|error|cancelado/.test(t.estado));
    p.innerHTML = '<div class="sj-panel-in" style="max-width:1100px"><h2>Descargas</h2>' +
      '<p>Cada causa se abre y se lee en segundo plano, sin mover la página del PJN, y se descarga en un PDF. Si Chrome pregunta si el sitio puede descargar varios archivos, aceptá. Mientras haya descargas, no cierres ni cambies esta pestaña de página.</p>' +
      '<div class="bts">' + (bajandoAlgo() ? '<button class="sj-b peligro" data-a="cortarCola">Cancelar las descargas</button>' : '') +
      (hayTerminadas ? '<button class="sj-b" data-a="limpiarCola">Quitar las terminadas</button>' : '') + '</div>' +
      pausaHTML() +
      (COLA.length ? COLA.map(trabajoHTML).join('')
        : '<p class="sj-vacio">No hay descargas. Seleccioná causas en Mis causas o Favoritos y pulsá "Descargar PDF de las seleccionadas", o usá el menú ⋯ de una causa para elegir actuaciones.</p>') +
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

  // ------------------------------------------------------------ 6.11 paneles

  // La contraseña del archivo exportado. Se pone una vez y queda en este
  // equipo: acá no se la vuelve a pedir, ni al exportar ni al importar. Al
  // abrir el archivo en otra máquina sí hace falta escribirla.
  function contraHTML() {
    const puesta = hayContra();
    return '<h3>Contraseña de tus copias</h3>' +
      '<p>El archivo que exportás, y el que se guarda en la carpeta de respaldo, salen en formato propio de SuPJN+, no como texto: no se abren con el Bloc de notas ' +
      'ni los leen los buscadores de escritorio o de la nube, y hace falta la contraseña para abrirlos. ' +
      'Es la protección del archivo cuando sale de esta PC, que es donde queda fuera de tu control.</p>' +
      (puesta
        ? '<p><b>Contraseña puesta.</b> En esta PC no se te pide: ni para exportar, ni para importar, ni para la carpeta. ' +
          'En otra máquina hay que ponerla una vez, para importar el archivo o para leer la carpeta.</p>' +
          '<div class="bts"><button class="sj-b" data-a="verContra">Ver o cambiar la contraseña</button></div>'
        : '<p style="color:#8a5a00">Todavía no pusiste contraseña, así que no se puede exportar ni guardar en la carpeta. ' +
          'Poné una y anotala donde guardes tus claves: sin ella, el archivo no se abre en ninguna parte, ' +
          'tampoco acá si perdés esta PC.</p>') +
      (puesta && mostrarContra
        ? '<div class="sj-nueva" style="margin-top:8px"><input type="text" class="sj-contra" value="' + esc(leerContra()) + '" maxlength="120">' +
          '<button class="sj-b prim" data-a="guardarContra">Guardar</button>' +
          '<button class="sj-b" data-a="ocultarContra">Listo</button></div>'
        : puesta ? ''
          : '<div class="sj-nueva"><input type="text" class="sj-contra" placeholder="Escribí una contraseña para tus copias" maxlength="120">' +
            '<button class="sj-b prim" data-a="guardarContra">Guardar contraseña</button></div>');
  }

  function panelMarcasHTML() {
    const et = MARCAS.etiquetas;
    const marcadas = Object.keys(MARCAS.filas).length;
    const d = RESPALDO && RESPALDO.fecha ? diasDesde(RESPALDO.fecha) : null;
    return '<div class="sj-panel-in">' +
      '<h2>Respaldo, etiquetas y anotaciones</h2>' +
      '<p>Las etiquetas y las anotaciones son datos propios, no del PJN: quedan en el almacén de Tampermonkey de esta PC y no se escriben en ningún expediente. Hoy hay <b>' +
      plural(et.length, 'etiqueta', 'etiquetas') + '</b> y <b>' + plural(marcadas, 'causa marcada', 'causas marcadas') + '</b>.</p>' +
      '<h3>Carpeta de respaldo</h3>' +
      '<p>' + (carpetaEstado === 'lista'
        ? 'Guardando solo en <b>' + esc(carpetaTexto) + '</b>: cada cambio se escribe ahí, cifrado con la contraseña de tus copias, y al abrir SuPJN+ se lee lo que haya (sirve para trabajar en dos PC con la carpeta sincronizada; en la otra PC tiene que estar puesta la misma contraseña).'
        : carpetaEstado === 'contra'
          ? 'Hay una carpeta elegida (<b>' + esc(carpetaTexto) + '</b>), pero ' + (carpetaBloqueada
            ? (hayContra()
              ? 'la contraseña de esta PC no abre el respaldo que hay ahí. Poné la misma contraseña que usaste en la otra PC, con "Ver o cambiar la contraseña". Si cambiaste la contraseña a propósito, podés reemplazar ese respaldo con los datos de esta PC.'
              : 'el respaldo que hay ahí tiene contraseña. Poné la misma que usaste en la otra PC, más abajo, y se lee enseguida.')
            : 'para guardar ahí hace falta la contraseña de tus copias. Ponela más abajo y se guarda enseguida.') +
            ' Mientras tanto no se escribe nada en la carpeta.'
        : carpetaEstado === 'pedir'
          ? 'Hay una carpeta elegida (<b>' + esc(carpetaTexto) + '</b>), pero Chrome pide confirmar el permiso otra vez. Mientras tanto no se guarda nada ahí.'
          : carpetaEstado === 'falta'
            ? 'No se encuentra la carpeta <b>' + esc(carpetaTexto) + '</b>: puede haberse movido, cambiado de nombre o estar sin descargar de la nube. Elegila de nuevo.'
            : carpetaEstado === 'error'
              ? 'Hubo un problema con la carpeta elegida' + (carpetaAviso ? ' (' + esc(carpetaAviso) + ')' : '') + '. Probá elegirla de nuevo.'
              : 'Elegí dónde tenés el respaldo, el cual tenés que hacer manualmente. Consejo: guardalo en la nube para compartirlo con otra PC.') + '</p>' +
      '<div class="bts">' +
      (carpetaEstado === 'pedir' ? '<button class="sj-b prim" data-a="conectarCarpeta">Volver a permitir la carpeta</button>' : '') +
      (carpetaEstado === 'contra' && carpetaBloqueada && hayContra() ? '<button class="sj-b" data-a="pisarCarpeta" title="Lo que esté solo en el respaldo de la carpeta se pierde">Reemplazar el respaldo de la carpeta con los datos de esta PC</button>' : '') +
      '<button class="sj-b' + (carpetaEstado === 'lista' ? '' : ' prim') + '" data-a="elegirCarpeta">' + (carpetaEstado === 'lista' ? 'Cambiar la carpeta' : 'Elegir carpeta') + '</button>' +
      (carpetaEstado === 'lista' ? '<button class="sj-b" data-a="guardarCarpeta">Guardar ahora</button>' : '') +
      '</div>' +
      '<h3>Copia de respaldo</h3>' +
      '<p>' + (d === null ? 'Todavía no se guardó ninguna copia.' : 'Última copia: <b>' + soloFecha(RESPALDO.fecha) + '</b> (' + (d === 0 ? 'hoy' : d === 1 ? 'hace 1 día' : 'hace ' + d + ' días') + (RESPALDO.auto ? ', en la carpeta' : ', manual') + ').') +
      ' Si se limpia el navegador o se reinstala Tampermonkey, lo que no esté en una copia se pierde.' +
      (carpetaEstado === 'lista' ? ' Con la carpeta conectada eso ya queda cubierto; el archivo suelto sirve igual para llevarlo a otra PC.' : ' Sin carpeta, la copia se hace manualmente.') + '</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="exportar">Exportar etiquetas, anotaciones y notas</button>' +
      '<button class="sj-b" data-a="importar">Importar desde un archivo</button></div>' +
      '<p style="color:#6b7c85;font-size:12px">La copia lleva las etiquetas, las anotaciones y el registro de dejar nota de cada causa. La importación suma las etiquetas que falten y de cada causa deja lo más nuevo (la anotación más nueva si las dos copias tienen fecha, y los dos textos si alguna viene de una copia vieja, sin fecha), más el resultado de nota más nuevo.</p>' +
      contraHTML() +
      '<h3>Etiquetas</h3>' +
      (et.length
        ? '<table class="lista">' + et.map((e) => '<tr><td><span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span></td>' +
          '<td style="color:#6b7c85">' + plural(usoDe(e.id), 'causa', 'causas') + '</td>' +
          '<td style="text-align:right;width:1%;white-space:nowrap"><button class="sj-b chico" data-a="borrarEt" data-id="' + esc(e.id) + '">Eliminar</button></td></tr>').join('') + '</table>'
        : '<p style="color:#6b7c85">Todavía no hay etiquetas. Se crean pulsando la columna Etiquetas de cualquier causa.</p>') +
      '</div>';
  }

  // ---------------------------------- 6.12 revisar el PJN: lo que se muestra

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
      '<div class="bts"><button class="sj-b" data-a="cortarDiag">Cancelar la revisión</button></div>';
    const aviso = DIAG.items.find((i) => i.aviso);
    const cambios = DIAG.items.filter((i) => i.ok === false && !i.aviso).length;
    const sinProbar = DIAG.items.filter((i) => i.ok !== true && i.ok !== false).length;
    const partes = [];
    const aMedias = DIAG.items.length > 1;
    if (aviso) partes.push(aviso.aviso === 'venció'
      ? 'La sesión del PJN venció' + (aMedias ? ' y la revisión quedó a medias' : '') + ': recargá la página, volvé a entrar si lo pide y pulsá de nuevo "Revisar el PJN".'
      : 'El navegador está sin conexión: probá de nuevo cuando vuelva.');
    if (cambios) partes.push('Hay ' + plural(cambios, 'cosa que cambió', 'cosas que cambiaron') + '. Copiá el informe y envialo a quien mantiene SuPJN+: no incluye números de causa ni datos propios.');
    else if (!aviso) partes.push(sinProbar
      ? 'No se encontraron cambios en lo que se pudo probar (' + plural(sinProbar, 'cosa quedó', 'cosas quedaron') + ' sin probar).'
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

  // ------------------------------ 6.13 registro de fallas: lo que se muestra

  // Se muestran las últimas: si hace falta el detalle completo, está en el
  // texto para copiar.
  const FALLAS_A_LA_VISTA = 12;

  function fallasHTML() {
    if (!FALLAS.length) {
      return '<p style="color:#6b7c85">No hay fallas registradas. Acá quedan anotadas las descargas que no se completan, con el detalle necesario para averiguar por qué.</p>';
    }
    const ver = FALLAS.slice(0, FALLAS_A_LA_VISTA);
    const filas = ver.map((f) => {
      const det = [];
      if (f.act) det.push(esc(f.act));
      det.push('Etapa: ' + esc(f.etapa));
      if (f.http) det.push('Estado HTTP ' + f.http);
      if (f.tipo) det.push(esc(f.tipo));
      if (f.intentos > 1) det.push(plural(f.intentos, 'intento', 'intentos'));
      return '<tr><td style="white-space:nowrap;width:1%;padding-right:12px;color:#5a7581">' + esc(fechaHora(f.t)) + '</td>' +
        '<td><b>' + esc(f.exp || 'Sin expediente') + '</b><br><span style="color:#5a7581">' + det.join(' · ') + '</span>' +
        (f.motivo ? '<br><span style="color:#5a7581">' + esc(f.motivo) + '</span>' : '') + '</td></tr>';
    }).join('');
    return '<table class="lista">' + filas + '</table>' +
      (FALLAS.length > ver.length ? '<p style="color:#6b7c85;font-size:12px">Se muestran las ' + ver.length + ' más recientes de ' + FALLAS.length + '. El texto para copiar las trae todas.</p>' : '') +
      '<textarea class="sj-informe" readonly data-e="fallasTexto">' + esc(textoFallas(true)) + '</textarea>' +
      '<div class="bts"><button class="sj-b" data-a="copiarFallas">Copiar el registro</button>' +
      '<button class="sj-b" data-a="borrarFallas">Vaciar el registro</button></div>' +
      '<p style="color:#6b7c85;font-size:12px">El texto para copiar omite el número de expediente, la descripción de la actuación y los parámetros de la dirección, de modo que puede enviarse sin revelar de qué causa se trata.</p>';
  }

  function pintarFallas() {
    const e = q('[data-e="fallas"]');
    if (e) e.innerHTML = fallasHTML();
  }

  // Copia al portapapeles el contenido de un cuadro de texto. La vía moderna
  // necesita permiso y contexto seguro; si no está disponible, se recurre a la
  // selección y al comando de copia clásico, y si tampoco, se le indica al
  // usuario cómo hacerlo manualmente.
  function copiarCuadro(marca, aviso) {
    const t = q('[data-e="' + marca + '"]');
    if (!t) return;
    const listo = () => avisar(aviso);
    const aMano = () => {
      t.select();
      let fue = false;
      try { fue = document.execCommand('copy'); } catch (x) { fue = false; }
      if (fue) listo(); else avisar('Seleccioná el texto y copialo con Ctrl+C.');
    };
    try { window.navigator.clipboard.writeText(t.value).then(listo, aMano); } catch (x) { aMano(); }
  }

  function panelAcercaHTML() {
    return '<div class="sj-panel-in">' +
      '<h2>SuPJN+ <span style="font-size:12px;color:#6b7c85;font-weight:400">' + esc(APP.version) + '</span></h2>' +
      '<p>Una sola ventana sobre la Consulta Web del PJN. Arranca minimizada, en el indicador de abajo a la derecha, y mientras tanto lee las causas en segundo plano. Se mueve arrastrando la barra azul, se agranda desde la esquina de abajo a la derecha, y tiene zoom, minimizar, maximizar y cerrar.</p>' +
      '<h3>Qué hace</h3>' +
      '<p><b>Mis causas y Favoritos:</b> lee las dos listas del PJN, en trámite y fuera de trámite, en segundo plano y sin mover la página que estás viendo. Se busca, se filtra, se ordena por cualquier columna y las columnas se mueven, se ensanchan y se ocultan. Lo mismo vale para las actuaciones del expediente: fecha, tipo de actuación, descripción y fojas son columnas, y se ordenan y se mueven igual.</p>' +
      '<p><b>Encuadre y zoom:</b> de manera predeterminada la tabla entra siempre en el ancho de la ventana, de modo que el ancho que gana una columna lo pierden las otras; el encuadre se desactiva desde <b>Columnas</b>. El zoom de la barra de título agranda lo de adentro sin mover la ventana.</p>' +
      '<p><b>Dejar nota:</b> tiene su propia solapa. En todas las causas que el PJN habilite o solo en las seleccionadas. Pide confirmar antes de empezar y guarda el resultado de cada causa en la columna Nota.</p>' +
      '<p><b>Descargar:</b> desde la lista, el expediente completo de las causas seleccionadas o las actuaciones que elijas de una causa; desde el expediente, todo o las actuaciones elegidas. Cada causa sale en un PDF.</p>' +
      '<p><b>Escritos, Notificaciones y DEOX:</b> cada uno tiene su solapa, con la bandeja, las fechas, un buscador y el PDF de cada elemento para verlo o descargarlo. Desde el menú ⋯ de una causa, o con los botones del expediente abierto, se ven solo los de esa causa, de cualquier fecha. SuPJN+ abre esas aplicaciones del PJN en segundo plano, con tu misma sesión, y comprueba que sean de la misma cuenta que la Consulta Web; si no lo son, no muestra nada. Lo consultado no se guarda en el equipo.</p>' +
      '<p><b>Dejar cédula:</b> desde el menú ⋯ de una causa, el expediente abierto, la solapa Notificaciones, cada fila de Escritos, Notificaciones y DEOX, o Funciones del PJN. Abre el formulario de Notificaciones del PJN en una pestaña nueva, carga la jurisdicción, el número y el año, y elige el expediente o el incidente exacto. Los destinatarios, los despachos, el texto y el envío se hacen en el formulario del PJN: SuPJN+ no envía cédulas. Si el PJN no ofrece la causa (solo ofrece aquellas en las que constituiste domicilio electrónico), lo avisa.</p>' +
      '<p><b>Guía judicial:</b> el índice de la Guía del PJN para recorrer por niveles, y una búsqueda por dependencia o por magistrado o funcionario. Muestra domicilio, teléfono, correo e integrantes, y copia esos datos con un botón. Desde una causa, o pulsando la dependencia en Escritos, Notificaciones o DEOX, abre directamente el juzgado que corresponde, con la secretaría o la sala resaltada; si hay más de uno posible, los muestra para elegir.</p>' +
      '<p><b>Funciones del PJN:</b> el menú de la barra azul lleva, en una pestaña nueva, a las listas del PJN, a Radicaciones, a la consulta pública, a los datos personales y a las otras aplicaciones: Escritos, DEOX, Notificaciones, IWECS, Autorizados y Mis eventos del Portal. Por causa: abrir en esta pestaña o en una nueva, libro digital y presentar escrito.</p>' +
      '<h3>¿Algo dejó de funcionar?</h3>' +
      '<p>SuPJN+ depende de cómo está armada la página del PJN. Si el PJN la cambia, algo puede dejar de funcionar. Este botón revisa, una por una y sin dejar notas ni cambiar nada, las piezas que SuPJN+ necesita (la tabla de causas, el paginador, el enlace para abrir, lo de dejar nota, Escritos, Notificaciones, DEOX, la Guía, la tabla de actuaciones y un PDF) y dice cuáles cambiaron.</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="diagnostico"' + (DIAG.estado === 'corriendo' ? ' disabled' : '') + '>' + (DIAG.estado === 'corriendo' ? 'Revisando...' : 'Revisar el PJN') + '</button></div>' +
      '<div data-e="diag">' + diagHTML() + '</div>' +
      '<h3>Registro de fallas de descarga</h3>' +
      '<p>Cuando una descarga no se completa, SuPJN+ anota las circunstancias: de qué expediente y de qué actuación se trata, qué respondió el servidor del PJN y cuántos intentos hicieron falta. Sirve para distinguir una actuación sin documento, que es normal, de un problema del PJN o de la conexión.</p>' +
      '<div data-e="fallas">' + fallasHTML() + '</div>' +
      '<h3>Qué no hace</h3>' +
      '<p>No deja notas sin que lo confirmes, no presenta escritos, no cambia favoritos y no sube nada. En Escritos, Notificaciones y DEOX solo lee: no presenta, no archiva ni borra nada. Las anotaciones son notas privadas de trabajo: se llaman así para no confundirlas con dejar nota, que es el acto procesal.</p>' +
      '<h3>Autoría y licencia</h3>' +
      '<p>Creado por <b>' + esc(APP.autor) + '</b> con Claude. <a href="mailto:' + esc(APP.mail) + '">' + esc(APP.mail) + '</a></p>' +
      '<p>Copyleft, ' + esc(APP.licencia) + '. Copyright (C) ' + esc(APP.anio) + ' ' + esc(APP.autor) + '. Software libre: se permite y se alienta su uso, copia, modificación y distribución gratuita, siempre que las obras derivadas conserven esta misma licencia. Sin garantía. ' +
      '<a href="' + esc(APP.licenciaUrl) + '" target="_blank" rel="noopener noreferrer">Texto de la licencia</a> · ' +
      '<a href="' + esc(APP.github) + '" target="_blank" rel="noopener noreferrer">Repositorio en GitHub</a></p>' +
      '</div>';
  }

  // -------------------------------------------------------- 6.14 pintar todo

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
    } else if (esVistaBandeja(VISTA)) {
      pintarBandeja(VISTA);
    } else if (VISTA === 'guia') {
      pintarGuia();
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
    // Antes de cambiar de solapa se anota dónde quedaba esta.
    guardarLugar();
    VISTA = v;
    irALista(v);
    if (v === 'rel' || v === 'fav') { CFG.vista = v; guardarCfg(); }
    abierta = null;
    pintarTodo();
    const panel = q('[data-e="vPanel"]');
    if (panel) panel.scrollTop = 0;
    // La primera vez que se entra, se consulta sola. La Guía arranca por su índice.
    if (esVistaBandeja(v) && BAND[v].estado === 'nada') consultarBandeja(v);
    if (v === 'guia' && GUIA.estado === 'nada') guiaInicio();
  }

  // ----------------------------------------------------- 7.1 leer las listas

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
        if (!guardarEnCuenta(LISTAS[tipo].clave, r)) errores.push(LISTAS[tipo].nombre + (CUENTA ? ' se leyó pero no se pudo guardar en esta PC' : ' se leyó pero no se guardó: no se pudo identificar la cuenta del PJN'));
        pintarSolapas();
        if (VISTA === tipo) { pintarFiltros(); pintarTabla(); }
      } catch (e) {
        const msg = String(e && e.message ? e.message : e);
        if (msg === 'cancelado') { cortada = true; break; }
        errores.push(LISTAS[tipo].nombre + ': ' + mensajeDe(e));
        if (msg === VENCIDA) break;
      }
    }
    leyendo = false;
    cancelarLectura = false;
    // La primera vez no hay con qué comparar: esa lectura es la línea de partida.
    if (!hayFoto() && (DATOS.rel || DATOS.fav)) fotoVisto();
    if (errores.length) avisar('No se pudo leer todo. ' + errores.join('. ') + '. Queda lo que ya estaba leído.', true);
    else if (cortada) avisar('Lectura cancelada. Queda lo que ya estaba leído.');
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
    // Con las listas recién leídas no se relee nada, así que la línea de partida
    // de las novedades hay que ponerla igual: si no, el botón queda apagado hasta
    // que las listas envejezcan.
    if (!hayFoto() && (DATOS.rel || DATOS.fav)) fotoVisto();
    const viejas = ['rel', 'fav'].filter((t) => !DATOS[t] || Date.now() - DATOS[t].fecha > VIEJA_DESPUES_DE);
    if (viejas.length) actualizar(viejas);
  }

  // -------------------------------------------------- 7.2 acciones por causa

  let accionEnCurso = false;

  function ocupado() {
    if (bloqueoNota()) { avisar('Hay una tanda de dejar nota en curso: esperá a que termine.', true); return true; }
    if (DIAG.estado === 'corriendo') { avisar('Hay una revisión del PJN en curso: esperá a que termine, o cancelala en Acerca de.', true); return true; }
    if (accionEnCurso) { avisar('Esperá un momento: se está abriendo otra causa.', true); return true; }
    if (horasEnCurso) { avisar('Hay una consulta de horas en curso: esperá a que termine, o cancelala con el botón Cancelar.', true); return true; }
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
    // Abrirla es haberla mirado: deja de ser novedad.
    marcarVisto(k);
    const w = nueva ? pestanaNueva('_blank', k) : null;
    if (nueva && !w) return;
    accionEnCurso = true;
    try {
      const url = await direccionDe(k, 'ojo', (t) => avisar(t));
      if (w) { listaPestana(w); w.location.replace(url); avisar('Se abrió ' + k + ' en una pestaña nueva.'); }
      else { avisar('Abriendo ' + k + '...'); location.href = url; }
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
      avisar('Se abrió el libro digital de ' + k + ' en una pestaña nueva.');
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
        if (!form) throw new Error('no se encuentra el formulario del PJN');
        const lista = [];
        new u.fr.contentWindow.FormData(form).forEach((v, n) => { if (typeof v === 'string') lista.push([n, v]); });
        p.pares.forEach(([n, v]) => lista.push([n, v]));
        return { accion: form.action, campos: lista };
      });
      listaPestana(w);
      enviarEnPestana(w, accion, campos);
      avisar('Se abrió "Presentar escrito" de ' + k + ' en una pestaña nueva.');
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
    avisar('Durante una tanda de dejar nota no se descarga nada: esperá a que termine o cancelala.', true);
    return true;
  }

  function bajarCausas(claves) {
    if (sinBajarPorNota()) return;
    const n = encolarCausas(claves, 'todo');
    if (n < 0) return;                       // no entran: ya avisó por qué
    avisar(n ? plural(n, 'causa agregada', 'causas agregadas') + ' a Descargas. Se descargan de a una en segundo plano: podés seguir trabajando en esta pestaña.' : 'Esas causas ya estaban en Descargas.');
    pintarSolapas();
  }

  function elegirActuaciones(k) {
    if (sinBajarPorNota()) return;
    if (encolarCausas([k], 'elegir') < 0) return;
    irAVista('desc');
  }

  // Desde la lista, el botón lleva a la solapa Dejar nota, donde está la
  // advertencia; desde la solapa, el botón ya es el definitivo y arranca la
  // tanda. Así no hay un paso intermedio que solo sirva para volver a apretar,
  // y lo que hay que leer antes de dejar nota se lee antes y no después.
  // Cierra la solapa del expediente abierto: corta lo que estuviera leyendo y
  // vuelve a la lista. Reaparece al abrir otra causa o al recargar la página.
  function cerrarSolapaExp() {
    expCerrado = true;
    EXP.cortar = true;
    if (VISTA === 'exp') irAVista(CFG.vista === 'fav' ? 'fav' : 'rel');
    else pintarSolapas();
  }

  function pedirNota(solo) {
    if (bloqueoNota()) { avisar('Ya hay una tanda de dejar nota en curso.', true); return; }
    // La solapa lee la selección por su cuenta, así que no hace falta llevarla.
    if (VISTA !== 'nota') { irAVista('nota'); return; }
    const pausa = q('[data-e="pausa"]');
    if (pausa) { CFG.pausaNota = Math.max(300, parseInt(pausa.value, 10) || 700); guardarCfg(); }
    iniciarNota(solo);
  }

  // ----------------------------- 8. Escritos, Notificaciones, DEOX y la Guía
  //
  // Se leen por el puente (ver ESCRITOS, NOTIFICACIONES, DEOX Y GUÍA). Lo que
  // se trae queda solo en memoria mientras dure la página: no se guarda nada
  // en el equipo. Todo es de lectura: no se presenta, no se archiva ni se
  // borra nada.

  const EXT = {
    escr: { app: 'escritos', nombre: 'Escritos', origen: 'https://escritos.pjn.gov.ar', inicio: '/info-tecnica', web: 'https://escritos.pjn.gov.ar/' },
    notif: { app: 'notif', nombre: 'Notificaciones', origen: 'https://notif.pjn.gov.ar', inicio: '/info-tecnica', web: 'https://notif.pjn.gov.ar/' },
    deox: { app: 'deox', nombre: 'DEOX', origen: 'https://deox.pjn.gov.ar', inicio: '/info-tecnica', web: 'https://deox.pjn.gov.ar/deox/' },
    guia: { app: 'guia', nombre: 'Guía judicial', origen: 'https://www.pjn.gov.ar', inicio: '/guia', web: 'https://www.pjn.gov.ar/guia' }
  };
  const VISTA_DE_APP = { escritos: 'escr', notif: 'notif', deox: 'deox', guia: 'guia' };
  const esVistaBandeja = (v) => v === 'escr' || v === 'notif' || v === 'deox';
  const ESPERA_PUENTE = 30000;    // lo que puede tardar la aplicación en entrar con el SSO
  const ESPERA_PEDIDO = 45000;    // sin noticias del puente en este lapso, el pedido se da por perdido
  const TOPE_BANDEJA = 2000;      // elementos como máximo por consulta
  const POR_PAGINA_BANDEJA = 50;
  const POR_PAGINA_GUIA = 20;

  // ----------------------------------- 8.1 el puente, del lado de la ventana

  const PUENTES = {};             // por aplicación: { fr, listo, cuit, alListo, rechazar }
  const PEDIDOS = new Map();
  let nPedido = 0;

  function cerrarPuente(app) {
    const P = PUENTES[app];
    delete PUENTES[app];
    if (P) {
      if (P.rechazar) P.rechazar(new Error('marco'));
      if (P.fr) P.fr.remove();
    }
    PEDIDOS.forEach((pd, id) => {
      if (pd.app !== app) return;
      clearTimeout(pd.timer);
      PEDIDOS.delete(id);
      pd.reject(new Error('marco'));
    });
  }

  function abrirPuente(app) {
    if (PUENTES[app]) return PUENTES[app].listo;
    const E = EXT[VISTA_DE_APP[app]];
    const P = PUENTES[app] = { fr: null, cuit: '', alListo: null, rechazar: null, listo: null };
    P.listo = new Promise((resolve, reject) => {
      const fr = document.createElement('iframe');
      fr.name = NOMBRE_MARCO + app;
      fr.setAttribute('aria-hidden', 'true');
      fr.tabIndex = -1;
      fr.className = 'supjn-marco';
      fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1024px;height:768px;border:0;visibility:hidden;pointer-events:none';
      const t = setTimeout(() => {
        P.rechazar = null;
        if (PUENTES[app] === P) cerrarPuente(app);
        reject(new Error('no abre'));
      }, ESPERA_PUENTE);
      P.alListo = () => { clearTimeout(t); P.alListo = null; P.rechazar = null; resolve(P); };
      P.rechazar = (err) => { clearTimeout(t); P.alListo = null; P.rechazar = null; reject(err); };
      P.fr = fr;
      fr.src = E.origen + E.inicio;
      document.body.appendChild(fr);
    });
    return P.listo;
  }

  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.supjn !== 'puente' || typeof m.app !== 'string') return;
    const P = PUENTES[m.app];
    const E = EXT[VISTA_DE_APP[m.app]];
    if (!P || !E || !P.fr || e.origin !== E.origen || e.source !== P.fr.contentWindow) return;
    if (m.tipo === 'listo') {
      // Si la aplicación vuelve a entrar (por ejemplo, con otra cuenta), vale la última.
      P.cuit = String(m.cuit || '');
      if (P.alListo) P.alListo();
      return;
    }
    const pd = PEDIDOS.get(m.id);
    if (!pd || pd.app !== m.app) return;
    if (m.tipo === 'avance') {
      armarEspera(m.id, pd);
      if (pd.avance) pd.avance(m.van, m.total);
      return;
    }
    if (m.tipo === 'respuesta') {
      clearTimeout(pd.timer);
      PEDIDOS.delete(m.id);
      if (m.ok) pd.resolve(m.res); else pd.reject(new Error(String(m.error || 'error')));
    }
  });

  function armarEspera(id, pd) {
    clearTimeout(pd.timer);
    pd.timer = setTimeout(() => { PEDIDOS.delete(id); pd.reject(new Error('sin respuesta')); }, ESPERA_PEDIDO);
  }

  function enviarPedido(app, P, datos, avance) {
    return new Promise((resolve, reject) => {
      const id = 'p' + (++nPedido) + '.' + Date.now().toString(36);
      const pd = { app, resolve, reject, avance, timer: 0 };
      PEDIDOS.set(id, pd);
      armarEspera(id, pd);
      try {
        P.fr.contentWindow.postMessage(Object.assign({}, datos, { supjn: 'pedido', app, id }), EXT[VISTA_DE_APP[app]].origen);
      } catch (e) {
        clearTimeout(pd.timer);
        PEDIDOS.delete(id);
        reject(new Error('marco'));
      }
    });
  }

  // Los datos de dos cuentas no se mezclan: lo que responde el marco tiene que
  // ser de la misma cuenta con la que se entró a la Consulta Web.
  function cuentaDelPuente(app, P) {
    if (app === 'guia') return;
    if (!CUENTA) throw new Error('sin cuenta');
    if (!P.cuit) throw new Error('cuenta desconocida');
    if (P.cuit !== CUENTA) throw new Error('otra cuenta:' + P.cuit);
  }

  function errorPuente(app, e) {
    const n = EXT[VISTA_DE_APP[app]].nombre;
    const m = String(e && e.message ? e.message : e);
    if (m === 'sesion') return n + ' no tiene una sesión activa. Abrilo desde Funciones del PJN (se abre en una pestaña nueva), entrá si lo pide y probá de nuevo.';
    if (m === 'no abre' || m === 'sin respuesta' || m === 'marco') return n + ' no respondió en segundo plano. Puede que la sesión del PJN haya vencido o que el sistema esté lento: abrilo desde Funciones del PJN para comprobarlo y probá de nuevo.';
    if (m === 'sin cuenta') return 'No se pudo identificar con qué cuenta se entró a la Consulta Web, y sin ese dato no se muestra nada de ' + n + '. Recargá la página.';
    if (m === 'cuenta desconocida') return 'No se pudo comprobar con qué cuenta entró ' + n + ', así que no se muestra nada: los datos de dos cuentas no deben mezclarse.';
    if (m.indexOf('otra cuenta:') === 0) return n + ' está abierto con otra cuenta (' + cuentaCorta(m.slice(12)) + ') y no con la de esta Consulta Web (' + cuentaCorta() + '). No se muestra nada: cerrá la sesión del PJN y volvé a entrar con una sola cuenta.';
    // Un error del sistema del PJN se informa con su código; el detalle, solo
    // si viene en castellano.
    const sis = /^(el sistema respondió con error \d+)( \((.*)\))?$/.exec(m);
    if (sis) return n + ': ' + sis[1] + (sis[3] && !INGLES.test(sis[3]) ? ' (' + sis[3] + ')' : '') + '.';
    return n + ': ' + mensajeDe(e) + '.';
  }

  async function pedirPuente(app, datos, avance) {
    // Sin la cuenta de la Consulta Web no hay con qué comparar: ni se abre el marco.
    if (app !== 'guia' && !CUENTA) throw new Error(errorPuente(app, new Error('sin cuenta')));
    for (let intento = 0; ; intento++) {
      try {
        const P = await abrirPuente(app);
        cuentaDelPuente(app, P);
        return await enviarPedido(app, P, datos, avance);
      } catch (e) {
        const m = String(e && e.message ? e.message : e);
        // Una sesión vencida o un marco perdido se reintentan una vez, con un
        // marco nuevo: la aplicación vuelve a entrar con el SSO.
        if (intento === 0 && /^(sesion|marco|sin respuesta)$/.test(m)) { cerrarPuente(app); continue; }
        throw new Error(errorPuente(app, e));
      }
    }
  }

  // ------------------------------------------------------- 8.2 datos comunes

  // Las otras aplicaciones piden la cámara por su número interno, que se lee
  // de cada una la primera vez.
  const CAMARAS = {};
  async function numeroCamara(app, sigla) {
    if (!CAMARAS[app]) {
      const lista = await pedirPuente(app, { op: 'json', ruta: '/api/camaras' });
      const m = {};
      (Array.isArray(lista) ? lista : []).forEach((c) => { if (c && c.codigo != null && c.id != null) m[String(c.codigo).toUpperCase()] = c.id; });
      if (!Object.keys(m).length) throw new Error(EXT[VISTA_DE_APP[app]].nombre + ' no informó la lista de cámaras');
      CAMARAS[app] = m;
    }
    const n = CAMARAS[app][sigla];
    if (n == null) throw new Error(EXT[VISTA_DE_APP[app]].nombre + ' no reconoce la cámara ' + sigla);
    return n;
  }

  // "CCC 046311/2025/TO01" -> { sigla: 'CCC', num: 46311, anio: 2025 }
  function partesExp(exp) {
    const m = /^([A-Z]{2,4})\s+0*(\d+)\/(\d{4})/.exec(clave(exp));
    return m ? { sigla: m[1], num: parseInt(m[2], 10), anio: parseInt(m[3], 10) } : null;
  }

  // La Consulta Web escribe el número con ceros adelante y las otras
  // aplicaciones sin ellos: para compararlos, se los saca.
  const expComparable = (exp) => clave(exp).replace(/^([A-Z]{2,4})\s+0*(\d)/, '$1 $2');
  const COMPARABLES = { rel: null, fav: null, mapa: null };
  function claveEnListas(exp) {
    if (!exp) return '';
    if (COMPARABLES.rel !== INDICE.rel || COMPARABLES.fav !== INDICE.fav || !COMPARABLES.mapa) {
      const mapa = new Map();
      ['rel', 'fav'].forEach((t) => INDICE[t].forEach((c, k) => { const x = expComparable(k); if (!mapa.has(x)) mapa.set(x, k); }));
      Object.assign(COMPARABLES, { rel: INDICE.rel, fav: INDICE.fav, mapa });
    }
    return COMPARABLES.mapa.get(expComparable(exp)) || '';
  }

  const fechaAPI = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + m[2] + m[1] : ''; };
  // "2026-09-15T11:58:07.000-0300": el huso sin dos puntos no lo entienden
  // todos los navegadores.
  const msDe = (t) => {
    if (!t) return 0;
    const n = Date.parse(String(t).replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
    return isNaN(n) ? 0 : n;
  };
  const isoHace = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
  };
  const isoDeMs = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); };
  const textoBusq = (...xs) => norm(xs.filter((x) => x != null && x !== '').join(' '));
  const expArchivo = (exp) => clave(exp).replace(/[\s/]+/g, '-') || 'sin-expediente';
  const urlExpediente = (eid) => ORIGEN_SCW + '/scw/consultaNovedad.seam?identificacion=' + encodeURIComponent(CUENTA) + '&eid=' + encodeURIComponent(eid);

  // --------------------------------------------------- 8.3 las tres bandejas

  // Los nombres, como los muestra cada aplicación del PJN.
  const ESTADO_ESCRITO = {
    ENVIADO_A_DEPENDENCIA: 'En dependencia', ENVIADO_ARCHIVADO: 'Archivado', ENVIADO_BORRADO: 'Borrado',
    ENVIADO_GESTIONADO: 'Gestionado', PENDIENTE: 'Pendiente', ENVIADO_A_AUTORIZADOR: 'Enviado a autorizador', DESCONOCIDO: 'Desconocido'
  };
  const DEOX_ART_400 = 4;
  const DEOX_OFICIO_3003 = 6;
  const TIPO_DEOX = { 2: 'DEOX', 3: 'Autónomo', 4: 'Artículo 400', 6: 'Oficio 3003' };

  function tipoDeox(x) {
    if (x.idDeoExpOrigen) return 'Responde a DEO N° ' + x.idDeoExpOrigen;
    return TIPO_DEOX[x.idTipoDeo] || 'Oficio';
  }
  function destinoDeox(x) {
    if (x.idTipoDeo !== DEOX_ART_400 && x.idTipoDeo !== DEOX_OFICIO_3003) return limpio(x.oficinaDestino && x.oficinaDestino.descripcion);
    return limpio(x.cuio ? x.descripcionOrganismo : (x.oficinaDeox && x.oficinaDeox.descripcion));
  }
  // La misma regla que usa DEOX para su columna Estado.
  function estadoDeox(x) {
    if (x.cerrado && x.fechaDesestimado) return 'Cerrado';
    if (x.fechaRespuesta && x.cerrado && !x.fechaDesestimado) return 'Incorporado';
    if (x.fechaRespuesta && !x.cerrado) return 'Respondido';
    if (x.fechaEnvio && (x.cuio || x.oficinaDeox) && x.cuioOrigen && !x.esRespuesta && !x.fechaRespuesta && !x.cerrado) return 'Enviado';
    return '';
  }

  function filaEscrito(x, bandeja) {
    if (!x || x.id == null) return null;
    const ex = x.expediente || {};
    const exp = limpio(ex.numeracion);
    const dep = limpio((x.oficina && x.oficina.descripcion) || ex.oficina);
    const estado = ESTADO_ESCRITO[x.estado] || limpio(String(x.estado || '').replace(/_/g, ' ').toLowerCase());
    return {
      id: String(x.id), bandeja, fecha: msDe(x.fechaIngreso || x.fechaEnvioJuzgado), exp, eid: ex.id, car: limpio(ex.caratula), dep,
      desc: limpio(x.descripcion), tipo: limpio(x.tipo), fojas: x.fojas, archivo: limpio(x.nombreArchivo), estado,
      acep: msDe(x.fechaAcepJuzgado),
      busq: textoBusq(exp, ex.caratula, dep, x.descripcion, x.tipo, estado, x.nombreArchivo, x.nombreAutor)
    };
  }

  function filaNotif(x, bandeja) {
    if (!x || x.id == null) return null;
    const ex = x.expediente || {};
    const exp = limpio(ex.numeracion);
    const emisor = limpio(x.nombreAutor || (x.oficina && x.oficina.descripcion));
    const dest = (Array.isArray(x.destinatarios) ? x.destinatarios : []).map((d) => limpio(d && d.nombre)).filter(Boolean).join(' / ');
    const num = x.numeroCedula != null ? String(x.numeroCedula) : '';
    return {
      id: String(x.id), bandeja, fecha: msDe(x.fecha), num, exp, eid: ex.id, car: limpio(ex.caratula), dep: limpio(ex.oficina), emisor, dest,
      busq: textoBusq(num, exp, ex.caratula, ex.oficina, emisor, dest)
    };
  }

  function filaDeox(x, bandeja) {
    if (!x || x.id == null) return null;
    const ex = x.expedienteOrigen || x.expedienteRespuesta || {};
    const exp = limpio(ex.numeracion);
    const tipo = tipoDeox(x), destino = destinoDeox(x), estado = estadoDeox(x);
    const dep = limpio(x.oficinaDestino && x.oficinaDestino.descripcion);
    return {
      id: String(x.id), bandeja, fecha: msDe(x.fechaEnvio || x.fechaGeneracion), num: String(x.id), exp, eid: ex.id, car: limpio(ex.caratula),
      tipo, destino, dep, estado, resp: msDe(x.fechaRespuesta), motivo: limpio(x.motivo), urgente: !!x.urgente,
      busq: textoBusq(x.id, exp, ex.caratula, tipo, destino, dep, estado, x.motivo)
    };
  }

  const BANDEJAS = {
    escr: {
      ruta: '/api/escritos', dias: 60, unidad: ['escrito', 'escritos'], fila: filaEscrito,
      // Los filtros y los atajos de fechas de la barra. Encenderlos en otra
      // bandeja es agregar estas dos líneas en su definición.
      filtros: ['fuero', 'estado', 'dep', 'etiqueta'], rangos: true,
      opciones: [['ENVIADOS_A_DEPENDENCIA', 'Enviados a dependencia'], ['ENVIADOS_A_AUTORIZADOR', 'Enviados a autorizador'], ['ARCHIVADOS', 'Archivados']],
      cols: [{ k: 'fecha', t: 'Fecha', w: 12 }, { k: 'exp', t: 'Expediente', w: 27 }, { k: 'desc', t: 'Escrito', w: 24 }, { k: 'dep', t: 'Dependencia', w: 18 }, { k: 'estado', t: 'Estado', w: 11 }],
      pdf: (f) => '/api/escritos/' + f.id + '/pdf',
      archivo: (f) => 'Escrito-' + expArchivo(f.exp) + '-' + (f.fecha ? isoDeMs(f.fecha) : 'sin-fecha') + '-' + f.id + '.pdf'
    },
    notif: {
      ruta: '/api/notificaciones', dias: 30, unidad: ['notificación', 'notificaciones'], fila: filaNotif,
      opciones: [['RECIBIDAS', 'Recibidas'], ['ENVIADAS_A_DESTINATARIO', 'Enviadas']],
      cols: [{ k: 'fecha', t: 'Fecha', w: 12 }, { k: 'num', t: 'Cédula', w: 11 }, { k: 'exp', t: 'Expediente', w: 33 }, { k: 'emisor', t: 'Emisor', w: 22 }, { k: 'dest', t: 'Destinatarios', w: 15 }],
      pdf: (f) => '/api/notificaciones/' + f.bandeja + '/' + f.id + '/pdf',
      archivo: (f) => 'Cedula-' + (f.num || f.id) + '-' + expArchivo(f.exp) + '.pdf'
    },
    deox: {
      // Los DEOX son pocos: de manera predeterminada, el último año. La bandeja
      // "enviados a dependencia" es de los organismos, no de los letrados.
      ruta: '/api/deox', dias: 365, unidad: ['oficio', 'oficios'], fila: filaDeox,
      opciones: [['ENVIADOS_A_ORGANISMO', 'Enviados']],
      cols: [{ k: 'fecha', t: 'Envío', w: 12 }, { k: 'num', t: 'Nro.', w: 9 }, { k: 'tipo', t: 'Tipo y motivo', w: 22 }, { k: 'exp', t: 'Expediente', w: 23 }, { k: 'destino', t: 'Destino', w: 16 }, { k: 'estado', t: 'Estado', w: 11 }],
      pdf: (f) => '/api/deox/' + f.bandeja + '/' + f.id + '/pdf',
      archivo: (f) => 'DEOX-' + f.id + '-' + expArchivo(f.exp) + '.pdf'
    }
  };

  const BAND = {};
  Object.keys(BANDEJAS).forEach((v) => {
    BAND[v] = {
      bandeja: BANDEJAS[v].opciones[0][0], desde: isoHace(BANDEJAS[v].dias), hasta: hoyISO(), texto: '', filtros: {}, causa: null,
      estado: 'nada', txt: '', filas: [], total: 0, leidas: 0, fecha: 0, rango: '', orden: { col: 'fecha', desc: true }, pagina: 1, gen: 0
    };
  });

  async function consultarBandeja(v) {
    const B = BAND[v], D = BANDEJAS[v], E = EXT[v];
    const gen = ++B.gen;
    B.estado = 'leyendo';
    B.txt = 'Consultando ' + E.nombre + '...';
    pintarBandeja(v);
    pintarSolapas();
    try {
      const bandeja = B.bandeja;
      let ruta = D.ruta + '?bandeja=' + bandeja;
      let rango;
      if (B.causa) {
        const cam = await numeroCamara(E.app, B.causa.sigla);
        ruta += '&camaraExpediente=' + cam + '&anioExpediente=' + B.causa.anio + '&numeroExpediente=' + B.causa.num;
        rango = 'de ' + B.causa.exp + ', de cualquier fecha';
      } else {
        const d = fechaAPI(B.desde), h = fechaAPI(B.hasta);
        if (!d || !h) throw new Error('Poné las dos fechas, desde y hasta');
        if (B.desde > B.hasta) throw new Error('La fecha "desde" es posterior a la fecha "hasta"');
        ruta += '&fechaDesde=' + d + '&fechaHasta=' + h;
        rango = 'del ' + fechaPareja(isoACorta(B.desde) + '/' + B.desde.slice(0, 4)) + ' al ' + fechaPareja(isoACorta(B.hasta) + '/' + B.hasta.slice(0, 4));
      }
      const r = await pedirPuente(E.app, { op: 'lista', ruta, tope: TOPE_BANDEJA }, (van, total) => {
        if (gen !== B.gen) return;
        B.txt = 'Leyendo ' + E.nombre + ': ' + van + (total != null ? ' de ' + total : '') + '...';
        pintarEstadoBandeja(v);
      });
      if (gen !== B.gen) return;
      const items = r && Array.isArray(r.items) ? r.items : [];
      B.filas = items.map((x) => D.fila(x, bandeja)).filter(Boolean);
      // Lo elegido en un filtro que ya no aparece en lo nuevo se quita: si no,
      // quedaría una lista vacía sin la opción a la vista para cambiarla.
      filtrosPuestos(v).forEach((k) => {
        if (!opcionesFiltro(v, k).some(([x]) => x === B.filtros[k])) B.filtros[k] = '';
      });
      B.total = typeof r.total === 'number' ? r.total : items.length;
      B.leidas = items.length;
      B.fecha = Date.now();
      B.rango = rango;
      B.estado = 'listo';
      B.pagina = 1;
      B.txt = '';
    } catch (e) {
      if (gen !== B.gen) return;
      B.estado = 'error';
      B.txt = mensajeDe(e);
    }
    pintarBandeja(v);
    pintarSolapas();
  }

  // Desde una causa: la bandeja, solo con lo de esa causa y de cualquier fecha.
  function bandejaDeCausa(v, k) {
    const px = partesExp(k);
    if (!px) { avisar('No se reconoce el número de expediente ' + k + '.', true); return; }
    const B = BAND[v];
    B.causa = { exp: clave(k), sigla: px.sigla, num: px.num, anio: px.anio };
    B.texto = '';
    B.filtros = {};
    B.estado = 'nada';
    B.filas = [];
    irAVista(v);
  }

  function valorBandeja(f, k) {
    if (k === 'fecha') return f.fecha || 0;
    if (k === 'exp') return ordenExp(f.exp);
    if (k === 'num') return parseInt(f.num, 10) || 0;
    return norm(f[k]);
  }

  // Los filtros de la barra trabajan sobre lo ya consultado y no le piden nada
  // más al PJN. Cada uno dice qué valores tiene una fila y cómo se rotula cada
  // valor; las opciones que se ofrecen son siempre las que aparecen en lo
  // consultado, para no ofrecer filtros que no dejarían nada a la vista.
  const FILTROS_BANDEJA = {
    fuero: {
      todos: 'Todos los fueros', sin: 'Sin sigla de fuero', ayuda: 'Filtrar por fuero',
      valores: (f) => [fueroDe(f.exp)].filter(Boolean),
      // La sigla y el nombre que el propio PJN pone en su desplegable de cámara.
      texto: (x) => x + (NOMBRES_FUERO[x] ? ' · ' + NOMBRES_FUERO[x] : '')
    },
    estado: {
      todos: 'Todos los estados', sin: '', ayuda: 'Filtrar por estado',
      valores: (f) => [f.estado].filter(Boolean),
      texto: (x) => x
    },
    dep: {
      todos: 'Todas las dependencias', sin: 'Sin dependencia', ayuda: 'Filtrar por dependencia',
      valores: (f) => [f.dep].filter(Boolean),
      texto: (x) => x
    },
    etiqueta: {
      todos: 'Todas las etiquetas', sin: 'Sin etiqueta', ayuda: 'Filtrar por la etiqueta de la causa',
      // Las etiquetas son las de la causa en Mis causas o en Favoritos: un
      // elemento de una causa que no está en las listas no tiene ninguna.
      valores: (f) => etiquetasDe(claveEnListas(f.exp)).map((e) => e.id),
      texto: (x) => { const e = etiquetaDe(x); return e ? e.nom : x; }
    }
  };

  function opcionesFiltro(v, k) {
    const F = FILTROS_BANDEJA[k];
    const vistos = new Set();
    let sin = false;
    BAND[v].filas.forEach((f) => {
      const xs = F.valores(f);
      if (!xs.length) sin = true;
      xs.forEach((x) => vistos.add(x));
    });
    return [['', F.todos]]
      .concat([...vistos].sort((a, b) => F.texto(a).localeCompare(F.texto(b), 'es')).map((x) => [x, F.texto(x)]))
      .concat(sin && F.sin ? [['@sin', F.sin]] : []);
  }

  function pasaFiltro(f, k, valor) {
    const xs = FILTROS_BANDEJA[k].valores(f);
    return valor === '@sin' ? !xs.length : xs.indexOf(valor) >= 0;
  }

  // Los filtros de esa bandeja que están puestos en algo.
  const filtrosPuestos = (v) => (BANDEJAS[v].filtros || []).filter((k) => BAND[v].filtros[k]);

  function filasBandeja(v) {
    const B = BAND[v];
    const n = norm(B.texto);
    const puestos = filtrosPuestos(v);
    const L = B.filas.filter((f) => (!n || f.busq.indexOf(n) >= 0) && puestos.every((k) => pasaFiltro(f, k, B.filtros[k])));
    const { col, desc } = B.orden;
    L.sort((a, b) => {
      const x = valorBandeja(a, col), y = valorBandeja(b, col);
      let c = x < y ? -1 : x > y ? 1 : 0;
      if (desc) c = -c;
      return c || (b.fecha - a.fecha);
    });
    return L;
  }

  function ordenarBandeja(v, k) {
    const B = BAND[v];
    B.orden = B.orden.col === k ? { col: k, desc: !B.orden.desc } : { col: k, desc: k === 'fecha' };
    B.pagina = 1;
    pintarCuerpoBandeja(v);
  }

  function expCeldaHTML(f) {
    const k = claveEnListas(f.exp);
    return '<span class="sj-exp">' + esc(f.exp || '(sin expediente)') + '</span>' +
      (k ? ' ' + chipsDe(k) : '') +
      (f.car ? '<div class="sj-car">' + esc(f.car) + '</div>' : '');
  }

  // Una dependencia se puede buscar en la Guía con un clic. Solo lo que parece
  // una dependencia: en Enviadas, el emisor es el propio letrado.
  const RE_DEPENDENCIA = /juzgado|c[aá]mara|tribunal|sala|secretar|corte|oficina|fiscal|defensor|registro|archivo/i;
  const depGuiaHTML = (dep, sub) => (dep && RE_DEPENDENCIA.test(dep)
    ? '<button class="sj-vinculo" data-a="guiaDep" data-dep="' + esc(dep) + '" title="Ver sus datos en la Guía judicial">' + esc(dep) + '</button>' + (sub || '')
    : esc(dep || '') + (sub || ''));

  function celdaBandejaHTML(v, f, k) {
    if (k === 'fecha') return f.fecha ? '<span class="sj-exp">' + esc(fechaHora(f.fecha)) + '</span>' : '';
    // En las notificaciones, el juzgado de radicación va con el expediente.
    if (k === 'exp') return expCeldaHTML(f) + (v === 'notif' && f.dep && norm(f.dep) !== norm(f.emisor) ? '<div class="sj-sub">' + depGuiaHTML(f.dep) + '</div>' : '');
    if (k === 'num') return '<span class="sj-exp">' + esc(f.num) + '</span>';
    if (v === 'escr' && k === 'desc') {
      const sub = [f.tipo && f.tipo !== 'ESCRITO' ? f.tipo : '', f.fojas ? plural(f.fojas, 'foja', 'fojas') : '', f.archivo].filter(Boolean).join(' · ');
      return esc(f.desc) + (sub ? '<div class="sj-sub">' + esc(sub) + '</div>' : '');
    }
    if (v === 'escr' && k === 'dep') return depGuiaHTML(f.dep);
    if (v === 'escr' && k === 'estado') return esc(f.estado) + (f.acep ? '<div class="sj-sub">aceptado ' + esc(fechaHora(f.acep)) + '</div>' : '');
    if (v === 'notif' && k === 'emisor') return depGuiaHTML(f.emisor);
    if (v === 'deox' && k === 'tipo') {
      return esc(f.tipo) + (f.urgente ? '<span class="sj-urg">urgente</span>' : '') +
        (f.motivo ? '<div class="sj-nota-txt sj-sub" title="' + esc(f.motivo) + '">' + esc(f.motivo) + '</div>' : '');
    }
    if (v === 'deox' && k === 'destino') {
      return esc(f.destino) + (f.dep && norm(f.dep) !== norm(f.destino) ? '<div class="sj-sub">' + depGuiaHTML(f.dep) + '</div>' : '');
    }
    if (v === 'deox' && k === 'estado') return esc(f.estado) + (f.resp ? '<div class="sj-sub">respondido ' + esc(fechaHora(f.resp)) + '</div>' : '');
    return esc(f[k]);
  }

  function tablaBandejaHTML(v, L) {
    const B = BAND[v], D = BANDEJAS[v], E = EXT[v];
    if (B.estado === 'nada') return '<p class="sj-vacio">Elegí la bandeja y las fechas, y pulsá Consultar.</p>';
    if (B.estado !== 'listo') return '<p class="sj-vacio">' + esc(B.estado === 'leyendo' ? 'Consultando ' + E.nombre + '...' : 'No hay nada para mostrar.') + '</p>';
    if (!L.length) {
      return '<p class="sj-vacio">' + esc(B.filas.length
        ? (filtrosPuestos(v).length
          ? 'Ningún elemento coincide con los filtros' + (B.texto ? ' y la búsqueda.' : '.')
          : 'Ningún elemento coincide con la búsqueda.')
        : 'El PJN no tiene ' + D.unidad[1] + ' en esta bandeja ' + B.rango + '.') + '</p>';
    }
    const ini = (B.pagina - 1) * POR_PAGINA_BANDEJA;
    const pag = L.slice(ini, ini + POR_PAGINA_BANDEJA);
    const cols = D.cols;
    return '<table class="sj-t sj-tb"><colgroup>' + cols.map((c) => '<col style="width:' + c.w + '%">').join('') + '<col style="width:146px"></colgroup><thead><tr>' +
      cols.map((c) => '<th data-bo="' + c.k + '" data-v="' + v + '" class="' + (B.orden.col === c.k ? 'act' : '') + '" title="Ordenar por ' + esc(c.t.toLowerCase()) + '">' +
        '<span class="tt">' + esc(c.t) + '</span><span class="fl">' + (B.orden.col === c.k ? (B.orden.desc ? '▼' : '▲') : '↕') + '</span></th>').join('') +
      '<th class="fija"></th></tr></thead><tbody>' +
      pag.map((f) => '<tr>' + cols.map((c) => '<td>' + celdaBandejaHTML(v, f, c.k) + '</td>').join('') +
        '<td class="acc"><div class="sj-acc">' +
        '<button class="sj-abrir" data-a="bandVer" data-v="' + v + '" data-id="' + esc(f.id) + '" title="Ver el PDF en una pestaña nueva">Ver</button>' +
        '<button class="sj-mas" data-a="bandBajar" data-v="' + v + '" data-id="' + esc(f.id) + '" title="Descargar el PDF">⇩</button>' +
        (f.exp && partesExp(f.exp) ? '<button class="sj-mas" data-a="cedulaUna" data-k="' + esc(f.exp) + '" title="Dejar cédula en esta causa (Notificaciones, pestaña nueva)">✉</button>' : '') +
        (f.eid != null && CUENTA ? '<a class="sj-mas" href="' + esc(urlExpediente(f.eid)) + '" target="_blank" rel="noopener" title="Abrir el expediente en la Consulta Web, en una pestaña nueva">↗</a>' : '') +
        '</div></td></tr>').join('') +
      '</tbody></table>';
  }

  function estadoBandejaHTML(v, L) {
    const B = BAND[v], D = BANDEJAS[v];
    if (B.estado === 'leyendo') return '<span class="txt">' + esc(B.txt) + '</span><div class="sj-prog" style="flex:1 1 100%"><i style="width:35%"></i></div>';
    if (B.estado === 'error') return '<span class="txt" style="color:#b3261e">' + esc(B.txt) + '</span>';
    if (B.estado !== 'listo') return '<span class="txt">' + esc(B.causa ? 'Se van a consultar los ' + D.unidad[1] + ' de ' + B.causa.exp + '.' : 'Elegí la bandeja y las fechas, y pulsá Consultar.') + '</span>';
    const partes = [
      (B.texto || filtrosPuestos(v).length ? L.length + ' de ' : '') + plural(B.filas.length, D.unidad[0], D.unidad[1]) + ' ' + B.rango,
      'leído ' + hace(B.fecha)
    ];
    let h = '<span class="txt">' + esc(partes.join(' · ')) + '</span>';
    if (B.total > B.leidas) {
      h += '<span class="txt" style="color:#b3261e">El PJN informa ' + B.total + ' y se leyeron los primeros ' + B.leidas + ' que manda: acotá las fechas para ver el resto.</span>';
    }
    return h;
  }

  // Atajos de fechas de la barra: cada uno va desde esa fecha hasta hoy. Si las
  // fechas se escriben a mano, el desplegable queda en "Otras fechas".
  const RANGOS = [
    ['7', 'Últimos 7 días', () => isoHace(7)],
    ['30', 'Últimos 30 días', () => isoHace(30)],
    ['60', 'Últimos 60 días', () => isoHace(60)],
    ['anio', 'Este año', () => new Date().getFullYear() + '-01-01']
  ];
  const rangoActual = (B) => (B.hasta === hoyISO() ? ((RANGOS.find((r) => r[2]() === B.desde) || [''])[0]) : '');
  const opcionesRango = (B) => RANGOS.concat([['', 'Otras fechas']])
    .map(([k, t]) => '<option value="' + k + '"' + (k === rangoActual(B) ? ' selected' : '') + '>' + esc(t) + '</option>').join('');

  function pieBandejaHTML(v, L) {
    const B = BAND[v];
    if (B.estado !== 'listo' || !L.length) return '';
    const P = POR_PAGINA_BANDEJA;
    const pags = Math.max(1, Math.ceil(L.length / P));
    const ini = (B.pagina - 1) * P;
    let h = '<span>Mostrando ' + (ini + 1) + ' a ' + Math.min(L.length, ini + P) + ' de ' + L.length + '</span>';
    if (pags > 1) {
      const bt = (p, t, act, dis) => '<button data-bpag="' + p + '" data-v="' + v + '"' + (act ? ' class="act"' : '') + (dis ? ' disabled' : '') + '>' + t + '</button>';
      let nums = '';
      for (let p = Math.max(1, B.pagina - 2); p <= Math.min(pags, B.pagina + 2); p++) nums += bt(p, String(p), p === B.pagina, false);
      h += '<span class="der">' + bt(1, '«', false, B.pagina === 1) + bt(B.pagina - 1, '‹', false, B.pagina === 1) + nums +
        bt(B.pagina + 1, '›', false, B.pagina === pags) + bt(pags, '»', false, B.pagina === pags) + '</span>';
    }
    return h;
  }

  function panelBandejaHTML(v, L) {
    const B = BAND[v], D = BANDEJAS[v], E = EXT[v];
    return '<div class="sj-bandeja" data-band="' + v + '">' +
      '<div class="sj-barra">' +
      '<select data-bf="bandeja" title="Bandeja">' + D.opciones.map(([k, t]) => '<option value="' + k + '"' + (k === B.bandeja ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>' +
      (B.causa
        ? '<span class="sj-causa" title="Solo los de esta causa, de cualquier fecha (con sus incidentes)">Causa ' + esc(B.causa.exp) +
          '<button data-a="bandSinCausa" data-v="' + v + '" title="Quitar el filtro de la causa y volver a las fechas">×</button></span>'
        : (D.rangos ? '<select data-bf="rango" title="Atajos de fechas">' + opcionesRango(B) + '</select>' : '') +
          '<label>Desde <input type="date" data-bf="desde" value="' + esc(B.desde) + '"></label>' +
          '<label>hasta <input type="date" data-bf="hasta" value="' + esc(B.hasta) + '"></label>') +
      '<button class="sj-b prim" data-a="bandConsultar" data-v="' + v + '"' + (B.estado === 'leyendo' ? ' disabled' : '') + '>Consultar</button>' +
      // Los filtros no van cuando se mira una sola causa: ahí sobran.
      (B.causa ? '' : (D.filtros || []).map((k) => {
        const ops = opcionesFiltro(v, k);
        const hay = B.estado === 'listo' && ops.length > 1;
        return '<select data-bf="filtro" data-k="' + k + '" title="' + esc(FILTROS_BANDEJA[k].ayuda) + '"' + (hay ? '' : ' disabled') + '>' +
          ops.map(([x, t]) => '<option value="' + esc(x) + '"' + (x === (B.filtros[k] || '') ? ' selected' : '') + '>' + esc(t) + '</option>').join('') +
          '</select>';
      }).join('')) +
      '<input type="text" data-bf="texto" placeholder="Buscar en lo consultado" value="' + esc(B.texto) + '">' +
      '<span class="der">' +
      (v === 'notif' ? '<button class="sj-b prim" data-a="cedulaUna" data-k="' + esc(B.causa ? B.causa.exp : '') + '" title="' +
        (B.causa ? 'Abre Notificaciones en una pestaña nueva, con esta causa cargada' : 'Abre el formulario de Notificaciones en una pestaña nueva') + '">' +
        (B.causa ? 'Dejar cédula en esta causa' : 'Nueva cédula') + ' ↗</button>' : '') +
      '<a class="sj-b" href="' + esc(E.web) + '" target="_blank" rel="noopener noreferrer" title="Abrir ' + esc(E.nombre) + ' del PJN en una pestaña nueva">' + esc(E.nombre) + ' en el PJN ↗</a></span>' +
      '</div>' +
      '<div class="sj-est" data-e="bandEstado">' + estadoBandejaHTML(v, L) + '</div>' +
      '<div class="sj-cuerpo" data-e="bandCuerpo">' + tablaBandejaHTML(v, L) + '</div>' +
      '<div class="sj-pie" data-e="bandPie">' + pieBandejaHTML(v, L) + '</div>' +
      '</div>';
  }

  function paginaValida(v, L) {
    const B = BAND[v];
    const pags = Math.max(1, Math.ceil(L.length / POR_PAGINA_BANDEJA));
    if (!(B.pagina >= 1)) B.pagina = 1;
    if (B.pagina > pags) B.pagina = pags;
  }

  function pintarBandeja(v) {
    if (VISTA !== v || !win) return;
    const p = q('[data-e="vPanel"]');
    if (!p) return;
    const L = filasBandeja(v);
    paginaValida(v, L);
    const act = document.activeElement;
    const campo = act && act.dataset && act.dataset.bf === 'texto' && p.contains(act) ? act.selectionStart : null;
    p.innerHTML = panelBandejaHTML(v, L);
    if (campo != null) {
      const n = p.querySelector('[data-bf="texto"]');
      if (n) { n.focus(); try { n.setSelectionRange(campo, campo); } catch (x) { /* sin selección */ } }
    }
  }

  function pintarEstadoBandeja(v) {
    if (VISTA !== v || !win) return;
    const e = q('[data-e="bandEstado"]');
    if (e) e.innerHTML = estadoBandejaHTML(v, filasBandeja(v));
  }

  // Al filtrar o cambiar de página se redibuja la tabla y no la barra: así el
  // buscador no pierde el foco.
  function pintarCuerpoBandeja(v) {
    if (VISTA !== v || !win) return;
    const L = filasBandeja(v);
    paginaValida(v, L);
    const c = q('[data-e="bandCuerpo"]'), e = q('[data-e="bandEstado"]'), pie = q('[data-e="bandPie"]');
    if (!c) { pintarBandeja(v); return; }
    c.innerHTML = tablaBandejaHTML(v, L);
    if (e) e.innerHTML = estadoBandejaHTML(v, L);
    if (pie) pie.innerHTML = pieBandejaHTML(v, L);
  }

  // El PDF se trae por el puente. Para verlo se abre la pestaña antes de
  // pedirlo, porque Chrome bloquea las que se abren después de esperar.
  async function pdfBandeja(v, id, bajar) {
    const B = BAND[v], D = BANDEJAS[v], E = EXT[v];
    const f = B.filas.find((x) => x.id === String(id));
    if (!f) return;
    const w = bajar ? null : pestanaNueva('_blank', 'el PDF');
    if (!bajar && !w) return;
    avisar('Trayendo el PDF de ' + E.nombre + '...');
    try {
      const r = await pedirPuente(E.app, { op: 'pdf', ruta: D.pdf(f) });
      if (!r || !r.buf || typeof r.buf.byteLength !== 'number') throw new Error('no llegó el PDF');
      if (bajar) {
        guardarArchivo(r.buf, D.archivo(f));
        avisar('PDF descargado: ' + D.archivo(f) + '.');
        return;
      }
      // El blob no se suelta mientras dure la página: la pestaña lo sigue usando
      // si se la recarga o se guarda el PDF desde el visor.
      const url = URL.createObjectURL(new Blob([r.buf], { type: 'application/pdf' }));
      listaPestana(w);
      w.location.replace(url);
      avisar('');
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo traer el PDF. ' + mensajeDe(e), true);
    }
  }

  // ---------------------------------------------------- 8.4 la Guía judicial

  const GUIA = { modo: 'dep', texto: '', estado: 'nada', txt: '', vista: '', det: null, res: null, pila: [], resaltar: null, nota: '', gen: 0 };
  const guiaWeb = (cod) => EXT.guia.web + (cod && cod !== 'guia-inicio' ? '/' + encodeURIComponent(cod) : '');
  const rutaGuia = (cod) => '/api/dependencia/codigo/' + encodeURIComponent(cod);

  // Palabras que no sirven para buscar: la Guía escribe "Juzgado Criminal y
  // Correccional Nro. 11" donde las otras aplicaciones dicen "Juzgado Nacional
  // en lo Criminal y Correccional Nro. 11". La búsqueda del sitio no distingue
  // acentos y busca cada palabra por separado.
  const VACIAS_GUIA = new Set(['nacional', 'nacionales', 'en', 'lo', 'la', 'las', 'los', 'el', 'de', 'del', 'y', 'e', 'a',
    'nro', 'n', 'no', 'num', 'numero', 'capital', 'cap', 'primera', 'instancia', 'cargo', 'ciudad', 'autonoma', 'buenos', 'aires', 'caba']);
  const ROMANOS = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16 };

  // Palabras y números de un nombre. Después de "sala" o "vocalía", un número
  // romano vale como número: la Guía escribe "Sala V" y los expedientes "SALA 5".
  function tokensGuia(txt) {
    const pal = norm(txt).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
    const palabras = [], numeros = [];
    pal.forEach((w, i) => {
      if (/^\d+$/.test(w)) { numeros.push(parseInt(w, 10)); return; }
      const trasSala = i > 0 && /^(sala|vocalia)$/.test(pal[i - 1]);
      if (trasSala && ROMANOS[w]) { numeros.push(ROMANOS[w]); return; }
      // "Sala A", "Sala E": ahí la letra es el nombre de la sala y no se descarta.
      if (trasSala && w.length === 1) { palabras.push(w); return; }
      if (VACIAS_GUIA.has(w)) return;
      // "de la Capital Federal": la Guía escribe "Cap.Federal", y su búsqueda no
      // encuentra "federal" dentro de esa palabra. Ahí no se lo usa.
      if (w === 'federal' && i > 0 && /^(capital|cap)$/.test(pal[i - 1])) return;
      palabras.push(w);
    });
    return { palabras, numeros };
  }

  // -1 si el candidato no corresponde; si corresponde, cuántas palabras le
  // sobran (cuantas menos, mejor). Los números tienen que ser los mismos.
  function puntajeGuia(q, nombre) {
    const c = tokensGuia(nombre);
    if (q.numeros.join(',') !== c.numeros.join(',')) return -1;
    if (q.palabras.some((w) => !c.palabras.some((x) => x.indexOf(w) === 0))) return -1;
    return c.palabras.filter((x) => !q.palabras.some((w) => x.indexOf(w) === 0)).length;
  }

  // El mejor, solo si es uno: con un empate no se adivina.
  function mejorGuia(q, lista) {
    const v = (lista || [])
      .map((s) => ({ s, p: puntajeGuia(q, s && s.dependenciaInfo ? s.dependenciaInfo.nombre : '') }))
      .filter((x) => x.p >= 0)
      .sort((a, b) => a.p - b.p);
    if (!v.length) return { unico: null, validos: [] };
    return { unico: (v.length === 1 || v[0].p < v[1].p) ? v[0].s : null, validos: v.map((x) => x.s) };
  }

  const cuerpoGuia = (texto, pagina, tam) => ({ nombre: texto, tipo: 0, idParent: 0, page: pagina || 0, size: tam || POR_PAGINA_GUIA });

  function apilarGuia() {
    if (GUIA.vista === 'det' && GUIA.det) GUIA.pila.push({ cod: GUIA.det.dependencia.codigoUrl });
    else if (GUIA.vista === 'res' && GUIA.res) GUIA.pila.push({ res: true });
  }

  async function guiaAbrir(cod, apilar, resaltar) {
    if (!cod) return;
    const gen = ++GUIA.gen;
    GUIA.estado = 'leyendo';
    GUIA.txt = 'Consultando la Guía judicial...';
    pintarGuia();
    try {
      const d = await pedirPuente('guia', { op: 'json', ruta: rutaGuia(cod) });
      if (gen !== GUIA.gen) return;
      if (!d || !d.dependencia || !d.dependencia.dependenciaInfo) throw new Error('la Guía no tiene datos de esa dependencia');
      if (apilar) apilarGuia();
      GUIA.det = d;
      GUIA.vista = 'det';
      GUIA.resaltar = resaltar == null ? null : resaltar;
      GUIA.estado = 'listo';
      GUIA.txt = '';
    } catch (e) {
      if (gen !== GUIA.gen) return;
      GUIA.estado = 'error';
      GUIA.txt = mensajeDe(e);
    }
    pintarGuia();
  }

  function guiaVolver() {
    const x = GUIA.pila.pop();
    if (!x) return;
    GUIA.nota = '';
    if (x.res) {
      GUIA.vista = 'res';
      GUIA.estado = 'listo';
      GUIA.txt = '';
      pintarGuia();
      return;
    }
    guiaAbrir(x.cod, false);
  }

  function guiaInicio() {
    GUIA.pila = [];
    GUIA.res = null;
    GUIA.nota = '';
    guiaAbrir('guia-inicio', false);
  }

  // Con "pagina" se pasa de página en los resultados que están a la vista, con
  // su texto y su tipo, aunque en el buscador ya se haya escrito otra cosa.
  async function guiaBuscar(pagina) {
    const paginar = pagina != null && GUIA.res && GUIA.vista === 'res';
    const t = paginar ? GUIA.res.texto : limpio(GUIA.texto);
    if (t.length < 3) {
      GUIA.estado = 'error';
      GUIA.txt = 'Escribí al menos 3 letras para buscar.';
      pintarGuia();
      return;
    }
    const gen = ++GUIA.gen;
    GUIA.estado = 'leyendo';
    GUIA.txt = 'Buscando "' + t + '" en la Guía judicial...';
    pintarGuia();
    try {
      const modo = paginar ? GUIA.res.modo : GUIA.modo;
      const r = await pedirPuente('guia', { op: 'buscar', ruta: modo === 'per' ? '/api/persona/find' : '/api/dependencia/find', cuerpo: cuerpoGuia(t, pagina || 0) });
      if (gen !== GUIA.gen) return;
      GUIA.res = {
        modo, texto: t, lista: Array.isArray(r && r.content) ? r.content : [],
        total: (r && r.totalElements) || 0, pagina: (r && r.number) || 0, paginas: (r && r.totalPages) || 0, nota: ''
      };
      GUIA.vista = 'res';
      GUIA.pila = [];
      GUIA.nota = '';
      GUIA.estado = 'listo';
      GUIA.txt = '';
    } catch (e) {
      if (gen !== GUIA.gen) return;
      GUIA.estado = 'error';
      GUIA.txt = mensajeDe(e);
    }
    pintarGuia();
  }

  // Busca, entre las dependencias que cuelgan de d, la que nombra el
  // expediente después del guion ("SECRETARÍA NRO. 133", "SALA 5"). Mira
  // también un nivel más abajo, porque las cámaras agrupan las salas.
  async function subGuia(d, q, gen) {
    const subs = (d && d.subDependencias) || [];
    const directa = mejorGuia(q, subs).unico;
    if (directa) return { directa: true, sub: directa };
    // Los juzgados con una sola secretaría la tienen en la Guía como "Secretaría
    // Única", sin número: si es la única de su clase, es esa.
    const clase = subs.filter((s) => s && s.dependenciaInfo &&
      tokensGuia(s.dependenciaInfo.nombre).palabras.some((x) => q.palabras.length && x.indexOf(q.palabras[0]) === 0));
    if (clase.length === 1 && /\bunica\b/.test(norm(clase[0].dependenciaInfo.nombre))) return { directa: true, sub: clase[0], unica: true };
    const grupos = subs.filter((s) => s && s.dependenciaInfo && s.codigoUrl &&
      tokensGuia(s.dependenciaInfo.nombre).palabras.some((x) => q.palabras.some((w) => x.indexOf(w) === 0))).slice(0, 3);
    for (const g of grupos) {
      if (gen !== GUIA.gen) return null;
      const dg = await pedirPuente('guia', { op: 'json', ruta: rutaGuia(g.codigoUrl) });
      const s = mejorGuia(q, (dg && dg.subDependencias) || []).unico;
      if (s) return { directa: false, sub: s, grupo: g };
    }
    return null;
  }

  // La dependencia de una causa, en la Guía. Si hay una sola que corresponde,
  // se la abre; si no, se muestran las posibles para que se elija.
  async function guiaDeDependencia(dep, k) {
    const partes = String(dep || '').split(/\s*-\s*/).map(limpio).filter(Boolean);
    const principal = partes[0] || '';
    const resto = partes.slice(1).join(' ');
    const qp = tokensGuia(principal);
    if (!qp.palabras.length) { avisar('No se sabe qué dependencia buscar en la Guía' + (k ? ' para ' + k : '') + '.', true); return; }
    const consulta = qp.palabras.concat(qp.numeros.map(String)).join(' ');
    const gen = ++GUIA.gen;
    GUIA.modo = 'dep';
    GUIA.texto = consulta;
    GUIA.estado = 'leyendo';
    GUIA.txt = 'Buscando ' + dep + ' en la Guía judicial...';
    irAVista('guia');
    try {
      const r = await pedirPuente('guia', { op: 'buscar', ruta: '/api/dependencia/find', cuerpo: cuerpoGuia(consulta, 0, 50) });
      if (gen !== GUIA.gen) return;
      const lista = Array.isArray(r && r.content) ? r.content : [];
      const { unico, validos } = mejorGuia(qp, lista);
      const origen = (k ? k + ': ' : '') + dep;
      GUIA.res = {
        modo: 'dep', texto: consulta, lista: validos.length ? validos : lista, total: validos.length || (r && r.totalElements) || 0,
        pagina: 0, paginas: 0,
        nota: validos.length ? 'Hay más de una dependencia posible para ' + origen + '. Elegí la que corresponde.'
          : 'La Guía no tiene una dependencia que coincida exactamente con ' + origen + '. Estos son los resultados de la búsqueda "' + consulta + '"' +
            ((r && r.totalElements) > lista.length ? ' (los primeros ' + lista.length + '; afiná la búsqueda para ver otros)' : '') + '.'
      };
      GUIA.pila = [];
      GUIA.nota = '';
      if (!unico) {
        GUIA.vista = 'res';
        GUIA.estado = 'listo';
        GUIA.txt = '';
        pintarGuia();
        return;
      }
      let d = await pedirPuente('guia', { op: 'json', ruta: rutaGuia(unico.codigoUrl) });
      if (gen !== GUIA.gen) return;
      if (!d || !d.dependencia || !d.dependencia.dependenciaInfo) throw new Error('la Guía no tiene datos de esa dependencia');
      let resaltar = null;
      let nota = 'Dependencia de ' + origen + '.';
      const pila = [{ res: true }];
      if (resto) {
        const h = await subGuia(d, tokensGuia(resto), gen);
        if (gen !== GUIA.gen) return;
        if (h && h.directa) {
          resaltar = h.sub.id;
          if (h.unica) nota += ' La Guía no registra "' + resto + '" con su número: el juzgado tiene una sola, "' + limpio(h.sub.dependenciaInfo.nombre) + '", que es la resaltada.';
        } else if (h) {
          pila.push({ cod: d.dependencia.codigoUrl });
          if (h.grupo && h.grupo.codigoUrl) pila.push({ cod: h.grupo.codigoUrl });
          d = await pedirPuente('guia', { op: 'json', ruta: rutaGuia(h.sub.codigoUrl) });
          if (gen !== GUIA.gen) return;
          if (!d || !d.dependencia || !d.dependencia.dependenciaInfo) throw new Error('la Guía no tiene datos de esa dependencia');
        } else {
          nota += ' No se encontró en la Guía "' + resto + '": se muestra la dependencia principal.';
        }
      }
      GUIA.det = d;
      GUIA.vista = 'det';
      GUIA.pila = pila;
      GUIA.resaltar = resaltar;
      GUIA.nota = nota;
      GUIA.estado = 'listo';
      GUIA.txt = '';
    } catch (e) {
      if (gen !== GUIA.gen) return;
      GUIA.estado = 'error';
      GUIA.txt = mensajeDe(e);
    }
    pintarGuia();
  }

  // Lo que muestra el sitio de cada dependencia: domicilio, teléfono, correo.
  function lineasDependencia(info, dep) {
    const out = [];
    const dom = info && info.domicilio;
    const piso = info && info.pisoOficinaDepartamento && info.pisoOficinaDepartamento !== '0' ? limpio(info.pisoOficinaDepartamento) : '';
    if (dom && dom.domicilio) out.push(limpio(dom.domicilio) + (piso ? ', ' + piso : '') + (dom.codigoPostal ? ' (' + limpio(dom.codigoPostal) + ')' : ''));
    const lugar = [dom && dom.localidad && dom.localidad.nombre, dom && dom.provincia && dom.provincia.nombre]
      .map(limpio).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', ');
    if (lugar) out.push(lugar);
    if (info && limpio(info.telefono)) out.push('Tel. ' + limpio(info.telefono) + (limpio(info.fax) ? ' · Fax ' + limpio(info.fax) : ''));
    else if (info && limpio(info.fax)) out.push('Fax ' + limpio(info.fax));
    if (info && limpio(info.email)) out.push(limpio(info.email));
    const amb = dep && dep.ambitoTerritorial;
    const ambTxt = Array.isArray(amb) ? amb.map((a) => limpio(a && (a.nombre || a.descripcion) ? (a.nombre || a.descripcion) : a)).filter(Boolean).join(', ') : limpio(amb);
    if (ambTxt) out.push('Ámbito territorial: ' + ambTxt);
    return out;
  }

  const correoHTML = (t) => (/^[^\s@]+@[^\s@]+$/.test(t) ? '<a href="mailto:' + esc(t) + '">' + esc(t) + '</a>' : esc(t));
  const lineasHTML = (ls) => ls.map((l) => '<p>' + (/@/.test(l) && !/\s/.test(l) ? correoHTML(l) : esc(l)) + '</p>').join('');

  // Nombre y contacto de una persona, con las mismas reglas de visibilidad que
  // el sitio: el teléfono y el correo propios solo si la Guía los publica.
  function personaGuia(dp) {
    const p = (dp && dp.persona) || {};
    const trat = limpio(p.personaTratamiento && p.personaTratamiento.nombre);
    const nombre = [limpio(p.apellido), limpio(p.nombre)].filter(Boolean).join(', ');
    let tel = '';
    if (dp && dp.visibleTelefono && limpio(dp.telefono)) tel = limpio(dp.telefono);
    else if (p.visibleTelefono === 1 && limpio(p.telefono)) tel = limpio(p.telefono);
    const mail = p.visibleEmail === 1 && limpio(p.email) ? limpio(p.email) : '';
    return {
      nombre: (trat ? trat + ' ' : '') + nombre,
      cargo: limpio(p.cargo && p.cargo.nombre),
      situacion: limpio(p.situacionCargo && p.situacionCargo.nombre),
      tel, mail
    };
  }

  function integrantesHTML(lista) {
    if (!lista || !lista.length) return '';
    return '<table class="sj-t"><thead><tr><th>Función</th><th>Nombre</th><th>Cargo</th><th>Contacto</th></tr></thead><tbody>' +
      lista.map((dp) => {
        const x = personaGuia(dp);
        const fun = limpio(dp.funcion && dp.funcion.nombre);
        const sit = limpio(dp.situacionFuncion && dp.situacionFuncion.nombre);
        return '<tr><td><b>' + esc(fun) + '</b>' + (sit && !/^normal$/i.test(sit) ? '<div class="sj-sub">' + esc(sit) + '</div>' : '') + '</td>' +
          '<td>' + esc(x.nombre) + '</td>' +
          '<td>' + esc(x.cargo) + (x.situacion ? '<div class="sj-sub">' + esc(x.situacion) + '</div>' : '') + '</td>' +
          '<td>' + [x.tel ? esc(x.tel) : '', x.mail ? correoHTML(x.mail) : ''].filter(Boolean).join('<br>') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function listaDependenciasHTML(lista, resaltar) {
    if (!lista || !lista.length) return '';
    return '<table class="sj-t"><thead><tr><th>Dependencia</th><th>Datos</th></tr></thead><tbody>' +
      lista.map((s) => {
        const info = (s && s.dependenciaInfo) || {};
        const res = resaltar != null && s.id === resaltar;
        return '<tr' + (res ? ' class="res" data-e="guiaResaltada"' : '') + '><td>' +
          (s.codigoUrl ? '<button class="sj-vinculo" data-a="guiaAbrir" data-cod="' + esc(s.codigoUrl) + '"><b>' + esc(info.nombre) + '</b></button>' : '<b>' + esc(info.nombre) + '</b>') +
          (res ? '<div class="sj-sub">la de la causa</div>' : '') + '</td>' +
          '<td>' + lineasDependencia(info, s).map((l) => (/@/.test(l) && !/\s/.test(l) ? correoHTML(l) : esc(l))).join('<br>') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function textoFichaGuia() {
    const d = GUIA.det;
    if (!d) return '';
    const info = d.dependencia.dependenciaInfo;
    const par = d.dependenciaParent && d.dependenciaParent.dependenciaInfo ? limpio(d.dependenciaParent.dependenciaInfo.nombre) : '';
    const out = [limpio(info.nombre)].concat(par ? [par] : [], lineasDependencia(info, d.dependencia));
    (d.integrantes || []).forEach((dp) => {
      const x = personaGuia(dp);
      out.push(limpio(dp.funcion && dp.funcion.nombre) + ': ' + x.nombre + (x.tel ? ' · Tel. ' + x.tel : '') + (x.mail ? ' · ' + x.mail : ''));
    });
    return out.join('\n');
  }

  function guiaCopiar() {
    const t = textoFichaGuia();
    if (!t) return;
    const aMano = () => {
      const a = document.createElement('textarea');
      a.value = t;
      a.style.cssText = 'position:fixed;left:-5000px;top:0';
      document.body.appendChild(a);
      a.select();
      let fue = false;
      try { fue = document.execCommand('copy'); } catch (x) { fue = false; }
      a.remove();
      avisar(fue ? 'Datos copiados.' : 'No se pudieron copiar los datos.', !fue);
    };
    try { window.navigator.clipboard.writeText(t).then(() => avisar('Datos copiados.'), aMano); } catch (x) { aMano(); }
  }

  function detalleGuiaHTML() {
    const d = GUIA.det;
    const dep = d.dependencia, info = dep.dependenciaInfo;
    const par = d.dependenciaParent;
    const raiz = dep.codigoUrl === 'guia-inicio';
    const nav = '<div class="sj-guia-nav">' +
      (GUIA.pila.length ? '<button class="sj-b chico" data-a="guiaVolver">← Volver</button>' : '') +
      (par && par.codigoUrl && par.dependenciaInfo && par.codigoUrl !== dep.codigoUrl
        ? '<button class="sj-b chico" data-a="guiaAbrir" data-cod="' + esc(par.codigoUrl) + '" title="Subir un nivel">↑ ' + esc(par.dependenciaInfo.nombre) + '</button>' : '') +
      '</div>';
    const lineas = lineasDependencia(info, dep);
    const ficha = raiz ? '<h3>Guía judicial del PJN</h3><p>Elegí una dependencia o buscá por nombre. Los datos los carga cada tribunal en la Guía del PJN.</p>'
      : '<div class="sj-guia-ficha"><h3>' + esc(info.nombre) + '</h3>' + lineasHTML(lineas) +
        '<div class="bts"><button class="sj-b chico" data-a="guiaCopiar">Copiar los datos</button>' +
        '<a class="sj-b chico" href="' + esc(guiaWeb(dep.codigoUrl)) + '" target="_blank" rel="noopener noreferrer">Ver en pjn.gov.ar ↗</a></div></div>';
    const integ = integrantesHTML(d.integrantes);
    const subs = listaDependenciasHTML(d.subDependencias, GUIA.resaltar);
    return '<div class="sj-sec">' + nav + ficha + '</div>' +
      (integ ? '<div class="sj-sec"><h4>Integrantes</h4>' + integ + '</div>' : '') +
      (subs ? '<div class="sj-sec"><h4>' + (raiz ? 'Índice' : 'Dependencias') + '</h4>' + subs + '</div>' : '');
  }

  function resultadosGuiaHTML() {
    const R = GUIA.res;
    let h = '<div class="sj-sec">' + (GUIA.pila.length ? '<div class="sj-guia-nav"><button class="sj-b chico" data-a="guiaVolver">← Volver</button></div>' : '') +
      (R.nota ? '<p class="sj-sol-txt">' + esc(R.nota) + '</p>' : '') +
      '<p class="sj-sol-txt">' + esc(R.lista.length ? plural(R.total, 'resultado', 'resultados') + ' para "' + R.texto + '".' : 'No hay resultados para "' + R.texto + '".') + '</p></div>';
    if (!R.lista.length) return h;
    if (R.modo === 'per') {
      h += '<div class="sj-sec"><table class="sj-t"><thead><tr><th>Nombre</th><th>Cargo</th><th>Dependencia</th><th>Contacto</th></tr></thead><tbody>' +
        R.lista.map((it) => {
          // El teléfono de la función, si lo hay, es el que publica el sitio.
          const dp0 = it.subDependencias && it.subDependencias[0] && it.subDependencias[0].dependenciaPersona;
          const x = personaGuia(dp0 ? Object.assign({}, dp0, { persona: it.persona || dp0.persona }) : { persona: it.persona });
          const deps = (it.subDependencias && it.subDependencias.length
            ? it.subDependencias.map((sd) => sd && sd.dependencia)
            : ((it.persona && it.persona.dependencias) || [])).filter((s) => s && s.dependenciaInfo);
          return '<tr><td><b>' + esc(x.nombre) + '</b></td><td>' + esc(x.cargo) + '</td><td>' +
            deps.map((s) => (s.codigoUrl ? '<button class="sj-vinculo" data-a="guiaAbrir" data-cod="' + esc(s.codigoUrl) + '">' + esc(s.dependenciaInfo.nombre) + '</button>' : esc(s.dependenciaInfo.nombre))).join('<br>') +
            '</td><td>' + [x.tel ? esc(x.tel) : '', x.mail ? correoHTML(x.mail) : ''].filter(Boolean).join('<br>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      h += '<div class="sj-sec">' + listaDependenciasHTML(R.lista, null) + '</div>';
    }
    if (R.paginas > 1) {
      h += '<div class="sj-pie"><span>Página ' + (R.pagina + 1) + ' de ' + R.paginas + '</span><span class="der">' +
        '<button data-a="guiaPag" data-p="' + (R.pagina - 1) + '"' + (R.pagina <= 0 ? ' disabled' : '') + '>‹ Anterior</button>' +
        '<button data-a="guiaPag" data-p="' + (R.pagina + 1) + '"' + (R.pagina + 1 >= R.paginas ? ' disabled' : '') + '>Siguiente ›</button></span></div>';
    }
    return h;
  }

  function guiaHTML() {
    const codActual = GUIA.vista === 'det' && GUIA.det ? GUIA.det.dependencia.codigoUrl : '';
    const barra = '<div class="sj-barra">' +
      '<select data-gf="modo" title="Qué buscar"><option value="dep"' + (GUIA.modo === 'dep' ? ' selected' : '') + '>Dependencias</option>' +
      '<option value="per"' + (GUIA.modo === 'per' ? ' selected' : '') + '>Magistrados y funcionarios</option></select>' +
      '<input type="text" data-gf="texto" placeholder="' + (GUIA.modo === 'per' ? 'Apellido' : 'Por ejemplo: civil 74, correccional 11, casación penal') + '" value="' + esc(GUIA.texto) + '">' +
      '<button class="sj-b prim" data-a="guiaBuscar"' + (GUIA.estado === 'leyendo' ? ' disabled' : '') + '>Buscar</button>' +
      '<button class="sj-b" data-a="guiaInicio" title="Volver al índice de la Guía">Índice</button>' +
      '<span class="der"><a class="sj-b" href="' + esc(guiaWeb(codActual)) + '" target="_blank" rel="noopener noreferrer" title="Abrir en el sitio del PJN, en una pestaña nueva">Guía en pjn.gov.ar ↗</a></span></div>';
    let cuerpo = '';
    if (GUIA.nota && GUIA.vista === 'det') cuerpo += '<div class="sj-info">' + esc(GUIA.nota) + '</div>';
    if (GUIA.estado === 'leyendo') cuerpo += '<div class="sj-sec"><div class="sj-sol-txt">' + esc(GUIA.txt) + '</div><div class="sj-prog"><i style="width:35%"></i></div></div>';
    else {
      if (GUIA.estado === 'error') cuerpo += '<div class="sj-sec"><div class="sj-sol-txt mal">' + esc(GUIA.txt) + '</div></div>';
      if (GUIA.vista === 'det' && GUIA.det) cuerpo += detalleGuiaHTML();
      else if (GUIA.vista === 'res' && GUIA.res) cuerpo += resultadosGuiaHTML();
    }
    return '<div class="sj-bandeja">' + barra + '<div class="sj-cuerpo sj-guia" data-e="guiaCuerpo">' + cuerpo + '</div></div>';
  }

  function pintarGuia() {
    if (VISTA !== 'guia' || !win) return;
    const p = q('[data-e="vPanel"]');
    if (!p) return;
    const act = document.activeElement;
    const campo = act && act.dataset && act.dataset.gf === 'texto' && p.contains(act) ? act.selectionStart : null;
    p.innerHTML = guiaHTML();
    if (campo != null) {
      const n = p.querySelector('[data-gf="texto"]');
      if (n) { n.focus(); try { n.setSelectionRange(campo, campo); } catch (x) { /* sin selección */ } }
    }
    const res = p.querySelector('[data-e="guiaResaltada"]');
    if (res) res.scrollIntoView({ block: 'nearest' });
  }

  // Dejar cédula: abre Notificaciones en una pestaña nueva con el expediente
  // cargado (ver "dejar cédula, en Notificaciones"). Sin expediente, abre el
  // formulario vacío.
  function dejarCedula(k) {
    const url = EXT.notif.origen + RUTA_CEDULA;
    if (!k) {
      const w0 = window.open(url, '_blank');
      if (!w0) avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true);
      return;
    }
    const px = partesExp(k);
    if (!px) { avisar('No se reconoce el número de expediente ' + k + '.', true); return; }
    if (!CUENTA) { avisar('No se pudo identificar con qué cuenta se entró a la Consulta Web, así que no se carga ningún expediente en Notificaciones. Recargá la página.', true); return; }
    const exp = clave(k);
    guardarAlmacen(K_CEDULA, { exp, sigla: px.sigla, num: px.num, anio: px.anio, cuenta: CUENTA, ts: Date.now() });
    const w = window.open(url, '_blank');
    if (!w) {
      guardarAlmacen(K_CEDULA, null);
      avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true);
      return;
    }
    avisar('Se abrió Notificaciones en una pestaña nueva, con ' + exp + ' cargado. La cédula se completa y se envía desde el formulario del PJN.');
  }

  // La dependencia de una causa: la de la lista o la del expediente abierto.
  function depDe(k) {
    const c = causaPorClave(k);
    if (c && c.dep) return c.dep;
    if (EXP.datos && EXP.datos.exp === k && EXP.datos.dep) return EXP.datos.dep;
    return '';
  }

  // ----------------------- 9.1 construir la ventana y atender lo que se toca

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
    // Pedido del autor: la ventana se abre siempre ocupando toda la pantalla.
    // Dentro de la misma sesión se la puede restaurar con su botón; la próxima
    // vez que se abra vuelve a maximizarse.
    if (!CFG.maxi) { CFG.maxi = true; guardarCfg(); }
    win.classList.add('maxi');
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
      // Con qué cuenta del PJN está trabajando: los datos de cada cuenta van
      // aparte y esto es lo que dice de quién es lo que se está viendo.
      '<span class="cta' + (CUENTA ? '' : ' sin') + '" data-e="cuenta"></span>' +
      '<span class="zm" data-e="zoom"><button data-a="zoomMenos" title="Alejar: entra más en la ventana">−</button>' +
      '<button class="pc" data-a="zoomCien" title="Volver al tamaño normal" data-e="zoomPc">100%</button>' +
      '<button data-a="zoomMas" title="Acercar: se ve más grande">+</button></span>' +
      '<span class="ctrl"><button data-a="min" title="Minimizar">−</button>' +
      '<button data-a="max" title="Maximizar o restaurar">□</button>' +
      '<button data-a="cerrar" class="x" title="Cerrar">×</button></span></div>' +
      '<div class="sj-solapas" data-e="solapas"></div>' +
      '<div class="sj-nota-barra" data-e="notaBarra" style="display:none"></div>' +
      '<div class="sj-aviso" data-e="aviso" style="display:none"></div>' +
      '<div data-e="vLista" style="display:flex;flex-direction:column;flex:1;min-height:0">' +
      '<div class="sj-barra">' +
      '<input type="text" data-f="texto" placeholder="Buscar en cualquier campo, incluidos etiquetas y anotaciones">' +
      '<select data-f="fuero" title="Fuero"></select>' +
      '<select data-f="sit" title="Situación"></select>' +
      '<select data-f="tramite" title="Trámite"><option value="todas">En trámite y fuera de trámite</option>' +
      '<option value="si">Solo en trámite</option><option value="no">Solo fuera de trámite</option></select>' +
      '<select data-f="etiqueta" title="Etiqueta"></select>' +
      '<label>Últ. act. <input type="date" data-f="desde" title="Desde"></label>' +
      '<label>a <input type="date" data-f="hasta" title="Hasta"></label>' +
      '<button class="sj-b" data-a="limpiar">Limpiar filtros</button>' +
      '<button class="sj-b" data-a="novedades" data-e="novedades" title="Las causas que cambiaron de fecha de última actuación o de situación desde la última vez que las miraste. El PJN solo publica el día, así que dos movimientos del mismo día no se distinguen. Una causa deja de estar marcada cuando la abrís.">Novedades</button>' +
      '<button class="sj-b" data-a="vistoTodo" title="Marcar todas las causas como vistas: se borran las marcas de novedad." style="display:none">Marcar todo como visto</button>' +
      // A la derecha, separado de los filtros, lo que cambia cómo se ve la tabla.
      '<span class="der"><button class="sj-b" data-a="menuCols">Columnas ▾</button>' +
      '<button class="sj-b" data-a="ordenPJNlista2" data-e="ordenPJN" title="Orden PJN: las muestra en el mismo orden en que las manda el PJN cuando se le pide la lista ordenada por FECHA, que es como las ves en el sitio.">Orden PJN</button>' +
      '<button class="sj-b" data-a="horas" title="Descarga el último documento con PDF de las causas que empatan en la fecha y le lee la hora a la firma. De a cinco, con tope de quince por vez, y se puede cancelar.">Averiguar la hora</button>' +
      '<button class="sj-b" data-a="ordenPJNLista" data-e="ordenCrono" title="Orden cronológico: por la última actuación, de la más nueva a la más vieja. Con la misma fecha manda la hora, cuando se la sabe de todas las causas de ese día; si falta alguna, queda el orden que manda el PJN. Es el orden con el que arranca la app.">Orden cronológico</button></span>' +
      '</div>' +
      '<div class="sj-est"><span class="txt" data-e="estado"></span>' +
      '<button class="sj-b prim" data-a="actualizar" title="Vuelve a leer Mis causas y Favoritos del PJN">Actualizar</button>' +
      '<button class="sj-b peligro" data-a="cortarLectura" style="display:none">Cancelar</button>' +
      '<span class="sj-copia" data-a="irMarcas" data-e="copia"></span></div>' +
      '<div class="sj-accion" data-e="accion"></div>' +
      '<div class="sj-cuerpo" data-e="cuerpo"></div>' +
      '<div class="sj-pie" data-e="pie"></div>' +
      '</div>' +
      '<div class="sj-panel" data-e="vPanel" style="display:none"></div>' +
      '<div class="sj-redim" data-e="redim" title="Arrastrá para cambiar el tamaño"></div>' +
      '<input type="file" data-e="archivo" accept=".supjn,.json,application/json,application/octet-stream" style="display:none">';
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
    // letra antes de redibujar; los desplegables y las fechas se aplican de inmediato.
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

    // Bandejas (Escritos, Notificaciones, DEOX) y Guía.
    let tBandeja = null;
    win.addEventListener('input', (e) => {
      const t = e.target;
      const bf = t.dataset && t.dataset.bf;
      if (bf) {
        const cont = t.closest('[data-band]');
        if (!cont) return;
        const v = cont.dataset.band, B = BAND[v];
        if (bf === 'texto') {
          B.texto = t.value;
          B.pagina = 1;
          clearTimeout(tBandeja);
          tBandeja = setTimeout(() => pintarCuerpoBandeja(v), ESPERA_BUSQUEDA);
        } else if (bf === 'desde' || bf === 'hasta') {
          B[bf] = t.value;
          // El atajo de fechas acompaña a lo que se escriba a mano.
          const r = cont.querySelector('[data-bf="rango"]');
          if (r) r.value = rangoActual(B);
        }
        return;
      }
      if (t.dataset && t.dataset.gf === 'texto') GUIA.texto = t.value;
    });

    win.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-bf="bandeja"]')) {
        const cont = t.closest('[data-band]');
        if (!cont) return;
        BAND[cont.dataset.band].bandeja = t.value;
        consultarBandeja(cont.dataset.band);
        return;
      }
      // Los filtros trabajan sobre lo ya consultado: no se le vuelve a pedir
      // nada al PJN.
      if (t.matches('[data-bf="filtro"]')) {
        const cont = t.closest('[data-band]');
        if (!cont) return;
        const v = cont.dataset.band;
        BAND[v].filtros[t.dataset.k] = t.value;
        BAND[v].pagina = 1;
        pintarCuerpoBandeja(v);
        return;
      }
      // Un atajo de fechas sí cambia lo que se le pide al PJN, así que consulta.
      if (t.matches('[data-bf="rango"]')) {
        const cont = t.closest('[data-band]');
        if (!cont) return;
        const v = cont.dataset.band, R = RANGOS.find((x) => x[0] === t.value);
        if (!R) return;          // "Otras fechas": las fechas quedan como están
        BAND[v].desde = R[2]();
        BAND[v].hasta = hoyISO();
        consultarBandeja(v);
        return;
      }
      if (t.matches('[data-gf="modo"]')) {
        GUIA.modo = t.value === 'per' ? 'per' : 'dep';
        const campo = q('[data-gf="texto"]');
        if (campo) campo.placeholder = GUIA.modo === 'per' ? 'Apellido' : 'Por ejemplo: civil 74, correccional 11, casación penal';
        return;
      }
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
      const ds = (e.target && e.target.dataset) || {};
      if (e.key === 'Enter' && ds.gf === 'texto') { e.preventDefault(); guiaBuscar(); return; }
      if (e.key === 'Enter' && (ds.bf === 'desde' || ds.bf === 'hasta')) {
        const cont = e.target.closest('[data-band]');
        if (cont) { e.preventDefault(); BAND[cont.dataset.band][ds.bf] = e.target.value; consultarBandeja(cont.dataset.band); }
        return;
      }
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
      lector.onload = async () => {
        // El archivo se lee como bytes: el formato propio es binario, y una
        // copia anterior, que era texto, se decodifica adentro de desproteger.
        let texto;
        try { texto = await desprotegerTexto(new Uint8Array(lector.result), leerContra()); } catch (e) {
          archivo.value = '';
          avisar(mensajeDe(e).charAt(0).toUpperCase() + mensajeDe(e).slice(1) + '.', true);
          return;
        }
        const r = importarMarcas(texto);
        archivo.value = '';
        if (typeof r === 'string') { avisar(r, true); return; }
        avisar('Importadas ' + plural(r.filas, 'causa marcada', 'causas marcadas') + '. Quedan ' + plural(r.etiquetas, 'etiqueta', 'etiquetas') + '.' +
          (r.notas ? ' Se sumaron ' + plural(r.notas, 'nota dejada', 'notas dejadas') + '.' : ''));
        pintarTodo();
      };
      lector.onerror = () => { archivo.value = ''; avisar('No se pudo leer el archivo.', true); };
      lector.readAsArrayBuffer(f);
    });

    win.addEventListener('click', alClic);

    // un clic afuera cierra el menú abierto
    document.addEventListener('mousedown', (e) => {
      if (!menuAbierto) return;
      if (menuAbierto.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-a="menuPJN"], [data-a="menuCols"], [data-a="menuColsAct"], [data-mas]')) return;
      cerrarMenu();
    }, true);

    // Lo que cuenta como "el usuario está acá" para mantener viva la sesión.
    ['mousedown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => {
      document.addEventListener(ev, huboActividad, { passive: true, capture: true });
    });
    setInterval(() => { latirSesion(); }, CADA_LATIDO);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !win || win.style.display === 'none') return;
      if (menuAbierto) { cerrarMenu(); return; }
      if (abierta) { guardarNotaAbierta(); abierta = null; pintarTabla(); return; }
      minimizar();
    });

    let tRedim = null;
    window.addEventListener('resize', () => {
      acomodarVentana();
      clearTimeout(tRedim);
      tRedim = setTimeout(reencuadrar, 200);
    });

    // Si se cambia de pestaña o se cierra, lo que estaba por respaldarse se
    // guarda ya: si no, se pierden los últimos segundos de lo anotado.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') respaldarYa();
    });
    window.addEventListener('pagehide', respaldarYa);

    // Dónde estaba: se anota al irse de la página (abrir una causa, dejar una
    // nota o recargar la llevan de vuelta al PJN) y también mientras se corre
    // la pantalla, por si la pestaña se cierra de golpe.
    window.addEventListener('pagehide', guardarLugar);
    let tLugar = null;
    win.addEventListener('scroll', () => {
      clearTimeout(tLugar);
      tLugar = setTimeout(guardarLugar, 400);
    }, true);

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

  // Descarga una sola actuación, sin tocar lo que haya elegido: va como un trabajo
  // más de la cola, con nombre propio de archivo.
  function bajarUnaActuacion(id, i) {
    if (sinBajarPorNota()) return;
    const ctx = ctxElegir(id);
    const a = ctx && ctx.acts && ctx.acts[i];
    if (!a) return;
    const d = (id === 'exp' ? EXP.datos : COLA.find((x) => x.id === id)) || {};
    const exp = d.exp || '';
    const ya = COLA.find((x) => x.una && x.urls && x.urls[0] === a.url && /a descargar|descargando/.test(x.estado));
    if (ya) { avisar('Esa actuación ya se está descargando.'); return; }
    if (!hayLugarPara(1)) return;
    const partes = [nombreArchivo(exp), (a.fecha || '').replace(/\//g, '-'), a.tipo || ''].filter(Boolean);
    nuevoTrabajo({
      exp, car: d.car || '', modo: 'seleccion', origen: 'una', acts: [a], urls: [a.url], parcial: true, una: true,
      nombre: partes.join('-').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim(),
      estado: 'a descargar', texto: 'Esperando turno...'
    });
    avisar('Descargando la actuación' + (a.fecha ? ' del ' + a.fecha : '') + '. Se ve en Descargas.');
    pintarSolapas();
    procesarCola();
  }

  function trabajoDesdeElegir(id, urls, parcial) {
    if (sinBajarPorNota()) return;
    if (id === 'exp') {
      const d = EXP.datos || {};
      // Un doble clic no descarga dos veces lo mismo.
      const igual = COLA.find((x) => x.origen === 'exp' && x.exp === (d.exp || '') && /a descargar|descargando/.test(x.estado) &&
        x.urls && x.urls.length === urls.length && x.urls.every((u, i) => u === urls[i]));
      if (igual) { avisar('Eso ya se está descargando.'); return; }
      if (!hayLugarPara(1)) return;
      nuevoTrabajo({ exp: d.exp || '', car: d.car || '', modo: 'seleccion', origen: 'exp', acts: EXP.acts, urls, parcial, estado: 'a descargar', texto: 'Esperando turno...' });
      pintarExpEstado();
    } else {
      const t = COLA.find((x) => x.id === id);
      if (!t) return;
      t.urls = urls;
      t.parcial = parcial;
      t.estado = 'a descargar';
      t.texto = 'Esperando turno...';
      pintarDescargas();
    }
    pintarSolapas();
    procesarCola();
  }

  function alClic(e) {
    const t = e.target;

    // Un enlace del menú abre su pestaña y el menú se cierra solo. Se lo cierra
    // después del clic: quitarlo durante el clic podría cortar la apertura.
    const vinculoMenu = t.closest('.sj-menu a.it');
    if (vinculoMenu) { setTimeout(cerrarMenu, 0); return; }

    // La cruz de la solapa va antes que la solapa: está adentro del botón.
    const cx = t.closest('[data-cerrar]');
    if (cx) { cerrarSolapaExp(); return; }

    const sol = t.closest('[data-vista]');
    if (sol) { irAVista(sol.dataset.vista); return; }

    const bo = t.closest('th[data-bo]');
    if (bo) { ordenarBandeja(bo.dataset.v, bo.dataset.bo); return; }

    const bp = t.closest('[data-bpag]');
    if (bp) {
      if (bp.disabled) return;
      BAND[bp.dataset.v].pagina = parseInt(bp.dataset.bpag, 10) || 1;
      pintarCuerpoBandeja(bp.dataset.v);
      const cb = q('[data-e="bandCuerpo"]');
      if (cb) cb.scrollTop = 0;
      return;
    }

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
        // no se les averiguó, se ofrece hacerlo (descarga el último documento de cada una).
        const faltan = causasSinHora();
        avisar((yaEstaba
          ? 'Ya estaban en orden cronológico: por última actuación, de la más nueva a la más vieja.'
          : 'Ordenadas por última actuación, de la más nueva a la más vieja.') +
          (faltan.length ? ' Hay ' + plural(faltan.length, 'causa que empata', 'causas que empatan') + ' en la fecha y sin hora: pulsá "Averiguar la hora" para leerla del último documento firmado.' : ''));
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
      case 'novedades':
        CFG.novedades = !CFG.novedades;
        guardarCfg();
        PAGINA_VISTA.rel = 1;
        PAGINA_VISTA.fav = 1;
        pintarFiltros();
        pintarTabla();
        pintarEstado();
        avisar(CFG.novedades ? 'Solo las causas que se movieron desde la última vez que las miraste.' : 'Se ven todas las causas de nuevo.');
        return;
      case 'vistoTodo':
        fotoVisto();
        if (CFG.novedades) { CFG.novedades = false; guardarCfg(); }
        pintarFiltros();
        pintarTabla();
        pintarEstado();
        avisar('Listo: todas quedaron como vistas.');
        return;
      case 'vistoUna':
        marcarVisto(k);
        pintarTabla();
        pintarFiltros();
        return;
      case 'horas': averiguarHoras().catch((e) => avisar('No se pudo averiguar la hora: ' + mensajeDe(e) + '.', true)); return;
      case 'zoomMas': cambiarZoom(zoomVecino(1)); return;
      case 'zoomMenos': cambiarZoom(zoomVecino(-1)); return;
      case 'zoomCien': cambiarZoom(1); return;
      case 'actualizar': avisar(''); actualizar(); return;
      case 'cortarLectura': cancelarLectura = true; cortarHoras = true; estadoTxt('Cancelando...'); return;
      case 'limpiar':
        Object.assign(CFG, { texto: '', fuero: '', sit: '', tramite: 'todas', etiqueta: '', desde: '', hasta: '', novedades: false });
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
      case 'salirPJN': {
        // Cerrar la sesión no borra nada, así que no se pide confirmar: se sale.
        // Lo único que se puede perder es el trabajo a medio hacer, y eso sí se
        // protege, porque una tanda de nota interrumpida deja causas sin nota y
        // el usuario creyendo que salieron todas.
        if (bajandoAlgo() || corridaActiva() || leyendo) {
          avisar('Hay trabajo en curso: cancelalo o esperá a que termine antes de cerrar la sesión.', true);
          return;
        }
        const u = enlaceSalirPJN();
        if (!u) { avisar('No se encuentra el enlace para cerrar sesión en esta página del PJN.', true); return; }
        avisar('Cerrando la sesión del PJN...');
        location.href = u;
        return;
      }
      case 'cedulaUna': dejarCedula(k); return;
      case 'verEscr': bandejaDeCausa('escr', k); return;
      case 'verNotif': bandejaDeCausa('notif', k); return;
      case 'verDeox': bandejaDeCausa('deox', k); return;
      case 'verGuia': guiaDeDependencia(depDe(k), k); return;
      case 'bandConsultar': consultarBandeja(b.dataset.v); return;
      case 'bandSinCausa': BAND[b.dataset.v].causa = null; consultarBandeja(b.dataset.v); return;
      case 'bandVer': pdfBandeja(b.dataset.v, b.dataset.id, false); return;
      case 'bandBajar': pdfBandeja(b.dataset.v, b.dataset.id, true); return;
      case 'guiaDep': guiaDeDependencia(b.dataset.dep); return;
      case 'guiaBuscar': guiaBuscar(); return;
      case 'guiaPag': guiaBuscar(Math.max(0, parseInt(b.dataset.p, 10) || 0)); return;
      case 'guiaInicio': guiaInicio(); return;
      case 'guiaAbrir': GUIA.nota = ''; guiaAbrir(b.dataset.cod, true); return;
      case 'guiaVolver': guiaVolver(); return;
      case 'guiaCopiar': guiaCopiar(); return;
      case 'diagnostico': revisarPJN(); return;
      case 'cortarDiag': cortarDiag(); return;
      case 'copiarDiag': copiarCuadro('diagTexto', 'Informe copiado.'); return;
      case 'copiarFallas': copiarCuadro('fallasTexto', 'Registro copiado.'); return;
      case 'borrarFallas': {
        if (!FALLAS.length) { avisar('El registro ya está vacío.'); return; }
        const n = FALLAS.length;
        borrarFallas();
        pintarFallas();
        avisar('Registro vaciado: se quitaron ' + plural(n, 'entrada', 'entradas') + '.');
        return;
      }
      case 'notaTodas': pedirNota(null); return;
      case 'bajarSel': bajarCausas([...selVista()]); return;
      case 'elegirSel': elegirActuaciones([...selVista()][0]); return;
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
      case 'cortarCola':
        cortarCola = true;
        cortePedidoEn = Date.now();
        // También las que están esperando que elijas actuaciones: si no, el botón
        // decía "cancelar" y esas quedaban ahí, bloqueando el aviso al salir.
        COLA.forEach((x) => { if (x.estado === 'en cola' || x.estado === 'a descargar' || x.estado === 'eligiendo') { x.estado = 'cancelado'; x.texto = 'Cancelado.'; } });
        pintarDescargas();
        return;
      case 'limpiarCola':
        for (let i = COLA.length - 1; i >= 0; i--) if (/listo|error|cancelado/.test(COLA[i].estado)) COLA.splice(i, 1);
        pintarDescargas();
        return;
      case 'volverLista': location.href = RUTA.rel; return;
      case 'recargar': location.reload(); return;
      case 'recargarApp': {
        // Recargar corta lo que esté en curso: si hay trabajo, se pide confirmar.
        if ((bloqueoNota() || bajandoAlgo()) && !b.classList.contains('peligro')) {
          b.classList.add('peligro');
          b.textContent = 'Confirmar: se cancela lo que está en curso';
          avisar('Hay trabajo en curso (dejar nota o descargas). Si recargás, se cancela.', true);
          return;
        }
        location.reload();
        return;
      }
      case 'notaPJN': {
        const x = botonPJN(/^dejar nota$/i);
        if (!x) { avisar('No se encuentra el botón "Dejar Nota" del PJN en esta página.', true); return; }
        minimizar();
        x.click();
        return;
      }
      case 'escritoPJN': {
        const x = botonPJN(/presentar escrito/i);
        if (!x) { avisar('No se encuentra "Presentar escrito" en esta página.', true); return; }
        x.click();
        return;
      }
      case 'exportar':
        if (!hayContra()) {
          irAVista('marcas');
          avisar('Antes de exportar poné una contraseña para tus copias, en Respaldo.', true);
          return;
        }
        exportarMarcas().then(() => {
          pintarCopia();
          irAVista('marcas');
          avisar('Copia exportada, con tu contraseña. Guardala donde guardes tus papeles de trabajo.');
        }, (e) => avisar('No se pudo exportar: ' + mensajeDe(e) + '.', true));
        return;
      case 'guardarContra': {
        const campo = q('#supjn .sj-contra');
        const v = campo ? String(campo.value || '').trim() : '';
        if (v.length < 6) { avisar('Poné una contraseña de al menos 6 caracteres.', true); return; }
        guardarContra(v);
        mostrarContra = false;
        irAVista('marcas');
        avisar('Contraseña guardada. Anotala donde guardes tus claves: sin ella el archivo no se abre en ninguna parte.');
        // Con la contraseña puesta, la carpeta se lee y se guarda ya.
        if (CARPETA) {
          conectarCarpeta(false).then(() => {
            pintarCopia();
            if (VISTA === 'marcas') irAVista('marcas');
            if (carpetaEstado === 'contra' && carpetaBloqueada) avisar('Contraseña guardada, pero no abre el respaldo que hay en la carpeta: ' + carpetaAviso + '.', true);
          }).catch(() => { /* el estado de la carpeta ya lo informa */ });
        }
        return;
      }
      case 'pisarCarpeta':
        if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar: se reemplaza el respaldo de la carpeta'; return; }
        pisarCarpeta().then((ok) => {
          pintarCopia();
          irAVista('marcas');
          avisar(ok ? 'Listo: el respaldo de la carpeta tiene ahora los datos de esta PC, con la contraseña de esta PC.' : 'No se pudo guardar en la carpeta: ' + (carpetaAviso || 'revisá el permiso') + '.', !ok);
        }).catch((e) => avisar('No se pudo guardar en la carpeta: ' + mensajeDe(e) + '.', true));
        return;
      case 'verContra': mostrarContra = true; irAVista('marcas'); return;
      case 'ocultarContra': mostrarContra = false; irAVista('marcas'); return;
      case 'elegirCarpeta':
        elegirCarpeta().then((r) => {
          irAVista('marcas');
          avisar('Carpeta conectada: SuPJN+ va a guardar las etiquetas, las anotaciones y las notas en ' + r.nombre + ', y a leer de ahí al abrir.' +
            (r.git ? ' Atención: esa carpeta parece un repositorio de Git. Si la subís a GitHub, las anotaciones quedarían públicas. Elegí otra.' : ''), !!r.git);
          return conectarCarpeta(false);
        }).then(() => { pintarCopia(); if (VISTA === 'marcas') irAVista('marcas'); })
          .catch((e) => { if (!/abort/i.test(String(e && e.name))) avisar('No se pudo usar esa carpeta: ' + mensajeDe(e) + '.', true); });
        return;
      case 'conectarCarpeta':
        conectarCarpeta(true).then(() => { irAVista('marcas'); avisar(carpetaEstado === 'lista' ? 'Carpeta conectada: se guarda e importa automáticamente.' : 'No se pudo conectar la carpeta.', carpetaEstado !== 'lista'); })
          .catch(() => avisar('No se pudo conectar la carpeta.', true));
        return;
      case 'guardarCarpeta':
        escribirEnCarpeta().then((ok) => { pintarCopia(); if (VISTA === 'marcas') irAVista('marcas'); avisar(ok ? 'Guardado en la carpeta.' : 'No se pudo guardar: ' + (carpetaAviso || 'revisá el permiso de la carpeta') + '.', !ok); })
          .catch((e) => avisar('No se pudo guardar en la carpeta: ' + mensajeDe(e) + '.', true));
        return;
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

  // ----------------------------------------------- 9.2 la hora del documento
  //
  // El PJN no manda la hora en ninguna pantalla, pero las resoluciones y los
  // escritos van firmados y la firma la lleva. Para las causas que empatan en la
  // fecha se descarga el último documento y se le lee la hora de la firma.

  let horasEnCurso = false;
  let cortarHoras = false;

  // Causas de la vista que empatan en fecha con otra y todavía no tienen hora.
  // Las que ya se probaron y dieron una fecha distinta no se vuelven a descargar:
  // su último documento con PDF no es el de la última actuación y descargarlo otra
  // vez daría lo mismo.
  function causasSinHora() {
    const porFecha = {};
    filtradas().forEach((c) => { if (numFecha(c.ult)) (porFecha[c.ult] = porFecha[c.ult] || []).push(c); });
    const out = [];
    Object.keys(porFecha).sort((a, b) => numFecha(b) - numFecha(a)).forEach((f) => {
      if (porFecha[f].length < 2) return;
      porFecha[f].forEach((c) => {
        const h = HORAS[c.exp];
        if (!h || (h.f !== c.ult && h.pedida !== c.ult)) out.push(c.exp);
      });
    });
    return out;
  }

  async function averiguarHoras() {
    if (horasEnCurso) return;
    if (sinBajarPorNota() || ocupado()) return;
    const todas = causasSinHora();
    const claves = todas.slice(0, TOPE_DESCARGAS);
    if (!claves.length) { avisar('No hay causas que empaten en la fecha sin hora averiguada.'); return; }
    horasEnCurso = true;
    cortarHoras = false;
    pintarBotonesLectura();
    let hechas = 0, fallas = 0, otraFecha = 0, cortado = '';
    try {
      for (let i = 0; i < claves.length; i++) {
        if (cortarHoras) { cortado = 'cancelado'; break; }
        if (i && i % BLOQUE_DESCARGAS === 0) {
          estadoTxt('Pausa de ' + Math.round(PAUSA_BLOQUE / 1000) + ' segundos para no saturar al PJN...');
          for (let e = 0; e < PAUSA_BLOQUE && !cortarHoras; e += 500) await dormir(500);
          if (cortarHoras) { cortado = 'cancelado'; break; }
        }
        const k = claves[i];
        const c = causaPorClave(k);
        const ult = c ? c.ult : '';
        estadoTxt('Averiguando la hora de ' + k + ' (' + (i + 1) + ' de ' + claves.length + ')... Se puede cancelar.');
        // Lo que no se pudo averiguar queda anotado como probado: si no, cada vez
        // se descargarían los mismos quince documentos y nunca se llegaría a los demás.
        const noSePudo = () => { fallas++; if (ult) guardarHora(k, { f: '', hh: '', t: Date.now(), origen: '', pedida: ult }); };
        try {
          const a = await ultimaActuacionConPDF(k, () => { /* sin avisos */ });
          if (!a) { noSePudo(); continue; }
          const r = await traerPDF(a.url, { exp: k, act: 'última actuación con documento' });
          if (r && r.vencida) { cortado = VENCIDA; break; }
          const h = r && r.buf ? horaDePDF(r.buf) : null;
          if (!h) { noSePudo(); continue; }
          // Se guarda también para qué fecha se preguntó: si el documento es de
          // otro día, no sirve para desempatar, pero queda anotado que ya se probó
          // y no se lo vuelve a descargar cada vez.
          guardarHora(k, { f: h.f, hh: h.hh, t: Date.now(), origen: h.origen, pedida: ult });
          if (h.f === ult) hechas++; else otraFecha++;
          if (esVistaLista()) pintarTabla();
        } catch (e) {
          noSePudo();
          if (String(e && e.message) === VENCIDA) { cortado = VENCIDA; break; }
        }
      }
    } finally {
      horasEnCurso = false;
      cortarHoras = false;
      pintarBotonesLectura();
    }
    if (esVistaLista()) { pintarTabla(); pintarEstado(); }
    const faltan = todas.length - claves.length;
    avisar(cortado ? 'Se interrumpió: ' + cortado + '.'
      : plural(hechas, 'hora averiguada', 'horas averiguadas') +
        (otraFecha ? '. En ' + plural(otraFecha, 'causa', 'causas') + ' el último documento con PDF es de otro día que la última actuación, así que no sirve para desempatar (no se vuelve a descargar)' : '') +
        (fallas ? '. En ' + plural(fallas, 'causa', 'causas') + ' no se pudo: la última actuación puede no tener documento firmado' : '') +
        '.' + (faltan ? ' Quedan ' + faltan + ' para la próxima vez: van hasta ' + TOPE_DESCARGAS + ' por vez.' : '') +
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

  // ---------------------- 10.1 las otras solapas del expediente: en pantalla

  async function leerSolapa(clave, auto) {
    const s = EXP.solapas[clave];
    if (!s || s.estado === 'leyendo') return;
    if (!auto) s.abierta = true;
    if (!CID_PAGINA) {
      s.estado = 'error';
      s.texto = 'No se encuentra el número de consulta (cid) en la dirección de la página: recargala desde la lista.';
      pintarSolapaExp(clave);
      return;
    }
    s.estado = 'leyendo';
    s.texto = 'Consultando al PJN...';
    pintarSolapaExp(clave);
    try {
      const r = await leerSolapaExp(CID_PAGINA, clave, (t) => { s.texto = t; pintarSolapaExp(clave); });
      s.cabs = r.cabs;
      s.filas = r.filas;
      s.completa = r.completa !== false;
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
      if (w) { listaPestana(w); w.location.replace(url); avisar('Se abrió ' + k + ' en una pestaña nueva.'); }
      else { avisar('Abriendo ' + k + '...'); location.href = url; }
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  async function bajarVinculado(k) {
    if (sinBajarPorNota() || ocupado()) return;
    if (COLA.find((t) => t.exp === k && t.modo === 'todo' && EN_JUEGO.test(t.estado))) { avisar(k + ' ya está en Descargas.'); return; }
    if (!hayLugarPara(1)) return;
    accionEnCurso = true;
    try {
      const url = await direccionVinculado(CID_PAGINA, k, (t) => avisar(t));
      const cid = new URL(url).searchParams.get('cid');
      // Dos clics seguidos en el mismo ⇩ encolaban la causa dos veces (se vuelve
      // a mirar porque entre medio se le preguntó la dirección al PJN).
      if (COLA.find((t) => t.exp === k && t.modo === 'todo' && EN_JUEGO.test(t.estado))) { avisar(k + ' ya está en Descargas.'); return; }
      nuevoTrabajo({ exp: k, car: '', modo: 'todo', cid, estado: 'en cola', texto: 'En cola' });
      avisar(k + ' se agregó a Descargas. Se descarga en segundo plano.');
      pintarSolapas();
      procesarCola();
    } catch (e) {
      avisar('No se pudo descargar ' + k + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  // ---------------------------------------- 10.2 revisar el PJN: la revisión
  //
  // Mira, en solo lectura y en marcos ocultos, las piezas del PJN de las que
  // depende SuPJN+ y dice cuáles están y cuáles cambiaron. No deja notas, no
  // pone el filtro de dejar nota y no guarda nada. El informe no lleva números
  // de causa.

  let diagN = 0;

  function cortarDiag() {
    if (DIAG.estado !== 'corriendo') return;
    diagN++;                                   // lo que quede corriendo ya no anota nada
    DIAG.items.push({ nombre: 'Revisión', ok: null, detalle: 'la cancelaste', aviso: '' });
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
      // Con qué cuenta entró: es lo que separa los datos de una cuenta de los de
      // otra, así que si esto no se lee, SuPJN+ no muestra ni guarda nada.
      if (CUENTA) anotar('Cuenta del PJN', true, 'se leyó del encabezado: ' + cuentaCorta());
      else anotar('Cuenta del PJN', false, 'no se encuentra en el encabezado: sin ese dato no se muestra ni se guarda nada, para no mezclar dos cuentas');
      // El enlace para salir: se lo busca por su texto, así que un cambio de
      // rótulo del PJN deja el botón sin destino y conviene enterarse acá.
      const salir = enlaceSalirPJN();
      anotar('Cerrar sesión', !!salir, salir ? 'está el enlace del PJN para salir' : 'no se encuentra el enlace para salir: el botón de cerrar sesión no va a funcionar');
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
      else anotar('Tabla de causas', false, 'no se encuentra la tabla con "Expediente" y "Carátula" en el encabezado');
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
        anotar('Enlace para abrir la causa', !!form, form ? 'está y se entiende' : (ojo ? (pr ? 'está, pero no se encuentra su formulario' : 'está, pero cambió la forma del enlace') : 'no se encuentra el enlace de apertura en la fila'));
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
        anotar('Lista de Favoritos', esFav && seLee, esFav && seLee ? 'se abre y se lee' : (!esFav ? 'se abre, pero no aparece el título "Lista de Expedientes Favoritos"' : 'se abre, pero no se encuentra su tabla'));
      } catch (e) {
        await fallo('Lista de Favoritos', e);
        if (esVencida(e)) return;
      }
      soltar();
      if (!vivo()) return;

      // Escritos, Notificaciones, DEOX y la Guía: se abren en segundo plano y se
      // les pide una lista corta, de la última semana. Solo lectura.
      for (const v of ['escr', 'notif', 'deox']) {
        if (!vivo()) return;
        const E = EXT[v], D = BANDEJAS[v];
        try {
          const ruta = D.ruta + '?bandeja=' + D.opciones[0][0] + '&fechaDesde=' + fechaAPI(isoHace(7)) + '&fechaHasta=' + fechaAPI(hoyISO());
          const r = await pedirPuente(E.app, { op: 'lista', ruta, tope: 1, porPagina: 5 });
          const items = r && Array.isArray(r.items) ? r.items : [];
          const f = items.length ? D.fila(items[0], D.opciones[0][0]) : null;
          if (!f) anotar(E.nombre, true, 'responde con la misma cuenta (no hay elementos de la última semana para mirar los datos)');
          else anotar(E.nombre, !!(f.exp && f.fecha), f.exp && f.fecha ? 'responde con la misma cuenta, y se leen el expediente y la fecha' : 'responde, pero no se leen ' + (f.exp ? 'la fecha' : 'el expediente') + ': puede haber cambiado la forma de los datos');
        } catch (e) {
          anotar(E.nombre, false, String(e && e.message ? e.message : e));
        }
      }
      if (!vivo()) return;
      try {
        const g = await pedirPuente('guia', { op: 'json', ruta: rutaGuia('guia-inicio') });
        const ok = !!(g && g.dependencia && Array.isArray(g.subDependencias) && g.subDependencias.length);
        anotar('Guía judicial', ok, ok ? 'responde y trae su índice' : 'responde, pero cambió la forma de los datos');
      } catch (e) {
        anotar('Guía judicial', false, String(e && e.message ? e.message : e));
      }
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
      anotar('Datos del expediente', !!dx.exp, !dx.exp ? 'no se encuentra "Expediente:" en los datos generales' : dx.car ? 'se leen el número y la carátula' : 'se lee el número, pero no la carátula');
      const ta = tablaActuaciones(de);
      const acts = actuacionesDe(de, false);
      anotar('Tabla de actuaciones', !!ta, ta ? (acts.length ? plural(acts.length, 'actuación', 'actuaciones') + ' con PDF en la primera página' : 'está, sin actuaciones con PDF en la primera página') : 'no se encuentra la tabla con "Fecha" y "Tipo" en el encabezado');
      if (acts.length) {
        const conFecha = acts.some((a) => esFecha(a.fecha));
        const conTipo = acts.some((a) => a.tipo);
        const rotulo = acts.some((a) => /:/.test(a.fojas));
        anotar('Columnas de las actuaciones', conFecha && conTipo && !rotulo,
          !conFecha ? 'la fecha no se lee como día/mes/año' : !conTipo ? 'el tipo de actuación viene vacío' : rotulo ? 'aparecen rótulos pegados a los valores: el PJN cambió cómo los marca' : 'fecha, tipo de actuación, descripción y fojas se leen');
        // Hasta tres actuaciones: alguna puede no tener un PDF de verdad.
        const n = Math.min(3, acts.length);
        let pdf = null;
        // La revisión prueba a propósito actuaciones que pueden no tener
        // documento, así que sus fallas no van al registro: lo llenarían de
        // entradas que no corresponden a un problema real.
        for (let i = 0; i < n && vivo() && !(pdf && (pdf.buf || pdf.vencida)); i++) pdf = await traerPDF(acts[i].url, { mudo: true });
        if (pdf && pdf.vencida) anotar('Descargar un PDF', false, 'la sesión del PJN venció en medio de la revisión', 'venció');
        else if (pdf && pdf.buf) anotar('Descargar un PDF', true, 'llega un PDF de ' + Math.max(1, Math.round(pdf.buf.byteLength / 1024)) + ' KB');
        else anotar('Descargar un PDF', false, 'no llegó un PDF de ' + (n === 1 ? 'la actuación probada' : 'ninguna de las ' + n + ' actuaciones probadas'));
      } else if (ta) {
        anotar('Columnas de las actuaciones', null, 'no hay actuaciones con PDF en la primera página para mirarlas');
        anotar('Descargar un PDF', null, 'no hay actuaciones con PDF en la primera página para probar');
      }
    } catch (e) {
      await fallo('Revisión', e);
    } finally {
      soltar();
      if (vivo()) { DIAG.estado = 'listo'; pintarDiag(); }
    }
  }

  // ---------------------------------------------- 10.3 el expediente abierto

  async function leerExpedienteActual() {
    if (EXP.estado === 'leyendo') return;
    if (!CID_PAGINA) {
      EXP.estado = 'error';
      EXP.texto = 'No se encuentra el número de consulta (cid) en la dirección de la página: recargala desde la lista.';
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
      EXP.texto = plural(r.actuaciones.length, 'actuación con PDF', 'actuaciones con PDF') + (hist ? ' (' + hist + ' históricas)' : '') + '. Elegí cuáles descargar o descargá todo.';
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

  // ----------------------------------------------------------- 10.4 arranque

  // En el Portal del PJN: solo el indicador, que lleva a la Consulta Web. Lo demás
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
    revisarCuenta();
    if (!construir()) return;
    pintarPlacaCuenta();
    if (!CUENTA) {
      avisar(SIN_CUENTA, true);
      // Por si el PJN dibuja la barra de usuario con su propio JavaScript,
      // después de que la página ya quedó lista.
      setTimeout(() => {
        if (!revisarCuenta() || !CUENTA) return;
        pintarPlacaCuenta();
        pintarTodo();
        refrescarSiHaceFalta();
        avisar('Cuenta del PJN identificada: ' + (CUENTA_TXT || CUENTA) + '.');
      }, 2500);
    }
    if (EN_EXPEDIENTE) {
      VISTA = 'exp';
      EXP.datos = datosExpediente(document);
      if (EXP.datos.exp) marcarVisto(EXP.datos.exp);
    } else {
      const tl = EN_LISTA ? tipoLista(document) : null;
      VISTA = tl || (CFG.vista === 'fav' ? 'fav' : 'rel');
      // Al volver de una causa, o después de una recarga, se retoma la solapa
      // que estaba, con su página y su causa desplegada. Hasta dónde estaba
      // corrida la pantalla lo retoma la tabla al dibujarse.
      if (LUGARES.ultima === 'rel' || LUGARES.ultima === 'fav') VISTA = LUGARES.ultima;
      const sitio = LUGARES.sitios[VISTA];
      if (sitio) {
        if (Number(sitio.pagina.rel) > 0) PAGINA_VISTA.rel = Number(sitio.pagina.rel);
        if (Number(sitio.pagina.fav) > 0) PAGINA_VISTA.fav = Number(sitio.pagina.fav);
        abierta = sitio.abierta;
      }
      irALista(VISTA);
    }
    // Pedido del autor: SuPJN+ arranca minimizado y lee igual en segundo plano.
    // Queda el indicador abajo a la derecha, que informa el avance.
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
    // Si hay una carpeta de respaldo elegida, se lee lo que haya y se guarda lo de acá.
    conectarCarpeta(false).then((r) => { if (r && r !== true) pintarTodo(); pintarCopia(); }).catch(() => { /* sin carpeta se sigue igual */ });
    // El "leídas hace..." tiene que envejecer solo, sin recargar nada.
    setInterval(() => { if (win && win.style.display !== 'none' && esVistaLista() && !leyendo) pintarEstado(); }, 60000);
    // La cuenta atrás del pausa entre bloques.
    setInterval(() => { if (pausaHasta && VISTA === 'desc' && win && win.style.display !== 'none') pintarCuentaPausa(); }, 1000);
  }

  // Enganche para las pruebas unitarias. Solo existe en el sitio de pruebas
  // (pruebas.supjn.invalid, un dominio que no puede existir en la red); en el
  // PJN esta condición nunca se cumple y no hace nada.
  if (location.hostname === 'pruebas.supjn.invalid' && typeof window.__SUPJN_PRUEBAS__ === 'function') {
    window.__SUPJN_PRUEBAS__({
      limpio, norm, clave, fueroDe, numFecha, fechaPareja, ordenExp, isoACorta, plural, lasN, mensajeDe,
      mismoExpediente, textoVisible, sinRotulo, esPDF, horaDePDF, sinNumeroDeCausa, partesDeCaratula, notas: () => NOTAS, normalizarNotas, normalizarMarcas, validarDatos,
      enterosExactos, anchosEncuadrados, repartirEncuadre, minCol, anchoDe, columnasVisibles, CFG, COLS_DEF, COLS_ACT_DEF, BLOQUE_DESCARGAS, TOPE_DESCARGAS,
      importarMarcas, marcas: () => MARCAS, valorOrdenAct, esMiTurno, resNota, acotarZoom, zoomVecino,
      // La carpeta de respaldo: el banco instala una carpeta simulada para
      // probar la escritura sin tocar el disco.
      fijarMarca, escribirEnCarpeta, datosRespaldo,
      // El archivo exportado: formato propio y contraseña.
      protegerTexto, desprotegerTexto, datosMarcas, exportarMarcas,
      esArchivoNuestro, leerContra, guardarContra, hayContra, EXT_ARCHIVO,
      // La sesión mientras se trabaja.
      latirSesion, tocarSesion, hayQueMantenerViva, convieneLatir, huboActividad, activoHacePoco,
      enlaceSalirPJN, CADA_LATIDO, LATIDO_SI_ACTIVO,
      sinActividad: () => { olvidarActividad(); },
      // La cuenta del PJN: detección y compartimentos.
      cuentaEnTexto, buscarCuentaEnLaPagina, cuentaCorta, cuenta: () => CUENTA, cuentaTexto: () => CUENTA_TXT, cuentaDePrueba,
      // El registro de fallas de descarga y los reintentos.
      anotarFalla, borrarFallas, refrescarFallas, normalizarFallas, textoFallas, urlCorta,
      fallas: () => FALLAS, TOPE_FALLAS, ESPERAS_REINTENTO, traerPDF, descripcionActuacion,
      carpetaDePrueba: (h, leida) => { ponerCarpetaDePrueba(h, leida); },
      // Escritos, Notificaciones, DEOX y la Guía.
      tokensGuia, puntajeGuia, mejorGuia, filaEscrito, filaNotif, filaDeox, estadoDeox, destinoDeox, tipoDeox,
      partesExp, expComparable, fechaAPI, msDe, RUTAS_PUENTE, menuPJNHTML, errorPuente, cuentaDelPuente, K_CEDULA,
      estadoCarpeta: () => ({ estado: carpetaEstado, aviso: carpetaAviso, bloqueada: carpetaBloqueada }),
      conectarCarpeta, importarDeCarpeta, pisarCarpeta, MARCA_ARCHIVO: MARCA
    });
    return;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
