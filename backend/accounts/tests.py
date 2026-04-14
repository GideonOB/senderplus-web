from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import CustomerProfile, EmailVerificationCode, TrustedDevice


class AccountsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def test_signup_creates_user_profile_and_requires_verification(self):
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
        self.assertTrue(
            EmailVerificationCode.objects.filter(
                user=user, purpose=EmailVerificationCode.PURPOSE_SIGNUP
            ).exists()
        )
        self.assertTrue(CustomerProfile.objects.filter(user=user).exists())
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_verify_signup_code_returns_token(self):
        payload = {
            "email": "verified@example.com",
            "password": "securepass123",
            "first_name": "Ama",
            "last_name": "Mensah",
            "phone_number": "0241234567",
            "address": "Legon Hall, University of Ghana",
        }
        self.client.post("/auth/signup", payload)
        user = self.user_model.objects.get(email="verified@example.com")
        code = EmailVerificationCode.objects.filter(user=user).latest("created_at")

        verify_response = self.client.post(
            "/auth/verify-code",
            {
                "email": "verified@example.com",
                "code": code.code,
                "purpose": EmailVerificationCode.PURPOSE_SIGNUP,
            },
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertIn("token", verify_response.data)
        profile = CustomerProfile.objects.get(user=user)
        self.assertTrue(profile.email_verified)

    def test_signin_requires_otp_for_new_device_then_trusts_it(self):
        user = self.user_model.objects.create_user(
            username="user@example.com",
            email="user@example.com",
            password="securepass123",
        )
        CustomerProfile.objects.create(
            user=user,
            phone_number="0241234567",
            address="Kumasi",
            email_verified=True,
        )

        signin_response = self.client.post(
            "/auth/signin",
            {
                "email": "user@example.com",
                "password": "securepass123",
                "device_id": "device-1",
            },
        )
        self.assertEqual(signin_response.status_code, 200)
        self.assertTrue(signin_response.data["requires_otp"])

        code = EmailVerificationCode.objects.filter(
            user=user, purpose=EmailVerificationCode.PURPOSE_SIGNIN_DEVICE
        ).latest("created_at")

        verify_response = self.client.post(
            "/auth/verify-code",
            {
                "email": "user@example.com",
                "code": code.code,
                "purpose": EmailVerificationCode.PURPOSE_SIGNIN_DEVICE,
                "challenge_token": signin_response.data["challenge_token"],
                "device_id": "device-1",
            },
        )
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(TrustedDevice.objects.filter(user=user, device_id="device-1").exists())

        trusted_signin = self.client.post(
            "/auth/signin",
            {
                "email": "user@example.com",
                "password": "securepass123",
                "device_id": "device-1",
            },
        )
        self.assertEqual(trusted_signin.status_code, 200)
        self.assertIn("token", trusted_signin.data)

    def test_password_change_requires_code(self):
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
            email_verified=True,
        )
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        send_response = self.client.post(
            "/auth/send-code",
            {"purpose": EmailVerificationCode.PURPOSE_PASSWORD_CHANGE},
        )
        self.assertEqual(send_response.status_code, 200)

        code = EmailVerificationCode.objects.filter(
            user=user, purpose=EmailVerificationCode.PURPOSE_PASSWORD_CHANGE
        ).latest("created_at")

        change_response = self.client.post(
            "/auth/change-password",
            {
                "current_password": "securepass123",
                "new_password": "newsecurepass123",
                "code": code.code,
            },
        )
        self.assertEqual(change_response.status_code, 200)

        user.refresh_from_db()
        self.assertTrue(user.check_password("newsecurepass123"))

    def test_profile_requires_token_and_can_update(self):
        user = self.user_model.objects.create_user(
            username="user3@example.com",
            email="user3@example.com",
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
        self.assertEqual(profile_response.data["email"], "user3@example.com")

        update_response = self.client.patch(
            "/auth/profile",
            {"phone_number": "0242222222", "address": "Tema"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["phone_number"], "0242222222")
