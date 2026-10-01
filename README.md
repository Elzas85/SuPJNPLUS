# SuPJN+

Script de usuario (userscript) para **Tampermonkey** que reúne, en **una sola
ventana**, la
[Consulta Web del Poder Judicial de la Nación (PJN)](https://scw.pjn.gov.ar/).

Incorpora la totalidad de **PJN+** y de **NOTATOMIC**, y agrega, en la misma
interfaz, las causas propias, los favoritos, la función de dejar nota, los
escritos presentados, las notificaciones electrónicas, los DEOX, la Guía judicial,
las fiscalías y las defensorías, la búsqueda de causas en la consulta pública del
PJN en varios fueros a la vez, la exportación a Excel y a CSV, y el acceso a las
demás aplicaciones del PJN.

## Qué hace

La aplicación presenta una ventana que **se abre automáticamente al ingresar al
PJN**, **ocupando toda la pantalla**, y que entretanto **lee las causas por sí
sola**, en segundo plano. Con el botón de maximizar se la puede restaurar a su
tamaño anterior, y la próxima vez que se abra vuelve a ocuparla entera.
Minimizada, queda como indicador **SuPJN+** en el extremo inferior derecho.
La ventana se puede **desplazar** arrastrando la barra azul, **redimensionar**
desde la esquina inferior derecha, **acercar o alejar** con los botones − 100% +
de la barra azul, y **minimizar, maximizar o cerrar**. Si ocurre algún evento
mientras está minimizada, el indicador cambia a color **rojo** y señala que hay
un aviso.

**Retoma la posición anterior.** El PJN recarga la página entera cada vez que se
abre una causa, se deja una nota o se pulsa Recargar. SuPJN+ registra la solapa,
la página, la causa desplegada y la posición de desplazamiento de la pantalla, y
al volver retoma ese punto en lugar de comenzar desde el principio. Lo registrado
corresponde a esa pestaña, se conserva durante una hora y no sale de la
computadora. Desde la versión 1.5.4, al volver de una causa abierta desde
**Favoritos** se retoma Favoritos, en el mismo punto, y no Mis causas.

**Un solo lenguaje de color (desde 1.4.0).** Los estados se presentan como
placas de color pleno con texto blanco, como las utiliza el PJN en Escritos, y
cada color significa siempre lo mismo en toda la ventana: verde, resuelto o en
curso normal (Gestionado, Respondido, Incorporado, EN LETRA, nota dejada);
índigo, en poder de la dependencia; azul, enviado; ámbar, pendiente o a
verificar (Pendiente, A DESPACHO, nota a verificar); rojo, fallido o
paralizado; gris, archivado o cerrado; violeta, en instancia superior. Las
solapas y los botones principales llevan un ícono antes del texto (el de
Acerca de, desde 1.4.6, dibujado en lugar de tomado de la fuente, porque en
Windows el símbolo se veía cortado), y las
solapas Mis causas y Dejar nota muestran, en verde y en ámbar respectivamente,
cuántas causas tienen novedades y cuántas notas quedaron a verificar, de modo
que lo que requiere atención se vea sin buscarlo. Por decisión del autor
(27/09/2026), la disposición de la interfaz no se modificó: solo el color y los
íconos.

**Menú de solapas más visible (desde 1.4.1).** Por decisión del autor
(28/09/2026), la fila de solapas se presenta algo más grande que el resto de la
ventana, sobre una franja de fondo gris azulado; la solapa activa se dibuja
como una pestaña blanca, unida al contenido, con una línea azul en su borde
inferior. Los íconos y las cuentas conservan su lugar; ningún rótulo cambia.

**Letra de tipo en las actuaciones (desde 1.4.1).** En la lista de
actuaciones de una causa (la que se abre con **Elegir actuaciones** y la que
utiliza Descargas), cada tipo lleva antes del texto un cuadrado de color con
una letra, con el reparto elegido por el autor el 28/09/2026: **D** en azul,
despacho; **E** en verde, escrito; **C** en rojo, cédula (plazo en curso);
**O** en violeta, oficio electrónico (DEO y DEOX); **S** en ámbar, sentencia o
resolución. Cualquier otro tipo lleva su inicial en gris. El texto del tipo se
mantiene junto al cuadrado, el filtro por texto sigue actuando sobre ese
texto, y al detener el puntero sobre el cuadrado se muestra su significado.
Este cuadrado solo puede mostrarse allí: la lista de causas del PJN publica
únicamente la fecha de la última actuación, no su tipo.

**Fechas en placas de color (desde 1.7.0).** A pedido del autor (01/10/2026),
cada fecha se presenta en una placa de color según su antigüedad, para que se
lea antes que el resto de la fila: **verde**, la del día; **azul**, de uno a
siete días atrás; **naranja**, las más viejas. En los tres casos la letra es
blanca, en negrita y de ancho fijo, dos puntos más grande que la de la tabla.
Se aplica a la última actuación de Mis causas, Favoritos y la consulta pública,
a la fecha de las actuaciones y de las notas de cada causa, y a la fecha de
Escritos, Notificaciones y DEOX (en estas tres, la hora queda al lado de la
placa). El texto de la fecha no cambia, de modo que la búsqueda, los filtros,
el orden y las exportaciones funcionan igual. Es un criterio común de los
proyectos de Lex+.

### Mis causas y Favoritos

- Lee **las dos listas** del PJN (Relacionados y Favoritos), **en trámite y
  fuera de trámite**, en segundo plano y sin alterar la página que se está
  consultando.
- **Controla cada lectura (desde 1.4.3).** El PJN informa, debajo de la lista,
  cuántos expedientes contiene (*"Se han encontrado un total de 174
  expediente(s)"*). SuPJN+ compara ese número con las filas efectivamente
  leídas, tanto en trámite como con "Ver todos los expedientes". Si no
  coinciden, vuelve a pedir la lista desde el principio; si en el segundo
  intento tampoco coinciden, **no guarda la lectura**, conserva la anterior y lo
  advierte en rojo. Además, si una lista llega de golpe mucho más corta que la
  anterior (por ejemplo, 20 causas donde había 233), no se toma a la primera: se
  conserva la anterior, se advierte en rojo y la lista corta se acepta recién
  cuando otra lectura seguida trae exactamente las mismas causas.
- Presenta una sola tabla con **búsqueda** sobre todos los campos y **filtros**
  por fuero, situación, trámite, etiqueta y rango de fechas de la última
  actuación.
- **Los filtros aplicados se indican en la parte superior.** En el mismo renglón
  que informa la cantidad de causas aparece, en ámbar, *"mostrando 10 de 232 · hay
  un filtro puesto: novedades"*, con el botón **Quitar los filtros** al lado. Los
  filtros quedan guardados de una sesión a la otra, de modo que la lista puede
  abrirse ya filtrada; el aviso tiene por objeto que esa situación no se confunda
  con una lista incompleta.
- **Ordena** por cualquier columna. Las **columnas se reubican** arrastrando el
  título, se **ensanchan** arrastrando el borde y se **ocultan**.
- **Orden PJN** las muestra en la misma secuencia que el sitio: al leer, SuPJN+
  solicita la lista con **"Ordenar Lista Por: FECHA"**, del mismo modo en que se
  procede manualmente.
- **Orden cronológico** ordena por última actuación. El PJN no publica la hora en
  ninguna pantalla, pero las resoluciones y los escritos van firmados y la firma
  la contiene: con **Averiguar la hora**, SuPJN+ descarga el último documento con
  PDF de las causas que empatan en la fecha, lee la hora de la firma y la muestra
  junto a la fecha. Procesa bloques de cinco causas, con un máximo de quince por
  vez, y la operación puede cancelarse. La hora **desempata únicamente cuando se
  conoce la de todas las causas de ese día**: si se conocieran algunas y otras
  no, las conocidas se agruparían en bloque y el resultado sería peor que el
  orden del PJN, de modo que en ese caso se conserva el del sitio.
- La tabla **siempre se ajusta al ancho de la ventana**: el espacio que gana una
  columna lo pierden las otras. El ajuste se desactiva desde **Columnas ▾**.
- **Novedades:** el PJN no emite aviso alguno, de modo que SuPJN+ registra el
  estado de cada causa en la última consulta y marca con **nuevo** las que
  cambiaron de fecha de última actuación o de situación. El sitio solo publica el
  día, por lo que dos movimientos de la misma fecha no se distinguen. El botón
  **Novedades** deja a la vista únicamente esas causas. Una causa deja de estar
  marcada al abrirla, o mediante **Marcar todo como visto**. La primera lectura
  constituye la línea de partida: en ella no hay novedades.
- **Etiquetas** con color y **anotaciones** propias sobre cada causa. Las
  anotaciones son privadas y de trabajo, y no se escriben en el expediente: no
  guardan relación con dejar nota.
- Una columna **Partes** con el rol al frente: "Actora: A · Demandada: B". Cuando
  la carátula no contiene "C/", indica **Causante** en las sucesiones e
  **Imputado** en el fuero penal. El dato se obtiene de la carátula del PJN, que
  es lo único que la lista provee.
- Una columna **Nota** con el resultado de la última vez que se dejó nota en cada
  causa, como placa de color: verde si fue dejada, ámbar si quedó a verificar,
  rojo si no salió (desde 1.4.0).
- La columna **Situación** muestra la situación que informa el PJN como placa de
  color según su palabra clave: EN LETRA en verde, A DESPACHO en ámbar,
  ARCHIVADO en gris, PARALIZADA en rojo, en Cámara en violeta, y las restantes
  en azul (desde 1.4.0).
- **Apertura de una causa (desde 1.5.2).** **Abrir** muestra el expediente en
  esta pestaña (con Ctrl, en una nueva) y **↗** lo abre en una pestaña nueva. Si
  el PJN no contesta el pedido dentro de un minuto, SuPJN+ lo informa y la
  apertura siguiente puede hacerse sin recargar la página. Cuando la causa se
  abre en esta pestaña mientras se leen las listas, la lectura se detiene,
  porque se perdería igualmente al cambiar de página; si la causa no llega a
  abrirse, la lectura se retoma.

### Dejar nota

- Tiene **solapa propia**, entre Favoritos y Descargas.
- Se aplica en **todas** las causas que el PJN habilite ese día, o solo en las
  **seleccionadas** en Mis causas o en Favoritos.
- Desde el menú ⋯ de una causa, **Dejar nota en esta causa** lleva a la solapa
  con esa causa a la vista y un botón propio para dejarle la nota; debajo
  siguen las dos opciones de siempre. No modifica la selección de la lista y no
  se recuerda: se descarta con **Descartar** o al pasar a otra solapa (desde la
  versión 1.6.2).
- La solapa **advierte antes**, no después: al ingresar ya informa cuántas causas
  quedan comprendidas, cuáles tienen nota de ese día y cuáles no están en Mis
  causas. El botón es el definitivo e inicia el lote, sin un paso intermedio de
  confirmación. La operación se realiza en la lista de Relacionados del PJN; la
  página se recarga una vez por nota y el avance se informa en la ventana.
- En las listas de la solapa, las seleccionadas y las notas del día, el
  **número y la carátula abren el expediente en una pestaña nueva**, para poder
  constatar la nota sin perder la lista.
- Cada nota queda con su resultado: **dejada**, **a verificar** (el PJN no
  respondió y corresponde constatarlo en el expediente) o **no salió**. Nunca se
  da por dejada una nota que el PJN no confirmó **para esa causa**: un incidente
  no vale por su expediente principal. Una nota ya dejada no se sobrescribe: si
  la causa se incluye en otro lote, se informa y se conserva el resultado válido.
- **El PJN admite una sola nota por expediente y por día.** Ante un segundo
  intento responde *"Ya se ha dejado nota con el usuario … en el expediente: …
  No es posible realizar dicha acción más de una vez al día por expediente"*, y
  SuPJN+ interpreta esa respuesta como nota dejada, que es lo que significa. El
  lápiz de la columna **Dejar nota** no desaparece por haberla dejado: que una
  causa no aparezca con lápiz significa que el PJN no la ofrece en esa lista, no
  que la nota esté puesta.
- **Verificar en el PJN.** Las causas que quedan **a verificar** se resuelven
  con un botón, en la misma solapa, sin ejecutar el lote entero ni abrir los
  expedientes individualmente: el botón toma solo esas causas y las vuelve a
  presentar al PJN. Si la nota ya estaba, el PJN lo informa y queda registrada
  como **dejada**; si faltaba, la deja. Como el PJN no admite dos notas el mismo
  día, nunca quedan duplicadas.
- Si se abandona la lista de Relacionados, el lote **queda en pausa** y espera
  mientras esa pestaña siga abierta: continúa al regresar, sin límite de tiempo.
  Mientras está en curso no se descarga nada ni se abren causas, para que las
  recargas del PJN no interrumpan una descarga.
- El lote pertenece a **una sola pestaña**: si se abre otra, o se duplica la que
  está trabajando, la segunda informa que no lo retoma y ninguna nota se deja dos
  veces. El lote de una pestaña cerrada no se retoma automáticamente.

### Descarga de expedientes

- **Desde la lista:** se seleccionan causas y se descarga el expediente completo
  de cada una; desde el menú **⋯** de una causa se elige **qué actuaciones**
  descargar.
- **Desde el expediente:** se descarga todo o se eligen actuaciones, por fecha,
  por tipo o individualmente. Cada causa se entrega en un PDF.
- **Una sola actuación:** el botón **Descargar** de cada fila, junto a **Ver**,
  obtiene esa actuación aislada, con nombre propio y sin modificar la selección.
- Las actuaciones se presentan en **columnas** (Fecha, Tipo, Descripción /
  detalle y Fs.): se ordenan, se reubican, se ensanchan y se ocultan del mismo
  modo que las de la lista. Desde 1.4.1 la columna Tipo lleva el cuadrado de
  color con la letra del tipo (D, E, C, O, S) descripto en "Qué hace".
- **Movimientos sin documento (desde 1.4.4):** la lista de actuaciones de la
  causa incluye también los movimientos del PJN que no generan escrito ni
  documento, como "EN LETRA" o "EN DESPACHO". Para obtenerlos, SuPJN+ aplica en
  segundo plano el filtro **Ver Todos** de la tabla de actuaciones del PJN, sin
  modificar la página que se está consultando. Los movimientos se intercalan en
  el orden del PJN, se presentan en gris con el cuadrado **M**, y no llevan
  casilla ni botón de descarga, porque no tienen documento: no se eligen, no se
  descargan y no forman parte del PDF. El filtro por texto y por fechas, y el
  orden por columna, los alcanzan igual que a las actuaciones. El estado indica
  las dos cantidades por separado (por ejemplo, "12 actuaciones con PDF y 4
  movimientos sin documento").
- **Orden de las actuaciones (desde 1.4.2):** el orden elegido por columna rige
  mientras se consulta esa causa; al ingresar a otra, o al recargar la página,
  las actuaciones vuelven a presentarse en el orden en que las entrega el PJN,
  de la más reciente a la más antigua, que es también el del PDF. Cuando hay un
  orden por columna aplicado, junto a **Columnas** aparece el botón **Orden del
  PJN**, que restituye ese orden e indica, al detener el puntero sobre él, por
  qué columna están ordenadas. Hasta 1.4.1 el orden quedaba guardado para todas
  las causas, de modo que un orden por Tipo hacía que cada causa se abriera
  mostrando primero actuaciones antiguas, como si estuviera desactualizada.
- Las descargas se ejecutan de una en una en segundo plano, de modo que se puede
  continuar trabajando. Avanzan **en bloques de cinco causas**, con una pausa
  entre bloques para no sobrecargar al PJN, y el tope es de **quince en espera
  por vez**, contando lo que ya esté en Descargas: por encima de ese número se
  advierte y no se inicia. **Cancelar las descargas** surte efecto también
  durante la pausa y retira lo que esté aguardando una selección de actuaciones.
- Si una actuación no llega, se reintenta hasta tres veces con esperas crecientes
  y el motivo queda asentado en el **registro de fallas** (véase más abajo).

### El expediente por dentro

- **Pestañas (desde 1.7.0).** A pedido del autor, lo que hasta la versión 1.6.3
  eran secciones desplegables se organiza en pestañas, en este orden:
  **Actuaciones**; **Notas**; **Intervinientes**; **Causas Vinculadas y
  Recursos**; **Etiquetas y Anotaciones**. Al abrir una causa se ve
  Actuaciones. Cada pestaña muestra su cuenta cuando ya se conoce. Lo que se lee
  en segundo plano sigue avanzando aunque se esté mirando otra pestaña.
- **Notas (desde 1.7.0)** muestra las notas dejadas en la causa tal como las
  publica el PJN, dentro de la solapa Actuaciones de su página: fecha,
  interviniente y descripción (la hora y el CUIT de quien la dejó). La nota
  dejada con la cuenta en uso se distingue con la marca **tu nota**. El PJN
  muestra las notas de a quince; cuando informa más, se indica el total y que
  las demás se consultan en la página del PJN, porque su paginador no avanzó en
  el relevamiento (01/10/2026). Debajo figura, si existe, el último resultado de
  dejar nota registrado por SuPJN+ para esa causa.
- **Etiquetas y anotaciones de cada actuación (desde 1.7.0).** La tabla de
  actuaciones del expediente incorpora la columna **Etiquetas y anotaciones**:
  al pulsar la celda de una actuación o de un movimiento se abre, debajo de la
  fila, el mismo cuadro que tienen las causas, con sus etiquetas y su anotación
  privada. Se guardan junto con las de las causas, separadas por cuenta, viajan
  con la copia y con la carpeta de respaldo, y se combinan entre computadoras
  con las mismas reglas. Cada actuación se identifica por la causa, la fecha, el
  tipo y el detalle. La columna se mueve, se ensancha y se oculta como las
  demás, y no aparece en Descargas.
- **Partes siempre a la vista:** al abrir una causa, SuPJN+ lee la solapa
  Intervinientes del PJN en segundo plano y muestra las partes con su rol
  ("Actor: A, Demandado: B", "Imputado: C"), sin los letrados ni los demás
  intervinientes de acompañamiento.
- **Una página de actuaciones que el PJN no contesta (desde 1.5.3).** En
  algunas causas el PJN deja sin respuesta siempre la misma página de
  actuaciones y, mientras ese pedido sigue abierto, la causa no responde durante
  varios minutos, tampoco en la página del PJN. SuPJN+ muestra las actuaciones
  leídas hasta esa página e indica cuál faltó, anota la página para esa causa y,
  durante un día, no la vuelve a pedir al abrir el expediente. El botón **Leer
  todo** la pide de nuevo. Si con la lista incompleta se descarga todo, el
  archivo se nombra como selección.
- **Intervinientes** reproduce las tablas que publica el PJN: las partes, con
  sus letrados debajo de cada una, y, cuando los hay, los **peritos** y los
  **fiscales**, cada grupo con su título. Hasta la versión 1.5.0 se leía solo la
  tabla de partes, por lo que los fiscales no se mostraban.
- El nombre de una **fiscalía**, de un **fiscal**, de una **defensoría oficial**
  o de un **defensor oficial** aparece como enlace: al pulsarlo, se abre una
  **pestaña nueva** en la que la solapa **Guía** muestra la ficha
  correspondiente del Ministerio Público, con la dirección, los teléfonos y el
  correo (véase «Fiscalías y defensorías»). Desde la versión 1.5.3 el expediente
  queda a la vista en su pestaña. Desde la versión 1.6.1 también llevan enlace,
  en las causas civiles y de familia, las defensorías de menores e incapaces,
  las tutorías y curadurías (aunque el PJN las registre como partes, por ejemplo
  "TERCERO | TUTORIA N 2") y el "LETRADO ASESOR DE MENORES". Los letrados
  particulares, las demás partes, los peritos y la Defensoría del Pueblo no
  llevan enlace.
- **Intervinientes, Causas vinculadas y Recursos** se leen al abrir su pestaña
  (Intervinientes, además, se lee sola al abrir la causa, para mostrar las
  partes), recorriendo todas las páginas del PJN. Causas vinculadas y Recursos
  se piden de a una. Si el sitio interrumpe la lectura, se informa: no se
  exhibe una lista incompleta como si estuviera completa, ni se declara que no
  hay contenido cuando lo ocurrido es que la solapa no terminó de cargarse.
- Desde **Causas vinculadas** se abre cada causa en esta pestaña o en una nueva,
  y se descarga su expediente completo, aunque no figure en las listas propias.
- La solapa **Este expediente** se cierra con su cruz, y vuelve a aparecer al
  abrir otra causa.

### Escritos, Notificaciones y DEOX

Cada uno tiene **solapa propia** en la ventana, con la información de su sistema
del PJN:

- **Escritos:** los presentados, por bandeja (enviados a dependencia, enviados a
  autorizador, archivados), con la fecha, el expediente, la carátula, la
  dependencia, el estado y la fecha de aceptación. Desde 1.4.0 el estado es una
  placa de color, como en el PJN: En dependencia en índigo, Gestionado en
  verde, Enviado a autorizador en azul, Pendiente en ámbar, Archivado en gris y
  Borrado en rojo. El estado de los DEOX lleva la misma presentación (Enviado en
  azul; Respondido e Incorporado en verde; Cerrado en gris).
- **Notificaciones:** las cédulas electrónicas recibidas y enviadas, con su
  número, el expediente, el juzgado de radicación, el emisor y los
  destinatarios.
- **DEOX:** los oficios electrónicos enviados, con su número, el tipo, el motivo,
  el destino, el estado (Enviado, Respondido, Incorporado, Cerrado) y la fecha
  de respuesta. Los urgentes van marcados.
- **Respuesta de un DEOX (desde 1.4.6):** en un oficio respondido (Respondido o
  Incorporado), la placa del estado y la fecha de respuesta forman un botón que
  abre la respuesta en una pestaña nueva. DEOX no informa qué documento contestó
  el oficio: el organismo responde con un DEO nuevo, que el juzgado recibe y que
  figura en las actuaciones de la causa como "SE RECIBIO DEO: N - ... - CUIO -
  ORGANISMO", sin citar el número del oficio. SuPJN+ abre la causa en segundo
  plano, lee sus actuaciones y elige el DEO recibido del mismo organismo, del
  día de la respuesta en adelante y con número mayor que el del oficio (los
  números de DEO crecen con el tiempo): el de número más bajo. Si otro oficio
  propio de la misma causa al mismo organismo se respondió el mismo día, no
  elige: abre la causa y lo explica. Lo mismo si no encuentra un DEO recibido de
  ese organismo. El aviso indica siempre qué actuación se abrió. La causa tiene
  que estar en Mis causas o en Favoritos.

En las tres solapas se elige la bandeja y el rango de fechas (de manera
predeterminada, los últimos 60 días en Escritos, los últimos 30 en
Notificaciones y el último año en DEOX) y se pulsa **Consultar**; la primera vez,
la consulta se realiza automáticamente. Sobre lo leído hay un **buscador**, las
columnas se **ordenan** pulsando el título y la lista se pagina en grupos de 50.

**La barra de Escritos** tiene además **atajos de fechas** (últimos 7, 30 o 60
días y este año, que completan las fechas y consultan) y cuatro **filtros sobre
lo ya consultado**: **fuero**, **estado**, **dependencia** y **etiqueta de la
causa**. Cada uno ofrece solamente los valores que aparecen en lo consultado; se
combinan entre sí, con el buscador y con el orden, y no requieren ninguna
consulta adicional al PJN. Si en una consulta nueva no aparece el valor que
estaba elegido, ese filtro se quita automáticamente. En la vista de una sola
causa no se muestran, porque allí no son necesarios.

Cada fila tiene **Ver** (el PDF en una pestaña nueva), **⇩** (descargarlo con
nombre propio), **✉** (dejar cédula en esa causa, véase más abajo) y **↗** (abrir
el expediente en la Consulta Web, en una pestaña nueva). Las causas que están en
Mis causas o en Favoritos muestran sus etiquetas.

**Por causa:** el menú **⋯** de una causa, y los botones del expediente abierto,
conducen a los escritos, las notificaciones o los DEOX **de esa causa, de
cualquier fecha** (con sus incidentes). Un rótulo en la barra indica el filtro, y
su cruz lo quita.

**Modo de obtención.** Se trata de aplicaciones independientes del PJN, cada una
con su ingreso por el SSO. SuPJN+ las abre en segundo plano, en un marco oculto,
con la misma sesión ya iniciada, y les solicita la información desde allí. Antes
de mostrar dato alguno, **comprueba que la sesión de esa aplicación corresponda a
la misma cuenta** que la de la Consulta Web: si no es así, no muestra nada y lo
informa. Solo lee: no presenta, no archiva ni borra nada, y la conexión con esas
aplicaciones admite únicamente una lista cerrada de consultas de lectura. Lo
consultado queda en memoria mientras la página esté abierta y **no se guarda en
la computadora**.

Si la sesión de alguna de esas aplicaciones venció, la ventana lo informa: basta
con abrirla desde **Funciones del PJN**, ingresar si lo solicita y volver a
consultar.

### Dejar cédula y nuevo DEOX

SuPJN+ **no envía cédulas ni oficios**: simplifica el comienzo del formulario de
Notificaciones o de DEOX del PJN y deja el resto a cargo de ese formulario.

**Nuevo DEOX (desde 1.7.0).** A pedido del autor, se puede iniciar un oficio
electrónico desde el listado de causas: **Nuevo DEOX** en el menú **⋯** de la
causa, en el expediente abierto, en la solapa DEOX (**Nuevo DEOX** o **Nuevo
DEOX en esta causa**) y en Funciones del PJN. El formulario de DEOX para un
oficio nuevo (deox.pjn.gov.ar/nuevo, relevado el 01/10/2026 en solo lectura)
tiene el mismo primer paso que el de cédula, de modo que SuPJN+ lo carga del
mismo modo que se describe a continuación. El destinatario, los despachos, los
adjuntos, el texto, la oficina y el envío quedan a cargo del formulario del
PJN. Un pedido hecho para DEOX no se carga en Notificaciones, ni a la inversa.

Para la cédula:

- **Puntos de acceso:** el menú **⋯** de una causa, el botón **Dejar cédula** del
  expediente abierto, el **✉** de cada fila de Escritos, Notificaciones y DEOX y
  de las causas vinculadas, **Nueva cédula** (o **Dejar cédula en esta causa**)
  en la solapa Notificaciones, y **Nueva cédula electrónica** en Funciones del
  PJN.
- **Funcionamiento:** abre Notificaciones en una pestaña nueva, carga la
  jurisdicción, el número y el año, pulsa Siguiente (que solo busca la causa) y
  **elige el expediente o el incidente exacto** ("CIV 76436/2025" y no
  "CIV 76436/2025/1"). Un cartel ubicado sobre el formulario indica qué se eligió.
- **Lo que queda a cargo del formulario del PJN:** los destinatarios, los
  despachos, el texto y el envío. SuPJN+ no pulsa Guardar ni Enviar.
- **Si el PJN no ofrece la causa:** el sistema solo ofrece las causas en las que
  el letrado constituyó domicilio electrónico. En ese caso, el cartel lo indica.
- **Criterio de elección de la jurisdicción:** según lo relevado sobre el
  formulario real el 29/09/2026, el PJN solicita las jurisdicciones a su
  servidor al cargar la página; mientras no llegan, el campo de jurisdicción
  permanece **deshabilitado**, y cuando llegan el PJN **reemplaza ese campo por
  otro**, habilitado. Por ese motivo, desde la versión 1.4.5, SuPJN+ espera a
  que el campo esté habilitado (hasta treinta segundos, con un cartel que
  informa la espera) y vuelve a localizarlo en la página cada vez que lo
  utiliza, en lugar de conservar el que encontró al principio. Examina además
  el estado de la lista antes de tocarla: si ya está abierta la utiliza; solo si
  está cerrada prueba las formas conocidas de abrirla, de una en una; y si se
  abrió y todavía no recibió opciones, **aguarda con la lista abierta** en lugar
  de cerrarla. La opción se reconoce **por la sigla**, nunca por el nombre:
  "Civil" también está contenido en "Civil y Comercial Federal", y si dos
  opciones presentaran la misma sigla no se elige ninguna.
- **Si aun así no se puede elegir la jurisdicción:** SuPJN+ **carga el número y
  el año** y el cartel indica cuál de las seis situaciones se produjo (el campo
  siguió deshabilitado, no se mostró la lista, se mostró vacía, no contiene la
  sigla, contiene más de una, o la contenía y el formulario no la tomó), en
  lugar de dejar el formulario vacío sin explicación. Nunca da por elegida una
  jurisdicción que no quedó cargada en el campo.
- **Misma cuenta:** si Notificaciones está abierto con una cuenta distinta de la
  de la Consulta Web, no se carga nada y se informa.
- El pedido tiene una validez de cinco minutos y se usa una sola vez. Si
  Notificaciones solicita el ingreso, se espera a que se ingrese y luego se
  continúa.

### Guía judicial

La solapa **Guía** muestra la Guía judicial del PJN dentro de la ventana:

- El **índice**, para recorrer por niveles (fueros, cámaras, juzgados,
  secretarías y salas), con botones para subir un nivel y para volver.
- La **búsqueda** por dependencia ("civil 74", "correccional 11", "casación
  penal") o por magistrado o funcionario (por apellido), con Enter o con
  **Buscar**.
- De cada dependencia: **domicilio, piso, código postal, teléfono, correo** e
  **integrantes** con su función y su cargo, y sus dependencias internas con los
  mismos datos. **Copiar los datos** los deja en el portapapeles, listos para un
  escrito o un oficio. El domicilio abre en Google Maps, en una pestaña nueva
  (desde la versión 1.6.2): desde la 1.7.0, a pedido del autor, con un botón
  pequeño sin texto, con el pin rojo y una flecha, al final del renglón del
  domicilio; la leyenda "Ver en Google Maps" aparece al pasar el cursor. El teléfono y el correo propios de una persona se
  muestran solo cuando la Guía los publica, del mismo modo que en el sitio del
  PJN.

**Desde una causa:** **Datos del juzgado** en el menú **⋯**, **Juzgado en la
Guía** en el expediente abierto, o un clic sobre la dependencia en Escritos,
Notificaciones o DEOX, abren directamente la dependencia que corresponde. SuPJN+
traduce la forma en que el expediente nombra al tribunal ("JUZGADO NACIONAL EN LO
CRIMINAL Y CORRECCIONAL NRO. 11 - SECRETARÍA NRO. 133") a la de la Guía
("Juzgado Criminal y Correccional Nro. 11", "Secretaría Nro. 133"), exige que los
números coincidan y **resalta la secretaría**; si se trata de una sala, abre la
sala ("SALA 5" es "Sala V"). Cuando la Guía registra una sola secretaría como
"Secretaría Única", resalta esa y lo aclara. Si hay más de una dependencia
posible, **no elige**: las muestra para que el usuario seleccione la correcta.

### Fiscalías y defensorías

La Guía judicial del PJN no incluye al Ministerio Público. Desde la versión 1.5.0,
el selector de la solapa **Guía** ofrece, además de **Dependencias** y
**Magistrados y funcionarios**, dos búsquedas más:

- **Fiscalías (MPF):** el directorio que el Ministerio Público Fiscal publica en
  su [mapa de fiscalías](https://www.mpf.gob.ar/mapa-fiscalias/). Al 30/09/2026
  reúne 511 fiscalías, unidades y oficinas de 17 jurisdicciones.
- **Defensorías (MPD):** la
  [Guía de Defensorías](https://www.mpd.gov.ar/index.php/guia-de-defensorias-mpd)
  del Ministerio Público de la Defensa. Al 30/09/2026 reúne 388 defensorías,
  unidades y equipos.

Se busca por el nombre y el número ("criminal y correccional 40", "penal
económico 2", "tribunales orales 3"), por el apellido del fiscal, del defensor o
de otro cargo que figure en la ficha, o por la jurisdicción. Los números se
comparan enteros: "criminal 4" trae las N° 4 y no la 14 ni la 40. Cada resultado
muestra el nombre, el grupo y la jurisdicción, quién está a cargo, la
dirección, los teléfonos y el correo, cuando el sitio los publica. **Copiar**
deja la ficha en el portapapeles y **↗** abre la página oficial en una pestaña
nueva: la ficha de la defensoría en el caso del MPD, y el mapa en el caso del
MPF, que no tiene una página por fiscalía. El botón con el pin rojo, al final
de la dirección, la abre en Google Maps, en una pestaña nueva (desde la versión
1.6.2; sin texto desde la 1.7.0).

**Desde Intervinientes (versiones 1.5.1 y 1.6.1).** El PJN abrevia los nombres
("FISCALIA ANTE TRIB. ORAL. EN LO CRIM. DE CAP. FED. N° 1") y los directorios
no ("Fiscalía N° 1 ante los Tribunales Orales en lo Criminal y Correccional").
Para vincularlos, cada palabra del PJN debe ser el comienzo de una palabra del
nombre del directorio, en singular o en plural, y cada número debe figurar
entero. La mención "de Cap. Fed." (o "C.A.B.A.") se toma como jurisdicción y
no como parte del nombre: de lo contrario, las fiscalías y defensorías de lo
Criminal Federal, que la llevan escrita en el nombre, desplazarían a las de lo
Criminal y Correccional. Tampoco hace falta que figuren en el directorio
"NAC.", "DE 1RA. INST." ni "INSTANCIA", que el PJN agrega y los directorios
omiten; "2DA. INST." se busca como "Segunda Instancia" y "DEFENSORA PUBLICA"
como defensoría. Según el resultado:

- una sola ficha corresponde: se muestra esa ficha;
- varias corresponden por igual: se muestran todas y, si el nombre del fiscal
  permite distinguirlas, se muestra solo la que lo nombra;
- el nombre que da el PJN es demasiado corto y no tiene número (por ejemplo,
  "DEFENSORIA DE CAMARA"): se muestran las que coinciden, sin elegir ninguna;
- ninguna corresponde del todo: se muestran las más parecidas, con la
  advertencia de que el directorio no publica una ficha con ese nombre;
- ninguna se parece: se muestran las fichas en las que figura el fiscal o el
  defensor nombrado por el PJN, si las hay;
- un defensor oficial o un asesor de menores remite a la defensoría que figura
  en el mismo bloque (la parte y sus letrados), prefiriendo la que aparece entre
  los letrados, que es la más precisa; si no figura ninguna, se muestran las
  fichas del MPD en las que figura la persona.

Arriba de los resultados, una nota transcribe lo que informa el PJN (la causa,
la fiscalía o la defensoría y la persona) y aclara cuál de esos casos se dio.
El cotejo se verificó el 30/09/2026 sobre los directorios reales, con los
nombres tomados de causas penales, federales, civiles y de familia: las
fiscalías y defensorías consultadas se vincularon con su ficha correcta, y una
fiscalía que el MPF no publica (la Fiscalía General ante la Cámara Nacional de
Casación en lo Criminal y Correccional) se informa como tal.

La primera búsqueda de cada tipo baja el directorio completo del sitio
oficial; las siguientes se hacen sobre la copia guardada en la computadora, que
se renueva sola a los siete días. El botón **Actualizar**, junto a la fecha de
lectura, la vuelve a bajar en el momento. Si el sitio no responde, se sigue
usando la copia guardada y se lo informa. Los datos son los que cada ministerio
publica: SuPJN+ no los corrige ni los completa.

### Consulta pública

La consulta pública del PJN busca causas por el nombre de una parte, pero en un
solo fuero por vez. Desde la versión 1.6.0, la solapa **Consulta pública** hace
esa búsqueda en todos los fueros que se elijan, de una sola vez, y reúne el
resultado en una tabla:

- **Qué se escribe.** El nombre de una parte, como figura en la causa (por
  ejemplo, "PEREZ JUAN"), o un número de expediente ("CIV 12345/2024"). Por
  nombre, el PJN exige al menos seis letras y busca cada palabra por separado,
  en cualquier orden, en todas las partes de la causa y no solo en la carátula.
  El **tipo de parte** (actor, demandado, causante y los demás que ofrece el
  PJN) es optativo. Por número, con la sigla del fuero se consulta ese fuero;
  sin la sigla, se lo busca en todos los fueros elegidos.
- **Los fueros.** El botón **Fueros** permite marcarlos uno por uno o por
  grupos (**Todos**, **Capital**, **Interior**). De manera predeterminada se
  consultan los de Capital que no son penales: Civil, Contencioso Administrativo
  Federal, Civil y Comercial Federal, Seguridad Social, Trabajo y Comercial. La
  elección queda guardada.
- **Primero, las causas propias.** Antes de consultar al PJN, SuPJN+ busca el
  nombre o el número en Mis causas y Favoritos, sin demora y sin consultar al
  sitio. Si el número buscado, con su sigla, corresponde a una causa propia, no
  se consulta al PJN. En la tabla de la consulta pública, las causas que
  también son propias llevan la indicación "está en tus causas".
- **Cómo consulta.** Hace, fuero por fuero y en segundo plano, lo mismo que se
  haría a mano en el formulario del PJN, y recorre todas las páginas de cada
  resultado (el PJN las muestra en páginas de quince). El avance se ve por
  fuero: la cantidad de causas, "0" si no hay, o el error. Se puede **saltear**
  el fuero en curso, **detener** la búsqueda y, al terminar, **reintentar** los
  fueros que fallaron o que no se consultaron. Con más de 600 causas en un
  fuero, se leen las primeras 600 y se indica que conviene acotar la búsqueda.
- **La Ñ y las tildes.** El formulario del PJN las rechaza ("no se admiten
  caracteres especiales"), pero encuentra a MUÑOZ si se busca MUNOZ. SuPJN+ hace
  ese cambio por su cuenta, junto con el de comas y guiones.
- **El tipo de juicio.** El PJN no filtra por tipo de juicio. SuPJN+ lo toma de
  la carátula, de lo que sigue a la "s/" ("DAÑOS Y PERJUICIOS", "SUCESION
  AB-INTESTATO", "QUIEBRA"). El campo **Tipo de juicio** muestra solo las causas
  que lo contienen, sin volver a consultar al PJN, y la tabla ofrece la lista de
  los tipos encontrados, con la cantidad de cada uno. Sin nombre de parte, el
  tipo de juicio se busca solo entre las causas propias, porque la consulta
  pública exige un nombre.
- **Lo encontrado.** Una tabla con fuero, expediente, carátula, dependencia,
  situación y última actuación, con 50 filas por página, que se ordena por
  cualquier columna y se filtra por texto. **Abrir** abre la causa en una
  pestaña nueva, con el resto de las funciones de SuPJN+ (actuaciones, descarga
  en PDF); mientras la búsqueda sigue en curso no se abre, porque la consulta
  de la apertura puede vencer la lista que se está recorriendo (desde la
  versión 1.6.3). **Copiar** deja la causa en el portapapeles y **Copiar la tabla**
  deja la tabla entera, lista para pegar en una planilla.

**El desafío (captcha).** Con la sesión iniciada, el PJN no lo solicita (relevado
el 30/09/2026). Si en algún momento lo solicitara, SuPJN+ muestra la página del
PJN sobre la ventana y espera a que el usuario lo resuelva: no lo resuelve ni lo
saltea. Cuando el PJN lo aprueba, la búsqueda continúa sola. Lo mismo ocurre si
lo solicitara al abrir una causa; en ese caso, el botón **No abrir la causa**
cancela la apertura.

Las causas penales y las de familia no aparecen, porque el PJN no las muestra en
la consulta pública. Lo buscado y lo encontrado no se guardan: se conservan
mientras la página esté abierta.

### Exportar a Excel y a CSV

Desde la versión 1.6.0, el botón **Exportar** permite bajar a un archivo lo que
se está viendo, con los filtros aplicados, en **Mis causas**, **Favoritos**,
**Escritos**, **Notificaciones**, **DEOX** y la **Consulta pública**:

- **Excel (.xlsx):** una hoja con la primera fila fija y con filtros, y las
  fechas como fechas de Excel, que se ordenan y se filtran.
- **CSV:** separado por punto y coma, que es como Excel en español lo abre con
  doble clic, y con las fechas como texto (dd/mm/aaaa). Un texto que comienza
  con =, +, - o @ lleva un apóstrofo adelante, para que Excel no lo interprete
  como una fórmula.

En Mis causas y Favoritos van las columnas que están a la vista, en el orden en
que se ven, además del estado del trámite. En las bandejas van todos los datos
de cada elemento, con la carátula de la causa. Se exportan todas las filas que
cumplen los filtros, no solo la página a la vista. Van las **etiquetas**; las
**anotaciones no van**, porque el archivo sale de la computadora sin contraseña
(véase "Los datos y el respaldo").

### Las demás aplicaciones del PJN

El botón **Funciones del PJN** de la barra azul abre, **siempre en una pestaña
nueva**, las listas del sitio, Radicaciones, la consulta pública, los datos
personales y las restantes aplicaciones: **Nueva cédula electrónica**,
**Escritos** (presentar y consultar presentados), **DEOX**, **Notificaciones**,
**IWECS**, **Autorizados** y **Mis eventos** del Portal. La pestaña en la que
funciona SuPJN+ no cambia de página. Por causa, el menú **⋯** ofrece abrir en
esta pestaña o en una nueva, **libro digital** y **presentar escrito**.

Ese mismo menú incluye **Cerrar sesión del PJN**, para utilizar al finalizar. No
cierra la sesión si hay un lote de notas o descargas en curso: primero lo
advierte, porque ese trabajo sí se perdería.

### La sesión mientras se trabaja

El PJN cierra la sesión por inactividad, y eso interrumpe un lote de notas o una
descarga a mitad de camino. Mientras se está trabajando, SuPJN+ renueva la
sesión del sitio cada pocos minutos para que no caduque.

Lo hace **solo si hay una persona trabajando**: actividad reciente en la
pantalla, o un trabajo en curso. Si la computadora queda desatendida, la
renovación se detiene y la sesión caduca como de costumbre. Es una decisión
deliberada: una sesión que no caduca nunca queda al alcance de cualquier persona
que se siente frente a la computadora, que es exactamente lo que se busca
evitar.

## Cómo se usa

1. Ingresar al **Portal del PJN** (portalpjn.pjn.gov.ar) con el usuario propio.
   El indicador de SuPJN+ aparece apenas se ingresa: al pulsarlo conduce a la
   Consulta Web con SuPJN+ en funcionamiento. Con la sesión ya iniciada, también
   funciona al abrir directamente la Consulta Web (scw.pjn.gov.ar).
2. En la Consulta Web, **SuPJN+** se abre automáticamente, ocupando toda la
   pantalla, y lee las causas y los favoritos en segundo plano. Minimizado, el
   indicador del extremo inferior derecho informa el avance; al pulsarlo se
   vuelve a abrir la ventana. Las listas se releen automáticamente cuando han
   transcurrido más de 10 minutos, o al pulsar **Actualizar**.
3. Si quedó sin terminar un lote de **dejar nota**, la ventana lo informa al
   abrirse, para poder continuarlo o cancelarlo.
4. El botón **Recargar** de la barra azul vuelve a cargar la página del PJN e
   inicia SuPJN+ desde cero. Si hay trabajo en curso, solicita confirmación.

Si la sesión del PJN vence, la ventana lo advierte: corresponde recargar la
página, ingresar nuevamente si el sitio lo solicita y reintentar. Si el PJN no
tiene causas en una lista, la ventana lo informa en lugar de quedar en blanco.

### Si algo deja de funcionar

SuPJN+ depende de la estructura de la página del PJN. En **Acerca de** hay un
botón **Revisar el PJN**: examina, en segundo plano y sin dejar notas ni
modificar nada, las piezas que SuPJN+ necesita (la tabla de causas, el
paginador, el enlace para abrir, la cuenta del encabezado, la función de dejar
nota, las solapas del expediente, Escritos, Notificaciones, DEOX, la Guía
judicial, el formulario de la consulta pública, la tabla de actuaciones y un
PDF) e informa cuáles siguen en su lugar y cuáles cambiaron. Genera un informe para copiar y remitir a quien mantiene
SuPJN+: **no incluye números de causa ni datos personales**.

En el código, todo lo que depende de la construcción del sitio (las direcciones,
los textos que se buscan, los nombres de los elementos y los campos de los
formularios) está reunido en un solo bloque al comienzo del archivo, **el mapa
del PJN**. Cuando el PJN modifica algún elemento, ese es el único lugar que
corresponde revisar, y la revisión comprueba esas piezas una por una.

### Registro de fallas de descarga

Cuando una descarga no se completa, el motivo se pierde apenas cambia el texto en
pantalla. Por ese motivo, SuPJN+ conserva las circunstancias de cada falla en
**Acerca de**: de qué expediente y de qué actuación se trata, a qué dirección se
solicitó el documento, qué respondió el servidor (código de estado, tipo de
contenido y tamaño) y cuántos intentos fueron necesarios. Distingue tres
situaciones:

- **Descarga.** El documento no llegó. Un error de red o de servidor se reintenta
  tres veces, con esperas de 600, 1500 y 3000 milisegundos; una respuesta
  correcta que no es un PDF corresponde a una actuación sin documento y no se
  reintenta, porque insistir daría siempre el mismo resultado.
- **Lectura del PDF.** El documento llegó pero no pudo abrirse: archivo dañado o
  cifrado.
- **Trabajo.** Falló el proceso completo, con indicación de la etapa en que se
  interrumpió: al ubicar la causa, al leer las actuaciones o al armar el archivo.

El registro se guarda por cuenta, conserva las últimas doscientas entradas y
puede vaciarse. El texto que se copia **omite el número de expediente, la
descripción de la actuación y los parámetros de la dirección**, de modo que puede
remitirse sin revelar de qué causa se trata.

## Los datos y el respaldo

Las listas leídas, las etiquetas, las anotaciones, el resultado de dejar nota y
el registro de fallas se guardan **únicamente en esta computadora**, en el
almacén de Tampermonkey. No se envían a ningún servidor y no se escriben en el
PJN. Lo que se consulta en Escritos, Notificaciones, DEOX, la Guía y la consulta
pública no se guarda: se conserva mientras la página esté abierta. La excepción
son los directorios públicos de fiscalías y defensorías, que se guardan por siete días
para no bajarlos en cada búsqueda; no son datos de ninguna causa ni de ninguna
cuenta, y por eso se guardan una sola vez para todo el navegador.

**Separado por cuenta del PJN.** El almacén de Tampermonkey pertenece al
navegador y no a la sesión del PJN, y además se comparte con las ventanas de
incógnito. Por ese motivo, SuPJN+ lee en la barra de usuario del sitio la cuenta
con la que se ingresó y guarda los datos de cada cuenta por separado: **con una
cuenta no se accede a ningún dato de la otra**, ni causas, ni etiquetas, ni
anotaciones, ni el registro de notas. La barra azul indica siempre la cuenta con
la que se está trabajando. Si no puede identificarla, lo informa y no guarda
nada ni muestra lo guardado, para no mezclar datos de dos cuentas. Un lote de
notas iniciado con una cuenta no se retoma con otra.

La configuración de la ventana (columnas, anchos, orden) es común a todas las
cuentas, porque no constituye información de causas; también lo es la elección
de fueros de la consulta pública. El texto escrito en el buscador no se guarda:
puede ser el nombre de un cliente.

Las **anotaciones** son privadas y de trabajo: no se escriben en el expediente
y no guardan relación con dejar nota.

Desde la versión 1.7.0, las etiquetas y anotaciones de cada **actuación** se
guardan en el mismo registro que las de las causas, con una clave propia, y se
copian, se respaldan y se combinan del mismo modo. La solapa Respaldo informa
cuántas causas y cuántas actuaciones tienen marcas.

Existen dos formas de respaldo, en la solapa **Respaldo**:

- **Una carpeta designada por el usuario.** Con **Elegir carpeta**, SuPJN+
  escribe allí un archivo por cuenta (`SuPJN+-datos-<cuenta>.supjn`) con las
  etiquetas, las anotaciones y el registro de notas, cada vez que algún dato
  cambia, y lo lee al abrir. Solo importa el archivo de la cuenta con la que se
  ingresó. Con la carpeta sincronizada (OneDrive o Google Drive) permite trabajar en dos
  computadoras. **Desde la 0.7.1 ese archivo va cifrado**, con la misma
  contraseña y el mismo formato que la copia manual (véase más abajo): en el uso
  diario no se solicita nada. Sin contraseña establecida, SuPJN+ no escribe en la
  carpeta y lo advierte en la barra de la lista. En la otra computadora
  corresponde ingresar la misma contraseña una vez; hasta entonces, SuPJN+ no lee
  ni sobrescribe el respaldo de la carpeta. Tampoco lo sobrescribe antes de
  haberlo leído: ni mientras no se identifica la cuenta del PJN ni cuando el
  archivo existe pero no se puede leer (por ejemplo, si OneDrive lo tiene solo
  en la nube y no hay conexión); en ese caso lo informa. Si se cambió la contraseña en forma
  deliberada, hay un botón para reemplazar el respaldo de la carpeta con los
  datos de esa computadora. El archivo sin cifrar de las versiones anteriores
  (`.json`) se lee una vez y se borra cuando ya quedó escrito el cifrado;
  OneDrive o Google Drive pueden conservarlo en su papelera.
  Es conveniente una carpeta **ajena a la del programa**: si se trata de un
  repositorio de Git, SuPJN+ lo advierte, porque las anotaciones podrían
  terminar publicadas. Chrome solicita el permiso una vez y en ocasiones vuelve a
  solicitarlo: cuando ocurre, la ventana lo informa y ofrece un botón para
  otorgarlo de nuevo.
- **Una copia manual.** **Exportar** guarda el archivo en la ubicación que se
  indique, también en formato propio (`.supjn`) y cifrado con una contraseña del
  usuario. No se abre con un editor de texto, no lo leen los indexadores de
  escritorio ni de la nube, y sin la contraseña no se recupera en ninguna parte.
  La contraseña se establece una sola vez, en la solapa **Respaldo**, y queda en
  esa computadora: allí no se la vuelve a solicitar, ni para exportar ni para
  importar. Al importar el archivo en otra computadora sí corresponde
  escribirla. La ventana muestra la fecha de la última copia y la señala en rojo
  cuando han transcurrido más de 15 días.

  Lo que se protege es el archivo cuando sale de la computadora, que es donde
  queda fuera de control: en una carpeta sincronizada, en una unidad de
  almacenamiento extraíble o adjunto en un correo. Lo guardado dentro de la
  computadora se mantiene sin cambios, protegido por la sesión de Windows.

Los archivos de Excel y CSV del botón **Exportar** (desde la 1.6.0) no son un
respaldo: no llevan contraseña y cualquiera que los tenga puede leerlos. Por
eso no incluyen las anotaciones, sino solo los datos del PJN y las etiquetas.

Para trasladar los datos a otra computadora, se utiliza **Importar**. No elimina
nada: suma las etiquetas faltantes y de cada causa conserva lo más reciente (la
anotación más nueva si ambas copias tienen fecha, y los dos textos si alguna
proviene de una copia anterior sin fecha), además del resultado de dejar nota
más reciente. Desde la versión 1.6.2, una anotación **eliminada** en una
computadora también se elimina en la otra, salvo que allí se la haya escrito
después del borrado: el respaldo registra cuándo se borró cada anotación, y
gana lo más reciente. Desde la versión 1.6.3, un borrado elimina también los
textos sin fecha provenientes de copias anteriores.

## Instalación

1. Contar con [Tampermonkey](https://www.tampermonkey.net/) instalado en Chrome o
   Edge.
2. Abrir el enlace de instalación:
   **[Instalar supjn-plus.user.js](https://raw.githubusercontent.com/Elzas85/SuPJNPLUS/main/supjn-plus.user.js)**
3. Tampermonkey muestra la pantalla de instalación. Pulsar *Instalar*.

**Importante:** SuPJN+ ya incorpora la totalidad de **PJN+** y de **NOTATOMIC**.
Corresponde desactivar esos dos scripts en Tampermonkey: con los tres activos se
duplican los paneles y dos scripts operan sobre los mismos lápices.

Tampermonkey consulta ese mismo enlace y se **actualiza automáticamente** cuando
se publica una versión con número mayor.

Desde la versión 0.7.0, SuPJN+ también se carga en **escritos.pjn.gov.ar**,
**notif.pjn.gov.ar**, **deox.pjn.gov.ar** y **www.pjn.gov.ar/guia**. En esos
sitios no dibuja ningún elemento: solo atiende las consultas de la ventana
cuando esta abre esas aplicaciones en segundo plano. Si Tampermonkey solicita
confirmar los sitios nuevos al actualizar, corresponde aceptarlos.

Desde la versión 1.5.0, SuPJN+ lee además dos páginas públicas del Ministerio
Público: **www.mpf.gob.ar** y **www.mpd.gov.ar** (ver "Fiscalías y
defensorías"). Para eso utiliza la función de Tampermonkey que permite leer
otros sitios (`GM_xmlhttpRequest`), habilitada solo para esos dos dominios. Si
Tampermonkey pregunta si SuPJN+ puede acceder a alguno de ellos, corresponde
permitirlo; SuPJN+ solo lee esas páginas y no envía ningún dato.

## En el teléfono

La versión para Android es **SuPJN Lite**, un producto independiente, con su
propia carpeta, su propio número de versión y su propia documentación. No es una
versión de este script de usuario ni se construye a partir de él: SuPJN+
funciona en el navegador de la computadora y SuPJN Lite, en Android.

## Autor

Creado por **Ignacio Kinbaum** con Claude.
Contacto: estudiojuridicokinbaum@gmail.com

## Licencia

Copyleft: **GNU General Public License v3.0 o posterior** ([GPL-3.0-or-later](LICENSE)).

Software libre: se permite y se alienta su uso, copia, modificación y
distribución de forma gratuita, siempre que las obras derivadas conserven esta
misma licencia. Sin garantía.
