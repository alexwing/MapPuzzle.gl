# Plan de nuevos juegos

Estado: propuesta, agosto de 2026. Documento de trabajo, no de producto.

## 1. La regla que manda sobre todo lo demás

MapPuzzle no guarda nada del usuario en el servidor. No hay registro, no hay
información personal y por tanto no hay cláusulas de almacenamiento que cumplir.
Todo lo que sabe la aplicación sobre quien juega vive en su dispositivo, y el
servidor solo sirve ficheros y lecturas de la base de datos.

Esto no es una limitación técnica que haya que sortear: es la característica que
hace la aplicación accesible y la política de privacidad publicada ya lo promete
por escrito, en `apps/game/public/doc/privacyEN.md`, donde dice que los datos de
progreso se almacenan únicamente en el dispositivo y que todo lo del servidor es
de solo lectura.

**Consecuencia directa sobre el catálogo:** cualquier mecánica que necesite que
dos jugadores compartan estado, o que exista una clasificación global, queda
fuera. Lo único que puede salir del dispositivo es **una URL autogenerada** que
el propio jugador decide compartir, con el reto codificado dentro.

Esto no empobrece el catálogo tanto como parece. El reto diario tipo Wordle
funciona precisamente así: el desafío se deriva de la fecha, igual para todos sin
que nadie lo coordine, y el resultado se comparte como texto. Cero escrituras.

## 2. Dónde se guarda el estado hoy, y qué conviene cambiar

Hoy la aplicación usa cookies a través de `react-simple-cookie-store`:

| Cookie | Qué guarda |
| --- | --- |
| `theme` | claro u oscuro |
| `puzzleLanguage` | idioma del panel de Wikipedia |
| `<nombre><idPuzzle>` | tiempo de juego, una cookie **por puzzle jugado** |

Hay un problema medible antes de construir nada encima:

**Las cookies viajan.** Una cookie se envía al servidor en **cada** petición
HTTP: en el `index.html`, en cada `.woff2`, en cada bandera y en los geojson, que
llegan a 4,3 MB. Con una cookie de tiempo por puzzle y 70 puzzles, un jugador
veterano acaba adjuntando decenas de cookies a cada descarga. Es justo lo
contrario de lo que persigue la filosofía del proyecto: es el único
almacenamiento de navegador que sí sale del dispositivo.

La caducidad, en cambio, no es problema: `ConfigService.cookieDays` sale de
`VITE_COOKIE_DAYS`, definida por modo en `apps/game/environments/`, y la build de
producción usa 256 días. Una racha diaria sobrevive de sobra.

**Propuesta:** el estado de los juegos nuevos va a `localStorage`, que nunca se
envía al servidor y ofrece unos 5 MB en lugar de 4 KB. Las cookies actuales se
quedan como están, o se migran cuando toque. Esto refuerza la política de
privacidad en vez de tensarla, y no cambia el discurso de cara al usuario: sigue
siendo almacenamiento local, funcional, sin datos personales y sin banner de
consentimiento.

Estructura sugerida, una sola clave por juego:

```
mp.game.<juego>.v1 = { mejorPuntuacion, racha, ultimoDiaJugado, ajustes }
```

Versionada en el nombre para poder cambiar el formato sin romper a nadie.

## 3. Qué datos hay, verificado

| Activo | Volumen | Estado |
| --- | --- | --- |
| Mapas con geometría | 70 mapas, 2.371 piezas | listo |
| Piezas con artículo de Wikipedia | 1.871 | listo |
| Traducciones de nombres | 73.249 filas, 40 idiomas activos, 12 RTL | listo |
| Mapas con bandera por pieza | 49 de 70, hasta 1024 px | listo |
| Banderas nacionales | 269 | listo |
| Países con ISO y región | 251, 6 regiones, 19 subregiones | listo |
| Silueta SVG aislada de cualquier pieza | `pieceSilhouette`, en runtime | listo |
| Extracto, imagen y traducciones de Wikipedia | `wikiService`, con `origin=*` | listo, sin juego asignado (ver punto 7) |
| Centroide geográfico, superficie, adyacencia | — | **hay que calcularlo** |

Dos precisiones que evitan construir sobre premisas falsas:

