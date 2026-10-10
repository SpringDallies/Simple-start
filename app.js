/* ============================================================
   PROJECT HELIUM - app.js
   ------------------------------------------------------------
   Kept intentionally lean for instant startup:
     - a hand-rolled WebGL spinner (replaces the 592KB three.js)
     - the clock
   SimplePage-style features (links, settings) plug in at the
   bottom; SafeStorage below is there for their persistence.
   ============================================================ */

const _perfStart = performance.now();

const SafeStorage = {
    prefix: 'helium_',
    get: (key, fallback = '[]') => {
        try {
            return JSON.parse(localStorage.getItem(SafeStorage.prefix + key) || fallback);
        } catch (e) {
            return JSON.parse(fallback);
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(SafeStorage.prefix + key, JSON.stringify(value));
        } catch (e) { }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(SafeStorage.prefix + key);
        } catch (e) { }
    }
};

const root = document.documentElement;

const THEMES = {
    indigo: {
        name: 'indigo',
        themeColor: '#152671',
        logoShadow: [0.38, 0.52, 0.95],
        logoHighlight: [0.92, 0.95, 1.00]
    },
    obsidian: {
        name: 'obsidian',
        themeColor: '#101014',
        logoShadow: [0.36, 0.36, 0.44],
        logoHighlight: [0.96, 0.97, 1.00]
    },
    emerald: {
        name: 'emerald',
        themeColor: '#06211a',
        logoShadow: [0.15, 0.68, 0.50],
        logoHighlight: [0.88, 1.00, 0.94]
    },
    crimson: {
        name: 'crimson',
        themeColor: '#290819',
        logoShadow: [0.85, 0.28, 0.48],
        logoHighlight: [1.00, 0.90, 0.95]
    },
    amber: {
        name: 'amber',
        themeColor: '#241306',
        logoShadow: [0.88, 0.55, 0.16],
        logoHighlight: [1.00, 0.96, 0.82]
    },
    violet: {
        name: 'violet',
        themeColor: '#1c0933',
        logoShadow: [0.68, 0.32, 0.94],
        logoHighlight: [0.98, 0.92, 1.00]
    },
    cyberpunk: {
        name: 'cyberpunk',
        themeColor: '#05140b',
        logoShadow: [0.08, 0.45, 0.20],
        logoHighlight: [0.35, 1.00, 0.45]
    },
    dracula: {
        name: 'dracula',
        themeColor: '#1e1f29',
        logoShadow: [0.55, 0.35, 0.85],
        logoHighlight: [1.00, 0.65, 0.85]
    },
    nord: {
        name: 'nord',
        themeColor: '#1d212a',
        logoShadow: [0.30, 0.55, 0.70],
        logoHighlight: [0.85, 0.95, 1.00]
    },
    solarized: {
        name: 'solarized',
        themeColor: '#001e26',
        logoShadow: [0.10, 0.60, 0.55],
        logoHighlight: [0.90, 0.80, 0.30]
    },
    tokyo: {
        name: 'tokyo',
        themeColor: '#13141c',
        logoShadow: [0.40, 0.45, 0.90],
        logoHighlight: [0.80, 0.70, 1.00]
    },
    gruvbox: {
        name: 'gruvbox',
        themeColor: '#1d2021',
        logoShadow: [0.85, 0.45, 0.15],
        logoHighlight: [0.95, 0.85, 0.55]
    },
    monochrome: {
        name: 'monochrome',
        themeColor: '#000000',
        logoShadow: [0.30, 0.30, 0.30],
        logoHighlight: [1.00, 1.00, 1.00]
    },
    c64: {
        name: 'c64',
        themeColor: '#251c5a',
        logoShadow: [0.45, 0.40, 0.80],
        logoHighlight: [0.90, 0.92, 1.00]
    }
};

const getSavedTheme = () => {
    const fallback = (window.CONFIG && window.CONFIG.theme) || 'indigo';
    const saved = SafeStorage.get('theme', `"${fallback}"`);
    return THEMES[saved] ? saved : 'indigo';
};

/* critical.js already stamped data-theme; just sync the meta tag here */
const savedTheme = getSavedTheme();
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
if (metaThemeColor && THEMES[savedTheme]) {
    metaThemeColor.setAttribute('content', THEMES[savedTheme].themeColor);
}

