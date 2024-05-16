from django.urls import path
from . import views

urlpatterns = [
    path('getAIMove/', views.getAIMove, name='getAIMove'),
    path("getAllMatch/", views.getAllMatch, name="getAllMatch"),
    path("playerUp/", views.playerUp, name="playerUp"),
    path("playerDown/", views.playerDown, name="playerDown"),
]
