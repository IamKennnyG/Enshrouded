# Embervale Atlas

A buildless, static Enshrouded map for GitHub Pages. Open `index.html` directly or serve the folder with any HTTP server. The map and marker dataset are bundled locally; no API key or build command is required.

## Features

- 9,658 mapped locations across 41 layers
- Search results that center the map and open location details
- Compact category markers, hover labels, a selected marker highlight, and cluster cards with zoom controls
- Visual layer tiles for high tier chests and sarcophagi, all chests, loot sites, enemies, halls, mining, and landmarks, plus collapsible groups and individual filters
- A curated opening view, drag, smooth pointer zoom, two-finger pinch, double-tap zoom, full-map reset, coordinate copying, and a mobile filter sheet

The map opens with five discovery layers on desktop and four sparse landmark layers on phones. Use **Explore layers** on mobile to enable chests, ores, enemies, and the remaining layers. Zooming out stops at a full-map overview; tap a group to inspect its locations.

## Deploy to GitHub Pages

Push these files to the repository, then set **Settings → Pages → Deploy from a branch → main → /(root)**. Keep `data.js` and `assets/map.png` beside the application files.

## Data limits

High tier tiles use the source's gold chest and gold/silver sarcophagus categories as location targets. The provided source data contains coordinates and descriptions for some locations; it does not identify guaranteed item drops for each container. The detail card says so when a container has no item-level record. Traversal layers with zero locations are shown disabled.

Source map: <https://pindrop.gg/enshrouded/map>. Enshrouded is owned by Keen Games.
