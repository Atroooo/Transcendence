from django.urls import re_path

from . import consumers

websocket_game_urlpatterns = [
    re_path(r"ws/gamePVP/$", consumers.MatchmakingConsumers.as_asgi()),
    re_path(r"ws/gameCustom/(?P<room_name>\w+)/$", consumers.CustomGameConsumers.as_asgi()),
]