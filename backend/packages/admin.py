from django.contrib import admin
from .models import Package


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = (
        "tracking_id",
        "sender_name",
        "recipient_name",
        "status",
        "created_at",
    )
    search_fields = ("tracking_id", "sender_name", "recipient_name")
    list_filter = ("status", "created_at")
    readonly_fields = ("tracking_id", "created_at", "updated_at")
    actions = ("advance_status_action",)

    @admin.action(description="Advance status for selected packages")
    def advance_status_action(self, request, queryset):
        for package in queryset:
            package.advance_status()
