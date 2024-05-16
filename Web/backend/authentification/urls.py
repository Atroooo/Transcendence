from django.urls import path
from . import views

urlpatterns = [
    path("get-csrf-token/", views.get_csrf_token, name="get_csrf_token"),
    path("login/", views.login_user, name="login_user"),
    path("login_with_42_api/", views.login_with_42_api, name="login_with_42_api"),
    path("get_auth_token_api", views.get_auth_token_api, name="get_auth_token_api"),
    path("logout/", views.logout_user , name="logout_user"),
    path("register/", views.register_user, name="register_user"),
    path("register_with_42_api/", views.register_with_42_api, name="register_with_42_api"),
    path("activate_account/<uidb64>/<token>/", views.activate_account, name="activate_account"),
    path("get_user_data/", views.get_user_data, name="get_user_data"),
    path("update_profile_picture/", views.update_profile_picture, name="update_profile_picture"),
    path("forgot_password/", views.forgot_password, name="forgot_password"),
    path("reset_password/<uidb64>/<token>/", views.reset_password, name="reset_password"),
    path("change_password/", views.change_password, name="change_password"),
    path("update_email/", views.update_email, name="update_email"),
    path("update_name/", views.update_name, name='update_name'),
    path("update_bio/", views.update_bio, name="update_bio"),
]
