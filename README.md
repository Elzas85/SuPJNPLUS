# SuPJN+

Userscript para **Tampermonkey** que reúne, en **una sola ventana**, la
[Consulta Web del Poder Judicial de la Nación (PJN)](https://scw.pjn.gov.ar/).

Incorpora la totalidad de **PJN+** y de **NOTATOMIC**, y agrega las causas propias, los favoritos,
dejar nota, los escritos presentados, las notificaciones electrónicas, los DEOX,
la Guía judicial y el acceso a las demás aplicaciones del PJN, en la misma
interfaz.

## Qué hace

Una ventana que **se abre sola al entrar al PJN**, **ocupando toda la
pantalla**, y que mientras tanto **lee las causas por sí sola**, en segundo
plano. Con el botón de maximizar se la puede restaurar a su tamaño anterior, y
la próxima vez que se abra vuelve a ocuparla entera. Minimizada queda como
indicador **SuPJN+** en el extremo inferior derecho.
Se puede **desplazar** arrastrando la barra azul, **redimensionar**
desde la esquina inferior derecha, **acercar o alejar** con los botones − 100% +
de la barra azul, y **minimizar, maximizar o cerrar**. Si ocurre algo mientras
está minimizada, el indicador se pone **rojo** y señala que hay un aviso.

**Vuelve donde estaba.** El PJN recarga la página entera cada vez que se abre
una causa, se deja una nota o se pulsa Recargar. SuPJN+ anota la solapa, la
página, la causa desplegada y hasta dónde estaba corrida la pantalla, y al
volver retoma ese punto en lugar de empezar de arriba. Lo anotado es de esa
pestaña, dura una hora y no sale de la PC.

### Mis causas y Favoritos

- Lee **las dos listas** del PJN (Relacionados y Favoritos), **en trámite y
  fuera de trámite**, en segundo plano y sin alterar la página que se está
  viendo.
- Una sola tabla con **búsqueda** sobre todos los campos y **filtros** por
  fuero, situación, trámite, etiqueta y rango de fechas de la última actuación.
- **Los filtros puestos se avisan arriba.** En el mismo renglón que dice cuántas
  causas hay aparece, en ámbar, *"mostrando 10 de 232 · hay un filtro puesto:
  novedades"*, con el botón **Quitar los filtros** al lado. Los filtros quedan
  guardados de una sesión a la otra, de modo que la lista puede abrirse ya
  filtrada; el aviso está para que eso no se confunda con una lista incompleta.
- **Ordena** por cualquier columna. Las **columnas se reubican** arrastrando el
  título, se **ensanchan** arrastrando el borde y se **ocultan**.
- **Orden PJN** las muestra en la misma secuencia que el sitio: al leer, SuPJN+
  solicita la lista con **"Ordenar Lista Por: FECHA"**, igual que se hace
  manualmente.
- **Orden cronológico** ordena por última actuación. El PJN no publica la hora en
  ninguna pantalla, pero las resoluciones y los escritos van firmados y la firma
  la contiene: con **Averiguar la hora**, SuPJN+ descarga el último documento con
  PDF de las causas que empatan en la fecha, lee la hora de la firma y la muestra
  junto a la fecha. Procesa de a cinco causas, hasta quince por vez, y se puede
  cancelar. La hora **desempata solo cuando se conoce la de todas las causas de
  ese día**: con algunas conocidas y otras no, las conocidas se agruparían en
  bloque y el resultado sería peor que el orden del PJN, de modo que en ese caso
  se conserva el del sitio.
- La tabla **siempre entra en el ancho de la ventana**: el espacio que gana una
  columna lo pierden las otras. El encuadre se desactiva desde **Columnas ▾**.
- **Novedades:** el PJN no emite aviso alguno, de modo que SuPJN+ registra el
  estado de cada causa en la última consulta y marca con **nuevo** las que
  cambiaron de fecha de última actuación o de situación. El sitio solo publica el
  día, así que dos movimientos de la misma fecha no se distinguen. El botón
  **Novedades** deja a la vista únicamente esas causas. Una causa deja de estar
  marcada al abrirla, o con **Marcar todo como visto**. La primera lectura es la
  línea de partida: allí no hay novedades.
- **Etiquetas** con color y **anotaciones** propias sobre cada causa. Las
  anotaciones son privadas y de trabajo, y no se escriben en el expediente: no
  guardan relación con dejar nota.
- Una columna **Partes** con el rol al frente: "Actora: A · Demandada: B". Cuando
  la carátula no contiene "C/", indica **Causante** en las sucesiones e
  **Imputado** en el fuero penal. Se obtiene de la carátula del PJN, que es lo
  único que la lista provee.
- Una columna **Nota** con el resultado de la última vez que se dejó nota en cada
  causa.

### Dejar nota

- Tiene **solapa propia**, entre Favoritos y Descargas.
- En **todas** las causas que el PJN habilite ese día, o solo en las
  **seleccionadas** en Mis causas o en Favoritos.
- La solapa **advierte antes**, no después: al entrar ya informa cuántas causas
  entran, cuáles tienen nota de ese día y cuáles no están en Mis causas. El
  botón es el definitivo e inicia el lote, sin un paso intermedio de
  confirmación. La operación se realiza en la lista de Relacionados del PJN; la
  página se recarga una vez por nota y el avance se informa en la ventana.
- En las listas de la solapa, las seleccionadas y las notas del día, el
  **número y la carátula abren el expediente en una pestaña nueva**, para poder
  constatar la nota sin perder la lista.
- Cada nota queda con su resultado: **dejada**, **a verificar** (el PJN no
  respondió y corresponde constatarlo en el expediente) o **no salió**. Nunca se
  da por dejada una nota que el PJN no confirmó **para esa causa**: un incidente
  no vale por su expediente principal. Una nota ya dejada no se sobrescribe: si
  la causa se incluye en otro lote y el PJN ya no le asigna lápiz, se informa y
  se conserva el resultado válido.
- Si se abandona la lista de Relacionados, el lote **queda en pausa** y espera
  mientras esa pestaña siga abierta: continúa al regresar, sin límite de tiempo.
  Mientras está en curso no se descarga nada ni se abren causas, para que las
  recargas del PJN no interrumpan una descarga.
- El lote pertenece a **una sola pestaña**: si se abre otra, o se duplica la que
  está trabajando, la segunda informa que no la retoma y ninguna nota se deja dos
  veces. Un lote de una pestaña cerrada no se retoma automáticamente.

### Descarga de expedientes

- **Desde la lista:** se seleccionan causas y se descarga el expediente completo
  de cada una; desde el menú **⋯** de una causa se elige **qué actuaciones**
  descargar.
- **Desde el expediente:** se descarga todo o se eligen actuaciones, por fecha,
  por tipo o una por una. Cada causa se entrega en un PDF.
- **Una sola actuación:** el botón **Descargar** de cada fila, junto a **Ver**,
  obtiene esa actuación aislada, con nombre propio y sin modificar la selección.
- Las actuaciones se presentan en **columnas** (Fecha, Tipo, Descripción /
  detalle y Fs.): se ordenan, se reubican, se ensanchan y se
  ocultan igual que las de la lista. **Orden del PJN** restituye el orden en que
  las entrega el sitio, que es el del PDF.
- Las descargas se ejecutan de a una en segundo plano, de modo que se puede
  seguir trabajando. Avanzan **de a cinco causas**, con una pausa entre bloques
  para no sobrecargar al PJN, y el tope es de **quince en espera por vez**,
  contando lo que ya esté en Descargas: por encima de ese número se advierte y no
  se inicia. **Cancelar las descargas** surte efecto también durante la pausa y
  retira lo que esté aguardando una selección de actuaciones.
- Si una actuación no llega, se reintenta hasta tres veces con esperas crecientes
  y el motivo queda anotado en el **registro de fallas** (ver más abajo).

### El expediente por dentro

- **Partes siempre a la vista:** al abrir una causa, SuPJN+ lee la solapa
  Intervinientes del PJN en segundo plano y muestra las partes con su rol
  ("Actor: A, Demandado: B", "Imputado: C"), sin los letrados ni los demás
  intervinientes de acompañamiento.
- **Intervinientes, Causas vinculadas y Recursos** se presentan como secciones de
  la ficha: se despliegan a pedido y se leen en ese momento, recorriendo todas
  las páginas del PJN. Si el sitio interrumpe la lectura, se informa: no se
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
  dependencia, el estado y la fecha de aceptación.
- **Notificaciones:** las cédulas electrónicas recibidas y enviadas, con su
  número, el expediente, el juzgado de radicación, el emisor y los
  destinatarios.
- **DEOX:** los oficios electrónicos enviados, con su número, el tipo, el motivo,
  el destino, el estado (Enviado, Respondido, Incorporado, Cerrado) y la fecha
  de respuesta. Los urgentes van marcados.

En las tres se elige la bandeja y el rango de fechas (de manera predeterminada,
los últimos 60 días en Escritos, los últimos 30 en Notificaciones y el último
año en DEOX) y se pulsa **Consultar**; la primera vez se consulta sola. Sobre lo
leído hay un **buscador**, las columnas se **ordenan** pulsando el título y la
lista se pagina de a 50.

**La barra de Escritos** tiene además **atajos de fechas** (últimos 7, 30 o 60
días y este año, que ponen las fechas y consultan) y cuatro **filtros sobre lo
ya consultado**: **fuero**, **estado**, **dependencia** y **etiqueta de la
causa**. Cada uno ofrece solamente los valores que aparecen en lo consultado, se
combinan entre sí, con el buscador y con el orden, y no le piden nada más al
PJN. Si en una consulta nueva no aparece lo que estaba elegido, ese filtro se
quita solo. En la vista de una sola causa no se muestran, porque ahí no hacen falta.

Cada fila tiene **Ver** (el PDF en una pestaña nueva), **⇩** (descargarlo con
nombre propio), **✉** (dejar cédula en esa causa, ver más abajo) y **↗** (abrir
el expediente en la Consulta Web, en una pestaña nueva). Las causas que están en
Mis causas o en Favoritos muestran sus etiquetas.

**Por causa:** el menú **⋯** de una causa, y los botones del expediente abierto,
llevan a los escritos, las notificaciones o los DEOX **de esa causa, de
cualquier fecha** (con sus incidentes). Un rótulo en la barra indica el filtro, y
su cruz lo quita.

**Cómo lo obtiene.** Son aplicaciones aparte del PJN, cada una con su ingreso por
el SSO. SuPJN+ las abre en segundo plano, en un marco oculto, con la misma sesión
ya iniciada, y les pide la información desde ahí. Antes de mostrar nada
**comprueba que la sesión de esa aplicación sea de la misma cuenta** que la de la
Consulta Web: si no lo es, no muestra nada y lo informa. Solo lee: no presenta,
no archiva ni borra nada, y la conexión con esas aplicaciones solo admite una
lista cerrada de consultas de lectura. Lo consultado queda en memoria mientras
la página esté abierta y **no se guarda en la PC**.

Si la sesión de alguna de esas aplicaciones venció, la ventana lo informa:
alcanza con abrirla desde **Funciones del PJN**, ingresar si lo pide y volver a
consultar.

### Dejar cédula

SuPJN+ **no envía cédulas**: simplifica el comienzo del formulario de
Notificaciones del PJN y deja el resto en ese formulario.

- **Desde dónde:** el menú **⋯** de una causa, el botón **Dejar cédula** del
  expediente abierto, el **✉** de cada fila de Escritos, Notificaciones y DEOX y
  de las causas vinculadas, **Nueva cédula** (o **Dejar cédula en esta causa**)
  en la solapa Notificaciones, y **Nueva cédula electrónica** en Funciones del
  PJN.
- **Qué hace:** abre Notificaciones en una pestaña nueva, carga la jurisdicción,
  el número y el año, pulsa Siguiente (que solo busca la causa) y **elige el
  expediente o el incidente exacto** ("CIV 76436/2025" y no "CIV 76436/2025/1").
  Un cartel encima del formulario dice qué se eligió.
- **Qué queda para el formulario del PJN:** los destinatarios, los despachos, el
  texto y el envío. SuPJN+ no pulsa Guardar ni Enviar.
- **Si el PJN no ofrece la causa:** el sistema solo ofrece las causas en las que
  el letrado constituyó domicilio electrónico. En ese caso el cartel lo dice.
- **Cómo elige la jurisdicción:** el PJN no manda las jurisdicciones con la
  página: las pide a su servidor **cada vez que la lista se abre**, y tardan
  alrededor de un segundo. Además, cada clic en el campo abre o cierra la lista,
  y cerrarla cancela esa espera. Por eso SuPJN+ mira primero cómo está el campo:
  si ya está abierto lo usa, solo si está cerrado prueba las formas conocidas de
  abrirlo, de a una, y si se abrió y todavía no trajo nada **la espera con la
  lista abierta** en vez de cerrarla. La opción se reconoce **por la sigla**,
  nunca por el nombre: "Civil" también está adentro de "Civil y Comercial
  Federal", y si dos opciones trajeran la misma sigla no se elige ninguna.
- **Si igual no se puede elegir la jurisdicción:** SuPJN+ **carga el número y el
  año** y el cartel dice cuál de las cinco cosas pasó (no se mostró la lista, se
  mostró vacía, no trae la sigla, trae más de una, o estaba y el formulario no
  la tomó), en vez de dejar el formulario vacío sin explicación. Nunca da por
  elegida una jurisdicción que no quedó cargada en el campo.
- **Misma cuenta:** si Notificaciones está abierto con otra cuenta que la de la
  Consulta Web, no se carga nada y se avisa.
- El pedido vale cinco minutos y se usa una sola vez. Si Notificaciones pide
  ingresar, espera a que se ingrese y sigue.

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
  escrito o un oficio. El teléfono y el correo propios de una persona se
  muestran solo cuando la Guía los publica, igual que en el sitio del PJN.

**Desde una causa:** **Datos del juzgado** en el menú **⋯**, **Juzgado en la
Guía** en el expediente abierto, o un clic sobre la dependencia en Escritos,
Notificaciones o DEOX, abren directamente la dependencia que corresponde. SuPJN+
traduce la forma en que el expediente nombra al tribunal ("JUZGADO NACIONAL EN LO
CRIMINAL Y CORRECCIONAL NRO. 11 - SECRETARÍA NRO. 133") a la de la Guía
("Juzgado Criminal y Correccional Nro. 11", "Secretaría Nro. 133"), exige que los
números coincidan y **resalta la secretaría**; si se trata de una sala, abre la
sala ("SALA 5" es "Sala V"). Cuando la Guía registra una sola secretaría como
"Secretaría Única", resalta esa y lo aclara. Si hay más de una dependencia
posible, **no elige**: las muestra para que se elija la correcta.

### Las demás aplicaciones del PJN

El botón **Funciones del PJN** de la barra azul abre, **siempre en una pestaña
nueva**, las listas del sitio, Radicaciones, la consulta pública, los datos
personales y las restantes aplicaciones: **Nueva cédula electrónica**,
**Escritos** (presentar y consultar presentados), **DEOX**, **Notificaciones**,
**IWECS**, **Autorizados** y **Mis eventos** del Portal. La pestaña donde está SuPJN+ no se mueve. Por causa, el
menú **⋯** ofrece abrir en esta pestaña o en una nueva, **libro digital** y
**presentar escrito**.

Ese mismo menú incluye **Cerrar sesión del PJN**, para usar al terminar. No
cierra si hay un lote de notas o descargas en curso: primero avisa, porque eso
sí se perdería.

### La sesión mientras se trabaja

El PJN cierra la sesión por inactividad, y eso corta un lote de notas o una
descarga por la mitad. Mientras se está trabajando, SuPJN+ renueva la sesión del
sitio cada pocos minutos para que no caduque.

Lo hace **solo si hay alguien trabajando**: actividad reciente en la pantalla, o
un trabajo en curso. Si la PC queda desatendida, el refresco se detiene y la
sesión caduca como siempre. Es deliberado: una sesión que no caduca nunca queda
a mano de cualquiera que se siente frente a la PC, que es exactamente lo que
se busca evitar.

## Cómo se usa

1. Ingresar al **Portal del PJN** (portalpjn.pjn.gov.ar) con el usuario propio.
   El indicador de SuPJN+ aparece apenas se ingresa: al pulsarlo conduce a la
   Consulta Web con SuPJN+ en funcionamiento. Con la sesión ya iniciada, también
   funciona al abrir directamente la Consulta Web (scw.pjn.gov.ar).
2. En la Consulta Web, **SuPJN+** se abre solo, ocupando toda la pantalla, y lee
   las causas y los favoritos en segundo plano. Minimizado, el indicador del
   extremo inferior derecho informa el avance; al pulsarlo se vuelve a abrir la
   ventana. Las listas se releen automáticamente cuando han pasado más de 10
   minutos, o al pulsar **Actualizar**.
3. Si quedó un lote de **dejar nota** sin terminar, la ventana lo informa al
   abrirse, para poder continuarlo o cancelarlo.
4. El botón **Recargar** de la barra azul vuelve a cargar la página del PJN e
   inicia SuPJN+ desde cero. Si hay trabajo en curso, solicita confirmación.

Si la sesión del PJN vence, la ventana lo advierte: corresponde recargar la
página, ingresar nuevamente si el sitio lo solicita y reintentar. Si el PJN no
tiene causas en una lista, la ventana lo informa en lugar de quedar en blanco.

### Si algo deja de funcionar

SuPJN+ depende de la estructura de la página del PJN. En **Acerca de** hay un
botón **Revisar el PJN**: examina, en segundo plano y sin dejar notas ni
modificar nada, las piezas que SuPJN+ necesita (la tabla de causas, el paginador,
el enlace para abrir, la cuenta del encabezado, la función de dejar nota, las
solapas del expediente, Escritos, Notificaciones, DEOX, la Guía judicial, la
tabla de actuaciones y un PDF) e informa cuáles siguen en
su lugar y cuáles cambiaron. Genera un informe para
copiar y remitir a quien mantiene SuPJN+: **no incluye números de causa ni datos
personales**.

Del lado del código, todo lo que depende de cómo está hecho el sitio (las
direcciones, los textos que se buscan, los nombres de los elementos y los campos
de los formularios) está reunido en un solo bloque al comienzo del archivo, **el
mapa del PJN**. Cuando el PJN cambia algo, ese es el único lugar que hay que
mirar, y la revisión comprueba esas piezas una por una.

### Registro de fallas de descarga

Cuando una descarga no se completa, el motivo se pierde apenas cambia el texto en
pantalla. Por eso SuPJN+ conserva las circunstancias de cada falla en **Acerca
de**: de qué expediente y de qué actuación se trata, a qué dirección se solicitó
el documento, qué respondió el servidor (código de estado, tipo de contenido y
tamaño) y cuántos intentos hicieron falta. Distingue tres situaciones:

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
el registro de fallas se guardan **únicamente en esta PC**, en el almacén de
Tampermonkey. No se envían a ningún servidor y no se escriben en el PJN. Lo que
se consulta en Escritos, Notificaciones, DEOX y la Guía no se guarda: dura
mientras la página esté abierta.

**Separado por cuenta del PJN.** El almacén de Tampermonkey pertenece al
navegador y no a la sesión del PJN, y además se comparte con las ventanas de
incógnito. Por eso SuPJN+ lee de la barra de usuario del sitio con qué cuenta se
ingresó y guarda los datos de cada cuenta por separado: **con una cuenta no se
accede a nada de la otra**, ni causas, ni etiquetas, ni anotaciones, ni el
registro de notas. La barra azul indica siempre con qué cuenta se está
trabajando. Si no puede identificarla, lo informa y no guarda nada ni muestra lo
guardado, para no mezclar datos de dos cuentas. Un lote de notas iniciado con
una cuenta no se retoma con otra.

La configuración de la ventana (columnas, anchos, orden) es común a todas las
cuentas, porque no constituye información de causas. El texto escrito en el
buscador no se guarda: puede ser el nombre de un cliente.

Las **anotaciones** son privadas y de trabajo: no se escriben en el expediente
y no guardan relación con dejar nota.

Hay dos formas de respaldar, en la solapa **Respaldo**:

- **Una carpeta designada por el usuario.** Con **Elegir carpeta**, SuPJN+ escribe
  allí un archivo por cuenta (`SuPJN+-datos-<cuenta>.supjn`) con las etiquetas,
  las anotaciones y el registro de notas, cada vez que algo cambia, y lo lee
  al abrir. Solo importa el archivo de la cuenta con la que se ingresó. Con la
  carpeta sincronizada (OneDrive o Drive) sirve para trabajar en dos PC.
  **Desde la 0.7.1 ese archivo va cifrado**, con la misma contraseña y el mismo
  formato que la copia manual (ver más abajo): en el uso diario no se pide
  nada. Sin contraseña puesta, SuPJN+ no escribe en la carpeta y lo avisa en la
  barra de la lista. En la otra PC hay que poner la misma contraseña una vez;
  hasta entonces SuPJN+ no lee ni sobrescribe el respaldo de la carpeta. Si se cambió
  la contraseña a propósito, hay un botón para reemplazar el respaldo de la
  carpeta con los datos de esa PC. El archivo en claro de las versiones
  anteriores (`.json`) se lee una vez y se borra cuando ya quedó escrito el
  cifrado; OneDrive o Drive pueden conservarlo en su papelera.
  Conviene una carpeta **ajena a la del programa**: si se trata de un repositorio
  de Git, SuPJN+ lo advierte, porque las anotaciones podrían terminar publicadas.
  Chrome solicita el permiso una vez y en ocasiones vuelve a solicitarlo: cuando
  ocurre, la ventana lo informa y ofrece un botón para otorgarlo de nuevo.
- **Una copia manual.** **Exportar** guarda el archivo donde se indique, también
  formato propio (`.supjn`) y cifrado con una contraseña del usuario. No se abre
  con un editor de texto, no lo leen los indexadores de escritorio ni de la
  nube, y sin la contraseña no se recupera en ninguna parte. La contraseña se
  pone una sola vez, en la solapa **Respaldo**, y queda en esa PC: allí no
  se la vuelve a pedir, ni para exportar ni para importar. Al importar el
  archivo en otra PC sí hay que escribirla. La ventana muestra la fecha de
  la última copia y la señala en rojo cuando han transcurrido más de 15 días.

  Lo que se protege es el archivo cuando sale de la PC, que es donde queda
  fuera de control: en una carpeta sincronizada, en un pendrive o adjunto en un
  correo. Lo guardado dentro de la PC sigue como está, detrás de la sesión de
  Windows.

Para trasladar los datos a otra PC, **Importar**. No elimina nada: suma las
etiquetas faltantes y de cada causa conserva lo más reciente (la anotación más
nueva si ambas copias tienen fecha, y los dos textos si alguna proviene de una
copia anterior sin fecha), más el resultado de dejar nota más reciente. Una
anotación **eliminada** en una PC no se elimina en la otra: si la otra todavía
la conserva, reaparece. Es deliberado, para no perder texto involuntariamente.

## Instalación

1. Contar con [Tampermonkey](https://www.tampermonkey.net/) instalado en Chrome o
   Edge.
2. Abrir el enlace de instalación:
   **[Instalar supjn-plus.user.js](https://raw.githubusercontent.com/Elzas85/SuPJNPLUS/main/supjn-plus.user.js)**
3. Tampermonkey muestra la pantalla de instalación. Pulsar *Instalar*.

**Importante:** SuPJN+ ya incorpora la totalidad de **PJN+** y de **NOTATOMIC**.
Corresponde desactivar esos dos en Tampermonkey: con los tres activos se duplican
los paneles y dos scripts operan sobre los mismos lápices.

Tampermonkey consulta ese mismo enlace y se **actualiza automáticamente** cuando
se publica una versión con número mayor.

Desde la versión 0.7.0, SuPJN+ también se carga en **escritos.pjn.gov.ar**,
**notif.pjn.gov.ar**, **deox.pjn.gov.ar** y **www.pjn.gov.ar/guia**. Ahí no
dibuja nada: solo atiende las consultas de la ventana cuando esta abre esas
aplicaciones en segundo plano. Si Tampermonkey pide confirmar los sitios nuevos
al actualizar, hay que aceptarlos.

## En el teléfono

La versión para Android es **SuPJN Lite**, un producto aparte, con su propia
carpeta, su propio número de versión y su propia documentación. No es una
versión de este userscript ni se arma a partir de él: SuPJN+ funciona en el
navegador de la computadora y SuPJN Lite en Android.

## Autor

Creado por **Ignacio Kinbaum** con Claude.
Contacto: estudiojuridicokinbaum@gmail.com

## Licencia

Copyleft: **GNU General Public License v3.0 o posterior** ([GPL-3.0-or-later](LICENSE)).

Software libre: se permite y se alienta su uso, copia, modificación y
distribución de forma gratuita, siempre que las obras derivadas conserven esta
misma licencia. Sin garantía.
