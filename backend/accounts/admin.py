from django.contrib import admin

from .models import CustomerProfile, EmailVerificationCode


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "updated_at")
    search_fields = ("user__email", "phone_number")


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "code", "used", "created_at", "expires_at")
    search_fields = ("user__email", "code")
    list_filter = ("used",)
