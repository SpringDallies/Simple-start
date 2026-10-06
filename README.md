# SimpleStart

Simplestart is a really cool startpage that you should totally use and install (no viruses i swear)

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
ps: i dont have the funding to publish this to the chromewebstore, so you gotta do it manually!

---

## Features

- **Spinning logo** What more could you want?
- **Quick-access links** that can be arranged horizontally or vertically
- **Customizable settings panel** Really really customizable
- Responsive layout that adapts to different screen sizes

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
- And more cool shit!

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
- HTML
- CSS
- JavaScript
- WebGL
- LocalStorage
- WOFF2 fonts

Its simple as fuck!!  -me

---

## License

This project is licensed under the [MIT License](LICENSE).
