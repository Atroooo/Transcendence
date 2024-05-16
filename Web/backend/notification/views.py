from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib.auth.models import User
from .models import Notification
import json
# Create your views here.
def index(request):
    return render(request, 'index.html')

#NEED TO TEST
@require_http_methods(["DELETE"])
def delete_notification(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=406)
    message = data.get("message")
    profile = request.user.profile
    try:
        notification = Notification.objects.get(message=message, profile=profile)
    except Notification.DoesNotExist:
        return JsonResponse(data={'errors': "Notification does not exist"}, status=404)
    notification.delete()
    return JsonResponse({"status": "success"}, status=200)