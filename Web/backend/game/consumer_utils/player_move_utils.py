def checkFields(data):
    return 'message' in data

async def playerMove(self, text_data_json):
    if (checkFields(text_data_json) == True):
        try:
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "player_move", "message": text_data_json["message"], "username": self.username})
        except:
            print("User already disconnected")
        if (self.username == list(self.roomConnectedUsers[self.room_group_name])[1]):
            self.roomGame[self.room_group_name].updatePlayerPos("p1", text_data_json["message"])
        else:
            self.roomGame[self.room_group_name].updatePlayerPos("p2", text_data_json["message"])
    else:
        print("Error: Missing fields")
        return