/* ------------------------------------------------------------
   Session Lifecycle & Instant Startup Continuity
   - data-session is already set by critical.js
   - Here we only manage the rotation anchor and heartbeat
   ------------------------------------------------------------ */
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const nowTime = Date.now();
const isNewSession = root.dataset.session === 'new';

let rotationAnchor = Number(SafeStorage.get('rotation_anchor', '0'));
if (isNewSession || !rotationAnchor) {
    rotationAnchor = nowTime;
    SafeStorage.set('rotation_anchor', rotationAnchor);
}

// Cross-tab session heartbeat
const pingSession = () => SafeStorage.set('last_active_time', Date.now());
pingSession();
setInterval(pingSession, 2000);
window.addEventListener('beforeunload', pingSession);
window.addEventListener('pagehide', pingSession);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pingSession();
});

// Global logo hook stub so it can be called safely at any time
window.setLogoColors = (shadow, highlight) => {};

/* ------------------------------------------------------------
   Spinning dither logo - raw WebGL, one draw call, no libraries
   ------------------------------------------------------------ */
const initLogo = () => {
    const canvas = document.getElementById('app-3d');
    if (!canvas) return;

    if (window.__heliumLogo) {
        window.setLogoColors = (shadow, highlight, immediate = false) => {
            window.__heliumLogo.setColors(shadow, highlight, immediate);
        };
        let running = true;
        const loop = () => {
            if (!running) return;
            window.__heliumLogo.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        document.addEventListener('visibilitychange', () => {
            const wasPaused = !running;
            running = !document.hidden;
            if (wasPaused && running) requestAnimationFrame(loop);
        });
        return;
    }

    const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: true,
        powerPreference: 'low-power'
    }) || canvas.getContext('experimental-webgl');
    if (!gl) {
        canvas.remove();
        return;
    }

    const vertexShader = `
        attribute vec3 aPos;
        attribute vec3 aNormal;
        uniform mat4 uProjection;
        uniform mat4 uModelView;
        varying vec3 vNormal;
        void main() {
            vNormal = mat3(uModelView) * aNormal;
            gl_Position = uProjection * uModelView * vec4(aPos, 1.0);
        }
    `;

    const fragmentShader = `
        precision mediump float;
        varying vec3 vNormal;
        uniform vec3 uShadowColor;
        uniform vec3 uHighlightColor;
        void main() {
            vec3 n = normalize(vNormal);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0));
            float diff = max(dot(n, lightDir), 0.0);
            vec2 pos = floor(gl_FragCoord.xy);
            float dither = mod(pos.x + pos.y, 2.0);
            float stepDiff = step(0.5, diff + (dither * 0.3 - 0.15));
            gl_FragColor = vec4(mix(uShadowColor, uHighlightColor, stepDiff), 1.0);
        }
    `;

    const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        canvas.remove();
        return;
    }
    gl.useProgram(program);

    /* Four 0.5 x 6 x 0.5 bars, rotated 45 degrees apart (flat-shaded,
       pre-rotated on the CPU so we only need one matrix per frame). */
    const buildGeometry = () => {
        const hx = 0.25, hy = 3, hz = 0.25;
        const faces = [
            { n: [1, 0, 0], v: [[hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [hx, -hy, hz]] },
            { n: [-1, 0, 0], v: [[-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-hx, -hy, -hz]] },
            { n: [0, 1, 0], v: [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz]] },
            { n: [0, -1, 0], v: [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz]] },
            { n: [0, 0, 1], v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
            { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] }
        ];
        // two triangles per quad: 0,1,2 / 0,2,3
        const order = [0, 1, 2, 0, 2, 3];
        const verts = [];

        for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 4) * i;
            const c = Math.cos(a), s = Math.sin(a);
            const rot = (p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];

            for (const face of faces) {
                const n = rot(face.n);
                for (const idx of order) {
                    const p = rot(face.v[idx]);
                    verts.push(p[0], p[1], p[2], n[0], n[1], n[2]);
                }
            }
        }
        return new Float32Array(verts);
    };

    const geometry = buildGeometry();
    const vertexCount = geometry.length / 6;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 24, 12);

    const uProjection = gl.getUniformLocation(program, 'uProjection');
    const uModelView = gl.getUniformLocation(program, 'uModelView');
    const uShadowColor = gl.getUniformLocation(program, 'uShadowColor');
    const uHighlightColor = gl.getUniformLocation(program, 'uHighlightColor');

    const initialThemeKey = getSavedTheme();
    const initialTheme = THEMES[initialThemeKey] || THEMES.indigo;

    let currentShadow = [...initialTheme.logoShadow];
    let currentHighlight = [...initialTheme.logoHighlight];
    let targetShadow = [...initialTheme.logoShadow];
    let targetHighlight = [...initialTheme.logoHighlight];

    window.setLogoColors = (shadow, highlight, immediate = false) => {
        targetShadow = shadow;
        targetHighlight = highlight;
        if (immediate) {
            currentShadow = [...shadow];
            currentHighlight = [...highlight];
        }
    };

    // Fixed low-res buffer, upscaled with image-rendering: pixelated so
    // the checkerboard dither stays chunky (same trick as before).
    // The display size goes through --logo-size so CSS can shrink it
    // on short screens.
    const anim = (window.CONFIG && window.CONFIG.animation) || {};
    const displayScale = anim.scale || 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 64 * dpr;
    canvas.height = 64 * dpr;
    root.style.setProperty('--logo-size', (64 * displayScale) + 'px');
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    // 45 degree perspective, camera at z = 10 (matches the old scene)
    const fov = Math.PI / 4;
    const near = 0.1, far = 100;
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    const projection = new Float32Array([
        f, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
    gl.uniformMatrix4fv(uProjection, false, projection);

    const speedX = anim.speedX || 0.0003;
    const speedY = anim.speedY || 0.0005;

    const modelView = new Float32Array(16);
    let running = true;

    const draw = () => {
        const scale = 1;

        // Continuous rotation physics: continues smoothly where it left off across tabs
        const totalElapsed = (Date.now() - rotationAnchor);
        const rx = (totalElapsed * speedX) % (Math.PI * 2);
        const ry = (totalElapsed * speedY) % (Math.PI * 2);
        const sa = Math.sin(rx), ca = Math.cos(rx);
        const sb = Math.sin(ry), cb = Math.cos(ry);

        // column-major Rx * Ry, scaled, translated to z = -10 (view)
        modelView.set([
            cb * scale, sa * sb * scale, -ca * sb * scale, 0,
            0, ca * scale, sa * scale, 0,
            sb * scale, -sa * cb * scale, ca * cb * scale, 0,
            0, 0, -10, 1
        ]);

        gl.uniform3f(uShadowColor, targetShadow[0], targetShadow[1], targetShadow[2]);
        gl.uniform3f(uHighlightColor, targetHighlight[0], targetHighlight[1], targetHighlight[2]);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(uModelView, false, modelView);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    };

    // Render frame 1 immediately and synchronously so canvas is ready before first paint
    draw();

    const loop = () => {
        if (!running) return;
        draw();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
        const wasPaused = !running;
        running = !document.hidden;
        if (wasPaused && running) requestAnimationFrame(loop);
    });
};

