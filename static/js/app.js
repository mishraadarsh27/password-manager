document.addEventListener('DOMContentLoaded', () => {
    const addForm = document.getElementById('add-form');
    const btnGenerate = document.getElementById('btn-generate');
    const pwdInput = document.getElementById('password');
    const websiteInput = document.getElementById('website');
    const messageEl = document.getElementById('add-message');
    const passwordsList = document.getElementById('passwords-list');
    const searchInput = document.getElementById('search-passwords');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const btnCopy = document.getElementById('btn-copy');
    const btnToggleVis = document.getElementById('btn-toggle-vis');
    
    let allPasswords = {};

    // Fetch passwords on load
    fetchPasswords();

    // Generate password
    btnGenerate.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/generate-password');
            const data = await res.json();
            pwdInput.value = data.password;
            evaluatePasswordStrength(data.password);
        } catch (err) {
            console.error('Error generating password', err);
        }
    });

    btnToggleVis.addEventListener('click', () => {
        pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    });

    btnCopy.addEventListener('click', () => {
        if (pwdInput.value) {
            navigator.clipboard.writeText(pwdInput.value).then(() => {
                showMessage('Password copied to clipboard', 'success');
            });
        }
    });

    pwdInput.addEventListener('input', (e) => {
        evaluatePasswordStrength(e.target.value);
    });

    // Add password
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const website = websiteInput.value.trim();
        const password = pwdInput.value.trim();
        
        if (!website || !password) return;
        
        try {
            const res = await fetch('/api/passwords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ website, password })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showMessage(data.message, 'success');
                addForm.reset();
                evaluatePasswordStrength('');
                fetchPasswords(); // Refresh list
            } else {
                showMessage(data.error || 'Failed to save', 'error');
            }
        } catch (err) {
            showMessage('Network error occurred', 'error');
        }
    });

    // Search filter
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderPasswords(term);
    });

    function showMessage(msg, type) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function evaluatePasswordStrength(password) {
        if (!password) {
            strengthBar.style.width = '0%';
            strengthText.textContent = '';
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^A-Za-z0-9]/.test(password)) strength += 10;

        strengthBar.style.width = `${Math.min(strength, 100)}%`;

        if (strength <= 40) {
            strengthBar.style.backgroundColor = 'var(--danger)';
            strengthText.textContent = 'Weak';
            strengthText.style.color = 'var(--danger)';
        } else if (strength <= 75) {
            strengthBar.style.backgroundColor = 'var(--warning)';
            strengthText.textContent = 'Medium';
            strengthText.style.color = 'var(--warning)';
        } else {
            strengthBar.style.backgroundColor = 'var(--accent)';
            strengthText.textContent = 'Strong';
            strengthText.style.color = 'var(--accent)';
        }
    }

    async function fetchPasswords() {
        try {
            const res = await fetch('/api/passwords');
            allPasswords = await res.json();
            renderPasswords();
        } catch (err) {
            passwordsList.innerHTML = '<div class="error">Failed to load passwords.</div>';
        }
    }

    function renderPasswords(filterTerm = '') {
        passwordsList.innerHTML = '';
        
        const entries = Object.entries(allPasswords);
        
        if (entries.length === 0) {
            passwordsList.innerHTML = '<div class="empty-state">No passwords saved yet.</div>';
            return;
        }
        
        let matchCount = 0;
        
        entries.forEach(([site, pwd]) => {
            if (site.toLowerCase().includes(filterTerm)) {
                matchCount++;
                const item = document.createElement('div');
                item.className = 'password-item';
                
                // Truncate long sites or visually format them
                item.innerHTML = `
                    <span class="site-name">${escapeHTML(site)}</span>
                    <span class="pwd-text" title="Click to copy or reveal" data-pwd="${escapeHTML(pwd)}">${'*'.repeat(8)}</span>
                `;
                
                // Add click to copy / reveal functionality
                const pwdEl = item.querySelector('.pwd-text');
                pwdEl.addEventListener('click', function() {
                    if (this.textContent.includes('*')) {
                        this.textContent = this.dataset.pwd;
                        setTimeout(() => {
                            this.textContent = '*'.repeat(8);
                        }, 5000);
                    }
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(this.dataset.pwd).then(() => {
                        // Visual feedback
                        const originalBg = this.style.backgroundColor;
                        this.style.backgroundColor = 'rgba(16, 185, 129, 0.4)';
                        setTimeout(() => {
                            this.style.backgroundColor = originalBg;
                        }, 500);
                    });
                });
                
                passwordsList.appendChild(item);
            }
        });
        
        if (matchCount === 0) {
            passwordsList.innerHTML = '<div class="empty-state">No matching websites found.</div>';
        }
    }
    
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }
});
