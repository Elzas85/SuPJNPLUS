// ==UserScript==
// @name         SuPJN+ - Consulta Web del PJN ampliada
// @namespace    ignacio.kinbaum
// @version      1.7.0
// @description  Ventana única sobre la Consulta Web del PJN: Mis causas y Favoritos, en trámite y fuera de trámite, con búsqueda, filtros, ordenamiento y columnas configurables; etiquetas y anotaciones propias de cada causa y de cada actuación, con copia manual o guardado automático en una carpeta designada; el expediente en pestañas, con las notas dejadas en la causa; fechas en placas de color según su antigüedad; dejar nota en todas las causas habilitadas o en las seleccionadas; descarga de expedientes en PDF eligiendo causas desde la lista o actuaciones desde el expediente; escritos presentados, notificaciones electrónicas y DEOX, generales o de una causa, con sus PDF; dejar cédula y nuevo DEOX con el expediente ya cargado en el formulario del PJN; la Guía judicial navegable y enlazada a cada causa; las fiscalías del Ministerio Público Fiscal y las defensorías del Ministerio Público de la Defensa, con sus datos de contacto, también desde los intervinientes de cada causa; búsqueda de causas por el nombre de una parte o por número, en las causas propias y en la consulta pública del PJN, en varios fueros a la vez y con filtro por tipo de juicio; exportación a Excel y a CSV de lo que se ve en cada tabla; y acceso a las demás aplicaciones del PJN.
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
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      www.mpf.gob.ar
// @connect      www.mpd.gov.ar
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
 *   ordenamiento y columnas configurables; etiquetas y anotaciones propias,
 *   de cada causa y, desde la 1.7.0, de cada actuación; el expediente
 *   organizado en pestañas (Actuaciones, Notas, Intervinientes, Causas
 *   Vinculadas y Recursos, Etiquetas y Anotaciones), con las notas dejadas
 *   en la causa según el PJN; las fechas en placas de color según su
 *   antigüedad (verde la del día, azul hasta siete días, naranja las más
 *   viejas); partes e intervinientes de cada expediente, con los peritos y los
 *   fiscales, y el enlace a los datos de cada fiscalía y defensoría oficial;
 *   causas vinculadas y recursos;
 *   dejar nota en todas las causas habilitadas o solo en las seleccionadas;
 *   descarga de expedientes en un PDF, eligiendo causas desde la lista o
 *   actuaciones desde el expediente; solapas propias para los escritos
 *   presentados, las notificaciones electrónicas y los DEOX, en general o de
 *   una causa, con su PDF; dejar cédula y, desde la 1.7.0, iniciar un DEOX,
 *   abriendo el formulario de Notificaciones o de DEOX del PJN con el
 *   expediente ya elegido; la Guía judicial,
 *   navegable y enlazada al juzgado de cada causa; la búsqueda de causas por el
 *   nombre de una parte o por número, en las causas propias y en la consulta
 *   pública del PJN, en varios fueros a la vez; la exportación a Excel y a CSV
 *   de lo que se ve en cada tabla; y un menú con las demás aplicaciones del
 *   PJN, que se abren en una pestaña nueva.
 *   Se abre sola al entrar al PJN, ocupando toda la pantalla, y lee las listas
 *   en segundo plano mientras tanto. Minimizada queda como indicador en el
 *   extremo inferior derecho.
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
 *     - Intervinientes (relevado el 30/09/2026): el panel trae una tabla por
 *       tema, cada una debajo de su título (h2). PARTES (participantsTable)
 *       tiene paginador propio; debajo de cada parte van sus letrados, entre
 *       ellos la defensa oficial, con el rol "LETRADO DEFENSOR OFICIAL" y, en
 *       una de las filas, el nombre de la defensoría. PERITOS (peritosTable:
 *       nombre, profesión, I.E.J.) y FISCALES (fiscalesTable: fiscalía,
 *       fiscal, I.E.J.) aparecen solo cuando tienen datos. Hasta la 1.5.0 se
 *       leía solo la primera tabla, y por eso no se veían los fiscales. En las
 *       causas civiles y de familia (relevado el 30/09/2026) la defensa
 *       pública aparece también como parte ("TERCERO | TUTORIA N 2",
 *       "TERCERO | DEFENSORIA DE CAMARA") y con los roles "LETRADO ASESOR DE
 *       MENORES" y "DIRECCIÓN OFICIAL DE TUTORES Y CURADORES"; el PJN abrevia
 *       "NAC.", "DE 1RA. INST." y "2DA. INST.", que los directorios escriben
 *       enteros o no escriben.
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
 * FISCALÍAS Y DEFENSORÍAS (relevado el 30/09/2026, en solo lectura)
 *   La Guía judicial del PJN no incluye al Ministerio Público: buscar
 *   "fiscalía" o "defensoría" en ella da cero resultados, y "fiscal" solo trae
 *   las secretarías de ejecución fiscal de los juzgados. Cada ministerio
 *   publica su propio directorio, en una página pública, sin clave:
 *   - Ministerio Público Fiscal, www.mpf.gob.ar/mapa-fiscalias/ (unos 400 KB).
 *     La página trae dentro, en la variable "settings" de un guion
 *     (settings.cats.items), el árbol completo: jurisdicción, a veces un
 *     grupo (por ejemplo, "Criminal y Correccional Federal") y cada fiscalía u
 *     oficina, con post_title, fiscal, direccion, prefijo, telefonos, fax y
 *     mail. El 30/09/2026 eran 511 fichas en 17 jurisdicciones.
 *   - Ministerio Público de la Defensa,
 *     www.mpd.gov.ar/index.php/guia-de-defensorias-mpd (unos 700 KB). Es una
 *     tabla (#contactList) con una fila por defensoría: el nombre con el
 *     enlace a su ficha y, separados por saltos de línea, el titular,
 *     "Dirección:", "Fijo:", a veces "Móvil:" y otros cargos ("Supervisor:",
 *     "Coordinadora:"), el correo y la jurisdicción ("Pehuajó-[Buenos
 *     Aires]"). El correo va cifrado en base64 en los atributos first y last
 *     de <joomla-hidden-mail>. El 30/09/2026 eran 388 filas.
 *   Desde Intervinientes, la fiscalía o la defensoría que nombra el PJN se
 *   busca en esos directorios (ver 8.5, "desde Intervinientes"): el PJN
 *   abrevia y agrega "de Cap. Fed.", que en los directorios es la
 *   jurisdicción y no parte del nombre.
 *   Ninguno de los dos sitios deja que otra página lea sus respuestas, así
 *   que SuPJN+ las baja con GM_xmlhttpRequest, que Tampermonkey habilita solo
 *   para esos dos dominios (@connect). Solo lee: no manda datos ni formularios.
 *
 * LA CONSULTA PÚBLICA (relevada el 30/09/2026, en solo lectura, con la sesión
 * iniciada)
 *   - Es el formulario de /scw/home.seam. Sin sesión pide un desafío
 *     (captcha); con la sesión iniciada, no lo pide.
 *   - Tiene dos búsquedas. Por expediente: jurisdicción, número y año. Por
 *     parte: jurisdicción, tipo de parte (optativo) y nombre. Los campos de
 *     "Por parte" los trae el PJN por AJAX al tocar la cabecera de su solapa,
 *     y al elegir la jurisdicción redibuja el tipo de parte. En Trabajo (CNT)
 *     solo deja buscar como DEMANDADO.
 *   - El nombre: al menos 6 letras. Cada palabra se busca por separado, en
 *     cualquier orden, y en todas las partes de la causa, no solo en la
 *     carátula. Rechaza la Ñ, las tildes, las comas y los guiones ("no se
 *     admiten caracteres especiales"), pero encuentra a MUÑOZ buscando MUNOZ.
 *     Admite letras, números, espacios y el apóstrofo.
 *   - Consultar redirige a una dirección http://, como abrir una causa (ver
 *     CÓMO FUNCIONA EL SITIO). Por parte, lleva a /scw/consultaParte.seam?cid=N,
 *     una conversación nueva por consulta: la tabla de siempre (Expediente,
 *     Dependencia, Carátula, Situación, Últ. Act.), de a 15 filas, con solo
 *     "Siguiente" y "Anterior" por AJAX, sin total ni número de página. Sin
 *     resultados dice "No se han encontrado expedientes". Por número, lleva
 *     directo al expediente, o vuelve al formulario con "Expediente
 *     inexistente o no disponible para su consulta pública".
 *   - El ojo de cada fila abre la causa en /scw/expediente.seam con el mismo
 *     cid de la consulta, que muestra la última causa abierta desde ella. La
 *     lista vence al rato: después de consultar otros fueros, el ojo de una
 *     lista anterior lleva de vuelta al formulario. Por eso SuPJN+ abre cada
 *     causa buscándola por su número, y solo un incidente, que no se puede
 *     buscar por número, desde la lista (si venció, la pide de nuevo). Lo
 *     mismo puede pasarle a la lista del marco de trabajo (Mis causas o
 *     Favoritos): después de una consulta se la vuelve a pedir, y si el ojo
 *     igual no lleva al expediente, se prueba una vez más (ver 3.4).
 *   - El PJN no filtra por tipo de juicio: SuPJN+ lo toma de la carátula, de lo
 *     que sigue a la "s/". Las causas penales y de familia no aparecen: el PJN
 *     no las muestra en la consulta pública.
 *   SuPJN+ hace lo mismo que se haría a mano, fuero por fuero, cada uno en su
 *   propio marco oculto, y junta todo en una tabla. Solo consulta: no abre ni
 *   toca nada más, y lo buscado no se guarda.
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
 *   Desde la 1.6.0 se puede bajar además, en Excel (.xlsx) o en CSV, lo que se
 *   ve en una tabla (Mis causas, Favoritos, las tres bandejas y la consulta
 *   pública). Ese archivo no lleva contraseña, así que no lleva las
 *   anotaciones: solo los datos del PJN y las etiquetas.
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
 *      7.1 leer las listas · 7.2 acciones por causa · 7.3 exportar lo que se ve
 *   8. LAS OTRAS APLICACIONES DEL PJN. Escritos, Notificaciones, DEOX, la Guía,
 *      los directorios del Ministerio Público y la consulta pública.
 *      8.1 el puente, del lado de la ventana · 8.2 datos comunes
 *      8.3 las tres bandejas · 8.4 la Guía judicial
 *      8.5 fiscalías y defensorías · 8.6 la consulta pública
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

  // ============================== 0. EL MAPA DEL PJN ==============================
  //
  // Todo lo que depende de CÓMO ESTÁ HECHO el sitio del PJN vive acá: las
  // direcciones, los textos que se buscan en los botones y enlaces, los nombres
  // de los elementos y los campos de los formularios. El resto del programa no
  // escribe ninguno de esos datos por su cuenta: se los pide a este mapa.
  //
  // Para qué sirve: el PJN cambia cosas sin avisar, y cuando eso pasa este es
  // el único lugar que hay que mirar. La revisión del PJN (solapa Acerca de)
  // comprueba estas piezas una por una y dice cuáles siguen estando.
  const PJN = {
    // Las páginas de la Consulta Web.
    rutas: {
      rel: '/scw/consultaListaRelacionados.seam',
      fav: '/scw/consultaListaFavoritos.seam',
      rad: '/scw/consultaListaNoIniciados.seam',
      exp: '/scw/expediente.seam',
      hist: '/scw/actuacionesHistoricas.seam'
    },
    // El enlace de cada fila que abre el expediente: primero su ícono de ojo y,
    // si el PJN le cambia el ícono, el texto del enlace.
    ojo: { icono: '.fa-eye', texto: /visualizar/i },
    // Los enlaces del menú de la fila, por su texto.
    menuFila: { libro: /libro digital/i, escrito: /presentar escrito/i },
    // Los botones propios del PJN dentro del expediente abierto, por su texto.
    botonExp: { nota: /^dejar nota$/i, escrito: /presentar escrito/i },
    // Dónde puede estar escrita la cuenta con la que se entró.
    usuario: {
      cajas: 'nav, header, .navbar',
      iconos: '.fa-user, .glyphicon-user, [class*="icon-user"]',
      // El menú que el PJN colapsa en pantalla de teléfono. Solo lo mira la
      // aplicación de Android: en la computadora el encabezado está a la vista.
      menuMovil: '.navbar-collapse, .dropdown-menu, .offcanvas, [class*="menu-usuario"], [id*="menu"], [class*="navbar-nav"]'
    },
    // Cómo se reconoce que la sesión venció: el PJN contesta la pantalla de ingreso.
    ingreso: /type=["']?password/i,
    // El filtro de la tabla de actuaciones del expediente: la casilla "Ver Todos"
    // suma los movimientos sin documento (EN LETRA, EN DESPACHO...) y el botón
    // "Aplicar" pide la tabla con ese filtro.
    filtroActs: { verTodos: /^ver todos$/i, aplicar: /^aplicar$/i },
    // El total que el PJN informa arriba de cada lista ("Se han encontrado un
    // total de 174 expedientes"). Con él se controla que se leyeron todas las páginas.
    totalLista: /se han encontrado un total de\s+([\d.]+)\s+expediente/i,
    // Las otras solapas del expediente, por el texto de su cabecera, y dónde
    // el PJN pone esas cabeceras (el identificador lo arma JSF).
    solapasExp: { int: 'Intervinientes', vin: 'Vinculados', rec: 'Recursos' },
    // Las notas dejadas en la causa (relevado el 01/10/2026, en solo lectura):
    // el PJN las muestra dentro de la solapa Actuaciones, debajo de la tabla de
    // actuaciones, bajo el título "Notas". La tabla (expediente:notas-table)
    // tiene Fecha, Interviniente y Descripción / detalle ("10:00 Hs, - CUIT"),
    // de a 15 filas, con un paginador numerado y el total al pie ("Se ha(n)
    // encontrado un total de 21 nota(s)"). Ese paginador no avanzó en la
    // prueba: la página siguiente no se pudo obtener.
    notas: { tabla: '[id$=":notas-table"]', caja: '[id$=":tableNotas"]', total: /total de\s+(\d+)\s+nota/i },
    cabezaSolapa: 'td[id*=":header:"]',
    solapaInactiva: /:header:inactive$/,
    // El panel de una solapa lleva el mismo identificador que su cabecera, sin
    // el sufijo que dice cómo está.
    sufijoSolapa: /:header:(active|inactive|disabled)$/,
    // Las páginas donde lo que se está mirando es un expediente.
    enExpediente: /\/scw\/(expediente|actuacionesHistoricas)\.seam/i,
    // Cómo se reconoce, en la dirección que devuelve el PJN, que abrió el
    // expediente o el libro digital y no otra cosa.
    dirExpediente: /expediente\.seam$/i,
    dirLibro: /libroDigital/i,
    // Los enlaces del documento de una actuación, en el visor.
    dirVisor: /viewer\.seam/i,
    // La dirección con la que se abre un expediente desde otra aplicación.
    novedad: '/scw/consultaNovedad.seam',
    // El visor de documentos: ahí SuPJN+ no se dibuja.
    visor: /\/scw\/viewer\.seam/i,
    // Dejar nota, en la lista de Relacionados: la columna, el lápiz de cada
    // fila, el filtro, el cartel de confirmación y su botón. De cada uno va
    // primero el identificador del PJN y después un respaldo por el texto.
    nota: {
      columna: /dejar\s*nota/i,
      lapiz: 'a[onclick], a[href], button',
      filtro: ['input[id$="consultaFiltroSearchDejarNota"]', 'input[value="Dejar nota"]'],
      confirmar: ['input[id$=":dejarNotaForm:botonAceptar"]', 'input[value="Confirmar"]'],
      cartel: ['div[id$=":dejarNotaPopupID:dejarNotaPopup"]', 'div[id$="dejarNotaPopup"]']
    },
    // El formulario de Notificaciones donde se deja cédula.
    cedula: {
      ruta: '/nueva',
      jurisdiccion: '#camara-autocomplete',
      flechaJurisdiccion: '.MuiAutocomplete-popupIndicator',
      // El desplegable de la lista de jurisdicción. En el formulario relevado
      // el 29/09/2026 queda montado al lado del campo y se oculta con
      // display:none al cerrarse.
      desplegable: '.MuiAutocomplete-popper',
      numero: 'input[name="numeroExpediente"]',
      anio: 'input[name="anioExpediente"]',
      siguiente: { id: 'StepperNextBtn', texto: /^siguiente$/i },
      listaExp: '[id^="form-list-autocomplete-listbox-expediente"] [role="option"]',
      opcion: '[role="option"]',
      avisos: '[role="alert"], .MuiAlert-message, .MuiSnackbarContent-message, .MuiSnackbar-root',
      sinResultados: /no hay resultados/i
    },
    // El formulario de DEOX donde se inicia un oficio nuevo (relevado el
    // 01/10/2026, en solo lectura y sin avanzar de paso): /nuevo, con los
    // mismos campos que el de cédula en el paso 1 (jurisdicción, número, año
    // y Siguiente). Los pasos que siguen son del PJN: destinatario, despachos,
    // adjuntos, texto, oficina y confirmación.
    deoxNuevo: { ruta: '/nuevo' },
    // La consulta pública (1.6.0, relevada el 30/09/2026 en solo lectura; ver
    // LA CONSULTA PÚBLICA). El formulario tiene solapas que el PJN dibuja por
    // AJAX: los campos de "Por parte" recién existen después de tocar su cabecera.
    publica: {
      // Sin parámetros. Con "?actionOutcome=..." el PJN redirige a una dirección
      // http://, y un marco no puede seguir esa redirección.
      ruta: '/scw/home.seam',
      form: 'formPublica',
      cabParte: 'formPublica:porParte:header:inactive',
      parte: {
        camara: 'formPublica:camaraPartes', tipo: 'formPublica:tipo', leyenda: 'formPublica:leyenda',
        nombre: 'formPublica:nomIntervParte', boton: 'formPublica:buscarPorParteButton'
      },
      numero: { camara: 'formPublica:camaraNumAni', numero: 'formPublica:numero', anio: 'formPublica:anio', boton: 'formPublica:buscarPorNumeroButton' },
      // Adónde manda el PJN después de consultar por parte.
      dirResultados: /\/scw\/consultaParte\.seam/i,
      // El desafío (captcha): el PJN lo pide sin sesión; con la sesión iniciada, no.
      desafio: '.pjn-captcha',
      respuestaDesafio: 'captcha-response',
      // Los mensajes del PJN (los de PrimeFaces y los errores de un campo).
      mensajes: '#messages [class*="summary"], .ui-messages [class*="summary"], .scw-state-error',
      vacia: /no se (han )?encontrad[oa]s? expedientes/i,
      // El paginador de los resultados: solo "Siguiente" y "Anterior", de a 15.
      siguiente: /^siguiente$/i,
      anterior: /^anterior$/i,
      // Los tipos de parte que ofrece el PJN (los mismos en los 28 fueros).
      tipos: ['ACTOR', 'AFILIADO', 'AGRUPACION POLITICA', 'AMICUS CURIAE', 'AUTORIDAD DE MESA', 'AUTORIDAD PARTIDARIA', 'CANDIDATO',
        'CAUSANTE', 'CIUDADANO', 'CONCURSADO', 'CUERPO COLEGIADO', 'DAMNIFICADO', 'DEMANDADO', 'DENUNCIADO', 'DENUNCIANTE', 'EJECUTADO/S',
        'EJECUTANTE/S', 'EMPLEADO PUBLICO', 'FALLIDO', 'FUNCIONARIO PUBLICO', 'HEREDERO/S', 'IMPUTADO', 'INCIDENTISTA', 'INTERVENTOR JUDICIAL',
        'INTERVENTOR PARTIDARIO', 'JUNTA ELECTORAL PARTIDARIA', 'LISTA DE CANDIDATOS PARTIDARIOS', 'LISTA DE PRECANDIDATOS O CANDIDATOS',
        'ONG', 'ORGANISMO PUBLICO', 'PETICIONANTE', 'PRECANDIDATO', 'PRESUNTO FALLIDO', 'QUERELLANTE', 'REQUERIDO', 'REQUIRENTE', 'SINDICO',
        'SOLICITANTE', 'TERCERO AUTONOMO/PRINCIPAL', 'VOLUNTARIO']
    }
  };

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

  // El puente, en partes (1.6.1). Todas reciben ctx = { app, publica, R }:
  // la aplicación, si es pública (la Guía) y las rutas que acepta. Igual que
  // las tres de arriba, no usan nada de lo que se define más abajo; la única
  // excepción es esPDF, que es una declaración de función (existe desde el
  // comienzo) y no usa nada más.
  function enviarAlPadre(ctx, m) {
    try { window.parent.postMessage(Object.assign({ supjn: 'puente', app: ctx.app }, m), ORIGEN_SCW); } catch (e) { /* la ventana ya no está */ }
  }

  // Una consulta a la API de la aplicación, con la credencial del SSO salvo en
  // la Guía, que es pública.
  async function pedirEnMarco(ctx, ruta, cuerpo) {
    const h = { Accept: 'application/json, text/plain, */*' };
    if (!ctx.publica) {
      const u = await esperarCredencialSSO(10000);
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

  const jsonDelMarco = async (r) => {
    try { return await r.json(); } catch (e) { throw new Error('la respuesta no se pudo leer', { cause: e }); }
  };

  // Cada consulta que el puente acepta. Todo es de lectura.
  async function consultaEstado(ctx, p) {
    if (ctx.publica) return { listo: true };
    const u = await esperarCredencialSSO(p.espera || 0);
    return { listo: !!u, cuit: cuitSSO(u) };
  }
  async function consultaJSON(ctx, p) {
    if (!(ctx.R.json && ctx.R.json.test(p.ruta))) throw new Error('consulta no admitida');
    return jsonDelMarco(await pedirEnMarco(ctx, p.ruta));
  }
  async function consultaBuscar(ctx, p) {
    if (!(ctx.R.buscar && ctx.R.buscar.test(p.ruta)) || !p.cuerpo || typeof p.cuerpo !== 'object') throw new Error('consulta no admitida');
    return jsonDelMarco(await pedirEnMarco(ctx, p.ruta, p.cuerpo));
  }
  // Una lista entera, de a una página, avisando el avance a la ventana.
  async function consultaLista(ctx, p) {
    if (!(ctx.R.lista && ctx.R.lista.test(p.ruta)) || /[?&](page|pageSize)=/.test(p.ruta)) throw new Error('consulta no admitida');
    const tope = Math.max(1, Math.min(Number(p.tope) || 1000, TOPE_PUENTE));
    const porPagina = Math.max(1, Math.min(Number(p.porPagina) || 100, 100));
    const items = [];
    let total = null;
    for (let pag = 0; ; pag++) {
      const j = await jsonDelMarco(await pedirEnMarco(ctx, p.ruta + '&page=' + pag + '&pageSize=' + porPagina));
      if (!j || !Array.isArray(j.items)) throw new Error('la respuesta no trae la lista');
      if (typeof j.numberOfItems === 'number') total = j.numberOfItems;
      items.push(...j.items);
      enviarAlPadre(ctx, { tipo: 'avance', id: p.id, van: items.length, total });
      if (!j.hasNext || !j.items.length || items.length >= tope) break;
    }
    return { items: items.slice(0, tope), total: total == null ? items.length : total };
  }
  async function consultaPDF(ctx, p) {
    if (!(ctx.R.pdf && ctx.R.pdf.test(p.ruta))) throw new Error('consulta no admitida');
    const buf = await (await pedirEnMarco(ctx, p.ruta)).arrayBuffer();
    // Igual que en las descargas de la Consulta Web: el "%PDF-" puede venir
    // después de unos bytes de más al principio (esPDF). Hasta la 1.6.0 se
    // exigía en el primer byte.
    if (!esPDF(buf)) throw new Error('el sistema no devolvió un PDF');
    return { buf };
  }
  const OPERACIONES_PUENTE = { estado: consultaEstado, json: consultaJSON, buscar: consultaBuscar, lista: consultaLista, pdf: consultaPDF };

  function atenderEnMarco(ctx, p) {
    const op = Object.prototype.hasOwnProperty.call(OPERACIONES_PUENTE, p.op) ? OPERACIONES_PUENTE[p.op] : null;
    return op ? op(ctx, p) : Promise.reject(new Error('consulta no admitida'));
  }

  function puenteEnMarco(app) {
    const ctx = { app, publica: app === 'guia', R: RUTAS_PUENTE[app] };
    window.addEventListener('message', (e) => {
      if (e.origin !== ORIGEN_SCW || e.source !== window.parent) return;
      const p = e.data;
      if (!p || p.supjn !== 'pedido' || p.app !== app || typeof p.id !== 'string') return;
      atenderEnMarco(ctx, p).then(
        (res) => enviarAlPadre(ctx, { tipo: 'respuesta', id: p.id, ok: true, res }),
        (err) => enviarAlPadre(ctx, { tipo: 'respuesta', id: p.id, ok: false, error: String(err && err.message ? err.message : err) })
      );
    });

    // Aviso a la ventana de que el marco ya puede atender: la Guía enseguida;
    // las otras, cuando la aplicación terminó de entrar con el SSO.
    if (ctx.publica) enviarAlPadre(ctx, { tipo: 'listo' });
    else esperarCredencialSSO(30000).then((u) => { if (u) enviarAlPadre(ctx, { tipo: 'listo', cuit: cuitSSO(u) }); });
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
  const RUTA_CEDULA = PJN.cedula.ruta;

  // Nuevo DEOX (1.7.0). El formulario de DEOX para iniciar un oficio tiene el
  // mismo paso 1 que el de cédula (ver PJN.deoxNuevo), así que se carga con
  // el mismo procedimiento. El pedido lleva la aplicación a la que va: uno
  // hecho para DEOX no se usa en Notificaciones, ni al revés. Un pedido sin
  // aplicación (de una versión anterior) es de Notificaciones.
  const FORM_NUEVO = {
    notif: {
      ruta: RUTA_CEDULA, app: 'Notificaciones', doc: 'la cédula',
      sigue: ' Pulsá Siguiente para completar los destinatarios, los despachos y el texto. La cédula se envía desde este formulario: SuPJN+ no envía nada.',
      nada: ' para dejar cédula con esta cuenta. En Notificaciones solo aparecen las causas en las que constituiste domicilio electrónico.'
    },
    deox: {
      ruta: PJN.deoxNuevo.ruta, app: 'DEOX', doc: 'el oficio',
      sigue: ' Pulsá Siguiente para completar el destinatario, los despachos, los adjuntos, el texto y la oficina. El oficio se envía desde este formulario: SuPJN+ no envía nada.',
      nada: ' para iniciar un oficio con esta cuenta.'
    }
  };
  const appDelPedido = (p) => (p && p.app === 'deox' ? 'deox' : 'notif');

  // Dejar cédula, en partes (1.6.1). Esta parte corre en Notificaciones, antes
  // de que se declare el resto del programa: solo usa lo de arriba.
  const esperarCedula = (ms) => new Promise((r) => setTimeout(r, ms));
  const olvidarCedula = () => { try { GM_setValue(K_CEDULA, null); } catch (e) { /* sin almacén */ } };
  const cuitCorto = (c) => { const x = String(c || ''); return x ? x.slice(0, 2) + '...' + x.slice(-3) : 'sin identificar'; };

  // El pedido que dejó la Consulta Web, si sigue vigente; si no, null.
  function pedidoCedulaVigente(app) {
    if (typeof GM_getValue !== 'function' || typeof GM_setValue !== 'function') return null;
    let p;
    // La Consulta Web lo guarda como texto JSON, igual que el resto del almacén.
    try { p = GM_getValue(K_CEDULA, null); if (typeof p === 'string') p = JSON.parse(p); } catch (e) { p = null; }
    if (!p || typeof p !== 'object') return null;
    const vigente = Date.now() - (Number(p.ts) || 0) < VIDA_CEDULA && /^[A-Z]{2,4}$/.test(String(p.sigla || '')) &&
      Number(p.num) > 0 && Number(p.anio) > 1900 && /^\d{11}$/.test(String(p.cuenta || ''));
    return vigente && appDelPedido(p) === (app || 'notif') ? p : null;
  }

  // El cartel se puede correr con el mouse: si queda encima de algo del
  // formulario, se lo arrastra a donde moleste menos. Al agarrarlo pasa a
  // flotar sobre la página, conservando el lugar donde estaba.
  function cartelArrastrable(c) {
    c.style.cursor = 'move';
    c.title = 'Arrastrá el cartel para moverlo';
    let arrastre = null;
    c.addEventListener('mousedown', (ev) => {
      if (ev.button !== 0 || ev.target.closest('button, a, input')) return;
      const r = c.getBoundingClientRect();
      if (c.style.position !== 'fixed') {
        c.style.position = 'fixed';
        c.style.margin = '0';
        c.style.zIndex = '2147483000';
        c.style.width = Math.round(r.width) + 'px';
        c.style.left = Math.round(r.left) + 'px';
        c.style.top = Math.round(r.top) + 'px';
        c.style.right = 'auto';
      }
      arrastre = { x: ev.clientX - r.left, y: ev.clientY - r.top };
      ev.preventDefault();
    });
    document.addEventListener('mousemove', (ev) => {
      if (!arrastre) return;
      const ancho = c.offsetWidth, alto = c.offsetHeight;
      const x2 = Math.min(Math.max(0, ev.clientX - arrastre.x), Math.max(0, window.innerWidth - ancho));
      const y2 = Math.min(Math.max(0, ev.clientY - arrastre.y), Math.max(0, window.innerHeight - alto));
      c.style.left = Math.round(x2) + 'px';
      c.style.top = Math.round(y2) + 'px';
    });
    document.addEventListener('mouseup', () => { arrastre = null; });
  }

  // Un cartel propio, encima del formulario (no tapa ningún botón), que se
  // cierra con su cruz.
  function crearCartelCedula() {
    const c = document.createElement('div');
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
    cartelArrastrable(c);
    return c;
  }

  function cartelCedula(texto, malo) {
    const c = document.getElementById('supjn-cedula') || crearCartelCedula();
    c.style.borderColor = malo ? '#b3261e' : '#14416f';
    c.querySelector('.txt').textContent = 'SuPJN+: ' + texto;
  }

  async function esperarQueCedula(f, msMax) {
    const tope = Date.now() + msMax;
    for (;;) {
      let v;
      try { v = f(); } catch (e) { v = null; }
      if (v) return v;
      if (Date.now() >= tope) return null;
      await esperarCedula(200);
    }
  }

  // React solo toma el valor si se lo escribe como lo haría el teclado.
  function escribirComoTeclado(el, v) {
    const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    d.set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // "CIV - Cámara Nacional de Apelaciones en lo Civil", "CIV- Cámara...",
  // "CIV: Cámara..." o "CIV" son la misma jurisdicción: se compara la sigla
  // del principio y nada más, porque el PJN escribe el resto como quiere.
  const siglaCedula = (t) => { const m = /^\s*([A-Za-z]{2,4})\b/.exec(String(t || '')); return m ? m[1].toUpperCase() : ''; };
  // Acá adentro no se puede usar el limpia-espacios general: esta parte corre
  // antes de que se lo declare, así que tiene el suyo.
  const apretadoCedula = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toUpperCase();

  // Nunca se elige por el nombre: "Civil" también está adentro de "Civil y
  // Comercial Federal", y elegir mal sin que se note es peor que no elegir.
  // Vale la sigla del comienzo; si no la hay, la sigla suelta dentro del
  // texto, y solo si aparece en una sola opción. Si hay dos, no se elige.
  function opcionCamaraCedula(sig) {
    const todas = [...document.querySelectorAll(PJN.cedula.opcion)];
    const alComienzo = todas.filter((o) => siglaCedula(o.textContent) === sig);
    if (alComienzo.length === 1) return alComienzo[0];
    if (alComienzo.length > 1) return 'dudosa';
    const rx = new RegExp('\\b' + sig + '\\b', 'i');
    const sueltas = todas.filter((o) => rx.test(String(o.textContent || '')));
    if (sueltas.length === 1) return sueltas[0];
    return sueltas.length ? 'dudosa' : null;
  }

  // "CIV 076436/2025/1" y "CIV 76436/2025/1" son el mismo expediente.
  const sinCerosCedula = (t) => String(t || '').toUpperCase().replace(/\s+/g, ' ').trim().replace(/^([A-Z]{2,4}) 0*(\d)/, '$1 $2');
  const opcionesExpCedula = () => [...document.querySelectorAll(PJN.cedula.listaExp)];
  const sinResultadosCedula = () => [...document.querySelectorAll(PJN.cedula.avisos)]
    .some((e) => PJN.cedula.sinResultados.test(e.textContent || ''));

  // Siguiente, en el paso 1, solo busca la causa. Después: o aparece la lista
  // del paso 2, o el PJN dice que no hay resultados.
  async function elegirExpedienteCedula(buscado) {
    const sig = document.getElementById(PJN.cedula.siguiente.id) ||
      [...document.querySelectorAll('button')].find((b) => PJN.cedula.siguiente.texto.test(String(b.textContent || '').trim()));
    if (!sig) return 'sin boton';
    sig.click();
    const r = await esperarQueCedula(() => (opcionesExpCedula().length ? 'lista' : sinResultadosCedula() ? 'nada' : null), 15000);
    if (r !== 'lista') return r || 'sin respuesta';
    const exacta = opcionesExpCedula().find((o) => sinCerosCedula(String(o.textContent || '').split(' : ')[0]) === buscado);
    if (!exacta) return 'sin exacta';
    exacta.click();
    await esperarCedula(300);
    return 'elegida';
  }

  // El campo de jurisdicción es un desplegable de Material UI. Medido sobre
  // el formulario real del PJN el 23/09/2026:
  //
  //   - las jurisdicciones NO vienen con la página: el PJN las pide a
  //     /api/camaras cada vez que la lista se abre, y tardan alrededor de un
  //     segundo (1006, 992 y 954 milésimas en tres aperturas seguidas);
  //   - cada clic en el campo abre o cierra la lista, según como esté;
  //   - cerrar la lista cancela esa espera: al volver a abrirla, se pide de nuevo.
  //
  // De ahí venía "no dejó abrir la lista de jurisdicción": se probaban las
  // formas de abrirla una atrás de la otra, y cada intento nuevo cerraba la
  // lista y cancelaba la respuesta que estaba en camino. Con el PJN un poco
  // lento no llegaba a verla nunca.
  //
  // Por eso ahora: se mira primero si ya está abierta, solo se toca si está
  // cerrada, y si se abrió y todavía no trajo nada se le espera con la lista
  // abierta en vez de cerrarla. Se conservan las cuatro formas conocidas de
  // abrirla, porque el PJN cambia el formulario sin avisar: el botón de la
  // flecha, el clic en el campo, la tecla de abajo y escribir la sigla.
  //
  // Medido de nuevo sobre el formulario real el 29/09/2026 (1.4.5), sin
  // enviar ni guardar nada:
  //
  //   - en las tres cargas de la página que se midieron, el PJN pidió
  //     /api/camaras una sola vez, al cargar, y al abrir la lista no hubo
  //     pedido nuevo: las 28 opciones aparecieron enseguida;
  //   - mientras esa respuesta no llega, el campo de jurisdicción está en la
  //     página pero DESHABILITADO; cuando llega (entre 0,3 y 0,5 segundos
  //     después, con el PJN en su ritmo normal) el PJN lo REEMPLAZA por otro
  //     campo, habilitado. El número, el año y Siguiente no se reemplazan;
  //   - el desplegable de la lista queda montado al lado del campo y se oculta
  //     con display:none al cerrarse;
  //   - en otra medición, con la página ya cargada, las opciones tardaron 0,6
  //     segundos en aparecer con la lista abierta, y durante ese lapso el
  //     campo siguió con aria-expanded en false.
  //
  // De ahí venía, en la 1.4.4 y anteriores, el aviso "el formulario no mostró
  // la lista de jurisdicción", que aparecía unas veces sí y otras no: el
  // programa tomaba el campo apenas aparecía y, si llegaba antes del
  // reemplazo, trabajaba todo el tiempo sobre el campo viejo, que ya no estaba
  // en la página. Ninguna de las cuatro formas podía abrir esa lista. Con el
  // PJN lento, el lapso en que eso ocurre se alarga, y la falla se hace más
  // frecuente.
  //
  // Por eso ahora el campo se busca de nuevo cada vez que se lo usa, se
  // espera a que esté habilitado antes de tocarlo, y la lista se da por
  // abierta también cuando su desplegable está a la vista, aunque todavía no
  // tenga opciones.
  const campoCamaraCedula = () => document.querySelector(PJN.cedula.jurisdiccion);
  const habilitadoCedula = (el) => !!el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
  const ESPERA_JURISDICCION = 30000;

  // El desplegable del campo: el que está al lado, como en el formulario
  // actual; si algún día el PJN vuelve a montarlo aparte, el de la página.
  function desplegableVisibleCedula(cam) {
    const raiz = cam.closest('.MuiAutocomplete-root') || cam.parentElement;
    const junto = raiz && raiz.nextElementSibling;
    const d = junto && junto.matches(PJN.cedula.desplegable) ? junto : document.querySelector(PJN.cedula.desplegable);
    return !!d && d.style.display !== 'none' && getComputedStyle(d).display !== 'none';
  }

  // La lista de jurisdicción: cuántas opciones muestra, si está abierta y
  // cómo cerrarla. Todo toma el campo que está en la página en ese momento.
  const cuantasOpcionesCedula = () => document.querySelectorAll(PJN.cedula.opcion).length;
  function listaCamaraAbierta() {
    const cam = campoCamaraCedula();
    return !!cam && (cam.getAttribute('aria-expanded') === 'true' || cuantasOpcionesCedula() > 0 || desplegableVisibleCedula(cam));
  }
  async function cerrarListaCamara() {
    const cam = campoCamaraCedula();
    if (cam) cam.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await esperarQueCedula(() => (listaCamaraAbierta() ? null : true), 1000);
  }

  // Las cuatro formas de abrir la lista. Cada una toma el campo que está en la
  // página en ese momento; la última escribe la sigla buscada.
  const FORMAS_DE_ABRIR_CAMARA = [
    () => {
      const cam = campoCamaraCedula();
      if (!cam) return;
      const raiz = cam.closest('.MuiAutocomplete-root') || cam.parentElement;
      const abrir = raiz && (raiz.querySelector(PJN.cedula.flechaJurisdiccion) ||
        raiz.querySelector('[class*="popupIndicator"]') ||
        [...raiz.querySelectorAll('button')].find((b) => !b.className || !/clear/i.test(b.className)));
      if (abrir) abrir.click();
    },
    () => {
      const cam = campoCamaraCedula();
      if (!cam) return;
      cam.focus();
      // Los formularios nuevos escuchan el puntero y no el mouse: se mandan
      // las dos cosas, en el orden en que las manda el navegador.
      try {
        cam.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, isPrimary: true, pointerType: 'mouse' }));
        cam.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, isPrimary: true, pointerType: 'mouse' }));
      } catch (e) { /* navegador sin PointerEvent */ }
      cam.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      cam.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      // El clic va igual, por si alguna versión del formulario solo
      // escucha eso. Comprobado sobre el formulario real: el que abre o
      // cierra la lista es el mousedown, así que este clic no la alterna
      // de más.
      cam.click();
    },
    () => {
      const cam = campoCamaraCedula();
      if (!cam) return;
      cam.focus();
      cam.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    },
    (sig) => {
      const cam = campoCamaraCedula();
      if (!cam) return;
      // Acá se escribe sin el aviso de salida del campo: ese aviso cierra
      // la lista de Material UI apenas se abre.
      const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      d.set.call(cam, sig);
      cam.dispatchEvent(new Event('input', { bubbles: true }));
    }
  ];

  // Si el campo pasó a ser un desplegable común, se elige y listo.
  function elegirCamaraEnSelect(campo, sig) {
    const op = [...campo.options].find((o) => siglaCedula(o.textContent) === sig || siglaCedula(o.value) === sig);
    if (!op) return 'sin opción';
    campo.value = op.value;
    campo.dispatchEvent(new Event('change', { bubbles: true }));
    return 'elegida';
  }

  // Con la lista abierta y con opciones: se toca la de la sigla y se comprueba
  // que el campo la tomó. Devuelve 'elegida', 'dudosa', 'sin opción' o 'no tomó'.
  async function tocarOpcionCamara(sig) {
    const op = opcionCamaraCedula(sig);
    if (op === 'dudosa') return 'dudosa';
    if (!op) return 'sin opción';
    // Lo que dice la opción que se va a tocar, para después comprobar que
    // el campo quedó con eso y no con otra cosa.
    const dice = apretadoCedula(op.textContent);
    op.click();
    await esperarCedula(250);
    const cam = campoCamaraCedula();
    if (!cam) return 'no tomó';
    cam.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    cam.blur();
    // No alcanza con que el campo empiece con la sigla: una de las formas
    // de abrir la lista es escribir la sigla en el campo, así que el
    // programa se estaría creyendo a sí mismo y daría por elegida una
    // jurisdicción que nunca se seleccionó. Tiene que haber quedado lo que
    // dice la opción, salvo que la opción diga solamente la sigla.
    const quedo = apretadoCedula(cam.value);
    if (siglaCedula(quedo) === sig && (quedo === dice || quedo !== apretadoCedula(sig))) return 'elegida';
    // La opción estaba y se la tocó, pero el campo no quedó cargado. Se
    // anota aparte: no es lo mismo que no encontrarla, y se arregla en
    // otro lado.
    await cerrarListaCamara();
    return 'no tomó';
  }

  // Se espera la lista, haya o no una opción con la sigla: así se distingue
  // "no se abre" de "se abre pero ya no trae la sigla". Si se abrió y quedó
  // vacía, se le da más tiempo antes de cerrarla: las jurisdicciones las trae
  // el PJN por su cuenta y a veces tardan. Devuelve true si hay opciones; si
  // no, si se la vio abierta y vacía.
  async function esperarOpcionesCamara() {
    if (await esperarQueCedula(() => (cuantasOpcionesCedula() ? true : null), 2500)) return { hay: true };
    if (!listaCamaraAbierta()) return { hay: false, vacia: false };
    return { hay: !!(await esperarQueCedula(() => (cuantasOpcionesCedula() ? true : null), 8000)), vacia: true };
  }

  async function elegirCamaraCedula(sig) {
    const campo = campoCamaraCedula();
    if (!campo) return 'sin lista';
    if (campo.tagName === 'SELECT') return elegirCamaraEnSelect(campo, sig);
    let vioLista = false, vioVacia = false, noTomo = false;
    const tope = Date.now() + 20000;
    for (let vuelta = 0, f = 0; vuelta < FORMAS_DE_ABRIR_CAMARA.length + 2 && Date.now() < tope; vuelta++) {
      if (!listaCamaraAbierta()) {
        if (f >= FORMAS_DE_ABRIR_CAMARA.length) break;
        try { FORMAS_DE_ABRIR_CAMARA[f++](sig); } catch (e) { /* si esta forma falla, se prueba la siguiente */ }
      }
      const e = await esperarOpcionesCamara();
      if (e.vacia) vioVacia = true;
      if (!e.hay) { await cerrarListaCamara(); continue; }
      vioLista = true;
      const r = await tocarOpcionCamara(sig);
      if (r !== 'no tomó') return r;
      noTomo = true;
    }
    return noTomo ? 'no tomó' : vioLista ? 'sin opción' : vioVacia ? 'lista vacía' : 'sin lista';
  }

  // El número y el año se cargan siempre, aunque la jurisdicción no se haya
  // podido elegir: media carga adelanta trabajo, y el cartel dice qué falta.
  // Los tres campos se buscan en el momento de usarlos, y lo cargado se
  // comprueba sobre los campos que están en la página, no sobre los que se
  // encontraron al principio.
  async function completarCedula(p) {
    const camara = habilitadoCedula(campoCamaraCedula()) ? await elegirCamaraCedula(p.sigla) : 'deshabilitado';
    const num = document.querySelector(PJN.cedula.numero), anio = document.querySelector(PJN.cedula.anio);
    if (!num || !anio) return { camara, num: false, anio: false };
    escribirComoTeclado(num, String(p.num));
    escribirComoTeclado(anio, String(p.anio));
    await esperarCedula(250);
    const num2 = document.querySelector(PJN.cedula.numero), anio2 = document.querySelector(PJN.cedula.anio);
    return { camara, num: !!num2 && num2.value === String(p.num), anio: !!anio2 && anio2.value === String(p.anio) };
  }

  // Se dice cuál de las seis cosas pasó con la jurisdicción: el campo siguió
  // deshabilitado, el formulario no mostró la lista, la mostró vacía, la mostró
  // y ninguna opción trae la sigla, trae más de una, o estaba la opción y el
  // campo no la tomó. Eso es lo que hace falta para arreglarlo sin adivinar,
  // porque cada una se arregla en un lugar distinto.
  function porQueSinCamara(r, sig) {
    const motivos = {
      deshabilitado: 'el campo de jurisdicción siguió deshabilitado: el PJN no terminó de cargar las jurisdicciones',
      'sin lista': 'el formulario no mostró la lista de jurisdicción',
      'lista vacía': 'la lista de jurisdicción se abrió vacía: el PJN no trajo ninguna jurisdicción',
      dudosa: 'la lista de jurisdicción trae más de una opción con la sigla ' + sig + ', y no se elige a ciegas',
      'no tomó': 'la jurisdicción ' + sig + ' estaba en la lista y el formulario no la tomó'
    };
    return Object.prototype.hasOwnProperty.call(motivos, r) ? motivos[r] : 'la lista de jurisdicción se abrió y ninguna opción trae la sigla ' + sig;
  }
  function queHacerSinCamara(r, sig) {
    if (r === 'lista vacía') return 'Recargá la página: si la lista vuelve vacía, la falla es del PJN y no de SuPJN+.';
    if (r === 'deshabilitado') return 'Recargá la página: si el campo sigue deshabilitado, la falla es del PJN y no de SuPJN+.';
    return 'Elegí ' + sig + ' manualmente y pulsá Siguiente.';
  }

  // Lo que se dice al final, según cómo salió elegir el expediente.
  function cartelDelExpediente(r, buscado, F) {
    const sigue = F.sigue;
    if (r === 'elegida') cartelCedula('se eligió ' + buscado + '.' + sigue);
    else if (r === 'sin exacta') cartelCedula('el PJN ofrece la causa, pero no ' + buscado + ' con ese número exacto: elegí en la lista el expediente o el incidente.' + sigue);
    else if (r === 'nada') cartelCedula('el PJN no ofrece ' + buscado + F.nada, true);
    else cartelCedula('se cargaron la jurisdicción, el número y el año de ' + buscado + '. Pulsá Siguiente y elegí el expediente o el incidente.' + sigue);
  }

  // Los tres campos del paso 1, cuando están todos en la página.
  const camposCedula = () => {
    const c = [document.querySelector(PJN.cedula.jurisdiccion), document.querySelector(PJN.cedula.numero), document.querySelector(PJN.cedula.anio)];
    return c.every(Boolean) ? c : null;
  };

  async function cargarCedula(p) {
    const F = FORM_NUEVO[appDelPedido(p)];
    const buscado = sinCerosCedula(p.exp);
    // Hasta que la aplicación entra con el SSO no se hace nada. Si pide
    // ingresar, la página se va y el pedido sigue esperando.
    const u = await esperarCredencialSSO(60000);
    if (!u) return;
    const cuit = cuitSSO(u);
    if (cuit !== String(p.cuenta)) {
      olvidarCedula();
      cartelCedula('no se cargó ' + p.exp + ': ' + F.app + ' está abierto con otra cuenta (' + cuitCorto(cuit) + ') y no con la de la Consulta Web (' + cuitCorto(p.cuenta) + ').', true);
      return;
    }
    if (location.pathname !== F.ruta) { location.assign(F.ruta); return; }
    olvidarCedula();
    if (!(await esperarQueCedula(camposCedula, 20000))) { cartelCedula('no se encontró el formulario para cargar ' + p.exp + '. Completalo a mano.', true); return; }
    // La jurisdicción se habilita recién cuando el PJN terminó de traer la
    // lista, y en ese momento el campo se reemplaza (ver campoCamaraCedula).
    // Se lo espera habilitado; con el PJN lento, el cartel dice qué se está
    // esperando.
    if (!habilitadoCedula(campoCamaraCedula())) {
      cartelCedula('esperando que el PJN termine de cargar las jurisdicciones para cargar ' + buscado + '.');
      await esperarQueCedula(() => (habilitadoCedula(campoCamaraCedula()) ? true : null), ESPERA_JURISDICCION);
    }
    let r0 = { camara: false, num: false, anio: false };
    try { r0 = await completarCedula(p); } catch (e) { /* queda como no cargado */ }
    if (!r0.num || !r0.anio) {
      cartelCedula('no se pudieron cargar los datos de ' + p.exp + ' en el formulario. Completalo a mano.', true);
      return;
    }
    if (r0.camara !== 'elegida') {
      cartelCedula('se cargaron el número y el año de ' + buscado + ', pero ' + porQueSinCamara(r0.camara, p.sigla) + '. ' + queHacerSinCamara(r0.camara, p.sigla), true);
      return;
    }
    let r;
    try { r = await elegirExpedienteCedula(buscado); } catch (e) { r = ''; }
    cartelDelExpediente(r, buscado, F);
  }

  // En Notificaciones o en DEOX: el pedido que corresponde a esa aplicación.
  function cedulaEnNotif(app) {
    const p = pedidoCedulaVigente(app);
    if (p) cargarCedula(p);
  }

  const APP_PUENTE = APPS_PUENTE[location.hostname];
  if (APP_PUENTE) {
    let deLaConsulta;
    try {
      // En Chrome, ancestorOrigins dice quién abrió el marco. Aunque faltara, el
      // puente igual solo le contesta a la Consulta Web.
      const anc = location.ancestorOrigins;
      deLaConsulta = window.top !== window.self && (!anc || !anc.length || anc[0] === ORIGEN_SCW);
    } catch (e) { deLaConsulta = false; }
    if (deLaConsulta && String(window.name || '').indexOf(NOMBRE_MARCO) === 0) puenteEnMarco(APP_PUENTE);
    else if ((APP_PUENTE === 'notif' || APP_PUENTE === 'deox') && window.top === window.self) cedulaEnNotif(APP_PUENTE);
    return;
  }

  // Nunca dentro de un marco: SuPJN+ lee en marcos ocultos y ahí no arranca nada.
  if (window.top !== window.self) return;
  if (!document.body) return;

  // El visor (viewer.seam) es el documento de la actuación: ahí no va nada
  // encima. Tampoco en respuestas que no sean HTML, como los PDF.
  if (PJN.visor.test(location.pathname)) return;
  // Se aceptan text/html y application/xhtml+xml (JSF puede servir cualquiera
  // de los dos); se descarta todo lo demás.
  if (document.contentType && !/html/i.test(document.contentType)) return;

  // Con permisos de Tampermonkey el jsf del PJN se alcanza por unsafeWindow.
  const PAGINA = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  // La versión que se muestra en la ventana sale del encabezado del script
  // (@version), que es el mismo dato que usa Tampermonkey. Así no puede
  // quedar un número distinto escrito a mano en otro lugar.
  const versionDelEncabezado = () => {
    const info = (typeof GM_info !== 'undefined') ? GM_info : null;
    return (info && info.script && info.script.version) || 'sin dato';
  };

  const APP = {
    nombre: 'SuPJN+',
    version: 'beta ' + versionDelEncabezado(),
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
  const K_TOPE_ACTS = 'supjn.topeacts.v1'; // página de actuaciones que el PJN no contestó, por causa
  const K_ENCARGO_MP = 'supjn.encargomp.v1'; // ficha del Ministerio Público pedida para otra pestaña
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

  const RUTA = PJN.rutas;

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
    { t: 'Nuevo DEOX (oficio electrónico)', u: 'https://deox.pjn.gov.ar/nuevo' },
    { t: 'IWECS (recursos directos ante la CSJN)', u: 'https://iwecs.csjn.gov.ar/' },
    { t: 'Autorizados', u: 'https://autorizados.pjn.gov.ar/' },
    { t: 'Todas las aplicaciones del Portal PJN', u: 'https://portalpjn.pjn.gov.ar/apps' }
  ];

  const EN_LISTA = /\/scw\/consultaLista/i.test(location.pathname);
  const EN_EXPEDIENTE = PJN.enExpediente.test(location.pathname);
  const CID_PAGINA = new URLSearchParams(location.search).get('cid');

  // ---------------------------------------------------------- 2.1 utilidades

  const limpio = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const mayuscula = (s) => { const t = String(s == null ? '' : s); return t.charAt(0).toUpperCase() + t.slice(1); };
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

  // Fechas en placas de color según su antigüedad (1.7.0, pedido del autor,
  // criterio común de Lex+): la del día en verde, de uno a siete días atrás en
  // azul, más viejas en naranja, todas con letra blanca y dos puntos más
  // grandes que la letra de la tabla. Una fecha posterior a hoy se muestra
  // como la del día. El texto de la fecha no cambia: la búsqueda, el filtro,
  // el orden y las exportaciones siguen igual.
  const EDADES_FECHA = { hoy: 'De hoy', semana: 'De los últimos siete días', vieja: 'De hace más de siete días' };
  function edadFecha(t) {
    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t || '');
    if (!m) return '';
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const dias = Math.round((hoy - new Date(+m[3], +m[2] - 1, +m[1])) / 86400000);
    return dias <= 0 ? 'hoy' : dias <= 7 ? 'semana' : 'vieja';
  }
  function fechaPlacaHTML(t) {
    const e = edadFecha(t);
    return e ? '<span class="sj-fh ' + e + '" title="' + EDADES_FECHA[e] + '">' + esc(t) + '</span>' : esc(t);
  }

  // El PJN escribe la fecha a veces sin el cero del día ("5/09/2026"). Se deja
  // siempre como dd/mm/aaaa para que se vea parejo y la búsqueda la encuentre.
  function fechaPareja(t) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
    return m ? dos(m[1]) + '/' + dos(m[2]) + '/' + m[3] : t;
  }
  const esFechaPJN = (t) => /^\d{2}\/\d{2}\/\d{4}$/.test(t || '');

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

  // ---------------------------------------------------------------- campos de fecha (1.3.9)
  // Las fechas se escriben como dd/mm/aaaa en un campo de texto: las barras
  // se ponen solas y el año puede ir con dos cifras (26 = 2026). Por dentro
  // se guardan como aaaa-mm-dd. Reemplaza al campo de fecha del navegador,
  // que al escribir el año se volvía al día (25/09/2026).
  const textoDesdeISO = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
  // Fecha en aaaa-mm-dd a partir de lo escrito; '' si está vacío; null si no es una fecha entera y válida.
  function isoDesdeTexto(txt, admiteAnioCorto) {
    const d = String(txt || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length !== 8 && !(admiteAnioCorto && d.length === 6)) return null;
    const dia = +d.slice(0, 2), mes = +d.slice(2, 4);
    const anio = d.length === 8 ? +d.slice(4) : 2000 + +d.slice(4);
    const f = new Date(anio, mes - 1, dia);
    if (anio < 1900 || f.getFullYear() !== anio || f.getMonth() !== mes - 1 || f.getDate() !== dia) return null;
    return anio + '-' + dos(mes) + '-' + dos(dia);
  }
  const esCampoFecha = (el) => !!(el && el.classList && el.classList.contains('sj-fecha'));
  const campoFecha = (atributos, iso, titulo) => '<input type="text" class="sj-fecha" ' + atributos + ' inputmode="numeric" maxlength="10" placeholder="dd/mm/aaaa" title="' + esc(titulo || 'Fecha como dd/mm/aaaa') + '" value="' + esc(textoDesdeISO(iso)) + '">';
  // Pone las barras a medida que se escribe (solo se aceptan cifras).
  function ordenarCampoFecha(input) {
    const d = input.value.replace(/\D/g, '').slice(0, 8);
    let t = d.slice(0, 2);
    if (d.length > 2) t += '/' + d.slice(2, 4);
    if (d.length > 4) t += '/' + d.slice(4);
    if (t !== input.value) input.value = t;
    return d;
  }
  // Valor del campo para guardar: '' vacío, aaaa-mm-dd si la fecha está
  // entera, null si está a medio escribir o mal (en rojo).
  function valorDeCampoFecha(input) {
    const d = ordenarCampoFecha(input);
    const iso = d.length === 8 ? isoDesdeTexto(d) : (d ? null : '');
    input.classList.toggle('mal', d.length === 8 && iso === null);
    return iso;
  }
  const valorDeCampo = (input) => (esCampoFecha(input) ? valorDeCampoFecha(input) : input.value);
  // Al salir del campo, un año de dos cifras se completa (26 = 2026) y se avisa al resto.
  function alSalirDeCampoFecha(e) {
    const input = e.target;
    if (!esCampoFecha(input)) return;
    const d = input.value.replace(/\D/g, '');
    if (d.length !== 6) return;
    const iso = isoDesdeTexto(d, true);
    input.value = iso ? textoDesdeISO(iso) : input.value;
    input.classList.toggle('mal', !iso);
    if (iso) input.dispatchEvent(new Event('input', { bubbles: true }));
  }
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
    document.querySelectorAll(PJN.usuario.cajas).forEach(agregar);
    // Por si el PJN cambia el marcado: lo que rodea al ícono de usuario.
    document.querySelectorAll(PJN.usuario.iconos).forEach((i) => {
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

  const SIN_CUENTA = 'No se pudo identificar con qué cuenta se ingresó al PJN. Lo que se lee del PJN puede usarse igual, pero no se guarda nada ni se muestra lo guardado (etiquetas, anotaciones y registro de notas): los datos de dos cuentas no deben mezclarse. Recargá la página; si el aviso persiste, informá en qué pantalla ocurre.';

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

  // Filas de la tabla con forma de causa, se entienda o no el número. Sirve para
  // el control contra el total del PJN: una fila rara no es una página perdida.
  const filasCrudas = (doc) => filasTabla(tablaDe(doc)).filter((tr) => tr.cells && tr.cells.length >= 5).length;

  // El total de causas que el PJN dice tener en la lista que muestra, o null si
  // no lo informa (entonces no hay contra qué controlar).
  function totalDeclarado(doc) {
    const m = PJN.totalLista.exec(limpio(textoPJN(doc)));
    return m ? parseInt(m[1].replace(/\./g, ''), 10) : null;
  }

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
      const vence = setTimeout(() => { let v; try { v = listo(); } catch (e) { v = false; } fin(v); }, ms);
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
    const sel = [...doc.querySelectorAll('select')].find((s) => !esNuestro(s) && [...s.options].some(esOpcionFecha));
    if (!sel) return null;
    const opt = [...sel.options].find(esOpcionFecha);
    const boton = [...doc.querySelectorAll('a, input[type=submit], input[type=button], button')]
      .find((b) => !esNuestro(b) && /^ordenar$/i.test(limpio(b.value || b.textContent)));
    return { sel, opt, boton };
  }

  // La opción FECHA del desplegable de orden, por su texto o por su valor. Hasta
  // la 1.6.0, la comprobación de "ya está puesta" miraba el valor solo cuando el
  // texto estaba vacío, y con un texto distinto se volvía a pedir el orden cada vez.
  const esOpcionFecha = (o) => /^fecha$/i.test(limpio(o.textContent)) || /^fecha$/i.test(limpio(o.value));

  // Deja la lista del marco ordenada por fecha. Devuelve true si hizo falta pedirlo.
  // El PJN puede resolverlo de tres formas: enviando el formulario (ahí se repite
  // el pedido por fetch, como con las demás acciones), navegando la página, o por
  // ajax. Las tres se esperan igual: hasta que la lista sea otra.
  async function ordenarPorFecha(fr, informar) {
    const o = selectorOrden(fr.contentDocument);
    if (!o || !o.boton) return false;
    const puesto = () => {
      const s = selectorOrden(fr.contentDocument);
      if (!s) return false;
      const op = s.sel.options[s.sel.selectedIndex];
      return !!op && esOpcionFecha(op);
    };
    if (puesto()) return false;
    informar('Pidiendo al PJN la lista ordenada por fecha...');
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

  const enlaceOjo = (tr) => [...tr.querySelectorAll('a')].find((a) => a.querySelector(PJN.ojo.icono) || PJN.ojo.texto.test(a.textContent));
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

  // Plazo máximo para que el PJN conteste el pedido de abrir una causa. Sin
  // plazo, un pedido que el PJN no contestaba dejaba la apertura esperando
  // indefinidamente: el aviso "Abriendo..." quedaba fijo y las aperturas y
  // descargas siguientes no arrancaban hasta recargar la página (1.5.2).
  const ESPERA_ACCION = 60000;

  // Cuerpo del pedido: los campos del formulario más los propios del enlace.
  function cuerpoDeAccion(w, form, p) {
    const cuerpo = new w.URLSearchParams();
    new w.FormData(form).forEach((v, k) => { if (typeof v === 'string') cuerpo.append(k, v); });
    p.pares.forEach(([k, v]) => cuerpo.append(k, v));
    return cuerpo;
  }

  // Envía el pedido desde el marco y espera la respuesta completa. Si el PJN no
  // termina de contestar dentro del plazo, el pedido se corta.
  async function enviarConPlazo(w, url, cuerpo) {
    const ctl = new w.AbortController();
    const vence = setTimeout(() => ctl.abort(), ESPERA_ACCION);
    try {
      const r = await w.fetch(url, {
        method: 'POST', body: cuerpo, credentials: 'include', signal: ctl.signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      try { await r.text(); } catch (e) { /* solo interesa la dirección */ }
      return r;
    } finally {
      clearTimeout(vence);
    }
  }

  // Traduce la falla del envío a un mensaje para la pantalla.
  function errorDeEnvio(e) {
    if (e && e.name === 'AbortError') return new Error('el PJN no contestó dentro del minuto de espera. Probá de nuevo', { cause: e });
    return new Error('el PJN no respondió (si la sesión venció, recargá la página)', { cause: e });
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
    let r;
    try {
      r = await enviarConPlazo(w, form.action, cuerpoDeAccion(w, form, p));
    } catch (e) {
      throw errorDeEnvio(e);
    }
    if (!r.ok) throw new Error('el PJN respondió con error ' + r.status);
    return r.url;
  }

  // ------------------------------------------------ 3.3 lectura de una lista

  let cancelarLectura = false;

  // Recorre todas las páginas de la lista del marco. Además de las causas,
  // devuelve cuántas filas pasaron y el total que informaba el PJN al empezar y
  // al terminar, para controlar que no se haya perdido nada.
  async function recorrerLista(fr, que, informar) {
    const doc = fr.contentDocument;
    if (paginaActiva(doc) !== 1 && !(await irAPagina(doc, 1))) throw new Error('no se pudo volver a la primera página');
    const out = [];
    const vistos = {};
    const conteo = { filas: 0, crudas: 0, alEmpezar: totalDeclarado(doc), alTerminar: null };
    for (let vuelta = 0; vuelta < 400; vuelta++) {
      if (cancelarLectura) throw new Error('cancelado');
      const pag = paginaActiva(doc);
      const filas = filasDe(doc);
      conteo.filas += filas.length;
      conteo.crudas += filasCrudas(doc);
      filas.forEach((f) => {
        if (vistos[f.exp]) return;
        vistos[f.exp] = true;
        // pos: el lugar que ocupa en la lista del PJN. Con la misma fecha, el PJN
        // ordena por la hora de la última actuación, que no muestra: copiar su orden
        // es la única forma de desempatar igual que él.
        out.push({ exp: f.exp, dep: f.dep, car: f.car, sit: f.sit, ult: f.ult, fav: f.fav, pag, pos: out.length });
      });
      informar('Leyendo ' + que + ': página ' + pag + ' (' + plural(out.length, 'causa', 'causas') + ')');
      const sig = enlaceSiguiente(doc);
      if (!sig) break;
      const fAntes = firmaLista(doc);
      sig.click();
      if (!(await esperarCambio(doc, pag, fAntes, 25000))) throw new Error('la página ' + (pag + 1) + ' no respondió');
    }
    conteo.alTerminar = totalDeclarado(doc);
    return { causas: out, conteo };
  }

  // Compara lo leído con el total que informa el PJN. Devuelve null si coincide
  // o si el PJN no informó el total, y si no, la descripción de la diferencia.
  // Se admiten tanto las filas entendidas como las filas con forma de causa: lo
  // que se busca es una página que no llegó, no una fila con otro formato.
  function faltanteDeLectura(conteo) {
    const c = conteo || {};
    const ini = typeof c.alEmpezar === 'number' ? c.alEmpezar : null;
    const fin = typeof c.alTerminar === 'number' ? c.alTerminar : null;
    if (ini === null && fin === null) return null;
    if (ini !== null && fin !== null && ini !== fin) return 'la lista cambió mientras se leía (el PJN pasó de informar ' + ini + ' a ' + fin + ')';
    const esperado = fin !== null ? fin : ini;
    if (c.filas === esperado || c.crudas === esperado) return null;
    return 'el PJN informa ' + plural(esperado, 'causa', 'causas') + ' y se leyeron ' + c.filas;
  }

  // Cuántas veces se lee una lista entera antes de darla por incompleta.
  const INTENTOS_LECTURA = 2;

  function errorIncompleta(que, falta) {
    const e = new Error('la lectura de ' + que + ' quedó incompleta: ' + falta);
    e.incompleta = true;
    return e;
  }

  // Recorre la lista y la controla contra el total del PJN.
  async function recorrerControlada(fr, que, informar) {
    const r = await recorrerLista(fr, que, informar);
    const falta = faltanteDeLectura(r.conteo);
    if (falta) throw errorIncompleta(que, falta);
    return r.causas;
  }

  // Lee una lista entera: primero lo que está en trámite y después, con "Ver
  // todos los expedientes", lo que está fuera de trámite. Si alguna de las dos
  // no coincide con el total que informa el PJN, se vuelve a pedir la lista
  // desde el principio; si sigue sin coincidir, no se devuelve nada.
  async function leerLista(tipo, informar) {
    for (let intento = 1; ; intento++) {
      try {
        return await leerListaUnaVez(tipo, informar);
      } catch (e) {
        if (!e || !e.incompleta || intento >= INTENTOS_LECTURA) throw e;
        informar(mayuscula(e.message) + '. Se vuelve a leer...');
      }
    }
  }

  async function leerListaUnaVez(tipo, informar) {
    const L = LISTAS[tipo];
    const fr = crearMarco();
    try {
      informar('Abriendo ' + L.pjn + ' en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA[tipo]; }, esLista);
      if (tipoLista(fr.contentDocument) !== tipo) throw new Error('el PJN no devolvió la lista de ' + L.pjn);
      const casilla0 = casillaVerTodos(fr.contentDocument);
      if (casilla0 && casilla0.checked) throw new Error('la lista de ' + L.pjn + ' llegó con la casilla "Ver todos" marcada');
      // Primero, que el PJN la ordene por fecha: así el orden que se guarda es el
      // mismo que se ve en el sitio, con la hora adentro.
      try { await ordenarPorFecha(fr, informar); } catch (e) { /* si no se puede, se lee igual */ }
      const tramite = await recorrerControlada(fr, L.nombre + ' en trámite', informar);

      const casilla = casillaVerTodos(fr.contentDocument);
      const consultar = botonConsultar(fr.contentDocument);
      let todas = null;
      if (casilla && consultar) {
        if (cancelarLectura) throw new Error('cancelado');
        informar('Pidiendo también las causas fuera de trámite de ' + L.pjn + '...');
        await esperarCarga(fr, () => { casilla.checked = true; consultar.click(); }, esLista);
        const casilla2 = casillaVerTodos(fr.contentDocument);
        if (!casilla2 || !casilla2.checked) throw new Error('el PJN no tomó "Ver todos los expedientes"');
        try { await ordenarPorFecha(fr, informar); } catch (e) { /* si no se puede, se lee igual */ }
        todas = await recorrerControlada(fr, L.nombre + ' fuera de trámite', informar);
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

  async function marcoLista(tipo, todas, informar) {
    if (marcoVivo(tipo, todas)) return MT.fr;
    soltarMarcoTrabajo();
    const fr = crearMarco();
    MT.fr = fr;
    informar('Abriendo ' + LISTAS[tipo].pjn + ' en segundo plano...');
    await esperarCarga(fr, () => { fr.src = RUTA[tipo]; }, esLista);
    if (tipoLista(fr.contentDocument) !== tipo) throw new Error('el PJN no devolvió la lista de ' + LISTAS[tipo].pjn);
    if (todas) {
      const casilla = casillaVerTodos(fr.contentDocument);
      const consultar = botonConsultar(fr.contentDocument);
      if (casilla && consultar && !casilla.checked) {
        informar('Pidiendo las causas fuera de trámite...');
        await esperarCarga(fr, () => { casilla.checked = true; consultar.click(); }, esLista);
      }
    }
    MT.tipo = tipo; MT.todas = todas; MT.ts = Date.now();
    return fr;
  }

  const filaEn = (doc, k) => (filasDe(doc).find((f) => f.exp === k) || {}).tr || null;

  async function buscarFila(fr, dc, todas, informar) {
    const doc = fr.contentDocument;
    const esperada = todas ? (dc.pagTodas || dc.pagTramite) : (dc.pagTramite || dc.pagTodas);
    let tr = filaEn(doc, dc.exp);
    if (!tr && esperada) {
      informar('Buscando ' + dc.exp + ' en la página ' + esperada + '...');
      if (await irAPagina(doc, esperada)) tr = filaEn(doc, dc.exp);
    }
    if (!tr && (await irAPagina(doc, 1))) {
      for (let i = 0; i < 400 && !tr; i++) {
        tr = filaEn(doc, dc.exp);
        if (tr) break;
        const sig = enlaceSiguiente(doc);
        if (!sig) break;
        const pag = paginaActiva(doc), f = firmaLista(doc);
        informar('Buscando ' + dc.exp + ': página ' + (pag + 1) + '...');
        sig.click();
        if (!(await esperarCambio(doc, pag, f, 25000))) break;
      }
    }
    return tr;
  }

  // Devuelve { fr, tr, tipo } con la fila de la causa en una lista del PJN.
  // soloRel: para lo que solo existe en Relacionados (presentar escrito).
  async function ubicarCausa(k, informar, soloRel) {
    const tipos = (VISTA === 'fav' ? ['fav', 'rel'] : ['rel', 'fav']).filter((t) => !soloRel || t === 'rel');
    for (const tipo of tipos) {
      const dc = causaEn(tipo, k);
      if (!dc) continue;
      for (let intento = 0; intento < 2; intento++) {
        const fr = await marcoLista(tipo, !dc.tramite, informar);
        const tr = await buscarFila(fr, dc, !dc.tramite, informar);
        if (tr) return { fr, tr, tipo };
        // La vista del marco puede haber vencido en el servidor: se abre de nuevo.
        soltarMarcoTrabajo();
      }
    }
    throw new Error('no se encuentra ' + k + (soloRel ? ' en Relacionados' : ' en las listas del PJN') + '. Probá con Actualizar');
  }

  // Abre la causa en segundo plano y devuelve la dirección del expediente.
  // Si la vista del marco venció en el servidor (1.6.0: pasa, por ejemplo,
  // después de consultas en otras conversaciones del PJN, como las de la
  // consulta pública), el ojo lleva al formulario de la consulta pública en
  // lugar del expediente: se prueba una vez más con la lista recién pedida.
  // Cualquier otra falla se informa como antes, sin repetir.
  function direccionDe(k, accion, informar) {
    return conMarco(async () => {
      try {
        return await direccionEnMarcoDe(k, accion, informar);
      } catch (e) {
        if (!e.marcoVencido) throw e;
        return direccionEnMarcoDe(k, accion, informar);
      }
    });
  }

  async function direccionEnMarcoDe(k, accion, informar) {
    const u = await ubicarCausa(k, informar, accion === 'libro');
    const a = accion === 'libro' ? enlaceMenu(u.tr, PJN.menuFila.libro) : enlaceOjo(u.tr);
    if (!a) throw new Error(accion === 'libro' ? 'la fila de ' + k + ' no tiene "Libro digital"' : 'la fila de ' + k + ' no tiene el enlace para ver el expediente');
    informar((accion === 'libro' ? 'Pidiendo el libro digital de ' : 'Abriendo ') + k + '...');
    let url;
    try {
      url = await postAccion(u.fr, a);
    } catch (e) {
      // La vista del marco pudo vencer en el servidor: el próximo pedido arranca de cero.
      soltarMarcoTrabajo();
      throw e;
    }
    let x;
    try { x = new URL(url); } catch (e) { x = null; }
    const ok = x && x.origin === location.origin && x.searchParams.get('cid') &&
      (accion === 'libro' ? PJN.dirLibro.test(x.pathname) : PJN.dirExpediente.test(x.pathname));
    if (!ok) {
      soltarMarcoTrabajo();
      const vencida = !!x && x.origin === location.origin && x.pathname === PJN.publica.ruta;
      throw Object.assign(new Error('el PJN no abrió ' + k + ' (si la sesión venció, recargá la página)'), { marcoVencido: vencida });
    }
    return x.href;
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

  // El enlace "Descargar" de una fila de actuaciones: si no lo tiene, la fila
  // es un movimiento sin documento.
  function enlacesDeFila(tr) {
    const links = [...tr.querySelectorAll('a[href]')];
    return {
      descargar: links.find((a) => PJN.dirVisor.test(a.href) && /descargar/i.test(a.textContent)),
      ver: links.find((a) => PJN.dirVisor.test(a.href) && /^ver$/i.test(limpio(a.textContent)))
    };
  }

  // Los datos de las celdas de una fila de la tabla de actuaciones.
  function celdasDeActuacion(c) {
    return {
      oficina: sinRotulo(c[1], /^oficina\s*:\s*/i),
      fecha: fechaPareja(sinRotulo(c[2], /^fecha\s*:\s*/i)),
      tipo: sinRotulo(c[3], /^tipo(\s+de)?\s+actuaci[oó]n\s*:\s*/i),
      detalle: sinRotulo(c[4], /^(descripci[oó]n\s*\/\s*)?detalle\s*:\s*/i),
      fojas: c[5] ? sinRotulo(c[5], /^a\s*fs\.?\s*:\s*/i) : ''
    };
  }

  // Una fila con PDF.
  function actuacionDeFila(tr, l, hist) {
    const c = tr.cells;
    const base = { url: l.descargar.href, ver: l.ver ? l.ver.href : '' };
    if (c && c.length >= 5) return Object.assign(base, celdasDeActuacion(c), { hist: !!hist });
    const texto = limpio(tr.textContent);
    const f = /(\d{1,2}\/\d{1,2}\/\d{4})/.exec(texto);
    return Object.assign(base, { oficina: '', fecha: f ? fechaPareja(f[1]) : '', tipo: '', detalle: texto.replace(/descargar|\bver\b/ig, '').slice(0, 160), fojas: '', hist: !!hist });
  }

  // Una fila sin PDF (1.4.4): un movimiento del PJN, como "EN LETRA" o "EN
  // DESPACHO". Se muestra en la lista de la causa, pero no hay nada que bajar.
  // Solo cuenta si tiene las celdas de una actuación y una fecha.
  function movimientoDeFila(tr, hist) {
    const c = tr.cells;
    if (!c || c.length < 5) return null;
    const d = celdasDeActuacion(c);
    if (!esFechaPJN(d.fecha)) return null;
    return Object.assign({ mov: true, url: '', ver: '' }, d, { hist: !!hist });
  }

  // Todas las filas de la tabla de actuaciones, en el orden del PJN: las que
  // tienen PDF y los movimientos sin documento.
  function renglonesActuaciones(doc, hist) {
    const out = [];
    filasTabla(tablaActuaciones(doc)).forEach((tr) => {
      const l = enlacesDeFila(tr);
      const r = l.descargar ? actuacionDeFila(tr, l, hist) : movimientoDeFila(tr, hist);
      if (r) out.push(r);
    });
    return out;
  }

  // Solo las actuaciones con PDF, que son las que se pueden descargar.
  const actuacionesDe = (doc, hist) => renglonesActuaciones(doc, hist).filter((r) => !r.mov);

  const firmaActuaciones = (doc) => filasTabla(tablaActuaciones(doc)).map((tr) => limpio(tr.textContent).slice(0, 60)).join('|');

  // Recorre todas las páginas de actuaciones. Devuelve las que tienen PDF y los
  // movimientos sin documento; cada uno lleva pos, su lugar en la tabla del PJN,
  // para poder mostrarlos intercalados en el mismo orden que el sitio.
  // Lo leído hasta una página que no se pidió (tope) o que el PJN no contestó.
  const tramoCortado = (acts, movs, filas, pag, hist, salteada) => ({ acts, movs, filas, cortada: { pag, hist, salteada } });

  // op (1.5.3): { tope, parcial }. tope es la primera página que no se pide;
  // con parcial, si el PJN no contesta una página se devuelve lo leído hasta
  // ahí en lugar de descartarlo todo.
  async function recorrerActuaciones(doc, hist, informar, cortar, op) {
    const o = op || {};
    // Si no se puede volver a la primera página, se corta (1.6.1): seguir desde
    // la que estaba dejaría afuera, sin aviso, las actuaciones más nuevas.
    if (paginaActiva(doc, tablaActuaciones) !== 1 && !(await irAPagina(doc, 1, firmaActuaciones, tablaActuaciones))) {
      throw new Error('no se pudo volver a la primera página de actuaciones');
    }
    const out = [];
    const movs = [];
    const vistos = {};
    let pos = 0;
    for (let v = 0; v < 500; v++) {
      if (cortar && cortar()) throw new Error('cancelado');
      const pag = paginaActiva(doc, tablaActuaciones);
      renglonesActuaciones(doc, hist).forEach((a, i) => {
        const k = a.mov ? 'mov:' + pag + ':' + i : a.url;
        if (vistos[k]) return;
        vistos[k] = true;
        a.pos = pos++;
        (a.mov ? movs : out).push(a);
      });
      informar('Leyendo actuaciones' + (hist ? ' históricas' : '') + ': página ' + pag + ' (' + out.length + ' con PDF)');
      const sig = enlaceSiguiente(doc, tablaActuaciones);
      if (!sig) break;
      if (o.tope && pag + 1 >= o.tope) return tramoCortado(out, movs, pos, pag + 1, hist, true);
      const f = firmaActuaciones(doc);
      sig.click();
      if (!(await esperarCambio(doc, pag, f, 25000, firmaActuaciones, tablaActuaciones))) {
        if (o.parcial) return tramoCortado(out, movs, pos, pag + 1, hist, false);
        throw new Error('la página ' + (pag + 1) + ' de actuaciones no respondió');
      }
    }
    return { acts: out, movs, filas: pos };
  }

  // La casilla del filtro de actuaciones que lleva ese rótulo. El rótulo puede
  // ser su label, el texto que la sigue o el de la etiqueta que la envuelve.
  function rotuloDeCasilla(c) {
    const lab = c.id ? [...c.ownerDocument.querySelectorAll('label')].find((l) => l.htmlFor === c.id) : null;
    if (lab) return limpio(lab.textContent);
    const env = c.closest('label');
    if (env) return limpio(env.textContent);
    let n = c.nextSibling;
    while (n && n.nodeType === 3 && !limpio(n.nodeValue)) n = n.nextSibling;
    return n ? limpio(n.textContent) : '';
  }

  const casillaVerTodasActs = (doc) => [...doc.querySelectorAll('input[type=checkbox]')]
    .find((c) => !esNuestro(c) && PJN.filtroActs.verTodos.test(rotuloDeCasilla(c)));

  const botonAplicarActs = (doc) => [...doc.querySelectorAll('input[type=submit], input[type=button], button, a')]
    .find((b) => !esNuestro(b) && PJN.filtroActs.aplicar.test(limpio(b.value || b.textContent)));

  // Espera la respuesta del PJN después de "Aplicar": otra página en el marco, o
  // la tabla redibujada por ajax (aunque traiga las mismas filas).
  function esperarFiltroActs(fr, doc0, esperado) {
    const tabla0 = tablaActuaciones(doc0);
    let tocada = false;
    const obs = new MutationObserver(() => { tocada = true; });
    if (tabla0) obs.observe(tabla0.parentNode || tabla0, { childList: true, subtree: true, characterData: true });
    return esperarA(() => {
      const d = fr.contentDocument;
      if (!d || !d.body) return false;
      if (d !== doc0) return d.readyState === 'complete' && esperado(d);
      return tocada || (tabla0 && !tabla0.isConnected);
    }, 20000).finally(() => obs.disconnect());
  }

  // Pide la tabla de actuaciones con "Ver Todos", que es la que trae los
  // movimientos sin documento. Si el PJN no tiene ese filtro, ya lo tiene puesto
  // o no responde, se sigue con lo que muestra: las actuaciones con PDF no
  // dependen del filtro.
  async function verTodasLasActuaciones(fr, esperado) {
    const doc0 = fr.contentDocument;
    const casilla = casillaVerTodasActs(doc0);
    const boton = botonAplicarActs(doc0);
    if (!casilla || !boton || casilla.checked) return;
    try {
      const espera = esperarFiltroActs(fr, doc0, esperado);
      casilla.click();
      const url = await postComoClic(fr, () => { boton.click(); });
      if (url) await esperarCarga(fr, () => { fr.src = url; }, esperado);
      else await espera;
      await esperarA(() => !!tablaActuaciones(fr.contentDocument), 8000);
    } catch (e) {
      // Si falla el filtro se lee lo que haya, salvo que la sesión haya vencido:
      // ahí no hay nada que leer, y decir que la causa no tiene actuaciones
      // sería falso.
      if (String(e && e.message) === VENCIDA) throw e;
    }
    const d = fr.contentDocument;
    if (!d || !esperado(d)) throw new Error('el PJN no volvió al expediente después de aplicar su filtro (si la sesión venció, recargá la página)');
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

  // Opciones de recorrido para las actuales o las históricas: el tope guardado
  // vale solo para el tramo en el que se anotó.
  const opcionesDeTramo = (op, hist) => ({ parcial: !!op.parcial, tope: op.tope && !!op.tope.hist === hist ? op.tope.pag : 0 });

  // Lee todas las actuaciones con PDF de un expediente, actuales e históricas,
  // en un marco oculto y a partir de su cid. op (1.5.3, opcional): { parcial,
  // tope }; ver recorrerActuaciones. Si un tramo queda cortado, no se sigue con
  // el siguiente y el resultado lleva cortada.
  async function leerActuaciones(cid, informar, cortar, op) {
    const opc = op || {};
    const fr = crearMarco();
    try {
      informar('Abriendo el expediente en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      await verTodasLasActuaciones(fr, esExpediente);
      const d1 = fr.contentDocument;
      const datos = datosExpediente(d1);
      const hayHist = tieneHistoricas(d1);
      const actuales = await recorrerActuaciones(d1, false, informar, cortar, opcionesDeTramo(opc, false));
      let historicas = { acts: [], movs: [], filas: 0 };
      if (hayHist && !actuales.cortada) {
        if (cortar && cortar()) throw new Error('cancelado');
        informar('Abriendo las actuaciones históricas...');
        await esperarCarga(fr, () => { fr.src = RUTA.hist + '?cid=' + encodeURIComponent(cid); }, esHistoricas);
        await verTodasLasActuaciones(fr, esHistoricas);
        historicas = await recorrerActuaciones(fr.contentDocument, true, informar, cortar, opcionesDeTramo(opc, true));
        // Las históricas van después de las actuales, también en el orden.
        historicas.acts.concat(historicas.movs).forEach((a) => { a.pos += actuales.filas; });
      }
      const vistos = {};
      const todas = [];
      actuales.acts.concat(historicas.acts).forEach((a) => { if (!vistos[a.url]) { vistos[a.url] = true; todas.push(a); } });
      return Object.assign(datos, { cid, actuaciones: todas, movimientos: actuales.movs.concat(historicas.movs),
        cortada: actuales.cortada || historicas.cortada || null });
    } finally {
      fr.remove();
    }
  }

  // (1.5.3) Página de actuaciones que el PJN no contesta. Relevado el
  // 30/09/2026 en una causa real: la lectura se detuvo dos veces seguidas en la
  // misma página, y mientras ese pedido quedó abierto en el PJN la causa no
  // respondió durante más de diez minutos, tampoco en la página del PJN ni al
  // abrirla de nuevo. Se anota la página por causa y, durante un día, no se la
  // vuelve a pedir sola al abrir el expediente.
  const VIGENCIA_TOPE = 24 * 60 * 60 * 1000;

  function topeGuardado(exp) {
    const t = exp ? leerDeCuenta(K_TOPE_ACTS, {})[exp] : null;
    return t && t.pag && Date.now() - (t.ts || 0) < VIGENCIA_TOPE ? { pag: t.pag, hist: !!t.hist, ts: t.ts } : null;
  }

  function anotarTope(exp, c) {
    if (!exp || !c) return;
    const d = leerDeCuenta(K_TOPE_ACTS, {});
    d[exp] = { pag: c.pag, hist: !!c.hist, ts: Date.now() };
    guardarEnCuenta(K_TOPE_ACTS, d);
  }

  function borrarTope(exp) {
    const d = leerDeCuenta(K_TOPE_ACTS, {});
    if (!exp || !d[exp]) return;
    delete d[exp];
    guardarEnCuenta(K_TOPE_ACTS, d);
  }

  // ---------------------- 3.6 las otras solapas del expediente: cómo se leen
  //
  // Intervinientes, Vinculados y Recursos vienen vacías en el HTML: el PJN las
  // llena recién cuando se las toca, y al tocarlas recarga el expediente con
  // otro número de consulta. Se las toca en un marco oculto, sin mover la página
  // que se está mirando. Las solapas se reconocen por su texto, no por su id,
  // porque los ids que arma JSF cambian.

  const SOLAPAS_EXP = PJN.solapasExp;

  function cabezaSolapa(doc, etiqueta) {
    const tds = [...doc.querySelectorAll(PJN.cabezaSolapa)].filter((td) => norm(textoVisible(td)) === norm(etiqueta));
    return tds.find((td) => td.offsetParent) || tds.find((td) => PJN.solapaInactiva.test(td.id)) || tds[0] || null;
  }
  const panelDeSolapa = (doc, td) => (td ? doc.getElementById(td.id.replace(PJN.sufijoSolapa, '')) : null);
  const panelVivo = (fr, etiqueta) => {
    const d = fr.contentDocument;
    return panelDeSolapa(d, cabezaSolapa(d, etiqueta));
  };
  const firmaPanel = (p, solapa) => (p ? filasTabla(tablaPrincipal(p, solapa)).map((tr) => limpio(tr.textContent).slice(0, 50)).join('|') + '#' + paginaActiva(p) : '');
  // El PJN repite el rótulo en el encabezado ("TOMO/FOLIO :TOMO/FOLIO").
  const cabezaLimpia = (s) => { const m = /^(.*?)\s*:\s*\1$/.exec(limpio(s)); return m ? m[1] : limpio(s); };

  // Intervinientes trae varias tablas, cada una bajo su título (h2): PARTES,
  // con su propio paginador, y, cuando los hay, PERITOS y FISCALES. Las otras
  // dos solapas traen una sola. Ver "Intervinientes" al comienzo del archivo.

  // Si una tabla está dentro de otra, sin salir del panel.
  function dentroDeOtraTabla(t, p) {
    for (let e = t.parentElement; e && e !== p; e = e.parentElement) if (e.tagName === 'TABLE') return true;
    return false;
  }

  // Las tablas de datos del panel: con encabezados y no anidadas.
  const tablasDePanel = (p) => (p ? [...p.querySelectorAll('table')].filter((t) => !dentroDeOtraTabla(t, p) && t.querySelector('th')) : []);

  // El título que el PJN pone arriba de una tabla: el encabezado anterior,
  // mirando los hermanos de la tabla y, si no hay, los de quien la contiene.
  function encabezadoPrevio(t, p) {
    for (let e = t; e && e !== p; e = e.parentElement) {
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) {
        if (/^H[1-6]$/.test(s.tagName)) return textoVisible(s);
        if (s.querySelector && s.querySelector('table')) return '';
      }
    }
    return '';
  }

  // "FISCALES" → "Fiscales". Sin encabezado, se usa el identificador que el
  // PJN le da a cada tabla (participantsTable, peritosTable, fiscalesTable).
  const TITULOS_TABLA = { participants: 'Partes', peritos: 'Peritos', fiscales: 'Fiscales' };
  function tituloTabla(t, p) {
    const h = limpio(encabezadoPrevio(t, p));
    if (h) return h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
    const m = /([a-z]+)Table$/i.exec(t.id || '');
    return (m && TITULOS_TABLA[m[1]]) || '';
  }

  // La tabla que se pagina: en Intervinientes, la de las partes; en las otras
  // solapas, la primera. Sin tabla de partes, no hay qué paginar.
  function tablaPrincipal(p, solapa) {
    if (!p) return null;
    if (solapa !== 'int') return p.querySelector('table');
    const ts = tablasDePanel(p);
    return ts.find((t) => /^partes$/i.test(tituloTabla(t, p))) || ts.find((t) => !tituloTabla(t, p)) || null;
  }

  const cabezasDeTabla = (t) => {
    const cab = t ? ((t.tHead && t.tHead.rows[0]) || t.rows[0]) : null;
    return cab ? [...cab.cells].map((c) => cabezaLimpia(textoVisible(c))) : [];
  };

  // Las filas de la tabla con algún texto, como arreglos de celdas.
  const filasLeidas = (t) => filasTabla(t).map((tr) => [...tr.cells].map((x) => textoVisible(x)))
    .filter((c) => !!limpio(c.join(' ')));

  // Suma las filas de una página, salvo que la página entera ya se haya leído
  // (el paginador que no avanzó). Hasta la 1.6.0 se descartaba cada fila
  // repetida, y en Intervinientes las filas se repiten de verdad: dos
  // imputados con la misma defensoría oficial llevan la misma fila debajo de
  // cada uno, y al segundo le desaparecía la defensa.
  function sumarPagina(t, filas, vistas) {
    const pagina = filasLeidas(t);
    const firma = pagina.map((c) => c.join('|')).join('\n');
    if (vistas.has(firma)) return;
    vistas.add(firma);
    filas.push(...pagina);
  }

  // Las demás tablas de Intervinientes (peritos, fiscales), con su título.
  // No tienen paginador propio: se leen una vez.
  function gruposDePanel(p, principal) {
    return tablasDePanel(p).filter((t) => t !== principal)
      .map((t) => ({ titulo: tituloTabla(t, p) || 'Otros intervinientes', cabs: cabezasDeTabla(t), filas: filasLeidas(t) }))
      .filter((g) => g.filas.length);
  }

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
    // Con el mismo plazo de un minuto que los demás pedidos (1.6.3): hasta la
    // 1.6.2, un PJN que no contestaba dejaba colgada la lectura de la causa, la
    // de las listas o la cola de descargas, sin forma de cortarla.
    let r;
    try { r = await enviarConPlazo(w, form.action, cuerpo); } catch (e) { throw errorDeEnvio(e); }
    if (!r.ok) throw new Error('el PJN respondió con error ' + r.status);
    return r.url;
  }

  // Devuelve el panel de la solapa. seLleno queda en el propio panel: dice si el
  // PJN alcanzó a poner algo adentro.
  async function abrirSolapa(fr, etiqueta) {
    let seLleno = true;
    let td = cabezaSolapa(fr.contentDocument, etiqueta);
    if (!td) throw new Error('el expediente no tiene la solapa ' + etiqueta);
    if (PJN.solapaInactiva.test(td.id)) {
      const base = td.id.replace(PJN.solapaInactiva, '');
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
  async function leerSolapaExp(cid, solapa, informar) {
    const etiqueta = SOLAPAS_EXP[solapa];
    const fr = crearMarco();
    try {
      informar('Abriendo el expediente en segundo plano...');
      await esperarCarga(fr, () => { fr.src = RUTA.exp + '?cid=' + encodeURIComponent(cid); }, esExpediente);
      informar('Pidiendo ' + etiqueta + ' al PJN...');
      let p = await abrirSolapa(fr, etiqueta);
      const seLleno = p.__seLleno !== false;
      const cabs = [];
      const filas = [];
      const vistas = new Set();
      // Peritos y fiscales, en Intervinientes: se leen en la primera página.
      const grupos = solapa === 'int' ? gruposDePanel(p, tablaPrincipal(p, solapa)) : [];
      // Si el paginador del PJN se corta a mitad de camino, lo leído no es toda
      // la lista: hay que decirlo y no mostrarlo como si estuviera completo.
      let completa = true;
      let v = 0;
      for (; v < 300; v++) {
        p = panelVivo(fr, etiqueta) || p;
        const t = tablaPrincipal(p, solapa);
        if (!t) { if (v) completa = false; break; }
        if (!cabs.length) cabs.push(...cabezasDeTabla(t));
        sumarPagina(t, filas, vistas);
        informar('Leyendo ' + etiqueta + ': ' + plural(filas.length, 'fila', 'filas'));
        const sig = enlaceSiguiente(p);
        if (!sig) break;
        const antes = firmaPanel(p, solapa);
        sig.click();
        // Se pide un panel vivo de verdad: sin panel, la firma vacía daba por
        // cumplida la espera al instante y el bucle giraba en falso.
        if (!(await esperarA(() => { const pv = panelVivo(fr, etiqueta); return !!pv && firmaPanel(pv, solapa) !== antes; }, 20000))) { completa = false; break; }
      }
      if (v >= 300) completa = false;
      // Sin filas y sin haberse llenado, no se sabe si la solapa está vacía.
      if (!filas.length && !grupos.length && !seLleno) completa = false;
      return { cabs, filas, completa, grupos };
    } finally {
      fr.remove();
    }
  }

  // Abre una causa vinculada: se vuelve a pedir la solapa y se usa el ojo de su fila.
  async function direccionVinculado(cid, exp, informar) {
    const fr = crearMarco();
    try {
      informar('Buscando ' + exp + ' entre los vinculados...');
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
          informar('Abriendo ' + exp + '...');
          const url = await postAccion(fr, a);
          let x = null;
          try { x = new URL(url); } catch (e) { x = null; }
          if (!x || x.origin !== location.origin || !x.searchParams.get('cid') || !PJN.dirExpediente.test(x.pathname)) {
            throw new Error('el PJN no abrió ' + exp + ' (si la sesión venció, recargá la página)');
          }
          return x.href;
        }
        const sig = enlaceSiguiente(p);
        if (!sig) break;
        const antes = firmaPanel(p);
        sig.click();
        // Un panel vivo de verdad, como en leerSolapaExp: sin panel, la firma
        // vacía daba por cumplida la espera y se leía la página vieja.
        if (!(await esperarA(() => { const pv = panelVivo(fr, SOLAPAS_EXP.vin); return !!pv && firmaPanel(pv) !== antes; }, 20000))) break;
      }
      throw new Error('no se encuentra ' + exp + ' entre los vinculados');
    } finally {
      fr.remove();
    }
  }

  // La última actuación con PDF de una causa, sin leer el expediente entero: el
  // PJN las trae de la más nueva a la más vieja, así que alcanza la primera página.
  async function ultimaActuacionConPDF(k, informar) {
    const url = await direccionDe(k, 'ojo', informar);
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
        vencida = new URL(r.url).host !== location.host || PJN.ingreso.test(t);
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
  // porque el usuario no toque el teclado durante un rato. Lo que espera al
  // usuario no cuenta (1.6.1): actuaciones a la espera de que se las elija, o
  // una tanda de nota en pausa fuera de Relacionados, pueden esperar a alguien
  // que no está, y con el equipo desatendido la sesión tiene que caducar.
  const avanzaSolo = () => colaCorriendo || COLA.some((t) => t.estado !== 'eligiendo' && EN_JUEGO.test(t.estado)) ||
    (notaEnCurso && corridaActiva());
  const hayQueMantenerViva = () => activoHacePoco() || avanzaSolo();

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
  function latirSesion() {
    if (!convieneLatir()) return Promise.resolve(false);
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
        try { buf = await r.arrayBuffer(); } catch (e) {
          // La conexión se cortó mientras llegaba el documento: es una falla de
          // la red, no una actuación sin PDF, así que se reintenta.
          ultimo = { http: r.status, tipo, intentos: intento, motivo: 'la descarga se cortó antes de terminar: ' + mensajeDe(e) };
          await dormir(ESPERAS_REINTENTO[i]);
          continue;
        }
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
        motivo: 'el servidor del PJN respondió con error ' + r.status };
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
    const t = Object.assign({ id: 't' + (++idTrabajo), creado: Date.now(), exp: '', car: '', modo: 'todo', estado: 'en cola', texto: 'En cola', frac: 0, acts: null, movs: [], elegidas: null, filtro: { texto: '', desde: '', hasta: '' }, urls: null, parcial: false }, datos);
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

  // La pausa entre bloques de la cola (1.6.1: aparte). Si entre bloque y
  // bloque pasó más tiempo que el pausa, la cuenta arranca de nuevo: no tiene
  // sentido hacer esperar a quien encola una sola causa media hora después.
  // La pausa se corta si se cancela o si se pide seguir ahora.
  async function pausaDeLaCola() {
    if (hechasSeguidas && Date.now() - ultimaBajada > PAUSA_BLOQUE) hechasSeguidas = 0;
    if (hechasSeguidas < BLOQUE_DESCARGAS) return;
    hechasSeguidas = 0;
    pausaHasta = Date.now() + PAUSA_BLOQUE;
    pintarDescargas();
    while (pausaHasta && Date.now() < pausaHasta && !cortarCola) await dormir(500);
    pausaHasta = 0;
    pintarDescargas();
  }

  // Un trabajo recién encolado: ubica la causa y lee sus actuaciones, si no
  // las tiene. Devuelve 'eligiendo' si queda a la espera de que el usuario
  // elija cuáles descargar; si no, deja las direcciones listas para unir.
  async function prepararTrabajo(t) {
    if (!t.acts) {
      if (!t.cid) {
        t.estado = 'abriendo';
        textoTrabajo(t, 'Buscando la causa en el PJN...', 0);
        const url = await direccionDe(t.exp, 'ojo', (x) => textoTrabajo(t, x));
        t.cid = new URL(url).searchParams.get('cid');
      }
      if (cortarCola) throw new Error('cancelado');
      // Una causa con una página anotada como sin respuesta no se descarga
      // (1.6.3): pedirla de nuevo volvería a trabar la causa en el PJN, y sin
      // ella el PDF saldría incompleto. Hasta la 1.6.2 se la pedía igual.
      const tope = topeGuardado(t.exp);
      if (tope) throw new Error('el PJN no contestó la página ' + tope.pag + ' de actuaciones de esta causa. Abrila y usá "Leer todo" para volver a pedirla');
      t.estado = 'leyendo';
      textoTrabajo(t, 'Leyendo actuaciones...', 0);
      const r = await leerActuaciones(t.cid, (x) => textoTrabajo(t, x), () => cortarCola);
      t.acts = r.actuaciones;
      t.movs = r.movimientos || [];
      t.car = t.car || r.car;
      t.exp = t.exp || r.exp;
    }
    if (t.modo === 'elegir') {
      t.estado = 'eligiendo';
      t.elegidas = new Set();
      textoTrabajo(t, textoActuacionesLeidas({ actuaciones: t.acts, movimientos: t.movs }) + '. Elegí cuáles descargar.', 0);
      pintarDescargas();
      return 'eligiendo';
    }
    t.urls = t.acts.map((a) => a.url);
    t.parcial = false;
    return 'listo';
  }

  // Une los PDF del trabajo y guarda el archivo.
  async function descargarTrabajo(t) {
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
  }

  // Un trabajo que falló o se canceló.
  function trabajoFallido(t, e) {
    const msg = String(e && e.message ? e.message : e);
    // Qué se estaba haciendo cuando falló: distingue un problema al ubicar la
    // causa de uno al leer las actuaciones o al armar el archivo. Se toma
    // antes de marcar el trabajo como fallido.
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
        await pausaDeLaCola();
        // Cancelar durante el pausa corta de verdad. Antes el pedido se perdía
        // acá y la causa que seguía se descargaba igual.
        if (cortarCola) {
          cortarCola = false;
          pintarDescargas();
          continue;
        }
        try {
          if (t.estado === 'en cola' && (await prepararTrabajo(t)) === 'eligiendo') continue;
          await descargarTrabajo(t);
        } catch (e) {
          trabajoFallido(t, e);
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
      if (PJN.nota.columna.test(cab[i].textContent || '')) return i;
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
      const a = f.cells[col].querySelector(PJN.nota.lapiz);
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
  const botonFiltroNota = (doc) => primeroDe(doc, ...PJN.nota.filtro);
  const botonConfirmar = (doc) => primeroDe(doc, ...PJN.nota.confirmar);
  const cartelNota = (doc) => primeroDe(doc, ...PJN.nota.cartel);

  // El botón Confirmar existe siempre: hay que mirar el cartel mismo.
  function popupAbierto() {
    const p = cartelNota(document);
    return !!(p && getComputedStyle(p).display !== 'none');
  }

  /* --- El cartel del PJN después de confirmar la nota ------------------------
     Es lo único que dice si la nota quedó dejada, y de eso depende el resultado
     que se le informa al usuario.

     El PJN usa DOS carteles distintos, relevados sobre el sitio real el
     25/09/2026, con las capturas que mandó el autor:

       salió bien  ->  "Se ha dejado nota en el expediente en forma correcta.
                        Es posible verificar dicha acción en la sección de
                        notas del expediente"        (cartel celeste, sin número)

       ya estaba   ->  "Ya se ha dejado nota con el usuario 20315088705 en el
                        expediente: 32733/1980. No es posible realizar dicha
                        accion mas de una vez al dia por expediente"
                                                     (cartel rojo, con número)

     Hasta la 1.3.5 solo se reconocía el segundo, y encima con una sola forma
     exacta. Como el del éxito empieza con "Se ha dejado nota" y no con "Ya se
     ha dejado nota", no coincidía con nada: ni con el éxito ni con la falla.
     Resultado: TODA nota bien dejada quedaba informada como "a verificar", y
     la única manera de que dijera "dejada" era reintentarla, que es cuando
     aparece el cartel rojo. Es exactamente lo que informó el autor.

     Lo otro que quedó a la vista: el cartel del éxito NO nombra el expediente.
     La regla de no dar por dejada una nota que el PJN no confirmó para esa
     causa era, con este cartel, inaplicable: el PJN nunca dice cuál. Por eso
     ahora se distinguen dos casos, y el control se conserva donde el PJN da
     con qué ejercerlo:

       - cartel CON número: tiene que ser el de la causa que se confirmó, y eso
         lo sigue decidiendo mismoExpediente, número por número. Un incidente
         no vale por su expediente principal.
       - cartel SIN número: vale para la causa que se acaba de confirmar en esa
         misma recarga, que es la única que puede haberlo provocado, y queda
         anotado que el PJN no nombró el expediente.

     Cada pregunta, en su propia función.
  --------------------------------------------------------------------------- */

  // El PJN afirma que la causa tiene nota. Puede ser porque la acaba de dejar
  // (cartel celeste) o porque ya la tenía (cartel rojo): el hecho que le importa
  // al usuario es el mismo, la nota está.
  const RE_HAY_NOTA = [
    /se\s+ha\s+dejado\s+nota/i,
    /ya\s+se\s+dej[óo]\s+nota/i,
    /ya\s+(?:tiene|posee|cuenta\s+con)\s+(?:una\s+)?nota/i,
    /nota\s+ya\s+(?:fue|hab[íi]a\s+sido)\s+dejada/i
  ];
  const diceQueHayNota = (t) => RE_HAY_NOTA.some((re) => re.test(t));

  // El PJN no pudo hacer lo que se le pidió.
  const RE_FALLA = /No\s+se\s+pudo\s+realizar\s+(?:la\s+)?acci/i;
  const diceFalla = (t) => RE_FALLA.test(t);

  // El tramo donde está el cartel, para no salir a buscar el número de
  // expediente por toda la página: abajo está la tabla, llena de números.
  // Se corta en el primer renglón, que es donde termina el cartel, con un tope
  // por si el texto viniera todo junto.
  const LARGO_CARTEL = 240;

  function tramoDelCartel(t) {
    for (const re of RE_HAY_NOTA.concat(RE_FALLA)) {
      const m = re.exec(t);
      if (!m) continue;
      const desde = t.slice(m.index, m.index + LARGO_CARTEL);
      const corte = desde.indexOf('\n');
      return corte > 0 ? desde.slice(0, corte) : desde;
    }
    return '';
  }

  // El número entero, con el incidente si lo trae (32733/1980/1): si se cortara
  // en dos tramos, la confirmación de un incidente se leería como la del
  // expediente principal.
  const RE_NUMERO_EXP = /^([^]{0,12}?)(\d+\/\d{2,4}(?:\/[A-Za-z0-9]+)*)/;

  // Entre la palabra "expediente" y el número, el PJN pone a lo sumo dos
  // puntos, un "N°" y la sigla del fuero en mayúsculas. Cualquier otra cosa
  // quiere decir que ese número no es el del cartel: una fecha tiene la misma
  // forma que un expediente (25/09/2026), y abajo del cartel está la tabla,
  // llena de números de causa.
  const RE_ENTRE_MEDIO = /^\s*:?\s*(?:[Nn][°ºor.]{0,3}\s*)?(?:[A-Z]{2,4}\s+)?$/;

  // Se exige que el número venga pegado a la palabra "expediente", que es donde
  // el PJN lo pone. Sin eso no se toma ninguno: es preferible quedarse sin
  // número, y que el resultado dependa de otra cosa, a tomar uno equivocado.
  function expedienteDelCartel(tramo) {
    const t = String(tramo || '');
    const donde = /expedientes?/ig;
    let m;
    while ((m = donde.exec(t))) {
      const num = RE_NUMERO_EXP.exec(t.slice(m.index + m[0].length));
      if (num && RE_ENTRE_MEDIO.test(num[1])) return num[2];
    }
    return '';
  }

  // Lo que dice un texto, sin mirar la página: así se lo puede probar con los
  // carteles del PJN escritos a mano, que es lo que hace el banco de pruebas.
  // Los renglones se conservan, porque son los que acotan el cartel.
  function leerCartel(texto) {
    const t = String(texto == null ? '' : texto).replace(/[^\S\n]+/g, ' ');
    const hayNota = diceQueHayNota(t);
    if (!hayNota && !diceFalla(t)) return null;
    const tramo = tramoDelCartel(t);
    // Que el PJN avise que la nota ya estaba no es una falla: la nota está. Sin
    // esto, reintentar una causa que ya tenía nota la anotaba como "no salió",
    // que es lo contrario de lo que pasó.
    if (hayNota) return { ok: true, expediente: expedienteDelCartel(tramo), texto: tramo.slice(0, 140) };
    return { ok: false, texto: tramo.slice(0, 140) };
  }

  function mensajePJN() {
    return leerCartel(textoPJN(document));
  }

  // Qué resultado le corresponde a la causa que se acaba de confirmar, según lo
  // que diga el cartel. Solo decide: guardar el resultado y anotar el problema
  // en el lote es cosa de quien la llama. Así se la puede probar entera, con
  // los carteles reales del PJN, sin dejar ninguna nota.
  function resultadoDelCartel(causa, m) {
    if (m && m.ok && m.expediente) {
      return mismoExpediente(causa, m.expediente)
        ? { ok: true, m: '' }
        : { ok: null, m: 'el PJN respondió por ' + m.expediente };
    }
    // El cartel del éxito no nombra el expediente: vale para la causa que se
    // acaba de confirmar en esta misma recarga, que es la única que pudo
    // provocarlo. Queda anotado que el PJN no lo nombró.
    if (m && m.ok) return { ok: true, m: 'el PJN confirmó sin nombrar el expediente' };
    if (m && !m.ok) return { ok: false, m: String(m.texto || '').slice(0, 70) };
    return { ok: null, m: 'sin respuesta visible del PJN' };
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
  const claveTurnoDe = (cuenta) => K_TURNO_BASE + (cuenta ? '@' + cuenta : '');
  // Con la cuenta del momento: puede aparecer después de cargar la página.
  const claveTurno = () => claveTurnoDe(CUENTA);
  const TURNO_VENCE = 3 * 60 * 1000;
  const leerTurno = (k) => {
    let t;
    try { t = JSON.parse(localStorage.getItem(k || claveTurno()) || 'null'); } catch (e) { return null; }
    if (!t || typeof t.corrida !== 'string' || typeof t.token !== 'string' || typeof t.ts !== 'number') return null;
    if (!listaDeTextos(t.hechos)) t.hechos = [];
    return t;
  };
  // El turno lleva también el avance (hechas y la que está en curso): si una
  // copia vieja de la tanda gana el turno, no repite lo que hizo la otra.
  const escribirTurno = (c) => {
    const turno = { corrida: c.id, token: c.token, ts: Date.now(), hechos: c.hechos, enCurso: c.enCurso || null, confirmado: !!c.confirmado };
    try { localStorage.setItem(claveTurno(), JSON.stringify(turno)); } catch (e) { /* sin almacén */ }
  };
  const soltarTurno = (c) => {
    const t = leerTurno();
    if (t && c && t.corrida === c.id) { try { localStorage.removeItem(claveTurno()); } catch (e) { /* sin almacén */ } }
  };
  const ficha = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const esMiTurno = (c, t) => !!(t && t.corrida === c.id && t.token === c.token);
  // Suelta el turno de la tanda, si lo tiene esta pestaña, con la cuenta con la
  // que la tanda empezó: sirve aunque la cuenta ya no esté a la vista. Sin esto,
  // una tanda descartada por falta de cuenta dejaba el turno tomado y durante
  // tres minutos no se podía empezar otra.
  function soltarTurnoDeLaTanda(c) {
    if (!c) return;
    const k = claveTurnoDe(c.cuenta);
    if (esMiTurno(c, leerTurno(k))) { try { localStorage.removeItem(k); } catch (e) { /* sin almacén */ } }
  }
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
    engancharFondo();
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
          terminarNota(c, 'Se canceló el lote: ' + mensajeDe(e) + '.');
        } else {
          avisar('No se pudo seguir dejando nota: ' + mensajeDe(e) + '.', true);
        }
      } catch (e2) {
        borrarSesion(S_CORRIDA);
        avisar('No se pudo seguir dejando nota: ' + mensajeDe(e) + '.', true);
      }
    }
  }

  // La tanda espera a que aparezca la cuenta (el arranque la vuelve a buscar a
  // los 2,5 segundos). Si no aparece, o si se canceló mientras tanto, se
  // cierra sin dejar ninguna nota más: sin la cuenta no se puede anotar nada,
  // y dejarla activa bloquearía las descargas y las lecturas de esta pestaña.
  let esperasDeCuenta = 0;
  function esperarCuentaParaNota(c) {
    notaEnCurso = false;
    // Cada vuelta vuelve a mirar la barra de usuario (1.6.3): hasta la 1.6.2 se
    // la miraba una sola vez, a los 2,5 segundos de cargar.
    if (!abortarNota && !c.cortar && esperasDeCuenta++ < 4) {
      setTimeout(() => { if (revisarCuenta()) pintarPlacaCuenta(); if (!notaEnCurso) pasoNota(); }, 1500);
      return;
    }
    borrarSesion(S_CORRIDA);
    soltarTurnoDeLaTanda(c);
    abortarNota = false;
    pararLatido();
    estadoNota('');
    avisar('No se pudo identificar la cuenta del PJN, así que el lote de notas se detuvo sin dejar ninguna más.' +
      (c.enCurso && c.confirmado ? ' La última (' + c.enCurso + ') se confirmó y no se llegó a ver la respuesta: verificala en el expediente.' : '') +
      ' Recargá la página y, si faltan, volvé a dejar nota en esas causas.', true);
    pintarNota();
    pintarTodo();
    engancharFondo();
  }

  // El paso de la tanda, en partes (1.6.1). Cada una dice si se sigue: las
  // que cortan ya dejaron todo hecho (el aviso, la pausa o el cierre).

  // La tanda es de la cuenta con la que se empezó. Si en esta pestaña se entró
  // con otra, no se retoma ni se escribe nada: sus causas no son de esta cuenta.
  // Sin la cuenta todavía no se decide nada: el PJN puede dibujar la barra de
  // usuario después de cargar la página (hasta la 1.6.0 la tanda se borraba en
  // ese caso, sin aviso).
  function tandaDeEstaCuenta(c) {
    if (!CUENTA) { esperarCuentaParaNota(c); return false; }
    if (c.cuenta && c.cuenta !== CUENTA) {
      borrarSesion(S_CORRIDA);
      notaEnCurso = false;
      pararLatido();
      avisar('Había un lote de notas de otra cuenta del PJN en esta pestaña: no se retoma.', true);
      engancharFondo();
      return false;
    }
    return true;
  }

  // 0. Turno: ¿esta pestaña es la que maneja la tanda? Devuelve el turno, o
  // null si esta pestaña no sigue.
  function turnoDeEstaPestana(c) {
    if (!c.id || !c.token) { c.id = c.id || ficha(); c.token = c.token || ficha(); guardarCorrida(c); escribirTurno(c); }
    const turno = leerTurno();
    const fresco = !!(turno && Date.now() - turno.ts < TURNO_VENCE);
    if (!turno || turno.corrida !== c.id) {
      // El turno es de otra tanda, o ya no hay turno (la tanda terminó en otra
      // pestaña): esta copia es vieja y no escribe resultados.
      perderTurno(fresco
        ? 'Esta pestaña no retoma el lote: hay otro lote de notas en curso en otra pestaña del PJN.'
        : 'Había un lote de notas anterior en esta pestaña: no se retoma.');
      return null;
    }
    if (!esMiTurno(c, turno)) {
      perderTurno(fresco
        ? 'Esta pestaña ya no deja nota: el lote continúa en otra pestaña del PJN.'
        : 'Había un lote de notas anterior en esta pestaña: no se retoma.');
      return null;
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
      terminarNota(c, 'El lote estaba detenido desde hacía más de 3 minutos y no se retomó solo.');
      return null;
    }
    return turno;
  }

  // Lo que hizo otra copia de esta tanda (pestaña duplicada) se suma acá. Si
  // esa copia confirmó una nota que esta no llegó a ver, queda a verificar y
  // no se repite.
  function sumarOtraCopia(c, turno) {
    (turno.hechos || []).forEach((e) => { if (c.hechos.indexOf(e) < 0) c.hechos.push(e); });
    if (turno.enCurso && turno.confirmado && turno.enCurso !== c.enCurso && c.hechos.indexOf(turno.enCurso) < 0) {
      const e = turno.enCurso;
      c.problemas.push(e + ': se confirmó desde otra pestaña');
      c.dudas.push(e);
      c.hechos.push(e);
      anotarResultado(e, null, 'se confirmó desde otra pestaña');
    }
  }

  // 1. Si volvimos de confirmar, leer cómo salió la anterior. false si la
  // tanda queda en pausa.
  async function resultadoDeLaAnterior(c, enRel) {
    if (!c.enCurso) return true;
    const e = c.enCurso;
    if (enRel) {
      await esperarA(() => !!mensajePJN(), 6000);
      const r = resultadoDelCartel(e, mensajePJN());
      if (r.ok !== true) c.problemas.push(e + ': ' + r.m);
      if (r.ok === null) c.dudas.push(e);
      anotarResultado(e, r.ok, r.m);
    } else if (abortarNota || c.cortar) {
      c.problemas.push(e + ': no se llegó a ver la respuesta del PJN');
      c.dudas.push(e);
      anotarResultado(e, null, 'no se llegó a ver la respuesta del PJN');
    } else {
      pausarNota();
      return false;
    }
    if (c.hechos.indexOf(e) < 0) c.hechos.push(e);
    c.enCurso = null;
    c.confirmado = false;
    guardarCorrida(c);
    pintarSolapas();
    estadoNota('Van ' + progresoNota(c) + '...');
    return true;
  }

  // 1 ter. Si la recarga nos devolvió a la primera página, volver a la que iba.
  async function volverALaPaginaDeLaTanda(c) {
    if ((c.pagina || 0) === paginaActualNota()) return;
    estadoNota('Volviendo a la página ' + ((c.pagina || 0) + 1) + '...');
    const ok = await irAPaginaNota(c.pagina || 0);
    if (!ok) { c.pagina = paginaActualNota(); guardarCorrida(c); }
  }

  // 2. Si la recarga se llevó el filtro, volver a ponerlo. true si con eso
  // termina este paso (se relanzó o se cerró la tanda).
  async function reponerFiltroNota(c) {
    if (filasConLapiz().length) return false;
    const f = botonFiltroNota(document);
    if (!f) return false;
    estadoNota('Aplicando el filtro "Dejar nota" del PJN...');
    const espera = esperarAjax(20000);
    f.click();
    await espera;
    await esperarA(() => filasConLapiz().length > 0, 8000);
    if (!filasConLapiz().length) {
      terminarNota(c, 'Con el filtro puesto no aparece ninguna causa con lápiz.');
      return true;
    }
    pasoNota();
    return true;
  }

  // 4. Sin pendientes en esta página: la siguiente, o el final de la tanda.
  async function siguientePaginaNota(c) {
    const sig = paginaSiguienteNota();
    if (!sig) { terminarNota(c, null); return; }
    const act = paginaActualNota();
    // Si el paginado no avanza, no se da vueltas para siempre.
    if (c.ultimaPagina === act) c.vueltasPagina = (c.vueltasPagina || 0) + 1;
    else { c.ultimaPagina = act; c.vueltasPagina = 0; }
    if (c.vueltasPagina >= 3) { terminarNota(c, 'El paginador del PJN no responde.'); return; }
    estadoNota('Página ' + (act + 1) + ' lista. Paso a la siguiente...');
    c.pagina = act + 1;
    guardarCorrida(c);
    const espera = esperarAjax(20000);
    sig.click();
    await espera;
    await dormir(900);
    pasoNota();
  }

  // Una causa que no se pudo intentar queda hecha, con su motivo.
  function causaQueFallo(c, exp, motivo) {
    c.problemas.push(exp + ': ' + motivo);
    anotarResultado(exp, false, motivo);
    if (c.hechos.indexOf(exp) < 0) c.hechos.push(exp);
    c.enCurso = null;
  }

  // 5a. El lápiz y su cartel. true si el cartel se abrió.
  async function abrirCartelNota(c, prox) {
    estadoNota('Dejando nota en ' + prox.expediente + ' (van ' + progresoNota(c) + ')...');
    c.enCurso = prox.expediente;
    c.confirmado = false;
    guardarCorrida(c);
    const delLapiz = esperarAjax(20000);
    prox.lapiz.click();
    await delLapiz;
    if (await esperarA(popupAbierto, 15000)) {
      c.fallosCartel = 0;
      return true;
    }
    causaQueFallo(c, prox.expediente, 'el cartel no llegó a abrirse');
    c.fallosCartel = (c.fallosCartel || 0) + 1;
    guardarCorrida(c);
    if (c.fallosCartel >= 3) { terminarNota(c, 'El cartel de confirmación del PJN no se abre.'); return false; }
    // Se sigue desde una carga limpia: una respuesta atrasada del lápiz no
    // puede abrir el cartel de otra causa.
    estadoNota('El cartel no se abrió para ' + prox.expediente + '. Se recarga la lista y se continúa...');
    location.href = RUTA.rel;
    return false;
  }

  // A partir de la confirmación la página se recarga y el arranque retoma. Si
  // en un minuto no se recargó, se cierra la tanda y esa causa queda para
  // verificar.
  function vigilarRecarga(exp) {
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

  // 5b. Con el cartel abierto: confirmar, salvo que se haya cancelado o que
  // el turno haya pasado a otra pestaña.
  async function confirmarNota(c, prox) {
    await dormir(350);
    const b = botonConfirmar(document);
    if (!b) {
      causaQueFallo(c, prox.expediente, 'no se encuentra el botón Confirmar');
      guardarCorrida(c);
      terminarNota(c, 'No se encuentra el botón Confirmar del cartel del PJN.');
      return;
    }
    await dormir(c.pausa || 700);
    const c2 = leerCorrida();
    if (abortarNota || (c2 && c2.cortar)) { c.enCurso = null; guardarCorrida(c); terminarNota(c, 'Cancelado.'); return; }
    // Justo antes de confirmar: el turno tiene que seguir siendo de esta pestaña.
    if (!esMiTurno(c, leerTurno())) { perderTurno('Esta pestaña ya no deja nota: el lote continúa en otra pestaña del PJN.'); return; }
    c.confirmado = true;
    guardarCorrida(c);
    escribirTurno(c);
    b.click();
    vigilarRecarga(prox.expediente);
  }

  async function pasoNotaInterno() {
    const c = leerCorrida();
    if (!c || !c.activa) return;
    if (!tandaDeEstaCuenta(c)) return;
    if (!c.dudas) c.dudas = [];
    const turno = turnoDeEstaPestana(c);
    if (!turno) return;
    sumarOtraCopia(c, turno);
    c.token = ficha();
    guardarCorrida(c);
    escribirTurno(c);

    notaEnCurso = true;
    pintarNota();
    if (VISTA === 'nota' && !q('[data-e="notaTxtPanel"]')) pintarTodo();

    const enRel = EN_LISTA && tipoLista(document) === 'rel';
    if (!(await resultadoDeLaAnterior(c, enRel))) return;
    if (abortarNota || c.cortar) { terminarNota(c, 'Cancelado.'); return; }
    if (!quedanElegidos(c)) { terminarNota(c, null); return; }
    // 1 bis. La tanda solo avanza sobre la lista de Relacionados del PJN.
    if (!enRel) { pausarNota(); return; }
    await volverALaPaginaDeLaTanda(c);
    if (await reponerFiltroNota(c)) return;
    // 3. Buscar la próxima pendiente de esta página; si no queda, la página siguiente.
    const prox = pendientesAqui(c)[0];
    if (!prox) { await siguientePaginaNota(c); return; }
    // 5. Dejar la nota: lápiz, esperar el cartel, confirmar.
    if (await abrirCartelNota(c, prox)) await confirmarNota(c, prox);
  }

  // La tanda queda en pausa (sigue activa) mientras no se esté en Relacionados.
  function pausarNota() {
    notaEnCurso = false;
    latirTurno();
    // En pausa se trabaja en otra página: ahí también va el respaldo automático.
    engancharFondo();
    estadoNota('En pausa: esta página no es la lista de Relacionados del PJN. El lote queda a la espera mientras esta pestaña siga abierta: volvé a Relacionados para seguir, o cancelalo.');
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
    // Una causa elegida que no apareció con lápiz en ninguna página y que hoy ya
    // tenía nota dejada no se anota como falla: el resultado que ya tiene vale
    // más que no haberla encontrado en esta pasada.
    //
    // Hasta la 1.3.5 acá decía que el PJN le saca el lápiz una vez dejada la
    // nota, y es falso: el autor lo corrigió el 25/09/2026. El lápiz sigue
    // estando y se puede reintentar; lo que hace el PJN es avisar que la nota ya
    // estaba. De modo que no aparecer con lápiz no se explica por la nota: la
    // causa no estaba en la lista, o el PJN no la ofrece ese día.
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
      (yaEstaban.length ? '. ' + plural(yaEstaban.length, 'ya tenía', 'ya tenían') + ' nota dejada hoy y el PJN no ' + (yaEstaban.length > 1 ? 'las ofreció' : 'la ofreció') + ' en esta lista: ' + yaEstaban.join(' | ') : '') +
      (aVerificar.length ? '. A verificar en el expediente ' + aVerificar.length + ': ' + aVerificar.map(detalle).join(' | ') : '') +
      (fallas.length ? '. No salieron ' + fallas.length + ': ' + fallas.map(detalle).join(' | ') : '') + '.' +
      (popupAbierto() ? ' Quedó abierto el cartel del PJN: cerralo con Cancelar.' : ''), !!(fallas.length || aVerificar.length));
    pintarNota();
    pintarTodo();
    engancharFondo();
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
    if (otraTandaViva()) { avisar('Hay un lote de notas en curso en otra pestaña del PJN.', true); return; }
    guardarSesion(S_ENCARGO, { tipo: 'nota', solo: solo || null, ts: Date.now() });
    avisar('Abriendo la lista de Relacionados del PJN para dejar nota...');
    location.href = RUTA.rel;
  }

  // Espera a que el PJN dibuje la barra de usuario, como esperarCuentaParaNota.
  let esperasParaEmpezar = 0;
  function esperarCuentaParaEmpezar(enc) {
    if (esperasParaEmpezar++ < 4) {
      setTimeout(() => { if (revisarCuenta()) pintarPlacaCuenta(); arrancarNotaDesdeEncargo(enc); }, 1500);
      return;
    }
    estadoNota('');
    avisar('No se pudo identificar la cuenta del PJN, así que no se empezó a dejar nota. Recargá la página y volvé a pedirlo.', true);
    pintarTodo();
    engancharFondo();
  }

  function arrancarNotaDesdeEncargo(enc) {
    if (tipoLista(document) !== 'rel' || (!botonConfirmar(document) && !botonFiltroNota(document))) {
      avisar('La lista de Relacionados del PJN no tiene la función de dejar nota en este momento.', true);
      engancharFondo();
      return;
    }
    // Sin la cuenta no se empieza (1.6.3): el turno y la tanda se guardan con
    // ella, y una tanda sin cuenta se perdía cuando la cuenta aparecía.
    if (!CUENTA) { esperarCuentaParaEmpezar(enc); return; }
    if (otraTandaViva()) { avisar('No se inicia: hay un lote de notas en curso en otra pestaña del PJN.', true); engancharFondo(); return; }
    // Una descarga encolada mientras se esperaba la cuenta se cortaría con la
    // primera recarga.
    if (bajandoAlgo()) { avisar('No se inicia: hay descargas en curso. Esperá a que terminen, o cancelalas, antes de dejar nota.', true); engancharFondo(); return; }
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
  // Cuándo se borró la anotación de cada causa (1.6.2): el borrado viaja a la
  // otra computadora con la carpeta o con la copia, y gana si es más nuevo que
  // el texto que esa computadora conserva.
  function normalizarBorradas(b) {
    const out = {};
    if (!esObjeto(b)) return out;
    Object.keys(b).forEach((k) => { if (typeof b[k] === 'number' && b[k] > 0) out[k] = b[k]; });
    return out;
  }

  function normalizarMarcas(m) {
    const out = { etiquetas: [], filas: {}, borradas: {} };
    if (!esObjeto(m)) return out;
    out.borradas = normalizarBorradas(m.borradas);
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

  // Una anotación que se vacía deja la hora del borrado; una que vuelve a
  // tener texto la quita.
  function anotarBorrado(k, antes, despues) {
    const tenia = !!String(antes || '').trim(), tiene = !!String(despues || '').trim();
    if (tenia && !tiene) MARCAS.borradas[k] = Date.now();
    else if (tiene) delete MARCAS.borradas[k];
  }

  function fijarMarca(k, cambio) {
    refrescarMarcas();
    const ant = MARCAS.filas[k] || {};
    const m = Object.assign({ et: [], nota: '' }, ant, cambio);
    anotarBorrado(k, ant.nota, m.nota);
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

  // Etiquetas y anotaciones de una actuación (1.7.0). Van en el mismo registro
  // que las de las causas, con una clave compuesta: el número de la causa, el
  // separador SEP_ACT y la fecha, el tipo y el detalle de la actuación. Así
  // viajan con la copia y con la carpeta de respaldo, y se combinan entre dos
  // computadoras con las mismas reglas que las de las causas. Ninguna clave de
  // causa lleva ese separador, de modo que las dos no se confunden.
  const SEP_ACT = ' \u00B6 ';
  const esClaveAct = (k) => String(k).indexOf(SEP_ACT) >= 0;
  // La base de la clave: fecha, tipo, detalle y fojas. Dos actuaciones
  // iguales en todo eso (dos "EN LETRA" del mismo día, por ejemplo) se
  // distinguen por su número de repetición, que se cuenta desde la más vieja:
  // una actuación nueva idéntica queda última y no corre las anteriores (ver
  // numerarClavesAct). Sin número, la clave es la de la primera.
  const baseClaveAct = (exp, a) => exp + SEP_ACT + [a.fecha, limpio(a.tipo), limpio(a.detalle).slice(0, 160)].join(' \u00B7 ') +
    (limpio(a.fojas) ? ' \u00B7 fs. ' + limpio(a.fojas) : '');
  const claveAct = (exp, a) => (a && a.claveMarca && a.claveMarca.indexOf(exp + SEP_ACT) === 0 ? a.claveMarca : baseClaveAct(exp, a));

  // Le pone a cada actuación y movimiento de la causa su clave definitiva.
  function numerarClavesAct(exp, acts, movs) {
    const todas = (acts || []).concat(movs || []);
    const pos = (a, i) => (typeof a.pos === 'number' ? a.pos : i);
    const orden = todas.map((a, i) => ({ a, p: pos(a, i) })).sort((x, y) => y.p - x.p);
    const vistas = {};
    orden.forEach(({ a }) => {
      const b = baseClaveAct(exp, a);
      vistas[b] = (vistas[b] || 0) + 1;
      a.claveMarca = vistas[b] > 1 ? b + ' #' + vistas[b] : b;
    });
  }
  const clavesDeCausas = () => Object.keys(MARCAS.filas).filter((k) => !esClaveAct(k));
  const clavesDeActs = () => Object.keys(MARCAS.filas).filter(esClaveAct);
  // Lo que se lee de las marcas de una actuación, para ordenar por esa columna.
  const textoMarcasAct = (exp, a) => {
    if (!exp) return '';
    const k = claveAct(exp, a);
    return etiquetasDe(k).map((e) => e.nom).join(' ') + ' ' + String(marcaDe(k).nota || '');
  };

  // En cuántas causas y en cuántas actuaciones está puesta una etiqueta.
  const usoDe = (id) => clavesDeCausas().filter((k) => (MARCAS.filas[k].et || []).indexOf(id) >= 0).length;
  const usoEnActsDe = (id) => clavesDeActs().filter((k) => (MARCAS.filas[k].et || []).indexOf(id) >= 0).length;

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
  //   bytes 0 a 6    la marca "SUPJN+\x01", que identifica el formato
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
    const contrasena = String(contra || '');
    if (!contrasena) throw new Error('falta la contraseña del respaldo');
    const sal = cripto().getRandomValues(new Uint8Array(16));
    const iv = cripto().getRandomValues(new Uint8Array(12));
    const k = await claveDesde(contrasena, sal);
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
    const contrasena = String(contra || '');
    if (!contrasena) throw new Error('ese archivo tiene contraseña y todavía no pusiste la tuya');
    const p = MARCA.length + 1;
    const k = await claveDesde(contrasena, b.subarray(p, p + 16));
    let claro;
    try {
      claro = await cripto().subtle.decrypt({ name: 'AES-GCM', iv: b.subarray(p + 16, p + 28) }, k, b.subarray(p + 28));
    } catch (e) {
      throw new Error('la contraseña no abre ese archivo', { cause: e });
    }
    return new TextDecoder().decode(claro);
  }

  const datosMarcas = () => JSON.stringify({
    formato: 'supjn+/marcas', version: 2, fecha: new Date().toISOString(), cuenta: CUENTA,
    etiquetas: MARCAS.etiquetas, filas: MARCAS.filas, borradas: MARCAS.borradas, notas: NOTAS
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
      const corte = setTimeout(() => { if (!listo) { listo = true; rej(new Error('el almacén del navegador no responde')); } }, 8000);
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
      etiquetas: MARCAS.etiquetas, filas: MARCAS.filas, borradas: MARCAS.borradas, notas: NOTAS
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

  // Si la carpeta no se pudo leer (un archivo de OneDrive bloqueado o sin
  // descargar), cada cambio vuelve a intentar leerla y, si lo logra, guarda
  // (1.6.3). Hasta la 1.6.2 no se volvía a intentar en toda la sesión.
  // Si se estaba escribiendo en un campo de la ventana (la contraseña, el
  // nombre de una etiqueta nueva), redibujar lo vaciaría: se deja para el
  // próximo cambio.
  function escribiendoEnLaVentana() {
    const a = document.activeElement;
    return !!(a && win && win.contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/^(checkbox|radio|button|submit)$/i.test(a.type))));
  }

  let releyendoCarpeta = false;
  function reintentarLecturaCarpeta() {
    if (carpetaEstado !== 'error') { carpetaAviso = 'todavía se está leyendo el contenido de la carpeta'; return; }
    if (releyendoCarpeta) return;
    releyendoCarpeta = true;
    conectarCarpeta(false)
      .then((r) => { if (r && r !== true && !escribiendoEnLaVentana()) pintarTodo(); })
      .catch(() => { /* conectarCarpeta deja anotada la falla */ })
      .finally(() => { releyendoCarpeta = false; pintarCopia(); });
  }

  async function escribirAhora() {
    if (!CARPETA) return false;
    if (!CUENTA) { carpetaAviso = 'no se pudo identificar la cuenta del PJN'; return false; }
    // Nunca se escribe antes de haber leído lo que hay en la carpeta. Si no, una
    // limpieza del navegador dejaría la copia buena pisada por una vacía.
    if (!leyoLaCarpeta) { reintentarLecturaCarpeta(); return false; }
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
    let d;
    try { d = JSON.parse(texto); } catch (e) { d = null; }
    if (!d || d.cuenta !== CUENTA) {
      if (d) carpetaAviso = 'el archivo de la carpeta no corresponde a esta cuenta, así que no se importó automáticamente';
      return null;
    }
    const r = importarMarcas(texto);
    return typeof r === 'string' ? null : r;
  }

  // null solo si el archivo no existe. Cualquier otra falla (un archivo de
  // OneDrive sin descargar, o bloqueado por la sincronización) se informa:
  // tomarla como "no hay archivo" llevaba a escribir encima del respaldo sin
  // haberlo leído.
  const bytesDeCarpeta = async (nombre) => {
    try {
      const fh = await CARPETA.getFileHandle(nombre);
      return new Uint8Array(await (await fh.getFile()).arrayBuffer());
    } catch (e) {
      if (/NotFound/i.test(String((e && e.name) || ''))) return null;
      throw new Error('no se pudo leer ' + nombre + ' en la carpeta (puede estar sin descargar de la nube o en uso): hasta poder leerlo no se guarda nada en ella', { cause: e });
    }
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
  function pisarCarpeta() {
    if (!CARPETA || !CUENTA || !hayContra()) return Promise.resolve(false);
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
      // Sin la cuenta no se sabe qué archivo leer, y no haberlo leído impide
      // escribirlo: se vuelve a conectar cuando la cuenta aparece (arrancar).
      // Hasta la 1.6.0 la carpeta quedaba como leída y el primer cambio pisaba
      // el respaldo sin haberlo importado.
      if (!CUENTA) { carpetaAviso = 'no se pudo identificar la cuenta del PJN'; return false; }
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

  // Combina la anotación de acá con la que llega de la otra computadora.
  // Si las dos tienen fecha, gana la más nueva (es el caso de la carpeta
  // compartida, que se importa sola cada vez que se abre: si se pegaran, la
  // anotación crecería en cada sincronización). Cuando alguna viene de una
  // copia vieja, sin fecha, se conservan los dos textos. Desde la 1.6.2 los
  // borrados también viajan: un texto con fecha anterior al último borrado,
  // de cualquiera de las dos, se descarta, y también uno sin fecha (1.6.3: en
  // la 1.6.2 un texto viejo sin fecha, presente en las dos, no se podía borrar).
  // Hasta la 1.6.1 el borrado no viajaba y la anotación volvía desde la otra.
  function combinarAnotacion(aca, otraFila, bAca, bOtra) {
    const nota = String(aca.nota || ''), t = aca.t || 0;
    const otra = String(otraFila.nota || '').trim();
    const tOtra = typeof otraFila.t === 'number' && otraFila.t > 0 ? otraFila.t : 0;
    const borrado = Math.max(bAca || 0, bOtra || 0, !nota.trim() ? t : 0, !otra ? tOtra : 0);
    const vive = (txt, tt) => !!txt && (tt ? tt > borrado : !borrado);
    const a = vive(nota.trim(), t) ? { nota, t } : { nota: '', t: 0 };
    const b = vive(otra, tOtra) ? { nota: otra, t: tOtra } : { nota: '', t: 0 };
    const r = juntarTextos(a, b);
    return { nota: r.nota, t: r.nota.trim() ? r.t : borrado, borrada: r.nota.trim() ? 0 : borrado };
  }

  // Los dos textos que siguen en pie: el más nuevo si los dos tienen fecha; los
  // dos, si alguno no la tiene. Si uno ya contiene al otro, queda ese. Lo que se
  // pega lleva la fecha del momento, para que la otra computadora lo tome tal
  // cual (1.6.3): hasta la 1.6.2, dos textos sin fecha distintos se volvían a
  // pegar en cada sincronización y la anotación crecía sin fin.
  function juntarTextos(a, b) {
    if (!b.nota) return a;
    const ta = a.nota.trim();
    if (!ta) return b;
    if (a.t && b.t) return b.t > a.t ? { nota: b.nota !== ta ? b.nota : a.nota, t: b.t } : a;
    // El texto que queda lleva su propia fecha, o la del momento si no la tenía
    // y el otro sí: con la fecha del otro, las dos computadoras empataban y
    // cada una se quedaba con el suyo.
    if (ta === b.nota) return { nota: a.nota, t: Math.max(a.t, b.t) };
    if (ta.indexOf(b.nota) >= 0) return { nota: a.nota, t: a.t || (b.t ? Date.now() : 0) };
    if (b.nota.indexOf(ta) >= 0) return { nota: b.nota, t: b.t || (a.t ? Date.now() : 0) };
    return { nota: a.nota + '\n\n' + b.nota, t: Date.now() };
  }

  // Aplica a una causa lo que trae el archivo: etiquetas sumadas y anotación
  // combinada. Devuelve si la causa quedó con algo.
  function importarFila(k, orig, et, bOtra) {
    const r = combinarAnotacion(marcaDe(k), orig, MARCAS.borradas[k], bOtra);
    if (r.borrada) MARCAS.borradas[k] = r.borrada; else delete MARCAS.borradas[k];
    if (et.length || r.nota.trim()) { MARCAS.filas[k] = r.t ? { et, nota: r.nota, t: r.t } : { et, nota: r.nota }; return true; }
    delete MARCAS.filas[k];
    return false;
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
    let filas = 0, acts = 0;
    const borradas = normalizarBorradas(d.borradas);
    const claves = [...new Set(Object.keys(d.filas).concat(Object.keys(borradas)))];
    claves.forEach((k) => {
      const orig = esObjeto(d.filas[k]) ? d.filas[k] : {};
      const et = (marcaDe(k).et || []).slice();
      (Array.isArray(orig.et) ? orig.et : []).forEach((x) => {
        const id = mapa[x] || x;
        if (etiquetaDe(id) && et.indexOf(id) < 0) et.push(id);
      });
      if (!importarFila(k, orig, et, borradas[k]) || !d.filas[k]) return;
      // Las de las actuaciones (1.7.0) se cuentan aparte.
      if (esClaveAct(k)) acts++; else filas++;
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
    return { filas, acts, etiquetas: MARCAS.etiquetas.length, notas };
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
      if (f.http) partes.push('código HTTP ' + f.http);
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
    { k: 'ult', t: 'Últ. act.', w: 118, m: 108, ayuda: 'El PJN solo muestra el día de la última actuación, nunca la hora. Con el mismo día, las causas quedan en el orden que manda el sitio, que sí desempata por hora: es lo mismo que hace el botón Orden cronológico.' },
    { k: 'nota', t: 'Nota', w: 104, m: 78 },
    { k: 'anot', t: 'Anotaciones', w: 108, m: 56 }
  ];
  const COL = {};
  COLS_DEF.forEach((c) => { COL[c.k] = c; });

  // Las actuaciones del expediente van en columnas de verdad, con el mismo
  // manejo que la tabla de causas: se ordenan, se mueven y se ensanchan.
  const COLS_ACT_DEF = [
    // 1.7.0: más ancha, para la placa de color de la fecha.
    { k: 'fecha', t: 'Fecha', w: 112, m: 108 },
    // "Tipo" y no "Tipo de actuación": es el nombre que le da el propio PJN en
    // su tabla, y el rótulo largo obligaba a una columna ancha para no quedar
    // cortado, a costa de la descripción, que es lo que conviene leer entero.
    { k: 'tipo', t: 'Tipo', w: 118, m: 94, ayuda: 'Tipo de actuación, tal como lo informa el PJN.' },
    { k: 'detalle', t: 'Descripción / detalle', w: 430, m: 120 },
    { k: 'fojas', t: 'Fs.', w: 74, m: 62 },
    // Etiquetas y anotaciones propias de cada actuación (1.7.0). Solo en el
    // expediente abierto: en Descargas no se muestra.
    { k: 'marcas', t: 'Etiquetas y anotaciones', w: 170, m: 96, soloExp: true, ayuda: 'Tus etiquetas y anotaciones privadas de cada actuación. No se escriben en el expediente.' }
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
    zoom: 1, encuadrar: true,
    // Los fueros elegidos para la consulta pública (1.6.0); null: los de
    // siempre (ver 8.6). Lo que se busca no se guarda.
    cpFueros: null
  };
  const CFG_GUARDADA = leerAlmacen(K_CFG, {}) || {};
  const CFG = Object.assign({}, CFG_DEF, CFG_GUARDADA);
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
  CFG.cpFueros = fuerosGuardadosCP(CFG.cpFueros);
  if (!CFG.anchosAct || typeof CFG.anchosAct !== 'object') CFG.anchosAct = {};
  // Las migraciones se guardan ya, con todo lo demás ya revisado. Si no, vuelven
  // a correr en cada carga y le pisan al usuario el orden que haya elegido.
  if (migroAlgo) guardarAlmacen(K_CFG, CFG);
  // El orden de las actuaciones (1.4.2) vale mientras se mira la causa: al
  // entrar a otra, o al recargar la página, vuelven a verse como las entrega el
  // PJN, de la más nueva a la más vieja. Hasta la 1.4.1 el orden elegido por
  // columna quedaba guardado para todas las causas, y con un orden por Tipo cada
  // causa se abría mostrando primero actuaciones viejas, como si estuviera
  // desactualizada.
  CFG.ordenAct = { col: '', desc: true };
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
    const claveOrden = TABLAS[tabla].orden;
    const o = CFG[claveOrden] || { col: '', desc: true };
    const d0 = tabla === 'lista' ? (k === 'ult' || k === 'nota') : (k === 'fecha');
    if (o.col !== k) CFG[claveOrden] = { col: k, desc: d0 };
    else if (o.desc === d0) CFG[claveOrden] = { col: k, desc: !d0 };
    else CFG[claveOrden] = tabla === 'act' ? { col: '', desc: true } : { col: k, desc: d0 };
    guardarCfg();
  }

  // Valor por el que se ordena cada columna de actuaciones.
  function valorOrdenAct(a, k) {
    if (k === 'fecha') return String(numFecha(a.fecha)).padStart(8, '0');
    if (k === 'fojas') return String(parseInt(limpio(a.fojas), 10) || 0).padStart(6, '0');
    if (k === 'marcas') return norm(textoMarcasAct(EXP.datos && EXP.datos.exp, a));
    return norm(a[k]);
  }

  // -------------------------------------------------- 5.8 estado de la vista

  let VISTA = 'rel';            // rel | fav | exp | escr | notif | deox | guia | nota | desc | marcas | acerca
  const SEL = { rel: new Set(), fav: new Set() };
  const PAGINA_VISTA = { rel: 1, fav: 1 };
  let abierta = null;           // causa con el detalle de etiquetas desplegado
  let leyendo = false;
  // La lectura se detuvo para abrir una causa en esta pestaña (ver cederLectura).
  let lecturaCedida = false;

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

  // La última solapa anotada es la de la lista (Mis causas o Favoritos): es la
  // que se retoma al volver de una causa. El expediente y las demás solapas no
  // la reemplazan; si lo hicieran, al volver de una causa abierta desde
  // Favoritos se caería en Mis causas, al comienzo de la lista (1.5.4).
  function anotarUltimaLista() {
    if (VISTA === 'rel' || VISTA === 'fav') LUGARES.ultima = VISTA;
  }

  function guardarLugar() {
    if (!win) return;
    const el = desplazable();
    anotarUltimaLista();
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

  // Cada filtro de la lista, por separado. Todos reciben la causa; los que
  // miran etiquetas y anotaciones reciben además su marca.
  const pasaFuero = (c) => (CFG.fuero === '@sin' ? !fueroDe(c.exp) : (!CFG.fuero || fueroDe(c.exp) === CFG.fuero));
  const pasaSituacion = (c) => !CFG.sit || c.sit === CFG.sit;
  const pasaTramite = (c) => !(CFG.tramite === 'si' && !c.tramite) && !(CFG.tramite === 'no' && c.tramite);
  const pasaNovedad = (c) => !CFG.novedades || esNovedad(c);
  function pasaFechas(c, desde, hasta) {
    if (!desde && !hasta) return true;
    const f = numFecha(c.ult);
    return !!f && !(desde && f < desde) && !(hasta && f > hasta);
  }
  function pasaEtiqueta(c, m) {
    const e = CFG.etiqueta;
    if (!e) return true;
    if (e === '@sin') return !(m.et || []).length;
    if (e === '@anot') return !!String(m.nota || '').trim();
    if (e === '@nota') return !!NOTAS[c.exp];
    return e[0] === '@' || (m.et || []).indexOf(e) >= 0;
  }
  const pasaTexto = (c, m, t) => !t ||
    norm([c.exp, c.dep, c.car, c.sit, c.ult, etiquetasDe(c.exp).map((e) => e.nom).join(' '), m.nota].join(' ')).indexOf(t) >= 0;

  function filtradas() {
    const D = datosVista();
    if (!D) return [];
    const t = norm(CFG.texto);
    const desde = numDeInput(CFG.desde), hasta = numDeInput(CFG.hasta);
    const L = D.causas.filter((c) => {
      if (!pasaFuero(c) || !pasaSituacion(c) || !pasaTramite(c) || !pasaNovedad(c) || !pasaFechas(c, desde, hasta)) return false;
      const m = marcaDe(c.exp);
      return pasaEtiqueta(c, m) && pasaTexto(c, m, t);
    });
    const { col, desc } = CFG.orden;
    marcarFechasConHora(D.causas);
    L.sort((a, b) => {
      const x = valorOrden(a, col), y = valorOrden(b, col);
      return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
    });
    return L;
  }

  // ------------------------------------------- 5.9 aviso de filtros puestos

  // El pie de la tabla venía diciendo "(filtradas de 232)", pero está abajo de
  // todo: el renglón de arriba decía "232 causas" y se lo leía como la lista
  // entera. Pasó el 23/09/2026 con el botón Novedades, que había quedado
  // puesto de la vez anterior: se veían 10 de 232 y parecía que el programa no
  // traía las causas. Lo de acá abajo es para que el aviso esté donde se mira.

  // Cada una contesta si ese filtro está puesto, con el mismo criterio que usa
  // filtradas() para dejar causas afuera. Si acá dice que no hay filtro y
  // filtradas() igual saca causas, el aviso mentiría.
  const filtroTexto = () => !!norm(CFG.texto);
  const filtroFuero = () => !!CFG.fuero;
  const filtroSit = () => !!CFG.sit;
  const filtroTramite = () => CFG.tramite === 'si' || CFG.tramite === 'no';
  const filtroEtiqueta = () => !!CFG.etiqueta;
  const filtroFechas = () => !!(numDeInput(CFG.desde) || numDeInput(CFG.hasta));
  const filtroNovedades = () => !!CFG.novedades;

  // Los filtros puestos, con el nombre que tienen en la barra de arriba, en el
  // mismo orden en que están los controles.
  function filtrosDeLaLista() {
    const f = [];
    if (filtroTexto()) f.push('búsqueda');
    if (filtroFuero()) f.push('fuero');
    if (filtroSit()) f.push('situación');
    if (filtroTramite()) f.push('trámite');
    if (filtroEtiqueta()) f.push('etiqueta');
    if (filtroFechas()) f.push('fechas');
    if (filtroNovedades()) f.push('novedades');
    return f;
  }

  // Cuántas causas quedaron a la vista y cuántas hay en la lista. Lo anota
  // pintarTabla, que ya las contó: así el renglón de arriba no vuelve a
  // filtrar ni a ordenar la lista para decir el número.
  const FILTRANDO = { muestra: 0, total: 0 };

  const anotarFiltrando = (muestra, total) => {
    FILTRANDO.muestra = muestra;
    FILTRANDO.total = total;
  };

  const rotuloFiltros = (f) => (f.length === 1 ? 'hay un filtro puesto: ' : 'hay filtros puestos: ') + f.join(', ');

  const TITULO_FILTRANDO = 'La lista está filtrada: lo que se ve no son todas las causas. ' +
    'El botón de al lado saca todos los filtros de una vez.';

  // El aviso que se agrega al renglón de arriba. Devuelve texto vacío cuando no
  // hay ningún filtro puesto, y entonces ese renglón queda como estaba.
  function avisoFiltrosHTML() {
    const f = filtrosDeLaLista();
    if (!f.length) return '';
    return ' <span class="sj-filtrando" title="' + esc(TITULO_FILTRANDO) + '">' +
      esc('mostrando ' + FILTRANDO.muestra + ' de ' + FILTRANDO.total + ' · ' + rotuloFiltros(f)) + '</span>' +
      ' <button class="sj-b chico" data-a="limpiar" title="' + esc(TITULO_FILTRANDO) + '">Quitar los filtros</button>';
  }

  // ------------------------------------------------------------- 6.1 estilos

  const CSS = [
    '#supjn-pastilla{position:fixed;right:16px;bottom:16px;z-index:2147483000;background:' + AZUL + ';color:#fff;padding:7px 13px;border-radius:16px;cursor:pointer;font:600 13px "Segoe UI",Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);user-select:none;border:0}',
    '#supjn-pastilla:hover{background:#1c5591}',
    '#supjn-pastilla .cant{background:rgba(255,255,255,.22);border-radius:9px;padding:0 7px;margin-left:7px;font-weight:600}',
    // Con la ventana minimizada o cerrada, un error tiene que verse igual en el indicador.
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
    // Menú de solapas (1.4.1, opción elegida por el autor el 28/09/2026): un
    // escalón más grande que el resto de la ventana, y la solapa activa como una
    // pestaña blanca recortada sobre el fondo, al estilo de las carpetas de un
    // archivo. Nada más cambia de tamaño.
    '.sj-solapas{display:flex;flex-wrap:wrap;gap:4px;padding:6px 10px 0;background:#dde7f0;border-bottom:1px solid #c9d7e3;flex:none}',
    '.sj-solapas button{background:transparent;border:0;border-radius:8px 8px 0 0;color:#3e586b;padding:10px 16px 9px;cursor:pointer;font:600 15px "Segoe UI",Arial,sans-serif;white-space:nowrap}',
    '.sj-solapas button:hover{color:' + AZUL + '}',
    '.sj-solapas button.act{color:' + AZUL + ';background:#fff;box-shadow:0 -2px 0 ' + AZUL + ' inset}',
    '.sj-solapas .cant{background:#d4e1ec;color:' + AZUL + ';border-radius:9px;padding:0 7px;margin-left:6px;font-size:12.5px}',
    // Íconos de las solapas y de los botones (1.4.0): un símbolo antes del texto, del mismo color que el texto.
    '.sj-solapas .ico,.sj-b .ico,.sj-tit .fn .ico{display:inline-block;margin-right:5px;font-size:13px;line-height:1;vertical-align:-1px;opacity:.85}',
    '.sj-solapas .ico{font-size:17px;margin-right:6px}',
    // Un ícono dibujado ocupa el mismo lugar que un símbolo de la fuente: una caja
    // de 1em que baja 0,2em de la línea, con el dibujo centrado adentro.
    '.ico:has(>.svg){position:relative;width:1.15em;height:1em;vertical-align:-.2em}',
    '.ico>.svg{position:absolute;left:0;top:50%;width:1.15em;height:1.15em;transform:translateY(-50%)}',
    '.sj-solapas button.act .ico{opacity:1}',
    // Lo que requiere atención, con color: novedades en verde y notas a verificar en ámbar.
    '.sj-solapas .cant.verde{background:#2e9e4f;color:#fff}',
    '.sj-solapas .cant.ambar{background:#d18a00;color:#fff}',
    '.sj-solapas .cant.rojo{background:#c0392b;color:#fff}',
    // La cruz de la solapa del expediente: se ve siempre, y se resalta al pasar por encima.
    '.sj-solapas .cerrar{margin-left:7px;padding:0 3px;border-radius:3px;font-size:13px;line-height:1;opacity:.55}',
    '.sj-solapas .cerrar:hover{opacity:1;background:#c93b3b;color:#fff}',
    '.sj-barra{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;padding:8px 12px;border-bottom:1px solid #dbe4e8;background:#f5f8fa;flex:none}',
    '.sj-barra > *{height:30px;font:12px "Segoe UI",Arial,sans-serif}',
    '.sj-barra input[type=text]{flex:1 1 220px;min-width:160px;border:1px solid #b9c9d0;border-radius:5px;padding:0 9px}',
    '.sj-barra select,.sj-barra input[type=date],.sj-barra input.sj-fecha{height:30px;border:1px solid #b9c9d0;border-radius:5px;padding:0 6px;background:#fff;color:#1d2b36;max-width:200px}',
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
    // El aviso de que la lista está filtrada. Va en ámbar y no en gris: tiene
    // que saltar a la vista en el mismo renglón donde se lee cuántas causas hay.
    '.sj-est .sj-filtrando{display:inline-block;background:#fdf3d3;border:1px solid #dcb851;color:#6d5200;border-radius:9px;padding:0 8px;font-weight:600}',
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
    // Placas de estado (1.4.0). El mismo lenguaje de color en toda la ventana,
    // como lo usa el PJN en Escritos: texto blanco sobre un color pleno. Cada
    // color significa siempre lo mismo: verde, resuelto o en curso normal;
    // índigo, en poder de la dependencia; azul, enviado; ámbar, pendiente o a
    // verificar; rojo, fallido o paralizado; gris, archivado o cerrado.
    '.sj-estado{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11.5px;font-weight:700;line-height:17px;color:#fff;background:#6b7c85;white-space:nowrap;letter-spacing:.1px}',
    // (1.4.6) Respondido de DEOX: la placa y la fecha llevan a la respuesta.
    '.sj-resp{display:inline-block;border:0;background:transparent;padding:0;margin:0;cursor:pointer;text-align:left;font:inherit;color:inherit}',
    '.sj-resp .sj-sub{display:block;color:#14416f;text-decoration:underline dotted}',
    '.sj-resp:hover .sj-sub,.sj-resp:focus-visible .sj-sub{text-decoration:underline solid}',
    '.sj-resp:hover .sj-estado{filter:brightness(1.12)}',
    // Cuadrito con letra del tipo de actuación (1.4.1, reparto de colores
    // elegido por el autor el 28/09/2026), en la lista de actuaciones de una
    // causa: D despacho en azul, E escrito en verde, C cédula en rojo (plazo
    // corriendo), O oficio electrónico (DEO y DEOX) en violeta, S sentencia o
    // resolución en ámbar (para leer ya); cualquier otro tipo, su inicial en
    // gris. Usa los mismos colores que las placas.
    '.sj-tipo{display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:4px;font:700 12px "Segoe UI",Arial,sans-serif;color:#fff;background:#6b7c85;margin-right:3px;vertical-align:middle;box-sizing:border-box;letter-spacing:0}',
    '.sj-estado.verde,.sj-tipo.verde{background:#2e9e4f}',
    '.sj-estado.indigo,.sj-tipo.indigo{background:#5a5fc7}',
    '.sj-estado.azul,.sj-tipo.azul{background:#2f7fc1}',
    '.sj-estado.ambar,.sj-tipo.ambar{background:#d18a00}',
    '.sj-estado.rojo,.sj-tipo.rojo{background:#c0392b}',
    '.sj-estado.gris,.sj-tipo.gris{background:#6b7c85}',
    '.sj-estado.violeta,.sj-tipo.violeta{background:#7b4fb5}',
    '.sj-elegir td.acc{text-align:right;white-space:nowrap}',
    // Descargar es un botón y Ver un enlace, porque abre una pestaña nueva. Se
    // los dibuja igual para que la columna no quede despareja: el enlace toma
    // la misma caja, el mismo color y la misma alineación que el botón.
    '.sj-elegir td.acc .sj-b{padding:1px 8px;height:26px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:' + AZUL + ';vertical-align:middle}',
    '.sj-elegir td.acc .sj-b + .sj-b{margin-left:6px}',
    '.sj-elegir td.acc a.sj-b:hover{background:#dbe8f5;text-decoration:none}',
    // Los movimientos sin documento (1.4.4) van en gris, para que no se confundan con lo que se descarga.
    '.sj-elegir tr.mov td{color:#5f7079;background:#fafbfc}',
    '.sj-elegir tr.mov td.acc .sindoc{font-size:11.5px;font-style:italic;color:#7b8b93}',
    '.sj-rol{color:#6b7c85;font-size:11px;text-transform:uppercase;letter-spacing:.02em}',
    '.sj-sep{color:#b9c6cc;margin:0 5px}',
    '.sj-exp-cab .c .p{margin-top:2px;font-size:12.5px;color:#24414f}',
    '.sj-nuevo{background:#2e9e4f;color:#fff;border-radius:9px;padding:0 7px 0 5px;font-size:10.5px;font-weight:700;margin-right:6px;vertical-align:1px;box-shadow:0 0 0 2px #e3f4e8}',
    '.sj-nuevo::before{content:"\\25CF";margin-right:4px;font-size:8px;vertical-align:1px}',
    '.sj-hora{color:#0a6cab;font-weight:600}',
    '.sj-leido{color:#3a4c54}',
    '.sj-leido.vieja{color:#b3261e;font-weight:600}',
    // Resultado de dejar nota (1.4.0): placa con el mismo lenguaje de color.
    '.sj-res{display:inline-block;padding:1px 9px;border-radius:12px;font-size:11.5px;font-weight:700;white-space:nowrap;color:#fff;background:#6b7c85}',
    '.sj-res.ok{background:#2e9e4f}',
    '.sj-res.mal{background:#c0392b}',
    '.sj-fecha{width:100px;font-variant-numeric:tabular-nums}',
    '.sj-fecha.mal{border-color:#b3261e;color:#b3261e}',
    '.sj-res.duda{background:#d18a00}',
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
    '.sj-solapa-exp h4{margin:0 0 4px;display:flex;align-items:center;gap:6px}',
    // Pestañas del expediente (1.7.0), con los colores de la ventana.
    '.sj-pest{display:flex;flex-wrap:wrap;gap:3px;padding:8px 12px 0;background:#e9f0f6;border-bottom:2px solid ' + AZUL + '}',
    '.sj-pest button{background:#f6f9fc;border:1px solid #b9cde0;border-bottom:0;border-radius:6px 6px 0 0;color:#3e586b;padding:7px 12px 6px;cursor:pointer;font:600 13px "Segoe UI",Arial,sans-serif;white-space:nowrap;display:inline-flex;align-items:center;gap:2px}',
    '.sj-pest button:hover{color:' + AZUL + ';background:#fff}',
    '.sj-pest button.act{background:' + AZUL + ';border-color:' + AZUL + ';color:#fff}',
    '.sj-pest button .sj-badge{margin:0 0 0 6px;background:#d4e1ec;color:' + AZUL + '}',
    '.sj-pest button.act .sj-badge{background:#fff;color:' + AZUL + '}',
    '.sj-pest-panel{display:none}',
    '.sj-pest-panel.act{display:block}',
    '.sj-notas-pjn tr.propia td{background:#e8f6ec}',
    // El clic en la celda de una actuación cae siempre sobre la celda y no sobre
    // lo que tiene adentro, que se redibuja al guardar la anotación: si el
    // elemento tocado desaparece entre que se aprieta y se suelta el botón, el
    // navegador no da el clic por hecho.
    '[data-actm] *{pointer-events:none}',
    // Fechas en placas de color (1.7.0): dos puntos más que la letra de la tabla.
    '.sj-fh{display:inline-block;padding:1px 8px;border-radius:10px;color:#fff;font:700 14.5px Consolas,"Courier New",monospace;white-space:nowrap;line-height:1.35}',
    '.sj-fh.hoy{background:#2e9e4f}',
    '.sj-fh.semana{background:' + AZUL + '}',
    '.sj-fh.vieja{background:#e07b1f}',
    '.sj-desplegar{background:none;border:0;padding:0;color:' + AZUL + ';font:700 13px "Segoe UI",Arial,sans-serif;cursor:pointer;display:flex;align-items:center;gap:6px}',
    '.sj-desplegar:hover{text-decoration:underline}',
    '.sj-sol-txt{font-size:12.5px;color:#3a4c54;margin-top:6px}',
    '.sj-sol-txt.mal{color:#b3261e}',
    // Títulos de las tablas de Intervinientes (Partes, Peritos, Fiscales).
    '.sj-sol-tit{margin:10px 0 4px;font-size:11.5px;font-weight:700;color:' + AZUL + ';letter-spacing:.05em;text-transform:uppercase}',
    '.sj-sol-tit:first-child{margin-top:4px}',
    '.sj-sol-tit + .lst-sol{margin-top:0}',
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
    '.sj-elegir .fil input.sj-fecha{width:96px;height:28px;border:1px solid #b9c9d0;border-radius:5px;padding:0 5px}',
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
    // Lo que informa el PJN, arriba de la ficha a la que se llegó desde Intervinientes.
    '.sj-info.sj-segun{font-size:12.5px;line-height:1.45}',
    '.sj-guia h3{margin:0 0 6px;font-size:16px;color:' + AZUL + '}',
    '.sj-guia p{margin:2px 0}',
    '.sj-guia .bts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
    '.sj-guia-nav{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
    '.sj-guia-nav:empty{display:none}',
    '.sj-guia table.sj-t{width:100%;table-layout:auto}',
    '.sj-guia table.sj-t tr.res td{background:#fff8dc}',
    '.sj-guia td.sj-mp-bts{white-space:nowrap;text-align:right}',
    '.sj-guia td.sj-mp-bts .sj-b{margin-left:4px}',
    // Botón del mapa (1.7.0): pequeño, sin texto, pegado a la dirección.
    '.sj-mapa{display:inline-flex;align-items:center;gap:1px;height:20px;padding:0 4px;margin-left:4px;border:1px solid #b9cde0;border-radius:4px;background:#eaf1f8;color:' + AZUL + ';text-decoration:none;vertical-align:middle;line-height:1;font:600 11px "Segoe UI",Arial,sans-serif}',
    '.sj-mapa:hover{background:#d4e1ec;border-color:' + AZUL + '}',
    '.sj-mapa .pin{font-size:13px;color:#c0392b}',
    '.sj-mapa .fl{font-size:11px}',
    // La consulta pública (1.6.0).
    '.sj-barra input.sj-cp-juicio{flex:0 1 230px;min-width:150px}',
    '.sj-cp h3{margin:0 0 6px;font-size:16px;color:' + AZUL + '}',
    '.sj-cp .sj-sec p{margin:4px 0;max-width:900px}',
    '.sj-cp-fueros{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;margin:2px 0 4px}',
    '.sj-cp-f{display:inline-flex;align-items:center;gap:3px;padding:1px 9px;border-radius:10px;font:600 11.5px "Segoe UI",Arial,sans-serif;background:#e3eaef;color:#3a4c54;white-space:nowrap}',
    '.sj-cp-f.azul{background:#2f7fc1;color:#fff}',
    '.sj-cp-f.verde{background:#2e9e4f;color:#fff}',
    '.sj-cp-f.ambar{background:#d18a00;color:#fff}',
    '.sj-cp-f.rojo{background:#c0392b;color:#fff}',
    '.sj-cp-f.violeta{background:#7b4fb5;color:#fff}',
    '.sj-cp-f.off{background:transparent;color:#8a98a8;border:1px dashed #b9c9d0}',
    '.sj-cp-f button{border:0;background:rgba(255,255,255,.3);color:inherit;border-radius:8px;cursor:pointer;font:700 11px/1 "Segoe UI",Arial,sans-serif;padding:2px 5px;margin-left:2px}',
    '.sj-cp-f.off button{background:#e3eaef;color:' + AZUL + '}',
    '.sj-cp-grupos{display:flex;flex-wrap:wrap;gap:6px;padding:4px 14px 6px}',
    '.sj-cp-filtro{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin:4px 0 8px}',
    '.sj-cp-filtro input[type=text]{flex:1 1 240px;min-width:160px;height:28px;border:1px solid #b9c9d0;border-radius:5px;padding:0 8px}',
    '.sj-cp-filtro select{height:28px;border:1px solid #b9c9d0;border-radius:5px;max-width:340px;background:#fff}',
    '.sj-cp .sj-sec h4:first-child{margin-top:0}',
    // El desafío del PJN, si algún día lo pide con la sesión iniciada: el marco
    // se muestra sobre la ventana, debajo del cartel que explica qué hacer.
    '#supjn-desafio{position:fixed;left:50%;top:30px;transform:translateX(-50%);width:660px;max-width:calc(100vw - 20px);box-sizing:border-box;z-index:2147483300;background:#fff;border:2px solid ' + AZUL + ';border-bottom:0;border-radius:8px 8px 0 0;padding:10px 16px;font:13px/1.45 "Segoe UI",Arial,sans-serif;color:#1d2b36}',
    '#supjn-desafio p{margin:6px 0}',
    '#supjn-desafio .bts{display:flex;gap:8px}',
    '#supjn-desafio button{height:28px;padding:0 10px;border:1px solid #b9cde0;background:#eaf1f8;color:' + AZUL + ';border-radius:5px;cursor:pointer;font:600 12px "Segoe UI",Arial,sans-serif}',
    'iframe.supjn-desafio-marco{position:fixed;left:50%;top:150px;transform:translateX(-50%);width:660px;max-width:calc(100vw - 20px);height:min(470px, calc(100vh - 170px));box-sizing:border-box;z-index:2147483300;background:#fff;border:2px solid ' + AZUL + ';border-top:1px solid #dbe4e8;border-radius:0 0 8px 8px;box-shadow:0 18px 60px rgba(0,0,0,.42)}'
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
    // Si la ventana está minimizada o cerrada, un error se marca en la
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

  // Íconos (1.4.0): símbolos de la fuente, sin imágenes ni bibliotecas.
  const ICONO_SOLAPA = { rel: '\u2696', fav: '\u2605', exp: '\u25A4', escr: '\u270E', notif: '\u2709', deox: '\u21C4', guia: '\u260E', cp: '\u2315', nota: '\u270D', desc: '\u21E9', marcas: '\u26C1', acerca: '\u24D8' };
  // (1.4.6) El círculo con la i de Acerca de se veía cortado: el símbolo de la
  // fuente sale más alto que la línea. Se lo dibuja igual, pero a mano, con el
  // color del texto, para que quede entero y centrado.
  ICONO_SOLAPA.acerca = '<svg class="svg" viewBox="0 0 16 16" width="1em" height="1em" focusable="false">' +
    '<circle cx="8" cy="8" r="7.1" fill="none" stroke="currentColor" stroke-width="1.35"/>' +
    '<circle cx="8" cy="4.7" r="1" fill="currentColor"/>' +
    '<rect x="7.3" y="6.6" width="1.4" height="5.4" rx=".6" fill="currentColor"/></svg>';
  const icono = (c) => (c ? '<span class="ico" aria-hidden="true">' + c + '</span>' : '');

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
    s.push(['guia', 'Guía', null, 'Guía judicial del PJN: dependencias, domicilios, teléfonos e integrantes. También las fiscalías (MPF) y las defensorías (MPD)']);
    s.push(['cp', 'Consulta pública', cantidadCP(), 'Buscar causas por el nombre de una parte o por número, en tus causas y en la consulta pública del PJN, en varios fueros a la vez']);
    const c = leerCorrida();
    s.push(['nota', 'Dejar nota', (c && c.activa) ? progresoNota(c) : (SEL[listaActual()].size || null)]);
    const activos = COLA.filter((t) => /en cola|abriendo|leyendo|descargando|a descargar|eligiendo/.test(t.estado)).length;
    s.push(['desc', 'Descargas', COLA.length ? (activos || COLA.length) : null]);
    s.push(['marcas', 'Respaldo', null, 'Respaldo, etiquetas y anotaciones']);
    s.push(['acerca', 'Acerca de', null]);
    // Cuentas de atención (1.4.0): novedades en Mis causas y notas a verificar en Dejar nota.
    const novedades = DATOS.rel ? DATOS.rel.causas.filter((x) => esNovedad(x, DATOS.rel.fecha)).length : 0;
    // Solo las de hoy, como la solapa: las de otro día no se pueden volver a
    // intentar y la cuenta no bajaba nunca (hasta la 1.6.0).
    const hoy = hoyISO();
    const aVerificar = Object.values(NOTAS).filter((x) => x && x.ok === null && x.f === hoy).length;
    const atencion = (k) => (k === 'rel' && novedades ? '<span class="cant verde" title="Causas con novedades">' + novedades + '</span>' : k === 'nota' && aVerificar ? '<span class="cant ambar" title="Notas a verificar">' + aVerificar + '</span>' : '');
    e.innerHTML = s.map(([k, t, n, tit, cerrable]) => '<button data-vista="' + k + '" class="' + (VISTA === k ? 'act' : '') + '"' +
      (tit ? ' title="' + esc(tit) + '"' : '') + '>' + icono(ICONO_SOLAPA[k]) + esc(t) +
      (n == null ? '' : '<span class="cant">' + n + '</span>') + atencion(k) +
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
    if (alertaPastilla) extra = 'hay un aviso';
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
      e.innerHTML = '<b>Dejando nota' + (c && c.solo ? ' en ' + plural(c.solo.length, 'causa seleccionada', 'causas seleccionadas') : ' en todas las habilitadas') + '.</b>' +
        '<span data-e="notaTxt">' + esc(ultimoEstadoNota || 'Retomando el lote...') + '</span>' +
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
    q('[data-f="desde"]').value = textoDesdeISO(CFG.desde);
    q('[data-f="hasta"]').value = textoDesdeISO(CFG.hasta);
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
    b.innerHTML = icono('\u25CF') + (n ? 'Novedades (' + n + ')' : 'Novedades');
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
      (vieja ? ' <button class="sj-b chico" data-a="actualizar" title="Volver a leer las listas del PJN">Volver a leer</button>' : '') +
      avisoFiltrosHTML();
  }

  function pintarCopia() {
    const e = q('[data-e="copia"]');
    if (!e) return;
    const hayMarcas = Object.keys(MARCAS.filas).length > 0;
    if (CARPETA && carpetaEstado === 'contra') {
      e.className = 'sj-copia vieja';
      e.textContent = 'La carpeta de respaldo espera la contraseña';
    } else if (CARPETA && carpetaEstado === 'error') {
      // 1.6.3: hasta la 1.6.2 seguía en verde aunque no se pudiera leer ni guardar.
      e.className = 'sj-copia vieja';
      e.textContent = 'Falla en la carpeta de respaldo';
      e.title = carpetaAviso ? 'Abre la solapa Respaldo. ' + carpetaAviso : 'Abre la solapa Respaldo';
      return;
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
    // El de la barra: el renglón de estado tiene su propio "Volver a leer" con
    // la misma acción, y está antes en la página.
    const a = q('.sj-est > [data-a="actualizar"]'), c = q('[data-a="cortarLectura"]');
    if (a) { a.disabled = leyendo; a.innerHTML = leyendo ? 'Leyendo...' : icono('\u27F3') + 'Actualizar'; }
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
    const sinBajar = b ? ' title="Durante un lote de notas no se descarga nada: la página se recarga en cada nota"' : '';
    e.innerHTML = '<span class="cuenta">' + (n ? plural(n, 'seleccionada', 'seleccionadas') : 'Ninguna seleccionada') + '</span>' +
      '<button class="sj-b" data-a="notaSel"' + dis(!n || b) + ' title="Lleva a la solapa Dejar nota con estas causas">' + icono('\u270D') + 'Dejar nota en las seleccionadas</button>' +
      '<button class="sj-b" data-a="bajarSel"' + dis(!n || b) + sinBajar + '>' + icono('\u21E9') + 'Descargar PDF de las seleccionadas</button>' +
      '<button class="sj-b" data-a="elegirSel"' + dis(n !== 1 || b) + (sinBajar || ' title="Con una causa seleccionada: elegir qué actuaciones descargar"') + '>' + icono('\u2611') + 'Elegir actuaciones</button>' +
      '<button class="sj-b" data-a="quitarSel"' + dis(!n) + '>' + icono('\u2715') + 'Quitar selección</button>';
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

  /* --- Verificar las que quedaron a verificar --------------------------------
     El PJN admite una sola nota por expediente y por día: ante un segundo
     intento contesta "Ya se ha dejado nota con el usuario … en el expediente:
     … No es posible realizar dicha acción más de una vez al día por
     expediente", y esa respuesta es la confirmación de que la nota está.

     De modo que volver a intentarlo sobre una causa que quedó en duda no puede
     dejar una nota de más: o el PJN avisa que ya estaba, y queda registrada
     como dejada, o la deja porque faltaba, que es lo que el lote buscaba. Es lo
     mismo que el autor venía haciendo a mano, pero solo sobre las dudosas.

     No hay mecanismo nuevo: se usa el lote de siempre, con la lista de dudosas
     como selección.
  --------------------------------------------------------------------------- */
  const conResultado = (v) => {
    refrescarNotas();
    const hoy = hoyISO();
    return Object.keys(NOTAS).filter((k) => NOTAS[k].f === hoy && NOTAS[k].ok === v);
  };
  const dudosasDeHoy = () => conResultado(null);

  const TITULO_VERIFICAR = 'Vuelve a intentar la nota solo en las causas que quedaron a verificar. ' +
    'Si ya estaba dejada, el PJN lo avisa y queda registrada como dejada; si faltaba, la deja. ' +
    'El PJN admite una sola nota por expediente y por día, de modo que nunca quedan dos.';

  const botonVerificarHTML = (dudosas) => (dudosas.length
    ? '<button class="sj-b peligro" data-a="verificarDudosas" title="' + esc(TITULO_VERIFICAR) + '">Verificar en el PJN (' +
      dudosas.length + ')</button>'
    : '');

  // La causa que llegó desde el menú de una fila: va primero, con su propio
  // botón, y debajo siguen las dos opciones de siempre.
  function elegidaNotaHTML() {
    const k = notaElegida;
    if (!k) return '';
    const enRel = !!causaEn('rel', k);
    return '<h3>Causa elegida desde el menú</h3><table class="lista">' + filaNotaHTML(k, false) + '</table>' +
      '<div class="bts">' +
      '<button class="sj-b' + (enRel ? ' peligro' : '') + '" data-a="notaElegida"' + (enRel ? '' : ' disabled title="Solo para causas que están en Mis causas (Relacionados)"') + '>Dejar nota en ' + esc(k) + '</button>' +
      '<button class="sj-b" data-a="descartarElegida">Descartar</button>' +
      '</div>';
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
      '<p>Hace lo mismo que harías manualmente en la lista de Relacionados del PJN: pone el filtro "Dejar nota", pulsa el lápiz de cada causa y confirma el cartel, recorriendo todas las páginas. El PJN recarga la página después de cada nota; el avance se ve acá. Solo entran las causas que el PJN habilite hoy.</p>';

    if (corriendo) {
      h += '<div class="sj-trab"><div class="cab"><b>Lote en curso</b>' +
        '<span class="sj-badge">' + (c && c.solo ? plural(c.solo.length, 'causa seleccionada', 'causas seleccionadas') : 'todas las habilitadas') + '</span>' +
        (c ? '<span class="car" data-e="notaVan">van ' + esc(progresoNota(c)) + '</span>' : '') + '</div>' +
        '<div class="txt" data-e="notaTxtPanel">' + esc(ultimoEstadoNota || 'Retomando el lote...') + '</div>' +
        '<div class="bts" style="margin-top:8px"><button class="sj-b peligro" data-a="cortarNota">Cancelar</button></div></div>';
    } else {
      // Los botones de esta solapa ejecutan: el aviso ya está arriba. Van en
      // rojo porque no hay paso atrás una vez que la tanda arranca.
      h += elegidaNotaHTML();
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
        // Las que quedaron en duda se resuelven acá mismo, sin volver a correr
        // el lote entero ni tener que abrir cada expediente.
        (corriendo ? '' : '<div class="bts">' + botonVerificarHTML(dudosas) + '</div>') +
        '<table class="lista">' + deHoy.map((k) => filaNotaHTML(k, false)).join('') + '</table>'
      : '<p style="color:#6b7c85">Todavía no se dejó ninguna nota hoy desde SuPJN+.</p>';
    return h + '</div>';
  }

  const chipsDe = (k) => etiquetasDe(k).map((e) => '<span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span>').join('');

  // que: 'causa' o, desde la 1.7.0, 'actuación'.
  function editorMarcasHTML(k, que) {
    const m = marcaDe(k);
    const sobre = que === 'actuación' ? 'esta actuación' : 'esta causa';
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
      '<textarea class="sj-nota" placeholder="Anotaciones privadas sobre ' + sobre + '. Quedan en esta PC y no se escriben en el expediente.">' + esc(m.nota) + '</textarea>' +
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
    if (k === 'sit') return placaSituacionHTML(c.sit);
    if (k === 'ult') {
      const h = HORAS[c.exp];
      return fechaPlacaHTML(c.ult) + (h && h.f === c.ult
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
      anotarFiltrando(0, 0);
      return;
    }
    const L = filtradas();
    // Los dos números del aviso de filtros salen de acá, que es donde ya están
    // contados: el renglón de arriba los lee, no los vuelve a calcular.
    anotarFiltrando(L.length, D.total);
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
    const anchoPaginador = 9;
    let ini = Math.max(1, pagina - Math.floor(anchoPaginador / 2));
    const fin = Math.min(paginas, ini + anchoPaginador - 1);
    ini = Math.max(1, fin - anchoPaginador + 1);
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
    // Cada vez que se rehace la tabla cambian los números del aviso de filtros,
    // que está arriba: se lo rehace acá para que no quede diciendo otra cosa.
    pintarEstado();
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
      it('bajarUna', 'Descargar el expediente completo en PDF', b, b ? 'Durante un lote de notas no se descarga nada' : '') +
      it('elegirUna', 'Elegir qué actuaciones descargar', b, b ? 'Durante un lote de notas no se descarga nada' : '') +
      '<div class="sep"></div>' +
      it('notaUna', 'Dejar nota en esta causa', !enRel || b, soloRel) +
      it('marcasUna', 'Etiquetas y anotaciones') +
      '<div class="sep"></div>' +
      it('cedulaUna', 'Dejar cédula (Notificaciones, pestaña nueva)') +
      it('deoxUna', 'Nuevo DEOX (pestaña nueva)') +
      it('verEscr', 'Escritos presentados en esta causa') +
      it('verNotif', 'Notificaciones de esta causa') +
      it('verDeox', 'DEOX de esta causa') +
      it('verGuia', 'Datos del juzgado (Guía judicial)', !depDe(k), depDe(k) ? '' : 'No se conoce la dependencia de esta causa') +
      ((causaPorClave(k) && esNovedad(causaPorClave(k))) ? it('vistoUna', 'Marcar como vista') : '');
  }

  // ---------------------------------------------------- 6.8 vista expediente

  const EXP = { estado: 'nada', texto: '', datos: null, acts: null, movs: [], elegidas: new Set(), filtro: { texto: '', desde: '', hasta: '' }, cortar: false,
    // La pestaña a la vista (1.7.0) y la actuación con su cuadro de etiquetas y
    // anotación abierto, si hay una.
    pestana: 'act', actAbierta: null,
    // Las otras tres solapas del PJN: se piden de a una y se guardan mientras dure la página.
    solapas: { int: { estado: 'nada', texto: '', cabs: [], filas: [], grupos: [], abierta: false }, vin: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false }, rec: { estado: 'nada', texto: '', cabs: [], filas: [], abierta: false } } };

  // Roles de acompañamiento: no son partes, son quienes las asisten o intervienen por oficio.
  const ROL_ACCESORIO = /letrad|apoderad|patrocinante|perit|defensor|fiscal|ministerio|s[ií]ndic|martiller|mediador|curador|tutor|auxiliar|secretari|^juez|consultor|traductor|int[eé]rprete|oficial|asesor/i;

  // Qué columna de la tabla de partes es el rol y cuál el nombre. Si no se
  // reconoce la del rol, se usa la primera, pero solo cuando hay otra para el
  // nombre: dar por rol la columna 0 a ciegas daba vuelta las dos cosas y
  // mostraba "Juan perez: ACTOR". null si no se las puede distinguir.
  function columnasPartes(cabs) {
    const iNom = cabs.findIndex((c) => /nombre|denominaci/i.test(c));
    let iTipo = cabs.findIndex((c) => /tipo|car[aá]cter|rol|intervin/i.test(c));
    if (iTipo < 0) iTipo = (iNom === 0 && cabs.length > 1) ? 1 : 0;
    const nom = iNom >= 0 ? iNom : (iTipo === 1 ? 0 : 1);
    if (iTipo === nom) return null;
    return { iTipo, iNom: nom };
  }

  // De la solapa Intervinientes salen las partes de verdad, con el rol que pone el PJN.
  function partesDeIntervinientes(s) {
    if (!s || s.estado !== 'listo' || !s.filas.length) return null;
    const col = columnasPartes(s.cabs);
    if (!col) return null;
    const out = [];
    s.filas.forEach((f) => {
      const rol = limpio(f[col.iTipo] || '');
      const nombre = limpio(f[col.iNom] || '');
      if (!nombre || ROL_ACCESORIO.test(rol)) return;
      out.push({ rol: nombreRol(rol), nombre });
    });
    return out.length ? out : null;
  }

  // Fiscalías y defensorías oficiales de Intervinientes: qué fila lleva a qué
  // ficha del directorio del Ministerio Público (ver 8.5, "desde
  // Intervinientes"). La defensa oficial viene entre los letrados de cada parte
  // ("LETRADO DEFENSOR OFICIAL"), a veces con el nombre de la defensoría y a
  // veces con el de la persona; los fiscales, en su propia tabla.
  // Solo la defensa pública: "DEFENSOR OFICIAL", "DEFENSORA PÚBLICA", "DEFENSOR
  // DE MENORES", "LETRADO ASESOR DE MENORES", curadores y tutores públicos. Un
  // "LETRADO DEFENSOR" a secas o "PARTICULAR" es un abogado de la matrícula y no
  // figura en el directorio.
  const ROL_DEFENSA_OFICIAL = /defensor\w*\s+(p[uú]blic|oficial|de\s+menores)|asesor\w*\s+de\s+menores|(curador|tutor)\w*\s+(p[uú]blic|oficial)/i;
  // El nombre de una dependencia del MPD. En las causas civiles y de familia
  // aparecen también como partes ("TERCERO | TUTORIA N 2", "TERCERO |
  // DEFENSORA PUBLICA DE MENORES E INC. NRO 6"; relevado el 30/09/2026). La
  // Defensoría del Pueblo no es del MPD.
  const ES_DEFENSORIA = /^(defensor[ií]a|defensora\s+p[uú]blica|defensor\s+p[uú]blico|tutor[ií]a|curadur[ií]a)\b/i;
  const esDelMPD = (nombre) => ES_DEFENSORIA.test(nombre) && !/\bdel\s+pueblo\b/i.test(nombre);
  const esGrupoFiscales = (g) => !!g && (/^fiscal/i.test(g.titulo) || g.cabs.some((c) => /^fiscal[ií]a$/i.test(limpio(c))));

  // La fila de parte que abre cada bloque (una parte y, debajo, sus letrados).
  const esFilaDeParte = (f, col) => { const r = limpio(f[col.iTipo] || ''); return !!r && !ROL_ACCESORIO.test(r); };

  // La defensoría que figura en el mismo bloque que la fila i, si figura: la
  // de los letrados, que es la más precisa ("DEFENSORIA DE MENORES E INCAPACES
  // ANTE LOS TRIB. DE 2DA INST..."), y si no hay, la de la parte ("TERCERO |
  // DEFENSORIA DE CAMARA").
  function defensoriaDelBloque(filas, col, i) {
    let ini = i;
    while (ini > 0 && !esFilaDeParte(filas[ini], col)) ini--;
    let fin = i + 1;
    while (fin < filas.length && !esFilaDeParte(filas[fin], col)) fin++;
    const nombre = (f) => limpio(f[col.iNom] || '');
    const d = filas.slice(ini + 1, fin).find((f) => esDelMPD(nombre(f))) || (esDelMPD(nombre(filas[ini])) ? filas[ini] : null);
    return d ? nombre(d) : '';
  }

  // Una fila con el nombre de una dependencia del MPD lleva a esa dependencia;
  // la de una persona de la defensa pública, a la defensoría de su bloque o, si
  // no figura, a las fichas en las que el directorio la nombra.
  function pedidoDeParte(s, i) {
    const col = columnasPartes(s.cabs);
    const f = s.filas[i];
    if (!col || !f) return null;
    const rol = limpio(f[col.iTipo] || ''), nombre = limpio(f[col.iNom] || '');
    if (!nombre) return null;
    // Una dependencia del MPD lleva a su ficha, sea letrado o parte.
    if (esDelMPD(nombre)) return { modo: 'def', nombre, persona: '' };
    if (!ROL_ACCESORIO.test(rol) || !ROL_DEFENSA_OFICIAL.test(rol)) return null;
    return { modo: 'def', nombre: defensoriaDelBloque(s.filas, col, i), persona: nombre };
  }

  function pedidoDeFiscal(g, i) {
    const f = g.filas[i];
    if (!f) return null;
    const iF = g.cabs.findIndex((c) => /fiscal[ií]a/i.test(c));
    const iP = g.cabs.findIndex((c) => /^fiscal$/i.test(limpio(c)));
    const nombre = limpio(f[iF >= 0 ? iF : 0] || '');
    return nombre ? { modo: 'fis', nombre, persona: iP >= 0 ? limpio(f[iP] || '') : '' } : null;
  }

  // gi es 'p' para la tabla de partes, o el número de la otra tabla.
  function pedidoInterviniente(gi, i) {
    const s = EXP.solapas.int;
    if (gi === 'p') return pedidoDeParte(s, i);
    const g = (s.grupos || [])[gi];
    return esGrupoFiscales(g) ? pedidoDeFiscal(g, i) : null;
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
    // Con peritos o fiscales y sin partes, lo que falta son las partes.
    const conOtros = !!(s.grupos && s.grupos.length);
    const dudoso = s.estado === 'error' || s.estado === 'listo' || (s.estado === 'nada' && EXP.estado === 'error');
    return '<span title="' + esc(vacia
      ? (conOtros ? 'El PJN no informa partes para esta causa: estas se obtienen de la carátula.'
        : 'El PJN no informa intervinientes para esta causa: estas partes se obtienen de la carátula.')
      : dudoso
        ? 'Obtenidas de la carátula: no se pudieron leer los intervinientes del PJN. Abrí Intervinientes para ver los que manda el PJN.'
        : 'Obtenidas de la carátula mientras se leen los intervinientes del PJN.') + '">' +
      partesHTML(ps) + (dudoso ? ' <span class="sj-badge">de la carátula</span>' : '') + '</span>';
  }

  const botonPJN = (re) => [...document.querySelectorAll('a, input[type=button], input[type=submit], button')]
    .find((x) => !esNuestro(x) && re.test(limpio(x.value || x.textContent))) || null;

  // Las pestañas del expediente (1.7.0), en el orden pedido por el autor. Cada
  // una tiene su panel; todos los paneles están en la página y solo se ve el de
  // la pestaña elegida, así lo que se lee en segundo plano se sigue dibujando
  // aunque se esté mirando otra.
  const PESTANAS_EXP = [
    { id: 'act', t: 'Actuaciones', ico: '\u{1F4C4}', ayuda: 'Las actuaciones de la causa, para ver, elegir y descargar' },
    { id: 'notas', t: 'Notas', ico: '✎', ayuda: 'Las notas dejadas en la causa, según el PJN' },
    { id: 'int', t: 'Intervinientes', ico: '\u{1F465}', ayuda: 'Las partes y quienes intervienen, con los peritos y los fiscales' },
    { id: 'vinrec', t: 'Causas Vinculadas y Recursos', ico: '\u{1F517}', ayuda: 'Las causas vinculadas a esta y sus recursos' },
    { id: 'marcas', t: 'Etiquetas y Anotaciones', ico: '\u{1F3F7}', ayuda: 'Tus etiquetas y anotaciones privadas de esta causa' }
  ];
  const pestanaValida = (id) => PESTANAS_EXP.some((x) => x.id === id);

  // La cuenta que va en cada pestaña, cuando ya se sabe.
  function cuentaPestana(id) {
    if (id === 'act') return EXP.acts ? EXP.acts.length + movsDe(EXP).length : null;
    if (id === 'notas') { const n = notasDelPJN(); return n ? n.total : null; }
    if (id === 'int') { const s = EXP.solapas.int; return s.estado === 'listo' ? cuentaSolapa(s) : null; }
    if (id === 'vinrec') {
      const v = EXP.solapas.vin, r = EXP.solapas.rec;
      return v.estado === 'listo' && r.estado === 'listo' ? cuentaSolapa(v) + cuentaSolapa(r) : null;
    }
    const k = EXP.datos && EXP.datos.exp;
    return k && (etiquetasDe(k).length || String(marcaDe(k).nota || '').trim()) ? '✓' : null;
  }

  function botonPestanaHTML(x) {
    const n = cuentaPestana(x.id);
    return '<button class="' + (EXP.pestana === x.id ? 'act' : '') + '" data-a="verPest" data-pest="' + x.id + '" title="' + esc(x.ayuda) + '">' +
      icono(x.ico) + esc(x.t) + (n != null ? '<span class="sj-badge">' + esc(String(n)) + '</span>' : '') + '</button>';
  }
  const barraPestanasHTML = () => '<div class="sj-pest" data-e="pestExp">' + PESTANAS_EXP.map(botonPestanaHTML).join('') + '</div>';

  // Solo se cambian la marca de la elegida y las cuentas, sobre los mismos
  // botones: reemplazarlos mientras se leen las solapas hacía perder un clic
  // que estuviera a mitad de camino.
  function pintarPestanas() {
    const barra = q('[data-e="pestExp"]');
    if (!barra) return;
    PESTANAS_EXP.forEach((x) => {
      const b = barra.querySelector('[data-pest="' + x.id + '"]');
      if (b) pintarBotonPestana(b, x.id);
    });
  }
  function pintarBotonPestana(b, id) {
    b.classList.toggle('act', EXP.pestana === id);
    const n = cuentaPestana(id);
    let badge = b.querySelector('.sj-badge');
    if (n == null) { if (badge) badge.remove(); return; }
    if (!badge) { badge = document.createElement('span'); badge.className = 'sj-badge'; b.appendChild(badge); }
    if (badge.textContent !== String(n)) badge.textContent = String(n);
  }

  function panelPestanaHTML(id, cuerpo) {
    return '<div class="sj-pest-panel' + (EXP.pestana === id ? ' act' : '') + '" data-pestp="' + id + '">' + cuerpo + '</div>';
  }

  // La cabecera del expediente: número, carátula, partes y los botones.
  function cabeceraExpHTML(d, k) {
    return '<div class="sj-sec"><div class="sj-exp-cab"><span class="n">' + esc(k || 'Expediente') + '</span>' +
      '<div class="c">' + esc(d.car) +
      '<div class="p" data-e="partesExp">' + partesExpHTML() + '</div>' +
      '<div class="d">' + esc([d.dep, d.sit].filter(Boolean).join(' · ')) + '</div></div></div>' +
      '<div class="sj-exp-bts"><button class="sj-b" data-a="volverLista">Volver a Mis causas</button>' +
      (botonPJN(PJN.botonExp.nota) ? '<button class="sj-b" data-a="notaPJN" title="Usa el botón del PJN, que pide confirmar">Dejar nota en esta causa</button>' : '') +
      (botonPJN(PJN.botonExp.escrito) ? '<button class="sj-b" data-a="escritoPJN">Presentar escrito</button>' : '') +
      '<button class="sj-b" data-a="recargar">Recargar la página</button></div>' +
      (k ? '<div class="sj-exp-bts"><button class="sj-b prim" data-a="cedulaUna" data-k="' + esc(k) + '" title="Abre Notificaciones en una pestaña nueva, con este expediente cargado">Dejar cédula</button>' +
        '<button class="sj-b prim" data-a="deoxUna" data-k="' + esc(k) + '" title="Abre DEOX en una pestaña nueva, con este expediente cargado, para iniciar un oficio">Nuevo DEOX</button>' +
        '<button class="sj-b" data-a="verEscr" data-k="' + esc(k) + '" title="Los escritos presentados en esta causa, de cualquier fecha">Escritos</button>' +
        '<button class="sj-b" data-a="verNotif" data-k="' + esc(k) + '" title="Las notificaciones electrónicas de esta causa, de cualquier fecha">Notificaciones</button>' +
        '<button class="sj-b" data-a="verDeox" data-k="' + esc(k) + '" title="Los oficios electrónicos de esta causa, de cualquier fecha">DEOX</button>' +
        (d.dep ? '<button class="sj-b" data-a="verGuia" data-k="' + esc(k) + '" title="Domicilio, teléfono e integrantes de la dependencia, según la Guía judicial">Juzgado en la Guía</button>' : '') +
        '</div>' : '') +
      '</div>';
  }

  // Los cinco paneles, uno por pestaña.
  function panelesExpHTML(k) {
    return panelPestanaHTML('act', '<div class="sj-sec"><div data-e="expEstado"></div><div data-e="expElegir"></div></div>') +
      panelPestanaHTML('notas', '<div class="sj-sec" data-e="notasExp">' + notasExpHTML() + '</div>') +
      panelPestanaHTML('int', solapaExpHTML('int')) +
      panelPestanaHTML('vinrec', solapaExpHTML('vin') + solapaExpHTML('rec')) +
      panelPestanaHTML('marcas', k ? '<div class="sj-sec" data-marca="' + esc(k) + '">' + editorMarcasHTML(k) + '</div>'
        : '<div class="sj-sec"><div class="sj-sol-txt">No se reconoce el número de esta causa: sin él no se pueden guardar etiquetas ni anotaciones.</div></div>');
  }

  function pintarExpediente() {
    const p = q('[data-e="vPanel"]');
    // Igual que en la lista: volver a dibujar el expediente no tiene por qué
    // devolver la pantalla al principio.
    const arriba = p ? p.scrollTop : 0;
    const foco = focoAnotacion();
    guardarNotaAbierta();
    const d = EXP.datos || (EXP.datos = datosExpediente(document));
    const k = d.exp;
    if (!pestanaValida(EXP.pestana)) EXP.pestana = 'act';
    // El punto de la lista de actuaciones también se conserva (1.7.0).
    const lst = q('[data-elegir="exp"] .lst');
    const arribaActs = lst ? lst.scrollTop : 0;
    p.innerHTML = cabeceraExpHTML(d, k) + barraPestanasHTML() + panelesExpHTML(k);
    pintarExpEstado();
    pintarElegir('exp');
    const lst2 = q('[data-elegir="exp"] .lst');
    if (lst2 && arribaActs) lst2.scrollTop = arribaActs;
    devolverFoco(foco);
    if (p && !retomarLugar('exp', p)) p.scrollTop = arriba;
  }

  // Cambia de pestaña sin redibujar los paneles, y pide al PJN lo que la
  // pestaña muestra si todavía no se leyó.
  function irAPestanaExp(id) {
    if (!pestanaValida(id)) return;
    guardarNotaAbierta();
    EXP.pestana = id;
    const p = q('[data-e="vPanel"]');
    if (p) p.querySelectorAll('[data-pestp]').forEach((x) => x.classList.toggle('act', x.dataset.pestp === id));
    pintarPestanas();
    if (id === 'act') encuadrarAlVuelo('act', q('[data-elegir="exp"] .lst'));
    if (id === 'int') abrirSolapaEnPestana('int');
    if (id === 'vinrec') leerVinculadosYRecursos();
  }

  function abrirSolapaEnPestana(solapa) {
    const s = EXP.solapas[solapa];
    s.abierta = true;
    if (s.estado === 'nada') return leerSolapa(solapa);
    pintarSolapaExp(solapa);
    return Promise.resolve();
  }

  // De a una, para no sumarle al PJN dos pedidos a la vez sobre la misma causa.
  // Dos clics seguidos en la pestaña no arrancan una segunda vuelta.
  let vueltaVinRec = null;
  function leerVinculadosYRecursos() {
    if (!vueltaVinRec) vueltaVinRec = leerVinYRecDeAUna().finally(() => { vueltaVinRec = null; });
    return vueltaVinRec;
  }
  async function leerVinYRecDeAUna() {
    await abrirSolapaEnPestana('vin');
    await abrirSolapaEnPestana('rec');
  }

  // ------------------------------------------------- notas dejadas en la causa
  //
  // Se leen de la propia página del expediente (ver PJN.notas): el PJN las
  // trae con la página, así que no hace falta pedir nada. Solo se ve lo que el
  // PJN muestra en su primera página, y se dice cuántas hay en total.

  function leerNotasPJN(doc) {
    const t = doc.querySelector(PJN.notas.tabla);
    if (!t || esNuestro(t)) return null;
    const caja = t.closest(PJN.notas.caja) || t.parentElement;
    const m = PJN.notas.total.exec(limpio(textoVisible(caja)));
    const filas = filasLeidas(t);
    return { cabs: cabezasDeTabla(t), filas, total: m ? parseInt(m[1], 10) : filas.length };
  }

  // Se lee una vez por página: el PJN la trae con el expediente.
  function notasDelPJN() {
    if (EXP.notasPJN === undefined) EXP.notasPJN = EN_EXPEDIENTE ? leerNotasPJN(document) : null;
    return EXP.notasPJN;
  }

  // "10:00 Hs, - 20111111112": la hora y el CUIT de quien dejó la nota.
  function datosDeNota(txt) {
    const t = limpio(txt);
    const h = /(\d{1,2}:\d{2})\s*hs/i.exec(t);
    const c = /(\d{11})/.exec(t.replace(/-(?=\d)/g, ''));
    return { hora: h ? h[1] : '', cuit: c ? c[1] : '' };
  }

  function filaNotaPJNHTML(f) {
    const dn = datosDeNota(f[2] || '');
    const propia = !!CUENTA && dn.cuit === CUENTA;
    return '<tr' + (propia ? ' class="propia"' : '') + '><td class="f">' + fechaPlacaHTML(f[0] || '') + '</td>' +
      '<td>' + esc(f[1] || '') + (propia ? ' <span class="sj-res ok" title="Nota dejada con esta cuenta">tu nota</span>' : '') + '</td>' +
      '<td>' + esc(f[2] || '') + '</td></tr>';
  }

  // Lo último que SuPJN+ anotó de dejar nota en esta causa, si anotó algo.
  function ultimaNotaSuPJNHTML(k) {
    const n = k ? NOTAS[k] : null;
    if (!n) return '';
    const r = resNota(n);
    return '<div class="sj-sol-txt">Último resultado de dejar nota desde SuPJN+: <span class="sj-res ' + r.c + '" title="' + esc(n.m || r.t) + '">' +
      r.t + ' ' + isoACorta(n.f) + '/' + n.f.slice(0, 4) + '</span></div>';
  }

  function notasExpHTML() {
    const k = EXP.datos && EXP.datos.exp;
    const n = notasDelPJN();
    const pie = ultimaNotaSuPJNHTML(k);
    if (!n) return '<div class="sj-sol-txt">El PJN no muestra notas en esta página.</div>' + pie;
    if (!n.filas.length) return '<div class="sj-sol-txt">El PJN no registra notas dejadas en esta causa.</div>' + pie;
    // Los rótulos del PJN, escritos con sus tildes.
    const cabs = ['Fecha', 'Interviniente', 'Descripción / detalle'];
    return recuadroSolapaHTML('<table class="sj-t sj-fija sj-notas-pjn"><thead><tr>' + cabs.map((c) => '<th>' + esc(c) + '</th>').join('') +
      '</tr></thead><tbody>' + n.filas.map(filaNotaPJNHTML).join('') + '</tbody></table>') +
      '<div class="sj-sol-txt">' + esc(textoTotalNotas(n)) + '</div>' + pie;
  }

  function textoTotalNotas(n) {
    if (n.total <= n.filas.length) return 'Según el PJN, ' + plural(n.total, 'nota dejada', 'notas dejadas') + ' en esta causa.';
    return 'Se ven las ' + n.filas.length + ' más recientes: el PJN informa ' + plural(n.total, 'nota', 'notas') +
      ' en total, y las demás solo se ven en la página del PJN.';
  }

  const TITULO_SOLAPA = { int: 'Intervinientes', vin: 'Causas vinculadas', rec: 'Recursos' };
  const AYUDA_SOLAPA = {
    int: 'Todas las partes y quienes intervienen, con los peritos y los fiscales, tal como los lista el PJN. La fiscalía y la defensoría oficial llevan a sus datos de contacto.',
    vin: 'Las causas vinculadas a esta. Se abren y se descargan como cualquier otra.',
    rec: 'Los recursos de esta causa, con su tipo y su estado.'
  };

  // Cuántas filas leídas tiene la solapa, contando peritos y fiscales.
  const cuentaSolapa = (s) => s.filas.length + (s.grupos || []).reduce((n, g) => n + g.filas.length, 0);
  // Desde la 1.7.0 cada solapa del PJN va en una pestaña del expediente. En
  // la de Causas Vinculadas y Recursos van las dos, cada una con su título;
  // Intervinientes no lleva título, porque lo dice la pestaña.
  const rotuloSolapaHTML = (solapa, s) => esc(TITULO_SOLAPA[solapa]) +
    (s.estado === 'listo' ? '<span class="sj-badge">' + cuentaSolapa(s) + '</span>' : '');

  function solapaExpHTML(solapa) {
    return '<div class="sj-sec sj-solapa-exp" data-solapa="' + solapa + '">' +
      (solapa === 'int' ? '' : '<h4 data-e="tit-' + solapa + '">' + rotuloSolapaHTML(solapa, EXP.solapas[solapa]) + '</h4>') +
      '<div data-e="solapa-' + solapa + '">' + cuerpoSolapaHTML(solapa) + '</div></div>';
  }

  // Una tabla de la solapa. celda(v, i, n) arma el contenido de la columna i
  // de la fila n; acciones(f), si está, agrega la columna de botones.
  function tablaSolapaHTML(cabs, filas, celda, acciones) {
    return '<table class="sj-t sj-fija"><thead><tr>' +
      cabs.map((c) => '<th>' + esc(c) + '</th>').join('') + (acciones ? '<th></th>' : '') + '</tr></thead><tbody>' +
      filas.map((f, n) => '<tr>' + f.map((v, i) => '<td' + (i === 0 ? ' class="sj-exp"' : '') + '>' + celda(v, i, n) + '</td>').join('') +
        (acciones ? acciones(f) : '') + '</tr>').join('') + '</tbody></table>';
  }

  const accionesVinculadaHTML = (f) => '<td class="acc"><div class="sj-acc"><button class="sj-abrir" data-a="abrirVinc" data-k="' + esc(f[0]) + '" title="Abrir esta causa vinculada en esta pestaña">Abrir</button>' +
    '<button class="sj-mas" data-a="abrirVincNueva" data-k="' + esc(f[0]) + '" title="Abrirla en una pestaña nueva">↗</button>' +
    '<button class="sj-mas" data-a="bajarVinc" data-k="' + esc(f[0]) + '" title="Descargar el expediente completo de esta causa vinculada">⇩</button>' +
    '<button class="sj-mas" data-a="cedulaUna" data-k="' + esc(f[0]) + '" title="Dejar cédula en esta causa vinculada (Notificaciones, pestaña nueva)">✉</button></div></td>';

  const celdaSimple = (v) => esc(v);

  // El nombre de una fiscalía, de un fiscal, de una defensoría o de un
  // defensor oficial: al tocarlo se abren sus datos en la solapa Guía de una
  // pestaña nueva (1.5.3).
  function enlaceMPHTML(v, gi, n, p) {
    const t = p.modo === 'fis' ? 'Dirección, teléfono y correo de la fiscalía, según el Ministerio Público Fiscal (se abre en una pestaña nueva)'
      : 'Dirección, teléfono y correo de la defensoría, según el Ministerio Público de la Defensa (se abre en una pestaña nueva)';
    return '<button class="sj-vinculo" data-a="mpInterv" data-g="' + esc(String(gi)) + '" data-f="' + n + '" title="' + esc(t) + '">' + esc(v) + '</button>';
  }

  function celdaParteHTML(v, i, n, col) {
    if (!v || !col || i !== col.iNom) return esc(v);
    const p = pedidoInterviniente('p', n);
    return p ? enlaceMPHTML(v, 'p', n, p) : esc(v);
  }

  function celdaGrupoHTML(v, i, n, gi) {
    const g = EXP.solapas.int.grupos[gi];
    if (!v || !esGrupoFiscales(g) || !/fiscal/i.test(g.cabs[i] || '')) return esc(v);
    const p = pedidoInterviniente(gi, n);
    return p ? enlaceMPHTML(v, gi, n, p) : esc(v);
  }

  const recuadroSolapaHTML = (tabla) => '<div class="lst-sol">' + tabla + '</div>';

  // Intervinientes: las partes y, debajo, cada una de las otras tablas con su
  // título, como en el PJN. Sin otras tablas, las partes van sin título. Cada
  // tabla va en su propio recuadro: en uno solo, con muchas partes, los
  // fiscales quedaban fuera de la vista.
  function tablasIntervinientesHTML(s) {
    const grupos = s.grupos || [];
    const col = columnasPartes(s.cabs);
    let h = '';
    if (s.filas.length) {
      h += (grupos.length ? '<div class="sj-sol-tit">Partes</div>' : '') +
        recuadroSolapaHTML(tablaSolapaHTML(s.cabs, s.filas, (v, i, n) => celdaParteHTML(v, i, n, col)));
    }
    grupos.forEach((g, gi) => {
      h += '<div class="sj-sol-tit">' + esc(g.titulo) + '</div>' +
        recuadroSolapaHTML(tablaSolapaHTML(g.cabs, g.filas, (v, i, n) => celdaGrupoHTML(v, i, n, gi)));
    });
    return h;
  }

  function cuerpoSolapaHTML(solapa) {
    const s = EXP.solapas[solapa];
    if (s.estado === 'leyendo') return '<div class="sj-sol-txt">' + esc(s.texto || 'Consultando al PJN...') + '</div><div class="sj-prog"><i style="width:35%"></i></div>';
    if (s.estado === 'error') return '<div class="sj-sol-txt mal">' + esc(s.texto) + '</div><div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + solapa + '" data-otra="1">Probar de nuevo</button></div>';
    if (s.estado !== 'listo') return '<div class="sj-sol-txt">' + esc(AYUDA_SOLAPA[solapa]) + '</div>';
    if (!cuentaSolapa(s)) {
      return s.completa === false
        ? '<div class="sj-sol-txt mal">' + esc('El PJN no llegó a llenar ' + TITULO_SOLAPA[solapa] + ': no se puede saber si tiene contenido. Probá "Volver a leer".') + '</div>' +
          '<div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + solapa + '" data-otra="1">Volver a leer</button></div>'
        : '<div class="sj-sol-txt">' + esc('El PJN no tiene nada en ' + TITULO_SOLAPA[solapa] + ' para esta causa.') + '</div>';
    }
    const tablas = solapa === 'int' ? tablasIntervinientesHTML(s)
      : recuadroSolapaHTML(tablaSolapaHTML(s.cabs, s.filas, celdaSimple, solapa === 'vin' ? accionesVinculadaHTML : null));
    return tablas +
      '<div class="sj-sol-txt' + (s.completa === false ? ' mal' : '') + '">' +
      esc(s.completa === false
        ? 'El PJN dejó de contestar mientras se pasaban las páginas: esto es lo que se alcanzó a leer y puede faltar. Probá "Volver a leer".'
        : 'Leído ' + hace(s.fecha || Date.now()) + '.') +
      '</div><div class="bts"><button class="sj-b chico" data-a="verSolapa" data-sol="' + solapa + '" data-otra="1">Volver a leer</button></div>';
  }

  function pintarSolapaExp(solapa) {
    const cont = q('[data-e="solapa-' + solapa + '"]');
    const s = EXP.solapas[solapa];
    if (cont) cont.innerHTML = cuerpoSolapaHTML(solapa);
    const t = q('[data-e="tit-' + solapa + '"]');
    if (t) t.innerHTML = rotuloSolapaHTML(solapa, s);
    pintarPestanas();
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
    if (EXP.estado === 'listo' && EXP.incompleta) h += '<button class="sj-b chico" data-a="leerTodoExp" style="margin-top:6px" title="Volver a leer las actuaciones, pidiendo también la página que el PJN no contestó">Leer todo</button>';
    if (t) {
      h += '<div style="margin-top:6px;font-size:12.5px;color:' + (t.estado === 'error' ? '#b3261e' : t.estado === 'listo' ? '#1b6b3a' : '#3a4c54') + '">' + esc(t.texto) + '</div>';
      if (/descargando/.test(t.estado)) h += '<div class="sj-prog"><i style="width:' + Math.round((t.frac || 0) * 100) + '%"></i></div>';
      if (/descargando|a descargar/.test(t.estado)) h += '<button class="sj-b peligro chico" data-a="cortarCola" style="margin-top:6px">Cancelar</button>';
    }
    e.innerHTML = h;
  }

  // -------------------------------------------------- 6.9 elegir actuaciones

  const ctxElegir = (id) => (id === 'exp' ? EXP : COLA.find((t) => t.id === id));

  // Si una actuación o un movimiento pasa el filtro de texto y de fechas.
  function pasaFiltroAct(ctx, a) {
    const t = norm(ctx.filtro.texto);
    const d = numDeInput(ctx.filtro.desde), h = numDeInput(ctx.filtro.hasta);
    // Se busca en lo que se ve: la oficina no es una columna.
    if (t && norm([a.fecha, a.tipo, a.detalle, a.fojas].join(' ')).indexOf(t) < 0) return false;
    if (d || h) {
      const f = numFecha(a.fecha);
      if (!f || (d && f < d) || (h && f > h)) return false;
    }
    return true;
  }

  function comparaPorColumna(o) {
    return (a, b) => {
      const x = valorOrdenAct(a, o.col), y = valorOrdenAct(b, o.col);
      return (x < y ? -1 : x > y ? 1 : 0) * (o.desc ? -1 : 1);
    };
  }

  function actsFiltradas(ctx) {
    const out = [];
    ctx.acts.forEach((a, i) => { if (pasaFiltroAct(ctx, a)) out.push(i); });
    // Sin orden elegido quedan como las trae el PJN, que es como se arma el PDF.
    const o = CFG.ordenAct || { col: '' };
    if (o.col) {
      const cmp = comparaPorColumna(o);
      out.sort((i, j) => cmp(ctx.acts[i], ctx.acts[j]));
    }
    return out;
  }

  const movsDe = (ctx) => (Array.isArray(ctx.movs) ? ctx.movs : []);

  // Las filas que se dibujan: las actuaciones que se ven (V) y los movimientos
  // que pasan el filtro, intercalados. Sin orden por columna, en el orden de la
  // tabla del PJN (pos); con orden por columna, por esa columna.
  function renglonesElegir(ctx, V) {
    const acts = V.map((i) => ({ a: ctx.acts[i], i }));
    const movs = movsDe(ctx).filter((m) => pasaFiltroAct(ctx, m)).map((m) => ({ a: m, mov: true }));
    if (!movs.length) return acts;
    const o = CFG.ordenAct || { col: '' };
    const todas = acts.concat(movs);
    const pos = (r) => (typeof r.a.pos === 'number' ? r.a.pos : Infinity);
    if (o.col) {
      const cmp = comparaPorColumna(o);
      return todas.sort((x, y) => cmp(x.a, y.a) || pos(x) - pos(y));
    }
    // Una actuación sin lugar guardado (leída con una versión anterior) deja los
    // movimientos al final, en vez de mezclarlos a ciegas.
    if (acts.some((r) => typeof r.a.pos !== 'number')) return todas;
    return todas.sort((x, y) => pos(x) - pos(y));
  }

  // "12 actuaciones con PDF (3 históricas) y 4 movimientos sin documento".
  function textoActuacionesLeidas(r) {
    const acts = r.actuaciones || [], movs = r.movimientos || [];
    const hist = acts.filter((x) => x.hist).length;
    return plural(acts.length, 'actuación con PDF', 'actuaciones con PDF') + (hist ? ' (' + hist + ' históricas)' : '') +
      (movs.length ? ' y ' + plural(movs.length, 'movimiento sin documento', 'movimientos sin documento') : '');
  }

  // Cuadrito con letra del tipo de actuación (1.4.1). El tipo lo trae el PJN
  // en la tabla del expediente ("DESPACHO", "ESCRITO", "CEDULA ELECTRONICA",
  // "DEOX", "SENTENCIA"...). La letra y el color salen de la palabra clave; un
  // tipo que no está en la lista lleva su inicial en gris. El texto del tipo
  // sigue al lado del cuadrito, así el filtro por texto no cambia.
  function letraTipoActuacion(tipo) {
    const t = norm(tipo || '');
    if (!t) return null;
    if (/^despacho/.test(t)) return { letra: 'D', color: 'azul', que: 'Despacho' };
    if (/^escrito/.test(t)) return { letra: 'E', color: 'verde', que: 'Escrito' };
    if (/cedula/.test(t)) return { letra: 'C', color: 'rojo', que: 'Cédula' };
    if (/\bdeox?\b/.test(t)) return { letra: 'O', color: 'violeta', que: 'Oficio electrónico (DEO/DEOX)' };
    if (/sentencia|resoluci/.test(t)) return { letra: 'S', color: 'ambar', que: 'Sentencia o resolución' };
    if (/^movimiento/.test(t)) return { letra: 'M', color: 'gris', que: 'Movimiento del PJN, sin documento' };
    return { letra: t.charAt(0).toUpperCase(), color: 'gris', que: '' };
  }
  function cuadritoTipoHTML(tipo) {
    const l = letraTipoActuacion(tipo);
    if (!l) return '';
    // Después del cuadrito va un espacio de verdad: al copiar la celda queda "D DESPACHO".
    return '<span class="sj-tipo ' + esc(l.color) + '" data-letra="' + esc(l.letra) + '" title="' + esc(l.que || tipo) + '">' + esc(l.letra) + '</span>';
  }

  function celdaAct(a, k, exp) {
    if (k === 'tipo') return cuadritoTipoHTML(a.tipo) + ' ' + esc(a.tipo) + (a.hist ? ' <span class="sj-badge">histórica</span>' : '');
    if (k === 'marcas') return celdaMarcasActHTML(exp, a);
    if (k === 'fecha') return fechaPlacaHTML(a.fecha);
    return esc(a[k]);
  }

  // ------------------------------- etiquetas y anotaciones de cada actuación
  //
  // (1.7.0) Cada actuación y cada movimiento lleva, en su columna, sus
  // etiquetas y el comienzo de su anotación. Al tocar la celda se abre debajo
  // de la fila el mismo cuadro que tienen las causas.

  const tituloMarcasAct = (k) => String(marcaDe(k).nota || '').trim() || 'Poner etiquetas o escribir una anotación sobre esta actuación';
  function contenidoMarcasActHTML(k) {
    const nota = String(marcaDe(k).nota || '').trim();
    const chips = chipsDe(k);
    return chips || nota ? chips + (nota ? '<span class="sj-nota-txt">' + esc(nota) + '</span>' : '') : '<span class="sj-poner">+ etiqueta o anotación</span>';
  }
  function celdaMarcasActHTML(exp, a) {
    if (!exp) return '';
    const k = claveAct(exp, a);
    return '<div class="sj-toque" data-actm="' + esc(k) + '" title="' + esc(tituloMarcasAct(k)) + '">' + contenidoMarcasActHTML(k) + '</div>';
  }

  // El cuadro de la actuación abierta, en una fila debajo de la suya.
  function filaEditorActHTML(exp, a, colspan) {
    const k = claveAct(exp, a);
    return '<tr class="sj-det sj-act-ed"><td colspan="' + colspan + '"><div class="sj-det-in" data-marca="' + esc(k) + '">' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b class="sj-exp">' + esc(a.fecha) + '</b>' +
      '<span style="color:#5a7581">' + esc([a.tipo, a.detalle].filter(Boolean).join(' · ')) + '</span>' +
      '<button class="sj-b chico" data-a="cerrarActM" style="margin-left:auto">Cerrar</button></div>' +
      editorMarcasHTML(k, 'actuación') + '</div></td></tr>';
  }

  // Si la fila de esta actuación tiene el cuadro abierto, lo agrega.
  function conEditorAct(ctx, a, html, colspan) {
    const exp = ctx === EXP && EXP.datos ? EXP.datos.exp : '';
    return exp && EXP.actAbierta === claveAct(exp, a) ? html + filaEditorActHTML(exp, a, colspan) : html;
  }

  // Redibuja solo la celda de una actuación, sin tocar el cuadro abierto.
  // Se cambia el contenido de la celda y no la celda: si el clic que sacó el
  // foco del cuadro fue sobre esta misma celda, tiene que seguir encontrándola.
  function pintarCeldaMarcasAct(k) {
    if (!win || !esClaveAct(k)) return;
    win.querySelectorAll('[data-actm]').forEach((celda) => {
      if (celda.dataset.actm !== k) return;
      celda.innerHTML = contenidoMarcasActHTML(k);
      celda.title = tituloMarcasAct(k);
    });
  }

  const claseAct = (k) => (k === 'fecha' || k === 'fojas' ? 'f' : k === 'tipo' ? 't' : '');

  // Botón para volver al orden del PJN (1.4.2). Aparece solo cuando hay un
  // orden por columna puesto, así se ve de un golpe que la lista no está en el
  // orden del sitio. La acción (ordenPJN) ya existía, pero ningún botón la usaba.
  function botonOrdenPJNHTML() {
    const o = CFG.ordenAct || { col: '' };
    if (!o.col) return '';
    const col = (COLS_ACT_DEF.find((c) => c.k === o.col) || { t: o.col }).t;
    return '<button class="sj-b chico prim" data-ea="ordenPJN" title="' + esc('Ahora están ordenadas por ' + col + '. Volver al orden en que las entrega el PJN: de la más nueva a la más vieja, que es el del PDF.') + '">' +
      icono('\u21C5') + 'Orden del PJN</button>';
  }

  function cuentaElegir(ctx, visibles) {
    const m = movsDe(ctx).length;
    return ctx.elegidas.size + ' de ' + ctx.acts.length + ' elegidas' + (visibles !== ctx.acts.length ? ' · se ven ' + visibles : '') +
      (m ? ' · ' + plural(m, 'movimiento', 'movimientos') : '');
  }

  // Fila de una actuación con PDF: se elige y se descarga.
  function filaActElegir(ctx, a, i, cols) {
    const exp = ctx === EXP && EXP.datos ? EXP.datos.exp : '';
    return conEditorAct(ctx, a, '<tr><td class="cs"><input type="checkbox" data-ei="' + i + '"' + (ctx.elegidas.has(i) ? ' checked' : '') + '></td>' +
      cols.map((k) => '<td class="' + claseAct(k) + '">' + celdaAct(a, k, exp) + '</td>').join('') +
      '<td class="acc">' +
      '<button class="sj-b chico" data-ea="bajarUna" data-i="' + i + '" title="Descargar solo esta actuación en un PDF">Descargar</button>' +
      (a.ver ? '<a class="sj-b chico" href="' + esc(a.ver) + '" target="_blank" rel="noopener" title="Abrir esta actuación en el visor del PJN, en una pestaña nueva">Ver</a>' : '') +
      '</td></tr>', cols.length + 2);
  }

  // Fila de un movimiento sin documento (1.4.4): se ve, pero no se elige ni se descarga.
  function filaMovElegir(ctx, a, cols) {
    const exp = ctx === EXP && EXP.datos ? EXP.datos.exp : '';
    return conEditorAct(ctx, a, '<tr class="mov"><td class="cs"></td>' +
      cols.map((k) => '<td class="' + claseAct(k) + '">' + celdaAct(a, k, exp) + '</td>').join('') +
      '<td class="acc"><span class="sindoc" title="Movimiento del PJN: no tiene documento para ver ni para descargar">sin documento</span></td></tr>', cols.length + 2);
  }

  // La columna de etiquetas y anotaciones va solo en el expediente abierto.
  const columnasDeElegir = (id) => columnasVisibles('act').filter((k) => id === 'exp' || !(COLS_ACT_DEF.find((c) => c.k === k) || {}).soloExp);

  function elegirHTML(id) {
    const ctx = ctxElegir(id);
    if (!ctx || !ctx.acts) return '';
    const V = actsFiltradas(ctx);
    const n = ctx.elegidas.size;
    const cols = columnasDeElegir(id);
    const todasV = V.length > 0 && V.every((i) => ctx.elegidas.has(i));
    // La columna de acciones tiene ancho fijo: tiene que entrar el botón más
    // largo de los dos, más la separación y el relleno de la celda.
    const ANCHO_SEL = 30, ANCHO_VER = 136;
    const enc = anchosEncuadrados('act', cols, ANCHO_SEL + ANCHO_VER, anchoUtil(q('[data-elegir="' + id + '"] .lst')));
    const filas = renglonesElegir(ctx, V).map((r) => (r.mov ? filaMovElegir(ctx, r.a, cols) : filaActElegir(ctx, r.a, r.i, cols))).join('');
    const hayAlgo = ctx.acts.length || movsDe(ctx).length;
    return '<div class="sj-elegir" data-elegir="' + esc(id) + '">' +
      '<div class="fil"><input type="text" data-ef="texto" placeholder="Filtrar por fecha, tipo o detalle" value="' + esc(ctx.filtro.texto) + '">' +
      '<label>Desde ' + campoFecha('data-ef="desde"', ctx.filtro.desde) + '</label>' +
      '<label>hasta ' + campoFecha('data-ef="hasta"', ctx.filtro.hasta) + '</label>' +
      '<button class="sj-b chico" data-ea="todas" title="Elegir las que se ven">Todas</button>' +
      '<button class="sj-b chico" data-ea="ninguna" title="Quitar las que se ven">Ninguna</button>' +
      '<button class="sj-b chico" data-ea="invertir" title="Invertir las que se ven">Invertir</button>' +
      '<button class="sj-b chico" data-a="menuColsAct" data-id="' + esc(id) + '" title="Elegir qué columnas se ven">Columnas ▾</button>' +
      botonOrdenPJNHTML() +

      '<span class="cnt" data-e="cnt">' + esc(cuentaElegir(ctx, V.length)) + '</span></div>' +
      '<div class="lst"><table class="sj-t" style="' + estiloTabla(enc.total) + '">' +
      grupoColumnas('act', cols, ANCHO_SEL, ANCHO_VER, enc.anchos) +
      '<thead><tr><th class="cs fija"><input type="checkbox" data-ea="todasCb" title="Elegir o quitar ' + lasN(V.length, 'actuación que se ve', 'actuaciones que se ven') + '"' + (todasV ? ' checked' : '') + '></th>' +
      cabeceraHTML('act', cols) + '<th class="fija"></th></tr></thead><tbody>' +
      (filas || '<tr><td colspan="' + (cols.length + 2) + '" class="sj-vacio">' + (hayAlgo ? 'Ninguna actuación coincide con el filtro.' : 'No hay actuaciones con PDF.') + '</td></tr>') + '</tbody></table></div>' +
      '<div class="pie"><button class="sj-b prim" data-ea="bajarElegidas"' + (n ? '' : ' disabled') + '>Descargar las elegidas (' + n + ')</button>' +
      '<button class="sj-b" data-ea="bajarTodo"' + (ctx.acts.length ? '' : ' disabled') + '>Descargar todo en 1 PDF</button>' +
      (id === 'exp' ? '<button class="sj-b" data-ea="releer">Volver a leer</button>' : '<button class="sj-b" data-ea="descartar" title="Quitar esta causa de Descargas sin descargar nada">Quitar de Descargas</button>') +
      '</div></div>';
  }

  function pintarElegir(id) {
    if (id === 'exp') {
      const e = q('[data-e="expElegir"]');
      // (1.7.0) Al redibujar se conserva el punto de la lista: el cuadro de
      // una actuación se abre y se cierra sin volver al principio.
      // Lo escrito en el cuadro de una actuación se guarda antes y el foco
      // vuelve a su lugar después, como en la lista de causas.
      const foco = focoAnotacion();
      guardarNotaAbierta();
      const lst = q('[data-elegir="exp"] .lst');
      const arriba = lst ? lst.scrollTop : 0;
      if (e) e.innerHTML = EXP.acts ? elegirHTML('exp') : '';
      const lst2 = q('[data-elegir="exp"] .lst');
      if (lst2 && arriba) lst2.scrollTop = arriba;
      devolverFoco(foco);
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

  const textoPausa = () => 'Pausa entre bloques: de a ' + BLOQUE_DESCARGAS + ' causas por vez, para no saturar al PJN. Se reanuda en ' +
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
          'En otra PC hay que ponerla una vez, para importar el archivo o para leer la carpeta.</p>' +
          '<div class="bts"><button class="sj-b" data-a="verContra">Ver o cambiar la contraseña</button></div>'
        : '<p style="color:#8a5a00">Todavía no pusiste contraseña, así que no se puede exportar ni guardar en la carpeta. ' +
          'Poné una y anotala donde guardes tus claves: sin ella, el archivo no se abre en ninguna parte, ' +
          'tampoco acá si perdés esta PC.</p>') +
      (puesta && mostrarContra
        ? '<div class="sj-nueva" style="margin-top:8px"><input type="text" class="sj-contra" value="' + esc(leerContra()) + '" maxlength="120">' +
          '<button class="sj-b prim" data-a="guardarContra">Guardar</button>' +
          '<button class="sj-b" data-a="ocultarContra">Cerrar</button></div>'
        : puesta ? ''
          : '<div class="sj-nueva"><input type="text" class="sj-contra" placeholder="Escribí una contraseña para tus copias" maxlength="120">' +
            '<button class="sj-b prim" data-a="guardarContra">Guardar contraseña</button></div>');
  }

  function panelMarcasHTML() {
    const et = MARCAS.etiquetas;
    const marcadas = clavesDeCausas().length;
    const actsMarcadas = clavesDeActs().length;
    const d = RESPALDO && RESPALDO.fecha ? diasDesde(RESPALDO.fecha) : null;
    return '<div class="sj-panel-in">' +
      '<h2>Respaldo, etiquetas y anotaciones</h2>' +
      '<p>Las etiquetas y las anotaciones son datos propios, no del PJN: quedan en el almacén de Tampermonkey de esta PC y no se escriben en ningún expediente. Hoy hay <b>' +
      plural(et.length, 'etiqueta', 'etiquetas') + '</b> y <b>' + plural(marcadas, 'causa marcada', 'causas marcadas') + '</b>' +
      (actsMarcadas ? ', además de <b>' + plural(actsMarcadas, 'actuación marcada', 'actuaciones marcadas') + '</b>' : '') + '.</p>' +
      '<h3>Carpeta de respaldo</h3>' +
      '<p>' + (carpetaEstado === 'lista'
      ? 'Se guarda automáticamente en <b>' + esc(carpetaTexto) + '</b>: cada cambio se escribe ahí, cifrado con la contraseña de tus copias, y al abrir SuPJN+ se lee lo que haya (sirve para trabajar en dos PC con la carpeta sincronizada; en la otra PC tiene que estar puesta la misma contraseña).'
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
              ? 'No se pudo usar la carpeta elegida' + (carpetaAviso ? ' (' + esc(carpetaAviso) + ')' : '') + '. Probá elegirla de nuevo.'
              : 'Elegí la carpeta donde se guarda el respaldo automático. Conviene que esté en la nube, por ejemplo OneDrive, para leerlo desde otra PC, y fuera de cualquier carpeta que se suba a GitHub.') + '</p>' +
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
      '<div class="bts"><button class="sj-b prim" data-a="exportar">Exportar etiquetas, anotaciones y registro de notas</button>' +
      '<button class="sj-b" data-a="importar">Importar desde un archivo</button></div>' +
      '<p style="color:#6b7c85;font-size:12px">La copia lleva las etiquetas, las anotaciones y el registro de dejar nota de cada causa. La importación suma las etiquetas que falten y de cada causa deja lo más nuevo (la anotación más nueva si las dos copias tienen fecha, y los dos textos si alguna viene de una copia vieja, sin fecha), más el resultado de nota más nuevo.</p>' +
      contraHTML() +
      '<h3>Etiquetas</h3>' +
      (et.length
        ? '<table class="lista">' + et.map((e) => '<tr><td><span class="sj-chip" style="' + estiloChip(e.color) + '">' + esc(e.nom) + '</span></td>' +
          '<td style="color:#6b7c85">' + plural(usoDe(e.id), 'causa', 'causas') + (usoEnActsDe(e.id) ? ' · ' + plural(usoEnActsDe(e.id), 'actuación', 'actuaciones') : '') + '</td>' +
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
    if (cambios) partes.push('Hay ' + plural(cambios, 'elemento que cambió', 'elementos que cambiaron') + '. Copiá el informe y envialo a quien mantiene SuPJN+: no incluye números de causa ni datos propios.');
    else if (!aviso) partes.push(sinProbar
      ? 'No se encontraron cambios en lo que se pudo probar (' + plural(sinProbar, 'elemento quedó', 'elementos quedaron') + ' sin probar).'
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
      if (f.http) det.push('Código HTTP ' + f.http);
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
      let fue;
      try { fue = document.execCommand('copy'); } catch (x) { fue = false; }
      if (fue) listo(); else avisar('Seleccioná el texto y copialo con Ctrl+C.');
    };
    try { window.navigator.clipboard.writeText(t.value).then(listo, aMano); } catch (x) { aMano(); }
  }

  function panelAcercaHTML() {
    return '<div class="sj-panel-in">' +
      '<h2>SuPJN+ <span style="font-size:12px;color:#6b7c85;font-weight:400">' + esc(APP.version) + '</span></h2>' +
      '<p>Una sola ventana sobre la Consulta Web del PJN. Se abre sola, ocupando toda la pantalla, y lee las causas en segundo plano. Minimizada queda como indicador abajo a la derecha. Se mueve arrastrando la barra azul, se agranda desde la esquina de abajo a la derecha, y tiene zoom, minimizar, maximizar y cerrar.</p>' +
      '<h3>Qué hace</h3>' +
      '<p><b>Mis causas y Favoritos:</b> lee las dos listas del PJN, en trámite y fuera de trámite, en segundo plano y sin mover la página que estás viendo. Se busca, se filtra, se ordena por cualquier columna y las columnas se mueven, se ensanchan y se ocultan. Lo mismo vale para las actuaciones del expediente: fecha, tipo de actuación, descripción y fojas son columnas, y se ordenan y se mueven igual.</p>' +
      '<p><b>Encuadre y zoom:</b> de manera predeterminada la tabla entra siempre en el ancho de la ventana, de modo que el ancho que gana una columna lo pierden las otras; el encuadre se desactiva desde <b>Columnas</b>. El zoom de la barra de título agranda lo de adentro sin mover la ventana.</p>' +
      '<p><b>Dejar nota:</b> tiene su propia solapa. En todas las causas que el PJN habilite o solo en las seleccionadas. Al entrar a la solapa informa cuáles entran y cuáles ya tienen nota del día; el botón inicia el lote, y el resultado de cada causa queda en la columna Nota.</p>' +
      '<p><b>Descargar:</b> desde la lista, el expediente completo de las causas seleccionadas o las actuaciones que elijas de una causa; desde el expediente, todo o las actuaciones elegidas. Cada causa sale en un PDF.</p>' +
      '<p><b>Escritos, Notificaciones y DEOX:</b> cada uno tiene su solapa, con la bandeja, las fechas, un buscador y el PDF de cada elemento para verlo o descargarlo. Desde el menú ⋯ de una causa, o con los botones del expediente abierto, se ven solo los de esa causa, de cualquier fecha. SuPJN+ abre esas aplicaciones del PJN en segundo plano, con tu misma sesión, y comprueba que sean de la misma cuenta que la Consulta Web; si no lo son, no muestra nada. Lo consultado no se guarda en la PC. En DEOX, un oficio respondido lleva a su respuesta: SuPJN+ la busca en las actuaciones de la causa y la abre en una pestaña nueva.</p>' +
      '<p><b>Dejar cédula:</b> desde el menú ⋯ de una causa, el expediente abierto, la solapa Notificaciones, cada fila de Escritos, Notificaciones y DEOX, o Funciones del PJN. Abre el formulario de Notificaciones del PJN en una pestaña nueva, carga la jurisdicción, el número y el año, y elige el expediente o el incidente exacto. Los destinatarios, los despachos, el texto y el envío se hacen en el formulario del PJN: SuPJN+ no envía cédulas. Si el PJN no ofrece la causa (solo ofrece aquellas en las que constituiste domicilio electrónico), lo avisa.</p>' +
      '<p><b>Guía judicial:</b> el índice de la Guía del PJN para recorrer por niveles, y una búsqueda por dependencia o por magistrado o funcionario. Muestra domicilio, teléfono, correo e integrantes, y copia esos datos con un botón. Desde una causa, o pulsando la dependencia en Escritos, Notificaciones o DEOX, abre directamente el juzgado que corresponde, con la secretaría o la sala resaltada; si hay más de uno posible, los muestra para elegir.</p>' +
      '<p><b>Funciones del PJN:</b> el menú de la barra azul lleva, en una pestaña nueva, a las listas del PJN, a Radicaciones, a la consulta pública, a los datos personales y a las otras aplicaciones: Escritos, DEOX, Notificaciones, IWECS, Autorizados y Mis eventos del Portal. Por causa: abrir en esta pestaña o en una nueva, libro digital y presentar escrito.</p>' +
      '<h3>¿Algo dejó de funcionar?</h3>' +
      '<p>SuPJN+ depende de cómo está hecha la página del PJN. Si el PJN la cambia, algo puede dejar de funcionar. Este botón revisa, una por una y sin dejar notas ni cambiar nada, las piezas que SuPJN+ necesita (la tabla de causas, el paginador, el enlace para abrir, la función de dejar nota, Escritos, Notificaciones, DEOX, la Guía, la tabla de actuaciones y un PDF) y dice cuáles cambiaron.</p>' +
      '<div class="bts"><button class="sj-b prim" data-a="diagnostico"' + (DIAG.estado === 'corriendo' ? ' disabled' : '') + '>' + (DIAG.estado === 'corriendo' ? 'Revisando...' : 'Revisar el PJN') + '</button></div>' +
      '<div data-e="diag">' + diagHTML() + '</div>' +
      '<h3>Registro de fallas de descarga</h3>' +
      '<p>Cuando una descarga no se completa, SuPJN+ anota las circunstancias: de qué expediente y de qué actuación se trata, qué respondió el servidor del PJN y cuántos intentos hicieron falta. Sirve para distinguir una actuación sin documento, que es normal, de un problema del PJN o de la conexión.</p>' +
      '<div data-e="fallas">' + fallasHTML() + '</div>' +
      '<h3>Qué no hace</h3>' +
      '<p>No deja notas sin que lo pidas, no presenta escritos, no cambia favoritos y no sube nada. En Escritos, Notificaciones y DEOX solo lee: no presenta, no archiva ni borra nada. Las anotaciones son privadas y de trabajo, y no se escriben en el expediente: se llaman así para distinguirlas de dejar nota, que es el acto procesal.</p>' +
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
    } else if (VISTA === 'cp') {
      pintarCP();
    }
    pintarPastilla();
  }

  // Guarda lo que se escribió en un cuadro de anotación abierto y no se guardó.
  // Solo si el usuario lo cambió (defaultValue es lo que tenía al dibujarse):
  // hasta la 1.6.0 se escribía cualquier diferencia con lo guardado, de modo
  // que Borrar volvía a poner el texto que seguía en el cuadro, y un cuadro
  // abierto pisaba lo que acababa de llegar de otra PC.
  function guardarNotaAbierta() {
    if (!win) return;
    win.querySelectorAll('[data-marca] .sj-nota').forEach((t) => {
      const k = t.closest('[data-marca]').dataset.marca;
      if (t.value !== t.defaultValue && t.value !== (marcaDe(k).nota || '')) fijarMarca(k, { nota: t.value });
      t.defaultValue = t.value;
    });
  }

  function irAVista(v) {
    guardarNotaAbierta();
    cerrarMenu();
    // Antes de cambiar de solapa se anota dónde quedaba esta.
    guardarLugar();
    if (v !== 'nota') notaElegida = null;
    VISTA = v;
    irALista(v);
    if (v === 'rel' || v === 'fav') { CFG.vista = v; guardarCfg(); }
    // En la pestaña de una ficha del Ministerio Público, pasar a una lista es
    // empezar a usarla como cualquier otra.
    if ((v === 'rel' || v === 'fav') && fondoPuesto && !EN_EXPEDIENTE && !relecturaPermitida) { relecturaPermitida = true; setTimeout(refrescarSiHaceFalta, 0); }
    abierta = null;
    pintarTodo();
    const panel = q('[data-e="vPanel"]');
    if (panel) panel.scrollTop = 0;
    // La primera vez que se entra, se consulta sola. La Guía arranca por su índice.
    if (esVistaBandeja(v) && BAND[v].estado === 'nada') consultarBandeja(v);
    if (v === 'guia' && GUIA.estado === 'nada') guiaInicio();
    // La consulta pública arranca con el cursor en el buscador.
    if (v === 'cp') { const c = q('[data-cf="texto"]'); if (c) c.focus(); }
  }

  // ----------------------------------------------------- 7.1 leer las listas
  //
  // Una lista que de golpe llega mucho más corta que la anterior no se toma a la
  // primera: puede ser una respuesta cortada del PJN, y guardarla haría
  // desaparecer causas de la vista. Se toma recién cuando otra lectura seguida,
  // con la misma cuenta, trae exactamente las mismas causas.

  const CAIDA = { proporcion: 0.9, minimo: 5 };
  const CAIDAS = {};

  // Cae un número si baja al menos CAIDA.minimo y más de lo que admite la proporción.
  const cae = (antes, ahora) => antes - ahora >= CAIDA.minimo && ahora < antes * CAIDA.proporcion;

  function esCaida(anterior, nueva) {
    if (!anterior || !nueva) return false;
    return cae(anterior.total, nueva.total) || cae(anterior.enTramite, nueva.enTramite);
  }

  const firmaCausas = (r) => r.causas.map((c) => c.exp).sort().join('|');

  // Devuelve el motivo para no guardar la lectura nueva, o null si se guarda.
  function revisarCaida(tipo, anterior, nueva) {
    if (!esCaida(anterior, nueva)) { delete CAIDAS[tipo]; return null; }
    const firma = firmaCausas(nueva);
    const previa = CAIDAS[tipo];
    if (previa && previa.cuenta === CUENTA && previa.firma === firma) { delete CAIDAS[tipo]; return null; }
    CAIDAS[tipo] = { cuenta: CUENTA, firma };
    return LISTAS[tipo].nombre + ': el PJN devolvió ' + plural(nueva.total, 'causa', 'causas') + ' (' + nueva.enTramite + ' en trámite) y la lectura anterior tenía ' +
      anterior.total + ' (' + anterior.enTramite + ' en trámite). La lista nueva no se tomó, por si es una falla del PJN: si de verdad se achicó, volvé a leer y se toma';
  }

  async function actualizar(tipos) {
    if (leyendo) return;
    if (corridaActiva()) { avisar('Hay un lote de notas en curso. Las listas se leen cuando termine.', true); return; }
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
        const rechazo = revisarCaida(tipo, DATOS[tipo], r);
        if (rechazo) { errores.push(rechazo); continue; }
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
    else if (cortada && !lecturaCedida) avisar('Lectura cancelada. Queda lo que ya estaba leído.');
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

  // Ver lecturasAlCargar. Tampoco se relee sola durante una tanda de nota: el
  // aviso de que hay una en curso es para quien pulsa Actualizar.
  let relecturaPermitida = false;
  function refrescarSiHaceFalta() {
    // Con las listas recién leídas no se relee nada, así que la línea de partida
    // de las novedades hay que ponerla igual: si no, el botón queda apagado hasta
    // que las listas envejezcan.
    if (!hayFoto() && (DATOS.rel || DATOS.fav)) fotoVisto();
    if (!relecturaPermitida || bloqueoNota()) return;
    const viejas = ['rel', 'fav'].filter((t) => !DATOS[t] || Date.now() - DATOS[t].fecha > VIEJA_DESPUES_DE);
    if (viejas.length) actualizar(viejas);
  }

  // Abrir una causa en esta pestaña implica dejar la página, y con ella se
  // pierde la lectura de listas que esté en curso. Esa lectura se detiene antes
  // de pedir la causa, para que el PJN atienda la apertura sin tener que
  // atender en paralelo la lectura de las listas (1.5.2). La marca
  // lecturaCedida está declarada junto a leyendo.
  function cederLectura() {
    if (!leyendo) return;
    lecturaCedida = true;
    cancelarLectura = true;
  }

  // Si la causa finalmente no se abrió, la lectura detenida se retoma una vez
  // que terminó de detenerse.
  async function retomarLectura() {
    if (!lecturaCedida) return;
    await esperarA(() => !leyendo, 60000, 300);
    lecturaCedida = false;
    if (!leyendo) refrescarSiHaceFalta();
  }

  // Va a la causa en esta pestaña. Con descargas en curso, Chrome pregunta si
  // salir y el usuario puede quedarse: si a los quince segundos la página sigue
  // acá, se retoma la lectura de listas que se cedió (1.6.3); hasta la 1.6.2
  // quedaba cortada sin aviso. Sin descargas no se retoma: la página puede
  // estar todavía esperando al PJN.
  function irEnEstaPestana(url) {
    location.href = url;
    setTimeout(() => { if (lecturaCedida && bajandoAlgo()) retomarLectura(); }, 15000);
  }

  // -------------------------------------------------- 7.2 acciones por causa

  let accionEnCurso = false;

  function ocupado() {
    if (bloqueoNota()) { avisar('Hay un lote de notas en curso: esperá a que termine.', true); return true; }
    if (DIAG.estado === 'corriendo') { avisar('Hay una revisión del PJN en curso: esperá a que termine, o cancelala en Acerca de.', true); return true; }
    if (accionEnCurso) { avisar('Esperá un momento: se está abriendo otra causa.', true); return true; }
    if (horasEnCurso) { avisar('Se está averiguando la hora: esperá a que termine, o cancelá la averiguación con el botón Cancelar.', true); return true; }
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
    if (!nueva) cederLectura();
    accionEnCurso = true;
    try {
      const url = await direccionDe(k, 'ojo', (t) => avisar(t));
      // Abrirla es haberla mirado: deja de ser novedad. Recién acá: si Chrome
      // bloqueó la pestaña o el PJN no dio la dirección, no se la miró.
      marcarVisto(k);
      if (w) { listaPestana(w); w.location.replace(url); avisar('Se abrió ' + k + ' en una pestaña nueva.'); }
      else { avisar('Abriendo ' + k + '...'); irEnEstaPestana(url); }
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir ' + k + ': ' + mensajeDe(e) + '.', true);
      retomarLectura();
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

  // La respuesta de un DEOX (1.4.6): se abre la causa en segundo plano, se leen
  // sus actuaciones y se abre en una pestaña nueva la que corresponde a la
  // respuesta (ver elegirRespuestaDeox). Si no se la puede elegir con
  // seguridad, se abre la causa, con el aviso de por qué.
  const MOTIVO_SIN_RESPUESTA = {
    'mismo día': 'otro oficio tuyo de la misma causa al mismo organismo se respondió el mismo día, y no se puede saber cuál respuesta es de cuál',
    'no está': 'no se encontró en las actuaciones de la causa un DEO recibido de ese organismo a partir del día de la respuesta'
  };

  function oficioDeox(id) {
    const f = (BAND.deox.filas || []).find((x) => x.id === String(id));
    if (!f || !f.resp) { avisar('No se encuentra el oficio ' + id + ' entre los DEOX leídos. Volvé a consultar la bandeja.', true); return null; }
    return f;
  }

  function avisarRespuestaDeox(f, r) {
    if (r.act) avisar('Se abrió en una pestaña nueva la respuesta al DEOX ' + f.id + ': ' + r.act.detalle + ', del ' + r.act.fecha + '.');
    else avisar('No se abrió la respuesta al DEOX ' + f.id + ': ' + (MOTIVO_SIN_RESPUESTA[r.motivo] || r.motivo) + '. Se abrió la causa en una pestaña nueva.', true);
  }

  async function abrirRespuestaDeox(id) {
    if (ocupado()) return;
    const f = oficioDeox(id);
    if (!f) return;
    const k = claveEnListas(f.exp);
    if (!k) { avisar('La causa ' + f.exp + ' no está en Mis causas ni en Favoritos: no se pueden leer sus actuaciones para buscar la respuesta.', true); return; }
    const w = pestanaNueva('_blank', 'la respuesta al DEOX ' + f.id);
    if (!w) return;
    accionEnCurso = true;
    try {
      const url = await direccionDe(k, 'ojo', (t) => avisar(t));
      // Con la página anotada se lee hasta ella (1.6.3), sin volver a trabar la
      // causa: la respuesta a un oficio está entre las más nuevas.
      const datos = await leerActuaciones(new URL(url).searchParams.get('cid'), (t) => avisar(t), null, { parcial: true, tope: topeGuardado(k) });
      const r = elegirRespuestaDeox(f, datos.actuaciones, BAND.deox.filas);
      listaPestana(w);
      w.location.replace(r.act ? (r.act.ver || r.act.url) : url);
      avisarRespuestaDeox(f, r);
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo buscar la respuesta al DEOX ' + f.id + ': ' + mensajeDe(e) + '.', true);
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
        const a = enlaceMenu(u.tr, PJN.menuFila.escrito);
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
    avisar('Durante un lote de notas no se descarga nada: esperá a que termine o cancelalo.', true);
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

  // La causa pedida desde el menú de una fila ("Dejar nota en esta causa"),
  // a la espera de que se la confirme en la solapa Dejar nota (1.6.2). Hasta la
  // 1.6.1 el botón solo cambiaba de solapa y la causa se perdía: quedaba a la
  // vista la selección que hubiera. No toca la selección de las listas y no se
  // recuerda: se descarta al dejar la nota, al descartarla o al ir a otra solapa.
  let notaElegida = null;
  function pedirNotaDeUna(k) {
    if (bloqueoNota()) { avisar('Ya hay un lote de notas en curso.', true); return; }
    notaElegida = k;
    irAVista('nota');
  }

  function pedirNota(solo) {
    if (bloqueoNota()) { avisar('Ya hay un lote de notas en curso.', true); return; }
    // La solapa lee la selección por su cuenta, así que no hace falta llevarla.
    if (VISTA !== 'nota') { irAVista('nota'); return; }
    const pausa = q('[data-e="pausa"]');
    if (pausa) { CFG.pausaNota = Math.max(300, parseInt(pausa.value, 10) || 700); guardarCfg(); }
    iniciarNota(solo);
  }

  // ---------------------------------------------- 7.3 exportar lo que se ve
  //
  // (1.6.0) Pedido del autor: bajar a Excel o a CSV lo que se está viendo, con
  // los filtros puestos, en Mis causas, Favoritos, las tres bandejas y la
  // consulta pública. Van las etiquetas y no las anotaciones: el archivo sale
  // del programa sin contraseña (ver EL ARCHIVO QUE SALE DEL EQUIPO), y las
  // anotaciones son privadas.
  //
  // Cada vista arma una tabla (columnas y filas) y los dos formatos la
  // escriben. El Excel se arma a mano, sin bibliotecas: es un archivo ZIP con
  // los XML de Office Open XML, sin comprimir. Las fechas van como fechas de
  // Excel, que se ordenan y se filtran; en el CSV, como texto dd/mm/aaaa.

  // Una columna: título, ancho en caracteres y tipo ('texto', 'fecha' o 'fechaHora').
  const colEx = (t, ancho, tipo) => ({ t, ancho: ancho || 18, tipo: tipo || 'texto' });
  const etiquetasTxt = (k) => (k ? etiquetasDe(k).map((e) => e.nom).join(', ') : '');
  const siNo = (x) => (x ? 'Sí' : '');

  // --- Mis causas y Favoritos: las columnas a la vista, salvo las anotaciones

  const VALOR_EX_LISTA = {
    exp: (c) => c.exp,
    et: (c) => etiquetasTxt(c.exp),
    dep: (c) => c.dep,
    car: (c) => c.car,
    partes: (c) => partesDe(c).map((p) => (p.rol ? p.rol + ': ' : '') + p.nombre).join(' · '),
    sit: (c) => c.sit,
    ult: (c) => c.ult,
    nota: (c) => { const n = NOTAS[c.exp]; return n ? resNota(n).t + ' el ' + isoACorta(n.f) + '/' + n.f.slice(0, 4) : ''; }
  };
  const ANCHO_EX_LISTA = { exp: 18, et: 20, dep: 40, car: 60, partes: 45, sit: 16, ult: 12, nota: 22 };

  function tablaExLista() {
    const ks = columnasVisibles('lista').filter((k) => k !== 'anot' && VALOR_EX_LISTA[k]);
    const cols = ks.map((k) => colEx(defCol('lista', k).t, ANCHO_EX_LISTA[k], k === 'ult' ? 'fecha' : 'texto')).concat([colEx('Trámite', 16)]);
    const filas = filtradas().map((c) => ks.map((k) => VALOR_EX_LISTA[k](c)).concat([c.tramite ? 'En trámite' : 'Fuera de trámite']));
    return { nombre: VISTA === 'fav' ? 'Favoritos' : 'Mis causas', cols, filas };
  }

  // --- Escritos, Notificaciones y DEOX: los datos de cada fila, con la carátula

  const COLS_EX_BANDEJA = {
    escr: [['Fecha', 17, 'fechaHora', (f) => f.fecha], ['Expediente', 18, 0, (f) => f.exp], ['Carátula', 50, 0, (f) => f.car],
      ['Escrito', 40, 0, (f) => f.desc], ['Tipo', 14, 0, (f) => f.tipo], ['Fojas', 7, 0, (f) => (f.fojas == null ? '' : String(f.fojas))],
      ['Dependencia', 40, 0, (f) => f.dep], ['Estado', 18, 0, (f) => f.estado], ['Aceptado', 17, 'fechaHora', (f) => f.acep]],
    notif: [['Fecha', 17, 'fechaHora', (f) => f.fecha], ['Cédula', 16, 0, (f) => f.num], ['Expediente', 18, 0, (f) => f.exp],
      ['Carátula', 50, 0, (f) => f.car], ['Juzgado', 40, 0, (f) => f.dep], ['Emisor', 40, 0, (f) => f.emisor], ['Destinatarios', 40, 0, (f) => f.dest]],
    deox: [['Envío', 17, 'fechaHora', (f) => f.fecha], ['Nro.', 11, 0, (f) => f.num], ['Tipo', 20, 0, (f) => f.tipo], ['Motivo', 40, 0, (f) => f.motivo],
      ['Urgente', 9, 0, (f) => siNo(f.urgente)], ['Expediente', 18, 0, (f) => f.exp], ['Carátula', 50, 0, (f) => f.car],
      ['Destino', 40, 0, (f) => f.destino], ['Estado', 14, 0, (f) => f.estado], ['Respuesta', 17, 'fechaHora', (f) => f.resp]]
  };

  function tablaExBandeja(v) {
    const C = COLS_EX_BANDEJA[v].concat([['Etiquetas de la causa', 22, 0, (f) => etiquetasTxt(claveEnListas(f.exp))]]);
    return {
      nombre: EXT[v].nombre,
      cols: C.map(([t, a, tipo]) => colEx(t, a, tipo || 'texto')),
      // Solo lo que se ve (1.6.3): con la consulta en error o en curso, la
      // pantalla no muestra filas, y hasta la 1.6.2 se exportaban las de la
      // consulta anterior, quizá de otras fechas o de otra causa.
      filas: BAND[v].estado === 'listo' ? filasBandeja(v).map((f) => C.map((c) => c[3](f))) : []
    };
  }

  // --- La consulta pública: lo encontrado, con los filtros

  function tablaExCP() {
    const cols = [colEx('Fuero', 7), colEx('Expediente', 20), colEx('Carátula', 60), colEx('Tipo de juicio', 30), colEx('Dependencia', 40),
      colEx('Situación', 16), colEx('Últ. act.', 12, 'fecha'), colEx('En tus causas', 12), colEx('Etiquetas', 20)];
    const filas = filasVisiblesCP().map((x) => {
      const k = claveEnListas(x.exp);
      return [x.sigla, x.exp, x.car, tipoDeJuicio(x.car), x.dep, x.sit, x.ult, siNo(k), etiquetasTxt(k)];
    });
    return { nombre: 'Consulta pública', cols, filas };
  }

  function tablaExVista() {
    if (esVistaLista()) return tablaExLista();
    if (esVistaBandeja(VISTA)) return tablaExBandeja(VISTA);
    if (VISTA === 'cp') return tablaExCP();
    return null;
  }

  // --- el CSV
  //
  // Separado por punto y coma, que es como Excel en español abre un CSV con
  // doble clic, en UTF-8 con la marca del comienzo (sin ella Excel no reconoce
  // las tildes) y con saltos de renglón de Windows.

  function textoEx(col, v) {
    if (col.tipo === 'fechaHora') return v ? fechaHora(v) : '';
    return v == null ? '' : String(v);
  }

  // Un texto que empieza con = + - o @ Excel lo toma como fórmula al abrir el
  // CSV (un motivo "- Solicita informe" daría #¿NOMBRE?): se le antepone un
  // apóstrofo, como se recomienda para los CSV que se abren con Excel.
  function campoCSV(t) {
    let s = String(t).replace(/\r\n?/g, '\n');
    if (/^[=+\-@\t]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = "'" + s;
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function csvDe(T) {
    const linea = (a) => a.map(campoCSV).join(';');
    const lineas = [linea(T.cols.map((c) => c.t))].concat(T.filas.map((f) => linea(f.map((v, i) => textoEx(T.cols[i], v)))));
    return '\uFEFF' + lineas.join('\r\n') + '\r\n';
  }

  // --- el Excel

  // Los caracteres que XML no admite (los de control, salvo la tabulación y
  // los saltos de renglón) se quitan.
  const sinControl = (s) => [...s].filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 || c === 9 || c === 10 || c === 13; }).join('');
  const xmlEx = (s) => sinControl(String(s == null ? '' : s))
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // "A", "B", ..., "Z", "AA"...
  function letraCol(i) {
    let s = '';
    for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  }

  // Días desde el 30/12/1899, que es como Excel guarda una fecha.
  const EPOCA_EXCEL = Date.UTC(1899, 11, 30);
  function serialExcel(ms) {
    const d = new Date(ms);
    return (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()) - EPOCA_EXCEL) / 86400000;
  }
  function serialDeFechaPJN(t) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t || '');
    return m ? (Date.UTC(+m[3], +m[2] - 1, +m[1]) - EPOCA_EXCEL) / 86400000 : null;
  }

  // Estilos: 1, título en negrita; 2, fecha; 3, fecha y hora (formatos 14 y
  // 22, que Excel muestra según el idioma del equipo: dd/mm/aaaa en español).
  function celdaEx(refCelda, col, v) {
    const n = col.tipo === 'fecha' ? serialDeFechaPJN(v) : col.tipo === 'fechaHora' && v ? serialExcel(v) : null;
    if (n != null) return '<c r="' + refCelda + '" s="' + (col.tipo === 'fecha' ? 2 : 3) + '"><v>' + n + '</v></c>';
    const t = textoEx(col, v);
    return t ? '<c r="' + refCelda + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEx(t) + '</t></is></c>' : '';
  }

  function hojaEx(T) {
    const rangoEx = letraCol(T.cols.length - 1) + (T.filas.length + 1);
    const cab = '<row r="1">' + T.cols.map((c, i) => '<c r="' + letraCol(i) + '1" t="inlineStr" s="1"><is><t>' + xmlEx(c.t) + '</t></is></c>').join('') + '</row>';
    const filas = T.filas.map((f, j) => '<row r="' + (j + 2) + '">' + f.map((v, i) => celdaEx(letraCol(i) + (j + 2), T.cols[i], v)).join('') + '</row>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<cols>' + T.cols.map((c, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + c.ancho + '" customWidth="1"/>').join('') + '</cols>' +
      '<sheetData>' + cab + filas + '</sheetData><autoFilter ref="A1:' + rangoEx + '"/></worksheet>';
  }

  const ESTILOS_EX = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="22" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  // El nombre de la hoja: hasta 31 letras y sin los signos que Excel no acepta.
  const nombreHojaEx = (t) => limpio(String(t).replace(/[[\]:*?/\\']/g, ' ')).slice(0, 31) || 'Hoja1';

  function archivosEx(T) {
    const hoja = nombreHojaEx(T.nombre);
    const ult = '$A$1:$' + letraCol(T.cols.length - 1) + '$' + (T.filas.length + 1);
    const cab = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    return [
      ['[Content_Types].xml', cab + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', cab + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', cab + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="' + xmlEx(hoja) + '" sheetId="1" r:id="rId1"/></sheets>' +
        '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\'' + xmlEx(hoja) + '\'!' + ult + '</definedName></definedNames></workbook>'],
      ['xl/_rels/workbook.xml.rels', cab + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', ESTILOS_EX],
      ['xl/worksheets/sheet1.xml', hojaEx(T)]
    ];
  }

  // --- el ZIP, sin comprimir (método "stored")

  let TABLA_CRC = null;
  function crc32(bytes) {
    if (!TABLA_CRC) {
      TABLA_CRC = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        TABLA_CRC[n] = c >>> 0;
      }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = TABLA_CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  // Encabezado de un archivo dentro del ZIP: el local (firma 0x04034b50) y el
  // del índice del final (0x02014b50) llevan los mismos datos.
  function cabeceraZip(local, nombre, datos, crc, desde) {
    const h = new DataView(new ArrayBuffer(local ? 30 : 46));
    let p = 0;
    const u32 = (v) => { h.setUint32(p, v, true); p += 4; };
    const u16 = (v) => { h.setUint16(p, v, true); p += 2; };
    u32(local ? 0x04034b50 : 0x02014b50);
    if (!local) u16(20);
    u16(20); u16(0x0800); u16(0); u16(0); u16(0x21);   // versión, UTF-8, sin comprimir, hora y fecha fijas
    u32(crc); u32(datos.length); u32(datos.length); u16(nombre.length); u16(0);
    if (!local) { u16(0); u16(0); u16(0); u32(0); u32(desde); }
    return new Uint8Array(h.buffer);
  }

  function zipDe(archivos) {
    const cod = new TextEncoder();
    const partes = [], indice = [];
    let pos = 0;
    archivos.forEach(([n, texto]) => {
      const nombre = cod.encode(n), datos = cod.encode(texto), crc = crc32(datos);
      const local = cabeceraZip(true, nombre, datos, crc, 0);
      indice.push(cabeceraZip(false, nombre, datos, crc, pos), nombre);
      partes.push(local, nombre, datos);
      pos += local.length + nombre.length + datos.length;
    });
    const largoIndice = indice.reduce((s, x) => s + x.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true);
    fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, largoIndice, true); fin.setUint32(16, pos, true);
    return new Blob(partes.concat(indice, [new Uint8Array(fin.buffer)]));
  }

  // --- bajar el archivo

  const nombreArchivoEx = (T, ext) => 'supjn-' + norm(T.nombre).replace(/[^a-z0-9]+/g, '-') + '-' + hoyISO() + '.' + ext;
  const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  function exportarVista(fmt) {
    const T = tablaExVista();
    if (!T || !T.filas.length) { avisar('No hay nada para exportar: la tabla está vacía' + (T ? ' con los filtros puestos.' : '.'), true); return; }
    const nombre = nombreArchivoEx(T, fmt === 'csv' ? 'csv' : 'xlsx');
    if (fmt === 'csv') guardarArchivo(csvDe(T), nombre, 'text/csv;charset=utf-8');
    else guardarArchivo(zipDe(archivosEx(T)), nombre, TIPO_XLSX);
    avisar('Se bajó ' + nombre + ', con ' + plural(T.filas.length, 'fila', 'filas') + '. Las anotaciones no van en el archivo.');
  }

  function menuExportarHTML() {
    return '<div class="tit">Bajar lo que se ve, con los filtros</div>' +
      '<button class="it" data-a="exportarTabla" data-fmt="xlsx">Excel (.xlsx)</button>' +
      '<button class="it" data-a="exportarTabla" data-fmt="csv">CSV (separado por punto y coma)</button>' +
      '<div class="tit" style="text-transform:none;font-weight:400;white-space:normal;max-width:260px">Van las etiquetas. Las anotaciones no van: el archivo sale sin contraseña.</div>';
  }

  const botonExportarHTML = (chico) => '<button class="sj-b' + (chico ? ' chico' : '') + '" data-a="menuExportar" title="Bajar lo que se ve, con los filtros puestos, en Excel o en CSV">' + icono('\u21E9') + 'Exportar ▾</button>';

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
      let P = null;
      try {
        P = await abrirPuente(app);
        cuentaDelPuente(app, P);
        return await enviarPedido(app, P, datos, avance);
      } catch (e) {
        const m = String(e && e.message ? e.message : e);
        // Una sesión vencida o un marco perdido se reintentan una vez, con un
        // marco nuevo: la aplicación vuelve a entrar con el SSO. Se cierra solo
        // el marco que falló: si otro pedido ya abrió uno nuevo, cerrarlo le
        // haría fallar a él (hasta la 1.6.0 pasaba con dos pedidos a la vez).
        if (intento === 0 && /^(sesion|marco|sin respuesta)$/.test(m)) { if (P && PUENTES[app] === P) cerrarPuente(app); continue; }
        throw new Error(errorPuente(app, e), { cause: e });
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
  const urlExpediente = (eid) => ORIGEN_SCW + PJN.novedad + '?identificacion=' + encodeURIComponent(CUENTA) + '&eid=' + encodeURIComponent(eid);

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
      estadoCod: limpio(String(x.estado || '')).toUpperCase(),
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
      // (1.4.6) El CUIO del organismo de destino, para reconocer su respuesta
      // en las actuaciones de la causa.
      cuio: limpio(x.cuio),
      busq: textoBusq(x.id, exp, ex.caratula, tipo, destino, dep, estado, x.motivo)
    };
  }

  // La respuesta de un DEOX (1.4.6). DEOX no informa qué documento contestó el
  // oficio: el organismo responde con un DEO nuevo, que llega al juzgado y
  // aparece en las actuaciones de la causa como "SE RECIBIO DEO: N - OFICIO
  // COMUNICACIÓN - <CUIO> - <ORGANISMO>" (relevado el 29/09/2026 sobre el PJN
  // real). El PDF del oficio que da DEOX no incluye la respuesta, y la
  // respuesta tampoco cita el número del oficio.
  //
  // Se elige, entre esas actuaciones, la del mismo organismo con fecha igual o
  // posterior al día de la respuesta y con número mayor que el del oficio (los
  // números de DEO crecen con el tiempo): la de número más bajo. Si otro
  // oficio propio de la misma causa al mismo organismo se respondió el mismo
  // día, no se elige ninguna: elegir mal sin que se note es peor que no elegir.
  const RE_DEO_RECIBIDO = /se\s+recibi[oó]\s+deo\s*:?\s*(\d+)/i;
  const numeroDeoRecibido = (a) => { const m = RE_DEO_RECIBIDO.exec((a && a.detalle) || ''); return m ? Number(m[1]) : 0; };
  const isoDePJN = (t) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; };
  const mismoDestinoDeox = (a, b) => (a.cuio && b.cuio ? a.cuio === b.cuio : !!a.destino && norm(a.destino) === norm(b.destino));
  function delOrganismoDelOficio(f, act) {
    const d = norm(act.detalle);
    if (f.cuio && d.indexOf(norm(f.cuio)) >= 0) return true;
    return !!f.destino && d.indexOf(norm(f.destino)) >= 0;
  }
  function otroOficioElMismoDia(f, propias) {
    const dia = isoDeMs(f.resp);
    return (propias || []).some((g) => g && g.id !== f.id && g.resp && isoDeMs(g.resp) === dia &&
      expComparable(g.exp) === expComparable(f.exp) && mismoDestinoDeox(g, f));
  }
  function elegirRespuestaDeox(f, acts, propias) {
    if (!f || !f.resp) return { motivo: 'sin respuesta' };
    if (otroOficioElMismoDia(f, propias)) return { motivo: 'mismo día' };
    const dia = isoDeMs(f.resp);
    const cands = (acts || []).filter((a) => numeroDeoRecibido(a) > Number(f.id) && isoDePJN(a.fecha) >= dia && delOrganismoDelOficio(f, a))
      .sort((a, b) => numeroDeoRecibido(a) - numeroDeoRecibido(b));
    return cands.length ? { act: cands[0] } : { motivo: 'no está' };
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
      B.total = r && typeof r.total === 'number' ? r.total : items.length;
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

  // Una celda de las bandejas (1.3.8: una función por columna). Las claves son
  // "bandeja:columna"; "*" vale para las tres bandejas.
  const CELDAS_DE_BANDEJA = {
    // 1.7.0: el día en su placa de color y la hora al lado.
    '*:fecha': (f) => { if (!f.fecha) return ''; const t = fechaHora(f.fecha); return fechaPlacaHTML(t.slice(0, 10)) + ' <span class="sj-sub">' + esc(t.slice(11)) + '</span>'; },
    // En las notificaciones, el juzgado de radicación va con el expediente.
    '*:exp': (f, v) => expCeldaHTML(f) + (v === 'notif' && f.dep && norm(f.dep) !== norm(f.emisor) ? '<div class="sj-sub">' + depGuiaHTML(f.dep) + '</div>' : ''),
    '*:num': (f) => '<span class="sj-exp">' + esc(f.num) + '</span>',
    'escr:desc': (f) => {
      const sub = [f.tipo && f.tipo !== 'ESCRITO' ? f.tipo : '', f.fojas ? plural(f.fojas, 'foja', 'fojas') : '', f.archivo].filter(Boolean).join(' · ');
      return esc(f.desc) + (sub ? '<div class="sj-sub">' + esc(sub) + '</div>' : '');
    },
    'escr:dep': (f) => depGuiaHTML(f.dep),
    'escr:estado': (f) => placaEstadoHTML(f) + (f.acep ? '<div class="sj-sub">aceptado ' + esc(fechaHora(f.acep)) + '</div>' : ''),
    'notif:emisor': (f) => depGuiaHTML(f.emisor),
    'deox:tipo': (f) => esc(f.tipo) + (f.urgente ? '<span class="sj-urg">urgente</span>' : '') +
      (f.motivo ? '<div class="sj-nota-txt sj-sub" title="' + esc(f.motivo) + '">' + esc(f.motivo) + '</div>' : ''),
    'deox:destino': (f) => esc(f.destino) + (f.dep && norm(f.dep) !== norm(f.destino) ? '<div class="sj-sub">' + depGuiaHTML(f.dep) + '</div>' : ''),
    'deox:estado': (f) => (f.resp ? respuestaDeoxHTML(f) : placaDeoxHTML(f))
  };
  // (1.4.6) Un oficio respondido lleva a su respuesta: la placa y la fecha son
  // un solo botón, que la busca en las actuaciones de la causa y la abre en
  // una pestaña nueva.
  const respuestaDeoxHTML = (f) => '<button type="button" class="sj-resp" data-a="respuestaDeox" data-k="' + esc(f.id) + '" title="' +
    esc('Abrir la respuesta en una pestaña nueva. SuPJN+ la busca en las actuaciones de ' + (f.exp || 'la causa') + '.') + '">' +
    placaDeoxHTML(f) + '<span class="sj-sub">respondido ' + esc(fechaHora(f.resp)) + ' ↗</span></button>';
  // Placas de estado (1.4.0): cada texto de estado tiene un color fijo.
  const COLOR_ESTADO_ESCRITO = {
    ENVIADO_A_DEPENDENCIA: 'indigo', ENVIADO_GESTIONADO: 'verde', ENVIADO_A_AUTORIZADOR: 'azul',
    PENDIENTE: 'ambar', ENVIADO_ARCHIVADO: 'gris', ENVIADO_BORRADO: 'rojo'
  };
  const COLOR_ESTADO_DEOX = { Enviado: 'azul', Respondido: 'verde', Incorporado: 'verde', Cerrado: 'gris' };
  const placaHTML = (texto, color, cod) => (texto ? '<span class="sj-estado ' + esc(color || 'gris') + '"' + (cod ? ' data-est="' + esc(cod) + '"' : '') + '>' + esc(texto) + '</span>' : '');
  const placaEstadoHTML = (f) => placaHTML(f.estado, COLOR_ESTADO_ESCRITO[f.estadoCod] || 'gris', f.estadoCod);
  const placaDeoxHTML = (f) => placaHTML(f.estado, COLOR_ESTADO_DEOX[f.estado] || 'gris', f.estado);
  // Situación de la causa en la lista del PJN: el color sale de la palabra clave.
  function colorSituacion(sit) {
    const t = norm(sit || '');
    if (!t) return '';
    if (/paraliz|caduc/.test(t)) return 'rojo';
    if (/archiv|termin|finaliz/.test(t)) return 'gris';
    if (/despacho|resolver|sentencia|acuerdo/.test(t)) return 'ambar';
    if (/camara|elevad|apelac|casacion|corte/.test(t)) return 'violeta';
    if (/letra|tramite|receptoria/.test(t)) return 'verde';
    return 'azul';
  }
  const placaSituacionHTML = (sit) => placaHTML(sit, colorSituacion(sit), '');
  function celdaBandejaHTML(v, f, k) {
    const celda = CELDAS_DE_BANDEJA['*:' + k] || CELDAS_DE_BANDEJA[v + ':' + k];
    return celda ? celda(f, v) : esc(f[k]);
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
          '<label>Desde ' + campoFecha('data-bf="desde"', B.desde) + '</label>' +
          '<label>hasta ' + campoFecha('data-bf="hasta"', B.hasta) + '</label>') +
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
      '<span class="der">' + botonExportarHTML(false) +
      (v === 'notif' ? '<button class="sj-b prim" data-a="cedulaUna" data-k="' + esc(B.causa ? B.causa.exp : '') + '" title="' +
        (B.causa ? 'Abre Notificaciones en una pestaña nueva, con esta causa cargada' : 'Abre el formulario de Notificaciones en una pestaña nueva') + '">' +
        (B.causa ? 'Dejar cédula en esta causa' : 'Nueva cédula electrónica') + ' ↗</button>' : '') +
      (v === 'deox' ? '<button class="sj-b prim" data-a="deoxUna" data-k="' + esc(B.causa ? B.causa.exp : '') + '" title="' +
        (B.causa ? 'Abre DEOX en una pestaña nueva, con esta causa cargada' : 'Abre el formulario de DEOX para iniciar un oficio, en una pestaña nueva') + '">' +
        (B.causa ? 'Nuevo DEOX en esta causa' : 'Nuevo DEOX') + ' ↗</button>' : '') +
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
  function puntajeGuia(consulta, nombre) {
    const c = tokensGuia(nombre);
    if (consulta.numeros.join(',') !== c.numeros.join(',')) return -1;
    if (consulta.palabras.some((w) => !c.palabras.some((x) => x.indexOf(w) === 0))) return -1;
    return c.palabras.filter((x) => !consulta.palabras.some((w) => x.indexOf(w) === 0)).length;
  }

  // El mejor, solo si es uno: con un empate no se adivina.
  function mejorGuia(consulta, lista) {
    const v = (lista || [])
      .map((s) => ({ s, p: puntajeGuia(consulta, s && s.dependenciaInfo ? s.dependenciaInfo.nombre : '') }))
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

  // La ficha de una dependencia de la Guía, con sus datos o un error.
  async function fichaGuia(cod) {
    const d = await pedirPuente('guia', { op: 'json', ruta: rutaGuia(cod) });
    if (!d || !d.dependencia || !d.dependencia.dependenciaInfo) throw new Error('la Guía no tiene datos de esa dependencia');
    return d;
  }

  async function guiaAbrir(cod, apilar, resaltar) {
    if (!cod) return;
    const gen = ++GUIA.gen;
    GUIA.estado = 'leyendo';
    GUIA.txt = 'Consultando la Guía judicial...';
    pintarGuia();
    try {
      const d = await fichaGuia(cod);
      if (gen !== GUIA.gen) return;
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
    const modoMP = paginar ? GUIA.res.modo : GUIA.modo;
    if (esModoMP(modoMP)) { guiaBuscarMP(modoMP, t, pagina); return; }
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
  async function subGuia(d, consulta, gen) {
    const subs = (d && d.subDependencias) || [];
    const directa = mejorGuia(consulta, subs).unico;
    if (directa) return { directa: true, sub: directa };
    // Los juzgados con una sola secretaría la tienen en la Guía como "Secretaría
    // Única", sin número: si es la única de su clase, es esa.
    const clase = subs.filter((s) => s && s.dependenciaInfo &&
      tokensGuia(s.dependenciaInfo.nombre).palabras.some((x) => consulta.palabras.length && x.indexOf(consulta.palabras[0]) === 0));
    if (clase.length === 1 && /\bunica\b/.test(norm(clase[0].dependenciaInfo.nombre))) return { directa: true, sub: clase[0], unica: true };
    const grupos = subs.filter((s) => s && s.dependenciaInfo && s.codigoUrl &&
      tokensGuia(s.dependenciaInfo.nombre).palabras.some((x) => consulta.palabras.some((w) => x.indexOf(w) === 0))).slice(0, 3);
    for (const g of grupos) {
      if (gen !== GUIA.gen) return null;
      // Un grupo que no responde no anula la búsqueda: se prueba el siguiente
      // (hasta la 1.6.0, un solo pedido fallido descartaba la dependencia ya leída).
      let dg;
      try { dg = await pedirPuente('guia', { op: 'json', ruta: rutaGuia(g.codigoUrl) }); } catch (e) { continue; }
      const s = mejorGuia(consulta, (dg && dg.subDependencias) || []).unico;
      if (s) return { directa: false, sub: s, grupo: g };
    }
    return null;
  }

  // "JUZGADO ... NRO. 11 - SECRETARÍA NRO. 133": la dependencia principal (lo
  // que va antes del guion) y el resto.
  function partesDeDependencia(dep) {
    const partes = String(dep || '').split(/\s*-\s*/).map(limpio).filter(Boolean);
    return { principal: partes[0] || '', resto: partes.slice(1).join(' ') };
  }

  // La lista de posibles, que queda detrás de la ficha y se ve con Volver.
  // Con una sola posible no se dice que hay varias (hasta la 1.6.0, sí).
  function resultadosDeDependencia(consulta, r, lista, validos, origen) {
    const total = (r && r.totalElements) || 0;
    let nota;
    if (validos.length > 1) nota = 'Hay más de una dependencia posible para ' + origen + '. Elegí la que corresponde.';
    else if (validos.length === 1) nota = 'Dependencia de ' + origen + ', según la Guía judicial.';
    else {
      nota = 'La Guía no tiene una dependencia que coincida exactamente con ' + origen + '. Estos son los resultados de la búsqueda "' + consulta + '"' +
        (total > lista.length ? ' (los primeros ' + lista.length + '; afiná la búsqueda para ver otros)' : '') + '.';
    }
    return { modo: 'dep', texto: consulta, lista: validos.length ? validos : lista, total: validos.length || total, pagina: 0, paginas: 0, nota };
  }

  // Dentro de la dependencia d, la parte que nombra el expediente después del
  // guion: qué ficha mostrar, qué resaltar, la nota y la pila de Volver. null
  // si mientras tanto se pidió otra cosa.
  async function bajarAlResto(d, resto, gen, nota) {
    const out = { d, resaltar: null, nota, pila: [{ res: true }] };
    // Un resto sin palabras ni números que buscar ("- CAPITAL FEDERAL") se toma
    // como si no hubiera resto (1.6.3): hasta la 1.6.2, cualquier oficina sin
    // número coincidía y se la resaltaba como la de la causa.
    const tk = resto ? tokensGuia(resto) : null;
    if (!tk || (!tk.palabras.length && !tk.numeros.length)) return out;
    const h = await subGuia(d, tk, gen);
    if (gen !== GUIA.gen) return null;
    if (h && h.directa) {
      out.resaltar = h.sub.id;
      if (h.unica) out.nota += ' La Guía no registra "' + resto + '" con su número: el juzgado tiene una sola, "' + limpio(h.sub.dependenciaInfo.nombre) + '", que es la resaltada.';
    } else if (h) {
      out.pila.push({ cod: d.dependencia.codigoUrl });
      if (h.grupo && h.grupo.codigoUrl) out.pila.push({ cod: h.grupo.codigoUrl });
      out.d = await fichaGuia(h.sub.codigoUrl);
    } else {
      out.nota += ' No se encontró en la Guía "' + resto + '": se muestra la dependencia principal.';
    }
    return out;
  }

  function mostrarFichaDeDependencia(x) {
    GUIA.det = x.d;
    GUIA.vista = 'det';
    GUIA.pila = x.pila;
    GUIA.resaltar = x.resaltar;
    GUIA.nota = x.nota;
    GUIA.estado = 'listo';
    GUIA.txt = '';
  }

  // La dependencia de una causa, en la Guía. Si hay una sola que corresponde,
  // se la abre; si no, se muestran las posibles para que se elija.
  async function guiaDeDependencia(dep, k) {
    const { principal, resto } = partesDeDependencia(dep);
    const qp = tokensGuia(principal);
    if (!qp.palabras.length) { avisar('No se sabe qué dependencia buscar en la Guía' + (k ? ' para ' + k : '') + '.', true); return; }
    const consulta = qp.palabras.concat(qp.numeros.map(String)).join(' ');
    const gen = ++GUIA.gen;
    GUIA.modo = 'dep';
    GUIA.texto = consulta;
    GUIA.estado = 'leyendo';
    GUIA.txt = 'Buscando ' + dep + ' en la Guía judicial...';
    irAVista('guia');
    let armada = false;
    try {
      const r = await pedirPuente('guia', { op: 'buscar', ruta: '/api/dependencia/find', cuerpo: cuerpoGuia(consulta, 0, 50) });
      if (gen !== GUIA.gen) return;
      const lista = Array.isArray(r && r.content) ? r.content : [];
      const { unico, validos } = mejorGuia(qp, lista);
      const origen = (k ? k + ': ' : '') + dep;
      GUIA.res = resultadosDeDependencia(consulta, r, lista, validos, origen);
      armada = true;
      GUIA.pila = [];
      GUIA.nota = '';
      if (!unico) {
        GUIA.vista = 'res';
        GUIA.estado = 'listo';
        GUIA.txt = '';
        pintarGuia();
        return;
      }
      const d = await fichaGuia(unico.codigoUrl);
      if (gen !== GUIA.gen) return;
      const x = await bajarAlResto(d, resto, gen, 'Dependencia de ' + origen + '.');
      if (!x || gen !== GUIA.gen) return;
      mostrarFichaDeDependencia(x);
    } catch (e) {
      if (gen !== GUIA.gen) return;
      GUIA.estado = 'error';
      GUIA.txt = mensajeDe(e);
      // Debajo del error, lo de esta búsqueda: la lista de posibles si se llegó
      // a armar, y si no, nada. Hasta la 1.6.0 quedaba a la vista la ficha de
      // la dependencia anterior, que podía ser de otra causa.
      GUIA.vista = armada ? 'res' : '';
      if (!armada) GUIA.pila = [];
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

  // La dirección en Google Maps (1.6.2), en una pestaña nueva, como todo lo
  // que sale del PJN. Va la calle con la localidad y la provincia, sin piso ni
  // código postal, que confunden la búsqueda.
  // Desde la 1.7.0, a pedido del autor, el botón no lleva texto: es un botón
  // pequeño con el pin rojo y la flecha de enlace externo, pegado a la
  // dirección. La leyenda aparece al pasar el cursor.
  const enlaceMapa = (direccion) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(direccion);
  const botonMapaHTML = (direccion) => (limpio(direccion)
    ? '<a class="sj-mapa" href="' + esc(enlaceMapa(limpio(direccion))) + '" target="_blank" rel="noopener noreferrer" title="Ver en Google Maps (pestaña nueva)" aria-label="Ver en Google Maps">' +
      '<span class="pin" aria-hidden="true">\u{1F4CD}</span><span class="fl" aria-hidden="true">↗</span></a>'
    : '');

  // Los renglones de la ficha, con el botón del mapa al final del primero,
  // que es el del domicilio, cuando la ficha lo tiene (1.7.0).
  function lineasConMapaHTML(lineas, info) {
    const dir = direccionDependencia(info);
    const conDomicilio = !!(info && info.domicilio && limpio(info.domicilio.domicilio));
    if (!dir || !conDomicilio || !lineas.length) return lineasHTML(lineas);
    return lineasHTML(lineas).replace('</p>', ' ' + botonMapaHTML(dir) + '</p>');
  }
  function direccionDependencia(info) {
    const dom = info && info.domicilio;
    if (!dom || !limpio(dom.domicilio)) return '';
    return [dom.domicilio, dom.localidad && dom.localidad.nombre, dom.provincia && dom.provincia.nombre, 'Argentina']
      .map(limpio).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', ');
  }
  const direccionMP = (f) => (limpio(f.dir) ? [f.dir, f.juris, 'Argentina'].map(limpio).filter(Boolean).join(', ') : '');

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
    if (t) copiarTexto(t);
  }

  // Copia un texto al portapapeles; si el navegador no lo deja, lo hace a mano.
  function copiarTexto(t) {
    const aMano = () => {
      const a = document.createElement('textarea');
      a.value = t;
      a.style.cssText = 'position:fixed;left:-5000px;top:0';
      document.body.appendChild(a);
      a.select();
      let fue;
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
    const cabecera = raiz ? '<h3>Guía judicial del PJN</h3><p>Elegí una dependencia o buscá por nombre. Los datos los carga cada tribunal en la Guía del PJN.</p>'
      : '<div class="sj-guia-ficha"><h3>' + esc(info.nombre) + '</h3>' + lineasConMapaHTML(lineas, info) +
        '<div class="bts"><button class="sj-b chico" data-a="guiaCopiar">Copiar los datos</button>' +
        '<a class="sj-b chico" href="' + esc(guiaWeb(dep.codigoUrl)) + '" target="_blank" rel="noopener noreferrer">Ver en pjn.gov.ar ↗</a></div></div>';
    const integ = integrantesHTML(d.integrantes);
    const subs = listaDependenciasHTML(d.subDependencias, GUIA.resaltar);
    return '<div class="sj-sec">' + nav + cabecera + '</div>' +
      (integ ? '<div class="sj-sec"><h4>Integrantes</h4>' + integ + '</div>' : '') +
      (subs ? '<div class="sj-sec"><h4>' + (raiz ? 'Índice' : 'Dependencias') + '</h4>' + subs + '</div>' : '');
  }

  function resultadosGuiaHTML() {
    const R = GUIA.res;
    if (esModoMP(R.modo)) return resultadosMPHTML(R) + paginadorGuiaHTML(R);
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
    return h + paginadorGuiaHTML(R);
  }

  function paginadorGuiaHTML(R) {
    if (!(R.paginas > 1)) return '';
    return '<div class="sj-pie"><span>Página ' + (R.pagina + 1) + ' de ' + R.paginas + '</span><span class="der">' +
      '<button data-a="guiaPag" data-p="' + (R.pagina - 1) + '"' + (R.pagina <= 0 ? ' disabled' : '') + '>‹ Anterior</button>' +
      '<button data-a="guiaPag" data-p="' + (R.pagina + 1) + '"' + (R.pagina + 1 >= R.paginas ? ' disabled' : '') + '>Siguiente ›</button></span></div>';
  }

  // Qué se puede buscar en la solapa Guía: las dos búsquedas de la Guía del PJN
  // y los directorios del Ministerio Público (ver 8.5).
  const MODOS_GUIA = [['dep', 'Dependencias'], ['per', 'Magistrados y funcionarios'], ['fis', 'Fiscalías (MPF)'], ['def', 'Defensorías (MPD)']];
  const ayudaGuia = (modo) => (esModoMP(modo) ? MP[modo].ayuda : modo === 'per' ? 'Apellido' : 'Por ejemplo: civil 74, correccional 11, casación penal');

  function enlaceGuiaHTML(codActual) {
    const m = esModoMP(GUIA.modo) ? MP[GUIA.modo] : null;
    if (m) return '<a class="sj-b" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer" title="Abrir en el sitio del ' + esc(m.sigla) + ', en una pestaña nueva">' + (GUIA.modo === 'fis' ? 'Mapa' : 'Guía') + ' en ' + esc(m.dominio) + ' ↗</a>';
    return '<a class="sj-b" href="' + esc(guiaWeb(codActual)) + '" target="_blank" rel="noopener noreferrer" title="Abrir en el sitio del PJN, en una pestaña nueva">Guía en pjn.gov.ar ↗</a>';
  }

  function guiaHTML() {
    const codActual = GUIA.vista === 'det' && GUIA.det ? GUIA.det.dependencia.codigoUrl : '';
    const barra = '<div class="sj-barra">' +
      '<select data-gf="modo" title="Qué buscar">' + MODOS_GUIA.map((x) => '<option value="' + x[0] + '"' + (GUIA.modo === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select>' +
      '<input type="text" data-gf="texto" placeholder="' + esc(ayudaGuia(GUIA.modo)) + '" value="' + esc(GUIA.texto) + '">' +
      '<button class="sj-b prim" data-a="guiaBuscar"' + (GUIA.estado === 'leyendo' ? ' disabled' : '') + '>Buscar</button>' +
      '<button class="sj-b" data-a="guiaInicio" title="Volver al índice de la Guía">Índice</button>' +
      '<span class="der" data-e="guiaEnlace">' + enlaceGuiaHTML(codActual) + '</span></div>';
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
  // Desde la 1.7.0 el mismo procedimiento abre también el formulario de DEOX
  // para iniciar un oficio (app 'deox'; ver FORM_NUEVO).
  function abrirFormularioNuevo(app, k) {
    const F = FORM_NUEVO[app];
    const url = EXT[app].origen + F.ruta;
    if (!k) {
      const w0 = window.open(url, '_blank');
      if (!w0) avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true);
      return;
    }
    const px = partesExp(k);
    if (!px) { avisar('No se reconoce el número de expediente ' + k + '.', true); return; }
    if (!CUENTA) { avisar('No se pudo identificar con qué cuenta se entró a la Consulta Web, así que no se carga ningún expediente en ' + F.app + '. Recargá la página.', true); return; }
    const exp = clave(k);
    guardarAlmacen(K_CEDULA, { app, exp, sigla: px.sigla, num: px.num, anio: px.anio, cuenta: CUENTA, ts: Date.now() });
    const w = window.open(url, '_blank');
    if (!w) {
      guardarAlmacen(K_CEDULA, null);
      avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true);
      return;
    }
    avisar('Se abrió ' + F.app + ' en una pestaña nueva, con ' + exp + ' cargado. ' + mayuscula(F.doc) + ' se completa y se envía desde el formulario del PJN.');
  }
  const dejarCedula = (k) => abrirFormularioNuevo('notif', k);
  const nuevoDeox = (k) => abrirFormularioNuevo('deox', k);

  // La dependencia de una causa: la de la lista o la del expediente abierto.
  function depDe(k) {
    const c = causaPorClave(k);
    if (c && c.dep) return c.dep;
    if (EXP.datos && EXP.datos.exp === k && EXP.datos.dep) return EXP.datos.dep;
    return '';
  }

  // ------------------------------------------ 8.5 fiscalías y defensorías
  //
  // Ver FISCALÍAS Y DEFENSORÍAS al comienzo del archivo. Cada directorio se baja
  // entero, se convierte en una lista de fichas y se guarda en este equipo por
  // siete días. La búsqueda se hace sobre esa lista, sin volver a pedir nada.
  // Las dos listas son públicas y no son de ninguna causa: se guardan una sola
  // vez para el navegador, no por cuenta.

  const MP = {
    fis: {
      sitio: 'Ministerio Público Fiscal', sigla: 'MPF', dominio: 'mpf.gob.ar', plural: 'fiscalías', cargo: 'Fiscal',
      url: 'https://www.mpf.gob.ar/mapa-fiscalias/', clave: 'supjn.mp.fis.v1',
      ayuda: 'Por ejemplo: criminal y correccional 40, penal económico 2, o el apellido del fiscal'
    },
    def: {
      sitio: 'Ministerio Público de la Defensa', sigla: 'MPD', dominio: 'mpd.gov.ar', plural: 'defensorías', cargo: 'A cargo',
      url: 'https://www.mpd.gov.ar/index.php/guia-de-defensorias-mpd', clave: 'supjn.mp.def.v1',
      ayuda: 'Por ejemplo: tribunales orales 3, casación, o el apellido del defensor'
    }
  };
  const VIGENCIA_MP = 7 * 24 * 3600 * 1000;
  const MINIMO_MP = 50;          // con menos fichas, la página cambió: no se guarda
  const ESPERA_MP = 45000;
  const ORIGEN_MPD = 'https://www.mpd.gov.ar';
  const MEMORIA_MP = {};         // listas ya leídas mientras dura la página

  const esModoMP = (m) => Object.prototype.hasOwnProperty.call(MP, m);

  // Baja una página de esos dos sitios. GM_xmlhttpRequest solo existe si
  // Tampermonkey lo habilitó (@grant); fuera de Tampermonkey no hay otra vía.
  function bajarPaginaMP(url) {
    return new Promise((ok, mal) => {
      if (typeof GM_xmlhttpRequest !== 'function') { mal(new Error('Tampermonkey no habilitó la lectura de ese sitio. Actualizá SuPJN+ desde Tampermonkey y recargá la página.')); return; }
      const sitio = new URL(url).hostname;
      GM_xmlhttpRequest({
        method: 'GET', url, timeout: ESPERA_MP, headers: { Accept: 'text/html' },
        onload: (r) => (r.status === 200 && r.responseText ? ok(r.responseText) : mal(new Error(sitio + ' contestó con el código ' + r.status + '.'))),
        onerror: () => mal(new Error('No se pudo conectar con ' + sitio + '. Si Tampermonkey preguntó si SuPJN+ puede entrar a ese sitio, hay que permitirlo.')),
        ontimeout: () => mal(new Error(sitio + ' no contestó a tiempo. Probá de nuevo más tarde.'))
      });
    });
  }

  // Posición de la llave que cierra el objeto que abre en "ini", sin contar las
  // llaves que aparecen dentro de los textos.
  function finDeObjeto(txt, ini) {
    let hondo = 0, enTexto = false, escape = false;
    for (let i = ini; i < txt.length; i++) {
      const c = txt.charAt(i);
      if (enTexto) {
        if (escape) escape = false;
        else if (c === '\\') escape = true;
        else if (c === '"') enTexto = false;
      } else if (c === '"') enTexto = true;
      else if (c === '{') hondo++;
      else if (c === '}' && --hondo === 0) return i;
    }
    return -1;
  }

  // La variable "settings" de la página del MPF, que trae el árbol.
  function arbolMPF(html) {
    const marca = html.indexOf('var settings = ');
    const ini = marca < 0 ? -1 : html.indexOf('{', marca);
    const fin = ini < 0 ? -1 : finDeObjeto(html, ini);
    if (fin < 0) throw new Error('la página del MPF no trae el listado de fiscalías como antes');
    const obj = JSON.parse(html.slice(ini, fin + 1));
    const items = obj && obj.cats && obj.cats.items;
    if (!Array.isArray(items)) throw new Error('la página del MPF no trae el listado de fiscalías como antes');
    return items;
  }

  // Los textos del MPF pueden traer entidades de HTML ("&amp;"): se las pasa a
  // letras con un documento aparte, que no ejecuta nada.
  function sinEntidades(s) {
    const t = limpio(s);
    if (!/&[#a-z0-9]+;/i.test(t)) return t;
    return limpio(new DOMParser().parseFromString('<p>' + esc(t).replace(/&amp;([#a-z0-9]+;)/gi, '&$1') + '</p>', 'text/html').body.textContent);
  }

  function telefonoMPF(n) {
    const tel = sinEntidades(n.telefonos), pre = sinEntidades(n.prefijo);
    if (!tel) return '';
    return pre && tel.indexOf('(') < 0 ? '(' + pre + ') ' + tel : tel;
  }

  function fichaMPF(n, juris, grupo) {
    const tel = telefonoMPF(n), fax = sinEntidades(n.fax);
    return {
      id: 'mpf-' + limpio(n.ID), nombre: sinEntidades(n.post_title), cargo: sinEntidades(n.fiscal), dir: sinEntidades(n.direccion),
      tel: [tel ? 'Tel. ' + tel : '', fax ? 'Fax ' + fax : ''].filter(Boolean), mail: sinEntidades(n.mail).toLowerCase(),
      juris, grupo, enlace: MP.fis.url
    };
  }

  // Arriba, las jurisdicciones; debajo, fiscalías sueltas o grupos con sus
  // fiscalías. Una ficha es lo que no tiene nada debajo.
  function fichasMPF(html) {
    const out = [];
    const bajar = (n, juris, grupo) => {
      const hijos = Array.isArray(n.children) ? n.children : [];
      const titulo = sinEntidades(n.post_title);
      if (!hijos.length) { if (juris) out.push(fichaMPF(n, juris, grupo)); return; }
      hijos.forEach((h) => bajar(h, juris || titulo, juris ? (grupo || titulo) : ''));
    };
    arbolMPF(html).forEach((j) => bajar(j, '', ''));
    return out;
  }

  // El correo del MPD: el usuario y el dominio, cada uno en base64.
  function correoMPD(el) {
    try {
      const u = atob(el.getAttribute('first') || ''), d = atob(el.getAttribute('last') || '');
      return u && d ? (u + '@' + d).toLowerCase() : '';
    } catch (e) { return ''; }
  }

  // Los renglones de la celda de datos de una fila del MPD.
  function renglonesMPD(td) {
    const c = td.cloneNode(true);
    c.querySelectorAll('joomla-hidden-mail').forEach((m) => m.replaceWith('\n' + correoMPD(m) + '\n'));
    c.querySelectorAll('br').forEach((b) => b.replaceWith('\n'));
    c.querySelectorAll('span,div,p').forEach((x) => x.append('\n'));
    return c.textContent.split('\n').map(limpio).filter(Boolean);
  }

  // "Pehuajó-[Buenos Aires]" → "Pehuajó, Buenos Aires"; "Capital Federal-[Capital
  // Federal]" → "Capital Federal".
  function jurisMPD(r) {
    const m = /^(.*?)\s*-\s*\[([^\]]*)\]$/.exec(r);
    if (!m) return '';
    const a = limpio(m[1]), b = limpio(m[2]);
    return !b || norm(a) === norm(b) ? a : a + ', ' + b;
  }

  function fichaMPD(tr) {
    const a = tr.querySelector('th a'), td = tr.querySelector('td');
    const f = { nombre: limpio(a ? a.textContent : (tr.querySelector('th') || {}).textContent), personas: [], dir: '', tel: [], mail: '', juris: '', grupo: '' };
    const href = a ? a.getAttribute('href') || '' : '';
    f.enlace = /^\/[^/]/.test(href) ? ORIGEN_MPD + href : MP.def.url;
    f.id = 'mpd-' + ((/\/(\d+)-[^/]*$/.exec(href) || [])[1] || norm(f.nombre).replace(/[^a-z0-9]+/g, '-'));
    (td ? renglonesMPD(td) : []).forEach((r) => {
      // El sitio escribe a veces "Direccción", con tres c.
      if (/^direc+i[oó]n\s*:/i.test(r)) f.dir = limpio(r.replace(/^[^:]*:/, ''));
      else if (/^fijo\s*:/i.test(r)) f.tel.push('Tel. ' + limpio(r.replace(/^[^:]*:/, '')));
      else if (/^(m[oó]vil|celular|tel[eé]fono|fax)\s*:/i.test(r)) f.tel.push(r);
      else if (/-\s*\[[^\]]*\]$/.test(r)) f.juris = jurisMPD(r);
      else if (/^[^\s@]+@[^\s@]+$/.test(r)) f.mail = r.toLowerCase();
      else f.personas.push(r);
    });
    return f;
  }

  // Algunas filas traen la jurisdicción sola, sin la provincia entre corchetes
  // ("Capital Federal"): si el último renglón es el nombre de una jurisdicción
  // que aparece en otras filas, se lo toma como tal.
  function cerrarFichasMPD(fichas) {
    const juris = new Set(fichas.map((f) => norm(f.juris.split(',')[0])).filter(Boolean));
    fichas.forEach((f) => {
      const ult = f.personas[f.personas.length - 1];
      if (!f.juris && ult && juris.has(norm(ult))) f.juris = f.personas.pop();
      f.cargo = f.personas.join(' · ');
      delete f.personas;
    });
    return fichas;
  }

  function fichasMPD(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const filas = doc.querySelectorAll('#contactList tbody tr');
    if (!filas.length) throw new Error('la página del MPD no trae la guía de defensorías como antes');
    return cerrarFichasMPD(Array.prototype.map.call(filas, fichaMPD).filter((f) => f.nombre));
  }

  const LECTORES_MP = { fis: fichasMPF, def: fichasMPD };

  // La lista de un directorio: la de esta página, la guardada si tiene menos de
  // siete días, o una nueva bajada del sitio. Con "forzar" se baja siempre. Si
  // no se puede bajar, o la página ya no trae la lista, se sigue con la
  // guardada, aunque sea vieja, y se avisa.
  const listaValidaMP = (g) => !!(g && Array.isArray(g.fichas) && g.fichas.length >= MINIMO_MP && g.ts);

  async function bajarListaMP(modo) {
    const m = MP[modo];
    const fichas = LECTORES_MP[modo](await bajarPaginaMP(m.url));
    if (fichas.length < MINIMO_MP) throw new Error('la página del ' + m.sigla + ' trajo solo ' + plural(fichas.length, 'ficha', 'fichas') + ': puede haber cambiado');
    const nueva = { ts: Date.now(), fichas };
    guardarAlmacen(m.clave, nueva);
    return nueva;
  }

  async function listaMP(modo, forzar) {
    if (!forzar && MEMORIA_MP[modo]) return MEMORIA_MP[modo];
    const g = leerAlmacen(MP[modo].clave, null);
    const vale = listaValidaMP(g);
    if (!forzar && vale && Date.now() - g.ts < VIGENCIA_MP) {
      MEMORIA_MP[modo] = g;
      return g;
    }
    try {
      MEMORIA_MP[modo] = await bajarListaMP(modo);
    } catch (e) {
      if (!vale) throw e;
      MEMORIA_MP[modo] = Object.assign({}, g, { aviso: 'No se pudo actualizar la lista (' + mensajeDe(e).replace(/\.$/, '') + '): se usa la guardada.' });
    }
    return MEMORIA_MP[modo];
  }

  // Palabras que no sirven para buscar, y números: "N° 40", "Nro. 40" y "Nº40"
  // quedan como el número 40.
  const VACIAS_MP = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'lo', 'y', 'e', 'a', 'al', 'nro', 'n', 'no', 'num', 'numero']);
  function tokensMP(txt) {
    const palabras = [], numeros = [];
    norm(txt).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean).forEach((w) => {
      if (/^\d+$/.test(w)) numeros.push(parseInt(w, 10));
      else if (!VACIAS_MP.has(w)) palabras.push(w);
    });
    return { palabras, numeros };
  }

  // -1 si la ficha no corresponde. Cada palabra buscada tiene que empezar alguna
  // palabra del nombre, del titular, del grupo o de la jurisdicción; cada número,
  // estar en el nombre. Primero, las fichas que tienen todo en el nombre y, entre
  // ellas, las que tienen menos palabras de más.
  function puntajeMP(consulta, f) {
    const nom = tokensMP(f.nombre);
    const resto = tokensMP([f.cargo, f.grupo, f.juris].join(' ')).palabras;
    if (consulta.numeros.some((x) => nom.numeros.indexOf(x) < 0)) return -1;
    const empieza = (lista, w) => lista.some((x) => x.indexOf(w) === 0);
    let afuera = 0;
    for (const w of consulta.palabras) {
      if (empieza(nom.palabras, w)) continue;
      if (!empieza(resto, w)) return -1;
      afuera++;
    }
    const sobran = nom.palabras.filter((x) => !consulta.palabras.some((w) => x.indexOf(w) === 0)).length;
    return afuera * 1000 + sobran;
  }

  function buscarFichasMP(fichas, texto) {
    const consulta = tokensMP(texto);
    if (!consulta.palabras.length && !consulta.numeros.length) return [];
    return fichas.map((f, i) => ({ f, i, p: puntajeMP(consulta, f) }))
      .filter((x) => x.p >= 0)
      .sort((a, b) => a.p - b.p || a.i - b.i)
      .map((x) => x.f);
  }

  const fechaHoraMP = (ts) => { const d = new Date(ts); return d.toLocaleDateString('es-AR') + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };

  // De dónde salen los datos, cuándo se leyeron y cuántas fichas hay.
  const notaFuenteMP = (m, l) => 'Datos del ' + m.sitio + ' (' + m.dominio + '), leídos el ' + fechaHoraMP(l.ts) + '. Son ' +
    plural(l.fichas.length, 'ficha', 'fichas') + '.' + (l.aviso ? ' ' + l.aviso : '');

  // Búsqueda en la lista de fiscalías o de defensorías, con las mismas páginas
  // de resultados que la Guía.
  async function guiaBuscarMP(modo, texto, pagina, forzar) {
    const m = MP[modo];
    const gen = ++GUIA.gen;
    GUIA.estado = 'leyendo';
    GUIA.txt = (MEMORIA_MP[modo] && !forzar) ? 'Buscando "' + texto + '"...' : 'Bajando la lista de ' + m.plural + ' de ' + m.dominio + '...';
    pintarGuia();
    try {
      const l = await listaMP(modo, forzar);
      if (gen !== GUIA.gen) return;
      const todas = buscarFichasMP(l.fichas, texto);
      const paginas = Math.max(1, Math.ceil(todas.length / POR_PAGINA_GUIA));
      const pag = Math.min(Math.max(0, pagina || 0), paginas - 1);
      GUIA.res = {
        modo, texto, lista: todas.slice(pag * POR_PAGINA_GUIA, (pag + 1) * POR_PAGINA_GUIA), total: todas.length, pagina: pag, paginas,
        nota: notaFuenteMP(m, l)
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

  function fichaMPPorId(id) {
    for (const k of Object.keys(MEMORIA_MP)) {
      const f = MEMORIA_MP[k].fichas.find((x) => x.id === id);
      if (f) return f;
    }
    return null;
  }

  const lugarMP = (f) => [f.grupo, f.juris].filter(Boolean).join(' · ');

  function textoFichaMP(f) {
    const m = MP[f.id.indexOf('mpf-') === 0 ? 'fis' : 'def'];
    return [f.nombre, lugarMP(f), f.cargo ? m.cargo + ': ' + f.cargo : '', f.dir].concat(f.tel, f.mail ? [f.mail] : []).filter(Boolean).join('\n');
  }

  // Dirección, teléfonos y correo, uno por renglón.
  // Desde la 1.7.0 el botón del mapa va pegado a la dirección.
  const datosMPHTML = (f) => [f.dir ? esc(f.dir) + ' ' + botonMapaHTML(direccionMP(f)) : ''].concat(f.tel.map(esc), f.mail ? [correoHTML(f.mail)] : []).filter(Boolean).join('<br>');

  function filaMPHTML(f, m) {
    const lugar = lugarMP(f);
    return '<tr><td><b>' + esc(f.nombre) + '</b>' + (lugar ? '<div class="sj-sub">' + esc(lugar) + '</div>' : '') + '</td>' +
      '<td>' + esc(f.cargo) + '</td><td>' + datosMPHTML(f) + '</td>' +
      '<td class="sj-mp-bts"><button class="sj-b chico" data-a="mpCopiar" data-id="' + esc(f.id) + '" title="Copiar nombre, ' + esc(m.cargo.toLowerCase()) + ', dirección, teléfono y correo">Copiar</button>' +
      '<a class="sj-b chico" href="' + esc(f.enlace) + '" target="_blank" rel="noopener noreferrer" title="Abrir en ' + esc(m.dominio) + ', en una pestaña nueva">↗</a></td></tr>';
  }

  function resultadosMPHTML(R) {
    const m = MP[R.modo];
    let h = (R.segunPJN ? '<div class="sj-info sj-segun">' + esc(R.segunPJN) + '</div>' : '') + '<div class="sj-sec"><p class="sj-sol-txt">' + esc(R.nota) +
      ' <button class="sj-b chico" data-a="mpActualizar" title="Volver a bajar la lista del sitio">Actualizar</button></p>' +
      (R.pedido ? '' : '<p class="sj-sol-txt">' + esc(R.lista.length ? plural(R.total, 'resultado', 'resultados') + ' para "' + R.texto + '".' : 'No hay resultados para "' + R.texto + '".') + '</p>') + '</div>';
    if (!R.lista.length) return h;
    h += '<div class="sj-sec"><table class="sj-t"><thead><tr><th>' + (R.modo === 'fis' ? 'Fiscalía' : 'Defensoría') + '</th><th>' + esc(m.cargo) +
      '</th><th>Datos</th><th></th></tr></thead><tbody>' + R.lista.map((f) => filaMPHTML(f, m)).join('') + '</tbody></table></div>';
    return h;
  }

  function mpCopiar(id) {
    const f = fichaMPPorId(id);
    if (f) copiarTexto(textoFichaMP(f));
  }

  function mpActualizar() {
    const R = GUIA.res;
    if (R && R.pedido) guiaDeMP(R.pedido, true);
    else if (R && esModoMP(R.modo)) guiaBuscarMP(R.modo, R.texto, 0, true);
  }

  // --------------------------------------------------- desde Intervinientes
  //
  // La fiscalía o la defensoría que el PJN nombra en Intervinientes, buscada en
  // el directorio. El PJN abrevia ("FISCALIA ANTE TRIB. ORAL. EN LO CRIM. DE
  // CAP. FED. N° 1") y el directorio no ("Fiscalía N° 1 ante los Tribunales
  // Orales en lo Criminal y Correccional"): cada palabra del PJN tiene que ser
  // el comienzo de una palabra del nombre, en singular o en plural, y cada
  // número tiene que estar en el nombre. "De la Capital Federal" es la
  // jurisdicción y no parte del nombre: dejarla en la búsqueda hacía ganar a
  // las fiscalías y defensorías de lo Criminal Federal, que la llevan escrita en
  // el nombre. Cotejado el 30/09/2026 con los dos directorios reales.

  // Palabras que pueden faltar en el nombre del directorio sin descartarlo. El
  // PJN escribe "FISCALIA NAC. DE 1RA. INST. EN LO CIVIL Y COMERCIAL N° 2" y el
  // MPF, "Fiscalía en lo Civil y Comercial Nº 2" (relevado el 30/09/2026).
  const OPCIONALES_MP = new Set(['nacional', 'nacionales', 'nac', 'primera', 'primero', 'primer', 'inst', 'instancia']);
  // Abreviaturas del PJN que los directorios escriben enteras: "2DA. INST." es
  // "Segunda Instancia"; "DEFENSORA PUBLICA" es una defensoría.
  const EQUIVALENTES_MP = {
    '1ra': 'primera', '1era': 'primera', '1a': 'primera', '1ro': 'primero', '1er': 'primer',
    '2da': 'segunda', '2a': 'segunda', '2do': 'segundo', '3ra': 'tercera', '3a': 'tercera', '3ro': 'tercero',
    defensora: 'defensor'
  };
  const TITULOS_PERSONA = new Set(['dr', 'dra', 'dres', 'sr', 'sra', 'lic']);
  const CAPITAL_LARGA = 'ciudad autonoma de buenos aires';

  // Cuántas palabras, desde i, dicen "Capital Federal" (0 si no lo dicen).
  function largoCapital(pal, i) {
    const w = pal[i], sig = pal[i + 1] || '';
    if (/^(cap|capital)$/.test(w) && /^fed/.test(sig)) return 2;
    if (w === 'caba') return 1;
    if (pal.slice(i, i + 4).join(' ') === 'c a b a') return 4;
    if (pal.slice(i, i + 5).join(' ') === CAPITAL_LARGA) return 5;
    return 0;
  }

  // Quita de las palabras la mención de la Capital Federal y avisa si estaba.
  function sinCapital(pal) {
    const out = [];
    let capital = false;
    for (let i = 0; i < pal.length; i++) {
      const n = largoCapital(pal, i);
      if (n) { capital = true; i += n - 1; } else out.push(pal[i]);
    }
    return { pal: out, capital };
  }

  function tokensPedidoMP(txt) {
    const r = sinCapital(norm(txt).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean));
    const palabras = [], numeros = [];
    r.pal.forEach((w0) => {
      const w = Object.prototype.hasOwnProperty.call(EQUIVALENTES_MP, w0) ? EQUIVALENTES_MP[w0] : w0;
      if (/^\d+$/.test(w)) numeros.push(parseInt(w, 10));
      else if (!VACIAS_MP.has(w)) palabras.push(w);
    });
    return { palabras, numeros, capital: r.capital };
  }

  // La raíz para comparar singular y plural: "tribunales" → "tribunal",
  // "orales" → "oral". Las palabras cortas quedan como están.
  const raizMP = (w) => (w.length > 4 ? w.replace(/(es|s)$/, '') : w);
  // Si la palabra del PJN (w) es el comienzo de la del directorio (x).
  const cubreMP = (x, w) => x.indexOf(raizMP(w)) === 0;
  const hayMP = (lista, w) => lista.some((x) => cubreMP(x, w));
  const lugarDeFichaMP = (f) => tokensMP([f.grupo, f.juris].join(' ')).palabras;

  // Palabras y números del nombre de la ficha que el PJN no menciona.
  function sobranMP(cons, f) {
    const nom = tokensMP(f.nombre);
    return nom.palabras.filter((x) => !cons.palabras.some((w) => cubreMP(x, w))).length +
      nom.numeros.filter((x) => cons.numeros.indexOf(x) < 0).length;
  }

  // -1 si la ficha no corresponde a lo que nombra el PJN. Si corresponde:
  // cuántas palabras hubo que buscar fuera del nombre (en el grupo o en la
  // jurisdicción), en miles, más las que le sobran al nombre.
  function puntajePedidoMP(cons, f) {
    const nom = tokensMP(f.nombre);
    if (cons.numeros.some((x) => nom.numeros.indexOf(x) < 0)) return -1;
    const lugar = lugarDeFichaMP(f);
    let afuera = 0;
    for (const w of cons.palabras) {
      if (hayMP(nom.palabras, w) || OPCIONALES_MP.has(w)) continue;
      if (!hayMP(lugar, w)) return -1;
      afuera++;
    }
    return afuera * 1000 + sobranMP(cons, f);
  }

  // Cuántas palabras del PJN tiene la ficha, con los números exigidos. Sirve
  // cuando ninguna coincide del todo.
  function parecidoMP(cons, f) {
    const nom = tokensMP(f.nombre);
    if (cons.numeros.some((x) => nom.numeros.indexOf(x) < 0)) return 0;
    const todas = nom.palabras.concat(lugarDeFichaMP(f));
    return cons.palabras.filter((w) => !OPCIONALES_MP.has(w) && hayMP(todas, w)).length;
  }

  // Si el PJN dice "de la Capital Federal", quedan las de esa jurisdicción,
  // siempre que haya alguna.
  const enCapitalMP = (f) => norm(f.juris).indexOf('capital federal') === 0;
  function enCapitalSiCorresponde(cons, cand) {
    if (!cons.capital) return cand;
    const c = cand.filter((x) => enCapitalMP(x.f));
    return c.length ? c : cand;
  }

  // Las más parecidas: con al menos tres de cada cinco palabras del PJN.
  const TOPE_PARECIDAS_MP = 10;
  function fichasParecidasMP(fichas, cons) {
    const pedidas = cons.palabras.filter((w) => !OPCIONALES_MP.has(w)).length;
    if (pedidas < 2) return [];
    const minimo = Math.ceil(pedidas * 0.6);
    const cand = fichas.map((f, i) => ({ f, i, n: parecidoMP(cons, f) })).filter((x) => x.n >= minimo);
    return enCapitalSiCorresponde(cons, cand).map((x) => Object.assign(x, { s: sobranMP(cons, x.f) }))
      .sort((a, b) => b.n - a.n || a.s - b.s || a.i - b.i).slice(0, TOPE_PARECIDAS_MP).map((x) => x.f);
  }

  // Las palabras de un nombre de persona, sin títulos ni aclaraciones entre
  // paréntesis: "DR. PABLO TURANO (Subrogante)" → pablo, turano.
  function palabrasPersona(txt) {
    return norm(String(txt || '').replace(/\([^)]*\)/g, ' ')).replace(/[^a-z ]+/g, ' ').split(/\s+/)
      .filter((w) => w.length > 1 && !TITULOS_PERSONA.has(w) && !VACIAS_MP.has(w));
  }

  // Si la ficha nombra a la persona: todas sus palabras, enteras, entre quienes
  // están a cargo.
  const figuraPersonaMP = (pal, f) => { const c = tokensMP(f.cargo).palabras; return pal.length > 0 && pal.every((w) => c.indexOf(w) >= 0); };

  // Solo el nombre de la persona: las fichas en las que figura.
  function fichasDePersonaMP(fichas, persona) {
    const pal = palabrasPersona(persona);
    const l = pal.length ? fichas.filter((f) => figuraPersonaMP(pal, f)).slice(0, POR_PAGINA_GUIA) : [];
    return { tipo: l.length ? 'persona' : 'nada', lista: l };
  }

  // Entre las mejores empatadas, la que nombra a la persona, si es una sola.
  function desempatePersonaMP(mejores, persona) {
    const pal = palabrasPersona(persona);
    if (mejores.length < 2 || !pal.length) return mejores;
    const con = mejores.filter((x) => figuraPersonaMP(pal, x.f));
    return con.length === 1 ? con : mejores;
  }

  // Las fichas cuyo nombre corresponde del todo: la mejor, si es una sola
  // (tipo 'exacta'), o todas, de la mejor a la peor ('varias', o 'general' si
  // el nombre es demasiado corto para elegir). null si ninguna corresponde.
  function fichasPorNombreMP(fichas, cons, persona) {
    const cand = enCapitalSiCorresponde(cons, fichas.map((f, i) => ({ f, i, p: puntajePedidoMP(cons, f) })).filter((x) => x.p >= 0))
      .sort((a, b) => a.p - b.p || a.i - b.i);
    if (!cand.length) return null;
    const mejores = desempatePersonaMP(cand.filter((x) => x.p === cand[0].p), persona);
    // Un nombre corto y sin número ("TERCERO | DEFENSORIA DE CAMARA", relevado
    // el 30/09/2026) no alcanza para elegir una sola: se muestran las posibles.
    const preciso = cons.numeros.length > 0 || cons.palabras.filter((w) => !OPCIONALES_MP.has(w)).length >= 3;
    const lista = cand.map((x) => x.f).slice(0, POR_PAGINA_GUIA);
    if (!preciso) return { tipo: 'general', lista };
    if (mejores.length === 1) return { tipo: 'exacta', lista: [mejores[0].f] };
    return { tipo: 'varias', lista };
  }

  // Las fichas que corresponden a lo que nombra el PJN, y de qué tipo es el
  // resultado: 'exacta' o 'varias' (ver fichasPorNombreMP), 'parecidas'
  // (ninguna coincide del todo), 'porPersona' (ninguna se parece, pero el
  // directorio nombra a la persona), 'persona' (el PJN da solo el nombre de la
  // persona) o 'nada'.
  function fichasDelPedido(fichas, pedido) {
    if (!limpio(pedido.nombre)) return fichasDePersonaMP(fichas, pedido.persona);
    const cons = tokensPedidoMP(pedido.nombre);
    if (!cons.palabras.length && !cons.numeros.length) return { tipo: 'nada', lista: [] };
    const r = fichasPorNombreMP(fichas, cons, pedido.persona);
    if (r) return r;
    const parecidas = fichasParecidasMP(fichas, cons);
    if (parecidas.length) return { tipo: 'parecidas', lista: parecidas };
    const p = fichasDePersonaMP(fichas, pedido.persona);
    return p.lista.length ? { tipo: 'porPersona', lista: p.lista } : { tipo: 'nada', lista: [] };
  }

  // Lo que queda en el buscador de la Guía: las palabras que se buscaron.
  function textoDePedido(pedido) {
    if (!limpio(pedido.nombre)) return palabrasPersona(pedido.persona).join(' ');
    const cons = tokensPedidoMP(pedido.nombre);
    return cons.palabras.concat(cons.numeros.map(String)).join(' ');
  }

  // Qué dice el PJN y qué se encontró.
  function notaPedidoMP(pedido, r) {
    const m = MP[pedido.modo];
    const en = pedido.origen ? 'en ' + pedido.origen + ' ' : '';
    const nombre = limpio(pedido.nombre), persona = limpio(pedido.persona);
    const quien = nombre ? nombre + (persona ? ', con ' + persona : '') : persona + ', sin indicar la ' + (pedido.modo === 'fis' ? 'fiscalía' : 'defensoría');
    const n = r.lista.length;
    const sigue = {
      exacta: '',
      varias: ' Hay ' + n + ' fichas posibles en el ' + m.sigla + ': elegí la que corresponde.',
      general: ' Ese nombre no alcanza para estar seguro: ' + (n === 1 ? 'esta es la única ficha del ' + m.sigla + ' que coincide; comprobá que sea la que corresponde.'
        : 'estas son las fichas del ' + m.sigla + ' que coinciden. Elegí la que corresponde.'),
      parecidas: ' El ' + m.sigla + ' no publica una ficha con ese nombre: ' + (n === 1 ? 'esta es la más parecida' : 'estas son las más parecidas') + '. Elegí la que corresponde.',
      persona: ' ' + (n === 1 ? 'Esta es la ficha' : 'Estas son las fichas') + ' del ' + m.sigla + ' en ' + (n === 1 ? 'la' : 'las') + ' que figura.',
      porPersona: ' El ' + m.sigla + ' no publica una ficha con ese nombre: ' + (n === 1 ? 'esta es la ficha en la que figura ' : 'estas son las fichas en las que figura ') + persona + '.',
      nada: nombre ? ' El ' + m.sigla + ' no publica una ficha que corresponda. Probá buscarla con otras palabras.'
        : ' El ' + m.sigla + ' no la nombra en ninguna ficha.'
    }[r.tipo];
    return 'Según el PJN, ' + en + 'interviene ' + quien + '.' + sigue;
  }

  // Abre en la solapa Guía la ficha de la fiscalía o de la defensoría que
  // nombra una fila de Intervinientes. pedido: { modo, nombre, persona, origen }.
  async function guiaDeMP(pedido, forzar) {
    const m = MP[pedido.modo];
    const gen = ++GUIA.gen;
    GUIA.modo = pedido.modo;
    GUIA.texto = textoDePedido(pedido);
    GUIA.estado = 'leyendo';
    GUIA.txt = (MEMORIA_MP[pedido.modo] && !forzar) ? 'Buscando ' + (limpio(pedido.nombre) || limpio(pedido.persona)) + '...'
      : 'Bajando la lista de ' + m.plural + ' de ' + m.dominio + '...';
    GUIA.pila = [];
    if (VISTA === 'guia') pintarGuia(); else irAVista('guia');
    try {
      const l = await listaMP(pedido.modo, forzar);
      if (gen !== GUIA.gen) return;
      const r = fichasDelPedido(l.fichas, pedido);
      GUIA.res = {
        modo: pedido.modo, texto: GUIA.texto, lista: r.lista, total: r.lista.length, pagina: 0, paginas: 1, pedido,
        segunPJN: notaPedidoMP(pedido, r), nota: notaFuenteMP(m, l)
      };
      GUIA.vista = 'res';
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

  // (1.5.3) Los datos de la fiscalía o de la defensoría pedidos desde
  // Intervinientes se abren en una pestaña nueva, para no dejar el expediente.
  // El pedido pasa a la pestaña nueva por el almacén, con una marca de un solo
  // uso en la dirección.
  const MARCA_MP = /#supjn-mp=([a-z0-9]+)$/;

  // Los pedidos van por marca (1.6.3): hasta la 1.6.2 había uno solo, y dos
  // clics seguidos hacían que la primera pestaña no encontrara el suyo. Los de
  // más de un minuto se descartan, y el de una pestaña bloqueada también.
  function encargosMPVigentes() {
    const e = leerAlmacen(K_ENCARGO_MP, null);
    const out = {};
    if (e && typeof e === 'object' && !e.marca) Object.keys(e).forEach((m) => { if (e[m] && Date.now() - (e[m].ts || 0) <= 60000) out[m] = e[m]; });
    return out;
  }

  function abrirMPEnPestana(pedido) {
    const marca = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const E = encargosMPVigentes();
    E[marca] = { pedido, ts: Date.now() };
    guardarAlmacen(K_ENCARGO_MP, E);
    const w = window.open(RUTA.rel + '#supjn-mp=' + marca, '_blank');
    if (w) return;
    const F = encargosMPVigentes();
    delete F[marca];
    guardarAlmacen(K_ENCARGO_MP, F);
    avisar('Chrome bloqueó la pestaña nueva. Permití las ventanas emergentes de scw.pjn.gov.ar y probá de nuevo.', true);
  }

  // En la pestaña nueva: el pedido, si la dirección trae su marca y es reciente.
  function tomarEncargoMP() {
    const m = MARCA_MP.exec(location.hash || '');
    if (!m) return null;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* queda la marca en la dirección */ }
    const E = encargosMPVigentes();
    const e = E[m[1]];
    delete E[m[1]];
    guardarAlmacen(K_ENCARGO_MP, E);
    return (e && e.pedido) || null;
  }

  function mpInterviniente(b) {
    const gi = b.dataset.g === 'p' ? 'p' : parseInt(b.dataset.g, 10);
    const p = pedidoInterviniente(gi, parseInt(b.dataset.f, 10));
    if (!p) { avisar('No se reconoce la fiscalía o la defensoría de esa fila.', true); return; }
    abrirMPEnPestana(Object.assign({ origen: EXP.datos ? EXP.datos.exp : '' }, p));
  }

  // ------------------------------------------------- 8.6 la consulta pública
  //
  // Ver LA CONSULTA PÚBLICA al comienzo del archivo. La solapa busca causas por
  // el nombre de una parte o por número: primero entre las causas ya leídas de
  // Mis causas y Favoritos, sin pedirle nada al PJN, y después en la consulta
  // pública, fuero por fuero, cada uno en su propio marco oculto. Todo es de
  // lectura. Lo escrito y lo encontrado quedan solo en memoria mientras dure la
  // página, porque pueden ser datos de un cliente; de la configuración se
  // guardan únicamente los fueros elegidos.

  // Los 28 fueros de la consulta pública, en el orden del PJN, con el grupo en
  // el que se los ofrece para elegir.
  const FUEROS_CP = [
    ['CSJ', 'Corte Suprema', 'otros'], ['CIV', 'Civil', 'cap'], ['CAF', 'Contencioso Administrativo Federal', 'cap'],
    ['CCF', 'Civil y Comercial Federal', 'cap'], ['CNE', 'Electoral', 'otros'], ['CSS', 'Seguridad Social', 'cap'],
    ['CPE', 'Penal Económico', 'pen'], ['CNT', 'Trabajo', 'cap'], ['CFP', 'Criminal y Correccional Federal', 'pen'],
    ['CCC', 'Criminal y Correccional', 'pen'], ['COM', 'Comercial', 'cap'], ['CPF', 'Casación Penal Federal', 'pen'],
    ['CPN', 'Casación Penal Nacional', 'pen'], ['FBB', 'Bahía Blanca', 'int'], ['FCR', 'Comodoro Rivadavia', 'int'],
    ['FCB', 'Córdoba', 'int'], ['FCT', 'Corrientes', 'int'], ['FGR', 'General Roca', 'int'], ['FLP', 'La Plata', 'int'],
    ['FMP', 'Mar del Plata', 'int'], ['FMZ', 'Mendoza', 'int'], ['FPO', 'Posadas', 'int'], ['FPA', 'Paraná', 'int'],
    ['FRE', 'Resistencia', 'int'], ['FSA', 'Salta', 'int'], ['FRO', 'Rosario', 'int'], ['FSM', 'San Martín', 'int'], ['FTU', 'Tucumán', 'int']
  ].map(([sigla, nombre, grupo]) => ({ sigla, nombre, grupo }));
  const GRUPOS_CP = [
    ['cap', 'Capital Federal'], ['int', 'Justicia federal del interior'], ['otros', 'Corte Suprema y Electoral'],
    ['pen', 'Penal (el PJN no muestra las causas penales en la consulta pública)']
  ];
  const FUEROS_CP_DEF = ['CIV', 'CAF', 'CCF', 'CSS', 'CNT', 'COM'];
  const MINIMO_LETRAS_CP = 6;         // lo que exige el PJN para buscar por parte
  const TOPE_PAGINAS_CP = 40;         // 600 causas por fuero, de a 15
  const ESPERA_CP = 180000;           // el PJN avisa que una consulta "puede demorar algunos minutos"
  const ESPERA_DESAFIO_CP = 10 * 60 * 1000;
  const POR_PAGINA_CP = 50;

  const CP = {
    texto: '', tipo: '', juicio: '', filtro: '',
    estado: 'nada',                 // nada | buscando | listo
    aviso: '', gen: 0, cortar: false,
    consulta: null, fueros: [], propias: [], filas: [],
    orden: { col: '', desc: false }, pagina: 1,
    marcos: {}                      // sigla -> { fr, pagina }: la lista del PJN, para abrir sus causas
  };

  // Lo guardado en la configuración, si es una lista de siglas (ver 5.7).
  function fuerosGuardadosCP(x) {
    return listaDeTextos(x) ? x : null;
  }

  // Los fueros elegidos, en el orden del PJN. Sin elección guardada, los de
  // Capital que no son penales.
  function fuerosElegidosCP() {
    const guardados = Array.isArray(CFG.cpFueros) ? CFG.cpFueros : FUEROS_CP_DEF;
    return FUEROS_CP.map((f) => f.sigla).filter((s) => guardados.indexOf(s) >= 0);
  }

  // --- lo que se escribe

  // El PJN rechaza la Ñ, las tildes, las comas y los guiones ("no se admiten
  // caracteres especiales"), pero encuentra a MUÑOZ buscando MUNOZ. Admite
  // letras, números, espacios y el apóstrofo (O'CONNOR).
  function nombreParaPJN(t) {
    return limpio(String(t == null ? '' : t).toUpperCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Z0-9' ]+/g, ' '));
  }
  const letrasDe = (t) => (String(t || '').match(/[A-Z0-9]/g) || []).length;

  // "CIV 12345/2024", "civ-012345/2024", "12345/2024": la sigla es optativa.
  // Lo que venga después del año (un incidente, "/1") no se puede consultar
  // por número en el PJN: se busca la causa principal.
  function numeroBuscado(t) {
    const m = /^\s*(?:([A-Za-z]{3})[\s-]*)?0*(\d{1,7})\s*\/\s*(\d{4})(?:\s*\/\s*\S+)?\s*$/.exec(t || '');
    return m ? { sigla: (m[1] || '').toUpperCase(), num: parseInt(m[2], 10), anio: parseInt(m[3], 10) } : null;
  }

  // El objeto del juicio es lo que sigue a la primera "s/" de la carátula:
  // "... C/ ... S/DAÑOS Y PERJUICIOS(ACC.TRAN. C/LES. O MUERTE)".
  function objetoDe(car) {
    const m = /(?:^|\s)s\/\s*(.*)$/i.exec(limpio(car));
    return m ? m[1] : '';
  }
  // El tipo de juicio, para agruparlos: el objeto hasta el primer paréntesis o
  // la "s/" siguiente ("QUIEBRA S/INCIDENTE DE SUBASTA" es QUIEBRA).
  function tipoDeJuicio(car) {
    return limpio(objetoDe(car).split(/\(|\s+s\//i)[0]).replace(/[\s:.,;-]+$/, '').toUpperCase();
  }

  // Cada palabra buscada tiene que ser el comienzo de alguna palabra del texto,
  // sin distinguir mayúsculas, tildes ni la Ñ.
  const palabrasDe = (t) => norm(t).split(/[^a-z0-9]+/).filter(Boolean);
  function tienePalabras(buscado, texto) {
    const b = palabrasDe(buscado);
    if (!b.length) return true;
    const t = palabrasDe(texto);
    return b.every((w) => t.some((x) => x.indexOf(w) === 0));
  }

  // --- qué se busca

  function consultaCP() {
    const texto = limpio(CP.texto), juicio = limpio(CP.juicio);
    const n = numeroBuscado(texto);
    if (n) return consultaPorNumeroCP(n);
    if (texto) return consultaPorNombreCP(texto);
    if (juicio) return { modo: 'juicio', texto: '', fueros: [], publica: false };
    return { error: 'Escribí el nombre de una parte, un número de expediente o un tipo de juicio.' };
  }

  function consultaPorNumeroCP(n) {
    if (n.sigla && !FUEROS_CP.some((f) => f.sigla === n.sigla)) return { error: 'La consulta pública del PJN no tiene el fuero ' + n.sigla + '. Los fueros son los de la lista "Fueros".' };
    const fueros = n.sigla ? [n.sigla] : fuerosElegidosCP();
    if (!fueros.length) return { error: 'Elegí al menos un fuero en "Fueros", o escribí la sigla con el número (por ejemplo, CIV 12345/2024).' };
    return { modo: 'numero', texto: (n.sigla ? n.sigla + ' ' : '') + n.num + '/' + n.anio, sigla: n.sigla, num: n.num, anio: n.anio, fueros, publica: true };
  }

  function consultaPorNombreCP(texto) {
    const nombre = nombreParaPJN(texto);
    if (letrasDe(nombre) < MINIMO_LETRAS_CP) return { error: 'El PJN pide al menos ' + MINIMO_LETRAS_CP + ' letras para buscar por nombre. Escribí el apellido completo.' };
    const fueros = fuerosElegidosCP();
    if (!fueros.length) return { error: 'Elegí al menos un fuero en "Fueros".' };
    return { modo: 'parte', texto, nombre, tipo: CP.tipo, fueros, publica: true };
  }

  // --- en las causas propias

  // Mis causas y Favoritos juntas, sin repetir, con la lista en la que está cada una.
  function causasPropiasCP() {
    const out = new Map();
    ['rel', 'fav'].forEach((t) => {
      if (!DATOS[t]) return;
      DATOS[t].causas.forEach((c) => {
        const x = out.get(c.exp);
        if (x) x.listas.push(t); else out.set(c.exp, { c, listas: [t] });
      });
    });
    return [...out.values()];
  }

  function coincidePropiaCP(consulta, c) {
    if (consulta.modo === 'numero') {
      const p = partesExp(c.exp);
      return !!p && p.num === consulta.num && p.anio === consulta.anio && (!consulta.sigla || p.sigla === consulta.sigla);
    }
    return consulta.modo !== 'parte' || tienePalabras(consulta.texto, c.car);
  }

  function propiasCP(consulta) {
    return causasPropiasCP().filter((x) => coincidePropiaCP(consulta, x.c))
      .map((x) => ({ exp: x.c.exp, car: x.c.car, dep: x.c.dep, sit: x.c.sit, ult: x.c.ult, listas: x.listas }));
  }

  // --- la búsqueda

  const nuevoFueroCP = (sigla) => ({ sigla, estado: 'espera', n: 0, txt: '', nota: '', saltar: false, tope: false, ctl: null });

  function cpBuscar() {
    if (bloqueoNota()) { avisar('Hay un lote de notas en curso: la página se recarga en cada nota. Buscá cuando termine.', true); return; }
    if (CP.estado === 'buscando') { avisar('Hay una búsqueda en curso: detenela para empezar otra.', true); return; }
    const consulta = consultaCP();
    if (consulta.error) { CP.aviso = consulta.error; pintarCP(); return; }
    olvidarMarcosCP();
    const gen = ++CP.gen;
    consulta.escrito = limpio(CP.texto);
    CP.consulta = consulta;
    CP.propias = propiasCP(consulta);
    CP.aviso = avisoDeConsultaCP(consulta);
    // Con la sigla y la causa entre las propias, no hace falta preguntarle al
    // PJN. Un incidente propio con ese número no alcanza: la causa principal
    // puede no estar en las listas.
    if (consulta.modo === 'numero' && consulta.sigla && CP.propias.some((x) => !esIncidenteCP(x.exp))) {
      consulta.publica = false;
      CP.aviso = 'La causa está en tus causas: no hizo falta consultar al PJN.';
    }
    CP.filas = [];
    CP.filtro = '';
    CP.pagina = 1;
    CP.orden = { col: '', desc: false };
    CP.cortar = false;
    CP.fueros = consulta.publica ? consulta.fueros.map(nuevoFueroCP) : [];
    CP.estado = CP.fueros.length ? 'buscando' : 'listo';
    pintarCP();
    if (CP.fueros.length) recorrerFuerosCP(gen, CP.fueros);
  }

  function avisoDeConsultaCP(consulta) {
    if (consulta.modo === 'juicio') return 'La consulta pública del PJN exige el nombre de una parte: sin nombre, el tipo de juicio se busca solo en tus causas.';
    if (!DATOS.rel && !DATOS.fav) return 'Todavía no se leyeron Mis causas ni Favoritos: la búsqueda en tus causas va a aparecer vacía.';
    return '';
  }

  async function recorrerFuerosCP(gen, lista) {
    for (const f of lista) {
      if (gen !== CP.gen) return;
      if (CP.cortar) { f.estado = 'cortado'; f.txt = 'no se consultó'; continue; }
      await buscarEnFueroCP(f, gen);
      if (gen !== CP.gen) return;
      pintarResultadosCP();
    }
    if (gen !== CP.gen) return;
    CP.estado = 'listo';
    CP.cortar = false;
    pintarCP();
  }

  async function buscarEnFueroCP(f, gen) {
    Object.assign(f, { estado: 'buscando', n: 0, txt: 'abriendo la consulta pública', nota: '', saltar: false, tope: false });
    quitarFueroCP(f.sigla);
    pintarProgresoCP();
    const fr = crearMarco();
    let res = null;
    try {
      res = await consultarFueroCP(fr, f, gen);
      if (gen === CP.gen) aplicarResultadoCP(f, res);
    } catch (e) {
      anotarFallaCP(f, gen, e);
    } finally {
      if (res && res.marco && gen === CP.gen) {
        // Si mientras tanto se abrió una causa con una lista nueva de este
        // fuero, esa lista se reemplaza por la leída entera.
        const viejo = CP.marcos[f.sigla];
        if (viejo && viejo.fr !== fr) viejo.fr.remove();
        CP.marcos[f.sigla] = { fr, pagina: res.pagina };
      } else fr.remove();
    }
    pintarProgresoCP();
  }

  function anotarFallaCP(f, gen, e) {
    const detenido = interrumpidoCP(f, gen);
    f.estado = detenido ? 'cortado' : 'error';
    f.txt = detenido ? (f.saltar ? 'salteado' : 'detenido') : mensajeDe(e);
    // Con la sesión vencida no tiene sentido seguir con los otros fueros.
    if (!detenido && mensajeDe(e) === VENCIDA) { CP.cortar = true; CP.aviso = mayuscula(VENCIDA) + '.'; }
  }

  // Lanza si hay que dejar el fuero: se detuvo todo, se lo salteó o empezó
  // otra búsqueda.
  const interrumpidoCP = (f, gen) => gen !== CP.gen || CP.cortar || f.saltar;
  function paradaCP(f, gen) {
    if (interrumpidoCP(f, gen)) throw new Error('detenido');
  }

  async function consultarFueroCP(fr, f, gen) {
    const C = CP.consulta;
    await abrirFormularioCP(fr);
    paradaCP(f, gen);
    if (C.modo === 'numero') await completarNumeroCP(fr, f, C);
    else await completarParteCP(fr, f, C);
    paradaCP(f, gen);
    await desafioCP(fr, f, () => interrumpidoCP(f, gen));
    f.txt = 'consultando';
    pintarProgresoCP();
    const r = await enviarCP(fr, C.modo, f);
    paradaCP(f, gen);
    return leerRespuestaCP(fr, f, gen, r);
  }

  // --- el formulario del PJN, en el marco

  const esFormPublica = (d) => !!d.getElementById(PJN.publica.form);

  function abrirFormularioCP(fr) {
    return esperarCarga(fr, () => { fr.src = PJN.publica.ruta; }, esFormPublica);
  }

  // Los campos de "Por parte" recién existen después de tocar la cabecera de
  // su solapa: el PJN los trae por AJAX.
  async function pasarAPorParteCP(fr) {
    const P = PJN.publica;
    if (fr.contentDocument.getElementById(P.parte.camara)) return;
    const cab = fr.contentDocument.getElementById(P.cabParte);
    if (!cab) throw new Error('el formulario del PJN no tiene la solapa "Por parte"');
    cab.click();
    if (!(await esperarA(() => fr.contentDocument.getElementById(P.parte.camara), 20000))) throw new Error('el PJN no abrió la solapa "Por parte"');
  }

  // La opción de un fuero, por su sigla: "CIV - Cámara Nacional de Apelaciones en lo Civil".
  function opcionDeFuero(sel, sigla) {
    return [...sel.options].find((o) => limpio(o.textContent).split(/\s|-/)[0] === sigla) || null;
  }

  async function elegirCamaraCP(fr, id, sigla, redibuja) {
    const d = fr.contentDocument, w = fr.contentWindow;
    const sel = d.getElementById(id);
    if (!sel) throw new Error('el formulario del PJN no tiene la lista de jurisdicciones');
    const op = opcionDeFuero(sel, sigla);
    if (!op) throw new Error('el PJN no ofrece ' + sigla + ' en la lista de jurisdicciones');
    const tipoAntes = d.getElementById(PJN.publica.parte.tipo);
    sel.value = op.value;
    sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    // Por parte, el PJN redibuja el tipo de parte y la leyenda al elegir la
    // jurisdicción (en Trabajo deja fijo DEMANDADO). Se espera a que termine
    // para que no borre lo que se cargue después: si no termina, se consultaría
    // sin el tipo de parte elegido.
    if (redibuja && !(await esperarA(() => fr.contentDocument.getElementById(PJN.publica.parte.tipo) !== tipoAntes, 15000))) {
      throw new Error('el PJN no terminó de preparar el formulario para ' + sigla);
    }
  }

  async function completarParteCP(fr, f, C) {
    const P = PJN.publica.parte;
    await pasarAPorParteCP(fr);
    await elegirCamaraCP(fr, P.camara, f.sigla, true);
    const d = fr.contentDocument;
    f.nota = limpio((d.getElementById(P.leyenda) || {}).textContent);
    ponerTipoCP(d, f, C.tipo);
    const campo = d.getElementById(P.nombre);
    if (!campo) throw new Error('el formulario del PJN no tiene el campo de la parte');
    campo.value = C.nombre;
  }

  // El tipo de parte es optativo. En Trabajo el PJN lo deja fijo en DEMANDADO:
  // se consulta igual, y la leyenda del PJN queda como nota del fuero.
  function ponerTipoCP(d, f, tipo) {
    const sel = d.getElementById(PJN.publica.parte.tipo);
    if (!tipo || !sel || sel.disabled) return;
    if (![...sel.options].some((o) => o.value === tipo)) throw new Error('el PJN no ofrece el tipo de parte ' + tipo + ' en este fuero');
    sel.value = tipo;
  }

  async function completarNumeroCP(fr, f, C) {
    const N = PJN.publica.numero;
    await elegirCamaraCP(fr, N.camara, f.sigla, false);
    const d = fr.contentDocument;
    const num = d.getElementById(N.numero), anio = d.getElementById(N.anio);
    if (!num || !anio) throw new Error('el formulario del PJN no tiene los campos de número y año');
    num.value = String(C.num);
    anio.value = String(C.anio);
  }

  // --- el desafío (captcha)
  //
  // Con la sesión iniciada el PJN no lo pide (relevado el 30/09/2026). Si algún
  // día lo pide, el marco se muestra sobre la ventana y SuPJN+ espera a que el
  // usuario lo resuelva: no lo resuelve ni lo saltea. Recién cuando el PJN lo
  // da por aprobado (llena su campo de respuesta), se consulta.

  const respuestaDesafioCP = (fr) => { const i = fr.contentDocument && fr.contentDocument.getElementById(PJN.publica.respuestaDesafio); return !!(i && i.value); };

  // El desafío que está en pantalla: { fr, f, cancelado }. De a uno por vez;
  // si otra consulta (un fuero o la apertura de una causa) también lo pide,
  // espera a que se resuelva el primero.
  let desafioEnPantallaCP = null;

  // cortado: cuándo dejar de esperar (en la búsqueda, si se la detuvo, se
  // salteó el fuero o empezó otra). Los botones del cartel actúan sobre el
  // desafío que se ve. f.abrir es la causa, cuando el desafío es para abrirla.
  async function desafioCP(fr, f, cortado) {
    if (!fr.contentDocument.querySelector(PJN.publica.desafio)) return;
    const d = { fr, f, cancelado: false };
    const fin = () => d.cancelado || cortado();
    f.estado = 'desafio';
    f.txt = 'el PJN pide resolver un desafío';
    pintarProgresoCP();
    try {
      await esperarA(() => fin() || !desafioEnPantallaCP, ESPERA_DESAFIO_CP, 400);
      if (!fin() && !desafioEnPantallaCP) {
        desafioEnPantallaCP = d;
        mostrarDesafioCP(d);
        await esperarA(() => fin() || respuestaDesafioCP(fr), ESPERA_DESAFIO_CP, 400);
      }
    } finally {
      if (desafioEnPantallaCP === d) { desafioEnPantallaCP = null; ocultarDesafioCP(fr); }
    }
    if (fin()) throw new Error(f.abrir ? 'quedó sin resolver el desafío del PJN' : 'detenido');
    if (!respuestaDesafioCP(fr)) throw new Error('el desafío del PJN no se resolvió en ' + ESPERA_DESAFIO_CP / 60000 + ' minutos');
    f.estado = 'buscando';
  }

  function cajaDesafioCP() {
    let caja = document.getElementById('supjn-desafio');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'supjn-desafio';
      caja.addEventListener('click', alClicEnDesafioCP);
      document.body.appendChild(caja);
    }
    return caja;
  }

  function mostrarDesafioCP(d) {
    const { fr, f } = d;
    const caja = cajaDesafioCP();
    const botones = f.abrir ? '<button type="button" data-d="cancelar">No abrir la causa</button>'
      : '<button type="button" data-d="saltar">Saltear este fuero</button><button type="button" data-d="detener">Detener la búsqueda</button>';
    caja.innerHTML = '<b>SuPJN+ · Consulta pública</b><p>El PJN pide resolver un desafío para ' + esc(f.abrir ? 'abrir ' + f.abrir : 'buscar en ' + f.sigla) +
      '. Resolvelo acá abajo, en la página del PJN: cuando el PJN lo apruebe, SuPJN+ sigue solo. SuPJN+ no resuelve ni saltea desafíos.</p>' +
      '<div class="bts">' + botones + '</div>';
    caja.style.display = '';
    fr.dataset.estilo = fr.style.cssText;
    fr.style.cssText = '';
    fr.classList.add('supjn-desafio-marco');
    fr.removeAttribute('aria-hidden');
    fr.tabIndex = 0;
    try {
      const c = fr.contentDocument.querySelector(PJN.publica.desafio);
      if (c) fr.contentWindow.scrollTo(0, Math.max(0, c.getBoundingClientRect().top + fr.contentWindow.scrollY - 160));
    } catch (e) { /* se ve igual, desde arriba */ }
  }

  function ocultarDesafioCP(fr) {
    const caja = document.getElementById('supjn-desafio');
    if (caja) caja.style.display = 'none';
    fr.classList.remove('supjn-desafio-marco');
    fr.style.cssText = fr.dataset.estilo || '';
    fr.setAttribute('aria-hidden', 'true');
    fr.tabIndex = -1;
  }

  function alClicEnDesafioCP(e) {
    const b = e.target.closest && e.target.closest('[data-d]');
    const d = desafioEnPantallaCP;
    if (!b || !d) return;
    if (b.dataset.d === 'detener') detenerCP();
    else d.f.saltar = true;
    d.cancelado = true;
    pintarProgresoCP();
  }

  // --- la consulta y la respuesta

  // Hace con fetch, desde el marco, lo mismo que el botón Consultar del PJN.
  // El PJN contesta con una redirección a una dirección http://: con la
  // política de permitirUpgrade el navegador la sigue por https (ver 3.2).
  // f: el fuero de la búsqueda, para que Saltear y Detener corten el pedido.
  function enviarCP(fr, modo, f) {
    const P = PJN.publica, d = fr.contentDocument, w = fr.contentWindow;
    const form = d.getElementById(P.form);
    const boton = d.getElementById(modo === 'numero' ? P.numero.boton : P.parte.boton);
    if (!form || !boton) throw new Error('el formulario del PJN no tiene el botón Consultar');
    const cuerpo = new w.URLSearchParams();
    new w.FormData(form).forEach((v, k) => { if (typeof v === 'string') cuerpo.append(k, v); });
    paresDelBotonCP(boton).forEach(([k, v]) => cuerpo.append(k, v));
    permitirUpgrade(d);
    // Cada consulta abre una conversación nueva en el PJN, y el PJN puede dar
    // por vencidas las anteriores (relevado el 30/09/2026): la lista del marco
    // de trabajo (3.4) se vuelve a pedir la próxima vez que haga falta.
    MT.ts = 0;
    return pedirCP(w, form.action, cuerpo, f);
  }

  // El botón de número es un enlace de JSF, con sus propios parámetros; el de
  // parte, un botón común que manda su nombre y su valor.
  function paresDelBotonCP(boton) {
    const p = paramsDeEnlace(boton);
    return p ? p.pares : [[boton.name, boton.value]];
  }

  async function pedirCP(w, url, cuerpo, f) {
    const ctl = new w.AbortController();
    const vence = setTimeout(() => ctl.abort(), ESPERA_CP);
    if (f) f.ctl = ctl;
    try {
      const r = await w.fetch(url, {
        method: 'POST', body: cuerpo, credentials: 'include', signal: ctl.signal,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (!r.ok) throw new Error('el PJN respondió con error ' + r.status);
      return { url: r.url, html: await r.text() };
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('el PJN no respondió en ' + ESPERA_CP / 60000 + ' minutos', { cause: e });
      if (e && /^el PJN respondió/.test(e.message)) throw e;
      throw new Error('el PJN no respondió (si la sesión venció, recargá la página)', { cause: e });
    } finally {
      clearTimeout(vence);
      if (f && f.ctl === ctl) f.ctl = null;
    }
  }

  // Una dirección del mismo sitio, o null.
  function dirDelPJN(u) {
    let x;
    try { x = new URL(u); } catch (e) { return null; }
    return x.origin === location.origin ? x : null;
  }

  // Los mensajes del PJN de una página, sin repetir.
  function mensajesCP(doc) {
    const vistos = [];
    doc.querySelectorAll(PJN.publica.mensajes).forEach((e) => {
      const t = limpio(e.textContent);
      if (t && vistos.indexOf(t) < 0) vistos.push(t);
    });
    return vistos.join(' ');
  }

  // Lo que devolvió el PJN: la lista de resultados, el expediente (por número),
  // o el formulario con un mensaje (sin resultados, o un dato que no aceptó).
  function leerRespuestaCP(fr, f, gen, r) {
    const doc = new DOMParser().parseFromString(r.html, 'text/html');
    const dir = dirDelPJN(r.url);
    if (!dir) throw new Error('el PJN respondió desde otra dirección');
    if (doc.querySelector('input[type=password]')) throw new Error(VENCIDA);
    if (PJN.enExpediente.test(dir.pathname)) return leerExpedienteCP(fr, dir.href);
    if (PJN.publica.dirResultados.test(dir.pathname) && tablaDe(doc)) return leerListaCP(fr, f, gen, dir.href);
    return sinListaCP(doc);
  }

  // Sin tabla: "No se han encontrado expedientes", "Expediente inexistente o
  // no disponible para su consulta pública", o un error del formulario.
  function sinListaCP(doc) {
    const msj = mensajesCP(doc);
    const texto = limpio(textoPJN(doc));
    if (PJN.publica.vacia.test(texto) || /inexistente|no disponible/i.test(msj)) return { tipo: 'vacia', nota: msj };
    if (msj) throw new Error('el PJN dice: ' + msj);
    throw new Error('el PJN devolvió una página que SuPJN+ no reconoce');
  }

  async function leerExpedienteCP(fr, url) {
    await esperarCarga(fr, () => { fr.src = url; }, esExpediente);
    const x = datosExpediente(fr.contentDocument);
    if (!x.exp) throw new Error('el PJN abrió una página de expediente sin número');
    return { tipo: 'lista', completa: true, marco: false, filas: [{ exp: x.exp, dep: x.dep, car: x.car, sit: x.sit, ult: '', pag: 0 }] };
  }

  // Recorre la lista del PJN con "Siguiente". El PJN no dice cuántas son ni en
  // qué página está: se sigue mientras haya "Siguiente", hasta el tope.
  async function leerListaCP(fr, f, gen, url) {
    await esperarCarga(fr, () => { fr.src = url; }, (d) => !!tablaDe(d));
    const filas = [], vistas = new Set();
    for (let pag = 1; ; pag++) {
      sumarPaginaCP(fr.contentDocument, pag, filas, vistas);
      f.txt = 'leyendo: ' + plural(filas.length, 'causa', 'causas');
      pintarProgresoCP();
      const sig = enlacePaginaCP(fr.contentDocument, PJN.publica.siguiente);
      const tope = pag >= TOPE_PAGINAS_CP;
      if (!sig || tope || interrumpidoCP(f, gen)) return { tipo: 'lista', filas, completa: !sig, tope: !!sig && tope, marco: true, pagina: pag };
      // Cortado mientras cambiaba de página: queda lo leído, y el marco no se
      // guarda porque no se sabe en qué página quedó.
      if (!(await pasarPaginaCP(fr, sig, () => interrumpidoCP(f, gen)))) return { tipo: 'lista', filas, completa: false, tope: false, marco: false };
    }
  }

  function sumarPaginaCP(doc, pag, filas, vistas) {
    filasDe(doc).forEach((x) => {
      if (vistas.has(x.exp)) return;
      vistas.add(x.exp);
      filas.push({ exp: x.exp, dep: x.dep, car: x.car, sit: x.sit, ult: x.ult, pag });
    });
  }

  function enlacePaginaCP(doc, re) {
    const ul = paginadorDe(doc);
    if (!ul) return null;
    return [...ul.querySelectorAll('a')].find((a) => re.test(limpio(a.textContent)) || re.test(limpio(a.getAttribute('title')))) || null;
  }

  // Pasa de página y espera la lista nueva. Devuelve false si se cortó
  // (cortado) antes de que llegara. Si el marco cambió de página entera (una
  // lista vencida lleva al formulario), no se espera el plazo completo.
  async function pasarPaginaCP(fr, a, cortado) {
    const doc = fr.contentDocument, antes = firmaLista(doc);
    const corta = cortado || (() => false);
    a.click();
    if (await esperarOtraLista(doc, antes, 30000, () => fr.contentDocument !== doc || corta())) return true;
    if (corta()) return false;
    throw new Error('el PJN no pasó de página');
  }

  // Espera a que cambien las filas de la tabla: el PJN cambia de página por
  // AJAX y no marca en cuál está. Con MutationObserver, como esperarCambio.
  // salir: se mira cada medio segundo; si da verdadero, se deja de esperar.
  function esperarOtraLista(doc, antes, ms, salir) {
    const listo = () => { const f = firmaLista(doc); return !!f && f !== antes; };
    return new Promise((resolve) => {
      if (listo()) { resolve(true); return; }
      let hecho = false;
      const fin = (v) => { if (hecho) return; hecho = true; obs.disconnect(); clearTimeout(vence); clearInterval(mira); resolve(v); };
      const obs = new MutationObserver(() => { try { if (listo()) fin(true); } catch (e) { /* el DOM se está rearmando */ } });
      obs.observe(doc.documentElement, { childList: true, subtree: true, characterData: true });
      const vence = setTimeout(() => { let v; try { v = listo(); } catch (e) { v = false; } fin(v); }, ms);
      const mira = setInterval(() => { try { if (salir && salir()) fin(false); } catch (e) { fin(false); } }, 500);
    });
  }

  function aplicarResultadoCP(f, res) {
    if (res.tipo === 'vacia') {
      Object.assign(f, { estado: 'vacio', n: 0, txt: 'sin causas' });
      if (res.nota) f.nota = res.nota;
      return;
    }
    const filas = res.filas.map((x, i) => Object.assign(x, { sigla: f.sigla, id: f.sigla + '-' + i }));
    CP.filas = CP.filas.concat(filas);
    f.n = filas.length;
    f.estado = res.completa ? 'listo' : 'parcial';
    f.tope = !!res.tope;
    f.txt = plural(f.n, 'causa', 'causas') + (res.completa ? ''
      : res.tope ? ': el PJN tiene más, y se leyeron las primeras ' + f.n + '. Sumá el nombre o el tipo de parte para acotar'
        : ': se detuvo antes de terminar');
  }

  function quitarFueroCP(sigla) {
    CP.filas = CP.filas.filter((x) => x.sigla !== sigla);
    const m = CP.marcos[sigla];
    if (m) { m.fr.remove(); delete CP.marcos[sigla]; }
  }

  function olvidarMarcosCP() {
    Object.keys(CP.marcos).forEach((s) => { CP.marcos[s].fr.remove(); });
    CP.marcos = {};
  }

  // --- detener, saltear y reintentar

  // Los dos cortan también el pedido al PJN que esté en curso, que puede
  // demorar minutos con un nombre muy común.
  function detenerCP() {
    if (CP.estado !== 'buscando') return;
    CP.cortar = true;
    const f = fueroEnCursoCP();
    if (f && f.ctl) f.ctl.abort();
    pintarProgresoCP();
  }

  const fueroEnCursoCP = () => CP.fueros.find((x) => x.estado === 'buscando' || x.estado === 'desafio') || null;

  function saltarFueroCP() {
    const f = fueroEnCursoCP();
    if (!f) return;
    f.saltar = true;
    if (f.ctl) f.ctl.abort();
    pintarProgresoCP();
  }

  // Vuelve a consultar los fueros que fallaron o no se consultaron, con la
  // misma búsqueda.
  // Un fuero que llegó al tope de 600 no se vuelve a pedir: daría lo mismo.
  const faltaFueroCP = (f) => /error|cortado|parcial/.test(f.estado) && !f.tope;

  function reintentarCP(sigla) {
    if (CP.estado === 'buscando' || !CP.consulta) return;
    const lista = CP.fueros.filter((f) => (sigla ? f.sigla === sigla : faltaFueroCP(f)));
    if (!lista.length) return;
    CP.estado = 'buscando';
    CP.cortar = false;
    CP.aviso = '';
    pintarCP();
    recorrerFuerosCP(CP.gen, lista);
  }

  // --- abrir y copiar
  //
  // Relevado el 30/09/2026: el PJN da por vencida una lista al rato, cuando
  // después se consultaron otros fueros; el ojo de esa lista lleva de vuelta
  // al formulario. Por eso una causa se abre buscándola por su número, que es
  // una consulta nueva y no depende de la lista. Un incidente ("/1") no se
  // puede buscar por número: se abre desde la lista del fuero y, si venció,
  // se vuelve a pedir la lista con la misma búsqueda.

  async function cpAbrir(id) {
    const fila = CP.filas.find((x) => x.id === id);
    if (!fila || ocupado()) return;
    // Abrir hace otra consulta al PJN, que puede dar por vencida la lista que la
    // búsqueda está recorriendo (1.6.3): hasta la 1.6.2 ese fuero quedaba en
    // error y se perdía lo leído.
    if (CP.estado === 'buscando') { avisar('Esperá a que termine la búsqueda, o detenela, para abrir una causa.', true); return; }
    const w = pestanaNueva('_blank', fila.exp);
    if (!w) return;
    accionEnCurso = true;
    try {
      // La búsqueda de la que salió la fila: si mientras se abre empieza otra,
      // la apertura sigue con la suya.
      const r = await direccionCP(fila, CP.consulta, CP.gen);
      listaPestana(w);
      w.location.replace(r.url);
      avisar('Se abrió ' + fila.exp + ' en una pestaña nueva.');
      // Desde la lista, el PJN muestra en esa dirección la última causa abierta
      // de la consulta, y SuPJN+, en la pestaña nueva, la vuelve a pedir para
      // leer las actuaciones: antes de abrir otra se espera a que la cargue.
      if (r.lista && await esperarA(() => pestanaCargadaCP(w, r.url), 15000, 250)) await dormir(1500);
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir ' + fila.exp + ': ' + mensajeDe(e) + '.', true);
    } finally {
      accionEnCurso = false;
    }
  }

  function pestanaCargadaCP(w, url) {
    try { return w.closed || (w.location.href === url && w.document.readyState === 'complete'); } catch (e) { return true; }
  }

  const esIncidenteCP = (exp) => /^[A-Z]{2,4}\s+\d+\/\d{4}\/\S/.test(clave(exp));
  const esDirExpediente = (x) => !!(x && PJN.dirExpediente.test(x.pathname) && x.searchParams.get('cid'));

  // Por número, salvo los incidentes de una búsqueda por parte, que el PJN no
  // busca por número. Lo que salió de una búsqueda por número se vuelve a
  // buscar igual, aunque el PJN le muestre un agregado (por ejemplo, la
  // Cámara): es la misma causa.
  // Un incidente de una búsqueda por número se abre desde la lista, como los de
  // una búsqueda por parte (1.6.3): buscado por número, el PJN abre la causa
  // principal o vuelve a dar la lista. Y si la búsqueda por número de una fila
  // que vino de una lista no abre la causa, se prueba desde la lista.
  async function direccionCP(fila, C, gen) {
    const p = partesExp(fila.exp);
    const conLista = !!(fila.pag && C && (C.modo === 'parte' || C.modo === 'numero'));
    if (p && !(esIncidenteCP(fila.exp) && conLista)) {
      try { return { url: await direccionPorNumeroCP(p, fila.exp) }; } catch (e) { if (!conLista || !e.sinExpediente) throw e; }
    }
    return { url: await direccionDesdeListaCP(fila, C, gen), lista: true };
  }

  // Un fuero propio de la apertura, fuera de la búsqueda: solo lo corta el
  // cartel del desafío ("No abrir la causa").
  const fueroParaAbrirCP = (sigla, exp) => Object.assign(nuevoFueroCP(sigla), { abrir: exp });

  async function direccionPorNumeroCP(p, exp) {
    const fr = crearMarco();
    try {
      const f = fueroParaAbrirCP(p.sigla, exp);
      await abrirFormularioCP(fr);
      await completarNumeroCP(fr, f, { num: p.num, anio: p.anio });
      await desafioCP(fr, f, () => false);
      const r = await enviarCP(fr, 'numero');
      const x = dirDelPJN(r.url);
      if (esDirExpediente(x)) return x.href;
      const msj = mensajesCP(new DOMParser().parseFromString(r.html, 'text/html'));
      // Marcado para que direccionCP pruebe desde la lista; un desafío sin
      // resolver o una falla del PJN, en cambio, cortan la apertura.
      throw Object.assign(new Error(msj ? 'el PJN dice: ' + msj : 'el PJN no abrió la causa'), { sinExpediente: true });
    } finally {
      fr.remove();
    }
  }

  async function direccionDesdeListaCP(fila, C, gen) {
    const m = gen === CP.gen ? CP.marcos[fila.sigla] : null;
    if (m && m.fr.isConnected) {
      try { return await direccionEnListaCP(m, fila); } catch (e) { /* la lista venció: se la pide de nuevo */ }
    }
    const nueva = await listaNuevaCP(fila, C, gen);
    try {
      return await direccionEnListaCP(nueva, fila);
    } finally {
      if (!nueva.guardada) nueva.fr.remove();
    }
  }

  async function direccionEnListaCP(m, fila) {
    const tr = await filaEnMarcoCP(m, fila);
    const a = tr && enlaceOjo(tr);
    if (!a) throw new Error('no se encuentra la causa en la lista del PJN');
    const x = dirDelPJN(await postAccion(m.fr, a));
    if (!esDirExpediente(x)) throw new Error('el PJN no abrió la causa');
    return x.href;
  }

  // La misma búsqueda de nuevo, en ese fuero, en un marco nuevo: la lista
  // queda en la primera página, sin leerla entera. Se guarda para las
  // próximas aperturas si sigue siendo la búsqueda a la vista y ese fuero no
  // se está consultando en ese momento; si no, se descarta al terminar.
  async function listaNuevaCP(fila, C, gen) {
    if (!C || (C.modo !== 'parte' && C.modo !== 'numero')) throw new Error('la causa no está en una lista del PJN');
    const sigla = fila.sigla;
    const fr = crearMarco();
    try {
      const f = fueroParaAbrirCP(sigla, fila.exp);
      await abrirFormularioCP(fr);
      if (C.modo === 'numero') await completarNumeroCP(fr, f, C);
      else await completarParteCP(fr, f, C);
      await desafioCP(fr, f, () => false);
      const x = dirDelPJN((await enviarCP(fr, C.modo)).url);
      if (!(x && PJN.publica.dirResultados.test(x.pathname))) throw new Error('el PJN no volvió a dar la lista de ' + sigla);
      await esperarCarga(fr, () => { fr.src = x.href; }, (d) => !!tablaDe(d));
    } catch (e) {
      fr.remove();
      throw e;
    }
    const m = { fr, pagina: 1, guardada: false };
    const enCurso = CP.estado === 'buscando' && CP.fueros.some((x) => x.sigla === sigla && /espera|buscando|desafio/.test(x.estado));
    if (gen === CP.gen && !enCurso) {
      const viejo = CP.marcos[sigla];
      if (viejo) viejo.fr.remove();
      CP.marcos[sigla] = m;
      m.guardada = true;
    }
    return m;
  }

  // Lleva el marco del fuero a la página de la fila, con "Anterior" y
  // "Siguiente", que es lo que tiene el PJN, y devuelve la fila.
  async function filaEnMarcoCP(m, fila) {
    const P = PJN.publica;
    for (let v = 0; v <= TOPE_PAGINAS_CP && m.pagina !== fila.pag; v++) {
      const atras = fila.pag < m.pagina;
      const a = enlacePaginaCP(m.fr.contentDocument, atras ? P.anterior : P.siguiente);
      if (!a) break;
      await pasarPaginaCP(m.fr, a);
      m.pagina += atras ? -1 : 1;
    }
    return filaEn(m.fr.contentDocument, fila.exp);
  }

  const textoFilaCP = (x) => [x.exp, x.car, x.dep, x.sit ? 'Situación: ' + x.sit : '', x.ult ? 'Últ. act.: ' + x.ult : ''].filter(Boolean).join('\n');

  function cpCopiar(id) {
    const x = CP.filas.find((y) => y.id === id);
    if (x) copiarTexto(textoFilaCP(x));
  }

  // La tabla que se ve, con los filtros puestos, separada por tabulaciones:
  // se pega en una planilla con una columna por dato.
  function cpCopiarTodo() {
    const L = filasVisiblesCP();
    if (!L.length) { avisar('No hay causas para copiar.', true); return; }
    const linea = (a) => a.map((t) => limpio(t)).join('\t');
    copiarTexto([linea(['Fuero', 'Expediente', 'Carátula', 'Dependencia', 'Situación', 'Últ. act.'])]
      .concat(L.map((x) => linea([x.sigla, x.exp, x.car, x.dep, x.sit, x.ult]))).join('\n'));
  }

  // --- lo que se ve

  function filasVisiblesCP() {
    const L = CP.filas.filter((x) => (!CP.juicio || tienePalabras(CP.juicio, objetoDe(x.car))) &&
      tienePalabras(CP.filtro, [x.sigla, x.exp, x.car, x.dep, x.sit].join(' ')));
    return ordenarCP(L);
  }

  const propiasVisiblesCP = () => CP.propias.filter((x) => !CP.juicio || tienePalabras(CP.juicio, objetoDe(x.car)));

  const VALOR_ORDEN_CP = {
    sigla: (x) => x.sigla, exp: (x) => ordenExp(x.exp), car: (x) => norm(x.car), dep: (x) => norm(x.dep),
    sit: (x) => norm(x.sit), ult: (x) => String(numFecha(x.ult)).padStart(8, '0')
  };
  function ordenarCP(L) {
    const o = CP.orden, f = VALOR_ORDEN_CP[o.col];
    if (!f) return L;
    const s = o.desc ? -1 : 1;
    return L.slice().sort((a, b) => { const x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * s; });
  }

  function ordenarColumnaCP(k) {
    if (!VALOR_ORDEN_CP[k]) return;
    CP.orden = CP.orden.col === k ? { col: k, desc: !CP.orden.desc } : { col: k, desc: k === 'ult' };
    CP.pagina = 1;
    pintarTablaCP();
  }

  // Los tipos de juicio que aparecen en lo encontrado, con cuántas causas hay
  // de cada uno.
  function tiposEncontradosCP() {
    const n = new Map();
    CP.filas.concat(CP.propias).forEach((x) => { const t = tipoDeJuicio(x.car); if (t) n.set(t, (n.get(t) || 0) + 1); });
    return [...n.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  }

  const nombreFueroCP = (s) => { const f = FUEROS_CP.find((x) => x.sigla === s); return f ? f.nombre : s; };

  function botonFuerosCP() {
    const el = fuerosElegidosCP();
    const txt = !el.length ? 'ninguno' : el.length === FUEROS_CP.length ? 'todos' : el.length > 4 ? el.slice(0, 4).join(', ') + ' y ' + (el.length - 4) + ' más' : el.join(', ');
    return icono('\u2696') + 'Fueros: ' + esc(txt) + ' ▾';
  }

  function menuFuerosCPHTML() {
    const el = fuerosElegidosCP();
    const grupos = [['todos', 'Todos'], ['ninguno', 'Ninguno'], ['cap', 'Capital'], ['int', 'Interior']];
    return '<div class="tit">Fueros donde buscar en la consulta pública</div>' +
      '<div class="sj-cp-grupos">' + grupos.map(([g, t]) => '<button class="sj-b chico" data-a="cpGrupo" data-g="' + esc(g) + '">' + esc(t) + '</button>').join('') + '</div>' +
      GRUPOS_CP.map(([g, t]) => '<div class="tit">' + esc(t) + '</div>' + FUEROS_CP.filter((f) => f.grupo === g).map((f) =>
        '<label class="it"><input type="checkbox" data-cpf="' + esc(f.sigla) + '"' + (el.indexOf(f.sigla) >= 0 ? ' checked' : '') + '> <b>' + esc(f.sigla) + '</b> ' + esc(f.nombre) + '</label>').join('')).join('');
  }

  function grupoDeFuerosCP(g) {
    if (g === 'todos') CFG.cpFueros = FUEROS_CP.map((f) => f.sigla);
    else if (g === 'ninguno') CFG.cpFueros = [];
    else CFG.cpFueros = FUEROS_CP.filter((f) => f.grupo === g).map((f) => f.sigla);
    guardarCfg();
    const b = q('[data-a="cpFueros"]');
    if (b) { b.innerHTML = botonFuerosCP(); abrirMenu(b, menuFuerosCPHTML()); }
  }

  function cambioFueroCP(t) {
    const el = fuerosElegidosCP().filter((s) => s !== t.dataset.cpf);
    if (t.checked) el.push(t.dataset.cpf);
    CFG.cpFueros = el;
    guardarCfg();
    const b = q('[data-a="cpFueros"]');
    if (b) b.innerHTML = botonFuerosCP();
  }

  function barraCPHTML() {
    const busca = CP.estado === 'buscando';
    return '<div class="sj-barra">' +
      '<input type="text" data-cf="texto" value="' + esc(CP.texto) + '" placeholder="Nombre de una parte (como en la carátula) o número: CIV 12345/2024" ' +
      'title="Por nombre: al menos ' + MINIMO_LETRAS_CP + ' letras; se busca cada palabra, en cualquier orden. Por número: con la sigla del fuero, o sin ella para buscarlo en los fueros elegidos.">' +
      '<select data-cf="tipo" title="Tipo de parte (optativo): el PJN busca solo con ese rol"><option value="">Cualquier tipo de parte</option>' +
      PJN.publica.tipos.map((t) => '<option value="' + esc(t) + '"' + (CP.tipo === t ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>' +
      '<input type="text" data-cf="juicio" class="sj-cp-juicio" value="' + esc(CP.juicio) + '" placeholder="Tipo de juicio (optativo): sucesión, daños..." ' +
      'title="Muestra solo las causas cuyo objeto (lo que sigue a la s/ de la carátula) tiene estas palabras. El PJN no busca por tipo de juicio: SuPJN+ filtra lo que trae.">' +
      '<button class="sj-b" data-a="cpFueros" title="Elegir en qué fueros buscar">' + botonFuerosCP() + '</button>' +
      '<button class="sj-b prim" data-a="cpBuscar"' + (busca ? ' disabled' : '') + '>' + (busca ? 'Buscando...' : 'Buscar') + '</button>' +
      '<span class="der"><a class="sj-b" href="' + esc(PJN.publica.ruta) + '" target="_blank" rel="noopener" title="Abrir la consulta pública del PJN en una pestaña nueva">Consulta pública en el PJN ↗</a></span>' +
      '</div>';
  }

  const ESTADOS_FUERO_CP = {
    espera: ['', 'en espera'], buscando: ['azul', ''], desafio: ['violeta', ''], listo: ['verde', ''],
    vacio: ['gris', ''], parcial: ['ambar', ''], error: ['rojo', ''], cortado: ['gris', '']
  };

  function chipFueroCP(f) {
    const [color] = ESTADOS_FUERO_CP[f.estado] || ['gris'];
    const cuenta = f.estado === 'listo' || f.estado === 'parcial' ? ' ' + f.n + (f.estado === 'parcial' ? '+' : '') : f.estado === 'vacio' ? ' 0' : f.estado === 'error' ? ' !' : '';
    const titulo = nombreFueroCP(f.sigla) + ': ' + (f.txt || ESTADOS_FUERO_CP[f.estado][1]) + (f.nota ? '. ' + f.nota : '');
    const reintentar = !/espera|buscando|desafio|listo|vacio/.test(f.estado) && !f.tope && CP.estado !== 'buscando';
    return '<span class="sj-cp-f ' + esc(color) + (f.estado === 'cortado' ? ' off' : '') + '" title="' + esc(titulo) + '">' + esc(f.sigla + cuenta) +
      (reintentar ? '<button data-a="cpReintentar" data-s="' + esc(f.sigla) + '" title="Consultar de nuevo ' + esc(f.sigla) + '">⟳</button>' : '') + '</span>';
  }

  function lineaEnCursoCP() {
    const f = fueroEnCursoCP();
    if (CP.estado !== 'buscando') return '';
    if (CP.cortar) return 'Deteniendo...';
    if (!f) return 'Buscando...';
    return esc('Buscando en ' + f.sigla + ' (' + nombreFueroCP(f.sigla) + '): ' + f.txt + '.') +
      ' <button class="sj-b chico" data-a="cpSaltar">Saltear este fuero</button> <button class="sj-b chico peligro" data-a="cpDetener">Detener</button>';
  }

  function progresoCPHTML() {
    if (!CP.fueros.length) return '';
    const consultados = CP.fueros.filter((f) => !/espera|buscando|desafio/.test(f.estado)).length;
    const notasHTML = CP.fueros.filter((f) => f.nota || f.estado === 'error').map((f) => '<div class="sj-sub">' + esc(f.sigla + ': ' + (f.estado === 'error' ? f.txt : f.nota)) + '</div>').join('');
    const fallaron = CP.estado !== 'buscando' && CP.fueros.some(faltaFueroCP);
    return '<h4>Consulta pública del PJN · ' + consultados + ' de ' + plural(CP.fueros.length, 'fuero', 'fueros') + '</h4>' +
      '<div class="sj-cp-fueros">' + CP.fueros.map(chipFueroCP).join('') +
      (fallaron ? ' <button class="sj-b chico" data-a="cpReintentar" title="Consultar de nuevo los fueros que fallaron o no se terminaron">Reintentar los que faltan</button>' : '') + '</div>' +
      (CP.estado === 'buscando' ? '<div class="sj-prog"><i style="width:' + Math.round(100 * consultados / CP.fueros.length) + '%"></i></div>' : '') +
      '<div class="sj-sol-txt">' + lineaEnCursoCP() + '</div>' + notasHTML;
  }

  const listasTxtCP = (listas) => listas.map((t) => (t === 'rel' ? 'Mis causas' : 'Favoritos')).join(' y ');

  function propiasCPHTML() {
    if (!CP.consulta) return '';
    const L = propiasVisiblesCP();
    const titulo = '<h4>En tus causas · ' + plural(L.length, 'causa', 'causas') + '</h4>';
    if (!L.length) return titulo + '<p class="sj-sol-txt">Ninguna de tus causas (Mis causas y Favoritos) coincide' + (CP.juicio ? ' con el tipo de juicio.' : '.') + '</p>';
    return titulo + '<table class="sj-t"><thead><tr><th>Expediente</th><th>Carátula</th><th>Dependencia</th><th>Situación</th><th>Últ. act.</th><th></th></tr></thead><tbody>' +
      L.map((x) => '<tr><td><span class="sj-exp">' + esc(x.exp) + '</span>' + chipsDe(x.exp) + '<div class="sj-sub">' + esc(listasTxtCP(x.listas)) + '</div></td>' +
        '<td>' + esc(x.car) + '</td><td>' + esc(x.dep) + '</td><td>' + placaSituacionHTML(x.sit) + '</td><td>' + fechaPlacaHTML(x.ult) + '</td>' +
        '<td class="sj-mp-bts"><button class="sj-b chico" data-abrirnueva="' + esc(x.exp) + '" title="Abrir la causa en una pestaña nueva">Abrir ↗</button></td></tr>').join('') +
      '</tbody></table>';
  }

  function filtroCPHTML() {
    const tipos = tiposEncontradosCP();
    return '<div class="sj-cp-filtro">' +
      '<input type="text" data-cf="filtro" value="' + esc(CP.filtro) + '" placeholder="Filtrar lo encontrado: carátula, dependencia, número o fuero">' +
      '<select data-cf="tipos" title="Tipos de juicio de lo encontrado"' + (tipos.length ? '' : ' disabled') + '><option value="">Todos los tipos de juicio</option>' +
      tipos.map(([t, n]) => '<option value="' + esc(t) + '"' + (norm(CP.juicio) === norm(t) ? ' selected' : '') + '>' + esc(t) + ' (' + n + ')</option>').join('') + '</select>' +
      '<button class="sj-b chico" data-a="cpCopiarTodo" title="Copia la tabla, con los filtros puestos, para pegarla en una planilla">Copiar la tabla</button>' +
      botonExportarHTML(true) + '</div>';
  }

  function thCP(k, t) {
    const act = CP.orden.col === k;
    return '<th data-cpo="' + k + '" class="' + (act ? 'act' : '') + '" title="Ordenar por ' + esc(t.toLowerCase()) + '"><span class="tt">' + esc(t) + '</span>' +
      '<span class="fl">' + (act ? (CP.orden.desc ? '▼' : '▲') : '↕') + '</span></th>';
  }

  function filaCPHTML(x) {
    const k = claveEnListas(x.exp);
    const tuyaHTML = k ? '<div class="sj-sub">está en tus causas</div>' : '';
    return '<tr><td>' + esc(x.sigla) + '</td><td><span class="sj-exp">' + esc(x.exp) + '</span>' + tuyaHTML + '</td><td>' + esc(x.car) + '</td>' +
      '<td>' + esc(x.dep) + '</td><td>' + placaSituacionHTML(x.sit) + '</td><td>' + fechaPlacaHTML(x.ult) + '</td>' +
      '<td class="sj-mp-bts"><button class="sj-b chico" data-a="cpAbrir" data-id="' + esc(x.id) + '" title="Abrir la causa en una pestaña nueva">Abrir ↗</button>' +
      '<button class="sj-b chico" data-a="cpCopiar" data-id="' + esc(x.id) + '" title="Copiar número, carátula, dependencia, situación y última actuación">Copiar</button></td></tr>';
  }

  function tablaCPHTML(L) {
    if (!L.length) {
      return '<p class="sj-sol-txt">' + (CP.filas.length ? 'Nada de lo encontrado coincide con los filtros.'
        : CP.estado === 'buscando' ? 'Todavía no llegó nada.' : 'La consulta pública no trajo causas.') + '</p>';
    }
    const ini = (CP.pagina - 1) * POR_PAGINA_CP;
    return '<table class="sj-t sj-tb"><thead><tr>' + thCP('sigla', 'Fuero') + thCP('exp', 'Expediente') + thCP('car', 'Carátula') +
      thCP('dep', 'Dependencia') + thCP('sit', 'Situación') + thCP('ult', 'Últ. act.') + '<th class="fija"></th></tr></thead><tbody>' +
      L.slice(ini, ini + POR_PAGINA_CP).map(filaCPHTML).join('') + '</tbody></table>';
  }

  function cuentaPublicaCP(L) {
    const n = CP.filas.length;
    return plural(L.length, 'causa', 'causas') + (L.length !== n ? ' (filtradas de ' + n + ')' : '');
  }

  function publicaCPHTML() {
    if (!CP.consulta || !CP.consulta.publica) return '';
    const L = filasVisiblesCP();
    return '<h4>En la consulta pública · <span data-e="cpCuenta">' + esc(cuentaPublicaCP(L)) + '</span></h4>' + filtroCPHTML() +
      '<div data-e="cpTabla">' + tablaCPHTML(L) + '</div>';
  }

  function pieCPHTML(L) {
    const pags = Math.max(1, Math.ceil(L.length / POR_PAGINA_CP));
    if (pags <= 1) return '';
    const bt = (p, t, dis) => '<button data-cpp="' + p + '"' + (dis ? ' disabled' : '') + '>' + t + '</button>';
    const pagina = CP.pagina;
    return '<span>Página ' + pagina + ' de ' + pags + '</span><span class="der">' + bt(CP.pagina - 1, '‹ Anterior', CP.pagina <= 1) + bt(CP.pagina + 1, 'Siguiente ›', CP.pagina >= pags) + '</span>';
  }

  function ayudaCPHTML() {
    return '<div class="sj-sec"><h3>Buscar causas</h3>' +
      '<p>Escribí el nombre de una parte, como figura en la carátula (por ejemplo, <b>PEREZ JUAN</b>), o un número de expediente (<b>CIV 12345/2024</b>). ' +
      'SuPJN+ busca primero en tus causas y después en la consulta pública del PJN, en todos los fueros que elijas, y junta todo en una sola tabla.</p>' +
      '<p>El PJN busca cada palabra por separado, en cualquier orden, y en todas las partes de la causa, no solo en la carátula. No acepta la Ñ ni las tildes: SuPJN+ las cambia solo (MUÑOZ se busca como MUNOZ, que es como lo encuentra el PJN).</p>' +
      '<p>El tipo de juicio no es un filtro del PJN: SuPJN+ lo lee de la carátula, de lo que sigue a la "s/". Sin nombre, se busca solo en tus causas.</p></div>';
  }

  function cuerpoCPHTML() {
    const aviso = CP.aviso ? '<div class="sj-info">' + esc(CP.aviso) + '</div>' : '';
    if (!CP.consulta) return aviso + ayudaCPHTML();
    return aviso + '<div class="sj-sec" data-e="cpProg"' + (CP.fueros.length ? '' : ' style="display:none"') + '>' + progresoCPHTML() + '</div>' +
      '<div class="sj-sec" data-e="cpPropias">' + propiasCPHTML() + '</div>' +
      '<div class="sj-sec" data-e="cpPublica"' + (CP.consulta.publica ? '' : ' style="display:none"') + '>' + publicaCPHTML() + '</div>';
  }

  function cpHTML() {
    const L = filasVisiblesCP();
    return '<div class="sj-bandeja sj-cp">' + barraCPHTML() + '<div class="sj-cuerpo sj-guia" data-e="cpCuerpo">' + cuerpoCPHTML() + '</div>' +
      '<div class="sj-pie" data-e="cpPie">' + pieCPHTML(L) + '</div></div>';
  }

  // Redibujar no le saca el foco al campo en el que se está escribiendo.
  function conFocoCP(fn) {
    const act = document.activeElement;
    const campo = act && act.dataset && act.dataset.cf && win.contains(act) ? { cf: act.dataset.cf, pos: act.selectionStart } : null;
    fn();
    if (!campo) return;
    const n = q('[data-cf="' + campo.cf + '"]');
    if (!n || n === act) return;
    n.focus();
    try { if (campo.pos != null) n.setSelectionRange(campo.pos, campo.pos); } catch (x) { /* un desplegable no tiene cursor */ }
  }

  function paginaValidaCP(L) {
    const pags = Math.max(1, Math.ceil(L.length / POR_PAGINA_CP));
    if (!(CP.pagina >= 1)) CP.pagina = 1;
    if (CP.pagina > pags) CP.pagina = pags;
  }

  function pintarCP() {
    pintarSolapas();
    if (VISTA !== 'cp' || !win) return;
    const p = q('[data-e="vPanel"]');
    if (!p) return;
    paginaValidaCP(filasVisiblesCP());
    conFocoCP(() => { p.innerHTML = cpHTML(); });
  }

  function pintarProgresoCP() {
    pintarSolapas();
    const e = VISTA === 'cp' ? q('[data-e="cpProg"]') : null;
    if (!e) return;
    e.style.display = CP.fueros.length ? '' : 'none';
    e.innerHTML = progresoCPHTML();
  }

  // Cuando llega un fuero: lo encontrado y los tipos de juicio, sin tocar la
  // barra de arriba.
  function pintarResultadosCP() {
    pintarProgresoCP();
    const pub = VISTA === 'cp' ? q('[data-e="cpPublica"]') : null;
    if (!pub) return;
    conFocoCP(() => { pub.innerHTML = publicaCPHTML(); });
    pintarTablaCP();
  }

  // Al filtrar, ordenar o cambiar de página: las tablas, la cuenta y el pie.
  function pintarTablaCP() {
    if (VISTA !== 'cp' || !win) return;
    const L = filasVisiblesCP();
    paginaValidaCP(L);
    const t = q('[data-e="cpTabla"]'), c = q('[data-e="cpCuenta"]'), pie = q('[data-e="cpPie"]'), pr = q('[data-e="cpPropias"]');
    if (t) t.innerHTML = tablaCPHTML(L);
    if (c) c.textContent = cuentaPublicaCP(L);
    if (pie) pie.innerHTML = pieCPHTML(L);
    if (pr) pr.innerHTML = propiasCPHTML();
  }

  const cantidadCP = () => (CP.estado === 'buscando' ? '...' : CP.consulta ? CP.filas.length + CP.propias.length : null);

  // Lo que se escribe en la barra de la solapa y en el filtro.
  function alEscribirEnCP(t) {
    const cf = t.dataset.cf;
    if (cf === 'texto') { CP.texto = t.value; return; }
    if (cf === 'juicio') CP.juicio = t.value;
    else if (cf === 'filtro') CP.filtro = t.value;
    else return;
    CP.pagina = 1;
    if (cf === 'juicio') { const s = q('[data-cf="tipos"]'); if (s) s.value = ''; }
    pintarTablaCP();
  }

  // Enter busca, salvo que lo único que cambió sea el tipo de juicio: ese
  // filtro ya se aplicó mientras se escribía, y no hace falta volver a
  // consultar al PJN. Si cambió el tipo de parte o los fueros, busca.
  function mismaConsultaCP() {
    const C = CP.consulta;
    if (!C || CP.estado === 'nada' || limpio(CP.texto) !== C.escrito) return false;
    if (C.modo === 'juicio') return !!limpio(CP.juicio);
    if (C.modo === 'parte' && (C.tipo || '') !== (CP.tipo || '')) return false;
    return !!C.sigla || C.fueros.join() === fuerosElegidosCP().join();
  }
  function enterEnCP() {
    if (!mismaConsultaCP()) cpBuscar();
  }

  function cambioEnCP(t) {
    if (t.dataset.cf === 'tipo') { CP.tipo = t.value; return; }
    if (t.dataset.cf !== 'tipos') return;
    CP.juicio = t.value;
    CP.pagina = 1;
    const j = q('[data-cf="juicio"]');
    if (j) j.value = CP.juicio;
    pintarTablaCP();
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

  // La ventana se arma en dos pasos: primero se crea (el estilo, la ventana,
  // el indicador) y después se enganchan los escuchas de todo lo que se toca.
  function construir() {
    if (armarVentana() === false) return false;
    engancharEscuchas();
    return true;
  }

  // Crea el estilo, la ventana con todo su contenido y el indicador de abajo
  // a la derecha. Devuelve false si SuPJN+ ya estaba puesto en esta página.
  function armarVentana() {
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
      '<button class="fn" data-a="menuPJN">' + icono('\u2630') + 'Funciones del PJN ▾</button>' +
      '<button class="fn" data-a="recargarApp" title="Volver a cargar la página del PJN y arrancar SuPJN+ de cero">' + icono('\u27F3') + 'Recargar</button>' +
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
      '<label>Últ. act. desde ' + campoFecha('data-f="desde"', '', 'Desde (dd/mm/aaaa)') + '</label>' +
      '<label>hasta ' + campoFecha('data-f="hasta"', '', 'Hasta (dd/mm/aaaa)') + '</label>' +
      '<button class="sj-b" data-a="limpiar">' + icono('\u2715') + 'Limpiar filtros</button>' +
      '<button class="sj-b" data-a="novedades" data-e="novedades" title="Las causas que cambiaron de fecha de última actuación o de situación desde la última vez que las miraste. El PJN solo publica el día, así que dos movimientos del mismo día no se distinguen. Una causa deja de estar marcada cuando la abrís.">' + icono('\u25CF') + 'Novedades</button>' +
      '<button class="sj-b" data-a="vistoTodo" title="Marcar todas las causas como vistas: se borran las marcas de novedad." style="display:none">Marcar todo como visto</button>' +
      // A la derecha, separado de los filtros, lo que cambia cómo se ve la tabla.
      '<span class="der">' + botonExportarHTML(false) + '<button class="sj-b" data-a="menuCols">' + icono('\u25A4') + 'Columnas ▾</button>' +
      '<button class="sj-b" data-a="ordenPJNlista2" data-e="ordenPJN" title="Orden PJN: las muestra en el mismo orden en que las manda el PJN cuando se le pide la lista ordenada por FECHA, que es como las ves en el sitio.">Orden PJN</button>' +
      '<button class="sj-b" data-a="horas" title="Descarga el último documento con PDF de las causas que empatan en la fecha y obtiene la hora de la firma. De a cinco, con tope de quince por vez, y se puede cancelar.">Averiguar la hora</button>' +
      '<button class="sj-b" data-a="ordenPJNLista" data-e="ordenCrono" title="Orden cronológico: por la última actuación, de la más nueva a la más vieja. Con la misma fecha decide la hora, cuando se conoce la de todas las causas de ese día; si falta alguna, queda el orden que manda el PJN. Es el orden inicial de la lista.">Orden cronológico</button></span>' +
      '</div>' +
      '<div class="sj-est"><span class="txt" data-e="estado"></span>' +
      '<button class="sj-b prim" data-a="actualizar" title="Vuelve a leer Mis causas y Favoritos del PJN">' + icono('\u27F3') + 'Actualizar</button>' +
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
    return true;
  }

  // Todo lo que responde a lo que se toca, se escribe, se arrastra o se
  // cambia de tamaño, y lo que hay que atender al dejar la página.
  // Los escuchas van en cuatro grupos, en este orden: la ventana misma, los
  // campos, lo que se toca adentro y lo que pasa en la página.
  function engancharEscuchas() {
    escuchasDeLaVentana();
    escuchasDeLosCampos();
    escuchasDeLoQueSeToca();
    escuchasDeLaPagina();
  }

  // Mover la ventana, cambiarle el tamaño y acomodar las columnas.
  // Mover, redimensionar y las columnas (1.3.8: partido en una función por
  // gesto). escuchasDeLaVentana solo las registra.

  // mover la ventana
  function alArrastrarElTitulo(e) {
    if (e.button !== 0 || e.target.closest('button') || CFG.maxi) return;
    const r = geom();
    const sx = e.clientX, sy = e.clientY;
    arrastrar(e, (ev) => {
      fijarGeom({
        x: Math.max(120 - r.w, Math.min(anchoPantalla() - 120, r.x + ev.clientX - sx)),
        y: Math.max(0, Math.min(altoPantalla() - 38, r.y + ev.clientY - sy))
      });
    });
  }

  // cambiar el tamaño
  function alArrastrarLaEsquina(e) {
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
  }

  // ancho de columna: borde derecho del título. Con el encuadre puesto, el
  // ancho dibujado no es el guardado: se parte de lo que se ve en pantalla.
  function anchosEnPantalla(tabla, tab) {
    const cols = [];
    const base = {};
    tabla.querySelectorAll('col[data-col]').forEach((c) => {
      cols.push(c.dataset.col);
      const escrito = parseInt(c.style.width, 10);
      base[c.dataset.col] = Math.max(minCol(tab, c.dataset.col), escrito || Math.round(c.getBoundingClientRect().width / zoomAct()));
    });
    return { cols, base };
  }
  function alArrastrarElBordeDeColumna(e) {
    const rs = e.target.closest && e.target.closest('[data-rs]');
    if (!rs || e.button !== 0) return;
    const k = rs.dataset.rs, tab = rs.dataset.tabla || 'lista';
    const th = rs.closest('th');
    const tabla = th.closest('table');
    const cajaTabla = tabla.parentElement;
    const { cols, base } = anchosEnPantalla(tabla, tab);
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
  }

  // mover columnas: arrastrar el título
  const limpiarMarcasDeSoltar = () => win.querySelectorAll('th.drop-izq, th.drop-der').forEach((t) => t.classList.remove('drop-izq', 'drop-der'));
  // Una columna se suelta solo dentro de su propia tabla.
  function columnaDestino(e) {
    const th = e.target.closest && e.target.closest('th[data-k]');
    return th && colArrastrada && (th.dataset.tabla || 'lista') === colArrastrada.tabla ? th : null;
  }
  function alEmpezarAArrastrarColumna(e) {
    const th = e.target.closest && e.target.closest('th[data-k]');
    if (!th) return;
    colArrastrada = { k: th.dataset.k, tabla: th.dataset.tabla || 'lista' };
    th.classList.add('arrastrando');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', colArrastrada.k); } catch (x) { /* sin datos */ }
  }
  function alPasarColumnaPorEncima(e) {
    const th = columnaDestino(e);
    if (!th) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch (x) { /* sin efecto */ }
    const r = th.getBoundingClientRect();
    const der = e.clientX > r.left + r.width / 2;
    limpiarMarcasDeSoltar();
    if (th.dataset.k !== colArrastrada.k) th.classList.add(der ? 'drop-der' : 'drop-izq');
  }
  function alSoltarColumna(e) {
    if (!colArrastrada) return;
    const th = columnaDestino(e);
    e.preventDefault();
    const { k, tabla } = colArrastrada;
    colArrastrada = null;
    limpiarMarcasDeSoltar();
    if (th && th.dataset.k !== k) {
      const r = th.getBoundingClientRect();
      moverColumna(tabla, k, th.dataset.k, e.clientX > r.left + r.width / 2);
    }
    repintarTabla(tabla);
  }
  function alTerminarDeArrastrarColumna() {
    colArrastrada = null;
    limpiarMarcasDeSoltar();
    win.querySelectorAll('th.arrastrando').forEach((t) => t.classList.remove('arrastrando'));
  }

  function escuchasDeLaVentana() {
    q('[data-e="tit"]').addEventListener('mousedown', alArrastrarElTitulo);
    q('[data-e="tit"]').addEventListener('dblclick', (e) => { if (!e.target.closest('button')) alternarMaxi(); });
    q('[data-e="redim"]').addEventListener('mousedown', alArrastrarLaEsquina);
    win.addEventListener('mousedown', alArrastrarElBordeDeColumna, true);
    win.addEventListener('dragstart', alEmpezarAArrastrarColumna);
    win.addEventListener('dragover', alPasarColumnaPorEncima);
    win.addEventListener('drop', alSoltarColumna);
    win.addEventListener('dragend', alTerminarDeArrastrarColumna);
  }

  // Los filtros, los buscadores, los desplegables y el teclado.
  // Los cambios en los campos de la ventana (1.3.8: partido en una función por
  // campo). Al escribir en una búsqueda se espera un instante después de la
  // última letra antes de redibujar; los desplegables y las fechas se aplican
  // de inmediato.
  const ESPERA_BUSQUEDA = 120;
  const ESPERAS_DE_ESCRITURA = { lista: null, elegir: null, bandeja: null };

  // filtros de la lista
  function alEscribirFiltroDeLista(e) {
    const f = e.target.dataset && e.target.dataset.f;
    if (!f) return;
    const v = valorDeCampo(e.target);
    if (v === null) return;   // fecha a medio escribir
    CFG[f] = v;
    PAGINA_VISTA[VISTA === 'fav' ? 'fav' : 'rel'] = 1;
    abierta = null;
    clearTimeout(ESPERAS_DE_ESCRITURA.lista);
    const aplicar = () => { guardarCfg(); pintarTabla(); };
    if (f === 'texto') ESPERAS_DE_ESCRITURA.lista = setTimeout(aplicar, ESPERA_BUSQUEDA); else aplicar();
  }

  // filtros de elegir actuaciones: se redibuja el cuadro sin perder el foco ni el cursor
  function redibujarElegirConservandoElFoco(id, ef) {
    const actual = q('[data-elegir="' + id + '"] [data-ef="' + ef + '"]');
    const enFoco = !!actual && actual === document.activeElement;
    const pos = enFoco ? actual.selectionStart : null;
    pintarElegir(id);
    const nuevo = q('[data-elegir="' + id + '"] [data-ef="' + ef + '"]');
    if (nuevo && enFoco) { nuevo.focus(); try { const p = ef === 'texto' ? pos : nuevo.value.length; nuevo.setSelectionRange(p, p); } catch (x) { /* sin cursor */ } }
  }
  function alEscribirFiltroDeElegir(e) {
    const ef = e.target.dataset && e.target.dataset.ef;
    if (!ef) return;
    const id = e.target.closest('[data-elegir]').dataset.elegir;
    const ctx = ctxElegir(id);
    if (!ctx) return;
    const v = valorDeCampo(e.target);
    if (v === null) return;   // fecha a medio escribir
    ctx.filtro[ef] = v;
    clearTimeout(ESPERAS_DE_ESCRITURA.elegir);
    const aplicar = () => redibujarElegirConservandoElFoco(id, ef);
    if (ef === 'texto') ESPERAS_DE_ESCRITURA.elegir = setTimeout(aplicar, ESPERA_BUSQUEDA); else aplicar();
  }

  // Bandejas (Escritos, Notificaciones, DEOX) y Guía.
  function alEscribirEnBandeja(t, bf) {
    const cont = t.closest('[data-band]');
    if (!cont) return;
    const v = cont.dataset.band, B = BAND[v];
    if (bf === 'texto') {
      B.texto = t.value;
      B.pagina = 1;
      clearTimeout(ESPERAS_DE_ESCRITURA.bandeja);
      ESPERAS_DE_ESCRITURA.bandeja = setTimeout(() => pintarCuerpoBandeja(v), ESPERA_BUSQUEDA);
    } else if (bf === 'desde' || bf === 'hasta') {
      const fecha = valorDeCampo(t);
      if (fecha === null) return;   // fecha a medio escribir
      B[bf] = fecha;
      // El atajo de fechas acompaña a lo que se escriba a mano.
      const r = cont.querySelector('[data-bf="rango"]');
      if (r) r.value = rangoActual(B);
    }
  }
  function alEscribirEnBandejasYGuia(e) {
    const t = e.target;
    const bf = t.dataset && t.dataset.bf;
    if (bf) { alEscribirEnBandeja(t, bf); return; }
    if (t.dataset && t.dataset.gf === 'texto') GUIA.texto = t.value;
    if (t.dataset && t.dataset.cf) alEscribirEnCP(t);
  }

  // Los cambios de los desplegables y casillas, uno por función. Cada entrada
  // es [selector, función]; se aplica la primera que coincide con el campo.
  function cambioBandejaElegida(t) {
    const cont = t.closest('[data-band]');
    if (!cont) return;
    BAND[cont.dataset.band].bandeja = t.value;
    consultarBandeja(cont.dataset.band);
  }
  // Los filtros trabajan sobre lo ya consultado: no se le vuelve a pedir
  // nada al PJN.
  function cambioFiltroDeBandeja(t) {
    const cont = t.closest('[data-band]');
    if (!cont) return;
    const v = cont.dataset.band;
    BAND[v].filtros[t.dataset.k] = t.value;
    BAND[v].pagina = 1;
    pintarCuerpoBandeja(v);
  }
  // Un atajo de fechas sí cambia lo que se le pide al PJN, así que consulta.
  function cambioRangoDeBandeja(t) {
    const cont = t.closest('[data-band]');
    if (!cont) return;
    const v = cont.dataset.band, R = RANGOS.find((x) => x[0] === t.value);
    if (!R) return;          // "Otras fechas": las fechas quedan como están
    BAND[v].desde = R[2]();
    BAND[v].hasta = hoyISO();
    consultarBandeja(v);
  }
  function cambioModoDeGuia(t) {
    GUIA.modo = MODOS_GUIA.some((x) => x[0] === t.value) ? t.value : 'dep';
    const campo = q('[data-gf="texto"]');
    if (campo) campo.placeholder = ayudaGuia(GUIA.modo);
    const enlace = q('[data-e="guiaEnlace"]');
    if (enlace) enlace.innerHTML = enlaceGuiaHTML(GUIA.vista === 'det' && GUIA.det ? GUIA.det.dependencia.codigoUrl : '');
  }
  function cambioPorPagina(t) {
    CFG.porPagina = parseInt(t.value, 10) || 25;
    PAGINA_VISTA.rel = 1;
    PAGINA_VISTA.fav = 1;
    guardarCfg();
    pintarTabla();
  }
  function cambioSeleccionDeFila(t) {
    const s = selVista();
    if (t.checked) s.add(t.dataset.sel); else s.delete(t.dataset.sel);
    const tr = t.closest('tr');
    if (tr) tr.classList.toggle('sel', t.checked);
    const todas = q('[data-a="selTodas"]');
    if (todas) { const L = filtradas(); todas.checked = L.length > 0 && L.every((c) => s.has(c.exp)); }
    pintarAccion();
  }
  function cambioSeleccionDeTodas(t) {
    const s = selVista();
    filtradas().forEach((c) => { if (t.checked) s.add(c.exp); else s.delete(c.exp); });
    pintarTabla();
    pintarAccion();
  }
  function cambioEncuadrar(t) {
    CFG.encuadrar = !!t.checked;
    guardarCfg();
    repintarTabla('lista');
    repintarTabla('act');
  }
  function cambioColumnaVisible(t) {
    const k = t.dataset.colvis, tab = t.dataset.tabla || 'lista';
    const claveOcultas = TABLAS[tab].ocultas;
    CFG[claveOcultas] = CFG[claveOcultas].filter((x) => x !== k);
    if (!t.checked) {
      if (columnasVisibles(tab).length <= 1) { t.checked = true; return; }
      CFG[claveOcultas].push(k);
    }
    guardarCfg();
    repintarTabla(tab);
  }
  function cambioActuacionElegida(t) {
    const cont = t.closest('[data-elegir]');
    const ctx = ctxElegir(cont.dataset.elegir);
    if (!ctx) return;
    const i = parseInt(t.dataset.ei, 10);
    if (t.checked) ctx.elegidas.add(i); else ctx.elegidas.delete(i);
    actualizarCuentaElegir(cont.dataset.elegir);
  }
  function cambioPausaDeNota(t) {
    CFG.pausaNota = Math.max(300, parseInt(t.value, 10) || 700);
    guardarCfg();
  }
  const CAMBIOS_DE_CAMPO = [
    ['[data-bf="bandeja"]', cambioBandejaElegida], ['[data-bf="filtro"]', cambioFiltroDeBandeja], ['[data-bf="rango"]', cambioRangoDeBandeja],
    ['[data-gf="modo"]', cambioModoDeGuia], ['[data-pp]', cambioPorPagina], ['[data-sel]', cambioSeleccionDeFila],
    ['[data-a="selTodas"]', cambioSeleccionDeTodas], ['[data-enc]', cambioEncuadrar], ['[data-colvis]', cambioColumnaVisible],
    ['[data-ei]', cambioActuacionElegida], ['[data-e="pausa"]', cambioPausaDeNota],
    ['[data-cpf]', cambioFueroCP], ['[data-cf]', cambioEnCP]
  ];
  function alCambiarCampo(e) {
    const t = e.target;
    const entrada = CAMBIOS_DE_CAMPO.find(([selector]) => t.matches(selector));
    if (entrada) entrada[1](t);
  }

  // anotación: al salir del campo se guarda
  function alSalirDeLaAnotacion(e) {
    if (!e.target.classList || !e.target.classList.contains('sj-nota')) return;
    const caja = e.target.closest('[data-marca]');
    if (!caja || e.target.value === (marcaDe(caja.dataset.marca).nota || '')) return;
    fijarMarca(caja.dataset.marca, { nota: e.target.value });
    e.target.defaultValue = e.target.value;
    const ok = caja.querySelector('.sj-ok');
    if (ok) { ok.classList.add('si'); setTimeout(() => ok.classList.remove('si'), 2200); }
    pintarCeldaMarcasAct(caja.dataset.marca);
    pintarCopia();
  }

  function alTeclaEnCampo(e) {
    const ds = (e.target && e.target.dataset) || {};
    if (e.key === 'Enter' && ds.gf === 'texto') { e.preventDefault(); guiaBuscar(); return; }
    if (e.key === 'Enter' && (ds.cf === 'texto' || ds.cf === 'juicio')) { e.preventDefault(); enterEnCP(); return; }
    if (e.key === 'Enter' && (ds.bf === 'desde' || ds.bf === 'hasta')) {
      const cont = e.target.closest('[data-band]');
      if (cont) { e.preventDefault(); alSalirDeCampoFecha(e); const v = valorDeCampo(e.target); if (v === null) return; BAND[cont.dataset.band][ds.bf] = v; consultarBandeja(cont.dataset.band); }
      return;
    }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sj-et-nombre')) {
      e.preventDefault();
      const b = e.target.closest('[data-marca]').querySelector('[data-a="crearEt"]');
      if (b) b.click();
    }
  }

  function escuchasDeLosCampos() {
    win.querySelector('.sj-barra').addEventListener('input', alEscribirFiltroDeLista);
    win.addEventListener('input', alEscribirFiltroDeElegir);
    win.addEventListener('input', alEscribirEnBandejasYGuia);
    win.addEventListener('change', alCambiarCampo);
    win.addEventListener('focusout', alSalirDeLaAnotacion);
    win.addEventListener('focusout', alSalirDeCampoFecha);
    win.addEventListener('keydown', alTeclaEnCampo);
  }

  // El archivo que se importa y el clic sobre cualquier cosa de la ventana.
  function escuchasDeLoQueSeToca() {
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
        avisar('Importadas ' + plural(r.filas, 'causa marcada', 'causas marcadas') + (r.acts ? ' y ' + plural(r.acts, 'actuación marcada', 'actuaciones marcadas') : '') +
          '. Quedan ' + plural(r.etiquetas, 'etiqueta', 'etiquetas') + '.' +
          (r.notas ? ' Se sumaron ' + plural(r.notas, 'nota dejada', 'notas dejadas') + '.' : ''));
        pintarTodo();
      };
      lector.onerror = () => { archivo.value = ''; avisar('No se pudo leer el archivo.', true); };
      lector.readAsArrayBuffer(f);
    });

    win.addEventListener('click', alClic);

  }

  // Lo que pasa afuera de la ventana: el clic que cierra el menú, la
  // actividad del usuario, el tamaño de la pantalla, cambiar de pestaña y
  // dejar la página.
  function escuchasDeLaPagina() {
    // un clic afuera cierra el menú abierto
    document.addEventListener('mousedown', (e) => {
      if (!menuAbierto) return;
      if (menuAbierto.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-a="menuPJN"], [data-a="menuCols"], [data-a="menuColsAct"], [data-a="cpFueros"], [data-a="menuExportar"], [data-mas]')) return;
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
      if (win) win.querySelectorAll('[data-marca] .sj-nota').forEach((t) => { t.value = marcaDe(t.closest('[data-marca]').dataset.marca).nota || ''; t.defaultValue = t.value; });
      if (win && win.style.display !== 'none' && !menuAbierto && !escribiendoEnLaVentana()) pintarTodo();
      // Al volver a esta pestaña, si las listas quedaron viejas se leen de nuevo;
      // no mientras se escribe en la ventana, porque al terminar se redibuja.
      if (!escribiendoEnLaVentana()) refrescarSiHaceFalta();
      else if (win) win.addEventListener('focusout', refrescarSiHaceFalta, { once: true });
    });

    // Mientras haya descargas, salir de la página las corta: el navegador avisa.
    window.addEventListener('beforeunload', (e) => {
      if (!bajandoAlgo()) return;
      e.preventDefault();
      e.returnValue = '';
    });
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
      // "Eligiendo" no ocupa lugar en la cola; "a descargar", sí.
      if (!hayLugarPara(1)) return;
      t.urls = urls;
      t.parcial = parcial;
      t.estado = 'a descargar';
      t.texto = 'Esperando turno...';
      pintarDescargas();
    }
    pintarSolapas();
    procesarCola();
  }

  // El clic se atiende en tres tramos, y el orden importa: primero las marcas
  // de la fila y de la tabla (que van antes que los botones, porque un botón
  // puede estar adentro de una fila marcada), después la acción del botón, y
  // al final lo de las etiquetas y anotaciones.
  // El clic en la ventana (1.3.8: partido en una función por zona). Cada
  // función recibe el elemento tocado y el evento, y devuelve true si atendió
  // el clic; alClic las prueba en orden y se detiene en la primera que lo hizo.
  function clicEnMenu(t) {
    // Un enlace del menú abre su pestaña y el menú se cierra solo. Se lo cierra
    // después del clic: quitarlo durante el clic podría cortar la apertura.
    if (!t.closest('.sj-menu a.it')) return false;
    setTimeout(cerrarMenu, 0);
    return true;
  }
  function clicEnSolapas(t) {
    // La cruz de la solapa va antes que la solapa: está adentro del botón.
    if (t.closest('[data-cerrar]')) { cerrarSolapaExp(); return true; }
    const sol = t.closest('[data-vista]');
    if (!sol) return false;
    irAVista(sol.dataset.vista);
    return true;
  }
  function clicEnOrdenDeBandeja(t) {
    const bo = t.closest('th[data-bo]');
    if (!bo) return false;
    ordenarBandeja(bo.dataset.v, bo.dataset.bo);
    return true;
  }
  function clicEnPaginaDeBandeja(t) {
    const bp = t.closest('[data-bpag]');
    if (!bp) return false;
    if (bp.disabled) return true;
    BAND[bp.dataset.v].pagina = parseInt(bp.dataset.bpag, 10) || 1;
    pintarCuerpoBandeja(bp.dataset.v);
    const cb = q('[data-e="bandCuerpo"]');
    if (cb) cb.scrollTop = 0;
    return true;
  }
  // La consulta pública (1.6.0): el orden por columna y las páginas de lo encontrado.
  function clicEnOrdenCP(t) {
    const th = t.closest('th[data-cpo]');
    if (!th) return false;
    ordenarColumnaCP(th.dataset.cpo);
    return true;
  }
  function clicEnPaginaCP(t) {
    const b = t.closest('[data-cpp]');
    if (!b) return false;
    if (b.disabled) return true;
    CP.pagina = parseInt(b.dataset.cpp, 10) || 1;
    pintarTablaCP();
    const c = q('[data-e="cpCuerpo"]'), pub = q('[data-e="cpPublica"]');
    if (c && pub) c.scrollTop = pub.offsetTop;
    return true;
  }
  function clicEnTituloDeColumna(t) {
    const th = t.closest('th[data-k]');
    if (!th || t.closest('[data-rs]')) return false;
    if (recienRedim) return true;
    const tab = th.dataset.tabla || 'lista';
    alternarOrden(tab, th.dataset.k);
    repintarTabla(tab);
    return true;
  }
  function clicEnPaginaDeLista(t) {
    const pg = t.closest('[data-pag]');
    if (!pg || pg.disabled) return false;
    PAGINA_VISTA[VISTA === 'fav' ? 'fav' : 'rel'] = parseInt(pg.dataset.pag, 10) || 1;
    abierta = null;
    pintarTabla();
    q('[data-e="cuerpo"]').scrollTop = 0;
    return true;
  }
  function clicEnAbrirCausa(t, e) {
    const abn = t.closest('[data-abrirnueva]');
    if (abn) { abrirCausa(abn.dataset.abrirnueva, true); return true; }
    const ab = t.closest('[data-abrir]');
    if (!ab) return false;
    abrirCausa(ab.dataset.abrir, !!(e.ctrlKey || e.metaKey));
    return true;
  }
  function clicEnMasDeLaFila(t) {
    const mas = t.closest('[data-mas]');
    if (!mas) return false;
    if (menuAbierto && menuAbierto.dataset.ancla === mas.dataset.mas) { cerrarMenu(); return true; }
    abrirMenu(mas, menuFilaHTML(mas.dataset.mas));
    return true;
  }
  // La celda de etiquetas y anotaciones de una actuación (1.7.0): abre o
  // cierra su cuadro, debajo de la fila.
  function clicEnMarcasDeActuacion(t) {
    const celda = t.closest('[data-actm]');
    if (!celda) return false;
    guardarNotaAbierta();
    EXP.actAbierta = EXP.actAbierta === celda.dataset.actm ? null : celda.dataset.actm;
    pintarElegir('exp');
    const caja = EXP.actAbierta && [...win.querySelectorAll('.sj-act-ed [data-marca]')].find((x) => x.dataset.marca === EXP.actAbierta);
    if (caja) {
      caja.scrollIntoView({ block: 'nearest' });
      const campo = caja.querySelector('.sj-nota');
      if (campo) campo.focus();
    }
    return true;
  }
  function clicEnDetalleDeLaFila(t) {
    const det = t.closest('[data-det]');
    if (!det) return false;
    guardarNotaAbierta();
    abierta = abierta === det.dataset.det ? null : det.dataset.det;
    pintarTabla();
    const caja = abierta && q('.sj-det-in[data-marca]');
    if (caja) {
      const campo = caja.querySelector(det.dataset.foco === 'nota' ? '.sj-nota' : '.sj-et-nombre');
      caja.scrollIntoView({ block: 'nearest' });
      if (campo) campo.focus();
    }
    return true;
  }
  function clicEnColorDeEtiqueta(t) {
    const colBtn = t.closest('.sj-col');
    if (!colBtn) return false;
    colorElegido = colBtn.dataset.color;
    colBtn.parentElement.querySelectorAll('.sj-col').forEach((b) => b.classList.toggle('sel', b === colBtn));
    return true;
  }
  function clicEnChipDeEtiqueta(t) {
    const chip = t.closest('button[data-et]');
    if (!chip) return false;
    const caja = chip.closest('[data-marca]');
    guardarNotaAbierta();
    alternarEtiqueta(caja.dataset.marca, chip.dataset.et);
    if (VISTA === 'exp') pintarExpediente(); else pintarTabla();
    pintarCopia();
    return true;
  }

  // Las acciones del cuadro "elegir actuaciones", una función por acción.
  // Reciben el contexto del cuadro (ctx), su identificador (id), las
  // actuaciones a la vista (V) y el control tocado (ea).
  const ACCIONES_DE_ELEGIR = {
    todas(ctx, id, V) { V.forEach((i) => ctx.elegidas.add(i)); pintarElegir(id); },
    ninguna(ctx, id, V) { V.forEach((i) => ctx.elegidas.delete(i)); pintarElegir(id); },
    invertir(ctx, id, V) { V.forEach((i) => { if (ctx.elegidas.has(i)) ctx.elegidas.delete(i); else ctx.elegidas.add(i); }); pintarElegir(id); },
    todasCb(ctx, id, V, ea) {
      if (ea.checked) V.forEach((i) => ctx.elegidas.add(i)); else V.forEach((i) => ctx.elegidas.delete(i));
      pintarElegir(id);
    },
    ordenPJN(ctx, id) { CFG.ordenAct = { col: '', desc: true }; guardarCfg(); pintarElegir(id); },
    bajarElegidas(ctx, id) {
      const idx = [...ctx.elegidas].sort((x, y) => x - y);
      // Con la lectura cortada, elegir todas sigue siendo una selección (1.6.3).
      trabajoDesdeElegir(id, idx.map((i) => ctx.acts[i].url), idx.length < ctx.acts.length || !!ctx.incompleta);
    },
    bajarTodo(ctx, id) { trabajoDesdeElegir(id, ctx.acts.map((x) => x.url), !!ctx.incompleta); },
    bajarUna(ctx, id, V, ea) { bajarUnaActuacion(id, parseInt(ea.dataset.i, 10)); },
    releer() { leerExpedienteActual(); },
    descartar(ctx, id) {
      const i = COLA.findIndex((x) => x.id === id);
      if (i >= 0) COLA.splice(i, 1);
      pintarDescargas();
    }
  };
  function clicEnElegirActuaciones(t) {
    const ea = t.closest('[data-ea]');
    if (!ea || ea.disabled) return false;
    const id = ea.closest('[data-elegir]').dataset.elegir;
    const ctx = ctxElegir(id);
    if (!ctx) return true;
    const a = ea.dataset.ea;
    if (Object.prototype.hasOwnProperty.call(ACCIONES_DE_ELEGIR, a)) ACCIONES_DE_ELEGIR[a](ctx, id, actsFiltradas(ctx), ea);
    return true;
  }

  // Los botones del cuadro de etiquetas y anotación de una causa (km).
  function crearEtiquetaDesdeCaja(caja, km) {
    const campo = caja.querySelector('.sj-et-nombre');
    guardarNotaAbierta();
    const id = crearEtiqueta(campo.value, colorElegido);
    if (!id) { campo.focus(); return; }
    if ((marcaDe(km).et || []).indexOf(id) < 0) alternarEtiqueta(km, id);
    if (VISTA === 'exp') pintarExpediente(); else { pintarFiltros(); pintarTabla(); }
    pintarCopia();
  }
  function guardarAnotacionDesdeCaja(caja, km) {
    const cuadro = caja.querySelector('.sj-nota');
    fijarMarca(km, { nota: cuadro.value });
    cuadro.defaultValue = cuadro.value;
    if (VISTA !== 'exp') pintarTabla();
    pintarCeldaMarcasAct(km);
    pintarCopia();
    // El aviso de guardado va en el cuadro que se guardó: en el expediente hay
    // más de uno (el de la causa y el de una actuación).
    const ok = caja.querySelector('.sj-ok') || q('[data-marca] .sj-ok');
    if (ok) { ok.classList.add('si'); setTimeout(() => ok.classList.remove('si'), 2200); }
  }
  function borrarAnotacionDesdeCaja(caja, km, b) {
    if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar el borrado'; return; }
    const cuadro = caja.querySelector('.sj-nota');
    if (cuadro) { cuadro.value = ''; cuadro.defaultValue = ''; }
    fijarMarca(km, { nota: '' });
    if (VISTA === 'exp') pintarExpediente(); else pintarTabla();
    pintarCopia();
  }
  function clicEnBoton(t) {
    const b = t.closest('[data-a]');
    if (!b || b.disabled) return true;
    const a = b.dataset.a;
    const k = b.dataset.k;
    if (b.closest('.sj-menu')) cerrarMenu();
    if (accionDeBoton(a, b, k)) return true;
    const caja = b.closest('[data-marca]');
    if (!caja) return true;
    const km = caja.dataset.marca;
    if (a === 'crearEt') crearEtiquetaDesdeCaja(caja, km);
    else if (a === 'guardarAnot') guardarAnotacionDesdeCaja(caja, km);
    else if (a === 'borrarAnot') borrarAnotacionDesdeCaja(caja, km, b);
    return true;
  }

  const ZONAS_DEL_CLIC = [
    clicEnMenu, clicEnSolapas, clicEnOrdenDeBandeja, clicEnPaginaDeBandeja, clicEnOrdenCP, clicEnPaginaCP, clicEnTituloDeColumna, clicEnPaginaDeLista,
    clicEnAbrirCausa, clicEnMasDeLaFila, clicEnMarcasDeActuacion, clicEnDetalleDeLaFila, clicEnColorDeEtiqueta, clicEnChipDeEtiqueta, clicEnElegirActuaciones, clicEnBoton
  ];
  function alClic(e) {
    const t = e.target;
    for (const zona of ZONAS_DEL_CLIC) if (zona(t, e)) return;
  }

  // Las acciones de los botones de la ventana, una función por acción (1.3.8).
  // Cada una recibe el botón (b), la clave de la causa de la fila (k) y el
  // nombre de la acción (a). Se llaman desde accionDeBoton.
  const ACCIONES_DE_BOTON = {
    min() { minimizar(); },
    cerrar() { cerrarVentana(); },
    max() { alternarMaxi(); },
    menuPJN(b) {
      if (menuAbierto && menuAbierto.dataset.ancla === 'menuPJN') { cerrarMenu(); return; }
      abrirMenu(b, menuPJNHTML());
    },
    menuCols(b, k, a) {
      if (menuAbierto && menuAbierto.dataset.ancla === a) { cerrarMenu(); return; }
      abrirMenu(b, menuColsHTML(a === 'menuColsAct' ? 'act' : 'lista'));
    },
    menuColsAct(b, k, a) { return ACCIONES_DE_BOTON.menuCols(b, k, a); },
    colsReset(b) {
      const tab = b.dataset.tabla || 'lista';
      const T = TABLAS[tab];
      CFG[T.cols] = T.def.map((c) => c.k);
      CFG[T.ocultas] = T.def.filter((c) => c.oculta).map((c) => c.k);
      CFG[T.anchos] = {};
      guardarCfg();
      repintarTabla(tab);
    },
    ordenPJNLista() {
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
    },
    ordenPJNlista2() {
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
    },
    novedades() {
      CFG.novedades = !CFG.novedades;
      guardarCfg();
      PAGINA_VISTA.rel = 1;
      PAGINA_VISTA.fav = 1;
      pintarFiltros();
      pintarTabla();
      pintarEstado();
      avisar(CFG.novedades ? 'Solo las causas que se movieron desde la última vez que las miraste.' : 'Se ven todas las causas de nuevo.');
    },
    vistoTodo() {
      fotoVisto();
      if (CFG.novedades) { CFG.novedades = false; guardarCfg(); }
      pintarFiltros();
      pintarTabla();
      pintarEstado();
      avisar('Listo: todas quedaron como vistas.');
    },
    vistoUna(b, k) {
      marcarVisto(k);
      pintarTabla();
      pintarFiltros();
    },
    horas() { averiguarHoras().catch((e) => avisar('No se pudo averiguar la hora: ' + mensajeDe(e) + '.', true)); },
    zoomMas() { cambiarZoom(zoomVecino(1)); },
    zoomMenos() { cambiarZoom(zoomVecino(-1)); },
    zoomCien() { cambiarZoom(1); },
    actualizar() { avisar(''); actualizar(); },
    cortarLectura() { cancelarLectura = true; cortarHoras = true; estadoTxt('Cancelando...'); },
    limpiar() {
      Object.assign(CFG, { texto: '', fuero: '', sit: '', tramite: 'todas', etiqueta: '', desde: '', hasta: '', novedades: false });
      PAGINA_VISTA.rel = 1;
      PAGINA_VISTA.fav = 1;
      guardarCfg();
      pintarFiltros();
      pintarTabla();
    },
    irMarcas() { irAVista('marcas'); },
    quitarSel() { selVista().clear(); pintarTodo(); },
    quitarUna(b, k) { selVista().delete(k); pintarTodo(); },
    notaSel() { pedirNota([...selVista()]); },
    usarLista(b) { irALista(b.dataset.lista); pintarTodo(); },
    verSolapa(b) {
      const idSolapa = b.dataset.sol;
      const s = EXP.solapas[idSolapa];
      if (!s) return;
      // Desde la 1.7.0 solo lo usan "Volver a leer" y "Probar de nuevo".
      s.estado = 'nada';
      s.abierta = true;
      leerSolapa(idSolapa);
    },
    verPest(b) { irAPestanaExp(b.dataset.pest); },
    cerrarActM() { guardarNotaAbierta(); EXP.actAbierta = null; pintarElegir('exp'); },
    abrirVinc(b, k) { abrirVinculado(k, false); },
    abrirVincNueva(b, k) { abrirVinculado(k, true); },
    bajarVinc(b, k) { bajarVinculado(k); },
    salirPJN() {
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
    },
    cedulaUna(b, k) { dejarCedula(k); },
    deoxUna(b, k) { nuevoDeox(k); },
    verEscr(b, k) { bandejaDeCausa('escr', k); },
    verNotif(b, k) { bandejaDeCausa('notif', k); },
    verDeox(b, k) { bandejaDeCausa('deox', k); },
    respuestaDeox(b, k) { abrirRespuestaDeox(k); },
    verGuia(b, k) { guiaDeDependencia(depDe(k), k); },
    mpInterv(b) { mpInterviniente(b); },
    bandConsultar(b) { consultarBandeja(b.dataset.v); },
    bandSinCausa(b) { BAND[b.dataset.v].causa = null; consultarBandeja(b.dataset.v); },
    bandVer(b) { pdfBandeja(b.dataset.v, b.dataset.id, false); },
    bandBajar(b) { pdfBandeja(b.dataset.v, b.dataset.id, true); },
    guiaDep(b) { guiaDeDependencia(b.dataset.dep); },
    guiaBuscar() { guiaBuscar(); },
    guiaPag(b) { guiaBuscar(Math.max(0, parseInt(b.dataset.p, 10) || 0)); },
    guiaInicio() { guiaInicio(); },
    guiaAbrir(b) { GUIA.nota = ''; guiaAbrir(b.dataset.cod, true); },
    guiaVolver() { guiaVolver(); },
    guiaCopiar() { guiaCopiar(); },
    mpCopiar(b) { mpCopiar(b.dataset.id); },
    mpActualizar() { mpActualizar(); },
    cpBuscar() { cpBuscar(); },
    cpFueros(b, k, a) {
      if (menuAbierto && menuAbierto.dataset.ancla === a) { cerrarMenu(); return; }
      abrirMenu(b, menuFuerosCPHTML());
    },
    cpGrupo(b) { grupoDeFuerosCP(b.dataset.g); },
    cpDetener() { detenerCP(); },
    cpSaltar() { saltarFueroCP(); },
    cpReintentar(b) { reintentarCP(b.dataset.s || ''); },
    cpAbrir(b) { cpAbrir(b.dataset.id); },
    cpCopiar(b) { cpCopiar(b.dataset.id); },
    cpCopiarTodo() { cpCopiarTodo(); },
    menuExportar(b, k, a) {
      if (menuAbierto && menuAbierto.dataset.ancla === a) { cerrarMenu(); return; }
      abrirMenu(b, menuExportarHTML());
    },
    exportarTabla(b) { exportarVista(b.dataset.fmt); },
    diagnostico() { revisarPJN(); },
    cortarDiag() { cortarDiag(); },
    copiarDiag() { copiarCuadro('diagTexto', 'Informe copiado.'); },
    copiarFallas() { copiarCuadro('fallasTexto', 'Registro copiado.'); },
    borrarFallas() {
      if (!FALLAS.length) { avisar('El registro ya está vacío.'); return; }
      const n = FALLAS.length;
      borrarFallas();
      pintarFallas();
      avisar('Registro vaciado: se quitaron ' + plural(n, 'entrada', 'entradas') + '.');
    },
    notaTodas() { pedirNota(null); },
    // Verificar es el mismo lote de siempre, con las dudosas como selección:
    // el PJN admite una sola nota por expediente y por día, así que o avisa
    // que ya estaba, o la deja porque faltaba. No hay mecanismo nuevo.
    verificarDudosas() {
      const d = dudosasDeHoy();
      if (!d.length) { avisar('No hay ninguna causa a verificar de hoy.', true); return; }
      pedirNota(d);
    },
    bajarSel() { bajarCausas([...selVista()]); },
    elegirSel() { elegirActuaciones([...selVista()][0]); },
    cortarNota() { cortarNota(); },
    abrir(b, k) { abrirCausa(k, false); },
    abrirNueva(b, k) { abrirCausa(k, true); },
    libro(b, k) { libroDigital(k); },
    escrito(b, k) { presentarEscrito(k); },
    bajarUna(b, k) { bajarCausas([k]); },
    elegirUna(b, k) { elegirActuaciones(k); },
    notaUna(b, k) { pedirNotaDeUna(k); },
    // Se descarta recién si la tanda arrancó (1.6.3): si se la rechaza (por
    // ejemplo, por descargas en curso), el botón tiene que seguir sirviendo.
    notaElegida() { const k = notaElegida; if (!k) return; pedirNota([k]); if (leerSesion(S_ENCARGO)) notaElegida = null; },
    descartarElegida() { notaElegida = null; pintarTodo(); },
    marcasUna(b, k) {
      abierta = k;
      pintarTabla();
      setTimeout(() => { const c = q('.sj-det-in[data-marca]'); if (c) { c.scrollIntoView({ block: 'nearest' }); const n = c.querySelector('.sj-et-nombre'); if (n) n.focus(); } }, 30);
    },
    seguirAhora() { saltarPausa(); },
    cortarCola() {
      cortarCola = true;
      cortePedidoEn = Date.now();
      // También las que están esperando que elijas actuaciones: si no, el botón
      // decía "cancelar" y esas quedaban ahí, bloqueando el aviso al salir.
      COLA.forEach((x) => { if (x.estado === 'en cola' || x.estado === 'a descargar' || x.estado === 'eligiendo') { x.estado = 'cancelado'; x.texto = 'Cancelado.'; } });
      pintarDescargas();
    },
    limpiarCola() {
      for (let i = COLA.length - 1; i >= 0; i--) if (/listo|error|cancelado/.test(COLA[i].estado)) COLA.splice(i, 1);
      pintarDescargas();
    },
    volverLista() { location.href = RUTA.rel; },
    leerTodoExp() { leerExpedienteActual(true); },
    recargar() { location.reload(); },
    recargarApp(b) {
      // Recargar corta lo que esté en curso: si hay trabajo, se pide confirmar.
      if ((bloqueoNota() || bajandoAlgo()) && !b.classList.contains('peligro')) {
        b.classList.add('peligro');
        b.textContent = 'Confirmar: se cancela lo que está en curso';
        avisar('Hay trabajo en curso (dejar nota o descargas). Si recargás, se cancela.', true);
        return;
      }
      location.reload();
    },
    notaPJN() {
      const x = botonPJN(PJN.botonExp.nota);
      if (!x) { avisar('No se encuentra el botón "Dejar Nota" del PJN en esta página.', true); return; }
      minimizar();
      x.click();
    },
    escritoPJN() {
      const x = botonPJN(PJN.botonExp.escrito);
      if (!x) { avisar('No se encuentra "Presentar escrito" en esta página.', true); return; }
      x.click();
    },
    exportar() {
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
    },
    guardarContra() {
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
    },
    pisarCarpeta(b) {
      if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar: se reemplaza el respaldo de la carpeta'; return; }
      pisarCarpeta().then((ok) => {
        pintarCopia();
        irAVista('marcas');
        avisar(ok ? 'Listo: el respaldo de la carpeta tiene ahora los datos de esta PC, con la contraseña de esta PC.' : 'No se pudo guardar en la carpeta: ' + (carpetaAviso || 'revisá el permiso') + '.', !ok);
      }).catch((e) => avisar('No se pudo guardar en la carpeta: ' + mensajeDe(e) + '.', true));
    },
    verContra() { mostrarContra = true; irAVista('marcas'); },
    ocultarContra() { mostrarContra = false; irAVista('marcas'); },
    elegirCarpeta() {
      elegirCarpeta().then((r) => {
        irAVista('marcas');
        avisar('Carpeta conectada: SuPJN+ va a guardar las etiquetas, las anotaciones y las notas en ' + r.nombre + ', y a leer de ahí al abrir.' +
            (r.git ? ' Atención: esa carpeta parece un repositorio de Git. Si la subís a GitHub, las anotaciones quedarían públicas. Elegí otra.' : ''), !!r.git);
        return conectarCarpeta(false);
      }).then(() => { pintarCopia(); if (VISTA === 'marcas') irAVista('marcas'); })
        .catch((e) => { if (!/abort/i.test(String(e && e.name))) avisar('No se pudo usar esa carpeta: ' + mensajeDe(e) + '.', true); });
    },
    conectarCarpeta() {
      conectarCarpeta(true).then(() => { irAVista('marcas'); avisar(carpetaEstado === 'lista' ? 'Carpeta conectada: se guarda e importa automáticamente.' : 'No se pudo conectar la carpeta.', carpetaEstado !== 'lista'); })
        .catch(() => avisar('No se pudo conectar la carpeta.', true));
    },
    guardarCarpeta() {
      escribirEnCarpeta().then((ok) => { pintarCopia(); if (VISTA === 'marcas') irAVista('marcas'); avisar(ok ? 'Guardado en la carpeta.' : 'No se pudo guardar: ' + (carpetaAviso || 'revisá el permiso de la carpeta') + '.', !ok); })
        .catch((e) => avisar('No se pudo guardar en la carpeta: ' + mensajeDe(e) + '.', true));
    },
    importar() { q('[data-e="archivo"]').click(); },
    borrarEt(b) {
      if (!b.classList.contains('peligro')) { b.classList.add('peligro'); b.textContent = 'Confirmar: se quita de todas'; return; }
      borrarEtiqueta(b.dataset.id);
      irAVista('marcas');
    },
    cerrarDet() { guardarNotaAbierta(); abierta = null; pintarTabla(); },
  };

  // Despacha el botón a su acción. Devuelve false si no hay acción con ese nombre.
  function accionDeBoton(a, b, k) {
    if (!Object.prototype.hasOwnProperty.call(ACCIONES_DE_BOTON, a)) return false;
    ACCIONES_DE_BOTON[a](b, k, a);
    return true;
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

  // La pausa entre bloques. Devuelve true si se canceló mientras tanto.
  async function pausaEntreBloques() {
    estadoTxt('Pausa de ' + Math.round(PAUSA_BLOQUE / 1000) + ' segundos para no saturar al PJN...');
    for (let e = 0; e < PAUSA_BLOQUE && !cortarHoras; e += 500) await dormir(500);
    return cortarHoras;
  }

  // La hora de una causa. Devuelve 'hecha', 'otraFecha', 'falla' o 'vencida'.
  // Lo que no se pudo averiguar queda anotado como probado: si no, cada vez se
  // descargarían los mismos quince documentos y nunca se llegaría a los demás.
  async function averiguarUnaHora(k) {
    const c = causaPorClave(k);
    const ult = c ? c.ult : '';
    const noSePudo = () => { if (ult) guardarHora(k, { f: '', hh: '', t: Date.now(), origen: '', pedida: ult }); return 'falla'; };
    try {
      const a = await ultimaActuacionConPDF(k, () => { /* sin avisos */ });
      if (!a) return noSePudo();
      const r = await traerPDF(a.url, { exp: k, act: 'última actuación con documento' });
      if (r && r.vencida) return 'vencida';
      const h = r && r.buf ? horaDePDF(r.buf) : null;
      if (!h) return noSePudo();
      // Se guarda también para qué fecha se preguntó: si el documento es de
      // otro día, no sirve para desempatar, pero queda anotado que ya se probó
      // y no se lo vuelve a descargar cada vez.
      guardarHora(k, { f: h.f, hh: h.hh, t: Date.now(), origen: h.origen, pedida: ult });
      if (esVistaLista()) pintarTabla();
      return h.f === ult ? 'hecha' : 'otraFecha';
    } catch (e) {
      // Una sesión vencida no es una causa probada: se corta sin anotarla, para
      // volver a intentarla después de entrar de nuevo. Hasta la 1.6.0 quedaba
      // anotada como probada y ya no se la volvía a intentar.
      if (String(e && e.message) === VENCIDA) return 'vencida';
      return noSePudo();
    }
  }

  function mensajeHoras(cortado, n, faltan) {
    if (cortado) return 'Se interrumpió: ' + cortado + '.';
    return plural(n.hecha, 'hora averiguada', 'horas averiguadas') +
      (n.otraFecha ? '. En ' + plural(n.otraFecha, 'causa', 'causas') + ' el último documento con PDF es de otro día que la última actuación, así que no sirve para desempatar (no se vuelve a descargar)' : '') +
      (n.falla ? '. En ' + plural(n.falla, 'causa', 'causas') + ' no se pudo: la última actuación puede no tener documento firmado' : '') +
      '.' + (faltan ? ' Quedan ' + faltan + ' para la próxima vez: van hasta ' + TOPE_DESCARGAS + ' por vez.' : '') +
      (n.hecha ? ' ' + compararConElPJN() : '');
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
    const n = { hecha: 0, otraFecha: 0, falla: 0 };
    let cortado = '';
    try {
      for (let i = 0; i < claves.length; i++) {
        if (cortarHoras || (i && i % BLOQUE_DESCARGAS === 0 && (await pausaEntreBloques()))) { cortado = 'cancelado'; break; }
        estadoTxt('Averiguando la hora de ' + claves[i] + ' (' + (i + 1) + ' de ' + claves.length + ')... Se puede cancelar.');
        const r = await averiguarUnaHora(claves[i]);
        if (r === 'vencida') { cortado = VENCIDA; break; }
        n[r]++;
      }
    } finally {
      horasEnCurso = false;
      cortarHoras = false;
      pintarBotonesLectura();
    }
    if (esVistaLista()) { pintarTabla(); pintarEstado(); }
    avisar(mensajeHoras(cortado, n, todas.length - claves.length), !!cortado);
  }

  // ¿El PJN ordena por la hora de la firma? Se compara, con las causas que
  // empatan en la fecha y ya tienen hora, el orden en que las manda el PJN contra
  // el orden de las horas. Es la única forma de saberlo: el criterio no lo publica.
  function compararConElPJN() {
    const porFecha = {};
    filtradas().forEach((c) => {
      const h = HORAS[c.exp];
      // El lugar en la lista, como en valorOrden: sin "Ver todos", el de trámite.
      const pos = c.pos != null ? c.pos : c.posTramite;
      if (!h || h.f !== c.ult || pos == null) return;
      (porFecha[c.ult] = porFecha[c.ult] || []).push({ pos, hh: h.hh });
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

  async function leerSolapa(solapa, auto) {
    const s = EXP.solapas[solapa];
    if (!s || s.estado === 'leyendo') return;
    if (!auto) s.abierta = true;
    if (!CID_PAGINA) {
      s.estado = 'error';
      s.texto = 'No se encuentra el número de consulta (cid) en la dirección de la página: recargala desde la lista.';
      pintarSolapaExp(solapa);
      return;
    }
    s.estado = 'leyendo';
    s.texto = 'Consultando al PJN...';
    pintarSolapaExp(solapa);
    try {
      const r = await leerSolapaExp(CID_PAGINA, solapa, (t) => { s.texto = t; pintarSolapaExp(solapa); });
      s.cabs = r.cabs;
      s.filas = r.filas;
      s.grupos = r.grupos || [];
      s.completa = r.completa !== false;
      s.fecha = Date.now();
      s.estado = 'listo';
      s.texto = '';
    } catch (e) {
      s.estado = 'error';
      s.texto = 'No se pudo leer ' + TITULO_SOLAPA[solapa] + ': ' + mensajeDe(e) + '.';
    }
    pintarSolapaExp(solapa);
  }

  async function abrirVinculado(k, nueva) {
    if (ocupado()) return;
    const w = nueva ? pestanaNueva('_blank', k) : null;
    if (nueva && !w) return;
    if (!nueva) cederLectura();
    accionEnCurso = true;
    try {
      const url = await direccionVinculado(CID_PAGINA, k, (t) => avisar(t));
      if (w) { listaPestana(w); w.location.replace(url); avisar('Se abrió ' + k + ' en una pestaña nueva.'); }
      else { avisar('Abriendo ' + k + '...'); irEnEstaPestana(url); }
    } catch (e) {
      cerrarPestana(w);
      avisar('No se pudo abrir ' + k + ': ' + mensajeDe(e) + '.', true);
      retomarLectura();
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

  // La revisión del PJN (1.3.8: partida en un paso por elemento). Cada paso
  // recibe la revisión en curso (R) y devuelve false cuando hay que detenerse
  // (la sesión venció, no hay causas). R lleva lo que comparten los pasos:
  // anotar, fallo, vivo, el marco oculto y lo leído de la lista.
  function crearRevision(mia) {
    const R = { mia, fr: null, primeras: new Set(), d: null, filas: [] };
    R.vivo = () => diagN === mia;
    // aviso: algo que impide revisar (la sesión venció, no hay internet) y que
    // no es un cambio del PJN.
    R.anotar = (nombre, ok, detalle, aviso) => {
      if (!R.vivo()) return;
      DIAG.items.push({ nombre, ok, detalle: sinNumeroDeCausa(detalle), aviso: aviso || '' });
      pintarDiag();
    };
    R.esVencida = (e) => String(e && e.message ? e.message : e) === VENCIDA;
    // Un error puede ser un cambio del PJN, pero también la sesión vencida o
    // datos viejos: eso no se anuncia como cambio.
    R.fallo = async (nombre, e) => {
      sesionMirada.ts = 0;
      if (R.esVencida(e) || (await sesionVencida())) { R.anotar(nombre, false, 'la sesión del PJN venció en medio de la revisión', 'venció'); return; }
      const m = String(e && e.message ? e.message : e);
      if (/no encuentro .* en (las listas|Relacionados)/i.test(m)) R.anotar(nombre, null, 'la causa de prueba ya no está en la lista: actualizá las listas y revisá de nuevo');
      else R.anotar(nombre, false, mensajeDe(e));
    };
    R.soltar = () => { if (R.fr) { R.fr.remove(); R.fr = null; } };
    // Los marcos de la revisión aceptan cualquier página del PJN: si cambió la
    // tabla, se quiere saber eso y no solo que la página "no era la esperada".
    R.abrirMarco = async (nombre, url) => {
      R.fr = crearMarco();
      try {
        await esperarCarga(R.fr, () => { R.fr.src = url; }, () => true);
        return true;
      } catch (e) {
        // El marco que no cargó no queda colgado en la página (1.6.3).
        R.soltar();
        await R.fallo(nombre, e);
        return false;
      }
    };
    return R;
  }
  const diceSinCausas = (d) => /no se encontraron|no posee|sin resultados/i.test(limpio(textoPJN(d)).slice(0, 6000));

  async function pasoConexionYSesion(R) {
    if (window.navigator.onLine === false) { R.anotar('Conexión', false, 'el navegador está sin conexión a internet', 'sin conexión'); return false; }
    sesionMirada.ts = 0;
    if (await sesionVencida()) { R.anotar('Sesión del PJN', false, 'venció: recargá la página, volvé a entrar si lo pide y probá de nuevo', 'venció'); return false; }
    R.anotar('Sesión del PJN', true, 'activa');
    // Con qué cuenta entró: es lo que separa los datos de una cuenta de los de
    // otra, así que si esto no se lee, SuPJN+ no muestra ni guarda nada.
    if (CUENTA) R.anotar('Cuenta del PJN', true, 'se leyó del encabezado: ' + cuentaCorta());
    else R.anotar('Cuenta del PJN', false, 'no se encuentra en el encabezado: sin ese dato no se muestra ni se guarda nada, para no mezclar dos cuentas');
    // El enlace para salir: se lo busca por su texto, así que un cambio de
    // rótulo del PJN deja el botón sin destino y conviene enterarse acá.
    const salir = enlaceSalirPJN();
    R.anotar('Cerrar sesión', !!salir, salir ? 'está el enlace del PJN para salir' : 'no se encuentra el enlace para salir: el botón de cerrar sesión no va a funcionar');
    return R.vivo();
  }

  // La lista de Relacionados y lo que SuPJN+ usa de ella.
  async function pasoListaDeRelacionados(R) {
    if (!await R.abrirMarco('Lista de Relacionados', RUTA.rel)) return false;
    if (!R.vivo()) return false;
    R.d = R.fr.contentDocument;
    const esRel = tipoLista(R.d) === 'rel';
    R.anotar('Lista de Relacionados', esRel, esRel ? 'se abre y tiene su título' : 'se abre, pero no aparece el título "Lista de Expedientes Relacionados"');
    R.filas = filasDe(R.d);
    R.primeras = new Set(R.filas.map((f) => f.exp));
    return true;
  }
  function pasoTablaDeCausas(R) {
    const d = R.d, filas = R.filas;
    const tabla = tablaDe(d);
    const crudas = tabla ? filasTabla(tabla).filter((t) => t.cells && t.cells.length > 1).length : 0;
    if (tabla && filas.length) R.anotar('Tabla de causas', crudas === filas.length, crudas === filas.length
      ? plural(filas.length, 'causa', 'causas') + ' en la primera página, y se leen'
      : 'de ' + plural(crudas, 'fila', 'filas') + ' se leen ' + filas.length + ': puede haber cambiado alguna columna');
    else if (tabla && crudas) R.anotar('Tabla de causas', false, 'tiene filas, pero en ninguna se lee un número de expediente en la primera columna');
    else if (tabla) R.anotar('Tabla de causas', true, 'está, sin causas');
    else if (diceSinCausas(d)) R.anotar('Tabla de causas', null, 'el PJN dice que no hay causas: no se puede mirar la tabla');
    else R.anotar('Tabla de causas', false, 'no se encuentra la tabla con "Expediente" y "Carátula" en el encabezado');
    return true;
  }
  function pasoColumnasDeLaLista(R) {
    const filas = R.filas;
    if (!filas.length) return true;
    const mal = [];
    if (filas.some((f) => /:/.test(f.exp))) mal.push('el número de expediente trae un rótulo pegado');
    if (!filas.some((f) => f.car)) mal.push('la carátula viene vacía en todas');
    // Que una causa nueva no tenga última actuación es normal; que ninguna
    // de las que tienen algo se lea como fecha, no.
    if (filas.some((f) => f.ult) && !filas.some((f) => esFechaPJN(f.ult))) mal.push('la última actuación no se lee como fecha');
    R.anotar('Columnas de la lista', !mal.length, mal.length ? mal.join('; ') : 'expediente, dependencia, carátula, situación y última actuación se leen');
    return true;
  }
  function pasoPaginadorYControles(R) {
    const d = R.d;
    const pag = paginadorDe(d);
    R.anotar('Paginador', pag ? true : null, pag ? 'está' : 'no hay: la lista entra en una sola página');
    const casilla = casillaVerTodos(d), consultar = botonConsultar(d);
    R.anotar('"Ver todos los expedientes" y Consultar', !!(casilla && consultar), casilla && consultar ? 'están (sirven para leer las causas fuera de trámite)' : (casilla ? 'falta el botón Consultar' : 'falta la casilla "Ver todos los expedientes"'));
    return true;
  }
  function pasoEnlacesDeLaFila(R) {
    const d = R.d;
    const tr = R.filas[0] && R.filas[0].tr;
    if (!tr) { R.anotar('Enlace para abrir la causa', null, 'no hay causas en la lista para mirarlo'); return true; }
    const ojo = enlaceOjo(tr);
    const pr = ojo && paramsDeEnlace(ojo);
    const form = pr && d.getElementById(pr.formId);
    R.anotar('Enlace para abrir la causa', !!form, form ? 'está y se entiende' : (ojo ? (pr ? 'está, pero no se encuentra su formulario' : 'está, pero cambió la forma del enlace') : 'no se encuentra el enlace de apertura en la fila'));
    const libro = enlaceMenu(tr, PJN.menuFila.libro), escrito = enlaceMenu(tr, PJN.menuFila.escrito);
    R.anotar('Libro digital y Presentar escrito', !!(libro && escrito), libro && escrito ? 'están en el menú de la fila' : 'falta ' + [libro ? '' : '"Libro digital"', escrito ? '' : '"Presentar escrito"'].filter(Boolean).join(' y '));
    return true;
  }
  function pasoCuentaYDejarNota(R) {
    const d = R.d;
    // La cuenta: sin ella no se lee ni se guarda nada de lo propio.
    R.anotar('La cuenta en la página', !!CUENTA,
      CUENTA ? 'el encabezado del PJN muestra la cuenta y se lee' : 'no se encuentra la cuenta en el encabezado: revisá que la sesión esté abierta');
    // Las mismas búsquedas que usa el motor de dejar nota, sobre el marco.
    const filtro = botonFiltroNota(d), cartel = cartelNota(d), confirmar = botonConfirmar(d);
    const faltan = [filtro ? '' : 'el botón "Dejar nota"', cartel ? '' : 'el cartel de confirmación', confirmar ? '' : 'el botón Confirmar'].filter(Boolean);
    R.anotar('Dejar nota', !faltan.length, faltan.length ? 'falta ' + faltan.join(', ') : 'están el filtro, el cartel y Confirmar (el lápiz aparece con el filtro puesto, y eso no se prueba para no dejar ninguna nota)');
    R.soltar();
    return true;
  }
  async function pasoFavoritos(R) {
    R.fr = crearMarco();
    try {
      await esperarCarga(R.fr, () => { R.fr.src = RUTA.fav; }, () => true);
      const df = R.fr.contentDocument;
      const esFav = tipoLista(df) === 'fav', seLee = !!tablaDe(df) || diceSinCausas(df);
      R.anotar('Lista de Favoritos', esFav && seLee, esFav && seLee ? 'se abre y se lee' : (!esFav ? 'se abre, pero no aparece el título "Lista de Expedientes Favoritos"' : 'se abre, pero no se encuentra su tabla'));
    } catch (e) {
      await R.fallo('Lista de Favoritos', e);
      if (R.esVencida(e)) return false;
    }
    R.soltar();
    return R.vivo();
  }
  // Escritos, Notificaciones, DEOX y la Guía: se abren en segundo plano y se
  // les pide una lista corta, de la última semana. Solo lectura.
  async function pasoUnaBandeja(R, v) {
    const E = EXT[v], D = BANDEJAS[v];
    try {
      const ruta = D.ruta + '?bandeja=' + D.opciones[0][0] + '&fechaDesde=' + fechaAPI(isoHace(7)) + '&fechaHasta=' + fechaAPI(hoyISO());
      const r = await pedirPuente(E.app, { op: 'lista', ruta, tope: 1, porPagina: 5 });
      const items = r && Array.isArray(r.items) ? r.items : [];
      const f = items.length ? D.fila(items[0], D.opciones[0][0]) : null;
      if (!f) R.anotar(E.nombre, true, 'responde con la misma cuenta (no hay elementos de la última semana para mirar los datos)');
      else R.anotar(E.nombre, !!(f.exp && f.fecha), f.exp && f.fecha ? 'responde con la misma cuenta, y se leen el expediente y la fecha' : 'responde, pero no se leen ' + (f.exp ? 'la fecha' : 'el expediente') + ': puede haber cambiado la forma de los datos');
    } catch (e) {
      R.anotar(E.nombre, false, String(e && e.message ? e.message : e));
    }
  }
  async function pasoBandejas(R) {
    for (const v of ['escr', 'notif', 'deox']) {
      if (!R.vivo()) return false;
      await pasoUnaBandeja(R, v);
    }
    return R.vivo();
  }
  async function pasoGuia(R) {
    try {
      const g = await pedirPuente('guia', { op: 'json', ruta: rutaGuia('guia-inicio') });
      const ok = !!(g && g.dependencia && Array.isArray(g.subDependencias) && g.subDependencias.length);
      R.anotar('Guía judicial', ok, ok ? 'responde y trae su índice' : 'responde, pero cambió la forma de los datos');
    } catch (e) {
      R.anotar('Guía judicial', false, String(e && e.message ? e.message : e));
    }
    return R.vivo();
  }
  // La consulta pública (1.6.0): el formulario, sus dos búsquedas y el
  // desafío. No se consulta nada: se abre el formulario y se pasa a la solapa
  // "Por parte", que el PJN dibuja recién al tocarla.
  async function pasoConsultaPublica(R) {
    if (!await R.abrirMarco('Consulta pública', PJN.publica.ruta)) return R.vivo();
    try {
      if (!esFormPublica(R.fr.contentDocument)) R.anotar('Consulta pública', false, 'no se encuentra el formulario de la consulta pública');
      else {
        revisarNumeroCP(R);
        await pasarAPorParteCP(R.fr);
        revisarParteCP(R);
      }
    } catch (e) {
      R.anotar('Consulta pública por parte', false, mensajeDe(e));
    }
    R.soltar();
    return R.vivo();
  }
  function revisarNumeroCP(R) {
    const d = R.fr.contentDocument, N = PJN.publica.numero;
    const faltan = [[N.camara, 'la jurisdicción'], [N.numero, 'el número'], [N.anio, 'el año'], [N.boton, 'Consultar']].filter(([id]) => !d.getElementById(id)).map((x) => x[1]);
    const cam = d.getElementById(N.camara);
    const sinFuero = cam ? FUEROS_CP.filter((f) => !opcionDeFuero(cam, f.sigla)).map((f) => f.sigla) : [];
    R.anotar('Consulta pública por número', !faltan.length && !sinFuero.length,
      faltan.length ? 'falta ' + faltan.join(', ') : sinFuero.length ? 'la lista de jurisdicciones no trae ' + sinFuero.join(', ') : 'están los 28 fueros, el número, el año y Consultar');
  }
  function revisarParteCP(R) {
    const d = R.fr.contentDocument, P = PJN.publica.parte;
    const faltan = [[P.camara, 'la jurisdicción'], [P.tipo, 'el tipo de parte'], [P.nombre, 'el nombre'], [P.boton, 'Consultar']].filter(([id]) => !d.getElementById(id)).map((x) => x[1]);
    R.anotar('Consulta pública por parte', !faltan.length, faltan.length ? 'falta ' + faltan.join(', ') : 'están la jurisdicción, el tipo de parte, el nombre y Consultar');
    const desafio = !!d.querySelector(PJN.publica.desafio);
    R.anotar('Desafío de la consulta pública', desafio ? null : true, desafio
      ? 'el PJN pide resolver un desafío: al buscar, SuPJN+ lo muestra y espera a que lo resuelvas'
      : 'con la sesión iniciada, el PJN no pide desafío');
  }

  // Un expediente: abrirlo, sus datos, sus actuaciones y un PDF. Se prueba
  // con una causa en trámite ya leída, mejor de la primera página.
  async function pasoAbrirUnaCausa(R) {
    const leidas = (DATOS.rel && DATOS.rel.causas) || [];
    const causa = leidas.find((c) => c.tramite && R.primeras.has(c.exp)) || leidas.find((c) => c.tramite);
    if (!causa) { R.anotar('Abrir una causa', null, 'no hay causas en trámite leídas en Mis causas para probar'); return false; }
    let url;
    try {
      // Sin reusar el marco de trabajo que haya quedado de antes: la revisión
      // tiene que abrir la lista de nuevo y no mirar una copia vieja. Va en su
      // propio turno porque conMarco no se puede anidar.
      await conMarco(() => { soltarMarcoTrabajo(); });
      url = await direccionDe(causa.exp, 'ojo', () => { /* sin avisos */ });
      R.anotar('Abrir una causa', true, 'se abre en segundo plano');
    } catch (e) {
      await R.fallo('Abrir una causa', e);
      return false;
    }
    if (!R.vivo()) return false;
    if (!await R.abrirMarco('Página del expediente', url)) return false;
    return R.vivo();
  }
  function pasoDatosYSolapasDelExpediente(R) {
    const de = R.fr.contentDocument;
    const dx = datosExpediente(de);
    R.anotar('Datos del expediente', !!dx.exp, !dx.exp ? 'no se encuentra "Expediente:" en los datos generales' : dx.car ? 'se leen el número y la carátula' : 'se lee el número, pero no la carátula');
    // Las otras solapas del expediente, por el texto de su cabecera.
    const solapas = Object.keys(PJN.solapasExp).filter((k) => cabezaSolapa(de, PJN.solapasExp[k]));
    R.anotar('Solapas del expediente', solapas.length === 3,
      solapas.length === 3
        ? 'están Intervinientes, Vinculados y Recursos'
        : (solapas.length ? 'falta ' + Object.keys(PJN.solapasExp).filter((k) => solapas.indexOf(k) < 0).map((k) => PJN.solapasExp[k]).join(', ')
          : 'no se encuentra ninguna de las tres cabeceras donde el PJN las ponía'));
    return true;
  }
  async function pasoActuacionesYPDF(R) {
    const de = R.fr.contentDocument;
    const ta = tablaActuaciones(de);
    const acts = actuacionesDe(de, false);
    R.anotar('Tabla de actuaciones', !!ta, ta ? (acts.length ? plural(acts.length, 'actuación', 'actuaciones') + ' con PDF en la primera página' : 'está, sin actuaciones con PDF en la primera página') : 'no se encuentra la tabla con "Fecha" y "Tipo" en el encabezado');
    if (!acts.length) {
      if (ta) {
        R.anotar('Columnas de las actuaciones', null, 'no hay actuaciones con PDF en la primera página para mirarlas');
        R.anotar('Descargar un PDF', null, 'no hay actuaciones con PDF en la primera página para probar');
      }
      return true;
    }
    const conFecha = acts.some((a) => esFechaPJN(a.fecha));
    const conTipo = acts.some((a) => a.tipo);
    const rotulo = acts.some((a) => /:/.test(a.fojas));
    R.anotar('Columnas de las actuaciones', conFecha && conTipo && !rotulo,
      !conFecha ? 'la fecha no se lee como día/mes/año' : !conTipo ? 'el tipo de actuación viene vacío' : rotulo ? 'aparecen rótulos pegados a los valores: el PJN cambió cómo los marca' : 'fecha, tipo de actuación, descripción y fojas se leen');
    // Hasta tres actuaciones: alguna puede no tener un PDF de verdad.
    const n = Math.min(3, acts.length);
    let pdf = null;
    // La revisión prueba a propósito actuaciones que pueden no tener
    // documento, así que sus fallas no van al registro: lo llenarían de
    // entradas que no corresponden a un problema real.
    for (let i = 0; i < n && R.vivo() && !(pdf && (pdf.buf || pdf.vencida)); i++) pdf = await traerPDF(acts[i].url, { mudo: true });
    if (pdf && pdf.vencida) R.anotar('Descargar un PDF', false, 'la sesión del PJN venció en medio de la revisión', 'venció');
    else if (pdf && pdf.buf) R.anotar('Descargar un PDF', true, 'llega un PDF de ' + Math.max(1, Math.round(pdf.buf.byteLength / 1024)) + ' KB');
    else R.anotar('Descargar un PDF', false, 'no llegó un PDF de ' + (n === 1 ? 'la actuación probada' : 'ninguna de las ' + n + ' actuaciones probadas'));
    return true;
  }
  function pasoFormularioDeCedula(R) {
    // Lo único del mapa que la revisión no mira sola: el formulario de
    // Notificaciones. Abrirlo sería abrir una cédula nueva, así que se
    // comprueba al usar Dejar cédula, que avisa en qué paso se quedó.
    R.anotar('Formulario de cédula', null, 'no se prueba solo: se comprueba al dejar una cédula, y el cartel dice si el formulario cambió');
    return true;
  }

  const PASOS_DE_LA_REVISION = [
    pasoConexionYSesion, pasoListaDeRelacionados, pasoTablaDeCausas, pasoColumnasDeLaLista, pasoPaginadorYControles, pasoEnlacesDeLaFila,
    pasoCuentaYDejarNota, pasoFavoritos, pasoBandejas, pasoGuia, pasoConsultaPublica, pasoAbrirUnaCausa, pasoDatosYSolapasDelExpediente, pasoActuacionesYPDF, pasoFormularioDeCedula
  ];

  async function revisarPJN() {
    if (DIAG.estado === 'corriendo') { pintarDiag(); return; }
    if (bloqueoNota()) { avisar('Hay un lote de notas en curso: revisá el PJN cuando termine.', true); return; }
    const R = crearRevision(++diagN);
    DIAG.estado = 'corriendo';
    DIAG.items = [];
    DIAG.fecha = Date.now();
    pintarDiag();
    try {
      for (const paso of PASOS_DE_LA_REVISION) {
        if (!R.vivo()) return;
        if (!await paso(R)) return;
      }
    } catch (e) {
      await R.fallo('Revisión', e);
    } finally {
      R.soltar();
      if (R.vivo()) { DIAG.estado = 'listo'; pintarDiag(); }
    }
  }

  // ---------------------------------------------- 10.3 el expediente abierto

  // Lo que se agrega al resumen de actuaciones cuando la lectura quedó cortada.
  function textoCorte(c) {
    const donde = 'la página ' + c.pag + (c.hist ? ' de las actuaciones históricas' : '');
    if (c.salteada) {
      return '. Faltan las de ' + donde + ' en adelante: la última vez el PJN no contestó esa página y, para no trabar la causa, no se la volvió a pedir. Con "Leer todo" se la pide de nuevo.';
    }
    return '. El PJN no contestó ' + donde + ': se muestran las leídas hasta ahí. Mientras ese pedido siga abierto en el PJN, esta causa puede tardar o no responder durante unos minutos, también en la página del PJN. Con "Leer todo" se la pide de nuevo.';
  }

  // Resumen de la lectura de actuaciones para el estado de la sección.
  const textoLecturaExp = (r) => textoActuacionesLeidas(r) + (r.cortada ? textoCorte(r.cortada) : '. Elegí cuáles descargar o descargá todo.');

  // sinTope (1.5.3): "Leer todo" vuelve a pedir también la página anotada.
  async function leerExpedienteActual(sinTope) {
    if (EXP.estado === 'leyendo') return;
    const exp = (EXP.datos && EXP.datos.exp) || '';
    if (sinTope === true) borrarTope(exp);
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
      const r = await leerActuaciones(CID_PAGINA, (t) => { EXP.texto = t; pintarExpEstado(); }, () => EXP.cortar,
        { parcial: true, tope: topeGuardado(exp) });
      EXP.acts = r.actuaciones;
      EXP.movs = r.movimientos || [];
      // (1.7.0) La clave de las etiquetas y la anotación de cada actuación.
      numerarClavesAct((EXP.datos && EXP.datos.exp) || r.exp || '', EXP.acts, EXP.movs);
      EXP.elegidas = new Set();
      EXP.incompleta = r.cortada;
      EXP.estado = 'listo';
      EXP.texto = textoLecturaExp(r);
      if (!EXP.datos || !EXP.datos.exp) EXP.datos = r;
      if (r.cortada && !r.cortada.salteada) anotarTope(exp || r.exp, r.cortada);
      // Las partes tienen que estar siempre a la vista: Intervinientes se lee sola,
      // sin abrir la sección. Vinculados y Recursos, recién cuando se los pide.
      // Con una página recién sin respuesta la causa está trabada en el PJN: no
      // se le suma otro pedido; Intervinientes se lee al abrir la sección.
      if (!r.cortada || r.cortada.salteada) leerSolapa('int', true);
    } catch (e) {
      EXP.estado = 'error';
      EXP.texto = 'No se pudieron leer las actuaciones: ' + mensajeDe(e) + '.';
    }
    pintarExpEstado();
    pintarElegir('exp');
    pintarPestanas();
  }

  // ----------------------------------------------------------- 10.4 arranque

  // Lo que se lee al cargar la página: el expediente o las listas. En una
  // pestaña abierta para los datos de una fiscalía o defensoría, solo esos
  // datos, sin releer las listas (1.5.3).
  // Qué se lee solo al cargar la página (1.5.3), y desde cuándo se permite
  // releer las listas sin que se lo pida (1.6.3): en un expediente, después de
  // sus actuaciones; en la pestaña abierta para la ficha de una fiscalía o
  // defensoría, recién cuando se pasa a una lista. Hasta la 1.6.2, abrir la
  // ventana, volver a la pestaña o identificar la cuenta releían las listas
  // igual, también en esos casos.
  function lecturasAlCargar() {
    const pedidoMP = EN_EXPEDIENTE ? null : tomarEncargoMP();
    if (pedidoMP) { guiaDeMP(pedidoMP); return; }
    const permitir = () => { relecturaPermitida = true; refrescarSiHaceFalta(); };
    // La lectura informa sus errores en la pantalla: con error o sin él, sigue.
    if (EN_EXPEDIENTE) leerExpedienteActual().then(permitir, permitir);
    else permitir();
  }

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
        // La carpeta no se pudo leer sin la cuenta: ahora sí.
        if (fondoPuesto) conectarYMostrar();
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
    // Pedido del autor: SuPJN+ se abre solo, ocupando toda la pantalla, y lee
    // las listas en segundo plano mientras tanto. El indicador de abajo a la
    // derecha queda para cuando se lo minimiza o se lo cierra.
    aplicarZoom(false);
    pastilla.style.display = '';
    pintarTodo();
    abrirVentana();

    // La pestaña abierta para una ficha del Ministerio Público recibe de Chrome
    // una copia de la sesión de la pestaña que la abrió: una tanda de nota que
    // venga en esa copia no es de esta pestaña y no se sigue acá (1.6.3).
    if (MARCA_MP.test(location.hash || '')) { borrarSesion(S_CORRIDA); borrarSesion(S_ENCARGO); }
    // Con una tanda de nota en curso sí se abre sola: hay que poder seguirla y cortarla.
    const c = leerCorrida();
    if (c && c.activa) {
      VISTA = 'nota';
      abrirVentana();
      estadoNota(c.cortar ? 'Cerrando el lote...' : 'Retomando el lote...');
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

    engancharFondo();
  }

  // Las lecturas propias de la página, la carpeta de respaldo y los relojes de
  // la pantalla. Con una tanda de nota en curso el arranque no los pone, porque
  // cada paso recarga la página; se ponen al terminar, pausar o perder la
  // tanda, o si no llega a empezar, en la página donde se sigue trabajando.
  // Hasta la 1.6.0 esa página quedaba sin respaldo automático hasta recargarla,
  // y hasta la 1.6.2, sin las lecturas (por ejemplo, las actuaciones de un
  // expediente al que se llegaba con la tanda en pausa).
  let fondoPuesto = false;
  // Si hay una carpeta de respaldo elegida, se lee lo que haya, se muestra lo
  // que se importó y se guarda lo de acá.
  const conectarYMostrar = () => conectarCarpeta(false)
    .then((r) => { if (r && r !== true) pintarTodo(); pintarCopia(); })
    .catch(() => { /* sin carpeta se sigue igual */ });
  function engancharFondo() {
    if (fondoPuesto) return;
    fondoPuesto = true;
    lecturasAlCargar();
    conectarYMostrar();
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
      mismoExpediente, leerCartel, resultadoDelCartel, diceQueHayNota, diceFalla, tramoDelCartel, expedienteDelCartel,
      dudosasDeHoy, textoVisible, sinRotulo, esPDF, horaDePDF, sinNumeroDeCausa, partesDeCaratula, notas: () => NOTAS, normalizarNotas, normalizarMarcas, validarDatos,
      enterosExactos, anchosEncuadrados, repartirEncuadre, minCol, anchoDe, columnasVisibles, CFG, COLS_DEF, COLS_ACT_DEF, BLOQUE_DESCARGAS, TOPE_DESCARGAS,
      importarMarcas, marcas: () => MARCAS, valorOrdenAct, esMiTurno, soltarTurnoDeLaTanda, claveTurnoDe, resNota, acotarZoom, zoomVecino,
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
      tokensGuia, puntajeGuia, mejorGuia, enlaceMapa, direccionDependencia, direccionMP, combinarAnotacion,
      tokensPedidoMP, puntajePedidoMP, fichasDelPedido, palabrasPersona, textoDePedido, notaPedidoMP,
      tablasDePanel, tituloTabla, tablaPrincipal, gruposDePanel, columnasPartes, filaEscrito, filaNotif, filaDeox, estadoDeox, destinoDeox, tipoDeox,
      // La consulta pública (1.6.0).
      nombreParaPJN, letrasDe, numeroBuscado, objetoDe, tipoDeJuicio, tienePalabras, FUEROS_CP,
      // Exportar a Excel y a CSV (1.6.0).
      csvDe, archivosEx, zipDe, crc32, letraCol, serialDeFechaPJN, nombreHojaEx,
      elegirRespuestaDeox, numeroDeoRecibido,
      partesExp, expComparable, fechaAPI, msDe, RUTAS_PUENTE, menuPJNHTML, errorPuente, cuentaDelPuente, K_CEDULA,
      estadoCarpeta: () => ({ estado: carpetaEstado, aviso: carpetaAviso, bloqueada: carpetaBloqueada }),
      conectarCarpeta, importarDeCarpeta, pisarCarpeta, MARCA_ARCHIVO: MARCA,
      // El control de las listas leídas: total del PJN y caídas bruscas.
      totalDeclarado, faltanteDeLectura, esCaida, revisarCaida, CAIDA, INTENTOS_LECTURA,
      // 1.7.0: fechas en placas, notas del PJN, marcas por actuación y DEOX nuevo.
      edadFecha, fechaPlacaHTML, leerNotasPJN, datosDeNota, claveAct, esClaveAct, numerarClavesAct, clavesDeCausas, clavesDeActs, FORM_NUEVO, appDelPedido
    });
    return;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
