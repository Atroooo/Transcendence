from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

class CustomUserAdmin(UserAdmin):
    # Define fields to be displayed in the user creation form
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email',)}),  # Add email field
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    # Define fields to be shown in the user list view
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff']

# Register the custom user admin class
admin.site.unregister(User)
admin.site.register(CustomUserAdmin)