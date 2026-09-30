const assignmentsContainer =
    document.getElementById("assignmentsContainer");

const assignmentSearch =
    document.getElementById("assignmentSearch");

const assignmentCourseFilter =
    document.getElementById("assignmentCourseFilter");


let allAssignments = [];
let mySubmissions = [];
let myCourses = [];



/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkAssignmentsAccess() {

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
   LOAD ASSIGNMENTS PAGE
   ========================================================= */

async function loadAssignmentsPage() {

    if (!checkAssignmentsAccess()) {
        return;
    }


    if (!assignmentsContainer) {
        return;
    }


    renderAssignmentsLoading();


    try {

        await Promise.all([
            loadMyCourses(),
            loadMySubmissions()
        ]);


        await loadAssignments();


        populateCourseFilter();

        renderFilteredAssignments();

    } catch (error) {

        console.error(
            "Assignments page loading error:",
            error
        );


        renderAssignmentsError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   LOAD MY COURSES
   ========================================================= */

async function loadMyCourses() {

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

        throw new Error(
            result.data?.message ||
            "Unable to load enrolled courses."
        );
    }


    myCourses =
        Array.isArray(result.data)
            ? result.data
            : result.data?.enrollments || [];
}



/* =========================================================
   LOAD MY SUBMISSIONS
   ========================================================= */

async function loadMySubmissions() {

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
   LOAD ASSIGNMENTS
   ========================================================= */

async function loadAssignments() {

    allAssignments = [];


    const courseIds =
        myCourses
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
                            `Failed to load assignments for course ${courseId}:`,
                            error
                        );


                        return [];
                    }
                }
            )
        );


    allAssignments =
        results
            .flat()
            .filter(
                assignment =>
                    assignment &&
                    assignment._id
            );
}



/* =========================================================
   COURSE FILTER
   ========================================================= */

function populateCourseFilter() {

    if (!assignmentCourseFilter) {
        return;
    }


    assignmentCourseFilter.innerHTML = `
        <option value="all">
            All Courses
        </option>
    `;


    myCourses.forEach(
        enrollment => {

            const course =
                enrollment.courseId;


            if (!course || !course._id) {
                return;
            }


            const option =
                document.createElement("option");


            option.value =
                course._id;


            option.textContent =
                course.title ||
                "Course";


            assignmentCourseFilter.appendChild(
                option
            );
        }
    );
}



/* =========================================================
   FILTER ASSIGNMENTS
   ========================================================= */

