# 3D Earth - Countries I've Visited

An interactive 3D globe visualization that allows you to mark countries you've visited.

## Features

- Interactive 3D Earth visualization
- Click on countries to mark them as visited
- Countries change color when marked as visited
- Beautiful space background with stars
- Responsive design

## How to Use

1. Open `index.html` in a web browser
2. Use your mouse to rotate and zoom the globe:
   - Left-click and drag to rotate
   - Scroll to zoom in/out
3. Click on a country to mark it as visited (it will turn orange)
4. Click again on a visited country to unmark it

## Technical Details

This project uses:
- Three.js for 3D visualization
- TopoJSON for country boundary data
- OrbitControls for camera movement

## Browser Support

Works best in modern browsers that support WebGL:
- Chrome
- Firefox
- Safari
- Edge

## Getting Started

Simply clone or download this repository and open `index.html` in your web browser. No server or build process required.

```bash
# You can also use a simple HTTP server
python -m http.server
# Then visit http://localhost:8000
``` 