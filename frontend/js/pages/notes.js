/**
 * Notes Page Component
 * Manages notes with rich text support, search, and categories
 * Implements PRD Section NOTES-01
 */

import { store, actions } from '../store/globalState.js';
import { notesAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { confirmModal } from '../components/Modal.js';
import { NoteModal } from '../components/NoteModal.js';
import { CACHE_TTL, NOTE_CATEGORIES } from '../utils/constants.js';
import { formatDate, truncateText } from '../utils/formatters.js';
import { skeletonList } from '../components/LoadingSpinner.js';

// State
let currentFilter = 'all';
let currentSearch = '';
let searchTimeout = null;

/**
 * Render notes page
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    let notes = state.notes || [];
    
    if (isLoading && !notes.length) {
        return renderSkeleton();
    }
    
    // Apply category filter
    if (currentFilter !== 'all') {
        notes = notes.filter(note => note.category === currentFilter);
    }
    
    // Apply search filter
    if (currentSearch.trim()) {
        const searchTerm = currentSearch.toLowerCase().trim();
        notes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            (note.content && note.content.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort by updated_at (newest first)
    notes.sort((a, b) => {
        const dateA = new Date(b.updated_at || b.created_at);
        const dateB = new Date(a.updated_at || a.created_at);
        return dateA - dateB;
    });
    
    // Separate archived notes
    const activeNotes = notes.filter(note => !note.is_archived);
    const archivedNotes = notes.filter(note => note.is_archived);
    
    return `
        <div class="notes-container">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1>Notes</h1>
                    <p>Capture your thoughts, lectures, and ideas</p>
                </div>
                <button id="addNoteBtn" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    New Note
                </button>
            </div>
            
            <!-- Search and Filters -->
            <div class="notes-filters">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" id="searchNotes" 
                           placeholder="Search notes by title or content..."
                           value="${escapeHtml(currentSearch)}">
                </div>
                
                <div class="category-filter">
                    <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-category="all">
                        All
                    </button>
                    ${NOTE_CATEGORIES.map(cat => `
                        <button class="filter-chip ${currentFilter === cat ? 'active' : ''}" data-category="${cat}">
                            ${cat}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- Stats -->
            <div class="notes-stats">
                <span><i class="fas fa-file-alt"></i> ${activeNotes.length} active notes</span>
                ${archivedNotes.length > 0 ? `<span><i class="fas fa-archive"></i> ${archivedNotes.length} archived</span>` : ''}
            </div>
            
            <!-- Active Notes Grid -->
            <div class="notes-grid">
                ${activeNotes.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-sticky-note"></i>
                        <h3>No notes yet</h3>
                        <p>Create your first note to start organizing your thoughts.</p>
                        <button class="btn btn-primary" id="emptyAddNoteBtn">
                            <i class="fas fa-plus"></i>
                            Create Note
                        </button>
                    </div>
                ` : `
                    ${activeNotes.map(note => renderNoteCard(note)).join('')}
                `}
            </div>
            
            <!-- Archived Notes Section -->
            ${archivedNotes.length > 0 ? `
                <div class="archived-section">
                    <h3 class="archived-title">
                        <i class="fas fa-archive"></i>
                        Archived Notes
                        <span class="archived-count">${archivedNotes.length}</span>
                    </h3>
                    <div class="notes-grid archived-grid">
                        ${archivedNotes.map(note => renderNoteCard(note, true)).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render individual note card
 * @param {Object} note - Note data
 * @param {boolean} isArchived - Whether note is archived
 * @returns {string} HTML string
 */
function renderNoteCard(note, isArchived = false) {
    const previewContent = note.content ? truncateText(note.content.replace(/<[^>]*>/g, ''), 120) : 'No content';
    const updatedDate = formatDate(note.updated_at || note.created_at, 'date');
    
    return `
        <div class="note-card" data-note-id="${note.note_id}">
            <div class="note-card-header">
                <div class="note-category ${note.category.toLowerCase()}">
                    ${escapeHtml(note.category)}
                </div>
                <div class="note-actions">
                    <button class="icon-btn edit-note" data-note-id="${note.note_id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!isArchived ? `
                        <button class="icon-btn archive-note" data-note-id="${note.note_id}" title="Archive">
                            <i class="fas fa-archive"></i>
                        </button>
                    ` : `
                        <button class="icon-btn unarchive-note" data-note-id="${note.note_id}" title="Unarchive">
                            <i class="fas fa-inbox"></i>
                        </button>
                    `}
                    <button class="icon-btn delete-note" data-note-id="${note.note_id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="note-card-body">
                <h4 class="note-title">${escapeHtml(note.title)}</h4>
                <div class="note-preview">${escapeHtml(previewContent)}</div>
            </div>
            <div class="note-card-footer">
                <span class="note-date">
                    <i class="fas fa-clock"></i>
                    Updated ${updatedDate}
                </span>
                <button class="view-note-btn" data-note-id="${note.note_id}">
                    Read more <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Render skeleton loader
 * @returns {string} HTML string
 */
function renderSkeleton() {
    return `
        <div class="notes-container">
            <div class="page-header">
                <div>
                    <div class="skeleton" style="width: 100px; height: 32px;"></div>
                    <div class="skeleton" style="width: 200px; height: 20px; margin-top: 8px;"></div>
                </div>
            </div>
            <div class="notes-filters">
                <div class="skeleton" style="height: 40px; border-radius: 8px;"></div>
            </div>
            <div class="notes-grid">
                ${skeletonList(4)}
            </div>
        </div>
    `;
}

/**
 * Escape HTML helper
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load notes data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadNotes(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getNotes',
            () => notesAPI.getAll(currentSearch, currentFilter !== 'all' ? currentFilter : ''),
            { search: currentSearch, category: currentFilter !== 'all' ? currentFilter : '' },
            CACHE_TTL.NOTES,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const notes = result.data.data || result.data;
            actions.setNotes(notes);
            return notes;
        }
    } catch (error) {
        console.error('Load notes error:', error);
        showToast('Failed to load notes', 'error');
    } finally {
        actions.setLoading(false);
    }
    
    return [];
}

/**
 * Add new note
 * @param {Object} noteData - Note data
 */
async function addNote(noteData) {
    actions.setLoading(true);
    
    try {
        const response = await notesAPI.add(noteData);
        
        if (response.success) {
            showToast('Note created successfully', 'success');
            invalidateAfterMutation('addNote');
            await loadNotes(true);
            return true;
        } else {
            showToast(response.message || 'Failed to create note', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add note error:', error);
        showToast('Failed to create note', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Update note
 * @param {string} noteId - Note ID
 * @param {Object} updates - Updated data
 */
async function updateNote(noteId, updates) {
    actions.setLoading(true);
    
    try {
        const response = await notesAPI.update(noteId, updates);
        
        if (response.success) {
            showToast('Note updated successfully', 'success');
            invalidateAfterMutation('updateNote');
            await loadNotes(true);
            return true;
        } else {
            showToast(response.message || 'Failed to update note', 'error');
            return false;
        }
    } catch (error) {
        console.error('Update note error:', error);
        showToast('Failed to update note', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Archive note
 * @param {string} noteId - Note ID
 */
async function archiveNote(noteId) {
    actions.setLoading(true);
    
    try {
        const response = await notesAPI.archive(noteId);
        
        if (response.success) {
            showToast('Note archived', 'success');
            invalidateAfterMutation('updateNote');
            await loadNotes(true);
            return true;
        } else {
            showToast(response.message || 'Failed to archive note', 'error');
            return false;
        }
    } catch (error) {
        console.error('Archive note error:', error);
        showToast('Failed to archive note', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Unarchive note
 * @param {string} noteId - Note ID
 */
async function unarchiveNote(noteId) {
    actions.setLoading(true);
    
    try {
        const response = await notesAPI.unarchive(noteId);
        
        if (response.success) {
            showToast('Note restored from archive', 'success');
            invalidateAfterMutation('updateNote');
            await loadNotes(true);
            return true;
        } else {
            showToast(response.message || 'Failed to restore note', 'error');
            return false;
        }
    } catch (error) {
        console.error('Unarchive note error:', error);
        showToast('Failed to restore note', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Delete note
 * @param {string} noteId - Note ID
 */
async function deleteNote(noteId) {
    const confirmed = await confirmModal(
        'Delete Note',
        'Are you sure you want to delete this note? This action cannot be undone.',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return false;
    
    actions.setLoading(true);
    
    try {
        const response = await notesAPI.delete(noteId);
        
        if (response.success) {
            showToast('Note deleted successfully', 'success');
            invalidateAfterMutation('deleteNote');
            await loadNotes(true);
            return true;
        } else {
            showToast(response.message || 'Failed to delete note', 'error');
            return false;
        }
    } catch (error) {
        console.error('Delete note error:', error);
        showToast('Failed to delete note', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * View note (open in read mode)
 * @param {Object} note - Note data
 */
async function viewNote(note) {
    await NoteModal.view(note);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add note button
    const addBtn = document.getElementById('addNoteBtn');
    const emptyAddBtn = document.getElementById('emptyAddNoteBtn');
    
    const handleAddNote = async () => {
        const result = await NoteModal.create();
        if (result) {
            await addNote(result);
        }
    };
    
    if (addBtn) addBtn.addEventListener('click', handleAddNote);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddNote);
    
    // Edit note
    document.querySelectorAll('.edit-note').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = btn.getAttribute('data-note-id');
            const state = store.getState();
            const note = state.notes?.find(n => n.note_id === noteId);
            
            if (note) {
                const result = await NoteModal.edit(note);
                if (result) {
                    await updateNote(noteId, result);
                }
            }
        });
    });
    
    // View note
    document.querySelectorAll('.view-note-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = btn.getAttribute('data-note-id');
            const state = store.getState();
            const note = state.notes?.find(n => n.note_id === noteId);
            
            if (note) {
                await viewNote(note);
            }
        });
    });
    
    // Archive note
    document.querySelectorAll('.archive-note').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = btn.getAttribute('data-note-id');
            await archiveNote(noteId);
        });
    });
    
    // Unarchive note
    document.querySelectorAll('.unarchive-note').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = btn.getAttribute('data-note-id');
            await unarchiveNote(noteId);
        });
    });
    
    // Delete note
    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = btn.getAttribute('data-note-id');
            await deleteNote(noteId);
        });
    });
    
    // Search with debounce
    const searchInput = document.getElementById('searchNotes');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value;
                refreshPage();
            }, 300);
        });
    }
    
    // Category filters
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            const category = chip.getAttribute('data-category');
            currentFilter = category;
            refreshPage();
        });
    });
}

/**
 * Refresh page content
 */
async function refreshPage() {
    const container = document.querySelector('.notes-container');
    if (container) {
        await loadNotes(true);
        
        const newHtml = render();
        container.innerHTML = newHtml;
        
        setupEventListeners();
    }
}

/**
 * Page lifecycle - before render
 */
async function beforeRender() {
    await loadNotes(false);
    return true;
}

/**
 * Page lifecycle - after render
 */
async function afterRender() {
    setupEventListeners();
}

// Export page component
const NotesPage = {
    render,
    beforeRender,
    afterRender
};

export default NotesPage;
