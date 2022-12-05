# MapPuzzle.gl

MapPuzzle.gl is an experimental website, developed with React and Deck.gl. It is an accessible way to learn cartography, through this project I try to offer an interactive learning experience with maps.

![MapPuzzle.gl](http://mappuzzle.xyz/ogimage.jpg)

## Description of the game

MapPuzzle.xyz is a fun way to learn geography in a playful way. The game features a list of puzzle pieces on the left side of the screen, which can be countries, states, cities, or provinces, among others. Each piece is shown with a map illustration and when clicked, it follows the mouse and the player must find its match on the map. It also has a counter for found pieces, pieces to be found, and mistakes made. Players can choose the map they want to play and filter it by continent and region.

One of the interesting features of the game is that it allows players to translate the names of the puzzle pieces into different languages. This allows them to learn the names of the places in different languages, enriching their gaming experience and helping them develop their language skills.

In addition, every time a piece is placed on the map, players can access Wikipedia data about the place they are exploring. This allows them to obtain additional information about the geography, history, culture, and other areas related to the place, helping them learn more about the world around them.

In summary, the map puzzle game offers a complete and fun educational experience for all ages. Don’t miss out on trying it!

## How to play

You can play the game in the following link: [MapPuzzle.xyz](http://mappuzzle.xyz/)

![MapPuzzle.xyz](http://mappuzzle.xyz/demoimage.jpg)

## Code description

To develop the game, the Deck.gl library was used, which allows creating interactive maps on the web using JavaScript and WebGL. This library is a powerful and versatile tool that facilitates the development of map applications on the web, offering a wide variety of components and layers that can be used to create custom and highly interactive maps.

In addition, other technologies and tools such as React, sqlite, PHP, typeorm, and node.js have been used to implement different functionalities and improve the game experience. React has been used as a user interface development framework, sqlite has been used to store and retrieve data in a local database, PHP has been used to develop server scripts, typeorm has been used to manage the database, and node.js has been used as an execution environment to run the server scripts.

In terms of the project structure, the game is divided into different components and modules that are responsible for different tasks. For example, there are components that are responsible for displaying the puzzle piece list and the map, others that manage the game logic and interact with players, and others that are responsible for obtaining and processing Wikipedia and translation data.

In summary, the map puzzle game has been developed using advanced technologies and web development tools, and is structured in a modular and efficient way to facilitate its maintenance and expansion.

The project repository can be found at: https://github.com/alexwing/MapPuzzle.gl

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

The following lines of code refer to different ways of starting the project:

* **"dev"**: "env-cmd -f ./environments/.env.development react-scripts start", This option allows you to run the frontend in development mode, it needs to have the Node.js backend running to work properly.
* **"pro"**: "env-cmd -f ./environments/.env react-scripts start", This option allows you to run the frontend in development mode and connect it to a local sqlite3 database, without the need of the backend. The database is located in the "public" folder.
* **"dev-php-backend"**: "env-cmd -f ./environments/.env.devphpbackend react-scripts start", This option allows you to run the frontend in development mode and connect it to a local PHP backend running.
* **"pro-php-backend"**: "env-cmd -f ./environments/.env.phpbackend react-scripts start", This option allows you to run the frontend in production mode and connect it to the production PHP backend running.
* **"build"**: "env-cmd -f ./environments/.env react-scripts build", This option allows you to build the frontend in production mode and connect it to a local sqlite3 database, without the need of a backend. The database is located in the "public" folder.
* **"build-php"**: "env-cmd -f ./environments/.env.phpbackend react-scripts build", This option allows you to build the frontend and copy the files to the backend folder for use in a PHP server. This PHP server is a simple script to execute queries to the sqlite3 database, similar to the frontend version. It is used to deploy the application on a PHP server. This PHP script is limited to SELECT queries, does not support INSERT, UPDATE or DELETE query and prevents SQL injection.


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
