/* =========================================================
   LMS — ADMIN ASSIGNMENT MANAGEMENT
========================================================= */


const courseSelect =
    document.getElementById("courseSelect");

const assignmentFormPanel =
    document.getElementById("assignmentFormPanel");

const assignmentForm =
    document.getElementById("assignmentForm");

const assignmentFormTitle =
    document.getElementById("assignmentFormTitle");

const assignmentSubmitButton =
    document.getElementById("assignmentSubmitButton");

const cancelAssignmentEditButton =
    document.getElementById(
        "cancelAssignmentEditButton"
    );

const assignmentList =
    document.getElementById("assignmentList");

const assignmentMessage =
    document.getElementById("assignmentMessage");

const assignmentCount =
    document.getElementById("assignmentCount");


let courses = [];

let assignments = [];

let editingAssignmentId = null;


/* =========================================================
   ADMIN ACCESS
========================================================= */

function checkAdminAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html?redirect=admin-assignments.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html?redirect=admin-assignments.html";

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

function showAssignmentMessage(
    message,
    type = "info"
) {

    if (!assignmentMessage) {
        return;
    }


    assignmentMessage.innerHTML = `

        <div class="alert alert-${type}">

            ${LMS.escapeHTML(message)}

        </div>

    `;

}


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    try {

        const result =
            await LMS.api("/courses");


        if (!result.ok) {

            showAssignmentMessage(
                result.data?.message ||
                "Unable to load courses.",
                "danger"
            );

            return;
        }


        courses =
            Array.isArray(result.data?.courses)
                ? result.data.courses
                : [];


        renderCourseOptions();


    } catch (error) {

        console.error(
            "Load courses error:",
            error
        );


        showAssignmentMessage(
            "Unable to connect to the LMS server.",
            "danger"
        );

    }

}


/* =========================================================
   COURSE OPTIONS
========================================================= */

function renderCourseOptions() {

    if (!courseSelect) {
        return;
    }


    courseSelect.innerHTML = `

        <option value="">
            Select a course
        </option>

        ${
            courses
                .map(course => {

                    const id =
                        course._id ||
                        course.id;

                    const title =
                        LMS.escapeHTML(
                            course.title ||
                            "Untitled Course"
                        );

                    return `

                        <option value="${id}">
                            ${title}
                        </option>

                    `;

                })
                .join("")
        }

    `;

}


/* =========================================================
   COURSE CHANGE
========================================================= */

if (courseSelect) {

    courseSelect.addEventListener(
        "change",
        async () => {

            const courseId =
                courseSelect.value;


            resetAssignmentForm();


            if (!courseId) {

                assignmentFormPanel.hidden =
                    true;

                renderEmptyState();

                return;
            }


            assignmentFormPanel.hidden =
                false;


            await loadAssignments(
                courseId
            );

        }
    );

}


/* =========================================================
   LOAD ASSIGNMENTS
========================================================= */

async function loadAssignments(
    courseId
) {

    assignmentList.innerHTML = `

        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading assignments...
            </p>

        </div>

    `;


    try {

        const result =
            await LMS.api(
                `/assignments/course/${encodeURIComponent(courseId)}`
            );


        if (!result.ok) {

            renderAssignmentError(
                result.data?.message ||
                "Unable to load assignments."
            );

            return;
        }


        assignments =
            Array.isArray(result.data?.assignments)
                ? result.data.assignments
                : [];


        renderAssignments();


    } catch (error) {

        console.error(
            "Load assignments error:",
            error
        );


        renderAssignmentError(
            "Unable to connect to the LMS server."
        );

    }

}


/* =========================================================
   RENDER ASSIGNMENTS
========================================================= */

