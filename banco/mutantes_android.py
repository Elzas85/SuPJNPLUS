# -*- coding: utf-8 -*-
"""Comprobacion de que el banco de Android sirve.

Rompe a proposito un resguardo por vez y corre banco_android.py. Si el banco
sigue en verde con el resguardo roto, la prueba no estaba probando nada.
"""
import os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SCRIPT = RAIZ.parent / 'supjn-plus.user.js'
ASSETS = RAIZ.parent / 'android' / 'assets'

# (nombre, archivo, texto viejo, texto nuevo, pruebas que tendrian que fallar)
MUTANTES = [
    ('sin comparar cuentas', 'script',
     "    if (P.cuit !== CUENTA) throw new Error('otra cuenta:' + P.cuit);",
     "    if (false) throw new Error('otra cuenta:' + P.cuit);",
     ['A14']),
    ('sin la lista cerrada de rutas', 'script',
     "      if (!(R.json && R.json.test(p.ruta))) throw new Error('consulta no admitida');",
     "      if (false) throw new Error('consulta no admitida');",
     ['A13']),
    ('el PDF no viaja entero', 'movil',
     "      res.b64 = aBase64(m.res.buf);",
     "      res.b64 = '';",
     ['A9']),
    ('los enlaces de afuera no salen', 'movil',
     "      if (/^https?:\\/\\/([a-z0-9-]+\\.)*pjn\\.gov\\.ar(\\/|$|:)/i.test(abs)) A.irA(abs);\n      else A.abrirFuera(abs);",
     "      A.irA(abs);",
     ['A11']),
    ('la tabla no pasa a fichas', 'movil',
     "        if (n) td.setAttribute('data-col', n); else td.removeAttribute('data-col');",
     "        td.removeAttribute('data-col');",
     ['A3']),
    ('la revision avisa de causas que no se movieron', 'script',
     "        if (!esNovedad(c, D.fecha)) return;",
     "        if (false) return;",
     ['A24b']),
    ('se bloquea el zoom con los dedos', 'movil',
     "    m.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');",
     "    m.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no');",
     ['A17']),
    ('la pagina sigue dibujando su propia barra', 'script',
     "    try { document.documentElement.className += ' supjn-cascara'; } catch (e) { /* sin html */ }",
     "    try { void 0; } catch (e) { /* sin html */ }",
     ['A16']),
    ('SuPJN+ no le cuenta a la barra que cambio', 'movil',
     "    estado: function (t) { try { if (A.estado) A.estado(String(t)); } catch (e) { /* sin barra */ } }",
     "    estado: function (t) { void t; }",
     ['A21']),
    ('la aplicacion consulta el PJN al abrir', 'script',
     "    if (PANTALLA_APP) {\n      if (!hayFoto() && (DATOS.rel || DATOS.fav)) fotoVisto();\n      return;\n    }",
     "    if (false) {\n      if (!hayFoto() && (DATOS.rel || DATOS.fav)) fotoVisto();\n      return;\n    }",
     ['A29']),
    ('la pantalla propia se queda sin cuenta', 'script',
     "    if (PANTALLA_APP) {\n      const g = leerAlmacen(K_CUENTA_APP, null);",
     "    if (false) {\n      const g = leerAlmacen(K_CUENTA_APP, null);",
     ['A27']),
]


def correr(nombre, cual, viejo, nuevo, esperadas):
    tmp = Path(tempfile.mkdtemp(prefix='mut-'))
    try:
        shutil.copytree(ASSETS, tmp / 'assets')
        script = tmp / 'supjn.user.js'
        shutil.copy(SCRIPT, script)
        destino = script if cual == 'script' else (tmp / 'assets' / 'movil.js')
        s = destino.read_text(encoding='utf-8')
        if s.count(viejo) != 1:
            print('MAL  %-34s el texto a romper aparece %d veces' % (nombre, s.count(viejo)))
            return False
        destino.write_text(s.replace(viejo, nuevo, 1), encoding='utf-8')
        if cual == 'movil':
            # El banco de Android usa estos assets; el script sigue siendo el bueno.
            shutil.copy(SCRIPT, script)
        env = dict(os.environ, SUPJN_SCRIPT=str(script), SUPJN_ASSETS=str(tmp / 'assets'))
        r = subprocess.run([sys.executable, str(RAIZ / 'banco_android.py')],
                           capture_output=True, text=True, env=env, timeout=1200)
        fallaron = set(re.findall(r'^MAL  (A\d+b?)', r.stdout, re.M))
        faltan = [e for e in esperadas if e not in fallaron]
        ok = not faltan
        print('%s %-34s fallaron: %s' % ('OK  ' if ok else 'MAL ', nombre,
                                         ', '.join(sorted(fallaron)) or 'ninguna'))
        if not ok:
            print('       se esperaba que fallaran: ' + ', '.join(esperadas))
        return ok
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


todo = True
for m in MUTANTES:
    todo = correr(*m) and todo
print('\n%s' % ('todos los resguardos quedaron probados' if todo
                else 'HAY RESGUARDOS SIN PROBAR'))
sys.exit(0 if todo else 1)
