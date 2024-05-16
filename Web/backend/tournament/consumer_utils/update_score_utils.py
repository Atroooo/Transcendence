from asgiref.sync import sync_to_async
from tournament.models import Player

@sync_to_async
def check_if_match_in_tournament(self, event):
    try:
        tourmament = event['tournament']
    except:
        return False
    user = self.scope['user']
    try:
        player = Player.objects.get(user=user)
    except Player.DoesNotExist:
        return False
    if tourmament == player.tournament.tournament_name:
        return True
    return False