- **`custom_centroids` no son coordenadas, pero se convierten en coordenadas.**
  Sus columnas `left` y `top` son porcentajes CSS que `CursorCore` aplica como
  `marginLeft` y `marginTop` a la silueta para desplazarla respecto al cursor:
  dicen en qué punto de su caja se agarra la pieza. Como esa caja tiene una
  extensión geográfica conocida (`pieceBox`, en metros EPSG:3857), el offset es
  invertible. Ver el punto 4, donde está la fórmula y su validación.
- **Ningún mapa lleva ya `longitude` ni `latitude` por pieza**, aunque el tipo
  `PieceProps` las declare obligatorias. Hoy no rompe nada, porque nadie las lee
  —todo usa el `view_state` del puzzle—, pero quien construya un juego de
  distancias confiando en el tipo se encontrará `undefined`.

## 4. Paso 0: el pase de enriquecimiento

Es el cuello de botella de casi todo el catálogo, y se hace una sola vez.
`@turf/turf` ya es dependencia directa e incluye todo lo necesario: `area`,
`centroid`, `center-of-mass`, `distance`, `bearing` y `boolean-intersects`.

Un trabajo nuevo en el editor recorre los 70 geojson y escribe tres cosas:

**Centro de la pieza** — aquí el dato curado a mano gana al cálculo, y conviene
usarlo. El punto que ya eligió una persona en el editor es *el mismo punto por el
que se agarra la pieza al arrastrarla*, así que un juego de puntería que use ese
punto pide exactamente lo que el jugador ya tiene interiorizado de jugar al
puzzle. Además hay 1.560 piezas ajustadas a mano, de 1.878 filas.

La conversión, dado el `bbox` de la pieza en EPSG:3857:

```
fracción horizontal = -left / 100
fracción vertical   = (-top / 100) · (anchoCaja / altoCaja)

x = bbox.minX + fracción horizontal · anchoCaja
y = bbox.maxY - fracción vertical  · altoCaja
```

El factor de proporción en la vertical no es un apaño: los porcentajes de margen
en CSS se resuelven contra el **ancho** del contenedor en ambos ejes, así que un
`margin-top: -50%` desplaza medio ancho, no media altura.

Verificado sobre las 1.850 filas utilizables, comprobando si el punto cae dentro
del polígono de su pieza:

| Método | Dentro de la pieza |
| --- | --- |
| Punto curado, invertido con la fórmula | **98,0 %** |
| `centroid` del polígono mayor | 97,5 % |
| `representative_point` del polígono mayor | 100 % por construcción |

Los **37 puntos que caen fuera son, los 37, piezas multiparte**: Países Bajos con
12 partes, Chile con 31, Hawái con 7, Okinawa con 114, Nenetsia con 203. Ninguna
pieza compacta falla. Y en un archipiélago, un punto entre las islas es
justamente el centro lógico que se busca, no un error.

Donde más se separan los dos métodos es donde el algoritmo se equivoca: mediana
de 18 km, pero 3.082 km en Tierra del Fuego con su reclamación antártica, 1.489
en Malasia, 805 en Canadá. En todos esos el punto humano es el sensato.

**Estrategia:** usar el punto curado; si la fila no existe o es el valor por
defecto (−50, −50), calcular `representative_point` del polígono mayor, que
garantiza caer dentro. Cubre las 811 piezas restantes. Dos detalles de
implementación: las 18 piezas que cruzan el antimeridiano necesitan el mismo
desenrollado de longitudes que ya hace `pieceSilhouette`, o su caja abarca el
planeta; y 10 filas apuntan a piezas que ya no existen, de mapas regenerados con
otros `cartodb_id`, así que conviene limpiarlas.

**Superficie** — `area` en metros cuadrados, que trabaja sobre el elipsoide y no
sufre la distorsión de Mercator. Sin esto, comparar tamaños daría que Groenlandia
gana a África.

**Adyacencia** — qué piezas se tocan, con `boolean-intersects` entre pares. Es
cuadrático, pero filtrando antes por solapamiento de `bbox` baja a nada: el mapa
más grande tiene 256 piezas. Se guarda como tabla de pares.

Tablas nuevas, en la misma línea que las existentes:

```
piece_geo   (id, cartodb_id, lat, lon, area_m2)
piece_edges (id, cartodb_id_a, cartodb_id_b)
```

De paso se corrige `PieceProps` para que declare lo que de verdad hay.

