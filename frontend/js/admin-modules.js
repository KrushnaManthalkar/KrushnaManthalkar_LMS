/* =========================================================
   LMS — ADMIN MODULE MANAGEMENT
========================================================= */


const courseSelect =
    document.getElementById("courseSelect");

const moduleFormPanel =
    document.getElementById("moduleFormPanel");

const moduleForm =
    document.getElementById("moduleForm");

const moduleFormTitle =
    document.getElementById("moduleFormTitle");

const moduleSubmitButton =
    document.getElementById("moduleSubmitButton");

const cancelModuleEditButton =
    document.getElementById("cancelModuleEditButton");

const moduleList =
    document.getElementById("moduleList");

const moduleMessage =
    document.getElementById("moduleMessage");

const moduleCount =
    document.getElementById("moduleCount");


let courses = [];

let modules = [];

let editingModuleId = null;


/* =========================================================
   ADMIN ACCESS
========================================================= */

function checkAdminAccess() {

    if (!LMS.isAuthenticated()) {

        window.location.href =
            "login.html?redirect=admin-modules.html";

        return false;
    }


    const user =
        LMS.getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html?redirect=admin-modules.html";

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

function showModuleMessage(
    message,
    type = "info"
) {

    if (!moduleMessage) {
        return;
    }


    moduleMessage.innerHTML = `

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

            showModuleMessage(
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


        showModuleMessage(
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


            resetModuleForm();


            if (!courseId) {

                moduleFormPanel.hidden =
                    true;

                renderEmptyState();

                return;
            }


            moduleFormPanel.hidden =
                false;


            await loadModules(courseId);

        }
    );

}


/* =========================================================
   LOAD MODULES
========================================================= */

async function loadModules(
    courseId
) {

    moduleList.innerHTML = `

        <div class="loading-state">

            <div class="loading-spinner"></div>

            <p>
                Loading modules...
            </p>

        </div>

    `;


    try {

        const result =
            await LMS.api(
                `/modules/course/${encodeURIComponent(courseId)}`
            );


        if (!result.ok) {

            renderModuleError(
                result.data?.message ||
                "Unable to load modules."
            );

            return;
        }


        modules =
            Array.isArray(result.data?.modules)
                ? result.data.modules
                : [];


        renderModules();


    } catch (error) {

        console.error(
            "Load modules error:",
            error
        );


        renderModuleError(
            "Unable to connect to the LMS server."
        );

    }

}


/* =========================================================
   RENDER MODULES
========================================================= */

function renderModules() {

    const sortedModules =
        [...modules].sort(
            (a, b) =>
                Number(a.moduleOrder || 0) -
                Number(b.moduleOrder || 0)
        );


    if (moduleCount) {

        moduleCount.textContent =
            `${sortedModules.length} Module${sortedModules.length === 1 ? "" : "s"}`;

    }


    if (!sortedModules.length) {

        renderEmptyState(
            "No modules found",
            "Add the first module for this course."
        );

        return;
    }


    moduleList.innerHTML = `

        <div class="table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Order
                        </th>

                        <th>
                            Module
                        </th>

                        <th>
                            Description
                        </th>

                        <th>
                            Resource
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        sortedModules
                            .map(createModuleRow)
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   MODULE ROW
========================================================= */

function createModuleRow(
    module,
    index
) {

    const id =
        module._id ||
        module.id;


    const order =
        Number(
            module.moduleOrder
        ) ||
        index + 1;


    const title =
        LMS.escapeHTML(
            module.title ||
            `Module ${order}`
        );


    const description =
        LMS.escapeHTML(
            module.description ||
            "No description"
        );


    const resource =
        module.resourceLink
            ? `
                <a
                    href="${LMS.escapeHTML(module.resourceLink)}"
                    class="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                    Open

                </a>
            `
            : `
                <span class="badge badge-secondary">
                    No Resource
                </span>
            `;


    return `

        <tr>

            <td>

                <strong>
                    ${order}
                </strong>

            </td>


            <td>

                <strong>
                    ${title}
                </strong>

            </td>


            <td>

                ${description}

            </td>


            <td>

                ${resource}

            </td>


            <td>

                <div class="toolbar-actions">


                    <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        data-action="up"
                        data-id="${id}"
                        ${index === 0 ? "disabled" : ""}
                    >

                        <i class="fa-solid fa-arrow-up"></i>

                    </button>


                    <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        data-action="down"
                        data-id="${id}"
                        ${index === modules.length - 1 ? "disabled" : ""}
                    >

                        <i class="fa-solid fa-arrow-down"></i>

                    </button>


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

if (moduleForm) {

    moduleForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const courseId =
                courseSelect.value;


            const title =
                document
                    .getElementById("moduleTitle")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("moduleDescription")
                    .value
                    .trim();


            const resourceLink =
                document
                    .getElementById("moduleResource")
                    .value
                    .trim();


            const moduleOrder =
                Number(
                    document
                        .getElementById("moduleOrder")
                        .value
                );


            if (!courseId) {

                showModuleMessage(
                    "Please select a course.",
                    "danger"
                );

                return;
            }


            if (
                !title ||
                !description ||
                !moduleOrder ||
                moduleOrder < 1
            ) {

                showModuleMessage(
                    "Please fill in all required module fields.",
                    "danger"
                );

                return;
            }


            const payload = {

                title,

                description,

                resourceLink,

                moduleOrder

            };


            moduleSubmitButton.disabled =
                true;


            moduleSubmitButton.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Saving...

            `;


            try {

                let result;


                /* =============================================
                   UPDATE
                ============================================= */

                if (editingModuleId) {

                    result =
                        await LMS.api(
                            `/modules/${encodeURIComponent(editingModuleId)}`,
                            {
                                method: "PUT",
                                body: JSON.stringify(payload)
                            }
                        );

                }


                /* =============================================
                   CREATE
                ============================================= */

                else {

                    result =
                        await LMS.api(
                            "/modules",
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

                    showModuleMessage(
                        result.data?.message ||
                        "Unable to save module.",
                        "danger"
                    );

                    return;
                }


                showModuleMessage(
                    editingModuleId
                        ? "Module updated successfully."
                        : "Module created successfully.",
                    "success"
                );


                resetModuleForm();


                await loadModules(
                    courseId
                );


            } catch (error) {

                console.error(
                    "Save module error:",
                    error
                );


                showModuleMessage(
                    "Unable to connect to the LMS server.",
                    "danger"
                );

            } finally {

                moduleSubmitButton.disabled =
                    false;

                updateModuleFormMode();

            }

        }
    );

}


/* =========================================================
   EDIT MODULE
========================================================= */

function startEditModule(
    moduleId
) {

    const module =
        modules.find(
            item =>
                String(item._id || item.id) ===
                String(moduleId)
        );


    if (!module) {
        return;
    }


    editingModuleId =
        moduleId;


    document.getElementById(
        "moduleTitle"
    ).value =
        module.title || "";


    document.getElementById(
        "moduleDescription"
    ).value =
        module.description || "";


    document.getElementById(
        "moduleResource"
    ).value =
        module.resourceLink || "";


    document.getElementById(
        "moduleOrder"
    ).value =
        module.moduleOrder || 1;


    updateModuleFormMode();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   DELETE MODULE
========================================================= */

async function deleteModule(
    moduleId
) {

    const module =
        modules.find(
            item =>
                String(item._id || item.id) ===
                String(moduleId)
        );


    if (!module) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${module.title}"? This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await LMS.api(
                `/modules/${encodeURIComponent(moduleId)}`,
                {
                    method: "DELETE"
                }
            );


        if (!result.ok) {

            showModuleMessage(
                result.data?.message ||
                "Unable to delete module.",
                "danger"
            );

            return;
        }


        showModuleMessage(
            "Module deleted successfully.",
            "success"
        );


        if (
            String(editingModuleId) ===
            String(moduleId)
        ) {

            resetModuleForm();

        }


        await loadModules(
            courseSelect.value
        );


    } catch (error) {

        console.error(
            "Delete module error:",
            error
        );


        showModuleMessage(
            "Unable to connect to the LMS server.",
            "danger"
        );

    }

}


