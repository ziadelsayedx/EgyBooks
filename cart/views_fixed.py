from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView, View
from django.urls import reverse_lazy
from django.contrib import messages
from django.http import JsonResponse
from books.models import Book
from .models import Cart, CartItem
from library.models import BorrowedBook, LibraryBook
from django.utils import timezone
import datetime
# from orders.models import Order  # Removed because 'orders' app does not exist

class CartContentsView(LoginRequiredMixin, View):
    def get(self, request):
        """Return the user's cart contents as JSON for API use"""
        cart = Cart.objects.get_or_create(user=request.user)[0]
        items = []
        
        for item in cart.items.all():
            items.append({
                'book_id': item.book.id,
                'quantity': item.quantity,
                'title': item.book.title,
                'price': float(item.book.price),
                'stock': item.book.stock,
                'max_allowed': min(item.book.stock, item.quantity)
            })
            
        return JsonResponse({
            'items': items,
            'subtotal': float(cart.subtotal),
            'tax': float(cart.tax),
            'total': float(cart.total),
            'cart_count': cart.get_total_items()
        })

class CartView(LoginRequiredMixin, TemplateView):
    template_name = 'cart/cart.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cart = Cart.objects.get_or_create(user=self.request.user)[0]
        context['cart_items'] = cart.items.all()
        context['cart'] = cart
        return context

class AddToCartView(LoginRequiredMixin, View):
    def post(self, request, book_id):
        book = get_object_or_404(Book, id=book_id)
        cart = Cart.objects.get_or_create(user=request.user)[0]
        quantity = int(request.POST.get('quantity', 1))

        # Get total quantity already in cart for this book
        existing_item = CartItem.objects.filter(cart=cart, book=book).first()
        current_cart_quantity = existing_item.quantity if existing_item else 0
        
        # Check if adding this quantity would exceed stock
        if book.stock < (current_cart_quantity + quantity):
            return JsonResponse({
                'success': False,
                'message': f'Cannot add more books. You already have {current_cart_quantity} in your cart and only {book.stock} are available.'
            })

        # Check if book is already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            book=book,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return JsonResponse({
            'success': True,
            'message': 'Book added to cart',
            'cart_count': cart.get_total_items()
        })

class UpdateCartView(LoginRequiredMixin, View):
    def post(self, request, item_id):
        cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        
        # Ensure quantity is a valid integer
        try:
            quantity = int(request.POST.get('quantity', 1))
            # Ensure quantity is at least 1
            quantity = max(1, quantity)
        except ValueError:
            quantity = 1
        
        # Check stock limits
        max_available = cart_item.book.stock
        if quantity > max_available:
            return JsonResponse({
                'success': False,
                'message': f'Only {max_available} books available in stock'
            }, status=400)

        # Update quantity
        cart_item.quantity = quantity
        cart_item.save()
        
        # Calculate updated values
        cart = cart_item.cart
        item_total = cart_item.book.price * cart_item.quantity
        
        return JsonResponse({
            'success': True,
            'message': 'Cart updated',
            'item_total': float(item_total),
            'subtotal': float(cart.subtotal),
            'tax': float(cart.tax),
            'total': float(cart.total),
            'cart_count': cart.get_total_items()
        })

class RemoveFromCartView(LoginRequiredMixin, View):
    def post(self, request, item_id):
        cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        cart = cart_item.cart
        cart_item.delete()

        return JsonResponse({
            'success': True,
            'message': 'Item removed from cart',
            'subtotal': float(cart.subtotal),
            'tax': float(cart.tax),
            'total': float(cart.total),
            'cart_count': cart.get_total_items()
        })

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
            
            # Create or update LibraryBook record for the Owned Books tab with proper quantity handling
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

class BorrowView(LoginRequiredMixin, View):
    def post(self, request):
        book_id = request.POST.get('book_id')
        quantity = int(request.POST.get('quantity', 1))
        
        if not book_id:
            messages.error(request, 'No book specified')
            return redirect('books:book_list')
        
        book = get_object_or_404(Book, id=book_id)
        
        # Check if book has enough stock
        if book.stock < quantity:
            messages.error(request, f'Not enough copies of "{book.title}" available for borrowing.')
            return redirect('books:book_detail', slug=book.slug)
        
        # Check if user already has this book borrowed
        existing_borrowed = BorrowedBook.objects.filter(
            user=request.user,
            book=book,
            returned=False
        ).first()
        
        if existing_borrowed:
            # Update existing borrowed record
            existing_borrowed.quantity += quantity
            existing_borrowed.save()
            messages.success(request, f'Added {quantity} more copies of "{book.title}" to your borrowed books.')
        else:
            # Create new borrowed record
            due_date = timezone.now() + datetime.timedelta(days=14)
            BorrowedBook.objects.create(
                user=request.user,
                book=book,
                quantity=quantity,
                borrowed_date=timezone.now(),
                due_date=due_date
            )
            messages.success(request, f'Successfully borrowed {quantity} copies of "{book.title}".')
        
        # Decrease book stock
        book.decrease_stock(quantity)
        
        return redirect('books:library')
