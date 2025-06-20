from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _

class EgyBooksAdminSite(AdminSite):
    # Text to put at the end of each page's <title>.
    site_title = _('EgyBooks Admin')

    # Text to put in each page's <h1> (and above login form).
    site_header = _('EgyBooks Administration')

    # Text to put at the top of the admin index page.
    index_title = _('EgyBooks Administration')

    # URL for the "View site" link at the top of each admin page.
    site_url = '/'

admin_site = EgyBooksAdminSite(name='admin')

# Register your models here
from django.contrib.auth import get_user_model
from books.models import Book, Category, Author
from users.models import UserProfile
from library.models import LibraryBook

# Register models with the custom admin site
admin_site.register(get_user_model())
admin_site.register(Book)
admin_site.register(Category)
admin_site.register(Author)
admin_site.register(UserProfile)
admin_site.register(LibraryBook) 