document.addEventListener('DOMContentLoaded', function () {

    /* ================================================================
       ELEMENTS
       ================================================================ */
    var bgCanvas = document.getElementById('bgCanvas');
    var bgCtx = bgCanvas.getContext('2d');
    var heartCanvas = document.getElementById('heartCanvas');
    var ctx = heartCanvas.getContext('2d');
    var content = document.getElementById('content');
    var mainTitle = document.getElementById('mainTitle');
    var poem = document.getElementById('poem');
    var question = document.getElementById('question');
    var buttonsC = document.getElementById('buttonsContainer');
    var yesBtn = document.getElementById('yesBtn');
    var noBtn = document.getElementById('noBtn');
    var responseMsg = document.getElementById('responseMessage');
    var floatingDiv = document.getElementById('floatingHearts');
    var celebration = document.getElementById('celebration');

    /* ================================================================
       STATE
       ================================================================ */
    var heartPoints = [];
    var heartComplete = false;
    var currentIdx = 0;
    var totalPoints = 300;
    var sparkles = [];
    var pulsePhase = 0;

    /* ================================================================
       DEVICE DETECTION
       ================================================================ */
    var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth <= 768);

    /* ================================================================
       HIGH-DPI CANVAS SIZING
       ================================================================ */
    function resize() {
        var dpr = window.devicePixelRatio || 1;
        var w = window.innerWidth;
        var h = window.innerHeight;

        // Background canvas
        bgCanvas.width = w * dpr;
        bgCanvas.height = h * dpr;
        bgCanvas.style.width = w + 'px';
        bgCanvas.style.height = h + 'px';
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Heart canvas
        heartCanvas.width = w * dpr;
        heartCanvas.height = h * dpr;
        heartCanvas.style.width = w + 'px';
        heartCanvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Regenerate stars on resize
        initStars();
    }

    var resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 100);
    });
    window.addEventListener('orientationchange', function () {
        setTimeout(resize, 200);
    });
    resize();

    /* ================================================================
       VIEWPORT HELPERS (always use logical pixels)
       ================================================================ */
    function vw() { return window.innerWidth; }
    function vh() { return window.innerHeight; }

    /* ================================================================
       1. STARFIELD
       ================================================================ */
    var stars = [];
    var starCount = isMobile ? 80 : 200; // Fewer stars on mobile for performance

    function initStars() {
        stars = [];
        for (var i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * vw(),
                y: Math.random() * vh(),
                r: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.3 + 0.05,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    initStars();

    function drawStars() {
        bgCtx.clearRect(0, 0, vw(), vh());
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            s.twinkle += 0.02;
            var alpha = 0.4 + 0.6 * Math.abs(Math.sin(s.twinkle));
            bgCtx.beginPath();
            bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            bgCtx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            bgCtx.fill();
            s.y -= s.speed;
            if (s.y < -5) {
                s.y = vh() + 5;
                s.x = Math.random() * vw();
            }
        }
    }

    /* ================================================================
       2. HEART MATH (responsive scale)
       ================================================================ */
    function heartX(t) { return 16 * Math.pow(Math.sin(t), 3); }
    function heartY(t) {
        return 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    }

    function getScale() {
        var minDim = Math.min(vw(), vh());
        // Scale the heart based on screen size:
        //   - On small screens (320px) ≈ 6.4 scale
        //   - On medium (414px) ≈ 8.3
        //   - On desktop (1920px) ≈ 38.4
        // Clamped for visual consistency
        var s = minDim / 50;
        return Math.max(4, Math.min(s, 20));
    }

    function toCanvas(t) {
        var sc = getScale();
        // Center vertically, offset slightly up
        var offsetY = vh() < 700 ? 10 : 30;
        return {
            x: heartX(t) * sc + vw() / 2,
            y: -heartY(t) * sc + vh() / 2 - offsetY
        };
    }

    /* ================================================================
       3. SPARKLE PARTICLES
       ================================================================ */
    var maxSparkles = isMobile ? 40 : 100;

    function addSparkle(x, y) {
        if (sparkles.length >= maxSparkles) return;
        sparkles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            size: Math.random() * 3 + 1,
            hue: Math.random() > 0.5 ? 340 : 40
        });
    }

    function updateSparkles() {
        for (var i = sparkles.length - 1; i >= 0; i--) {
            var sp = sparkles[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.life -= sp.decay;
            if (sp.life <= 0) {
                sparkles.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
            var color = sp.hue === 340
                ? 'rgba(255,85,130,' + sp.life + ')'
                : 'rgba(255,215,0,' + sp.life + ')';
            ctx.fillStyle = color;
            ctx.shadowBlur = isMobile ? 4 : 8;
            ctx.shadowColor = color;
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    /* ================================================================
       4. HEART DRAWING
       ================================================================ */
    function drawHeartOutline(pts, glowAmount) {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = '#ff2d55';
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.shadowBlur = isMobile ? 8 : glowAmount;
        ctx.shadowColor = '#ff2d55';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawFullHeart(extraGlow) {
        ctx.beginPath();
        for (var i = 0; i <= totalPoints; i++) {
            var t = (i / totalPoints) * 2 * Math.PI;
            var p = toCanvas(t);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#ff2d55';
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.shadowBlur = (isMobile ? 8 : 15) + (extraGlow || 0);
        ctx.shadowColor = '#ff2d55';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,45,85,0.06)';
        ctx.shadowBlur = 0;
        ctx.fill();
    }

    /* ================================================================
       5. MAIN RENDER LOOP
       ================================================================ */
    function mainLoop() {
        drawStars();
        ctx.clearRect(0, 0, vw(), vh());

        if (!heartComplete) {
            var step = isMobile ? 4 : 3; // Slightly faster on mobile
            for (var s = 0; s < step; s++) {
                if (currentIdx <= totalPoints) {
                    var t = (currentIdx / totalPoints) * 2 * Math.PI;
                    var p = toCanvas(t);
                    heartPoints.push(p);
                    if (currentIdx % (isMobile ? 6 : 4) === 0) addSparkle(p.x, p.y);
                    currentIdx++;
                } else {
                    heartComplete = true;
                    onHeartComplete();
                    break;
                }
            }

            drawHeartOutline(heartPoints, 15);

            // Glowing tip
            if (heartPoints.length > 0) {
                var tip = heartPoints[heartPoints.length - 1];
                ctx.beginPath();
                ctx.arc(tip.x, tip.y, isMobile ? 3 : 5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = isMobile ? 12 : 25;
                ctx.shadowColor = '#ffffff';
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            updateSparkles();

        } else {
            pulsePhase += 0.06;
            var beat = Math.sin(pulsePhase);
            var extra = Math.max(0, beat) * (isMobile ? 10 : 20);
            drawFullHeart(extra);
            updateSparkles();
        }

        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);

    /* ================================================================
       6. FLOATING HEARTS
       ================================================================ */
    var heartEmojis = ['❤️', '💖', '💕', '💗', '💓', '💘', '🩷', '♥️'];
    var floatInterval = isMobile ? 1200 : 800; // Less frequent on mobile

    function spawnFloatingHeart() {
        var el = document.createElement('span');
        el.className = 'floating-heart';
        el.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.fontSize = (isMobile ? 12 : 14) + Math.random() * (isMobile ? 12 : 18) + 'px';
        var dur = 6 + Math.random() * 6;
        el.style.animationDuration = dur + 's';
        el.style.animationDelay = '0s';
        floatingDiv.appendChild(el);
        setTimeout(function () { el.remove(); }, dur * 1000);
    }

    setInterval(spawnFloatingHeart, floatInterval);
    for (var h = 0; h < (isMobile ? 4 : 8); h++) { setTimeout(spawnFloatingHeart, h * 300); }

    /* ================================================================
       7. SHOW CARD WITH TYPEWRITER
       ================================================================ */
    function onHeartComplete() {
        content.style.display = 'block';
        content.offsetHeight; // force reflow
        content.classList.add('visible');

        var titleText = 'Feliz 14 de Febrero';
        typeWriter(mainTitle, titleText, isMobile ? 60 : 80, function () {
            var poemText = 'Eres la razón por la que mi corazón\nno sigue una línea recta,\nsino la curva más hermosa\nque las matemáticas pudieron crear.\n\nCada latido lleva tu nombre. 💖';
            typeWriter(poem, poemText, isMobile ? 30 : 40, function () {
                question.textContent = '¿Quieres ser mi San Valentín?';
                question.classList.add('show');
                setTimeout(function () {
                    buttonsC.classList.add('show');
                }, 400);
            });
        });
    }

    function typeWriter(element, text, speed, callback) {
        var idx = 0;
        var cursor = document.createElement('span');
        cursor.className = 'cursor';
        element.textContent = '';
        element.appendChild(cursor);

        function type() {
            if (idx < text.length) {
                var char = text.charAt(idx);
                if (char === '\n') {
                    element.insertBefore(document.createElement('br'), cursor);
                } else {
                    element.insertBefore(document.createTextNode(char), cursor);
                }
                idx++;
                setTimeout(type, speed);
            } else {
                setTimeout(function () {
                    if (cursor.parentNode) cursor.remove();
                    if (callback) callback();
                }, 500);
            }
        }
        type();
    }

    /* ================================================================
       8. BUTTON INTERACTIONS (mouse + touch)
       ================================================================ */
    yesBtn.addEventListener('click', function () {
        responseMsg.innerHTML = '<span style="color:#ff2d55;font-size:clamp(1.4rem,5vw,2.2rem);">Te amo ❤️Acabas de aceptar que te Detone</span>';
        responseMsg.classList.add('show');
        launchCelebration();
    });

    var noClickCount = 0;
    var noMessages = [
        'No acepto no por respuesta 😏',
        '¿Segura? Piénsalo otra vez... 🥺',
        'El corazón no acepta eso 💔',
        'Intenta de nuevo... 💕',
        '¡Solo di que sí! 🥰'
    ];

    noBtn.addEventListener('click', function (e) {
        e.preventDefault();
        responseMsg.textContent = noMessages[noClickCount % noMessages.length];
        responseMsg.style.color = '#ffffff';
        responseMsg.classList.add('show');
        noClickCount++;
        escapeButton();
    });

    // Mouse hover escape (desktop)
    noBtn.addEventListener('mouseenter', function () {
        if (!isMobile) escapeButton();
    });

    // Touch move escape (mobile) — move before finger lifts
    noBtn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        responseMsg.textContent = noMessages[noClickCount % noMessages.length];
        responseMsg.style.color = '#ffffff';
        responseMsg.classList.add('show');
        noClickCount++;
        escapeButton();
    }, { passive: false });

    function escapeButton() {
        // Keep button within visible viewport with safe padding
        var btnW = noBtn.offsetWidth || 80;
        var btnH = noBtn.offsetHeight || 48;
        var pad = 20;
        var maxX = vw() - btnW - pad;
        var maxY = vh() - btnH - pad;
        var newX = pad + Math.random() * Math.max(0, maxX - pad);
        var newY = pad + Math.random() * Math.max(0, maxY - pad);

        noBtn.style.position = 'fixed';
        noBtn.style.left = newX + 'px';
        noBtn.style.top = newY + 'px';
        noBtn.style.zIndex = '9999';
        noBtn.style.transition = 'left 0.3s ease, top 0.3s ease';
    }

    /* ================================================================
       9. CELEBRATION
       ================================================================ */
    function launchCelebration() {
        celebration.classList.add('active');

        var heartSymbols = ['❤️', '💖', '💕', '💗', '💓', '💘', '🩷', '✨', '🌟', '💫'];
        var confettiCount = isMobile ? 40 : 80;

        for (var i = 0; i < confettiCount; i++) {
            (function (index) {
                setTimeout(function () {
                    var el = document.createElement('span');
                    el.className = 'confetti-piece heart-confetti';
                    el.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
                    el.style.left = Math.random() * 100 + 'vw';
                    el.style.top = (Math.random() * 40) + 'vh';
                    el.style.fontSize = (isMobile ? 14 : 16) + Math.random() * (isMobile ? 16 : 28) + 'px';
                    el.style.animationDuration = (3 + Math.random() * 3) + 's';
                    celebration.appendChild(el);
                    setTimeout(function () { el.remove(); }, 6000);
                }, index * (isMobile ? 60 : 40));
            })(i);
        }

        // Sparkle burst
        var sparkleCount = isMobile ? 25 : 50;
        for (var j = 0; j < sparkleCount; j++) {
            (function (idx) {
                setTimeout(function () {
                    var dot = document.createElement('div');
                    dot.className = 'sparkle-dot';
                    var angle = Math.random() * Math.PI * 2;
                    var dist = (isMobile ? 40 : 80) + Math.random() * (isMobile ? 100 : 200);
                    dot.style.left = (vw() / 2 + Math.cos(angle) * dist) + 'px';
                    dot.style.top = (vh() / 2 + Math.sin(angle) * dist) + 'px';
                    var colors = ['#ff2d55', '#ffd700', '#ffffff', '#ff85a2'];
                    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
                    var size = (isMobile ? 2 : 3) + Math.random() * (isMobile ? 3 : 5);
                    dot.style.width = dot.style.height = size + 'px';
                    document.body.appendChild(dot);
                    setTimeout(function () { dot.remove(); }, 1000);
                }, idx * 20);
            })(j);
        }

        // Extra floating hearts
        var burstCount = isMobile ? 10 : 20;
        for (var k = 0; k < burstCount; k++) {
            setTimeout(spawnFloatingHeart, k * 100);
        }
    }

});
