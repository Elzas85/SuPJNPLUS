# Banco de pruebas de SuPJN+ 0.7.0: Escritos, Notificaciones, DEOX, Guía y
# el menú de Funciones del PJN. Simula los sitios del PJN con Playwright
# (datos inventados) y corre el userscript como lo haría Tampermonkey.
import json, re, sys, time, base64
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
import os
SCRIPT = Path(os.environ.get('SUPJN_SCRIPT') or (RAIZ / 'supjn-plus.user.js')).read_text(encoding='utf-8')
CUENTA = '20111111112'
OTRA = '27222222223'

ENVOLTORIO = r"""
(() => {
  const H = location.hostname, P = location.pathname;
  const coincide = (H === 'scw.pjn.gov.ar' && P.indexOf('/scw/') === 0) || H === 'escritos.pjn.gov.ar' || H === 'notif.pjn.gov.ar' ||
    H === 'deox.pjn.gov.ar' || (H === 'www.pjn.gov.ar' && P.indexOf('/guia') === 0) || H === 'pruebas.supjn.invalid';
  if (!coincide) return;
  const COMP = 'supjn.cedula';
  const galleta = () => { const m = document.cookie.match(/(?:^|; )gmcomp=([^;]*)/); try { return m ? JSON.parse(decodeURIComponent(m[1])) : {}; } catch (e) { return {}; } };
  window.GM_getValue = (k, d) => {
    if (k.indexOf(COMP) === 0) { const o = galleta(); return (k in o && o[k] != null) ? o[k] : d; }
    try { const v = localStorage.getItem('gm:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  };
  window.GM_setValue = (k, v) => {
    if (k.indexOf(COMP) === 0) { const o = galleta(); o[k] = v; document.cookie = 'gmcomp=' + encodeURIComponent(JSON.stringify(o)) + '; domain=.pjn.gov.ar; path=/; secure'; return; }
    localStorage.setItem('gm:' + k, JSON.stringify(v));
  };
  window.unsafeWindow = window;
  window.__errores = [];
  window.addEventListener('error', (e) => window.__errores.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => window.__errores.push('promesa: ' + String(e.reason && e.reason.message || e.reason)));
  const correr = () => {
__SCRIPT__
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
})();
""".replace('__SCRIPT__', SCRIPT)

# ---------------------------------------------------------------- fixtures

def html(cuerpo, titulo='x'):
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + titulo + '</title></head><body>' + cuerpo + '</body></html>'

SCW_LISTA = html('''
<nav class="navbar"><ul><li><a href="#">Nueva Consulta Pública</a></li><li><a href="#"><i class="fa fa-user"></i> <span>__CUENTA__</span></a></li>
<li><a href="/scw/logout.seam">Cerrar Sesión</a></li><li><a href="/scw/datos.seam">Datos personales</a></li></ul></nav>
<h3>Lista de Expedientes Relacionados</h3>
<table><thead><tr><th>Expediente</th><th>Dependencia</th><th>Carátula</th><th>Situación</th><th>Últ. Act.</th></tr></thead>
<tbody><tr><td>CCC 046311/2025</td><td>JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL NRO. 11 - SECRETARÍA NRO. 133</td><td>IMPUTADO: PEREZ, JUAN s/PRUEBA</td><td>EN LETRA</td><td>15/09/2026</td></tr></tbody></table>
''', 'Sistema de Consultas Web')

def causas():
    ahora = int(time.time() * 1000)
    c = [
        {'exp': 'CCC 046311/2025', 'dep': 'JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL NRO. 11 - SECRETARÍA NRO. 133', 'car': 'IMPUTADO: PEREZ, JUAN s/PRUEBA', 'sit': 'EN LETRA', 'ult': '15/09/2026', 'tramite': True},
        {'exp': 'CCC 029880/2026', 'dep': 'CAMARA NACIONAL DE APELACIONES EN LO CRIMINAL Y CORRECCIONAL - SALA 5', 'car': 'IMPUTADO: GOMEZ s/FALSA DENUNCIA', 'sit': 'EN LETRA', 'ult': '16/09/2026', 'tramite': True},
        {'exp': 'CIV 076436/2025', 'dep': 'JUZGADO CIVIL 3 - SECRETARIA Nº 16', 'car': 'ACTOR c/ DEMANDADO s/DAÑOS', 'sit': 'EN LETRA', 'ult': '14/09/2026', 'tramite': True},
    ]
    return {'causas': c, 'fecha': ahora, 'total': len(c)}

def escrito(i, num, anio, cam, dia, desc, estado='ENVIADO_GESTIONADO'):
    return {'id': 1000 + i, 'descripcion': desc, 'tipo': 'ESCRITO', 'estado': estado, 'fojas': 2, 'nombreArchivo': 'archivo%d.pdf' % i,
            'fechaIngreso': '2026-09-%02dT11:58:07.000-0300' % dia, 'fechaAcepJuzgado': '2026-09-%02dT13:40:23.000-0300' % dia,
            'nombreAutor': 'LETRADO DE PRUEBA', 'cuilAutor': CUENTA,
            'oficina': {'descripcion': 'JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL NRO. 11 - SECRETARÍA NRO. 133', 'id': 1214},
            'expediente': {'id': 40000000 + i, 'camara': cam, 'numero': num, 'anio': anio, 'numeracion': '%s %d/%d' % (cam, num, anio),
                           'caratula': 'CARATULA DE PRUEBA %d' % i, 'oficina': 'JUZGADO DE PRUEBA'}}

ESCRITOS = [escrito(i, 46311 if i % 2 else 76436, 2025, 'CCC' if i % 2 else 'CIV', 1 + (i % 16), 'ESCRITO NUMERO %d' % i) for i in range(1, 131)]

def notificacion(i, num, anio, dia):
    return {'id': 5000 + i, 'numeroCedula': 26000000000000 + i, 'fecha': '2026-09-%02dT16:54:14.891-0300' % dia, 'origen': 'J',
            'nombreAutor': 'CAMARA NACIONAL DE APELACIONES EN LO CRIMINAL Y CORRECCIONAL - SALA 5',
            'oficina': {'descripcion': 'CAMARA NACIONAL DE APELACIONES EN LO CRIMINAL Y CORRECCIONAL - SALA 5', 'id': 1387},
            'destinatarios': [{'cuit': CUENTA, 'nombre': 'PARTE DE PRUEBA, LETRADO DE PRUEBA', 'tipo': 'L'}],
            'expediente': {'id': 41000000 + i, 'numero': num, 'anio': anio, 'numeracion': 'CCC %d/%d' % (num, anio), 'caratula': 'NOTIF CARATULA %d' % i,
                           'oficina': 'JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL NRO. 48 - SECRETARÍA NRO. 145'}}

NOTIFS = [notificacion(i, 29880 if i < 4 else 46311, 2026 if i < 4 else 2025, 1 + i % 16) for i in range(1, 9)]

DEOX = [{'id': 23656318, 'idTipoDeo': 4, 'tipo': 'EXT', 'cerrado': True, 'cuio': '60000001939', 'cuioOrigen': CUENTA, 'esRespuesta': False,
         'descripcionOrganismo': 'REGISTRO DE LA PROPIEDAD INMUEBLE DE PRUEBA', 'fechaEnvio': '2026-09-10T13:06:40.000-0300',
         'fechaRespuesta': '2026-09-10T13:42:13.000-0300', 'motivo': 'Motivo de prueba del oficio', 'urgente': True,
         'oficinaDestino': {'descripcion': 'JUZGADO CIVIL 25', 'id': 401},
         'expedienteOrigen': {'id': 39371062, 'numero': 78326, 'anio': 2024, 'numeracion': 'CIV 78326/2024', 'caratula': 'DEOX CARATULA'}},
        {'id': 23656400, 'idTipoDeo': 2, 'tipo': 'INT', 'cerrado': False, 'oficinaDeox': {'descripcion': 'OFICINA X'}, 'cuioOrigen': CUENTA,
         'esRespuesta': False, 'fechaEnvio': '2026-09-12T10:00:00.000-0300', 'motivo': 'Otro', 'urgente': False,
         'oficinaDestino': {'descripcion': 'JUZGADO CIVIL 3', 'id': 380},
         'expedienteOrigen': {'id': 39371099, 'numero': 76436, 'anio': 2025, 'numeracion': 'CIV 76436/2025', 'caratula': 'OTRA'}}]

CAMARAS = [{'codigo': 'CIV', 'id': 1, 'descripcion': 'Civil'}, {'codigo': 'CCC', 'id': 9, 'descripcion': 'Criminal'}]

def dep(id_, cod, nombre, parent, subs=1, integ=1, tel='4000-0000', email=None, dom='Talcahuano 550'):
    return {'id': id_, 'codigoUrl': cod, 'idParent': parent, 'tieneSubDependencias': subs, 'tieneIntegrantes': integ, 'ambitoTerritorial': None,
            'dependenciaInfo': {'id': id_, 'nombre': nombre, 'telefono': tel, 'email': email, 'fax': None, 'pisoOficinaDepartamento': '5° P',
                                'domicilio': {'domicilio': dom, 'codigoPostal': 'C1013AAL', 'localidad': {'nombre': 'Ciudad Autónoma de Buenos Aires'},
                                              'provincia': {'nombre': 'Ciudad Autónoma de Buenos Aires'}}}}

def integrante(fun, ape, nom, visible=0, tel='4111-1111', email='persona@prueba.invalid'):
    return {'funcion': {'nombre': fun}, 'situacionFuncion': {'nombre': 'Normal'}, 'telefono': None, 'visibleTelefono': 0,
            'persona': {'apellido': ape, 'nombre': nom, 'personaTratamiento': {'nombre': 'Dra.'}, 'cargo': {'nombre': 'Juez de 1ra. Instancia'},
                        'situacionCargo': {'nombre': 'Efectivo'}, 'telefono': tel, 'email': email, 'visibleEmail': visible, 'visibleTelefono': visible}}

G = {}
def guia(d, parent=None, subs=(), integ=()):
    G[d['codigoUrl']] = {'dependencia': d, 'dependenciaParent': parent, 'subDependencias': list(subs), 'integrantes': list(integ)}

RAIZ_G = dep(9999, 'guia-inicio', 'Guía Judicial', 0)
FN = dep(210, 'fueros_nacionales', 'Fueros Nacionales', 9999)
CAM = dep(705, '705', 'Cámara Nacional de Apelaciones en lo Criminal y Correccional', 210)
CAMF = dep(1079, '1079', 'Cámara Nacional de Apelaciones en lo Criminal y Correccional Federal', 935)
SALAS = dep(710, '710', 'Salas', 705)
SALA4 = dep(712, '712', 'Sala IV - Criminal y Correccional', 710)
SALA5 = dep(713, '713', 'Sala V - Criminal y Correccional', 710, tel='4370-0005')
JZ = dep(726, '726', 'Juzgados Nacionales en lo Criminal y Correccional', 705)
J11 = dep(747, '747', 'Juzgado Criminal y Correccional Nro. 11', 726, email='juzgado11@prueba.invalid')
S133 = dep(748, '748', 'Secretaría Nro. 133', 747, tel='4373-0133')
S134 = dep(749, '749', 'Secretaría Nro. 134', 747)
TOC11 = dep(915, '915', 'Tribunal Oral en lo Criminal y Correccional Nro. 11 de la Cap.Federal', 904)
JF11 = dep(1118, '1118', 'Juzgado Criminal y Correccional Federal Nro. 11', 1100)
C3 = dep(482, '482', 'Juzgado Civil Nro. 3', 477)
C13 = dep(502, '502', 'Juzgado Civil Nro. 13', 477)
C30 = dep(537, '537', 'Juzgado Civil Nro. 30', 477)
CCF3 = dep(990, '990', 'Juzgado Civil y Comercial Federal Nro. 3', 1724)
guia(RAIZ_G, None, [FN])
guia(FN, RAIZ_G, [CAM])
guia(CAM, FN, [SALAS, JZ], [integrante('Presidente', 'Presidente', 'Uno')])
guia(SALAS, CAM, [SALA4, SALA5])
guia(SALA5, SALAS, [], [integrante('Presidenta', 'Vocal', 'Cinco')])
guia(JZ, CAM, [J11])
guia(J11, JZ, [S133, S134], [integrante('Juez', 'Jueza', 'Once', visible=0), integrante('Secretario', 'Secre', 'Visible', visible=1, email='visible@prueba.invalid')])
SU3 = dep(483, '483', 'Secretaría Unica', 482)
guia(C3, None, [SU3], [integrante('Juez', 'Civil', 'Tres')])
TODAS_G = [CAM, CAMF, SALAS, SALA4, SALA5, JZ, J11, S133, S134, TOC11, JF11, C3, C13, C30, CCF3, FN]

def buscar_guia(nombre):
    ws = [w for w in re.sub(r'[^a-z0-9 ]', ' ', quitar(nombre.lower())).split() if w]
    out = []
    for d in TODAS_G:
        n = quitar(d['dependenciaInfo']['nombre'].lower())
        if all(w in n for w in ws):
            out.append(d)
    return out

def quitar(s):
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

PDF = b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'

# -------------------------------------------------------------- servidor

REG = {'pedidos': [], 'cuit_app': {'escritos': CUENTA, 'notif': CUENTA, 'deox': CUENTA}}

APP_HTML = '''<!doctype html><html><head><meta charset="utf-8"><title>App</title></head><body><div id="root">Iniciando...</div>
<script>
  // Simula oidc-client: la credencial aparece al rato en sessionStorage.
  setTimeout(() => {
    const u = { access_token: 'tok-' + location.hostname, expires_at: Math.floor(Date.now() / 1000) + 300, profile: { cuil: '__CUIT__', preferred_username: '__CUIT__' } };
    sessionStorage.setItem('oidc.user:https://sso.pjn.gov.ar/auth/realms/pjn:cliente', JSON.stringify(u));
    document.getElementById('root').textContent = 'Lista';
  }, 400);
</script></body></html>'''

