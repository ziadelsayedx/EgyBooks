


document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const messageElement = document.getElementById("loginMessage");

  messageElement.textContent = "Logging in...";
  messageElement.style.color = "blue";

  setTimeout(() => {
    if (username && password) {
      messageElement.textContent = "Login successful! Redirecting...";
      messageElement.style.color = "green";
      setTimeout(() => {
        window.location.href = "home_page.html";
      }, 1500);
    } else {
      messageElement.textContent = "Invalid username or password";
      messageElement.style.color = "red";
    }
  }, 1000);
});
