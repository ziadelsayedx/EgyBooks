
function showError(message, color = "red") {
  const errorDiv = document.getElementById("error-message");
  errorDiv.innerText = message;
  errorDiv.style.color = color;
}

function clearError() {
  document.getElementById("error-message").innerText = "";
}

function addRedBorder(inputElement) {
  inputElement.classList.add("input-error");
}

function clearRedBorder(inputElement) {
  inputElement.classList.remove("input-error");
}


function isValidEgyptianPhone(phone) {
  const phoneRegex = /^(010|011|012|015)\d{8}$/;
  return phoneRegex.test(phone);
}
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validateForm() {
  const usernameInput = document.getElementsByName("username")[0];
  const emailInput = document.getElementsByName("Email")[0];
  const phoneInput = document.getElementsByName("phone number")[0];
  const passwordInput = document.getElementsByName("password")[0];
  const confirmPasswordInput = document.getElementsByName("confirm password")[0];

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  clearError();
  [usernameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput].forEach(clearRedBorder);

  if (!username) {
    addRedBorder(usernameInput);
    showError("Username is required.");
    return false;
  }

  if (username.length < 4) {
    addRedBorder(usernameInput);
    showError("Username must be at least 4 characters.");
    return false;
  }

  // check if username or email already exists
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
  
    if (key === "CurrentUser") continue;
  
    try {
      const userData = JSON.parse(localStorage.getItem(key));
      if (!userData || typeof userData !== "object" || !userData.email) continue;
  
      // Check for username duplication (key itself)
      if (key.toLowerCase() === username.toLowerCase()) {
        addRedBorder(usernameInput);
        showError("Username already exists. Please choose a different one.");
        return false;
      }
  
      // Check for email duplication
      if (userData.email.toLowerCase() === email.toLowerCase()) {
        addRedBorder(emailInput);
        showError("Email already registered. Please use a different email.");
        return false;
      }
  
    } catch (e) {
      console.warn("Skipping bad entry in localStorage:", key);
      continue;
    }
  }
  
  
  

  if (!email) {
    addRedBorder(emailInput);
    showError("Email is required.");
    return false;
  }

  if (!isValidEmail(email)) {
    addRedBorder(emailInput);
    showError("Please enter a valid email address.");
    return false;
  }

  if (!phone) {
    addRedBorder(phoneInput);
    showError("Phone number is required.");
    return false;
  }

  if (!isValidEgyptianPhone(phone)) {
    addRedBorder(phoneInput);
    showError("Phone must start with 010, 011, 012, or 015 and be 11 digits.");
    return false;
  }

  if (!password) {
    addRedBorder(passwordInput);
    showError("Password is required.");
    return false;
  }

  if (password.length < 8) {
    addRedBorder(passwordInput);
    showError("Password must be at least 8 characters.");
    return false;
  }

  if (password !== confirmPassword) {
    addRedBorder(passwordInput);
    addRedBorder(confirmPasswordInput);
    showError("Passwords do not match.");
    return false;
  }

  // all validations passed
  saveUser(username, email, phone, password);
  return true;
}



function saveUser(username, email, phone, password) {
  const userData = {
    email: email,
    phone: phone,
    password: password,
    role: "user",
    books: [],
    registeredAt: new Date().toISOString(),
    borrowedBooksCount: 0,
    lastLogin: new Date().toISOString(),
  };

  try {
    localStorage.setItem(username, JSON.stringify(userData));
    localStorage.setItem("CurrentUser", JSON.stringify({
      username: username,
      ...userData,
    }));

    showError("Registration successful! Redirecting...", "green");
    setTimeout(() => {
      window.location.href = "home_page.html";
    }, 1500);
  } catch (e) {
    console.error("Error saving user data:", e);
    showError("Failed to save data. Please try again.");
  }
}


document.getElementById("AddBookButton").addEventListener("click", function (e) {
  e.preventDefault();
  const isValid = validateForm();
  if (isValid) {
    // saveUser is already called inside validateForm
  }
});



function clearAllUsers() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== "CurrentUser" && !key.startsWith("temp_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("CurrentUser");
  console.log("Cleared all user data");
}
