/* =========================================================
   LMS — ADMIN STUDENTS & PROGRESS
========================================================= */


const studentList =
    document.getElementById("studentList");

const progressList =
    document.getElementById("progressList");

const studentCount =
    document.getElementById("studentCount");

const progressCount =
    document.getElementById("progressCount");

const studentTotal =
    document.getElementById("studentTotal");

const enrollmentTotal =
    document.getElementById("enrollmentTotal");

const completedTotal =
    document.getElementById("completedTotal");

const studentMessage =
    document.getElementById("studentMessage");


let students = [];

let progressRecords = [];



/* =========================================================
   ADMIN ACCESS
========================================================= */

function checkAdminAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html?redirect=admin-students.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html?redirect=admin-students.html";

        return false;
    }


    if (user.role !== "admin") {

        window.location.href =
            "dashboard.html";

        return false;
    }


    return true;
}



/* =========================================================
   MESSAGE
========================================================= */

function showStudentMessage(
    message,
    type = "info"
) {

    if (!studentMessage) {
        return;
    }


    studentMessage.innerHTML = `

        <div class="alert alert-${type}">

            ${LMS.escapeHTML(message)}

        </div>

    `;

}



/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

    try {

        const result =
            await LMS.api(
                "/admin/students"
            );


        if (!result.ok) {

            renderStudentError(
                result.data?.message ||
                "Unable to load students."
            );

            return;
        }


        students =
            Array.isArray(
                result.data?.students
            )
                ? result.data.students
                : [];


        renderStudents();


    } catch (error) {

        console.error(
            "Load students error:",
            error
        );


        renderStudentError(
            "Unable to connect to the LMS server."
        );

    }

}



/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents() {

    if (studentCount) {

        studentCount.textContent =
            `${students.length} Student${students.length === 1 ? "" : "s"}`;

    }


    if (studentTotal) {

        studentTotal.textContent =
            students.length;

    }


    if (!students.length) {

        studentList.innerHTML = `

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


    studentList.innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Student
                        </th>

                        <th>
                            Email
                        </th>

                        <th>
                            Enrolled Courses
                        </th>

                        <th>
                            Registered
                        </th>

                        <th>
                            Role
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        students
                            .map(
                                createStudentRow
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}



/* =========================================================
   STUDENT ROW
========================================================= */

function createStudentRow(
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


    const registeredDate =
        formatDate(
            student.createdAt
        );


    return `

        <tr>

            <td>

                <strong>
                    ${name}
                </strong>

            </td>


            <td>
                ${email}
            </td>


            <td>

                <span class="badge badge-primary">

                    ${enrolledCourses}

                </span>

            </td>


            <td>
                ${registeredDate}
            </td>


            <td>

                <span class="badge badge-success">

                    Student

                </span>

            </td>

        </tr>

    `;

}



/* =========================================================
   LOAD PROGRESS
========================================================= */

async function loadProgress() {

    try {

        const result =
            await LMS.api(
                "/admin/student-progress"
            );


        if (!result.ok) {

            renderProgressError(
                result.data?.message ||
                "Unable to load student progress."
            );

            return;
        }


        progressRecords =
            Array.isArray(
                result.data?.progress
            )
                ? result.data.progress
                : [];


        renderProgress();


    } catch (error) {

        console.error(
            "Load progress error:",
            error
        );


        renderProgressError(
            "Unable to connect to the LMS server."
        );

    }

}



/* =========================================================
   RENDER PROGRESS
========================================================= */

function renderProgress() {

    if (progressCount) {

        progressCount.textContent =
            `${progressRecords.length} Record${
                progressRecords.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (enrollmentTotal) {

        enrollmentTotal.textContent =
            progressRecords.length;

    }


    const completedRecords =
        progressRecords.filter(
            record =>
                record.status ===
                "Completed"
        );


    if (completedTotal) {

        completedTotal.textContent =
            completedRecords.length;

    }


    if (!progressRecords.length) {

        renderProgressEmpty();

        return;
    }


    const sortedRecords =
        [...progressRecords].sort(
            (a, b) =>
                String(
                    a.studentId?.name ||
                    ""
                ).localeCompare(
                    String(
                        b.studentId?.name ||
                        ""
                    )
                )
        );


    progressList.innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Student
                        </th>

                        <th>
                            Course
                        </th>

                        <th>
                            Progress
                        </th>

                        <th>
                            Modules
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Enrolled
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        sortedRecords
                            .map(
                                createProgressRow
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}



/* =========================================================
   PROGRESS ROW
========================================================= */

function createProgressRow(
    record
) {

    const student =
        record.studentId ||
        {};


    const course =
        record.courseId ||
        {};


    const studentName =
        LMS.escapeHTML(
            student.name ||
            "Student"
        );


    const studentEmail =
        LMS.escapeHTML(
            student.email ||
            ""
        );


    const courseTitle =
        LMS.escapeHTML(
            course.title ||
            "Course"
        );


    const progress =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    record.progress || 0
                )
            )
        );


    const completedModules =
        Array.isArray(
            record.completedModules
        )
            ? record.completedModules.length
            : 0;


    const status =
        record.status ||
        "Enrolled";


    const statusClass =
        getStatusClass(
            status
        );


    const enrolledDate =
        formatDate(
            record.enrollmentDate ||
            record.createdAt
        );


    return `

        <tr>

            <td>

                <strong>
                    ${studentName}
                </strong>


                <small
                    style="display:block;"
                >
                    ${studentEmail}
                </small>

            </td>


            <td>
                ${courseTitle}
            </td>


            <td>

                <div
                    class="progress-wrapper"
                    style="min-width:150px;"
                >

                    <div class="progress-header">

                        <span>
                            Progress
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

            </td>


            <td>

                <span class="badge badge-primary">

                    ${completedModules}

                </span>

            </td>


            <td>

                <span class="badge ${statusClass}">

                    ${LMS.escapeHTML(status)}

                </span>

            </td>


            <td>
                ${enrolledDate}
            </td>

        </tr>

    `;

}