function renderAssignments() {

    if (assignmentCount) {

        assignmentCount.textContent =
            `${assignments.length} Assignment${assignments.length === 1 ? "" : "s"}`;

    }


    if (!assignments.length) {

        renderEmptyState(
            "No assignments found",
            "Create the first assignment for this course."
        );

        return;
    }


    const sortedAssignments =
        [...assignments].sort(
            (a, b) =>
                new Date(
                    a.deadline || 0
                ) -
                new Date(
                    b.deadline || 0
                )
        );


    assignmentList.innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Assignment
                        </th>

                        <th>
                            Deadline
                        </th>

                        <th>
                            Maximum Marks
                        </th>

                        <th>
                            Description
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        sortedAssignments
                            .map(
                                createAssignmentRow
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   ASSIGNMENT ROW
========================================================= */

function createAssignmentRow(
    assignment
) {

    const id =
        assignment._id ||
        assignment.id;


    const title =
        LMS.escapeHTML(
            assignment.title ||
            "Assignment"
        );


    const description =
        LMS.escapeHTML(
            assignment.description ||
            "No description"
        );


    const deadline =
        formatDateTime(
            assignment.deadline
        );


    const maximumMarks =
        Number(
            assignment.maximumMarks || 0
        );


    return `

        <tr>

            <td>

                <strong>
                    ${title}
                </strong>

            </td>


            <td>
                ${deadline}
            </td>


            <td>

                <span class="badge badge-primary">

                    ${maximumMarks}

                </span>

            </td>


            <td>
                ${description}
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

if (assignmentForm) {

    assignmentForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const courseId =
                courseSelect.value;


            const title =
                document
                    .getElementById("assignmentTitle")
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "assignmentDescription"
                    )
                    .value
                    .trim();


            const deadlineInput =
                document
                    .getElementById(
                        "assignmentDeadline"
                    )
                    .value;


            const maximumMarks =
                Number(
                    document
                        .getElementById(
                            "maximumMarks"
                        )
                        .value
                );


            if (!courseId) {

                showAssignmentMessage(
                    "Please select a course.",
                    "danger"
                );

                return;
            }


            if (
                !title ||
                !description ||
                !deadlineInput ||
                !maximumMarks ||
                maximumMarks < 1
            ) {

                showAssignmentMessage(
                    "Please fill in all required assignment fields.",
                    "danger"
                );

                return;
            }


            const deadlineDate =
                new Date(
                    deadlineInput
                );


            if (
                Number.isNaN(
                    deadlineDate.getTime()
                )
            ) {

                showAssignmentMessage(
                    "Please enter a valid deadline.",
                    "danger"
                );

                return;
            }


            const payload = {

                title,

                description,

                deadline:
                    deadlineDate.toISOString(),

                maximumMarks

            };


            assignmentSubmitButton.disabled =
                true;


            assignmentSubmitButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Saving...

            `;


            try {

                let result;


                /* =============================================
                   UPDATE
                ============================================= */

                if (editingAssignmentId) {

                    result =
                        await LMS.api(
                            `/assignments/${encodeURIComponent(editingAssignmentId)}`,
                            {
                                method: "PUT",
                                body: JSON.stringify(
                                    payload
                                )
                            }
                        );

                }


                /* =============================================
                   CREATE
                ============================================= */

                else {

                    result =
                        await LMS.api(
                            "/assignments",
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    courseId,
                                    ...payload
                                })
                            }
                        );

                }


                if (!result.ok) {

                    showAssignmentMessage(
                        result.data?.message ||
                        "Unable to save assignment.",
                        "danger"
                    );

                    return;
                }


                showAssignmentMessage(
                    editingAssignmentId
                        ? "Assignment updated successfully."
                        : "Assignment created successfully.",
                    "success"
                );


                resetAssignmentForm();


                await loadAssignments(
                    courseId
                );


            } catch (error) {

                console.error(
                    "Save assignment error:",
                    error
                );


                showAssignmentMessage(
                    "Unable to connect to the LMS server.",
                    "danger"
                );

            } finally {

                assignmentSubmitButton.disabled =
                    false;

                updateAssignmentFormMode();

            }

        }
    );

}


/* =========================================================
   EDIT ASSIGNMENT
========================================================= */

