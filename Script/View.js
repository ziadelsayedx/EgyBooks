document.addEventListener("DOMContentLoaded", function () {
  const viewedBook = JSON.parse(localStorage.getItem("ViewedBook"));
  const borrowButton = document.getElementById("BorrowBookButton");
  const successModal = document.getElementById("successModal");
  const alreadyModal = document.getElementById("alreadyInCartModal");
  const okButton = document.getElementById("okButton");
  const alreadyOkButton = document.getElementById("alreadyOkButton");

  if (!viewedBook) {
    alert("No book data available.");
    window.location.href = "home_page.html";
    return;
  }

  viewedBook.price = parseFloat(
    typeof viewedBook.price === "string"
      ? viewedBook.price.replace("$", "")
      : viewedBook.price
  );
  viewedBook.stock = parseInt(viewedBook.stock);
  viewedBook.id =
    viewedBook.id || viewedBook.title.replace(/\s+/g, "-").toLowerCase();

  document.getElementById("BookCover").src =
    viewedBook.image || "Style/Images/Plain Book.png";
  const bookInfoDiv = document.querySelector(".BookInfo");
  bookInfoDiv.innerHTML = `
      <p><strong>Book Title:</strong> ${viewedBook.title}</p>
      <p><strong>Author:</strong> ${viewedBook.author}</p>
      <p><strong>Stock:</strong> ${viewedBook.stock}</p>
      <p><strong>Price:</strong> $${viewedBook.price}</p>
      <p><strong>Description:</strong> ${
        viewedBook.description || "No description available"
      }</p>
    `;

  const currentUser = JSON.parse(localStorage.getItem("CurrentUser")) || {
    books: [],
  };
  const alreadyOwned = currentUser.books.some(
    (book) => book.title === viewedBook.title
  );
  if (alreadyOwned) {
    borrowButton.disabled = true;
    borrowButton.style.backgroundColor = "#d3d3d3";
    borrowButton.style.cursor = "not-allowed";
    borrowButton.value = "Already Borrowed";
  } else if (viewedBook.stock <= 0) {
    borrowButton.disabled = true;
    borrowButton.style.backgroundColor = "#d3d3d3";
    borrowButton.style.cursor = "not-allowed";
    borrowButton.value = "Out of Stock";
  }

  borrowButton.addEventListener("click", function () {
    const isInCart = cart.items.find((item) => item.id === viewedBook.id);
    if (isInCart) {
      alreadyModal.style.display = "flex";
      return;
    }

    cart.addItem(viewedBook);
    successModal.style.display = "flex";
  });

  okButton.addEventListener(
    "click",
    () => (successModal.style.display = "none")
  );
  alreadyOkButton.addEventListener(
    "click",
    () => (alreadyModal.style.display = "none")
  );
});
