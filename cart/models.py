from django.db import models
from django.conf import settings
from books.models import Book
from decimal import Decimal

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s cart"

    @property
    def subtotal(self):
        return sum(item.book.price * item.quantity for item in self.items.all())

    @property
    def tax(self):
        return round(self.subtotal * Decimal('0.10'), 2)

    @property
    def total(self):
        return round(self.subtotal + self.tax, 2)

    def get_total_items(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['cart', 'book']

    def __str__(self):
        return f"{self.quantity}x {self.book.title} in {self.cart}"

    @property
    def total_price(self):
        return round(self.book.price * self.quantity, 2) 