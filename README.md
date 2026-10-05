# Helium x SimplePage Unified Start Page

A cohesive, single-page browser start dashboard that combines the visual elegance and 3D dithered logo of **[Helium Start](https://github.com/SpringDallies/helium-start)** with the functional link management, custom favicon pipeline, and minimalist settings modal from **[SimplePage](https://github.com/SpringDallies/simplepage)**.

---

## Design Fusion & Architecture

### 1. Structural Foundation (Helium Start)
- **Primary Stage**: Rich indigo radial-to-linear gradient (`--accent: #152671` to `--accent-light: #5669bd`).
- **Typography**: Clean, geometric *Instrument Sans* typography for primary heading elements and time display.
- **Hero Logo**: Lightweight, zero-dependency hand-rolled WebGL spinning dither spindle with real-time dither fragment shaders.
- **Clock**: Large tabular clock with subtle, translucent pulsing colons (`:`) and localized date string.

### 2. Functional & Minimalist Elements (SimplePage)
- **Link Cloud & Quick Access**: Rendered directly in Helium's `#link-container` slot in horizontal or vertical flow.
- **Typography & Styling**: Links and controls rendered in crisp *JetBrains Mono* / *Courier*, retaining SimplePage's clean underline interactions and high-contrast labels.
- **Favicon Pipeline**: Automatic high-resolution favicon resolution with fallback to DuckDuckGo and canvas rasterization, stored locally via `SafeStorage` (`localStorage`).
- **Brutalist Settings Window**: Fixed top-right `settings` trigger that expands a refined charcoal control panel (`--sp-dark-accent: rgb(67, 67, 67)`) featuring:
  - Toggle favicons
  - Toggle horizontal vs vertical flow
  - Segmented text alignment (`left`, `center`, `right`)
  - Segmented icon alignment (`with text`, `left`, `right`)
  - Link management: inline deletion (`×`) and custom URL addition
  - Factory reset for link shortcuts

### 3. Intentional Aesthetic Bridges
- **Dithered Seam**: A 2px dither gradient divider sits beneath the clock, acting as a visual bridge connecting Helium's smooth sans-serif aesthetic with SimplePage's monospaced link matrix.
- **Hard Pixel Shadow**: SimplePage's settings window casts an offset dithered shadow onto the Helium gradient, blending the two worlds seamlessly.
- **Adaptive Stage Shift**: Opening the settings window gracefully transitions the stage layout so the panel never covers active links on desktop and tablet screens.

---

## Directory Structure

```
helium-simplepage/
├── index.html                   # Unified semantic markup
├── assets/
│   ├── favicon.svg              # Helium spindle favicon
│   ├── css/
│   │   └── style.css            # Unified hand-crafted stylesheet
│   ├── fonts/
│   │   ├── instrument-sans-*.woff2 # Self-hosted Instrument Sans
│   │   └── jetbrains-mono-*.woff2  # Self-hosted JetBrains Mono
│   ├── icons/
│   │   └── fmhy.png             # Local asset icon from SimplePage
│   └── js/
│       ├── config.js            # Consolidated configuration (bangs, links, layout)
│       └── app.js               # Integrated engine (WebGL + Clock + Links + Settings)
└── README.md
```

---

## Usage

Simply open `index.html` in any modern web browser or serve via any static file server:

```bash
# Example using Python:
python -m http.server 8080 --directory ./helium-simplepage
```

### Install as Chrome Extension (`simplepage`)
1. Open Google Chrome (or Edge, Brave, Opera, Helium).
2. Navigate to `chrome://extensions` in the address bar.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left).
5. Select this directory (`c:\Users\straightheart\Documents\Code\helium-simplepage`).
6. Open a new tab (`Ctrl + T`) — simplepage now opens automatically!
