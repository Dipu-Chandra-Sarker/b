let savedRecords = [];
let currentRecord = null;
let hasShownMessageCredit = false;
let hasShownMessageCGPA = false;
let currentYear = new Date().getFullYear();

function showSection(sectionId) {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    
    const titleBar = document.querySelector('.title-bar');
    if (sectionId === 'main-menu') {
        titleBar.style.display = 'block';
        // Clear previous entries when returning to main menu
        resetCGPA();
    } else {
        titleBar.style.display = 'none';
    }

    // Add this part to clear loaded record when switching to load-record section
    if (sectionId === 'load-record') {
        document.getElementById('loaded-record').innerHTML = '';
        document.getElementById('record-file').value = '';
        currentRecord = null;
    }
}

function hasPartialCGPAData() {
    const completedCredits = document.getElementById('completed-credits').value;
    const currentCGPA = document.getElementById('current-cgpa').value;
    return completedCredits !== '' || currentCGPA !== '';
}

function validateCGPAInputs() {
    const completedCredits = document.getElementById('completed-credits').value;
    const currentCGPA = document.getElementById('current-cgpa').value;
    
    if ((completedCredits !== '' && currentCGPA === '') || 
        (completedCredits === '' && currentCGPA !== '')) {
        showToast("Please fill both Completed Credits and Current CGPA");
        return false;
    }
    return true;
}

function addCGPACourse() {
    const coursesDiv = document.getElementById('cgpa-courses');
    const courseRow = document.createElement('div');
    courseRow.className = 'course-row';

    // Check if either CGPA field has a value
    const showRetakeOption = hasPartialCGPAData();

    courseRow.innerHTML = `
        <select class="edit-field" required onchange="updateNewCGPA()">
            <option value="">Credit</option>
            <option value="3">3</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
        </select>
        <select class="edit-field" required onchange="updateNewCGPA()">
            <option value="">Grade</option>
            <option value="4.00">A</option>
            <option value="3.67">A-</option>
            <option value="3.33">B+</option>
            <option value="3.00">B</option>
            <option value="2.67">B-</option>
            <option value="2.33">C+</option>
            <option value="2.00">C</option>
            <option value="1.67">C-</option>
            <option value="1.33">D+</option>
            <option value="1.00">D</option>
            <option value="0.00">F</option>
        </select>
        ${showRetakeOption ? `
        <select class="edit-field" required onchange="toggleOldGrade(this); updateNewCGPA()">
            <option value="0">New Course</option>
            <option value="1">Retake</option>
        </select>
        <select class="edit-field old-grade hidden" onchange="updateNewCGPA()">
            <option value="">Old Grade</option>
            <option value="4.00">A</option>
            <option value="3.67">A-</option>
            <option value="3.33">B+</option>
            <option value="3.00">B</option>
            <option value="2.67">B-</option>
            <option value="2.33">C+</option>
            <option value="2.00">C</option>
            <option value="1.67">C-</option>
            <option value="1.33">D+</option>
            <option value="1.00">D</option>
            <option value="0.00">F</option>
        </select>
        ` : ''}
        <button class="icon-button" onclick="removeCourse(this); updateNewCGPA()" title="Remove Course">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
        </button>
    `;
    coursesDiv.appendChild(courseRow);
}


function toggleOldGrade(select) {
    const oldGradeSelect = select.nextElementSibling;
    if (oldGradeSelect && oldGradeSelect.classList.contains('old-grade')) {
        if (select.value === "1") {
            oldGradeSelect.classList.remove('hidden');
            oldGradeSelect.required = true;
        } else {
            oldGradeSelect.classList.add('hidden');
            oldGradeSelect.required = false;
            oldGradeSelect.value = '';
        }
        updateNewCGPA();
    }
}

