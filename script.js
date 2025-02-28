const { jsPDF } = window.jspdf;
let semesters = {};

// Initialize Elements
const addSubjectBtn = document.getElementById('addSubjectBtn');
const generatePdfBtn = document.getElementById('generatePdfBtn');
const totalSemestersInput = document.getElementById('totalSemesters');
const currentSemesterSelect = document.getElementById('currentSemester');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
totalSemestersInput.addEventListener('change', updateSemesters);
currentSemesterSelect.addEventListener('change', loadSemester);
addSubjectBtn.addEventListener('click', addSubjectRow);
generatePdfBtn.addEventListener('click', generatePDF);

function initializeApp() {
    loadFromStorage();
    addSubjectRow();
    updateSemesters();
}

function updateSemesters() {
    const total = parseInt(totalSemestersInput.value);
    const previousValue = currentSemesterSelect.value;
    
    for(let i = 1; i <= total; i++) {
        if(!semesters[i]) semesters[i] = { subjects: [] };
    }
    
    Object.keys(semesters).forEach(key => {
        if(key > total) delete semesters[key];
    });

    currentSemesterSelect.innerHTML = Array.from({length: total}, (_, i) => 
        `<option value="${i+1}">Semester ${i+1}</option>`
    ).join('');
    
    currentSemesterSelect.value = Math.min(previousValue, total) || 1;
    saveToStorage();
    loadSemester();
}

function addSubjectRow() {
    const container = document.getElementById('subjectsContainer');
    
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.innerHTML = `
        <input type="text" placeholder="Subject Name">
        <input type="number" min="1" max="10" value="1" class="credits">
        <select class="grade">
            ${['O','S','A+','A','B','C','D','E','F'].map(g => `<option>${g}</option>`).join('')}
        </select>
        <select class="points">
            ${[10,9,8,7,6,5,0].map(p => `<option>${p}</option>`).join('')}
        </select>
        <button class="remove-btn">X</button>
    `;

    const removeBtn = row.querySelector('.remove-btn');
    removeBtn.addEventListener('click', function() {
        removeSubject(this);
    });

    row.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('input', () => {
            saveCurrentSemester();
            updateCalculations();
        });
    });

    container.appendChild(row);
    saveCurrentSemester();
    updateCalculations();
}

function removeSubject(btn) {
    btn.closest('.subject-row').remove();
    saveCurrentSemester();
    updateCalculations();
}

function saveCurrentSemester() {
    const semester = currentSemesterSelect.value;
    const subjects = [];
    
    document.querySelectorAll('.subject-row').forEach(row => {
        subjects.push({
            name: row.querySelector('input[type="text"]').value,
            credits: parseFloat(row.querySelector('.credits').value),
            grade: row.querySelector('.grade').value,
            points: parseFloat(row.querySelector('.points').value)
        });
    });
    
    semesters[semester].subjects = subjects;
    saveToStorage();
}

function loadSemester() {
    const semester = currentSemesterSelect.value;
    const container = document.getElementById('subjectsContainer');
    
    container.innerHTML = '';
    (semesters[semester]?.subjects || []).forEach(sub => {
        const row = document.createElement('div');
        row.className = 'subject-row';
        row.innerHTML = `
            <input type="text" value="${sub.name}">
            <input type="number" value="${sub.credits}" class="credits">
            <select class="grade">${createOptions(['O','S','A+','A','B','C','D','E','F'], sub.grade)}</select>
            <select class="points">${createOptions([10,9,8,7,6,5,0], sub.points)}</select>
            <button class="remove-btn">X</button>
        `;

        const removeBtn = row.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function() {
            removeSubject(this);
        });

        row.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('input', () => {
                saveCurrentSemester();
                updateCalculations();
            });
        });
        
        container.appendChild(row);
    });
    
    updateCalculations();
}

