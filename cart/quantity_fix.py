"""
This file contains the fixed checkout view code that properly handles
updating quantities of books in a user's library.
"""

def apply_fix():
    """
    Copy and replace the following code in cart/views.py
    Replace the code around line 183-191 where it creates LibraryBook records
    with this code that properly handles quantities.
    """
    code = """
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
    """
    print("Replace the existing code (around line 183-191) with this code")
    print(code)
