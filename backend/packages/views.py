from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Package
from .serializers import PackageCreateSerializer, PackageDetailSerializer


class SubmitPackageView(APIView):
    """
    POST /submit-package
    Accepts multipart/form-data including optional photo.
    """

    def post(self, request, *args, **kwargs):
        serializer = PackageCreateSerializer(data=request.data)
        if serializer.is_valid():
            pkg = serializer.save()
            return Response(
                {
                    "message": "Package submitted successfully",
                    "tracking_id": pkg.tracking_id,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrackPackageView(APIView):
    """
    GET /track/<tracking_id>
    Returns full package details.
    """

    def get(self, request, tracking_id, *args, **kwargs):
        pkg = get_object_or_404(Package, tracking_id=tracking_id)
        serializer = PackageDetailSerializer(pkg)
        return Response(serializer.data)


class AdvanceStatusView(APIView):
    """
    POST /advance-status/<tracking_id>
    Demo endpoint: advances status through the lifecycle.
    """

    def post(self, request, tracking_id, *args, **kwargs):
        pkg = get_object_or_404(Package, tracking_id=tracking_id)
        pkg.advance_status()
        serializer = PackageDetailSerializer(pkg)
        return Response(serializer.data)