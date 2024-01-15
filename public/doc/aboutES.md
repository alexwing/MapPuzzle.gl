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
- Una ves terminado el juego, puedes explorar el mapa y obtener información adicional sobre el país obtenido de Wikipedia.

## Modos de Juego

Ambos juegos ofrecen un seguimiento detallado de tus aciertos, la lista de elementos restantes, los errores cometidos y el tiempo dedicado a la actividad.

Los jugadores pueden elegir el mapa en el que quieren jugar y filtrando por continente y región. 
Una de las características interesantes del juego es que permite a los jugadores traducir los nombres de las piezas del rompecabezas a diferentes idiomas. Esto les permite aprender los nombres de los lugares en diferentes idiomas, enriqueciendo su experiencia de juego y ayudándoles a desarrollar sus habilidades lingüísticas.

## Descripción del código

**MapPuzzle.xyz** ha sido desarrollado utilizando tecnologías avanzadas como React, Deck.gl, sqlite, PHP, typeorm y node.js. 

Para desarrollar el juego, se utilizó la biblioteca Deck.gl, que permite crear mapas interactivos en la web utilizando JavaScript y WebGL. Esta biblioteca es una herramienta poderosa y versátil que facilita el desarrollo de aplicaciones de mapas en la web, ofreciendo una amplia variedad de componentes y capas que se pueden utilizar para crear mapas personalizados y altamente interactivos.

Además, se han utilizado otras tecnologías y herramientas como React, sqlite, PHP, typeorm y node.js para implementar diferentes funcionalidades y mejorar la experiencia del juego.

- **React** se ha utilizado como marco de desarrollo de interfaz de usuario. 
- **sqlite** base de datos local para almacenar los datos del juego, la version publicada en la web solo la usa en modo lectura.
- **PHP** se ha utilizado para desarrollar scripts de base de datos, para poder ser alojado en un servidor web estandar, sin node.js.
- **node.js** Sirven para el backend del editor de mapas, con el que se han creado los mapas del juego.
- **typeorm** se ha utilizado para gestionar la base de datos desde el editor de mapas.
- **Postgis** se ha utilizado para convertir desde ficheros SHP y generar los **geojson** de los mapas.

En cuanto a la estructura del proyecto, el juego está dividido en diferentes componentes y módulos que son responsables de tareas diferentes. Por ejemplo, hay componentes que se encargan de mostrar la lista de piezas del rompecabezas y el mapa, otros que gestionan la lógica del juego e interactúan con los jugadores, y otros que se encargan de obtener y procesar datos de Wikipedia y traducciones.

## Diseño

El diseño del juego se basa en los siguientes principios:

* **Minimalismo**: El juego tiene un diseño minimalista, con una interfaz simple y limpia que permite a los jugadores centrarse en el juego y no distraerse con otros elementos.
* **Bootstrap**: El juego utiliza el framework Bootstrap para facilitar el desarrollo de la interfaz de usuario y hacerla responsive.
* https://icons.getbootstrap.com/: El juego utiliza los iconos de Bootstrap para facilitar el desarrollo de la interfaz de usuario.
* **Colores**: Las piezas del rompecabezas tienen colores brillantes y llamativos que contrastan con el fondo blanco del mapa, lo que facilita su identificación y localización en el mapa.


## Créditos
 