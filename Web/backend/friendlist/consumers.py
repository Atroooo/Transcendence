from channels.generic.websocket import AsyncWebsocketConsumer
from collections import defaultdict
import json

def checkFields(data):
    return 'type' in data

users = {}
class ConnectedListConsumer(AsyncWebsocketConsumer):
    roomConnectedUsers = defaultdict(set)
    
    async def connect(self):
        self.user = self.scope['user']
        self.group_name = 'connected_list'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        await self.notify_connected()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        if (checkFields(text_data_json)):
            type = text_data_json["type"]
        else:
            return

        if (type == "connected"):
            self.username = self.scope['user'].username
            await self.join()
        elif type == "check_connected":
            friend_tab = text_data_json.get("friendTab")
            if friend_tab:
                await self.check_friends(friend_tab)
            else:
                print("FriendTab object not found in the message")
        if (type == "remove_friend"):
            await self.remove_friend(text_data_json["friend_name"])

    async def join(self):
      await self.channel_layer.group_add("connected", self.channel_name)
      self.roomConnectedUsers["connected"].add(self.username)

    async def check_friends(self, friend_tab):
        friends = friend_tab.get('friends', [])

        connected_friends = []
        for friend in friends:
            friend_info = {
                'id': friend.get('id', None),
                'username': friend.get('username', ''),
                'email': friend.get('email', ''),
                'profile_picture': friend.get('profile_picture', ''),
            }
            friend_name = friend_info['username']
            if friend_name and friend_name in self.roomConnectedUsers["connected"]:
                friend_info['is_connected'] = True
            else:
                friend_info['is_connected'] = False

            connected_friends.append(friend_info)

            try :
                await self.send(text_data=json.dumps({
                'type': "check",
                'friends_info': connected_friends
            }))
            except:
                print("User already disconnected")
                
    async def remove_friend(self, friend_name):
        for player in self.roomConnectedUsers["connected"]:
            if friend_name == player:
                await self.channel_layer.send(
                player,
                {
                    'type': 'remove_friend',
                    'friend_name': self.user.username,
                },
            )
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        await self.notify_disconnected()

    async def notify_connected(self):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'user_status_update',
                'username': self.user.username,
                'is_connected': True
            }
        )

    async def notify_disconnected(self):
        if self.user.username in self.roomConnectedUsers["connected"]:
            self.roomConnectedUsers["connected"].remove(self.user.username)

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'user_status_update',
                'username': self.user.username,
                'is_connected': False
            }
        )

    async def user_status_update(self, event):
        sender_username = event['username']
        if sender_username != self.user.username:
            friend_name = event['username']
            is_connected = event['is_connected']
            try :
                await self.send(text_data=json.dumps({
                'type': "user_status_update",
                'friend_name': friend_name,
                'is_connected': is_connected
                }))
            except:
                print("User already disconnected")

