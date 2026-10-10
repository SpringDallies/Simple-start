/* ============================================================
   PROJECT HELIUM - critical.js
   ------------------------------------------------------------
   Two-phase critical rendering engine:
   Phase 1 (in <head>): stamps data-* attributes on <html> synchronously
     before first paint so CSS applies the correct theme and layout tokens.
   Phase 2 (right after <main>): populates the clock, date, links, and
     draws the 3D dither logo frame 1 synchronously BEFORE the browser paints.
   Eliminates both the flash of default theme / clock and the split second
   of empty space / missing components on startup.
   ============================================================ */

(function () {
    'use strict';

    var PREFIX = 'helium_';
    var root = document.documentElement;

    function get(key, fallback) {
        try {
            var raw = localStorage.getItem(PREFIX + key);
            return raw !== null ? JSON.parse(raw) : JSON.parse(fallback);
        } catch (e) {
            return JSON.parse(fallback);
        }
    }

    var VALID_THEMES = [
        'indigo', 'obsidian', 'emerald', 'crimson', 'amber', 'violet',
        'cyberpunk', 'dracula', 'nord', 'solarized', 'tokyo', 'gruvbox',
        'monochrome', 'c64'
    ];

    var THEME_COLORS = {
        indigo:     { shadow: [0.38, 0.52, 0.95], highlight: [0.92, 0.95, 1.00], themeColor: '#152671' },
        obsidian:   { shadow: [0.36, 0.36, 0.44], highlight: [0.96, 0.97, 1.00], themeColor: '#101014' },
        emerald:    { shadow: [0.15, 0.68, 0.50], highlight: [0.88, 1.00, 0.94], themeColor: '#06211a' },
        crimson:    { shadow: [0.85, 0.28, 0.48], highlight: [1.00, 0.90, 0.95], themeColor: '#290819' },
        amber:      { shadow: [0.88, 0.55, 0.16], highlight: [1.00, 0.96, 0.82], themeColor: '#241306' },
        violet:     { shadow: [0.68, 0.32, 0.94], highlight: [0.98, 0.92, 1.00], themeColor: '#1c0933' },
        cyberpunk:  { shadow: [0.08, 0.45, 0.20], highlight: [0.35, 1.00, 0.45], themeColor: '#05140b' },
        dracula:    { shadow: [0.55, 0.35, 0.85], highlight: [1.00, 0.65, 0.85], themeColor: '#1e1f29' },
        nord:       { shadow: [0.30, 0.55, 0.70], highlight: [0.85, 0.95, 1.00], themeColor: '#1d212a' },
        solarized:  { shadow: [0.10, 0.60, 0.55], highlight: [0.90, 0.80, 0.30], themeColor: '#001e26' },
        tokyo:      { shadow: [0.40, 0.45, 0.90], highlight: [0.80, 0.70, 1.00], themeColor: '#13141c' },
        gruvbox:    { shadow: [0.85, 0.45, 0.15], highlight: [0.95, 0.85, 0.55], themeColor: '#1d2021' },
        monochrome: { shadow: [0.30, 0.30, 0.30], highlight: [1.00, 1.00, 1.00], themeColor: '#000000' },
        c64:        { shadow: [0.45, 0.40, 0.80], highlight: [0.90, 0.92, 1.00], themeColor: '#251c5a' }
    };

    // ============================================================
    // PHASE 1: Head initialization (stamps data-* attributes on <html>)
    // ============================================================
    if (!root.dataset.criticalPhase1Done) {
        var fallbackTheme = (window.CONFIG && window.CONFIG.theme) || 'indigo';
        var savedTheme = get('theme', JSON.stringify(fallbackTheme));
        if (VALID_THEMES.indexOf(savedTheme) === -1) savedTheme = 'indigo';
        root.dataset.theme = savedTheme;

        var metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme && THEME_COLORS[savedTheme]) {
            metaTheme.setAttribute('content', THEME_COLORS[savedTheme].themeColor);
        }

        var configLayout = (window.CONFIG && window.CONFIG.layout) || {};
        var settings = get('settings', '{}');
        if (!settings || typeof settings !== 'object') settings = {};

        root.dataset.icons       = settings.icons !== undefined ? settings.icons : (configLayout.icons !== undefined ? configLayout.icons : true);
        root.dataset.row         = settings.row !== undefined ? settings.row : (configLayout.row !== undefined ? configLayout.row : true);
        root.dataset.align       = settings.align || configLayout.align || 'left';
        root.dataset.iconAlign   = settings.iconAlign || configLayout.iconAlign || 'text';
        root.dataset.hideClock   = settings.hideClock !== undefined ? settings.hideClock : (configLayout.hideClock || false);
        root.dataset.hideDate    = settings.hideDate !== undefined ? settings.hideDate : (configLayout.hideDate || false);
        root.dataset.hideSeparator = settings.hideSeparator !== undefined ? settings.hideSeparator : (configLayout.hideSeparator || false);
        root.dataset.hideLinks   = settings.hideLinks !== undefined ? settings.hideLinks : (configLayout.hideLinks || false);
        root.dataset.themeView   = settings.themeView === 'dropdown' ? 'dropdown' : (configLayout.themeView === 'dropdown' ? 'dropdown' : 'grid');
        root.dataset.underlineStyle = settings.underlineStyle || configLayout.underlineStyle || 'dither';
        root.dataset.underlineDir   = settings.underlineDir || configLayout.underlineDir || 'center';
        root.dataset.underlineSpeed = settings.underlineSpeed || configLayout.underlineSpeed || 'normal';
        root.dataset.underlineGap   = settings.underlineGap || configLayout.underlineGap || 'normal';
        root.dataset.timeFormat     = settings.timeFormat || configLayout.timeFormat || '24h';
        root.dataset.showSeconds    = (settings.showSeconds !== undefined ? settings.showSeconds : configLayout.showSeconds) ? 'true' : 'false';
        root.dataset.clockStyle     = settings.clockStyle || configLayout.clockStyle || 'sans';
        root.dataset.dateStyle      = settings.dateStyle || configLayout.dateStyle || 'sans';
        root.dataset.clockSize      = settings.clockSize || configLayout.clockSize || 'normal';
        root.dataset.dateFormat     = settings.dateFormat || configLayout.dateFormat || 'full';

        var SESSION_TIMEOUT_MS = 15 * 60 * 1000;
        var now = Date.now();
        var lastActive = Number(get('last_active_time', '0'));
        var navEntry = (window.performance && window.performance.getEntriesByType &&
                        window.performance.getEntriesByType('navigation')[0]);
        var isReload = navEntry ? navEntry.type === 'reload' : false;
        var isNewSession = !lastActive || (now - lastActive > SESSION_TIMEOUT_MS) || isReload;

        root.dataset.session = isNewSession ? 'new' : 'active';
        root.dataset.criticalPhase1Done = 'true';
    }

    // ============================================================
    // PHASE 2: Synchronously render stage components if parsed
    // ============================================================
    if (document.getElementById('clock') || document.getElementById('link-container')) {
        renderClock();
        renderLinks();
        renderLogo();
        root.dataset.ready = 'true';
    }

    function renderClock() {
        var clockEl = document.getElementById('clock');
        var dateEl = document.getElementById('date');
        if (!clockEl && !dateEl) return;

        var now = new Date();
        var timeFormat = root.dataset.timeFormat || '24h';
        var showSeconds = root.dataset.showSeconds === 'true';
        var dateFormat = root.dataset.dateFormat || 'full';

        var hours = now.getHours();
        var ampm = '';

        if (timeFormat === '12h' || timeFormat === '12h-noam') {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
        }

        var hStr = timeFormat === '24h' ? (hours < 10 ? '0' + hours : '' + hours) : '' + hours;
        var min = now.getMinutes();
        var mStr = min < 10 ? '0' + min : '' + min;
        var sec = now.getSeconds();
        var sStr = sec < 10 ? '0' + sec : '' + sec;

        if (clockEl) {
            clockEl.textContent = '';
            clockEl.appendChild(document.createTextNode(hStr));

            var colon = document.createElement('span');
            colon.className = 'colon';
            colon.textContent = ':';
            clockEl.appendChild(colon);
            clockEl.appendChild(document.createTextNode(mStr));

            if (showSeconds) {
                var secSpan = document.createElement('span');
                secSpan.className = 'clock-sec';
                secSpan.textContent = ':' + sStr;
                clockEl.appendChild(secSpan);
            }

            if (timeFormat === '12h') {
                var ampmSpan = document.createElement('span');
                ampmSpan.className = 'clock-ampm';
                ampmSpan.textContent = ampm;
                clockEl.appendChild(ampmSpan);
            }
        }

        if (dateEl) {
            var dateStr = '';
            if (dateFormat === 'short') {
                dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else if (dateFormat === 'iso') {
                var y = now.getFullYear();
                var m = now.getMonth() + 1;
                var d = now.getDate();
                dateStr = y + '-' + (m < 10 ? '0' + m : '' + m) + '-' + (d < 10 ? '0' + d : '' + d);
            } else if (dateFormat === 'retro') {
                var d2 = now.getDate();
                var m2 = now.getMonth() + 1;
                var y2 = now.getFullYear();
                var day = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                dateStr = (d2 < 10 ? '0' + d2 : '' + d2) + '.' + (m2 < 10 ? '0' + m2 : '' + m2) + '.' + y2 + ' // ' + day;
            } else {
                dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            }
            dateEl.textContent = dateStr;
        }
    }

    function renderLinks() {
        var linkContainer = document.getElementById('link-container');
        if (!linkContainer || linkContainer.childElementCount > 0) return;

        var sites = get('sites', 'null');
        if (!Array.isArray(sites)) {
            sites = (window.CONFIG && window.CONFIG.links) || [
                { name: 'Youtube', url: 'https://www.youtube.com/' },
                { name: 'Reddit', url: 'https://www.reddit.com/' },
                { name: 'Forums', url: 'https://cracked.st/' },
                { name: 'Anime', url: 'https://reanime.to/' },
                { name: 'Pinterest', url: 'https://in.pinterest.com/' },
                { name: 'Fmhy', url: 'https://fmhy.net', icon: 'fmhy.png' },
                { name: 'Linux', url: 'https://archive.org/details/native-linux-games-collection?tab=collection' },
                { name: 'Cobalt', url: 'https://cobalt.meowing.de/' }
            ];
        }

        var ICON_PREFIX = 'helium_icon-v5:';
        linkContainer.textContent = '';

        sites.forEach(function (site, i) {
            if (!site || !site.url || !site.name) return;
            var row = document.createElement('div');
            row.className = 'link';

            var a = document.createElement('a');
            a.href = site.url;
            if (site.icon) a.dataset.icon = site.icon;

            var cachedIcon = site.icon || null;
            try {
                var origin = new URL(site.url, window.location.href).origin;
                if (!cachedIcon) {
                    var cached = localStorage.getItem(ICON_PREFIX + origin);
                    if (cached) cachedIcon = JSON.parse(cached);
                }
            } catch (e) { }

            var iconEl;
            if (cachedIcon) {
                iconEl = document.createElement('img');
                iconEl.className = 'icon';
                iconEl.src = cachedIcon;
                iconEl.alt = '';
                iconEl.width = 20;
                iconEl.height = 20;
                iconEl.decoding = 'async';
                iconEl.referrerPolicy = 'no-referrer';
            } else {
                iconEl = document.createElement('span');
                iconEl.className = 'icon glyph';
                iconEl.setAttribute('aria-hidden', 'true');
                iconEl.textContent = (site.name && site.name.trim().charAt(0)) || '\u00b7';
            }

            var label = document.createElement('span');
            label.className = 'label';
            label.textContent = site.name;
            a.appendChild(iconEl);
            a.appendChild(label);

            var rm = document.createElement('button');
            rm.className = 'remove';
            rm.type = 'button';
            rm.textContent = '\u00d7';
            rm.dataset.index = i;
            rm.title = 'Remove';
            rm.setAttribute('aria-label', 'Remove ' + site.name);

            row.appendChild(a);
            row.appendChild(rm);
            linkContainer.appendChild(row);
        });
    }

    function renderLogo() {
        var canvas = document.getElementById('app-3d');
        if (!canvas || canvas._glReady) return;

        var gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            depth: true,
            powerPreference: 'low-power'
        }) || canvas.getContext('experimental-webgl');
        if (!gl) return;

        var vertexShader = 'attribute vec3 aPos; attribute vec3 aNormal; uniform mat4 uProjection; uniform mat4 uModelView; varying vec3 vNormal; void main() { vNormal = mat3(uModelView) * aNormal; gl_Position = uProjection * uModelView * vec4(aPos, 1.0); }';
        var fragmentShader = 'precision mediump float; varying vec3 vNormal; uniform vec3 uShadowColor; uniform vec3 uHighlightColor; void main() { vec3 n = normalize(vNormal); vec3 lightDir = normalize(vec3(0.5, 1.0, 1.0)); float diff = max(dot(n, lightDir), 0.0); vec2 pos = floor(gl_FragCoord.xy); float dither = mod(pos.x + pos.y, 2.0); float stepDiff = step(0.5, diff + (dither * 0.3 - 0.15)); gl_FragColor = vec4(mix(uShadowColor, uHighlightColor, stepDiff), 1.0); }';

        function compileShader(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }

        var prog = gl.createProgram();
        gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vertexShader));
        gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fragmentShader));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
        gl.useProgram(prog);

        var hx = 0.25, hy = 3, hz = 0.25;
        var faces = [
            { n: [1, 0, 0], v: [[hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [hx, -hy, hz]] },
            { n: [-1, 0, 0], v: [[-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-hx, -hy, -hz]] },
            { n: [0, 1, 0], v: [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz]] },
            { n: [0, -1, 0], v: [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz]] },
            { n: [0, 0, 1], v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
            { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] }
        ];
        var order = [0, 1, 2, 0, 2, 3];
        var verts = [];
        for (var i = 0; i < 4; i++) {
            var a = (Math.PI / 4) * i;
            var c = Math.cos(a), s = Math.sin(a);
            var rot = function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
            for (var f = 0; f < faces.length; f++) {
                var face = faces[f];
                var n = rot(face.n);
                for (var o = 0; o < order.length; o++) {
                    var p = rot(face.v[order[o]]);
                    verts.push(p[0], p[1], p[2], n[0], n[1], n[2]);
                }
            }
        }
        var geometry = new Float32Array(verts);
        var vertexCount = geometry.length / 6;

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);

        var aPos = gl.getAttribLocation(prog, 'aPos');
        var aNormal = gl.getAttribLocation(prog, 'aNormal');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 24, 12);

        var uProjection = gl.getUniformLocation(prog, 'uProjection');
        var uModelView = gl.getUniformLocation(prog, 'uModelView');
        var uShadowColor = gl.getUniformLocation(prog, 'uShadowColor');
        var uHighlightColor = gl.getUniformLocation(prog, 'uHighlightColor');

        var currentTheme = root.dataset.theme || 'indigo';
        var themeData = THEME_COLORS[currentTheme] || THEME_COLORS.indigo;
        var currentShadow = themeData.shadow.slice();
        var currentHighlight = themeData.highlight.slice();
        var targetShadow = themeData.shadow.slice();
        var targetHighlight = themeData.highlight.slice();

        var anim = (window.CONFIG && window.CONFIG.animation) || {};
        var displayScale = anim.scale || 1.5;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = 64 * dpr;
        canvas.height = 64 * dpr;
        root.style.setProperty('--logo-size', (64 * displayScale) + 'px');
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0);

        var fov = Math.PI / 4, near = 0.1, far = 100;
        var f = 1 / Math.tan(fov / 2);
        var nf = 1 / (near - far);
        var projection = new Float32Array([
            f, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
        gl.uniformMatrix4fv(uProjection, false, projection);

        var speedX = anim.speedX || 0.0003;
        var speedY = anim.speedY || 0.0005;
        var modelView = new Float32Array(16);
        var rotationAnchor = Number(get('rotation_anchor', '0')) || Date.now();

        function draw() {
            var scale = 1;
            var totalElapsed = Date.now() - rotationAnchor;
            var rx = (totalElapsed * speedX) % (Math.PI * 2);
            var ry = (totalElapsed * speedY) % (Math.PI * 2);
            var sa = Math.sin(rx), ca = Math.cos(rx);
            var sb = Math.sin(ry), cb = Math.cos(ry);

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
        }

        draw();
        canvas._glReady = true;

        window.__heliumLogo = {
            gl: gl,
            prog: prog,
            draw: draw,
            setColors: function (shadow, highlight, immediate) {
                targetShadow = shadow;
                targetHighlight = highlight;
                if (immediate) {
                    currentShadow = shadow.slice();
                    currentHighlight = highlight.slice();
                }
            }
        };
    }
})();
