from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import EmailVerificationCode


class AccountsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def test_signup_creates_user_and_code(self):
        payload = {
            "email": "newuser@example.com",
            "password": "securepass123",
        }

        response = self.client.post("/auth/signup", payload)

        self.assertEqual(response.status_code, 201)
        user = self.user_model.objects.get(email="newuser@example.com")
        self.assertTrue(
            EmailVerificationCode.objects.filter(user=user).exists()
        )

    def test_send_and_verify_code(self):
        user = self.user_model.objects.create_user(
            username="user@example.com",
            email="user@example.com",
            password="securepass123",
        )

        send_response = self.client.post(
            "/auth/send-code", {"email": "user@example.com"}
        )
        self.assertEqual(send_response.status_code, 200)

        code = EmailVerificationCode.objects.filter(user=user).latest("created_at")
        verify_response = self.client.post(
            "/auth/verify-code",
            {"email": "user@example.com", "code": code.code},
        )

        self.assertEqual(verify_response.status_code, 200)
        code.refresh_from_db()
        self.assertTrue(code.used)
