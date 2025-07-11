# Generated by Django 5.0.2 on 2025-05-17 13:50

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('books', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='LibraryBook',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('reading', 'Reading'), ('completed', 'Completed')], default='reading', max_length=20)),
                ('borrowed_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('due_date', models.DateTimeField()),
                ('returned_date', models.DateTimeField(blank=True, null=True)),
                ('is_returned', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='library_entries', to='books.book')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='library_books', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Library Book',
                'verbose_name_plural': 'Library Books',
                'ordering': ['-borrowed_date'],
                'unique_together': {('user', 'book')},
            },
        ),
    ]
