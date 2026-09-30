/* =========================================================
   LMS — ADMIN SUBMISSION REVIEW
========================================================= */


const courseSelect =
    document.getElementById("courseSelect");

const assignmentSelectorPanel =
    document.getElementById(
        "assignmentSelectorPanel"
    );

const assignmentSelect =
    document.getElementById("assignmentSelect");

const submissionList =
    document.getElementById("submissionList");

const submissionMessage =
    document.getElementById("submissionMessage");

const submissionCount =
    document.getElementById("submissionCount");


let courses = [];

let assignments = [];

let submissions = [];



/* =========================================================
   ADMIN ACCESS
========================================================= */

function checkAdminAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html?redirect=admin-submissions.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html?redirect=admin-submissions.html";

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

function showSubmissionMessage(
    message,
    type = "info"
) {

    if (!submissionMessage) {
        return;
    }


    submissionMessage.innerHTML = `

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

            showSubmissionMessage(
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


        showSubmissionMessage(
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


            submissions = [];

            renderSubmissions();


            if (!courseId) {

                assignmentSelectorPanel.hidden =
                    true;


                assignmentSelect.innerHTML = `
                    <option value="">
                        Select an assignment
                    </option>
                `;


                return;
            }


            assignmentSelectorPanel.hidden =
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

    assignmentSelect.innerHTML = `

        <option value="">
            Loading assignments...
        </option>

    `;


    try {

        const result =
            await LMS.api(
                `/assignments/course/${encodeURIComponent(courseId)}`
            );


        if (!result.ok) {

            showSubmissionMessage(
                result.data?.message ||
                "Unable to load assignments.",
                "danger"
            );


            assignmentSelect.innerHTML = `
                <option value="">
                    Unable to load assignments
                </option>
            `;


            return;
        }


        assignments =
            Array.isArray(result.data?.assignments)
                ? result.data.assignments
                : [];


        renderAssignmentOptions();


    } catch (error) {

        console.error(
            "Load assignments error:",
            error
        );


        showSubmissionMessage(
            "Unable to connect to the LMS server.",
            "danger"
        );

    }

}



/* =========================================================
   ASSIGNMENT OPTIONS
========================================================= */

function renderAssignmentOptions() {

    if (!assignmentSelect) {
        return;
    }


    if (!assignments.length) {

        assignmentSelect.innerHTML = `
            <option value="">
                No assignments found
            </option>
        `;


        submissions = [];

        renderSubmissions();

        return;
    }


    assignmentSelect.innerHTML = `

        <option value="">
            Select an assignment
        </option>

        ${
            assignments
                .map(assignment => {

                    const id =
                        assignment._id ||
                        assignment.id;


                    const title =
                        LMS.escapeHTML(
                            assignment.title ||
                            "Assignment"
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
   ASSIGNMENT CHANGE
========================================================= */

if (assignmentSelect) {

    assignmentSelect.addEventListener(
        "change",
        async () => {

            const assignmentId =
                assignmentSelect.value;


            if (!assignmentId) {

                submissions = [];

                renderSubmissions();

                return;
            }


            await loadSubmissions(
                assignmentId
            );

        }
    );

}



/* =========================================================
   LOAD SUBMISSIONS
========================================================= */

async function loadSubmissions(
    assignmentId
) {

    submissionList.innerHTML = `

        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading submissions...
            </p>

        </div>

    `;


    try {

        const result =
            await LMS.api(
                `/submissions/assignment/${encodeURIComponent(assignmentId)}`
            );


        if (!result.ok) {

            renderSubmissionError(
                result.data?.message ||
                "Unable to load submissions."
            );

            return;
        }


        submissions =
            Array.isArray(
                result.data?.submissions
            )
                ? result.data.submissions
                : [];


        renderSubmissions();


    } catch (error) {

        console.error(
            "Load submissions error:",
            error
        );


        renderSubmissionError(
            "Unable to connect to the LMS server."
        );

    }

}



/* =========================================================
   RENDER SUBMISSIONS
========================================================= */

function renderSubmissions() {

    if (submissionCount) {

        submissionCount.textContent =
            `${submissions.length} Submission${submissions.length === 1 ? "" : "s"}`;

    }


    if (!submissions.length) {

        renderEmptyState(
            "No submissions found",
            "No students have submitted this assignment yet."
        );

        return;
    }


    const sortedSubmissions =
        [...submissions].sort(
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
        );


    submissionList.innerHTML =
        sortedSubmissions
            .map(
                createSubmissionCard
            )
            .join("");

}



/* =========================================================
   SUBMISSION CARD
========================================================= */

function createSubmissionCard(
    submission
) {

    const submissionId =
        submission._id ||
        submission.id;


    const student =
        submission.studentId ||
        {};


    const assignment =
        submission.assignmentId ||
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


    const submissionLink =
        LMS.escapeHTML(
            submission.submissionLink ||
            "#"
        );


    const submittedDate =
        formatDateTime(
            submission.submissionDate ||
            submission.createdAt
        );


    const marks =
        submission.marks !== null &&
        submission.marks !== undefined
            ? submission.marks
            : "";


    const feedback =
        submission.feedback || "";


    const maximumMarks =
        Number(
            assignment.maximumMarks ||
            getSelectedAssignmentMaximumMarks()
        );


    const status =
        submission.status ||
        "Submitted";


    return `

        <article
            class="assignment-card"
            data-submission-id="${submissionId}"
        >


            <div class="assignment-card-content">


                <div class="assignment-card-top">

                    <span class="badge badge-primary">

                        ${studentName}

                    </span>


                    <span class="badge ${
                        status === "Reviewed"
                            ? "badge-success"
                            : "badge-warning"
                    }">

                        ${LMS.escapeHTML(status)}

                    </span>

                </div>



                <h3>
                    ${studentEmail}
                </h3>


                <p>
                    Submitted on ${submittedDate}
                </p>



                <div class="assignment-meta">

                    <span>

                        <i class="fa-solid fa-award"></i>

                        Maximum:
                        ${maximumMarks}

                    </span>


                    <span>

                        <i class="fa-solid fa-star"></i>

                        Marks:
                        ${
                            marks === ""
                                ? "Not reviewed"
                                : marks
                        }

                    </span>

                </div>



                <div class="submission-review-form">


                    <div class="form-grid">


                        <div class="form-group">

                            <label
                                class="form-label"
                                for="marks-${submissionId}"
                            >
                                Marks
                            </label>


                            <input
                                type="number"
                                id="marks-${submissionId}"
                                class="form-control"
                                min="0"
                                max="${maximumMarks}"
                                step="1"
                                value="${LMS.escapeHTML(String(marks))}"
                                placeholder="Enter marks"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                class="form-label"
                                for="status-${submissionId}"
                            >
                                Status
                            </label>


                            <select
                                id="status-${submissionId}"
                                class="form-control form-select"
                            >

                                <option
                                    value="Submitted"
                                    ${
                                        status === "Submitted"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Submitted
                                </option>


                                <option
                                    value="Reviewed"
                                    ${
                                        status === "Reviewed"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Reviewed
                                </option>

                            </select>

                        </div>


                    </div>



                    <div class="form-group">

                        <label
                            class="form-label"
                            for="feedback-${submissionId}"
                        >
                            Feedback
                        </label>


                        <textarea
                            id="feedback-${submissionId}"
                            class="form-control form-textarea"
                            rows="3"
                            placeholder="Enter feedback for the student"
                        >${LMS.escapeHTML(feedback)}</textarea>

                    </div>


                </div>

            </div>



            <div class="assignment-card-status">


                <a
                    href="${submissionLink}"
                    class="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                    Open Submission

                </a>


                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    data-action="review"
                    data-id="${submissionId}"
                >

                    <i class="fa-solid fa-check"></i>

                    Save Review

                </button>


            </div>


        </article>

    `;

}



/* =========================================================
   SAVE REVIEW
========================================================= */

async function reviewSubmission(
    submissionId
) {

    const marksInput =
        document.getElementById(
            `marks-${submissionId}`
        );


    const statusInput =
        document.getElementById(
            `status-${submissionId}`
        );


    const feedbackInput =
        document.getElementById(
            `feedback-${submissionId}`
        );


    if (
        !marksInput ||
        !statusInput ||
        !feedbackInput
    ) {
        return;
    }


    const assignment =
        assignments.find(
            item =>
                String(item._id || item.id) ===
                String(
                    assignmentSelect.value
                )
        );


    const maximumMarks =
        Number(
            assignment?.maximumMarks || 0
        );


    const marksValue =
        marksInput.value.trim();


    const feedback =
        feedbackInput.value.trim();


    const status =
        statusInput.value;


    let marks;


    if (marksValue === "") {

        marks = null;

    } else {

        marks =
            Number(
                marksValue
            );


        if (
            !Number.isFinite(marks) ||
            marks < 0 ||
            marks > maximumMarks
        ) {

            showSubmissionMessage(
                `Marks must be between 0 and ${maximumMarks}.`,
                "danger"
            );

            return;
        }

    }


    const button =
        document.querySelector(
            `button[data-action="review"][data-id="${submissionId}"]`
        );


    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;

    }


    try {

        const result =
            await LMS.api(
                `/submissions/${encodeURIComponent(submissionId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        marks,
                        feedback,
                        status
                    })
                }
            );


        if (!result.ok) {

            showSubmissionMessage(
                result.data?.message ||
                "Unable to review submission.",
                "danger"
            );

            return;
        }


        showSubmissionMessage(
            "Submission review saved successfully.",
            "success"
        );


        await loadSubmissions(
            assignmentSelect.value
        );


    } catch (error) {

        console.error(
            "Review submission error:",
            error
        );


        showSubmissionMessage(
            "Unable to connect to the LMS server.",
            "danger"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Save Review
            `;

        }

    }

}



/* =========================================================
   SUBMISSION ACTIONS
========================================================= */

if (submissionList) {

    submissionList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) {
                return;
            }


            if (
                button.dataset.action ===
                "review"
            ) {

                reviewSubmission(
                    button.dataset.id
                );

            }

        }
    );

}



/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyState(
    title = "Select an assignment",
    description =
        "Choose a course and assignment to view submissions."
) {

    if (submissionCount) {

        submissionCount.textContent =
            "0 Submissions";

    }


    if (!submissionList) {
        return;
    }


    submissionList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-file-circle-check"></i>

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

function renderSubmissionError(
    message
) {

    if (!submissionList) {
        return;
    }


    submissionList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Unable to load submissions
            </h3>


            <p>
                ${LMS.escapeHTML(message)}
            </p>


            <button
                type="button"
                class="btn btn-primary"
                id="retrySubmissionsButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retrySubmissionsButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () =>
                loadSubmissions(
                    assignmentSelect.value
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
   GET MAXIMUM MARKS
========================================================= */

function getSelectedAssignmentMaximumMarks() {

    const assignment =
        assignments.find(
            item =>
                String(item._id || item.id) ===
                String(
                    assignmentSelect?.value
                )
        );


    return Number(
        assignment?.maximumMarks || 0
    );

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


        await loadCourses();

    }
);