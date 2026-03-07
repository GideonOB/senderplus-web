from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Package
from .serializers import PackageCreateSerializer, PackageDetailSerializer


class SubmitPackageView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [FormParser, MultiPartParser]

    def post(self, request):
        serializer = PackageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        package = serializer.save()
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
        serializer = PackageDetailSerializer(package)
        return Response(serializer.data)


class AdvanceStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, tracking_id: str):
        package = get_object_or_404(Package, tracking_id=tracking_id)
        package.advance_status()
        serializer = PackageDetailSerializer(package)
        return Response(serializer.data, status=status.HTTP_200_OK)
