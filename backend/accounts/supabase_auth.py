"""Supabase proves identity; the Render database remains the authority for access."""

from functools import lru_cache
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, TokenAuthentication, get_authorization_header
from rest_framework.exceptions import APIException, AuthenticationFailed, PermissionDenied

from .models import SupabaseIdentity


class IdentityUnavailable(APIException):
    status_code = 503
    default_detail = "Sign-in verification is temporarily unavailable. Please try again."


@lru_cache(maxsize=4)
def jwks_client(project_url):
    # Cache the key set, not individual keys indefinitely; tolerate signing-key rotation.
    return jwt.PyJWKClient(
        f"{project_url}/auth/v1/.well-known/jwks.json",
        cache_keys=False, lifespan=300, timeout=5,
    )


def bearer_token(request):
    parts = get_authorization_header(request).split()
    if not parts or parts[0].lower() != b"bearer":
        return None
    if len(parts) != 2:
        raise AuthenticationFailed("Invalid authorization header.")
    try:
        return parts[1].decode("ascii")
    except UnicodeDecodeError as exc:
        raise AuthenticationFailed("Invalid authorization header.") from exc


def verify_access_token(token):
    if not settings.SUPABASE_AUTH_ENABLED:
        raise AuthenticationFailed("Supabase sign-in is not enabled.")
    if not isinstance(token, str) or not token or len(token) > 16384:
        raise AuthenticationFailed("Invalid access token.")
    try:
        # Never accept an algorithm chosen freely by the token, including HS256/none.
        header = jwt.get_unverified_header(token)
        if header.get("alg") not in ("ES256", "RS256") or not header.get("kid"):
            raise AuthenticationFailed("Unsupported access token signing key.")
        signing_key = jwks_client(settings.SUPABASE_URL).get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token, signing_key.key, algorithms=["ES256", "RS256"],
            audience="authenticated", issuer=f"{settings.SUPABASE_URL}/auth/v1",
            options={"require": ["exp", "iat", "sub", "iss", "aud"]}, leeway=10,
        )
        UUID(claims["sub"])
        if claims.get("role") != "authenticated" or claims.get("is_anonymous") is not False:
            raise AuthenticationFailed("A verified customer account is required.")
        return claims
    except jwt.PyJWKClientConnectionError as exc:
        raise IdentityUnavailable() from exc
    except (jwt.PyJWTError, ValueError, TypeError, AttributeError) as exc:
        raise AuthenticationFailed("Invalid or expired access token.") from exc


def verified_remote_user(token, claims):
    """Check confirmation against Auth, not editable user_metadata or a local guess."""
    request = Request(f"{settings.SUPABASE_URL}/auth/v1/user", headers={
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
        "Accept": "application/json",
    })
    try:
        with urlopen(request, timeout=5) as response:
            data = json.load(response)
    except HTTPError as exc:
        if exc.code in (401, 403):
            raise AuthenticationFailed("Please sign in again.") from exc
        raise IdentityUnavailable() from exc
    except (URLError, TimeoutError, ValueError) as exc:
        raise IdentityUnavailable() from exc
    if not isinstance(data, dict):
        raise IdentityUnavailable()
    if (data.get("id") != claims["sub"] or not data.get("email_confirmed_at")
            or not data.get("email") or data.get("is_anonymous") is not False):
        raise AuthenticationFailed("Confirm your email before signing in.")
    return data


class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = bearer_token(request)
        if token is None:
            return None
        claims = verify_access_token(token)
        identity = SupabaseIdentity.objects.select_related("user").filter(subject=claims["sub"]).first()
        if not identity:
            raise PermissionDenied("Complete sign-in through /auth/session first.")
        if not identity.user.is_active:
            raise AuthenticationFailed("This account is disabled.")
        return identity.user, claims

    def authenticate_header(self, request):
        return "Bearer"


class LegacyTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        if SupabaseIdentity.objects.filter(user=user).exists():
            raise AuthenticationFailed("Use Supabase sign-in for this account.")
        return user, token