/* ------------------------------------------------------------
   Clock
   ------------------------------------------------------------ */
const initClock = () => {
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    let lastRenderKey = '';

    const updateClock = (force = false) => {
        const now = new Date();
        const timeFormat = root.dataset.timeFormat || '24h';
        const showSeconds = root.dataset.showSeconds === 'true';
        const dateFormat = root.dataset.dateFormat || 'full';

        let hours = now.getHours();
        let ampm = '';

        if (timeFormat === '12h' || timeFormat === '12h-noam') {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
        }

        const hStr = timeFormat === '24h' ? String(hours).padStart(2, '0') : String(hours);
        const mStr = String(now.getMinutes()).padStart(2, '0');
        const sStr = String(now.getSeconds()).padStart(2, '0');

        const renderKey = force ? '' : `${hStr}:${mStr}:${showSeconds ? sStr : ''}:${timeFormat}:${dateFormat}`;
        if (renderKey !== lastRenderKey) {
            lastRenderKey = renderKey;

            if (clockEl) {
                clockEl.replaceChildren();
                clockEl.append(document.createTextNode(hStr));

                const colon = document.createElement('span');
                colon.className = 'colon';
                colon.textContent = ':';
                clockEl.append(colon);
                clockEl.append(document.createTextNode(mStr));

                if (showSeconds) {
                    const secSpan = document.createElement('span');
                    secSpan.className = 'clock-sec';
                    secSpan.textContent = ':' + sStr;
                    clockEl.append(secSpan);
                }

                if (timeFormat === '12h') {
                    const ampmSpan = document.createElement('span');
                    ampmSpan.className = 'clock-ampm';
                    ampmSpan.textContent = ampm;
                    clockEl.append(ampmSpan);
                }
            }

            if (dateEl) {
                let dateStr = '';
                if (dateFormat === 'short') {
                    dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                } else if (dateFormat === 'iso') {
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    const d = String(now.getDate()).padStart(2, '0');
                    dateStr = `${y}-${m}-${d}`;
                } else if (dateFormat === 'retro') {
                    const d = String(now.getDate()).padStart(2, '0');
                    const m = String(now.getMonth() + 1).padStart(2, '0');
                    const y = now.getFullYear();
                    const day = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    dateStr = `${d}.${m}.${y} // ${day}`;
                } else {
                    dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                }
                dateEl.textContent = dateStr;
            }
        }
    };

    updateClock();
    window.refreshClock = () => updateClock(true);
    setInterval(updateClock, 1000);
};

