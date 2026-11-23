from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import CanManageDeliveries

from .models import Package
from .serializers import (
    PackageCreateSerializer,
    PackageDetailSerializer,
    PackageSummarySerializer,
    PublicTrackingSerializer,
)


class SubmitPackageView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [FormParser, MultiPartParser]

    def post(self, request):
        serializer = PackageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        package = serializer.save(
            booked_by=request.user if request.user.is_authenticated else None,
        )
        return Response(
            {
                "message": "Package submitted successfully",
                "tracking_id": package.tracking_id,
            },
            status=status.HTTP_200_OK,
        )


class TrackPackageView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, tracking_id: str):
        package = get_object_or_404(Package, tracking_id=tracking_id)
        serializer = PublicTrackingSerializer(package)
        return Response(serializer.data)


class MyDeliveriesPagination(PageNumberPagination):
    page_size = 20


class BookedDeliveriesMixin:
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Package.objects.filter(booked_by=self.request.user)


@method_decorator(never_cache, name="dispatch")
class MyDeliveryListView(BookedDeliveriesMixin, generics.ListAPIView):
    serializer_class = PackageSummarySerializer
    pagination_class = MyDeliveriesPagination

    def get_queryset(self):
        return super().get_queryset().order_by("-created_at", "-pk")


@method_decorator(never_cache, name="dispatch")
class MyDeliveryDetailView(BookedDeliveriesMixin, generics.RetrieveAPIView):
    serializer_class = PackageDetailSerializer
    lookup_field = "tracking_id"


class AdvanceStatusView(APIView):
    permission_classes = [CanManageDeliveries]

    def post(self, request, tracking_id: str):
        package = get_object_or_404(Package, tracking_id=tracking_id)
        package.advance_status()
        serializer = PackageDetailSerializer(package)
        return Response(serializer.data, status=status.HTTP_200_OK)
