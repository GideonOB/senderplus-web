from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
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
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "address",
            "email_verified",
        ]
        read_only_fields = ["email_verified"]

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
    device_id = serializers.CharField(required=False, allow_blank=True, max_length=128)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        password = attrs.get("password")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        attrs["device_id"] = attrs.get("device_id", "").strip()
        return attrs


class SendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    purpose = serializers.ChoiceField(
        choices=[
            EmailVerificationCode.PURPOSE_SIGNUP,
            EmailVerificationCode.PURPOSE_SIGNIN_DEVICE,
            EmailVerificationCode.PURPOSE_PASSWORD_CHANGE,
        ],
        required=False,
        default=EmailVerificationCode.PURPOSE_SIGNUP,
    )

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        purpose = attrs.get("purpose", EmailVerificationCode.PURPOSE_SIGNUP)
        request = self.context.get("request")

        if purpose == EmailVerificationCode.PURPOSE_PASSWORD_CHANGE:
            if not request or not request.user or not request.user.is_authenticated:
                raise serializers.ValidationError("Authentication required for password change code.")
            attrs["user"] = request.user
            return attrs

        if not email:
            raise serializers.ValidationError("Email is required for this verification flow.")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found for this email.")

        attrs["user"] = user
        attrs["email"] = email
        return attrs


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    purpose = serializers.ChoiceField(
        choices=[
            EmailVerificationCode.PURPOSE_SIGNUP,
            EmailVerificationCode.PURPOSE_SIGNIN_DEVICE,
            EmailVerificationCode.PURPOSE_PASSWORD_CHANGE,
        ],
        required=False,
        default=EmailVerificationCode.PURPOSE_SIGNUP,
    )
    challenge_token = serializers.CharField(required=False, allow_blank=True, max_length=64)
    device_id = serializers.CharField(required=False, allow_blank=True, max_length=128)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        code = attrs.get("code")
        purpose = attrs.get("purpose", EmailVerificationCode.PURPOSE_SIGNUP)
        challenge_token = attrs.get("challenge_token", "").strip()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found for this email.")

        verification = (
            EmailVerificationCode.objects.filter(user=user, code=code, purpose=purpose)
            .order_by("-created_at")
            .first()
        )
        if not verification or not verification.is_valid():
            raise serializers.ValidationError("Invalid or expired verification code.")

        if purpose == EmailVerificationCode.PURPOSE_SIGNIN_DEVICE:
            if not challenge_token:
                raise serializers.ValidationError("Challenge token is required.")
            if verification.challenge_token != challenge_token:
                raise serializers.ValidationError("Invalid challenge token.")

        attrs["verification"] = verification
        attrs["user"] = user
        attrs["purpose"] = purpose
        attrs["device_id"] = attrs.get("device_id", "").strip()
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    code = serializers.CharField(write_only=True, min_length=6, max_length=6)

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError("Current password is incorrect.")

        validate_password(attrs["new_password"], user=user)

        verification = (
            EmailVerificationCode.objects.filter(
                user=user,
                code=attrs["code"],
                purpose=EmailVerificationCode.PURPOSE_PASSWORD_CHANGE,
            )
            .order_by("-created_at")
            .first()
        )
        if not verification or not verification.is_valid():
            raise serializers.ValidationError("Invalid or expired password change code.")

        attrs["verification"] = verification
        return attrs
