from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
from functools import wraps
import random
import string
import os

app = Flask(__name__)
app.secret_key = os.urandom(24) # Secure session key

PASSWORD_FILE = "password.txt"
MASTER_FILE = "master.txt"
KEY_FILE = "secret.key"

def get_encryption_key():
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as key_file:
            key_file.write(key)
    else:
        with open(KEY_FILE, "rb") as key_file:
            key = key_file.read()
    return key

fernet = Fernet(get_encryption_key())

def is_setup_complete():
    return os.path.exists(MASTER_FILE)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            if request.path.startswith('/api/'):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def read_encrypted_passwords():
    passwords = {}
    if os.path.exists(PASSWORD_FILE):
        with open(PASSWORD_FILE, "rb") as file:
            encrypted_data = file.read()
            if not encrypted_data:
                return passwords
            try:
                # Try to decrypt
                decrypted_data = fernet.decrypt(encrypted_data).decode()
                lines = decrypted_data.split('\n')
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split(":", 1)
                    if len(parts) == 2:
                        passwords[parts[0]] = parts[1]
            except Exception:
                # Fallback: it might be the old plaintext file!
                with open(PASSWORD_FILE, "r") as pt_file:
                    for line in pt_file:
                        line = line.strip()
                        if not line:
                            continue
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            passwords[parts[0]] = parts[1]
                # We should re-save it as encrypted now since we just read plaintext
                save_encrypted_passwords(passwords)
    return passwords

def save_encrypted_passwords(passwords):
    lines = []
    for site, pwd in passwords.items():
        lines.append(f"{site}:{pwd}")
    data = "\n".join(lines).encode()
    encrypted_data = fernet.encrypt(data)
    with open(PASSWORD_FILE, "wb") as file:
        file.write(encrypted_data)

@app.route("/login", methods=["GET", "POST"])
def login():
    setup = not is_setup_complete()
    if request.method == "POST":
        password = request.form.get("master_password")
        if setup:
            # First time setup
            hashed_pwd = generate_password_hash(password)
            with open(MASTER_FILE, "w") as f:
                f.write(hashed_pwd)
            
            # Make sure we migrate plaintext to encrypted if any exist
            read_encrypted_passwords()
            
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            # Verify login
            with open(MASTER_FILE, "r") as f:
                saved_hash = f.read().strip()
            if check_password_hash(saved_hash, password):
                session['logged_in'] = True
                return redirect(url_for('index'))
            else:
                return render_template("login.html", is_setup=False, error="Invalid Master Password")
    
    return render_template("login.html", is_setup=setup)

@app.route("/logout")
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route("/")
@login_required
def index():
    return render_template("index.html")

@app.route("/api/passwords", methods=["GET"])
@login_required
def api_get_passwords():
    return jsonify(read_encrypted_passwords())

@app.route("/api/passwords", methods=["POST"])
@login_required
def api_add_password():
    data = request.json
    site = data.get("website")
    pwd = data.get("password")
    
    if not site or not pwd:
        return jsonify({"error": "Website and password are required"}), 400
        
    passwords = read_encrypted_passwords()
    passwords[site] = pwd
    save_encrypted_passwords(passwords)
        
    return jsonify({"message": "Saved successfully!"}), 201

@app.route("/api/passwords/<website>", methods=["DELETE"])
@login_required
def api_delete_password(website):
    passwords = read_encrypted_passwords()
    if website in passwords:
        del passwords[website]
        save_encrypted_passwords(passwords)
        return jsonify({"message": "Deleted successfully!"}), 200
    return jsonify({"error": "Password not found"}), 404

@app.route("/api/generate-password", methods=["GET"])
@login_required
def api_generate_password():
    chars = string.ascii_letters + string.digits + "!@#$% "
    password = ''.join(random.choice(chars) for _ in range(12))
    return jsonify({"password": password})

if __name__ == "__main__":
    app.run(debug=True)
