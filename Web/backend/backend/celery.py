# backend/celery.py

from __future__ import absolute_import, unicode_literals
from celery import Celery
import os
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

app = Celery("backend")

app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

app.config_from_object("django.conf:settings", namespace="CELERY")