function renderFilteredAssignments() {

    const searchTerm =
        assignmentSearch
            ? assignmentSearch.value
                .trim()
                .toLowerCase()
            : "";


    const selectedCourse =
        assignmentCourseFilter
            ? assignmentCourseFilter.value
            : "all";


    const filtered =
        allAssignments.filter(
            assignment => {

                const title =
                    String(
                        assignment.title || ""
                    ).toLowerCase();


                const description =
                    String(
                        assignment.description || ""
                    ).toLowerCase();


                const courseId =
                    String(
                        assignment.courseId?._id ||
                        assignment.courseId ||
                        ""
                    );


                const courseTitle =
                    String(
                        assignment.courseId?.title ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    title.includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    courseTitle.includes(searchTerm);


                const matchesCourse =
                    selectedCourse === "all" ||
                    courseId === selectedCourse;


                return (
                    matchesSearch &&
                    matchesCourse
                );
            }
        );


    renderAssignments(filtered);
}



/* =========================================================
   RENDER ASSIGNMENTS
   ========================================================= */

function renderAssignments(
    assignments
) {

    if (!assignmentsContainer) {
        return;
    }


    if (!assignments.length) {

        assignmentsContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-file-circle-check"></i>

                </div>


                <h3>
                    No assignments found
                </h3>


                <p>
                    There are no assignments matching
                    your current filters.
                </p>

            </div>
        `;

        return;
    }


    assignmentsContainer.innerHTML =
        assignments
            .sort(
                (a, b) =>
                    new Date(
                        a.deadline || 0
                    ) -
                    new Date(
                        b.deadline || 0
                    )
            )
            .map(
                assignment =>
                    createAssignmentCard(
                        assignment
                    )
            )
            .join("");
}



/* =========================================================
   CREATE ASSIGNMENT CARD
   ========================================================= */

function createAssignmentCard(
    assignment
) {

    const assignmentId =
        assignment._id;


    const title =
        LMS.escapeHTML(
            assignment.title ||
            "Assignment"
        );


    const description =
        LMS.escapeHTML(
            assignment.description ||
            "Complete this assignment."
        );


    const courseTitle =
        LMS.escapeHTML(
            assignment.courseId?.title ||
            "Course"
        );


    const maximumMarks =
        Number(
            assignment.maximumMarks || 0
        );


    const deadline =
        formatAssignmentDate(
            assignment.deadline
        );


    const deadlineState =
        getDeadlineState(
            assignment.deadline
        );


    const submission =
        findSubmission(
            assignmentId
        );


    const submissionStatus =
        submission
            ? submission.status ||
                "Submitted"
            : "Not Submitted";


    const statusClass =
        getSubmissionStatusClass(
            submissionStatus
        );


    const action =
        createAssignmentAction(
            assignmentId,
            submission
        );


    return `
        <article class="assignment-card">

            <div class="assignment-card-content">


                <div class="assignment-card-top">

                    <span class="badge badge-primary">
                        ${courseTitle}
                    </span>


                    <span class="badge ${deadlineState.className}">
                        ${deadlineState.label}
                    </span>

                </div>



                <h3>
                    ${title}
                </h3>


                <p>
                    ${description}
                </p>



                <div class="assignment-meta">


                    <span>

                        <i class="fa-regular fa-calendar"></i>

                        Deadline:
                        ${deadline}

                    </span>


                    <span>

                        <i class="fa-solid fa-award"></i>

                        ${maximumMarks}
                        Marks

                    </span>


                    <span>

                        <i class="fa-solid fa-circle-check"></i>

                        ${LMS.escapeHTML(
                            submissionStatus
                        )}

                    </span>


                </div>



                ${
                    submission
                        ? createSubmissionSummary(
                            submission
                        )
                        : ""
                }


            </div>



            <div class="assignment-card-status">


                <span class="badge ${statusClass}">

                    ${LMS.escapeHTML(
                        submissionStatus
                    )}

                </span>


                ${action}


            </div>


        </article>
    `;
}



/* =========================================================
   SUBMISSION SUMMARY
   ========================================================= */

function createSubmissionSummary(
    submission
) {

    const marks =
        submission.marks !== null &&
        submission.marks !== undefined
            ? `${submission.marks} / ${getAssignmentMaximumMarks(submission)}`
            : "Awaiting review";


    const feedback =
        submission.feedback
            ? LMS.escapeHTML(
                submission.feedback
            )
            : "No feedback yet.";


    return `
        <div class="assignment-feedback">

            <strong>
                ${LMS.escapeHTML(marks)}
            </strong>


            <span>
                ${feedback}
            </span>

        </div>
    `;
}



/* =========================================================
   GET MAXIMUM MARKS
   ========================================================= */

function getAssignmentMaximumMarks(
    submission
) {

    const assignmentId =
        submission.assignmentId?._id ||
        submission.assignmentId;


    const assignment =
        allAssignments.find(
            item =>
                String(item._id) ===
                String(assignmentId)
        );


    return assignment
        ? Number(
            assignment.maximumMarks || 0
        )
        : "?";
}



/* =========================================================
   FIND SUBMISSION
   ========================================================= */

function findSubmission(
    assignmentId
) {

    return mySubmissions.find(
        submission => {

            const submissionAssignmentId =
                submission.assignmentId?._id ||
                submission.assignmentId;


            return String(
                submissionAssignmentId
            ) === String(
                assignmentId
            );
        }
    ) || null;
}



/* =========================================================
   ASSIGNMENT ACTION
   ========================================================= */

function createAssignmentAction(
    assignmentId,
    submission
) {

    if (submission) {

        return `
            <a
                href="submission.html?assignmentId=${encodeURIComponent(assignmentId)}"
                class="btn btn-outline btn-sm"
            >

                <i class="fa-solid fa-eye"></i>

                View Submission

            </a>
        `;
    }


    return `
        <a
            href="submission.html?assignmentId=${encodeURIComponent(assignmentId)}"
            class="btn btn-primary btn-sm"
        >

            <i class="fa-solid fa-paper-plane"></i>

            Submit

        </a>
    `;
}



/* =========================================================
   DEADLINE STATE
   ========================================================= */

function getDeadlineState(
    deadline
) {

    if (!deadline) {

        return {
            label: "No Deadline",
            className: "badge-secondary"
        };
    }


    const deadlineDate =
        new Date(deadline);


    if (
        Number.isNaN(
            deadlineDate.getTime()
        )
    ) {

        return {
            label: "Deadline",
            className: "badge-secondary"
        };
    }


    const now =
        new Date();


    if (deadlineDate < now) {

        return {
            label: "Past Deadline",
            className: "badge-danger"
        };
    }


    const difference =
        deadlineDate.getTime() -
        now.getTime();


    const days =
        Math.ceil(
            difference /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    if (days <= 2) {

        return {
            label: "Due Soon",
            className: "badge-warning"
        };
    }


    return {
        label: "Upcoming",
        className: "badge-success"
    };
}



/* =========================================================
   SUBMISSION STATUS CLASS
   ========================================================= */

function getSubmissionStatusClass(
    status
) {

    if (status === "Reviewed") {
        return "badge-success";
    }


    if (status === "Submitted") {
        return "badge-primary";
    }


    return "badge-warning";
}



/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatAssignmentDate(
    value
) {

    if (!value) {
        return "Not specified";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Not specified";
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

function renderAssignmentsLoading() {

    if (!assignmentsContainer) {
        return;
    }


    assignmentsContainer.innerHTML = `
        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading assignments...
            </p>

        </div>
    `;
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderAssignmentsError(
    message
) {

    if (!assignmentsContainer) {
        return;
    }


    assignmentsContainer.innerHTML = `
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
            loadAssignmentsPage
        );
    }
}



/* =========================================================
   EVENT LISTENERS
   ========================================================= */

if (assignmentSearch) {

    assignmentSearch.addEventListener(
        "input",
        renderFilteredAssignments
    );
}


if (assignmentCourseFilter) {

    assignmentCourseFilter.addEventListener(
        "change",
        renderFilteredAssignments
    );
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadAssignmentsPage
);