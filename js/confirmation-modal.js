/**
 * Custom confirmation modal (better than browser confirm)
 */
class ConfirmationModal {
    constructor() {
        this.createModal();
    }

    createModal() {
        // Check if modal already exists
        if (document.getElementById('confirmation-modal')) return;

        const modalHTML = `
            <div id="confirmation-modal" class="modal confirmation-modal">
                <div class="modal-content confirmation-content">
                    <div class="confirmation-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 id="confirmation-title">Confirm Action</h3>
                    <p id="confirmation-message">Are you sure you want to proceed?</p>
                    <div class="confirmation-actions">
                        <button id="confirmation-cancel" class="btn btn-secondary">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button id="confirmation-confirm" class="btn btn-danger">
                            <i class="fas fa-check"></i> Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    show(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to proceed?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-danger',
            icon = 'fa-exclamation-triangle',
            iconClass = 'warning'
        } = options;

        return new Promise((resolve) => {
            const modal = document.getElementById('confirmation-modal');
            const titleEl = document.getElementById('confirmation-title');
            const messageEl = document.getElementById('confirmation-message');
            const confirmBtn = document.getElementById('confirmation-confirm');
            const cancelBtn = document.getElementById('confirmation-cancel');
            const iconEl = modal.querySelector('.confirmation-icon i');
            const iconContainer = modal.querySelector('.confirmation-icon');

            // Update content
            titleEl.textContent = title;
            messageEl.textContent = message;
            confirmBtn.innerHTML = `<i class="fas fa-check"></i> ${confirmText}`;
            cancelBtn.innerHTML = `<i class="fas fa-times"></i> ${cancelText}`;
            
            // Update button style
            confirmBtn.className = `btn ${confirmClass}`;
            
            // Update icon
            iconEl.className = `fas ${icon}`;
            iconContainer.className = `confirmation-icon ${iconClass}`;

            // Show modal
            modal.classList.add('active');

            // Handle confirm
            const handleConfirm = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(true);
            };

            // Handle cancel
            const handleCancel = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(false);
            };

            // Handle ESC key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            // Attach event listeners
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleCancel();
            });
            document.addEventListener('keydown', handleEscape);

            // Cleanup function
            function cleanup() {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }

    // Convenience methods for common confirmations
    async confirmDelete(itemName = 'this item') {
        return this.show({
            title: 'Delete Confirmation',
            message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            icon: 'fa-trash-alt',
            iconClass: 'danger'
        });
    }

    async confirmClear() {
        return this.show({
            title: 'Clear All Data',
            message: 'Are you sure you want to clear all data pairs? This will permanently delete all your training data.',
            confirmText: 'Clear All',
            confirmClass: 'btn-danger',
            icon: 'fa-exclamation-circle',
            iconClass: 'danger'
        });
    }

    async confirmAction(action = 'this action') {
        return this.show({
            title: 'Confirm Action',
            message: `Are you sure you want to ${action}?`,
            confirmText: 'Continue',
            confirmClass: 'btn-primary',
            icon: 'fa-question-circle',
            iconClass: 'info'
        });
    }
}

// Create global instance
window.confirmModal = new ConfirmationModal();