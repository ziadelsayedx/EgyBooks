from django.urls import path
from django.contrib import admin
from . import views

app_name = 'library'

urlpatterns = [
    path('', views.MyBooksView.as_view(), name='my_books'),
    path('add/<int:book_id>/', views.AddToLibraryView.as_view(), name='add_to_library'),
    path('update/<int:pk>/', views.UpdateStatusView.as_view(), name='update_status'),
    path('return/<int:borrowed_id>/', views.return_book, name='return_book'),
    path('return-all/', views.ReturnAllBooksView.as_view(), name='return_all'),
    path('admin/', admin.site.urls),
    # New endpoints for managing purchased books
    path('cycle-status/<int:book_id>/', views.CycleBookStatusView.as_view(), name='cycle_status'),
    path('remove-book/<int:book_id>/', views.RemoveOwnedBookView.as_view(), name='remove_book'),
    path('remove-all-books/', views.RemoveAllOwnedBooksView.as_view(), name='remove_all_books'),
    path('update-quantity/<int:book_id>/', views.UpdateQuantityView.as_view(), name='update_quantity'),
]