from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import CustomerProfile, EmailVerificationCode


class AccountsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def test_signup_creates_user_profile_code_and_token(self):
        payload = {
            "email": "newuser@example.com",
            "password": "securepass123",
            "first_name": "Ama",
            "last_name": "Mensah",
            "phone_number": "0241234567",
            "address": "Legon Hall, University of Ghana",
        }

        response = self.client.post("/auth/signup", payload)

        self.assertEqual(response.status_code, 201)
        user = self.user_model.objects.get(email="newuser@example.com")
        self.assertTrue(EmailVerificationCode.objects.filter(user=user).exists())
        self.assertTrue(CustomerProfile.objects.filter(user=user).exists())
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_send_and_verify_code(self):
        user = self.user_model.objects.create_user(
            username="user@example.com",
            email="user@example.com",
            password="securepass123",
        )
        CustomerProfile.objects.create(
            user=user,
            phone_number="0241234567",
            address="Kumasi",
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

    def test_profile_requires_token_and_can_update(self):
        user = self.user_model.objects.create_user(
            username="user2@example.com",
            email="user2@example.com",
            password="securepass123",
            first_name="Kojo",
            last_name="Asante",
        )
        CustomerProfile.objects.create(
            user=user,
            phone_number="0241111111",
            address="Accra",
        )
        token, _ = Token.objects.get_or_create(user=user)

        unauthorized = self.client.get("/auth/profile")
        self.assertEqual(unauthorized.status_code, 401)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        profile_response = self.client.get("/auth/profile")
        self.assertEqual(profile_response.status_code, 200)
        self.assertEqual(profile_response.data["email"], "user2@example.com")

        update_response = self.client.patch(
            "/auth/profile",
            {"phone_number": "0242222222", "address": "Tema"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["phone_number"], "0242222222")
