from django.urls import path

from .views import AdvanceStatusView, SubmitPackageView, TrackPackageView

urlpatterns = [
    path("submit-package", SubmitPackageView.as_view(), name="submit-package"),
    path("track/<str:tracking_id>", TrackPackageView.as_view(), name="track-package"),
    path(
        "advance-status/<str:tracking_id>",
        AdvanceStatusView.as_view(),
        name="advance-status",
    ),
]
