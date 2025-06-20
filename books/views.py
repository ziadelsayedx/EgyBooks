from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Sum, Count, F, Min
from django.db import transaction
from django.urls import reverse_lazy
from django.contrib import messages
from .models import Book, Category, Author
from .forms import BookForm
from django.contrib.auth import update_session_auth_hash
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from library.models import BorrowedBook
from django.utils import timezone

# Add new API endpoint for book details
def book_detail_api(request, book_id):
    """API endpoint to get book details in JSON format"""
    try:
        book = Book.objects.get(id=book_id)
        data = {
            'id': book.id,
            'title': book.title,
            'slug': book.slug,
            'author_name': book.author.name,
            'category_name': book.category.name,
            'description': book.description,
            'cover_image': book.cover_image.url if book.cover_image else None,
            'price': str(book.price),
            'isbn': book.isbn,
            'publication_date': book.publication_date.strftime('%Y-%m-%d'),
            'pages': book.pages,
            'language': book.language,
            'stock': book.stock,
            'is_available': book.is_available,
        }
        return JsonResponse(data)
    except Book.DoesNotExist:
        return JsonResponse({'error': 'Book not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

class HomeView(ListView):
    model = Book
    template_name = 'books/home.html'
    context_object_name = 'books'
    paginate_by = 12

    def get_queryset(self):
        # Show all books regardless of availability status
        return Book.objects.all().order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Show all books in featured section too
        context['featured_books'] = Book.objects.all().order_by('-created_at')[:6]
        context['categories'] = Category.objects.all()
        context['has_books'] = Book.objects.exists()
        return context

class BookListView(ListView):
    model = Book
    template_name = 'books/book_list.html'
    context_object_name = 'books'
    paginate_by = 12

    def get_queryset(self):
        # Show all books regardless of availability status
        queryset = Book.objects.all()
        
        # Category filtering
        category = self.request.GET.get('category')
        if category and category.strip():
            queryset = queryset.filter(category_id=category)
        
        # Price range filtering
        min_price = self.request.GET.get('min_price')
        max_price = self.request.GET.get('max_price')
        
        if min_price and min_price.strip():
            try:
                min_price = float(min_price)
                queryset = queryset.filter(price__gte=min_price)
            except (ValueError, TypeError):
                pass
                
        if max_price and max_price.strip():
            try:
                max_price = float(max_price)
                queryset = queryset.filter(price__lte=max_price)
            except (ValueError, TypeError):
                pass
        
        # Sorting
        sort_option = self.request.GET.get('sort', 'newest')
        if sort_option == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_option == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort_option == 'title':
            queryset = queryset.order_by('title')
        else:  # default to newest
            queryset = queryset.order_by('-publication_date')  # Sort by newest publication date
            
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        
        # Add current filter values to context for form persistence
        context['current_category'] = self.request.GET.get('category', '')
        context['min_price'] = self.request.GET.get('min_price', '')
        context['max_price'] = self.request.GET.get('max_price', '')
        context['sort'] = self.request.GET.get('sort', 'newest')
        
        return context

class LibraryView(LoginRequiredMixin, ListView):
    model = Book
    template_name = 'books/library.html'
    context_object_name = 'owned_books'
    paginate_by = 12

    def get_queryset(self):
        return self.request.user.library_books.all()
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get borrowed books grouped by book with summed quantities
        borrowed_books_query = BorrowedBook.objects.filter(
            user=self.request.user,
            returned=False
        ).values(
            'book'  # Group by book
        ).annotate(
            total_quantity=Sum('quantity'),
            first_borrowed_id=Min('id'),  # Get the first borrowed book's ID for the return URL
            book_id=F('book__id'),
            book_title=F('book__title'),
            book_author=F('book__author__name'),
            book_cover=F('book__cover_image'),
            borrowed_date=F('borrowed_date'),  # Earliest borrow date
            due_date=F('due_date')  # Earliest due date
        ).order_by('-borrowed_date')
        
        # Fetch complete book objects for template access
        books_dict = {}
        for item in borrowed_books_query:
            book = Book.objects.get(id=item['book_id'])
            books_dict[item['book_id']] = {
                'book': book,
                'id': item['first_borrowed_id'],  # Add the borrowed book ID
                'quantity': item['total_quantity'],
                'borrowed_date': item['borrowed_date'],
                'due_date': item['due_date'],
                'is_overdue': timezone.now() > item['due_date'] if not item.get('returned', False) else False
            }
        
        context['borrowed_books'] = books_dict.values()
        return context

class BookDetailView(DetailView):
    model = Book
    template_name = 'books/book_detail.html'
    context_object_name = 'book'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['similar_books'] = Book.objects.filter(
            category=self.object.category
        ).exclude(id=self.object.id)[:4]
        return context

class SearchView(ListView):
    model = Book
    template_name = 'books/search_results.html'
    context_object_name = 'books'
    paginate_by = 12

    def get_queryset(self):
        query = self.request.GET.get('q', '')
        search_type = self.request.GET.get('search_type', 'title')
        
        if not query:
            return Book.objects.none()
            
        queryset = Book.objects.all()
        
        # Apply search filter based on search type
        if search_type == 'title':
            queryset = queryset.filter(title__icontains=query)
        elif search_type == 'author':
            queryset = queryset.filter(author__name__icontains=query)
        elif search_type == 'category':
            queryset = queryset.filter(category__name__icontains=query)
        else:  # 'all' or any other value
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(author__name__icontains=query) |
                Q(category__name__icontains=query) |
                Q(description__icontains=query)
            )
            
        # Category filtering
        category = self.request.GET.get('category')
        if category and category.strip():
            queryset = queryset.filter(category_id=category)
        
        # Price range filtering
        min_price = self.request.GET.get('min_price')
        max_price = self.request.GET.get('max_price')
        
        if min_price and min_price.strip():
            try:
                min_price = float(min_price)
                queryset = queryset.filter(price__gte=min_price)
            except (ValueError, TypeError):
                pass
                
        if max_price and max_price.strip():
            try:
                max_price = float(max_price)
                queryset = queryset.filter(price__lte=max_price)
            except (ValueError, TypeError):
                pass
        
        # Sorting
        sort_option = self.request.GET.get('sort', 'newest')
        if sort_option == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_option == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort_option == 'title':
            queryset = queryset.order_by('title')
        elif sort_option == 'relevance':
            # Keep the default relevance order for search results
            pass
        else:  # default to newest
            queryset = queryset.order_by('-publication_date')  # Sort by newest publication date
            
        return queryset.distinct()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add search parameters
        context['query'] = self.request.GET.get('q', '')
        context['search_type'] = self.request.GET.get('search_type', 'title')
        
        # Add current filter values to context for form persistence
        context['categories'] = Category.objects.all()
        context['current_category'] = self.request.GET.get('category', '')
        context['min_price'] = self.request.GET.get('min_price', '')
        context['max_price'] = self.request.GET.get('max_price', '')
        context['sort'] = self.request.GET.get('sort', 'newest')
        
        return context

class BookCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Book
    form_class = BookForm
    template_name = 'admin/add_book.html'
    success_url = reverse_lazy('books:home')

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from .models import Category
        context['categories'] = Category.objects.all()
        return context

class BookUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Book
    template_name = 'admin/edit_book.html'
    form_class = BookForm
    success_url = reverse_lazy('books:book_list')

    def test_func(self):
        return self.request.user.is_staff
    
    def get_initial(self):
        initial = super().get_initial()
        if self.object:
            initial['author_name'] = self.object.author.name
        return initial

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        context['is_edit'] = True  # Flag to indicate edit mode
        return context

    def form_valid(self, form):
        try:
            # Use atomic transaction to ensure all changes succeed or none
            with transaction.atomic():
                # Save the form
                self.object = form.save()
                # Return without any success message (silent update)
                return super().form_valid(form)
        except Exception as e:
            # Only show error messages for actual errors
            return super().form_invalid(form)

class BookDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Book
    success_url = reverse_lazy('books:book_list')
    template_name = 'admin/confirm_delete.html'
    
    def test_func(self):
        return self.request.user.is_staff
    
    def delete(self, request, *args, **kwargs):
        book = self.get_object()
        messages.success(self.request, f'Book "{book.title}" has been deleted.')
        return super().delete(request, *args, **kwargs)

@login_required
@require_POST
def add_to_cart_api(request):
    data = json.loads(request.body)
    book_id = data.get('book')
    quantity = int(data.get('quantity', 1))
    
    try:
        book = Book.objects.get(pk=book_id)
        
        # Check if book is available (both stock and is_available flag)
        if not book.is_available:
            return JsonResponse({
                'success': False,
                'message': 'This book is not available for purchase'
            }, status=400)
            
        # Validate stock level
        if book.stock <= 0:
            return JsonResponse({
                'success': False,
                'message': 'This book is out of stock'
            }, status=400)
            
        # Check if requested quantity is available
        if book.stock < quantity:
            return JsonResponse({
                'success': False,
                'message': f'Only {book.stock} copies available'
            }, status=400)
            
        # Get or create cart
        cart = Cart.objects.get_or_create(user=request.user)[0]
        
        # Check if book is already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            book=book,
            defaults={'quantity': quantity}
        )
        
        if not created:
            # Check if adding more would exceed stock
            if cart_item.quantity + quantity > book.stock:
                return JsonResponse({
                    'success': False,
                    'message': f'Cannot add more copies. Only {book.stock} available in total'
                }, status=400)
                
            cart_item.quantity += quantity
            cart_item.save()
            
        return JsonResponse({
            'success': True,
            'message': 'Book added to cart',
            'cart_count': cart.get_total_items()
        })
    except Book.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Book not found'
        }, status=404) 