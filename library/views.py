from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, View
from django.urls import reverse_lazy
from django.contrib import messages
from django.http import JsonResponse
from books.models import Book
from .models import LibraryBook, BorrowedBook
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db.models import F

class MyBooksView(LoginRequiredMixin, ListView):
    template_name = 'library/my_books.html'
    context_object_name = 'library_items'
    paginate_by = 12

    def get_queryset(self):
        status = self.request.GET.get('status')
        queryset = LibraryBook.objects.filter(user=self.request.user)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('book')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['total_books'] = self.get_queryset().count()
        context['reading_books'] = self.get_queryset().filter(status='reading').count()
        context['completed_books'] = self.get_queryset().filter(status='completed').count()
        return context

class AddToLibraryView(LoginRequiredMixin, View):
    def post(self, request, book_id):
        book = get_object_or_404(Book, id=book_id)
        
        # Check if book is already in user's library
        if LibraryBook.objects.filter(user=request.user, book=book).exists():
            return JsonResponse({
                'success': False,
                'message': 'Book is already in your library'
            })

        # Create new library item
        LibraryBook.objects.create(
            user=request.user,
            book=book,
            status='reading'
        )

        return JsonResponse({
            'success': True,
            'message': 'Book added to your library'
        })

class UpdateStatusView(LoginRequiredMixin, View):
    def post(self, request, item_id):
        library_item = get_object_or_404(LibraryBook, id=item_id, user=request.user)
        new_status = request.POST.get('status')

        if new_status in dict(LibraryBook.STATUS_CHOICES):
            library_item.status = new_status
            library_item.save()
            return JsonResponse({
                'success': True,
                'message': 'Status updated successfully'
            })
        
        return JsonResponse({
            'success': False,
            'message': 'Invalid status'
        })

class ReturnBookView(LoginRequiredMixin, View):
    def post(self, request, item_id):
        library_item = get_object_or_404(LibraryBook, id=item_id, user=request.user)
        
        if library_item.status == 'reading':
            library_item.status = 'completed'
            library_item.save()
            return JsonResponse({
                'success': True,
                'message': 'Book marked as completed'
            })
        
        return JsonResponse({
            'success': False,
            'message': 'Book is already completed'
        })

@login_required
def return_book(request, borrowed_id):
    borrowed = get_object_or_404(BorrowedBook, id=borrowed_id, user=request.user, returned=False)
    
    if request.method == 'POST':
        # Get the quantity to return
        return_quantity = int(request.POST.get('quantity', borrowed.quantity))
        
        if return_quantity > borrowed.quantity:
            messages.error(request, 'Cannot return more books than borrowed.')
            return redirect('books:library')
        
        # Increase book stock using the helper method
        borrowed.book.increase_stock(return_quantity)
        
        # Update or mark borrowed record
        if return_quantity == borrowed.quantity:
            borrowed.returned = True
            borrowed.returned_date = timezone.now()
            borrowed.save()
            messages.success(request, f'Successfully returned {return_quantity} copies of "{borrowed.book.title}".')
        else:
            borrowed.quantity -= return_quantity
            borrowed.save()
            messages.success(request, f'Successfully returned {return_quantity} copies of "{borrowed.book.title}". You still have {borrowed.quantity} copies borrowed.')
        
        return redirect('books:library')
    
    return render(request, 'library/return_book.html', {'borrowed': borrowed})

class ReturnAllBooksView(LoginRequiredMixin, View):
    def post(self, request):
        # Get all unreturned books for the user
        borrowed_books = BorrowedBook.objects.filter(user=request.user, returned=False)
        
        if not borrowed_books.exists():
            messages.info(request, 'You have no books to return.')
            return redirect('books:library')
        
        count = 0
        for borrowed in borrowed_books:
            # Increase book stock using the helper method
            borrowed.book.increase_stock(borrowed.quantity)
            
            # Mark as returned
            borrowed.returned = True
            borrowed.returned_date = timezone.now()
            borrowed.save()
            count += borrowed.quantity
        
        messages.success(request, f'Successfully returned {count} books.')
        return redirect('books:library')
        
class CycleBookStatusView(LoginRequiredMixin, View):
    """View for cycling through book statuses in the library"""
    def post(self, request, book_id):
        library_book = get_object_or_404(LibraryBook, id=book_id, user=request.user)
        
        # Define the cycle order - now includes 'owned'
        status_cycle = ['reading', 'completed', 'planned', 'owned']
        
        # If the current status isn't in our cycle (should only happen if there's a database inconsistency)
        # default to 'reading'
        if library_book.status not in status_cycle:
            current_index = 0  # Default to 'reading'
        else:
            # Find current status index and get next status
            current_index = status_cycle.index(library_book.status)
            
        next_index = (current_index + 1) % len(status_cycle)
        new_status = status_cycle[next_index]
        
        # Update the status
        library_book.status = new_status
        library_book.save()
        
        # Get the display name for the new status
        # Handle special case for 'owned' which may not be in STATUS_CHOICES
        if new_status == 'owned':
            new_status_display = 'Owned'
        else:
            new_status_display = dict(LibraryBook.STATUS_CHOICES).get(new_status, new_status.capitalize())
        
        messages.success(request, f'Book status changed to {new_status_display}')
        return redirect('books:library')
        
class RemoveOwnedBookView(LoginRequiredMixin, View):
    """View for removing a book from the user's library (purchased books)"""
    def post(self, request, book_id):
        library_book = get_object_or_404(LibraryBook, id=book_id, user=request.user)
        
        # Check if removing one or all copies
        remove_all = request.POST.get('remove_all', 'false') == 'true'
        
        if remove_all or library_book.quantity <= 1:
            book_title = library_book.book.title
            library_book.delete()
            messages.success(request, f'Removed "{book_title}" from your library')
        else:
            library_book.quantity -= 1
            library_book.save()
            messages.success(request, f'Removed 1 copy of "{library_book.book.title}" from your library. {library_book.quantity} copies remain.')
            
        return redirect('books:library')
        
class RemoveAllOwnedBooksView(LoginRequiredMixin, View):
    """View for removing all books from the user's library (purchased books)"""
    def post(self, request):
        # Count books before deletion for messaging
        book_count = LibraryBook.objects.filter(user=request.user).count()
        
        # Delete all library books for this user
        LibraryBook.objects.filter(user=request.user).delete()
        
        if book_count > 0:
            messages.success(request, f'Successfully removed all {book_count} books from your library')
        else:
            messages.info(request, 'Your library was already empty')
            
        return redirect('books:library')
        
class UpdateQuantityView(LoginRequiredMixin, View):
    """View for updating the quantity of a book in the user's library"""
    def post(self, request, book_id):
        library_book = get_object_or_404(LibraryBook, id=book_id, user=request.user)
        
        try:
            # Get new quantity from post data
            new_quantity = int(request.POST.get('quantity', 1))
            
            # Ensure quantity is at least 1
            if new_quantity < 1:
                messages.error(request, 'Quantity must be at least 1')
                return redirect('books:library')
                
            library_book.quantity = new_quantity
            library_book.save()
            
            messages.success(request, f'Updated quantity for "{library_book.book.title}" to {new_quantity}')
        except ValueError:
            messages.error(request, 'Invalid quantity')
            
        return redirect('books:library')