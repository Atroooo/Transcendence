from django.contrib.auth.models import User
from tournament import models
from django.contrib.auth.hashers import check_password
from tournament.viewsUtils.create_tournament_utils import is_valid
def create_tournament_player(pseudo, user, tournament):

    models.Player.objects.create(
          pseudo = pseudo,
          user = user,
          tournament = tournament
    )

def check_if_user_already_in_the_tournament(tournament, user):
    try:
        models.Player.objects.get(tournament=tournament, user=user)
        return True
    except models.Player.DoesNotExist:
        return False

def check_if_user_already_in_another_tournament(user):
    try:
        models.Player.objects.get(user=user)
        return True
    except models.Player.DoesNotExist:
        return False

def check_if_tournament_not_exist(tournament_name):
    try:
        tournament = models.Tournament.objects.get(tournament_name=tournament_name)
        return tournament
    except models.Tournament.DoesNotExist:
        return None

def check_if_tournament_is_full(tournament):
    number_player = models.Player.objects.filter(tournament=tournament)
    if number_player.count() >= tournament.number_max_of_players:
        return True
    return False

def check_if_pseudo_is_already_taken(tournament, pseudo):
    try:
        models.Player.objects.get(tournament=tournament, pseudo=pseudo)
        return True
    except models.Player.DoesNotExist:
        return False

def check_if_wrong_data_join_tournament(tournament_name, pseudo, user):
    if tournament_name is None or tournament_name == "":
            return "Missing or empty tournament name"  
    if (len(tournament_name) > 15):
        return "Tournament name too long"
    tournament = check_if_tournament_not_exist(tournament_name)
    if tournament is None:
        return "Tournament does not exist"
    if tournament.status != "Waiting room":
        return "Tournament is already started"
    if check_if_user_already_in_the_tournament(tournament, user):
        return "User is already in the tournament"
    if check_if_user_already_in_another_tournament(user):
        return "User is already in another tournament"
    if not is_valid(pseudo):
        return "Invalid pseudo"
    if (len(pseudo) > 15):
        return "Invalid pseudo"
    if check_if_pseudo_is_already_taken(tournament, pseudo):
        return "Pseudo is already taken"
    if check_if_tournament_is_full(tournament):
        return "Tournament is full"
        
    create_tournament_player(pseudo, user, tournament)
    return None