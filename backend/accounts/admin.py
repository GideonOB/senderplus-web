from django.contrib import admin

from .models import CustomerProfile, EmailVerificationCode, SupabaseIdentity, UserRole


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "updated_at")
    search_fields = ("user__email", "phone_number")


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "code", "used", "created_at", "expires_at")
    search_fields = ("user__email", "code")
    list_filter = ("used",)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__email", "user__username")
    raw_id_fields = ("user",)
    readonly_fields = ("created_at",)

    # Assigning roles is a privilege boundary, not a generic staff permission.
    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(SupabaseIdentity)
class SupabaseIdentityAdmin(admin.ModelAdmin):
    list_display = ("user", "subject", "created_at")
    search_fields = ("user__email", "subject")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
