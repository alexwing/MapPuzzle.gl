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

Players can choose the map they want to play, filtering by continent and region. The site itself is available in seven languages, each with an address of its own. One interesting feature of the game is that it allows players to translate the names of the puzzle pieces into different languages. This enriches their gaming experience and helps them develop their language skills.

## MapPuzzle.xyz as a native app

Now you can install MapPuzzle.xyz as a Progressive Web App (PWA). A PWA offers a native app experience that installs directly from your browser, without the need to download it from an app store or use an installer.

For best integration in Windows I recommend using Microsoft Edge, although you can also install it on other compatible operating systems and browsers.

1. Open Microsoft Edge and navigate to MapPuzzle.xyz.
2. Click on the icon that appears in the right corner of the address bar.
3. Select install.
4. Then, select whether you want it to appear in the start menu or in the taskbar.
5. Ready! 🎉 Now you will have quick access to MapPuzzle.xyz from your Windows start menu
   
## Code Description

**MapPuzzle.xyz** is a React application built with Vite, drawing its maps with
deck.gl over WebGL, and installable as a Progressive Web App for offline play.

What is published is only static files plus a small read-only PHP gateway over a
SQLite file, so the game runs on ordinary hosting with no Node.js on the server.
Every puzzle has a page of its own, written at build time in each of the seven
interface languages, with its own title, description and region names, so a link
to a puzzle says what it is before any script runs.

The map editor is a separate application that runs locally, on Node.js with
TypeORM. It reads shapefiles directly to produce each map's **geojson**, pulls
names, flags and translations from Wikipedia, and works out every piece's
centre, area and neighbours. Nothing of that runs on the server.

## Design

The interface is a set of glass panels over the map, all of it driven by CSS
variables declared in one place, so a change lands everywhere at once.

* **Light and dark**: the same tokens redefined, and the choice is remembered on
  your device.
* **Typography**: Outfit for titles and Inter for text, served from this site
  rather than from a font service.
* **Cursors**: the pointer says whether a piece can be taken and whether it is
  being held.
* **Bootstrap** underneath, and https://icons.getbootstrap.com/ for the icons.
* **Colours**: the pieces keep bright, contrasting colours — they are the one
  thing that has to read instantly against the map.

## Credits