from django.urls import path
from .views import SubmitPackageView, TrackPackageView, AdvanceStatusView

urlpatterns = [
    path("submit-package", SubmitPackageView.as_view(), name="submit-package"),
    path("track/<str:tracking_id>", TrackPackageView.as_view(), name="track-package"),
    path(
        "advance-status/<str:tracking_id>",
        AdvanceStatusView.as_view(),
        name="advance-status",
    ),
]
'''Because senderplus_core/urls.py includes path("", include("packages.urls")), the final URLs are:

POST /submit-package

GET /track/<tracking_id>

POST /advance-status/<tracking_id>
'''
