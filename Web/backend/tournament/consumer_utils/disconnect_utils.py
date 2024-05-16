from asgiref.sync import sync_to_async
from tournament.models import Player
from django.contrib.auth.models import User

@sync_to_async
def if_last_player_end_tournament(self):
    user = self.scope['user']
    if user.is_anonymous:
        return
    try:
        player = Player.objects.get(user=user)
    except Player.DoesNotExist:
        return
    tournament = player.tournament
    if tournament.status != "In progress":
        return
    try:
        players = Player.objects.filter(tournament=tournament)
    except Player.DoesNotExist:
        return
    if len(players) == 0:
        tournament.status = "Finished"
        return 
    return


@sync_to_async
def delete_player(username):
    try:
        user = User.objects.get(username=username)
    except:
        print("Can't get user")
        return 
    try:
        player = Player.objects.get(user=user)
    except:
        print("Can't get player")
        return 

    tournament = player.tournament
    try:
        players = Player.objects.filter(tournament=tournament)
    except:
        print("Can't get player list")
        return
    
    player.delete()
    if len(players) == 1:
        tournament.delete()
    return