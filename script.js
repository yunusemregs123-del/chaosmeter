// ============================================
// CHAOS METER 2.0 - REAL-TIME DATA ENGINE
// Fetches data from data.json, adds animations
// ============================================

// Global state
let chaosFactors = {};
let liveData = null;
let isSimulationMode = false;
let simulationValues = {};
let realTimeIntervals = [];
let attackIndex = 0;

// Country coordinates for attack animations (expanded)
const countryCoords = {
    // Major attack sources
    'CN': { x: 78, y: 35 }, 'RU': { x: 65, y: 25 }, 'US': { x: 20, y: 38 },
    'KP': { x: 81, y: 34 }, 'IR': { x: 60, y: 40 }, 'BR': { x: 30, y: 62 },
    'IN': { x: 70, y: 45 }, 'VN': { x: 77, y: 48 }, 'TR': { x: 55, y: 36 },
    'UA': { x: 55, y: 28 }, 'ID': { x: 80, y: 58 }, 'PK': { x: 67, y: 42 },
    'NG': { x: 48, y: 52 }, 'RO': { x: 53, y: 32 }, 'PH': { x: 82, y: 50 },
    'TH': { x: 75, y: 48 }, 'MY': { x: 76, y: 54 }, 'MX': { x: 15, y: 45 },
    'AR': { x: 28, y: 75 }, 'EG': { x: 54, y: 43 },
    // Major targets
    'GB': { x: 47, y: 28 }, 'DE': { x: 50, y: 28 }, 'FR': { x: 48, y: 32 },
    'JP': { x: 85, y: 35 }, 'AU': { x: 88, y: 72 }, 'CA': { x: 18, y: 30 },
    'KR': { x: 82, y: 37 }, 'NL': { x: 49, y: 27 }, 'SG': { x: 77, y: 55 },
    'CH': { x: 49, y: 30 }, 'IT': { x: 51, y: 33 }, 'ES': { x: 45, y: 35 },
    'SE': { x: 52, y: 22 }, 'BE': { x: 48, y: 28 }, 'IL': { x: 57, y: 40 },
    'AE': { x: 62, y: 44 }, 'TW': { x: 82, y: 44 }, 'PL': { x: 52, y: 28 }
};

// Factor metadata - matches 100% REAL data from api.py
const factorMeta = {
    solar: { name: 'Solar Storm', icon: '☀️', weight: 15, unit: 'Kp', desc: 'Geomagnetic storm activity (NOAA)' },
    zeroday: { name: 'Zero-Day', icon: '🎯', weight: 15, unit: '', desc: 'Critical vulnerabilities (NVD)' },
    malware: { name: 'Malware', icon: '🦠', weight: 15, unit: '', desc: 'Active malware URLs (URLhaus)' },
    botnet: { name: 'Botnet', icon: '🤖', weight: 15, unit: 'K', desc: 'Botnet C2 IPs (FeodoTracker)' },
    ransom: { name: 'Ransomware', icon: '💀', weight: 20, unit: '', desc: 'Ransomware victims (RansomWatch)' },
    crypto: { name: 'Crypto Vol', icon: '₿', weight: 10, unit: '%', desc: 'Market volatility (CoinGecko)' },
    fear: { name: 'Fear Index', icon: '😨', weight: 10, unit: '', desc: 'Crypto fear & greed (Alternative.me)' }
};

// ============================================
// DATA FETCHING
// ============================================

async function fetchData() {
    try {
        const response = await fetch('data.json?t=' + Date.now());
        liveData = await response.json();
        updateFromLiveData();
        console.log('[Chaos Meter] Data updated:', new Date().toISOString());
    } catch (error) {
        console.error('[Chaos Meter] Failed to fetch data:', error);
        // Use fallback/manipulation if fetch fails
        manipulateData();
    }
}

function updateFromLiveData() {
    if (!liveData) return;

    // Merge live data with factor metadata
    Object.keys(liveData.chaosFactors).forEach(key => {
        if (factorMeta[key]) {
            chaosFactors[key] = {
                ...factorMeta[key],
                ...liveData.chaosFactors[key]
            };
        }
    });

    // Update UI
    generateTiles();
    updateScore();

    // Update news ticker with live headlines
    if (liveData.headlines && liveData.headlines.length > 0) {
        updateNewsTicker(liveData.headlines);
    }
}

