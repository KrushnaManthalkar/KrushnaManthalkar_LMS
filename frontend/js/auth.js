const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

function showAuthMessage(elementId, message, type = "error") {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.className = `alert alert-${type}`;
    element.textContent = message;
}

function setAuthButtonLoading(button, loading, defaultText) {
    if (!button) {
        return;
    }

    button.disabled = loading;

    if (loading) {
        button.dataset.originalText =
            button.textContent.trim();

        button.textContent =
            "Please wait...";
    } else {
        button.textContent =
            defaultText;
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const button =
            loginForm.querySelector("button[type='submit']");

        if (!email || !password) {
            showAuthMessage(
                "loginMessage",
                "Please enter your email and password."
            );

            return;
        }

        setAuthButtonLoading(
            button,
            true,
            "Sign In"
        );

        try {
            const result = await LMS.api(
                "/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            if (!result.ok) {
                showAuthMessage(
                    "loginMessage",
                    result.data?.message ||
                    "Login failed. Please check your credentials."
                );

                return;
            }

            const token =
                result.data?.token;

            const user =
                result.data?.user;

            if (!token || !user) {
                showAuthMessage(
                    "loginMessage",
                    "Login response is incomplete. Please try again."
                );

                return;
            }

            LMS.setToken(token);

            LMS.setCurrentUser(user);

            showAuthMessage(
                "loginMessage",
                "Login successful. Redirecting...",
                "success"
            );

            setTimeout(() => {
                const redirect = new URLSearchParams(window.location.search).get("redirect");

                window.location.href =
                    redirect ? decodeURIComponent(redirect) : "dashboard.html";
            }, 700);

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            showAuthMessage(
                "loginMessage",
                "Unable to connect to the LMS server. Please try again."
            );

        } finally {
            setAuthButtonLoading(
                button,
                false,
                "Sign In"
            );
        }
    });
}



/* =========================================================
   REGISTER
   ========================================================= */

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const button =
            registerForm.querySelector("button[type='submit']");

        if (!name || !email || !password) {
            showAuthMessage(
                "registerMessage",
                "Please fill in all required fields."
            );

            return;
        }

        if (password.length < 6) {
            showAuthMessage(
                "registerMessage",
                "Password must contain at least 6 characters."
            );

            return;
        }

        setAuthButtonLoading(
            button,
            true,
            "Create Account"
        );

        try {
            const result = await LMS.api(
                "/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            if (!result.ok) {
                showAuthMessage(
                    "registerMessage",
                    result.data?.message ||
                    "Registration failed. Please try again."
                );

                return;
            }

            showAuthMessage(
                "registerMessage",
                "Account created successfully. Redirecting to login...",
                "success"
            );

            registerForm.reset();

            setTimeout(() => {
                window.location.href =
                    "login.html";
            }, 1000);

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            showAuthMessage(
                "registerMessage",
                "Unable to connect to the LMS server. Please try again."
            );

        } finally {
            setAuthButtonLoading(
                button,
                false,
                "Create Account"
            );
        }
    });
}



/* =========================================================
   AUTH PAGE ACCESS CONTROL
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();

        const authenticated =
            LMS.isAuthenticated();

        if (
            authenticated &&
            (
                currentPage === "login.html" ||
                currentPage === "register.html"
            )
        ) {
            window.location.href =
                "dashboard.html";
        }

    }
);