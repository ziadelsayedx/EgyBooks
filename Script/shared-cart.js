// Shared cart functionality
const sharedCart = {
    updateCartCount: function() {
        const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElements = document.querySelectorAll("#cart-count");
        cartCountElements.forEach(element => {
            if (element) {
                element.textContent = totalItems;
            }
        });
    },

    addToCart: function(book) {
        const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
        const bookId = book.title.replace(/\s+/g, "-").toLowerCase();
        
        // Check if already in cart
        if (cartItems.some(item => item.id === bookId)) {
            return false;
        }

        const cartItem = {
            id: bookId,
            title: book.title,
            author: book.author || "Unknown",
            image: book.image || "Style/Images/default-book.jpg",
            price: parseFloat(book.price) || 0,
            quantity: 1,
            actionType: "purchase",
            selected: true,
        };

        cartItems.push(cartItem);
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
        this.updateCartCount();
        return true;
    }
};

// Update cart count when page loads
document.addEventListener("DOMContentLoaded", function() {
    sharedCart.updateCartCount();
}); 