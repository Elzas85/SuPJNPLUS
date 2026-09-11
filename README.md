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
- La tabla **entra siempre en el ancho de la ventana**: lo que le das a una
  columna se lo sacás a las otras. Se saca desde **Columnas ▾**.
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
  dejada una nota que el PJN no confirmó.
- Si te vas de la lista de Relacionados, la tanda **queda en pausa** y sigue
  cuando volvés. Mientras corre, no se baja nada y no se abren causas, para que
  las recargas del PJN no corten una descarga.
- La tanda es **de una sola pestaña**: si abrís otra, o duplicás la que está
  trabajando, la segunda avisa que no la retoma y ninguna nota se deja dos
  veces. Una tanda parada hace más de tres minutos no se retoma sola.

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
- Las descargas corren de a una en segundo plano: podés seguir trabajando.

### Las demás funciones del PJN

El botón **Funciones del PJN** de la barra azul lleva a las listas del PJN, a
Radicaciones, a la consulta pública y a las otras aplicaciones: **Escritos**
(presentar y ver presentados), **DEOX**, **Notificaciones**, **IWECS**,
**Autorizados** y **Mis eventos** del Portal. Por causa, el menú **⋯** ofrece
abrir en esta pestaña o en una nueva, **libro digital** y **presentar escrito**.

## Cómo se usa

1. Entrá a **scw.pjn.gov.ar** con tu usuario.
2. **SuPJN+** arranca minimizado y lee tus causas y favoritos en segundo plano.
   La pastilla de abajo a la derecha muestra en qué anda; tocala para abrir la
   ventana. Las listas se vuelven a leer solas si pasaron más de 30 minutos, o
   cuando tocás **Actualizar**.
3. Si quedó una tanda de **dejar nota** a medias, ahí sí se abre sola, para que
   puedas seguirla o cortarla.
4. El botón **Recargar** de la barra azul vuelve a cargar la página del PJN y
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

Los **apuntes** son notas privadas de trabajo: no tienen nada que ver con
dejar nota en el expediente.

El respaldo es **manual**: en **Etiquetas y respaldo**, tocá **Exportar** y
guardá el archivo. La copia lleva las etiquetas, los apuntes y el registro de
dejar nota de cada causa. La ventana muestra la fecha de la última copia y la marca en
rojo cuando pasaron más de 15 días. Para llevarlas a otra PC, usá **Importar**:
no pisa nada, suma lo que falte.

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
