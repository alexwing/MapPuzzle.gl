# MapPuzzle.gl

MapPuzzle.gl is an experimental website, developed with React and Deck.gl. It is an accessible way to learn cartography, through this project I try to offer an interactive learning experience with maps.

![MapPuzzle.gl](http://mappuzzle.xyz/ogimage.jpg)

## Description of the game

We have a list on the left side of the screen, with the list of puzzle pieces which, depending on the map, could be countries, states, cities, provinces, etc. Each map piece is shown with an illustration of the map. When you click on it, it follows the mouse and you will have to look for its equivalent on the map.

It also has a counter of pieces found, pieces to be searched for and faults committed.

## How to play

You can play the game in the following link: [MapPuzzle.xyz](http://mappuzzle.xyz/)

![MapPuzzle.xyz](http://mappuzzle.xyz/demoimage.jpg)

## Code description

The source code is available on Github, it has a basic structure of a React project and Deck.gl, that is, a mappuzzle.js file where the dependencies, code and functions corresponding to the interface are defined and another file that contains the configuration for Deck.gl.

The mappuzzle.js file initializes the application and has a list of dependencies that are installed at the beginning of the application, it is also in charge of connecting Deck.gl, so in this file we find the functions to initialize the library and load the map images. The interface shows the map and a list of puzzle pieces that are extracted from the configuration of the puzzles.sqlite3.png file.
This db sqlite file is a plain sqlite database, with a table called "puzzles", containing the information of the puzzle maps and the the parameters of the application.


You can download it at:
https://github.com/alexwing/MapPuzzle.gl


## Build

The project Front-end is in main directory, and the project Back-end is in the directory Backend

Each project has its own Package.json with the configuration of the dependencies.

### Backend

The backend is built with Node.js, it is a server that receives the requests from the client and sends the response, it also has a database with the information of the puzzles.

This backend use "typeorm" and sqlite3 databases, the entities are defined in the "models" folder, and the endpoints are defined in the "routes" folder.

The backend use Sqlite3 as a database, so it is necessary to install it. the database is allocated in the "db" folder.

The Front use the entities classes from the backend, if you can't use the backend, you can copy the entities from the backend to the Frontend.


```json
"dev": "ts-node-dev src/index.ts",
```
Use dev to run the server in development mode.

### Frontend

The frontend is built with React, it is a client that sends requests to the server and receives the response, it also has a database with the information of the puzzles.

```json
"dev": "env-cmd -f ./environments/.env.development react-scripts start",
```
Run the frontend in development mode, is necessary to have the backend running.

```json
"pro": "env-cmd -f ./environments/.env react-scripts start",
```
Run "pro" frontend in development mode, and connect to local sqlite3 database, without backend server. the database is allocated in the "public" folder.

The sqlite3 database has a extension called "sqlite3.png", this file is a plain sqlite database, with a table called "puzzles", containing the information of the puzzle maps and the the parameters of the application.

The "png" extension is used to fix the problem of the sqlite3 database, with server gzip compression, the sqlite3 database is not readable by the browser.
```json
"build":  "env-cmd -f ./environments/.env react-scripts build",
```

```json
    "build-php": "env-cmd -f ./environments/.env.phpbackend react-scripts build",
```
Build the frontend and copy the files to the backend folder, to be used in the backend server. The php backend server is as simple script to execute querys to the sqlite3 database, equals to the sqlite front version. The php backend server is used to deploy the application in a php server.

This PHP script is limit to SELECT querys, not support INSERT, UPDATE or DELETE query and prevent SQL injection.


### Deck.gl

Deck.gl is a free library, developed by Vis.gl and has an open source API and well explained documentation. It is a geographic data view library, an alternative to Mapbox and other libraries. It is based on WebGL and is in charge of map rendering. It also has a development API that allows for the generation of interactive maps; Deck.gl is in charge of generating the map layers, the user interface and the control of user mobility.
### React

React is a web interface development framework, created by Facebook and based on JAVS components. React’s components are modularized, this means that they are functional and independent entities.

### Typescript

Typescript is a programming language that is a superset of JavaScript, it is a typed language, which means that it has a type system that allows you to define the type of data that a variable can contain. It is a language that is compiled to JavaScript, so it is necessary to compile it to be able to use it in the browser.

## Query Example for Postgis shape table export to Geojson

This query get the geojson necessary to render the map.

In the query we use the ST_AsGeoJSON function to convert the geometry to a geojson format.

The Gson require this fields to create map layer in Mappuzzle.gl:

- **cartodb_id**: The id of the row in the pieces table
- **geom**: Geometry of the row, is the polygon version of the shape, is use to render the map in deck.gl.
- **name**: Name of the map piece
- **poly**: SVG of the map piece to show in the list.
- **box**: Bounding box of the map piece in 3857 coordinates for SVG format.
- **mapcolor**: Color of the map piece, this color is asigned from a array of colors.

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
  
## Credits

This project was developed by Alejandro Aranda, and is a part of the [MapPuzzle.gl](http://mappuzzle.xyz/) project.

## License

This project is licensed under the MIT license, is free to use, modify and distribute.

## contact

If you have any questions, you can contact me at: https://aaranda.es/en/contact/

## Donate

If you want to support the project, you can donate at: https://github.com/sponsors/alexwing
