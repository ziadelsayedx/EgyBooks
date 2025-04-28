window.onload = function () {
    const userData = JSON.parse(localStorage.getItem("CurrentUser"));

    if (!userData) {
        alert("No user data found. Please log in.");
        window.location.href = "Login.html";
        return;
    }

    function countBorrowedBooks() {
        const libraryBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];
        let count = 0;
        
        libraryBooks.forEach(book => {
            if (book.borrowedBy && book.borrowedBy === userData.username) {
                count++;
            }
        });
        
        return count;
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
    };

    closeModal.onclick = closeModalFunc;
    cancelBtn.onclick = closeModalFunc;
    window.onclick = function(event) {
        if (event.target === modal) closeModalFunc();
    };

    document.getElementById("editForm").addEventListener("submit", function(e) {
        e.preventDefault();


        const name = document.getElementById("editName").value.trim();
        const email = document.getElementById("editEmail").value.trim();
        const username = document.getElementById("editUsername").value.trim();
        const password = document.getElementById("editPassword").value;

        if (!name || !email || !username) {
            alert("Please fill in all required fields");
            return;
        }

        const updatedUserData = {
            ...userData, 
            name: name,
            email: email,
            username: username,
            password: password || userData.password, 
            memberSince: userData.memberSince || new Date().toLocaleDateString()
        };

        localStorage.setItem("CurrentUser", JSON.stringify(updatedUserData));


        const users = JSON.parse(localStorage.getItem("users")) || [];
        const userIndex = users.findIndex(u => u.username === userData.username || u.email === userData.email);
        
        if (userIndex !== -1) {
            users[userIndex] = updatedUserData;
            localStorage.setItem("users", JSON.stringify(users));
        }

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
        userData = updatedUserData;
        updateProfileDisplay();
        alert("Profile updated successfully!");
        closeModalFunc();
    });
};