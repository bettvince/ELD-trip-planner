from datetime import datetime, timedelta
import pytz

TIMEZONE = pytz.timezone("America/Chicago")

"""
hos_utils.py
-------------
This module contains reusable Hours-of-Service (HOS) logic for
property-carrying drivers under FMCSA 70hr/8day rules.
"""

def local_time(dt):
    """Ensure all datetimes are localized to the defined timezone."""
    if dt.tzinfo is None:
        return TIMEZONE.localize(dt)
    return dt.astimezone(TIMEZONE)


def add_segment(segments, start, duration_hours, status, place, note):
    """Helper to build a timeline segment."""
    end = start + timedelta(hours=duration_hours)
    segments.append({
        "status": status,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "place": place,
        "note": note,
    })
    return end


def generate_daily_log(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    start_time: datetime,
    total_distance_miles: float,
):
    """
    Generate a one-day ELD-style duty log with realistic driving & rest patterns.
    Simplified FMCSA property-carrying driver logic:
        - 11 hours max driving in 14-hour window
        - 30-min break after 8 hours
        - 10-hour minimum off-duty reset
    """

    start_time = local_time(start_time)
    segments = []
    t = start_time

    # --- Pre-trip ---
    t = add_segment(segments, t, 0.5, "ON_DUTY", current_location, "Pre-trip inspection")

    # --- Driving to pickup ---
    t = add_segment(segments, t, 2, "DRIVING", "En route", "Drive to pickup")

    # --- Pickup ---
    t = add_segment(segments, t, 1, "ON_DUTY", pickup_location, "Loading freight")

    # --- Long driving stretch ---
    t = add_segment(segments, t, 4.5, "DRIVING", "Highway", "Long haul toward dropoff")

    # --- Mandatory 30-min break ---
    t = add_segment(segments, t, 0.5, "OFF", "Rest stop", "30-minute break")

    # --- Final driving segment ---
    t = add_segment(segments, t, 3, "DRIVING", "Highway", "Final drive to destination")

    # --- Dropoff & unloading ---
    t = add_segment(segments, t, 1, "ON_DUTY", dropoff_location, "Unloading freight")

    # --- 10-hour sleeper reset ---
    t = add_segment(segments, t, 10, "OFF", dropoff_location, "End of day rest")

    total_hours = sum(
        (datetime.fromisoformat(s["end"]) - datetime.fromisoformat(s["start"]))
        .total_seconds() / 3600
        for s in segments
    )

    # Return structure used by frontend
    return {
        "segments": segments,
        "summary": {
            "total_hours": round(total_hours, 2),
            "total_miles": round(total_distance_miles, 1),
            "start": start_time.isoformat(),
            "end": t.isoformat(),
        },
    }
