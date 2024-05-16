from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from game import models
from game.models import Match

from .views_utils.views_utils import convert_matchs_to_dict
from .views_utils.aiModel import getMove, isFloat, isInt

@require_http_methods(["GET"])
def getAIMove(request):  
    try:
        level = request.GET.get('level', 0)
    except KeyError:
        return JsonResponse({"error": "level not found"}, status=400)
    if (isInt(level) == False):
        return JsonResponse({"error": "Wrong type for level"}, status=400)
    if (level != "0" and level != "1" and level != "2"):
        return JsonResponse({"error": "level not accepted"}, status=400)

    try:
        playerX = request.GET.get('playerX', 0)
    except KeyError:
        return JsonResponse({"error": "playerX not found"}, status=400)
    if (isFloat(playerX) == False):
        return JsonResponse({"error": "Wrong type for playerX"}, status=400)

    try:
        playerY = request.GET.get('playerY', 0)
    except KeyError:
        return JsonResponse({"error": "playerY not found"}, status=400)
    if (isFloat(playerY) == False):
        return JsonResponse({"error": "Wrong type for playerY"}, status=400)

    try:
        ballX = request.GET.get('ballX', 0)
    except KeyError:
        return JsonResponse({"error": "ballX not found"}, status=400)
    if (isFloat(ballX) == False):
        return JsonResponse({"error": "Wrong type for ballX"}, status=400)

    try:
        ballY = request.GET.get('ballY', 0)
    except KeyError:
        return JsonResponse({"error": "ballY not found"}, status=400)
    if (isFloat(ballY) == False):
        return JsonResponse({"error": "Wrong type for ballY"}, status=400)

    decision = getMove(int(level), float(playerX), float(playerY), float(ballX), float(ballY))
    return JsonResponse({'decision': decision}, status=200)

@require_http_methods(["GET"])
@login_required
def getAllMatch(request):
    user = request.user
    if user is None:
        return JsonResponse({"error": "User does not exist"}, status=400)
    
    try:
        matches = models.Match.objects.all()
    except models.Match.DoesNotExist:
        return JsonResponse({'message': 'No matches found for the user'}, status=200)

    match_list = []
    for match in matches:
        if match and (match.first_user.username == user.username or match.second_user.username == user.username):
            match_list.append(match)
    
    if not match_list:
        return JsonResponse({'message': 'No matches found for the user'}, status=200)
    
    match_list = convert_matchs_to_dict(match_list)
    return JsonResponse({'matches': match_list}, status=200)


@require_http_methods(["POST"])
def playerUp(request):
    user = request.user
    if user is None:
        return JsonResponse({"error": "User does not exist"}, status=400)

    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"errors": "Invalid JSON format"}, status=406)

    channel_layer = get_channel_layer()

    try:
        name = data.get('room_name')
    except KeyError:
        return JsonResponse({"error": "room_name not found"}, status=400)
    
    try:
        nb = data.get('nb_request')
    except KeyError:    
        return JsonResponse({"error": "nb not found"}, status=400)
    
    if (nb is None):
        return JsonResponse({"error": "nb not found"}, status=400)
    
    if (isInt(nb) == False):
        return JsonResponse({"error": "Wrong type for nb"}, status=400)
    if (int(nb) <= 0):
        return JsonResponse({"error": "nb must be greater than 0"}, status=400)

    if (int(nb) >= 20):
        return JsonResponse({"error": "nb too high"}, status=400)
    
    try:
        async_to_sync(channel_layer.group_send)(name, {'type': 'player_moveAPI',  'message': 'APIup', 'nb': nb, 'username': user.username})
    except:
        return JsonResponse({"error": "Cannot send data"}, status=400)
    return JsonResponse({"status": "success"}, status=200)


@require_http_methods(["POST"])
def playerDown(request):
    user = request.user
    if user is None:
        return JsonResponse({"error": "User does not exist"}, status=400)

    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse({"errors": "Invalid JSON format"}, status=406)

    channel_layer = get_channel_layer()
    
    try:
        name = data.get('room_name')
    except KeyError:
        return JsonResponse({"error": "room_name not found"}, status=400)
    
    try:
        nb = data.get('nb_request')
    except KeyError:    
        return JsonResponse({"error": "nb not found"}, status=400)
    
    if (nb is None):
        return JsonResponse({"error": "nb not found"}, status=400)
    
    if (isInt(nb) == False):
        return JsonResponse({"error": "Wrong type for nb"}, status=400)
    if (int(nb) <= 0):
        return JsonResponse({"error": "nb must be greater than 0"}, status=400)

    if (int(nb) >= 20):
        return JsonResponse({"error": "nb too high"}, status=400)
    
    try:
        async_to_sync(channel_layer.group_send)(name, {'type': 'player_moveAPI',  'message': 'APIdown', 'nb': nb, 'username': user.username})
    except:
        return JsonResponse({"error": "Cannot send data"}, status=400)
    return JsonResponse({"status": "success"}, status=200)