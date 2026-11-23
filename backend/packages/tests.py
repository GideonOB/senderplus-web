from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import UserRole

from .models import Package, STATUS_ORDER


class PackageApiTests(TestCase):
    payload = {
        "sender_name": "Alice",
        "sender_phone": "123456789",
        "sender_email": "alice@example.com",
        "sender_address": "1 Sender Lane",
        "recipient_name": "Bob",
        "recipient_phone": "987654321",
        "recipient_email": "bob@example.com",
        "recipient_address": "2 Recipient Road",
        "package_name": "Book",
        "package_type": "Document",
        "weight": "1.5",
        "value": "350.00",
        "description": "Private parcel description",
    }

    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.alice = user_model.objects.create_user(
            username="alice", email=cls.payload["sender_email"]
        )
        cls.bob = user_model.objects.create_user(username="bob")

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse("my-deliveries")

    def authenticate_as(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def create_package(self, **overrides):
        return Package.objects.create(**(self.payload | overrides))

    def get_detail(self, package):
        return self.client.get(reverse("my-delivery-detail", args=[package.tracking_id]))

    def test_guest_submission_creates_unclaimed_record(self):
        response = self.client.post("/submit-package", self.payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"message", "tracking_id"})
        package = Package.objects.get(tracking_id=response.json()["tracking_id"])
        self.assertIsNone(package.booked_by_id)

    def test_authenticated_submission_uses_the_legacy_booking_account(self):
        self.authenticate_as(self.alice)

        response = self.client.post("/submit-package", self.payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()), {"message", "tracking_id"})
        package = Package.objects.get(tracking_id=response.json()["tracking_id"])
        self.assertEqual(package.booked_by_id, self.alice.pk)
        self.assertEqual(self.get_detail(package).status_code, 200)

    def test_submit_package_ignores_client_booking_account_fields(self):
        spoofed_payload = self.payload | {
            "booked_by": self.bob.pk,
            "booked_by_id": self.bob.pk,
        }

        for account in (None, self.alice):
            with self.subTest(authenticated=account is not None):
                if account is not None:
                    self.authenticate_as(account)
                response = self.client.post("/submit-package", spoofed_payload, format="multipart")

                self.assertEqual(response.status_code, 200)
                package = Package.objects.get(tracking_id=response.json()["tracking_id"])
                self.assertEqual(package.booked_by, account)

    def test_deleting_booking_account_preserves_delivery(self):
        package = self.create_package(booked_by=self.alice)

        self.alice.delete()

        package.refresh_from_db()
        self.assertIsNone(package.booked_by_id)
        self.assertEqual(package.package_name, self.payload["package_name"])

    def test_public_tracking_returns_only_status_fields_even_for_booking_account(self):
        package = self.create_package(
            booked_by=self.alice, photo="package_photos/private-photo.jpg"
        )

        for account in (None, self.alice):
            with self.subTest(authenticated=account is not None):
                if account is not None:
                    self.authenticate_as(account)
                response = self.client.get(f"/track/{package.tracking_id}")

                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(set(data), {
                    "tracking_id", "status", "status_display", "created_at", "updated_at",
                })
                self.assertEqual(data["tracking_id"], package.tracking_id)
                self.assertEqual(data["status"], STATUS_ORDER[0])
                self.assertEqual(data["status_display"], package.get_status_display())
                self.assertEqual(parse_datetime(data["created_at"]), package.created_at)
                self.assertEqual(parse_datetime(data["updated_at"]), package.updated_at)

    def test_private_delivery_endpoints_require_authentication(self):
        package = self.create_package(booked_by=self.alice)

        self.assertEqual(self.client.get(self.list_url).status_code, 401)
        self.assertEqual(self.get_detail(package).status_code, 401)

    def test_private_delivery_endpoints_are_scoped_to_booking_account(self):
        own_package = self.create_package(booked_by=self.alice)
        other_package = self.create_package(booked_by=self.bob)
        self.authenticate_as(self.alice)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        summary, = response.json()["results"]
        self.assertEqual(summary["tracking_id"], own_package.tracking_id)
        self.assertEqual(set(summary), {
            "tracking_id", "package_name", "status", "status_display", "created_at", "updated_at",
        })

        own_detail = self.get_detail(own_package)
        self.assertEqual(own_detail.status_code, 200)
        self.assertEqual(own_detail.json()["tracking_id"], own_package.tracking_id)
        self.assertEqual(own_detail.json()["recipient_address"], self.payload["recipient_address"])

        other_detail = self.get_detail(other_package)
        missing_detail = self.client.get(reverse("my-delivery-detail", args=["unknown"]))
        self.assertEqual(other_detail.status_code, 404)
        self.assertEqual(missing_detail.status_code, 404)
        self.assertEqual(other_detail.json(), missing_detail.json())

    def test_matching_contact_email_does_not_grant_access_to_unclaimed_delivery(self):
        package = self.create_package()
        self.authenticate_as(self.alice)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"], [])
        self.assertEqual(self.get_detail(package).status_code, 404)

    def test_driver_role_alone_does_not_grant_private_delivery_access(self):
        package = self.create_package(booked_by=self.alice)
        UserRole.objects.create(user=self.bob, role=UserRole.Role.DRIVER)
        self.authenticate_as(self.bob)

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"], [])
        self.assertEqual(self.get_detail(package).status_code, 404)

    def test_private_detail_cannot_be_used_to_change_the_booking_account(self):
        package = self.create_package(booked_by=self.alice)
        self.authenticate_as(self.alice)

        response = self.client.patch(
            reverse("my-delivery-detail", args=[package.tracking_id]),
            {"booked_by": self.bob.pk},
            format="json",
        )

        self.assertEqual(response.status_code, 405)
        package.refresh_from_db()
        self.assertEqual(package.booked_by_id, self.alice.pk)

    def test_private_list_paginates_by_newest_first_with_stable_ties(self):
        recent_packages = [self.create_package(booked_by=self.alice) for _ in range(20)]
        older_package = self.create_package(booked_by=self.alice)
        self.create_package(booked_by=self.bob)
        now = timezone.now()
        Package.objects.filter(pk__in=[package.pk for package in recent_packages]).update(
            created_at=now
        )
        Package.objects.filter(pk=older_package.pk).update(created_at=now - timedelta(days=1))
        self.authenticate_as(self.alice)

        first_page = self.client.get(self.list_url)
        self.assertEqual(first_page.status_code, 200)
        first_data = first_page.json()
        self.assertEqual(first_data["count"], 21)
        self.assertIsNone(first_data["previous"])
        self.assertEqual(
            [result["tracking_id"] for result in first_data["results"]],
            [package.tracking_id for package in reversed(recent_packages)],
        )

        second_page = self.client.get(first_data["next"])
        self.assertEqual(second_page.status_code, 200)
        second_data = second_page.json()
        self.assertEqual(second_data["count"], 21)
        self.assertIsNone(second_data["next"])
        self.assertEqual(
            [result["tracking_id"] for result in second_data["results"]],
            [older_package.tracking_id],
        )
        self.assertEqual(self.client.get(second_data["previous"]).json(), first_data)

    def test_advance_status_requires_staff(self):
        package = self.create_package(booked_by=self.alice)
        status_url = f"/advance-status/{package.tracking_id}"

        response = self.client.post(status_url)

        self.assertIn(response.status_code, [401, 403])

        user_model = get_user_model()
        staff_user = user_model.objects.create_user(username="staff", is_staff=True)
        self.authenticate_as(staff_user)

        response = self.client.post(
            status_url, {"booked_by": self.bob.pk}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sender_address"], self.payload["sender_address"])
        package.refresh_from_db()
        self.assertEqual(package.status, STATUS_ORDER[1])
        self.assertEqual(package.booked_by_id, self.alice.pk)
        self.assertEqual(self.get_detail(package).status_code, 404)
