# Generated by Django 4.2.9 on 2024-04-09 13:46

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("authentification", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FriendList",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "pending"), ("accepted", "accepted")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                (
                    "from_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="from_user",
                        to="authentification.profile",
                    ),
                ),
                (
                    "to_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="to_user",
                        to="authentification.profile",
                    ),
                ),
            ],
        ),
    ]