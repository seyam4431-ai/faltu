// Currency pairs data (Global)
const currencyPairs = {
    otc: [
        "NZD/CHF (OTC)", "USD/BRL (OTC)", "EUR/GBP (OTC)", "GBP/AUD (OTC)",
        "GBP/JPY (OTC)", "GBP/USD (OTC)", "USD/JPY (OTC)", "USD/ZAR (OTC)",
        "EUR/AUD (OTC)", "EUR/CAD (OTC)", "EUR/JPY (OTC)", "EUR/USD (OTC)",
        "GBP/CAD (OTC)", "GBP/CHF (OTC)", "USD/CAD (OTC)", "USD/CHF (OTC)",
        "AUD/NZD (OTC)", "CAD/CHF (OTC)", "CHF/JPY (OTC)", "EUR/SGD (OTC)",
        "USD/MXN (OTC)", "USD/COP (OTC)", "NZD/CAD (OTC)", "USD/ARS (OTC)",
        "EUR/CHF (OTC)", "USD/IDR (OTC)", "USD/NGN (OTC)", "AUD/CAD (OTC)",
        "AUD/JPY (OTC)", "AUD/USD (OTC)", "USD/BDT (OTC)", "USD/PHP (OTC)",
        "USD/PKR (OTC)", "USD/TRY (OTC)"
    ],
    real: [
        "NZD/CHF", "USD/BRL", "EUR/GBP", "GBP/AUD",
        "GBP/JPY", "GBP/USD", "USD/JPY", "USD/ZAR",
        "EUR/AUD", "EUR/CAD", "EUR/JPY", "EUR/USD",
        "GBP/CAD", "GBP/CHF", "USD/CAD", "USD/CHF",
        "AUD/NZD", "CAD/CHF", "CHF/JPY", "EUR/SGD",
        "USD/MXN", "USD/COP", "NZD/CAD", "USD/ARS",
        "EUR/CHF", "USD/IDR", "USD/NGN", "AUD/CAD",
        "AUD/JPY", "AUD/USD", "USD/BDT", "USD/PHP",
        "USD/PKR", "USD/TRY"
    ]
};

// State management
let currentMarket = 'otc';
let selectedTimeframe = 5;
let sessionInterval = null;

// DOM Elements will be initialized inside the function
let marketTabs, currencySelect, timeframeBtns, getSignalBtn, signalDisplay, loadingAnimation;

/**
 * MAIN INITIALIZATION FUNCTION
 * এই ফাংশনটি login.js থেকে কল হবে যখন লগইন সফল হবে।
 */
window.initializeApp = function() {
    console.log("Initializing App...");

    // ১. Session Check
    const hasJoined = localStorage.getItem('phoenixBotJoined');
    const loginTime = localStorage.getItem('phoenixBotLoginTime');
    
    if (hasJoined !== 'true' || !loginTime) {
        console.warn("Session not found. Reloading to login.");
        location.reload(); 
        return;
    }
    
    const currentTime = Date.now();
    const timeDifference = currentTime - parseInt(loginTime);
    const oneHour = 60 * 60 * 1000;
    
    if (timeDifference >= oneHour) {
        localStorage.removeItem('phoenixBotJoined');
        localStorage.removeItem('phoenixBotLoginTime');
        alert('Your session has expired. Please login again.');
        location.reload();
        return;
    }

    // ২. Setup Session Checker
    if (sessionInterval) clearInterval(sessionInterval);
    sessionInterval = setInterval(checkSession, 60000);

    // ৩. Initialize DOM Elements (এখন এগুলো নিশ্চিতভাবে ডোমে আছে)
    marketTabs = document.querySelectorAll('.market-tab');
    currencySelect = document.getElementById('currencySelect');
    timeframeBtns = document.querySelectorAll('.timeframe-btn');
    getSignalBtn = document.getElementById('getSignalBtn');
    signalDisplay = document.getElementById('signalDisplay');
    loadingAnimation = document.getElementById('loadingAnimation');

    // চেক করা যাতে গুরুত্বপূর্ণ এলিমেন্ট missing না থাকে
    if (!getSignalBtn || !signalDisplay) {
        console.error("Critical App Elements Missing! Check app.html structure.");
        return;
    }

    // ৪. Event Listeners সেটআপ
    marketTabs.forEach(tab => {
        tab.addEventListener('click', handleMarketChange);
    });

    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', handleTimeframeChange);
    });

    getSignalBtn.addEventListener('click', handleGetSignal);

    // Popup Click Listeners
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.id === 'popupJoinBtn') {
            e.preventDefault();
            window.open('https://t.me/rstradersiam', '_blank');
            const popup = document.getElementById('postSignalPopup');
            if (popup) { popup.classList.remove('show'); popup.style.display = 'none'; }
        }
        if (target && target.id === 'popupCloseBtn') {
            e.preventDefault();
            window.open('https://t.me/rstradersiam', '_blank');
            const popup = document.getElementById('postSignalPopup');
            if (popup) { popup.classList.remove('show'); popup.style.display = 'none'; }
        }
    });

    // ৫. Initial Setup
    updateCurrencyPairs();
    
    // Add gradient to loading circle
    const svgGradient = `
        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
        </defs>
    `;
    document.querySelectorAll('.loading-circle').forEach(svg => {
        svg.innerHTML = svgGradient + svg.innerHTML;
    });

    // Wake Lock
    requestWakeLock();
    
    console.log("App Initialized Successfully!");
};

