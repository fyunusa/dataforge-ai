/**
 * Handles import and export operations
 */
class ImportExportManager {
    constructor(datasetManager) {
        this.datasetManager = datasetManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Only setup listeners for elements that exist
        const importBtn = document.getElementById('import-btn');
        const closeImportModal = document.getElementById('close-import-modal');
        const importCsvBtn = document.getElementById('import-csv-btn');
        const importJsonBtn = document.getElementById('import-json-btn');
        const importTextBtn = document.getElementById('import-text-btn');
        const fileInput = document.getElementById('file-input');
        const processTextBtn = document.getElementById('process-text-btn');
        const exportBtn = document.getElementById('export-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');

        if (importBtn) {
            importBtn.addEventListener('click', () => this.openImportModal());
        }

        if (closeImportModal) {
            closeImportModal.addEventListener('click', () => this.closeImportModal());
        }

        if (importCsvBtn) {
            importCsvBtn.addEventListener('click', () => {
                if (fileInput) {
                    fileInput.accept = '.csv';
                    fileInput.click();
                }
            });
        }

        if (importJsonBtn) {
            importJsonBtn.addEventListener('click', () => {
                if (fileInput) {
                    fileInput.accept = '.json,.jsonl';
                    fileInput.click();
                }
            });
        }

        if (importTextBtn) {
            importTextBtn.addEventListener('click', () => {
                const textImport = document.getElementById('text-import');
                if (textImport) {
                    textImport.style.display = 'block';
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e.target.files[0]));
        }

        if (processTextBtn) {
            processTextBtn.addEventListener('click', () => this.processTextImport());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportDataset());
        }

        if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            const confirmed = await window.confirmModal.confirmClear();
            if (confirmed) {
                this.datasetManager.clear();
                if (window.uiManager) {
                    window.uiManager.showNotification('All data cleared successfully!', 'success');
                }
            }
        });
    }
    }

    openImportModal() {
        const importModal = document.getElementById('import-modal');
        const textImport = document.getElementById('text-import');
        
        if (importModal) importModal.classList.add('active');
        if (textImport) textImport.style.display = 'none';
    }

    closeImportModal() {
        const importModal = document.getElementById('import-modal');
        if (importModal) importModal.classList.remove('active');
    }

    handleFileImport(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (file.name.endsWith('.csv')) {
                this.importCSV(content);
            } else if (file.name.endsWith('.json') || file.name.endsWith('.jsonl')) {
                this.importJSON(content);
            }
        };
        reader.readAsText(file);
    }

    importCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const promptIndex = headers.findIndex(h => h.toLowerCase().includes('prompt') || h.toLowerCase().includes('input'));
        const completionIndex = headers.findIndex(h => h.toLowerCase().includes('completion') || h.toLowerCase().includes('output') || h.toLowerCase().includes('response'));

        if (promptIndex === -1 || completionIndex === -1) {
            if (window.uiManager) {
                window.uiManager.showNotification('CSV must have prompt/input and completion/output/response columns', 'error');
            } else {
                alert('CSV must have prompt/input and completion/output/response columns');
            }
            return;
        }

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > Math.max(promptIndex, completionIndex)) {
                this.datasetManager.add({
                    prompt: values[promptIndex],
                    completion: values[completionIndex],
                    tags: []
                });
                imported++;
            }
        }

        if (window.uiManager) {
            window.uiManager.showNotification(`Imported ${imported} pairs from CSV!`, 'success');
        }
        this.closeImportModal();
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    importJSON(content) {
        try {
            let data;
            
            if (content.trim().startsWith('[')) {
                data = JSON.parse(content);
            } else {
                data = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
            }

            let imported = 0;
            data.forEach(item => {
                if (item.prompt && item.completion) {
                    this.datasetManager.add({
                        prompt: item.prompt,
                        completion: item.completion,
                        tags: item.tags || []
                    });
                    imported++;
                }
            });

            if (window.uiManager) {
                window.uiManager.showNotification(`Imported ${imported} pairs from JSON!`, 'success');
            }
            this.closeImportModal();
        } catch (e) {
            if (window.uiManager) {
                window.uiManager.showNotification('Error parsing JSON: ' + e.message, 'error');
            } else {
                alert('Error parsing JSON: ' + e.message);
            }
        }
    }

    processTextImport() {
        const pasteArea = document.getElementById('paste-area');
        if (!pasteArea) return;
        
        const text = pasteArea.value.trim();
        if (!text) return;

        const blocks = text.split('\n\n').filter(b => b.trim());
        
        let imported = 0;
        blocks.forEach(block => {
            const lines = block.split('\n').filter(l => l.trim());
            if (lines.length >= 2) {
                this.datasetManager.add({
                    prompt: lines[0],
                    completion: lines.slice(1).join(' '),
                    tags: []
                });
                imported++;
            }
        });

        if (window.uiManager) {
            window.uiManager.showNotification(`Imported ${imported} pairs from text!`, 'success');
        }
        this.closeImportModal();
    }

    exportDataset() {
        const dataset = this.datasetManager.getAll();
        
        if (dataset.length === 0) {
            if (window.uiManager) {
                window.uiManager.showNotification('No data to export!', 'warning');
            } else {
                alert('No data to export!');
            }
            return;
        }

        // Default to JSON format since format-select might not exist
        const formatSelect = document.getElementById('format-select');
        const format = formatSelect ? formatSelect.value : 'json';
        
        const removeDuplicatesCheck = document.getElementById('remove-duplicates');
        const validateDataCheck = document.getElementById('validate-data');
        
        const removeDuplicates = removeDuplicatesCheck ? removeDuplicatesCheck.checked : false;
        const validate = validateDataCheck ? validateDataCheck.checked : true;

        let data = [...dataset];

        if (removeDuplicates) {
            const seen = new Set();
            data = data.filter(pair => {
                const key = `${pair.prompt}|${pair.completion}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        if (validate) {
            data = data.filter(pair => pair.prompt && pair.completion);
        }

        let content, filename, mimeType;

        switch(format) {
            case 'jsonl':
                content = data.map(pair => 
                    JSON.stringify({ prompt: pair.prompt, completion: pair.completion })
                ).join('\n');
                filename = 'dataset.jsonl';
                mimeType = 'application/jsonl';
                break;
                
            case 'csv':
                content = 'prompt,completion\n';
                content += data.map(pair => 
                    `"${pair.prompt.replace(/"/g, '""')}","${pair.completion.replace(/"/g, '""')}"`
                ).join('\n');
                filename = 'dataset.csv';
                mimeType = 'text/csv';
                break;
                
            case 'json':
            default:
                content = JSON.stringify(data.map(pair => ({
                    prompt: pair.prompt,
                    completion: pair.completion,
                    tags: pair.tags || []
                })), null, 2);
                filename = `dataset-${Date.now()}.json`;
                mimeType = 'application/json';
                break;
        }

        this.downloadFile(content, filename, mimeType);
        
        if (window.uiManager) {
            window.uiManager.showNotification(`Exported ${data.length} pairs successfully!`, 'success');
        }
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}