// Profile picture preview
function initializeProfilePicturePreview() {
    const input = document.querySelector('input[type="file"]');
    const preview = document.querySelector('.profile-picture-preview');
    
    if (input && preview) {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Password visibility toggle
function initializePasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });
}

// Form validation
function validateAuthForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    const emailField = form.querySelector('input[type="email"]');
    const passwordField = form.querySelector('input[type="password"]');
    const confirmPasswordField = form.querySelector('input[name="password2"]');

    // Check required fields
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

    // Validate email format
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.classList.add('is-invalid');
            isValid = false;
        }
    }

    // Check password match
    if (passwordField && confirmPasswordField) {
        if (passwordField.value !== confirmPasswordField.value) {
            confirmPasswordField.classList.add('is-invalid');
            isValid = false;
        }
    }

    return isValid;
}

// Initialize user-related functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile picture preview
    initializeProfilePicturePreview();

    // Initialize password visibility toggle
    initializePasswordToggle();

    // Initialize form validation
    const authForms = document.querySelectorAll('form.auth-form');
    authForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateAuthForm(this.id)) {
                e.preventDefault();
            }
        });
    });
}); 