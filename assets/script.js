document.addEventListener('DOMContentLoaded', () => {

    // ====================================================
    // 1. LOGIKA NAVBAR (DYNAMIC INDICATOR)
    // ====================================================
    const indicator = document.getElementById('dynamic-indicator');
    const navLinks = document.querySelectorAll('.nav-link-item');

    // Fungsi untuk menggeser indikator hitam/ungu di belakang menu
    function moveIndicator(target) {
        if (!indicator || !target) return;
        
        // Menyesuaikan ukuran dan posisi indikator sesuai menu yang diklik
        indicator.style.width = target.offsetWidth + 'px';
        indicator.style.left = target.offsetLeft + 'px';
        indicator.style.top = target.offsetTop + 'px';
        
        // Menghapus class text-white dari semua link
        navLinks.forEach(l => l.classList.remove('text-white'));
        
        // Menambahkan text-white ke link yang sedang aktif agar kontras
        target.classList.add('text-white');
    }

    // Menambahkan event listener ke setiap menu navbar
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            moveIndicator(e.currentTarget);
        });
    });

    // Jalankan sekali saat halaman pertama kali dimuat (Set ke Home)
    if (navLinks.length > 0) {
        // Delay sedikit agar posisi elemen sudah ter-render sempurna oleh browser
        setTimeout(() => moveIndicator(navLinks[0]), 100); 
    }


    // ====================================================
    // 2. LOGIKA LAMPU TARIK (HERO SECTION)
    // ====================================================
    const cord = document.getElementById('js-cord');
    const hit = document.getElementById('js-hit');
    const lampEl = document.querySelector('.lamp');

    if (cord && hit && lampEl) {
        const AX = 124, AY = 190;
        const REST_X = 124, REST_Y = 348;
        const TRIGGER_DIST = 55;

        let dragging = false;
        let animating = false;
        let lightOn = false; // Default mati
        let curX = REST_X, curY = REST_Y;

        function toSVG(sx, sy) {
            const pt = lampEl.createSVGPoint();
            pt.x = sx; 
            pt.y = sy;
            return pt.matrixTransform(lampEl.getScreenCTM().inverse());
        }

        function buildCord(tx, ty) {
            const dx = tx - AX;
            const dy = ty - AY;
            const sag = Math.max(4, 30 - Math.hypot(dx, dy) * 0.06);
            const c1x = AX + dx * 0.15 + sag;
            const c1y = AY + dy * 0.30 + sag;
            const c2x = AX + dx * 0.70 - sag * 0.3;
            const c2y = AY + dy * 0.72 - sag * 0.2;
            return `M${AX},${AY} C${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`;
        }

        function updateCord(tx, ty) {
            curX = tx; 
            curY = ty;
            cord.setAttribute('d', buildCord(tx, ty));
            const tension = Math.min(Math.hypot(tx - REST_X, ty - REST_Y) / 120, 1);
            cord.style.stroke = `hsl(270, 0%, ${Math.round(38 + tension * 52)}%)`;
        }

        function springBack(fromX, fromY, triggered) {
            if (animating) return; 
            animating = true;
            
            const dur = triggered ? 380 : 500;
            const t0 = performance.now();
            
            function tick(now) {
                let t = Math.min((now - t0) / dur, 1);
                
                let fn;
                if (triggered) {
                    // easeElastic
                    fn = (t === 0 || t === 1) ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
                } else {
                    // easeOutBounce
                    if (t < 1 / 2.75) {
                        fn = 7.5625 * t * t;
                    } else if (t < 2 / 2.75) {
                        t -= 1.5 / 2.75;
                        fn = 7.5625 * t * t + 0.750;
                    } else if (t < 2.5 / 2.75) {
                        t -= 2.25 / 2.75;
                        fn = 7.5625 * t * t + 0.9375;
                    } else {
                        t -= 2.625 / 2.75;
                        fn = 7.5625 * t * t + 0.984375;
                    }
                }

                updateCord(fromX + (REST_X - fromX) * fn, fromY + (REST_Y - fromY) * fn);
                
                if (t < 1) { 
                    requestAnimationFrame(tick); 
                    return; 
                }
                
                updateCord(REST_X, REST_Y); 
                cord.style.stroke = ''; 
                animating = false;
            }
            requestAnimationFrame(tick);
        }

        function onDown(e) { 
            if (!animating) { 
                e.preventDefault(); 
                dragging = true; 
            } 
        }

        function onMove(e) {
            if (!dragging) return; 
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const sv = toSVG(clientX, clientY); 
            updateCord(sv.x, Math.max(AY + 20, sv.y));
        }

        function onUp() {
            if (!dragging) return; 
            dragging = false;
            
            const dist = Math.hypot(curX - REST_X, curY - REST_Y);
            
            if (dist > TRIGGER_DIST) {
                lightOn = !lightOn;
                document.documentElement.style.setProperty('--lamp-on', lightOn ? '1' : '0');
                
                // Play audio klik
                const clickAudio = new Audio("assets/click-sound.mp3");
                clickAudio.currentTime = 0;
                clickAudio.play().catch(e => console.log("Audio failed to play", e));
            }
            
            springBack(curX, curY, dist > TRIGGER_DIST);
        }

        // Listener untuk tali lampu
        [hit, cord].forEach(el => { 
            el.addEventListener('mousedown', onDown); 
            el.addEventListener('touchstart', onDown, {passive: false}); 
        });
        
        window.addEventListener('mousemove', onMove); 
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, {passive: false}); 
        window.addEventListener('touchend', onUp);
        
        // Memastikan lampu mati saat baru pindah ke dark mode via toggle
        const themeToggle = document.getElementById('theme-toggle');
        if(themeToggle) {
            themeToggle.addEventListener('change', () => { 
                if(themeToggle.checked) { 
                    lightOn = false; 
                    document.documentElement.style.setProperty('--lamp-on', '0'); 
                }
            });
        }
    }


    // ====================================================
    // 3. DARK MODE TOGGLE & LIGHTBOX
    // ====================================================
    const toggle = document.getElementById('theme-toggle');
    
    if (toggle) {
        const saved = localStorage.getItem('theme');
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set state awal
        if (saved === 'dark' || (!saved && sysDark)) { 
            toggle.checked = true; 
            document.body.classList.add('dark-mode'); 
        }
        
        // Listener toggle
        toggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', toggle.checked);
            localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
        });
    }

    // Modal Galeri / Lightbox
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const closeBtn = document.getElementById('closeModal');
    
    if (modal && closeBtn) {
        document.querySelectorAll('.img-trigger').forEach(img => {
            img.addEventListener('click', function() { 
                modal.classList.remove('hidden'); 
                modalImg.src = this.src; 
                document.body.style.overflow = 'hidden'; 
            });
        });
        
        closeBtn.addEventListener('click', () => { 
            modal.classList.add('hidden'); 
            document.body.style.overflow = 'auto'; 
        });
        
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) { 
                modal.classList.add('hidden'); 
                document.body.style.overflow = 'auto'; 
            }
        });
    }


    // ====================================================
    // 4. EFEK KURSOR (METEOR SIANG & ASAP AURORA MALAM)
    // ====================================================
    const canvas = document.getElementById("canvas1");
    
    if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight;
        
        let particlesArray = []; 
        let hue = 0; 
        
        window.addEventListener("resize", () => { 
            canvas.width = window.innerWidth; 
            canvas.height = window.innerHeight; 
        });

        const mouse = { 
            x: -100, y: -100, 
            lastX: -100, lastY: -100, 
            speedX: 0, speedY: 0 
        };

        window.addEventListener("mousemove", (event) => {
            mouse.speedX = event.clientX - mouse.lastX || 0; 
            mouse.speedY = event.clientY - mouse.lastY || 0;
            mouse.x = event.clientX; 
            mouse.y = event.clientY; 
            mouse.lastX = mouse.x; 
            mouse.lastY = mouse.y;
            
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Mode malam memunculkan awan asap 1 per gerak, siang meteor 2 per gerak
            const count = isDarkMode ? 1 : 2; 
            
            for (let i = 0; i < count; i++) {
                particlesArray.push(new Particle(isDarkMode));
            }
            hue += 2;
        });

        class Particle {
            constructor(isDarkMode) {
                this.x = mouse.x; 
                this.y = mouse.y; 
                this.isAurora = isDarkMode;
                
                if (this.isAurora) {
                    // --- SETTING BAYANGAN ASAP AURORA ---
                    this.size = Math.random() * 50 + 50; // Sangat besar agar seperti awan
                    this.speedX = (Math.random() - 0.5) * 0.5; 
                    this.speedY = (Math.random() - 0.5) * 0.5 - 0.5; // Sedikit naik
                    
                    // Warna Cyan, Ungu, Hijau khas Aurora
                    const auroraHues = [160, 200, 260]; 
                    const baseHue = auroraHues[Math.floor(Math.random() * auroraHues.length)];
                    this.baseColor = `hsl(${baseHue}, 100%, 60%)`;
                    
                    this.alpha = Math.random() * 0.08 + 0.02; // Transparansi sangat rendah
                    this.decay = Math.random() * 0.002 + 0.001; // Memudar sangat lambat
                } else {
                    // --- SETTING METEOR SIANG ---
                    this.speedX = (Math.random() * 2 - 1) + (mouse.speedX * 0.1); 
                    this.speedY = (Math.random() * 2 - 1) + (mouse.speedY * 0.1);
                    this.size = Math.random() * 15 + 5; 
                    this.baseColor = 'hsl(' + hue + ', 100%, 50%)'; 
                    this.alpha = 1; 
                    this.decay = Math.random() * 0.02 + 0.01; 
                }
            }
            
            update() {
                this.x += this.speedX; 
                this.y += this.speedY;
                
                if (this.isAurora) { 
                    // Asap mengembang dan melambai perlahan
                    this.size += 0.5; 
                    this.x += Math.sin(this.alpha * 20) * 0.5; 
                } else { 
                    // Gravitasi meteor
                    this.speedY += 0.05; 
                    if (this.size > 0.5) this.size -= 0.1; 
                }
                
                this.alpha -= this.decay;
            }
            
            draw() {
                if (this.alpha <= 0 || this.size <= 0) return;
                
                ctx.save(); 
                ctx.globalAlpha = this.alpha;
                
                if (this.isAurora) {
                    // MENGGAMBAR ASAP AURORA (Radial Gradient untuk efek blur transparan)
                    ctx.globalCompositeOperation = 'screen'; 
                    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                    gradient.addColorStop(0, this.baseColor); 
                    gradient.addColorStop(1, 'transparent'); 
                    
                    ctx.fillStyle = gradient; 
                    ctx.beginPath(); 
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
                    ctx.fill();
                } else {
                    // MENGGAMBAR METEOR
                    const tailLengthX = this.speedX * -5;
                    const tailLengthY = this.speedY * -5;
                    
                    ctx.lineWidth = this.size; 
                    ctx.lineCap = 'round'; 
                    ctx.strokeStyle = this.baseColor;
                    
                    ctx.beginPath(); 
                    ctx.moveTo(this.x, this.y); 
                    ctx.lineTo(this.x + tailLengthX, this.y + tailLengthY); 
                    ctx.stroke();
                    
                    ctx.shadowBlur = 15; 
                    ctx.shadowColor = this.baseColor; 
                    ctx.fillStyle = this.baseColor;
                    
                    ctx.beginPath(); 
                    ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2); 
                    ctx.fill();
                }
                ctx.restore();
            }
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update(); 
                particlesArray[i].draw();
                if (particlesArray[i].alpha <= 0) { 
                    particlesArray.splice(i, 1); 
                    i--; 
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    }
});


