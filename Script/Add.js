document.addEventListener("DOMContentLoaded", function () {
    const addButton = document.getElementById("AddBookButton");
    const successModal = document.getElementById("successModal");
    const okButton = document.getElementById("okButton");
    const imgUpload = document.getElementById("imgUpload");

    addButton.addEventListener("click", function () {
        let title = document.getElementById("title");
        let author = document.getElementById("author");
        let quantity = document.getElementById("quantity");
        let price = document.getElementById("price");
        let description = document.getElementById("description");
        let releaseDate = document.getElementById("releaseDate");
        let genre = document.getElementById("Dropdown");

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
        let newBook = {
            title: title.value.trim(),
            author: author.value.trim(),
            quantity: quantity.value.trim(),
            price: price.value.trim(),
            description: description.value.trim(),  
            releaseDate: releaseDate.value,
            genre: genre.value,
            image: "" 
        };

        if (bookImage) {
            const reader = new FileReader();
            reader.onload = function (e) {
                newBook.image = e.target.result;
                saveBook(newBook);
            };
            reader.readAsDataURL(bookImage);
        } else {
            newBook.image = "Style/Images/Plain Book.png"; 
            saveBook(newBook);
        }
    });

    function saveBook(book) {
        let existingBooks = JSON.parse(localStorage.getItem("books")) || [];
        existingBooks.push(book);
        localStorage.setItem("books", JSON.stringify(existingBooks));

        successModal.style.display = "flex";

        document.getElementById("title").value = "";
        document.getElementById("author").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("price").value = "";
        document.getElementById("description").value = ""; 
        document.getElementById("releaseDate").value = "";
        document.getElementById("Dropdown").value = "";
        document.getElementById("imgUpload").value = "";
    }

    function addRedBorder(inputElement) {
        inputElement.classList.add("input-error");
    }

    function clearError(inputElement) {
        inputElement.classList.remove("input-error");
    }

    okButton.addEventListener("click", function () {
        successModal.style.display = "none";
    });
});
