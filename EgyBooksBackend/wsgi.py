"""
WSGI config for EgyBooksBackend project.
"""

import os
from django.core.wsgi import get_wsgi_application
# from dotenv import load_dotenv  # Temporarily commented out

# Load environment variables
# load_dotenv()  # Temporarily commented out

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EgyBooksBackend.settings')  # Changed to use default settings

application = get_wsgi_application() 