from game import models
from tournament.models import Bracket, TournamentBrackets
from django.forms.models import model_to_dict
from .next_bracket_utils import convert_matchs_to_dict
from django.core import serializers

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


def create_every_match_for_bracket(tournament, players):
	match_list = []
	length = len(players)
	start = 0
	if length % 2 == 1:
		start = 1

	if start == 1 and length > 3 and ((length - 1) / 2 ) % 2 != 1: 
		start = 3
	odd_players = get_odd_players(players, start)
	bracket = create_tournament_bracket(tournament, odd_players)
	for i in range(start, length, 2):
		first_user = players[i].user
		second_user = players[i + 1].user
		first_pseudo = players[i].pseudo
		second_pseudo = players[i + 1].pseudo
		match = create_match_for_bracket(tournament, first_user, second_user, bracket,first_pseudo,second_pseudo)
		match_list.append(match)
	bracket.save()
	return convert_matchs_to_dict(match_list)