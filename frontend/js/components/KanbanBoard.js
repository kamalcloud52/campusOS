/**
 * Kanban Board Component
 * Drag & drop kanban board for assignment status management
 * Implements PRD Section ACAD-02 kanban board style
 */

import { formatRelativeTime, getAssignmentStatusText } from '../utils/formatters.js';
import { showToast } from './Toast.js';

export class KanbanBoard {
    constructor(container, assignments, courses) {
        this.container = container;
        this.assignments = assignments;
        this.courses = courses;
        this.onStatusChange = null;
        this.draggedItem = null;
    }
    
    /**
     * Get assignments by status
     * @param {string} status - Status filter
     * @returns {Array} Filtered assignments
     */
    getAssignmentsByStatus(status) {
        return this.assignments.filter(a => a.status === status);
    }
    
    /**
     * Get course name by ID
     * @param {string} courseId - Course ID
     * @returns {string} Course name
     */
    getCourseName(courseId) {
        const course = this.courses.find(c => c.course_id === courseId);
        return course?.course_name || 'Unknown Course';
    }
    
    /**
     * Render kanban board
     */
    render() {
        const columns = [
            { id: 'pending', title: 'To Do', icon: 'fa-circle', color: '#9CA3AF' },
            { id: 'progress', title: 'In Progress', icon: 'fa-spinner', color: '#F59E0B' },
            { id: 'done', title: 'Completed', icon: 'fa-check-circle', color: '#10B981' }
        ];
        
        const columnsHtml = columns.map(column => {
            const assignments = this.getAssignmentsByStatus(column.id);
            
            return `
                <div class="kanban-column" data-status="${column.id}">
                    <div class="kanban-column-header" style="border-top-color: ${column.color}">
                        <div class="kanban-column-title">
                            <i class="fas ${column.icon}" style="color: ${column.color}"></i>
                            <h3>${column.title}</h3>
                            <span class="kanban-count">${assignments.length}</span>
                        </div>
                    </div>
                    <div class="kanban-column-body" data-status="${column.id}">
                        ${assignments.map(assignment => this.renderAssignmentCard(assignment)).join('')}
                        ${assignments.length === 0 ? `
                            <div class="kanban-empty">
                                <i class="fas fa-inbox"></i>
                                <p>No tasks</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = `
            <div class="kanban-board">
                ${columnsHtml}
            </div>
        `;
        
        this.setupDragAndDrop();
    }
    
    /**
     * Render single assignment card
     * @param {Object} assignment - Assignment data
     * @returns {string} HTML string
     */
    renderAssignmentCard(assignment) {
        const isOverdue = this.isOverdue(assignment.deadline);
        const overdueClass = isOverdue && assignment.status !== 'done' ? 'overdue' : '';
        
        return `
            <div class="kanban-card ${overdueClass}" draggable="true" data-assignment-id="${assignment.assignment_id}">
                <div class="kanban-card-title">
                    ${this.escapeHtml(assignment.title)}
                </div>
                <div class="kanban-card-course">
                    <i class="fas fa-book"></i>
                    ${this.escapeHtml(this.getCourseName(assignment.course_id))}
                </div>
                <div class="kanban-card-deadline ${isOverdue ? 'text-error' : ''}">
                    <i class="fas fa-calendar-alt"></i>
                    ${formatRelativeTime(assignment.deadline)}
                </div>
                ${assignment.description ? `
                    <div class="kanban-card-description">
                        ${this.escapeHtml(assignment.description.substring(0, 80))}
                        ${assignment.description.length > 80 ? '...' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Check if assignment is overdue
     * @param {string} deadline - Deadline date
     * @returns {boolean} True if overdue
     */
    isOverdue(deadline) {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadlineDate < today;
    }
    
    /**
     * Escape HTML helper
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Setup drag and drop event listeners
     */
    setupDragAndDrop() {
        const cards = this.container.querySelectorAll('.kanban-card');
        const columns = this.container.querySelectorAll('.kanban-column-body');
        
        // Drag start
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                this.draggedItem = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.getAttribute('data-assignment-id'));
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedItem = null;
            });
        });
        
        // Drag over - allow drop
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                column.classList.add('drag-over');
            });
            
            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });
            
            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                if (!this.draggedItem) return;
                
                const assignmentId = this.draggedItem.getAttribute('data-assignment-id');
                const newStatus = column.getAttribute('data-status');
                const currentStatus = this.getAssignmentStatus(assignmentId);
                
                if (currentStatus === newStatus) return;
                
                // Call the onStatusChange callback
                if (this.onStatusChange) {
                    const success = await this.onStatusChange(assignmentId, newStatus);
                    if (success) {
                        // Update local data
                        const assignment = this.assignments.find(a => a.assignment_id === assignmentId);
                        if (assignment) {
                            assignment.status = newStatus;
                        }
                        this.render(); // Re-render with updated data
                        showToast(`Task moved to ${getAssignmentStatusText(newStatus)}`, 'success');
                    }
                }
            });
        });
    }
    
    /**
     * Get assignment status by ID
     * @param {string} assignmentId - Assignment ID
     * @returns {string} Status
     */
    getAssignmentStatus(assignmentId) {
        const assignment = this.assignments.find(a => a.assignment_id === assignmentId);
        return assignment?.status || 'pending';
    }
    
    /**
     * Update assignments data and re-render
     * @param {Array} assignments - New assignments array
     * @param {Array} courses - New courses array
     */
    updateData(assignments, courses) {
        this.assignments = assignments;
        this.courses = courses;
        this.render();
    }
}

export default KanbanBoard;
