from tournament.models import Bracket
from django.forms.models import model_to_dict
from game import models
from tournament.models import Bracket, TournamentBrackets


def convert_matchs_to_dict(match_list):
    dict_match_list = []
    for match in match_list:
        dict_match = model_to_dict(match, \
                                fields=['first_user', 'second_user', \
                                        'first_player_point', 'second_player_point', \
                                        'victory_user', 'tournament'])
        dict_match['first_user'] = model_to_dict(match.first_user, fields=['username'])
        dict_match['second_user'] = model_to_dict(match.second_user, fields=['username'])
        dict_match_list.append(dict_match)
    return dict_match_list

def create_tournament_bracket(tournament, odd_players):
	tournament_bracket = TournamentBrackets.objects.create(tournament=tournament)
	bracket = Bracket.objects.create(tournament=tournament)
	tournament_bracket.brackets.add(bracket)
	if odd_players is not None:
		for player in odd_players:
			tournament_bracket.odd_players.add(player)
			bracket.odd_players.add(player)
	tournament_bracket.save()
	return bracket

def create_match_for_bracket(tournament, first_user, second_user, bracket, first_pseudo, second_pseudo):
	match = models.Match.objects.create(first_user=first_user, second_user=second_user, tournament=tournament, first_pseudo=first_pseudo, second_pseudo=second_pseudo)
	match.save()
	bracket.match_list.add(match)
	return match

def get_odd_players(players, len):
	if len == 0:
		return None
	odd_players = []
	for i in range(0, len):
		user = players[i].user
		odd_players.append(user)
	return odd_players


def generate_next_round_bracket(matchs, tournament_bracket, tournament, players):
    match_list = []
    length = len(players)
    if length == 1:
        return None
    bracket = Bracket.objects.create(tournament=tournament)
    for i in range(0, length, 2):
        first_user = players[i].user
        second_user = players[i + 1].user
        first_pseudo = players[i].pseudo
        second_pseudo = players[i + 1].pseudo
        match = create_match_for_bracket(tournament, first_user, second_user, bracket,first_pseudo,second_pseudo)
        match_list.append(match)
    bracket.match_list.set(match_list)
    tournament_bracket.brackets.add(bracket)
    tournament_bracket.save()
    bracket.save()
    return convert_matchs_to_dict(match_list)
