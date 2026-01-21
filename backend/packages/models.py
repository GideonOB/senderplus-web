from django.db import models
import uuid

# Status lifecycle – same text as your FastAPI version
STATUS_CHOICES = [
    ("waiting_bus", "Waiting for package to reach bus station"),
    ("en_route_campus", "Package in our van en route to campus"),
    ("at_campus_hub", "Package at our campus hub"),
    ("delivered", "Package delivered to recipient"),
]

STATUS_ORDER = [
    "waiting_bus",
    "en_route_campus",
    "at_campus_hub",
    "delivered",
]


class Package(models.Model):
    tracking_id = models.CharField(
        max_length=32, unique=True, editable=False, db_index=True
    )

    # Sender
    sender_name = models.CharField(max_length=255)
    sender_phone = models.CharField(max_length=50)
    sender_email = models.EmailField(blank=True, null=True)
    sender_address = models.CharField(max_length=255)

    # Recipient
    recipient_name = models.CharField(max_length=255)
    recipient_phone = models.CharField(max_length=50)
    recipient_email = models.EmailField(blank=True, null=True)
    recipient_address = models.CharField(max_length=255)

    # Package
    package_name = models.CharField(max_length=255)
    package_type = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=10, decimal_places=2)
    value = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    description = models.TextField(blank=True, null=True)

    photo = models.ImageField(
        upload_to="package_photos/", blank=True, null=True
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="waiting_bus",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.tracking_id:
            # mimic your uuid4()[:8] style
            self.tracking_id = str(uuid.uuid4())[:8]
        super().save(*args, **kwargs)

    def advance_status(self):
        """
        Move to the next status in STATUS_ORDER, if possible.
        """
        try:
            idx = STATUS_ORDER.index(self.status)
        except ValueError:
            idx = -1

        if 0 <= idx < len(STATUS_ORDER) - 1:
            self.status = STATUS_ORDER[idx + 1]
            self.save()