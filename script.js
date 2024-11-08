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

    // Validation checks remain the same
    if (!academicYear) {
        showToast("Please select Academic Year");
        return;
    }

    if ((completedCredits && !currentCGPA) || (!completedCredits && currentCGPA)) {
        showToast("Please fill both Completed Credits and Current CGPA");
        return;
    }

    if (courses.length === 0) {
        showToast("Please add at least one course");
        return;
    }

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
        let displayCredits = 0;     
        let calculationCredits = 0;  
        let semesterPoints = 0;
        let semesterCredits = 0;

        const parsedCompletedCredits = parseFloat(completedCredits) || 0;
        const parsedCurrentCGPA = parseFloat(currentCGPA) || 0;
        
        // For F grade retakes, assume the actual calculation credits are higher
        let actualCalculationCredits = parsedCompletedCredits;
        courses.forEach(course => {
            const credits = parseFloat(course.children[0].value);
            const gradePoints = parseFloat(course.children[1].value);
            const isRetake = course.children[2]?.value === "1";
            const oldGradePoints = isRetake ? parseFloat(course.children[3].value) : 0;

            if (isRetake && oldGradePoints === 0.00) {
                // If it's an F grade retake, adjust the actual calculation credits
                actualCalculationCredits += credits;
            }
        });

        // Calculate initial points using actual calculation credits
        const initialPoints = actualCalculationCredits * parsedCurrentCGPA;

        // Process each course
        courses.forEach(course => {
            const credits = parseFloat(course.children[0].value);
            const gradePoints = parseFloat(course.children[1].value);
            const isRetake = course.children[2]?.value === "1";
            const oldGradePoints = isRetake ? parseFloat(course.children[3].value) : 0;

            if (isRetake) {
                if (oldGradePoints === 0.00) {
                    // Retaking an F grade
                    newPoints += gradePoints * credits;
                    if (gradePoints > 0) {
                        displayCredits += credits;
                    }
                    // Don't add to calculationCredits as it's already included
                } else {
                    // Retaking a non-F grade
                    newPoints += (gradePoints - oldGradePoints) * credits;
                }
            } else {
                // New course
                newPoints += gradePoints * credits;
                if (gradePoints > 0) {
                    displayCredits += credits;
                }
                calculationCredits += credits;
            }
            
            // Always add to semester calculations
            semesterPoints += gradePoints * credits;
            semesterCredits += credits;
        });

        const totalPoints = initialPoints + newPoints;
        const displayTotalCredits = parsedCompletedCredits + displayCredits;
        const calculationTotalCredits = actualCalculationCredits + calculationCredits;
        
        const newCGPA = calculationTotalCredits > 0 ? totalPoints / calculationTotalCredits : 0;
        const semesterGPA = semesterCredits > 0 ? semesterPoints / semesterCredits : 0;

        document.body.removeChild(splashScreen);
        
        showCalculationResult(
            academicYear,
            semester || 'Not Selected',
            parsedCompletedCredits,
            parsedCurrentCGPA,
            newCGPA,
            semesterGPA,
            semesterCredits,
            displayTotalCredits,
            displayCredits
        );
    }, 1000);
}

