from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_customerprofile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="customerprofile",
            name="email_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="emailverificationcode",
            name="challenge_token",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="emailverificationcode",
            name="purpose",
            field=models.CharField(
                choices=[
                    ("signup", "Signup"),
                    ("signin_device", "Signin Device"),
                    ("password_change", "Password Change"),
                ],
                default="signup",
                max_length=32,
            ),
        ),
        migrations.CreateModel(
            name="TrustedDevice",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("device_id", models.CharField(max_length=128)),
                ("last_used_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="trusted_devices",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "unique_together": {("user", "device_id")},
            },
        ),
    ]
