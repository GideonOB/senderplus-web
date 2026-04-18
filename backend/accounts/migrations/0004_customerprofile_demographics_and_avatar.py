from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_email_verification_hardening"),
    ]

    operations = [
        migrations.AddField(
            model_name="customerprofile",
            name="city",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="customerprofile",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("male", "Male"), ("female", "Female")],
                default="",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="customerprofile",
            name="ghana_post_gps",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.AddField(
            model_name="customerprofile",
            name="profile_picture",
            field=models.ImageField(blank=True, null=True, upload_to="profiles/"),
        ),
        migrations.AddField(
            model_name="customerprofile",
            name="region",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddField(
            model_name="customerprofile",
            name="street",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
