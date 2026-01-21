from rest_framework import serializers
from .models import Package, STATUS_CHOICES


class PackageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = [
            "sender_name",
            "sender_phone",
            "sender_email",
            "sender_address",
            "recipient_name",
            "recipient_phone",
            "recipient_email",
            "recipient_address",
            "package_name",
            "package_type",
            "weight",
            "value",
            "description",
            "photo",
        ]

    # Make email optional like in your FastAPI code
    sender_email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    recipient_email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    value = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    description = serializers.CharField(required=False, allow_blank=True)


class PackageDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Package
        fields = [
            "tracking_id",
            "sender_name",
            "sender_phone",
            "sender_email",
            "sender_address",
            "recipient_name",
            "recipient_phone",
            "recipient_email",
            "recipient_address",
            "package_name",
            "package_type",
            "weight",
            "value",
            "description",
            "photo",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]

    def get_status_display(self, obj):
        return obj.get_status_display()