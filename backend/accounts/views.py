from django.contrib.auth import login
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomerProfile, EmailVerificationCode
from .serializers import (
    CustomerProfileSerializer,
    SendCodeSerializer,
    SigninSerializer,
    SignupSerializer,
    VerifyCodeSerializer,
)


def _auth_payload(user):
    profile, _ = CustomerProfile.objects.get_or_create(
        user=user,
        defaults={"phone_number": "0240000000", "address": ""},
    )
    return CustomerProfileSerializer(profile).data


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verification = EmailVerificationCode.create_for_user(user)
        token, _ = Token.objects.get_or_create(user=user)
        send_mail(
            subject="Sender+ verification code",
            message=f"Your Sender+ verification code is {verification.code}.",
            from_email=None,
            recipient_list=[user.email],
        )
        return Response(
            {
                "message": "Account created. Verification code sent.",
                "token": token.key,
                "profile": _auth_payload(user),
            },
            status=status.HTTP_201_CREATED,
        )


class SigninView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SigninSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "Signed in successfully.",
                "token": token.key,
                "profile": _auth_payload(user),
            }
        )


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


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(
            user=request.user,
            defaults={"phone_number": "0240000000", "address": ""},
        )
        return Response(CustomerProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(
            user=request.user,
            defaults={"phone_number": "0240000000", "address": ""},
        )
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
