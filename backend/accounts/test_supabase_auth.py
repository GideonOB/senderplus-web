from io import BytesIO
import json
import time
from types import SimpleNamespace
from unittest.mock import patch
from urllib.error import URLError
from uuid import uuid4

from cryptography.hazmat.primitives.asymmetric import ec, rsa
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
import jwt
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APIRequestFactory

from accounts.admin import UserRoleAdmin
from accounts.models import CustomerProfile, EmailVerificationCode, SupabaseIdentity, UserRole
from packages.models import Package

User = get_user_model()
PROJECT = "https://senderplus-test.supabase.co"


@override_settings(SUPABASE_AUTH_ENABLED=True, SUPABASE_URL=PROJECT,
                   SUPABASE_PUBLISHABLE_KEY="sb_publishable_test_only")
class SupabaseAuthTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.key = ec.generate_private_key(ec.SECP256R1())

    def setUp(self):
        self.client = APIClient()
        self.subject = str(uuid4())
        self.remote = {
            "id": self.subject, "email": "customer@example.com",
            "email_confirmed_at": "2026-11-19T12:00:00Z", "is_anonymous": False,
            "user_metadata": {"first_name": "Ama", "phone_number": "0241234567"},
        }
        self.key_patch = patch("accounts.supabase_auth.jwks_client")
        self.keys = self.key_patch.start()
        self.keys.return_value.get_signing_key_from_jwt.return_value = SimpleNamespace(key=self.key.public_key())
        self.addCleanup(self.key_patch.stop)
        self.http_patch = patch("accounts.supabase_auth.urlopen")
        self.http = self.http_patch.start()
        self.http.side_effect = lambda *a, **kw: BytesIO(json.dumps(self.remote).encode())
        self.addCleanup(self.http_patch.stop)

    def token(self, changes=None, key=None, algorithm="ES256", omit=()):
        claims = {
            "iss": f"{PROJECT}/auth/v1", "aud": "authenticated", "sub": self.subject,
            "iat": int(time.time()), "exp": int(time.time()) + 300,
            "role": "authenticated", "is_anonymous": False,
        }
        claims.update(changes or {})
        for field in omit:
            claims.pop(field, None)
        return jwt.encode(claims, key or self.key, algorithm=algorithm, headers={"kid": "test-key"})

    def bootstrap(self, token=None):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token or self.token()}")
        return self.client.post("/auth/session")

    def existing_user(self, **kwargs):
        user = User.objects.create_user(username="existing", email="customer@example.com", password="OriginalPassword123!", **kwargs)
        CustomerProfile.objects.create(user=user, phone_number="0241234567", address="Accra", email_verified=True)
        return user

    def test_bootstrap_is_idempotent_and_seeds_customer_only(self):
        self.remote["user_metadata"].update({"roles": ["admin"], "role": "manager", "is_staff": True, "email_verified": True})
        response = self.bootstrap(self.token({"user_metadata": {"role": "admin"}, "app_metadata": {"role": "admin"}}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["profile"]["roles"], ["customer"])
        user = SupabaseIdentity.objects.get().user
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.first_name, "Ama")
        self.assertTrue(user.customer_profile.email_verified)
        self.assertEqual(self.bootstrap().status_code, 200)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(UserRole.objects.count(), 1)
        self.assertEqual(self.http.call_args.kwargs["timeout"], 5)

    def test_bootstrap_does_not_overwrite_profile_on_next_signin(self):
        self.bootstrap()
        self.client.patch("/auth/profile", {"first_name": "Updated"}, format="json")
        self.assertEqual(self.bootstrap().data["profile"]["first_name"], "Updated")

    def test_expired_wrong_issuer_wrong_audience_and_invalid_subject_are_rejected(self):
        for changes in ({"exp": 1}, {"iss": "https://other.supabase.co/auth/v1"},
                        {"aud": "service_role"}, {"sub": "not-a-uuid"},
                        {"is_anonymous": True}, {"role": "service_role"}, {"iat": int(time.time()) + 600}):
            with self.subTest(changes=changes):
                self.assertEqual(self.bootstrap(self.token(changes)).status_code, 401)
        self.assertEqual(User.objects.count(), 0)
        self.http.assert_not_called()

    def test_missing_required_claims_are_rejected(self):
        for claim in ("sub", "iss", "aud", "exp", "iat", "is_anonymous"):
            with self.subTest(claim=claim):
                self.assertEqual(self.bootstrap(self.token(omit=[claim])).status_code, 401)

    def test_forged_signature_and_symmetric_algorithm_are_rejected(self):
        other_key = ec.generate_private_key(ec.SECP256R1())
        self.assertEqual(self.bootstrap(self.token(key=other_key)).status_code, 401)
        self.assertEqual(self.bootstrap(self.token(key="x" * 64, algorithm="HS256")).status_code, 401)
        self.assertEqual(self.bootstrap("not.a.jwt").status_code, 401)

    def test_rs256_is_also_supported(self):
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.keys.return_value.get_signing_key_from_jwt.return_value = SimpleNamespace(key=key.public_key())
        self.assertEqual(self.bootstrap(self.token(key=key, algorithm="RS256")).status_code, 200)

    def test_unconfirmed_or_anonymous_auth_user_cannot_bootstrap(self):
        for change in ({"email_confirmed_at": None}, {"is_anonymous": True}, {"id": str(uuid4())}):
            with self.subTest(change=change):
                original = self.remote.copy()
                self.remote.update(change)
                self.assertEqual(self.bootstrap().status_code, 401)
                self.remote = original
        self.assertEqual(User.objects.count(), 0)

    def test_network_failures_fail_closed_and_are_retryable(self):
        self.http.side_effect = URLError("offline")
        self.assertEqual(self.bootstrap().status_code, 503)
        self.assertEqual(User.objects.count(), 0)
        self.keys.return_value.get_signing_key_from_jwt.side_effect = jwt.PyJWKClientConnectionError("offline")
        self.assertEqual(self.bootstrap().status_code, 503)

    def test_matching_existing_email_never_auto_links(self):
        self.existing_user()
        response = self.bootstrap()
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "account_link_required")
        self.assertFalse(SupabaseIdentity.objects.exists())

    def test_unknown_identity_cannot_access_profile_until_bootstrap(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token()}")
        self.assertEqual(self.client.get("/auth/profile").status_code, 403)
        self.assertFalse(User.objects.exists())

    def test_disabled_django_account_is_denied_even_with_valid_token(self):
        self.bootstrap()
        User.objects.update(is_active=False)
        self.assertEqual(self.client.get("/auth/profile").status_code, 401)
        self.assertEqual(self.bootstrap().status_code, 401)

    def test_profile_patch_cannot_assign_roles_or_staff_flags(self):
        self.bootstrap()
        response = self.client.patch("/auth/profile", {"roles": ["admin"], "is_staff": True, "email_verified": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["roles"], ["customer"])
        self.assertFalse(User.objects.get().is_staff)
        self.assertTrue(User.objects.get().customer_profile.email_verified)

    def test_role_changes_are_effective_without_reissuing_jwt(self):
        self.bootstrap()
        user = User.objects.get()
        package = Package.objects.create(sender_name="A", sender_phone="1", sender_address="Accra",
            recipient_name="B", recipient_phone="2", recipient_address="Kumasi", package_name="Book", package_type="Document", weight="1.5")
        path = f"/advance-status/{package.tracking_id}"
        self.assertEqual(self.client.post(path).status_code, 403)
        role = UserRole.objects.create(user=user, role="driver")
        self.assertEqual(self.client.post(path).status_code, 403)
        for allowed in ("dispatcher", "manager", "admin"):
            role.role = allowed
            role.save()
            self.assertEqual(self.client.post(path).status_code, 200)
        role.delete()
        self.assertEqual(self.client.post(path).status_code, 403)

    def test_link_requires_both_identities_and_retires_legacy_credentials(self):
        user = self.existing_user()
        UserRole.objects.create(user=user, role="driver")
        legacy = Token.objects.create(user=user)
        code = EmailVerificationCode.create_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {legacy.key}")
        response = self.client.post("/auth/link-supabase", {"access_token": self.token()}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.data["profile"]["roles"]), {"customer", "driver"})
        self.assertEqual(SupabaseIdentity.objects.get().user, user)
        user.refresh_from_db(); code.refresh_from_db()
        self.assertFalse(user.has_usable_password())
        self.assertTrue(code.used)
        self.assertFalse(Token.objects.filter(user=user).exists())
        self.assertEqual(self.client.get("/auth/profile").status_code, 401)
        self.assertEqual(self.bootstrap().status_code, 200)

    def test_link_rejects_different_email_and_privileged_account(self):
        user = self.existing_user()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.create(user=user).key}")
        self.remote["email"] = "another@example.com"
        self.assertEqual(self.client.post("/auth/link-supabase", {"access_token": self.token()}, format="json").status_code, 403)
        self.remote["email"] = user.email
        user.is_staff = True; user.save()
        self.assertEqual(self.client.post("/auth/link-supabase", {"access_token": self.token()}, format="json").status_code, 403)
        self.assertFalse(SupabaseIdentity.objects.exists())

    def test_link_cannot_reassign_an_existing_identity(self):
        other = User.objects.create_user(username="other")
        SupabaseIdentity.objects.create(user=other, subject=self.subject)
        user = self.existing_user()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.create(user=user).key}")
        self.assertEqual(self.client.post("/auth/link-supabase", {"access_token": self.token()}, format="json").status_code, 409)
        self.assertEqual(SupabaseIdentity.objects.get().user, other)

    def test_linked_accounts_cannot_use_legacy_codes_or_password_change(self):
        self.bootstrap()
        user = User.objects.get()
        legacy = Token.objects.create(user=user)
        code = EmailVerificationCode.create_for_user(user)
        self.assertEqual(self.client.post("/auth/change-password", {}).status_code, 403)
        self.client.credentials()
        self.assertEqual(self.client.post("/auth/send-code", {"email": user.email}).status_code, 403)
        self.assertEqual(self.client.post("/auth/verify-code", {"email": user.email, "code": code.code}).status_code, 403)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {legacy.key}")
        self.assertEqual(self.client.get("/auth/profile").status_code, 401)

    @override_settings(SUPABASE_AUTH_ENABLED=False)
    def test_disabled_feature_rejects_bearer_but_legacy_still_works(self):
        self.assertEqual(self.bootstrap().status_code, 401)
        user = self.existing_user()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {Token.objects.create(user=user).key}")
        self.assertEqual(self.client.get("/auth/profile").status_code, 200)

    def test_role_admin_mutations_require_superuser(self):
        user = self.existing_user(is_staff=True)
        role_admin = UserRoleAdmin(UserRole, admin.site)
        request = APIRequestFactory().get("/"); request.user = user
        for method in (role_admin.has_add_permission, role_admin.has_change_permission, role_admin.has_delete_permission):
            self.assertFalse(method(request))
        user.is_superuser = True
        self.assertTrue(role_admin.has_add_permission(request))
