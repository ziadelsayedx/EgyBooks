from django.contrib import admin
from django.utils.html import format_html
from .models import Book, Category, Author

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'price', 'is_available', 'stock')
    list_filter = ('is_available', 'category', 'author', 'created_at')
    search_fields = ('title', 'description', 'isbn')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'author', 'category', 'description')
        }),
        ('Book Details', {
            'fields': ('cover_image', 'price', 'isbn', 'publication_date', 'pages', 'language')
        }),
        ('Inventory', {
            'fields': ('stock', 'is_available')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    list_filter = ('created_at',)

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'bio')
    list_filter = ('created_at',)

    def book_count(self, obj):
        return obj.books.count()
    book_count.short_description = 'Number of Books' 