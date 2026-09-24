# SuPJN+: ideas para que ande más rápido

Fecha: 23 de septiembre de 2026
Sobre la versión 1.3.1

Busqué afuera qué se recomienda hoy para programas como este, y después fui a
ver si cada consejo aplica de verdad a SuPJN+. Algunos sí y con mucha ventaja,
otros no aplican y los descarto acá abajo con el motivo. **Nada de lo que
propongo saca funciones ni cambia lo que la aplicación hace**: es la misma
aplicación, haciendo lo mismo, más rápido.

Ninguna de estas cosas está hecha todavía. Usted decide cuáles hacemos.

## Lo primero: no adiviné, medí

Armé una prueba con causas parecidas a las suyas (número, dependencia,
carátula larga con nombres y acentos, situación, fecha) y cronometré las dos
cosas que la ventana hace cada vez que redibuja la lista: filtrar por lo que se
escribe en el buscador, y ordenar por la columna elegida.

| Causas en la lista | Cuánto tarda hoy cada redibujo | Cuánto tardaría |
|---|---|---|
| 500 | 21 milésimas de segundo | 2 |
| 2.000 | 87 | 7 |
| 6.000 | 265 | 22 |

Son milésimas de segundo, así que con pocas causas no se nota nada. Con dos mil
ya se siente al escribir en el buscador, y con seis mil la ventana se traba un
cuarto de segundo en cada tecleo. La computadora donde medí puede no ser igual
a la suya, pero la proporción (unas diez veces más rápido, y cincuenta veces en
el filtrado) se mantiene.

## Las cuatro cosas que más rinden

### 1. Guardar el texto de cada causa ya preparado para buscar

**Qué pasa hoy:** cada vez que usted escribe en el buscador, el programa arma
de nuevo, causa por causa, un texto con el número, la dependencia, la carátula,
la situación, la fecha, las etiquetas y la anotación, y le saca los acentos y
las mayúsculas para poder comparar. Eso se rehace entero en cada tecleo, aunque
las causas no hayan cambiado.

**Qué haría:** prepararlo una sola vez por causa, cuando se lee la lista, y
volver a prepararlo solo cuando esa causa cambia (una nota nueva, una etiqueta,
una relectura).

**Cuánto se gana:** medido, entre 42 y 62 veces más rápido. Con 2.000 causas,
de 10 milésimas a menos de una.

**Riesgo:** bajo, pero hay que ser prolijo en un punto: si se le pone una
etiqueta o se anota algo, ese texto guardado tiene que actualizarse, o el
buscador dejaría de encontrar por la etiqueta nueva. Es lo único delicado y se
cubre con pruebas.

### 2. Calcular una sola vez por qué se ordena

**Qué pasa hoy:** para ordenar la tabla, el programa compara las causas de a
pares, y en **cada comparación** vuelve a calcular el valor de las dos. Ordenar
2.000 causas son unas 22.000 comparaciones, o sea 44.000 cálculos para 2.000
valores distintos.

**Qué haría:** calcular el valor una sola vez por causa y después ordenar con
eso. Es un método viejo y conocido (lo llaman transformación de Schwartz) y da
exactamente el mismo orden.

**Cuánto se gana:** medido, 11 veces más rápido. Con 2.000 causas, de 77
milésimas a 7.

**Riesgo:** bajo. El orden resultante es idéntico; se comprueba con el banco,
que ya tiene pruebas de orden.

### 3. No ordenar la lista cuando nadie va a mirarla

**Qué pasa hoy:** al tildar **una sola** casilla de una causa, el programa
filtra y ordena la lista entera, nada más que para decidir si la casilla de
"seleccionar todas" tiene que quedar tildada. El orden ahí no lo usa nadie.

**Qué haría:** separar las dos cosas, filtrar por un lado y ordenar por otro, y
en ese caso filtrar nomás.

**Cuánto se gana:** con 2.000 causas, tildar una casilla pasaría de 87
milésimas a 10. Es la diferencia entre que la tilde responda al toque o con un
retardito.

**Riesgo:** muy bajo.

### 4. Leer las bandejas de a varias páginas en vez de una atrás de la otra

**Qué pasa hoy:** cuando SuPJN+ lee Escritos, Notificaciones o DEOX, pide al
PJN una página de 100 elementos, espera la respuesta, pide la siguiente, espera,
y así. Con el tope actual de 3.000 elementos son hasta 30 idas y vueltas, una
detrás de la otra. Si cada una tarda un tercio de segundo, son diez segundos de
puro esperar.

**Qué haría:** después de la primera página el PJN ya dice cuántos elementos hay
en total, así que se pueden pedir **de a tres a la vez**, sin cambiar el
resultado ni el orden.