/* ------------------------------------------------------------
   Favicons (from SimplePage)
   Each site's icon is found once, shrunk to a small PNG data URL
   and cached in SafeStorage. If the browser won't let us read the
   pixels (no CORS), DuckDuckGo's icon URL is cached instead so we
   never repeat the lookup on the next new tab.
   ------------------------------------------------------------ */
const ICON_PREFIX = 'icon-v5:';
const pendingIcons = {}; // one lookup per site, even if several links share it

// Load any image URL and return it as a small PNG data URL (null on failure)
const toDataURL = (url) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => resolve(null);
    img.onload = () => {
        try {
            const s = Math.min(1, 64 / Math.max(img.naturalWidth, img.naturalHeight));
            const c = document.createElement('canvas');
            c.width = Math.round(img.naturalWidth * s) || 64;
            c.height = Math.round(img.naturalHeight * s) || 64;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL('image/png'));
        } catch (e) { resolve(null); }
    };
    img.src = url;
});

const findIcon = async (pageUrl) => {
    const { origin, hostname } = new URL(pageUrl);
    const urls = [];

    try {
        const res = await fetch(pageUrl, { signal: AbortSignal.timeout(5000) });
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        doc.querySelectorAll('link[rel~="apple-touch-icon"], link[rel~="icon"]').forEach((l) =>
            urls.push(new URL(l.getAttribute('href'), res.url).href)
        );
    } catch (e) { }

    const ddg = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    urls.push(`${origin}/favicon.ico`, ddg);

    for (const url of new Set(urls)) {
        const data = await toDataURL(url);
        if (data) return data;
    }
    return ddg;
};

// Swap the square initial for the real icon, but only once it has loaded
const addFavicon = (a) => {
    const placeholder = a.querySelector('.glyph');
    const show = (src) => {
        const img = new Image(20, 20);
        img.className = 'icon';
        img.alt = '';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => placeholder.replaceWith(img);
        img.src = src;
    };

    if (a.dataset.icon) return show(a.dataset.icon);

    const origin = new URL(a.href).origin;
    const cached = SafeStorage.get(ICON_PREFIX + origin, 'null');
    if (cached) return show(cached);

    pendingIcons[origin] ??= findIcon(a.href).then((icon) => {
        SafeStorage.set(ICON_PREFIX + origin, icon);
        return icon;
    });
    pendingIcons[origin].then(show);
};

/* ------------------------------------------------------------
   Links (from SimplePage) - rendered into Helium's #link-container
   ------------------------------------------------------------ */
