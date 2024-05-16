from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from .models import FriendList

@require_http_methods(["POST"])
@login_required
def send_friend_request(request, username):
    from_user = request.user.profile
    if from_user is None:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    try:
        to_user = User.objects.get(username=username).profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)

    if (from_user == to_user):
        return JsonResponse({"errors": "You cannot send a friend request to yourself"}, status = 400)

    try:
        friend_request = FriendList.objects.get(from_user=from_user, to_user=to_user)
    except:
        friend_request = None
    
    if (friend_request is None):
        try:
            friend_request = FriendList.objects.get(from_user=to_user, to_user=from_user)
        except:
            friend_request = None

    if (friend_request is not None):
        if friend_request.status == FriendList.PENDING:
            return JsonResponse({"errors": "Invitation is pending"}, status=400)
        if friend_request.status == FriendList.ACCEPTED:
            return JsonResponse({"errors": "Users are already friends"}, status=400)

    created = FriendList.objects.create(from_user=from_user, to_user=to_user)
    if created:
        return JsonResponse({"success": "Friend request sent"}, status=200)
    return JsonResponse({"errors": "Friend request already sent"}, status=400)


@require_http_methods(["POST"])
@login_required
def accept_friend_request(request, username):
    try:
        from_user = User.objects.get(username=username).profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    try:
        to_user = request.user.profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    friend_request = get_object_or_404(FriendList, \
        from_user=from_user, to_user=to_user, status=FriendList.PENDING)
    friend_request.status = FriendList.ACCEPTED
    friend_request.save()
    other_pending_requests = FriendList.objects.filter(\
        from_user=to_user, to_user=from_user, status=FriendList.PENDING)
    other_pending_requests.delete()
    return JsonResponse({"success": "Friend request accepted"}, status=200)

@require_http_methods(["POST"])
@login_required
def decline_friend_request(request, username):
    try:
        from_user = User.objects.get(username=username).profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    try:
        to_user = request.user.profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    friend_request = get_object_or_404(FriendList, from_user=from_user, to_user=to_user, status=FriendList.PENDING)
    friend_request.delete()
    return JsonResponse({"success": "Friend request declined and removed"}, status=200)

@login_required
@require_http_methods(["GET"])
def get_user_friends_accepted(request):
    user = request.user
    try:
        user.profile
    except:
        return JsonResponse({"error": "User has no profile"}, status=200)
    accepted_friends = FriendList.objects.filter(from_user=user.profile, status=FriendList.ACCEPTED)\
            | FriendList.objects.filter(to_user=user.profile, status=FriendList.ACCEPTED)
    friend_list = []
    for friend in accepted_friends:
        if friend.from_user.user.id == user.id:
            friend_list.append({
                'id': friend.to_user.user.id,
                'username': friend.to_user.user.username,
                'email': friend.to_user.user.email,
                'profile_picture': friend.to_user.user.profile.profile_picture.url
            })
        else:
            friend_list.append({
                'id': friend.from_user.user.id,
                'username': friend.from_user.user.username,
                'email': friend.from_user.user.email,
                'profile_picture': friend.from_user.user.profile.profile_picture.url
            })

    return JsonResponse({"friends": friend_list}, status=200)


@login_required
@require_http_methods(["GET"])
def get_user_friends_pending(request):
    try:
        user = request.user
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    pending_friends = FriendList.objects.filter(from_user=user.profile, status=FriendList.PENDING)\
        | FriendList.objects.filter(to_user=user.profile, status=FriendList.PENDING)

    friend_list = []
    
    for friend in pending_friends:
            friend_list.append({
                'id': friend.from_user.user.id,
                'username': friend.from_user.user.username,
                'email': friend.from_user.user.email,
                'profile_picture': friend.from_user.user.profile.profile_picture.url
            })

    return JsonResponse({"friends": friend_list}, status=200)

@login_required
@require_http_methods(["DELETE"])
def delete_friend(request, username):
    try:
        from_user = User.objects.get(username=username).profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)
    try:
        to_user = request.user.profile
    except User.DoesNotExist:
        return JsonResponse({"errors": "User does not exist"}, status = 400)

    friends = FriendList.objects.filter(from_user=from_user, to_user=to_user, status=FriendList.ACCEPTED)\
            | FriendList.objects.filter(from_user=to_user ,to_user=from_user, status=FriendList.ACCEPTED)\
            | FriendList.objects.filter(from_user=from_user, to_user=to_user, status=FriendList.PENDING)\

    if len(friends) == 0:
        return JsonResponse({"error": 'No friend request found'}, status=404)

    for friend in friends:
        friend.delete()

    return JsonResponse({"status": 'success'}, status=200)