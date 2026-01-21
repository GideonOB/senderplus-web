from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Package, STATUS_ORDER


class PackageApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_submit_package_creates_record(self):
        payload = {
            "sender_name": "Alice",
            "sender_phone": "123456789",
            "sender_address": "1 Sender Lane",
            "recipient_name": "Bob",
            "recipient_phone": "987654321",
            "recipient_address": "2 Recipient Road",
            "package_name": "Book",
            "package_type": "Document",
            "weight": "1.5",
        }

        response = self.client.post("/submit-package", payload, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertIn("tracking_id", response.data)
        self.assertEqual(Package.objects.count(), 1)

    def test_track_package_returns_status_display(self):
        package = Package.objects.create(
            sender_name="Alice",
            sender_phone="123456789",
            sender_address="1 Sender Lane",
            recipient_name="Bob",
            recipient_phone="987654321",
            recipient_address="2 Recipient Road",
            package_name="Book",
            package_type="Document",
            weight="1.5",
        )

        response = self.client.get(f"/track/{package.tracking_id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], STATUS_ORDER[0])
        self.assertEqual(
            response.data["status_display"], package.get_status_display()
        )

    def test_advance_status_requires_staff(self):
        package = Package.objects.create(
            sender_name="Alice",
            sender_phone="123456789",
            sender_address="1 Sender Lane",
            recipient_name="Bob",
            recipient_phone="987654321",
            recipient_address="2 Recipient Road",
            package_name="Book",
            package_type="Document",
            weight="1.5",
        )

        response = self.client.post(
            f"/advance-status/{package.tracking_id}"
        )

        self.assertEqual(response.status_code, 403)

        user_model = get_user_model()
        admin_user = user_model.objects.create_user(
            username="admin", password="password", is_staff=True
        )
        self.client.force_authenticate(user=admin_user)

        response = self.client.post(
            f"/advance-status/{package.tracking_id}"
        )

        self.assertEqual(response.status_code, 200)
        package.refresh_from_db()
        self.assertEqual(package.status, STATUS_ORDER[1])
