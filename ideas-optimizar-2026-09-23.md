# SuPJN+: propuestas para mejorar la velocidad

Fecha: 23 de septiembre de 2026
Sobre la versión 1.3.1

Se relevaron fuentes externas sobre las prácticas recomendadas actualmente para
programas de este tipo, y luego se verificó si cada recomendación resulta
efectivamente aplicable a SuPJN+. Algunas lo son, con ventajas considerables;
otras no son aplicables y se descartan más abajo, con su fundamento. **Ninguna
de las propuestas elimina funciones ni modifica el comportamiento de la
aplicación**: se trata de la misma aplicación, con el mismo comportamiento, a
mayor velocidad.

Ninguna de estas propuestas se implementó todavía. La decisión sobre cuáles
implementar corresponde al autor.

## Punto de partida: mediciones, no supuestos

Se construyó una prueba con causas similares a las del autor (número,
dependencia, carátula extensa con nombres y acentos, situación, fecha) y se
cronometraron las dos operaciones que la ventana realiza cada vez que redibuja
la lista: filtrar según el texto escrito en el buscador y ordenar por la columna
elegida.

| Causas en la lista | Duración actual de cada redibujo | Duración estimada con las mejoras |
|---|---|---|
| 500 | 21 milésimas de segundo | 2 |
| 2.000 | 87 | 7 |
| 6.000 | 265 | 22 |

Se trata de milésimas de segundo, por lo que con pocas causas la diferencia no es
perceptible. Con dos mil causas ya se advierte al escribir en el buscador, y con
seis mil la ventana se detiene un cuarto de segundo en cada pulsación de tecla.
La computadora en la que se realizó la medición puede diferir de la del autor,
pero la proporción (unas diez veces más rápido, y cincuenta veces en el
filtrado) se mantiene.

## Las cuatro mejoras de mayor rendimiento

### 1. Guardar el texto de búsqueda de cada causa ya preparado

**Situación actual:** cada vez que el usuario escribe en el buscador, el
programa vuelve a construir, causa por causa, un texto con el número, la
dependencia, la carátula, la situación, la fecha, las etiquetas y la anotación,
y le quita los acentos y las mayúsculas para poder comparar. Ese proceso se
repite completo en cada pulsación de tecla, aunque las causas no hayan cambiado.

**Propuesta:** prepararlo una sola vez por causa, al leer la lista, y volver a
prepararlo solo cuando esa causa cambia (una nota nueva, una etiqueta, una
relectura).

**Mejora estimada:** según la medición, entre 42 y 62 veces más rápido. Con
2.000 causas, de 10 milésimas a menos de una.

**Riesgo:** bajo, aunque requiere cuidado en un punto: si se asigna una etiqueta
o se escribe una anotación, ese texto guardado debe actualizarse; de lo
contrario, el buscador dejaría de encontrar la causa por la etiqueta nueva. Es
el único aspecto delicado y se cubre con pruebas.

### 2. Calcular una sola vez el criterio de orden

**Situación actual:** para ordenar la tabla, el programa compara las causas por
pares, y en **cada comparación** vuelve a calcular el valor de ambas. Ordenar
2.000 causas implica unas 22.000 comparaciones, es decir, 44.000 cálculos para
2.000 valores distintos.

**Propuesta:** calcular el valor una sola vez por causa y luego ordenar con ese
valor. Es un método antiguo y conocido (denominado transformación de Schwartz) y
produce exactamente el mismo orden.

**Mejora estimada:** según la medición, 11 veces más rápido. Con 2.000 causas,
de 77 milésimas a 7.

**Riesgo:** bajo. El orden resultante es idéntico; se comprueba con el banco,
que ya cuenta con pruebas de orden.

### 3. No ordenar la lista cuando el orden no se utiliza

**Situación actual:** al marcar **una sola** casilla de una causa, el programa
filtra y ordena la lista completa, únicamente para determinar si la casilla de
"seleccionar todas" debe quedar marcada. En ese caso, el orden no se utiliza.

**Propuesta:** separar ambas operaciones, filtrar por un lado y ordenar por
otro, y en ese caso limitarse a filtrar.

**Mejora estimada:** con 2.000 causas, marcar una casilla pasaría de 87
milésimas a 10. Es la diferencia entre una respuesta inmediata de la casilla y
una respuesta con una leve demora.

**Riesgo:** muy bajo.

### 4. Leer las bandejas por grupos de páginas en lugar de hacerlo en forma sucesiva

**Situación actual:** cuando SuPJN+ lee Escritos, Notificaciones o DEOX,
solicita al PJN una página de 100 elementos, espera la respuesta, solicita la
siguiente, espera, y así sucesivamente. Con el tope actual de 3.000 elementos,
se realizan hasta 30 intercambios, uno después del otro. Si cada uno demora un
tercio de segundo, el total asciende a diez segundos de espera.

**Propuesta:** después de la primera página, el PJN ya informa la cantidad total
de elementos, de modo que pueden solicitarse **tres páginas simultáneamente**,
sin modificar el resultado ni el orden.

**Mejora estimada:** alrededor de tres veces más rápido en las bandejas
extensas.

