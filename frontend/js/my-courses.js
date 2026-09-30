const myCoursesContainer =
    document.getElementById("myCoursesContainer");

let myEnrollments = [];



/* =========================================================
   AUTH CHECK
   ========================================================= */
function checkMyCoursesAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return false;
    }


    /* Admins should use Admin Dashboard */

    if (user.role === "admin") {

        window.location.href =
            "admin-dashboard.html";

        return false;
    }


    return true;
}



/* =========================================================
   LOAD MY COURSES
   ========================================================= */

async function loadMyCourses() {

    if (!checkMyCoursesAccess()) {
        return;
    }


    if (!myCoursesContainer) {
        return;
    }


    myCoursesContainer.innerHTML = `
        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading your courses...
            </p>

        </div>
    `;


    try {

        const result =
            await LMS.api(
                "/enrollments/my"
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

            renderMyCoursesError(
                result.data?.message ||
                "Unable to load your courses."
            );

            return;
        }


        myEnrollments =
            Array.isArray(result.data)
                ? result.data
                : result.data?.enrollments || [];


        renderMyCourses();

    } catch (error) {

        console.error(
            "My courses loading error:",
            error
        );


        renderMyCoursesError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   RENDER COURSES
   ========================================================= */

function renderMyCourses() {

    if (!myCoursesContainer) {
        return;
    }


    if (!myEnrollments.length) {

        myCoursesContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i class="fa-solid fa-book-open"></i>
                </div>

                <h3>
                    No enrolled courses
                </h3>

                <p>
                    You have not enrolled in any course yet.
                    Explore the course library to get started.
                </p>

                <a
                    href="courses.html"
                    class="btn btn-primary"
                >

                    <i class="fa-solid fa-compass"></i>

                    Explore Courses

                </a>

            </div>
        `;

        return;
    }


    myCoursesContainer.innerHTML =
        myEnrollments
            .map(
                enrollment =>
                    createMyCourseCard(
                        enrollment
                    )
            )
            .join("");
}



/* =========================================================
   COURSE CARD
   ========================================================= */

function createMyCourseCard(
    enrollment
) {

    const course =
        enrollment.courseId || {};


    const courseId =
        course._id ||
        course.id;


    const title =
        LMS.escapeHTML(
            course.title ||
            "Untitled Course"
        );


    const description =
        LMS.escapeHTML(
            course.description ||
            "Continue your learning journey."
        );


    const category =
        LMS.escapeHTML(
            course.category ||
            "Learning"
        );


    const difficulty =
        LMS.escapeHTML(
            course.difficulty ||
            "Beginner"
        );


    const duration =
        LMS.escapeHTML(
            course.duration ||
            "Self-paced"
        );


    const instructor =
        LMS.escapeHTML(
            course.instructor?.name ||
            "LMS Instructor"
        );


    const progress =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    enrollment.progress || 0
                )
            )
        );


    const status =
        LMS.escapeHTML(
            enrollment.status ||
            "Enrolled"
        );


    const progressClass =
        getProgressClass(progress);


    const actionText =
        progress === 100
            ? "Review Course"
            : progress > 0
                ? "Continue Learning"
                : "Start Learning";


    return `
        <article class="course-card">


            <div class="course-card-media">

                <div class="course-card-placeholder">

                    <i class="fa-solid fa-graduation-cap"></i>

                </div>


                <span class="badge badge-primary course-card-badge">
                    ${category}
                </span>

            </div>



            <div class="course-card-body">


                <div class="course-card-meta">

                    <span>

                        <i class="fa-solid fa-signal"></i>

                        ${difficulty}

                    </span>


                    <span>

                        <i class="fa-regular fa-clock"></i>

                        ${duration}

                    </span>

                </div>



                <h3>
                    ${title}
                </h3>


                <p>
                    ${description}
                </p>



                <div class="course-instructor">

                    <i class="fa-solid fa-user-tie"></i>

                    ${instructor}

                </div>



                <div class="progress-wrapper">

                    <div class="progress-header">

                        <span>
                            Learning Progress
                        </span>

                        <strong>
                            ${progress}%
                        </strong>

                    </div>


                    <div class="progress-track">

                        <div
                            class="progress-bar p${progressClass}"
                        ></div>

                    </div>

                </div>



                <div class="course-card-footer">


                    <span class="badge ${getStatusBadgeClass(status)}">

                        ${status}

                    </span>


                    <a
                        href="course-details.html?id=${encodeURIComponent(courseId)}"
                        class="btn btn-primary btn-sm"
                    >

                        ${actionText}

                        <i class="fa-solid fa-arrow-right"></i>

                    </a>


                </div>


            </div>


        </article>
    `;
}



/* =========================================================
   PROGRESS CLASS
   ========================================================= */

function getProgressClass(progress) {

    const rounded =
        Math.round(
            Number(progress || 0)
        );


    const validValues = [
        0,
        10,
        20,
        30,
        40,
        50,
        60,
        70,
        80,
        90,
        100
    ];


    return validValues.reduce(
        (closest, value) => {

            return Math.abs(
                value - rounded
            ) <
            Math.abs(
                closest - rounded
            )
                ? value
                : closest;

        },
        0
    );
}



/* =========================================================
   STATUS BADGE
   ========================================================= */

function getStatusBadgeClass(status) {

    if (status === "Completed") {
        return "badge-success";
    }


    if (status === "In Progress") {
        return "badge-primary";
    }


    return "badge-warning";
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderMyCoursesError(message) {

    if (!myCoursesContainer) {
        return;
    }


    myCoursesContainer.innerHTML = `
        <div class="empty-state">

            <div class="empty-state-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h3>
                Unable to load courses
            </h3>

            <p>
                ${LMS.escapeHTML(message)}
            </p>

            <button
                type="button"
                class="btn btn-primary"
                id="retryMyCoursesButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>
    `;


    const retryButton =
        document.getElementById(
            "retryMyCoursesButton"
        );


    if (retryButton) {
        retryButton.addEventListener(
            "click",
            loadMyCourses
        );
    }
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadMyCourses
);