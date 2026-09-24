# -*- coding: utf-8 -*-
"""Banco de pruebas de SuPJN+ Movil (la aplicacion Android).

Corre el mismo userscript y los mismos sitios simulados que banco.py, pero con
la capa movil de la aplicacion puesta y con el puente por transporte nativo: la
ventana y cada aplicacion del PJN viven en paginas separadas, como en el
telefono viven en vistas separadas, y los mensajes los lleva la aplicacion.

Lo que se comprueba:
  - que el puente nativo funcione de punta a punta (lista, PDF y cuenta);
  - que los resguardos sigan valiendo con este transporte;
  - que el almacen, las descargas, las pestanas nuevas y los enlaces de afuera
    pasen por la aplicacion y no por el navegador;
  - que la ventana se dibuje para pantalla de telefono.
"""
import base64, json, os, sys, time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
BANCO = RAIZ / 'banco.py'
# Para las corridas con un resguardo roto a proposito.
APP = Path(os.environ.get('SUPJN_ASSETS') or (RAIZ.parent / 'android' / 'assets'))

fuente = BANCO.read_text(encoding='utf-8')
g = {'__name__': 'banco_android', '__file__': str(BANCO)}
exec(compile(fuente[:fuente.index('with sync_playwright() as p:')], str(BANCO), 'exec'), g)

sync_playwright = g['sync_playwright']
manejar = g['manejar']
ENVOLTORIO = g['ENVOLTORIO']
causas = g['causas']
CUENTA = g['CUENTA']
REG = g['REG']

AGENTE = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

movil_js = (APP / 'movil.js').read_text(encoding='utf-8')
movil_css = (APP / 'movil.css').read_text(encoding='utf-8')

RES = []


def chequear(nombre, cond, detalle=''):
    RES.append((nombre, bool(cond), detalle))
    print(('OK   ' if cond else 'MAL  ') + nombre + ((' -- ' + str(detalle)) if (detalle and not cond) else ''))


# --------------------------------------------------------------- la aplicacion
#
# El lado Android, imitado en Python: el almacen, las colas de mensajes del
# puente, los archivos guardados y los enlaces que se abrieron afuera.

class Aplicacion:
    APPS = {
        'escritos.pjn.gov.ar': 'escritos',
        'notif.pjn.gov.ar': 'notif',
        'deox.pjn.gov.ar': 'deox',
        'www.pjn.gov.ar': 'guia',
    }

    def __init__(self):
        self.colas = {'ventana': []}
        self.listos = {}
        self.abiertos = []      # (app, url) que la ventana mando abrir
        self.archivos = []      # (accion, nombre, tipo, bytes)
        self.afuera = []        # enlaces que salieron del telefono
        self.aca = []           # enlaces que se abrieron en la misma vista
        self.cerrados = []
        self.copiado = []

    def atender(self, origen, op, a=None, b=None, c=None):
        if op == 'abrirPuente':
            self.abiertos.append((a, b))
            self.colas.setdefault(a, [])
            if a in self.listos:
                self.colas['ventana'].append(self.listos[a])
            return True
        if op == 'alPuente':
            self.colas.setdefault(a, []).append(b)
            return True
        if op == 'cerrarPuente':
            self.cerrados.append(a)
            self.colas.pop(a, None)
            self.listos.pop(a, None)
            return True
        if op == 'aLaVentana':
            try:
                m = json.loads(b)
            except Exception:
                m = {}
            if m.get('tipo') == 'listo':
                self.listos[a] = b
            self.colas['ventana'].append(b)
            return True
        if op == 'recoger':
            cola = self.colas.setdefault(a, [])
            self.colas[a] = []
            return cola
        if op == 'guardarArchivo':
            self.archivos.append(('guardar', a, b, len(base64.b64decode(c or '')), c))
            return True
        if op == 'verArchivo':
            self.archivos.append(('ver', a, b, len(base64.b64decode(c or '')), c))
            return True
        if op == 'abrirFuera':
            self.afuera.append(a)
            return True
        if op == 'irA':
            self.aca.append(a)
            return True
        if op == 'copiar':
            self.copiado.append(a)
            return True
        return None