**Riesgo:** medio, motivo por el cual se ubica en último lugar, aunque sea la
mejora más visible. Requiere cuidado en dos aspectos: no solicitar al PJN más de
tres pedidos simultáneos (para no ser identificado como un proceso automatizado
ni provocar que el sistema interrumpa el acceso), y que el cartel de avance siga
contando correctamente. Si el PJN reacciona en forma adversa, el cambio se
revierte modificando una línea.

## Lo que ya funciona correctamente y no debe modificarse

Se deja constancia de estos puntos para que, si un tercero vuelve a revisar el
código, no los modifique con el propósito de "mejorarlos":

- **La tabla se dibuja de una sola vez**, construyendo el fragmento de página
  completo en lugar de agregar fila por fila. Es el método más rápido
  disponible, y además la ventana muestra como máximo 100 filas por página.
  Construirla fila por fila, si alguien lo propusiera, resultaría más lento.
- **El buscador ya aguarda un instante** después del último carácter antes de
  redibujar. Esa mejora ya está implementada.
- **Los eventos que registran la actividad del usuario en la pantalla** (para no
  perder la sesión) ya están configurados en su modalidad liviana, que no
  bloquea el desplazamiento.
- **El registro de la posición durante el desplazamiento de la pantalla** ya
  aguarda un breve instante en lugar de escribirse en cada píxel.
- **Hay un solo observador de cambios del PJN**, que se activa cuando es
  necesario y se desactiva automáticamente. Es exactamente lo que recomiendan
  las fuentes externas. El único ajuste posible se describe en el punto
  siguiente.

## Lo que se descartó, y por qué

- **Utilizar la propiedad del navegador que omite lo que no está a la vista**
  (es la novedad más difundida para listas extensas, y se informan mejoras de
  hasta siete veces). **No resulta aplicable en este caso**: la ventana muestra
  como máximo 100 filas por página, de modo que casi todo lo dibujado está a la
  vista. Además, la ventana retoma la misma posición de la pantalla al recargar,
  y esa propiedad no se adapta bien a ese comportamiento.
- **Convertir el programa en una extensión de Chrome.** Ya se descartó en la
  versión 1.2.1, con fundamentos comprobados, que siguen vigentes.
- **Dividir el programa en varios archivos.** Es una decisión que corresponde al
  autor, y no modifica la velocidad en absoluto.
- **Guardar los datos en una base de datos del navegador en lugar del almacén
  de Tampermonkey.** No es necesario: el volumen guardado es reducido y las
  escrituras son poco frecuentes.

## Una mejora menor adicional

El observador que aguarda a que el PJN termine de cambiar de página examina
**toda la página**, incluidos los cambios de texto, y ante cada aviso vuelve a
verificar si el cambio concluyó. Cuando el PJN reconstruye la tabla, emite
cientos de avisos consecutivos. Es posible observar solamente el fragmento que
contiene la tabla, y agrupar los avisos en lugar de procesarlos
individualmente. Es lo que recomiendan las guías externas: observar el elemento
contenedor más pequeño que sea estable, y utilizar el aviso como una señal
puntual, no como un registro continuo. La ganancia de tiempo es reducida, pero
no tiene costo y hace más uniforme el cambio de página.

## Propuesta

Si el autor lo aprueba, se implementarían **1, 2 y 3 en conjunto**: son las de
mayor rendimiento y menor riesgo, y se comprueban adecuadamente con el banco,
que ya cuenta con pruebas de filtro y de orden. Se agregarían pruebas nuevas que
midan el tiempo, para que el banco detecte automáticamente cualquier pérdida
futura de velocidad.

La **4** (lectura de las bandejas por grupos de páginas) quedaría para una etapa
posterior, sujeta a una decisión separada, porque es la única que modifica la
forma de interactuar con el PJN.

Todos estos cambios son internos: la única diferencia perceptible para el
usuario sería una respuesta más rápida de la ventana.

## Fuentes de las propuestas

- [MutationObserver sin sobresaltos: guía de rendimiento](https://josuesomarribas.com/blog/mutationobservers-without-panic-performance-guide)
- [MutationObserver: método observe(), MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe)
- [content-visibility: la nueva propiedad de CSS que mejora el rendimiento del dibujado, web.dev](https://web.dev/articles/content-visibility)
- [Transformación de Schwartz, Wikipedia](https://en.wikipedia.org/wiki/Schwartzian_transform)
- [Ordenamiento de un arreglo de JavaScript mediante el patrón de decorar, ordenar y retirar la decoración](https://gist.github.com/jrus/2145082)
- [Ejecución de tareas concurrentes con un límite, en JavaScript puro](https://maximorlov.com/parallel-tasks-with-pure-javascript/)
- [Control de concurrencia de fetch: limitación de solicitudes simultáneas](https://dev.to/recca0120/fetch-concurrency-control-limit-simultaneous-requests-with-p-limit-2p5h)
- [Cómo conviene que un script de usuario utilice MutationObserver](https://infosam.medium.com/javascript-how-your-tampermonkey-userscript-can-benefit-from-mutationobserver-7ac32035c5f)
