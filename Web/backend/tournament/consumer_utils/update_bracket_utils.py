import json
from asgiref.sync import sync_to_async
from tournament.models import Player
from django.core.serializers import deserialize



@sync_to_async
def get_matchs(self, event):
	matchs = event['match_list']
	matchs = list(deserialize('json', matchs))
	return matchs

@sync_to_async
def get_odd_player(self, event):
	odd_player = event['odd_players']
	return odd_player

@sync_to_async
def get_playerlist(self, matchs):
	player_list = []
	for match in matchs:
		first_username = match.object.first_user.username
		second_username = match.object.second_user.username
		first_pseudo = match.object.first_pseudo
		second_pseudo = match.object.second_pseudo
		player_list.append({
			'first_username': first_username,
			'second_username': second_username,
			'first_pseudo': first_pseudo,
			'second_pseudo': second_pseudo,
		})
	return player_list

    