## 5. La arquitectura: un motor, no ocho juegos

Al poner en común las dos listas de propuestas aparece que **todas son el mismo
juego**: dar una pista y pedir una respuesta.

| Pistas disponibles | Respuestas disponibles |
| --- | --- |
| Silueta aislada | Clic en el mapa |
| Bandera | Arrastrar la pieza |
| Nombre en otro idioma | Elegir entre opciones |
| Distancia y rumbo respecto a un intento | Escribir el nombre |

Cuatro pistas por cuatro respuestas son dieciséis combinaciones. Construir un
motor `pista → respuesta` en lugar de ocho juegos convierte cada idea nueva en un
fichero de configuración.

El motor debería heredar lo que FlagsQuiz ya resolvió, en vez de inventarlo otra
vez: seis opciones por pregunta (`ConfigService.flagQuizQuestions`), la respuesta
señalada sobre el mapa recoloreando la pieza (`CORRECT_COLOR`, `WRONG_COLOR`,
`SELECTED_COLOR`), el barajado con `shuffle` de `packages/core/src/lib/data.ts` y
el recuento de aciertos y fallos.

Encima se aplican **modificadores**, que no son juegos sino envoltorios:

- **Contrarreloj:** 60 segundos, cada acierto suma tiempo.
- **Diario:** el reto se deriva de la fecha, idéntico para todos, sin servidor.
- **Sin límite:** práctica, sin puntuación.
- **Compartir:** el resultado se codifica en la URL, estilo Wordle.

### El generador de distractores

El problema oculto de cualquier juego de opciones es que las alternativas al azar
se descartan solas y el juego se vuelve trivial. No es hipotético: FlagsQuiz elige
hoy sus seis opciones con `Math.random()` uniforme sobre las piezas del puzzle, así
que en un mapa mundial una pregunta puede salir con cinco distractores de cinco
continentes distintos. Lo que sigue **mejora también el juego que ya existe**.

Aquí hay dos generadores de distractores buenos, gratis:

- la tabla `countries`, con sus 6 regiones y 19 subregiones;
- el grafo de adyacencia del paso 0.

Los vecinos y los hermanos de subregión son exactamente las opciones que cuesta
descartar. Eso convierte la adyacencia en **infraestructura de dificultad para
todo el catálogo**: fácil coge distractores de otro continente, difícil coge
vecinos. Un solo parámetro, todos los modos.

## 6. Catálogo de juegos

Ocho juegos. El esfuerzo es relativo y cuenta con que el motor del punto 5 ya
exista; el primero que se construya carga además con el motor.

| Juego | Pista | Respuesta | Necesita del paso 0 | Esfuerzo |
| --- | --- | --- | --- | --- |
| Siluetas a ciegas | silueta aislada | opciones o escribir | nada | bajo |
| Políglota | nombre en otro idioma | clic en mapa u opciones | nada | bajo |
| Bandera y forma | bandera subnacional | elegir silueta | nada | bajo |
| Mayor o menor | dos piezas | elegir la mayor | superficie | bajo |
| El impostor | cuatro elementos | señalar el intruso | adyacencia o subregión | medio |
| Francotirador | nombre | clic en el punto exacto | centro de pieza | medio |
| Cadena de fronteras | región anterior | elegir una que limite | adyacencia | medio |
| Cadena políglota | igual, en otro idioma | elegir una que limite | adyacencia | medio |

---

### 6.1 Siluetas a ciegas

**Qué ve el jugador.** Una silueta sola sobre fondo limpio, sin mapa, sin
fronteras vecinas y sin rótulos. Escalada para llenar el marco, de modo que el
tamaño real no delate nada: Rusia y Luxemburgo ocupan lo mismo en pantalla.

**Ronda.** Diez piezas de un mapa elegido. Se responde entre seis opciones, o
escribiendo el nombre en el modo difícil. Tras cada respuesta la silueta se
recoloca sobre el mapa real, en su sitio, un segundo: es la parte que enseña.

**Puntuación.** Un punto por acierto; en modo escritura, dos. Sin penalización
por fallar, que desincentiva arriesgar y este juego vive de arriesgar.

**Dificultad.** La da el generador de distractores: en fácil, opciones de otra
subregión; en difícil, vecinas, que comparten forma y contexto. Un segundo eje
opcional es rotar la silueta, que sube muchísimo la dificultad porque el jugador
reconoce orientaciones, no formas.

