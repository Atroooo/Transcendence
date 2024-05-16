import tournament.models as models
from django.contrib.auth.hashers import make_password
import re


def set_tournament_in_db(tournament_name, number_max_of_players):
    password="secret"
    number_points_to_win=10
    number_set_to_win=2
    tournament = models.Tournament.objects.create(
        tournament_name=tournament_name,
        number_max_of_players=number_max_of_players,
        password=password,
        number_points_to_win=number_points_to_win,
        number_set_to_win=number_set_to_win
    )
    tournament.save()
    return tournament

def set_the_creator_in_tournament(tournament, user, pseudo):
    player = models.Player.objects.create(
        pseudo=pseudo,
        user=user,
        tournament=tournament,
        is_admin=True
    )
    player.save()


def is_valid(string):
    pattern = r'^[a-zA-Z0-9\-_\.]+$'
    return bool(re.match(pattern, string))

def check_if_wrong_data_create_tournament(tournament_name, \
                                          number_max_of_players, pseudo):
    if tournament_name is None or tournament_name == "":
        return "Missing or empty tournament name"
    if not is_valid(tournament_name):
        return "Invalid tournament name"
    if (len(tournament_name) > 15):
        return "Invalid tournament name"
    if not is_valid(pseudo):
        return "Invalid pseudo"
    if (len(pseudo) > 15):
        return "Invalid pseudo"
    if int(number_max_of_players) not in [4, 8, 16]:
        return "Invalid number of players"
    try:
        models.Tournament.objects.get(tournament_name=tournament_name)
        return "Tournament name already exist"
    except models.Tournament.DoesNotExist:
        return None
