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
'''Now you’ll be able to log into /admin/ and see packages in a nice UI.



Create a superuser later with:

python manage.py createsuperuser'''