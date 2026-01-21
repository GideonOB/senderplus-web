from django.contrib.auth import login
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailVerificationCode
from .serializers import (
    SendCodeSerializer,
    SigninSerializer,
    SignupSerializer,
    VerifyCodeSerializer,
)


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verification = EmailVerificationCode.create_for_user(user)
        send_mail(
            subject="Sender+ verification code",
            message=f"Your Sender+ verification code is {verification.code}.",
            from_email=None,
            recipient_list=[user.email],
        )
        return Response(
            {"message": "Account created. Verification code sent."},
            status=status.HTTP_201_CREATED,
        )


class SigninView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SigninSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response({"message": "Signed in successfully."})


class SendCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        verification = EmailVerificationCode.create_for_user(user)
        send_mail(
            subject="Sender+ verification code",
            message=f"Your Sender+ verification code is {verification.code}.",
            from_email=None,
            recipient_list=[user.email],
        )
        return Response({"message": "Verification code sent."})


class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = serializer.validated_data["verification"]
        verification.mark_used()
        return Response({"message": "Email verified."})
