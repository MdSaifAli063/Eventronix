from flask import Blueprint, send_file, abort
import os

virtual_bp = Blueprint('virtual', __name__)

# Path to your video files (ensure folder exists)
VIDEO_FOLDER = os.path.join(os.getcwd(), "frontend/assets/videos")

@virtual_bp.route("/virtual/video/<video_name>")
def serve_video(video_name):
    video_path = os.path.join(VIDEO_FOLDER, video_name)
    if os.path.exists(video_path):
        return send_file(video_path, mimetype="video/mp4")
    else:
        abort(404, description="Video not found")
