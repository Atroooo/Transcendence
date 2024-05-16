from django.urls import path
from . import views

urlpatterns = [
	path('create_tournament', views.create_tournament, name="create_tournament"),
	path('join_tournament', views.join_tournament, name="join_tournament"),
	path('leave_tournament', views.leave_tournament, name="leave_tournament"),
    path('get_single_tournament', views.get_single_tournament, name="get_single_tournament"),
	path('get_tournaments', views.get_tournaments, name="get_tournaments"),
	path('get_players_in_tournament', views.get_players_in_tournament, name="get_players_in_tournament"),
	path('start_tournament', views.start_tournament, name="start_tournament"),
	path('next_bracket', views.next_bracket, name="next_bracket"),
	path('get_tournament_matchs', views.get_tournament_matchs, name="get_tournament_matchs"),
	path('getTournamentStat', views.getTournamentStat, name="getTournamentStat"),
	path('ready', views.ready, name="ready"),
	path('getAllTournamentAddress', views.getAllTournamentAddress, name="getAllTournamentAddress"),
	path('deploySmartContract', views.deploySmartContract, name="deploySmartContract"),
	path('ready', views.ready, name="ready"),
]