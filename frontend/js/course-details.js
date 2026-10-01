const courseDetailsContainer =
    document.getElementById("courseDetailsHero");

const courseId =
    new URLSearchParams(window.location.search).get("id");

let currentCourse = null;


/* =========================================================
   LOAD COURSE DETAILS
   ========================================================= */

async function loadCourseDetails() {
    if (!courseDetailsContainer) {
        return;
    }

    if (!courseId) {
        renderCourseError(
            "No course was selected."
        );

        return;
    }

    courseDetailsContainer.innerHTML = `
        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading course details...
            </p>

        </div>
    `;


    try {
        const result =
            await LMS.api(
                `/courses/${encodeURIComponent(courseId)}`
            );


        if (!result.ok) {
            renderCourseError(
                result.data?.message ||
                "Unable to load this course."
            );

            return;
        }


        currentCourse =
            result.data?.course ||
            result.data;


        if (!currentCourse || !currentCourse._id) {
            renderCourseError(
                "Course information could not be found."
            );

            return;
        }


        renderCourseDetails(
            currentCourse
        );


        await loadCourseModules(
            currentCourse._id
        );


        updateEnrollmentButton();

    } catch (error) {
        console.error(
            "Failed to load course details:",
            error
        );

        renderCourseError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   RENDER COURSE DETAILS
   ========================================================= */

function renderCourseDetails(course) {

    const title =
        LMS.escapeHTML(
            course.title ||
            "Untitled Course"
        );

    const description =
        LMS.escapeHTML(
            course.description ||
            "No course description available."
        );

    const category =
        LMS.escapeHTML(
            course.category ||
            "General"
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


    /* =====================================================
       HERO
    ===================================================== */

    if (courseDetailsContainer) {

        courseDetailsContainer.innerHTML = `

            <span class="section-eyebrow">

                <i class="fa-solid fa-book-open"></i>

                Course Overview

            </span>


            <h1>
                ${title}
            </h1>


            <p class="detail-hero-description">
                ${description}
            </p>


            <div class="detail-meta">

                <span>

                    <i class="fa-solid fa-signal"></i>

                    ${difficulty}

                </span>


                <span>

                    <i class="fa-regular fa-clock"></i>

                    ${duration}

                </span>


                <span>

                    <i class="fa-solid fa-user-tie"></i>

                    ${instructor}

                </span>

            </div>

        `;
    }


    /* =====================================================
       COURSE OVERVIEW PANEL
    ===================================================== */

    const titleElement =
        document.getElementById(
            "courseTitle"
        );

    const descriptionElement =
        document.getElementById(
            "courseDescription"
        );


    if (titleElement) {

        titleElement.textContent =
            course.title ||
            "Course";
    }


    if (descriptionElement) {

        descriptionElement.textContent =
            course.description ||
            "No course description available.";
    }


    /* =====================================================
       ENROLLMENT CARD
    ===================================================== */

    renderEnrollmentCard(
        course,
        category,
        difficulty,
        duration
    );
}

/* =========================================================
   RENDER ENROLLMENT CARD
========================================================= */

function renderEnrollmentCard(
    course,
    category,
    difficulty,
    duration
) {

    const enrollCard =
        document.getElementById(
            "enrollCard"
        );


    if (!enrollCard) {
        return;
    }


    enrollCard.innerHTML = `

        <div class="detail-card-icon">

            <i class="fa-solid fa-graduation-cap"></i>

        </div>


        <div class="enrollment-card-content">

            <span class="section-eyebrow">
                Start Learning
            </span>


            <h3>
                ${LMS.escapeHTML(
                    course.title ||
                    "This Course"
                )}
            </h3>


            <p class="mt-10">
                Enroll in this course and start
                your learning journey.
            </p>


            <div class="enrollment-details">

                <div>

                    <i class="fa-solid fa-signal"></i>

                    <span>
                        ${category}
                    </span>

                </div>


                <div>

                    <i class="fa-regular fa-clock"></i>

                    <span>
                        ${duration}
                    </span>

                </div>


                <div>

                    <i class="fa-solid fa-layer-group"></i>

                    <span>
                        Course Modules
                    </span>

                </div>

            </div>


            <button
                type="button"
                id="enrollCourseButton"
                class="btn btn-primary btn-block"
            >

                <i class="fa-solid fa-user-plus"></i>

                Enroll Now

            </button>


            <div
                id="courseEnrollmentMessage"
                class="enrollment-message"
            ></div>


            <a
                href="courses.html"
                class="btn btn-outline btn-block"
            >

                <i class="fa-solid fa-arrow-left"></i>

                Back to Courses

            </a>

        </div>

    `;
}

/* =========================================================
   LOAD COURSE MODULES
   ========================================================= */

async function loadCourseModules(courseIdValue) {

    const modulesContainer =
        document.getElementById(
            "modulePreview"
        );


    if (!modulesContainer) {
        return;
    }


    try {
        const result =
            await LMS.api(
                `/modules/course/${encodeURIComponent(courseIdValue)}`
            );


        if (!result.ok) {
            modulesContainer.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        <i class="fa-solid fa-layer-group"></i>
                    </div>

                    <h3>
                        Modules unavailable
                    </h3>

                    <p>
                        ${
                            LMS.escapeHTML(
                                result.data?.message ||
                                "Unable to load course modules."
                            )
                        }
                    </p>

                </div>
            `;

            return;
        }


        const modules =
            Array.isArray(result.data)
                ? result.data
                : result.data?.modules || [];


        renderCourseModules(
            modulesContainer,
            modules
        );

    } catch (error) {
        console.error(
            "Failed to load course modules:",
            error
        );


        modulesContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <h3>
                    Unable to load modules
                </h3>

                <p>
                    Please try again later.
                </p>

            </div>
        `;
    }
}



/* =========================================================
   RENDER MODULES
   ========================================================= */

function renderCourseModules(
    container,
    modules
) {

    if (!modules.length) {
        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    <i class="fa-solid fa-layer-group"></i>
                </div>

                <h3>
                    No modules available
                </h3>

                <p>
                    Modules for this course have not been added yet.
                </p>

            </div>
        `;

        return;
    }


    const sortedModules =
        [...modules].sort(
            (a, b) =>
                Number(a.moduleOrder || 0) -
                Number(b.moduleOrder || 0)
        );


    container.innerHTML =
        sortedModules
            .map(
                (module, index) =>
                    createModulePreview(
                        module,
                        index
                    )
            )
            .join("");
}



/* =========================================================
   MODULE PREVIEW
   ========================================================= */

function createModulePreview(
    module,
    index
) {

    const title =
        LMS.escapeHTML(
            module.title ||
            `Module ${index + 1}`
        );


    const description =
        LMS.escapeHTML(
            module.description ||
            "Learning module"
        );


    const resourceLink =
        module.resourceLink
            ? LMS.escapeHTML(
                module.resourceLink
            )
            : "";


    const order =
        Number(module.moduleOrder) ||
        index + 1;


    const resourceButton =
        resourceLink
            ? `
                <a
                    href="${resourceLink}"
                    class="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                    Resource

                </a>
            `
            : "";


    return `
        <article class="module-item">


            <div class="module-number">

                ${order}

            </div>



            <div class="module-content">

                <h3>
                    ${title}
                </h3>

                <p>
                    ${description}
                </p>

            </div>



            <div class="module-actions">

                ${resourceButton}

            </div>


        </article>
    `;
}



/* =========================================================
   ENROLLMENT BUTTON
========================================================= */

async function updateEnrollmentButton() {

    const button =
        document.getElementById(
            "enrollCourseButton"
        );


    if (!button) {
        return;
    }


    /* =====================================================
       NOT LOGGED IN
    ===================================================== */

    if (!LMS.isAuthenticated()) {

        button.innerHTML = `
            <i class="fa-solid fa-right-to-bracket"></i>
            Login to Enroll
        `;


        button.disabled = false;


        button.onclick = () => {

            window.location.href =
                `login.html?redirect=course-details.html?id=${encodeURIComponent(courseId)}`;

        };


        return;
    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    const user =
        LMS.getCurrentUser();


    if (!user) {

        button.innerHTML = `
            <i class="fa-solid fa-right-to-bracket"></i>
            Login to Enroll
        `;


        button.onclick = () => {

            window.location.href =
                `login.html?redirect=course-details.html?id=${encodeURIComponent(courseId)}`;

        };


        return;
    }


    /* =====================================================
       ADMIN
    ===================================================== */

    if (user.role === "admin") {

        button.innerHTML = `
            <i class="fa-solid fa-shield-halved"></i>
            Admin View
        `;


        button.disabled = false;


        button.onclick = () => {

            window.location.href =
                "admin-dashboard.html";

        };


        return;
    }


    /* =====================================================
       CHECK STUDENT ENROLLMENT
    ===================================================== */

    try {

        const result =
            await LMS.api(
                "/enrollments/my"
            );


        if (
            result.ok &&
            Array.isArray(
                result.data?.enrollments
            )
        ) {

            const enrolled =
                result.data.enrollments.some(
                    enrollment => {

                        const enrolledCourseId =
                            enrollment.courseId?._id ||
                            enrollment.courseId;


                        return String(
                            enrolledCourseId
                        ) === String(courseId);

                    }
                );


            if (enrolled) {

                setEnrolledButton(
                    button
                );

                return;
            }
        }


    } catch (error) {

        console.error(
            "Enrollment status check failed:",
            error
        );

    }


    /* =====================================================
       NOT ENROLLED
    ===================================================== */

    button.disabled = false;


    button.innerHTML = `
        <i class="fa-solid fa-user-plus"></i>
        Enroll Now
    `;


    button.onclick =
        enrollInCourse;
}


/* =========================================================
   ENROLL IN COURSE
   ========================================================= */

async function enrollInCourse() {

    const button =
        document.getElementById(
            "enrollCourseButton"
        );


    if (!button || !courseId) {
        return;
    }


    const message =
        document.getElementById(
            "courseEnrollmentMessage"
        );


    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enrolling...
    `;


    try {
        const result =
            await LMS.api(
                "/enrollments",
                {
                    method: "POST",
                    body: JSON.stringify({
                        courseId
                    })
                }
            );


        if (!result.ok) {

            if (
                result.status === 400 &&
                result.data?.message
                    ?.toLowerCase()
                    .includes("already")
            ) {

                setEnrolledButton(
                    button
                );

                showEnrollmentMessage(
                    result.data.message,
                    "success"
                );

                return;
            }


            showEnrollmentMessage(
                result.data?.message ||
                "Unable to enroll in this course."
            );


            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-user-plus"></i>
                Enroll Now
            `;

            return;
        }


        setEnrolledButton(
            button
        );


        showEnrollmentMessage(
            "You are now enrolled in this course.",
            "success"
        );

    } catch (error) {

        console.error(
            "Enrollment error:",
            error
        );


        showEnrollmentMessage(
            "Unable to connect to the LMS server."
        );


        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-user-plus"></i>
            Enroll Now
        `;
    }
}



/* =========================================================
   ENROLLED STATE
   ========================================================= */

function setEnrolledButton(button) {

    button.disabled = false;

    button.classList.remove(
        "btn-primary"
    );

    button.classList.add(
        "btn-success"
    );


    button.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        Already Enrolled
    `;


    button.onclick = () => {

        window.location.href =
            `modules.html?courseId=${encodeURIComponent(courseId)}`;

    };


    showEnrollmentMessage(
        "You are already enrolled in this course.",
        "success"
    );
}


/* =========================================================
   ENROLLMENT MESSAGE
   ========================================================= */

function showEnrollmentMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "courseEnrollmentMessage"
        );


    if (!element) {
        return;
    }


    element.className =
        `alert alert-${type}`;


    element.textContent =
        message;
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderCourseError(message) {

    if (!courseDetailsContainer) {
        return;
    }


    courseDetailsContainer.innerHTML = `
        <div class="empty-state">

            <div class="empty-state-icon">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h2>
                Unable to load course
            </h2>

            <p>
                ${LMS.escapeHTML(message)}
            </p>

            <a
                href="courses.html"
                class="btn btn-primary"
            >

                <i class="fa-solid fa-arrow-left"></i>

                Back to Courses

            </a>

        </div>
    `;
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadCourseDetails
);