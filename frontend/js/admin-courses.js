/* =========================================================
   LMS — ADMIN COURSE MANAGEMENT
========================================================= */


const courseForm =
    document.getElementById("courseForm");

const courseFormTitle =
    document.getElementById("courseFormTitle");

const courseSubmitButton =
    document.getElementById("courseSubmitButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const courseList =
    document.getElementById("courseList");

const courseMessage =
    document.getElementById("courseMessage");

const courseCount =
    document.getElementById("courseCount");


let courses = [];

let editingCourseId = null;


/* =========================================================
   ADMIN ACCESS
========================================================= */

function checkAdminAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html?redirect=admin-courses.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html?redirect=admin-courses.html";

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

function showCourseMessage(
    message,
    type = "info"
) {

    if (!courseMessage) {
        return;
    }


    courseMessage.innerHTML = `

        <div class="alert alert-${type}">

            ${LMS.escapeHTML(message)}

        </div>

    `;

}


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    if (!courseList) {
        return;
    }


    courseList.innerHTML = `

        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading courses...
            </p>

        </div>

    `;


    try {

        const result =
            await LMS.api("/courses");


        if (!result.ok) {

            renderCourseError(
                result.data?.message ||
                "Unable to load courses."
            );

            return;
        }


        courses =
            Array.isArray(result.data?.courses)
                ? result.data.courses
                : [];


        renderCourses();


    } catch (error) {

        console.error(
            "Load courses error:",
            error
        );


        renderCourseError(
            "Unable to connect to the LMS server."
        );

    }

}


/* =========================================================
   RENDER COURSES
========================================================= */

