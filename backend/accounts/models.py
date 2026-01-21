from datetime import timedelta
import random

from django.conf import settings
from django.db import models
from django.utils import timezone


class EmailVerificationCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_codes"
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    @staticmethod
    def generate_code() -> str:
        return f"{random.randint(0, 999999):06d}"

    @classmethod
    def create_for_user(cls, user, ttl_minutes: int = 10):
        return cls.objects.create(
            user=user,
            code=cls.generate_code(),
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    def is_valid(self) -> bool:
        return (not self.used) and self.expires_at >= timezone.now()

    def mark_used(self):
        self.used = True
        self.save(update_fields=["used"])
