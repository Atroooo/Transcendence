from tournament import models
from game.models import Match
from tournament.models import Bracket

def getTournamentData(tournament):
    if (tournament.status != "Finished"):
        return "tournamentNotFinished"
    data = ""
    
    try:
        tournament_bracket = models.TournamentBrackets.objects.get(tournament=tournament)
    except models.TournamentBrackets.DoesNotExist:
        return "errorBracket"
    
    try:
        brackets = tournament_bracket.brackets.all()
        if len(brackets) == 0:
            return "errorBracket"
    except Bracket.DoesNotExist:
        return "errorBracket"
    
    data += tournament.tournament_name + ","
    
    try:
        last_bracket = tournament_bracket.brackets.last()
    except Bracket.DoesNotExist:
        return "errorBracket"
    
    try:
        last_match = last_bracket.match_list.last()
        if last_match is not None:
            data += last_match.victory_pseudo + ','
    except Match.DoesNotExist:
        return "errorMatch"
    except AttributeError:
        return "errorMatch Attribute"

    i = 0
    for bracket in brackets:
        try:
            matches = bracket.match_list.all()
        except Match.DoesNotExist:
            return "errorMatch"
    
        for match in matches:
            if (match.first_pseudo is None or match.second_pseudo is None or match.victory_pseudo is None):
                return "errorMatch"
            data += str(i) + "," + match.first_pseudo + "," + str(match.first_player_point) + "," + match.second_pseudo + "," + str(match.second_player_point) + "," + match.victory_pseudo
            i += 1
        data += ","
    
    if (data[-1] == ","):
        data = data[:-1]
        
    return data