function renderCourses() {

    if (!courseList) {
        return;
    }


    if (courseCount) {

        courseCount.textContent =
            `${courses.length} Course${courses.length === 1 ? "" : "s"}`;

    }


    if (!courses.length) {

        courseList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-book-open"></i>

                </div>

                <h3>
                    No courses found
                </h3>

                <p>
                    Create your first course using the form above.
                </p>

            </div>

        `;

        return;
    }


    courseList.innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Course
                        </th>

                        <th>
                            Category
                        </th>

                        <th>
                            Difficulty
                        </th>

                        <th>
                            Duration
                        </th>

                        <th>
                            Instructor
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        courses
                            .map(
                                createCourseRow
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   COURSE ROW
========================================================= */

function createCourseRow(
    course
) {

    const id =
        course._id ||
        course.id;


    const title =
        LMS.escapeHTML(
            course.title ||
            "Untitled Course"
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
            "Admin"
        );


    return `

        <tr>

            <td>

                <strong>
                    ${title}
                </strong>

            </td>


            <td>
                ${category}
            </td>


            <td>

                <span class="badge badge-primary">

                    ${difficulty}

                </span>

            </td>


            <td>
                ${duration}
            </td>


            <td>
                ${instructor}
            </td>


            <td>

                <div class="toolbar-actions">


                    <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        data-action="edit"
                        data-id="${id}"
                    >

                        <i class="fa-solid fa-pen"></i>

                        Edit

                    </button>


                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        data-action="delete"
                        data-id="${id}"
                    >

                        <i class="fa-solid fa-trash"></i>

                        Delete

                    </button>


                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   FORM SUBMIT
========================================================= */

if (courseForm) {

    courseForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const title =
                document
                    .getElementById("courseTitle")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("courseDescription")
                    .value
                    .trim();


            const category =
                document
                    .getElementById("courseCategory")
                    .value
                    .trim();


            const duration =
                document
                    .getElementById("courseDuration")
                    .value
                    .trim();


            const difficulty =
                document
                    .getElementById("courseDifficulty")
                    .value;


            const image =
                document
                    .getElementById("courseImage")
                    .value
                    .trim();


            if (
                !title ||
                !description ||
                !category ||
                !duration
            ) {

                showCourseMessage(
                    "Please fill in all required course fields.",
                    "danger"
                );

                return;
            }


            const payload = {

                title,
                description,
                category,
                duration,
                difficulty,
                image

            };


            courseSubmitButton.disabled =
                true;


            courseSubmitButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Saving...

            `;


            try {

                let result;


                /* =============================================
                   EDIT COURSE
                ============================================= */

                if (editingCourseId) {

                    result =
                        await LMS.api(
                            `/courses/${encodeURIComponent(editingCourseId)}`,
                            {
                                method: "PUT",
                                body: JSON.stringify(payload)
                            }
                        );

                }


                /* =============================================
                   CREATE COURSE
                ============================================= */

                else {

                    result =
                        await LMS.api(
                            "/courses",
                            {
                                method: "POST",
                                body: JSON.stringify(payload)
                            }
                        );

                }


                if (!result.ok) {

                    showCourseMessage(
                        result.data?.message ||
                        "Unable to save course.",
                        "danger"
                    );

                    return;
                }


                showCourseMessage(

                    editingCourseId
                        ? "Course updated successfully."
                        : "Course created successfully.",

                    "success"

                );


                resetCourseForm();


                await loadCourses();


            } catch (error) {

                console.error(
                    "Save course error:",
                    error
                );


                showCourseMessage(
                    "Unable to connect to the LMS server.",
                    "danger"
                );

            } finally {

                courseSubmitButton.disabled =
                    false;

                updateFormMode();

            }

        }
    );

}


/* =========================================================
   EDIT COURSE
========================================================= */

function startEditCourse(
    courseId
) {

    const course =
        courses.find(
            item =>
                String(item._id || item.id) ===
                String(courseId)
        );


    if (!course) {
        return;
    }


    editingCourseId =
        courseId;


    document.getElementById(
        "courseTitle"
    ).value =
        course.title || "";


    document.getElementById(
        "courseDescription"
    ).value =
        course.description || "";


    document.getElementById(
        "courseCategory"
    ).value =
        course.category || "";


    document.getElementById(
        "courseDuration"
    ).value =
        course.duration || "";


    document.getElementById(
        "courseDifficulty"
    ).value =
        course.difficulty || "Beginner";


    document.getElementById(
        "courseImage"
    ).value =
        course.image || "";


    updateFormMode();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   DELETE COURSE
========================================================= */

async function deleteCourse(
    courseId
) {

    const course =
        courses.find(
            item =>
                String(item._id || item.id) ===
                String(courseId)
        );


    if (!course) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${course.title}"? This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await LMS.api(
                `/courses/${encodeURIComponent(courseId)}`,
                {
                    method: "DELETE"
                }
            );


        if (!result.ok) {

            showCourseMessage(
                result.data?.message ||
                "Unable to delete course.",
                "danger"
            );

            return;
        }


        showCourseMessage(
            "Course deleted successfully.",
            "success"
        );


        if (
            String(editingCourseId) ===
            String(courseId)
        ) {

            resetCourseForm();

        }


        await loadCourses();


    } catch (error) {

        console.error(
            "Delete course error:",
            error
        );


        showCourseMessage(
            "Unable to connect to the LMS server.",
            "danger"
        );

    }

}


/* =========================================================
   COURSE ACTIONS
========================================================= */

if (courseList) {

    courseList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const courseId =
                button.dataset.id;


            if (action === "edit") {

                startEditCourse(
                    courseId
                );

            }


            if (action === "delete") {

                deleteCourse(
                    courseId
                );

            }

        }
    );

}


/* =========================================================
   RESET FORM
========================================================= */

function resetCourseForm() {

    editingCourseId =
        null;


    if (courseForm) {

        courseForm.reset();

    }


    const difficulty =
        document.getElementById(
            "courseDifficulty"
        );


    if (difficulty) {

        difficulty.value =
            "Beginner";

    }


    updateFormMode();

}


/* =========================================================
   UPDATE FORM MODE
========================================================= */

function updateFormMode() {

    if (
        !courseFormTitle ||
        !courseSubmitButton ||
        !cancelEditButton
    ) {
        return;
    }


    if (editingCourseId) {

        courseFormTitle.textContent =
            "Edit Course";


        courseSubmitButton.innerHTML = `

            <i class="fa-solid fa-save"></i>

            Update Course

        `;


        cancelEditButton.hidden =
            false;

        return;

    }


    courseFormTitle.textContent =
        "Create New Course";


    courseSubmitButton.innerHTML = `

        <i class="fa-solid fa-plus"></i>

        Create Course

    `;


    cancelEditButton.hidden =
        true;

}


/* =========================================================
   CANCEL EDIT
========================================================= */

if (cancelEditButton) {

    cancelEditButton.addEventListener(
        "click",
        () => {

            resetCourseForm();

        }
    );

}


/* =========================================================
   ERROR
========================================================= */

function renderCourseError(
    message
) {

    if (!courseList) {
        return;
    }


    courseList.innerHTML = `

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
                id="retryCoursesButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryCoursesButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadCourses
        );

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!checkAdminAccess()) {
            return;
        }


        updateFormMode();

        loadCourses();

    }
);