**Cuánto se gana:** alrededor de tres veces más rápido en las bandejas largas.

**Riesgo:** medio, y por eso lo pongo último aunque sea el más vistoso. Hay que
ser cuidadoso de dos maneras: no pedirle al PJN más de tres cosas a la vez (no
queremos parecer un robot ni que el sistema nos corte), y que el cartelito de
avance siga contando bien. Si al PJN no le gusta, se vuelve atrás en una línea.

## Lo que ya está bien y no hay que tocar

Lo anoto para que, si alguien le vuelve a revisar el código, no se lo
"mejoren":

- **La tabla se dibuja de una sola vez**, armando todo el pedazo de página junta
  en lugar de ir agregando fila por fila. Es lo más rápido que hay, y además la
  ventana muestra como mucho 100 filas por página. Si alguien le propone
  armarla fila por fila, es más lento.
- **El buscador ya espera un instante** después de la última letra antes de
  redibujar. Eso ya está.
- **Los avisos de que usted está usando la pantalla** (para no perder la sesión)
  ya están puestos de la manera liviana, la que no traba el desplazamiento.
- **Lo que se anota mientras corre la pantalla** ya espera un momentito en vez
  de escribirse a cada píxel.
- **Hay un solo vigilante de cambios del PJN**, se enciende cuando hace falta y
  se apaga solo. La recomendación de afuera es exactamente esa. Lo único que se
  le puede afinar está en el punto siguiente.

## Lo que descarté, y por qué

- **"Usá la propiedad del navegador que se saltea lo que no está a la vista"**
  (es la novedad de moda para listas largas, y reportan mejoras de hasta siete
  veces). **No sirve acá**: la ventana muestra como mucho 100 filas por página,
  así que casi todo lo dibujado está a la vista. Además usted vuelve al mismo
  punto de la pantalla al recargar, y esa propiedad se lleva mal con eso.
- **"Convertilo en extensión de Chrome"**. Ya se descartó en la versión 1.2.1,
  con motivos comprobados, y sigue valiendo.
- **"Partilo en varios archivos"**. Decisión suya, y no cambia la velocidad en
  nada.
- **"Guardá los datos en una base del navegador en vez del almacén de
  Tampermonkey"**. No hace falta: lo que se guarda es chico y se escribe poco.

## Una cosa chica, de yapa

El vigilante que espera a que el PJN termine de cambiar de página mira **toda la
página**, incluidos los cambios de texto, y en cada avisito vuelve a revisar si
ya terminó. Cuando el PJN rearma la tabla manda cientos de avisos seguidos.
Se puede mirar solamente el pedazo donde está la tabla, y agrupar los avisos en
vez de atender uno por uno. Es lo que recomiendan las guías de afuera: mirar el
padre más chico que sea estable y que el aviso sea un timbre, no una cámara de
seguridad. Se gana poco tiempo, pero es gratis y hace el cambio de página más
parejo.

## Qué le propongo

Si me dice que sí, haría **1, 2 y 3 juntas**: son las que más rinden, son las
de menor riesgo y se comprueban bien con el banco, que ya tiene pruebas de
filtro y de orden. Agregaría pruebas nuevas que midan el tiempo, para que si
alguna vez se vuelve lento, el banco lo detecte solo.

La **4** (las bandejas de a varias páginas) la dejaría para después y decidida
aparte, porque es la única que le cambia el trato al PJN.

Todo esto es a puertas adentro: usted no vería ninguna diferencia salvo que la
ventana responde más rápido.

## De dónde salieron las ideas

- [MutationObservers Without Panic: A Performance Guide](https://josuesomarribas.com/blog/mutationobservers-without-panic-performance-guide)
- [MutationObserver: observe() method, MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe)
- [content-visibility: the new CSS property that boosts your rendering performance, web.dev](https://web.dev/articles/content-visibility)
- [Schwartzian transform, Wikipedia](https://en.wikipedia.org/wiki/Schwartzian_transform)
- [Sort a JavaScript array using a decorate-sort-undecorate pattern](https://gist.github.com/jrus/2145082)
- [Run Concurrent Tasks With a Limit Using Pure JavaScript](https://maximorlov.com/parallel-tasks-with-pure-javascript/)
- [Fetch Concurrency Control: Limit Simultaneous Requests](https://dev.to/recca0120/fetch-concurrency-control-limit-simultaneous-requests-with-p-limit-2p5h)
- [Cómo le conviene a un userscript usar MutationObserver](https://infosam.medium.com/javascript-how-your-tampermonkey-userscript-can-benefit-from-mutationobserver-7ac32035c5f)
