from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import logout, authenticate, get_user_model, login
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods
import json
import magic
from .models import Profile
from .forms import CustomUserCreationForm
from .tokens import account_activation_token, reset_password_token
from tournament.viewsUtils.create_tournament_utils import is_valid
from .tasks import delete_account_if_not_activate
from .viewsUtils import (
    check_if_email_unique,
    send_activate_email,
    send_forgot_password_email,
    make_token_exchange,
    success_request,
    add_api_profile_picture,
    get_profile_data,
    check_if_preset_picture
)

# REGISTER

@require_http_methods(["GET"])
def activate_account(request, uidb64, token):
    User = get_user_model()
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        user = None
        
    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()
        return JsonResponse({"status": "success"}, status=200)
    return JsonResponse({"status": "failed"}, status=400)

@require_http_methods(["POST"])
def register_user(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    userData = data.get("userData", {})
    try:   
        if  not is_valid( userData["username"]):
            return JsonResponse({"errors": "Invalid username"}, status=400)
    except:
        pass
    form = CustomUserCreationForm(userData)
    if not form.is_valid():
        return JsonResponse({"form_errors": form.errors}, status=400)
    if check_if_email_unique(userData["email"]):
        return JsonResponse({"errors": "email is not unique"}, status=400)
    user = form.save(commit=False)
    user.is_active = False
    user.save()
    Profile.objects.create(user=user)
    if send_activate_email(request, user, userData["email"]) == False:
        return JsonResponse({"error": "error sending email"}, status=400)
    delete_account_if_not_activate.apply_async(args=[user.id], countdown=3600)
    return JsonResponse({"status": "success"}, status=200)
    
# REGISTER WITH 42 API

@require_http_methods(["POST"])
def register_with_42_api(request):
    try:
        body = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    profile_data = get_profile_data(body)
    try:
        email = profile_data.get("email")
        username = profile_data.get("login")
    except:
        return JsonResponse({"error": "No email or username provided"}, status=400)

    if email is None or email == "" or username is None or username == "":
        return JsonResponse({"error": "No email or username provided"}, status=400)
    if check_if_email_unique(email):
        return JsonResponse({"errors": "Email is not unique"}, status=400)
    if get_user_model().objects.filter(username=username).exists():
        return JsonResponse({"error": "Username is not unique"}, status=400)
    user = get_user_model().objects.create_user(
        username=username,
        password="",
        email=email,
        is_active=True,
    )
    try:
        profile = Profile.objects.get(user=user)
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=user)
    profile.created_with_api = True
    add_api_profile_picture(profile, profile_data, username)

    return JsonResponse({"status": "success"}, status=200)


# LOGIN / LOGOUT

@require_http_methods(["POST"])
def login_user(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    username = data.get("username")
    password = data.get("password")
    if (username == "") or (username is None) \
        or (password == "") or (password is None):
        return JsonResponse(
            {"errors": "Missing username or password"}, status=400
        )
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse(
            {"errors": "Wrong username or password"}, status=400
        )
    login(request, user)
    return JsonResponse({"status": "success"}, status=200)

@require_http_methods(["GET"])
def logout_user(request):
    logout(request)
    return JsonResponse({"status": "success"}, status=200)


# LOGIN WITH 42 API
@require_http_methods(["POST"])
def login_with_42_api(request):
    try:
        body = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    profile_data = get_profile_data(body)
    if profile_data is None:
        return JsonResponse(
            {"errors": "Wrong access token"}
            , status=400 
        )
    username = profile_data.get("login")
    user = authenticate(
        request,
        username=username,
        password="",
    )
    if user is None:
        return JsonResponse(
            {"errors": "Wrong username or password"}
            , status=400 
        )
    login(request, user)
    return JsonResponse({"status": "success"}, status=200)

@require_http_methods(["POST"])
@ensure_csrf_cookie
def get_auth_token_api(request):
    try:
        body = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    token_response = make_token_exchange(body)
    
    if (token_response is None):
        return JsonResponse({"status": "failed"}, status=400)

    if token_response.status_code == 200:
        return success_request(token_response)
    else:
        return JsonResponse({"status": "failed"}, status=400)

# DATA
@require_http_methods(["GET"])
def get_user_data(request):
    user = request.user
    try:
        profile = user.profile
    except Exception:
        return JsonResponse({'errors' : 'User is not login'}, status=201)
    user_data = {
        "username": user.username,
        "bio": profile.bio,
        "profile_picture": profile.profile_picture.url,
        "email": user.email,
    }
    return JsonResponse({"status": "success", "user_data": user_data}, status=200)

def check_extension_type(uploaded_file):
    allowed_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    allowed_extensions = ['.png', '.jpeg', '.jpg', '.svg']
    if uploaded_file.content_type not in allowed_types:
        return 'Unsupported file type'
    if '.' in uploaded_file.name and uploaded_file.name.rsplit('.', 1)[1].lower() not in [ext[1:] for ext in allowed_extensions]:
        return 'Unsupported file extension'
    return False

@require_http_methods(["POST"])
@login_required
def update_profile_picture(request):
    uploaded_file = request.FILES.get("image")
    if uploaded_file and uploaded_file.size > 5242880: # 5MB
        return JsonResponse({'errors': "File size exceeds the limit"}, status=400)
    if uploaded_file is None:
        return JsonResponse({"errors": "No file provided"}, status=400)
    error = check_extension_type(uploaded_file)
    if error:
        return JsonResponse({'errors': error}, status=400)
    mime = magic.Magic()
    file_type = mime.from_buffer(uploaded_file.read(1024))
    if 'image' not in  file_type:
        return JsonResponse({'errors': "Invalid file type"}, status=400)
    user_profile = get_object_or_404(Profile, user=request.user)
    if user_profile and check_if_preset_picture(user_profile.profile_picture.path) == False:
        default_storage.delete(user_profile.profile_picture.path)
    user_profile.profile_picture = uploaded_file
    user_profile.save()
    return JsonResponse({"status": "success"}, status=200)

@require_http_methods(["POST"])
def forgot_password(request):
    try:
        body = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    email = body.get('email')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "User with this email does not exist"}, status=400)
    try:
        user.profile
    except:
        return JsonResponse({"error": "User does not have a profile"}, status=400)
    if user.profile.created_with_api:
        return JsonResponse({"errors": "Can't change password\
                              because the account was made with an API"}, status=400)
    send_forgot_password_email(request, user, email)
    return JsonResponse({"status": "success"}, status=200)

