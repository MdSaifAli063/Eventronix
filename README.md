# EventFlow — Event & Team Management Platform

EventFlow is a lightweight event management backend and frontend scaffold built with Flask and MongoDB. It provides features for organizers to create events, view registrations and teams, export participants, and generate an AI-based roadmap. Participants can register, create/join teams (including AI-assisted matching), submit team projects, and use collaboration tools (chat, polls, whiteboard). A minimal static frontend is included in the `frontend/` folder 

## Table of contents
- About
- Features
- Tech stack
- Quick start
- Environment variables
- API overview
- Frontend
- Development notes
- License

## About

This repository contains a simple event platform API (Flask) using MongoDB for storage. It was designed as a learning / demo project and includes helper utilities for AI-based roadmap generation and team matching.

## Features

- Organizer: create events, set deadlines, list events, export participants as CSV, view analytics, AI roadmap generation
- Participant: list events, register, create/join teams, AI team matching, submit teams, request/accept/reject join requests
- Collaboration: team chat, polls, collaborative whiteboard
- Static frontend (HTML/CSS/JS) served directly by Flask

## Tech stack

- Python 3.10
- Flask
- MongoDB (via PyMongo / flask-pymongo)
- scikit-learn (used in AI utilities)

Dependencies are listed in `requirements.txt`.

## Quick start (local)

1. Create a Python 3.10 virtual environment and activate it:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Set environment variables (see next section). For local testing you can set sensible defaults. On Windows PowerShell example:

```powershell
Set-Item Env:SECRET_KEY "replace-me"
Set-Item Env:MONGO_URI "mongodb://localhost:27017/event_platform"
Set-Item Env:FLASK_DEBUG "True"
Set-Item Env:PORT "5000"
```

4. Run the app:

```powershell
python backend/app.py
```

The site serves static HTML from `frontend/` and exposes the API endpoints documented below. By default the root path `/` serves `common_dashboard.html`.

## Environment variables

- SECRET_KEY — Flask session secret (default: `supersecretkey`)
- MONGO_URI — MongoDB connection string (default falls back to a prefilled connection in `backend/config.py`; change this for production)
- FLASK_DEBUG — `True` or `False` to enable Flask debug mode
- PORT — Port to run the Flask app on (default 5000)

Important: Do not commit production secrets. Update `backend/config.py` to remove any hard-coded URIs before deploying.

## API overview

All API routes are defined under `backend/routes/` and registered in `backend/app.py`. Below is a compact summary.

Auth
- POST /signup — register (body: email, password, role)
- POST /signin — login (body: email, password)
- GET /auth/check_session — check session
- POST /logout — logout

Organizer (requires organizer session)
- POST /organizer/create_event — create event
- GET /organizer/events — list events
- GET /organizer/event/<event_id> — get event details
- POST /organizer/event/<event_id>/deadline — update deadline
- GET /organizer/<event_id>/participants — list registrations
- GET /organizer/<event_id>/teams — list teams
- GET /organizer/<event_id>/analytics — simple counts
- GET /organizer/<event_id>/export — download participants CSV
- GET /organizer/<event_id>/ai_roadmap — generate AI roadmap for event type
- GET /organizer/<event_id>/submitted_teams — list submitted teams
- GET /organizer/submitted-teams — list submitted teams (optional eventId query)

Participant
- GET /participant/events — list events
- POST /participant/register — register as individual
- POST /participant/register_hackathon — create/join/ai_match team (body includes action)
- GET /participant/teams/<event_id> — list teams for an event
- POST /participant/team/<team_id>/submit — submit team (requires verification fields)
- GET /participant/team/<team_id>/status — team submission status
- POST /participant/ai_match_request — request to join a team via AI match
- GET /participant/team/<team_id>/requests — list pending join requests
- POST /participant/request/<request_id>/accept — accept join request
- POST /participant/request/<request_id>/reject — reject join request

Collaboration
- GET/POST /collaboration/chat/<team_id> — team chat
- GET/POST /collaboration/poll/<team_id> — create/list polls
- POST /collaboration/vote/<poll_id> — vote on poll
- GET/POST/DELETE /collaboration/whiteboard/<team_id> — whiteboard strokes

Virtual events
- GET /virtual/video/<video_name> — serve video files from `frontend/assets/videos`

Notes:
- Many organizer routes are protected by a simple session check (`require_organizer`). In production you'd want a more robust auth/role solution (JWT or proper session store) and CSRF protection.

## Frontend

Static frontend files are in `frontend/`. They are served directly by the Flask app. The frontend is minimal and intended as a demo to interact with the API.

## Development notes

- The app uses MongoDB — make sure your `MONGO_URI` points to a running MongoDB instance.
- Utility modules under `backend/utils/` provide AI features (team matching, roadmaps). They rely on `scikit-learn` and simple heuristics.
- Before deploying, remove or rotate any hard-coded credentials in `backend/config.py`.

## Tests

No automated tests are included in this scaffold. Adding unit tests for route behaviors and utils is recommended.

## License

This project is provided as-is for demo/learning purposes. Add a license file if you intend to open source it.




