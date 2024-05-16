from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField()
    created_with_api = models.BooleanField(default=False)
    profile_picture = models.ImageField(
        default="authentification/images/profile_pictures/bear.png",
        upload_to="authentification/images/profile_pictures/",
    )

