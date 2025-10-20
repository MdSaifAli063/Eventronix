# 🎉 Event Platform Backend + Frontend Static Serving  

<div align="center">
  
A **Flask-based backend** that registers multiple feature blueprints and serves a static frontend (HTML/CSS/JS) directly from the repository. Designed for quick local development and simple deployments. 

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-Backend-black?logo=flask)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#-license)


</div>

---
## 🛠️ Tools & Tech Stack  

- 🐍 **Python 3.10+** — Core programming language  
- ⚡ **Flask** — Backend & API framework  
- 🍃 **MongoDB** — Database (via `MONGO_URI`)  
- 🎨 **HTML / CSS / JS** — Static frontend pages  
- 🔐 **Flask-CORS & Sessions** — Auth & security  
- 🧪 **Pytest** — Testing framework  

---

## 🔗 Live Demo   

🌐 **Demo:** [Click Here to Try It](https://event-platform-xp0r.onrender.com) 

---

## 📸 **Preview:**  

![image](https://github.com/MdSaifAli063/Event-Platform/blob/01331d64620fd3708a137f8f488af0cecba2e739/Screenshot%202025-09-30%20005650.png)  

![image](https://github.com/MdSaifAli063/Event-Platform/blob/1bdef3663499f184d8173fbbc8e728bb631752a4/Screenshot%202025-09-30%20005849.png)

![image](https://github.com/MdSaifAli063/Event-Platform/blob/82db079d6c02164ba18919fd33333485925cee9c/Screenshot%202025-09-30%20005951.png)

![image](https://github.com/MdSaifAli063/Event-Platform/blob/4ddd99f4fcf3620a42e3343a0940505d25e3be75/Screenshot%202025-09-30%20010059.png)

![image](https://github.com/MdSaifAli063/Event-Platform/blob/307538cbb0496501e8696ee81e6775cd1761daf5/Screenshot%202025-09-30%20010408.png)

---

## 🧭 Overview  

This application exposes API blueprints and serves the frontend pages from a sibling `frontend/` directory.  

**Blueprints registered:**  
- 🔐 Auth → `auth_bp`  
- 👥 Organizer → `organizer_bp`  
- 🙋 Participant → `participant_bp`  
- 🤝 Collaboration → `collab_bp`  
- 🖥️ Virtual Event → `virtual_bp`  

---

## 🧱 Project Structure  

.
├─ backend/
│ ├─ app.py # Entry point registering blueprints and serving frontend
│ ├─ config.py # Flask app, CORS, secrets, DB config
│ └─ routes/
│ ├─ auth.py # auth_bp
│ ├─ organizer.py # organizer_bp
│ ├─ participant.py # participant_bp
│ ├─ collaboration.py # collab_bp
│ └─ virtual_event.py # virtual_bp
├─ frontend/
-│ ├─ common_dashboard.html
│ ├─ signin.html
│ ├─ signup.html
│ ├─ organizer_dashboard.html
│ ├─ participant_dashboard.html
│ ├─ virtual_event.html
│ └─ assets/
│ ├─ css/ ...
│ └─ js/ ...
└─ README.md


> 📝 Ensure `backend/__init__.py` exists so `backend` is recognized as a package.  

---

## ⚙️ Prerequisites  

- 🐍 Python 3.10+  
- 📦 pip & virtualenv (or poetry/uv)  
- 🍃 MongoDB (if using DB features)  
- 🔑 Environment variables configured  

---

## 🚀 Setup  

```bash
# 1) Clone the repo
git clone <repo-url>
cd <project-folder>

# 2) Create & activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# 3) Install dependencies
pip install -r requirements.txt

# 4) Create .env file
cp .env.example .env

```

## 🔐 Environment Variables

Example .env:

```bash
SECRET_KEY=supersecretkey
MONGO_URI=mongodb://localhost:27017/your-db
PORT=5000
FLASK_DEBUG=True

```
---

## ▶️ Run the App

Recommended (module mode from root):

python -m backend.app

Alternative (Flask CLI):

### Windows (PowerShell)
$env:FLASK_APP="backend.app"; $env:FLASK_DEBUG="True"; flask run --host 0.0.0.0 --port 5000

### macOS/Linux
export FLASK_APP=backend.app
export FLASK_DEBUG=True
flask run --host 0.0.0.0 --port 5000

📍 Default: http://0.0.0.0:5000
- 🏠 `GET /` → `frontend/common_dashboard.html`
- 🔑 `GET /signin` → `frontend/signin.html`
- 📝 `GET /signup` → `frontend/signup.html`
- 🗂️ `GET /organizer_dashboard` → `frontend/organizer_dashboard.html`
- 🙋 `GET /participant_dashboard` → `frontend/participant_dashboard.html`
- 🖥️ `GET /virtual_event` → `frontend/virtual_event.html`
- 🎨 `GET /assets/<path>` → serves from `frontend/assets/`

All other unknown paths will fallback to `common_dashboard.html`.

---

## 🔌 API Routes

- 🏠 / → common_dashboard.html
- 🔑 /signin → signin.html
- 📝 /signup → signup.html
- 🗂️ /organizer_dashboard → organizer_dashboard.html
- 🙋 /participant_dashboard → participant_dashboard.html
- 🖥️ /virtual_event → virtual_event.html
- 🎨 /assets/<path> → static files

---

## 🧑‍💻 Development Tips

- Run from project root (not inside backend/)
- Always keep backend/__init__.py present
- Add new HTML → frontend/
- Map new routes → backend/app.py

---

## 🧪 Testing

- pytest -q

---
## 🛡️ Production Notes

- ⚠️ Set FLASK_DEBUG=False and a strong SECRET_KEY
- 🌍 Use WSGI server (gunicorn/waitress)

pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} backend.app:app

---

## 🤝 Contributing

- Fork repo
- Create feature branch
- Commit changes with clear messages
- Open a PR

---

## 📄 License

📝 MIT , Daval malik sayad ali makandar, Md Saif Ali