function showCalculationResult(academicYear, semester, completedCredits, currentCGPA, newCGPA, semesterGPA, semesterCredits, totalCredits, newCredits) {
    const splashScreen = document.createElement('div');
    splashScreen.className = 'splash-screen';
    
    let content = '';
    if (completedCredits === 0 && currentCGPA === 0) {
        // GPA calculation result
        content = `
            <div class="splash-content calculation-result">
                <h3>GPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Academic Year: ${academicYear}</p>
                        <p>Semester: ${semester}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Semester Credits: ${Math.round(semesterCredits)}</p>
                    </div>
                    <div class="edit-field">
                        <p>Semester GPA: ${semesterGPA.toFixed(2)}</p>
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
                    <div class="edit-field">
                        <p>Academic Year: ${academicYear}</p>
                        <p>Semester: ${semester}</p>
                    </div>
                </div>

                <div class="edit-row">
                    <div class="edit-field">
                        <p>Previous Credits: ${Math.round(completedCredits)}</p>
                        <p>Previous CGPA: ${currentCGPA.toFixed(2)}</p>
                    </div>
                    <div class="edit-field">
                        <p>New Credits: ${Math.round(newCredits)}</p>
                        <p>Total Credits: ${Math.round(totalCredits)}</p>
                    </div>
                </div>

                <div class="edit-row">
                    <div class="edit-field">
                        <p>New CGPA: ${newCGPA.toFixed(2)}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Semester Credits: ${Math.round(semesterCredits)}</p>
                    </div>
                    <div class="edit-field">
                        <p>Semester GPA: ${semesterGPA.toFixed(2)}</p>
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

    let record = {
        type: type,
        fileName: fileName,
        date: new Date().toLocaleString(),
        academicYear: academicYear,
        semester: semester,
        completedCredits: completedCredits,
        currentGPA: currentCGPA,
        courses: []
    };

    const courses = document.querySelectorAll('#cgpa-courses .course-row');
    courses.forEach(course => {
        record.courses.push({
            credit: course.children[0].value,
            grade: course.children[1].options[course.children[1].selectedIndex].text,
            isRetake: course.children[2]?.value === "1" || false,
            oldGrade: course.children[2]?.value === "1" ? 
                     course.children[3].options[course.children[3].selectedIndex].text : '-'
        });
    });

    const resultDiv = document.querySelector('.splash-content');
    if (type === "CGPA") {
        record.calculatedGPA = parseFloat(resultDiv.textContent.match(/New CGPA: ([\d.]+)/)[1]);
        record.newCredits = parseFloat(resultDiv.textContent.match(/New Credits: ([\d.]+)/)[1]);
        record.totalCredits = parseFloat(resultDiv.textContent.match(/Total Credits: ([\d.]+)/)[1]);
    }

    record.semesterCredits = parseFloat(resultDiv.textContent.match(/Semester Credits: ([\d.]+)/)[1]);
    record.semesterGPA = parseFloat(resultDiv.textContent.match(/Semester GPA: ([\d.]+)/)[1]);

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
        <h3>Loaded ${record.type} Record</h3>
        <div class="edit-row">
            <div class="edit-field">
                <p>File Name: ${record.fileName}</p>
                <p>Date: ${record.date}</p>
            </div>
            <div class="edit-field">
                <p>Academic Year: ${record.academicYear}</p>
                <p>Semester: ${record.semester || 'Not Selected'}</p>
            </div>
        </div>
    `;

    if (record.type === "CGPA") {
        html += `
            <div class="edit-row">
                <div class="edit-field">
                    <p>Current Credits: ${record.completedCredits}</p>
                </div>
                <div class="edit-field">
                    <p>Current CGPA: ${record.currentGPA}</p>
                </div>
            </div>
        `;
    }

    html += `
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
        <div class="edit-row">
            ${record.type === "CGPA" ? `
                <div class="edit-field">
                    <p>Semester Credits: ${record.semesterCredits}</p>
                    <p><strong>Total Credits: ${record.totalCredits || record.semesterCredits}</strong></p>
                </div>
                <div class="edit-field">
                    <p>Semester GPA: ${record.semesterGPA}</p>
                    <p><strong>Calculated ${record.type}: ${record.calculatedGPA || record.semesterGPA}</strong></p>
                </div>
            ` : `
                <div class="edit-field">
                    <p><strong>Semester Credits: ${record.semesterCredits}</strong></p>
                </div>
                <div class="edit-field">
                    <p><strong>Semester GPA: ${record.semesterGPA}</strong></p>
                </div>
            `}
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
                <input type="number" id="edit-total-credits" value="${currentRecord.totalCredits || currentRecord.semesterCredits}" step="0.5" readonly>
            </div>
            <div class="edit-field">
                <label>New ${currentRecord.type}:</label>
                <input type="number" id="edit-new-gpa" value="${currentRecord.calculatedGPA || currentRecord.semesterGPA}" step="0.01" readonly>
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
    
    let newPoints = 0;
    let displayCredits = 0;     
    let calculationCredits = 0;  
    let semesterPoints = 0;
    let semesterCredits = 0;

    // First pass: Calculate actual calculation credits including F grades
    let actualCalculationCredits = completedCredits;
    editForm.querySelectorAll('.course-row').forEach(courseRow => {
        const credits = parseFloat(courseRow.children[0].value) || 0;
        const isRetake = courseRow.children[2]?.value === "1";
        const oldGradePoints = isRetake ? parseFloat(courseRow.children[3].value) || 0 : 0;

        if (isRetake && oldGradePoints === 0.00) {
            // If it's an F grade retake, adjust the actual calculation credits
            actualCalculationCredits += credits;
        }
    });

    // Calculate initial points using actual calculation credits
    const initialPoints = actualCalculationCredits * currentCGPA;

    // Second pass: Calculate new points and credits
    editForm.querySelectorAll('.course-row').forEach(courseRow => {
        const credits = parseFloat(courseRow.children[0].value) || 0;
        const gradePoints = parseFloat(courseRow.children[1].value) || 0;
        const isRetake = courseRow.children[2]?.value === "1";
        const oldGradePoints = isRetake ? parseFloat(courseRow.children[3].value) || 0 : 0;

        if (isRetake) {
            if (oldGradePoints === 0.00) {
                // Retaking an F grade
                newPoints += gradePoints * credits;
                if (gradePoints > 0) {
                    displayCredits += credits;
                }
                // Don't add to calculationCredits as it's already included
            } else {
                // Retaking a non-F grade
                newPoints += (gradePoints - oldGradePoints) * credits;
            }
        } else {
            // New course
            newPoints += gradePoints * credits;
            if (gradePoints > 0) {
                displayCredits += credits;
            }
            calculationCredits += credits;
        }

        // Always add to semester calculations
        semesterPoints += gradePoints * credits;
        semesterCredits += credits;
    });

    const totalPoints = initialPoints + newPoints;
    const displayTotalCredits = completedCredits + displayCredits;
    const calculationTotalCredits = actualCalculationCredits + calculationCredits;
    
    const newCGPA = calculationTotalCredits > 0 ? totalPoints / calculationTotalCredits : 0;
    const semesterGPA = semesterCredits > 0 ? semesterPoints / semesterCredits : 0;

    document.getElementById('edit-new-gpa').value = 
        (currentRecord.type === "CGPA" ? newCGPA : semesterGPA).toFixed(2);
    document.getElementById('edit-total-credits').value = 
        (currentRecord.type === "CGPA" ? displayTotalCredits : semesterCredits).toFixed(2);

    // Update current record with all values
    if (currentRecord.type === "CGPA") {
        currentRecord.calculatedGPA = parseFloat(newCGPA.toFixed(2));
        currentRecord.totalCredits = displayTotalCredits;
        currentRecord.newCredits = displayCredits;
        currentRecord.semesterGPA = parseFloat(semesterGPA.toFixed(2));
        currentRecord.semesterCredits = semesterCredits;
        // Add actual calculation credits for reference
        currentRecord.actualCalculationCredits = calculationTotalCredits;
    } else {
        currentRecord.semesterGPA = parseFloat(semesterGPA.toFixed(2));
        currentRecord.semesterCredits = semesterCredits;
    }
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
        if (currentRecord.type === "CGPA" && 
            course.children[2]?.value === "1" && 
            !course.children[3].value) {
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
        // GPA calculation result
        content = `
            <div class="splash-content calculation-result">
                <h3>GPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Academic Year: ${currentRecord.academicYear}</p>
                        <p>Semester: ${currentRecord.semester}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Semester Credits: ${Math.round(currentRecord.semesterCredits)}</p>
                    </div>
                    <div class="edit-field">
                        <p>Semester GPA: ${currentRecord.semesterGPA.toFixed(2)}</p>
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
        // CGPA calculation result
        content = `
            <div class="splash-content calculation-result">
                <h3>CGPA Calculation Result</h3>
                
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Academic Year: ${currentRecord.academicYear}</p>
                        <p>Semester: ${currentRecord.semester}</p>
                    </div>
                </div>

                <div class="edit-row">
                    <div class="edit-field">
                        <p>Previous Credits: ${Math.round(currentRecord.completedCredits)}</p>
                        <p>Previous CGPA: ${currentRecord.currentGPA.toFixed(2)}</p>
                    </div>
                    <div class="edit-field">
                        <p>New Credits: ${Math.round(currentRecord.newCredits)}</p>
                        <p>Total Credits: ${Math.round(currentRecord.totalCredits)}</p>
                    </div>
                </div>

                <div class="edit-row">
                    <div class="edit-field">
                        <p>New CGPA: ${currentRecord.calculatedGPA.toFixed(2)}</p>
                    </div>
                </div>

                <h3>Semester Result</h3>
                <div class="edit-row">
                    <div class="edit-field">
                        <p>Semester Credits: ${Math.round(currentRecord.semesterCredits)}</p>
                    </div>
                    <div class="edit-field">
                        <p>Semester GPA: ${currentRecord.semesterGPA.toFixed(2)}</p>
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
        
        if (currentRecord.type === "CGPA") {
            currentRecord.completedCredits = parseFloat(document.getElementById('edit-completed-credits').value) || 0;
            currentRecord.currentGPA = parseFloat(document.getElementById('edit-current-gpa').value) || 0;
            currentRecord.calculatedGPA = parseFloat(document.getElementById('edit-new-gpa').value);
            currentRecord.totalCredits = parseFloat(document.getElementById('edit-total-credits').value);
        }
        
        currentRecord.courses = [];
        let semesterPoints = 0;
        let semesterCredits = 0;

        editForm.querySelectorAll('.course-row').forEach(courseRow => {
            const credits = parseFloat(courseRow.children[0].value);
            const grade = courseRow.children[1].options[courseRow.children[1].selectedIndex].text;
            const gradePoints = parseFloat(courseRow.children[1].value);
            
            // Calculate semester results - including F grades
            semesterPoints += gradePoints * credits;
            semesterCredits += credits;

            currentRecord.courses.push({
                credit: courseRow.children[0].value,
                grade: grade,
                isRetake: currentRecord.type === "CGPA" && courseRow.children[2] ? 
                         courseRow.children[2].value === "1" : false,
                oldGrade: currentRecord.type === "CGPA" && courseRow.children[2]?.value === "1" ? 
                         courseRow.children[3].options[courseRow.children[3].selectedIndex].text : '-'
            });
        });

        // Update semester results
        currentRecord.semesterGPA = semesterCredits > 0 ? 
            parseFloat((semesterPoints / semesterCredits).toFixed(2)) : 0;
        currentRecord.semesterCredits = semesterCredits;

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

// Add these helper functions first
function saveJsonToDevice(content, fileName) {
    // Check if running in Cordova/PhoneGap environment
    if (window.cordova) {
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(directoryEntry) {
            directoryEntry.getFile(fileName, { create: true, exclusive: false }, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function() {
                        showToast(`File saved to: ${fileEntry.nativeURL}`);
                    };
                    fileWriter.onerror = function(error) {
                        showToast('Error saving file: ' + error.toString());
                    };
                    
                    // Create a blob and write it
                    const blob = new Blob([content], { type: 'application/json' });
                    fileWriter.write(blob);
                });
            }, function(error) {
                showToast('Error creating file: ' + error.toString());
            });
        }, function(error) {
            showToast('Error accessing filesystem: ' + error.toString());
        });
    } else if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/i)) {
        // For mobile browsers without Cordova
        try {
            // Create a temporary link and trigger download
            const blob = new Blob([content], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('File download started');
        } catch (e) {
            showToast('Error saving file: ' + e.toString());
        }
    } else {
        // Desktop browsers
        try {
            const blob = new Blob([content], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('File saved successfully');
        } catch (e) {
            showToast('Error saving file: ' + e.toString());
        }
    }
}

// Updated saveAsJSON function
function saveAsJSON(record, fileName) {
    try {
        // Ensure fileName has .json extension
        if (!fileName.endsWith('.json')) {
            fileName += '.json';
        }

        // Convert record to JSON string with formatting
        const recordJson = JSON.stringify(record, null, 2);

        // Save based on platform
        saveJsonToDevice(recordJson, fileName);
    } catch (error) {
        console.error('Error in saveAsJSON:', error);
        showToast('Error saving JSON file: ' + error.toString());
    }
}

// Add this function to check if device supports file saving
function checkDeviceCapabilities() {
    let capabilities = {
        cordova: !!window.cordova,
        fileSystem: !!window.requestFileSystem || !!window.webkitRequestFileSystem,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    };
    
    console.log('Device capabilities:', capabilities);
    return capabilities;
}

// Add this to your initialization code
document.addEventListener('deviceready', function() {
    checkDeviceCapabilities();
}, false);

function createPDF(record, fileName, download = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`${record.type} Record`, 105, 15, null, null, 'center');
    
    doc.setFontSize(12);
    doc.text(`Date: ${record.date}`, 20, 25);
    doc.text(`Academic Year: ${record.academicYear}`, 20, 35);
    doc.text(`Semester: ${record.semester}`, 20, 45);

    if (record.type === "CGPA") {
        const cgpaStartX = 20;
        doc.setFontSize(14);
        doc.text("CGPA Calculation Result", cgpaStartX, 60);
        doc.setFontSize(12);
        doc.text(`Previous Credits: ${record.completedCredits}`, cgpaStartX, 70);
        doc.text(`Previous CGPA: ${record.currentGPA}`, cgpaStartX, 80);
        doc.text(`New Credits: ${record.newCredits}`, cgpaStartX, 90);
        doc.text(`Total Credits: ${record.totalCredits}`, cgpaStartX, 100);
        doc.text(`New CGPA: ${record.calculatedGPA}`, cgpaStartX, 110);
    }

    const gpaStartX = record.type === "CGPA" ? 120 : 20;
    const gpaStartY = record.type === "CGPA" ? 60 : 60;
    doc.setFontSize(14);
    doc.text("GPA Calculation Result", gpaStartX, gpaStartY);
    doc.setFontSize(12);
    doc.text(`Semester Credits: ${record.semesterCredits}`, gpaStartX, gpaStartY + 10);
    doc.text(`Semester GPA: ${record.semesterGPA}`, gpaStartX, gpaStartY + 20);

    let yPos = record.type === "CGPA" ? 130 : 90;
    doc.setFontSize(14);
    doc.text("Courses", 105, yPos, null, null, 'center');
    yPos += 10;

    const columns = ["Course", "Credit", "Grade", "Retake", "Old Grade"];
    const data = record.courses.map((course, index) => [
        (index + 1).toString(),
        course.credit,
        course.grade,
        course.isRetake ? 'Yes' : 'No',
        course.oldGrade
    ]);

    doc.autoTable({
        head: [columns],
        body: data,
        startY: yPos,
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
    } else {
        return doc.output('datauristring');
    }
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
