from django.db import models
from authentification.models import User
import uuid
import datetime

class Match(models.Model):
    first_user = models.ForeignKey(User, on_delete=models.CASCADE, default=None, related_name='first_player')
    first_player_point = models.IntegerField(default=0)
    first_pseudo = models.CharField(max_length=100, blank=True, null=True, default="default")
    second_user = models.ForeignKey(User, on_delete=models.CASCADE, default=None, related_name='second_player')
    second_player_point = models.IntegerField(default=0)
    second_pseudo = models.CharField(max_length=100, blank=True, null=True, default="default")

    victory_user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    victory_pseudo = models.CharField(max_length=100, blank=True, null=True, default="default")

    date = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    tournament = models.ForeignKey('tournament.Tournament', on_delete=models.CASCADE, blank=True, null=True)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    left_hits = models.IntegerField(default=0)
    right_hits = models.IntegerField(default=0)
    total_hits = models.IntegerField(default=0)
    game_length = models.IntegerField(default=0)
    hitting_zone = models.ManyToManyField("hittingZone")
    score_time_p1 = models.ManyToManyField("scoreTime", related_name='score_time_p1')
    score_time_p2 = models.ManyToManyField("scoreTime", related_name='score_time_p2')
    
class hittingZone(models.Model):
    hittingZone = models.CharField(max_length=100, default='0,0')
    
class scoreTime(models.Model):
    scoreTime = models.CharField(max_length=100, default='0,0')

