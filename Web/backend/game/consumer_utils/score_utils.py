from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

from game.models import Match, hittingZone, scoreTime


async def sendScore(self):
    scoreP1, scoreP2 = self.roomGame[self.room_group_name].getScore()
    if (scoreP1 == 5 or scoreP2 == 5):
        try:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "game_over", "scoreP1": scoreP1, "scoreP2": scoreP2})
        except:
            print("User already disconnected")
        
        connected_users = list(self.roomConnectedUsers[self.room_group_name])
        user1, user2 = await getUser(self, connected_users)
        winner = user1 if scoreP1 == 5 else user2
        
        left, right = self.roomGame[self.room_group_name].getNbHit()
        length = self.roomGame[self.room_group_name].getGameLength()
        
        hitting_zone = await createHittingZoneModels(self.roomGame[self.room_group_name].getHittingZone())
        
        scoreTimeP1fromGame, scoreTimeP2fromGame = self.roomGame[self.room_group_name].getScoreTime()
        score_timeP1 = await createScoreTimeModels(scoreTimeP1fromGame)
        score_timeP2 = await createScoreTimeModels(scoreTimeP2fromGame)
        
        await setMatchResult(self, scoreP1, scoreP2, winner, left, right, length, hitting_zone, score_timeP1, score_timeP2)
        await clearRoom(self)
    else:
        try:
            await self.channel_layer.group_send(
                    self.room_group_name, {"type": "score", "scoreP1": scoreP1, "scoreP2": scoreP2})
        except:
            print("User already disconnected")
        
async def clearRoom(self):
    self.roomConnectedUsers[self.room_group_name].clear()
    self.roomConnectionCounts[self.room_group_name] = 0
    self.roomScores[self.room_group_name] = [0, 0]


@sync_to_async
def setMatchResult(self, scoreP1, scoreP2, winner, left, right, length, hitting_zone, score_timeP1, score_timeP2):
    self.gameModel[self.room_group_name].first_player_point = scoreP1
    self.gameModel[self.room_group_name].second_player_point = scoreP2
    self.gameModel[self.room_group_name].victory_user = winner
    if (self.gameModel[self.room_group_name].first_pseudo is not None and self.gameModel[self.room_group_name].second_pseudo is not None):
        self.gameModel[self.room_group_name].victory_pseudo = self.gameModel[self.room_group_name].first_pseudo if winner == self.gameModel[self.room_group_name].first_user else self.gameModel[self.room_group_name].second_pseudo
    self.gameModel[self.room_group_name].left_hits = left
    self.gameModel[self.room_group_name].right_hits = right
    self.gameModel[self.room_group_name].total_hits = left + right
    self.gameModel[self.room_group_name].game_length = length
    self.gameModel[self.room_group_name].hitting_zone.set(hitting_zone)
    self.gameModel[self.room_group_name].score_time_p1.set(score_timeP1)
    self.gameModel[self.room_group_name].score_time_p2.set(score_timeP2)
    self.gameModel[self.room_group_name].save()
    

@sync_to_async
def createHittingZoneModels(hitting_zone):
    hittingZoneList = []
    for zone in hitting_zone:
        hittingZoneList.append(hittingZone.objects.create(hittingZone = zone))
    return hittingZoneList


@sync_to_async
def createScoreTimeModels(score_time):
    scoreTimeList = []
    for time in score_time:
        scoreTimeList.append(scoreTime.objects.create(scoreTime = time))
    return scoreTimeList


@sync_to_async
def getUser(self, connected_users):
    return (User.objects.get(username=connected_users[0]), User.objects.get(username=connected_users[1]))
