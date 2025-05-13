document.addEventListener("DOMContentLoaded", function () {
    const updateButton = document.getElementById("UpdateBookButton");
    const successModal = document.getElementById("successModal");
    const okButton = document.getElementById("okButton");
    const imgUpload = document.getElementById("imgUpload");
    const originalTitleInput = document.getElementById("originalTitle");
    const currentImageInput = document.getElementById("currentImage");
    const imageFileName = document.getElementById("imageFileName");

    const bookToEdit = JSON.parse(localStorage.getItem("bookToEdit"));
    
    if (bookToEdit) {
        document.getElementById("title").value = bookToEdit.title || "";
        document.getElementById("author").value = bookToEdit.author || "";
        document.getElementById("quantity").value = bookToEdit.quantity || "";
        document.getElementById("price").value = bookToEdit.price || "";
        document.getElementById("description").value = bookToEdit.description || "";
        document.getElementById("releaseDate").value = bookToEdit.releaseDate || "";
        document.getElementById("Dropdown").value = bookToEdit.genre || "";
        originalTitleInput.value = bookToEdit.title || "";
        currentImageInput.value = bookToEdit.image || "Style/Images/Plain Book.png";
    }

    imgUpload.addEventListener("change", function() {
        if (this.files.length > 0) {
            imageFileName.textContent = this.files[0].name;
        } else {
            imageFileName.textContent = "";
        }
    });

    updateButton.addEventListener("click", function () {
        let title = document.getElementById("title");
        let author = document.getElementById("author");
        let quantity = document.getElementById("quantity");
        let price = document.getElementById("price");
        let description = document.getElementById("description");
        let releaseDate = document.getElementById("releaseDate");
        let genre = document.getElementById("Dropdown");
        let originalTitle = originalTitleInput.value;

        clearError(title);
        clearError(author);
        clearError(quantity);
        clearError(price);
        clearError(releaseDate);
        clearError(genre);

        let hasError = false;

        if (title.value.trim() === "") {
            addRedBorder(title);
            hasError = true;
        }
        if (author.value.trim() === "") {
            addRedBorder(author);
            hasError = true;
        }
        if (quantity.value.trim() === "" || isNaN(quantity.value) || quantity.value <= 0) {
            addRedBorder(quantity);
            hasError = true;
        }
        if (price.value.trim() === "" || isNaN(price.value) || price.value <= 0) {
            addRedBorder(price);
            hasError = true;
        }
        if (releaseDate.value === "") {
            addRedBorder(releaseDate);
            hasError = true;
        }
        if (genre.value === "") {
            addRedBorder(genre);
            hasError = true;
        }

        if (hasError) return;

        let bookImage = imgUpload.files[0];
        let updatedBook = {
            title: title.value.trim(),
            author: author.value.trim(),
            quantity: quantity.value.trim(),
            price: price.value.trim(),
            description: description.value.trim(),  
            releaseDate: releaseDate.value,
            genre: genre.value,
            image: currentImageInput.value 
        };

        if (bookImage) {
            const reader = new FileReader();
            reader.onload = function (e) {
                updatedBook.image = e.target.result;
                updateBookInStorage(updatedBook, originalTitle);
            };
            reader.readAsDataURL(bookImage);
        } else {
            updateBookInStorage(updatedBook, originalTitle);
        }
    });

    function updateBookInStorage(updatedBook, originalTitle) {
        let existingBooks = JSON.parse(localStorage.getItem("books")) || [];
        
        const bookIndex = existingBooks.findIndex(book => book.title === originalTitle);
        
        if (bookIndex !== -1) {
            existingBooks[bookIndex] = updatedBook;
            localStorage.setItem("books", JSON.stringify(existingBooks));
            
            let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
            const cartItemIndex = cartItems.findIndex(item => item.title === originalTitle);
            if (cartItemIndex !== -1) {
                cartItems[cartItemIndex].title = updatedBook.title;
                cartItems[cartItemIndex].author = updatedBook.author;
                cartItems[cartItemIndex].image = updatedBook.image;
                cartItems[cartItemIndex].price = parseFloat(updatedBook.price) || 0;
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            }
            
            successModal.style.display = "flex";
        }
    }

    function addRedBorder(inputElement) {
        inputElement.classList.add("input-error");
    }

    function clearError(inputElement) {
        inputElement.classList.remove("input-error");
    }

    okButton.addEventListener("click", function () {
        window.location.href = "library.html";
    });
});