@require_http_methods(["POST"])
def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is None or not reset_password_token.check_token(user, token):
        return JsonResponse({'error':"Invalid reset link"}, status=400)
    try:
        user.profile
    except:
        return JsonResponse({"error": "User does not have a profile"}, status=400)
    if user.profile.created_with_api:
        return JsonResponse({"errors": "Can't change password\
                              because the account was made with an API"}, status=400)
    try:
        body = json.loads(request.body.decode('utf8'))
        new_password = body.get('new_password')
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    user.set_password(new_password)
    user.save()
    return JsonResponse({"status": "success"}, status=200)

@login_required
@require_http_methods(["PUT"])
def update_email(request):
    user = request.user
    if user.profile.created_with_api:
        return JsonResponse({"errors": "Can't change email address\
                              because the account was made with an API"}, status=400)
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    email = data.get("email")
    if (len(email) >= 200):
        return JsonResponse({"errors": "email is too long"}, status=400) 
    if user.email == email:
        return JsonResponse({"errors": "email is the same"}, status=400)
    if check_if_email_unique(email):
        return JsonResponse({"errors": "email is not unique"}, status=400)
    user.email = email
    user.save()
    return JsonResponse({"status": "success"}, status=200)

@login_required
@require_http_methods(["PUT"])
def change_password(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    user = authenticate(request, username=request.user.username, password=old_password)
    if user is None:
        return JsonResponse({"errors": "Wrong password"}, status=400)
    user.set_password(new_password)
    user.save()
    return JsonResponse({"status": "success"}, status=200)

@require_http_methods(["PATCH"])
@login_required
def update_bio(request):
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)

    try:
        bio = data.get("bio")
    except:
        return JsonResponse(data={'errors': "Invalid object format"}, status=400)

    user = request.user
    if user is None:
        return JsonResponse({"error": "User does not exist"}, status=400)

    if bio is not None:
        profile = user.profile
        profile.bio = bio
        profile.save()
    else:
        return JsonResponse({"error": "bio does not exist"}, status=400)

    return JsonResponse({"status": "success"})

@require_http_methods(["PUT"])
@login_required
def update_name(request):
        
    try:
        data = json.loads(request.body.decode('utf8'))
    except json.JSONDecodeError:
        return JsonResponse(data={'errors': "Invalid JSON format"}, status=400)

    try:
        username = data.get("name")
    except:
         return JsonResponse(data={'errors': "Invalid object format"}, status=400)
    if (len(username) >= 15):
        return JsonResponse({"errors": "Username is too long"}, status=400)
    try:
        existing_user = User.objects.get(username=username)
        return JsonResponse({"errors": "Username already exists"}, status=400)
    except User.DoesNotExist:
        pass

    user = request.user
    if user is None:
        return JsonResponse({"error": "User does not exist"}, status=400)

    if username is not None:
        user.username = username
        user.save()
    else:
        return JsonResponse({"error": "User does not exist"}, status=400)

    return JsonResponse({"status": "success"}, status=200)

# CSRF
@require_http_methods(["GET"])
@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)