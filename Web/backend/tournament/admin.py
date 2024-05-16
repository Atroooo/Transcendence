from django.contrib import admin
from .models import Tournament, Player, Bracket, TournamentBrackets
# Register your models here.
admin.site.register(Tournament)
admin.site.register(Player)
admin.site.register(Bracket)
admin.site.register(TournamentBrackets)