function startEditAssignment(
    assignmentId
) {

    const assignment =
        assignments.find(
            item =>
                String(item._id || item.id) ===
                String(assignmentId)
        );


    if (!assignment) {
        return;
    }


    editingAssignmentId =
        assignmentId;


    document.getElementById(
        "assignmentTitle"
    ).value =
        assignment.title || "";


    document.getElementById(
        "assignmentDescription"
    ).value =
        assignment.description || "";


    document.getElementById(
        "maximumMarks"
    ).value =
        assignment.maximumMarks || 1;


    document.getElementById(
        "assignmentDeadline"
    ).value =
        toDateTimeLocal(
            assignment.deadline
        );


    updateAssignmentFormMode();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   DELETE ASSIGNMENT
========================================================= */

async function deleteAssignment(
    assignmentId
) {

    const assignment =
        assignments.find(
            item =>
                String(item._id || item.id) ===
                String(assignmentId)
        );


    if (!assignment) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${assignment.title}"? This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await LMS.api(
                `/assignments/${encodeURIComponent(assignmentId)}`,
                {
                    method: "DELETE"
                }
            );


        if (!result.ok) {

            showAssignmentMessage(
                result.data?.message ||
                "Unable to delete assignment.",
                "danger"
            );

            return;
        }


        showAssignmentMessage(
            "Assignment deleted successfully.",
            "success"
        );


        if (
            String(editingAssignmentId) ===
            String(assignmentId)
        ) {

            resetAssignmentForm();

        }


        await loadAssignments(
            courseSelect.value
        );


    } catch (error) {

        console.error(
            "Delete assignment error:",
            error
        );


        showAssignmentMessage(
            "Unable to connect to the LMS server.",
            "danger"
        );

    }

}


/* =========================================================
   ASSIGNMENT ACTIONS
========================================================= */

if (assignmentList) {

    assignmentList.addEventListener(
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


            const assignmentId =
                button.dataset.id;


            if (action === "edit") {

                startEditAssignment(
                    assignmentId
                );

            }


            if (action === "delete") {

                deleteAssignment(
                    assignmentId
                );

            }

        }
    );

}


/* =========================================================
   RESET FORM
========================================================= */

function resetAssignmentForm() {

    editingAssignmentId =
        null;


    if (assignmentForm) {

        assignmentForm.reset();

    }


    updateAssignmentFormMode();

}


/* =========================================================
   FORM MODE
========================================================= */

function updateAssignmentFormMode() {

    if (
        !assignmentFormTitle ||
        !assignmentSubmitButton ||
        !cancelAssignmentEditButton
    ) {
        return;
    }


    if (editingAssignmentId) {

        assignmentFormTitle.textContent =
            "Edit Assignment";


        assignmentSubmitButton.innerHTML = `

            <i class="fa-solid fa-save"></i>

            Update Assignment

        `;


        cancelAssignmentEditButton.hidden =
            false;


        return;
    }


    assignmentFormTitle.textContent =
        "Create New Assignment";


    assignmentSubmitButton.innerHTML = `

        <i class="fa-solid fa-plus"></i>

        Create Assignment

    `;


    cancelAssignmentEditButton.hidden =
        true;

}


/* =========================================================
   CANCEL EDIT
========================================================= */

if (cancelAssignmentEditButton) {

    cancelAssignmentEditButton.addEventListener(
        "click",
        () => {

            resetAssignmentForm();

        }
    );

}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyState(
    title = "Select a course",
    description =
        "Choose a course above to manage its assignments."
) {

    if (assignmentCount) {

        assignmentCount.textContent =
            "0 Assignments";

    }


    if (!assignmentList) {
        return;
    }


    assignmentList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-list-check"></i>

            </div>


            <h3>
                ${LMS.escapeHTML(title)}
            </h3>


            <p>
                ${LMS.escapeHTML(description)}
            </p>

        </div>

    `;

}


/* =========================================================
   ERROR
========================================================= */

function renderAssignmentError(
    message
) {

    if (!assignmentList) {
        return;
    }


    assignmentList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Unable to load assignments
            </h3>


            <p>
                ${LMS.escapeHTML(message)}
            </p>


            <button
                type="button"
                class="btn btn-primary"
                id="retryAssignmentsButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryAssignmentsButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () =>
                loadAssignments(
                    courseSelect.value
                )
        );

    }

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDateTime(
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


    return date.toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   DATETIME LOCAL VALUE
========================================================= */

function toDateTimeLocal(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return `${year}-${month}-${day}T${hours}:${minutes}`;

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


        updateAssignmentFormMode();

        await loadCourses();

    }
);