/**
 * Handles localStorage operations for dataset persistence
 */
class StorageManager {
    constructor(storageKey = 'dataset-creator-data') {
        this.storageKey = storageKey;
    }

    save(dataset) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(dataset));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }

    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return [];
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }
}