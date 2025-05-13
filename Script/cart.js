const cart = {
  items: JSON.parse(localStorage.getItem("cartItems")) || [],

  addItem: function (book, action = "purchase") {
    const existingItem = this.items.find(
      (item) => item.id === book.id && item.title === book.title
    );

    if (existingItem) {
      if (action === "purchase") {
        const books = JSON.parse(localStorage.getItem("books")) || [];
        const bookData = books.find((b) => b.title === book.title);
        if (bookData && parseInt(bookData.quantity) <= existingItem.quantity) {
          this.showModal(
            "Out of Stock",
            `Cannot add more. Only ${bookData.quantity} available in stock.`
          );
          return false;
        }
        existingItem.quantity += 1;
      } else if (action === "borrow") {
        this.showModal(
          "Borrowing Rule",
          "You can only borrow one copy of each book."
        );
        return false;
      }
    } else {
      if (action === "purchase") {
        const books = JSON.parse(localStorage.getItem("books")) || [];
        const bookData = books.find((b) => b.title === book.title);
        if (bookData && parseInt(bookData.quantity) < 1) {
          this.showModal(
            "Out of Stock",
            `"${book.title}" is currently out of stock.`
          );
          return false;
        }
      }

      const quantity = action === "borrow" ? 1 : 1;
      this.items.push({
        ...book,
        quantity: quantity,
        selected: true,
        actionType: action,
      });
    }
    this.saveCart();
    this.updateCartCount();
    return true;
  },

  removeItem: function (id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.saveCart();
    this.updateCartCount();
    if (window.location.pathname.includes("cart.html")) {
      this.displayCartItems();
    }
  },

  updateQuantity: function (id, change) {
    const item = this.items.find((item) => item.id === id);
    if (item) {
      if (item.actionType === "borrow" && change > 0) {
        this.showModal(
          "Borrowing Rule",
          "You can only borrow one copy of each book."
        );
        return;
      }

      if (change > 0 && item.actionType === "purchase") {
        const books = JSON.parse(localStorage.getItem("books")) || [];
        const book = books.find((b) => b.title === item.title);
        if (book && parseInt(book.quantity) < item.quantity + change) {
          this.showModal(
            "Out of Stock",
            `Only ${book.quantity} available in stock.`
          );
          return;
        }
      }

      item.quantity += change;
      if (item.quantity < 1) {
        this.removeItem(id);
      } else {
        this.saveCart();
        if (window.location.pathname.includes("cart.html")) {
          this.displayCartItems();
        }
      }
    }
  },

  toggleSelection: function (id) {
    const item = this.items.find((item) => item.id === id);
    if (item) {
      item.selected = !item.selected;
      this.saveCart();
    }
  },

  saveCart: function () {
    localStorage.setItem("cartItems", JSON.stringify(this.items));
  },

  updateCartCount: function () {
    const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
      cartCountElement.textContent = totalItems;
    }
  },

  getSelectedItems: function () {
    return this.items.filter((item) => item.selected);
  },

  displayCartItems: function () {
    const cartContainer = document.getElementById("cart-items-container");
    const cartTotalElement = document.querySelector(".cart-total");

    if (!cartContainer) return;

    if (this.items.length === 0) {
      cartContainer.innerHTML =
        '<div class="empty-cart">Your cart is empty</div>';
      cartTotalElement.textContent = "Total: $0.00";
      return;
    }

    cartContainer.innerHTML = "";
    let total = 0;
    let selectedTotal = 0;

    this.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      if (item.selected) selectedTotal += itemTotal;

      const itemElement = document.createElement("div");
      itemElement.className = "cart-item";
      itemElement.innerHTML = `
        <div class="item-select">
          <input type="checkbox" id="select-${item.id}" 
                ${item.selected ? "checked" : ""} 
                data-id="${item.id}" class="item-checkbox">
        </div>
        <img src="${item.image || "Style/Images/default-book.jpg"}" 
             alt="${item.title}" class="cart-item-image">
        <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-author">${
              item.author || "Unknown Author"
            }</div>
            <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
            <div class="cart-item-quantity">Quantity: ${item.quantity}</div>
            <div class="cart-item-type">Type: ${
              item.actionType || "purchase"
            }</div>
        </div>
        <div class="cart-actions">
            <button class="quantity-btn decrease" data-id="${
              item.id
            }">-</button>
            <button class="quantity-btn increase" data-id="${
              item.id
            }">+</button>
            <button class="cart-remove" data-id="${item.id}">Remove</button>
        </div>
      `;

      cartContainer.appendChild(itemElement);
    });

    cartTotalElement.textContent = `Total: $${total.toFixed(
      2
    )} (Selected: $${selectedTotal.toFixed(2)})`;
  },

  processCheckout: function (action, processAll = false) {
    const itemsToProcess = processAll ? this.items : this.getSelectedItems();

    if (itemsToProcess.length === 0) {
      this.showModal("Empty Selection", `Please select items to ${action}!`);
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("CurrentUser"));
    if (!currentUser) {
      this.showModal("Error", "You need to be logged in!");
      return;
    }

    const allBooks = JSON.parse(localStorage.getItem("books")) || [];

    for (const item of itemsToProcess) {
      const bookIndex = allBooks.findIndex((b) => b.title === item.title);
      if (bookIndex === -1) continue;

      const book = allBooks[bookIndex];
      const currentStock = parseInt(book.quantity) || 0;

      if (action === "purchase") {
        if (currentStock < item.quantity) {
          this.showModal(
            "Out of Stock",
            `Not enough stock for "${item.title}". Only ${currentStock} available.`
          );
          return;
        }
      } else if (action === "borrow") {
        if (currentStock < 1) {
          this.showModal(
            "Out of Stock",
            `"${item.title}" is currently not available for borrowing.`
          );
          return;
        }
      }
    }

    if (action === "borrow") {
      const libraryBooks =
        JSON.parse(localStorage.getItem("libraryBooks")) || [];
      const userBorrowedBooks = libraryBooks.filter(
        (book) => book.userId === currentUser.username && book.type === "borrow"
      );

      const duplicateBorrows = itemsToProcess.filter((item) =>
        userBorrowedBooks.some((b) => b.title === item.title)
      );

      if (duplicateBorrows.length > 0) {
        const bookTitles = duplicateBorrows
          .map((b) => `"${b.title}"`)
          .join(", ");
        this.showModal(
          "Borrowing Error",
          `You can only borrow one copy of each book. You already have: ${bookTitles}`
        );
        return;
      }
    }

    for (const item of itemsToProcess) {
      const bookIndex = allBooks.findIndex((b) => b.title === item.title);
      if (bookIndex === -1) continue;

      const book = allBooks[bookIndex];
      const currentStock = parseInt(book.quantity) || 0;

      if (action === "purchase") {
        book.quantity = currentStock - item.quantity;
      } else if (action === "borrow") {
        book.quantity = currentStock - 1;
      }
    }

    localStorage.setItem("books", JSON.stringify(allBooks));

    let libraryBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];

    itemsToProcess.forEach((item) => {
      libraryBooks.push({
        id: crypto.randomUUID(),
        title: item.title,
        author: item.author,
        image: item.image,
        price: item.price,
        type: action,
        status: action === "borrow" ? "reading" : "owned",
        userId: currentUser.username,
        dateAdded: new Date().toISOString(),
      });
    });

    localStorage.setItem("libraryBooks", JSON.stringify(libraryBooks));

    if (processAll) {
      this.items = [];
    } else {
      this.items = this.items.filter((item) => !item.selected);
    }

    this.saveCart();
    this.updateCartCount();
    this.displayCartItems();

    itemCount = itemsToProcess.reduce((sum, item) => sum + item.quantity, 0);
    const actionText = action === "purchase" ? "purchased" : "borrowed";
    if (actionText == "borrowed") itemCount = 1;
    this.showModal(
      "Success",
      `You've successfully ${actionText} ${itemCount} items!`
    );

    if (window.location.pathname.includes("Profile.html")) {
      const borrowedCount = libraryBooks.filter(
        (book) => book.userId === currentUser.username && book.type === "borrow"
      ).length;

      const borrowedCountElement = document.querySelector(
        ".UserInfo p:nth-of-type(5)"
      );
      if (borrowedCountElement) {
        borrowedCountElement.innerHTML = `<strong>Books Borrowed:</strong> ${borrowedCount}`;
      }
    }
  },

  showModal: function (title, message) {
    const modal = document.getElementById("successModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const okButton = document.getElementById("modalOkButton");

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    modal.style.display = "flex";

    okButton.onclick = function () {
      modal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  },

  getTotal: function () {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },
};

document.addEventListener("DOMContentLoaded", function () {
  cart.updateCartCount();

  if (window.location.pathname.includes("cart.html")) {
    cart.displayCartItems();

    document.addEventListener("click", function (e) {
      const target = e.target;
      const id = target.getAttribute("data-id");

      if (target.classList.contains("decrease")) {
        cart.updateQuantity(id, -1);
      } else if (target.classList.contains("increase")) {
        cart.updateQuantity(id, 1);
      } else if (target.classList.contains("cart-remove")) {
        cart.removeItem(id);
      }
    });

    document.addEventListener("change", function (e) {
      if (e.target.classList.contains("item-checkbox")) {
        const id = e.target.getAttribute("data-id");
        cart.toggleSelection(id);
        cart.displayCartItems();
      }
    });

    document
      .getElementById("buy-selected")
      .addEventListener("click", function () {
        cart.processCheckout("purchase");
      });

    document
      .getElementById("borrow-selected")
      .addEventListener("click", function () {
        cart.processCheckout("borrow");
      });

    document
      .getElementById("checkout-all")
      .addEventListener("click", function () {
        cart.processCheckout("purchase", true);
      });
  }
});