const initLinks = () => {
    const linkContainer = document.getElementById('link-container');
    if (!linkContainer) return;

    const defaultSites = () => ((window.CONFIG && window.CONFIG.links) || []).map((s) => ({ ...s }));

    const loadSites = () => {
        const saved = SafeStorage.get('sites', 'null');
        if (Array.isArray(saved)) {
            return saved.filter((s) => s && typeof s.url === 'string' && typeof s.name === 'string');
        }
        return defaultSites();
    };

    let sites = loadSites();
    const saveSites = () => SafeStorage.set('sites', sites);

    // Accepts "example.com" or a full URL; only http(s) is allowed
    const normalizeURL = (input) => {
        let v = input.trim();
        if (!v) return null;
        if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = 'https://' + v;
        try {
            const u = new URL(v);
            return /^https?:$/.test(u.protocol) ? u.href : null;
        } catch (e) { return null; }
    };

    const renderLinks = () => {
        linkContainer.replaceChildren();

        sites.forEach((site, i) => {
            const row = document.createElement('div');
            row.className = 'link';

            const a = document.createElement('a');
            a.href = site.url;
            if (site.icon) a.dataset.icon = site.icon;

            // Check if icon is already cached or explicitly defined
            let cachedIcon = site.icon || null;
            let origin = '';
            try {
                origin = new URL(site.url, window.location.href).origin;
                if (!cachedIcon) {
                    cachedIcon = SafeStorage.get(ICON_PREFIX + origin, null);
                }
            } catch (e) { }

            let iconEl;
            if (cachedIcon) {
                // Instantly render cached or static favicon synchronously - no flash!
                iconEl = document.createElement('img');
                iconEl.className = 'icon';
                iconEl.src = cachedIcon;
                iconEl.alt = '';
                iconEl.width = 20;
                iconEl.height = 20;
                iconEl.decoding = 'async';
                iconEl.referrerPolicy = 'no-referrer';
            } else {
                // Fallback glyph placeholder while asynchronously fetching
                iconEl = document.createElement('span');
                iconEl.className = 'icon glyph';
                iconEl.setAttribute('aria-hidden', 'true');
                iconEl.textContent = site.name.trim().charAt(0) || '\u00b7';
            }

            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = site.name;
            a.append(iconEl, label);

            const rm = document.createElement('button');
            rm.className = 'remove';
            rm.type = 'button';
            rm.textContent = '\u00d7';
            rm.dataset.index = i;
            rm.title = 'Remove';
            rm.setAttribute('aria-label', 'Remove ' + site.name);

            row.append(a, rm);
            linkContainer.append(row);

            if (!cachedIcon) {
                addFavicon(a);
            }
        });

    };

    // remove (event delegation, so it survives re-renders)
    linkContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove');
        if (!btn) return;

        const [removed] = sites.splice(Number(btn.dataset.index), 1);
        saveSites();

        // drop the cached icon if no other link uses that site
        const origin = new URL(removed.url).origin;
        if (!sites.some((s) => new URL(s.url).origin === origin)) {
            SafeStorage.remove(ICON_PREFIX + origin);
            delete pendingIcons[origin];
        }
        renderLinks();
    });

    // add
    const addForm = document.getElementById('add-form');
    const urlInput = addForm.elements.url;

    urlInput.addEventListener('input', () => urlInput.classList.remove('invalid'));

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = normalizeURL(urlInput.value);
        if (!url) {
            urlInput.classList.add('invalid');
            urlInput.focus();
            return;
        }
        const name = addForm.elements.name.value.trim() || new URL(url).hostname.replace(/^www\./, '');
        sites.push({ name, url });
        saveSites();
        renderLinks();
        addForm.reset();
    });

    // reset to the default list
    document.getElementById('reset-sites').addEventListener('click', () => {
        if (!confirm('Reset links to the defaults?')) return;
        sites = defaultSites();
        saveSites();
        renderLinks();
    });

    renderLinks();
};

/* ------------------------------------------------------------
   Settings window (from SimplePage)
   ------------------------------------------------------------ */
