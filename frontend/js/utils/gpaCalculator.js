/**
 * Add these additional methods to existing gpaCalculator.js
 */

/**
 * Get grade letter from numeric value (already exists, ensure it's there)
 * @param {number} numericGrade - Numeric grade (0-4)
 * @returns {string} Letter grade
 */
export function getGradeLetterFromNumeric(numericGrade) {
    const grade = typeof numericGrade === 'string' ? parseFloat(numericGrade) : numericGrade;
    if (isNaN(grade)) return '-';
    
    if (grade >= 3.85) return 'A';
    if (grade >= 3.5) return 'A-';
    if (grade >= 3.2) return 'B+';
    if (grade >= 2.85) return 'B';
    if (grade >= 2.5) return 'B-';
    if (grade >= 2.2) return 'C+';
    if (grade >= 1.85) return 'C';
    if (grade >= 1.5) return 'C-';
    if (grade >= 1.0) return 'D';
    return 'E';
}

/**
 * Get performance description based on GPA
 * @param {number} gpa - GPA value
 * @returns {string} Performance description
 */
export function getPerformanceDescription(gpa) {
    if (gpa >= 3.5) return 'Excellent - Keep up the great work!';
    if (gpa >= 3.0) return 'Very Good - You are doing well!';
    if (gpa >= 2.5) return 'Good - Room for improvement';
    if (gpa >= 2.0) return 'Satisfactory - Need to study harder';
    if (gpa >= 1.5) return 'Poor - Please seek academic help';
    return 'Critical - Immediate action required';
}

/**
 * Get GPA color based on value
 * @param {number} gpa - GPA value
 * @returns {string} CSS color class
 */
export function getGPAColor(gpa) {
    if (gpa >= 3.5) return 'gpa-excellent';
    if (gpa >= 3.0) return 'gpa-very-good';
    if (gpa >= 2.5) return 'gpa-good';
    if (gpa >= 2.0) return 'gpa-satisfactory';
    if (gpa >= 1.5) return 'gpa-poor';
    return 'gpa-critical';
}