/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    if (status === "Completed") {

        return "badge-success";

    }


    if (status === "In Progress") {

        return "badge-primary";

    }


    return "badge-warning";

}



/* =========================================================
   PROGRESS CLASS
========================================================= */

function getProgressClass(
    progress
) {

    const rounded =
        Math.round(
            Number(
                progress || 0
            )
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
   DATE FORMAT
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
            month: "short",
            year: "numeric"
        }
    );

}



/* =========================================================
   EMPTY PROGRESS
========================================================= */

function renderProgressEmpty() {

    if (!progressList) {
        return;
    }


    progressList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-chart-line"></i>

            </div>


            <h3>
                No progress records
            </h3>


            <p>
                Student course progress will appear here
                after students enroll in courses.
            </p>

        </div>

    `;

}



/* =========================================================
   STUDENT ERROR
========================================================= */

function renderStudentError(
    message
) {

    if (!studentList) {
        return;
    }


    studentList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Unable to load students
            </h3>


            <p>
                ${LMS.escapeHTML(message)}
            </p>


            <button
                type="button"
                class="btn btn-primary"
                id="retryStudentsButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryStudentsButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadStudents
        );

    }

}



/* =========================================================
   PROGRESS ERROR
========================================================= */

function renderProgressError(
    message
) {

    if (!progressList) {
        return;
    }


    progressList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Unable to load progress
            </h3>


            <p>
                ${LMS.escapeHTML(message)}
            </p>


            <button
                type="button"
                class="btn btn-primary"
                id="retryProgressButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryProgressButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadProgress
        );

    }

}



/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!checkAdminAccess()) {

            return;

        }


        await Promise.all([
            loadStudents(),
            loadProgress()
        ]);

    }
);