**Datos.** Solo geometría. `pieceSilhouette` ya devuelve el path aislado y su
caja, y es lo que dibuja la lista de piezas: aquí no hay que escribir geometría.

**Casos límite.** Las piezas multiparte se dibujan enteras, y algunas quedan
diminutas dentro de su caja: Alaska y las Aleutianas hacen que el resto de
Estados Unidos ocupe un cuarto del marco. Conviene decidir si se recorta al
polígono mayor o se acepta. Y hay piezas cuya silueta es un rectángulo casi
exacto —muchos municipios y varios estados del oeste americano— que son
irreconocibles por definición: o se excluyen, o se aceptan como las difíciles.

**Esfuerzo:** bajo. Es el candidato natural para estrenar el motor.

---

### 6.2 Políglota

**Qué ve el jugador.** El nombre de una región escrito en un idioma que
probablemente no sepa leer: «Бавария», «バイエルン», «بافاريا», «Bæjaraland».
Debajo, el nombre del idioma, o no, según dificultad.

**Ronda.** Diez nombres. Se responde haciendo clic en el mapa, o eligiendo entre
seis banderas cuando el mapa tiene banderas por pieza.

**Puntuación.** Un punto por acierto. Un segundo intento vale medio punto, porque
aquí fallar y volver a mirar el nombre es parte de aprender a leerlo.

**Dificultad.** No la marcan los distractores sino **el idioma elegido**, y eso
se gradúa solo: los que comparten alfabeto con el del jugador son fáciles —un
hispanohablante lee «Bayern» sin esfuerzo— y los de otro sistema de escritura son
duros. Merece la pena clasificar los 40 idiomas activos por alfabeto una sola vez
y usar esa clasificación como nivel.

**Datos.** Las 73.249 traducciones y los 40 idiomas activos, ya en la base. Cero
cálculo previo. Es el juego que mejor aprovecha lo que ya tienes, y el que ningún
competidor puede copiar en una tarde.

**Casos límite.** Los 12 idiomas RTL necesitan `dir="rtl"` en el elemento del
nombre, no en toda la página. Hay traducciones idénticas al nombre original —el
italiano de muchas regiones españolas— que como pista no valen: hay que descartar
las que coincidan con el nombre de la pieza. Y la cobertura no es uniforme:
conviene comprobar cuántos idiomas tiene cada pieza antes de sortearla.

**Esfuerzo:** bajo.

---

### 6.3 Bandera y forma

**Qué ve el jugador.** Una bandera subnacional grande —de provincia, de estado,
de condado, no de país— y seis siluetas debajo.

**Ronda.** Diez banderas de un mismo mapa.

**Puntuación.** Un punto por acierto.

**Dificultad.** Distractores por vecindad. En banderas provinciales funciona
especialmente bien porque las de regiones vecinas comparten heráldica: las
diputaciones andaluzas o los cantones suizos se parecen entre sí mucho más de lo
que se parecen a una bandera lejana.

**Datos.** Los 49 mapas con bandera por pieza, y las siluetas. Nada que calcular.

**Casos límite.** 21 de los 70 mapas no tienen banderas y quedan fuera del juego;
el selector debe ocultarlos, no ofrecerlos y fallar. Y conviene servir la versión
de 128 px, no la de 1024, o cada ronda descarga varios megabytes.

**Esfuerzo:** bajo. Es el complemento natural de FlagsQuiz: aquel pregunta la
bandera de un nombre, este pregunta la forma de una bandera.

---

### 6.4 Mayor o menor

**Qué ve el jugador.** Dos siluetas, una a cada lado, cada una con su nombre.
Ambas dibujadas **a la misma escala**, no ajustadas a su marco, porque aquí el
tamaño relativo es justamente la pregunta.

**Ronda.** Cadena al estilo «higher or lower»: se acierta, la ganadora se queda y
se enfrenta a otra. La partida termina al primer fallo y el marcador es la racha.

**Puntuación.** La longitud de la racha. Encaja perfecto con el modificador de
compartir por URL: «he encadenado 14».

**Dificultad.** Sale sola de la diferencia de superficie: si la relación entre
las dos áreas está cerca de 1, es una moneda al aire. Se propone sortear pares
con una relación mínima que se estrecha según avanza la racha —empezar en 2 a 1 y
llegar a 1,1 a 1— para que el juego se endurezca sin trucos.

