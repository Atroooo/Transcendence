import json
from tournament.models import Player, Tournament, TournamentBrackets, Bracket
from game.models import Match
from .  import models
from channels.generic.websocket import AsyncWebsocketConsumer
from .consumer_utils.update_bracket_utils import get_matchs, get_playerlist
from .consumer_utils.update_score_utils import check_if_match_in_tournament
from .consumer_utils.game_ready_to_join_utils import check_if_user_in_match
from .consumer_utils.add_players_in_tournaments_utils import get_players_in_tournament
from .consumer_utils.disconnect_utils import delete_player
from django.core.serializers import serialize
from asgiref.sync import sync_to_async 

class TournamentStardedConsumer(AsyncWebsocketConsumer):
    @sync_to_async
    def check_if_tournament_finished(self, tournament_name):
        players = Player.objects.filter(tournament=tournament_name)
        if len(players) <= 1 and str(self.scope['user']) == players[0].user.username:
            try:
                tournament = Tournament.objects.get(tournament_name=tournament_name)
            except:
                return False
            try:
                tournament_bracket = models.TournamentBrackets.objects.get(tournament=tournament)
            except models.TournamentBrackets.DoesNotExist:
                return False
            try:
                last_bracket = tournament_bracket.brackets.last()
            except:
                return False
            try:
                last_match = last_bracket.match_list.last()
                if last_match is not None:
                    data = last_match.victory_pseudo
            except Match.DoesNotExist:
                return "errorMatch"
            except AttributeError:
                return "errorMatch Attribute"
            if (players[0].pseudo == data):
                tournament.status = "Finished"
                tournament.save()
                return True
        return False

    @sync_to_async
    def set_player_status_false(self):
        user = self.scope["user"]
        try:
            player = models.Player.objects.get(user=user)
            player.is_ready = False
            player.save()
        except models.Player.DoesNotExist:
            pass
        
    
    async def connect(self):
        self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
        self.group_name = f'tournament_room_{self.tournament_name}'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        await self.set_player_status_false()
        if await self.get_tournament_status() == 'In progress':
            if (await self.check_if_tournament_finished(self.tournament_name)):
                await self.send(json.dumps({'event': 'You won the tournament'}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    from asgiref.sync import sync_to_async

    async def get_player_status(self):
        user = self.scope["user"]
        try:
            player = await sync_to_async(models.Player.objects.get)(user=user)
        except models.Player.DoesNotExist:
            return False
        return player.is_ready

    async def get_player_pseudo(self):
        user = self.scope["user"]
        try:
            player = await sync_to_async(models.Player.objects.get)(user=user)
        except models.Player.DoesNotExist:
            return None
        return player.pseudo

    @sync_to_async
    def get_tournament_status(self):
        try:
            tournament = models.Tournament.objects.get(tournament_name=self.tournament_name)
            return tournament.status
        except models.Tournament.DoesNotExist:
            return None

    async def update_bracket(self, event):
        matchs = await get_matchs(self ,event)
        if not matchs:
            return
        player_list = await get_playerlist(self, matchs)
        try:
            await self.send(json.dumps({'player_list': player_list,
                                    'update_bracket': 'update_bracket'}))
        except:
            print("User already disconnected")

    async def update_score(self, event):
        first_user = event['first_user']
        first_player_point = event['first_player_point']
        second_user = event['second_user']
        second_player_point = event['second_player_point']
        if await check_if_match_in_tournament(self, event) == False:
            return
        if (self.scope['user'] != first_user and self.scope['user'] != second_user):
            group_name = f'tournament_room_{self.tournament_name}'
            try:
                await self.channel_layer.group_send(group_name, {
                    'type': 'send_score_update',
                    'message_data': json.dumps(serialize('json', first_user),
                                first_player_point,
                                serialize('json', second_user),
                                second_player_point)
                })
            except:
                print("User already disconnected")

    async def game_ready_to_join(self, event):
        first_user = event['first_user']
        second_user = event['second_user']
        id = event['id']
        if await check_if_user_in_match(self, event) == False:
            return
        try:
            await self.send(text_data=json.dumps({'first_user': serialize('json',first_user),
                                        'second_user': serialize('json',second_user),
                                        'id': serialize('json',id)}))
        except:
            print("User already disconnected")

    async def tournament_status_changed(self, event):
        new_status = event['new_status']
        try:
            await self.send(json.dumps({'event': new_status,
                                    'start': 'started'}))
        except:
            print("User already disconnected")

    async def tournament_deleted(self, event):
        tournament_name = event['tournament_name']
        try:
            await self.send(json.dumps({'tournament_name_to_delete': tournament_name}))
        except:
            print("User already disconnected")
            
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        
        try:
            dataType = text_data_json["type"]
            username = text_data_json["username"]
            if dataType == "leaving":
                await delete_player(username)
        except:
            pass


class WaitingRoomTournamentConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
        self.group_name = f'waiting_room_{self.tournament_name}'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        user = self.scope['user']
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def get_players_in_tournament(self, event):
        user = self.scope['user']
        if user.is_anonymous:
            return 
        players = event['players']
        player_list = await get_players_in_tournament(players)
        try:
            await self.send(text_data=player_list)
        except:
            print("User already disconnected")


class GetTournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'get_tournaments'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def get_tournaments_creation(self, event):
        tournament_name = event['tournament_name']
        number_max_of_players = event['number_max_of_players']
        number_points_to_win = event['number_points_to_win']
        number_set_to_win = event['number_set_to_win']
        try:
            await self.send(text_data=json.dumps({'message' : 'new tournament created',
                                    'tournament_name': tournament_name,
                                    'number_max_of_players': number_max_of_players,
                                    'number_points_to_win': number_points_to_win,
                                    'number_set_to_win': number_set_to_win}))
        except:
            print("User already disconnected")

    async def get_tournaments_deletion(self, event):
        tournament_name = event['tournament_name']
        try:
            await self.send(text_data=json.dumps({'message' : 'tournament deleted',
                'tournament_name_to_delete': tournament_name}))
        except:
            print("User already disconnected")
    
    async def number_of_player(self, event):
        tournament_name = event['tournament_name']
        player_number = event['player_number']
        number_of_max_player = event['number_max_of_players']
        try:
            await self.send(text_data=json.dumps({'message' : "number_of_players",
                                            'tournament_name' : tournament_name,
                                            'number_of_max_player': number_of_max_player,
                                            'player_number': player_number}))
        except:
            print("User already disconnected")