// Update the validateGPAInput function
function validateGPAInput(input) {
    const value = parseFloat(input.value);
    if (value > 4) {
        showToast("GPA/CGPA can't be greater than 4");
        input.value = "";
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function calculateCGPA() {
    const academicYear = document.getElementById('academic-year').value;
    const semester = document.getElementById('semester').value;
    const completedCredits = document.getElementById('completed-credits').value;
    const currentCGPA = document.getElementById('current-cgpa').value;
    const courses = document.querySelectorAll('#cgpa-courses .course-row');

    // Validation checks
    if (!academicYear) {
        showToast("Please select Academic Year");
        return;
    }

    // CGPA validation
    if ((completedCredits && !currentCGPA) || (!completedCredits && currentCGPA)) {
        showToast("Please fill both Completed Credits and Current CGPA");
        return;
    }

    if (courses.length === 0) {
        showToast("Please add at least one course");
        return;
    }

    // Validate all courses have required fields
    let isValid = true;
    courses.forEach(course => {
        const credits = course.children[0].value;
        const grade = course.children[1].value;
        if (!credits || !grade) {
            isValid = false;
        }
    });

    if (!isValid) {
        showToast("Please fill in all course details");
        return;
    }

    // Show loading screen
    const splashScreen = document.createElement('div');
    splashScreen.className = 'splash-screen';
    splashScreen.innerHTML = `
        <div class="splash-content">
            <h2>Calculating...</h2>
            <p class="loading">Please wait</p>
        </div>
    `;
    document.body.appendChild(splashScreen);

    setTimeout(() => {
        let newPoints = 0;
        let semesterPoints = 0;
        let semesterAttemptedCredits = 0;
        let semesterEarnedCredits = 0;
        let totalAttemptedCredits = 0;
        let totalEarnedCredits = 0;

        const parsedCompletedCredits = parseFloat(completedCredits) || 0;
        const parsedCurrentCGPA = parseFloat(currentCGPA) || 0;

        // Set initial totals from previous record
        totalAttemptedCredits = parsedCompletedCredits;
        totalEarnedCredits = parsedCompletedCredits;

        courses.forEach(course => {
            const credits = parseFloat(course.children[0].value);
            const gradePoints = parseFloat(course.children[1].value);
            const isRetake = course.children[2]?.value === "1";
            const oldGradePoints = isRetake ? parseFloat(course.children[3].value) : 0;

            // Add to semester totals
            semesterPoints += gradePoints * credits;
            semesterAttemptedCredits += credits;
            if (gradePoints > 0) { // Not an F grade
                semesterEarnedCredits += credits;
            }

            if (isRetake && (parsedCompletedCredits > 0 || parsedCurrentCGPA > 0)) {
                // For retake courses
                // Calculate grade point difference for GPA
                newPoints += (gradePoints - oldGradePoints) * credits;
                
                // Update earned credits if passing previously failed course
                if (oldGradePoints === 0 && gradePoints > 0) {
                    // If old grade was F and new grade is passing
                    totalEarnedCredits += credits;
                }
                // Attempted credits don't change for retakes
            } else {
                // For new courses
                newPoints += gradePoints * credits;
                totalAttemptedCredits += credits;  // Add to attempted
                if (gradePoints > 0) {  // If passing grade
                    totalEarnedCredits += credits;  // Add to earned
                }
            }
        });

        // Calculate total points including previous CGPA
        const totalPoints = (parsedCurrentCGPA * parsedCompletedCredits) + newPoints;
        
        // Calculate final GPAs
        const newCGPA = totalAttemptedCredits > 0 ? totalPoints / totalAttemptedCredits : 0;
        const semesterGPA = semesterAttemptedCredits > 0 ? semesterPoints / semesterAttemptedCredits : 0;

        // Remove splash screen
        document.body.removeChild(splashScreen);

        // Show results with all calculated values
        showCalculationResult(
            academicYear, 
            semester || 'Not Selected', 
            parsedCompletedCredits,
            parsedCurrentCGPA,
            newCGPA,
            semesterGPA,
            semesterAttemptedCredits,
            semesterEarnedCredits,
            totalAttemptedCredits,
            totalEarnedCredits
        );
    }, 1000);
}

function showCalculationResult(
    academicYear, 
    semester, 
    completedCredits, 
    currentCGPA, 
    newCGPA, 
    semesterGPA, 
    semesterAttemptedCredits,
    semesterEarnedCredits,
    totalAttemptedCredits,
    totalEarnedCredits
) {
    const splashScreen = document.createElement('div');
    splashScreen.className = 'splash-screen';
    
    let content = '';
    if (completedCredits === 0 && currentCGPA === 0) {
        // GPA calculation result
        content = `
            <div class="splash-content calculation-result">
                <h3>GPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Academic Year:</span> ${academicYear}</p>
                        <p><span class="result-label">Semester:</span> ${semester}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Attempted Credits:</span> ${Math.round(semesterAttemptedCredits)}</p>
                        <p><span class="result-label">Completed Credits:</span> ${Math.round(semesterEarnedCredits)}</p>
                        <p><span class="result-label">Semester GPA:</span> ${semesterGPA.toFixed(2)}</p>
                    </div>
                </div>

                <div class="splash-buttons">
                    <button class="menu-button" onclick="saveRecord('GPA')">Save Record</button>
                    <button class="menu-button" onclick="closeSplashScreen()">Back</button>
                </div>
            </div>
        `;
    } else {
        // CGPA calculation result
        content = `
            <div class="splash-content calculation-result">
                <h3>CGPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Academic Year:</span> ${academicYear}</p>
                        <p><span class="result-label">Semester:</span> ${semester}</p>
                    </div>
                </div>

                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Previous Credits:</span> ${Math.round(completedCredits)}</p>
                        <p><span class="result-label">Previous CGPA:</span> ${currentCGPA.toFixed(2)}</p>
                        <p><span class="result-label">Total Attempted Credits:</span> ${Math.round(totalAttemptedCredits)}</p>
                        <p><span class="result-label">Total Completed Credits:</span> ${Math.round(totalEarnedCredits)}</p>
                        <p><span class="result-label">New CGPA:</span> ${newCGPA.toFixed(2)}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Attempted Credits:</span> ${Math.round(semesterAttemptedCredits)}</p>
                        <p><span class="result-label">Completed Credits:</span> ${Math.round(semesterEarnedCredits)}</p>
                        <p><span class="result-label">Semester GPA:</span> ${semesterGPA.toFixed(2)}</p>
                    </div>
                </div>

                <div class="splash-buttons">
                    <button class="menu-button" onclick="saveRecord('CGPA')">Save Record</button>
                    <button class="menu-button" onclick="closeSplashScreen()">Back</button>
                </div>
            </div>
        `;
    }

    splashScreen.innerHTML = content;
    document.body.appendChild(splashScreen);
}

function refreshCourseRows() {
    const coursesDiv = document.getElementById('cgpa-courses');
    const courseCount = coursesDiv.children.length;
    const showRetakeOption = document.getElementById('completed-credits').value || 
                            document.getElementById('current-cgpa').value;
    
    // Store existing course data
    const existingCourses = Array.from(coursesDiv.children).map(courseRow => ({
        credit: courseRow.children[0].value,
        grade: courseRow.children[1].value,
        isRetake: courseRow.children[2]?.value === "1",
        oldGrade: courseRow.children[3]?.value
    }));

    // Clear and rebuild with saved data
    coursesDiv.innerHTML = '';
    existingCourses.forEach(course => {
        const courseRow = document.createElement('div');
        courseRow.className = 'course-row';
        
        courseRow.innerHTML = `
            <select class="edit-field" required onchange="updateNewCGPA()">
                <option value="">Select Credit</option>
                <option value="3" ${course.credit === "3" ? 'selected' : ''}>3</option>
                <option value="1" ${course.credit === "1" ? 'selected' : ''}>1</option>
                <option value="2" ${course.credit === "2" ? 'selected' : ''}>2</option>
                <option value="4" ${course.credit === "4" ? 'selected' : ''}>4</option>
            </select>
            <select class="edit-field" required onchange="updateNewCGPA()">
                <option value="">Select Grade</option>
                <option value="4.00" ${course.grade === "4.00" ? 'selected' : ''}>A</option>
                <option value="3.67" ${course.grade === "3.67" ? 'selected' : ''}>A-</option>
                <option value="3.33" ${course.grade === "3.33" ? 'selected' : ''}>B+</option>
                <option value="3.00" ${course.grade === "3.00" ? 'selected' : ''}>B</option>
                <option value="2.67" ${course.grade === "2.67" ? 'selected' : ''}>B-</option>
                <option value="2.33" ${course.grade === "2.33" ? 'selected' : ''}>C+</option>
                <option value="2.00" ${course.grade === "2.00" ? 'selected' : ''}>C</option>
                <option value="1.67" ${course.grade === "1.67" ? 'selected' : ''}>C-</option>
                <option value="1.33" ${course.grade === "1.33" ? 'selected' : ''}>D+</option>
                <option value="1.00" ${course.grade === "1.00" ? 'selected' : ''}>D</option>
                <option value="0.00" ${course.grade === "0.00" ? 'selected' : ''}>F</option>
            </select>
            ${showRetakeOption ? `
            <select class="edit-field" required onchange="toggleOldGrade(this); updateNewCGPA()">
                <option value="1" ${course.isRetake ? 'selected' : ''}>Retake</option>
                <option value="0" ${!course.isRetake ? 'selected' : ''}>New Course</option>
            </select>
            <select class="edit-field old-grade ${!course.isRetake ? 'hidden' : ''}" onchange="updateNewCGPA()">
                <option value="">Old Grade</option>
                <option value="4.00" ${course.oldGrade === "4.00" ? 'selected' : ''}>A</option>
                <option value="3.67" ${course.oldGrade === "3.67" ? 'selected' : ''}>A-</option>
                <option value="3.33" ${course.oldGrade === "3.33" ? 'selected' : ''}>B+</option>
                <option value="3.00" ${course.oldGrade === "3.00" ? 'selected' : ''}>B</option>
                <option value="2.67" ${course.oldGrade === "2.67" ? 'selected' : ''}>B-</option>
                <option value="2.33" ${course.oldGrade === "2.33" ? 'selected' : ''}>C+</option>
                <option value="2.00" ${course.oldGrade === "2.00" ? 'selected' : ''}>C</option>
                <option value="1.67" ${course.oldGrade === "1.67" ? 'selected' : ''}>C-</option>
                <option value="1.33" ${course.oldGrade === "1.33" ? 'selected' : ''}>D+</option>
                <option value="1.00" ${course.oldGrade === "1.00" ? 'selected' : ''}>D</option>
                <option value="0.00" ${course.oldGrade === "0.00" ? 'selected' : ''}>F</option>
            </select>
            ` : ''}
            <button class="menu-button" onclick="removeCourse(this); updateNewCGPA()">Remove</button>
        `;
        coursesDiv.appendChild(courseRow);
    });
}


function updateCourseRowsDisplay() {
    const coursesDiv = document.getElementById('cgpa-courses');
    const hasRetakeOption = hasPartialCGPAData();
    
    // Store existing course data
    const existingCourses = Array.from(coursesDiv.children).map(courseRow => ({
        credit: courseRow.children[0].value,
        grade: courseRow.children[1].value,
        isRetake: courseRow.children[2]?.value === "1",
        oldGrade: courseRow.children[3]?.value
    }));

    // Clear and rebuild with saved data
    coursesDiv.innerHTML = '';
    
    if (existingCourses.length === 0) {
        addCGPACourse();
    } else {
        existingCourses.forEach(course => {
            const courseRow = document.createElement('div');
            courseRow.className = 'course-row';
            
            courseRow.innerHTML = `
                <select class="edit-field" required onchange="updateNewCGPA()">
                    <option value="">Credit</option>
                    <option value="3" ${course.credit === "3" ? 'selected' : ''}>3</option>
                    <option value="1" ${course.credit === "1" ? 'selected' : ''}>1</option>
                    <option value="2" ${course.credit === "2" ? 'selected' : ''}>2</option>
                    <option value="4" ${course.credit === "4" ? 'selected' : ''}>4</option>
                </select>
                <select class="edit-field" required onchange="updateNewCGPA()">
                    <option value="">Grade</option>
                    <option value="4.00" ${course.grade === "4.00" ? 'selected' : ''}>A</option>
                    <option value="3.67" ${course.grade === "3.67" ? 'selected' : ''}>A-</option>
                    <option value="3.33" ${course.grade === "3.33" ? 'selected' : ''}>B+</option>
                    <option value="3.00" ${course.grade === "3.00" ? 'selected' : ''}>B</option>
                    <option value="2.67" ${course.grade === "2.67" ? 'selected' : ''}>B-</option>
                    <option value="2.33" ${course.grade === "2.33" ? 'selected' : ''}>C+</option>
                    <option value="2.00" ${course.grade === "2.00" ? 'selected' : ''}>C</option>
                    <option value="1.67" ${course.grade === "1.67" ? 'selected' : ''}>C-</option>
                    <option value="1.33" ${course.grade === "1.33" ? 'selected' : ''}>D+</option>
                    <option value="1.00" ${course.grade === "1.00" ? 'selected' : ''}>D</option>
                    <option value="0.00" ${course.grade === "0.00" ? 'selected' : ''}>F</option>
                </select>
                ${hasRetakeOption ? `
                <select class="edit-field" required onchange="toggleOldGrade(this); updateNewCGPA()">
                    <option value="0" ${!course.isRetake ? 'selected' : ''}>New Course</option>
                    <option value="1" ${course.isRetake ? 'selected' : ''}>Retake</option>
                </select>
                <select class="edit-field old-grade ${!course.isRetake ? 'hidden' : ''}" onchange="updateNewCGPA()">
                    <option value="">Old Grade</option>
                    <option value="4.00" ${course.oldGrade === "4.00" ? 'selected' : ''}>A</option>
                    <option value="3.67" ${course.oldGrade === "3.67" ? 'selected' : ''}>A-</option>
                    <option value="3.33" ${course.oldGrade === "3.33" ? 'selected' : ''}>B+</option>
                    <option value="3.00" ${course.oldGrade === "3.00" ? 'selected' : ''}>B</option>
                    <option value="2.67" ${course.oldGrade === "2.67" ? 'selected' : ''}>B-</option>
                    <option value="2.33" ${course.oldGrade === "2.33" ? 'selected' : ''}>C+</option>
                    <option value="2.00" ${course.oldGrade === "2.00" ? 'selected' : ''}>C</option>
                    <option value="1.67" ${course.oldGrade === "1.67" ? 'selected' : ''}>C-</option>
                    <option value="1.33" ${course.oldGrade === "1.33" ? 'selected' : ''}>D+</option>
                    <option value="1.00" ${course.oldGrade === "1.00" ? 'selected' : ''}>D</option>
                    <option value="0.00" ${course.oldGrade === "0.00" ? 'selected' : ''}>F</option>
                </select>
                ` : ''}
                <button class="icon-button" onclick="removeCourse(this); updateNewCGPA()" title="Remove Course">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            coursesDiv.appendChild(courseRow);
        });
    }
}


function saveRecord(type) {
    const fileName = prompt("Enter a file name for this record:");
    if (!fileName) return;

    const academicYear = document.getElementById('academic-year').value;
    const semester = document.getElementById('semester').value;
    const completedCredits = parseFloat(document.getElementById('completed-credits').value) || 0;
    const currentCGPA = parseFloat(document.getElementById('current-cgpa').value) || 0;

    // Calculate credits and GPA for all courses
    let newPoints = 0;
    let semesterAttemptedCredits = 0;
    let semesterEarnedCredits = 0;
    let totalAttemptedCredits = completedCredits;
    let totalEarnedCredits = completedCredits;

    const courses = document.querySelectorAll('#cgpa-courses .course-row');
    const courseData = Array.from(courses).map(course => {
        const credits = parseFloat(course.children[0].value);
        const gradePoints = parseFloat(course.children[1].value);
        const grade = course.children[1].options[course.children[1].selectedIndex].text;
        const isRetake = course.children[2]?.value === "1";
        const oldGrade = isRetake ? course.children[3].options[course.children[3].selectedIndex].text : '-';

        // Update credit totals
        semesterAttemptedCredits += credits;
        if (gradePoints > 0) { // Not an F grade
            semesterEarnedCredits += credits;
        }

        if (!isRetake) {
            totalAttemptedCredits += credits;
            if (gradePoints > 0) {
                totalEarnedCredits += credits;
            }
        }

        newPoints += gradePoints * credits;

        return {
            credit: credits,
            grade: grade,
            isRetake: isRetake,
            oldGrade: oldGrade
        };
    });

    const semesterGPA = semesterAttemptedCredits > 0 ? 
        (newPoints / semesterAttemptedCredits) : 0;

    const record = {
        type: type,
        fileName: fileName,
        date: new Date().toLocaleString(),
        academicYear: academicYear,
        semester: semester || 'Not Selected',
        completedCredits: completedCredits,
        currentGPA: currentCGPA,
        semesterAttemptedCredits: semesterAttemptedCredits,
        semesterEarnedCredits: semesterEarnedCredits,
        totalAttemptedCredits: totalAttemptedCredits,
        totalEarnedCredits: totalEarnedCredits,
        semesterGPA: semesterGPA,
        calculatedGPA: type === "CGPA" ? 
            (totalAttemptedCredits > 0 ? 
                ((currentCGPA * completedCredits) + newPoints) / totalAttemptedCredits : 0) : 
            semesterGPA,
        courses: courseData
    };

    saveAsJSON(record, fileName);
    createPDF(record, fileName, true);
}

function resetCGPA() {
    document.getElementById('academic-year').value = currentYear;
    document.getElementById('semester').value = '';
    document.getElementById('completed-credits').value = '';
    document.getElementById('current-cgpa').value = '';
    document.getElementById('cgpa-courses').innerHTML = '';
    addCGPACourse();
}

function loadRecord() {
    const fileInput = document.getElementById('record-file');
    const file = fileInput.files[0];
    if (file) {
        if (file.type === 'application/json') {
            loadJSONRecord(file);
        } else if (file.type === 'application/pdf') {
            viewPDF(file);
        } else {
            showToast("Please select a JSON or PDF file.");
        }
    } else {
        showToast("Please select a file to load.");
    }
}

function loadJSONRecord(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            currentRecord = JSON.parse(e.target.result);
            displayLoadedRecord(currentRecord);
            showEditButton();
        } catch (error) {
            showToast("Error reading JSON file. Please check the file format.");
        }
    };
    reader.readAsText(file);
}

function viewPDF(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const pdfData = new Uint8Array(e.target.result);
        showPDFPreview(pdfData);
    };
    reader.readAsArrayBuffer(file);
}

function showPDFPreview(pdfData) {
    const modal = document.getElementById('pdfPreviewModal');
    const canvas = document.getElementById('pdf-canvas');
    const context = canvas.getContext('2d');
    
    pdfjsLib.getDocument({ data: pdfData }).promise.then(function(pdf) {
        pdf.getPage(1).then(function(page) {
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            page.render(renderContext).promise.then(function() {
                modal.style.display = "block";
            });
        });
    }).catch(function(error) {
        console.error('Error loading PDF:', error);
        showToast("Error loading PDF file. Please try again.");
    });

    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
function displayLoadedRecord(record) {
    const loadedRecordDiv = document.getElementById('loaded-record');

    let html = `
        <h3 style="margin-bottom: 5px;">Loaded ${record.type} Record</h3>
        <div class="edit-row" style="margin-top: 5px;">
            <div class="edit-field">
                <p>File Name: ${record.fileName}</p>
                <p>Date: ${record.date}</p>
            </div>
            <div class="edit-field">
                <p>Academic Year: ${record.academicYear}</p>
                <p>Semester: ${record.semester}</p>
            </div>
        </div>
    `;

    if (record.type === "CGPA") {
        html += `
            <div class="edit-row">
                <div class="edit-field">
                    <p>Previous Credits: ${record.completedCredits}</p>
                    <p>Previous CGPA: ${record.currentGPA}</p>
                </div>
                <div class="edit-field">
                    <p>Total Completed Credits: ${record.totalEarnedCredits}</p>
                    <p>New CGPA: ${record.calculatedGPA.toFixed(2)}</p>
                </div>
            </div>
        `;
    }

    html += `
        <h3>Course Details</h3>
        <table class="record-table">
            <tr>
                <th>Course</th>
                <th>Credit</th>
                <th>Grade</th>
                ${record.type === "CGPA" ? `
                <th>Retake</th>
                <th>Old Grade</th>
                ` : ''}
            </tr>
    `;

    record.courses.forEach((course, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${course.credit}</td>
                <td>${course.grade}</td>
                ${record.type === "CGPA" ? `
                <td>${course.isRetake ? 'Yes' : 'No'}</td>
                <td>${course.oldGrade}</td>
                ` : ''}
            </tr>
        `;
    });

    html += `
        </table>
        <p style="font-size: 0.9em; color: #666; margin-top: 8px;">
            Note: Courses with F grade are included in attempted credits but not in earned/Completed Credits.
        </p>
        <h3 style="margin-bottom: 5px;">Semester Result</h3>
        <div class="edit-row" style="margin-top: 5px;">
            <div class="edit-field">
                <p>Attempted Credits: ${record.semesterAttemptedCredits}</p>
                <p>Completed Credits: ${record.semesterEarnedCredits}</p>
            </div>
            <div class="edit-field">
                <p>Semester GPA: ${record.semesterGPA.toFixed(2)}</p>
            </div>
        </div>
    `;

    loadedRecordDiv.innerHTML = html;
}

function showEditButton() {
    const loadedRecordDiv = document.getElementById('loaded-record');
    const editButton = document.createElement('button');
    editButton.className = 'menu-button';
    editButton.textContent = 'Edit Record';
    editButton.onclick = showEditForm;
    loadedRecordDiv.appendChild(editButton);
}

function showEditForm() {
    showSection('edit-record');
    const editForm = document.getElementById('edit-form');
    let html = `
        <div class="edit-row">
            <div class="edit-field">
                <label>File Name:</label>
                <input type="text" id="edit-filename" value="${currentRecord.fileName}">
            </div>
            <div class="edit-field">
                <label>Date:</label>
                <input type="text" id="edit-date" value="${currentRecord.date}">
            </div>
        </div>
        <div class="edit-row">
            <div class="edit-field">
                <label>Academic Year:</label>
                <input type="number" id="edit-academic-year" value="${currentRecord.academicYear}" 
                       min="2000" max="2099" onchange="validateYear(this)">
            </div>
            <div class="edit-field">
                <label>Semester:</label>
                <select id="edit-semester">
                    <option value="">Select Semester</option>
                    <option value="Spring" ${currentRecord.semester === 'Spring' ? 'selected' : ''}>Spring</option>
                    <option value="Summer" ${currentRecord.semester === 'Summer' ? 'selected' : ''}>Summer</option>
                    <option value="Fall" ${currentRecord.semester === 'Fall' ? 'selected' : ''}>Fall</option>
                </select>
            </div>
        </div>
    `;

    if (currentRecord.type === "CGPA") {
        html += `
            <div class="edit-row">
                <div class="edit-field">
                    <label>Current Credits:</label>
                    <input type="number" id="edit-completed-credits" value="${currentRecord.completedCredits}" 
                           step="0.5" onchange="updateNewCGPA()">
                </div>
                <div class="edit-field">
                    <label>Current CGPA:</label>
                    <input type="number" id="edit-current-gpa" value="${currentRecord.currentGPA}" 
                           step="0.01" onchange="validateGPAInput(this); updateNewCGPA()" max="4">
                </div>
            </div>
        `;
    }

    html += `
        <div class="edit-row">
            <div class="edit-field">
                <label>Total Credits:</label>
                <input type="number" id="edit-total-credits" value="${currentRecord.type === 'CGPA' ? currentRecord.totalEarnedCredits : currentRecord.semesterEarnedCredits}" step="0.5" readonly>
            </div>
            <div class="edit-field">
                <label>New ${currentRecord.type}:</label>
                <input type="number" id="edit-new-gpa" value="${currentRecord.calculatedGPA}" step="0.01" readonly>
            </div>
        </div>
        <h3>Courses</h3>
    `;

    currentRecord.courses.forEach((course, index) => {
        html += `
            <div class="course-row">
                <select class="edit-field" onchange="updateNewCGPA()">
                    <option value="">Credit</option>
                    ${getCreditOptions(course.credit)}
                </select>
                <select class="edit-field" onchange="updateNewCGPA()">
                    <option value="">Grade</option>
                    ${getGradeOptions(course.grade)}
                </select>
                ${currentRecord.type === "CGPA" ? `
                <select class="edit-field" onchange="toggleOldGrade(this); updateNewCGPA()">
                    <option value="0" ${!course.isRetake ? 'selected' : ''}>New Course</option>
                    <option value="1" ${course.isRetake ? 'selected' : ''}>Retake</option>
                </select>
                <select class="edit-field old-grade ${!course.isRetake ? 'hidden' : ''}" onchange="updateNewCGPA()">
                    <option value="">Old Grade</option>
                    ${getGradeOptions(course.oldGrade)}
                </select>
                ` : ''}
                <button class="icon-button" onclick="removeCourse(this); updateNewCGPA()" title="Remove Course">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
    });

    html += `<button class="menu-button" onclick="addCourseToEdit()">Add Course</button>`;
    editForm.innerHTML = html;
    updateNewCGPA();
}

function validateYear(input) {
    const year = parseInt(input.value);
    if (year < 2000 || year > 2099) {
        showToast("Please enter a valid year between 2000 and 2099");
        input.value = currentYear;
    }
}

function addCourseToEdit() {
    const editForm = document.getElementById('edit-form');
    const newCourseDiv = document.createElement('div');
    newCourseDiv.className = 'course-row';
    
    newCourseDiv.innerHTML = `
        <select class="edit-field" onchange="updateNewCGPA()">
            <option value="">Credit</option>
            ${getCreditOptions('')}
        </select>
        <select class="edit-field" onchange="updateNewCGPA()">
            <option value="">Grade</option>
            ${getGradeOptions('')}
        </select>
        ${currentRecord.type === "CGPA" ? `
        <select class="edit-field" onchange="toggleOldGrade(this); updateNewCGPA()">
            <option value="0" selected>New Course</option>
            <option value="1">Retake</option>
        </select>
        <select class="edit-field old-grade hidden" onchange="updateNewCGPA()">
            <option value="">Old Grade</option>
            ${getGradeOptions('')}
        </select>
        ` : ''}
        <button class="icon-button" onclick="removeCourse(this); updateNewCGPA()" title="Remove Course">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
        </button>
    `;
    editForm.insertBefore(newCourseDiv, editForm.lastElementChild);
    updateNewCGPA();
}
function getCreditOptions(selectedCredit) {
    const credits = [3, 1, 2, 4];
    return credits.map(credit => 
        `<option value="${credit}" ${credit == selectedCredit ? 'selected' : ''}>${credit}</option>`
    ).join('');
}

function getGradeOptions(selectedGrade) {
    const grades = {
        'A': '4.00',
        'A-': '3.67',
        'B+': '3.33',
        'B': '3.00',
        'B-': '2.67',
        'C+': '2.33',
        'C': '2.00',
        'C-': '1.67',
        'D+': '1.33',
        'D': '1.00',
        'F': '0.00'
    };
    
    return Object.entries(grades).map(([grade, value]) =>
        `<option value="${value}" ${grade === selectedGrade ? 'selected' : ''}>${grade}</option>`
    ).join('');
}

function removeCourse(button) {
    button.parentElement.remove();
    updateNewCGPA();
}

function updateNewCGPA() {
    const editForm = document.getElementById('edit-form');
    const completedCredits = parseFloat(document.getElementById('edit-completed-credits')?.value) || 0;
    const currentCGPA = parseFloat(document.getElementById('edit-current-gpa')?.value) || 0;
    
    let totalPoints = completedCredits * currentCGPA;
    let totalAttemptedCredits = completedCredits;
    let totalEarnedCredits = completedCredits;
    let semesterPoints = 0;
    let semesterAttemptedCredits = 0;
    let semesterEarnedCredits = 0;

    editForm.querySelectorAll('.course-row').forEach(courseRow => {
        const credits = parseFloat(courseRow.children[0].value) || 0;
        const gradePoints = parseFloat(courseRow.children[1].value) || 0;
        
        // Add to semester totals
        semesterPoints += gradePoints * credits;
        semesterAttemptedCredits += credits;
        if (gradePoints > 0) {
            semesterEarnedCredits += credits;
        }

        if (currentRecord.type === "CGPA" && courseRow.children[2] && courseRow.children[2].value === "1") {
            // This is a retake course
            const oldGradePoints = parseFloat(courseRow.children[3].value) || 0;
            
            // Calculate points for CGPA
            // Add the difference between new and old grade points
            totalPoints += (gradePoints - oldGradePoints) * credits;
            
            // Update earned credits if passing a previously failed course
            if (oldGradePoints === 0 && gradePoints > 0) {
                // If old grade was F and new grade is passing
                totalEarnedCredits += credits;
            }
            // Attempted credits don't change for retakes
        } else {
            // This is a new course
            totalPoints += gradePoints * credits;
            totalAttemptedCredits += credits;
            if (gradePoints > 0) {
                totalEarnedCredits += credits;
            }
        }
    });

    // Calculate semester GPA and CGPA
    const newCGPA = totalAttemptedCredits > 0 ? totalPoints / totalAttemptedCredits : 0;
    const semesterGPA = semesterAttemptedCredits > 0 ? semesterPoints / semesterAttemptedCredits : 0;
    
    // Update form fields
    if (document.getElementById('edit-total-credits')) {
        document.getElementById('edit-total-credits').value = totalEarnedCredits.toFixed(2);
    }
    if (document.getElementById('edit-new-gpa')) {
        document.getElementById('edit-new-gpa').value = newCGPA.toFixed(2);
    }

    // Update current record with new calculations
    currentRecord.semesterAttemptedCredits = semesterAttemptedCredits;
    currentRecord.semesterEarnedCredits = semesterEarnedCredits;
    currentRecord.semesterGPA = parseFloat(semesterGPA.toFixed(2));
    currentRecord.totalAttemptedCredits = totalAttemptedCredits;
    currentRecord.totalEarnedCredits = totalEarnedCredits;
    currentRecord.calculatedGPA = parseFloat(newCGPA.toFixed(2));
}

function validateEditForm() {
    const academicYear = document.getElementById('edit-academic-year').value;
    
    if (!academicYear) {
        showToast("Please select Academic Year");
        return false;
    }

    const courses = document.querySelectorAll('#edit-form .course-row');
    if (courses.length === 0) {
        showToast("Please add at least one course");
        return false;
    }

    let isValid = true;
    courses.forEach(course => {
        if (!course.children[0].value || !course.children[1].value) {
            isValid = false;
        }
        if (currentRecord.type === "CGPA" && course.children[2]?.value === "1" && !course.children[3].value) {
            isValid = false;
        }
    });

    if (!isValid) {
        showToast("Please fill in all course details");
        return false;
    }

    return true;
}

function showEditedResult() {
    const splashScreen = document.createElement('div');
    splashScreen.className = 'splash-screen';

    let content = '';
    if (currentRecord.type === "GPA") {
        content = `
            <div class="splash-content calculation-result">
                <h3>Updated GPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Academic Year:</span> ${currentRecord.academicYear}</p>
                        <p><span class="result-label">Semester:</span> ${currentRecord.semester}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Attempted Credits:</span> ${currentRecord.semesterAttemptedCredits}</p>
                        <p><span class="result-label">Completed Credits:</span> ${currentRecord.semesterEarnedCredits}</p>
                        <p><span class="result-label">Semester GPA:</span> ${currentRecord.semesterGPA.toFixed(2)}</p>
                    </div>
                </div>

                <div class="splash-buttons">
                    <button class="menu-button" onclick="confirmAndSaveChanges()">Save Changes</button>
                    <button class="menu-button" onclick="closeSplashScreen()">Back</button>
                    <button class="menu-button" onclick="closeSplashAndReturn()">Return to Records</button>
                </div>
            </div>
        `;
    } else {
        content = `
            <div class="splash-content calculation-result">
                <h3>Updated CGPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Academic Year:</span> ${currentRecord.academicYear}</p>
                        <p><span class="result-label">Semester:</span> ${currentRecord.semester}</p>
                    </div>
                </div>

                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Previous Credits:</span> ${currentRecord.completedCredits}</p>
                        <p><span class="result-label">Previous CGPA:</span> ${currentRecord.currentGPA.toFixed(2)}</p>
                        <p><span class="result-label">Total Attempted Credits:</span> ${currentRecord.totalAttemptedCredits}</p>
                        <p><span class="result-label">Total Completed Credits:</span> ${currentRecord.totalEarnedCredits}</p>
                        <p><span class="result-label">New CGPA:</span> ${currentRecord.calculatedGPA.toFixed(2)}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field text-left">
                        <p><span class="result-label">Attempted Credits:</span> ${currentRecord.semesterAttemptedCredits}</p>
                        <p><span class="result-label">Completed Credits:</span> ${currentRecord.semesterEarnedCredits}</p>
                        <p><span class="result-label">Semester GPA:</span> ${currentRecord.semesterGPA.toFixed(2)}</p>
                    </div>
                </div>

                <div class="splash-buttons">
                    <button class="menu-button" onclick="confirmAndSaveChanges()">Save Changes</button>
                    <button class="menu-button" onclick="closeSplashScreen()">Back</button>
                    <button class="menu-button" onclick="closeSplashAndReturn()">Return to Records</button>
                </div>
            </div>
        `;
    }

    splashScreen.innerHTML = content;
    document.body.appendChild(splashScreen);
}
// Add new function to handle returning to records view
function closeSplashAndReturn() {
    closeSplashScreen();
    showSection('load-record');
    displayLoadedRecord(currentRecord);
}

function confirmAndSaveChanges() {
    if (confirm("Are you sure you want to save these changes?")) {
        saveAsJSON(currentRecord, currentRecord.fileName);
        createPDF(currentRecord, currentRecord.fileName, true);
        showToast("Changes saved successfully!");
    }
}

function saveEditedRecord() {
    // Validate CGPA fields first if it's a CGPA record
    if (currentRecord.type === "CGPA") {
        const completedCredits = document.getElementById('edit-completed-credits').value;
        const currentCGPA = document.getElementById('edit-current-gpa').value;
        
        if ((completedCredits && !currentCGPA) || (!completedCredits && currentCGPA)) {
            showToast("Please fill both Previous Completed Credits and Current CGPA");
            return;
        }
    }

    if (validateEditForm()) {
        const editForm = document.getElementById('edit-form');
        currentRecord.fileName = document.getElementById('edit-filename').value;
        currentRecord.date = document.getElementById('edit-date').value;
        currentRecord.academicYear = document.getElementById('edit-academic-year').value;
        const semester = document.getElementById('edit-semester').value;
        currentRecord.semester = semester || 'Not Selected';
        
        let newPoints = 0;
        let semesterAttemptedCredits = 0;
        let semesterEarnedCredits = 0;
        let totalAttemptedCredits = 0;
        let totalEarnedCredits = 0;

        if (currentRecord.type === "CGPA") {
            currentRecord.completedCredits = parseFloat(document.getElementById('edit-completed-credits').value) || 0;
            currentRecord.currentGPA = parseFloat(document.getElementById('edit-current-gpa').value) || 0;
            totalAttemptedCredits = currentRecord.completedCredits;
            totalEarnedCredits = currentRecord.completedCredits;
        }
        
        currentRecord.courses = [];
        editForm.querySelectorAll('.course-row').forEach(courseRow => {
            const credits = parseFloat(courseRow.children[0].value);
            const gradePoints = parseFloat(courseRow.children[1].value);
            const grade = courseRow.children[1].options[courseRow.children[1].selectedIndex].text;
            const isRetake = currentRecord.type === "CGPA" && courseRow.children[2] ? 
                            courseRow.children[2].value === "1" : false;
            const oldGrade = isRetake ? 
                            courseRow.children[3].options[courseRow.children[3].selectedIndex].text : '-';

            // Add to semester totals
            semesterAttemptedCredits += credits;
            if (gradePoints > 0) {
                semesterEarnedCredits += credits;
            }

            if (currentRecord.type === "CGPA") {
                if (isRetake) {
                    // For retake courses
                    const oldGradePoints = parseFloat(courseRow.children[3].value) || 0;
                    // Add the difference between new and old grade points
                    newPoints += (gradePoints - oldGradePoints) * credits;
                    
                    // Update earned credits if passing a previously failed course
                    if (oldGradePoints === 0 && gradePoints > 0) {
                        totalEarnedCredits += credits;
                    }
                    // Don't change attempted credits for retakes
                } else {
                    // For new courses
                    newPoints += gradePoints * credits;
                    totalAttemptedCredits += credits;
                    if (gradePoints > 0) {
                        totalEarnedCredits += credits;
                    }
                }
            } else {
                newPoints += gradePoints * credits;
            }

            currentRecord.courses.push({
                credit: credits,
                grade: grade,
                isRetake: isRetake,
                oldGrade: oldGrade
            });
        });

        // Update record with new calculations
        currentRecord.semesterAttemptedCredits = semesterAttemptedCredits;
        currentRecord.semesterEarnedCredits = semesterEarnedCredits;
        currentRecord.semesterGPA = semesterAttemptedCredits > 0 ? 
            (newPoints / semesterAttemptedCredits) : 0;

        if (currentRecord.type === "CGPA") {
            currentRecord.totalAttemptedCredits = totalAttemptedCredits;
            currentRecord.totalEarnedCredits = totalEarnedCredits;
            const totalPoints = (currentRecord.currentGPA * currentRecord.completedCredits) + newPoints;
            currentRecord.calculatedGPA = totalAttemptedCredits > 0 ? 
                totalPoints / totalAttemptedCredits : 0;
        } else {
            currentRecord.calculatedGPA = currentRecord.semesterGPA;
        }

        showEditedResult();
    }
}

function resetLoadedRecord() {
    // Clear the file input
    document.getElementById('record-file').value = '';
    
    // Clear the loaded record display
    document.getElementById('loaded-record').innerHTML = '';
    
    // Reset currentRecord
    currentRecord = null;

    // Show notification
    showToast("Record view has been reset");
}

function downloadPDF() {
    const fileInput = document.getElementById('record-file');
    const file = fileInput.files[0];
    if (file && file.type === 'application/pdf') {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast("PDF download started");
    } else {
        showToast("No PDF file selected for download");
    }
}

function exit() {
    if (confirm("Are you sure you want to exit the application?")) {
        try {
            // Check for mobile app
            const isMobileApp = (
                window.cordova || 
                window.PhoneGap || 
                window.phonegap || 
                window.forge
            );

            // Check platform
            const isAndroid = /android/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            // Check if it's Tinny Host
            const isTinnyHost = window.location.hostname.includes('tinnyhost');

            if (isMobileApp) {
                // Mobile App Exit
                if (isAndroid && navigator.app && navigator.app.exitApp) {
                    navigator.app.exitApp();
                } else if (isIOS && navigator.device && navigator.device.exitApp) {
                    navigator.device.exitApp();
                }
            } 
            else if (isTinnyHost) {
                // Tinny Host specific exit
                window.top.location.href = '../';
            }
            else {
                // Desktop/Browser Exit
                window.close();
                setTimeout(() => {
                    if (!window.closed) {
                        window.history.back();
                    }
                }, 100);
            }
        } catch (e) {
            console.log("Exit handling error:", e);
            // Final fallback
            window.history.back();
        }
    }
}

// Back button handler for Android
document.addEventListener("backbutton", function(e) {
    e.preventDefault();
    exit();
}, false);

// Browser back button handler
window.onpopstate = function(event) {
    const currentSection = Array.from(document.querySelectorAll('.container > div'))
        .find(div => !div.classList.contains('hidden'));
        
    if (currentSection && currentSection.id !== 'main-menu') {
        event.preventDefault();
        showSection('main-menu');
    } else {
        exit();
    }
};
 
 document.addEventListener('DOMContentLoaded', function() {
    // Initialize with current year and add one course row
    document.getElementById('academic-year').value = currentYear;
    addCGPACourse();

    // Year validation
    document.getElementById('academic-year').addEventListener('input', function() {
        const year = parseInt(this.value);
        if (year < 2000 || year > 2099) {
            showToast("Please enter a valid year between 2000 and 2099");
            this.value = currentYear;
        }
    });

    
    // Completed Credits field
    const completedCreditsInput = document.getElementById('completed-credits');
    const currentCGPAInput = document.getElementById('current-cgpa');

    completedCreditsInput.addEventListener('blur', function() {
        if (this.value && !currentCGPAInput.value) {
            showToast("Please fill both Completed Credits and Current CGPA");
        }
        updateCourseRowsDisplay();
    });

    // Current CGPA field
    currentCGPAInput.addEventListener('blur', function() {
        if (this.value && !completedCreditsInput.value) {
            showToast("Please fill both Completed Credits and Current CGPA");
        }
        validateGPAInput(this);
        updateCourseRowsDisplay();
    });

    // Monitor both fields for changes
    completedCreditsInput.addEventListener('input', function() {
        const currentCGPA = currentCGPAInput.value;
        if (this.value === '' && currentCGPA !== '') {
            showToast("Please fill both Completed Credits and Current CGPA");
        }
        updateCourseRowsDisplay();
    });

    currentCGPAInput.addEventListener('input', function() {
        const completedCredits = completedCreditsInput.value;
        if (this.value === '' && completedCredits !== '') {
            showToast("Please fill both Completed Credits and Current CGPA");
        }
        validateGPAInput(this);
        updateCourseRowsDisplay();
    });

    // Show main menu on initial load
    showSection('main-menu');
});


// Event Listeners for ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const splashScreen = document.querySelector('.splash-screen');
        if (splashScreen) {
            closeSplashScreen();
        }
        const modal = document.getElementById('pdfPreviewModal');
        if (modal && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
});

// File input validation
document.getElementById('record-file').addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type !== 'application/json' && file.type !== 'application/pdf') {
            showToast("Please select a valid JSON or PDF file");
            e.target.value = '';
        }
    }
});

// Progressive Web App support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

function closeSplashScreen() {
    const splashScreen = document.querySelector('.splash-screen');
    if (splashScreen) {
        document.body.removeChild(splashScreen);
    }
}

function saveAsJSON(record, fileName) {
    const recordJson = JSON.stringify(record, null, 2);
    
    if (window.cordova) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
            fs.root.getFile(fileName + ".json", { create: true, exclusive: false }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.write(recordJson);
                    showToast("Record saved as JSON successfully!");
                }, saveError);
            }, saveError);
        }, saveError);
    } else {
        const blob = new Blob([recordJson], {type: "application/json"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileName}.json`;
        a.click();
        showToast("Record saved as JSON successfully!");
    }
}

function saveError(error) {
    console.error("Error saving file", error);
    showToast("Error saving file. Please try again.");
}
function createPDF(record, fileName, download = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Column positions
    const cgpaStartX = 20;  // Left side for CGPA
    const gpaStartX = 120;  // Right side for GPA/Semester results

    doc.setFontSize(16);
    doc.text(`${record.type} Record`, 105, 15, null, null, 'center');
    
    doc.setFontSize(12);
    doc.text(`Date: ${record.date}`, 20, 25);
    doc.text(`Academic Year: ${record.academicYear}`, 20, 35);
    doc.text(`Semester: ${record.semester}`, 20, 45);

    if (record.type === "CGPA") {
        // CGPA Results (Left Side)
        doc.setFontSize(14);
        doc.text("CGPA Calculation Result", cgpaStartX, 60);
        doc.setFontSize(12);
        doc.text(`Previous Credits: ${record.completedCredits}`, cgpaStartX, 70);
        doc.text(`Previous CGPA: ${record.currentGPA}`, cgpaStartX, 80);
        doc.text(`Total Attempted Credits: ${record.totalAttemptedCredits}`, cgpaStartX, 90);
        doc.text(`Total Completed Credits: ${record.totalEarnedCredits}`, cgpaStartX, 100);
        doc.text(`New CGPA: ${record.calculatedGPA.toFixed(2)}`, cgpaStartX, 110);

        // GPA Results (Right Side)
        doc.setFontSize(14);
        doc.text("GPA Calculation Result", gpaStartX, 60);
        doc.setFontSize(12);
        doc.text(`Attempted Credits: ${record.semesterAttemptedCredits}`, gpaStartX, 70);
        doc.text(`Completed Credits: ${record.semesterEarnedCredits}`, gpaStartX, 80);
        doc.text(`Semester GPA: ${record.semesterGPA.toFixed(2)}`, gpaStartX, 90);
    } else {
        // Only GPA Results (Centered)
        doc.setFontSize(14);
        doc.text("GPA Calculation Result", 20, 60);
        doc.setFontSize(12);
        doc.text(`Attempted Credits: ${record.semesterAttemptedCredits}`, 20, 70);
        doc.text(`Completed Credits: ${record.semesterEarnedCredits}`, 20, 80);
        doc.text(`Semester GPA: ${record.semesterGPA.toFixed(2)}`, 20, 90);
    }

    // Course Details Table
    const tableStartY = record.type === "CGPA" ? 130 : 100;
    doc.setFontSize(14);
    doc.text("Course Details", 105, tableStartY - 5, null, null, 'center');

    const columns = ["Course", "Credit", "Grade"];
    if (record.type === "CGPA") {
        columns.push("Retake", "Old Grade");
    }

    const data = record.courses.map((course, index) => {
        const rowData = [
            (index + 1).toString(),
            course.credit,
            course.grade
        ];
        if (record.type === "CGPA") {
            rowData.push(course.isRetake ? 'Yes' : 'No', course.oldGrade);
        }
        return rowData;
    });

    doc.autoTable({
        head: [columns],
        body: data,
        startY: tableStartY,
        theme: 'grid',
        styles: {
            fontSize: 11,
            cellPadding: 3
        },
        headerStyles: {
            fillColor: [245, 154, 46],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        }
    });

    // Add the F grade note
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Note: Courses with F grade are included in attempted credits but not in earned/Completed Credits.", 20, finalY);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);

    if (download) {
        if (window.cordova) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
                fs.root.getFile(fileName + ".pdf", { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.write(doc.output('blob'));
                        showToast("Record saved as PDF successfully!");
                    }, saveError);
                }, saveError);
            }, saveError);
        } else {
            doc.save(`${fileName}.pdf`);
            showToast("Record saved as PDF successfully!");
        }
    }

    return doc.output('datauristring');
}

