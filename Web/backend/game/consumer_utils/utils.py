from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

from .score_utils import sendScore
from tournament.models import Player

async def findRoomName(self):
    for room in self.roomList:
        if self.roomConnectionCounts[room] == 2:
            connected_users = list(self.roomConnectedUsers[room])
            if (len(self.roomConnectedUsers[room]) < 2):
                self.room_group_name = room
                await sendError(self, "Opponent has left the room.")
                return None
            if (len(connected_users) == 2):
                if (self.username == connected_users[0] or self.username == connected_users[1]):
                    return room
    await sendError(self, "Opponent has left the room.")
    return None


async def checkIfUserStillConnected(self):
    if (self.roomConnectionCounts[self.room_group_name] == 2):
        return True
    handleError(self)
    return False


async def sendError(self, message):
    if (self.room_group_name is not None):
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        handleError(self)
        
        try:
            await self.channel_layer.group_send(self.room_group_name, {"type":"error", "message":message})
        except:
            print("User already disconnected")
    

def handleError(self):
    if (self.room_group_name is not None):
        self.roomConnectedUsers[self.room_group_name].clear()
        self.roomConnectionCounts[self.room_group_name] = 0
        

async def leavingGame(self):
    username1, username2 = await getUsernames(self)
    if (self.username == username1):
        self.roomGame[self.room_group_name].setWinningScore("p2")
        await deletePlayer(self, self.username)
    elif (self.username == username2):
        self.roomGame[self.room_group_name].setWinningScore("p1")
        await deletePlayer(self, self.username)
    else:
        print("Error")
        return
    await sendScore(self)


@sync_to_async
def getUsernames(self):
    return self.gameModel[self.room_group_name].first_user.username, self.gameModel[self.room_group_name].second_user.username


def checkFields(data):
    return 'type' in data and 'username' in data


@sync_to_async
def deletePlayer(self, username):
    try:
        user = User.objects.get(username=username)
    except:
        print("Can't get user")
        return 
    try:
        player = Player.objects.get(user=user)
    except:
        print("Can't get player")
        return 
    player.delete()