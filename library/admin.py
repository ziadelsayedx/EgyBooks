from django.contrib import admin
from .models import LibraryBook

@admin.register(LibraryBook)
class LibraryBookAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'borrowed_date', 'due_date', 'is_returned', 'is_overdue')
    list_filter = ('is_returned', 'borrowed_date', 'due_date')
    search_fields = ('user__username', 'book__title')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('user', 'book')
        }),
        ('Borrowing Information', {
            'fields': ('borrowed_date', 'due_date', 'is_returned', 'returned_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Overdue' 