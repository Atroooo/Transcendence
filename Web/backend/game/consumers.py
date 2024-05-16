# game/consumers.py
import json
import time

from channels.generic.websocket import AsyncWebsocketConsumer
from collections import defaultdict

from .consumer_utils.join_room_utils import joinRoom
from .consumer_utils.score_utils import sendScore
from .consumer_utils.ball_position_utils import getBallPosition
from .consumer_utils.player_move_utils import playerMove
from .consumer_utils.utils import sendError, checkIfUserStillConnected, findRoomName, leavingGame, checkFields
from .consumer_utils.custom_utils import startGame, handleMissingOpponent
from tournament.models import Player

from collections import defaultdict
from authentification.models import User

class MatchmakingConsumers(AsyncWebsocketConsumer):
    roomList = defaultdict(list)
    roomConnectionCounts = defaultdict(lambda: 0)
    roomConnectedUsers = defaultdict(set)
    roomGame = defaultdict(set)
    roomScores = defaultdict(set)
    gameModel = defaultdict(set)
    
    async def connect(self):
        await self.channel_layer.group_add("lobby", self.channel_name)
        self.roomConnectionCounts["lobby"] += 1
        self.room_group_name = None
        self.username = None
        await self.accept()

    async def disconnect(self, code):
        self.room_group_name = await findRoomName(self)
        if (self.room_group_name is not None):
            if (self.roomConnectionCounts[self.room_group_name] > 0):
                self.roomConnectionCounts[self.room_group_name] -= 1
            self.roomConnectedUsers[self.room_group_name].clear()
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        
        if (checkFields(text_data_json) == True):
            dataType = text_data_json["type"]
            self.username = text_data_json['username']
        else:
            print("Error: Missing fields")
            return   
    
        if (dataType == "join_room"):
            await joinRoom(self)        
        
        else:
            self.room_group_name = await findRoomName(self)        
            if (self.room_group_name is not None):
                if (await checkIfUserStillConnected(self) == True):
                    if (dataType == "player_move"):
                        await playerMove(self, text_data_json)
                    
                    if (dataType == "get_ball_position"):
                        await getBallPosition(self)
                    
                    if (dataType == "score"):
                        await sendScore(self)
                    
                    if (dataType == "leaving"):
                        await leavingGame(self)
                        
                        
        
    async def user_list(self, event):
        type = "user_list"
        users = event["message"]
        room_name = event["room_name"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "message": users, "room_name": room_name}))
        except:
            print("Error: User already disconnected")
        
    async def player_move(self, event):
        type = "player_move"
        message = event["message"]
        username = event["username"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "message": message, "username": username}))
        except:
            print("Error: User already disconnected")
    
    async def player_moveAPI(self, event):
        type = "player_moveAPI"
        message = event["message"]
        nb = event["nb"]
        username = event["username"]

        try:
            await self.send(text_data=json.dumps({"type": type, "message": message, "nb": nb ,"username": username}))
        except:
            print("Error: User already disconnected")


    async def get_ball_position(self, event):
        type = "get_ball_position"
        x = event["x"]
        y = event["y"]
        username = event["username"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "x": x, "y": y, "username": username}))
        except:
            print("Error: User already disconnected")
        
    async def score(self, event):
        type = "score"
        scoreP1 = event["scoreP1"]
        scoreP2 = event["scoreP2"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "scoreP1": scoreP1, "scoreP2": scoreP2}))
        except:
            print("Error: User already disconnected")
        
    async def game_over(self, event):
        type = "game_over"
        scoreP1 = event["scoreP1"]
        scoreP2 = event["scoreP2"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "scoreP1": scoreP1, "scoreP2": scoreP2}))
        except:
            print("Error: User already disconnected")

    async def reset(self, event):
        type = "reset"

        try:
            await self.send(text_data=json.dumps({"type": type}))
        except:
            print("Error: User already disconnected")
        
    async def error(self, event):
        type = "error"
        message = event["message"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "message": message}))
        except:
            print("Error: User already disconnected")

        
class CustomGameConsumers(AsyncWebsocketConsumer):
    roomList = defaultdict(list)
    roomConnectionCounts = defaultdict(lambda: 0)
    roomConnectedUsers = defaultdict(set)
    roomGame = defaultdict(set)
    roomScores = defaultdict(set)
    gameModel = defaultdict(set)
    
    
    async def connect(self):
        self.room_group_name = self.scope['url_route']['kwargs']['room_name']
        self.roomList[self.room_group_name].append(self.room_group_name)
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        
    async def disconnect(self, code):
        self.room_group_name = await findRoomName(self)
        if (self.room_group_name is not None):
            if (self.roomConnectionCounts[self.room_group_name] > 0):
                self.roomConnectionCounts[self.room_group_name] -= 1
            self.roomConnectedUsers[self.room_group_name].clear()
            user = self.scope["user"]
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        if (checkFields(text_data_json) == True):
            dataType = text_data_json["type"]
            self.username = text_data_json['username']
        else:
            print("Error: Missing fields")
            return
        
        if (dataType == "start_game"):
            await startGame(self)        
        
        elif (dataType == "missing_opponent"):
            await handleMissingOpponent(self)

        else:
            self.room_group_name = await findRoomName(self)
            if (self.room_group_name is not None):
                if (await checkIfUserStillConnected(self) == True):

                    if (dataType == "player_move"):
                        await playerMove(self, text_data_json)
                    
                    if (dataType == "get_ball_position"):
                        await getBallPosition(self)
                    
                    if (dataType == "score"):
                        await sendScore(self)
                    
                    if (dataType == "leaving"):
                        await leavingGame(self)

        
        
    async def user_list(self, event):
        type = "user_list"
        users = event["message"]
        pseudo = event["pseudo"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "message": users, "pseudo": pseudo}))
        except:
            print("Error: User already disconnected")
        
    async def player_move(self, event):
        type = "player_move"
        message = event["message"]
        username = event["username"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "message": message, "username": username}))
        except:
            print("Error: User already disconnected")
    
    async def get_ball_position(self, event):
        type = "get_ball_position"
        x = event["x"]
        y = event["y"]
        username = event["username"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "x": x, "y": y, "username": username}))
        except:
            print("Error: User already disconnected")
        
    async def score(self, event):
        type = "score"
        scoreP1 = event["scoreP1"]
        scoreP2 = event["scoreP2"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "scoreP1": scoreP1, "scoreP2": scoreP2}))
        except:
            print("Error: User already disconnected")
        
    async def game_over(self, event):
        type = "game_over"
        scoreP1 = event["scoreP1"]
        scoreP2 = event["scoreP2"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "scoreP1": scoreP1, "scoreP2": scoreP2}))
        except:
            print("Error: User already disconnected")

    async def reset(self, event):
        type = "reset"

        try:
            await self.send(text_data=json.dumps({"type": type}))
        except:
            print("Error: User already disconnected")
        
    async def error(self, event):
        type = "error"
        message = event["message"]
        
        try:
            await self.send(text_data=json.dumps({"type": type, "message": message}))
        except:
            print("Error: User already disconnected")

    async def error_too_much_player(self, event):
        type = "error_too_much_player"
        message = event['message']

        try:
            await self.send(text_data=json.dumps({"type": type, "message": message}))
        except:
            print("Error: User already disconnected")