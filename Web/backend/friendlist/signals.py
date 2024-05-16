from django.db.models.signals import post_save, pre_delete, post_delete
from game.models import Match
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.dispatch import receiver

@receiver(post_save, sender=Match)
def status_in_game(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    if not created:
        async_to_sync(channel_layer.group_send)(
        'connected_list',
        {
            'type': 'notify_game_finished',
            'first_player': instance.first_player,
            'second_player': instance.second_player,
        }
    )
    async_to_sync(channel_layer.group_send)(
        'connected_list',
        {
            'type': 'notify_in_game',
            'first_player': instance.first_player,
            'second_player': instance.second_player,
        }
    )