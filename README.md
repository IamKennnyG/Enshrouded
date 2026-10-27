# Embervale Atlas

A buildless, static Enshrouded map for GitHub Pages. Open `index.html` directly or serve the folder with any HTTP server. The map and marker dataset are bundled locally; no API key or build command is required.

## Features

- 9,658 mapped locations across 41 layers
- Search results that center the map and open location details
- Compact category markers, hover labels, a selected marker highlight, and cluster cards with zoom controls
- Category presets, collapsible groups, and individual layer filters
- A regional opening view, drag, wheel zoom, two-finger pinch, double-tap zoom, full-map reset, coordinate copying, and a mobile filter drawer

The phone layout opens with five landmark layers for legibility. Use **Filters** to enable chests, ores, enemies, and the remaining layers. Zooming out stops at a full-map overview; tap a group to inspect its locations.

## Deploy to GitHub Pages

Push these files to the repository, then set **Settings → Pages → Deploy from a branch → main → /(root)**. Keep `data.js` and `assets/map.png` beside the application files.

## Data limits

The provided source data contains coordinates and descriptions for some locations. It does not identify guaranteed item drops for each chest. The detail card says so when a container has no item-level record. Traversal layers with zero locations are shown disabled.

Source map: <https://pindrop.gg/enshrouded/map>. Enshrouded is owned by Keen Games.