function manipulateData() {
    // Small random fluctuations when no fresh data
    Object.keys(chaosFactors).forEach(key => {
        const f = chaosFactors[key];
        if (f && f.value !== undefined) {
            const delta = (Math.random() - 0.5) * (f.max * 0.02);
            f.value = Math.max(0, Math.min(f.max, f.value + delta));
        }
    });
}

// ============================================
// UI RENDERING
// ============================================

function fmt(v) {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return Number(v).toFixed(v % 1 === 0 ? 0 : 1);
}

function getTileClass(weight) {
    if (weight >= 10) return 'tile-xxl';
    if (weight >= 6) return 'tile-xl';
    if (weight >= 4) return 'tile-lg';
    if (weight >= 3) return 'tile-md';
    return 'tile-sm';
}

function getSeverity(val, max, rev) {
    let n = val / max;
    if (rev) n = 1 - n;
    if (n >= 0.75) return 'severity-critical';
    if (n >= 0.5) return 'severity-high';
    if (n >= 0.25) return 'severity-medium';
    return 'severity-low';
}

function generateTiles() {
    const grid = document.getElementById('tilesGrid');
    if (!grid) return;

    const sorted = Object.entries(chaosFactors)
        .filter(([k, f]) => f && f.value !== undefined)
        .sort((a, b) => (b[1].weight || 0) - (a[1].weight || 0));

    grid.innerHTML = sorted.map(([k, f]) => `
        <div class="chaos-tile ${getTileClass(f.weight)} ${getSeverity(f.value, f.max, f.reverse)}" data-key="${k}">
            <div class="tile-header">
                <span class="tile-icon">${f.icon}</span>
            </div>
            <div class="tile-name">${f.name}</div>
            <div class="tile-value">${fmt(f.value)}${f.unit}</div>
        </div>
    `).join('');
}

function updateScore() {
    const el = document.getElementById('mainScore');
    if (!el) return;

    // Use live chaos index if available
    if (liveData && liveData.chaosIndex) {
        el.textContent = liveData.chaosIndex.toFixed(1);
        return;
    }

    // Calculate from factors
    let t = 0, w = 0;
    Object.values(chaosFactors).forEach(f => {
        if (!f || f.value === undefined) return;
        let n = f.value / f.max;
        if (f.reverse) n = 1 - n;
        t += n * (f.weight || 1);
        w += f.weight || 1;
    });

    const score = w > 0 ? (t / w) * 100 : 0;
    el.textContent = score.toFixed(1);
}

// ============================================
// NEWS TICKER
// ============================================

function updateNewsTicker(headlines) {
    const ticker = document.getElementById('newsTicker');
    if (!ticker) return;

    const items = headlines.map(h => `<div class="news-item">${h}</div>`).join('');
    ticker.innerHTML = items + items + items;
}

function initNewsTicker() {
    // Initial headlines from live data or fallback
    const fallbackHeadlines = [
        "🚨 CRITICAL: New ransomware variant spreading across networks",
        "⚠️ ALERT: DDoS attack targeting financial sector",
        "🔴 BREAKING: Zero-day vulnerability discovered",
        "📡 SIGNAL: Unusual botnet activity detected",
        "💀 WARNING: Supply chain attack reported"
    ];

    const headlines = (liveData && liveData.headlines) ? liveData.headlines : fallbackHeadlines;
    updateNewsTicker(headlines);
}

// ============================================
// TOP TICKER
// ============================================

function generateTicker() {
    const ticker = document.getElementById('ticker');
    if (!ticker) return;

    let items = Object.entries(chaosFactors)
        .filter(([k, f]) => f && f.value !== undefined)
        .map(([k, f]) => {
            const change = (Math.random() - 0.5) * 10;
            return `<div class="ticker-item">
                <span style="color:var(--text-muted)">${f.name.toUpperCase()}</span>
                <span class="${change > 0 ? 'up' : 'down'}">${fmt(f.value)} ${change > 0 ? '▲' : '▼'}${Math.abs(change).toFixed(1)}%</span>
            </div>`;
        }).join('');

    ticker.innerHTML = items + items + items;
}

// ============================================
// ATTACK MAP ANIMATIONS
// ============================================

