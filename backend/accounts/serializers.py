from django.contrib.auth import authenticate, get_user_model
from django.core.validators import RegexValidator
from rest_framework import serializers

from .models import CustomerProfile, EmailVerificationCode


User = get_user_model()

ghana_phone_validator = RegexValidator(
    regex=r"^(\+233|0)\d{9}$",
    message="Enter a valid Ghana phone number (e.g., +233241234567 or 0241234567).",
)


class CustomerProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ["first_name", "last_name", "email", "phone_number", "address"]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        user = instance.user
        if "first_name" in user_data:
            user.first_name = user_data["first_name"]
        if "last_name" in user_data:
            user.last_name = user_data["last_name"]

        instance.save()
        user.save(update_fields=["first_name", "last_name"])
        return instance


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)
    phone_number = serializers.CharField(validators=[ghana_phone_validator])
    address = serializers.CharField(required=True, allow_blank=False, max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data["email"].lower()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )
        CustomerProfile.objects.create(
            user=user,
            phone_number=validated_data["phone_number"],
            address=validated_data["address"],
        )
        return user


class SigninSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        password = attrs.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


class SendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found for this email.")
        attrs["user"] = user
        return attrs


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        code = attrs.get("code")
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found for this email.")
        verification = (
            EmailVerificationCode.objects.filter(user=user, code=code)
            .order_by("-created_at")
            .first()
        )
        if not verification or not verification.is_valid():
            raise serializers.ValidationError("Invalid or expired verification code.")
        attrs["verification"] = verification
        attrs["user"] = user
        return attrs
