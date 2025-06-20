/**
 * EgyBooks - Book-related JavaScript functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add to cart functionality with stock validation
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevent default action
            e.preventDefault();
            
            // Check if button is disabled (out of stock)
            if (button.hasAttribute('disabled')) {
                showNotification('This book is out of stock', 'error');
                return;
            }
            
            const bookId = this.dataset.bookId;
            const quantity = 1; // Default quantity
            
            // Add the book to cart
            fetch(`/api/cart/add_item/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    'book': bookId,
                    'quantity': quantity
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Book added to cart successfully!', 'success');
                    
                    // Update cart count in navbar if it exists
                    const cartCountElement = document.querySelector('.cart-count');
                    if (cartCountElement) {
                        cartCountElement.textContent = data.cart_count;
                    }
                } else {
                    showNotification(data.message || 'Error adding book to cart', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error adding book to cart. Please try again.', 'error');
            });
        });
    });
    
    // Add to library functionality (if applicable)
    const addToLibraryButtons = document.querySelectorAll('.add-to-library');
    
    addToLibraryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookId = this.dataset.bookId;
            
            fetch(`/library/add/${bookId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Book added to your library!', 'success');
                } else {
                    showNotification(data.message || 'Error adding book to library', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error adding book to library. Please try again.', 'error');
            });
        });
    });
    
    // Helper function to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Create or use the notification system
    function showNotification(message, type) {
        // Check if notification container exists, create if not
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.top = '20px';
            notificationContainer.style.right = '20px';
            notificationContainer.style.zIndex = '1000';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} notification`;
        notification.style.marginBottom = '10px';
        notification.style.minWidth = '250px';
        notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        notification.innerHTML = message;
        
        // Append to container
        notificationContainer.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 500);
        }, 3000);
    }
}); 