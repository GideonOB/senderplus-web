from django.urls import path

from .views import (
    AdvanceStatusView,
    MyDeliveryDetailView,
    MyDeliveryListView,
    SubmitPackageView,
    TrackPackageView,
)

urlpatterns = [
    path("submit-package", SubmitPackageView.as_view(), name="submit-package"),
    path("track/<str:tracking_id>", TrackPackageView.as_view(), name="track-package"),
    path("deliveries", MyDeliveryListView.as_view(), name="my-deliveries"),
    path(
        "deliveries/<str:tracking_id>",
        MyDeliveryDetailView.as_view(),
        name="my-delivery-detail",
    ),
    path(
        "advance-status/<str:tracking_id>",
        AdvanceStatusView.as_view(),
        name="advance-status",
    ),
]
