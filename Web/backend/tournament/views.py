from . import models
from django.http import JsonResponse
from game.models import Match
from .models import Bracket
import json
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from tournament.viewsUtils.join_tournament_utils import check_if_wrong_data_join_tournament
import tournament.viewsUtils.create_tournament_utils as create_tournament_utils
import tournament.viewsUtils.leave_tournament_utils as leave_tournament_utils
import tournament.viewsUtils.generate_bracket_utils as generate_bracket_utils
import tournament.viewsUtils.next_bracket_utils as next_bracket_utils
from tournament.viewsUtils.get_stats_tournament import getStats
from tournament.viewsUtils.get_tournament_data import getTournamentData
from .contractUtils.tournament import deployContract
from .contractUtils.getInfo import getWinner
import random



@require_http_methods(["POST"])
@login_required
def create_tournament(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=406)
    try:
        player = models.Player.objects.get(user=request.user)
        return JsonResponse({"error": "Player already in a tournament"}, status=400)
    except models.Player.DoesNotExist:
        pass
    try:
        tournament_name = data.get("tournament_name")
    except:
        return JsonResponse({"errors": "Invalid tournament name"}, status=400)
    try:
        number_max_of_players = data.get("number_max_of_players")
        number_max_of_players = int(number_max_of_players)
    except:
        return JsonResponse({"errors": "Invalid number of max players"}, status=400)
    try:
        pseudo = data.get("pseudo")
    except:
        return JsonResponse({"errors": "Missing pseudo"}, status=400)

    error = create_tournament_utils.check_if_wrong_data_create_tournament(tournament_name, \
                                    number_max_of_players, pseudo)
    if error is not None:
        return JsonResponse({'error': error}, status=400)
    
    try:
        tournament = create_tournament_utils.set_tournament_in_db(tournament_name, number_max_of_players)
        create_tournament_utils.set_the_creator_in_tournament(tournament, request.user, str(pseudo))
        return JsonResponse({"status": "success"}, status=200)
    except:
        return JsonResponse({"status": "error saving tournament"}, status=400)


@require_http_methods(["POST"])
@login_required
def join_tournament(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=406)
    try:
        tournament_name = data.get("tournament_name")
    except:
        return JsonResponse({"errors": "Invalid tournament name"}, status=400)
    try:
        pseudo = data.get("pseudo")
    except:
        return JsonResponse({"errors": "Missing pseudo"}, status=400)
    user = request.user
    error = check_if_wrong_data_join_tournament(tournament_name, pseudo, user)
    if error is not None:
        return JsonResponse({"error": error}, status=400)
    return JsonResponse({"status": "success"}, status=200)


@require_http_methods(["POST"])
@login_required
def leave_tournament(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=406)
    error = leave_tournament_utils.check_if_wrong_data_leave_tournament(data)
    if error is not None:
        return JsonResponse({"error": error}, status=400)
    return JsonResponse({"status": "success"}, status=200)

@require_http_methods(["POST"])
@login_required
def get_single_tournament(request):
    user = request.user
    try:
        player = models.Player.objects.get(user=user)
    except models.Player.DoesNotExist:
        return JsonResponse({"error": "Player does not exist"}, status=400)
    tournament = player.tournament
    try:
        name = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=406)
    if name['tournament_name'] != tournament.tournament_name:
        return JsonResponse({"error": "Invalid url"}, status=400)
    data = {
        "tournament_name": tournament.tournament_name,
        "number_max_of_players": tournament.number_max_of_players,
        "status": tournament.status,
    }
    return JsonResponse({'data' : data}, status=200)

@require_http_methods(["GET"])
@login_required
def get_tournaments(request):
    tournaments = models.Tournament.objects.all()
    data = []
    for tournament in tournaments:
        try:
            players = models.Player.objects.filter(tournament=tournament)
        except models.Tournament.DoesNotExist:
            return JsonResponse({"error": "Tournament does not exist"}, status=400)
        if len(players) == 0 and tournament.status == "Waiting room":
            tournament.delete()
        else:
            tournament_data = {
                "tournament_name": tournament.tournament_name,
                "number_max_of_players": tournament.number_max_of_players,
                "players_in_tournament": len(players),
                "status": tournament.status,
            }
            data.append(tournament_data)
    return JsonResponse({'data' : data}, status=200)

