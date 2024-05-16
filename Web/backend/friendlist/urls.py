from django.urls import path
from . import views

urlpatterns = [
    path('send_friend_request/<str:username>', views.send_friend_request, name="send_friend_request"),
    path('accept_friend_request/<str:username>', views.accept_friend_request, name="accept_friend_request"),
    path('decline_friend_request/<str:username>', views.decline_friend_request, name="decline_friend_request"),
    path('get_user_friends_accepted', views.get_user_friends_accepted, name="get_user_friends_accepted"),
    path('get_user_friends_pending', views.get_user_friends_pending, name="get_user_friends_pending"),
    path('delete_friend/<str:username>', views.delete_friend, name="delete_friend"),
]