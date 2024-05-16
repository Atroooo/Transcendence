from django.db.models import Q
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

from tournament.models import Tournament, Player
from game.models import Match
from .join_room_utils import getUserData

from game.pong import Game

async def startGame(self):
    await self.channel_layer.group_add(self.room_group_name, self.channel_name)
    self.roomConnectionCounts[self.room_group_name] += 1
    self.roomConnectedUsers[self.room_group_name].add(self.username)

    if (self.roomConnectionCounts[self.room_group_name] > 2):
        connected_users = list(self.roomConnectedUsers[self.room_group_name])
        try:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "error_too_much_player", "message": connected_users})
        except:
            print("User already disconnected")

        self.roomConnectionCounts[self.room_group_name] -= 1
        self.roomConnectedUsers[self.room_group_name].remove(self.username)
    
    if (self.roomConnectionCounts[self.room_group_name] == 2):
        connected_users = list(self.roomConnectedUsers[self.room_group_name])
        self.roomList[self.room_group_name].append(self.room_group_name) 
        self.roomGame[self.room_group_name] = Game()
        self.gameModel[self.room_group_name] = await getMatch(self, connected_users)
        self.roomScores[self.room_group_name] = [0, 0]
        pseudo1, pseudo2 = await getPseudo(self)
        pseudoList = []
        pseudoList.append(pseudo1)
        pseudoList.append(pseudo2)

        user_data = await getUserData(self, connected_users)

        try:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "user_list", "message": user_data, "pseudo": pseudoList})
        except:
            print("User already disconnected")
        
@sync_to_async
def getMatch(self, connected_users):
    user1, user2 = User.objects.get(username=connected_users[0]), User.objects.get(username=connected_users[1])
    tournament = Tournament.objects.get(tournament_name=self.room_group_name.split('round')[0])
    try:
        match = Match.objects.get(first_user=user1, second_user=user2, tournament=tournament)
        return match
    except Match.DoesNotExist:
        print("This config doesn't exist")
    try:
        match = Match.objects.get(first_user=user2, second_user=user1, tournament=tournament)
    except Match.DoesNotExist:
        match = Match.objects.create(first_user=user1, second_user=user2, tournament=tournament)

    return match

@sync_to_async
def getPseudo(self):
    pseudo1 = self.gameModel[self.room_group_name].first_pseudo
    pseudo2 = self.gameModel[self.room_group_name].second_pseudo
    return pseudo1, pseudo2

async def handleMissingOpponent(self):
    connected_users = ()
    for room in self.roomList:
        connected_users = list(self.roomConnectedUsers[room])
        if (len(connected_users) == 2):
            if (self.username == connected_users[0] or self.username == connected_users[1]):
                self.room_group_name = room
                break
        elif (len(connected_users) == 1):
            if (self.username == connected_users[0]):
                self.room_group_name = room
                break
    
    if (connected_users[0] is not None):
        user1 = await getUser(connected_users[0])
        tournament = await getTournament(self.room_group_name.split('round')[0])
        matches = await getMatches(user1, tournament)

        for match in matches:
            if match.first_player_point == 0 and match.second_player_point == 0:
                self.gameModel[self.room_group_name] = match
                break

        position = await getPostion(self, user1)
        await setMatchResultMissing(self, user1, position)

        try:
            if (position == 1):
                scoreP1 = 5
                scoreP2 = 0
            else:
                scoreP1 = 0
                scoreP2 = 5
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "game_over", "scoreP1": scoreP1, "scoreP2": scoreP2})
        except:
            print("User already disconnected")


@sync_to_async
def getUser(name):
    try:
        user = User.objects.get(username=name)
    except:
        user = None
    return user

@sync_to_async
def getTournament(name):
    try:
        tournament = Tournament.objects.get(tournament_name=name)
    except:
        tournament = None
    return tournament 

@sync_to_async
def getMatches(user, tournament):
    match1 = []
    match2 = []
    
    try:
        match1 = Match.objects.filter(Q(first_user=user), tournament=tournament)
    except:
        print("No match yet")

    try:
        match2 = Match.objects.fitler(Q(second_user=user), tournament=tournament)
    except:
        print("No match yet")
    return list(match1) + list(match2)

@sync_to_async
def getPostion(self, user):
    if (type(self.gameModel[self.room_group_name]) != type(set())):
        if (self.gameModel[self.room_group_name].first_user == user):
            return 1
        return 2

@sync_to_async
def setMatchResultMissing(self, user, position):
    if (type(self.gameModel[self.room_group_name]) != type(set())):
        if (position == 1):
            self.gameModel[self.room_group_name].first_player_point = 5
            self.gameModel[self.room_group_name].second_player_point = 0
            self.gameModel[self.room_group_name].victory_pseudo = self.gameModel[self.room_group_name].first_pseudo
            deletePlayer(self, self.gameModel[self.room_group_name].second_user)
                
        else:
            self.gameModel[self.room_group_name].first_player_point = 0
            self.gameModel[self.room_group_name].second_player_point = 5
            self.gameModel[self.room_group_name].victory_pseudo = self.gameModel[self.room_group_name].second_pseudo
            deletePlayer(self, self.gameModel[self.room_group_name].first_user)
        
        self.gameModel[self.room_group_name].victory_user = user
        self.gameModel[self.room_group_name].left_hits = 0
        self.gameModel[self.room_group_name].right_hits = 0
        self.gameModel[self.room_group_name].total_hits = 0
        self.gameModel[self.room_group_name].game_length = 0
        self.gameModel[self.room_group_name].save()
        

def deletePlayer(self, user):
    try:
        missingPlayer = Player.objects.get(user=user)
    except Player.DoesNotExist:
            print("Player not found")
            return
    if (missingPlayer is not None):
        missingPlayer.delete()