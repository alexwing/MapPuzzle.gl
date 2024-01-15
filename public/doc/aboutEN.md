**MapPuzzle.xyz** is a platform that immerses you in hours of entertainment through flags, maps, and puzzles from various parts of the world. The game is designed for players of all ages and skill levels, offering a comprehensive and enriching educational experience.

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

## Code Description

**MapPuzzle.xyz** has been developed using advanced technologies such as React, Deck.gl, sqlite, PHP, typeorm, and node.js.

To develop the game, the Deck.gl library was used, allowing the creation of interactive maps on the web using JavaScript and WebGL. This library is a powerful and versatile tool that facilitates the development of map applications on the web, offering a wide variety of components and layers for creating custom and highly interactive maps.

Additionally, other technologies and tools such as React, sqlite, PHP, typeorm, and node.js have been used to implement various functionalities and enhance the gaming experience.

- **React** has been used as the user interface development framework.
- **sqlite** serves as a local database to store game data, with the published version on the web using it in read-only mode.
- **PHP** has been used to develop database scripts, allowing the game to be hosted on a standard web server without node.js.
- **node.js** is used for the backend of the map editor, which was used to create the game maps.
- **typeorm** has been used to manage the database from the map editor.
- **Postgis** has been utilized to convert from SHP files and generate the **geojson** files for the maps.

Regarding the project structure, the game is divided into different components and modules responsible for various tasks. For example, there are components responsible for displaying the puzzle piece list and the map, others that manage the game logic and interact with players, and others responsible for obtaining and processing Wikipedia and translation data.

## Design

The design of the game is based on the following principles:

* **Minimalism**: The game has a minimalist design, with a simple and clean interface that allows players to focus on the game and not be distracted by other elements.
* **Bootstrap**: The game uses the Bootstrap framework to facilitate the development of the user interface and make it responsive.
* https://icons.getbootstrap.com/: The game uses the Bootstrap icons to facilitate the development of the user interface.
* **Colors**: The puzzle pieces have bright, eye-catching colors that contrast with the white background of the map, making them easy to identify and locate on the map.

## Credits