# Generated by Django 4.2.9 on 2024-04-25 15:27

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tournament", "0002_bracket_match_list"),
    ]

    operations = [
        migrations.AddField(
            model_name="tournament",
            name="number_points_to_win",
            field=models.IntegerField(default=11),
        ),
        migrations.AddField(
            model_name="tournament",
            name="number_set_to_win",
            field=models.IntegerField(default=2),
        ),
        migrations.AddField(
            model_name="tournament",
            name="password",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
