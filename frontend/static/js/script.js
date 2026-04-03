// AtmosAI — Decoupled Premium Script (Vercel + Render)

// CONFIGURATION: Replace with your Render Backend URL after deployment
// Example: const API_BASE_URL = 'https://your-app-name.onrender.com';
const API_BASE_URL = 'https://linear-regression-model-climate-deployed.onrender.com';

document.addEventListener('DOMContentLoaded', () => {

    /* =============================================
       PAGE LOADER
    ============================================= */
    const loader = document.getElementById('page-loader');
    const hideLoader = () => {
        if (loader) loader.classList.add('hidden');
    };
    
    if (loader) {
        window.addEventListener('load', () => setTimeout(hideLoader, 350));
        setTimeout(hideLoader, 3000); // Fail-safe
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
                loadingIndicator.style.display = 'none';
                predictionForm.style.display = 'block';
                
                data.features.forEach((feat, i) => {
                    const field = document.createElement('div');
                    field.className = 'field';
                    field.style.animation = `page-enter 0.5s ${i * 0.06}s both`;
                    
                    const labelText = feat.replace(/_/g, ' ').replace(/\(/g, '').replace(/\)/g, '');
                    const placeholder = feat.split('(')[0].trim();
                    
                    field.innerHTML = `
                        <label for="${feat}">${labelText}</label>
                        <input type="number" step="0.01" name="${feat}" id="${feat}" required placeholder="${placeholder}">
                    `;
                    featuresGrid.appendChild(field);

                    // Add focus listeners to new inputs
                    const input = field.querySelector('input');
                    input.addEventListener('focus', () => field.querySelector('label').style.color = 'var(--accent)');
                    input.addEventListener('blur', () => field.querySelector('label').style.color = '');
                });
            })
            .catch(err => {
                console.error('Failed to load features:', err);
                loadingIndicator.innerHTML = `<p style="color: #ff4d4d;">Error connecting to API. Please ensure the backend is running at ${API_BASE_URL}</p>`;
            });
    }

    /* =============================================
       API: PREDICT (Index Page)
    ============================================= */
    if (predictionForm) {
        predictionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            
            // UI Loading State
            btn.textContent = 'Analysing Climate Data…';
            btn.style.opacity = '0.7';
            btn.disabled = true;
            if (loader) {
                loader.classList.remove('hidden');
                const t = loader.querySelector('.loader-text');
                if (t) t.textContent = 'Running Model';
            }

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
                    // Store result for the result page
                    sessionStorage.setItem('latest_prediction', JSON.stringify(data));
                    // Also fetch metrics for the result page
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
                alert('Connection error. Is the backend running?');
                btn.disabled = false;
                btn.textContent = 'Generate Climate Prediction →';
                hideLoader();
            });
        });
    }

    /* =============================================
       API: HISTORY (History Page)
    ============================================= */
    const historyList = document.querySelector('.history-list');
    const emptyState = document.querySelector('.empty-state');
    const historyHeaderPara = document.querySelector('.history-header p');

    if (historyList) {
        fetch(`${API_BASE_URL}/api/history`)
            .then(res => res.json())
            .then(data => {
                hideLoader();
                if (data.length > 0) {
                    if (emptyState) emptyState.style.display = 'none';
                    if (historyHeaderPara) historyHeaderPara.textContent = `${data.length} record${data.length !== 1 ? 's' : ''} found`;
                    
                    data.forEach((item, i) => {
                        const card = document.createElement('div');
                        card.className = 'history-card';
                        card.style.animationDelay = `${i * 0.07}s`;
                        
                        const humidity = item.inputs['Humidity (%)'] || '—';
                        const wind = item.inputs['Wind_Speed (km/h)'] || '—';
                        const aqi = item.inputs['AQI'] || '—';

                        card.innerHTML = `
                            <div class="h-temp">${item.prediction}°C</div>
                            <div class="h-divider"></div>
                            <div class="h-meta">
                                <span class="h-time">🕒 ${item.timestamp}</span>
                                <span class="h-summary">
                                    Humidity: ${humidity}% · Wind: ${wind} km/h · AQI: ${aqi}
                                </span>
                            </div>
                            <div class="h-actions">
                                <button class="btn-outline view-btn" data-id="${item.id}">👁 View</button>
                                <button class="btn-danger delete-btn" data-id="${item.id}">🗑 Delete</button>
                            </div>
                        `;
                        historyList.appendChild(card);
                        
                        // Action: View
                        card.querySelector('.view-btn').addEventListener('click', () => {
                            sessionStorage.setItem('latest_prediction', JSON.stringify({
                                prediction: item.prediction,
                                inputs: item.inputs,
                                id: item.id
                            }));
                            window.location.href = 'result.html';
                        });

                        // Action: Delete
                        card.querySelector('.delete-btn').addEventListener('click', () => {
                            if (confirm('Delete this prediction record?')) {
                                fetch(`${API_BASE_URL}/api/delete_history/${item.id}`, { method: 'DELETE' })
                                    .then(() => window.location.reload());
                            }
                        });
                    });
                } else {
                    if (emptyState) emptyState.style.display = 'block';
                    historyList.style.display = 'none';
                }
            })
            .catch(err => {
                console.error('History error:', err);
                hideLoader();
            });
    }

    /* =============================================
       RAIN GENERATOR
    ============================================= */
    const rainScene = document.querySelector('.rain-scene');
    if (rainScene) {
        const DROP_COUNT = 80;
        for (let i = 0; i < DROP_COUNT; i++) {
            const drop = document.createElement('div');
            drop.classList.add('raindrop');
            drop.style.left = `${Math.random() * 110 - 5}%`;
            drop.style.height = `${Math.random() * 55 + 18}px`;
            drop.style.setProperty('--rain-dur', `${(Math.random() * 0.7 + 0.55).toFixed(2)}s`);
            drop.style.setProperty('--rain-delay', `-${(Math.random() * 4).toFixed(2)}s`);
            drop.style.opacity = (Math.random() * 0.3 + 0.25).toFixed(2);
            rainScene.appendChild(drop);
        }
    }

    /* =============================================
       LIGHTNING ENGINE
    ============================================= */
    const lightningOverlay = document.querySelector('.lightning-overlay');
    const lightningBolt = document.querySelector('.lightning-bolt');

    function makeBoltPath() {
        const x = Math.random() * 60 + 20;
        const steps = Math.floor(Math.random() * 4) + 5;
        let points = `${x},0 `;
        let cx = x;
        for (let i = 1; i <= steps; i++) {
            cx += (Math.random() - 0.45) * 40;
            points += `${cx.toFixed(1)},${((100 / steps) * i).toFixed(1)} `;
        }
        return points.trim();
    }

    function triggerLightning() {
        if (!lightningOverlay || !lightningBolt) return;
        lightningOverlay.classList.remove('flash');
        void lightningOverlay.offsetWidth;
        lightningOverlay.classList.add('flash');
        const poly = lightningBolt.querySelector('polyline');
        if (poly) poly.setAttribute('points', makeBoltPath());
        lightningBolt.classList.remove('show');
        void lightningBolt.offsetWidth;
        lightningBolt.classList.add('show');
        if (Math.random() > 0.5) {
            setTimeout(() => {
                lightningOverlay.classList.remove('flash');
                void lightningOverlay.offsetWidth;
                lightningOverlay.classList.add('flash');
            }, 120);
        }
        setTimeout(triggerLightning, Math.random() * 13000 + 5000);
    }

    if (lightningOverlay) setTimeout(triggerLightning, Math.random() * 5000 + 2000);

});