const initSettings = () => {
    const DEFAULTS = Object.assign(
        {
            icons: true,
            row: true,
            align: 'left',
            iconAlign: 'text',
            hideClock: false,
            hideDate: false,
            hideSeparator: false,
            hideLinks: false,
            themeView: 'grid',
            underlineStyle: 'dither',
            underlineDir: 'center',
            underlineSpeed: 'normal',
            underlineGap: 'normal',
            timeFormat: '24h',
            showSeconds: false,
            clockStyle: 'sans',
            dateStyle: 'sans',
            clockSize: 'normal',
            dateFormat: 'full'
        },
        (window.CONFIG && window.CONFIG.layout) || {}
    );
    const settings = Object.assign({}, DEFAULTS, SafeStorage.get('settings', '{}'));

    const btn = document.getElementById('settings-btn');
    const win = document.getElementById('window');

    const setMenu = (open) => {
        win.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        root.dataset.menu = open ? 'open' : 'closed'; // CSS uses this to shift the stage
        if (open && window.panelLenis) {
            requestAnimationFrame(() => window.panelLenis.resize());
        }
    };
    setMenu(false);

    const applySettings = () => {
        const isDropdown = settings.themeView === 'dropdown';

        // CSS reads these attributes
        root.dataset.icons = settings.icons;
        root.dataset.row = settings.row;
        root.dataset.align = settings.align;
        root.dataset.iconAlign = settings.iconAlign;
        root.dataset.hideClock = settings.hideClock;
        root.dataset.hideDate = settings.hideDate;
        root.dataset.hideSeparator = settings.hideSeparator;
        root.dataset.hideLinks = settings.hideLinks;
        root.dataset.themeView = isDropdown ? 'dropdown' : 'grid';
        root.dataset.underlineStyle = settings.underlineStyle || 'dither';
        root.dataset.underlineDir = settings.underlineDir || 'center';
        root.dataset.underlineSpeed = settings.underlineSpeed || 'normal';
        root.dataset.underlineGap = settings.underlineGap || 'normal';
        root.dataset.timeFormat = settings.timeFormat || '24h';
        root.dataset.showSeconds = settings.showSeconds ? 'true' : 'false';
        root.dataset.clockStyle = settings.clockStyle || 'sans';
        root.dataset.dateStyle = settings.dateStyle || 'sans';
        root.dataset.clockSize = settings.clockSize || 'normal';
        root.dataset.dateFormat = settings.dateFormat || 'full';

        // keep the controls in sync with the saved values
        document.querySelectorAll('[data-setting]').forEach((box) => {
            box.checked = !!settings[box.dataset.setting];
        });
        document.querySelectorAll('.segmented button[data-key]').forEach((b) => {
            const active = String(settings[b.dataset.key]) === String(b.dataset.value);
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', String(active));
        });

        // Theme view toggle button text: show active mode (grid when grid, dropdown when dropdown)
        const themeViewBtn = document.getElementById('theme-view-btn');
        if (themeViewBtn) {
            themeViewBtn.textContent = isDropdown ? 'dropdown' : 'grid';
            themeViewBtn.classList.toggle('active', isDropdown);
        }

        // Live refresh clock
        if (window.refreshClock) window.refreshClock();

        SafeStorage.set('settings', settings);
    };

    // ---------- Collapsible Section Groups ----------
    const collapsedState = SafeStorage.get('collapsed_groups', '{}');
    document.querySelectorAll('.group-header').forEach((header) => {
        const groupEl = header.closest('.group');
        const groupId = header.dataset.toggleGroup || (groupEl && groupEl.id.replace('sec-', ''));
        const toggleBtn = header.querySelector('.group-toggle-btn');
        const toggleSymbol = header.querySelector('.toggle-symbol');

        const setCollapsed = (collapsed, save = true) => {
            if (!groupEl) return;
            groupEl.dataset.collapsed = collapsed ? 'true' : 'false';
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!collapsed));
            if (toggleSymbol) toggleSymbol.textContent = collapsed ? '+' : '−';
            if (save && groupId) {
                collapsedState[groupId] = collapsed;
                SafeStorage.set('collapsed_groups', collapsedState);
            }
        };

        if (groupId && collapsedState[groupId]) {
            setCollapsed(true, false);
        }

        header.addEventListener('click', (e) => {
            if (e.target.closest('#theme-view-btn')) return;
            const isCurrentlyCollapsed = groupEl.dataset.collapsed === 'true';
            setCollapsed(!isCurrentlyCollapsed, true);
        });
    });

    // ---------- Theme controls ----------
    const defaultTheme = (window.CONFIG && window.CONFIG.theme) || 'indigo';
    let currentTheme = SafeStorage.get('theme', `"${defaultTheme}"`);
    if (!THEMES[currentTheme]) currentTheme = 'indigo';

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }

    const themeViewBtn = document.getElementById('theme-view-btn');
    if (themeViewBtn) {
        themeViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const current = settings.themeView === 'dropdown' ? 'dropdown' : 'grid';
            settings.themeView = current === 'dropdown' ? 'grid' : 'dropdown';
            applySettings();
        });
    }

    const applyTheme = (themeName, immediate = false) => {
        if (!THEMES[themeName]) themeName = 'indigo';
        currentTheme = themeName;
        root.dataset.theme = themeName;

        // Sync browser UI theme-color meta tag
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', THEMES[themeName].themeColor);
        }

        // Sync active state on theme segmented buttons
        document.querySelectorAll('[data-theme]').forEach((b) => {
            const active = b.dataset.theme === themeName;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', String(active));
        });

        // Sync theme dropdown select value
        if (themeSelect) {
            themeSelect.value = themeName;
        }

        // Update WebGL logo shader tint
        if (window.setLogoColors) {
            window.setLogoColors(THEMES[themeName].logoShadow, THEMES[themeName].logoHighlight, immediate);
        }

        SafeStorage.set('theme', themeName);
    };

    document.querySelectorAll('[data-theme]').forEach((b) => {
        b.addEventListener('click', () => {
            applyTheme(b.dataset.theme);
        });
    });

    applyTheme(currentTheme, true);

    // checkboxes
    document.querySelectorAll('[data-setting]').forEach((box) => {
        box.addEventListener('change', () => {
            settings[box.dataset.setting] = box.checked;
            applySettings();
        });
    });

    // segmented controls (text align, icon align, underline, clock, date)
    document.querySelectorAll('.segmented button[data-key]').forEach((b) => {
        b.addEventListener('click', () => {
            settings[b.dataset.key] = b.dataset.value;
            applySettings();
        });
    });

    // edit mode (shows the × buttons); not saved, so it always starts off
    root.dataset.editing = 'false';
    document.getElementById('opt-edit').addEventListener('change', (e) => {
        root.dataset.editing = e.target.checked;
    });

    // open/close the settings window
    btn.addEventListener('click', () => setMenu(win.hidden));
    document.addEventListener('click', (e) => {
        // clicking outside closes it, except on the × buttons so you can remove several in a row
        if (!e.target.closest('#settings, .remove')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !win.hidden) {
            setMenu(false);
            btn.focus();
        }
    });

    applySettings();
};

