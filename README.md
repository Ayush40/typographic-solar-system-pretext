# Typographic Solar System

An animated solar-system web experience built with React, Vite, and Canvas.

## Support This Project

⭐ Star this project if you like it.

If this project helped or inspired you:
- Star this repository
- Fork this repository and build your own version

Suggested repo links (replace with your actual GitHub URL):
- Star: https://github.com/USERNAME/REPO
- Fork: https://github.com/USERNAME/REPO/fork

The project combines:
- Real-time planet orbit rendering
- Larger stylized planets with lighting and rings
- Moving spaceships with trails
- Star field, nebula glow, and asteroid belt motion
- Flowing telemetry text that wraps around celestial bodies
- Bottom mission ticker and corner UI elements

## Tech Stack

- React 19
- Vite 8
- Canvas 2D API
- @chenglou/pretext for dynamic text layout and wrapping

## Run Locally

1. Install dependencies
	npm install
2. Start development server
	npm run dev
3. Create production build
	npm run build
4. Preview production build
	npm run preview

## Project Structure

- Main app shell: [src/App.jsx](src/App.jsx)
- Solar scene and animation logic: [src/SolarSystem.jsx](src/SolarSystem.jsx)
- Global styles: [src/index.css](src/index.css)

## Visual Notes

- The entire visual scene is drawn on one full-screen canvas.
- Planets and ships are animated per frame using requestAnimationFrame.
- Telemetry text is laid out in spans that avoid the sun and planets for a wrapped sci-fi look.
- Motion values are tuned to keep animation smooth on desktop and mobile screens.

## Customization Tips

- Planet sizes and orbit distances: update values in [src/SolarSystem.jsx](src/SolarSystem.jsx).
- Spaceship speed and wobble: update ship objects in [src/SolarSystem.jsx](src/SolarSystem.jsx).
- Text movement intensity and ticker speed: tune the textMotion values in [src/SolarSystem.jsx](src/SolarSystem.jsx).
- Colors and atmosphere: adjust gradients and rgba colors in [src/SolarSystem.jsx](src/SolarSystem.jsx) and [src/index.css](src/index.css).

## Scripts

- npm run dev: start local dev server
- npm run build: build production assets
- npm run lint: run ESLint
- npm run preview: preview production build

## Contributing

Contributions are welcome.

Quick workflow:
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Please keep changes focused and include a clear description of what was improved.
