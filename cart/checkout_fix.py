"""
Temporary fix script to be applied to fix the cart checkout functionality
This ensures that book quantities are properly updated in the user's library
"""

from django.shortcuts import render, redirect
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django.contrib import messages
from .models import Cart
from library.models import BorrowedBook, LibraryBook
from django.utils import timezone
import datetime

class CheckoutView(LoginRequiredMixin, TemplateView):
    template_name = 'cart/checkout.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cart = Cart.objects.get_or_create(user=self.request.user)[0]
        context['cart_items'] = cart.items.all()
        context['cart'] = cart
        return context

    def post(self, request):
        cart = Cart.objects.get(user=request.user)
        
        if not cart.items.exists():
            messages.error(request, 'Your cart is empty')
            return redirect('cart:cart')

        # Check if all books have enough stock first
        for cart_item in cart.items.all():
            if cart_item.book.stock < cart_item.quantity:
                messages.error(request, f'Not enough copies of "{cart_item.book.title}" in stock.')
                return redirect('cart:cart')
        
        # Get total books for success message
        cart_items = list(cart.items.all())
        total_books = sum(item.quantity for item in cart_items)
        
        # Add books to user's owned collection
        for cart_item in cart.items.all():
            # Create or update BorrowedBook record
            existing_borrow = BorrowedBook.objects.filter(
                user=request.user,
                book=cart_item.book,
                returned=False
            ).first()
            
            if existing_borrow:
                # Update quantity if book already borrowed
                existing_borrow.quantity += cart_item.quantity
                existing_borrow.save()
            else:
                # Create a new borrowed book record
                BorrowedBook.objects.create(
                    user=request.user,
                    book=cart_item.book,
                    quantity=cart_item.quantity,
                    due_date=timezone.now() + datetime.timedelta(days=14)
                )
            
            # FIX: Create or update LibraryBook record for the Owned Books tab
            # with proper quantity handling
            library_book = LibraryBook.objects.filter(user=request.user, book=cart_item.book).first()
            
            if library_book:
                # Update existing library book quantity
                library_book.quantity += cart_item.quantity
                library_book.save()
            else:
                # Create new library book with correct quantity
                due_date = timezone.now() + datetime.timedelta(days=14)
                LibraryBook.objects.create(
                    user=request.user,
                    book=cart_item.book,
                    status='reading',
                    due_date=due_date,
                    quantity=cart_item.quantity
                )
            
            # Decrement book stock using the helper method
            cart_item.book.decrease_stock(cart_item.quantity)

        # Clear cart
        cart.items.all().delete()

        # Show success message with number of books
        messages.success(request, f'{total_books} books added to your library!')
        return redirect('books:library')
