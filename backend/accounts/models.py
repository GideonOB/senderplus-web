from datetime import timedelta
import random
import uuid

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


ghana_phone_validator = RegexValidator(
    regex=r"^(\+233|0)\d{9}$",
    message="Enter a valid Ghana phone number (e.g., +233241234567 or 0241234567).",
)


class CustomerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    phone_number = models.CharField(max_length=20, validators=[ghana_phone_validator])
    address = models.CharField(max_length=255)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} profile"


class EmailVerificationCode(models.Model):
    PURPOSE_SIGNUP = "signup"
    PURPOSE_SIGNIN_DEVICE = "signin_device"
    PURPOSE_PASSWORD_CHANGE = "password_change"

    PURPOSE_CHOICES = [
        (PURPOSE_SIGNUP, "Signup"),
        (PURPOSE_SIGNIN_DEVICE, "Signin Device"),
        (PURPOSE_PASSWORD_CHANGE, "Password Change"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_codes"
    )
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=32, choices=PURPOSE_CHOICES, default=PURPOSE_SIGNUP)
    challenge_token = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    @staticmethod
    def generate_code() -> str:
        return f"{random.randint(0, 999999):06d}"

    @staticmethod
    def generate_challenge_token() -> str:
        return uuid.uuid4().hex

    @classmethod
    def create_for_user(
        cls,
        user,
        ttl_minutes: int = 10,
        purpose: str = PURPOSE_SIGNUP,
        challenge_token: str = "",
    ):
        return cls.objects.create(
            user=user,
            code=cls.generate_code(),
            purpose=purpose,
            challenge_token=challenge_token,
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    def is_valid(self) -> bool:
        return (not self.used) and self.expires_at >= timezone.now()

    def mark_used(self):
        self.used = True
        self.save(update_fields=["used"])


class TrustedDevice(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trusted_devices",
    )
    device_id = models.CharField(max_length=128)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "device_id")

    def __str__(self):
        return f"{self.user.email} - {self.device_id}"
