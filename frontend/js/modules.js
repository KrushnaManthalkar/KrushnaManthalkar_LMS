const modulesContainer =
    document.getElementById("modulesContainer");

const modulesTitle =
    document.getElementById("modulesTitle");

const modulesDescription =
    document.getElementById("modulesDescription");

const modulesCourseInfo =
    document.getElementById("modulesCourseInfo");


const moduleCourseId =
    new URLSearchParams(
        window.location.search
    ).get("courseId");

let courseData = null;
let courseModules = [];



/* =========================================================
   AUTH CHECK
   ========================================================= */

function checkModulesAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html";

        return false;
    }


    return true;
}



/* =========================================================
   LOAD MODULE PAGE
   ========================================================= */

async function loadModulesPage() {

    if (!checkModulesAccess()) {
        return;
    }


    if (!moduleCourseId) {

        renderModulesError(
            "No course was selected."
        );

        return;
    }


    renderModulesLoading();


    try {

        await loadCourse();

        await loadModules();

    } catch (error) {

        console.error(
            "Modules page loading error:",
            error
        );


        renderModulesError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   LOAD COURSE
   ========================================================= */

async function loadCourse() {

    const result =
        await LMS.api(
            `/courses/${encodeURIComponent(moduleCourseId)}`
        );


    if (!result.ok) {

        throw new Error(
            result.data?.message ||
            "Unable to load course."
        );
    }


    courseData =
        result.data?.course ||
        result.data;


    if (!courseData) {

        throw new Error(
            "Course information not found."
        );
    }


    renderCourseInformation();
}



/* =========================================================
   LOAD MODULES
   ========================================================= */

async function loadModules() {

    const result =
        await LMS.api(
            `/modules/course/${encodeURIComponent(moduleCourseId)}`
        );


    if (!result.ok) {

        renderModulesError(
            result.data?.message ||
            "Unable to load course modules."
        );

        return;
    }


    courseModules =
        Array.isArray(result.data)
            ? result.data
            : result.data?.modules || [];


    renderModules();
}



/* =========================================================
   COURSE INFORMATION
   ========================================================= */

function renderCourseInformation() {

    if (!courseData) {
        return;
    }


    const title =
        LMS.escapeHTML(
            courseData.title ||
            "Course Modules"
        );


    const description =
        LMS.escapeHTML(
            courseData.description ||
            "Explore the modules available in this course."
        );


    const category =
        LMS.escapeHTML(
            courseData.category ||
            "Learning"
        );


    const difficulty =
        LMS.escapeHTML(
            courseData.difficulty ||
            "Beginner"
        );


    const duration =
        LMS.escapeHTML(
            courseData.duration ||
            "Self-paced"
        );


    if (modulesTitle) {

        modulesTitle.textContent =
            courseData.title ||
            "Course Modules";
    }


    if (modulesDescription) {

        modulesDescription.textContent =
            courseData.description ||
            "Explore the modules available in this course.";
    }


    if (!modulesCourseInfo) {
        return;
    }


    modulesCourseInfo.innerHTML = `
        <div class="detail-hero-content">

            <span class="badge badge-primary">
                ${category}
            </span>


            <h2>
                ${title}
            </h2>


            <p>
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

                    <i class="fa-solid fa-layer-group"></i>

                    ${courseModules.length || 0}
                    Modules

                </span>

            </div>

        </div>


        <div class="detail-hero-actions">

            <a
                href="course-details.html?id=${encodeURIComponent(moduleCourseId)}"
                class="btn btn-outline"
            >

                <i class="fa-solid fa-arrow-left"></i>

                Course Details

            </a>


            <a
                href="progress.html?courseId=${encodeURIComponent(moduleCourseId)}"
                class="btn btn-primary"
            >

                <i class="fa-solid fa-chart-line"></i>

                View Progress

            </a>

        </div>
    `;
}



/* =========================================================
   RENDER MODULES
   ========================================================= */

function renderModules() {

    if (!modulesContainer) {
        return;
    }


    if (!courseModules.length) {

        modulesContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">

                    <i class="fa-solid fa-layer-group"></i>

                </div>


                <h3>
                    No modules available
                </h3>


                <p>
                    Modules for this course have not been
                    added yet.
                </p>

            </div>
        `;


        updateModuleCount();

        return;
    }


    const sortedModules =
        [...courseModules].sort(
            (a, b) =>
                Number(
                    a.moduleOrder || 0
                ) -
                Number(
                    b.moduleOrder || 0
                )
        );


    modulesContainer.innerHTML =
        sortedModules
            .map(
                (module, index) =>
                    createModuleItem(
                        module,
                        index
                    )
            )
            .join("");


    updateModuleCount();
}



/* =========================================================
   MODULE ITEM
   ========================================================= */

function createModuleItem(
    module,
    index
) {

    const moduleId =
        module._id ||
        module.id;


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
        Number(
            module.moduleOrder
        ) ||
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

                    Open Resource

                </a>
            `
            : `
                <span class="badge badge-secondary">

                    <i class="fa-solid fa-link-slash"></i>

                    No Resource

                </span>
            `;


    return `
        <article
            class="module-item"
            data-module-id="${LMS.escapeHTML(moduleId)}"
        >


            <div class="module-number">

                ${order}

            </div>



            <div class="module-content">

                <div class="module-title-row">

                    <h3>
                        ${title}
                    </h3>

                    <span class="badge badge-secondary">

                        Module ${order}

                    </span>

                </div>


                <p>
                    ${description}
                </p>



                <div class="module-resource">

                    ${resourceButton}

                </div>

            </div>


        </article>
    `;
}



/* =========================================================
   UPDATE MODULE COUNT
   ========================================================= */

function updateModuleCount() {

    if (!modulesCourseInfo) {
        return;
    }


    const moduleCount =
        modulesCourseInfo.querySelector(
            ".detail-meta span:last-child"
        );


    if (moduleCount) {

        moduleCount.innerHTML = `
            <i class="fa-solid fa-layer-group"></i>

            ${courseModules.length}
            Modules
        `;
    }
}



/* =========================================================
   LOADING STATE
   ========================================================= */

function renderModulesLoading() {

    if (modulesCourseInfo) {

        modulesCourseInfo.innerHTML = `
            <div class="loading-state">

                <div class="loading-spinner"></div>

                <p>
                    Loading course information...
                </p>

            </div>
        `;
    }


    if (modulesContainer) {

        modulesContainer.innerHTML = `
            <div class="loading-state">

                <div class="loading-spinner"></div>

                <p>
                    Loading modules...
                </p>

            </div>
        `;
    }
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderModulesError(message) {

    if (modulesCourseInfo) {

        modulesCourseInfo.innerHTML = "";
    }


    if (!modulesContainer) {
        return;
    }


    modulesContainer.innerHTML = `
        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>


            <h3>
                Unable to load modules
            </h3>


            <p>
                ${LMS.escapeHTML(message)}
            </p>


            <a
                href="my-courses.html"
                class="btn btn-primary"
            >

                <i class="fa-solid fa-arrow-left"></i>

                Back to My Courses

            </a>

        </div>
    `;
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadModulesPage
);