const submissionForm =
    document.getElementById("submissionForm");

const assignmentSelect =
    document.getElementById("assignmentSelect");

const submissionLink =
    document.getElementById("submissionLink");

const submissionMessage =
    document.getElementById("submissionMessage");

const submissionHistory =
    document.getElementById("submissionHistory");

const submissionButton =
    document.getElementById("submissionButton");


let availableAssignments = [];
let mySubmissions = [];

const selectedAssignmentId =
    new URLSearchParams(
        window.location.search
    ).get("assignmentId");



/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkSubmissionAccess() {

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


    if (user.role !== "student") {

        showSubmissionMessage(
            "Only student accounts can submit assignments."
        );

        if (submissionForm) {
            submissionForm.classList.add(
                "hidden"
            );
        }

        return false;
    }


    return true;
}



/* =========================================================
   LOAD SUBMISSION PAGE
   ========================================================= */

async function loadSubmissionPage() {

    if (!checkSubmissionAccess()) {
        return;
    }


    renderSubmissionHistoryLoading();


    try {

        await loadAssignments();

        await loadSubmissions();

        populateAssignmentSelect();

        renderSubmissionHistory();

    } catch (error) {

        console.error(
            "Submission page loading error:",
            error
        );


        showSubmissionMessage(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   LOAD ASSIGNMENTS
   ========================================================= */

async function loadAssignments() {

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

        throw new Error(
            enrollmentResult.data?.message ||
            "Unable to load enrolled courses."
        );
    }


    const enrollments =
        Array.isArray(
            enrollmentResult.data
        )
            ? enrollmentResult.data
            : enrollmentResult.data?.enrollments || [];


    const courseIds =
        enrollments
            .map(
                enrollment =>
                    enrollment.courseId?._id ||
                    enrollment.courseId
            )
            .filter(Boolean);


    const uniqueCourseIds =
        [
            ...new Set(
                courseIds.map(
                    id => String(id)
                )
            )
        ];


    if (!uniqueCourseIds.length) {

        availableAssignments = [];

        return;
    }


    const results =
        await Promise.all(
            uniqueCourseIds.map(
                async courseId => {

                    try {

                        const result =
                            await LMS.api(
                                `/assignments/course/${encodeURIComponent(courseId)}`
                            );


                        if (!result.ok) {
                            return [];
                        }


                        return Array.isArray(
                            result.data
                        )
                            ? result.data
                            : result.data?.assignments || [];

                    } catch (error) {

                        console.error(
                            "Assignment loading error:",
                            error
                        );

                        return [];
                    }
                }
            )
        );


    availableAssignments =
        results
            .flat()
            .filter(
                assignment =>
                    assignment &&
                    assignment._id
            );
}



/* =========================================================
   LOAD MY SUBMISSIONS
   ========================================================= */

async function loadSubmissions() {

    const result =
        await LMS.api(
            "/submissions/my"
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

        mySubmissions = [];

        return;
    }


    mySubmissions =
        Array.isArray(result.data)
            ? result.data
            : result.data?.submissions || [];
}



/* =========================================================
   POPULATE ASSIGNMENT SELECT
   ========================================================= */

function populateAssignmentSelect() {

    if (!assignmentSelect) {
        return;
    }


    assignmentSelect.innerHTML = `
        <option value="">
            Select an assignment
        </option>
    `;


    const submittedIds =
        new Set(
            mySubmissions
                .map(
                    submission =>
                        submission.assignmentId?._id ||
                        submission.assignmentId
                )
                .filter(Boolean)
                .map(
                    id => String(id)
                )
        );


    availableAssignments.forEach(
        assignment => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                assignment._id;


            const courseTitle =
                assignment.courseId?.title ||
                "Course";


            const isSubmitted =
                submittedIds.has(
                    String(
                        assignment._id
                    )
                );


            option.textContent =
                isSubmitted
                    ? `${assignment.title} — ${courseTitle} (Submitted)`
                    : `${assignment.title} — ${courseTitle}`;


            option.disabled =
                isSubmitted;


            assignmentSelect.appendChild(
                option
            );
        }
    );


    if (selectedAssignmentId) {

        const selectedOption =
            Array.from(
                assignmentSelect.options
            ).find(
                option =>
                    String(option.value) ===
                    String(selectedAssignmentId)
            );


        if (
            selectedOption &&
            !selectedOption.disabled
        ) {

            assignmentSelect.value =
                selectedAssignmentId;
        }
    }


    updateSelectedAssignment();
}



/* =========================================================
   SELECTED ASSIGNMENT DETAILS
   ========================================================= */

function updateSelectedAssignment() {

    if (!assignmentSelect) {
        return;
    }


    const assignment =
        availableAssignments.find(
            item =>
                String(item._id) ===
                String(
                    assignmentSelect.value
                )
        );


    const existingInfo =
        document.getElementById(
            "selectedAssignmentInfo"
        );


    if (existingInfo) {
        existingInfo.remove();
    }


    if (!assignment) {
        return;
    }


    const info =
        document.createElement(
            "div"
        );


    info.id =
        "selectedAssignmentInfo";


    info.className =
        "form-help";


    const deadline =
        formatDate(
            assignment.deadline
        );


    const maximumMarks =
        Number(
            assignment.maximumMarks || 0
        );


    info.textContent =
        `Deadline: ${deadline} • Maximum Marks: ${maximumMarks}`;


    assignmentSelect
        .closest(".form-group")
        ?.appendChild(info);
}



/* =========================================================
   SUBMIT ASSIGNMENT
   ========================================================= */

async function submitAssignment(
    event
) {

    event.preventDefault();


    if (!checkSubmissionAccess()) {
        return;
    }


    const assignmentId =
        assignmentSelect
            ? assignmentSelect.value
            : "";


    const link =
        submissionLink
            ? submissionLink.value.trim()
            : "";


    if (!assignmentId) {

        showSubmissionMessage(
            "Please select an assignment."
        );

        return;
    }


    if (!link) {

        showSubmissionMessage(
            "Please enter your submission link."
        );

        return;
    }


    try {

        new URL(link);

    } catch {

        showSubmissionMessage(
            "Please enter a valid URL."
        );

        return;
    }


    setSubmissionButtonLoading(
        true
    );


    try {

        const result =
            await LMS.api(
                "/submissions",
                {
                    method: "POST",
                    body: JSON.stringify({
                        assignmentId,
                        submissionLink: link
                    })
                }
            );


        if (!result.ok) {

            showSubmissionMessage(
                result.data?.message ||
                "Unable to submit assignment."
            );

            return;
        }


        showSubmissionMessage(
            "Assignment submitted successfully.",
            "success"
        );


        submissionForm.reset();


        await loadSubmissions();


        populateAssignmentSelect();

        renderSubmissionHistory();

    } catch (error) {

        console.error(
            "Assignment submission error:",
            error
        );


        showSubmissionMessage(
            "Unable to connect to the LMS server."
        );

    } finally {

        setSubmissionButtonLoading(
            false
        );
    }
}



/* =========================================================
   RENDER SUBMISSION HISTORY
   ========================================================= */

function renderSubmissionHistory() {

    if (!submissionHistory) {
        return;
    }


    if (!mySubmissions.length) {

        submissionHistory.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-file-arrow-up"></i>

                </div>


                <h3>
                    No submissions yet
                </h3>


                <p>
                    Your submitted assignments will appear here.
                </p>

            </div>
        `;

        return;
    }


    const sortedSubmissions =
        [...mySubmissions].sort(
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


    submissionHistory.innerHTML =
        sortedSubmissions
            .map(
                submission =>
                    createSubmissionCard(
                        submission
                    )
            )
            .join("");
}



/* =========================================================
   SUBMISSION CARD
   ========================================================= */

function createSubmissionCard(
    submission
) {

    const assignment =
        submission.assignmentId || {};


    const assignmentTitle =
        LMS.escapeHTML(
            assignment.title ||
            "Assignment"
        );


    const courseTitle =
        LMS.escapeHTML(
            assignment.courseId?.title ||
            "Course"
        );


    const submissionUrl =
        LMS.escapeHTML(
            submission.submissionLink ||
            "#"
        );


    const status =
        submission.status ||
        "Submitted";


    const statusClass =
        status === "Reviewed"
            ? "badge-success"
            : "badge-primary";


    const marks =
        submission.marks !== null &&
        submission.marks !== undefined
            ? `${submission.marks} marks`
            : "Awaiting review";


    const feedback =
        submission.feedback
            ? LMS.escapeHTML(
                submission.feedback
            )
            : "No instructor feedback yet.";


    const submittedDate =
        formatDate(
            submission.submissionDate ||
            submission.createdAt
        );


    return `
        <article class="assignment-card">


            <div class="assignment-card-icon">

                <i class="fa-solid fa-file-circle-check"></i>

            </div>



            <div class="assignment-card-content">


                <div class="assignment-card-top">

                    <span class="badge badge-primary">
                        ${courseTitle}
                    </span>


                    <span class="badge ${statusClass}">
                        ${LMS.escapeHTML(status)}
                    </span>

                </div>



                <h3>
                    ${assignmentTitle}
                </h3>


                <p>
                    Submitted on ${submittedDate}
                </p>



                <div class="assignment-meta">


                    <span>

                        <i class="fa-solid fa-award"></i>

                        ${LMS.escapeHTML(marks)}

                    </span>


                    <span>

                        <i class="fa-solid fa-comment"></i>

                        ${feedback}

                    </span>

                </div>

            </div>



            <div class="assignment-card-status">

                <a
                    href="${submissionUrl}"
                    class="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                    Open Submission

                </a>

            </div>


        </article>
    `;
}



/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setSubmissionButtonLoading(
    loading
) {

    if (!submissionButton) {
        return;
    }


    submissionButton.disabled =
        loading;


    if (loading) {

        submissionButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>

            Submitting...
        `;

    } else {

        submissionButton.innerHTML = `
            <i class="fa-solid fa-paper-plane"></i>

            Submit Assignment
        `;
    }
}



/* =========================================================
   MESSAGE
   ========================================================= */

function showSubmissionMessage(
    message,
    type = "error"
) {

    if (!submissionMessage) {
        return;
    }


    submissionMessage.className =
        `alert alert-${type}`;


    submissionMessage.textContent =
        message;
}



/* =========================================================
   LOADING HISTORY
   ========================================================= */

function renderSubmissionHistoryLoading() {

    if (!submissionHistory) {
        return;
    }


    submissionHistory.innerHTML = `
        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading your submissions...
            </p>

        </div>
    `;
}



/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(value) {

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
   EVENT LISTENERS
   ========================================================= */

if (submissionForm) {

    submissionForm.addEventListener(
        "submit",
        submitAssignment
    );
}


if (assignmentSelect) {

    assignmentSelect.addEventListener(
        "change",
        updateSelectedAssignment
    );
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadSubmissionPage
);