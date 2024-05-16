from django.urls import re_path
from . import consumers

websocket_tournament_urlpatterns = [
    re_path(r"ws/tournament_started/(?P<tournament_name>[\w\d]+)/$", consumers.TournamentStardedConsumer.as_asgi()),
	re_path(r"ws/get_tournament/", consumers.GetTournamentConsumer.as_asgi()),
	re_path(r"ws/waiting_room_tournament/(?P<tournament_name>[\w\d]+)/$", consumers.WaitingRoomTournamentConsumer.as_asgi()),
]