// --- Helper Functions ---

function handleMarketChange(e) {
    marketTabs.forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    currentMarket = e.target.dataset.market;
    updateCurrencyPairs();
}

function updateCurrencyPairs() {
    if (!currencySelect) return;
    const pairs = currencyPairs[currentMarket];
    currencySelect.innerHTML = '';
    pairs.forEach(pair => {
        const option = document.createElement('option');
        option.value = pair;
        option.textContent = pair;
        currencySelect.appendChild(option);
    });
}

function handleTimeframeChange(e) {
    timeframeBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    selectedTimeframe = parseInt(e.target.dataset.time);
}

async function handleGetSignal() {
    if (!getSignalBtn || !loadingAnimation) return;
    
    getSignalBtn.disabled = true;
    loadingAnimation.classList.add('active');
    
    const loadingTime = Math.floor(Math.random() * 2000) + 2000;
    await sleep(loadingTime);
    
    const signal = generateSignal();
    
    loadingAnimation.classList.remove('active');
    displaySignal(signal);
    
    getSignalBtn.disabled = false;
}

function generateSignal() {
    const selectedPair = currencySelect ? currencySelect.value : "EUR/USD (OTC)";
    const direction = Math.random() > 0.5 ? 'up' : 'down';
    const minutes = Math.floor(selectedTimeframe / 60);
    const seconds = selectedTimeframe % 60;
    const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
        pair: selectedPair,
        direction: direction,
        time: timeDisplay,
        timeSeconds: selectedTimeframe
    };
}

function displaySignal(signal) {
    if (!signalDisplay) return;

    const directionText = signal.direction === 'up' ? '↑' : '↓';
    const directionClass = signal.direction === 'up' ? 'up' : 'down';
    const directionName = signal.direction === 'up' ? 'CALL (UP)' : 'PUT (DOWN)';

    const signalHTML = `
        <div class="signal-result">
            <div class="signal-info">
                <div class="signal-pair">${signal.pair}</div>
                <div class="signal-time">Time: ${signal.time}</div>
            </div>
            <div class="signal-direction">
                <div class="direction-arrow ${directionClass}">
                    ${directionText}
                </div>
            </div>
            <div class="signal-action">
                <p style="margin-top: 20px; font-size: 1.2rem; font-weight: 600; color: ${signal.direction === 'up' ? '#38ef7d' : '#ff6a00'};">
                    ${directionName}
                </p>
            </div>
        </div>
    `;

    signalDisplay.innerHTML = signalHTML;

    const timeEl = signalDisplay.querySelector('.signal-time');
    const seconds = signal.timeSeconds || selectedTimeframe;

    setTimeout(() => {
        startCountdown(seconds, timeEl).then(() => {
            if(timeEl) timeEl.textContent = `Time: ${formatMMSS(seconds)}`;
            showResultMessage();
        });
    }, 700);

    let signalCounter = parseInt(localStorage.getItem('phoenixSignalCount') || '0', 10);
    signalCounter += 1;
    localStorage.setItem('phoenixSignalCount', String(signalCounter));
    const popupAfter = 3;
    
    if (signalCounter >= popupAfter) {
        localStorage.setItem('phoenixSignalCount', '0');
        setTimeout(() => {
            const popup = document.getElementById('postSignalPopup');
            if (popup) {
                popup.classList.add('show');
                popup.style.display = 'block';
            }
        }, 600);
    }
}

function formatMMSS(totalSeconds) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function startCountdown(totalSeconds, element) {
    return new Promise((resolve) => {
        let remaining = totalSeconds;
        if(element) element.textContent = `Time: ${formatMMSS(remaining)}`;
        const interval = setInterval(() => {
            remaining -= 1;
            if (remaining >= 0 && element) {
                element.textContent = `Time: ${formatMMSS(remaining)}`;
            }
            if (remaining <= 0) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
}

function showResultMessage() {
    if (!signalDisplay) return;
    const resultHtml = `
        <div class="result-text">
            <div class="result-line">Your signal result has arrived</div>
            <div class="result-sub">Ready for the next signal</div>
        </div>`;
    const existing = signalDisplay.innerHTML;
    signalDisplay.innerHTML = existing + resultHtml;
    signalDisplay.classList.add('result-shown');
    setTimeout(() => signalDisplay.classList.remove('result-shown'), 2200);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('Wake Lock error:', err);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

function checkSession() {
    const loginTime = localStorage.getItem('phoenixBotLoginTime');
    if (!loginTime) {
        location.reload();
        return;
    }
    const currentTime = Date.now();
    const timeDifference = currentTime - parseInt(loginTime);
    const oneHour = 60 * 60 * 1000;
    
    if (timeDifference >= oneHour) {
        localStorage.removeItem('phoenixBotJoined');
        localStorage.removeItem('phoenixBotLoginTime');
        alert('Your session has expired. Please login again.');
        location.reload();
    }
}
