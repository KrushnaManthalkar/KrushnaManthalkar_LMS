/* =========================================================
   LMS — ADMIN DASHBOARD
========================================================= */


const totalStudents =
    document.getElementById("totalStudents");

const totalCourses =
    document.getElementById("totalCourses");

const totalModules =
    document.getElementById("totalModules");

const totalAssignments =
    document.getElementById("totalAssignments");

const totalSubmissions =
    document.getElementById("totalSubmissions");

const adminDashboardGreeting =
    document.getElementById(
        "adminDashboardGreeting"
    );

const studentOverview =
    document.getElementById(
        "studentOverview"
    );


/* =========================================================
   ADMIN ACCESS CHECK
========================================================= */

function checkAdminAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html?redirect=admin-dashboard.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html?redirect=admin-dashboard.html";

        return false;
    }


    if (user.role !== "admin") {

        window.location.href =
            "dashboard.html";

        return false;
    }


    if (adminDashboardGreeting) {

        const firstName =
            String(
                user.name || "Admin"
            )
                .trim()
                .split(" ")[0];


        adminDashboardGreeting.textContent =
            `Welcome back, ${firstName}`;
    }


    return true;
}


/* =========================================================
   LOAD ADMIN DASHBOARD
========================================================= */

async function loadAdminDashboard() {

    if (!checkAdminAccess()) {
        return;
    }


    try {

        const result =
            await LMS.api(
                "/admin/dashboard"
            );


        if (
            result.status === 401 ||
            result.status === 403
        ) {

            showAdminError(
                "Your administrator session is no longer valid."
            );

            return;
        }


        if (!result.ok) {

            showAdminError(
                result.data?.message ||
                "Unable to load admin dashboard."
            );

            return;
        }


        const statistics =
            result.data?.statistics || {};


        renderStatistics(
            statistics
        );


        await loadStudents();


    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );


        showAdminError(
            "Unable to connect to the LMS server."
        );
    }
}


/* =========================================================
   RENDER STATISTICS
========================================================= */

function renderStatistics(
    statistics
) {

    if (totalStudents) {

        totalStudents.textContent =
            statistics.totalStudents || 0;
    }


    if (totalCourses) {

        totalCourses.textContent =
            statistics.totalCourses || 0;
    }


    if (totalModules) {

        totalModules.textContent =
            statistics.totalModules || 0;
    }


    if (totalAssignments) {

        totalAssignments.textContent =
            statistics.totalAssignments || 0;
    }


    if (totalSubmissions) {

        totalSubmissions.textContent =
            statistics.totalSubmissions || 0;
    }
}


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    if (!studentOverview) {
        return;
    }


    const result =
        await LMS.api(
            "/admin/students"
        );


    if (
        !result.ok
    ) {

        studentOverview.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>


                <h3>
                    Unable to load students
                </h3>


                <p>
                    ${
                        LMS.escapeHTML(
                            result.data?.message ||
                            "Please try again."
                        )
                    }
                </p>

            </div>
        `;

        return;
    }


    const students =
        Array.isArray(
            result.data?.students
        )
            ? result.data.students
            : [];


    if (!students.length) {

        studentOverview.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-users"></i>

                </div>


                <h3>
                    No students found
                </h3>


                <p>
                    There are currently no registered students.
                </p>

            </div>
        `;

        return;
    }


    const recentStudents =
        students.slice(0, 8);


    studentOverview.innerHTML =
        recentStudents
            .map(
                student =>
                    createStudentCard(
                        student
                    )
            )
            .join("");
}


/* =========================================================
   STUDENT CARD
========================================================= */

function createStudentCard(
    student
) {

    const name =
        LMS.escapeHTML(
            student.name ||
            "Student"
        );


    const email =
        LMS.escapeHTML(
            student.email ||
            ""
        );


    const enrolledCourses =
        Number(
            student.enrolledCourses || 0
        );


    return `
        <article class="assignment-card">

            <div class="assignment-card-icon">

                <i class="fa-solid fa-user"></i>

            </div>


            <div class="assignment-card-content">

                <h3>
                    ${name}
                </h3>


                <p>
                    ${email}
                </p>


                <span class="assignment-date">

                    <i class="fa-solid fa-book-open"></i>

                    ${enrolledCourses}
                    enrolled course${enrolledCourses === 1 ? "" : "s"}

                </span>

            </div>


            <div class="assignment-card-status">

                <span class="badge badge-success">
                    Student
                </span>

            </div>

        </article>
    `;
}


/* =========================================================
   ERROR
========================================================= */

function showAdminError(
    message
) {

    if (studentOverview) {

        studentOverview.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>


                <h3>
                    Admin Dashboard unavailable
                </h3>


                <p>
                    ${LMS.escapeHTML(message)}
                </p>


                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="loadAdminDashboard()"
                >

                    <i class="fa-solid fa-rotate-right"></i>

                    Try Again

                </button>

            </div>
        `;
    }
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadAdminDashboard
);