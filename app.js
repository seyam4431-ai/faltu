// Check if user is logged in and session is valid
document.addEventListener('DOMContentLoaded', () => {
    const hasJoined = localStorage.getItem('phoenixBotJoined');
    const loginTime = localStorage.getItem('phoenixBotLoginTime');
    
    if (hasJoined !== 'true' || !loginTime) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return;
    }
    
    // Check if session is still valid (within 1 hour)
    const currentTime = Date.now();
    const timeDifference = currentTime - parseInt(loginTime);
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (timeDifference >= oneHour) {
        // Session expired, clear and redirect to login
        localStorage.removeItem('phoenixBotJoined');
        localStorage.removeItem('phoenixBotLoginTime');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize app
    initializeApp();
    
    // Set up session checker to run every minute
    setInterval(checkSession, 60000); // Check every 1 minute
});

// Currency pairs data
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
let selectedTimeframe = 5; // Default 5 seconds

// DOM Elements
const marketTabs = document.querySelectorAll('.market-tab');
const currencySelect = document.getElementById('currencySelect');
const timeframeBtns = document.querySelectorAll('.timeframe-btn');
const getSignalBtn = document.getElementById('getSignalBtn');
const signalDisplay = document.getElementById('signalDisplay');
const loadingAnimation = document.getElementById('loadingAnimation');

function initializeApp() {
    // Event listeners
    marketTabs.forEach(tab => {
        tab.addEventListener('click', handleMarketChange);
    });

    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', handleTimeframeChange);
    });

    getSignalBtn.addEventListener('click', handleGetSignal);

    // Update currency pairs based on default market
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
}

function handleMarketChange(e) {
    // Remove active class from all tabs
    marketTabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to clicked tab
    e.target.classList.add('active');
    
    // Update current market
    currentMarket = e.target.dataset.market;
    
    // Update currency pairs dropdown
    updateCurrencyPairs();
}

function updateCurrencyPairs() {
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
    // Remove active class from all buttons
    timeframeBtns.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    // Update selected timeframe
    selectedTimeframe = parseInt(e.target.dataset.time);
}

async function handleGetSignal() {
    // Disable button
    getSignalBtn.disabled = true;
    
    // Show loading animation
    loadingAnimation.classList.add('active');
    
    // Random loading time between 2-4 seconds
    const loadingTime = Math.floor(Math.random() * 2000) + 2000;
    
    await sleep(loadingTime);
    
    // Generate signal
    const signal = generateSignal();
    
    // Hide loading animation
    loadingAnimation.classList.remove('active');
    
    // Display signal
    displaySignal(signal);
    
    // Re-enable button
    getSignalBtn.disabled = false;
}

function generateSignal() {
    const selectedPair = currencySelect.value;
    const direction = Math.random() > 0.5 ? 'up' : 'down';

    // Format time as mm:ss from seconds
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

    // Start the delayed countdown 0.7s after the signal appears
    const timeEl = signalDisplay.querySelector('.signal-time');
    const seconds = signal.timeSeconds || selectedTimeframe;

    // Immediately show mm:ss (already placed), then after 0.7s start reverse countdown
    setTimeout(() => {
        startCountdown(seconds, timeEl).then(() => {
            // When countdown completes, freeze to original selected time and show result text
            timeEl.textContent = `Time: ${formatMMSS(seconds)}`;
            // result text
            showResultMessage();
        });
    }, 700);

    // Signal counter and popup trigger
    let signalCounter = parseInt(localStorage.getItem('phoenixSignalCount') || '0', 10);
    signalCounter += 1;
    localStorage.setItem('phoenixSignalCount', String(signalCounter));
    const popupAfter = 3; // show popup after every 3 signals
    if (signalCounter >= popupAfter) {
        localStorage.setItem('phoenixSignalCount', '0');
        // show popup slightly after result
        setTimeout(() => {
            const popup = document.getElementById('postSignalPopup');
            if (popup) popup.classList.add('show');
            popup && (popup.style.display = 'block');
        }, 600);
    }
}

// Helpers for countdown and result display
function formatMMSS(totalSeconds) {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function startCountdown(totalSeconds, element) {
    return new Promise((resolve) => {
        let remaining = totalSeconds;
        element.textContent = `Time: ${formatMMSS(remaining)}`;
        const interval = setInterval(() => {
            remaining -= 1;
            if (remaining >= 0) {
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
    // display stylized result message inside signalDisplay
    const resultHtml = `
        <div class="result-text">
            <div class="result-line">Your signal result has arrived</div>
            <div class="result-sub">Ready for the next signal</div>
        </div>`;
    // Append result below current content
    const existing = signalDisplay.innerHTML;
    signalDisplay.innerHTML = existing + resultHtml;
    // small transient highlight
    signalDisplay.classList.add('result-shown');
    setTimeout(() => signalDisplay.classList.remove('result-shown'), 2200);
}

// Popup wiring: join & close should open Telegram and close the popup
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Prevent screen from sleeping on mobile (optional)
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

// Request wake lock when page is visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

// Initial wake lock request
requestWakeLock();

// Function to check if session is still valid
function checkSession() {
    const loginTime = localStorage.getItem('phoenixBotLoginTime');
    
    if (!loginTime) {
        // No login time found, redirect to login
        window.location.href = 'index.html';
        return;
    }
    
    const currentTime = Date.now();
    const timeDifference = currentTime - parseInt(loginTime);
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (timeDifference >= oneHour) {
        // Session expired
        localStorage.removeItem('phoenixBotJoined');
        localStorage.removeItem('phoenixBotLoginTime');
        alert('Your session has expired. Please login again.');
        window.location.href = 'https://raw.githubusercontent.com/seyam4431-ai/faltu/refs/heads/main/login.html';
    }
}
