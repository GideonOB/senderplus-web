"""Run all existing Django API tests against an isolated local test database."""

import os
from pathlib import Path
import subprocess
import sys


backend = Path(__file__).resolve().parents[1] / "backend"
env = {
    **os.environ,
    "SECRET_KEY": "senderplus-local-tests-only",
    "DEBUG": "true",
    "DATABASE_URL": "",
    "EMAIL_BACKEND": "django.core.mail.backends.locmem.EmailBackend",
    "CLOUDINARY_CLOUD_NAME": "",
    "CLOUDINARY_API_KEY": "",
    "CLOUDINARY_API_SECRET": "",
}

result = subprocess.run(
    [sys.executable, "manage.py", "test", "-v", "1"],
    cwd=backend,
    env=env,
    check=False,
)
sys.exit(result.returncode)
