window.onload = function () {
    let userData = JSON.parse(localStorage.getItem("CurrentUser"));

    if (!userData) {
        alert("No user data found. Please log in.");
        window.location.href = "Login.html";
        return;
    }

    function countBorrowedBooks() {
        const libraryBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];
        return libraryBooks.filter(book => 
            book.userId === userData.username && book.type === "borrow"
        ).length;
    }

    function updateProfileDisplay() {
        document.getElementById("profileName").textContent = userData.name || userData.username;
        document.getElementById("profileEmail").textContent = userData.email;
        document.getElementById("profileUsername").textContent = userData.username;
        document.getElementById("profileMemberSince").textContent = userData.memberSince || new Date().toLocaleDateString();
        document.getElementById("profileBooksBorrowed").textContent = countBorrowedBooks();
    }

    updateProfileDisplay();

    const editBtn = document.getElementById("editBtn");
    const modal = document.getElementById("editModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const editForm = document.getElementById('editForm');
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const oldPasswordError = document.getElementById('oldPasswordError');
    const newPasswordError = document.getElementById('newPasswordError');
    const successModal = document.getElementById('successModal');
    const okButton = document.getElementById('okButton');

    editBtn.addEventListener("click", () => {
        document.getElementById("editName").value = userData.name || userData.username || "";
        document.getElementById("editEmail").value = userData.email || "";
        document.getElementById("editUsername").value = userData.username || "";
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    });

    const closeModalFunc = () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
        editForm.reset(); // Reset form when closing
    };

    closeModal.onclick = closeModalFunc;
    cancelBtn.onclick = closeModalFunc;
    window.onclick = function(event) {
        if (event.target === modal) closeModalFunc();
    };

    function validatePasswords() {
        let isValid = true;
        
        // Clear previous errors
        oldPasswordError.textContent = '';
        newPasswordError.textContent = '';
        oldPasswordInput.classList.remove('error-input');
        newPasswordInput.classList.remove('error-input');

        // Validate old password against actual user password
        if (oldPasswordInput.value !== userData.password) {
            oldPasswordError.textContent = 'Current password is incorrect';
            oldPasswordInput.classList.add('error-input');
            isValid = false;
        }

        // Validate new password
        if (newPasswordInput.value.length < 8 && !newPasswordInput) {
            newPasswordError.textContent = 'New password must be at least 8 characters long';
            newPasswordInput.classList.add('error-input');
            isValid = false;
        }

        return isValid;
    }

    editForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById("editName").value.trim();
        const email = document.getElementById("editEmail").value.trim();
        const username = document.getElementById("editUsername").value.trim();
        
        if (!name || !email || !username) {
            alert("Please fill in all required fields");
            return;
        }
        if (newPasswordInput.value == "") {
            newPasswordInput.value = userData.password;
        }
        if (validatePasswords()) {
            const updatedUserData = {
                ...userData,
                name: name,
                email: email,
                username: username,
                password: newPasswordInput.value, // Update with new password
                memberSince: userData.memberSince || new Date().toLocaleDateString()
            };

            // Update CurrentUser in localStorage
            localStorage.setItem("CurrentUser", JSON.stringify(updatedUserData));

            // Update user in users array
            const users = JSON.parse(localStorage.getItem("users")) || [];
            const userIndex = users.findIndex(u => u.username === userData.username || u.email === userData.email);
            
            if (userIndex !== -1) {
                users[userIndex] = updatedUserData;
                localStorage.setItem("users", JSON.stringify(users));
            }

            // Update username in library books if username changed
            if (username !== userData.username) {
                const libraryBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];
                const updatedBooks = libraryBooks.map(book => {
                    if (book.borrowedBy === userData.username) {
                        return { ...book, borrowedBy: username };
                    }
                    return book;
                });
                localStorage.setItem("libraryBooks", JSON.stringify(updatedBooks));
            }

            // Update the userData variable with new data
            userData = updatedUserData;
            
            // Update display
            updateProfileDisplay();
            
            // Show success modal
            modal.style.display = 'none';
            successModal.style.display = 'flex';
            
            // Reset form
            editForm.reset();
        }
    });

    okButton.addEventListener('click', function() {
        successModal.style.display = 'none';
    });

    // Close success modal if clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });

    // Clear errors when typing
    oldPasswordInput.addEventListener('input', function() {
        oldPasswordError.textContent = '';
        oldPasswordInput.classList.remove('error-input');
    });

    newPasswordInput.addEventListener('input', function() {
        newPasswordError.textContent = '';
        newPasswordInput.classList.remove('error-input');
    });
};