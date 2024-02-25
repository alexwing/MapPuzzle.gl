# MapPuzzle.gl

**MapPuzzle.xyz** is a platform that immerses you in hours of entertainment through flags, maps, and puzzles from various parts of the world. The game is designed for players of all ages and skill levels, offering a comprehensive and enriching educational experience.

![MapPuzzle.gl](http://mappuzzle.xyz/ogimage.jpg)

## Available Games

Currently, there are two different games: Geographical Puzzles and Guess the Flag.

### Geographical Puzzles
- Choose from available puzzles representing different regions of the world, including countries, states, or provinces.
- In the interface, the map is displayed on the right with its borders, while on the left, there is a list of elements with their respective silhouettes. Your task is to place each piece in its corresponding location.
- Additionally, every time a piece is placed on the map, players can access Wikipedia data about the place they are exploring. This allows them to obtain additional information about the geography, history, culture, and other areas related to the place, helping them learn more about the world around them.

### Guess the Flag
- Observe a waving flag and the silhouette of the country on the right.
- Choose from six available options to correctly identify the country to which it belongs.
- Once the game is finished, you can explore the map and obtain additional information about the country from Wikipedia.

## Game Modes

Both games offer detailed tracking of your successes, the list of remaining elements, errors made, and the time devoted to the activity.

Players can choose the map they want to play, filtering by continent and region. One interesting feature of the game is that it allows players to translate the names of the puzzle pieces into different languages. This enriches their gaming experience and helps them develop their language skills.

## How to play

You can play the game in the following link: [MapPuzzle.xyz](http://mappuzzle.xyz/)

![MapPuzzle.xyz](http://mappuzzle.xyz/demoimage.jpg)

## Code Description

**MapPuzzle.xyz** has been developed using advanced technologies such as React, Deck.gl, sqlite, PHP, typeorm, and node.js. .

To develop the game, the Deck.gl library was used, allowing the creation of interactive maps on the web using JavaScript and WebGL. This library is a powerful and versatile tool that facilitates the development of map applications on the web, offering a wide variety of components and layers for creating custom and highly interactive maps.

Additionally, other technologies and tools such as React, sqlite, PHP, typeorm, and node.js have been used to implement various functionalities and enhance the gaming experience.

- **React** has been used as the user interface development framework.
- **sqlite** serves as a local database to store game data, with the published version on the web using it in read-only mode.
- **PHP** has been used to develop database scripts, allowing the game to be hosted on a standard web server without node.js.
- **node.js** is used for the backend of the map editor, which was used to create the game maps.
- **typeorm** has been used to manage the database from the map editor.
- **Postgis** has been utilized to convert from SHP files and generate the **geojson** files for the maps.

Regarding the project structure, the game is divided into different components and modules responsible for various tasks. For example, there are components responsible for displaying the puzzle piece list and the map, others that manage the game logic and interact with players, and others responsible for obtaining and processing Wikipedia and translation data.


The project repository can be found at: https://github.com/alexwing/MapPuzzle.gl

## Build

The project Front-end is in main directory, and the project Back-end is in the directory Backend

Each project has its own Package.json with the configuration of the dependencies.

### Dependencies considerations

The project has some dependencies that require a specific version of Node.js, it is necessary to have the correct version of Node.js to use the project.

- ```json "react-map-gl": "5.3.21"```, This version of react-map-gl is necessary to use the deck.gl library, after this version, in 6.0.0 has necesary ACCESS_TOKEN to use the  mapbox API, require a payment plan to use the mapbox API.
- ```json "node-sass": "^4.14.1"```, This version need NODE version v14.17.3
- ```json"react-markdown": "^6.0.2"```, This version need NODE version v14.17.3

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
  
## Design

The design of the game is based on the following principles:

* **Minimalism**: The game has a minimalist design, with a simple and clean interface that allows players to focus on the game and not be distracted by other elements.
* **Bootstrap**: The game uses the Bootstrap framework to facilitate the development of the user interface and make it responsive.
* https://icons.getbootstrap.com/: The game uses the Bootstrap icons to facilitate the development of the user interface.
* **Colors**: The puzzle pieces have bright, eye-catching colors that contrast with the white background of the map, making them easy to identify and locate on the map.

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