@require_http_methods(["GET"])
@login_required
def get_players_in_tournament(request):
    try:
        players = models.Player.objects.filter(user=request.user)
        player = None
        for p in players:
            if p.user == request.user:
                player = p
                break
        if not player:
            return JsonResponse({"error": "Player not found"}, status=400)
    except models.Player.DoesNotExist:
        return JsonResponse({"error": "Player Error"}, status=400)
    try:
        players = models.Player.objects.filter(tournament=player.tournament)
    except models.Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament does not exist"}, status=400)
    players_in_tournament = []
    for player in players:
        try:
            picture = player.user.profile.profile_picture.url
        except:
            picture = None
        players_in_tournament.append({'pseudo' : player.pseudo, 'username' : player.user.username, 'is_admin' : player.is_admin, \
                                      'profile_picture' : picture})
    return JsonResponse({"data": players_in_tournament}, status=200)

@require_http_methods(["GET"])
@login_required
def start_tournament(request):
    try:
        player = models.Player.objects.get(user=request.user)
    except models.Player.DoesNotExist:
        return JsonResponse({"error": "Error with player"}, status=400)
    if player.is_admin == False:
        return JsonResponse({"error": "Player is not an admin"}, status=400)
    try:
        players = list(models.Player.objects.filter(tournament=player.tournament))
    except models.Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament does not exist"}, status=400)
    try :
        models.TournamentBrackets.objects.get(tournament=player.tournament)
        return JsonResponse({"error": "Bracket already generated"}, status=400)
    except models.TournamentBrackets.DoesNotExist:
        pass
    if len(players) < 3:
        return JsonResponse({"error": "Not enough players to generate the bracket"}, status=400)
    player.tournament.status = "In progress"
    player.tournament.save()
    return JsonResponse({"status": "success"}, status=200)

def check_if_everyone_ready(all_players):
    for player in all_players:
        if player.is_ready == False:
            return False
    return True

def first_bracket(player, players):
    random.shuffle(players)
    match_list = generate_bracket_utils.create_every_match_for_bracket(player.tournament, players)
    return JsonResponse({"data": match_list}, status=200)

def other_bracket(player, players):
    try:
        tournament_bracket = models.TournamentBrackets.objects.get(tournament=player.tournament)
    except Match.DoesNotExist:
        return JsonResponse({"error": "Match does not exist"}, status=400)
    try:
        last_bracket = tournament_bracket.brackets.last()
    except Bracket.DoesNotExist:
        return JsonResponse({"error": "There is no existing bracket"}, status=400)
    matchs = last_bracket.match_list.all()
    match_list = next_bracket_utils.generate_next_round_bracket(matchs, tournament_bracket, player.tournament, players)
    return JsonResponse({"data": match_list}, status=200) 
    
    
@require_http_methods(["GET"])
@login_required
def ready(request):
    try:
        player = models.Player.objects.get(user=request.user)
    except models.Player.DoesNotExist:
        return JsonResponse({"error": "Error with player"}, status=400)
    player.is_ready = True
    player.save()
    all_players = list(models.Player.objects.filter(tournament=player.tournament))
    if (len(all_players) == 1):
        player.tournament.status = "Finished"
        player.tournament.save()
        player.delete()
        return JsonResponse({"status": "success tournament finished"}, status=200)
    if check_if_everyone_ready(all_players):
        first_round = True
        try:
            models.TournamentBrackets.objects.get(tournament=player.tournament)
            first_round = False
        except:
            pass
        if first_round:
            return first_bracket(player, all_players)
        else:
            return other_bracket(player, all_players)
    return JsonResponse({"status": "not everyone ready"}, status=200)

def next_bracket(request):
    try:
        player = models.Player.objects.get(user=request.user)
    except models.Player.DoesNotExist:
        return JsonResponse({"error": "Error with player"}, status=400)
    try:
        tournament_bracket = models.TournamentBrackets.objects.get(tournament=player.tournament)
    except Match.DoesNotExist:
        return JsonResponse({"error": "Match does not exist"}, status=400)
    try:
        last_bracket = tournament_bracket.brackets.last()
    except Bracket.DoesNotExist:
        return JsonResponse({"error": "There is no existing bracket"}, status=400)
    matchs = last_bracket.match_list.all()
    if len(matchs) < 2 and len(tournament_bracket.odd_players.all()) == 0:
        player.tournament.status = "Finished"
        player.tournament.save()
        return JsonResponse({"error": "The tournament is already finished"}, status=201)
    if next_bracket_utils.check_if_matchs_are_finished(matchs) == False:
        return JsonResponse({"error": "The tournament is not finished yet"}, status=400)
    data = next_bracket_utils.generate_next_round_bracket(matchs, tournament_bracket, player.tournament)
    return JsonResponse({"data": data}, status=200)