// ====================================================
// 5. EFEK PERCIKAN LISTRIK (KORSLET)
// ====================================================
setInterval(() => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const isLampOn = document.documentElement.style.getPropertyValue('--lamp-on').trim() === '1';
    
    // Hanya muncul jika di dark mode dan lampu ditarik nyala
    if (isDarkMode && isLampOn) {
        const container = document.querySelector('.hero-content-toggle h1');
        
        // Random chance agar listrik tidak terus-menerus muncul (lebih natural)
        if (container && Math.random() > 0.4) {
            const spark = document.createElement('div');
            spark.classList.add('electric-spark');
            
            spark.style.left = (Math.random() * 100) + '%'; 
            spark.style.top = (Math.random() * 100) + '%';
            spark.style.setProperty('--dir-x', (Math.random() * 2 - 1)); 
            spark.style.setProperty('--dir-y', (Math.random() * 2 - 1));
            spark.style.setProperty('--rot', (Math.random() * 360) + 'deg');
            
            // Animasi kilat sangat cepat
            spark.style.animation = `electric-zap ${Math.random() * 0.2 + 0.1}s linear forwards`;
            
            container.appendChild(spark);
            
            // Bersihkan elemen dari DOM setelah animasi selesai
            setTimeout(() => {
                spark.remove();
            }, 300);
        }
    }
}, 50);