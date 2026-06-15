document.addEventListener('DOMContentLoaded', () => {
    const addForm = document.getElementById('add-form');
    const btnGenerate = document.getElementById('btn-generate');
    const pwdInput = document.getElementById('password');
    const websiteInput = document.getElementById('website');
    const messageEl = document.getElementById('add-message');
    const passwordsList = document.getElementById('passwords-list');
    const searchInput = document.getElementById('search-passwords');
    
    let allPasswords = {};

    // Fetch passwords on load
    fetchPasswords();

    // Generate password
    btnGenerate.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/generate-password');
            const data = await res.json();
            pwdInput.value = data.password;
        } catch (err) {
            console.error('Error generating password', err);
        }
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
        messageEl.textContent = msg;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 3000);
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
