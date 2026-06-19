# VaultSafe - Premium Password Manager

VaultSafe is a sleek, modern, and lightweight web-based password manager. Originally a simple command-line Python script, it has been completely reimagined into a premium web application with a focus on UI/UX, utilizing a Flask backend and a "glassmorphism" frontend design.

##  Features

- **Beautiful Modern Interface**: Dark mode by default, featuring frosted glass (glassmorphism) cards and an animated gradient background.
- **Secure Password Generator**: Instantly generate cryptographically secure 12-character passwords containing uppercase, lowercase, numbers, and symbols.
- **Real-Time Search**: Filter through your saved passwords instantly without page reloads.
- **Copy to Clipboard**: Click on any masked password to temporarily reveal it and automatically copy it to your clipboard.
- **Asynchronous Operations**: Uses the Fetch API for smooth, non-blocking additions and retrievals of your passwords.

## 🛠️ Technology Stack

### Backend
- **Python 3**
- **Flask** (Lightweight WSGI web application framework)

### Frontend
- **HTML5** (Semantic structure)
- **CSS3** (Custom properties, Flexbox, CSS Grid, animations)
- **Vanilla JavaScript** (DOM manipulation, async Fetch API)

##  Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mishraadarsh27/password-manager.git
   cd password-manager
   ```

2. **Install dependencies:**
   Ensure you have Python installed, then run:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the Web UI:**
   Open your browser and navigate to `http://127.0.0.1:5000`

## 📂 Project Structure

```text
password-manager/
├── app.py                  # Main Flask application and API routes
├── password.txt            # Local storage for encrypted/saved passwords
├── requirements.txt        # Python dependencies
├── pasword_manager.py      # Original legacy CLI version
├── templates/
│   └── index.html          # Main application HTML structure
└── static/
    ├── css/
    │   └── style.css       # Glassmorphism styling and animations
    └── js/
        └── app.js          # Frontend logic and API integration
```

## 🔐 How it Works

1. **Storage**: Passwords are saved in a simple local file (`password.txt`) using a `Website:Password` structure. 
2. **API**: The Flask backend exposes endpoints (`/api/passwords`, `/api/generate-password`) which the frontend securely communicates with.
3. **Security Note**: This application is currently designed for local, personal use. Passwords are saved in plain text in the `.txt` file. For production, a database with strong encryption (like bcrypt or Argon2) should be implemented.

## 👨‍💻 Author
**Adarsh Mishra**
