document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'extra-dark') {
        document.body.classList.add('extra-dark');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
    } else {
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('extra-dark');
            const isDark = document.body.classList.contains('extra-dark');
            
            if (isDark) {
                localStorage.setItem('theme', 'extra-dark');
                themeToggleBtn.textContent = '☀️';
            } else {
                localStorage.setItem('theme', 'default');
                themeToggleBtn.textContent = '🌙';
            }
        });
    }
});
// Apply immediately to prevent flash
if (localStorage.getItem('theme') === 'extra-dark') {
    document.documentElement.classList.add('extra-dark-html'); // In case body isn't ready
}