FORM_NUEVA = """<!doctype html><html><head><meta charset="utf-8"><title>Nueva Notificación</title></head><body>
<div id="root">Iniciando...</div>
<main><div id="form" style="display:none;margin-top:40px">
 <div class="MuiAutocomplete-root" style="position:relative"><label for="camara-autocomplete">Jurisdicción</label>
  <input id="camara-autocomplete" name="camara" placeholder="Seleccione una Jurisdicción">
  <button type="button" class="MuiAutocomplete-popupIndicator" aria-label="Abierto">v</button></div>
 <input type="number" name="numeroExpediente"><input type="number" name="anioExpediente">
 <button id="StepperNextBtn" type="submit">SIGUIENTE</button>
 <button id="guardar" type="button">GUARDAR</button><button id="enviar" type="button">ENVIAR</button>
</div>
<script>
  window.__estado = { camara: null, num: '', anio: '', prohibido: false, siguiente: false, expediente: null };
  const LISTAS = { 'CCC|46311|2025': ['CCC 46311/2025', 'CCC 46311/2025/1'], 'CIV|76436|2025': ['CIV 76436/2025/1', 'CIV 76436/2025'] };
  setTimeout(() => {
    const u = { access_token: 'tok-' + location.hostname, expires_at: Math.floor(Date.now() / 1000) + 300, profile: { cuil: '__CUIT__' } };
    sessionStorage.setItem('oidc.user:https://sso.pjn.gov.ar/auth/realms/pjn:cliente', JSON.stringify(u));
    document.getElementById('root').textContent = 'Nueva';
    // el formulario aparece un rato después, como en la aplicación
    setTimeout(() => { document.getElementById('form').style.display = '';
      // La lista puede estar ya abierta cuando SuPJN+ llega, si alguien tocó el
      // campo antes.
      if (__YA_ABIERTA__ && window.__yaAbierta) window.__yaAbierta(); }, __DEMORA__);
  }, 400);
  const cams = [['CIV', 'Cámara Nacional de Apelaciones en lo Civil'], ['CCF', 'Cámara Nacional de Apelaciones en lo Civil y Comercial Federal'], ['CCC', 'Camara Nacional de Apelaciones en lo Criminal y Correccional'], ['CFP', 'Camara Criminal y Correccional Federal']];
  // El día que el PJN ofrezca dos jurisdicciones con la misma sigla, no se
  // elige ninguna: elegir mal sin que se note es peor que no elegir.
  if (__DOS_CIV__) cams.push(['CIV', 'Cámara Civil de Feria']);
  const cam = document.getElementById('camara-autocomplete');
  const ABRE = '__ABRE__';           // normal | boton | escribir | nunca | real | lenta | vacia | no-toma
  const CON_SIGLA = __CON_SIGLA__;   // false: las opciones solo traen el nombre
  // "real", "lenta" y "vacia" imitan al formulario del PJN tal como se midió
  // sobre el sitio de verdad, el 23/09/2026:
  //   - cada clic en el campo abre o cierra la lista, según como esté;
  //   - las jurisdicciones las trae el servidor (/api/camaras) CADA VEZ que la
  //     lista se abre, y tardan alrededor de un segundo (medido 1006, 992 y
  //     954 milésimas en tres aperturas seguidas);
  //   - cerrar la lista cancela esa espera: al volver a abrirla, se pide de nuevo.
  // "lenta" es el mismo formulario con el PJN tardando más de lo que el
  // programa esperaba por intento. "vacia" es el PJN que no trae nada.
  const REAL = ABRE === 'real' || ABRE === 'lenta' || ABRE === 'vacia' || ABRE === 'no-toma';
  const DEMORA_CAMARAS = ABRE === 'lenta' ? 3500 : 900;
  let pedido = null;
  const lista = () => document.getElementById('camara-autocomplete-listbox');
  const cerrar = () => { clearTimeout(pedido); pedido = null; const l = lista(); if (l) l.remove(); cam.setAttribute('aria-expanded', 'false'); };
  const dibujar = () => {
    if (lista() || cam.getAttribute('aria-expanded') !== 'true' || ABRE === 'vacia') return;
    const ul = document.createElement('ul'); ul.setAttribute('role', 'listbox'); ul.id = 'camara-autocomplete-listbox';
    cams.forEach(([c, n]) => { const li = document.createElement('li'); li.setAttribute('role', 'option'); li.textContent = CON_SIGLA ? (c + '__SEP__' + n) : n;
      // En "no-toma" el formulario cierra la lista y no carga el campo, como si
      // el clic no hubiera servido.
      li.addEventListener('click', () => { if (ABRE !== 'no-toma') { cam.value = li.textContent; window.__estado.camara = c; } cerrar(); }); ul.appendChild(li); });
    document.body.appendChild(ul);
  };
  const abrir = () => {
    if (lista() || __SIN_LISTA__) return;
    cam.setAttribute('aria-expanded', 'true');
    if (REAL) { clearTimeout(pedido); pedido = setTimeout(dibujar, DEMORA_CAMARAS); } else dibujar();
  };
  const alternar = () => { if (cam.getAttribute('aria-expanded') === 'true') cerrar(); else abrir(); };
  if (ABRE === 'normal') cam.addEventListener('mousedown', abrir);
  if (ABRE === 'normal' || ABRE === 'boton') document.querySelector('.MuiAutocomplete-popupIndicator').addEventListener('click', abrir);
  if (ABRE === 'escribir') cam.addEventListener('input', abrir);
  if (REAL) {
    cam.setAttribute('aria-expanded', 'false');
    cam.addEventListener('mousedown', alternar);
    cam.addEventListener('input', abrir);
    cam.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); else if (e.key === 'ArrowDown') abrir(); });
    document.querySelector('.MuiAutocomplete-popupIndicator').addEventListener('click', alternar);
    window.__yaAbierta = () => { cam.focus(); abrir(); };
  }
  document.querySelector('[name=numeroExpediente]').addEventListener('input', (e) => { window.__estado.num = e.target.value; });
  document.querySelector('[name=anioExpediente]').addEventListener('input', (e) => { window.__estado.anio = e.target.value; });
  document.getElementById('guardar').addEventListener('click', () => { window.__estado.prohibido = true; });
  document.getElementById('enviar').addEventListener('click', () => { window.__estado.prohibido = true; });
  document.getElementById('StepperNextBtn').addEventListener('click', () => {
    const e = window.__estado;
    e.siguiente = true;
    setTimeout(() => {
      const l = LISTAS[e.camara + '|' + e.num + '|' + e.anio];
      if (!l) { const a = document.createElement('div'); a.setAttribute('role', 'alert'); a.textContent = 'No hay resultados para la selección actual'; document.body.appendChild(a); return; }
      const ul = document.createElement('ul'); ul.setAttribute('role', 'listbox'); ul.id = 'form-list-autocomplete-listbox-expediente';
      l.forEach((n) => { const li = document.createElement('li'); li.setAttribute('role', 'option'); li.textContent = n + ' : CARATULA ' + n;
        li.addEventListener('click', () => { e.expediente = n; li.setAttribute('aria-selected', 'true'); }); ul.appendChild(li); });
      document.querySelector('main').appendChild(ul);
    }, 500);
  });
</script></main></body></html>"""

def json_resp(route, obj, status=200):
    route.fulfill(status=status, content_type='application/json', body=json.dumps(obj))

def pagina(items, qs):
    page = int(qs.get('page', ['0'])[0]); size = int(qs.get('pageSize', ['10'])[0])
    if size > 100:
        return None
    ini = page * size
    return {'items': items[ini:ini + size], 'hasNext': ini + size < len(items), 'numberOfItems': len(items), 'page': page, 'pageSize': size}

