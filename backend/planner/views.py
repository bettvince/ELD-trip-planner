from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import pytz
from .hos_utils import generate_daily_log

TIMEZONE = pytz.timezone("America/Chicago")


class PlanTripView(APIView):
    """
    Receives trip data and returns route plan + HOS-compliant log
    """

    def post(self, request):
        try:
            data = request.data
            current_location = data.get("current_location")
            pickup_location = data.get("pickup_location")
            dropoff_location = data.get("dropoff_location")
            start_time_str = data.get("start_time")
            cycle_hours = float(data.get("current_cycle_hours", 0))

            try:
                start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
            except Exception:
                start_time = datetime.now(TIMEZONE)

            # Placeholder route data
            route_legs = [
                {"from": current_location, "to": pickup_location, "miles": 120},
                {"from": pickup_location, "to": dropoff_location, "miles": 350},
            ]
            total_distance = sum(l["miles"] for l in route_legs)

            # Generate log using helper
            log_data = generate_daily_log(
                current_location,
                pickup_location,
                dropoff_location,
                start_time,
                total_distance,
            )

            result = {
                "route_legs": route_legs,
                "segments": log_data["segments"],
                "summary": log_data["summary"],
            }

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