PUERTA = """
(() => {
  const APPS = {'escritos.pjn.gov.ar':'escritos','notif.pjn.gov.ar':'notif','deox.pjn.gov.ar':'deox','www.pjn.gov.ar':'guia'};
  const H = location.hostname;
  if (H.indexOf('pjn.gov.ar') < 0) return;
  const APP = APPS[H] || '';
  const llamar = (op, a, b, c) => { try { return window.__android(op, a, b, c); } catch (e) { return Promise.resolve(null); } };
  window.SuPJNAndroid = {
    // El almacen es sincrono, como en el telefono.
    leer: (k) => localStorage.getItem('gm:' + k),
    guardar: (k, v) => localStorage.setItem('gm:' + k, v),
    borrar: (k) => localStorage.removeItem('gm:' + k),
    enElPuente: () => !!APP,
    modoRevision: () => !!window.__pruebaRevision,
    aplicacion: () => APP,
    version: () => 'prueba',
    estado: (j) => { window.__estados = window.__estados || []; window.__estados.push(j); },
    resultado: (j) => { window.__resultado = j; },
    carpeta: () => '',
    elegirCarpeta: () => {},
    abrirFuera: (u) => llamar('abrirFuera', u),
    irA: (u) => llamar('irA', u),
    guardarArchivo: (n, t, b) => llamar('guardarArchivo', n, t, b),
    verArchivo: (n, t, b) => llamar('verArchivo', n, t, b),
    copiar: (t) => llamar('copiar', t),
    abrirPuente: (app, url) => llamar('abrirPuente', app, url),
    alPuente: (app, j) => llamar('alPuente', app, j),
    cerrarPuente: (app) => llamar('cerrarPuente', app),
    aLaVentana: (j) => llamar('aLaVentana', APP, j)
  };
  window.__supjnEstilos = __CSS__;
  window.__supjnEnElPuente = !!APP;
  window.__supjnModo = APP ? 'puente' : (window.__pruebaRevision ? 'revision' : 'ventana');
  window.__supjnPantalla = location.pathname === '/scw/supjn-inicio';
__MOVIL__
  // El cartero: la aplicacion entrega los mensajes que le dejaron para esta vista.
  const quien = APP || 'ventana';
  setInterval(() => {
    llamar('recoger', quien).then((ms) => {
      if (!ms || !ms.length) return;
      for (const m of ms) {
        if (APP) { if (window.__supjnAlPuente) window.__supjnAlPuente(m); }
        else if (window.__supjnDelPuente) window.__supjnDelPuente(m);
      }
    }).catch(() => {});
  }, 80);
})();
""".replace('__CSS__', json.dumps(movil_css)).replace('__MOVIL__', movil_js)


# La pantalla propia de la aplicacion: en el telefono la responde la propia
# aplicacion sin salir a la red. Aca se la sirve igual, y no se cuenta como
# pedido al PJN.
PANTALLA = 'https://scw.pjn.gov.ar/scw/supjn-inicio'
PANTALLA_HTML = ('<!doctype html><html lang="es"><head><meta charset="utf-8">'
                 '<meta name="viewport" content="width=device-width, initial-scale=1">'
                 '<title>SuPJN+</title></head><body></body></html>')


def manejar_app(route, request):
    if request.url == PANTALLA:
        return route.fulfill(status=200, content_type='text/html', body=PANTALLA_HTML)
    return manejar(route, request)


def contexto(browser, app):
    ctx = browser.new_context(
        accept_downloads=True,
        viewport={'width': 412, 'height': 915},
        device_scale_factor=1,
        user_agent=AGENTE,
        timezone_id='America/Argentina/Buenos_Aires')
    ctx.expose_binding('__android', lambda origen, op, a=None, b=None, c=None: app.atender(origen, op, a, b, c))
    ctx.add_init_script(PUERTA)
    ctx.add_init_script(ENVOLTORIO)
    ctx.route('**/*', manejar_app)
    return ctx


