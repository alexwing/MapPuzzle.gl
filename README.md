# MapPuzzle.gl

MapPuzzle.gl is an experimental website, developed with React and Deck.gl. It is an accessible way to learn cartography, through this project I try to offer an interactive learning experience with maps.

![MapPuzzle.gl](/public/demoimage.jpg)

## Description of the game

We have a list on the left side of the screen, with the list of puzzle pieces which, depending on the map, could be countries, states, cities, provinces, etc. Each map piece is shown with an illustration of the map. When you click on it, it follows the mouse and you will have to look for its equivalent on the map.

It also has a counter of pieces found, pieces to be searched for and faults committed.

You can play it at http://mappuzzle.xyz/

## Code description

The source code is available on Github, it has a basic structure of a React project and Deck.gl, that is, a mappuzzle.js file where the dependencies, code and functions corresponding to the interface are defined and another file that contains the configuration for Deck.gl.

The mappuzzle.js file initializes the application and has a list of dependencies that are installed at the beginning of the application, it is also in charge of connecting Deck.gl, so in this file we find the functions to initialize the library and load the map images. The interface shows the map and a list of puzzle pieces that are extracted from the configuration of the content.json file, this file is in charge of defining the parameters of the application, such as the name of the puzzles and the GeoJson files of the maps.

You can download it at:
https://github.com/alexwing/MapPuzzle.gl

### Deck.gl

Deck.gl is a free library, developed by Vis.gl and has an open source API and well explained documentation. It is a geographic data view library, an alternative to Mapbox and other libraries. It is based on WebGL and is in charge of map rendering. It also has a development API that allows for the generation of interactive maps; Deck.gl is in charge of generating the map layers, the user interface and the control of user mobility.
### React

React is a web interface development framework, created by Facebook and based on JAVS components. React’s components are modularized, this means that they are functional and independent entities.