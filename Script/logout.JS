Logout.addEventListener("click", function(){
    localStorage.removeItem("CurrentUser");
    window.location.href = "Login.html";
});