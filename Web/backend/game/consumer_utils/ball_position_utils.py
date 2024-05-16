from .score_utils import sendScore

async def getBallPosition(self):
    x, y = self.roomGame[self.room_group_name].getCoords()
    scoreP1, scoreP2 = self.roomGame[self.room_group_name].getScore()

    if (self.roomScores[self.room_group_name] != [scoreP1, scoreP2]):
        self.roomScores[self.room_group_name] = [scoreP1, scoreP2]
        try:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "reset"})
        except:
            print("User already disconnected")
        await sendScore(self)
        
    try:
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "get_ball_position", "x": x, "y": y, "username": self.username})
    except:
        print("User already disconnected")