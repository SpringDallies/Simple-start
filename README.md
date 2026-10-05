# SimpleStart

A clean, minimal browser start page that mixes **Helium's visual style** with **SimplePage's link management**.

SimpleStart gives you a lightweight new-tab dashboard with a spinning dithered logo, a big clock, quick-access links, favicons, and a small settings panel. Basically, your browser's new tab gets to stop looking like it was designed in 2007.

## Download

Download the latest release, extract it, and open `index.html`.

You can also run it locally with a simple static server:

```bash
python -m http.server 8080 --directory ./helium-simplepage
```

Then open `http://localhost:8080` in your browser.

### Chrome Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the SimpleStart directory
5. Open a new tab

SimpleStart should now replace your default new-tab page.

---

## Features

- **Minimal start page** with a clean, distraction-free layout
- **Spinning dithered WebGL logo** inspired by Helium
- **Large live clock** with localized date and time
- **Quick-access links** that can be arranged horizontally or vertically
- **Automatic favicons** with high-resolution support and fallback handling
- **Local favicon caching** using `localStorage`
- **Customizable settings panel**
- Toggle favicons on or off
- Change link layout orientation
- Adjust text and icon alignment
- Add new links directly from the settings panel
- Delete links without editing any files
- **Factory reset** to restore the default configuration
- Responsive layout that adapts to different screen sizes
- Everything runs locally with no complicated backend

---

## Design

SimpleStart is built around two ideas: **Helium's visuals** and **SimplePage's practicality**.

### Background

The page uses an indigo gradient built around two main colors:

```css
--accent: #152671;
--accent-light: #5669bd;
```

The result is a soft gradient background that gives the page some depth without turning it into a Dribbble crime scene.

### Typography

The main interface uses **Instrument Sans** for headings, the clock, and larger UI elements.

Links and controls use **JetBrains Mono** for a more technical, terminal-like feel.

### Logo

The centerpiece is a lightweight WebGL logo with a rotating, dithered spindle effect.

The logo is rendered in real time using shaders rather than being a static image, keeping the visual effect smooth while staying relatively lightweight.

### Clock

The clock is intentionally large and prominent, displaying the current localized date and time.

A subtle pulse animation keeps it from feeling completely static.

### Links

Links are displayed inside the main `#link-container`.

They can be arranged horizontally or vertically depending on the selected layout, with favicons displayed alongside the link names when enabled.

### Divider

A small 2px gradient divider sits underneath the clock.

It's a tiny detail, but it helps separate the smooth Helium-inspired section from the more utilitarian monospace link area.

---

## Settings

The settings button sits in the top-right corner and opens a compact control panel.

From there you can:

- Toggle favicons
- Change the link orientation
- Change text/icon alignment
- Add links
- Remove existing links
- Reset everything to the default configuration

Settings are stored locally, so your configuration stays around when you reopen the page.

---

## Project Structure

```text
helium-simplepage/
├── index.html
├── assets/
│   ├── favicon.svg
│   ├── css/
│   │   └── style.css
│   ├── fonts/
│   │   ├── instrument-sans-*.woff2
│   │   └── jetbrains-mono-*.woff2
│   ├── icons/
│   │   └── fmhy.png
│   └── js/
│       ├── config.js
│       └── app.js
└── README.md
```

### Main files

**`index.html`**  
Contains the page structure and UI elements.

**`style.css`**  
Handles the layout, typography, gradients, animations, settings panel, and responsive styling.

**`config.js`**  
Contains the default configuration and link settings.

**`app.js`**  
Handles the clock, links, favicon system, settings, WebGL logo, local storage, and other interactive features.

---

## Tech

SimpleStart is intentionally lightweight.

- HTML
- CSS
- JavaScript
- WebGL
- LocalStorage
- WOFF2 fonts

No framework or build system is required. Clone it, edit it, open it. Humanity survives another npm install.

---

## License

See the repository for licensing information and attribution.
