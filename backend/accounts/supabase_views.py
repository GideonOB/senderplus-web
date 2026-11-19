from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework import permissions, serializers
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomerProfile, SupabaseIdentity, UserRole, ghana_phone_validator
from .serializers import CustomerProfileSerializer, GHANA_REGIONS
from .supabase_auth import (
    LegacyTokenAuthentication, bearer_token, verified_remote_user, verify_access_token,
)

User = get_user_model()


class ProfileSeedSerializer(serializers.Serializer):
    # All values are untrusted profile content. No permissions or account flags here.
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=CustomerProfile.GENDER_CHOICES, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, validators=[ghana_phone_validator], required=False, allow_blank=True)
    street = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    region = serializers.ChoiceField(choices=GHANA_REGIONS, required=False, allow_blank=True)
    ghana_post_gps = serializers.CharField(max_length=40, required=False, allow_blank=True)


def session_payload(user):
    if not user.is_active:
        raise AuthenticationFailed("This account is disabled.")
    profile, _ = CustomerProfile.objects.get_or_create(user=user, defaults={"phone_number": "", "address": ""})
    return {"profile": CustomerProfileSerializer(profile).data}


class SupabaseSessionView(APIView):
    # Verify explicitly: a valid Supabase identity may not have a Django user yet.
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get_authenticate_header(self, request):
        return "Bearer"

    def post(self, request):
        token = bearer_token(request)
        claims = verify_access_token(token)
        remote = verified_remote_user(token, claims)
        identity = SupabaseIdentity.objects.select_related("user").filter(subject=claims["sub"]).first()
        if identity:
            return Response(session_payload(identity.user))

        email = serializers.EmailField().run_validation(remote["email"]).lower()
        # Matching email alone is never proof of ownership of an existing Django account.
        if User.objects.filter(email__iexact=email).exists():
            return Response({
                "code": "account_link_required",
                "detail": "An existing Sender+ account needs to be linked before this sign-in can continue. Contact support.",
            }, status=409)

        seed = ProfileSeedSerializer(data=remote.get("user_metadata") or {})
        seed.is_valid(raise_exception=True)
        fields = dict(seed.validated_data)
        try:
            with transaction.atomic():
                # Deterministic username and unique subject make concurrent bootstrap safe.
                user = User.objects.create_user(
                    username=f"sb_{claims['sub']}", email=email, password=None,
                    first_name=fields.pop("first_name", ""), last_name=fields.pop("last_name", ""),
                )
                SupabaseIdentity.objects.create(user=user, subject=claims["sub"])
                CustomerProfile.objects.create(
                    user=user, email_verified=True,
                    address=", ".join(fields.get(key, "") for key in ("street", "city", "region") if fields.get(key))[:255],
                    **fields,
                )
                UserRole.objects.create(user=user, role=UserRole.Role.CUSTOMER)
        except IntegrityError:
            identity = SupabaseIdentity.objects.select_related("user").filter(subject=claims["sub"]).first()
            if not identity:
                raise
            user = identity.user
        return Response(session_payload(user))


class LinkSupabaseIdentityView(APIView):
    """Migration requires BOTH a legacy login token and a verified Supabase token."""

    authentication_classes = [LegacyTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get("access_token")
        claims = verify_access_token(token)
        remote = verified_remote_user(token, claims)
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            # Privileged accounts need a separate, reviewed administrator migration.
            if user.is_staff or user.is_superuser or not user.is_active:
                raise PermissionDenied("This account requires an administrator-assisted migration.")
            if not CustomerProfile.objects.filter(user=user, email_verified=True).exists():
                raise PermissionDenied("Verify the existing Sender+ email first.")
            if user.email.casefold() != remote["email"].casefold():
                raise PermissionDenied("Both accounts must have the same verified email.")
            try:
                with transaction.atomic():
                    SupabaseIdentity.objects.create(user=user, subject=claims["sub"])
            except IntegrityError:
                return Response({"detail": "An account is already linked to this identity."}, status=409)
            user.set_unusable_password()
            user.save(update_fields=["password"])
            user.auth_token.delete()
            user.email_codes.update(used=True)
            user.trusted_devices.all().delete()
            UserRole.objects.get_or_create(user=user, role=UserRole.Role.CUSTOMER)
        return Response(session_payload(user))
