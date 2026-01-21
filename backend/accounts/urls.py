from django.urls import path

from .views import SendCodeView, SigninView, SignupView, VerifyCodeView

urlpatterns = [
    path("signup", SignupView.as_view(), name="auth-signup"),
    path("signin", SigninView.as_view(), name="auth-signin"),
    path("send-code", SendCodeView.as_view(), name="auth-send-code"),
    path("verify-code", VerifyCodeView.as_view(), name="auth-verify-code"),
]
