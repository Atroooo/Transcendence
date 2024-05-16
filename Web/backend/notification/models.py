from django.db import models
from authentification.models import Profile

class Notification(models.Model):
    message = models.CharField(max_length=100)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.message