function animateAttack() {
    if (!liveData || !liveData.attacks || liveData.attacks.length === 0) return;

    const attack = liveData.attacks[attackIndex % liveData.attacks.length];
    attackIndex++;

    const fromCoord = countryCoords[attack.from];
    const toCoord = countryCoords[attack.to];

    if (!fromCoord || !toCoord) return;

    const overlay = document.getElementById('attackOverlay');
    if (!overlay) return;

    const color = getAttackColor(attack.type);

    // Create curved path (quadratic bezier)
    const midX = (fromCoord.x + toCoord.x) / 2;
    const midY = Math.min(fromCoord.y, toCoord.y) - 10 - Math.random() * 5;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${fromCoord.x} ${fromCoord.y} Q ${midX} ${midY} ${toCoord.x} ${toCoord.y}`;
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '0.15');
    path.setAttribute('stroke-opacity', '0');
    path.classList.add('attack-path');

    // Add glow filter
    const filterId = 'glow-' + Date.now();
    const defs = overlay.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML += `
        <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    `;
    if (!overlay.querySelector('defs')) overlay.appendChild(defs);
    path.setAttribute('filter', `url(#${filterId})`);

    overlay.appendChild(path);

    // Get path length for animation
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;

    // Animate path drawing
    const duration = 1200 + Math.random() * 400;
    const startTime = performance.now();

    // Create traveling particle
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    particle.setAttribute('r', '0.8');
    particle.setAttribute('fill', color);
    particle.classList.add('attack-particle');
    overlay.appendChild(particle);

    // Create trail particles
    const trailCount = 5;
    const trails = [];
    for (let i = 0; i < trailCount; i++) {
        const trail = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        trail.setAttribute('r', (0.6 - i * 0.1).toString());
        trail.setAttribute('fill', color);
        trail.setAttribute('opacity', (0.6 - i * 0.1).toString());
        overlay.appendChild(trail);
        trails.push(trail);
    }

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Draw path progressively
        path.style.strokeDashoffset = pathLength * (1 - eased);
        path.setAttribute('stroke-opacity', Math.min(eased * 2, 0.7).toString());

        // Move particle along path
        const point = path.getPointAtLength(pathLength * eased);
        particle.setAttribute('cx', point.x);
        particle.setAttribute('cy', point.y);

        // Update trail particles
        trails.forEach((trail, i) => {
            const trailProgress = Math.max(0, eased - (i + 1) * 0.03);
            const trailPoint = path.getPointAtLength(pathLength * trailProgress);
            trail.setAttribute('cx', trailPoint.x);
            trail.setAttribute('cy', trailPoint.y);
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Impact effect
            createImpactEffect(toCoord, color);

            // Fade out
            path.style.transition = 'opacity 0.8s ease-out';
            particle.style.transition = 'opacity 0.5s ease-out';
            path.style.opacity = '0';
            particle.style.opacity = '0';
            trails.forEach(t => {
                t.style.transition = 'opacity 0.3s ease-out';
                t.style.opacity = '0';
            });

            setTimeout(() => {
                path.remove();
                particle.remove();
                trails.forEach(t => t.remove());
            }, 1000);
        }
    }

    requestAnimationFrame(animate);
}

function getAttackColor(type) {
    const colors = {
        'DDoS': '#ff6b6b',
        'Ransomware': '#ee5a5a',
        'Phishing': '#ffa94d',
        'Botnet': '#cc5de8',
        'Exploit': '#74c0fc',
        'Brute Force': '#69db7c',
        'SQLi': '#ff8787'
    };
    return colors[type] || '#ff6b6b';
}

function createImpactEffect(coord, color) {
    const container = document.getElementById('attackPoints');
    if (!container) return;

    // Main impact ring
    const ring = document.createElement('div');
    ring.className = 'impact-ring';
    ring.style.left = coord.x + '%';
    ring.style.top = coord.y + '%';
    ring.style.borderColor = color;
    ring.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    container.appendChild(ring);

    // Inner pulse
    const pulse = document.createElement('div');
    pulse.className = 'impact-pulse';
    pulse.style.left = coord.x + '%';
    pulse.style.top = coord.y + '%';
    pulse.style.backgroundColor = color;
    container.appendChild(pulse);

    // Spark particles
    for (let i = 0; i < 6; i++) {
        const spark = document.createElement('div');
        spark.className = 'impact-spark';
        spark.style.left = coord.x + '%';
        spark.style.top = coord.y + '%';
        spark.style.backgroundColor = color;
        spark.style.setProperty('--angle', (i * 60) + 'deg');
        container.appendChild(spark);
        setTimeout(() => spark.remove(), 800);
    }

    setTimeout(() => {
        ring.remove();
        pulse.remove();
    }, 1500);
}

function createImpactPoint(coord, type) {
    // Legacy function - now using createImpactEffect
}

function initCityPoints() {
    const container = document.getElementById('attackPoints');
    if (!container) return;

    Object.entries(countryCoords).forEach(([code, pos]) => {
        const point = document.createElement('div');
        point.className = 'city-point';
        point.style.left = pos.x + '%';
        point.style.top = pos.y + '%';
        point.title = code;
        container.appendChild(point);
    });
}

// ============================================
// SYSTEM LOG
// ============================================

const logQueue = [];
let currentLogIndex = 0;

function addLog(type, message) {
    const entries = document.getElementById('logEntries');
    if (!entries) return;

    const colors = {
        success: 'var(--neon-green)',
        warn: 'var(--orange)',
        error: 'var(--red)',
        info: 'var(--neon-blue)'
    };

    const time = new Date().toISOString().split('T')[1].split('.')[0];
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.style.color = colors[type] || colors.info;
    entry.innerHTML = `<span style="opacity:0.6">[${time}]</span> ${message}`;

    entries.insertBefore(entry, entries.firstChild);

    // Keep max 15 entries
    while (entries.children.length > 15) {
        entries.removeChild(entries.lastChild);
    }
}

function showNextLog() {
    if (!liveData || !liveData.logs || liveData.logs.length === 0) {
        // Generate random log if no live data
        const types = ['info', 'warn', 'error', 'success'];
        const messages = [
            'Scanning network perimeter...',
            'Threat signature database updated',
            'Anomaly detected in sector ' + String.fromCharCode(65 + Math.floor(Math.random() * 5)) + Math.floor(Math.random() * 5),
            'API heartbeat OK',
            'Firewall rule applied'
        ];
        addLog(types[Math.floor(Math.random() * types.length)], messages[Math.floor(Math.random() * messages.length)]);
        return;
    }

    const log = liveData.logs[currentLogIndex % liveData.logs.length];
    currentLogIndex++;
    addLog(log.type, log.message);
}

// ============================================
// INFO CARD (HOVER)
// ============================================

const infoCard = document.createElement('div');
infoCard.className = 'chaos-info-card';
document.body.appendChild(infoCard);

function initInfoCard() {
    document.addEventListener('mouseover', e => {
        const tile = e.target.closest('.chaos-tile');
        if (tile) {
            const key = tile.dataset.key;
            showInfoCard(key, e);
        }
    });

    document.addEventListener('mouseout', e => {
        if (e.target.closest('.chaos-tile')) {
            infoCard.classList.remove('visible');
        }
    });

    document.addEventListener('mousemove', e => {
        if (e.target.closest('.chaos-tile')) {
            moveInfoCard(e);
        }
    });
}

function showInfoCard(key, e) {
    const f = chaosFactors[key];
    if (!f) return;

    // Calculate impact
    let totalWeightedSum = 0;
    let myWeightedVal = 0;
    Object.values(chaosFactors).forEach(factor => {
        if (!factor || factor.value === undefined) return;
        let n = factor.value / factor.max;
        if (factor.reverse) n = 1 - n;
        const wv = n * (factor.weight || 1);
        totalWeightedSum += wv;
        if (factor === f) myWeightedVal = wv;
    });

    const impactPercent = totalWeightedSum > 0 ? ((myWeightedVal / totalWeightedSum) * 100) : 0;

    infoCard.innerHTML = `
        <div class="info-card-header">
            <span>${f.icon} ${f.name}</span>
            <span>${fmt(f.value)}${f.unit}</span>
        </div>
        <p>${f.desc}</p>
        <div class="impact">
            <strong>IMPACT ON INDEX:</strong> <span>${impactPercent.toFixed(1)}%</span>
        </div>
    `;
    infoCard.classList.add('visible');
    moveInfoCard(e);
}

function moveInfoCard(e) {
    const x = e.clientX + 15;
    const y = e.clientY;
    const rect = infoCard.getBoundingClientRect();

    infoCard.style.left = (x + rect.width > window.innerWidth) ? (e.clientX - rect.width - 15) + 'px' : x + 'px';
    infoCard.style.top = (y + rect.height > window.innerHeight) ? (y - rect.height) + 'px' : y + 'px';
}

// ============================================
// SIMULATION MODE
// ============================================

function openSimulationModal() {
    isSimulationMode = true;
    pauseRealTimeUpdates();

    // Save current values
    Object.keys(chaosFactors).forEach(k => {
        simulationValues[k] = chaosFactors[k].value;
    });

    // Generate sliders
    const container = document.getElementById('slidersContainer');
    if (container) {
        container.innerHTML = Object.entries(chaosFactors)
            .filter(([k, f]) => f && f.value !== undefined)
            .sort((a, b) => (b[1].weight || 0) - (a[1].weight || 0))
            .map(([k, f]) => `
                <div class="slider-row">
                    <label>${f.icon} ${f.name}</label>
                    <input type="range" min="0" max="${f.max}" step="${f.max > 100 ? 10 : 1}" 
                           value="${f.value}" id="slider-${k}" data-key="${k}">
                    <span id="value-${k}">${fmt(f.value)}${f.unit}</span>
                </div>
            `).join('');

        // Add event listeners
        container.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', e => {
                const key = e.target.dataset.key;
                const value = parseFloat(e.target.value);
                simulationValues[key] = value;
                document.getElementById(`value-${key}`).textContent = fmt(value) + chaosFactors[key].unit;
                updateSimulationScore();
            });
        });
    }

    document.getElementById('simulateModal').classList.add('active');
    addLog('warn', 'Simulation mode entered');
}

