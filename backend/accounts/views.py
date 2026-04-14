from django.contrib.auth import login
from django.core.mail import send_mail
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomerProfile, EmailVerificationCode, TrustedDevice
from .serializers import (
    CustomerProfileSerializer,
    PasswordChangeSerializer,
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


def _send_verification_code(user, purpose, challenge_token=""):
    verification = EmailVerificationCode.create_for_user(
        user=user,
        purpose=purpose,
        challenge_token=challenge_token,
    )
    send_mail(
        subject="Sender+ verification code",
        message=f"Your Sender+ verification code is {verification.code}.",
        from_email=None,
        recipient_list=[user.email],
    )
    return verification


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _send_verification_code(user, EmailVerificationCode.PURPOSE_SIGNUP)
        return Response(
            {
                "message": "Account created. Verification code sent.",
                "requires_otp": True,
                "purpose": EmailVerificationCode.PURPOSE_SIGNUP,
            },
            status=status.HTTP_201_CREATED,
        )


class SigninView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SigninSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        device_id = serializer.validated_data.get("device_id")

        trusted = False
        if device_id:
            trusted_device = TrustedDevice.objects.filter(user=user, device_id=device_id).first()
            if trusted_device and trusted_device.is_valid():
                trusted = True
                trusted_device.save(update_fields=["last_used_at"])

        if not trusted:
            challenge_token = EmailVerificationCode.generate_challenge_token()
            _send_verification_code(
                user,
                EmailVerificationCode.PURPOSE_SIGNIN_DEVICE,
                challenge_token=challenge_token,
            )
            return Response(
                {
                    "message": "Verification code sent for this new browser/device.",
                    "requires_otp": True,
                    "challenge_token": challenge_token,
                    "purpose": EmailVerificationCode.PURPOSE_SIGNIN_DEVICE,
                },
                status=status.HTTP_200_OK,
            )

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
        serializer = SendCodeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        purpose = serializer.validated_data["purpose"]
        user = serializer.validated_data["user"]
        challenge_token = ""
        if purpose == EmailVerificationCode.PURPOSE_SIGNIN_DEVICE:
            challenge_token = EmailVerificationCode.generate_challenge_token()

        _send_verification_code(user, purpose, challenge_token=challenge_token)

        return Response(
            {
                "message": "Verification code sent.",
                "purpose": purpose,
                "challenge_token": challenge_token,
            }
        )


class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = serializer.validated_data["verification"]
        user = serializer.validated_data["user"]
        purpose = serializer.validated_data["purpose"]
        device_id = serializer.validated_data.get("device_id")

        verification.mark_used()

        profile, _ = CustomerProfile.objects.get_or_create(
            user=user,
            defaults={"phone_number": "0240000000", "address": ""},
        )

        if purpose == EmailVerificationCode.PURPOSE_SIGNUP:
            if not profile.email_verified:
                profile.email_verified = True
                profile.save(update_fields=["email_verified"])

            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Email verified.",
                    "token": token.key,
                    "profile": _auth_payload(user),
                }
            )

        if purpose == EmailVerificationCode.PURPOSE_SIGNIN_DEVICE:
            if device_id:
                TrustedDevice.objects.get_or_create(user=user, device_id=device_id)

            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Device verified and signed in.",
                    "token": token.key,
                    "profile": _auth_payload(user),
                }
            )

        return Response({"message": "Verification successful."})


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        verification = serializer.validated_data["verification"]

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        verification.mark_used()

        return Response({"message": "Password updated successfully."})


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
