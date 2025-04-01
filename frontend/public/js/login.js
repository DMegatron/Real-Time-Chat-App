document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const registerBtn = document.getElementById('register');
    const loginBtn = document.getElementById('login');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('error-message');
    const regErrorMessage = document.getElementById('reg-error-message');
    
    // Toggle animation between login and register
    registerBtn.addEventListener('click', () => {
        container.classList.add("active");
    });
    
    loginBtn.addEventListener('click', () => {
        container.classList.remove("active");
    });
    
    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.querySelector('.username').value.trim();
        const password = loginForm.querySelector('.password').value;
        
        if (!username || !password) {
            errorMessage.textContent = 'Please enter both username and password';
            errorMessage.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                errorMessage.textContent = data.message;
                errorMessage.style.display = 'block';
                return;
            }
            
            // Store username in sessionStorage
            sessionStorage.setItem('username', username);
            if (data.name) {
                sessionStorage.setItem('name', data.name);
            }
            
            // Redirect to chat page
            window.location.href = '/chat';
            
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
        }
    });
    
    // Handle register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.querySelector('.reg-name').value.trim();
        const username = registerForm.querySelector('.reg-username').value.trim();
        const password = registerForm.querySelector('.reg-password').value;
        const confirmPassword = registerForm.querySelector('.confirm-password').value;
        
        // Validate inputs
        if (!name || !username || !password || !confirmPassword) {
            regErrorMessage.textContent = 'Please fill out all fields';
            regErrorMessage.style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            regErrorMessage.textContent = 'Passwords do not match';
            regErrorMessage.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, username, password, confirmPassword })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                regErrorMessage.textContent = data.message;
                regErrorMessage.style.display = 'block';
                return;
            }
            
            // Store user info in sessionStorage
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('name', name);
            
            // Redirect to chat page
            window.location.href = '/chat';
            
        } catch (error) {
            console.error('Registration error:', error);
            regErrorMessage.textContent = 'An error occurred. Please try again.';
            regErrorMessage.style.display = 'block';
        }
    });
});
// Mobile-specific form switching
const mobileSignupLink = document.getElementById('mobile-signup-link');
const mobileSigninLink = document.getElementById('mobile-signin-link');
const mobileSwitchLinks = document.querySelectorAll('.mobile-switch');

// Function to check if we're on mobile
function isMobileView() {
    return window.innerWidth <= 576;
}

// Handle the mobile view changes
function handleMobileView() {
    if (isMobileView()) {
        mobileSwitchLinks.forEach(link => {
            link.style.display = 'block';
        });
    } else {
        mobileSwitchLinks.forEach(link => {
            link.style.display = 'none';
        });
    }
}

// Add event listeners for mobile links
mobileSignupLink?.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add('active');
});

mobileSigninLink?.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove('active');
});

// Initial check
handleMobileView();

// Listen for window resize
window.addEventListener('resize', handleMobileView);