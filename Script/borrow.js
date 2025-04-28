document.addEventListener("DOMContentLoaded", function() {
    const borrowButton = document.getElementById("BorrowBookButton");
    const successModal = document.getElementById("successModal");
    const okButton = document.getElementById("okButton");

    let lastAction = "";

    borrowButton.addEventListener("click", function() {
        successModal.style.display = "flex";
        lastAction = "borrow";
    });

    okButton.addEventListener("click", function() {
        if (lastAction === "borrow") {
            borrowButton.disabled = true;
            borrowButton.style.backgroundColor = "#999";
            borrowButton.style.cursor = "not-allowed";
        }

        successModal.style.display = "none";
        lastAction = "";
    });
});
