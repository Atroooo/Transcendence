from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

from game.models import Match, hittingZone, scoreTime

from game.pong import Game
from .utils import sendError


async def joinRoom(self):
        if not self.roomList:
            room = "room"
            self.roomList[room].append(room)
    
        
        await self.channel_layer.group_discard("lobby", self.channel_name)
        self.roomConnectionCounts["lobby"] -= 1
        
        if (await checkIfAlreadyConnected(self) == False):
            return

        hasJoined = await joinRoomIfNotFull(self)
        
        if (hasJoined == False):
            hasJoined = await createRoom(self)
        
    
    
async def joinRoomIfNotFull(self):
    hasJoined = False
    for room in self.roomList:
        if (self.roomConnectionCounts[room] < 0):
            self.roomConnectionCounts[room] = 0

        if self.roomConnectionCounts[room] < 2:
            await self.channel_layer.group_add(room, self.channel_name)
            self.roomConnectionCounts[room] += 1
            self.roomConnectedUsers[room].add(self.username)
            self.room_group_name = room
            hasJoined = True
            
            if (self.roomConnectionCounts[room] == 2):
                await startGame(self, room)
            break
    return hasJoined
    
    
async def createRoom(self):
    newRoom = "room" + str(len(self.roomList))
    self.roomList[newRoom].append(newRoom)
    await self.channel_layer.group_add(newRoom, self.channel_name)
    self.roomConnectionCounts[newRoom] += 1
    self.roomConnectedUsers[newRoom].add(self.username)
    
    self.room_group_name = newRoom
    return True
    
    
async def checkIfAlreadyConnected(self):
    for room in self.roomList:
        connectedUsers = list(self.roomConnectedUsers[room])
        if (len(connectedUsers) == 1):
            if (self.username == connectedUsers[0]):
                self.room_group_name = room
                await sendError(self, "One of the users already connected to an other game.")
                await deleteModel(self)
                return False
        elif (len(connectedUsers) == 2):
            if (self.username == connectedUsers[0] or self.username == connectedUsers[1]):
                self.room_group_name = room
                await sendError(self, "One of the users already connected to an other game.")
                await deleteModel(self)
                return False
    return True


@sync_to_async
def deleteModel(self):
    if (type(self.gameModel[self.room_group_name]) != type(set())):
        if (self.gameModel[self.room_group_name] is not None):
            self.gameModel[self.room_group_name].delete()


async def startGame(self, room):
    if (len(self.roomConnectedUsers[room]) < 2 or self.roomConnectionCounts[room] < 2):
        await sendError(self, "Opponent as left the room.")
        return
    
    connected_users = list(self.roomConnectedUsers[room])
    if (len(connected_users) == 2):
        user1, user2 = await getUser(self, connected_users)
    else:
        await sendError(self, "Opponent as left the room.")
        return

    self.roomGame[self.room_group_name] = Game()
    self.roomScores[self.room_group_name] = [0, 0]
    self.gameModel[self.room_group_name] = await createMatch(user1, user2)
    user_data = await getUserData(self, connected_users)
    
    try:
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "user_list", "message": user_data, "room_name":self.room_group_name})
    except:
        print("User already disconnected")
    
    
@sync_to_async
def getUser(self, connected_users):
    return (User.objects.get(username=connected_users[0]), User.objects.get(username=connected_users[1]))


@sync_to_async
def createMatch(user1, user2):
    match = Match.objects.create(first_user= user1, second_user= user2)
    return match

@sync_to_async
def getUserData(self, usernames):
    users_with_profile_pics = []

    for username in usernames:
        try:
            user = User.objects.get(username=username)
            profile = (lambda: user.profile)()
            profile_pic_url = profile.profile_picture.url
            users_with_profile_pics.append({
                'username': username,
                'profile_pic_url': profile_pic_url
            })
        except User.DoesNotExist:
            print(f"User '{username}' not found")
    
    return users_with_profile_pics
                