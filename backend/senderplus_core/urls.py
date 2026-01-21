from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # API endpoints used by the React frontend
    path("auth/", include("accounts.urls")),
    path("", include("packages.urls")),
]

# Serve uploaded files at /uploads/... (for MVP / DEBUG)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
