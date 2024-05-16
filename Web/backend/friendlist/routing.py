from django.urls import re_path
from . import consumers

websocket_friendlist_urlpatterns = [
    re_path(r"ws/connected-list/$", consumers.ConnectedListConsumer.as_asgi()),
]