function updateSimulationScore() {
    const original = {};
    Object.keys(chaosFactors).forEach(k => {
        original[k] = chaosFactors[k].value;
        chaosFactors[k].value = simulationValues[k];
    });
    updateScore();
    Object.keys(chaosFactors).forEach(k => {
        chaosFactors[k].value = original[k];
    });
}

function closeSimulationModal() {
    document.getElementById('simulateModal').classList.remove('active');
}

function exitSimulation() {
    Object.keys(chaosFactors).forEach(k => {
        chaosFactors[k].value = simulationValues[k];
    });
    isSimulationMode = false;
    resumeRealTimeUpdates();
    generateTiles();
    updateScore();
    closeSimulationModal();
    addLog('success', 'Returned to live data mode');
}

function applySimulation() {
    Object.keys(simulationValues).forEach(k => {
        chaosFactors[k].value = simulationValues[k];
    });
    generateTiles();
    updateScore();
    addLog('success', 'Simulation values applied');
    closeSimulationModal();
}

function pauseRealTimeUpdates() {
    realTimeIntervals.forEach(id => clearInterval(id));
    realTimeIntervals = [];
}

function resumeRealTimeUpdates() {
    realTimeIntervals.push(setInterval(animateAttack, 400));
    realTimeIntervals.push(setInterval(manipulateData, 800));
    realTimeIntervals.push(setInterval(showNextLog, 2000));
    realTimeIntervals.push(setInterval(generateTicker, 5000));
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initial data fetch
    await fetchData();

    // Initialize UI
    generateTiles();
    updateScore();
    generateTicker();
    initNewsTicker();
    initCityPoints();
    initInfoCard();

    // Show initial logs
    for (let i = 0; i < 8; i++) {
        setTimeout(() => showNextLog(), i * 200);
    }

    // Start real-time updates
    realTimeIntervals.push(setInterval(animateAttack, 400));
    realTimeIntervals.push(setInterval(() => {
        manipulateData();
        generateTiles();
    }, 800));
    realTimeIntervals.push(setInterval(showNextLog, 2000));
    realTimeIntervals.push(setInterval(generateTicker, 5000));

    // Refresh data every 5 minutes
    setInterval(fetchData, 300000);

    // Simulation modal events
    const simulateBtn = document.getElementById('simulateBtn');
    const exitSimBtn = document.getElementById('exitSimBtn');
    const applyBtn = document.getElementById('applyBtn');
    const modalOverlay = document.getElementById('simulateModal');

    if (simulateBtn) {
        simulateBtn.addEventListener('click', e => {
            e.preventDefault();
            openSimulationModal();
        });
    }

    if (exitSimBtn) exitSimBtn.addEventListener('click', exitSimulation);
    if (applyBtn) applyBtn.addEventListener('click', applySimulation);

    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => {
            if (e.target === modalOverlay) exitSimulation();
        });
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isSimulationMode) exitSimulation();
    });

    console.log('[Chaos Meter 2.0] Initialized successfully');
});
