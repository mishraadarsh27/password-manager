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
            if (res.status === 401) { window.location.href = '/login'; return; }
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
            
            if (res.status === 401) { window.location.href = '/login'; return; }
            
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
            if (res.status === 401) { window.location.href = '/login'; return; }
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
            passwordsList.innerHTML = `
                <div class="empty-state" style="padding: 3rem 1rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <h3 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 0.5rem;">Your vault is empty</h3>
                    <p style="font-size: 0.95rem; line-height: 1.5;">Add your first password securely above to start managing your digital life.</p>
                </div>
            `;
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
                    <div class="pwd-info" style="display: flex; align-items: center; gap: 1rem;">
                        <span class="site-name">${escapeHTML(site)}</span>
                        <span class="pwd-text" title="Click to copy or reveal" data-pwd="${escapeHTML(pwd)}">${'*'.repeat(8)}</span>
                    </div>
                    <button class="btn-delete" title="Delete Password" data-site="${escapeHTML(site)}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
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
                
                // Delete functionality
                const btnDelete = item.querySelector('.btn-delete');
                btnDelete.addEventListener('click', async function() {
                    const siteToDelete = this.dataset.site;
                    if (confirm(`Are you sure you want to delete the password for ${siteToDelete}?`)) {
                        try {
                            const res = await fetch(`/api/passwords/${encodeURIComponent(siteToDelete)}`, {
                                method: 'DELETE'
                            });
                            if (res.status === 401) { window.location.href = '/login'; return; }
                            const data = await res.json();
                            if (res.ok) {
                                item.style.opacity = '0';
                                item.style.transform = 'translateX(-20px)';
                                setTimeout(() => {
                                    fetchPasswords();
                                    showMessage('Password deleted', 'success');
                                }, 300);
                            } else {
                                showMessage(data.error || 'Failed to delete', 'error');
                            }
                        } catch (err) {
                            showMessage('Network error', 'error');
                        }
                    }
                });
                
                passwordsList.appendChild(item);
            }
        });
        
        if (matchCount === 0) {
            passwordsList.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">No matches found</h3>
                    <p style="font-size: 0.9rem;">Try searching for a different website name.</p>
                </div>
            `;
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
