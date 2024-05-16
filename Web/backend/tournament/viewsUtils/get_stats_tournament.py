from tournament import models
from tournament.models import Bracket
from game.models import Match

def getStats(user):
    try:
        tournaments = models.Tournament.objects.all()
    except models.tournament.DoesNotExist:
        return -1, 0

    win = 0
    participation = 0
    for tournament in tournaments:
        if tournament.status == "Finished":
            try:
                tournament_bracket = models.TournamentBrackets.objects.get(tournament=tournament)
            except models.TournamentBrackets.DoesNotExist:
                return -2, 0 
            
            try:
                first_bracket = tournament_bracket.brackets.first()
            except Bracket.DoesNotExist:
                return -3, 0
            
            try:
                matches = first_bracket.match_list.all()
            except Match.DoesNotExist:
                return -4, 0
            
            for match in matches:
                if (user == match.first_user or user == match.second_user):
                    participation += 1
            try:
                last_bracket = tournament_bracket.brackets.last()
            except Bracket.DoesNotExist:
                return -3, 0
            
            try:
                lastMatch = last_bracket.match_list.last() 
            except Match.DoesNotExist:
                return -4, 0
            
            if (lastMatch.victory_user is None):
                return -4, 0
            elif (lastMatch.victory_user == user):
                win += 1
            
    return (win, participation)