# Embervale Atlas

A buildless, static Enshrouded map for GitHub Pages. Open `index.html` directly or serve the folder with any HTTP server. The map and marker dataset are bundled locally; no API key or build command is required.

## Features

- 9,658 mapped locations across 41 layers
- Search results that center the map and open location details
- Tappable markers and cluster cards with zoom controls
- Category presets, collapsible groups, and individual layer filters
- Drag, wheel zoom, touch pan, map reset, coordinate copying, and a mobile filter drawer

## Deploy to GitHub Pages

Push these files to the repository, then set **Settings → Pages → Deploy from a branch → main → /(root)**. Keep `data.js` and `assets/map.png` beside the application files.

## Data limits

The provided source data contains coordinates and descriptions for some locations. It does not identify guaranteed item drops for each chest. The detail card says so when a container has no item-level record. Traversal layers with zero locations are shown disabled.

Source map: <https://pindrop.gg/enshrouded/map>. Enshrouded is owned by Keen Games.
