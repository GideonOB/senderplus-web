from decimal import Decimal, InvalidOperation

from django.http import JsonResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import Package


@csrf_exempt
def submit_package(request):
    """
    Handles POST /submit-package

    Expects multipart/form-data with fields:
      sender_name, sender_phone, sender_email (optional), sender_address
      recipient_name, recipient_phone, recipient_email (optional), recipient_address
      package_name, package_type, weight, value (optional), description (optional)
      photo (optional file)
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    # Required fields coming from the React form
    sender_name = request.POST.get("sender_name", "").strip()
    sender_phone = request.POST.get("sender_phone", "").strip()
    sender_email = request.POST.get("sender_email", "").strip()
    sender_address = request.POST.get("sender_address", "").strip()

    recipient_name = request.POST.get("recipient_name", "").strip()
    recipient_phone = request.POST.get("recipient_phone", "").strip()
    recipient_email = request.POST.get("recipient_email", "").strip()
    recipient_address = request.POST.get("recipient_address", "").strip()

    package_name = request.POST.get("package_name", "").strip()
    package_type = request.POST.get("package_type", "").strip()
    weight_raw = request.POST.get("weight", "").strip()
    value_raw = request.POST.get("value", "").strip()
    description = request.POST.get("description", "").strip()

    photo = request.FILES.get("photo")

    # Basic validation for required fields
    required_fields = {
        "sender_name": sender_name,
        "sender_phone": sender_phone,
        "sender_address": sender_address,
        "recipient_name": recipient_name,
        "recipient_phone": recipient_phone,
        "recipient_address": recipient_address,
        "package_name": package_name,
        "package_type": package_type,
        "weight": weight_raw,
    }

    missing = [key for key, val in required_fields.items() if not val]
    if missing:
        return JsonResponse(
            {
                "detail": f"Missing required fields: {', '.join(missing)}"
            },
            status=400,
        )

    # Safely parse numeric fields
    try:
        weight = Decimal(weight_raw)
    except (InvalidOperation, TypeError):
        return JsonResponse(
            {"detail": "Weight must be a valid number."},
            status=400,
        )

    value = None
    if value_raw:
        try:
            value = Decimal(value_raw)
        except (InvalidOperation, TypeError):
            return JsonResponse(
                {"detail": "Value must be a valid number if provided."},
                status=400,
            )

    pkg = Package.objects.create(
        sender_name=sender_name,
        sender_phone=sender_phone,
        sender_email=sender_email or None,
        sender_address=sender_address,
        recipient_name=recipient_name,
        recipient_phone=recipient_phone,
        recipient_email=recipient_email or None,
        recipient_address=recipient_address,
        package_name=package_name,
        package_type=package_type,
        weight=weight,
        value=value,
        description=description or None,
        photo=photo,
    )

    # Response expected by the React SubmitPage
    return JsonResponse(
        {
            "message": "Package submitted successfully",
            "tracking_id": pkg.tracking_id,
        }
    )


def _serialize_package(pkg: Package) -> dict:
    return {
        "tracking_id": pkg.tracking_id,
        "sender_name": pkg.sender_name,
        "sender_phone": pkg.sender_phone,
        "sender_email": pkg.sender_email,
        "sender_address": pkg.sender_address,
        "recipient_name": pkg.recipient_name,
        "recipient_phone": pkg.recipient_phone,
        "recipient_email": pkg.recipient_email,
        "recipient_address": pkg.recipient_address,
        "package_name": pkg.package_name,
        "package_type": pkg.package_type,
        "weight": pkg.weight,
        "value": pkg.value,
        "description": pkg.description or "",
        "photo_url": pkg.photo.url if pkg.photo else None,
        "status": pkg.get_status_display(),
    }


def track_package(request, tracking_id: str):
    """
    Handles GET /track/<tracking_id>
    Returns the stored package JSON, or 404 if not found.
    """
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    pkg = get_object_or_404(Package, tracking_id=tracking_id)

    return JsonResponse(_serialize_package(pkg))


@csrf_exempt
def advance_status(request, tracking_id: str):
    """
    Handles POST /advance-status/<tracking_id>
    For demo purposes, advances the status to the next step and returns the package JSON.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    pkg = get_object_or_404(Package, tracking_id=tracking_id)
    pkg.advance_status()

    return JsonResponse(_serialize_package(pkg))
