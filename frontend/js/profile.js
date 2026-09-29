const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileRole =
    document.getElementById("profileRole");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileNameDetail =
    document.getElementById("profileNameDetail");

const profileEmailDetail =
    document.getElementById("profileEmailDetail");

const profileRoleDetail =
    document.getElementById("profileRoleDetail");

const profileCreatedAt =
    document.getElementById("profileCreatedAt");

const profileLogoutButton =
    document.getElementById(
        "profileLogoutButton"
    );



/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkProfileAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html";

        return false;
    }


    return true;
}



/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    if (!checkProfileAccess()) {
        return;
    }


    try {

        const result =
            await LMS.api(
                "/auth/me"
            );


        if (
            result.status === 401 ||
            !LMS.isAuthenticated()
        ) {

            window.location.href =
                "login.html";

            return;
        }


        if (!result.ok) {

            renderProfileError(
                result.data?.message ||
                "Unable to load your profile."
            );

            return;
        }


        const user =
            result.data?.user ||
            result.data;


        if (!user) {

            renderProfileError(
                "Profile information was not found."
            );

            return;
        }


        LMS.setCurrentUser(
            user
        );


        renderProfile(
            user
        );

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        const storedUser =
            LMS.getCurrentUser();


        if (storedUser) {

            renderProfile(
                storedUser
            );

        } else {

            renderProfileError(
                "Unable to connect to the LMS server."
            );
        }
    }
}



/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(
    user
) {

    const name =
        user.name ||
        "Student";


    const email =
        user.email ||
        "Not available";


    const role =
        user.role ||
        "student";


    const displayRole =
        formatRole(
            role
        );


    if (profileName) {

        profileName.textContent =
            name;
    }


    if (profileEmail) {

        profileEmail.textContent =
            email;
    }


    if (profileRole) {

        profileRole.textContent =
            displayRole;
    }


    if (profileNameDetail) {

        profileNameDetail.textContent =
            name;
    }


    if (profileEmailDetail) {

        profileEmailDetail.textContent =
            email;
    }


    if (profileRoleDetail) {

        profileRoleDetail.textContent =
            displayRole;
    }


    if (profileCreatedAt) {

        profileCreatedAt.textContent =
            formatDate(
                user.createdAt
            );
    }


    renderAvatar(
        name
    );
}



/* =========================================================
   AVATAR
   ========================================================= */

function renderAvatar(
    name
) {

    if (!profileAvatar) {
        return;
    }


    const initials =
        getInitials(
            name
        );


    profileAvatar.textContent =
        initials;
}



/* =========================================================
   GET INITIALS
   ========================================================= */

function getInitials(
    name
) {

    const words =
        String(
            name || "Student"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {
        return "ST";
    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}



/* =========================================================
   FORMAT ROLE
   ========================================================= */

function formatRole(
    role
) {

    if (!role) {
        return "Student";
    }


    return String(role)
        .charAt(0)
        .toUpperCase() +
        String(role)
            .slice(1)
            .toLowerCase();
}



/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "Not available";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Not available";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderProfileError(
    message
) {

    if (profileName) {

        profileName.textContent =
            "Profile unavailable";
    }


    if (profileEmail) {

        profileEmail.textContent =
            message;
    }


    if (profileNameDetail) {

        profileNameDetail.textContent =
            "Unavailable";
    }


    if (profileEmailDetail) {

        profileEmailDetail.textContent =
            "Unavailable";
    }


    if (profileRoleDetail) {

        profileRoleDetail.textContent =
            "Unavailable";
    }


    if (profileCreatedAt) {

        profileCreatedAt.textContent =
            "Unavailable";
    }
}



/* =========================================================
   LOGOUT
   ========================================================= */

if (profileLogoutButton) {

    profileLogoutButton.addEventListener(
        "click",
        () => {

            LMS.logout();

        }
    );
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadProfile
);