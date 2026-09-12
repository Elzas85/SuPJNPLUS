# SuPJN+

Userscript para **Tampermonkey** que reúne, en **una sola ventana**, la
[Consulta Web del Poder Judicial de la Nación (PJN)](https://scw.pjn.gov.ar/).

Incorpora la totalidad de **PJN+** y agrega las causas propias, los favoritos,
dejar nota y el acceso a las demás aplicaciones del PJN, en la misma interfaz.

## Qué hace

Una ventana que **se inicia minimizada** (queda el indicador **SuPJN+** en el
extremo inferior derecho) y mientras tanto **lee las causas por sí sola**, en
segundo plano. Se puede **desplazar** arrastrando la barra azul, **redimensionar**
desde la esquina inferior derecha, **acercar o alejar** con los botones − 100% +
de la barra azul, y **minimizar, maximizar o cerrar**. Si ocurre algo mientras
está minimizada, el indicador se pone **rojo** y señala que hay un aviso.

### Mis causas y Favoritos

- Lee **las dos listas** del PJN (Relacionados y Favoritos), **en trámite y
  fuera de trámite**, en segundo plano y sin alterar la página que se está
  viendo.
- Una sola tabla con **búsqueda** sobre todos los campos y **filtros** por
  fuero, situación, trámite, etiqueta y rango de fechas de la última actuación.
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
  anotaciones son notas privadas de trabajo y no guardan relación con dejar nota.
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
- Solicita **confirmación** antes de comenzar y advierte si ese día ya se dejó
  nota en alguna de esas causas. La operación se realiza en la lista de
  Relacionados del PJN; la página se recarga una vez por nota y el avance se
  informa en la ventana.
- Cada nota queda con su resultado: **dejada**, **a verificar** (el PJN no
  respondió y corresponde constatarlo en el expediente) o **no salió**. Nunca se
  da por dejada una nota que el PJN no confirmó **para esa causa**: un incidente
  no vale por su expediente principal. Una nota ya dejada no se sobrescribe: si
  la causa se incluye en otra tanda y el PJN ya no le asigna lápiz, se informa y
  se conserva el resultado válido.
- Si se abandona la lista de Relacionados, la tanda **queda en pausa** y espera
  mientras esa pestaña siga abierta: continúa al regresar, sin límite de tiempo.
  Mientras está en curso no se descarga nada ni se abren causas, para que las
  recargas del PJN no interrumpan una descarga.
- La tanda pertenece a **una sola pestaña**: si se abre otra, o se duplica la que
  está trabajando, la segunda informa que no la retoma y ninguna nota se deja dos
  veces. Una tanda de una pestaña cerrada no se retoma automáticamente.

### Descarga de expedientes

- **Desde la lista:** se seleccionan causas y se descarga el expediente completo
  de cada una; desde el menú **⋯** de una causa se elige **qué actuaciones**
  descargar.
- **Desde el expediente:** se descarga todo o se eligen actuaciones, por fecha,
  por tipo o una por una. Cada causa se entrega en un PDF.
- **Una sola actuación:** el botón **Descargar** de cada fila, junto a **Ver**,
  obtiene esa actuación aislada, con nombre propio y sin modificar la selección.
- Las actuaciones se presentan en **columnas** (Fecha, Tipo de actuación,
  Descripción / detalle y Fs.): se ordenan, se reubican, se ensanchan y se
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

### Las demás aplicaciones del PJN

El botón **Funciones del PJN** de la barra azul conduce a las listas del sitio, a
Radicaciones, a la consulta pública y a las restantes aplicaciones: **Escritos**
(presentar y consultar presentados), **DEOX**, **Notificaciones**, **IWECS**,
**Autorizados** y **Mis eventos** del Portal. Por causa, el menú **⋯** ofrece
abrir en esta pestaña o en una nueva, **libro digital** y **presentar escrito**.

## Cómo se usa

1. Ingresar a **scw.pjn.gov.ar** con el usuario propio.
2. En el **Portal del PJN** (portalpjn.pjn.gov.ar) el indicador aparece apenas se
   ingresa: al pulsarlo conduce a la Consulta Web con SuPJN+ en funcionamiento.
3. **SuPJN+** se inicia minimizado y lee las causas y los favoritos en segundo
   plano. El indicador del extremo inferior derecho informa el avance; al
   pulsarlo se abre la ventana. Las listas se releen automáticamente cuando han
   pasado más de 10 minutos, o al pulsar **Actualizar**.
4. Si quedó una tanda de **dejar nota** sin terminar, la ventana sí se despliega
   por sí sola, para poder continuarla o cancelarla.
5. El botón **Recargar** de la barra azul vuelve a cargar la página del PJN e
   inicia SuPJN+ desde cero. Si hay trabajo en curso, solicita confirmación.

Si la sesión del PJN vence, la ventana lo advierte: corresponde recargar la
página, ingresar nuevamente si el sitio lo solicita y reintentar. Si el PJN no
tiene causas en una lista, la ventana lo informa en lugar de quedar en blanco.

### Si algo deja de funcionar

SuPJN+ depende de la estructura de la página del PJN. En **Acerca de** hay un
botón **Revisar el PJN**: examina, en segundo plano y sin dejar notas ni
modificar nada, las piezas que SuPJN+ necesita (la tabla de causas, el paginador,
el enlace para abrir, la función de dejar nota, la tabla de actuaciones y un PDF)
e informa cuáles siguen en su lugar y cuáles cambiaron. Genera un informe para
copiar y remitir a quien mantiene SuPJN+: **no incluye números de causa ni datos
personales**.

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
el registro de fallas se guardan **únicamente en este equipo**, en el almacén de
Tampermonkey. No se envían a ningún servidor y no se escriben en el PJN.

**Separado por cuenta del PJN.** El almacén de Tampermonkey pertenece al
navegador y no a la sesión del PJN, y además se comparte con las ventanas de
incógnito. Por eso SuPJN+ lee de la barra de usuario del sitio con qué cuenta se
ingresó y guarda los datos de cada cuenta por separado: **con una cuenta no se
accede a nada de la otra**, ni causas, ni etiquetas, ni anotaciones, ni el
registro de dejar nota. La barra azul indica siempre con qué cuenta se está
trabajando. Si no puede identificarla, lo informa y no guarda nada ni muestra lo
guardado, para no mezclar datos de dos cuentas. Una tanda de dejar nota iniciada
con una cuenta no se retoma con otra.

La configuración de la ventana (columnas, anchos, orden) es común a todas las
cuentas, porque no constituye información de causas. El texto escrito en el
buscador no se guarda: puede ser el nombre de un cliente.

Las **anotaciones** son notas privadas de trabajo: no guardan relación con dejar
nota en el expediente.

Hay dos formas de respaldar, en la solapa **Respaldo**:

- **Una carpeta designada por el usuario.** Con **Elegir carpeta**, SuPJN+ escribe
  allí un archivo por cuenta (`SuPJN+-datos-<cuenta>.json`) con las etiquetas, las
  anotaciones y el registro de dejar nota, cada vez que algo cambia, y lo lee al
  abrir. Solo importa el archivo de la cuenta con la que se ingresó. Con la
  carpeta sincronizada (OneDrive o Drive) sirve para trabajar en dos equipos.
  Conviene una carpeta **ajena a la del programa**: si se trata de un repositorio
  de Git, SuPJN+ lo advierte, porque las anotaciones podrían terminar publicadas.
  Chrome solicita el permiso una vez y en ocasiones vuelve a solicitarlo: cuando
  ocurre, la ventana lo informa y ofrece un botón para otorgarlo de nuevo.
- **Una copia manual.** **Exportar** guarda el mismo archivo donde se indique. La
  ventana muestra la fecha de la última copia y la señala en rojo cuando han
  transcurrido más de 15 días.

Para trasladar los datos a otro equipo, **Importar**. No elimina nada: suma las
etiquetas faltantes y de cada causa conserva lo más reciente (la anotación más
nueva si ambas copias tienen fecha, y los dos textos si alguna proviene de una
copia anterior sin fecha), más el resultado de dejar nota más reciente. Una
anotación **eliminada** en un equipo no se elimina en el otro: si el otro todavía
la conserva, reaparece. Es deliberado, para no perder texto involuntariamente.

## Instalación

1. Contar con [Tampermonkey](https://www.tampermonkey.net/) instalado en Chrome o
   Edge.
2. Abrir el enlace de instalación:
   **[Instalar supjn-plus.user.js](https://raw.githubusercontent.com/Elzas85/SUPJNPLUS/main/supjn-plus.user.js)**
3. Tampermonkey muestra la pantalla de instalación. Pulsar *Instalar*.

**Importante:** SuPJN+ ya incorpora la totalidad de **PJN+** y de **NOTATOMIC**.
Corresponde desactivar esos dos en Tampermonkey: con los tres activos se duplican
los paneles y dos scripts operan sobre los mismos lápices.

Tampermonkey consulta ese mismo enlace y se **actualiza automáticamente** cuando
se publica una versión con número mayor.

## Autor

Creado por **Ignacio Kinbaum** con Claude.
Contacto: estudiojuridicokinbaum@gmail.com

## Licencia

Copyleft: **GNU General Public License v3.0 o posterior** ([GPL-3.0-or-later](LICENSE)).

Software libre: se permite y se alienta su uso, copia, modificación y
distribución de forma gratuita, siempre que las obras derivadas conserven esta
misma licencia. Sin garantía.
