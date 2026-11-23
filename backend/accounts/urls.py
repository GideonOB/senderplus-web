from django.urls import path
from .supabase_views import LinkSupabaseIdentityView, SupabaseSessionView

from .views import (
    PasswordChangeView,
    ProfileView,
    SendCodeView,
    SigninView,
    SignupView,
    VerifyCodeView,
)

urlpatterns = [
    path("session", SupabaseSessionView.as_view(), name="auth-session"),
    path("link-supabase", LinkSupabaseIdentityView.as_view(), name="auth-link-supabase"),
    path("signup", SignupView.as_view(), name="auth-signup"),
    path("signin", SigninView.as_view(), name="auth-signin"),
    path("send-code", SendCodeView.as_view(), name="auth-send-code"),
    path("verify-code", VerifyCodeView.as_view(), name="auth-verify-code"),
    path("change-password", PasswordChangeView.as_view(), name="auth-change-password"),
    path("profile", ProfileView.as_view(), name="auth-profile"),
]
