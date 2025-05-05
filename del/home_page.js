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

    booksToDisplay.forEach((book) => {
      const bookCard = document.createElement("div");
      bookCard.className = "book-card";
      bookCard.dataset.title = book.title;

      bookCard.innerHTML = `
        <img src="${book.image || "Style/Images/default-book.jpg"}" alt="${
        book.title
      }">
        <h3>${book.title}</h3>
        <p>Author: ${book.author || "Unknown Author"}</p>
        <p>Stock: ${book.quantity || "N/A"}</p>
        <p>Price: $${book.price || "0.00"}</p>
        <div class="book-card-buttons">
          <button class="add-cart-btn">Add to Cart</button>
          <a href="ViewBook.html" class="view-book-details">View Details</a>
        </div>
      `;

      grid.appendChild(bookCard);
    });

    addViewDetailsListeners();

    document.querySelectorAll(".add-cart-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookCard = this.closest(".book-card");
        const book = books.find((b) => b.title === bookCard.dataset.title);

        if (book) {
          cart.addItem({
            id: book.id,
            title: book.title,
            author: book.author,
            price: parseFloat(book.price),
            image: book.image,
          });
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
