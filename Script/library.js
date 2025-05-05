document.addEventListener("DOMContentLoaded", function () {
    const booksGrid = document.querySelector(".books-grid");
    const genreItems = document.querySelectorAll(".genre-item");
    const currentUser = JSON.parse(localStorage.getItem("CurrentUser"));
    const isAdmin = currentUser && currentUser.role === 'admin';
    const successModal = document.getElementById('successModal');
    const alreadyModal = document.getElementById('alreadyInCartModal');
    const okButton = document.getElementById('okButton');
    const alreadyOkButton = document.getElementById('alreadyOkButton');
    const booksColumn = document.querySelector(".books-column");

    if (isAdmin && booksColumn) {
        const addBookBtn = document.createElement('button');
        addBookBtn.className = 'add-book-btn';
        addBookBtn.innerHTML = `<a href="Add.html">+ Add Book</a>`;
        booksColumn.insertBefore(addBookBtn, booksGrid);
    }

    if (okButton) okButton.addEventListener('click', () => successModal.style.display = 'none');
    if (alreadyOkButton) alreadyOkButton.addEventListener('click', () => alreadyModal.style.display = 'none');

    function displayBooks(selectedGenre = 'all') {
        booksGrid.innerHTML = '';

        const books = JSON.parse(localStorage.getItem("books")) || [];

        const filteredBooks = selectedGenre === 'all'
            ? books
            : books.filter(book => {
                const bookGenre = (book.genre || '').toLowerCase().replace(/\s+/g, '');
                const selected = selectedGenre.toLowerCase().replace(/\s+/g, '');
                return bookGenre === selected;
            });

        if (filteredBooks.length === 0) {
            booksGrid.innerHTML = `<p style="text-align:center;">No books found in this genre.</p>`;
            return;
        }

        filteredBooks.forEach(book => {
            const card = document.createElement("div");
            card.className = "book-card";
            card.innerHTML = `
                <img src="${book.image}" class="book-image" alt="Book Cover">
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-actions">
                        <button class="view-btn" data-id="${book.title}">View</button>
                        <button class="borrow-btn" data-id="${book.title}">Add To Cart</button>
                        ${isAdmin ? `<button class="delete-btn" data-id="${book.title}">Delete</button>` : ''}
                    </div>
                </div>
            `;
            booksGrid.appendChild(card);
        });
    }

    displayBooks();
    genreItems.forEach(item => {
        item.addEventListener('click', function () {
            genreItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const genre = this.getAttribute('data-genre') || 'all';
            displayBooks(genre);
        });
    });

    booksGrid.addEventListener("click", function (e) {
        const bookId = e.target.getAttribute("data-id");
        if (!bookId) return;

        const books = JSON.parse(localStorage.getItem("books")) || [];
        const bookIndex = books.findIndex(b => b.title === bookId);
        const book = books[bookIndex];
        if (!book) return;

        if (e.target.classList.contains("delete-btn")) {
            books.splice(bookIndex, 1);
            localStorage.setItem("books", JSON.stringify(books));
            location.reload();
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
                releaseDate: book.releaseDate || "Unknown"
            };
            localStorage.setItem("ViewedBook", JSON.stringify(viewedBook));
            window.location.href = "ViewBook.html";
        }

        if (e.target.classList.contains("borrow-btn")) {
            const cartData = JSON.parse(localStorage.getItem('cartItems')) || [];

            const cart = {
                items: cartData,
                save() {
                    localStorage.setItem('cartItems', JSON.stringify(this.items));
                },
                addItem(book) {
                    this.items.push(book);
                    this.save();
                }
            };

            const cartBookId = book.title.replace(/\s+/g, '-').toLowerCase();
            const alreadyInCart = cart.items.find(item => item.id === cartBookId);

            if (alreadyInCart) {
                if (alreadyModal) alreadyModal.style.display = 'flex';
                return;
            }

            const borrowedBook = {
                title: book.title.replace(/<br>/g, ' ').trim(),
                author: book.author || '',
                image: book.image,
                stock: parseInt(book.stock) || 1,
                price: parseFloat(typeof book.price === 'string' ? book.price.replace('$', '') : book.price) || 10,
                id: cartBookId,
            };

            cart.addItem(borrowedBook);
            e.target.textContent = "Added to Cart";
            e.target.disabled = true;
            e.target.style.backgroundColor = "#95a5a6";
            e.target.style.cursor = "not-allowed";

            if (successModal) successModal.style.display = 'flex';
        }
    });
});
