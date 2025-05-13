if (
  !localStorage.getItem("books") ||
  JSON.parse(localStorage.getItem("books")).length === 0
) {
  const defaultBooks = [
    {
      id: "1",
      title: "Romeo and Juliet",
      author: "William Shakespeare",
      quantity: "15",
      price: "12",
      description: "A classic tragedy about two young star-crossed lovers",
      releaseDate: "1597-01-01",
      genre: "Fiction",
      image: "Style/Images/Romeo and Juliet.jpg",
    },
    {
      id: "2",
      title: "The Giving Tree",
      author: "Shel Silverstein",
      quantity: "10",
      price: "15",
      description: "A story about the relationship between a boy and a tree",
      releaseDate: "1964-10-07",
      genre: "Fiction",
      image: "Style/Images/The Giving Tree.jpg",
    },
  ];
  localStorage.setItem("books", JSON.stringify(defaultBooks));
}

document.addEventListener("DOMContentLoaded", function () {
  const currentUser = JSON.parse(localStorage.getItem("CurrentUser"));

  if (!currentUser) {
    window.location.href = "Login.html";
    return;
  }

  const books = JSON.parse(localStorage.getItem("books")) || [];

  displayBooksByCategory(books, "popular-books-grid", [
    "Fiction",
    "Non-Fiction",
    "Science Fiction",
  ]);
  displayBooksByCategory(books, "trending-books-grid", [
    "Fantasy",
    "Mystery",
    "Thriller",
  ]);
  displayBooksByCategory(books, "new-books-grid", [
    "Romance",
    "Horror",
    "Action",
  ]);

  initSliders();

  document
    .getElementById("search-button")
    .addEventListener("click", function () {
      const searchTerm = document.getElementById("search-input").value.trim();
      if (!searchTerm) return;

      const allBooks = JSON.parse(localStorage.getItem("books")) || [];
      const filteredBooks = allBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (book.author &&
            book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (book.genre &&
            book.genre.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      localStorage.setItem("searchResults", JSON.stringify(filteredBooks));
      window.location.href = `search_results.html?q=${encodeURIComponent(
        searchTerm
      )}`;
    });

  function addViewDetailsListeners() {
    document.querySelectorAll(".view-book-details").forEach((link) => {
      link.addEventListener("click", function (e) {
        const card = e.target.closest(".book-card");

        const title = card.querySelector("h3")?.textContent.trim();
        const image = card.querySelector("img")?.getAttribute("src");
        const paragraphs = Array.from(card.querySelectorAll("p"));

        const author = (
          paragraphs.find((p) => p.textContent.startsWith("Author:"))
            ?.textContent || ""
        ).replace("Author: ", "");
        const stock = (
          paragraphs.find((p) => p.textContent.startsWith("Stock:"))
            ?.textContent || ""
        ).replace("Stock: ", "");
        const price = (
          paragraphs.find((p) => p.textContent.startsWith("Price:"))
            ?.textContent || ""
        ).replace("Price: ", "");

        const viewedBook = {
          title,
          author,
          image,
          stock,
          price,
        };

        localStorage.setItem("ViewedBook", JSON.stringify(viewedBook));
      });
    });
  }

  function displayBooksByCategory(books, gridId, categories) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const filteredBooks = books.filter((book) =>
      categories.includes(book.genre)
    );
    const booksToDisplay = filteredBooks.slice(0, 4);

    if (booksToDisplay.length === 0) {
      grid.innerHTML =
        '<div class="no-books">No books available in this category</div>';
      return;
    }

    grid.innerHTML = "";

    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const cartIds = cartItems.map((item) => item.id);

    booksToDisplay.forEach((book) => {
      const bookId = book.title.replace(/\s+/g, "-").toLowerCase();
      const isInCart = cartIds.includes(bookId);

      const bookCard = document.createElement("div");
      bookCard.className = "book-card";
      bookCard.dataset.title = book.title;

      bookCard.innerHTML = `
        <img src="${
          book.image || "Style/Images/default-book.jpg"
        }" class="book-image" alt="${book.title}">
        <div class="book-info">
            <div class="book-title">${book.title}</div>
            <div class="book-author">Author: ${book.author || "Unknown"}</div>
            <div class="book-stock">Stock: ${book.quantity || "0"}</div>
            <div class="book-price">Price: $${book.price || "0.00"}</div>
            <div class="book-actions">
                <button class="view-btn" data-id="${book.title}">View</button>
                <button class="borrow-btn" data-id="${book.title}" ${
        isInCart
          ? 'disabled style="background-color: #95a5a6; cursor: not-allowed;"'
          : ""
      }>
                    ${isInCart ? "Added to Cart" : "Add To Cart"}
                </button>
            </div>
        </div>
      `;

      grid.appendChild(bookCard);
    });

    grid.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const bookTitle = this.getAttribute("data-id");
        const book = books.find(b => b.title === bookTitle);
        
        if (book) {
          const viewedBook = {
            title: book.title || "",
            author: book.author || "",
            image: book.image || "",
            stock: book.quantity || "0",
            price: book.price || "0",
            description: book.description || "No description available",
            genre: book.genre || "Unknown",
            releaseDate: book.releaseDate || "Unknown",
          };
          localStorage.setItem("ViewedBook", JSON.stringify(viewedBook));
          window.location.href = "ViewBook.html";
        }
      });
    });
  
    grid.querySelectorAll(".borrow-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const bookTitle = this.getAttribute("data-id");
        const book = books.find(b => b.title === bookTitle);
        
        if (book) {
          const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
          const alreadyInCart = cartItems.find(item => item.title === book.title);
  
          if (alreadyInCart) {
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
  
          this.textContent = "Added to Cart";
          this.disabled = true;
          this.style.backgroundColor = "#95a5a6";
          this.style.cursor = "not-allowed";
  
          cart.updateCartCount();
        }
      });
    });
  }
  
  function initSliders() {
    const sliders = document.querySelectorAll(".book-slider-container");

    sliders.forEach((slider) => {
      const leftArrow = slider.querySelector(".left-arrow");
      const rightArrow = slider.querySelector(".right-arrow");
      const bookSlider = slider.querySelector(".book-slider");
      const bookGrids = slider.querySelectorAll(".book-grid");

      let currentSlide = 0;
      const slideCount = bookGrids.length;

      leftArrow.style.display = "none";

      if (slideCount <= 1) {
        rightArrow.style.display = "none";
      }

      rightArrow.addEventListener("click", () => {
        currentSlide++;
        updateSlider();
      });

      leftArrow.addEventListener("click", () => {
        currentSlide--;
        updateSlider();
      });

      function updateSlider() {
        leftArrow.style.display = currentSlide === 0 ? "none" : "block";
        rightArrow.style.display =
          currentSlide === slideCount - 1 ? "none" : "block";

        bookSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
      }
    });
  }
});
