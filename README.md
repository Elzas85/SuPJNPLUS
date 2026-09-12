# SuPJN+

Userscript para **Tampermonkey** que reúne, en **una sola ventana**, la
[Consulta Web del Poder Judicial de la Nación (PJN)](https://scw.pjn.gov.ar/).

Incluye todo **PJN+** y le suma tus causas, tus favoritos, dejar nota y el
acceso a las demás aplicaciones del PJN, en la misma interfaz.

## Qué hace

Una ventana que **arranca minimizada** (queda la pastilla **SuPJN+** abajo a la
derecha) y mientras tanto **lee tus causas sola**, en segundo plano. Se puede
**mover** (arrastrando la barra azul), **agrandar** (desde la esquina de abajo
a la derecha), **acercar o alejar** (los botones − 100% + de la barra azul) y
**minimizar, maximizar o cerrar**. Si pasa algo mientras está minimizada, la
pastilla se pone **roja** y dice que hay un aviso.

### Mis causas y Favoritos

- Lee **las dos listas** del PJN (Relacionados y Favoritos), **en trámite y
  fuera de trámite**, en segundo plano y sin mover la página que estás viendo.
- Una sola tabla con **búsqueda** sobre todos los campos y **filtros** por
  fuero, situación, trámite, etiqueta y rango de fechas de la última actuación.
- **Ordena** por cualquier columna y las **columnas se mueven** (arrastrando el
  título), se **ensanchan** (arrastrando el borde) y se **ocultan**.
- **Orden PJN** las muestra en la misma secuencia que el sitio: al leer, SuPJN+
  le pide la lista con **"Ordenar Lista Por: FECHA"**, igual que se hace a mano.
- **Orden cronológico** ordena por última actuación. El PJN no publica la hora en
  ninguna pantalla, pero las resoluciones y los escritos van firmados y la firma
  la lleva: con **Averiguar la hora**, SuPJN+ baja el último documento con PDF de
  las causas que empatan en la fecha, le lee la hora a la firma y la muestra al
  lado de la fecha. Va de a cinco causas y hasta quince por vez, y se puede
  cortar. La hora **desempata solo cuando se la sabe de todas las causas de ese
  día**: con algunas sabidas y otras no, las sabidas saltarían en bloque y el
  orden saldría peor que el del PJN, así que en ese caso queda el del PJN.
- La tabla **entra siempre en el ancho de la ventana**: lo que le das a una
  columna se lo sacás a las otras. Se saca desde **Columnas ▾**.
- **Novedades:** el PJN no avisa nada, así que SuPJN+ guarda cómo estaba cada
  causa la última vez que la miraste y marca con **nuevo** las que cambiaron de
  fecha de última actuación o de situación. El PJN solo publica el día, así que
  dos movimientos del mismo día no se distinguen. El botón **Novedades** deja ver
  solo esas. Una causa deja de estar marcada
  cuando la abrís, o con **Marcar todo como visto**. La primera lectura es la
  línea de partida: ahí no hay novedades.
- **Etiquetas** con color y **apuntes** propios sobre cada causa (los apuntes son notas privadas de trabajo, no tienen nada que ver con dejar nota).
- Una columna **Partes** con el rol adelante: "Actora: A · Demandada: B". Cuando la carátula no tiene "C/", dice **Causante** en las sucesiones e **Imputado** en lo penal. Sale de la carátula del PJN, que es lo único que manda la lista.
- Una columna **Nota** que muestra el resultado de la última vez que dejaste
  nota en cada causa.

### Dejar nota

- Tiene **su propia solapa**, entre Favoritos y Descargas.
- En **todas** las causas que el PJN habilite hoy, o solo en las **que
  selecciones** en Mis causas o en Favoritos.
- Pide **confirmar** antes de empezar, y avisa si hoy ya dejaste nota en alguna
  de esas causas. Se hace en la lista de Relacionados del PJN; la página se
  recarga una vez por nota y el avance se ve en la ventana.
- Cada nota queda con su resultado: **dejada**, **a verificar** (el PJN no
  contestó y hay que mirarlo en el expediente) o **no salió**. Nunca se da por
  dejada una nota que el PJN no confirmó **para esa causa** (un incidente no
  cuenta por su expediente principal), y una nota ya dejada no se pisa después:
  si la incluís de nuevo en otra tanda y el PJN ya no le pone lápiz, lo dice y
  deja el resultado bueno.
- Si te vas de la lista de Relacionados, la tanda **queda en pausa** y te espera
  mientras esa pestaña siga abierta: sigue cuando volvés, tardes lo que tardes. Mientras corre, no se baja nada y no se abren causas, para que
  las recargas del PJN no corten una descarga.
- La tanda es **de una sola pestaña**: si abrís otra, o duplicás la que está
  trabajando, la segunda avisa que no la retoma y ninguna nota se deja dos
  veces. Una tanda de una pestaña que se cerró no se retoma sola.

### Bajar expedientes

- **Desde la lista:** seleccionás causas y bajás el expediente completo de cada
  una, o desde el menú **⋯** de una causa elegís **qué actuaciones** bajar.
- **Desde el expediente:** bajás todo o elegís actuaciones (por fecha, tipo o a
  mano). Cada causa sale en un PDF.
- **Una sola actuación:** el botón **Bajar** de cada fila, al lado de **Ver**,
  baja esa actuación sola, con nombre propio y sin tocar lo que tengas elegido.
- Las actuaciones van en **columnas de verdad** (Fecha, Tipo de actuación,
  Descripción / detalle y Fs.): se ordenan, se mueven, se ensanchan y se
  ocultan igual que las de la lista. **Orden del PJN** vuelve al orden en que
  las trae el sitio, que es el del PDF.
- Las descargas corren de a una en segundo plano: podés seguir trabajando. Van
  **de a cinco causas**, con un respiro entre bloque y bloque para no saturar al
  PJN, y el tope es de **quince esperando por vez**, contando lo que ya esté en
  Descargas: con más que eso, avisa y no arranca. **Cortar las descargas** corta
  también durante el respiro y saca lo que esté esperando que elijas actuaciones.

### El expediente por dentro

- **Partes siempre a la vista:** al abrir una causa, SuPJN+ lee la solapa
  Intervinientes del PJN en segundo plano y muestra las partes con su rol
  ("Actor: A, Demandado: B", "Imputado: C"), sin los letrados ni los demás
  intervinientes de acompañamiento.
- **Intervinientes, Causas vinculadas y Recursos** van como secciones de la
  ficha: se abren cuando las pedís y se leen en ese momento, recorriendo todas
  las páginas del PJN. Si el PJN corta la lectura a mitad de camino, lo dice: no
  muestra una lista incompleta como si estuviera completa, ni dice que no hay
  nada cuando lo que pasó es que la solapa no se llenó.
- Desde **Causas vinculadas** se abre cada causa en esta pestaña o en una nueva,
  y se baja su expediente completo, aunque no esté en tus listas.

### Las demás funciones del PJN

El botón **Funciones del PJN** de la barra azul lleva a las listas del PJN, a
Radicaciones, a la consulta pública y a las otras aplicaciones: **Escritos**
(presentar y ver presentados), **DEOX**, **Notificaciones**, **IWECS**,
**Autorizados** y **Mis eventos** del Portal. Por causa, el menú **⋯** ofrece
abrir en esta pestaña o en una nueva, **libro digital** y **presentar escrito**.

## Cómo se usa

1. Entrá a **scw.pjn.gov.ar** con tu usuario.
2. En el **Portal del PJN** (portalpjn.pjn.gov.ar) aparece la pastilla apenas
   entrás: tocala y te lleva a la Consulta Web con SuPJN+ andando.
3. **SuPJN+** arranca minimizado y lee tus causas y favoritos en segundo plano.
   La pastilla de abajo a la derecha muestra en qué anda; tocala para abrir la
   ventana. Las listas se vuelven a leer solas si pasaron más de 10 minutos, o
   cuando tocás **Actualizar**.
4. Si quedó una tanda de **dejar nota** a medias, ahí sí se abre sola, para que
   puedas seguirla o cortarla.
5. El botón **Recargar** de la barra azul vuelve a cargar la página del PJN y
   arranca SuPJN+ de cero. Si hay trabajo en curso, primero pide confirmar.

Si la sesión del PJN venció, la ventana lo avisa: recargá la página, volvé a
entrar si lo pide y probá de nuevo. Si el PJN no tiene causas en una lista, la
ventana lo dice en vez de quedarse en blanco.

### Si algo deja de andar

SuPJN+ depende de cómo está armada la página del PJN. En **Acerca de** hay un
botón **Revisar el PJN**: mira, en segundo plano y sin dejar notas ni cambiar
nada, las piezas que SuPJN+ necesita (la tabla de causas, el paginador, el
enlace para abrir, lo de dejar nota, la tabla de actuaciones y un PDF) y dice
cuáles siguen en su lugar y cuáles cambiaron. Deja un informe para copiar y
pasar a quien mantiene SuPJN+: **no trae números de causa ni datos tuyos**.

## Tus datos y el respaldo

Las listas leídas, las etiquetas, las anotaciones y el resultado de dejar nota
se guardan **solo en esta PC**, en el almacén de Tampermonkey. No se envían a
ningún servidor y no se escriben en el PJN.

**Separado por cuenta del PJN.** El almacén de Tampermonkey es del navegador, no
de la sesión del PJN, y además se comparte con las ventanas de incógnito. Por eso
SuPJN+ lee de la barra de usuario del PJN con qué cuenta entraste y guarda lo de
cada cuenta por separado: **con una cuenta no se ve nada de la otra**, ni causas,
ni etiquetas, ni apuntes, ni el registro de dejar nota. La barra azul muestra
siempre con qué cuenta está trabajando. Si no puede identificar la cuenta, lo
dice y no guarda nada ni muestra lo guardado, para no mezclar dos cuentas. Una
tanda de dejar nota empezada con una cuenta no se retoma con otra.

La configuración de la ventana (columnas, anchos, orden) es común a todas las
cuentas, porque no es información de causas. Lo que escribís en el buscador no se
guarda: puede ser el nombre de un cliente.

Los **apuntes** son notas privadas de trabajo: no tienen nada que ver con
dejar nota en el expediente.

Hay dos formas de respaldar, en **Etiquetas y respaldo**:

- **Una carpeta que elegís vos.** Tocá **Elegir carpeta** y SuPJN+ escribe ahí un
  archivo por cuenta (`SuPJN+-datos-<cuenta>.json`) con las etiquetas, los
  apuntes y el registro de dejar nota, cada vez que cambia algo, y lo lee al
  abrir. Solo importa el archivo de la cuenta con la que entraste. Con la carpeta
  sincronizada (OneDrive o Drive) sirve para trabajar en dos PC. Conviene una
  carpeta **aparte de la del programa**: si la carpeta es un repositorio de Git,
  SuPJN+ avisa, porque los apuntes podrían terminar publicados. Chrome pide el
  permiso una vez y a veces lo vuelve a pedir: si pasa, la ventana lo dice y hay
  un botón para volver a darlo.
- **Una copia a mano.** **Exportar** guarda el mismo archivo donde quieras. La
  ventana muestra la fecha de la última copia y la marca en rojo cuando pasaron
  más de 15 días.

Para llevar los datos a otra PC, **Importar**. No borra nada tuyo: suma las
etiquetas que falten y de cada causa deja lo más nuevo (el apunte más nuevo si
las dos copias tienen fecha, y los dos textos si alguna viene de una copia vieja
sin fecha), más el resultado de dejar nota más nuevo. Un apunte **borrado** en
una PC no se borra en la otra: si la otra todavía lo tiene, vuelve. Eso es a
propósito, para no perder texto sin querer.

## Instalación

1. Tené [Tampermonkey](https://www.tampermonkey.net/) instalado en Chrome o Edge.
2. Abrí el enlace de instalación:
   **[Instalar supjn-plus.user.js](https://raw.githubusercontent.com/Elzas85/SUPJNPLUS/main/supjn-plus.user.js)**
3. Tampermonkey muestra la pantalla de instalación. Tocá *Instalar*.

**Importante:** SuPJN+ ya trae todo **PJN+** y todo **NOTATOMIC**. Desactivá
esos dos en Tampermonkey: con los tres activos se duplican los paneles y hay
dos scripts apretando los mismos lápices.

Tampermonkey revisa ese mismo enlace y se **actualiza solo** cuando se publica
una versión con número mayor.

## Autor

Creado por **Ignacio Kinbaum** con Claude.
Contacto: estudiojuridicokinbaum@gmail.com

## Licencia

Copyleft: **GNU General Public License v3.0 o posterior** ([GPL-3.0-or-later](LICENSE)).

Software libre: se permite y se alienta su uso, copia, modificación y
distribución de forma gratuita, siempre que las obras derivadas conserven esta
misma licencia. Sin garantía.
