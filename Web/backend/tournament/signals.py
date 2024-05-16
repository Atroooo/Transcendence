from django.db.models.signals import post_save, pre_delete, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Bracket, Tournament, Player
from game.models import Match
from tournament.models import TournamentBrackets
from django.core.serializers import serialize
import json


# InsideTournamentConsumer
@receiver(post_save, sender=Bracket)
def bracket_updated(sender, instance, **kwargs):
	channel_layer = get_channel_layer()
	if instance.tournament == None:
		return
	matches = instance.match_list.all() # Get the queryset of matches
	serialized_match_list = serialize('json', matches)
	async_to_sync(channel_layer.group_send)(
		f'tournament_room_{instance.tournament.tournament_name}',
		{
			'type': 'update_bracket',
			'match_list': serialized_match_list,
		}
	)

@receiver(post_save, sender=Match)
def score_updated(sender, instance, **kwargs):
	channel_layer = get_channel_layer()
	if instance.tournament == None:
		return
	first_user_username = instance.first_user.username if instance.first_user else ""
	second_user_username = instance.second_user.username if instance.second_user else ""
	async_to_sync(channel_layer.group_send)(
        f'tournament_room_{instance.tournament.tournament_name}',
		{
			'type': 'update_score',
			'tournament': instance.tournament.tournament_name,
			'first_user': first_user_username,
			'first_player_point': instance.first_player_point,
			'second_user': second_user_username,
			'second_player_point': instance.second_player_point,
		}
	)

from django.utils.encoding import force_str
from django.core.serializers import serialize

@receiver(post_save, sender=Match)
def game_ready_to_join(sender, instance, created,**kwargs):
	if not created or not instance.tournament:
		return
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
        f'tournament_room_{instance.tournament.tournament_name}',
		{
			'type': 'game_ready_to_join',
			'tournament': instance.tournament.tournament_name,
			'first_user': instance.first_player_point,
			'second_user': instance.second_player_point,
			'id': force_str(instance.id),
		}
	)

# @receiver(post_save, sender=Match)
# def bracket_finished(sender, instance, created,**kwargs):
# 	if created or not instance.tournament:
# 		return
# 	channel_layer = get_channel_layer()
# 	async_to_sync(channel_layer.group_send)(
#         f'tournament_room_{instance.tournament.tournament_name}',
# 		{
# 			'type': 'round_finished',
# 			'tournament_name': instance.tournament.tournament_name,
# 			'first_user': instance.first_player_point,
# 			'second_user': instance.second_player_point,
# 			'id': force_str(instance.id),
# 		}
# 	)

@receiver(post_save, sender=Tournament)
def notify_tournament_status_changed(sender, instance, **kwargs):
    if instance.status == 'In progress' or instance.status == 'Finished':
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
        f'tournament_room_{instance.tournament_name}',
            {
                'type': 'tournament_status_changed',
                'new_status': instance.status,
            }
        )


@receiver(pre_delete, sender=Tournament)
def tournament_deleted(sender, instance, **kwargs):
	channel_layer = get_channel_layer()

	async_to_sync(channel_layer.group_send)(
		f'tournament_room_{instance.tournament_name}',
		{
			'type': 'tournament_deleted',
			'tournament_name': instance.tournament_name,
		}
	)

@receiver(post_save, sender=Tournament)
def get_tournament_creation(sender, instance, created, **kwargs):
    if not created:
        return
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        'get_tournaments',
        {
            'type': 'get_tournaments_creation',
            'tournament_name': instance.tournament_name,
            'number_max_of_players': instance.number_max_of_players,
            'number_points_to_win': instance.number_points_to_win,
            'number_set_to_win': instance.number_set_to_win,
        }
    )

@receiver(pre_delete, sender=Tournament)
def get_tournament_deletion(sender, instance, **kwargs):
	channel_layer = get_channel_layer()

	async_to_sync(channel_layer.group_send)(
		'get_tournaments',
		{
			'type': 'get_tournaments_deletion',
			'tournament_name': instance.tournament_name,
		}
	)

# @receiver([post_delete, post_save], sender=Player)
# def number_of_player_in_tournament(sender, instance, **kwargs):
# 	channel_layer = get_channel_layer()

# 	player_number = instance.tournament.player_set.count()
# 	async_to_sync(channel_layer.group_send)(
# 		'get_tournaments',
# 		{
# 			'type': 'number_of_player',
# 			'player_number': player_number,
# 			'number_max_of_players': instance.tournament.number_max_of_players,
# 			'tournament_name': instance.tournament.tournament_name,
# 		}
# 	)


@receiver([post_save, post_delete], sender=Player)
def players_in_tournament(sender, instance, **kwargs):
    if instance.tournament:
        channel_layer = get_channel_layer()
        players = instance.tournament.player_set.all()
        serialized_players = [serialize('json', [player]) for player in players]
        async_to_sync(channel_layer.group_send)(
            f'waiting_room_{instance.tournament.tournament_name}',
            {
                'type': 'get_players_in_tournament',
                'number_max_of_players': instance.tournament.number_max_of_players,
                'players': serialized_players,
            }
        )
    else:
        pass
