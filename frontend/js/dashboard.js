const dashboardGreeting =
    document.getElementById("dashboardGreeting");

const courseCount =
    document.getElementById("courseCount");

const assignmentCount =
    document.getElementById("assignmentCount");

const averageProgress =
    document.getElementById("averageProgress");

const dashboardCourses =
    document.getElementById("dashboardCourses");

const dashboardAssignments =
    document.getElementById("dashboardAssignments");


let dashboardEnrollments = [];
let dashboardAssignmentsData = [];



/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkDashboardAccess() {
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

    if (dashboardGreeting) {
        const firstName =
            String(user.name || "Student")
                .trim()
                .split(" ")[0];

        dashboardGreeting.textContent =
            `Welcome back, ${firstName}`;
    }

    return true;
}



/* =========================================================
   LOAD DASHBOARD DATA
   ========================================================= */

async function loadDashboard() {

    if (!checkDashboardAccess()) {
        return;
    }


    renderDashboardLoading();


    try {

        const enrollmentResult =
            await LMS.api(
                "/enrollments/my"
            );


        if (
            enrollmentResult.status === 401 ||
            !LMS.isAuthenticated()
        ) {
            window.location.href =
                "login.html";

            return;
        }


        if (!enrollmentResult.ok) {
            renderDashboardError(
                enrollmentResult.data?.message ||
                "Unable to load your courses."
            );

            return;
        }


        dashboardEnrollments =
            Array.isArray(
                enrollmentResult.data
            )
                ? enrollmentResult.data
                : enrollmentResult.data?.enrollments || [];


        await loadDashboardAssignments();


        renderDashboardStats();

        renderDashboardCourses();

        renderDashboardAssignments();

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        renderDashboardError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   LOAD ASSIGNMENTS
   ========================================================= */

async function loadDashboardAssignments() {

    try {

        const result =
            await LMS.api(
                "/submissions/my"
            );


        if (result.ok) {

            const submissions =
                Array.isArray(result.data)
                    ? result.data
                    : result.data?.submissions || [];


            dashboardAssignmentsData =
                submissions;

            return;
        }


        dashboardAssignmentsData =
            [];

    } catch (error) {

        console.error(
            "Dashboard assignments error:",
            error
        );


        dashboardAssignmentsData =
            [];
    }
}



/* =========================================================
   RENDER STATISTICS
   ========================================================= */

function renderDashboardStats() {

    const totalCourses =
        dashboardEnrollments.length;


    const totalProgress =
        dashboardEnrollments.reduce(
            (sum, enrollment) => {

                return sum +
                    Number(
                        enrollment.progress || 0
                    );

            },
            0
        );


    const average =
        totalCourses > 0
            ? Math.round(
                totalProgress /
                totalCourses
            )
            : 0;


    const completed =
        dashboardEnrollments.filter(
            enrollment =>
                Number(
                    enrollment.progress || 0
                ) === 100
        ).length;


    if (courseCount) {
        courseCount.textContent =
            totalCourses;
    }


    if (averageProgress) {
        averageProgress.textContent =
            `${average}%`;
    }


    if (assignmentCount) {
        assignmentCount.textContent =
            getAssignmentCount();
    }


    const completedElement =
        document.getElementById(
            "completedCourseCount"
        );


    if (completedElement) {
        completedElement.textContent =
            completed;
    }
}



/* =========================================================
   ASSIGNMENT COUNT
   ========================================================= */

function getAssignmentCount() {

    const uniqueAssignments =
        new Set();


    dashboardAssignmentsData.forEach(
        submission => {

            const assignmentId =
                submission.assignmentId?._id ||
                submission.assignmentId;


            if (assignmentId) {
                uniqueAssignments.add(
                    String(assignmentId)
                );
            }
        }
    );


    return uniqueAssignments.size;
}



/* =========================================================
   RENDER COURSES
   ========================================================= */

function renderDashboardCourses() {

    if (!dashboardCourses) {
        return;
    }


    if (!dashboardEnrollments.length) {

        dashboardCourses.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i class="fa-solid fa-book-open"></i>
                </div>

                <h3>
                    No courses yet
                </h3>

                <p>
                    Explore the course library and start learning.
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


    const coursesToShow =
        dashboardEnrollments.slice(0, 3);


    dashboardCourses.innerHTML =
        coursesToShow
            .map(
                enrollment =>
                    createDashboardCourseCard(
                        enrollment
                    )
            )
            .join("");
}



/* =========================================================
   COURSE CARD
   ========================================================= */

function createDashboardCourseCard(
    enrollment
) {

    const course =
        enrollment.courseId || {};


    const courseId =
        course._id ||
        enrollment.courseId;


    const title =
        LMS.escapeHTML(
            course.title ||
            "Course"
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

                        <i class="fa-solid fa-circle-check"></i>

                        ${status}

                    </span>

                </div>



                <h3>
                    ${title}
                </h3>


                <p>
                    ${description}
                </p>



                <div class="progress-wrapper">

                    <div class="progress-header">

                        <span>
                            Course Progress
                        </span>

                        <strong>
                            ${progress}%
                        </strong>

                    </div>


                    <div class="progress-track">

                        <div
                            class="progress-bar p${getProgressClass(progress)}"
                        ></div>

                    </div>

                </div>



                <div class="course-card-footer">

                    <span class="course-instructor">

                        <i class="fa-solid fa-chart-line"></i>

                        ${progress}% complete

                    </span>


                    <a
                        href="modules.html?courseId=${encodeURIComponent(courseId)}"
                        class="btn btn-primary btn-sm"
                    >

                        Continue

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
   RENDER ASSIGNMENTS
   ========================================================= */

function renderDashboardAssignments() {

    if (!dashboardAssignments) {
        return;
    }


    if (!dashboardAssignmentsData.length) {

        dashboardAssignments.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i class="fa-solid fa-file-circle-check"></i>
                </div>

                <h3>
                    No submissions yet
                </h3>

                <p>
                    Your submitted assignments will appear here.
                </p>

                <a
                    href="assignments.html"
                    class="btn btn-primary"
                >

                    <i class="fa-solid fa-file-lines"></i>

                    View Assignments

                </a>

            </div>
        `;

        return;
    }


    const recentSubmissions =
        [...dashboardAssignmentsData]
            .sort(
                (a, b) =>
                    new Date(
                        b.submissionDate ||
                        b.createdAt ||
                        0
                    ) -
                    new Date(
                        a.submissionDate ||
                        a.createdAt ||
                        0
                    )
            )
            .slice(0, 4);


    dashboardAssignments.innerHTML =
        recentSubmissions
            .map(
                submission =>
                    createAssignmentItem(
                        submission
                    )
            )
            .join("");
}



/* =========================================================
   ASSIGNMENT ITEM
   ========================================================= */

function createAssignmentItem(
    submission
) {

    const assignment =
        submission.assignmentId || {};


    const title =
        LMS.escapeHTML(
            assignment.title ||
            "Assignment"
        );


    const course =
        LMS.escapeHTML(
            assignment.courseId?.title ||
            "Course"
        );


    const status =
        submission.status === "Reviewed"
            ? "Reviewed"
            : "Submitted";


    const statusClass =
        submission.status === "Reviewed"
            ? "badge-success"
            : "badge-warning";


    const marks =
        submission.marks !== null &&
        submission.marks !== undefined
            ? `${submission.marks} marks`
            : "Awaiting review";


    const date =
        formatDate(
            submission.submissionDate ||
            submission.createdAt
        );


    return `
        <article class="assignment-card">


            <div class="assignment-card-icon">

                <i class="fa-solid fa-file-lines"></i>

            </div>



            <div class="assignment-card-content">

                <h3>
                    ${title}
                </h3>


                <p>
                    ${course}
                </p>


                <span class="assignment-date">

                    <i class="fa-regular fa-calendar"></i>

                    Submitted ${date}

                </span>

            </div>



            <div class="assignment-card-status">

                <span class="badge ${statusClass}">
                    ${status}
                </span>


                <span class="assignment-marks">
                    ${LMS.escapeHTML(marks)}
                </span>

            </div>


        </article>
    `;
}



/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "recently";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return "recently";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}



/* =========================================================
   LOADING STATE
   ========================================================= */

function renderDashboardLoading() {

    if (dashboardCourses) {
        dashboardCourses.innerHTML = `
            <div class="loading-state">

                <div class="loading-spinner"></div>

                <p>
                    Loading your courses...
                </p>

            </div>
        `;
    }


    if (dashboardAssignments) {
        dashboardAssignments.innerHTML = `
            <div class="loading-state">

                <div class="loading-spinner"></div>

                <p>
                    Loading assignments...
                </p>

            </div>
        `;
    }
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderDashboardError(message) {

    if (dashboardCourses) {

        dashboardCourses.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>
                    Dashboard unavailable
                </h3>

                <p>
                    ${LMS.escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="retryDashboardButton"
                >

                    <i class="fa-solid fa-rotate-right"></i>

                    Try Again

                </button>

            </div>
        `;


        const retryButton =
            document.getElementById(
                "retryDashboardButton"
            );


        if (retryButton) {
            retryButton.addEventListener(
                "click",
                loadDashboard
            );
        }
    }
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);