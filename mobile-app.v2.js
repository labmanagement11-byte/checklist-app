
// --- Credenciales del propietario (deben coincidir con app.js) ---
const OWNER_CREDENTIALS = {
    username: 'jonathan',
    password: 'galindo123',
    name: 'Jonathan Galindo'
};

// Mobile App Logic - redesigned for hamburger layout
// Relies on shared data/state from app.js

// --- Refuerzo: Siempre mostrar login si no hay sesión válida ---
function forceMobileLoginIfNoSession() {
    restoreMobileSession && restoreMobileSession();
    if (!mobileCurrentUserType || !mobileCurrentUser) {
        document.getElementById('mobile-login-view').style.display = 'block';
        document.getElementById('mobile-owner-view').style.display = 'none';
        document.getElementById('mobile-employee-view').style.display = 'none';
        document.getElementById('mobile-manager-view').style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', forceMobileLoginIfNoSession);

// Refuerzo: también al terminar el splash/video
window.skipToLoginMobile = function() {
    if (typeof mobileVideoSkipped !== 'undefined') mobileVideoSkipped = true;
    const welcomeView = document.getElementById('mobile-welcome-video');
    const loginView = document.getElementById('mobile-login-view');
    const video = document.getElementById('welcomeVideoMobile');
    if (video) video.pause();
    if (welcomeView) welcomeView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
    // Forzar login si no hay sesión
    forceMobileLoginIfNoSession();
};

// --- RESTO DEL CÓDIGO DE mobile-app.js ---

[full contents of mobile-app.js from lines 41 to 1963 go here]