function updateCalculations() {
    const currentSemester = currentSemesterSelect.value;
    let sgpaCredits = 0, sgpaPoints = 0;
    
    semesters[currentSemester].subjects.forEach(sub => {
        sgpaCredits += sub.credits;
        sgpaPoints += sub.credits * sub.points;
    });
    
    const sgpa = sgpaCredits ? (sgpaPoints / sgpaCredits).toFixed(2) : 0;
    document.getElementById('sgpa').textContent = sgpa;

    let totalCredits = 0, totalPoints = 0;
    Object.values(semesters).forEach(sem => {
        sem.subjects.forEach(sub => {
            totalCredits += sub.credits;
            totalPoints += sub.credits * sub.points;
        });
    });

    const cgpa = totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0;
    document.getElementById('cgpa').textContent = cgpa;
    document.getElementById('percentage').textContent = (cgpa * 9.5).toFixed(2) + '%';
}
function generatePDF() {
    const doc = new jsPDF();
    let yPos = 20;

    // College Name in Header
    const collegeName = document.getElementById('collegeName').value;
    doc.setFontSize(18);
    doc.text(collegeName, 105, yPos, { align: 'center' });
    yPos += 10;

    // Report Title
    doc.setFontSize(16);
    doc.text("JNTUK Academic Report", 105, yPos, { align: 'center' });
    yPos += 15;

    // Student Info
    doc.setFontSize(12);
    doc.text(`Student Name: ${document.getElementById('studentName').value}`, 20, yPos);
    doc.text(`Roll Number: ${document.getElementById('rollNumber').value}`, 140, yPos);
    yPos += 10;
    
    doc.text(`College: ${collegeName}`, 20, yPos);
    doc.text(`Department: ${document.getElementById('department').value}`, 140, yPos);
    yPos += 10;
    
    doc.text(`Branch: ${document.getElementById('branch').value}`, 20, yPos);
    doc.text(`Regulation: ${document.getElementById('regulation').value}`, 140, yPos);
    yPos += 15;

    // Semester Data
    Object.entries(semesters).forEach(([semNumber, semData]) => {
        if(semData.subjects.length === 0) return;
        
        doc.setFontSize(14);
        doc.text(`Semester ${semNumber}`, 20, yPos);
        yPos += 10;
        
        // Table Header
        doc.setFillColor(200, 200, 200);
        doc.rect(20, yPos, 170, 10, 'F');
        doc.text("Subject", 22, yPos + 7);
        doc.text("Credits", 100, yPos + 7);
        doc.text("Grade", 140, yPos + 7);
        doc.text("Points", 170, yPos + 7);
        yPos += 10;

        // Subjects
        semData.subjects.forEach(sub => {
            doc.text(sub.name, 22, yPos + 7);
            doc.text(sub.credits.toString(), 100, yPos + 7);
            doc.text(sub.grade, 140, yPos + 7);
            doc.text(sub.points.toString(), 170, yPos + 7);
            yPos += 10;
        });

        // Semester SGPA
        let semCredits = 0, semPoints = 0;
        semData.subjects.forEach(sub => {
            semCredits += sub.credits;
            semPoints += sub.credits * sub.points;
        });
        const semSGPA = semCredits ? (semPoints / semCredits).toFixed(2) : 0;
        
        doc.text(`SGPA: ${semSGPA}`, 160, yPos + 7);
        yPos += 15;
    });

    // Overall CGPA
    doc.setFontSize(16);
    doc.text(`Overall CGPA: ${document.getElementById('cgpa').textContent}`, 20, yPos);
    doc.text(`Percentage: ${document.getElementById('percentage').textContent}`, 120, yPos);
    yPos += 15;

    // Horizontal Line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // Disclaimer Note
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Note: This is not an official university certificate. This is an AI-generated certificate.", 20, yPos);

    // Save PDF
    doc.save('Academic_Report.pdf');
}

// Helper functions
function createOptions(values, selected) {
    return values.map(v => 
        `<option ${v === selected ? 'selected' : ''}>${v}</option>`
    ).join('');
}

function saveToStorage() {
    localStorage.setItem('sgpaData', JSON.stringify({
        semesters,
        studentData: {
            name: document.getElementById('studentName').value,
            rollNumber: document.getElementById('rollNumber').value,
            collegeName: document.getElementById('collegeName').value,
            department: document.getElementById('department').value,
            branch: document.getElementById('branch').value,
            regulation: document.getElementById('regulation').value,
            year: document.getElementById('year').value
        }
    }));
}

function loadFromStorage() {
    const savedData = localStorage.getItem('sgpaData');
    if(savedData) {
        const data = JSON.parse(savedData);
        semesters = data.semesters || {};
        
        document.getElementById('studentName').value = data.studentData?.name || '';
        document.getElementById('rollNumber').value = data.studentData?.rollNumber || '';
        document.getElementById('collegeName').value = data.studentData?.collegeName || '';
        document.getElementById('department').value = data.studentData?.department || '';
        document.getElementById('branch').value = data.studentData?.branch || '';
        document.getElementById('regulation').value = data.studentData?.regulation || '';
        document.getElementById('year').value = data.studentData?.year || '';
        
        totalSemestersInput.value = Math.max(1, Object.keys(semesters).length) || 1;
    }
}