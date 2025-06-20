from django.db import models
from django.utils import timezone
from django.conf import settings
from books.models import Book
import datetime

class LibraryBook(models.Model):
    """Model for books in a user's library."""
    STATUS_CHOICES = [
        ('reading', 'Reading'),
        ('completed', 'Completed'),
        ('planned', 'Plan to Read'),
        ('owned', 'Owned'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='library_books')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='library_entries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reading')
    quantity = models.PositiveIntegerField(default=1)
    borrowed_date = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField()
    returned_date = models.DateTimeField(null=True, blank=True)
    is_returned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Library Book'
        verbose_name_plural = 'Library Books'
        ordering = ['-borrowed_date']
        unique_together = ['user', 'book']

    def __str__(self):
        return f"{self.user.username}'s copy of {self.book.title}"

    @property
    def is_overdue(self):
        if self.is_returned:
            return False
        return timezone.now() > self.due_date

    @property
    def days_overdue(self):
        if not self.is_overdue:
            return 0
        return (timezone.now() - self.due_date).days

    def return_book(self):
        self.is_returned = True
        self.returned_date = timezone.now()
        self.save()

class BorrowedBook(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='borrowed_books')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    borrowed_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    returned = models.BooleanField(default=False)
    returned_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} borrowed {self.book.title}"
    
    def save(self, *args, **kwargs):
        if not self.due_date:
            # Default borrow time is 14 days
            self.due_date = timezone.now() + datetime.timedelta(days=14)
        super().save(*args, **kwargs)
        
    @property
    def is_overdue(self):
        return not self.returned and timezone.now() > self.due_date 