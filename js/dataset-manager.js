/**
 * Manages dataset operations (CRUD)
 */
class DatasetManager {
    constructor() {
        this.dataset = [];
        this.storage = new StorageManager();
        this.observers = [];
    }

    // Observer pattern for notifying UI changes
    subscribe(callback) {
        this.observers.push(callback);
    }

    notify() {
        this.observers.forEach(callback => callback(this.dataset));
    }

    load() {
        this.dataset = this.storage.load();
        this.notify();
    }

    save() {
        this.storage.save(this.dataset);
        this.notify();
    }

    add(pair) {
        const newPair = {
            ...pair,
            timestamp: new Date().toISOString()
        };
        this.dataset.push(newPair);
        this.save();
    }

    update(index, pair) {
        if (index >= 0 && index < this.dataset.length) {
            this.dataset[index] = {
                ...pair,
                timestamp: new Date().toISOString()
            };
            this.save();
        }
    }

    delete(index) {
        if (index >= 0 && index < this.dataset.length) {
            this.dataset.splice(index, 1);
            this.save();
        }
    }

    clear() {
        this.dataset = [];
        this.save();
    }

    getAll() {
        return [...this.dataset];
    }

    get(index) {
        return this.dataset[index];
    }

    getStats() {
        const total = this.dataset.length;
        const valid = this.dataset.filter(p => p.prompt && p.completion).length;
        const warnings = total - valid;

        return { total, valid, warnings };
    }

    removeDuplicates() {
        const seen = new Set();
        this.dataset = this.dataset.filter(pair => {
            const key = `${pair.prompt}|||${pair.completion}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
        this.save();
    }

    validate() {
        this.dataset = this.dataset.filter(pair => pair.prompt && pair.completion);
        this.save();
    }
}