def ventana(ctx):
    page = ctx.new_page()
    page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
    page.evaluate("""([c, datos]) => {
      localStorage.setItem('gm:supjn.causas.v1@' + c, JSON.stringify(datos));
      localStorage.setItem('gm:supjn.favoritos.v1@' + c, JSON.stringify({causas: [], fecha: Date.now()}));
    }""", [CUENTA, causas()])
    page.reload()
    page.wait_for_selector('#supjn', state='attached')
    page.evaluate("document.getElementById('supjn-pastilla').click()")
    page.wait_for_selector('#supjn', state='visible')
    return page


def vista_puente(ctx, url):
    """La vista aparte donde vive una aplicacion del PJN, como en el telefono."""
    p = ctx.new_page()
    p.goto(url)
    return p


def solapa(page, v):
    """Cambiar de seccion como lo hace la barra de abajo de Android."""
    page.wait_for_function('!!window.__supjnApp', timeout=25000)
    page.evaluate("(v) => window.__supjnApp.ir(v, {novedades: false})", v)


def esperar(page, js, ms=25000):
    page.wait_for_function(js, timeout=ms)


# ----------------------------------------------------------------- las pruebas

def correr(b):
    app = Aplicacion()
    ctx = contexto(b, app)
    page = ventana(page_ctx := ctx)

    # --- A1  el aspecto es el de un telefono
    try:
        page.wait_for_function(
            "document.querySelectorAll('#supjn table.sj-t tbody td[data-col]').length > 0", timeout=15000)
    except Exception:
        pass  # lo informa A3
    m = page.evaluate("""() => {
      const w = document.getElementById('supjn');
      const r = w.getBoundingClientRect();
      const cu = w.querySelector('.sj-cuerpo');
      return {an: Math.round(r.width), al: Math.round(r.height),
              pan: [innerWidth, innerHeight],
              cruza: cu ? cu.scrollWidth > cu.clientWidth + 2 : false,
              fichas: w.querySelectorAll('table.sj-t tbody td[data-col]').length};
    }""")
    chequear('A1 la ventana ocupa la pantalla del telefono',
             m['an'] == m['pan'][0] and m['al'] == m['pan'][1], m)
    chequear('A2 la lista no obliga a correr la pantalla para el costado', not m['cruza'], m)
    chequear('A3 cada causa se muestra como ficha, con el nombre de cada dato', m['fichas'] > 0, m)

    # --- el almacen pasa por la aplicacion
    chequear('A4 el almacen es el de la aplicacion',
             page.evaluate("() => typeof GM_getValue === 'function' && !!window.SuPJNAndroid"))

    # --- A5 el puente nativo: Escritos
    vista = vista_puente(ctx, 'https://escritos.pjn.gov.ar/info-tecnica')
    vista.wait_for_timeout(500)
    solapa(page, 'escr')
    esperar(page, "document.querySelectorAll('#supjn table.sj-t tbody tr').length > 3", 40000)
    n = page.evaluate("() => document.querySelectorAll('#supjn table.sj-t tbody tr').length")
    txt = page.evaluate("() => document.querySelector('#supjn [data-e=\"bandEstado\"]').innerText")
    chequear('A5 Escritos contesta por el puente nativo y la ventana lo muestra', n >= 10, (n, txt))
    chequear('A6 la ventana mando abrir la vista de Escritos',
             ('escritos', 'https://escritos.pjn.gov.ar/info-tecnica') in app.abiertos, app.abiertos)
    chequear('A7 el total leido es el que informa el sistema', '130' in txt, txt)

    # --- A8 la credencial no sale de la vista de la aplicacion
    fuera = [x for x in app.colas.get('ventana', [])]
    todos = json.dumps(app.listos) + json.dumps(fuera)
    chequear('A8 por la aplicacion no viaja la credencial del SSO',
             'access_token' not in todos and 'tok-escritos' not in todos, todos[:200])

    # --- A9 un PDF viaja en texto y llega como PDF
    page.click('#supjn table.sj-t:visible tbody tr:first-child .sj-acc button[data-a="bandBajar"]')
    for _ in range(80):
        if app.archivos:
            break
        page.wait_for_timeout(100)
    pdf = app.archivos[0] if app.archivos else None
    ok_pdf = bool(pdf) and pdf[3] > 0 and base64.b64decode(pdf[4])[:5] == b'%PDF-'
    chequear('A9 el PDF llega entero a la aplicacion', ok_pdf, pdf[:4] if pdf else None)

    # --- A10 una pestana nueva del PJN se abre en la misma vista
    app.aca = []
    page.evaluate("() => window.open('https://scw.pjn.gov.ar/scw/consultaNovedad.seam?eid=1', '_blank')")
    page.wait_for_timeout(400)
    chequear('A10 una pagina del PJN se abre en la misma vista',
             any('consultaNovedad' in u for u in app.aca), app.aca)

    # --- A11 un enlace de afuera sale a Chrome
    app.afuera = []
    page.evaluate("() => window.open('https://www.google.com/', '_blank')")
    page.wait_for_timeout(400)
    chequear('A11 un enlace que no es del PJN sale afuera',
             app.afuera == ['https://www.google.com/'], app.afuera)

    # --- A12 una descarga con enlace de la pagina pasa por la aplicacion
    antes = len(app.archivos)
    page.evaluate("""() => {
      const b = new Blob([new Uint8Array([37,80,68,70,45,49,46,52])], {type:'application/pdf'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'prueba.pdf';
      document.body.appendChild(a); a.click(); a.remove();
    }""")
    for _ in range(60):
        if len(app.archivos) > antes:
            break
        page.wait_for_timeout(100)
    ult = app.archivos[-1] if len(app.archivos) > antes else None
    chequear('A12 lo que SuPJN+ descarga lo guarda la aplicacion',
             bool(ult) and ult[1] == 'prueba.pdf' and ult[0] == 'guardar', ult[:4] if ult else None)

    # --- A13 una ruta que no es de lectura no pasa por el puente
    r = vista.evaluate("""async () => {
      return await new Promise((listo) => {
        const antes = window.SuPJNAndroid.aLaVentana;
        window.SuPJNAndroid.aLaVentana = (j) => { window.SuPJNAndroid.aLaVentana = antes; listo(j); };
        window.__supjnAlPuente(JSON.stringify({supjn:'pedido', app:'escritos', id:'x1', op:'json', ruta:'/api/escritos/1/archivar'}));
      });
    }""")
    d = json.loads(r)
    chequear('A13 una ruta que no es de lectura se rechaza sin llegar al sistema',
             d.get('ok') is False and 'no admitida' in str(d.get('error')), d)

    # --- A14 con otra cuenta no se muestra nada
    ctx2 = contexto(b, Aplicacion())
    REG['cuit_app']['deox'] = '20999999999'
    try:
        p2 = ventana(ctx2)
        v2 = vista_puente(ctx2, 'https://deox.pjn.gov.ar/info-tecnica')
        v2.wait_for_timeout(400)
        solapa(p2, 'deox')
        esperar(p2, "/otra cuenta/i.test(document.querySelector('#supjn [data-e=\"bandEstado\"]').innerText)", 40000)
        chequear('A14 con otra cuenta no se muestra nada', True)
    except Exception as e:
        chequear('A14 con otra cuenta no se muestra nada', False, repr(e)[:200])
    finally:
        REG['cuit_app']['deox'] = CUENTA
        ctx2.close()

    # ---------------------------------------------- la cascara nativa de Android
    #
    # La barra de arriba y la de abajo son de Android: manejan SuPJN+ desde
    # afuera de la pagina y muestran lo que SuPJN+ les cuenta.

    ap = "window.__supjnApp"

    chequear('A15 SuPJN+ le abre a la aplicacion los controles que necesita',
             page.evaluate("() => !!(window.__supjnApp && window.__supjnApp.ir"
                           " && window.__supjnApp.estado && window.__supjnApp.buscar"
                           " && window.__supjnApp.revisar && window.__supjnApp.novedades)"))

    chequear('A16 con la cascara, la pagina no dibuja su barra ni sus solapas',
             page.evaluate("""() => {
               const t = document.querySelector('#supjn .sj-tit');
               const so = document.querySelector('#supjn .sj-solapas');
               const pa = document.getElementById('supjn-pastilla');
               const ver = (x) => !!x && getComputedStyle(x).display !== 'none';
               return document.documentElement.className.indexOf('supjn-cascara') >= 0
                 && !ver(t) && !ver(so) && !ver(pa);
             }"""))

    # El zoom con los dedos no se toca en ningun momento.
    vp = page.evaluate("() => (document.querySelector('meta[name=viewport]')||{}).content || ''")
    chequear('A17 la pantalla se sigue agrandando con los dedos',
             'user-scalable=no' not in vp and 'maximum-scale=1' not in vp and 'width=device-width' in vp, vp)

    page.evaluate(ap + ".ir('escr',{novedades:false})")
    page.wait_for_timeout(900)
    e = page.evaluate(ap + ".estado()")
    chequear('A18 la barra de abajo cambia de seccion', e['vista'] == 'escr', e)

    page.evaluate(ap + ".ir('rel',{novedades:true})")
    page.wait_for_timeout(700)
    e = page.evaluate(ap + ".estado()")
    chequear('A19 Novedades es una seccion propia, con su filtro puesto',
             e['vista'] == 'rel' and e['filtro'] is True and e['titulo'] == 'Novedades', e)

    page.evaluate(ap + ".ir('rel',{novedades:false})")
    page.wait_for_timeout(500)
    page.evaluate(ap + ".buscar('GOMEZ')")
    page.wait_for_timeout(900)
    filas = page.evaluate("""() => {
      const t = Array.prototype.slice.call(document.querySelectorAll('#supjn table.sj-t'))
        .filter((x) => x.getClientRects().length)[0];
      return t ? t.querySelectorAll('tbody tr').length : -1;
    }""")
    chequear('A20 el buscador de la barra filtra la lista', filas == 1, filas)
    page.evaluate(ap + ".buscar('')")
    page.wait_for_timeout(700)

    est = page.evaluate("() => (window.__estados||[]).length")
    chequear('A21 SuPJN+ le avisa a la barra cada vez que cambia lo que muestra', est >= 3, est)

    # --- la revision de novedades, que es lo que dispara los avisos del telefono
    #
    # Con la foto vieja de las causas, la revision tiene que encontrarlas; con
    # la foto al dia, no tiene que avisar nada.

    def foto(page, datos):
        page.evaluate("""([c, v]) => {
          localStorage.setItem('gm:supjn.visto.v1@' + c, JSON.stringify(v));
        }""", [CUENTA, datos])
        page.reload()
        page.wait_for_function("!!window.__supjnApp", timeout=25000)
        page.wait_for_timeout(500)

    vieja = {}
    for e in ('CCC 046311/2025', 'CCC 029880/2026', 'CIV 076436/2025'):
        vieja[e] = {'ult': '01/01/2000', 'sit': 'VIEJA', 't': 1}
    foto(page, vieja)
    r = page.evaluate("async () => await window.__supjnApp.revisar()")
    nov = r.get('novedades') or []
    # Las causas que quedaron despues de releer la lista del PJN.
    cuantas = page.evaluate(ap + ".estado()").get('causas') or 0
    chequear('A22 la revision encuentra las causas que se movieron',
             r.get('ok') is True and len(nov) == cuantas and cuantas > 0,
             (r.get('ok'), cuantas, [x['exp'] for x in nov]))

    r2 = page.evaluate("async () => await window.__supjnApp.revisar()")
    chequear('A23 revisar no marca nada como visto: la novedad sigue estando',
             len(r2.get('novedades') or []) == len(nov), len(r2.get('novedades') or []))

    chequear('A24 el aviso lleva expediente, caratula y dependencia',
             len(nov) > 0 and len(nov[0].get('exp') or '') > 0
             and len(nov[0].get('car') or '') > 0 and len(nov[0].get('dep') or '') > 0,
             nov[0] if nov else None)

    if nov:
        alDia = {}
        for x in nov:
            alDia[x['exp']] = {'ult': x['ult'], 'sit': x['sit'], 't': 1}
        foto(page, alDia)
        r3 = page.evaluate("async () => await window.__supjnApp.revisar()")
        chequear('A24b con la foto al dia no avisa nada',
                 (r3.get('novedades') or []) == [], r3.get('novedades'))
    else:
        chequear('A24b con la foto al dia no avisa nada', False, 'no hubo novedades')

    # --- nueva cedula desde el boton flotante
    app.aca = []
    page.evaluate(ap + ".nuevaCedula('')")
    page.wait_for_timeout(500)
    chequear('A25 el boton de nueva cedula abre el formulario del PJN',
             any('notif.pjn.gov.ar/nueva' in u for u in app.aca), app.aca)

    ctx.close()

    # ------------------------------------------- la pantalla propia de la aplicacion
    #
    # La aplicacion no abre el PJN para mostrarse: abre una pantalla propia con
    # lo que ya esta guardado en el telefono. El PJN se consulta cuando se pide
    # una funcion que lo necesita.

    app2 = Aplicacion()
    ctx3 = contexto(b, app2)
    try:
        pg = ctx3.new_page()
        # Lo que ya quedo guardado de una sesion anterior: la cuenta y las causas.
        pg.goto(PANTALLA)
        # Las listas quedan viejas a proposito: en el navegador eso dispara una
        # relectura sola, y lo que se comprueba es que en la pantalla propia de
        # la aplicacion no la dispare.
        viejas = causas()
        viejas['fecha'] = int(time.time() * 1000) - 30 * 24 * 60 * 60 * 1000
        pg.evaluate("""([c, datos, f]) => {
          localStorage.setItem('gm:supjn.cuenta.v1', JSON.stringify({cuit: c, txt: c}));
          localStorage.setItem('gm:supjn.causas.v1@' + c, JSON.stringify(datos));
          localStorage.setItem('gm:supjn.favoritos.v1@' + c, JSON.stringify({causas: [], fecha: f}));
        }""", [CUENTA, viejas, viejas['fecha']])

        REG['pedidos'] = []
        pg.goto(PANTALLA)
        pg.wait_for_function("!!window.__supjnApp", timeout=25000)
        pg.wait_for_timeout(1500)

        e = pg.evaluate("() => window.__supjnApp.estado()")
        chequear('A26 la aplicacion abre en su propia pantalla',
                 e.get('pantalla') is True, e)
        chequear('A27 la cuenta sale de lo guardado, sin pagina del PJN',
                 e.get('cuit') == CUENTA, e.get('cuit'))
        chequear('A28 muestra las causas guardadas', (e.get('causas') or 0) > 0, e.get('causas'))

        alPJN = [x for x in REG['pedidos'] if 'pjn.gov.ar' in x[1]]
        chequear('A29 al abrir no se le pide nada al PJN', alPJN == [], alPJN[:3])

        filas = pg.evaluate("""() => {
          const t = Array.prototype.slice.call(document.querySelectorAll('#supjn table.sj-t'))
            .filter((x) => x.getClientRects().length)[0];
          return t ? t.querySelectorAll('tbody tr').length : -1;
        }""")
        chequear('A30 la lista se ve sin haber consultado nada', filas > 0, filas)

        # Los botones de la barra tienen que funcionar en esta pantalla.
        pg.evaluate("window.__supjnApp.ir('rel',{novedades:true})")
        pg.wait_for_timeout(500)
        e2 = pg.evaluate("() => window.__supjnApp.estado()")
        chequear('A31 los botones de la barra funcionan en la pantalla propia',
                 e2.get('titulo') == 'Novedades' and e2.get('filtro') is True, e2)

        # Y recien cuando se pide, se consulta el PJN.
        REG['pedidos'] = []
        pg.evaluate("window.__supjnApp.actualizar()")
        pg.wait_for_timeout(2500)
        alPJN2 = [x for x in REG['pedidos'] if 'scw.pjn.gov.ar' in x[1]]
        chequear('A32 Actualizar si consulta el PJN', len(alPJN2) > 0, len(alPJN2))
    except Exception as ex:
        chequear('la pantalla propia termino con excepcion', False, repr(ex)[:300])
    finally:
        ctx3.close()


with sync_playwright() as p:
    b = p.chromium.launch(channel='chromium')
    try:
        correr(b)
    except Exception as e:
        chequear('el banco de Android termino con excepcion', False, repr(e)[:600])
    b.close()

mal = [r for r in RES if not r[1]]
print('\n%d pruebas, %d en verde, %d en rojo' % (len(RES), len(RES) - len(mal), len(mal)))
sys.exit(1 if mal else 0)
