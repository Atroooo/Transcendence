from tournament.models import Player
from asgiref.sync import sync_to_async
from django.core.serializers import serialize

@sync_to_async
def check_if_user_in_match(self, event):
    tourmament = event['tournament']
    first_user = event['first_user']
    second_user = event['second_user']
    user = self.scope['user']
    try:
        player = Player.objects.get(user=user)
    except Player.DoesNotExist:
        return False
    if player.tournament is not tourmament:
        return False
    if player.pseudo is first_user or player.pseudo is second_user:
        return True
    return False