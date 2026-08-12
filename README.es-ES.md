

# MapPuzzle.gl

**MapPuzzle.xyz** es una plataforma que te sumerge en horas de entretenimiento a través de banderas, mapas y rompecabezas de diversas partes del mundo. El juego está diseñado para jugadores de todas las edades y niveles de habilidad, ofreciendo una experiencia educativa integral y enriquecedora.

![MapPuzzle.gl](http://mappuzzle.xyz/ogimage.jpg)

## Juegos Disponibles

Actualmente, hay dos juegos diferentes: Rompecabezas Geográficos y Adivina la Bandera.

### Rompecabezas Geográficos
- Elige entre los rompecabezas disponibles que representan diferentes regiones del mundo, incluidos países, estados o provincias.
- En la interfaz, el mapa se muestra a la derecha con sus fronteras, mientras que a la izquierda hay una lista de elementos con sus respectivas siluetas. Tu tarea es colocar cada pieza en su ubicación correspondiente.
- Además, cada vez que se coloca una pieza en el mapa, los jugadores pueden acceder a datos de Wikipedia sobre el lugar que están explorando. Esto les permite obtener información adicional sobre la geografía, historia, cultura y otras áreas relacionadas con el lugar, ayudándoles a aprender más sobre el mundo que los rodea.

### Adivina la Bandera
- Observa una bandera ondeando y la silueta del país a la derecha.
- Elige entre seis opciones disponibles para identificar correctamente el país al que pertenece.
- Una vez finalizado el juego, puedes explorar el mapa y obtener información adicional sobre el país desde Wikipedia.

## Modos de Juego

Ambos juegos ofrecen un seguimiento detallado de tus aciertos, la lista de elementos restantes, los errores cometidos y el tiempo dedicado a la actividad.

Los jugadores pueden elegir el mapa con el que quieren jugar, filtrando por continente y región. Una característica interesante del juego es que permite a los jugadores traducir los nombres de las piezas del rompecabezas a diferentes idiomas. Esto enriquece su experiencia de juego y les ayuda a desarrollar sus habilidades lingüísticas.

## Cómo jugar

Puedes jugar en el siguiente enlace: [MapPuzzle.xyz](http://mappuzzle.xyz/)

![MapPuzzle.xyz](http://mappuzzle.xyz/demoimage.jpg)

## Descripción del Código

**MapPuzzle.xyz** ha sido desarrollado utilizando tecnologías avanzadas como React, Vite, Deck.gl, sqlite, PHP, typeorm y node.js.

Para desarrollar el juego, se utilizó la biblioteca Deck.gl, que permite la creación de mapas interactivos en la web mediante JavaScript y WebGL. Esta biblioteca es una herramienta potente y versátil que facilita el desarrollo de aplicaciones de mapas en la web, ofreciendo una amplia variedad de componentes y capas para crear mapas personalizados y altamente interactivos.

Además, se han utilizado otras tecnologías y herramientas como React, Vite, sqlite, PHP, typeorm y node.js para implementar diversas funcionalidades y mejorar la experiencia de juego.

- **React** se ha utilizado como marco de desarrollo de la interfaz de usuario.
- **Vite** es la herramienta de compilación y servidor de desarrollo para el frontend (migrado desde Create React App / react-scripts). También proporciona una PWA (soporte sin conexión) mediante `vite-plugin-pwa`.
- **sqlite** sirve como base de datos local para almacenar los datos del juego, con la versión publicada en la web utilizándola en modo de solo lectura.
- **PHP** se ha utilizado para desarrollar scripts de la base de datos, lo que permite alojar el juego en un servidor web estándar sin node.js.
- **node.js** se utiliza para el backend del editor de mapas, que se empleó para crear los mapas del juego.
- **typeorm** se ha utilizado para gestionar la base de datos desde el editor de mapas.
- **Postgis** se ha utilizado para convertir desde archivos SHP y generar los archivos **geojson** para los mapas.

En cuanto a la estructura del proyecto, el juego está dividido en diferentes componentes y módulos responsables de diversas tareas. Por ejemplo, hay componentes responsables de mostrar la lista de piezas del rompecabezas y el mapa, otros que gestionan la lógica del juego y se interactúan con los jugadores, y otros responsables de obtener y procesar datos de Wikipedia y traducciones.


El repositorio del proyecto se encuentra en: https://github.com/alexwing/MapPuzzle.gl

## Compilación

El Front-end del proyecto está en el directorio principal y el Back-end del proyecto está en el directorio Backend

Cada proyecto tiene su propio Package.json con la configuración de las dependencias.

### Consideraciones de dependencias

El proyecto requiere **Node.js 18 o superior** (requisito de Vite 5). Ha sido probado con Node.js 20+.

- ```json "react-map-gl": "5.3.21"```, Esta versión de react-map-gl es necesaria para usar la biblioteca deck.gl; después de esta versión, en la 6.0.0 es necesario ACCESS_TOKEN para usar la API de mapbox, lo que requiere un plan de pago para usar la API de mapbox.
- ```json "sass": "^1.93.3"```, Dart Sass (reemplaza al obsoleto `node-sass`); no se requiere una versión especial de Node.

### Backend

El backend está construido con Node.js, es un servidor que recibe las solicitudes del cliente y envía la respuesta, también tiene una base de datos con la información de los rompecabezas.

Este backend usa las bases de datos "typeorm" y sqlite3, las entidades se definen en la carpeta "models" y los endpoints se definen en la carpeta "routes".

El backend usa Sqlite3 como base de datos, por lo que es necesario instalarla. La base de datos se ubica en la carpeta "db".

El Front usa las clases de entidades del backend; si no puedes usar el backend, puedes copiar las entidades del backend al Frontend.


```json
"dev": "ts-node-dev src/index.ts",
```
Usa dev para ejecutar el servidor en modo de desarrollo.

### Frontend

El frontend está construido con React y empaquetado con **Vite**, es un cliente que envía solicitudes al servidor y recibe la respuesta, también tiene una base de datos con la información de los rompecabezas.

El repositorio es un monorepo: `apps/game` (MapPuzzle y FlagsQuiz, lo único que se despliega), `apps/editor` (el editor de mapas), `apps/backend` (Express + TypeORM + PostGIS, solo para creación local), `packages/` (los contratos y el código que comparten ambos clientes) y `data/` (los mapas, banderas y la base de datos SQLite que produce el editor).

La configuración del entorno reside en la carpeta `environments/` de cada aplicación y se carga a través de los modos de Vite (`--mode <nombre>`, establecido mediante `envDir`). Las variables se exponen con el prefijo `VITE_` y se leen a través de `import.meta.env`. `npm run build` genera la salida en `build/` en la raíz del repositorio, con el contenido de `data/` copiado en él, que es exactamente lo que se carga.

Los siguientes scripts ejecutan y compilan el proyecto:

* **"dev"**: el juego contra el backend local de Node (carga `environments/.env.development`). Necesita `npm run backend`.
* **"pro"**: el juego contra la base de datos SQLite leída directamente por HTTP, por lo que no necesita ningún backend.
* **"dev-php-backend"**: el juego contra un backend PHP ejecutándose localmente en el puerto 8888.
* **"editor"**: el editor de mapas, en el puerto 3001. Siempre se comunica con el backend de Node, ya que la pasarela PHP de producción es de solo lectura.
* **"backend"**: el backend Express + TypeORM en el puerto 5000. La creación de mapas necesita además PostgreSQL con PostGIS.
* **"build"**: la compilación de producción, en modo PHP-backend. Esto es lo que se despliega.
* **"preview"**: sirve esa compilación localmente para verificación.
* **"typecheck"**, **"typecheck:editor"**, **"typecheck:backend"**: compilaciones sin emisión (no-emit) de cada proyecto.
* **"publish-db"**: copia la base de datos de autoría sobre la publicada, después de mostrar ambos dígitos de verificación (digests). `--check` falla en lugar de escribir.
* **"deploy"** / **"deploy:app"**: sube la compilación por FTP. El primero compara el contenido generado por tamaño y envía solo lo que difiere; el segundo envía solo el shell de la aplicación, que es el caso habitual. `--dry-run` imprime el plan sin subir. Las credenciales provienen de `.env.deploy`, que está ignorado por git.

## Diseño

El diseño del juego se basa en los siguientes principios:

* **Minimalismo**: El juego tiene un diseño minimalista, con una interfaz simple y limpia que permite a los jugadores concentrarse en el juego y no distraerse por otros elementos.
* **Bootstrap**: El juego utiliza el framework Bootstrap para facilitar el desarrollo de la interfaz de usuario y hacerla responsiva.
* https://icons.getbootstrap.com/: El juego utiliza los iconos de Bootstrap para facilitar el desarrollo de la interfaz de usuario.
* **Colores**: Las piezas del rompecabezas tienen colores vivos y llamativos que contrastan con el fondo blanco del mapa, lo que facilita su identificación y localización en el mismo.

## Ejemplo de consulta para exportar tabla de formas de Postgis a Geojson

Esta consulta obtiene el geojson necesario para renderizar el mapa.

En la consulta utilizamos la función ST_AsGeoJSON para convertir la geometría a formato geojson.

Gson requiere estos campos para crear la capa de mapa en Mappuzzle.gl:

- **cartodb_id**: El id de la fila en la tabla de piezas
- **geom**: Geometría de la fila, es la versión poligonal de la forma, se usa para renderizar el mapa en deck.gl.
- **name**: Nombre de la pieza del mapa
- **poly**: SVG de la pieza del mapa para mostrar en la lista.
- **box**: Cuadro delimitador (bounding box) de la pieza del mapa en coordenadas 3857 para el formato SVG.
- **mapcolor**: Color de la pieza del mapa, este color se asigna desde un arreglo de colores.

```sql
SELECT jsonb_build_object(
    'type',     'FeatureCollection',
    'features', jsonb_agg(feature)
)
FROM (
  SELECT jsonb_build_object(
    'type',       'Feature',
    'geometry',   ST_AsGeoJSON(geom)::jsonb,
    'properties', to_jsonb(row) - 'geom'
  ) AS feature
  FROM (	
 			select
				gid as cartodb_id,   		
				geom,
				name as name,
				ST_AsSVG(ST_Translate(ST_Transform(ST_SetSRID(geom,4326),3857),-ST_Xmin(ST_Transform(ST_SetSRID(geom,4326),3857)),-ST_YMax(ST_Transform(ST_SetSRID(geom,4326),3857)))) as poly,
				CONCAT('0 0 ', ST_Distance(CONCAT('SRID=3857;POINT(', ST_XMin(ST_Transform(ST_SetSRID(geom,4326), 3857)), ' 0)')::geometry, CONCAT('SRID=3857;POINT(', ST_XMax(ST_Transform(ST_SetSRID(geom,4326), 3857)), ' 0)')::geometry), ' ', ST_Distance(CONCAT('SRID=3857;POINT(0 ', ST_YMin(ST_Transform(ST_SetSRID(geom,4326), 3857)), ')')::geometry, CONCAT('SRID=3857;POINT(0 ', ST_YMax(ST_Transform(ST_SetSRID(geom,4326), 3857)), ')')::geometry)) as box,
				gid as mapcolor
			from
				public.mexico_states
			order by
				name 
  )
 row) features;
  
  
  
```
  
## Créditos

Este proyecto fue desarrollado por Alejandro Aranda y es parte del proyecto [MapPuzzle.gl](http://mappuzzle.xyz/).

## Licencia

Este proyecto está licenciado bajo la licencia MIT, es libre para usar, modificar y distribuir.

## Contacto

Si tienes alguna pregunta, puedes contactarme en: https://aaranda.es/en/contact/

## Donar

Si quieres apoyar el proyecto, puedes hacer una donación en: https://github.com/sponsors/alexwing
