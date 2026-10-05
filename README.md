# Helium x SimplePage Unified Start Page

A sleek, single-page browser start dashboard blending Helium's elegant, 3D dithered logo with SimplePage's link management, favicon pipeline, and minimalist settings.

---

## Design & Architecture

### 1. Core Structure
- **Background**: Indigo radial-to-linear gradient (`--accent: #152671` to `--accent-light: #5669bd`).
- **Typography**: Geometric *Instrument Sans* for headers and time.
- **Logo**: Lightweight WebGL spinning dither spindle with real-time shaders.
- **Clock**: Large, pulsing, localized date and time display.

### 2. Functionality & Styling
- **Links & Quick Access**: Rendered in Helium's `#link-container` in horizontal/vertical layouts.
- **Styling**: Crisp *JetBrains Mono* / *Courier* for links and controls; underlined, high-contrast UI.
- **Favicon Management**: Automatic high-res favicon with fallback, cached via `localStorage`.
- **Settings Panel**: Fixed top-right toggle revealing a dark-control window with:
  - Favicon toggle
  - Layout orientation
  - Text and icon alignment
  - Inline link deletion and URL addition
  - Factory reset

### 3. Visual Integration
- **Dither Divider**: 2px gradient beneath the clock connects Helium’s smooth visuals with SimplePage’s monospaced links.
- **Shadow & Transition**: Settings window casts a dithered shadow; opening smoothly shifts layout to prevent overlap.

---

## Directory Layout


helium-simplepage/
├── index.html                # Markup
├── assets/
│   ├── favicon.svg           # Helium favicon
│   ├── css/
│   │   └── style.css         # Stylesheet
│   ├── fonts/
│   │   ├── instrument-sans-*.woff2
│   │   └── jetbrains-mono-*.woff2
│   ├── icons/
│   │   └── fmhy.png          # SimplePage icon
│   └── js/
│       ├── config.js         # Configurations
│       └── app.js            # Main scripts (WebGL, clock, links, settings)
└── README.md


---

## Usage

Open `index.html` in any modern browser or serve via static server:

bash
# Using Python:
python -m http.server 8080 --directory ./helium-simplepage


### Chrome Extension (`simplepage`)
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this directory
4. Open a new tab — SimplePage loads automatically!
