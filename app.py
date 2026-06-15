from flask import Flask, request, jsonify, render_template
import random
import string
import os

app = Flask(__name__)
PASSWORD_FILE = "password.txt"

def get_passwords():
    passwords = {}
    if os.path.exists(PASSWORD_FILE):
        with open(PASSWORD_FILE, "r") as file:
            for line in file:
                line = line.strip()
                if not line:
                    continue
                # Handle cases where password itself might have a colon
                parts = line.split(":", 1)
                if len(parts) == 2:
                    passwords[parts[0]] = parts[1]
    return passwords

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/passwords", methods=["GET"])
def api_get_passwords():
    return jsonify(get_passwords())

@app.route("/api/passwords", methods=["POST"])
def api_add_password():
    data = request.json
    site = data.get("website")
    pwd = data.get("password")
    
    if not site or not pwd:
        return jsonify({"error": "Website and password are required"}), 400
        
    with open(PASSWORD_FILE, "a") as file:
        file.write(f"{site}:{pwd}\n")
        
    return jsonify({"message": "Saved successfully!"}), 201

@app.route("/api/generate-password", methods=["GET"])
def api_generate_password():
    chars = string.ascii_letters + string.digits + "!@#$% "
    password = ''.join(random.choice(chars) for _ in range(12)) # increased to 12 for better security
    return jsonify({"password": password})

if __name__ == "__main__":
    app.run(debug=True)