**Datos.** La superficie del paso 0, y nada más.

**Gracia del juego.** Cruzar mapas distintos. Comparar dos provincias españolas es
memoria; comparar Baviera con Andalucía, o un estado de Estados Unidos con una
prefectura japonesa, es lo que un atlas no permite y aquí sale gratis, porque las
2.371 piezas viven en el mismo sistema.

**Casos límite.** El área debe calcularse sobre el elipsoide, nunca sobre
coordenadas proyectadas, o Groenlandia gana a África y el juego pierde toda
credibilidad. Y las piezas con reclamaciones territoriales —Tierra del Fuego con
su sector antártico— tienen un área defendible pero polémica: o se excluyen, o se
acepta y se documenta.

**Esfuerzo:** bajo.

---

### 6.5 El impostor

**Qué ve el jugador.** Cuatro elementos del mismo tipo —cuatro banderas, cuatro
siluetas o cuatro nombres—. Tres pertenecen a un mismo grupo y el cuarto no.

**Ronda.** Ocho rondas. Se señala el intruso. Al resolver se dice cuál era el
grupo, que es la información que enseña: «tres son provincias andaluzas».

**Puntuación.** Un punto por acierto, con bonificación por rapidez si se juega
con el modificador de contrarreloj.

**Dificultad.** Es el juego que más depende del generador de distractores y por
eso el que mejor lo aprovecha. El grupo puede definirse por subregión —de la
tabla `countries`— o por vecindad en el grafo. Cuanto más cerca esté el intruso
del grupo, más cuesta: uno del país de al lado es dificilísimo, uno de otro
continente es un regalo.

**Datos.** Adyacencia o subregión, más el tipo de elemento que se muestre.

**Casos límite.** Es el que peor envejece si los conjuntos se repiten, porque se
memorizan: hay que barajar con semilla derivada de la fecha y llevar registro
local de los conjuntos ya vistos para no repetirlos en la misma sesión. Y hay que
comprobar que el intruso no pertenezca también al grupo por otra vía, o habrá dos
respuestas válidas y el jugador tendrá razón al quejarse.

**Esfuerzo:** medio.

---

### 6.6 Francotirador

**Qué ve el jugador.** El mapa con las fronteras muy tenues o directamente
ocultas, y un nombre. Hace clic donde cree que está el centro de esa región.

**Ronda.** Cinco disparos. Tras cada uno se traza la línea entre el clic y el
punto real, con los kilómetros de error.

**Puntuación.** Decreciente con la distancia y **relativa al tamaño del mapa**:
errar 50 km en un mapa de municipios sevillanos es malísimo y en el mapamundi es
excelente. Sin normalizar por la extensión del mapa, el juego solo es jugable en
uno de los dos extremos.

**Dificultad.** La da el mapa elegido y cuánto se muestren las fronteras.

**Datos.** El centro de pieza del punto 4: **el punto curado, no un centroide
calculado**. Es deliberado, y es lo que hace bueno al juego: el sitio donde hay
que hacer clic es el mismo por el que se agarra la pieza al arrastrarla en el
puzzle clásico, así que lo aprendido en un juego sirve en el otro.

**Casos límite.** El error se mide en kilómetros sobre el elipsoide con
`distance`, nunca en píxeles: en Mercator, el mismo desvío en pantalla son unos
300 km en Kenia y 80 en Groenlandia. Y en las piezas multiparte el punto correcto
puede caer en el mar —Hawái, Okinawa, Países Bajos—, lo cual es correcto pero hay
que explicarlo al mostrar el resultado o parecerá un error.

**Esfuerzo:** medio.

---

### 6.7 Cadena de fronteras

**Qué ve el jugador.** Una región marcada en el mapa. Debe elegir otra que limite
con ella. La elegida se marca y desde ella sigue la cadena.

**Ronda.** Hasta que no se pueda seguir o se falle. El marcador es la longitud de
la cadena, y el mapa se va coloreando: al final queda dibujado el recorrido, que
es lo satisfactorio del juego.

**Puntuación.** Longitud de la cadena. Compartible por URL.

**Dificultad.** Prohibir repetir región obliga a pensar por dónde no meterse, que
es donde está la gracia: se puede quedar uno encerrado en una península.

