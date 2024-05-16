import json
from channels.generic.websocket import AsyncWebsocketConsumer
from authentification.models import Profile
from asgiref.sync import sync_to_async
from django.core.serializers import serialize
import json
from tournament.consumer_utils.disconnect_utils import delete_player, if_last_player_end_tournament

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'public_room'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # await delete_player(self)
        # await if_last_player_end_tournament(self)
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def send_notification(self, event):
        notification_message = event['message']
        profile = event['profile']

        get_user_profile = sync_to_async(lambda: self.scope['user'].profile)
        user_profile = await get_user_profile()

        serialized_user = serialize('json', [user_profile])
        serialized_user_data = json.loads(serialized_user)[0]['fields']
        
        if profile and serialized_user_data:
            if serialized_user_data == profile:
                try:
                    await self.send(text_data=json.dumps({'message': notification_message}))
                except:
                    print("User already disconnected")
