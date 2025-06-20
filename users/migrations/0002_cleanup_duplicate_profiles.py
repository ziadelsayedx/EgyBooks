from django.db import migrations

def cleanup_duplicate_profiles(apps, schema_editor):
    User = apps.get_model('users', 'User')
    UserProfile = apps.get_model('users', 'UserProfile')
    
    for user in User.objects.all():
        # Get all profiles for this user
        profiles = UserProfile.objects.filter(user=user)
        if profiles.count() > 1:
            # Keep the first one, delete others
            first_profile = profiles.first()
            profiles.exclude(pk=first_profile.pk).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(cleanup_duplicate_profiles),
    ] 