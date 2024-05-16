from django.db import models
from authentification.models import Profile

class FriendList(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'

    STATUS_CHOICES = [
        (PENDING, 'pending'),
        (ACCEPTED, 'accepted'),
    ]

    from_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='from_user')
    to_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='to_user')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)

