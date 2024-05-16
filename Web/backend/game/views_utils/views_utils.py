from django.forms.models import model_to_dict

from game.models import Match, hittingZone, scoreTime
from tournament.models import Tournament, Bracket
from tournament.models import TournamentBrackets
from tournament import models


def convertHittingZoneToDict(match):
    try:
        hittingZoneModel = match.hitting_zone.all()
    except hittingZone.DoesNotExist:
        return []
    hittingZoneDict = []
    for hittingZone in hittingZoneModel:
        hittingZoneDict.append(model_to_dict(hittingZone))
    return hittingZoneDict


def convertScoreTimeToDict(match, player):
    if player == "p1":
        try:
            scoreTimeModel = match.score_time_p1.all()
        except scoreTime.DoesNotExist:
            return []
    else:
        try:
            scoreTimeModel = match.score_time_p2.all()
        except scoreTime.DoesNotExist:
            return []
    
    scoreTimeDict = []
    for scoreTime in scoreTimeModel:
        scoreTimeDict.append(model_to_dict(scoreTime))
    return scoreTimeDict
      
        
def convert_matchs_to_dict(match_list):
    dict_match_list = []
    for match in match_list:
        dict_match = model_to_dict(match, fields=['date', 'first_user', 'second_user', 'first_player_point', 'second_player_point', 'victory_user', 'tournament', 'left_hits', 'right_hits', 'total_hits', 'game_length'])
        dict_match['first_user'] = model_to_dict(match.first_user, fields=['username'])
        dict_match['second_user'] = model_to_dict(match.second_user, fields=['username'])
        dict_match['date'] = match.date
        if match.victory_user:
            dict_match['victory_user'] = model_to_dict(match.victory_user, fields=['username'])
        else:
            dict_match['victory_user'] = None
        dict_match['hitting_zone'] = convertHittingZoneToDict(match)
        dict_match['score_time_p1'] = convertScoreTimeToDict(match, "p1")
        dict_match['score_time_p2'] = convertScoreTimeToDict(match, "p2")
        dict_match_list.append(dict_match)
    return dict_match_list