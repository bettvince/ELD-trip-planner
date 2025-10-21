from django.db import models

class Trip(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    current_cycle_hours = models.FloatField(default=0.0)
    route_summary = models.JSONField(null=True, blank=True)
    rosters = models.JSONField(null=True, blank=True)
from django.db import models

# Create your models here.
