
# backend/utils/ai_roadmap.py
def generate_roadmap(event_type=None):
    roadmap = {
        "hackathon": [
            "Define theme and problem statements",
            "Announce event & open registrations",
            "Form teams & kickoff",
            "Development sprint (48-72 hours)",
            "Submit projects & demos",
            "Judging & awards"
        ],
        "webinar": [
            "Decide topic and speaker",
            "Set date & platform (Zoom/YT)",
            "Create landing + registration",
            "Host webinar & Q/A",
            "Collect feedback"
        ],
        "conference": [
            "Call for papers / talks",
            "Schedule tracks and sessions",
            "Logistics & sponsors",
            "Host conference",
            "Post-conference follow-up"
        ],
        "workshop": [
            "Prepare curriculum & materials",
            "Open registrations (limited seats)",
            "Conduct hands-on sessions",
            "Collect practice submissions",
            "Feedback and certificates"
        ]
    }
    if event_type:
        return roadmap.get(event_type.lower(), ["General planning", "Prepare content", "Run event", "Feedback"])
    # default combined roadmap
    combined = []
    for k, steps in roadmap.items():
        combined.append(f"--- {k.capitalize()} ---")
        combined.extend(steps)
    return combined
