const progressCourseCount =
    document.getElementById("progressCourseCount");

const courseId =
    new URLSearchParams(window.location.search).get("courseId");

const progressAverage =
    document.getElementById("progressAverage");

const progressCompleted =
    document.getElementById("progressCompleted");

const progressCoursesContainer =
    document.getElementById(
        "progressCoursesContainer"
    );


let progressEnrollments = [];



/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkProgressAccess() {

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


    return true;
}



/* =========================================================
   LOAD PROGRESS
   ========================================================= */

async function loadProgress() {

    if (!checkProgressAccess()) {
        return;
    }


    if (!progressCoursesContainer) {
        return;
    }


    renderProgressLoading();


    try {

        const result = courseId
            ? await LMS.api(`/progress/${encodeURIComponent(courseId)}`)
            : await LMS.api("/enrollments/my");


        if (
            result.status === 401 ||
            !LMS.isAuthenticated()
        ) {

            window.location.href =
                "login.html";

            return;
        }


        if (!result.ok) {

            renderProgressError(
                result.data?.message ||
                "Unable to load your progress."
            );

            return;
        }


        progressEnrollments = courseId
            ? [{
                courseId: result.data?.course,
                progress: result.data?.progress || 0,
                status: result.data?.status || "In Progress",
                completedModules: result.data?.completedModules || []
            }]
            : (
                Array.isArray(result.data)
                    ? result.data
                    : result.data?.enrollments || []
            );


        renderProgressStats();

        renderProgressCourses();

    } catch (error) {

        console.error(
            "Progress loading error:",
            error
        );


        renderProgressError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   RENDER STATISTICS
   ========================================================= */

function renderProgressStats() {

    const totalCourses =
        progressEnrollments.length;


    const totalProgress =
        progressEnrollments.reduce(
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
        progressEnrollments.filter(
            enrollment =>
                Number(
                    enrollment.progress || 0
                ) === 100
        ).length;


    if (progressCourseCount) {

        progressCourseCount.textContent =
            totalCourses;
    }


    if (progressAverage) {

        progressAverage.textContent =
            `${average}%`;
    }


    if (progressCompleted) {

        progressCompleted.textContent =
            completed;
    }
}



/* =========================================================
   RENDER COURSE PROGRESS
   ========================================================= */

function renderProgressCourses() {

    if (!progressCoursesContainer) {
        return;
    }


    if (!progressEnrollments.length) {

        progressCoursesContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-chart-line"></i>

                </div>


                <h3>
                    No learning progress yet
                </h3>


                <p>
                    Enroll in a course to start tracking
                    your learning progress.
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


    progressCoursesContainer.innerHTML =
        progressEnrollments
            .map(
                enrollment =>
                    createProgressCard(
                        enrollment
                    )
            )
            .join("");
}



/* =========================================================
   PROGRESS CARD
   ========================================================= */

function createProgressCard(
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
        enrollment.status ||
        "Enrolled";


    const statusClass =
        getStatusClass(status);


    const progressClass =
        getProgressClass(progress);


    const progressMessage =
        getProgressMessage(progress);


    return `
        <article class="progress-course-card">


            <div class="progress-course-header">


                <div>

                    <span class="badge badge-primary">
                        ${category}
                    </span>


                    <h3>
                        ${title}
                    </h3>


                    <p>
                        ${description}
                    </p>

                </div>


                <div class="progress-course-percentage">

                    <strong>
                        ${progress}%
                    </strong>

                    <span>
                        Complete
                    </span>

                </div>


            </div>



            <div class="progress-course-meta">


                <span>

                    <i class="fa-solid fa-signal"></i>

                    ${difficulty}

                </span>


                <span class="badge ${statusClass}">

                    ${LMS.escapeHTML(status)}

                </span>

            </div>



            <div class="progress-wrapper">


                <div class="progress-header">

                    <span>
                        Overall Course Progress
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



            <div class="progress-course-footer">


                <span>

                    <i class="fa-solid fa-circle-info"></i>

                    ${progressMessage}

                </span>


                <a
                    href="course-details.html?id=${encodeURIComponent(courseId)}"
                    class="btn btn-primary btn-sm"
                >

                    ${progress === 100
                        ? "Review Course"
                        : "Continue Learning"
                    }

                    <i class="fa-solid fa-arrow-right"></i>

                </a>


            </div>


        </article>
    `;
}



/* =========================================================
   PROGRESS MESSAGE
   ========================================================= */

function getProgressMessage(
    progress
) {

    if (progress === 100) {

        return "Course completed successfully.";
    }


    if (progress >= 75) {

        return "You are almost there. Keep going.";
    }


    if (progress >= 50) {

        return "Great progress. Keep building momentum.";
    }


    if (progress > 0) {

        return "You have started this course. Keep learning.";
    }


    return "Start the first module to begin your progress.";
}



/* =========================================================
   STATUS CLASS
   ========================================================= */

function getStatusClass(status) {

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
   LOADING STATE
   ========================================================= */

function renderProgressLoading() {

    if (!progressCoursesContainer) {
        return;
    }


    progressCoursesContainer.innerHTML = `
        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading your progress...
            </p>

        </div>
    `;
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderProgressError(
    message
) {

    if (!progressCoursesContainer) {
        return;
    }


    progressCoursesContainer.innerHTML = `
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
    loadProgress
);