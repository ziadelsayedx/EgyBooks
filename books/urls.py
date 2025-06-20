from django.urls import path
from . import views

app_name = 'books'

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('books/', views.BookListView.as_view(), name='book_list'),
    path('library/', views.LibraryView.as_view(), name='library'),
    path('book/<int:pk>/', views.BookDetailView.as_view(), name='book_detail'),
    path('search/', views.SearchView.as_view(), name='search'),
    path('add/', views.BookCreateView.as_view(), name='book_create'),
    path('edit/<int:pk>/', views.BookUpdateView.as_view(), name='book_update'),
    path('delete/<int:pk>/', views.BookDeleteView.as_view(), name='delete_book'),
    path('api/cart/add_item/', views.add_to_cart_api, name='add_to_cart_api'),
    path('api/book/<int:book_id>/', views.book_detail_api, name='book_detail_api'),
] 