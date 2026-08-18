**MapPuzzle.xyz** es una plataforma que te sumerge en horas de entretenimiento a través de banderas, mapas y rompecabezas de diversas partes del mundo. El juego está diseñado para jugadores de todas las edades y niveles de habilidad, y ofrece una experiencia educativa completa y enriquecedora.

## Juegos Disponibles

Actualmente, se ofrecen dos juegos diferentes: Rompecabezas Geográficos y Adivina la Bandera.

### Rompecabezas Geográficos
- Selecciona entre los puzzles disponibles representando distintas regiones del mundo, incluyendo países, estados o provincias.
- En la interfaz, el mapa se presenta a la derecha con sus bordes, mientras que a la izquierda se encuentra el listado de elementos con sus respectivas siluetas. Tu tarea es ubicar cada pieza en su lugar correspondiente.
- Además, cada vez que se coloca una pieza en el mapa, los jugadores pueden acceder a datos de Wikipedia sobre el lugar que están explorando. Esto les permite obtener información adicional sobre la geografía, historia, cultura y otras áreas relacionadas con el lugar, ayudándoles a aprender más sobre el mundo que les rodea.

### Adivina la Bandera
- Observa una bandera ondeando y la silueta del país en la parte derecha.
- Elige entre seis opciones disponibles para identificar correctamente el país al que pertenece.
- Una vez terminado el juego, puedes explorar el mapa y obtener información adicional sobre el país obtenido de Wikipedia.

## Modos de Juego

Ambos juegos ofrecen un seguimiento detallado de tus aciertos, la lista de elementos restantes, los errores cometidos y el tiempo dedicado a la actividad.

Los jugadores pueden elegir el mapa en el que quieren jugar, filtrando por continente y región. El sitio entero está además en siete idiomas, cada uno con su propia dirección. 
Una de las características interesantes del juego es que permite a los jugadores traducir los nombres de las piezas del rompecabezas a diferentes idiomas. Esto les permite aprender los nombres de los lugares en diferentes idiomas, enriqueciendo su experiencia de juego y ayudándoles a desarrollar sus habilidades lingüísticas.

## MapPuzzle.xyz como una aplicación nativa

Ahora puedes instalar MapPuzzle.xyz como una Aplicación Web Progresiva (PWA). Una PWA ofrece una experiencia de aplicación nativa que se instala directamente desde tu navegador, sin necesidad de descargarla desde una tienda de aplicaciones o usar un instalador.

Para su mejor integración en Windows recomiendo usar Microsoft Edge, aunque también puedes instalarlo en otros sistemas operativos y navegadores compatibles.

1. Abre Microsoft Edge y navega a MapPuzzle.xyz.
2. Haz clic en el ícono que aparece en la esquina derecha de la barra de direcciones.
3. Selecciona instalar.
4. Luego, selecciona si quieres que aparezca en el menú de inicio o en la barra de tareas.
5. ¡Listo! 🎉 Ahora tendrás un acceso rápido a MapPuzzle.xyz desde tu menú de inicio de Windows. 

## Descripción del código

**MapPuzzle.xyz** es una aplicación React construida con Vite, que dibuja sus
mapas con deck.gl sobre WebGL y se puede instalar como Aplicación Web Progresiva
para jugar sin conexión.

El mapa se puede girar e inclinar, y la pieza que arrastras lo acompaña. En plano
eso es un giro y nada más. Inclinado, la pieza se proyecta sobre el suelo que hay
bajo el puntero a través de la propia cámara del mapa, así que se escorza igual
que el terreno que cubre: cambia de forma según por dónde la lleves, y eso
convierte la vista inclinada en un juego distinto, no en el mismo mirado de lado.
Se ofrece a partir del tamaño de una tableta; en un teléfono el control no está
—no es que se oculte— y los gestos que girarían el mapa quedan anulados.

Lo que se publica son solo ficheros estáticos más una pequeña pasarela PHP de
solo lectura sobre un fichero SQLite, así que el juego funciona en un alojamiento
corriente, sin Node.js en el servidor. Cada puzle tiene su propia página, escrita
durante la compilación en cada uno de los siete idiomas de la interfaz, con su
título, su descripción y los nombres de sus regiones: un enlace a un puzle ya
dice lo que es antes de que se ejecute ningún script.

El editor de mapas es una aplicación aparte que corre en local, sobre Node.js con
TypeORM. Lee los ficheros shapefile directamente para producir el **geojson** de
cada mapa, trae nombres, banderas y traducciones de Wikipedia, y calcula el
centro, la superficie y los vecinos de cada pieza. Nada de eso corre en el
servidor.

## Diseño

La interfaz es un conjunto de paneles de cristal sobre el mapa, gobernados por
variables CSS declaradas en un único sitio, de modo que un cambio se aplica en
todas partes a la vez.

* **Claro y oscuro**: los mismos valores redefinidos, y la elección se recuerda
  en tu dispositivo.
* **Tipografía**: Outfit para los títulos e Inter para el texto, servidas desde
  este sitio y no desde un servicio de fuentes.
* **Cursores**: el puntero indica si una pieza se puede coger y si la estás
  sujetando.
* **Bootstrap** por debajo, y https://icons.getbootstrap.com/ para los iconos.
* **Colores**: las  piezas conservan colores vivos y contrastados: son lo único
  que tiene que distinguirse de un vistazo sobre el mapa.

## Créditos