**Datos.** El grafo de adyacencia, y solo eso.

**Casos límite.** Estos hay que resolverlos antes de empezar, porque afectan al
diseño y no solo al código:

- **Las islas no tocan nada.** Un mapa de Filipinas o de Indonesia apenas tiene
  aristas. O se excluyen esos mapas, o se define la vecindad también por
  proximidad —los vecinos más cercanos por debajo de cierta distancia—, lo cual
  es defendible pero hay que decidirlo.
- **Los enclaves y los callejones sin salida** dejan al jugador sin jugada legal
  sin que sea culpa suya. El juego debe detectar que no quedan vecinos libres y
  terminar la partida como victoria, no como fallo.
- **La adyacencia por contacto es frágil** en geometrías simplificadas: dos
  regiones que se tocan en el mundo real pueden quedar separadas por unos metros
  después de simplificar. Conviene calcular con una tolerancia pequeña y revisar
  a mano los mapas más jugados.

**Esfuerzo:** medio.

---

### 6.8 Cadena políglota

Igual que el anterior, pero cada región de la cadena se muestra en un idioma
distinto: hay que reconocerla primero y encadenarla después. Es la combinación de
6.2 y 6.7, hereda sus dos conjuntos de casos límite y no añade ninguno propio.
Solo tiene sentido cuando los dos originales funcionen; se apunta para no perder
la idea, no como trabajo de la primera tanda.

**Esfuerzo:** bajo, si los dos anteriores existen.

## 7. Fuera del catálogo, y por qué

- **Clasificaciones globales y multijugador.** Necesitan escrituras en servidor y
  estado compartido. Chocan de frente con la regla del punto 1.
- **Cualquier cosa con cuentas de usuario.** Igual.
- **Marcas personales:** sí, pero locales. La mejor puntuación vive en el
  dispositivo, y compartirla es cosa de la URL generada.
- **Geo-Misterio**, la propuesta de adivinar a partir de un extracto de
  Wikipedia: descartada por decisión de producto. La capacidad técnica sigue
  intacta por si se retoma —`wikiService` ya trae extractos, imagen del artículo
  y traducciones con `origin=*`, sin backend— y el trabajo pendiente sería
  censurar el nombre en el texto, para lo cual las 73.249 traducciones sirven de
  lista de términos a tapar en 40 idiomas.

Un aviso relacionado: el endpoint `POST /api/query` del backend local ejecuta SQL
arbitrario con CORS abierto. Hoy solo existe en desarrollo y en producción manda
el gateway PHP, que es de solo lectura y filtra por `SELECT`. Si algún día se
abriera cualquier escritura en producción, eso hay que cerrarlo **antes**.

## 8. Orden de trabajo

1. **Enriquecimiento** (paso 0): centroide, superficie y adyacencia a la base,
   tipos corregidos. Desbloquea cinco juegos.
2. **Almacenamiento local**: helper sobre `localStorage` con claves versionadas,
   y decidir qué pasa con `VITE_COOKIE_DAYS`, hoy en un día.
3. **Motor pista → respuesta**, validado con dos combinaciones deliberadamente
   distintas: silueta → clic en el mapa, y nombre traducido → opciones. Si el
   motor aguanta esas dos, aguanta el resto.
4. **Primer juego completo publicado**: Siluetas a ciegas, por ser el más barato,
   con el modificador de contrarreloj.
5. **Reto diario** encima del motor, con resultado compartible por URL.
6. El resto del catálogo, por orden de esfuerzo.

## 9. Costes recurrentes que no se ven en la primera versión

- **Interfaz en siete idiomas.** Hay `de`, `el`, `en`, `es`, `fr`, `it` y `pt`.
  Cada juego nuevo trae textos que hay que traducir siete veces.
- **Sitemap.** Cada modo nuevo debería generar sus entradas, como ya ocurre con
  `?map=` y `?flagQuiz=`.
- **Peso del cliente.** El bundle ya avisa de trozos por encima de 500 KB. Los
  juegos nuevos deberían entrar por carga diferida, como ya hacen `FlagQuiz` y
  `Donate`.
- **Mantenimiento del enriquecimiento.** Cada mapa nuevo tiene que pasar por el
  paso 0, o quedará fuera de la mitad del catálogo.
