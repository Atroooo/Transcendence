"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.security.websocket import AllowedHostsOriginValidator
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from game.routing import websocket_game_urlpatterns
from friendlist.routing import websocket_friendlist_urlpatterns
from notification.routing import websocket_notification_urlpatterns
from tournament.routing import websocket_tournament_urlpatterns

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django_asgi_app = get_asgi_application()
import django
django.setup()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "https": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(websocket_game_urlpatterns \
					+ websocket_friendlist_urlpatterns \
					+ websocket_notification_urlpatterns \
					+ websocket_tournament_urlpatterns),
        )
    }
)