/* =========================================================
   MODULE ORDER
========================================================= */

async function moveModule(
    moduleId,
    direction
) {

    const sortedModules =
        [...modules].sort(
            (a, b) =>
                Number(a.moduleOrder || 0) -
                Number(b.moduleOrder || 0)
        );


    const index =
        sortedModules.findIndex(
            module =>
                String(module._id || module.id) ===
                String(moduleId)
        );


    if (index === -1) {
        return;
    }


    const targetIndex =
        direction === "up"
            ? index - 1
            : index + 1;


    if (
        targetIndex < 0 ||
        targetIndex >= sortedModules.length
    ) {
        return;
    }


    const current =
        sortedModules[index];

    const target =
        sortedModules[targetIndex];


    const currentOrder =
        current.moduleOrder;

    const targetOrder =
        target.moduleOrder;


    try {

        const firstResult =
            await LMS.api(
                `/modules/${encodeURIComponent(current._id || current.id)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        moduleOrder: targetOrder
                    })
                }
            );


        if (!firstResult.ok) {

            throw new Error(
                firstResult.data?.message ||
                "Unable to change module order."
            );

        }


        const secondResult =
            await LMS.api(
                `/modules/${encodeURIComponent(target._id || target.id)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        moduleOrder: currentOrder
                    })
                }
            );


        if (!secondResult.ok) {

            throw new Error(
                secondResult.data?.message ||
                "Unable to change module order."
            );

        }


        await loadModules(
            courseSelect.value
        );


    } catch (error) {

        console.error(
            "Move module error:",
            error
        );


        showModuleMessage(
            error.message ||
            "Unable to change module order.",
            "danger"
        );

    }

}


