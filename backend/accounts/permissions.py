from rest_framework.permissions import BasePermission

from .models import UserRole


class CanManageDeliveries(BasePermission):
    """Operations-wide permission. Drivers need assignment-scoped endpoints later."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and (
            user.is_staff or user.senderplus_roles.filter(role__in=[
                UserRole.Role.DISPATCHER, UserRole.Role.MANAGER, UserRole.Role.ADMIN,
            ]).exists()
        ))
