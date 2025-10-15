/**
 * Handles all modal operations
 */
class ModalManager {
    constructor(datasetManager) {
        this.datasetManager = datasetManager;
        this.currentEditIndex = null;
        
        // Create modal dynamically if it doesn't exist
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Check if modal already exists
        if (document.getElementById('pair-modal')) return;

        // Create modal HTML
        const modalHTML = `
            <div id="pair-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Add New Pair</h3>
                        <button id="close-modal" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-section">
                            <label>Prompt: <span id="prompt-count">0</span> chars</label>
                            <textarea id="prompt-input" class="large-textarea" style="min-height: 150px;" placeholder="Enter the prompt..."></textarea>
                        </div>
                        <div class="input-section">
                            <label>Completion: <span id="completion-count">0</span> chars</label>
                            <textarea id="completion-input" class="large-textarea" style="min-height: 150px;" placeholder="Enter the completion..."></textarea>
                        </div>
                        <div class="input-section">
                            <label>Tags (comma-separated):</label>
                            <input type="text" id="tags-input" class="input-select" placeholder="e.g., programming, javascript">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-btn" class="btn btn-secondary">Cancel</button>
                        <button id="save-btn" class="btn btn-success">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setupEventListeners() {
        // Get elements after modal is created
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');
        const saveBtn = document.getElementById('save-btn');
        const promptInput = document.getElementById('prompt-input');
        const completionInput = document.getElementById('completion-input');
        const modal = document.getElementById('pair-modal');

        // Only setup listeners if elements exist
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePairModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closePairModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePair());
        }

        // Character counters
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                const counter = document.getElementById('prompt-count');
                if (counter) counter.textContent = e.target.value.length;
            });
        }

        if (completionInput) {
            completionInput.addEventListener('input', (e) => {
                const counter = document.getElementById('completion-count');
                if (counter) counter.textContent = e.target.value.length;
            });
        }

        // Close modal on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePairModal();
                }
            });
        }
    }

    openAddModal() {
        this.currentEditIndex = null;
        const modal = document.getElementById('pair-modal');
        const modalTitle = document.getElementById('modal-title');
        const promptInput = document.getElementById('prompt-input');
        const completionInput = document.getElementById('completion-input');
        const tagsInput = document.getElementById('tags-input');
        const promptCount = document.getElementById('prompt-count');
        const completionCount = document.getElementById('completion-count');

        if (modalTitle) modalTitle.textContent = 'Add New Pair';
        if (promptInput) promptInput.value = '';
        if (completionInput) completionInput.value = '';
        if (tagsInput) tagsInput.value = '';
        if (promptCount) promptCount.textContent = '0';
        if (completionCount) completionCount.textContent = '0';
        
        if (modal) modal.classList.add('active');
    }

    openEditModal(index) {
        this.currentEditIndex = index;
        const pair = this.datasetManager.get(index);
        
        const modal = document.getElementById('pair-modal');
        const modalTitle = document.getElementById('modal-title');
        const promptInput = document.getElementById('prompt-input');
        const completionInput = document.getElementById('completion-input');
        const tagsInput = document.getElementById('tags-input');
        const promptCount = document.getElementById('prompt-count');
        const completionCount = document.getElementById('completion-count');

        if (modalTitle) modalTitle.textContent = 'Edit Pair';
        if (promptInput) promptInput.value = pair.prompt || '';
        if (completionInput) completionInput.value = pair.completion || '';
        if (tagsInput) tagsInput.value = pair.tags ? pair.tags.join(', ') : '';
        if (promptCount) promptCount.textContent = (pair.prompt || '').length;
        if (completionCount) completionCount.textContent = (pair.completion || '').length;
        
        if (modal) modal.classList.add('active');
    }

    closePairModal() {
        const modal = document.getElementById('pair-modal');
        if (modal) modal.classList.remove('active');
        this.currentEditIndex = null;
    }

    savePair() {
        const promptInput = document.getElementById('prompt-input');
        const completionInput = document.getElementById('completion-input');
        const tagsInput = document.getElementById('tags-input');

        const prompt = promptInput ? promptInput.value.trim() : '';
        const completion = completionInput ? completionInput.value.trim() : '';
        const tagsValue = tagsInput ? tagsInput.value.trim() : '';

        if (!prompt || !completion) {
            if (window.uiManager) {
                window.uiManager.showNotification('Both prompt and completion are required!', 'error');
            } else {
                alert('Both prompt and completion are required!');
            }
            return;
        }

        const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];
        const pair = { prompt, completion, tags };

        if (this.currentEditIndex !== null) {
            this.datasetManager.update(this.currentEditIndex, pair);
            if (window.uiManager) {
                window.uiManager.showNotification('Pair updated successfully!', 'success');
            }
        } else {
            this.datasetManager.add(pair);
            if (window.uiManager) {
                window.uiManager.showNotification('Pair added successfully!', 'success');
            }
        }

        this.closePairModal();
    }
}