/* ------------------------------------------------------------
   Lenis Smooth Scrolling
   Official Lenis library integration running on requestAnimationFrame.
   Tuned for responsive, momentum-interpolated scrolling matching
   the Hermes Agent website: responsive wheel, lerp 0.1, native touch.
   ------------------------------------------------------------ */
const initLenis = () => {
    if (typeof Lenis === 'undefined') {
        window.addEventListener('load', () => {
            if (typeof Lenis !== 'undefined') initLenis();
        }, { once: true });
        return;
    }

    const windowLenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true
    });

    const panelEl = document.querySelector('.panel');
    let panelLenis = null;
    if (panelEl) {
        panelLenis = new Lenis({
            wrapper: panelEl,
            content: panelEl,
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: false,
            autoResize: true
        });
        window.panelLenis = panelLenis;
    }

    function raf(time) {
        windowLenis.raf(time);
        if (panelLenis) panelLenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    window.lenis = windowLenis;
};

const start = () => {
    initLogo();
    initClock();

    /* ------------------------------------------------------------
       SimplePage-style features (link grid, settings window,
       favicon cache), using #link-container and SafeStorage.
       Settings go first so the layout attributes are in place
       before the links render.
       ------------------------------------------------------------ */
    initSettings();
    initLinks();
    initLenis();

    const _startupMs = (performance.now() - _perfStart).toFixed(2);
    console.log(`%c[Helium]%c Ready in ${_startupMs}ms (Instant Startup)`, 'color: #adc2ff; font-weight: bold;', 'color: inherit;');
};

if (document.getElementById('app-3d') && document.getElementById('link-container')) {
    start();
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
