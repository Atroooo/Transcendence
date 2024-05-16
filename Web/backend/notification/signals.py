from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from asgiref.sync import sync_to_async
from friendlist.models import FriendList
from .models import Notification
from django.core.serializers import serialize
import json

@receiver(post_save, sender=FriendList)
def friend_request_created_or_updated(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    if kwargs.get('created', False):
        notification_message = f'new friend request'
        profile = instance.to_user
    

    else:
        notification_message = f'friend request sent accepted'
        profile = instance.from_user
    
    serialized_profile = serialize('json', [profile])
    serialized_profile_data = json.loads(serialized_profile)[0]['fields']

    create_notification = sync_to_async(Notification.objects.create)
    create_notification(message=notification_message, profile=profile)
    async_to_sync(channel_layer.group_send)(
        'public_room',
        {
            'type': 'send_notification',
            'message': notification_message,
            'profile': serialized_profile_data,
        }
    )

@receiver(pre_delete, sender=FriendList)
def friend_request_deleted(sender, instance, **kwargs):
    channel_layer = get_channel_layer()
    notification_message = f'friend removed you'
    profile = instance.to_user
    
    serialized_profile = serialize('json', [profile])
    serialized_profile_data = json.loads(serialized_profile)[0]['fields']
    
    create_notification = sync_to_async(Notification.objects.create)
    create_notification(message=notification_message, profile=profile)
    async_to_sync(channel_layer.group_send)(
        'public_room',
        {
            'type': 'send_notification',
            'message': notification_message,
            'profile': serialized_profile_data,
        }
    )
    
    profile = instance.from_user
    serialized_profile = serialize('json', [profile])
    serialized_profile_data = json.loads(serialized_profile)[0]['fields']
    create_notification = sync_to_async(Notification.objects.create)
    create_notification(message=notification_message, profile=profile)
    async_to_sync(channel_layer.group_send)(
        'public_room',
        {
            'type': 'send_notification',
            'message': notification_message,
            'profile': serialized_profile_data,
        }
    )
    