// Function for validating year input
function validateAcademicYear(year) {
    return year >= 2000 && year <= 2099;
}

// Function for validating semester input
function validateSemester(semester) {
    return ['Spring', 'Summer', 'Fall'].includes(semester);
}

// Function for validating GPA input
function validateGPARange(gpa) {
    const parsedGPA = parseFloat(gpa);
    return !isNaN(parsedGPA) && parsedGPA >= 0 && parsedGPA <= 4;
}

// Function for validating credit hours
function validateCreditHours(credit) {
    const validCredits = [1, 2, 3, 4];
    return validCredits.includes(parseInt(credit));
}

// Function for handling file saving errors
function handleSaveError(error) {
    console.error('Save Error:', error);
    showToast("Error saving file. Please try again.");
}

// Function for data validation before calculation
function validateCalculationData(year, semester, courses) {
    if (!validateAcademicYear(parseInt(year))) {
        showToast("Invalid academic year");
        return false;
    }

    if (!validateSemester(semester)) {
        showToast("Invalid semester selection");
        return false;
    }

    if (courses.length === 0) {
        showToast("Please add at least one course");
        return false;
    }

    return true;
}

// Function for formatting decimal numbers
function formatDecimal(number, decimals = 2) {
    return Number(number).toFixed(decimals);
}