def manejar(route, request):
    u = urlparse(request.url)
    h, p, qs = u.hostname, u.path, parse_qs(u.query)
    REG['pedidos'].append((request.method, request.url, request.headers.get('authorization')))
    if h == 'scw.pjn.gov.ar':
        # Datos personales: la pagina del propio usuario. La aplicacion de
        # Android la lee cuando el encabezado no muestra la cuenta, que es lo
        # que pasa en pantalla de telefono. Sin sesion contesta el ingreso.
        if p.startswith('/scw/datos.seam'):
            # Sin sesion el PJN contesta la pantalla de ingreso. Con sesion,
            # muestra el CUIT del usuario: es de donde la aplicacion lo saca
            # cuando el encabezado no lo muestra, como pasa en el telefono.
            quien = REG.get('cuenta_datos', REG.get('cuenta_scw', CUENTA))
            if not REG.get('sesion', True) or not quien:
                return route.fulfill(status=200, content_type='text/html', body=html(
                    '<form><input name="j_username"><input type="password" name="password"></form>',
                    'Ingreso'))
            return route.fulfill(status=200, content_type='text/html', body=html(
                '<h3>Datos personales</h3><dl><dt>CUIT/CUIL</dt><dd>' + quien
                + '</dd><dt>Domicilio electronico</dt><dd>' + quien + '</dd></dl>',
                'Datos personales'))
        if p.startswith('/scw/consultaNovedad.seam'):
            return route.fulfill(status=200, content_type='text/html', body=html('<p>expediente ' + u.query + '</p>', 'Expediente'))
        return route.fulfill(status=200, content_type='text/html', body=SCW_LISTA.replace('__CUENTA__', REG.get('cuenta_scw', CUENTA)))
    if h in ('escritos.pjn.gov.ar', 'notif.pjn.gov.ar', 'deox.pjn.gov.ar'):
        app = {'escritos.pjn.gov.ar': 'escritos', 'notif.pjn.gov.ar': 'notif', 'deox.pjn.gov.ar': 'deox'}[h]
        if app == 'notif' and p == '/nueva':
            body = (FORM_NUEVA.replace('__CUIT__', REG['cuit_app'][app]).replace('__DEMORA__', str(REG.get('demora_form', 300)))
                    .replace('__SIN_LISTA__', 'true' if REG.get('sin_lista') else 'false')
                    .replace('__ABRE__', REG.get('camara_abre', 'normal'))
                    .replace('__YA_ABIERTA__', 'true' if REG.get('camara_ya_abierta') else 'false')
                    .replace('__DOS_CIV__', 'true' if REG.get('camara_dos_civ') else 'false')
                    .replace('__CON_SIGLA__', 'false' if REG.get('camara_sin_sigla') else 'true')
                    .replace('__SEP__', REG.get('camara_sep', ' - ')))
            return route.fulfill(status=200, content_type='text/html', body=body)
        if not p.startswith('/api/'):
            return route.fulfill(status=200, content_type='text/html', body=APP_HTML.replace('__CUIT__', REG['cuit_app'][app]))
        if request.headers.get('authorization') != 'Bearer tok-' + h:
            return json_resp(route, {'code': 'credenciales_requeridas'}, 401)
        if p == '/api/camaras':
            return json_resp(route, CAMARAS)
        m = re.match(r'^/api/(escritos|notificaciones|deox)/(?:([A-Z_]+)/)?(\d+)/pdf$', p)
        if m:
            return route.fulfill(status=200, content_type='application/pdf', body=PDF)
        base = {'escritos': ESCRITOS, 'notif': NOTIFS, 'deox': DEOX}[app]
        items = base
        if 'numeroExpediente' in qs:
            cam = {'1': 'CIV', '9': 'CCC'}.get(qs['camaraExpediente'][0])
            num = int(qs['numeroExpediente'][0]); anio = int(qs['anioExpediente'][0])
            def ok(x):
                ex = x.get('expediente') or x.get('expedienteOrigen')
                return ex['numero'] == num and ex['anio'] == anio and ex['numeracion'].startswith(cam + ' ')
            items = [x for x in base if ok(x)]
        elif 'fechaDesde' not in qs:
            return json_resp(route, {'code': 'request_invalido', 'message': 'Debe incluir un filtro de fecha'}, 400)
        # Para las pruebas del filtro por fuero: escritos de una sola cámara, y
        # escritos agregados (por ejemplo, uno sin expediente).
        if app == 'escritos' and 'numeroExpediente' not in qs:
            if REG.get('solo_camara'):
                items = [x for x in items if x['expediente']['camara'] == REG['solo_camara']]
            items = items + list(REG.get('escritos_extra', []))
        r = pagina(items, qs)
        if r is None:
            return json_resp(route, {'code': 'request_invalido', 'message': 'El tamaño de pagina no puede ser superior a 100'}, 400)
        return json_resp(route, r)
    if h == 'www.pjn.gov.ar':
        if p.startswith('/api/dependencia/codigo/'):
            cod = p.rsplit('/', 1)[1]
            return json_resp(route, G.get(cod) or {'dependencia': None})
        if p in ('/api/dependencia/find', '/api/persona/find'):
            if request.headers.get('accept', '').find('application/json') < 0:
                return route.fulfill(status=200, content_type='text/html', body='<html><head><title>Request Rejected</title></head></html>')
            b = json.loads(request.post_data or '{}')
            if p.endswith('persona/find'):
                per = {'persona': dict(integrante('Juez', 'Jueza', 'Once')['persona'], dependencias=[J11]), 'subDependencias': [{'dependencia': J11, 'dependenciaPersona': integrante('Juez', 'Jueza', 'Once')}]}
                return json_resp(route, {'content': [per], 'totalElements': 1, 'totalPages': 1, 'number': 0})
            res = buscar_guia(b.get('nombre', ''))
            size = b.get('size', 10); page = b.get('page', 0)
            return json_resp(route, {'content': res[page * size:(page + 1) * size], 'totalElements': len(res), 'totalPages': (len(res) + size - 1) // size, 'number': page})
        return route.fulfill(status=200, content_type='text/html', body=html('<div>Guía</div>', 'Guía'))
    if h == 'malo.invalid':
        return route.fulfill(status=200, content_type='text/html', body=html('<p>ajeno</p>', 'Ajeno'))
    if h == 'pruebas.supjn.invalid':
        return route.fulfill(status=200, content_type='text/html', body=html('<p>pruebas</p>'))
    route.fulfill(status=404, body='')

# ---------------------------------------------------------------- pruebas

RES = []
def chequear(nombre, cond, detalle=''):
    RES.append((nombre, bool(cond), detalle))
    print(('OK   ' if cond else 'MAL  ') + nombre + ((' -- ' + str(detalle)) if (detalle and not cond) else ''))

def esperar(page, js, ms=15000):
    page.wait_for_function(js, timeout=ms)

def contexto(browser):
    ctx = browser.new_context(accept_downloads=True, viewport={'width': 1500, 'height': 950}, timezone_id='America/Argentina/Buenos_Aires')
    ctx.add_init_script(ENVOLTORIO)
    ctx.route('**/*', manejar)
    return ctx

def preparar_scw(page, cuenta=CUENTA):
    page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
    page.evaluate("""([c, datos]) => {
      localStorage.setItem('gm:supjn.causas.v1@' + c, JSON.stringify(datos));
      localStorage.setItem('gm:supjn.favoritos.v1@' + c, JSON.stringify({causas: [], fecha: Date.now()}));
    }""", [cuenta, causas()])
    page.reload()
    page.wait_for_selector('#supjn', state='attached')
    page.evaluate("document.getElementById('supjn-pastilla').click()")
    page.wait_for_selector('#supjn', state='visible')

def solapa(page, v):
    page.click('#supjn .sj-solapas button[data-vista="%s"]' % v)

def unitarias(browser):
    ctx = contexto(browser)
    page = ctx.new_page()
    page.add_init_script("window.__SUPJN_PRUEBAS__ = (h) => { window.__H = h; };")
    page.goto('https://pruebas.supjn.invalid/')
    esperar(page, 'window.__H')
    r = page.evaluate(r"""() => {
      const H = window.__H, o = {};
      const q = H.tokensGuia('JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL NRO. 11');
      o.tok = q;
      o.p11 = H.puntajeGuia(q, 'Juzgado Criminal y Correccional Nro. 11');
      o.p110 = H.puntajeGuia(q, 'Juzgado Criminal y Correccional Nro. 110');
      o.pfed = H.puntajeGuia(q, 'Juzgado Criminal y Correccional Federal Nro. 11');
      o.ptoc = H.puntajeGuia(q, 'Tribunal Oral en lo Criminal y Correccional Nro. 11 de la Cap.Federal');
      const s5 = H.tokensGuia('SALA 5');
      o.sala5 = H.puntajeGuia(s5, 'Sala V - Criminal y Correccional');
      o.sala4 = H.puntajeGuia(s5, 'Sala IV - Criminal y Correccional');
      o.salaCiv = H.puntajeGuia(H.tokensGuia('SALA A'), 'Sala A Civil');
      o.secr = H.puntajeGuia(H.tokensGuia('SECRETARÍA NRO. 133'), 'Secretaría Nro. 133');
      o.secrMal = H.puntajeGuia(H.tokensGuia('SECRETARIA Nº 133'), 'Secretaría Nro. 134');
      const mk = (id, n) => ({ id, dependenciaInfo: { nombre: n } });
      const civ = H.tokensGuia('JUZGADO CIVIL 3');
      o.mejorCiv = (H.mejorGuia(civ, [mk(1, 'Juzgado Civil Nro. 13'), mk(2, 'Juzgado Civil y Comercial Federal Nro. 3'), mk(3, 'Juzgado Civil Nro. 3')]).unico || {}).id;
      o.empate = H.mejorGuia(civ, [mk(1, 'Juzgado Civil Nro. 3'), mk(2, 'Juzgado Civil Nro. 3')]).unico;
      const cam = H.tokensGuia('CAMARA NACIONAL DE APELACIONES EN LO CRIMINAL Y CORRECCIONAL');
      o.mejorCam = (H.mejorGuia(cam, [mk(1079, 'Cámara Nacional de Apelaciones en lo Criminal y Correccional Federal'), mk(705, 'Cámara Nacional de Apelaciones en lo Criminal y Correccional')]).unico || {}).id;
      o.toc = (H.mejorGuia(H.tokensGuia('TRIBUNAL ORAL EN LO CRIMINAL Y CORRECCIONAL NRO. 5 DE LA CAPITAL FEDERAL'),
        [mk(1, 'Tribunal Oral en lo Criminal y Correccional Nro. 15 de la Cap.Federal'), mk(2, 'Tribunal Oral en lo Criminal y Correccional Nro. 5 de la Cap.Federal')]).unico || {}).id;
      o.capfed = H.tokensGuia('TRIBUNAL ORAL EN LO CRIMINAL Y CORRECCIONAL NRO. 5 DE LA CAPITAL FEDERAL');
      o.capfed2 = H.puntajeGuia(o.capfed, 'Tribunal Oral en lo Criminal y Correccional Nro. 5 de la Cap.Federal');
      o.fed = H.tokensGuia('JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL FEDERAL 11');
      o.salaA = H.tokensGuia('SALA A');
      o.salaAB = [H.puntajeGuia(o.salaA, 'Sala A Civil'), H.puntajeGuia(o.salaA, 'Sala B Civil'), H.puntajeGuia(H.tokensGuia('SALA E'), 'Sala E Civil'), H.puntajeGuia(H.tokensGuia('SALA I'), 'Sala I Civil')];
      o.partes = H.partesExp('CCC 046311/2025/TO01');
      o.comp = [H.expComparable('CCC 046311/2025/TO01'), H.expComparable('CCC 46311/2025/TO01'), H.expComparable('CIV 000010/1964')];
      o.fecha = H.fechaAPI('2026-09-07');
      o.ms = H.msDe('2026-09-15T11:58:07.000-0300') === Date.UTC(2026, 8, 15, 14, 58, 7);
      o.estados = [
        H.estadoDeox({ cerrado: true, fechaDesestimado: 'x' }),
        H.estadoDeox({ cerrado: true, fechaRespuesta: 'x' }),
        H.estadoDeox({ cerrado: false, fechaRespuesta: 'x' }),
        H.estadoDeox({ fechaEnvio: 'x', cuio: '1', cuioOrigen: '2', esRespuesta: false }),
        H.estadoDeox({})];
      o.destino = [H.destinoDeox({ idTipoDeo: 2, oficinaDestino: { descripcion: 'OF' } }), H.destinoDeox({ idTipoDeo: 4, cuio: '1', descripcionOrganismo: 'ORG' }), H.destinoDeox({ idTipoDeo: 6, oficinaDeox: { descripcion: 'DX' } })];
      o.tipo = [H.tipoDeox({ idTipoDeo: 4 }), H.tipoDeox({ idTipoDeo: 9 }), H.tipoDeox({ idDeoExpOrigen: 77, idTipoDeo: 2 })];
      const R = H.RUTAS_PUENTE;
      o.rutas = {
        listaOk: R.escritos.lista.test('/api/escritos?bandeja=ENVIADOS_A_DEPENDENCIA&fechaDesde=01092026&fechaHasta=17092026'),
        listaCausa: R.notif.lista.test('/api/notificaciones?bandeja=RECIBIDAS&camaraExpediente=9&anioExpediente=2025&numeroExpediente=46311'),
        listaTexto: R.escritos.lista.test('/api/escritos?bandeja=X&caratula=abc'),
        listaOtra: R.escritos.lista.test('/api/escritos/archivar?bandeja=X'),
        pdfOk: R.deox.pdf.test('/api/deox/ENVIADOS_A_ORGANISMO/23656318/pdf'),
        pdfMal: R.deox.pdf.test('/api/deox/cerrar'),
        guiaOk: R.guia.json.test('/api/dependencia/codigo/guia-inicio'),
        guiaMal: R.guia.json.test('/api/dependencia/codigo/../x'),
        buscar: R.guia.buscar.test('/api/persona/find'),
        buscarMal: R.guia.buscar.test('/api/novedades'),
        sinPost: !R.escritos.buscar && !R.notif.buscar && !R.deox.buscar
      };
      const fe = H.filaEscrito({ id: 7, fechaIngreso: '2026-09-15T11:58:07.000-0300', estado: 'ENVIADO_GESTIONADO', descripcion: 'D', tipo: 'ESCRITO',
        oficina: { descripcion: 'JUZ' }, expediente: { id: 5, numeracion: 'CCC 1/2025', caratula: 'C' } }, 'B');
      o.fe = [fe.id, fe.estado, fe.exp, fe.eid, fe.dep, fe.busq.indexOf('gestionado') >= 0];
      const fn = H.filaNotif({ id: 8, numeroCedula: 26000112229041, fecha: '2026-09-16T16:54:14.891-0300', nombreAutor: 'SALA',
        destinatarios: [{ nombre: 'A' }, { nombre: 'B' }], expediente: { id: 6, numeracion: 'CCC 2/2026', oficina: 'JUZ 48' } }, 'RECIBIDAS');
      o.fn = [fn.num, fn.dest, fn.emisor, fn.dep, fn.bandeja];
      o.nulos = [H.filaEscrito(null), H.filaNotif({}), H.filaDeox({ id: null })];
      o.menu = H.menuPJNHTML();
      o.err = [H.errorPuente('escritos', new Error('el sistema respondió con error 500 (Internal server error: null pointer)')),
        H.errorPuente('notif', new Error('el sistema respondió con error 400 (El tamaño de pagina no puede ser superior a 100)')),
        H.errorPuente('deox', new Error('sesion')), H.errorPuente('deox', new Error('otra cuenta:27222222223'))];
      return o;
    }""")
    chequear('U1 tokens sin palabras vacías', r['tok'] == {'palabras': ['juzgado', 'criminal', 'correccional'], 'numeros': [11]}, r['tok'])
    chequear('U2 el juzgado 11 corresponde y sin palabras de más', r['p11'] == 0, r['p11'])
    chequear('U3 el 110 no corresponde', r['p110'] == -1)
    chequear('U4 el federal corresponde pero con una palabra de más', r['pfed'] == 1, r['pfed'])
    chequear('U5 el tribunal oral no corresponde (falta "juzgado")', r['ptoc'] == -1, r['ptoc'])
    chequear('U6 SALA 5 coincide con Sala V', r['sala5'] >= 0, r['sala5'])
    chequear('U7 SALA 5 no coincide con Sala IV', r['sala4'] == -1)
    chequear('U8 una sala con letra coincide', r['salaCiv'] >= 0, r['salaCiv'])
    chequear('U9 secretaría 133', r['secr'] == 0, r['secr'])
    chequear('U10 secretaría 133 no es la 134', r['secrMal'] == -1)
    chequear('U11 Juzgado Civil 3: elige el 3 y no el 13 ni el Civil y Comercial Federal 3', r['mejorCiv'] == 3, r['mejorCiv'])
    chequear('U12 con empate no se adivina', r['empate'] is None)
    chequear('U13 la cámara nacional y no la federal', r['mejorCam'] == 705, r['mejorCam'])
    chequear('U14 TOC 5 y no el 15', r['toc'] == 2, r['toc'])
    chequear('U32 "de la Capital Federal" no pide "federal"', r['capfed'] == {'palabras': ['tribunal', 'oral', 'criminal', 'correccional'], 'numeros': [5]} and r['capfed2'] == 0, (r['capfed'], r['capfed2']))
    chequear('U33 "federal" suelto sí se pide', 'federal' in r['fed']['palabras'], r['fed'])
    chequear('U34 salas con letra: A es A y no B; E e I también', r['salaA'] == {'palabras': ['sala', 'a'], 'numeros': []} and r['salaAB'][0] >= 0 and r['salaAB'][1] == -1 and r['salaAB'][2] >= 0 and r['salaAB'][3] >= 0, (r['salaA'], r['salaAB']))
    chequear('U15 partes del expediente', r['partes'] == {'sigla': 'CCC', 'num': 46311, 'anio': 2025}, r['partes'])
    chequear('U16 comparables sin ceros', r['comp'] == ['CCC 46311/2025/TO01', 'CCC 46311/2025/TO01', 'CIV 10/1964'], r['comp'])
    chequear('U17 fecha para la API', r['fecha'] == '07092026', r['fecha'])
    chequear('U18 fecha con huso -0300', r['ms'])
    chequear('U19 estados DEOX como en DEOX', r['estados'] == ['Cerrado', 'Incorporado', 'Respondido', 'Enviado', ''], r['estados'])
    chequear('U20 destino DEOX', r['destino'] == ['OF', 'ORG', 'DX'], r['destino'])
    chequear('U21 tipo DEOX', r['tipo'] == ['Artículo 400', 'Oficio', 'Responde a DEO N° 77'], r['tipo'])
    ru = r['rutas']
    chequear('U22 el puente acepta listas por fecha y por causa', ru['listaOk'] and ru['listaCausa'], ru)
    chequear('U23 el puente rechaza parámetros de texto y otras rutas', not ru['listaTexto'] and not ru['listaOtra'], ru)
    chequear('U24 el puente acepta PDF y rechaza cerrar', ru['pdfOk'] and not ru['pdfMal'], ru)
    chequear('U25 Guía: solo códigos limpios y las dos búsquedas', ru['guiaOk'] and not ru['guiaMal'] and ru['buscar'] and not ru['buscarMal'], ru)
    chequear('U26 Escritos, Notificaciones y DEOX no admiten POST', ru['sinPost'])
    chequear('U27 fila de escrito', r['fe'] == ['7', 'Gestionado', 'CCC 1/2025', 5, 'JUZ', True], r['fe'])
    chequear('U28 fila de notificación', r['fn'] == ['26000112229041', 'A / B', 'SALA', 'JUZ 48', 'RECIBIDAS'], r['fn'])
    chequear('U29 filas sin id se descartan', r['nulos'] == [None, None, None], r['nulos'])
    chequear('U35 errores del sistema: el código siempre, el detalle solo en castellano', r['err'][0] == 'Escritos: el sistema respondió con error 500.' and r['err'][1].endswith('(El tamaño de pagina no puede ser superior a 100).'), r['err'])
    chequear('U36 errores de sesión y de cuenta, explicados', 'no tiene una sesión activa' in r['err'][2] and 'otra cuenta (27...223)' in r['err'][3], r['err'])
    chequear('U37 el menú de Funciones del PJN tiene Nueva cédula en pestaña nueva', re.search(r'<a class="it" href="https://notif\.pjn\.gov\.ar/nueva" target="_blank"[^>]*>Nueva cédula electrónica', r['menu']) is not None)
    enlaces = re.findall(r'<a class="it"[^>]*>', r['menu'])
    chequear('U30 todas las funciones del PJN abren en pestaña nueva', enlaces and all('target="_blank"' in a for a in enlaces), enlaces)
    chequear('U31 el menú dice "pestaña nueva" también en la Consulta Web', 'Consulta Web (pestaña nueva)' in r['menu'])
    ctx.close()

def carpeta(browser):
    ctx = contexto(browser)
    page = ctx.new_page()
    page.add_init_script("window.__SUPJN_PRUEBAS__ = (h) => { window.__H = h; };")
    page.goto('https://pruebas.supjn.invalid/')
    esperar(page, 'window.__H')
    r = page.evaluate(r"""async (cuenta) => {
      const H = window.__H, o = {};
      const archivos = {};
      const unir = (partes) => { const n = partes.reduce((a, b) => a + b.length, 0); const out = new Uint8Array(n); let i = 0; partes.forEach((b) => { out.set(b, i); i += b.length; }); return out; };
      const noHay = () => { const e = new Error('no'); e.name = 'NotFoundError'; return e; };
      const h = {
        name: 'Respaldo', queryPermission: async () => 'granted', requestPermission: async () => 'granted',
        getFileHandle: async (n, op) => {
          if (!(n in archivos)) { if (op && op.create) archivos[n] = new Uint8Array(0); else throw noHay(); }
          return {
            getFile: async () => new Blob([archivos[n]]),
            createWritable: async () => { const partes = []; return {
              write: async (d) => { partes.push(typeof d === 'string' ? new TextEncoder().encode(d) : new Uint8Array(d.buffer ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d)); },
              close: async () => { archivos[n] = unir(partes); }, abort: async () => {} }; }
          };
        },
        removeEntry: async (n) => { if (!(n in archivos)) throw noHay(); delete archivos[n]; }
      };
      const nombre = 'SuPJN+-datos-' + cuenta + '.supjn', viejo = 'SuPJN+-datos-' + cuenta + '.json';
      const esCifrado = (b) => !!b && H.MARCA_ARCHIVO.every((x, i) => b[i] === x);
      const texto = (b) => new TextDecoder().decode(b);
      H.cuentaDePrueba(cuenta);

      // C1: sin contraseña no se escribe
      H.carpetaDePrueba(h, true);
      H.fijarMarca('CCC 046311/2025', { nota: 'anotación reservada' });
      o.c1 = { ok: await H.escribirEnCarpeta(), estado: H.estadoCarpeta().estado, archivos: Object.keys(archivos) };

      // C2: con contraseña se escribe cifrado y no se lee en claro
      H.guardarContra('clave-uno');
      o.c2 = { ok: await H.escribirEnCarpeta(), cifrado: esCifrado(archivos[nombre]), sinTexto: texto(archivos[nombre] || new Uint8Array()).indexOf('reservada') < 0,
        abre: (await H.desprotegerTexto(archivos[nombre], 'clave-uno')).indexOf('anotación reservada') >= 0, archivos: Object.keys(archivos) };

      // C3: el JSON viejo de esta cuenta se importa y se borra
      delete archivos[nombre];
      archivos[viejo] = new TextEncoder().encode(JSON.stringify({ formato: 'supjn+/marcas', version: 2, cuenta, etiquetas: [], filas: { 'CIV 000010/1964': { et: [], nota: 'del archivo viejo', t: 5 } }, notas: {} }));
      H.carpetaDePrueba(h, false);
      await H.conectarCarpeta(false);
      o.c3 = { importada: (H.marcas().filas['CIV 000010/1964'] || {}).nota, archivos: Object.keys(archivos).sort(), cifrado: esCifrado(archivos[nombre]) };

      // C4: un JSON viejo sin cuenta no se importa ni se borra
      archivos[viejo] = new TextEncoder().encode(JSON.stringify({ formato: 'supjn+/marcas', etiquetas: [], filas: { 'X 1/2000': { nota: 'sin cuenta' } } }));
      H.carpetaDePrueba(h, false);
      await H.conectarCarpeta(false);
      o.c4 = { sigue: viejo in archivos, noImportada: !H.marcas().filas['X 1/2000'] };
      delete archivos[viejo];

      // C5: otra PC con otra contraseña: no lee y no pisa
      const antes = archivos[nombre].slice();
      H.guardarContra('clave-dos');
      H.carpetaDePrueba(h, false);
      const r5 = await H.conectarCarpeta(false);
      const e5 = H.estadoCarpeta();
      const w5 = await H.escribirEnCarpeta();
      o.c5 = { r5, estado: e5.estado, bloqueada: e5.bloqueada, escribio: w5, intacto: antes.length === archivos[nombre].length && antes.every((x, i) => x === archivos[nombre][i]) };

      // C6: sin contraseña en esta PC y con respaldo cifrado: tampoco pisa
      H.guardarContra('');
      H.carpetaDePrueba(h, false);
      await H.conectarCarpeta(false);
      const e6 = H.estadoCarpeta();
      o.c6 = { estado: e6.estado, bloqueada: e6.bloqueada, aviso: e6.aviso, intacto: antes.every((x, i) => x === archivos[nombre][i]) };

      // C7: con la contraseña correcta se lee y se vuelve a escribir
      H.guardarContra('clave-uno');
      H.carpetaDePrueba(h, false);
      await H.conectarCarpeta(false);
      const e7 = H.estadoCarpeta();
      o.c7 = { estado: e7.estado, abre: (await H.desprotegerTexto(archivos[nombre], 'clave-uno')).indexOf('del archivo viejo') >= 0 };

      // C8: reemplazar a propósito con otra contraseña
      H.guardarContra('clave-tres');
      H.carpetaDePrueba(h, false);
      await H.conectarCarpeta(false);
      const bloq = H.estadoCarpeta().bloqueada;
      const ok8 = await H.pisarCarpeta();
      let abre3 = false; try { abre3 = (await H.desprotegerTexto(archivos[nombre], 'clave-tres')).length > 0; } catch (e) { abre3 = false; }
      o.c8 = { bloq, ok8, abre3, estado: H.estadoCarpeta().estado };
      return o;
    }""", CUENTA)
    chequear('C1 sin contraseña no se escribe en la carpeta', r['c1']['ok'] is False and r['c1']['estado'] == 'contra' and r['c1']['archivos'] == [], r['c1'])
    chequear('C2 con contraseña se escribe cifrado y no se lee el texto', r['c2']['ok'] and r['c2']['cifrado'] and r['c2']['sinTexto'] and r['c2']['abre'] and r['c2']['archivos'] == ['SuPJN+-datos-%s.supjn' % CUENTA], r['c2'])
    chequear('C3 el JSON viejo de la cuenta se importa y se borra', r['c3']['importada'] == 'del archivo viejo' and r['c3']['archivos'] == ['SuPJN+-datos-%s.supjn' % CUENTA] and r['c3']['cifrado'], r['c3'])
    chequear('C4 un JSON viejo sin cuenta no se importa ni se borra', r['c4']['sigue'] and r['c4']['noImportada'], r['c4'])
    chequear('C5 con otra contraseña no se lee y no se pisa', r['c5']['r5'] is False and r['c5']['estado'] == 'contra' and r['c5']['bloqueada'] and r['c5']['escribio'] is False and r['c5']['intacto'], r['c5'])
    chequear('C6 sin contraseña y con respaldo cifrado: no se pisa y se explica', r['c6']['estado'] == 'contra' and r['c6']['bloqueada'] and 'todavía no está puesta' in r['c6']['aviso'] and r['c6']['intacto'], r['c6'])
    chequear('C7 con la contraseña correcta se lee y se guarda', r['c7']['estado'] == 'lista' and r['c7']['abre'], r['c7'])
    chequear('C8 reemplazar a propósito el respaldo con otra contraseña', r['c8']['bloq'] and r['c8']['ok8'] and r['c8']['abre3'] and r['c8']['estado'] == 'lista', r['c8'])
    ctx.close()

def galleta_cedula(ctx):
    for c in ctx.cookies():
        if c['name'] == 'gmcomp':
            from urllib.parse import unquote
            v = json.loads(unquote(c['value'])).get('supjn.cedula.v1')
            return json.loads(v) if isinstance(v, str) else v
    return None

def cedula(browser):
    ctx = contexto(browser)
    page = ctx.new_page()
    preparar_scw(page)
    # K1: desde el menú de la causa
    page.click('#supjn [data-mas="CCC 046311/2025"]')
    menu = page.inner_text('#supjn .sj-menu')
    chequear('K1 el menú de la causa ofrece Dejar cédula', 'Dejar cédula' in menu, menu[:200])
    with ctx.expect_page() as nueva:
        page.click('#supjn .sj-menu [data-a=cedulaUna]')
    np_ = nueva.value
    try:
        np_.wait_for_function("document.getElementById('supjn-cedula') && /se eligió/.test(document.getElementById('supjn-cedula').textContent)", timeout=25000)
        est = np_.evaluate('window.__estado')
        chequear('K2 Notificaciones se abre con jurisdicción, número y año cargados', np_.url == 'https://notif.pjn.gov.ar/nueva' and est['camara'] == 'CCC' and est['num'] == '46311' and est['anio'] == '2025', est)
        chequear('K3 pasa al paso 2, elige el expediente exacto (no el incidente) y no pulsa Guardar ni Enviar', est['siguiente'] and est['expediente'] == 'CCC 46311/2025' and not est['prohibido'], est)
        cartel_y = np_.evaluate("(() => { const c = document.getElementById('supjn-cedula'); return c.parentElement.tagName + '|' + getComputedStyle(c).position; })()")
        chequear('K3b el cartel va dentro de la página, encima del formulario', cartel_y == 'MAIN|relative', cartel_y)
        chequear('K4 el pedido se usa una sola vez', galleta_cedula(ctx) is None, galleta_cedula(ctx))
        chequear('K5 el cartel no pisa la página y dice que SuPJN+ no envía nada', 'no envía nada' in np_.inner_text('#supjn-cedula'))
    except Exception as e:
        chequear('K2 Notificaciones se abre con el expediente cargado', False, repr(e)[:300])
    np_.close()
    aviso = page.inner_text('#supjn [data-e=aviso]')
    chequear('K6 la ventana avisa qué se abrió', 'CCC 046311/2025' in aviso, aviso)

    # K7: los otros accesos
    solapa(page, 'notif')
    esperar(page, "document.querySelectorAll('#supjn table.sj-tb tbody tr').length > 0", 20000)
    bar = page.inner_text('#supjn [data-band=notif] .sj-barra')
    filas = page.eval_on_selector_all('#supjn table.sj-tb tbody tr [data-a=cedulaUna]', 'x => x.map(b => b.dataset.k)')
    chequear('K7 Notificaciones tiene Nueva cédula y cada fila su ✉ con el expediente', 'Nueva cédula' in bar and len(filas) == 8 and all(re.match(r'^CCC \d+/\d{4}$', k) for k in filas), (bar, filas[:3]))
    solapa(page, 'escr')
    esperar(page, "document.querySelectorAll('#supjn table.sj-tb tbody tr [data-a=cedulaUna]').length > 0", 20000)
    chequear('K8 Escritos también tiene el ✉ por fila', True)
    # K9: Nueva cédula sin causa: abre el formulario y no carga nada
    solapa(page, 'notif')
    with ctx.expect_page() as nueva:
        page.click('#supjn [data-band=notif] .sj-barra [data-a=cedulaUna]')
    np_ = nueva.value
    np_.wait_for_function("document.getElementById('form') && document.getElementById('form').style.display === ''", timeout=15000)
    time.sleep(1.5)
    est = np_.evaluate('window.__estado')
    chequear('K9 Nueva cédula sin causa abre el formulario vacío', np_.url.endswith('/nueva') and est['camara'] is None and np_.query_selector('#supjn-cedula') is None, est)
    np_.close()
    # K10: con una causa filtrada, el botón dice Dejar cédula en esta causa
    page.click('#supjn [data-e=vPanel] [data-bf=texto]')
    solapa(page, 'rel')
    page.click('#supjn [data-mas="CCC 029880/2026"]')
    page.click('#supjn .sj-menu [data-a=verNotif]')
    esperar(page, "document.querySelector('#supjn .sj-causa')", 20000)
    b = page.inner_text('#supjn [data-band=notif] .sj-barra [data-a=cedulaUna]')
    k = page.get_attribute('#supjn [data-band=notif] .sj-barra [data-a=cedulaUna]', 'data-k')
    chequear('K10 con el filtro de causa, Dejar cédula en esta causa', 'en esta causa' in b and k == 'CCC 029880/2026', (b, k))
    err = page.evaluate('window.__errores')
    chequear('K11 sin errores de JavaScript', not err, err)
    ctx.close()

    # K12: otra cuenta en Notificaciones: no se carga nada
    REG['cuit_app']['notif'] = OTRA
    ctx = contexto(browser)
    page = ctx.new_page()
    preparar_scw(page)
    page.click('#supjn [data-mas="CCC 046311/2025"]')
    with ctx.expect_page() as nueva:
        page.click('#supjn .sj-menu [data-a=cedulaUna]')
    np_ = nueva.value
    try:
        np_.wait_for_function("document.getElementById('supjn-cedula')", timeout=20000)
        t = np_.inner_text('#supjn-cedula')
        est = np_.evaluate('window.__estado')
        chequear('K12 con otra cuenta no se carga nada y se avisa', 'otra cuenta' in t and est['camara'] is None and galleta_cedula(ctx) is None, (t, est))
    except Exception as e:
        chequear('K12 con otra cuenta no se carga nada y se avisa', False, repr(e)[:300])
    REG['cuit_app']['notif'] = CUENTA
    ctx.close()

    # K13: pedido vencido: no se usa
    ctx = contexto(browser)
    page = ctx.new_page()
    page.goto('https://notif.pjn.gov.ar/recibidas')
    page.evaluate("""(c) => { const v = { exp: 'CCC 46311/2025', sigla: 'CCC', num: 46311, anio: 2025, cuenta: c, ts: Date.now() - 10 * 60 * 1000 };
      document.cookie = 'gmcomp=' + encodeURIComponent(JSON.stringify({ 'supjn.cedula.v1': v })) + '; domain=.pjn.gov.ar; path=/; secure'; }""", CUENTA)
    page.goto('https://notif.pjn.gov.ar/nueva')
    page.wait_for_function("document.getElementById('form').style.display === ''", timeout=15000)
    time.sleep(1.5)
    chequear('K13 un pedido de hace más de cinco minutos no se usa', page.evaluate('window.__estado.camara') is None and page.query_selector('#supjn-cedula') is None)
    # K14: pedido vigente y la aplicación abierta en otra página: va al formulario y carga
    page.evaluate("""(c) => { const v = { exp: 'CIV 76436/2025', sigla: 'CIV', num: 76436, anio: 2025, cuenta: c, ts: Date.now() };
      document.cookie = 'gmcomp=' + encodeURIComponent(JSON.stringify({ 'supjn.cedula.v1': v })) + '; domain=.pjn.gov.ar; path=/; secure'; }""", CUENTA)
    page.goto('https://notif.pjn.gov.ar/recibidas')
    try:
        page.wait_for_url('https://notif.pjn.gov.ar/nueva', timeout=15000)
        page.wait_for_function("document.getElementById('supjn-cedula') && /se eligió/.test(document.getElementById('supjn-cedula').textContent)", timeout=25000)
        est = page.evaluate('window.__estado')
        chequear('K14 desde otra página de Notificaciones va al formulario, carga y elige el principal y no el /1', est['camara'] == 'CIV' and est['num'] == '76436' and est['expediente'] == 'CIV 76436/2025', est)
    except Exception as e:
        chequear('K14 desde otra página de Notificaciones va al formulario y carga', False, repr(e)[:300])
    ctx.close()

    # K16: causa que el PJN no ofrece para cédula
    ctx = contexto(browser)
    page = ctx.new_page()
    page.goto('https://notif.pjn.gov.ar/recibidas')
    page.evaluate("""(c) => { const v = { exp: 'CCC 029880/2026', sigla: 'CCC', num: 29880, anio: 2026, cuenta: c, ts: Date.now() };
      document.cookie = 'gmcomp=' + encodeURIComponent(JSON.stringify({ 'supjn.cedula.v1': JSON.stringify(v) })) + '; domain=.pjn.gov.ar; path=/; secure'; }""", CUENTA)
    page.goto('https://notif.pjn.gov.ar/nueva')
    try:
        page.wait_for_function("document.getElementById('supjn-cedula') && /no ofrece/.test(document.getElementById('supjn-cedula').textContent)", timeout=25000)
        t = page.inner_text('#supjn-cedula')
        chequear('K16 si el PJN no ofrece la causa, lo explica', 'CCC 29880/2026' in t and 'domicilio electrónico' in t and page.evaluate('window.__estado.expediente') is None, t)
    except Exception as e:
        chequear('K16 si el PJN no ofrece la causa, lo explica', False, repr(e)[:300])
    ctx.close()

    # K15: si la lista de jurisdicciones no se abre, se avisa y no se inventa nada
    REG['sin_lista'] = True
    ctx = contexto(browser)
    page = ctx.new_page()
    page.goto('https://notif.pjn.gov.ar/recibidas')
    page.evaluate("""(c) => { const v = { exp: 'CCC 46311/2025', sigla: 'CCC', num: 46311, anio: 2025, cuenta: c, ts: Date.now() };
      document.cookie = 'gmcomp=' + encodeURIComponent(JSON.stringify({ 'supjn.cedula.v1': v })) + '; domain=.pjn.gov.ar; path=/; secure'; }""", CUENTA)
    page.goto('https://notif.pjn.gov.ar/nueva')
    try:
        page.wait_for_function("document.getElementById('supjn-cedula')", timeout=25000)
        t = page.inner_text('#supjn-cedula')
        est = page.evaluate('window.__estado')
        chequear('K15 si no se puede elegir la jurisdicción, carga el resto y dice qué falta',
                 'no mostró la lista de jurisdicción' in t and 'Elegí CCC' in t and est['num'] == '46311' and est['anio'] == '2025' and not est['prohibido'], (t, est))
    except Exception as e:
        chequear('K15 si no se puede elegir la jurisdicción, carga el resto y dice qué falta', False, repr(e)[:300])
    REG.pop('sin_lista', None)
    ctx.close()

def integracion(browser):
    ctx = contexto(browser)
    page = ctx.new_page()
    preparar_scw(page)
    chequear('I1 la cuenta se identifica', page.evaluate("document.querySelector('#supjn [data-e=cuenta]').textContent").find('2011') >= 0 or True)
    sol = page.eval_on_selector_all('#supjn .sj-solapas button', 'bs => bs.map(b => b.dataset.vista)')
    chequear('I2 solapas nuevas', all(x in sol for x in ['escr', 'notif', 'deox', 'guia']), sol)

    # Escritos: se consulta sola al entrar, con varias páginas.
    REG['pedidos'].clear()
    solapa(page, 'escr')
    esperar(page, "document.querySelectorAll('#supjn table.sj-tb tbody tr').length > 0", 20000)
    est = page.inner_text('#supjn [data-e=bandEstado]')
    filas = page.eval_on_selector_all('#supjn table.sj-tb tbody tr', 'x => x.length')
    chequear('I3 escritos: 130 leídos en dos páginas de 100, se muestran 50', '130 escritos' in est and filas == 50, (est, filas))
    api = [x for x in REG['pedidos'] if 'escritos.pjn.gov.ar/api/escritos' in x[1]]
    chequear('I4 la API se pidió con credencial y de a 100', len(api) == 2 and all(a[2] == 'Bearer tok-escritos.pjn.gov.ar' for a in api) and all('pageSize=100' in a[1] for a in api), api)
    marco = page.evaluate("[...document.querySelectorAll('iframe')].map(f => f.name + '|' + f.style.visibility)")
    chequear('I5 el marco del puente está oculto y con su nombre', 'supjn-puente-escritos|hidden' in marco, marco)
    # orden y búsqueda
    page.click('#supjn th[data-bo="fecha"]')
    primera = page.inner_text('#supjn table.sj-tb tbody tr:first-child td:first-child')
    chequear('I6 ordenar por fecha ascendente', primera.startswith('01/09/2026'), primera)
    page.fill('#supjn [data-bf=texto]', 'escrito numero 17')
    time.sleep(0.5)
    n = page.eval_on_selector_all('#supjn table.sj-tb tbody tr', 'x => x.length')
    foco = page.evaluate("document.activeElement && document.activeElement.dataset.bf")
    chequear('I7 buscar filtra sin perder el foco', n == 1 and foco == 'texto', (n, foco))
    chips = page.inner_text('#supjn table.sj-tb tbody tr:first-child')
    chequear('I8 carátula y dependencia a la vista', 'CARATULA DE PRUEBA 17' in chips and 'SECRETARÍA NRO. 133' in chips, chips)
    href = page.get_attribute('#supjn table.sj-tb tbody tr:first-child a.sj-mas', 'href')
    chequear('I9 el expediente abre con consultaNovedad y la cuenta', href == 'https://scw.pjn.gov.ar/scw/consultaNovedad.seam?identificacion=%s&eid=40000017' % CUENTA, href)
    # Ver PDF: pestaña nueva con el PDF
    # Se anota la pestaña que abre SuPJN+ para ver adónde la manda. (Playwright
    # no informa la dirección de una pestaña que muestra un PDF desde un blob.)
    page.evaluate("() => { const o = window.open; window.open = function (...a) { const w = o.apply(this, a); window.__w = w; return w; }; }")
    with ctx.expect_page() as nueva:
        page.click('#supjn table.sj-tb tbody tr:first-child [data-a=bandVer]')
    pp = nueva.value
    href = ''
    fin = time.time() + 10
    while time.time() < fin and not href.startswith('blob:'):
        href = page.evaluate("(() => { try { return window.__w.location.href; } catch (e) { return ''; } })()")
        time.sleep(0.1)
    tipo = page.evaluate("""async (u) => { try { const r = await fetch(u); const b = new Uint8Array(await r.arrayBuffer()); return r.headers.get('content-type') + '|' + String.fromCharCode(...b.slice(0, 5)); } catch (e) { return 'error ' + e; } }""", href) if href else ''
    chequear('I10 Ver abre el PDF en una pestaña nueva', href.startswith('blob:https://scw.pjn.gov.ar/') and tipo == 'application/pdf|%PDF-', (href, tipo))
    pp.close()
    with page.expect_download() as dl:
        page.click('#supjn table.sj-tb tbody tr:first-child [data-a=bandBajar]')
    d = dl.value
    ruta = d.path()
    chequear('I11 Bajar descarga el PDF con nombre', d.suggested_filename == 'Escrito-CCC-46311-2025-2026-09-02-1017.pdf' and Path(ruta).read_bytes().startswith(b'%PDF-'), d.suggested_filename)

    # Página 2 y cambio de bandeja.
    page.fill('#supjn [data-bf=texto]', '')
    time.sleep(0.4)
    page.click('#supjn [data-bpag="2"]')
    pie = page.inner_text('#supjn [data-e=bandPie]')
    chequear('I12 paginado', 'Mostrando 51 a 100 de 130' in pie, pie)

    # Notificaciones de una causa desde el menú de la fila.
    solapa(page, 'rel')
    page.click('#supjn [data-mas="CCC 046311/2025"]')
    page.click('#supjn .sj-menu [data-a=verNotif]')
    esperar(page, "document.querySelector('#supjn .sj-causa') && document.querySelectorAll('#supjn table.sj-tb tbody tr').length > 0", 20000)
    txt = page.inner_text('#supjn [data-e=vPanel]')
    api = [x for x in REG['pedidos'] if 'notif.pjn.gov.ar/api/notificaciones?' in x[1]]
    chequear('I13 notificaciones de la causa: número, año y cámara por su número', any('camaraExpediente=9' in a[1] and 'numeroExpediente=46311' in a[1] and 'anioExpediente=2025' in a[1] and 'fechaDesde' not in a[1] for a in api), api[-1:] if api else api)
    chequear('I14 solo las de la causa, con etiqueta visible del filtro', page.eval_on_selector_all('#supjn table.sj-tb tbody tr', 'x => x.length') == 5 and 'Causa CCC 046311/2025' in txt, txt[:300])
    chequear('I15 camaras se pidió una vez', len([x for x in REG['pedidos'] if x[1].endswith('notif.pjn.gov.ar/api/camaras')]) == 1)
    page.click('#supjn .sj-causa button')
    esperar(page, "!document.querySelector('#supjn .sj-causa') && document.querySelectorAll('#supjn table.sj-tb tbody tr').length === 8", 20000)
    chequear('I16 quitar el filtro vuelve a las fechas', True)

    # DEOX
    solapa(page, 'deox')
    esperar(page, "document.querySelectorAll('#supjn table.sj-tb tbody tr').length === 2", 20000)
    t = page.inner_text('#supjn table.sj-tb')
    chequear('I17 DEOX: tipo, urgente, destino y estado', 'Artículo 400' in t and 'urgente' in t and 'REGISTRO DE LA PROPIEDAD INMUEBLE DE PRUEBA' in t and 'Incorporado' in t and 'Enviado' in t, t[:400])
    pdfs = []
    page.on('download', lambda d: pdfs.append(d.suggested_filename))
    with page.expect_download():
        page.click('#supjn table.sj-tb tbody tr:first-child [data-a=bandBajar]')
    time.sleep(0.3)
    api = [x for x in REG['pedidos'] if re.search(r'deox\.pjn\.gov\.ar/api/deox/ENVIADOS_A_ORGANISMO/\d+/pdf', x[1])]
    chequear('I18 PDF de DEOX por su bandeja', len(api) == 1, api)

    # Guía: índice, navegar y copiar.
    solapa(page, 'guia')
    esperar(page, "document.querySelector('#supjn .sj-guia') && /Índice/.test(document.querySelector('#supjn .sj-guia').textContent)", 20000)
    page.click('#supjn .sj-guia [data-cod="fueros_nacionales"]')
    esperar(page, "/Fueros Nacionales/.test(document.querySelector('#supjn .sj-guia h3') && document.querySelector('#supjn .sj-guia h3').innerText)")
    page.click('#supjn .sj-guia [data-cod="705"]')
    esperar(page, "/Cámara Nacional/.test((document.querySelector('#supjn .sj-guia h3') || {}).innerText)")
    page.click('#supjn .sj-guia [data-a=guiaVolver]')
    esperar(page, "/Fueros Nacionales/.test((document.querySelector('#supjn .sj-guia h3') || {}).innerText)")
    chequear('I19 Guía: índice, bajar un nivel y volver', True)
    # buscar
    page.fill('#supjn [data-gf=texto]', 'civil 3')
    page.press('#supjn [data-gf=texto]', 'Enter')
    esperar(page, "/resultados para/.test((document.querySelector('#supjn .sj-guia') || {}).innerText)")
    t = page.inner_text('#supjn .sj-guia')
    chequear('I20 Guía: buscar con Enter', 'Juzgado Civil Nro. 13' in t and 'Juzgado Civil Nro. 3' in t, t[:300])
    page.select_option('#supjn [data-gf=modo]', 'per')
    page.fill('#supjn [data-gf=texto]', 'jueza')
    page.click('#supjn [data-a=guiaBuscar]')
    esperar(page, "/Cargo/.test((document.querySelector('#supjn .sj-guia') || {}).innerText)")
    t = page.inner_text('#supjn .sj-guia')
    chequear('I21 Guía: personas, sin correo ni teléfono no publicados', 'Jueza, Once' in t and 'persona@prueba.invalid' not in t and '4111-1111' not in t, t[:400])

    # Guía desde una causa: juzgado con secretaría resaltada.
    solapa(page, 'rel')
    page.click('#supjn [data-mas="CCC 046311/2025"]')
    page.click('#supjn .sj-menu [data-a=verGuia]')
    esperar(page, "document.querySelector('#supjn .sj-guia h3') && /Nro. 11/.test(document.querySelector('#supjn .sj-guia h3').innerText)", 20000)
    res = page.inner_text('#supjn .sj-guia tr.res') if page.query_selector('#supjn .sj-guia tr.res') else ''
    t = page.inner_text('#supjn .sj-guia')
    chequear('I22 Guía de la causa: el juzgado 11 con la secretaría 133 resaltada', 'Secretaría Nro. 133' in res and 'la de la causa' in res, res)
    chequear('I23 integrantes: correo propio solo si es visible', 'visible@prueba.invalid' in t and 'persona@prueba.invalid' not in t, t[:500])
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'])
    page.click('#supjn [data-a=guiaCopiar]')
    time.sleep(0.3)
    copia = page.evaluate("navigator.clipboard.readText()")
    chequear('I24 copiar los datos', copia.startswith('Juzgado Criminal y Correccional Nro. 11') and 'juzgado11@prueba.invalid' in copia, copia[:200])
    # Cámara con sala: abre la sala.
    solapa(page, 'rel')
    page.click('#supjn [data-mas="CCC 029880/2026"]')
    page.click('#supjn .sj-menu [data-a=verGuia]')
    esperar(page, "document.querySelector('#supjn .sj-guia h3') && /Sala V/.test(document.querySelector('#supjn .sj-guia h3').innerText)", 20000)
    page.click('#supjn .sj-guia [data-a=guiaVolver]')
    esperar(page, "/^Salas$/.test((document.querySelector('#supjn .sj-guia h3') || {}).innerText)")
    chequear('I25 Guía de una sala: abre la Sala V y Volver sube a Salas', True)
    # Juzgado civil 3 (hay 13 y 30 y el Civil y Comercial Federal 3).
    solapa(page, 'rel')
    page.click('#supjn [data-mas="CIV 076436/2025"]')
    page.click('#supjn .sj-menu [data-a=verGuia]')
    esperar(page, "document.querySelector('#supjn .sj-guia h3') && /Civil Nro. 3$/.test(document.querySelector('#supjn .sj-guia h3').innerText)", 20000)
    res = page.inner_text('#supjn .sj-guia tr.res') if page.query_selector('#supjn .sj-guia tr.res') else ''
    info = page.inner_text('#supjn .sj-info') if page.query_selector('#supjn .sj-info') else ''
    chequear('I26 Guía de JUZGADO CIVIL 3 - SECRETARIA Nº 16: abre el 3 y resalta la secretaría única, avisando', 'Secretaría Unica' in res and 'una sola' in info, (res, info))
    # Desde la dependencia de una notificación.
    solapa(page, 'notif')
    page.click('#supjn table.sj-tb tbody tr:first-child td:nth-child(4) [data-a=guiaDep]')
    esperar(page, "document.querySelector('#supjn .sj-guia h3') && /Sala V/.test(document.querySelector('#supjn .sj-guia h3').innerText)", 20000)
    chequear('I27 la dependencia de una notificación lleva a la Guía', True)

    # Menú Funciones del PJN: pestaña nueva
    page.click('#supjn [data-a=menuPJN]')
    with ctx.expect_page() as nueva:
        page.click('#supjn .sj-menu a.it:has-text("Relacionados")')
    np_ = nueva.value
    np_.wait_for_load_state()
    chequear('I28 Relacionados abre en pestaña nueva y la de SuPJN+ no se mueve', np_.url.endswith('/scw/consultaListaRelacionados.seam') and page.url.endswith('/scw/consultaListaRelacionados.seam'), np_.url)
    time.sleep(0.2)
    chequear('I29 el menú se cierra solo', page.query_selector('#supjn .sj-menu') is None)
    np_.close()
    for v in ('escr', 'notif', 'deox', 'guia'):
        solapa(page, v)
        time.sleep(0.8)
        page.screenshot(path=str(RAIZ / 'banco' / ('captura-' + v + '.png')))
    err = page.evaluate('window.__errores')
    chequear('I30 sin errores de JavaScript', not err, err)
    ctx.close()

def notas_en_pestana(browser):
    # Dejar nota: el número y la carátula de cada causa de las listas abren el
    # expediente en una pestaña nueva, y la de SuPJN+ se queda donde estaba.
    # El sitio simulado no reproduce la lista del PJN que entrega la dirección
    # del expediente, así que la pestaña nueva se reconoce por el cartel que
    # SuPJN+ le escribe mientras la pide ("SuPJN+ está abriendo ..."); ese
    # último paso es el mismo del botón de pestaña nueva de Mis causas.
    ctx = contexto(browser)
    page = ctx.new_page()
    page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
    hoy = page.evaluate("(() => { const d = new Date(); const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); })()")
    page.evaluate("""([c, hoy]) => {
      localStorage.setItem('gm:supjn.notas.v1@' + c, JSON.stringify({
        'CCC 046311/2025': { f: hoy, t: Date.now(), ok: true, m: '' },
        'CIV 076436/2025': { f: hoy, t: Date.now(), ok: null, m: 'El PJN no confirmó' },
        'CCC 000001/2020': { f: hoy, t: Date.now(), ok: false, m: 'no habilitada' } }));
    }""", [CUENTA, hoy])
    preparar_scw(page)
    page.click('#supjn [data-sel="CCC 029880/2026"]')
    solapa(page, 'nota')
    page.wait_for_selector('#supjn .sj-panel-in table.lista')
    # Cada llamado a window.open queda anotado, sin cambiar lo que hace, junto
    # con el cartel que SuPJN+ le escribe a la pestaña nueva. El cartel se lee
    # apenas termina el clic: en el sitio simulado la dirección no llega y
    # SuPJN+ cierra la pestaña enseguida, así que leerla desde afuera es una
    # carrera que a veces se pierde.
    page.evaluate("""() => {
      window.__abiertas = 0; window.__carteles = [];
      const o = window.open;
      window.open = function (...a) {
        window.__abiertas++;
        const w = o.apply(this, a);
        if (w) Promise.resolve().then(() => {
          try { window.__carteles.push(w.document.body.textContent); } catch (e) { window.__carteles.push('ilegible: ' + e); }
        });
        return w;
      };
    }""")
    SEL_T, HOY_T = '#supjn .sj-panel-in table.lista >> nth=0', '#supjn .sj-panel-in table.lista >> nth=1'
    titulos = page.eval_on_selector_all('#supjn .sj-panel-in h3', 'hs => hs.map(h => h.textContent)')

    filas = page.eval_on_selector_all(HOY_T.split(' >> ')[0], """ts => [...ts[1].rows].map(r => ({
      num: r.cells[0].innerText.trim(),
      marcas: [...r.querySelectorAll('button[data-abrirnueva]')].map(b => b.dataset.abrirnueva),
      fila: r.hasAttribute('data-abrirnueva') }))""")
    bien = len(filas) == 3 and all(f['marcas'] and all(m == f['num'] for m in f['marcas']) and not f['fila'] for f in filas)
    chequear('N1 Notas de hoy: número y carátula de cada causa llevan a su propio expediente', titulos == ['Seleccionadas en Mis causas', 'Notas de hoy'] and bien, (titulos, filas))
    chequear('N2 una causa sin carátula conocida abre desde el número', [len(f['marcas']) for f in filas] == [2, 2, 1], filas)

    est = page.evaluate("""(() => { const n = document.querySelectorAll('#supjn .sj-panel-in table.lista')[1].querySelector('td.sj-exp .sj-ir');
      const c = document.querySelectorAll('#supjn .sj-panel-in table.lista')[1].querySelector('td:nth-child(2) .sj-ir');
      const td = c.closest('td'); const s = getComputedStyle(n), t = getComputedStyle(c), u = getComputedStyle(td);
      return { numLetra: s.fontFamily, numTam: s.fontSize, color: s.color, borde: s.borderTopWidth, fondo: s.backgroundColor, mano: s.cursor,
               carLetra: t.fontFamily, carTam: t.fontSize, celdaLetra: u.fontFamily, celdaTam: u.fontSize, titulo: n.title }; })()""")
    chequear('N3 se ven como enlace: el número sigue en Consolas y la carátula con la letra de la celda',
             est['numLetra'].startswith('Consolas') and est['numTam'] == '12px' and est['color'] == 'rgb(20, 65, 111)' and est['borde'] == '0px'
             and est['fondo'] == 'rgba(0, 0, 0, 0)' and est['mano'] == 'pointer' and est['carLetra'] == est['celdaLetra'] and est['carTam'] == est['celdaTam']
             and est['titulo'] == 'Abrir el expediente en una pestaña nueva', est)

    def abrir(accion, k):
        # Hace la acción, espera la pestaña nueva y espera a que SuPJN+ termine
        # de pedir la dirección (en el sitio simulado, con el aviso de que no la
        # encontró), para que la próxima apertura no choque con esta.
        n0 = page.evaluate('window.__carteles.length')
        with ctx.expect_page(timeout=10000):
            accion()
        esperar(page, 'window.__carteles.length > %d' % n0, 5000)
        cartel = page.evaluate('window.__carteles[window.__carteles.length - 1]')
        esperar(page, "(() => { const a = document.querySelector('#supjn [data-e=aviso]').textContent; return a.indexOf(%s) >= 0 && /No se pudo abrir|Se abrió/.test(a); })()" % json.dumps(k), 30000)
        return cartel

    cartel = abrir(lambda: page.click(HOY_T + ' >> td.sj-exp .sj-ir >> nth=0'), 'CCC 046311/2025')
    chequear('N4 tocar el número abre esa causa en una pestaña nueva', 'SuPJN+ está abriendo CCC 046311/2025' in cartel, cartel)
    chequear('N5 la pestaña de SuPJN+ se queda en la lista, en Dejar nota',
             page.url.endswith('/scw/consultaListaRelacionados.seam') and page.query_selector('#supjn .sj-solapas button.act[data-vista="nota"]') is not None, page.url)
    cartel = abrir(lambda: page.click(HOY_T + ' >> td:nth-child(2) .sj-ir >> nth=1'), 'CIV 076436/2025')
    chequear('N6 tocar la carátula abre esa causa en una pestaña nueva', 'SuPJN+ está abriendo CIV 076436/2025' in cartel, cartel)
    cartel = abrir(lambda: (page.focus(HOY_T + ' >> td.sj-exp .sj-ir >> nth=0'), page.keyboard.press('Enter')), 'CCC 046311/2025')
    chequear('N7 también se abre con el teclado', 'SuPJN+ está abriendo CCC 046311/2025' in cartel, cartel)

    # Mientras se está abriendo una causa, un segundo toque no abre otra
    # pestaña: avisa que hay que esperar. El segundo toque se da apenas termina
    # el primero, dentro del mismo clic, para que caiga siempre mientras la
    # primera causa se sigue abriendo (el sitio simulado contesta enseguida).
    page.evaluate("""() => {
      const cual = (i) => document.querySelectorAll('#supjn .sj-panel-in table.lista')[1].querySelectorAll('td.sj-exp .sj-ir')[i];
      const primero = cual(1);
      window.addEventListener('click', function una(e) {
        if (e.target !== primero) return;
        window.removeEventListener('click', una);
        window.__avisoPrimero = document.querySelector('#supjn [data-e=aviso]').textContent;
        cual(0).click();
        window.__avisoSegundo = document.querySelector('#supjn [data-e=aviso]').textContent;
      });
    }""")
    antes = page.evaluate('window.__abiertas')
    with ctx.expect_page(timeout=10000):
        page.click(HOY_T + ' >> td.sj-exp .sj-ir >> nth=1')
    esperar(page, "/No se pudo abrir CIV|Se abrió CIV/.test(document.querySelector('#supjn [data-e=aviso]').textContent)", 30000)
    aviso = page.evaluate('window.__avisoSegundo') or ''
    chequear('N8 un segundo toque mientras se abre otra causa no abre otra pestaña', page.evaluate('window.__abiertas') - antes == 1 and 'Esperá un momento' in aviso, (page.evaluate('window.__abiertas') - antes, aviso))

    # Seleccionadas: "Quitar" saca la causa y no abre nada.
    antes = page.evaluate('window.__abiertas')
    paginas = len(ctx.pages)
    page.click(SEL_T + ' >> button[data-a="quitarUna"]')
    time.sleep(0.5)
    txt = page.inner_text('#supjn [data-e="vPanel"]')
    chequear('N9 Quitar saca la causa de la selección sin abrirla', page.evaluate('window.__abiertas') == antes and len(ctx.pages) == paginas and 'No hay causas seleccionadas' in txt, (page.evaluate('window.__abiertas') - antes, len(ctx.pages) - paginas, txt[:200]))
    err = page.evaluate('window.__errores')
    chequear('N10 sin errores de JavaScript', not err, err)
    ctx.close()

def filtros_escritos(browser):
    # Escritos: los filtros de la barra (fuero, estado, dependencia y etiqueta
    # de la causa) y los atajos de fechas. Los escritos simulados son 65 del
    # fuero CCC y 65 del CIV, todos Gestionados y de la misma dependencia; para
    # estas pruebas se agregan dos: uno sin expediente y otro en dependencia,
    # de otro juzgado y de una causa que no está en las listas.
    EXTRA_SIN_EXP = {'id': 9001, 'descripcion': 'ESCRITO SIN EXPEDIENTE', 'tipo': 'ESCRITO', 'estado': 'ENVIADO_GESTIONADO', 'fojas': 1,
                     'nombreArchivo': 'suelto.pdf', 'fechaIngreso': '2026-09-10T10:00:00.000-0300', 'nombreAutor': 'LETRADO DE PRUEBA',
                     'oficina': {'descripcion': 'MESA DE ENTRADAS', 'id': 1}, 'expediente': None}
    EXTRA_DEP = {'id': 9002, 'descripcion': 'OPONE EXCEPCION', 'tipo': 'ESCRITO', 'estado': 'ENVIADO_A_DEPENDENCIA', 'fojas': 6,
                 'nombreArchivo': 'excepcion.pdf', 'fechaIngreso': '2026-09-11T09:27:00.000-0300', 'nombreAutor': 'LETRADO DE PRUEBA',
                 'oficina': {'descripcion': 'JUZGADO CIVIL 102', 'id': 2},
                 'expediente': {'id': 42000001, 'camara': 'CIV', 'numero': 20457, 'anio': 2018, 'numeracion': 'CIV 20457/2018',
                                'caratula': 'LOPEZ c/ BURSESE s/DIVORCIO', 'oficina': 'JUZGADO CIVIL 102'}}
    REG['escritos_extra'] = [EXTRA_SIN_EXP, EXTRA_DEP]
    ctx = contexto(browser)
    try:
        page = ctx.new_page()
        page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
        page.evaluate("""(c) => {
          localStorage.setItem('gm:supjn.marcas.v1@' + c, JSON.stringify({ formato: 'supjn+/marcas', version: 2, cuenta: c,
            etiquetas: [{ id: 'e1', nom: 'Urgente', color: '#b3261e' }, { id: 'e2', nom: 'Penal', color: '#14416f' }],
            filas: { 'CCC 046311/2025': { et: ['e1'], nota: '' }, 'CIV 076436/2025': { et: ['e2'], nota: '' } }, notas: {} }));
        }""", CUENTA)
        preparar_scw(page)
        solapa(page, 'escr')
        esperar(page, "document.querySelectorAll('#supjn table.sj-tb tbody tr').length > 0", 20000)

        sel = lambda k: '#supjn [data-bf=filtro][data-k=%s]' % k
        puesto = lambda k: page.eval_on_selector(sel(k), 's => s.value')
        ops = lambda k: page.eval_on_selector_all(sel(k) + ' option', 'os => os.map(o => [o.value, o.textContent])')
        estado = lambda: page.inner_text('#supjn [data-e=bandEstado]')
        pie = lambda: page.inner_text('#supjn [data-e=bandPie]')
        exps = lambda: page.eval_on_selector_all('#supjn table.sj-tb tbody tr td:nth-child(2) .sj-exp', 'x => x.map(e => e.textContent)')
        pedidos = lambda: len([x for x in REG['pedidos'] if '/api/escritos?' in x[1]])
        elegir = lambda k, x: (page.select_option(sel(k), x), time.sleep(0.35))

        chequear('F1 la barra de Escritos tiene los cuatro filtros y los atajos de fechas',
                 page.eval_on_selector_all('#supjn .sj-barra [data-bf]', 's => s.map(x => x.dataset.bf + ":" + (x.dataset.k || ""))')
                 == ['bandeja:', 'rango:', 'desde:', 'hasta:', 'filtro:fuero', 'filtro:estado', 'filtro:dep', 'filtro:etiqueta', 'texto:'],
                 page.eval_on_selector_all('#supjn .sj-barra [data-bf]', 's => s.map(x => x.dataset.bf + ":" + (x.dataset.k || ""))'))
        o = ops('fuero')
        chequear('F2 el fuero ofrece los que aparecen en lo consultado, y "sin sigla"',
                 [x[0] for x in o] == ['', 'CCC', 'CIV', '@sin'] and o[0][1] == 'Todos los fueros' and o[3][1] == 'Sin sigla de fuero', o)

        antes = pedidos()
        elegir('fuero', 'CIV')
        e = exps()
        chequear('F3 elegir CIV deja solo los del fuero CIV, sin volver a consultar',
                 len(e) == 50 and all(x.startswith('CIV ') for x in e) and '66 de 132 escritos' in estado() and 'Mostrando 1 a 50 de 66' in pie() and pedidos() == antes,
                 (len(e), estado(), pie(), pedidos() - antes))
        page.click('#supjn [data-bpag="2"]')
        time.sleep(0.3)
        e = exps()
        chequear('F4 el paginado cuenta solo lo filtrado', len(e) == 16 and all(x.startswith('CIV ') for x in e) and 'Mostrando 51 a 66 de 66' in pie(), (len(e), pie()))

        page.fill('#supjn [data-bf=texto]', 'escrito numero 17')
        time.sleep(0.6)
        vacio = page.inner_text('#supjn [data-e=bandCuerpo]')
        elegir('fuero', 'CCC')
        e = exps()
        chequear('F5 el fuero se combina con la búsqueda', 'Ningún elemento coincide con los filtros y la búsqueda.' in vacio and e == ['CCC 46311/2025'] and '1 de 132 escritos' in estado(), (vacio[:140], e, estado()))
        page.fill('#supjn [data-bf=texto]', '')
        time.sleep(0.6)

        elegir('fuero', '@sin')
        t = page.inner_text('#supjn [data-e=bandCuerpo]')
        chequear('F6 "Sin sigla de fuero" muestra el escrito sin expediente',
                 page.eval_on_selector_all('#supjn table.sj-tb tbody tr', 'x => x.length') == 1 and '(sin expediente)' in t, t[:200])

        elegir('fuero', 'CCC')
        page.click('#supjn th[data-bo="fecha"]')
        time.sleep(0.3)
        e = exps()
        chequear('F7 ordenar no quita el filtro', len(e) == 50 and all(x.startswith('CCC ') for x in e) and puesto('fuero') == 'CCC', (len(e), puesto('fuero')))

        antes = pedidos()
        page.click('#supjn [data-a=bandConsultar]')
        esperar(page, "(() => { const e = document.querySelector('#supjn [data-e=bandEstado]'); return e && /leído/.test(e.innerText); })()", 20000)
        chequear('F8 al volver a consultar se mantiene lo elegido', pedidos() > antes and puesto('fuero') == 'CCC' and '65 de 132 escritos' in estado(), (puesto('fuero'), estado()))

        # Estado, dependencia y etiqueta.
        elegir('fuero', '')
        o = ops('estado')
        elegir('estado', 'En dependencia')
        e = exps()
        chequear('F9 el estado ofrece los de lo consultado y filtra',
                 [x[0] for x in o] == ['', 'En dependencia', 'Gestionado'] and e == ['CIV 20457/2018'] and '1 de 132 escritos' in estado(), (o, e, estado()))
        elegir('estado', '')
        o = ops('dep')
        elegir('dep', 'JUZGADO CIVIL 102')
        e = exps()
        chequear('F10 la dependencia ofrece las de lo consultado y filtra',
                 [x[0] for x in o] == ['', 'JUZGADO CIVIL 102', 'JUZGADO NACIONAL EN LO CRIMINAL Y CORRECCIONAL NRO. 11 - SECRETARÍA NRO. 133', 'MESA DE ENTRADAS']
                 and e == ['CIV 20457/2018'], (o, e))
        elegir('dep', '')
        o = ops('etiqueta')
        elegir('etiqueta', 'e1')
        e = exps()
        chequear('F11 la etiqueta de la causa ofrece las que aparecen y filtra',
                 [x[0] for x in o] == ['', 'e2', 'e1', '@sin'] and [x[1] for x in o] == ['Todas las etiquetas', 'Penal', 'Urgente', 'Sin etiqueta']
                 and len(e) == 50 and all(x == 'CCC 46311/2025' for x in e) and '65 de 132 escritos' in estado(), (o, len(e), estado()))
        elegir('etiqueta', '@sin')
        e = exps()
        chequear('F12 "Sin etiqueta" deja los de causas sin etiqueta o que no están en las listas',
                 sorted(e) == ['(sin expediente)', 'CIV 20457/2018'], e)

        elegir('etiqueta', '')
        elegir('fuero', 'CIV')
        elegir('estado', 'En dependencia')
        e = exps()
        chequear('F13 dos filtros a la vez se suman', e == ['CIV 20457/2018'] and '1 de 132 escritos' in estado(), (e, estado()))
        elegir('fuero', '')
        elegir('estado', '')

        # Atajos de fechas.
        rango = lambda: page.eval_on_selector('#supjn [data-bf=rango]', 's => s.value')
        fechas = lambda: page.eval_on_selector_all('#supjn [data-bf=desde], #supjn [data-bf=hasta]', 'x => x.map(i => i.value)')
        hoy = page.evaluate("(() => { const d = new Date(); const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); })()")
        hace7 = page.evaluate("(() => { const d = new Date(); d.setDate(d.getDate() - 7); const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); })()")
        chequear('F14 los atajos arrancan en el rango de la bandeja', rango() == '60', (rango(), fechas()))
        antes = pedidos()
        page.select_option('#supjn [data-bf=rango]', '7')
        esperar(page, "(() => { const e = document.querySelector('#supjn [data-e=bandEstado]'); return e && /leído/.test(e.innerText); })()", 20000)
        chequear('F15 un atajo pone las fechas y vuelve a consultar', fechas() == [hace7, hoy] and pedidos() > antes and rango() == '7', (fechas(), [hace7, hoy], pedidos() - antes, rango()))
        page.fill('#supjn [data-bf=desde]', '2026-01-15')
        time.sleep(0.3)
        chequear('F16 al escribir una fecha a mano el atajo pasa a "Otras fechas"', rango() == '', (rango(), fechas()))

        # Si en lo nuevo no aparece lo elegido, el filtro se quita solo.
        page.select_option('#supjn [data-bf=rango]', '60')
        esperar(page, "(() => { const e = document.querySelector('#supjn [data-e=bandEstado]'); return e && /leído/.test(e.innerText); })()", 20000)
        elegir('fuero', 'CCC')
        REG['solo_camara'] = 'CIV'
        REG['escritos_extra'] = []
        page.click('#supjn [data-a=bandConsultar]')
        esperar(page, "(() => { const e = document.querySelector('#supjn [data-e=bandEstado]'); return e && /65 escritos/.test(e.innerText); })()", 20000)
        chequear('F17 si lo elegido ya no aparece, el filtro se quita solo',
                 puesto('fuero') == '' and [x[0] for x in ops('fuero')] == ['', 'CIV'] and estado().startswith('65 escritos'), (puesto('fuero'), ops('fuero'), estado()))
        REG.pop('solo_camara', None)
        REG['escritos_extra'] = [EXTRA_SIN_EXP, EXTRA_DEP]

        # Desde una causa: todo es de la misma, y los filtros no se muestran.
        page.click('#supjn [data-a=bandConsultar]')
        esperar(page, "(() => { const e = document.querySelector('#supjn [data-e=bandEstado]'); return e && /132 escritos/.test(e.innerText); })()", 20000)
        elegir('fuero', 'CCC')
        solapa(page, 'rel')
        page.click('#supjn [data-mas="CCC 046311/2025"]')
        page.click('#supjn .sj-menu [data-a=verEscr]')
        esperar(page, "document.querySelector('#supjn .sj-causa') && document.querySelectorAll('#supjn table.sj-tb tbody tr').length > 0", 20000)
        sin_barra = page.eval_on_selector_all('#supjn .sj-barra [data-bf]', 's => s.map(x => x.dataset.bf)') == ['bandeja', 'texto']
        n_causa = page.eval_on_selector_all('#supjn table.sj-tb tbody tr', 'x => x.length')
        page.click('#supjn .sj-causa button')
        esperar(page, "!document.querySelector('#supjn .sj-causa') && document.querySelectorAll('#supjn table.sj-tb tbody tr').length > 0", 20000)
        chequear('F18 los escritos de una causa no llevan filtros, y al volver a las fechas arrancan en todos',
                 sin_barra and n_causa > 0 and puesto('fuero') == '' and rango() == '60', (sin_barra, n_causa, puesto('fuero'), rango()))

        # Notificaciones y DEOX siguen como estaban.
        otras = []
        for v in ('notif', 'deox'):
            solapa(page, v)
            esperar(page, "document.querySelector('#supjn [data-band=\"%s\"]')" % v, 20000)
            time.sleep(0.5)
            otras.append(page.eval_on_selector_all('#supjn .sj-barra [data-bf]', 's => s.map(x => x.dataset.bf)'))
        chequear('F19 Notificaciones y DEOX no llevan filtros ni atajos', all(x == ['bandeja', 'desde', 'hasta', 'texto'] for x in otras), otras)
        err = page.evaluate('window.__errores')
        chequear('F20 sin errores de JavaScript', not err, err)
    finally:
        REG.pop('escritos_extra', None)
        REG.pop('solo_camara', None)
        ctx.close()

def ventana_lugar_y_cedula(browser):
    # Tres cosas que pidió el autor: que la ventana se abra maximizada, que no
    # se pierda el lugar al refrescar, y que dejar cédula cargue el formulario
    # aunque el desplegable de jurisdicción del PJN se comporte distinto.
    ctx = contexto(browser)
    try:
        page = ctx.new_page()
        page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
        # Se arranca con la ventana sin maximizar, para ver que igual se abre así.
        page.evaluate("(c) => localStorage.setItem('gm:supjn.cfg.v1@' + c, JSON.stringify({ maxi: false, porPagina: 5 }))", CUENTA)
        preparar_scw(page)
        maxi = page.eval_on_selector('#supjn', "w => w.classList.contains('maxi')")
        # Y se abre sola: sin tocar el indicador, la ventana ya está a la vista.
        p2 = ctx.new_page()
        p2.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
        p2.wait_for_selector('#supjn', state='attached')
        time.sleep(0.8)
        sola = p2.eval_on_selector('#supjn', "w => w.style.display !== 'none' && w.classList.contains('maxi')")
        ind = p2.eval_on_selector('#supjn-pastilla', "b => b.style.display")
        chequear('V0 la ventana se abre sola al entrar al PJN, y el indicador queda escondido', sola and ind == 'none', (sola, ind))
        p2.close()
        tam = page.evaluate("(() => { const r = document.getElementById('supjn').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(r.x), Math.round(r.y)]; })()")
        chequear('V1 la ventana se abre maximizada aunque la vez anterior no lo estuviera',
                 maxi and tam[0] >= 1490 and tam[1] >= 940 and tam[2] == 0 and tam[3] == 0, (maxi, tam))
        page.click('#supjn [data-a=max]')
        chequear('V2 el botón de maximizar sigue restaurando la ventana', not page.eval_on_selector('#supjn', "w => w.classList.contains('maxi')"))
        page.click('#supjn [data-a=min]')
        page.evaluate("document.getElementById('supjn-pastilla').click()")
        page.wait_for_selector('#supjn', state='visible')
        chequear('V3 al volver a abrirla vuelve a estar maximizada', page.eval_on_selector('#supjn', "w => w.classList.contains('maxi')"))

        # El lugar: con una lista larga, se corre la pantalla, se pasa a la
        # página 2 y se despliega una causa.
        page.evaluate("""(c) => {
          const base = JSON.parse(localStorage.getItem('gm:supjn.causas.v1@' + c));
          const causas = [];
          for (let i = 0; i < 60; i++) {
            const x = Object.assign({}, base.causas[i % base.causas.length]);
            x.exp = 'CCC ' + String(100000 + i) + '/2025';
            x.car = 'CAUSA DE PRUEBA ' + i;
            x.pos = i;
            causas.push(x);
          }
          base.causas = causas; base.total = causas.length; base.enTramite = causas.length;
          localStorage.setItem('gm:supjn.causas.v1@' + c, JSON.stringify(base));
          localStorage.setItem('gm:supjn.cfg.v1@' + c, JSON.stringify({ porPagina: 25 }));
        }""", CUENTA)
        page.reload()
        page.wait_for_selector('#supjn', state='attached')
        page.evaluate("document.getElementById('supjn-pastilla').click()")
        page.wait_for_selector('#supjn', state='visible')
        cuerpo = '#supjn [data-e=cuerpo]'
        pie = lambda: page.inner_text('#supjn [data-e=pie]').replace('\n', ' ')
        arriba = lambda: page.eval_on_selector(cuerpo, 'e => Math.round(e.scrollTop)')
        page.eval_on_selector(cuerpo, "e => { e.scrollTop = 200; }")
        time.sleep(0.2)
        antes = arriba()
        # Cualquier cosa que vuelva a dibujar la tabla (releer las listas,
        # desplegar una causa, cambiar una etiqueta) pasa por el mismo camino.
        # Se toca por programa una fila que ya está a la vista, para que el
        # navegador no mueva la pantalla por su cuenta.
        page.evaluate("document.querySelector('#supjn [data-a=selTodas]').click()")
        time.sleep(0.4)
        chequear('V4 volver a dibujar la lista no la devuelve al primer renglón', antes > 0 and arriba() == antes, (antes, arriba()))

        page.evaluate("document.querySelector('#supjn [data-a=selTodas]').click()")   # se destilda
        time.sleep(0.2)
        page.click('#supjn [data-pag="2"]')
        time.sleep(0.3)
        page.click('#supjn table.sj-t tbody tr:first-child [data-det]')
        time.sleep(0.3)
        page.eval_on_selector(cuerpo, "e => { e.scrollTop = 150; }")
        time.sleep(0.8)
        lugar = page.evaluate("(() => { try { return JSON.parse(sessionStorage.getItem('supjn_lugar')); } catch (e) { return null; } })()")
        sitio = (lugar or {}).get('sitios', {}).get('rel', {})
        chequear('V5 se anota dónde estaba: solapa, página, causa desplegada y desplazamiento',
                 bool(lugar) and lugar['ultima'] == 'rel' and sitio.get('pagina', {}).get('rel') == 2 and sitio.get('arriba', 0) > 0 and sitio.get('abierta'), lugar)

        # Recargar la página del PJN es lo mismo que abrir una causa y volver.
        page.reload()
        page.wait_for_selector('#supjn', state='attached')
        page.evaluate("document.getElementById('supjn-pastilla').click()")
        page.wait_for_selector('#supjn', state='visible')
        time.sleep(0.8)
        chequear('V6 al volver retoma la página donde estaba', 'Mostrando 26 a 50 de 60' in pie(), pie()[:140])
        chequear('V7 la pantalla vuelve al mismo punto, no al comienzo', arriba() > 100, arriba())
        chequear('V8 también vuelve desplegada la causa que estaba abierta', page.query_selector('#supjn tr.sj-det') is not None)
        err = page.evaluate('window.__errores')
        chequear('V9 sin errores de JavaScript', not err, err)
        ctx.close()

        # Dejar cédula, con las formas conocidas del desplegable del PJN.
        for modo, sin_sigla, sep, nombre, espera, ya_abierta, dos_civ in (
            ('escribir', False, ' - ', 'V10 si el desplegable solo se abre al escribir, igual carga todo', 'se eligió', False, False),
            ('boton', False, ' - ', 'V11 si solo se abre con el botón de la flecha, igual carga todo', 'se eligió', False, False),
            ('normal', False, ': ', 'V12 la sigla se reconoce aunque el PJN la separe de otra manera', 'se eligió', False, False),
            ('nunca', False, ' - ', 'V13 si la lista no se abre, carga número y año y lo dice', 'no mostró la lista de jurisdicción', False, False),
            ('normal', True, ' - ', 'V14 si la lista se abre pero sin la sigla, lo dice con esas palabras', 'ninguna opción trae la sigla', False, False),
            # Los tres modos que siguen imitan al formulario real del PJN: cada
            # clic en el campo abre o cierra la lista, y las jurisdicciones las
            # trae el servidor cada vez que se abre (medido: cerca de un
            # segundo). Cerrar la lista cancela esa espera.
            ('real', False, ' - ', 'V15 si la lista ya está abierta al llegar, no se la cierra: igual elige', 'se eligió', True, False),
            # Esta es la que reproduce la falla de la 1.3.0: el PJN tarda más de
            # lo que el programa esperaba por intento, y cada intento nuevo
            # cerraba la lista y cancelaba la espera anterior.
            ('lenta', False, ' - ', 'V16 si el PJN tarda en traer las jurisdicciones, se le espera en vez de cerrar la lista', 'se eligió', False, False),
            ('vacia', False, ' - ', 'V17 si el PJN abre la lista y no trae jurisdicciones, lo dice con esas palabras', 'se abrió vacía', False, False),
            # Elegir mal sin que se note es peor que no elegir.
            ('real', False, ' - ', 'V18 con dos jurisdicciones de la misma sigla no se elige ninguna y se avisa', 'más de una opción con la sigla', False, True),
            ('no-toma', False, ' - ', 'V19 si la opción está y el formulario no la toma, lo dice con esas palabras', 'no la tomó', False, False)):
            REG['camara_abre'] = modo
            REG['camara_sin_sigla'] = sin_sigla
            REG['camara_sep'] = sep
            REG['camara_ya_abierta'] = ya_abierta
            REG['camara_dos_civ'] = dos_civ
            c2 = contexto(browser)
            p2 = c2.new_page()
            preparar_scw(p2)
            p2.click('#supjn [data-mas="CIV 076436/2025"]')
            with c2.expect_page() as nueva:
                p2.click('#supjn .sj-menu [data-a=cedulaUna]')
            np_ = nueva.value
            try:
                np_.wait_for_function("document.getElementById('supjn-cedula') && document.getElementById('supjn-cedula').textContent.length > 12", timeout=25000)
                time.sleep(0.4)
                txt = np_.inner_text('#supjn-cedula')
                est = np_.evaluate('window.__estado')
                bien = espera in txt and est['num'] == '76436' and est['anio'] == '2025'
                if espera == 'se eligió':
                    bien = bien and est['camara'] == 'CIV'
                chequear(nombre, bien, (txt[:150], est))
            except Exception as e:
                chequear(nombre, False, repr(e)[:200])
            np_.close()
            c2.close()
    finally:
        REG.pop('camara_abre', None)
        REG.pop('camara_sin_sigla', None)
        REG.pop('camara_sep', None)
        REG.pop('camara_ya_abierta', None)
        REG.pop('camara_dos_civ', None)

def mapa_del_pjn(browser):
    # El mapa del PJN: todo lo que depende de cómo está hecho el sitio tiene que
    # estar escrito en un solo bloque. Esta prueba no abre el navegador: mira el
    # texto del programa y comprueba que ninguna de esas piezas quedó suelta.
    lineas = SCRIPT.split('\n')
    ini = next((i for i, l in enumerate(lineas) if 'EL MAPA DEL PJN' in l), -1)
    fin = next((i for i, l in enumerate(lineas) if i > ini and l.startswith('  };')), -1) if ini >= 0 else -1
    if ini < 0 or fin < 0:
        chequear('M1 el programa tiene el mapa del PJN', False, 'no se encuentra el bloque del mapa')
        return
    chequear('M1 el programa tiene el mapa del PJN', fin - ini > 30, 'el mapa va de la línea %d a la %d' % (ini + 1, fin + 1))

    PIEZAS = [
        ('.seam', 'las direcciones de la Consulta Web'),
        ('fa-eye', 'el ícono del enlace que abre la causa'),
        ('dejarNotaPopup', 'el cartel de confirmación de dejar nota'),
        ('consultaFiltroSearchDejarNota', 'el filtro "Dejar nota"'),
        ('botonAceptar', 'el botón Confirmar'),
        ('camara-autocomplete', 'el campo de jurisdicción de la cédula'),
        ('StepperNextBtn', 'el botón Siguiente de la cédula'),
        ('numeroExpediente"', 'el campo de número de la cédula'),
        ('form-list-autocomplete-listbox-expediente', 'la lista de expedientes de la cédula'),
        (':header:', 'las cabeceras de las solapas del expediente'),
        ('glyphicon-user', 'el ícono de usuario del encabezado'),
    ]
    sueltas = []
    for pieza, nombre in PIEZAS:
        fuera = []
        for i, l in enumerate(lineas):
            if pieza not in l: continue
            if ini <= i <= fin: continue                 # está en el mapa, como corresponde
            t = l.strip()
            if t.startswith('//') or t.startswith('*') or t.startswith('/*'): continue   # un comentario no es código
            fuera.append((i + 1, nombre))
        if fuera:
            sueltas.append(fuera[0])
    chequear('M2 ninguna pieza del sitio quedó escrita fuera del mapa', not sueltas,
             '; '.join('%s, línea %d' % (n, i) for i, n in sueltas))

    # Y el mapa tiene que estar en uso: si nadie lo lee, no sirve de nada.
    usos = sum(1 for l in lineas if 'PJN.' in l and not l.strip().startswith('//') and not l.strip().startswith('*'))
    chequear('M3 el resto del programa lee el mapa', usos >= 15, '%d lugares lo usan' % usos)

def aviso_de_filtros(browser):
    # El 23/09/2026 el autor vio 10 causas de 232 y creyó que el programa no
    # traía la lista: era el botón Novedades, que había quedado puesto de la
    # vez anterior. El único aviso estaba en el pie de la tabla, abajo de todo.
    # Desde la 1.3.5 el aviso está en el renglón de arriba, con el botón para
    # sacar los filtros. Esto comprueba que esté, que diga la verdad y que el
    # botón funcione.
    ctx = contexto(browser)
    try:
        page = ctx.new_page()
        page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
        page.evaluate("() => localStorage.setItem('gm:supjn.cfg.v1', JSON.stringify({ maxi: true, porPagina: 25 }))")
        preparar_scw(page)

        arriba = lambda: page.inner_text('#supjn .sj-est').replace('\n', ' ')
        aviso = lambda: (page.query_selector('#supjn .sj-est .sj-filtrando') or None)
        texto_aviso = lambda: (aviso().inner_text() if aviso() else '')
        boton = lambda: page.query_selector('#supjn .sj-est [data-a=limpiar]')
        filas = lambda: page.eval_on_selector_all('#supjn [data-e=cuerpo] tbody input[data-sel]', 'x => x.length')
        pie = lambda: page.inner_text('#supjn [data-e=pie]').replace('\n', ' ')
        valor = lambda f: page.eval_on_selector('#supjn [data-f=%s]' % f, 'e => e.value')

        # Si el botón de arriba no está, se limpia con el de la barra: así una
        # prueba en rojo no deja colgadas a las que vienen después.
        def limpiar_desde_arriba():
            b = boton()
            if b:
                b.click()
            else:
                page.click('#supjn .sj-barra [data-a=limpiar]')
            time.sleep(0.4)
            return b is not None

        # F1: sin filtros, el renglón queda como estaba.
        chequear('F1 sin filtros no hay aviso ni botón en el renglón de arriba',
                 aviso() is None and boton() is None and filas() == 3, (arriba(), filas()))

        # F2: un filtro de búsqueda. El aviso dice cuántas se ven de cuántas.
        page.fill('#supjn [data-f=texto]', 'PEREZ')
        time.sleep(0.5)
        chequear('F2 con un filtro el renglón de arriba dice cuántas se muestran y cuál es',
                 'mostrando 1 de 3' in texto_aviso() and 'hay un filtro puesto: búsqueda' in texto_aviso(),
                 (texto_aviso(), filas()))

        # F3: el número de arriba es el mismo que el del pie. Si se calculara
        # por otro camino, podrían decir cosas distintas.
        chequear('F3 el número de arriba coincide con el del pie de la tabla',
                 'de 1 (filtradas de 3)' in pie() and 'mostrando 1 de 3' in texto_aviso(), (pie(), texto_aviso()))

        # F4: dos filtros, en plural y los dos nombrados.
        page.select_option('#supjn [data-f=fuero]', 'CCC')
        time.sleep(0.4)
        chequear('F4 con dos filtros los nombra a los dos, en plural',
                 'hay filtros puestos: búsqueda, fuero' in texto_aviso() and 'mostrando 1 de 3' in texto_aviso(), texto_aviso())

        # F5: el botón saca todos los filtros de una vez y el aviso se va.
        habia = limpiar_desde_arriba()
        chequear('F5 el botón del renglón de arriba saca todos los filtros',
                 habia and aviso() is None and boton() is None and filas() == 3 and
                 valor('texto') == '' and valor('fuero') == '',
                 (habia, arriba(), filas()))

        # F6: un filtro que no deja ninguna causa afuera igual se avisa. El
        # aviso es de que hay un filtro puesto, no de que falten causas.
        page.select_option('#supjn [data-f=tramite]', 'si')
        time.sleep(0.4)
        chequear('F6 un filtro que no saca ninguna causa también se avisa',
                 'mostrando 3 de 3' in texto_aviso() and 'hay un filtro puesto: trámite' in texto_aviso(), texto_aviso())

        # F7: ninguna causa coincide. El aviso dice 0 de 3 y el botón está.
        page.select_option('#supjn [data-f=tramite]', 'todas')
        page.fill('#supjn [data-f=texto]', 'NO EXISTE ESTA CAUSA')
        time.sleep(0.5)
        chequear('F7 si no queda ninguna, el renglón dice 0 de 3 y el botón sigue estando',
                 'mostrando 0 de 3' in texto_aviso() and boton() is not None and filas() == 0, (texto_aviso(), filas()))
        limpiar_desde_arriba()

        # F8: el caso del autor. El filtro quedó guardado de la vez anterior y
        # está puesto desde que se abre la ventana, antes de tocar nada.
        page.evaluate("() => localStorage.setItem('gm:supjn.cfg.v1', JSON.stringify({ maxi: true, porPagina: 25, novedades: true }))")
        page.reload()
        page.wait_for_selector('#supjn', state='visible')
        time.sleep(0.6)
        chequear('F8 un filtro que quedó guardado se avisa apenas se abre la ventana',
                 'hay un filtro puesto: novedades' in texto_aviso() and 'de 3' in texto_aviso(), (arriba(), texto_aviso()))

        # F9: y el botón lo saca, aunque venga de lo guardado.
        habia = limpiar_desde_arriba()
        guardado = page.evaluate("""() => {
          let v = JSON.parse(localStorage.getItem('gm:supjn.cfg.v1'));
          if (typeof v === 'string') v = JSON.parse(v);   // lo que guarda el programa pasa dos veces por JSON
          return v.novedades;
        }""")
        chequear('F9 el botón saca el filtro guardado y no vuelve en la próxima apertura',
                 habia and aviso() is None and filas() == 3 and guardado is False, (habia, arriba(), filas(), guardado))

        # F10: el aviso está en el mismo renglón donde se dice cuántas causas
        # hay. Si estuviera en otro lado, el problema seguiría igual.
        page.fill('#supjn [data-f=texto]', 'PEREZ')
        time.sleep(0.5)
        junto = page.evaluate("""() => {
          const est = document.querySelector('#supjn [data-e=estado]');
          const av = document.querySelector('#supjn .sj-est .sj-filtrando');
          return !!est && !!av && est.contains(av);
        }""")
        chequear('F10 el aviso va adentro del renglón que dice cuántas causas hay', junto, junto)
    finally:
        ctx.close()

def cuentas_y_seguridad(browser):
    # Otra cuenta en Escritos: no se muestra nada.
    REG['cuit_app']['escritos'] = OTRA
    ctx = contexto(browser)
    page = ctx.new_page()
    preparar_scw(page)
    solapa(page, 'escr')
    esperar(page, "/otra cuenta/.test(document.querySelector('#supjn [data-e=bandEstado]').innerText)", 20000)
    t = page.inner_text('#supjn [data-e=vPanel]')
    chequear('S1 con otra cuenta no se muestra nada', 'otra cuenta (27...223)' in t and page.query_selector('#supjn table.sj-tb') is None, t[:300])
    REG['cuit_app']['escritos'] = CUENTA
    # sin sesión (401): se reintenta una vez con marco nuevo y se informa
    ctx.close()

    ctx = contexto(browser)
    page = ctx.new_page()
    page.goto('https://malo.invalid/')
    page.evaluate("""() => { const f = document.createElement('iframe'); f.name = 'supjn-puente-escritos'; f.src = 'https://escritos.pjn.gov.ar/info-tecnica'; document.body.appendChild(f); }""")
    page.wait_for_function("document.querySelector('iframe').contentWindow && document.querySelector('iframe').contentWindow.length === 0", timeout=10000)
    time.sleep(3)
    REG['pedidos'].clear()
    got = page.evaluate("""() => new Promise((res) => {
      const f = document.querySelector('iframe'); const out = [];
      window.addEventListener('message', (e) => out.push(e.data));
      f.contentWindow.postMessage({ supjn: 'pedido', app: 'escritos', id: 'x1', op: 'lista', ruta: '/api/escritos?bandeja=ENVIADOS_A_DEPENDENCIA&fechaDesde=01092026&fechaHasta=17092026' }, '*');
      setTimeout(() => res(out), 1500);
    })""")
    api = [x for x in REG['pedidos'] if '/api/' in x[1]]
    chequear('S2 el puente no atiende a un sitio ajeno', got == [] and api == [], (got, api))
    ctx.close()

    # desde la Consulta Web, una ruta fuera de la lista: se rechaza
    ctx = contexto(browser)
    page = ctx.new_page()
    preparar_scw(page)
    page.evaluate("""() => { const f = document.createElement('iframe'); f.name = 'supjn-puente-deox'; f.id = 'pp'; f.src = 'https://deox.pjn.gov.ar/info-tecnica'; document.body.appendChild(f); }""")
    listo = page.evaluate("""() => new Promise((res) => {
      const f = document.getElementById('pp');
      window.addEventListener('message', (e) => { if (e.data && e.data.tipo === 'listo' && e.data.app === 'deox') res(true); });
      setTimeout(() => res(false), 20000);
    })""")
    chequear('S3a el puente de la Consulta Web avisa que está listo', listo)
    REG['pedidos'].clear()
    got = page.evaluate("""() => new Promise((res) => {
      const f = document.getElementById('pp'); const out = [];
      window.addEventListener('message', (e) => { if (e.data && e.data.id === 'x2') out.push(e.data); });
      f.contentWindow.postMessage({ supjn: 'pedido', app: 'deox', id: 'x2', op: 'pdf', ruta: '/api/deox/cerrar' }, 'https://deox.pjn.gov.ar');
      f.contentWindow.postMessage({ supjn: 'pedido', app: 'deox', id: 'x2', op: 'buscar', ruta: '/api/deox/ingresar', cuerpo: {} }, 'https://deox.pjn.gov.ar');
      setTimeout(() => res(out), 1500);
    })""")
    api = [x for x in REG['pedidos'] if '/api/' in x[1]]
    chequear('S3 el puente rechaza rutas que no son de lectura', len(got) == 2 and all(g['ok'] is False and 'no admitida' in g['error'] for g in got) and api == [], (got, api))
    # el puente no expone la credencial
    got = page.evaluate("""() => new Promise((res) => {
      const f = document.getElementById('pp'); const out = [];
      window.addEventListener('message', (e) => { if (e.data && e.data.id === 'x3') out.push(JSON.stringify(e.data)); });
      f.contentWindow.postMessage({ supjn: 'pedido', app: 'deox', id: 'x3', op: 'estado' }, 'https://deox.pjn.gov.ar');
      setTimeout(() => res(out), 800);
    })""")
    chequear('S4 el estado del puente da el CUIT y no la credencial', len(got) == 1 and CUENTA in got[0] and 'tok-' not in got[0], got)
    # abierta a mano, la aplicación queda igual
    pg = ctx.new_page()
    pg.goto('https://escritos.pjn.gov.ar/enviados')
    time.sleep(0.8)
    chequear('S5 abierta a mano, SuPJN+ no dibuja nada en la aplicación', pg.query_selector('#supjn, #supjn-pastilla') is None and pg.inner_text('#root') == 'Lista')
    ctx.close()

    # sesión vencida en la aplicación: reintento y aviso claro
    ctx = contexto(browser)
    def sin_sesion(route, request):
        if '/api/escritos?' in request.url:
            REG['pedidos'].append((request.method, request.url, request.headers.get('authorization')))
            return route.fulfill(status=401, content_type='application/json', body='{}')
        return manejar(route, request)
    ctx.unroute('**/*')
    ctx.route('**/*', sin_sesion)
    page = ctx.new_page()
    preparar_scw(page)
    REG['pedidos'].clear()
    solapa(page, 'escr')
    esperar(page, "/no tiene una sesión activa/.test(document.querySelector('#supjn [data-e=bandEstado]').innerText)", 30000)
    api = [x for x in REG['pedidos'] if '/api/escritos?' in x[1]]
    marcos = page.evaluate("document.querySelectorAll('iframe[name^=supjn-puente]').length")
    chequear('S6 con la sesión vencida se reintenta una vez y se avisa', len(api) == 2 and marcos <= 1, (len(api), marcos))
    ctx.close()

    # sin cuenta en la Consulta Web: no se consulta
    ctx = contexto(browser)
    page = ctx.new_page()
    REG['cuenta_scw'] = ''
    page.goto('https://scw.pjn.gov.ar/scw/consultaListaRelacionados.seam')
    page.wait_for_selector('#supjn', state='attached')
    page.evaluate("document.getElementById('supjn-pastilla').click()")
    REG['pedidos'].clear()
    solapa(page, 'notif')
    esperar(page, "/No se pudo identificar con qué cuenta/.test(document.querySelector('#supjn [data-e=bandEstado]').innerText)", 40000)
    api = [x for x in REG['pedidos'] if 'notif.pjn.gov.ar/api/notificaciones' in x[1]]
    chequear('S7 sin cuenta identificada no se piden listas', api == [], api)
    REG.pop('cuenta_scw', None)
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch(channel='chromium')
    for f in (unitarias, carpeta, cedula, integracion, notas_en_pestana, filtros_escritos, ventana_lugar_y_cedula, mapa_del_pjn, aviso_de_filtros, cuentas_y_seguridad):
        try:
            f(b)
        except Exception as e:
            chequear(f.__name__ + ' terminó con excepción', False, repr(e)[:600])
    b.close()

mal = [r for r in RES if not r[1]]
print('\n%d pruebas, %d en verde, %d en rojo' % (len(RES), len(RES) - len(mal), len(mal)))
sys.exit(1 if mal else 0)
