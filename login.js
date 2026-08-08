document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('tgUser').value.trim();
        const key = document.getElementById('accessKey').value.trim();
        const errorEl = document.getElementById('errorMsg');
        const loadingEl = document.getElementById('loadingMsg');
        const btn = document.getElementById('loginBtn');
        const btnText = btn.querySelector('span');

        // Reset UI
        errorEl.textContent = '';
        loadingEl.style.display = 'block';
        btn.disabled = true;
        if(btnText) btnText.textContent = 'VERIFYING...';

        try {
            // 1. Check Username in keys_lookup
            const lookupUrl = `${DB_URL}/keys_lookup/${encodeURIComponent(username)}.json`;
            const res = await fetch(lookupUrl);
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();

            if (!data || data.valid !== true) {
                throw new Error("User not found with this Telegram Username.");
            }

            // 2. Check User Details & Access Key
            const userUrl = `${DB_URL}/users/${data.uid}.json`;
            const userRes = await fetch(userUrl);
            const userData = await userRes.json();

            if (!userData) {
                throw new Error("User data corrupted.");
            }

            if (userData.isActive !== true) {
                throw new Error("Account is inactive. Contact support.");
            }

            if (userData.accessKey !== key) {
                throw new Error("Invalid Access Key.");
            }

            // 3. Success: Update Last Login
            const updateUrl = `${DB_URL}/users/${data.uid}/lastLogin.json`;
            await fetch(updateUrl, {
                method: 'PUT',
                body: JSON.stringify(new Date().toISOString())
            });

            // 4. Set Session
            localStorage.setItem('phoenixBotJoined', 'true');
            localStorage.setItem('phoenixBotLoginTime', Date.now().toString());
            localStorage.setItem('phoenixSignalCount', '0');

            // 5. Transition to App
            loadingEl.textContent = "Access Granted. Loading System...";
            loadingEl.style.color = "#38ef7d";
            
            setTimeout(() => {
                // Hide Login Screen via CSS class on body (handled by Code.gs injected styles)
                document.body.classList.add('loaded');
                document.body.classList.add('loading-app');
                
                // Initialize App Logic
                if (typeof initializeApp === 'function') {
                    initializeApp();
                } else {
                    // If app.js not loaded yet, trigger loader and wait
                    if (typeof loadAppScripts === 'function') loadAppScripts();
                    
                    const checkInterval = setInterval(() => {
                        if (typeof initializeApp === 'function') {
                            initializeApp();
                            clearInterval(checkInterval);
                        }
                    }, 200);
                }
            }, 800);

        } catch (err) {
            console.error("Login Error:", err);
            errorEl.textContent = err.message;
            btn.disabled = false;
            if(btnText) btnText.textContent = 'UNLOCK BOT';
            loadingEl.style.display = 'none';
            loadingEl.textContent = "Verifying Secure Connection..."; // Reset text
            loadingEl.style.color = "#00d2ff";
        }
    });
});
