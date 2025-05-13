document.addEventListener("DOMContentLoaded", function () {
  const booksGrid = document.querySelector(".books-grid");
  const genreItems = document.querySelectorAll(".genre-item");
  const currentUser = JSON.parse(localStorage.getItem("CurrentUser"));
  const isAdmin = currentUser && currentUser.role === "admin";
  const successModal = document.getElementById("successModal");
  const alreadyModal = document.getElementById("alreadyInCartModal");
  const okButton = document.getElementById("okButton");
  const alreadyOkButton = document.getElementById("alreadyOkButton");
  const booksColumn = document.querySelector(".books-column");

  if (isAdmin && booksColumn) {
    const addBookBtn = document.createElement("button");
    addBookBtn.className = "add-book-btn";
    addBookBtn.innerHTML = `<a href="Add.html">+ Add Book</a>`;
    booksColumn.insertBefore(addBookBtn, booksGrid);
  }

  if (okButton)
    okButton.addEventListener(
      "click",
      () => (successModal.style.display = "none")
    );
  if (alreadyOkButton)
    alreadyOkButton.addEventListener(
      "click",
      () => (alreadyModal.style.display = "none")
    );

  function displayBooks(selectedGenre = "all") {
    booksGrid.innerHTML = "";
    const books = JSON.parse(localStorage.getItem("books")) || [];

    const normalized = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

    const filteredBooks =
      selectedGenre === "all"
        ? books
        : books.filter(
            (book) => normalized(book.genre) === normalized(selectedGenre)
          );

    if (filteredBooks.length === 0) {
      booksGrid.innerHTML = `<p style="text-align:center;">No books found in this genre.</p>`;
      return;
    }

    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const cartIds = cartItems.map((item) => item.id);

    filteredBooks.forEach((book) => {
      const card = document.createElement("div");
      card.className = "book-card";

      const bookId = book.title.replace(/\s+/g, "-").toLowerCase();
      const isInCart = cartIds.includes(bookId);
      const isOutOfStock = parseInt(book.quantity) <= 0;

      card.innerHTML = `
  ${
    isAdmin
      ? `
  <button class="edit-btn" data-id="${book.title}">✏️</button>
  <button class="delete-btn" data-id="${book.title}">X</button>
  `
      : ""
  }
  <img src="${book.image}" class="book-image" alt="Book Cover">
  <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div class="book-author">Author: ${book.author || "Unknown"}</div>
      <div class="book-stock">Stock: ${book.quantity || "0"}</div>
      <div class="book-price">Price: $${book.price || "0.00"}</div>
      <div class="book-actions">
          <button class="view-btn" data-id="${book.title}">View</button>
          <button class="borrow-btn" data-id="${book.title}" ${
        isInCart || isOutOfStock
          ? 'disabled style="background-color: #95a5a6; cursor: not-allowed;"'
          : ""
      }>
              ${
                isInCart
                  ? "Added to Cart"
                  : isOutOfStock
                  ? "Out of Stock"
                  : "Add To Cart"
              }
          </button>
      </div>
  </div>
`;

      booksGrid.appendChild(card);
    });
  }

  displayBooks();
  genreItems.forEach((item) => {
    item.addEventListener("click", function () {
      genreItems.forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
      const genre = this.getAttribute("data-genre") || "all";
      displayBooks(genre);
    });
  });

  booksGrid.addEventListener("click", function (e) {
    const bookId = e.target.getAttribute("data-id");
    if (!bookId) return;

    const books = JSON.parse(localStorage.getItem("books")) || [];
    const bookIndex = books.findIndex((b) => b.title === bookId);
    const book = books[bookIndex];
    if (!book) return;
    if (e.target.classList.contains("delete-btn")) {
      books.splice(bookIndex, 1);
      localStorage.setItem("books", JSON.stringify(books));
      location.reload();
      return;
    }

    if (e.target.classList.contains("view-btn")) {
      const viewedBook = {
        title: book.title || "",
        author: book.author || "",
        image: book.image || "",
        stock: book.stock || "0",
        price: book.price || "0",
        description: book.description || "No description available",
        genre: book.genre || "Unknown",
        releaseDate: book.releaseDate || "Unknown",
      };
      localStorage.setItem("ViewedBook", JSON.stringify(viewedBook));
      window.location.href = "ViewBook.html";
      return;
    }
    if (e.target.classList.contains("edit-btn")) {
      const bookToEdit = books.find(b => b.title === bookId);
      if (bookToEdit) {
          localStorage.setItem("bookToEdit", JSON.stringify(bookToEdit));
          window.location.href = "Edit.html";
      }
      return;
  }
    if (e.target.classList.contains("borrow-btn")) {
      const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

      const alreadyInCart = cartItems.find((item) => item.title === book.title);

      if (alreadyInCart) {
        if (alreadyModal) alreadyModal.style.display = "flex";
        return;
      }

      const cartItem = {
        id: book.title.replace(/\s+/g, "-").toLowerCase(),
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

      e.target.textContent = "Added to Cart";
      e.target.disabled = true;
      e.target.style.backgroundColor = "#95a5a6";
      e.target.style.cursor = "not-allowed";

      if (successModal) successModal.style.display = "flex";
    }
  });
});
