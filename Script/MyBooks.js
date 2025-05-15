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

    // Combine duplicate books and sum their quantities
    let combinedBooks = myBooks.reduce((acc, book) => {
      const existingBook = acc.find(b => b.title === book.title && b.type === book.type);
      
      if (existingBook) {
        existingBook.quantity = (parseInt(existingBook.quantity) || 1) + (parseInt(book.quantity) || 1);
      } else {
        acc.push({...book, quantity: parseInt(book.quantity) || 1});
      }
      return acc;
    }, []);

    const booksContainer = document.getElementById("booksContainer");
    booksContainer.innerHTML = "";

    if (combinedBooks.length === 0) {
      booksContainer.innerHTML =
        '<div class="no-books">No books in your collection yet.</div>';
      return;
    }

    combinedBooks.forEach((book) => {
      const bookCard = document.createElement("div");
      bookCard.className = `book-card ${book.type}-card`;
      bookCard.dataset.id = book.id;

      const isOwned = book.type === "purchase";

      bookCard.innerHTML = `
                <img src="${
                  book.image || "Style/Images/default-book.jpg"
                }" alt="Book Cover" class="book-cover">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author || "Unknown Author"}</p>
                ${
                  isOwned
                    ? `
                    <div class="book-actions">
                        <div class="owned-badge">Owned <span class="owned-quantity">(${book.quantity})</span></div>
                        <button class="return-btn remove-btn">Remove Book</button>
                    </div>
                    `
                    : `
                    <div class="borrow-info">
                        <button class="status-btn ${book.status}">${getStatusText(book.status)}</button>
                        <button class="return-btn">Return Book</button>
                    </div>
                    `
                }
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
    const returnedBook = allBooks[bookIndex];
    
    if (returnedBook.type === "borrow") {
      const booksData = JSON.parse(localStorage.getItem("books")) || [];
      const bookDataIndex = booksData.findIndex(b => b.title === returnedBook.title);
      
      if (bookDataIndex !== -1) {
        const currentStock = parseInt(booksData[bookDataIndex].quantity) || 0;
        booksData[bookDataIndex].quantity = currentStock + 1;
        localStorage.setItem("books", JSON.stringify(booksData));
      }
    } else if (returnedBook.type === "purchase") {
      // For purchased books, check if there are multiple quantities
      const quantity = parseInt(returnedBook.quantity) || 1;
      if (quantity > 1) {
        // If quantity > 1, decrease quantity by 1
        returnedBook.quantity = quantity - 1;
        allBooks[bookIndex] = returnedBook;
        localStorage.setItem("libraryBooks", JSON.stringify(allBooks));
        renderBooks();
        return;
      }
    }
    
    // If quantity is 1 or it's a borrowed book, remove the entire entry
    allBooks.splice(bookIndex, 1);
    localStorage.setItem("libraryBooks", JSON.stringify(allBooks));
    renderBooks();
    
    if (window.location.pathname.includes("Profile.html")) {
      updateProfileBooksCount();
    }
  }
}

function updateProfileBooksCount() {
    const currentUser = JSON.parse(localStorage.getItem("CurrentUser"));
    if (!currentUser) return;
    
    const borrowedCount = JSON.parse(localStorage.getItem("libraryBooks")) || []
        .filter(book => book.userId === currentUser.username && book.type === "borrow")
        .length;
    
    const borrowedCountElement = document.querySelector(".UserInfo p:nth-of-type(5)");
    if (borrowedCountElement) {
        borrowedCountElement.innerHTML = `<strong>Books Borrowed:</strong> ${borrowedCount}`;
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
    const modalButtons = document.querySelector(".modal-buttons");

    modalTitle.textContent = "Remove Book";
    modalMessage.textContent = "How would you like to remove this book?";
    
    // Create grid of options
    modalButtons.innerHTML = `
      <div class="remove-options-grid">
        <button class="remove-option" data-action="one">
          <div class="option-icon">-1</div>
          <div class="option-text">Remove One Copy</div>
        </button>
        <button class="remove-option" data-action="all">
          <div class="option-icon">×</div>
          <div class="option-text">Remove All Copies</div>
        </button>
        <button class="remove-option cancel-option" data-action="cancel">
          <div class="option-icon">←</div>
          <div class="option-text">Cancel</div>
        </button>
      </div>
    `;

    modal.style.display = "flex";

    // Add event listeners for the options
    modalButtons.querySelectorAll('.remove-option').forEach(button => {
      button.onclick = function() {
        const action = this.getAttribute('data-action');
        
        if (action === 'cancel') {
          modal.style.display = "none";
          return;
        }

        let allBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];
        const bookIndex = allBooks.findIndex((book) => book.id === bookId);

        if (bookIndex !== -1) {
          const book = allBooks[bookIndex];
          
          if (action === 'one' && book.quantity > 1) {
            // Remove one copy
            book.quantity--;
            allBooks[bookIndex] = book;
          } else {
            // Remove all copies or last copy
            allBooks.splice(bookIndex, 1);
          }
          
          localStorage.setItem("libraryBooks", JSON.stringify(allBooks));
          renderBooks();
        }

        modal.style.display = "none";
      };
    });

    const outsideClickHandler = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
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
