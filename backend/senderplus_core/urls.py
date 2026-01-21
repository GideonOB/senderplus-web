from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from packages import views

urlpatterns = [
    path("admin/", admin.site.urls),

    # API endpoints used by the React frontend
    path("submit-package", views.submit_package, name="submit_package"),
    path("track/<str:tracking_id>", views.track_package, name="track_package"),
    path("advance-status/<str:tracking_id>", views.advance_status, name="advance_status"),
]

# Serve uploaded files at /uploads/... (for MVP / DEBUG)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)