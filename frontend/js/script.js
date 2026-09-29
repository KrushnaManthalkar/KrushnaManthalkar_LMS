/* =========================================================
   LMS — GLOBAL FRONTEND SCRIPT
   Shared frontend functionality
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const LMS_CONFIG = {

    API_BASE_URL: "http://localhost:5000/api",

    BACKEND_URL: "http://localhost:5000",

    TOKEN_KEY: "lmsToken",

    USER_KEY: "lmsUser"

};


/* =========================================================
   2. FONT AWESOME
   Load icon library once for the complete application
   ========================================================= */

function loadIconLibrary() {

    const existing =
        document.querySelector(
            'link[data-lms-icons="fontawesome"]'
        );

    if (existing) {
        return;
    }


    const iconLibrary =
        document.createElement("link");

    iconLibrary.rel = "stylesheet";

    iconLibrary.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";

    iconLibrary.dataset.lmsIcons =
        "fontawesome";

    document.head.appendChild(
        iconLibrary
    );
}


/* =========================================================
   3. GET CURRENT PAGE
   ========================================================= */

function getCurrentPage() {

    const path =
        window.location.pathname;

    const fileName =
        path.split("/").pop();


    if (!fileName || fileName === "") {
        return "home";
    }


    const pageMap = {

        "index.html": "home",

        "courses.html": "courses",

        "course-details.html":
            "courses",

        "login.html": "login",

        "register.html":
            "register",

        "dashboard.html":
            "dashboard",

        "my-courses.html":
            "my-courses",

        "modules.html":
            "modules",

        "assignments.html":
            "assignments",

        "submission.html":
            "submission",

        "progress.html":
            "progress",

        "profile.html":
            "profile"

    };


    return (
        pageMap[fileName] ||
        "home"
    );
}


/* =========================================================
   4. LOAD HTML COMPONENT
   ========================================================= */

async function loadComponent(
    containerId,
    componentPath
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(componentPath);


        if (!response.ok) {

            throw new Error(
                `Component request failed: ${response.status}`
            );

        }


        const html =
            await response.text();


        container.innerHTML =
            html;


    } catch (error) {

        console.error(
            `Failed to load component: ${componentPath}`,
            error
        );

    }

}


/* =========================================================
   5. LOAD NAVBAR
   ========================================================= */

async function loadNavbar() {

    await loadComponent(
        "navbar-container",
        "components/navbar.html"
    );


    initializeNavbar();

}


/* =========================================================
   6. LOAD FOOTER
   ========================================================= */

async function loadFooter() {

    await loadComponent(
        "footer-container",
        "components/footer.html"
    );

}


/* =========================================================
   7. INITIALIZE NAVBAR
   ========================================================= */

function initializeNavbar() {

    const currentPage =
        getCurrentPage();


    /*
     * Desktop navigation
     */

    const desktopLinks =
        document.querySelectorAll(
            ".nav-link[data-page]"
        );


    desktopLinks.forEach(
        link => {

            const page =
                link.dataset.page;


            link.classList.toggle(
                "active",
                page === currentPage
            );

        }
    );


    /*
     * Mobile navigation
     */

    const mobileLinks =
        document.querySelectorAll(
            ".mobile-nav-link[data-page]"
        );


    mobileLinks.forEach(
        link => {

            const page =
                link.dataset.page;


            link.classList.toggle(
                "active",
                page === currentPage
            );

        }
    );


    initializeMobileMenu();

    updateAuthenticationUI();

}


/* =========================================================
   8. MOBILE MENU
   ========================================================= */

function initializeMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuButton"
        );

    const mobileNav =
        document.getElementById(
            "mobileNav"
        );


    if (!button || !mobileNav) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const isOpen =
                mobileNav.classList.toggle(
                    "open"
                );


            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );


            button.innerHTML =
                isOpen
                    ? '<i class="fa-solid fa-xmark"></i>'
                    : '<i class="fa-solid fa-bars"></i>';


            document.body.classList.toggle(
                "no-scroll",
                isOpen
            );

        }
    );


    /*
     * Close menu after navigation
     */

    mobileNav
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileNav.classList.remove(
                            "open"
                        );

                        button.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                        button.innerHTML =
                            '<i class="fa-solid fa-bars"></i>';

                        document.body.classList.remove(
                            "no-scroll"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   9. TOKEN HELPERS
   ========================================================= */

function getAuthToken() {

    return localStorage.getItem(
        LMS_CONFIG.TOKEN_KEY
    );

}


function setAuthToken(token) {

    if (!token) {
        return;
    }


    localStorage.setItem(
        LMS_CONFIG.TOKEN_KEY,
        token
    );

}


function removeAuthToken() {

    localStorage.removeItem(
        LMS_CONFIG.TOKEN_KEY
    );

}


function isAuthenticated() {

    return Boolean(
        getAuthToken()
    );

}


/* =========================================================
   10. USER HELPERS
   ========================================================= */

function getCurrentUser() {

    const userData =
        localStorage.getItem(
            LMS_CONFIG.USER_KEY
        );


    if (!userData) {
        return null;
    }


    try {

        return JSON.parse(
            userData
        );

    } catch (error) {

        console.error(
            "Invalid stored user data.",
            error
        );

        localStorage.removeItem(
            LMS_CONFIG.USER_KEY
        );

        return null;

    }

}


function setCurrentUser(user) {

    if (!user) {
        return;
    }


    localStorage.setItem(
        LMS_CONFIG.USER_KEY,
        JSON.stringify(user)
    );

}


function removeCurrentUser() {

    localStorage.removeItem(
        LMS_CONFIG.USER_KEY
    );

}


/* =========================================================
   11. LOGOUT
   ========================================================= */

function logoutUser() {

    removeAuthToken();

    removeCurrentUser();


    window.location.href =
        "login.html";

}


/* =========================================================
   12. UPDATE AUTHENTICATION UI
   ========================================================= */

function updateAuthenticationUI() {

    const authenticated =
        isAuthenticated();


    const user =
        getCurrentUser();


    const loginLinks =
        document.querySelectorAll(
            '[data-auth-link="login"]'
        );


    const registerLinks =
        document.querySelectorAll(
            '[data-auth-link="register"]'
        );


    /*
     * Not logged in
     */

    if (!authenticated) {

        loginLinks.forEach(
            link => {

                link.style.display =
                    "inline-flex";

            }
        );


        registerLinks.forEach(
            link => {

                link.style.display =
                    "inline-flex";

            }
        );


        return;
    }


    /*
     * Logged in
     */

    loginLinks.forEach(
        link => {

            link.textContent =
                "Dashboard";

            link.href =
                "dashboard.html";

            link.style.display =
                "inline-flex";

        }
    );


    registerLinks.forEach(
        link => {

            link.textContent =
                "Logout";

            link.href =
                "#";

            link.style.display =
                "inline-flex";


            /*
             * Avoid duplicate listeners
             */

            link.onclick =
                event => {

                    event.preventDefault();

                    logoutUser();

                };

        }
    );


    /*
     * If user information exists,
     * expose it globally for page scripts.
     */

    if (user) {

        window.lmsCurrentUser =
            user;

    }

}


/* =========================================================
   13. API REQUEST HELPER
   ========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getAuthToken();


    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})

    };


    /*
     * Automatically attach JWT
     * when available.
     */

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            `${LMS_CONFIG.API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    /*
     * Automatically handle
     * expired / invalid sessions.
     */

    if (
        response.status === 401 &&
        token
    ) {

        removeAuthToken();

        removeCurrentUser();

    }


    return {

        ok: response.ok,

        status: response.status,

        data

    };

}


/* =========================================================
   14. BACKEND STATUS
   ========================================================= */

async function checkBackendStatus() {

    try {

        const response =
            await fetch(
                LMS_CONFIG.BACKEND_URL
            );


        if (response.ok) {

            console.log(
                "LMS backend connected successfully."
            );

            return true;

        }


        console.warn(
            "LMS backend responded with an error."
        );

        return false;


    } catch (error) {

        console.warn(
            "LMS backend is not running."
        );

        return false;

    }

}


/* =========================================================
   15. SAFE TEXT
   Useful for dynamically rendered content
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   16. PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        loadIconLibrary();


        /*
         * Shared components
         */

        await loadNavbar();

        await loadFooter();


        /*
         * Backend availability
         */

        checkBackendStatus();

    }
);


/* =========================================================
   17. GLOBAL EXPORTS
   Allow page-specific JS files to use common functions.
   ========================================================= */

window.LMS = {

    config:
        LMS_CONFIG,

    getToken:
        getAuthToken,

    setToken:
        setAuthToken,

    removeToken:
        removeAuthToken,

    isAuthenticated,

    getCurrentUser,

    setCurrentUser,

    removeCurrentUser,

    logout:
        logoutUser,

    api:
        apiRequest,

    escapeHTML,

    checkBackend:
        checkBackendStatus

};