import json
from asgiref.sync import sync_to_async
from tournament.models import Player
from django.core.serializers import deserialize

@sync_to_async
def get_players_in_tournament(players):
    player_list = []
    for player in players:
        player_dict = json.loads(player)
        pseudo = player_dict[0]["fields"]["pseudo"]
        deserialized_player = list(deserialize('json', player))
        profile_picture = None
        try:
            user_object = deserialized_player[0].object.user
        except Exception as e:
            print("Error fetching user object:", e)
            continue
        if user_object.profile.profile_picture:
            profile_picture = user_object.profile.profile_picture.url
        player_list.append({
            'pseudo': pseudo,
            'profile_picture': profile_picture,
        })
    return json.dumps({'player_list': player_list})

