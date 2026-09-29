const coursesContainer =
    document.getElementById("coursesContainer");

const courseSearch =
    document.getElementById("courseSearch");

const courseCategory =
    document.getElementById("courseCategory");

const courseDifficulty =
    document.getElementById("courseDifficulty");


let allCourses = [];



/* =========================================================
   LOAD COURSES
   ========================================================= */

async function loadCourses() {
    if (!coursesContainer) {
        return;
    }

    coursesContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading courses...</p>
        </div>
    `;

    try {
        const result =
            await LMS.api("/courses");

        if (!result.ok) {
            renderCoursesError(
                result.data?.message ||
                "Unable to load courses."
            );

            return;
        }

        allCourses =
            Array.isArray(result.data)
                ? result.data
                : result.data?.courses || [];

        populateCategoryFilter();

        renderCourses(allCourses);

    } catch (error) {
        console.error(
            "Failed to load courses:",
            error
        );

        renderCoursesError(
            "Unable to connect to the LMS server."
        );
    }
}



/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function populateCategoryFilter() {
    if (!courseCategory) {
        return;
    }

    const categories = [
        ...new Set(
            allCourses
                .map(course => course.category)
                .filter(Boolean)
        )
    ].sort();

    courseCategory.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;

    categories.forEach(category => {
        const option =
            document.createElement("option");

        option.value = category;
        option.textContent = category;

        courseCategory.appendChild(option);
    });
}



/* =========================================================
   FILTER COURSES
   ========================================================= */

function filterCourses() {
    const searchTerm =
        courseSearch
            ? courseSearch.value
                .trim()
                .toLowerCase()
            : "";

    const selectedCategory =
        courseCategory
            ? courseCategory.value
            : "all";

    const selectedDifficulty =
        courseDifficulty
            ? courseDifficulty.value
            : "all";


    const filteredCourses =
        allCourses.filter(course => {

            const title =
                String(course.title || "")
                    .toLowerCase();

            const description =
                String(course.description || "")
                    .toLowerCase();

            const category =
                String(course.category || "");

            const difficulty =
                String(course.difficulty || "");


            const matchesSearch =
                !searchTerm ||
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.toLowerCase()
                    .includes(searchTerm);


            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;


            const matchesDifficulty =
                selectedDifficulty === "all" ||
                difficulty === selectedDifficulty;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesDifficulty
            );
        });


    renderCourses(filteredCourses);
}



/* =========================================================
   RENDER COURSES
   ========================================================= */

function renderCourses(courses) {
    if (!coursesContainer) {
        return;
    }

    if (!courses.length) {
        coursesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fa-solid fa-book-open"></i>
                </div>

                <h3>No courses found</h3>

                <p>
                    Try changing your search or filter options.
                </p>
            </div>
        `;

        return;
    }


    coursesContainer.innerHTML =
        courses
            .map(course => createCourseCard(course))
            .join("");
}



/* =========================================================
   COURSE CARD
   ========================================================= */

function createCourseCard(course) {
    const courseId =
        course._id || course.id;

    const title =
        LMS.escapeHTML(
            course.title || "Untitled Course"
        );

    const description =
        LMS.escapeHTML(
            course.description ||
            "Explore this course and start learning."
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


    const instructorName =
        LMS.escapeHTML(
            course.instructor?.name ||
            "LMS Instructor"
        );


    const image =
        course.image
            ? LMS.escapeHTML(course.image)
            : "";


    const imageContent = image
        ? `
            <img
                src="${image}"
                alt="${title}"
                class="course-card-image"
            >
        `
        : `
            <div class="course-card-placeholder">

                <i class="fa-solid fa-graduation-cap"></i>

            </div>
        `;


    return `
        <article class="course-card">


            <div class="course-card-media">

                ${imageContent}

                <span class="badge badge-primary course-card-badge">
                    ${category}
                </span>

            </div>



            <div class="course-card-body">


                <div class="course-card-meta">

                    <span>
                        <i class="fa-solid fa-signal"></i>

                        ${difficulty}

                    </span>


                    <span>
                        <i class="fa-regular fa-clock"></i>

                        ${duration}

                    </span>

                </div>



                <h3>
                    ${title}
                </h3>



                <p>
                    ${description}
                </p>



                <div class="course-card-footer">


                    <span class="course-instructor">

                        <i class="fa-solid fa-user-tie"></i>

                        ${instructorName}

                    </span>


                    <a
                        href="course-details.html?id=${encodeURIComponent(courseId)}"
                        class="btn btn-primary btn-sm"
                    >

                        View Course

                        <i class="fa-solid fa-arrow-right"></i>

                    </a>


                </div>


            </div>


        </article>
    `;
}



/* =========================================================
   ERROR STATE
   ========================================================= */

function renderCoursesError(message) {
    if (!coursesContainer) {
        return;
    }

    coursesContainer.innerHTML = `
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
   EVENT LISTENERS
   ========================================================= */

if (courseSearch) {
    courseSearch.addEventListener(
        "input",
        filterCourses
    );
}


if (courseCategory) {
    courseCategory.addEventListener(
        "change",
        filterCourses
    );
}


if (courseDifficulty) {
    courseDifficulty.addEventListener(
        "change",
        filterCourses
    );
}



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadCourses
);