/* =========================================================
   MODULE ACTIONS
========================================================= */

if (moduleList) {

    moduleList.addEventListener(
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


            const moduleId =
                button.dataset.id;


            if (action === "edit") {

                startEditModule(
                    moduleId
                );

            }


            if (action === "delete") {

                deleteModule(
                    moduleId
                );

            }


            if (action === "up") {

                moveModule(
                    moduleId,
                    "up"
                );

            }


            if (action === "down") {

                moveModule(
                    moduleId,
                    "down"
                );

            }

        }
    );

}


/* =========================================================
   RESET FORM
========================================================= */

function resetModuleForm() {

    editingModuleId =
        null;


    if (moduleForm) {

        moduleForm.reset();

    }


    const selectedCourse =
        courseSelect?.value;


    updateModuleFormMode();


    if (selectedCourse) {

        const nextOrder =
            modules.length + 1;


        const orderInput =
            document.getElementById(
                "moduleOrder"
            );


        if (orderInput) {

            orderInput.value =
                nextOrder;

        }

    }

}


/* =========================================================
   FORM MODE
========================================================= */

function updateModuleFormMode() {

    if (
        !moduleFormTitle ||
        !moduleSubmitButton ||
        !cancelModuleEditButton
    ) {
        return;
    }


    if (editingModuleId) {

        moduleFormTitle.textContent =
            "Edit Module";


        moduleSubmitButton.innerHTML = `

            <i class="fa-solid fa-save"></i>

            Update Module

        `;


        cancelModuleEditButton.hidden =
            false;


        return;

    }


    moduleFormTitle.textContent =
        "Add New Module";


    moduleSubmitButton.innerHTML = `

        <i class="fa-solid fa-plus"></i>

        Add Module

    `;


    cancelModuleEditButton.hidden =
        true;

}


/* =========================================================
   CANCEL EDIT
========================================================= */

if (cancelModuleEditButton) {

    cancelModuleEditButton.addEventListener(
        "click",
        () => {

            resetModuleForm();

        }
    );

}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyState(
    title = "Select a course",
    description = "Choose a course above to manage its modules."
) {

    if (moduleCount) {

        moduleCount.textContent =
            "0 Modules";

    }


    if (!moduleList) {
        return;
    }


    moduleList.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">

                <i class="fa-solid fa-layer-group"></i>

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

function renderModuleError(
    message
) {

    if (!moduleList) {
        return;
    }


    moduleList.innerHTML = `

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


            <button
                type="button"
                class="btn btn-primary"
                id="retryModulesButton"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Try Again

            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryModulesButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () =>
                loadModules(
                    courseSelect.value
                )
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


        updateModuleFormMode();

        await loadCourses();

    }
);