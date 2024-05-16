from tournament import models
from django.contrib.auth.models import User

def check_if_wrong_data_leave_tournament(data):
    try:
        user = User.objects.get(username=data.get("username"))
    except User.DoesNotExist:
        return "User does not exist"
    try:
        tournament = models.Tournament.objects.get(tournament_name=data.get("tournament_name"))
    except models.Tournament.DoesNotExist:
        return "Tournament does not exist"
    try:
        player = models.Player.objects.get(user=user, tournament=tournament)
    except models.Player.DoesNotExist:
        return "User is not in the tournament"
    player.delete()
    players = models.Player.objects.filter(tournament=tournament)
    if len(players) == 0:
        tournament.delete()
    return None