// Function for clearing form data
function clearFormData() {
    document.getElementById('academic-year').value = currentYear;
    document.getElementById('semester').value = '';
    document.getElementById('completed-credits').value = '';
    document.getElementById('current-cgpa').value = '';
    document.getElementById('cgpa-courses').innerHTML = '';
    addCGPACourse();
}

// Function for handling mobile device back button
function handleMobileBackButton() {
    if (window.cordova) {
        document.addEventListener("backbutton", function(e) {
            const currentSection = Array.from(document.querySelectorAll('.container > div'))
                                      .find(div => !div.classList.contains('hidden'));
            
            if (currentSection && currentSection.id !== 'main-menu') {
                e.preventDefault();
                showSection('main-menu');
            } else {
                if (confirm("Are you sure you want to exit the application?")) {
                    navigator.app.exitApp();
                }
            }
        }, false);
    }
}

// Function for checking if the device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Function for handling offline functionality
function setupOfflineSupport() {
    window.addEventListener('online', function() {
        showToast("You are now online");
    });

    window.addEventListener('offline', function() {
        showToast("You are now offline");
    });
}

// Initialize additional features
function initializeAdditionalFeatures() {
    handleMobileBackButton();
    setupOfflineSupport();
}

// Call initialization when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAdditionalFeatures();
});
