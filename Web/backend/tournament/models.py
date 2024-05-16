from django.db import models
from django.contrib.auth.models import User

class Tournament(models.Model):
	tournament_name = models.CharField(max_length=100, unique=True, primary_key=True, default='Anon')
	password = models.CharField(max_length=100, blank=True)
	number_max_of_players = models.IntegerField(default=4)
	number_points_to_win = models.IntegerField(default=11)
	number_set_to_win = models.IntegerField(default=2)
	status = models.CharField(max_length=100, default='Waiting room')
	contractAddress = models.CharField(max_length=100, default='0x0')


class Player(models.Model):
	pseudo = models.CharField(max_length=100, default='Anon')
	user = models.OneToOneField(User, on_delete=models.CASCADE, default=None)
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, blank=True, null=True)
	is_admin = models.BooleanField(default=False)
	is_ready = models.BooleanField(default=False)


class Bracket(models.Model):
	match_list = models.ManyToManyField('game.Match')
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, blank=True, null=True)
	odd_players = models.ManyToManyField(User,  blank=True)
class TournamentBrackets(models.Model):
	tournament = models.OneToOneField(Tournament, on_delete=models.CASCADE, blank=True, null=True)
	brackets = models.ManyToManyField("Bracket")
	odd_players = models.ManyToManyField(User,  blank=True)