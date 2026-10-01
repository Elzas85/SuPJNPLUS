# SuPJN+: cambios pendientes

Registro de los cambios solicitados por el autor que todavía no se
implementaron. Cada pedido se anota al recibirlo, con su fecha y en los
términos en que fue formulado; al implementarse, pasa a la sección
"Implementados" con la versión que lo incorpora y la remisión a su bitácora.

Versión vigente al abrir el registro: 1.6.3 (1 de octubre de 2026). Versión vigente: 1.7.0 (1 de octubre de 2026).

## Pendientes

| N° | Fecha | Pedido | Estado |
|----|-------|--------|--------|
| 5 | 01/10/2026 | Causas penales de las que el letrado fue apartado (sin cambios en la 1.7.0; ver la bitácora de esa versión, apartado 6): según el autor, "cuando me apartan de una causa penal, la causa se sigue viendo". Revisión del código (versión 1.6.3, apartados 3.3 y 7.1): cada lectura de Mis causas y de Favoritos reemplaza por completo la lista guardada con lo que devuelve el PJN, en trámite y fuera de trámite; no se conservan causas de lecturas anteriores. Las únicas excepciones son una lectura con error, que deja la lista previa, y una lista que se achica en cinco causas o más y más de un 10 %, que se toma recién en la segunda lectura; ninguna de las dos alcanza a una causa aislada. Hipótesis no verificada: el PJN sigue devolviendo la causa en Relacionados (posiblemente como fuera de trámite) o en Favoritos. Pendiente identificar la causa y comprobar, en solo lectura, si figura en la lista del PJN. | Pendiente |

## A verificar en el uso real

- Versión 1.5.3, causa CCC 025531/2024: comprobar que, después de la primera
  apertura, la lectura de actuaciones se detiene antes de la página que el PJN
  no contesta y que la causa ya no queda trabada (bitácora 1.5.3, apartado 5).

## Implementados

| N° | Pedido | Versión | Bitácora |
|----|--------|---------|----------|
| 1 | Vista del expediente en pestañas (Actuaciones; Notas; Intervinientes; Causas Vinculadas y Recursos; Etiquetas y Anotaciones). | 1.7.0 | bitacora-2026-10-01-1.7.0.md |
| 2 | Etiquetas y anotaciones propias de cada actuación. | 1.7.0 | bitacora-2026-10-01-1.7.0.md |
| 3 | Causas vinculadas y recursos en una misma pestaña. | 1.7.0 | bitacora-2026-10-01-1.7.0.md |
| 4 | Pestaña Notas (notas dejadas en el sistema del PJN) separada de Etiquetas y Anotaciones; rótulos confirmados. | 1.7.0 | bitacora-2026-10-01-1.7.0.md |
| 6 | Nuevo DEOX desde el listado de causas, con la causa cargada en el formulario del PJN. | 1.7.0 | bitacora-2026-10-01-1.7.0.md |
| 7 | Botón de Google Maps de la Guía: pequeño, sin texto, junto a la dirección (alternativa A). | 1.7.0 | bitacora-2026-10-01-1.7.0.md |
| 8 | Fechas en placas de color según su antigüedad. | 1.7.0 | bitacora-2026-10-01-1.7.0.md |

## Texto original de los pedidos implementados en la 1.7.0

- N° 1: Vista del expediente: organizar en pestañas lo que hoy son secciones. Pestañas pedidas, en este orden: Actuaciones; Notas (ficha de las notas dejadas en la causa); Intervinientes; Causas vinculadas; Recursos; y una última pestaña, "etiquetas y notas". El pedido se formuló sobre la sección Actuaciones ("139 actuaciones con PDF y 70 movimientos sin documento"). Aclarado por el autor (01/10/2026): la pestaña Notas es la de las notas dejadas en el sistema del PJN, y la última pestaña es de etiquetas y anotaciones (ver N° 4).
- N° 2: Tabla de actuaciones del expediente (columnas Fecha, Tipo, Descripción/detalle, Fs.): agregar "notas y etiquetas" a cada actuación. Por la aclaración del N° 4, se entiende como etiquetas y anotaciones propias de cada actuación.
- N° 3: Vista del expediente: "causas vinculadas y recursos juntos". Modifica el N° 1: Causas vinculadas y Recursos van en una misma pestaña, en lugar de dos.
- N° 4: Aclaración del autor sobre el N° 1: "nota dejada es la nota del sistema, etiquetas y anotaciones es otra". Son dos pestañas distintas: Notas (notas dejadas en el sistema del PJN) y Etiquetas y anotaciones. Pestañas resultantes, con el N° 3: Actuaciones; Notas; Intervinientes; Causas vinculadas y Recursos; Etiquetas y anotaciones. Rótulos confirmados por el autor (01/10/2026), con estas mayúsculas: "Notas" (las notas dejadas en la causa), "Intervinientes", "Causas Vinculadas y Recursos" y, al final, "Etiquetas y Anotaciones"; la primera pestaña sigue siendo Actuaciones.
- N° 6: Listado de causas: agregar "presentar DEOX desde el listado de causas". Estado actual (versión 1.6.3): DEOX solo se consulta, en general o por causa; no existe una acción para iniciar un DEOX nuevo desde una causa. Conforme al criterio fijado el 17/09/2026 para las funciones del PJN que escriben, se entiende como abrir el formulario de DEOX del PJN con la causa ya cargada, del mismo modo que Dejar cédula, quedando el envío en el formulario del PJN. Pendiente relevar en solo lectura el formulario de alta de DEOX.
- N° 7: Guía judicial: "el mapita en la guía", "para ir a Google Maps". Estado actual (versión 1.6.3): desde la 1.6.2 la ficha de cada dependencia de la Guía, y la de cada fiscalía y defensoría, tiene un botón "📍 Mapa ↗" que abre la dirección en Google Maps en una pestaña nueva; no se muestra cuando la ficha carece de domicilio. Se presentaron tres alternativas (A: botón pequeño solo con ícono junto a la dirección; B: miniatura fija del plano; C: mapa de Google incrustado). Decisión del autor (01/10/2026): alternativa A. El botón "📍 Mapa ↗" se reemplaza por un botón pequeño, sin texto, con el pin rojo y la flecha de enlace externo, ubicado inmediatamente después de la dirección, con la leyenda "Ver en Google Maps" al pasar el cursor; conserva el mismo enlace y la apertura en pestaña nueva. Alcance: fichas de dependencias de la Guía y fichas de fiscalías y defensorías.
- N° 8: Fechas en placas de color según su antigüedad: verde la del día, azul hasta siete días, naranja las más viejas, letra blanca, dos puntos más grande, en el listado de causas y dentro de la causa. El autor pidió que sea un criterio común de todos los proyectos de Lex+ (anotado también en SADE+, EJE+ y MEV Ultra).
