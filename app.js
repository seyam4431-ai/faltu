// গ্লোবাল ভেরিয়েবল (ফাংশনের বাইরে ডিক্লেয়ার কিন্তু ভ্যালু ফাংশনের ভেতরে আসাইন হবে)
let currentMarket = 'otc';
let selectedTimeframe = 5;
let sessionInterval = null;

// Currency pairs data (এটি অপরিবর্তিত থাকবে)
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

// এই ফাংশনটি login.js থেকে কল করা হবে যখন লগইন সফল হবে
window.initializeApp = function() {
    console.log("🚀 Initializing App...");

    // ১. Session Validation
    const hasJoined = localStorage.getItem('phoenixBotJoined');
    const loginTime = localStorage.getItem('phoenixBotLoginTime');
    
    if (hasJoined !== 'true' || !loginTime) {
        console.warn("Session not found. Reloading...");
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

    // ২. DOM Elements সিলেক্ট করা (এখন নিশ্চিত যে এগুলো ডোমে আছে)
    const marketTabs = document.querySelectorAll('.market-tab');
    const currencySelect = document.getElementById('currencySelect');
    const timeframeBtns = document.querySelectorAll('.timeframe-btn');
    const getSignalBtn = document.getElementById('getSignalBtn');
    const signalDisplay = document.getElementById('signalDisplay');
    const loadingAnimation = document.getElementById('loadingAnimation');
    const postSignalPopup = document.getElementById('postSignalPopup');

    // চেক করা যাতে গুরুত্বপূর্ণ এলিমেন্ট missing না থাকে
    if (!getSignalBtn || !signalDisplay || !currencySelect) {
        console.error("❌ Critical App Elements Missing! Check app.html structure.");
        return;
    }

    console.log("✅ DOM Elements Found. Setting up listeners...");

    // ৩. Event Listeners সেটআপ
    marketTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            marketTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentMarket = e.target.dataset.market;
            updateCurrencyPairs();
        });
    });

    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            timeframeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedTimeframe = parseInt(e.target.dataset.time);
        });
    });

    getSignalBtn.addEventListener('click', async () => {
        getSignalBtn.disabled = true;
        if(loadingAnimation) loadingAnimation.classList.add('active');
        
        const loadingTime = Math.floor(Math.random() * 2000) + 2000;
        await new Promise(resolve => setTimeout(resolve, loadingTime));
        
        const signal = generateSignal(currencySelect.value, selectedTimeframe);
        
        if(loadingAnimation) loadingAnimation.classList.remove('active');
        displaySignal(signal, signalDisplay, currencySelect.value, selectedTimeframe);
        
        getSignalBtn.disabled = false;
    });

    // Popup Logic
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && (target.id === 'popupJoinBtn' || target.id === 'popupCloseBtn')) {
            e.preventDefault();
            window.open('https://t.me/rstradersiam', '_blank');
            if (postSignalPopup) {
                postSignalPopup.classList.remove('show');
                postSignalPopup.style.display = 'none';
            }
        }
    });

    // ৪. Initial Setup
    updateCurrencyPairs();
    
    // Gradient for Loading Circle
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

    // ৫. Session Checker
    if (sessionInterval) clearInterval(sessionInterval);
    sessionInterval = setInterval(() => {
        const lt = localStorage.getItem('phoenixBotLoginTime');
        if (!lt) { location.reload(); return; }
        if ((Date.now() - parseInt(lt)) >= oneHour) {
            localStorage.clear();
            alert('Session Expired');
            location.reload();
        }
    }, 60000);

    // ৬. Wake Lock
    requestWakeLock();
    
    console.log("✨ App Initialized Successfully!");
};

// Helper Functions
function updateCurrencyPairs() {
    const currencySelect = document.getElementById('currencySelect');
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

function generateSignal(pair, time) {
    const direction = Math.random() > 0.5 ? 'up' : 'down';
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return {
        pair: pair,
        direction: direction,
        time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        timeSeconds: time
    };
}

function displaySignal(signal, container, originalPair, originalTime) {
    if (!container) return;

    const directionText = signal.direction === 'up' ? '↑' : '↓';
    const directionClass = signal.direction === 'up' ? 'up' : 'down';
    const directionName = signal.direction === 'up' ? 'CALL (UP)' : 'PUT (DOWN)';
    const color = signal.direction === 'up' ? '#38ef7d' : '#ff6a00';

    container.innerHTML = `
        <div class="signal-result">
            <div class="signal-info">
                <div class="signal-pair">${signal.pair}</div>
                <div class="signal-time">Time: ${signal.time}</div>
            </div>
            <div class="signal-direction">
                <div class="direction-arrow ${directionClass}">${directionText}</div>
            </div>
            <div class="signal-action">
                <p style="margin-top: 20px; font-size: 1.2rem; font-weight: 600; color: ${color};">
                    ${directionName}
                </p>
            </div>
        </div>
    `;

    const timeEl = container.querySelector('.signal-time');
    
    setTimeout(() => {
        startCountdown(signal.timeSeconds, timeEl).then(() => {
            if(timeEl) timeEl.textContent = `Time: ${formatMMSS(originalTime)}`;
            showResultMessage(container);
            
            // Popup Trigger
            let count = parseInt(localStorage.getItem('phoenixSignalCount') || '0', 10);
            count++;
            localStorage.setItem('phoenixSignalCount', String(count));
            if (count >= 3) {
                localStorage.setItem('phoenixSignalCount', '0');
                const popup = document.getElementById('postSignalPopup');
                if (popup) {
                    popup.classList.add('show');
                    popup.style.display = 'block';
                }
            }
        });
    }, 700);
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

function showResultMessage(container) {
    if (!container) return;
    const html = `
        <div class="result-text">
            <div class="result-line">Your signal result has arrived</div>
            <div class="result-sub">Ready for the next signal</div>
        </div>`;
    container.innerHTML += html;
    container.classList.add('result-shown');
    setTimeout(() => container.classList.remove('result-shown'), 2200);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) { console.log('Wake Lock error:', err); }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
});
