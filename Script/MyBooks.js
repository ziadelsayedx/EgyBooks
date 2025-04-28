document.addEventListener("DOMContentLoaded", function () {
  const currentUser = JSON.parse(localStorage.getItem("CurrentUser"));

  if (!currentUser) {
    window.location.href = "Login.html";
    return;
  }

  renderBooks();

  function renderBooks() {
    let allBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];

    let myBooks = allBooks.filter(
      (book) => book.userId === currentUser.username
    );

    const booksContainer = document.getElementById("booksContainer");
    booksContainer.innerHTML = "";

    if (myBooks.length === 0) {
      booksContainer.innerHTML =
        '<div class="no-books">No books in your collection yet.</div>';
      return;
    }

    myBooks.forEach((book) => {
      const bookCard = document.createElement("div");
      bookCard.className = "book-card";
      bookCard.dataset.id = book.id;

      const isOwned = book.type === "purchase";

      bookCard.innerHTML = `
                <img src="${
                  book.image || "Style/Images/default-book.jpg"
                }" alt="Book Cover" class="book-cover">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author || "Unknown Author"}</p>
                <div class="status-container">
                    ${
                      isOwned
                        ? `<div class="owned-badge">Owned</div>
                         <button class="return-btn">Remove Book</button>`
                        : `<button class="status-btn ${
                            book.status
                          }">${getStatusText(book.status)}</button>
                         <button class="return-btn">Return Book</button>`
                    }
                </div>
            `;

      booksContainer.appendChild(bookCard);
    });

    addEventListeners();
  }

  function getStatusText(status) {
    const statusMap = {
      planned: "Plan to Read",
      reading: "Reading",
      completed: "Completed",
      owned: "Owned",
    };
    return statusMap[status] || status;
  }

  function updateStatus(bookId) {
    let allBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];
    const bookIndex = allBooks.findIndex((book) => book.id === bookId);

    if (bookIndex === -1) return;

    const statusOrder = ["planned", "reading", "completed"];
    const currentStatus = allBooks[bookIndex].status;
    const currentStatusIndex = statusOrder.indexOf(currentStatus);

    const nextStatusIndex = (currentStatusIndex + 1) % statusOrder.length;
    allBooks[bookIndex].status = statusOrder[nextStatusIndex];

    localStorage.setItem("libraryBooks", JSON.stringify(allBooks));

    renderBooks();
  }

  function removeBook(bookId) {
    let allBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];
    const bookIndex = allBooks.findIndex((book) => book.id === bookId);

    if (bookIndex !== -1) {
      allBooks.splice(bookIndex, 1);
      localStorage.setItem("libraryBooks", JSON.stringify(allBooks));
      renderBooks();
    }
  }

  function showReturnConfirmation(bookId) {
    const modal = document.getElementById("returnModal");
    const modalTitle = document.querySelector(".modal-title");
    const modalMessage = document.querySelector(".modal-message");

    modalTitle.textContent = "Return Book";
    modalMessage.textContent = "Are you sure you want to return this book?";
    modal.style.display = "flex";

    const confirmBtn = document.querySelector(".confirm-btn");
    const cancelBtn = document.querySelector(".cancel-btn");

    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = function () {
      removeBook(bookId);
      modal.style.display = "none";
    };

    cancelBtn.onclick = function () {
      modal.style.display = "none";
    };

    const outsideClickHandler = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
        window.removeEventListener("click", outsideClickHandler);
      }
    };

    window.addEventListener("click", outsideClickHandler);
  }

  function showRemoveConfirmation(bookId) {
    const modal = document.getElementById("returnModal");
    const modalTitle = document.querySelector(".modal-title");
    const modalMessage = document.querySelector(".modal-message");

    modalTitle.textContent = "Remove Book";
    modalMessage.textContent =
      "Are you sure you want to permanently remove this book from your collection?";
    modal.style.display = "flex";

    const confirmBtn = document.querySelector(".confirm-btn");
    const cancelBtn = document.querySelector(".cancel-btn");

    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = function () {
      removeBook(bookId);
      modal.style.display = "none";
      modalTitle.textContent = "Return Book";
      modalMessage.textContent = "Are you sure you want to return this book?";
    };

    cancelBtn.onclick = function () {
      modal.style.display = "none";
      modalTitle.textContent = "Return Book";
      modalMessage.textContent = "Are you sure you want to return this book?";
    };

    const outsideClickHandler = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
        modalTitle.textContent = "Return Book";
        modalMessage.textContent = "Are you sure you want to return this book?";
        window.removeEventListener("click", outsideClickHandler);
      }
    };

    window.addEventListener("click", outsideClickHandler);
  }

  function addEventListeners() {
    document.querySelectorAll(".status-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bookCard = e.target.closest(".book-card");
        const bookId = bookCard.dataset.id;
        updateStatus(bookId);
      });
    });

    document.querySelectorAll(".return-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bookCard = e.target.closest(".book-card");
        const bookId = bookCard.dataset.id;
        if (e.target.textContent === "Remove Book") {
          showRemoveConfirmation(bookId);
        } else {
          showReturnConfirmation(bookId);
        }
      });
    });
  }
});
