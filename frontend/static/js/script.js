let API_BASE_URL = '';

document.addEventListener('DOMContentLoaded', async () => {

    /* =============================================
       INITIALIZE CONFIG (from Vercel Env Vars)
    ============================================= */
    try {
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        API_BASE_URL = configData.RENDER_API_URL;
        console.log('Backend connected at:', API_BASE_URL);
    } catch (err) {
        console.error('Failed to load API configuration:', err);
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_BASE_URL = 'http://127.0.0.1:5000';
        }
    }

    const loader = document.getElementById('page-loader');
    const hideLoader = () => {
        if (loader) loader.classList.add('hidden');
    };
    
    if (loader) {
        window.addEventListener('load', () => setTimeout(hideLoader, 350));
        setTimeout(hideLoader, 3000); 
    }

    /* =============================================
       API: LOAD FEATURES (Index Page)
    ============================================= */
    const featuresGrid = document.getElementById('features-grid');
    const predictionForm = document.getElementById('prediction-form');
    const loadingIndicator = document.getElementById('loading-features');

    if (featuresGrid && predictionForm) {
        fetch(`${API_BASE_URL}/api/features`)
            .then(res => res.json())
            .then(data => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                predictionForm.style.display = 'block';
                
                data.features.forEach((feat, i) => {
                    const field = document.createElement('div');
                    field.className = 'field';
                    if (data.features.length === 8 && i >= 6) {
                        field.classList.add('span-3');
                    }
                    field.style.animation = `page-enter 0.5s ${i * 0.06}s both`;
                    const labelText = feat.replace(/_/g, ' ').replace(/\(/g, '').replace(/\)/g, '');
                    const placeholder = feat.split('(')[0].trim();
                    field.innerHTML = `
                        <label for="${feat}">${labelText}</label>
                        <input type="number" step="0.01" name="${feat}" id="${feat}" required placeholder="${placeholder}">
                    `;
                    featuresGrid.appendChild(field);
                });
            })
            .catch(err => {
                console.error('Failed to load features:', err);
                if (loadingIndicator) loadingIndicator.innerHTML = `<p style="color: #ff4d4d;">Error connecting to API.</p>`;
            });
    }

    /* =============================================
       API: PREDICT
    ============================================= */
    if (predictionForm) {
        predictionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            btn.textContent = 'Analysing Climate Data…';
            btn.disabled = true;
            if (loader) loader.classList.remove('hidden');

            const formData = new FormData(predictionForm);
            const jsonData = {};
            formData.forEach((value, key) => jsonData[key] = value);

            fetch(`${API_BASE_URL}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    sessionStorage.setItem('latest_prediction', JSON.stringify(data));
                    fetch(`${API_BASE_URL}/api/metrics`)
                        .then(res => res.json())
                        .then(metrics => {
                            sessionStorage.setItem('model_metrics', JSON.stringify(metrics));
                            window.location.href = 'result.html';
                        });
                } else {
                    alert('Prediction failed: ' + (data.error || 'Unknown error'));
                    btn.disabled = false;
                    btn.textContent = 'Generate Climate Prediction →';
                    hideLoader();
                }
            })
            .catch(err => {
                console.error('Prediction error:', err);
                btn.disabled = false;
                btn.textContent = 'Generate Climate Prediction →';
                hideLoader();
            });
        });
    }

    /* =============================================
       API: HISTORY
    ============================================= */
    const historyList = document.querySelector('.history-list');
    const emptyState = document.querySelector('.empty-state');
    if (historyList) {
        fetch(`${API_BASE_URL}/api/history`)
            .then(res => res.json())
            .then(data => {
                hideLoader();
                if (data.length > 0) {
                    if (emptyState) emptyState.style.display = 'none';
                    data.forEach((item, i) => {
                        const card = document.createElement('div');
                        card.className = 'history-card';
                        card.style.animationDelay = `${i * 0.07}s`;
                        card.innerHTML = `
                            <div class="h-temp">${item.prediction}°C</div>
                            <div class="h-divider"></div>
                            <div class="h-meta">
                                <span class="h-time">🕒 ${item.timestamp}</span>
                            </div>
                            <div class="h-actions">
                                <button class="btn-outline view-btn" data-id="${item.id}">👁 View</button>
                                <button class="btn-danger delete-btn" data-id="${item.id}">🗑 Delete</button>
                            </div>
                        `;
                        historyList.appendChild(card);
                        card.querySelector('.view-btn').addEventListener('click', () => {
                            window.location.href = `/view_prediction/${item.id}`;
                        });
                        card.querySelector('.delete-btn').addEventListener('click', () => {
                            if (confirm('Delete record?')) {
                                fetch(`${API_BASE_URL}/api/delete_history/${item.id}`, { method: 'DELETE' })
                                    .then(() => window.location.reload());
                            }
                        });
                    });
                } else {
                    if (emptyState) emptyState.style.display = 'block';
                }
            });
    }

    /* =============================================
       ANIMATION GENERATORS
    ============================================= */
    function clearAnimations() {
        const scenes = ['.bird-scene', '.rain-scene', '.snow-scene', '.penguin-scene'];
        scenes.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.innerHTML = '';
        });
        clearInterval(lightningInterval);
        // Clear sun rays if any
        const sunRays = document.querySelector('.sun-rays');
        if (sunRays) sunRays.innerHTML = '';
    }

    function initSunny() {
        const scene = document.querySelector('.bird-scene');
        const rays = document.querySelector('.sun-rays');
        if (scene) {
            // Birds Variety
            const birdCount = window.innerWidth < 600 ? 5 : 8;
            for (let i = 0; i < birdCount; i++) {
                const bird = document.createElement('div');
                bird.className = 'bird-container';
                const s = 0.4 + Math.random() * 0.8;
                const dur = 10 + Math.random() * 15;
                const delay = -Math.random() * 20;
                
                bird.style.setProperty('--bird-top', `${5 + Math.random() * 45}%`);
                bird.style.setProperty('--fly-dur', `${dur}s`);
                bird.style.setProperty('--del', `${delay}s`);
                bird.style.setProperty('--s', s);
                bird.style.setProperty('--flap-dur', `${0.4 + Math.random() * 0.4}s`);
                
                bird.innerHTML = `
                    <div class="body-bob">
                        <svg class="bird-svg" viewBox="0 0 60 40">
                            <!-- Wing Back -->
                            <path class="wing" d="M30 18 L 10 10 Q 25 5 30 18 Z" />
                            <!-- Body -->
                            <path d="M25 20 Q 30 22 35 20 C 42 16, 38 12, 30 16 C 22 18, 20 20, 25 20 Z" />
                            <!-- Wing Front -->
                            <path class="wing" d="M30 18 L 50 10 Q 35 5 30 18 Z" />
                        </svg>
                    </div>`;
                scene.appendChild(bird);
            }
        }
    }

    let lightningInterval;

    function initRainy() {
        const scene = document.querySelector('.rain-scene');
        const bolt = document.querySelector('.lightning-bolt');
        const overlay = document.querySelector('.lightning-overlay');
        
        if (!scene) return;
        const dropCount = window.innerWidth < 600 ? 60 : 120;
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.className = 'raindrop';
            drop.style.left = `${Math.random() * 110}%`;
            drop.style.top = `-${Math.random() * 20}%`;
            const dur = 0.6 + Math.random() * 0.5;
            drop.style.setProperty('--dur', `${dur}s`);
            drop.style.animationDelay = `${Math.random() * 2}s`;
            drop.style.opacity = 0.2 + Math.random() * 0.5;
            scene.appendChild(drop);
        }

        // Lightning Logic
        if (bolt && overlay) {
            lightningInterval = setInterval(() => {
                if (Math.random() > 0.7) {
                    bolt.style.left = `${Math.random() * 80}%`;
                    bolt.classList.add('show');
                    overlay.classList.add('flash');
                    setTimeout(() => {
                        bolt.classList.remove('show');
                        overlay.classList.remove('flash');
                    }, 400);
                }
            }, 5000);
        }
    }

    function initWinter() {
        const snow = document.querySelector('.snow-scene');
        
        if (snow) {
            // Layered snow logic: foreground, midground, background
            const totalSnowflakes = window.innerWidth < 600 ? 70 : 150;
            const chars = ['❄', '❅', '❆', '✻', '✼', '❋'];
            
            for (let i = 0; i < totalSnowflakes; i++) {
                const s = document.createElement('div');
                s.className = 'snowflake';
                
                let size, dur, op, rotDur, swayDur;
                
                // Determine layer based on i
                if (i < totalSnowflakes * 0.2) {
                    // Foreground (Heavy Snow)
                    size = 8 + Math.random() * 7; // 8-15px
                    dur = 3 + Math.random() * 3;  // 3-6s
                    op = 0.8 + Math.random() * 0.2;
                    swayDur = 2 + Math.random() * 2;
                    rotDur = 5 + Math.random() * 5;
                } else if (i < totalSnowflakes * 0.5) {
                    // Midground (Medium Snow)
                    size = 4 + Math.random() * 4; // 4-8px
                    dur = 6 + Math.random() * 4;  // 6-10s
                    op = 0.6 + Math.random() * 0.2;
                    swayDur = 3 + Math.random() * 2;
                    rotDur = 8 + Math.random() * 7;
                } else {
                    // Background (Light Snow)
                    size = 2 + Math.random() * 2; // 2-4px
                    dur = 10 + Math.random() * 8; // 10-18s
                    op = 0.4 + Math.random() * 0.3;
                    swayDur = 4 + Math.random() * 4;
                    rotDur = 15 + Math.random() * 10;
                }

                const type = Math.random();
                
                // Generic configurations
                s.style.left = `${Math.random() * 100}%`;
                s.style.animationDuration = `${dur}s, ${swayDur}s`;
                s.style.animationDelay = `-${Math.random() * 20}s, -${Math.random() * 20}s`;
                s.style.opacity = op;
                s.style.fontSize = `${size}px`;
                s.style.setProperty('--rot-dur', `${rotDur}s`);
                s.style.setProperty('--sz', `${size}px`); // Fallback for CSS star/svg

                if (i < totalSnowflakes * 0.1) {
                    // Massive Blurred Bokeh Snowflake 
                    const bokehSize = 50 + Math.random() * 100;
                    s.style.width = `${bokehSize}px`;
                    s.style.height = `${bokehSize}px`;
                    s.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
                    s.style.borderRadius = '50%';
                    s.style.filter = `blur(${5 + Math.random() * 15}px)`;
                    s.style.fontSize = '0px'; 
                    s.style.animationDuration = `${dur * 1.5}s, ${swayDur * 2}s`;
                    s.style.opacity = 0.2 + Math.random() * 0.3;
                } else if (type < 0.1 && i < totalSnowflakes * 0.2) {
                    s.innerHTML = `<svg class="snowflake-svg" viewBox="0 0 24 24"><path d="M12 2L13 5H11L12 2ZM12 22L11 19H13L12 22ZM2 12L5 11V13L2 12ZM22 12L19 13V11L22 12ZM5 5L7.5 7.5L6.5 8.5L4 6L5 5ZM19 19L16.5 16.5L17.5 15.5L20 18L19 19ZM5 19L4 18L6.5 15.5L7.5 16.5L5 19ZM19 5L20 6L17.5 8.5L16.5 7.5L19 5Z"/></svg>`;
                } else if (type < 0.4) {
                    s.textContent = chars[Math.floor(Math.random() * chars.length)];
                    s.style.textShadow = '0 0 5px rgba(255,255,255,0.8)';
                } else if (type < 0.6) {
                    s.className += ' css-star';
                } else if (type < 0.7) {
                    // Crystalline shard
                    s.style.width = '2px';
                    s.style.height = (size * 3) + 'px';
                    s.style.background = 'linear-gradient(to bottom, transparent, #fff, transparent)';
                    s.style.borderRadius = '2px';
                    s.style.boxShadow = '0 0 10px rgba(255,255,255,0.8)';
                    s.style.animationDuration = `${dur * 0.7}s, ${swayDur}s`; // Shards fall faster
                } else {
                    s.style.background = '#fff';
                    s.style.borderRadius = '50%';
                    s.style.width = size + 'px';
                    s.style.height = size + 'px';
                    s.style.boxShadow = '0 0 5px rgba(255,255,255,0.8)';
                }

                snow.appendChild(s);
            }

            // Shooting Stars
            const sky = document.querySelector('.shooting-stars');
            if (sky) {
                sky.innerHTML = '';
                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('div');
                    star.className = 'shooting-star';
                    star.style.left = `${Math.random() * 80}%`;
                    star.style.top = `${Math.random() * 30}%`;
                    star.style.animationDelay = `${Math.random() * 20}s`;
                    sky.appendChild(star);
                }
            }
        }
    }

    /* =============================================
       THEME ENGINE
    ============================================= */
    const themeBtn = document.getElementById('theme-toggle');
    const THEME_KEY = 'atmos_mode_v3_premium';
    const MODES = ['rainy', 'sunny', 'winter'];

    function updateMode(mode) {
        document.body.classList.remove('rainy-mode', 'sunny-mode', 'winter-mode');
        document.body.classList.add(`${mode}-mode`);
        clearAnimations();
        
        if (mode === 'sunny') {
            initSunny();
            if (themeBtn) {
                themeBtn.querySelector('.toggle-icon').textContent = '☀️';
                themeBtn.querySelector('.mode-name').textContent = 'Sunny Mode';
            }
        } else if (mode === 'rainy') {
            initRainy();
            if (themeBtn) {
                themeBtn.querySelector('.toggle-icon').textContent = '🌧️';
                themeBtn.querySelector('.mode-name').textContent = 'Rainy Mode';
            }
        } else {
            initWinter();
            if (themeBtn) {
                themeBtn.querySelector('.toggle-icon').textContent = '❄️';
                themeBtn.querySelector('.mode-name').textContent = 'Winter Mode';
            }
        }
    }

    const currentMode = localStorage.getItem(THEME_KEY) || 'rainy';
    updateMode(currentMode);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const now = localStorage.getItem(THEME_KEY) || 'rainy';
            const next = MODES[(MODES.indexOf(now) + 1) % MODES.length];
            setTheme(next);
        });
    }

    const AUTO_INTERVAL = 3600000;
    const TS_KEY = 'atmos_last_manual';

    function setTheme(mode, isAuto = false) {
        localStorage.setItem(THEME_KEY, mode);
        if (!isAuto) localStorage.setItem(TS_KEY, Date.now());
        updateMode(mode);
    }

    function checkAutoSwitch() {
        const lastManual = localStorage.getItem(TS_KEY) || 0;
        if (Date.now() - lastManual >= AUTO_INTERVAL) {
            const curr = localStorage.getItem(THEME_KEY) || 'rainy';
            const next = MODES[(MODES.indexOf(curr) + 1) % MODES.length];
            setTheme(next, true);
        }
    }

    setInterval(checkAutoSwitch, 60000);
    checkAutoSwitch();
});
