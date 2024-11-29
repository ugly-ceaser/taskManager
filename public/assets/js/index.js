function logout() {
    // Clear any stored tokens/session data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // Redirect to the login page
    window.location.href = '../index.html';
}