@require_http_methods(["GET"])
@login_required
def get_tournament_matchs(request):
    user = request.user
    try:
        player = models.Player.objects.get(user=user)
    except models.Player.DoesNotExist:
        return JsonResponse({"error": "Player does not exist"}, status=400)
    tournament = player.tournament
    try:
        tournament_bracket = models.TournamentBrackets.objects.get(tournament=tournament)
    except models.TournamentBrackets.DoesNotExist:
        return JsonResponse({"error": "Tournament bracket does not exist"}, status=400)
    try:
        brackets = tournament_bracket.brackets.all()
        if len(brackets) == 0:
            return JsonResponse({"error": "There is no existing bracket"}, status=400)
    except Bracket.DoesNotExist:
        return JsonResponse({"error": "There is no existing bracket"}, status=400)
    matchs_dict = {}
    idx = 0
    for bracket in brackets:
        matchs_list = []
        odd_list = []
        matchs = bracket.match_list.all()
        for match in matchs:
            try:
                first_picture = match.first_user.profile.profile_picture.url
                second_picture = match.second_user.profile.profile_picture.url
            except models.User.profile.RelatedObjectDoesNotExist:
                first_picture = None
                second_picture = None
            matchs_list.append({'first_user': match.first_user.username, 'second_user': match.second_user.username, \
                                'first_pseudo': match.first_pseudo, 'second_pseudo': match.second_pseudo, \
                                'first_picture': first_picture, 'second_picture': second_picture, \
                                'first_player_point': match.first_player_point, 'second_player_point': match.second_player_point})
        bracket_dict = {'matches': matchs_list}
        for odd_player in bracket.odd_players.all():
            try:
                odd_picture = odd_player.profile.profile_picture.url
            except:
                odd_picture = None
            try:
                player = models.Player.objects.get(user=odd_player)
                odd_list.append({"pseudo": player.pseudo, 'username': odd_player.username, 'odd_picture': odd_picture})
            except:
                pass
        bracket_dict['odd_players'] = odd_list
        matchs_dict[idx] = bracket_dict
        
        idx += 1
    return JsonResponse({"data": matchs_dict}, status=200)


@require_http_methods(["GET"])
@login_required
def getTournamentStat(request):
    user = request.user
    if user is None:
        return JsonResponse({"error": "User does not exist"}, status=400)
    
    win, participation = getStats(user)
    if (win == -1):
        return JsonResponse({"error": "Tournament does not exist"}, status=400)
    elif (win == -2):
        return JsonResponse({"error": "Tournament bracket does not exist"}, status=400)
    elif (win == -3):
        return JsonResponse({"error": "There is no existing bracket"}, status=400)
    elif (win == -4):
        return JsonResponse({"error": "There is no existing match"}, status=400)
    return JsonResponse({"participation": participation, "win": win}, status=200)


@require_http_methods(["POST"])
@login_required
def deploySmartContract(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"errors": "Invalid JSON format"}, status=406)
    try:
        tournamentName = data.get('tournamentName')
    except:
        return JsonResponse({"error": "Error in the data"}, status=400)
    try:
        tournament = models.Tournament.objects.get(tournament_name=tournamentName)
    except models.Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament does not exist"}, status=400)
    
    tournamentData = getTournamentData(tournament)
    if (tournamentData == "tournamentNotFinished"):
        return JsonResponse({"error": "Tournament is not finished"}, status=400)
    elif (tournamentData == "errorBracket"):
        return JsonResponse({"error": "Tournament bracket does not exist"}, status=400)
    elif (tournamentData == "errorMatch"):
        return JsonResponse({"error": "Error with match data"}, status=400)
    try:
        splittedData = tournamentData.split(",")
    except:
        return JsonResponse({"error": "Error in the data"}, status=400)
    
    if (len(splittedData) < 8):
        return JsonResponse({"error": "Not enough data"}, status=400)
    
    contractAddress = deployContract(tournamentData)
    if (contractAddress == "0x0"):
        return JsonResponse({"error": "Not enough gaz"}, status=400)
        
    tournament.contractAddress = contractAddress
    tournament.save()
    
    return JsonResponse({"status": "success"}, status=200)


@require_http_methods(["GET"])
@login_required
def getAllTournamentAddress(request):
    try:
        tournaments = models.Tournament.objects.all()
    except models.Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament does not exist"}, status=400)
    data = []
    for tournament in tournaments:
        if (tournament.status == "Finished"):
            data.append({"tournament_name": tournament.tournament_name, "contractAddress": tournament.contractAddress, "winner": getWinner(tournament.contractAddress)})
    return JsonResponse({'data' : data}, status=200)