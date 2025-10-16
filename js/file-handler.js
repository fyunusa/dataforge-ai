/**
 * Handles file uploads and processing
 */
class FileHandler {
    constructor(dataExtractor) {
        this.dataExtractor = dataExtractor;
        this.fileInput = document.getElementById('file-upload');
        this.uploadBtn = document.getElementById('upload-btn');
        this.fileNameDisplay = document.querySelector('.file-name');
        this.contentTextarea = document.getElementById('raw-content');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Update file name display when a file is selected
        this.fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || '';
            this.fileNameDisplay.textContent = fileName ? fileName : '';
        });
        
        // Process file when upload button is clicked
        this.uploadBtn.addEventListener('click', () => {
            this.processFile();
        });
    }
    
    async processFile() {
        const file = this.fileInput.files[0];
        if (!file) {
            window.uiManager.showNotification('Please select a file first', 'error');
            return;
        }
        
        // Add loading state
        const uploadSection = document.querySelector('.file-upload-section');
        uploadSection.classList.add('processing');
        
        try {
            // Show processing notification
            window.uiManager.showNotification(`Processing ${file.name}...`, 'info');
            
            // Extract text from the file based on type
            const text = await this.extractTextFromFile(file);
            
            // Set the extracted text to the textarea
            this.contentTextarea.value = text;
            
            // Auto-select the file type in the dropdown
            const contentTypeDropdown = document.getElementById('content-type');
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            switch (fileExtension) {
                case 'pdf':
                    contentTypeDropdown.value = 'documentation';
                    break;
                case 'json':
                    contentTypeDropdown.value = 'json';
                    break;
                case 'csv':
                    contentTypeDropdown.value = 'auto';
                    break;
                case 'md':
                    contentTypeDropdown.value = 'documentation';
                    break;
                case 'doc':
                case 'docx':
                    contentTypeDropdown.value = 'documentation';
                    break;
                default:
                    contentTypeDropdown.value = 'auto';
            }
            
            // Show success notification
            window.uiManager.showNotification('File processed successfully!', 'success');
            
            // Auto-trigger transform if it's a known format
            if (['json', 'csv', 'pdf'].includes(fileExtension)) {
                document.getElementById('transform-btn').click();
            }
            
        } catch (error) {
            console.error('File processing error:', error);
            window.uiManager.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            // Remove loading state
            uploadSection.classList.remove('processing');
        }
    }
    
    async extractTextFromFile(file) {
        const fileType = file.type;
        const reader = new FileReader();
        
        // For PDF files
        if (fileType === 'application/pdf') {
            return new Promise((resolve, reject) => {
                // Use PDF.js to extract text from PDF
                const fileReader = new FileReader();
                
                fileReader.onload = async (event) => {
                    try {
                        // Make sure PDF.js is loaded
                        if (!window.pdfjsLib) {
                            // Load PDF.js dynamically if not already loaded
                            await this.loadPDFJS();
                        }
                        
                        const typedArray = new Uint8Array(event.target.result);
                        const pdf = await pdfjsLib.getDocument(typedArray).promise;
                        let text = '';
                        
                        // Extract text from each page
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const pageText = content.items.map(item => item.str).join(' ');
                            text += pageText + '\n\n';
                        }
                        
                        resolve(text);
                    } catch (error) {
                        reject(new Error('Failed to extract text from PDF: ' + error.message));
                    }
                };
                
                fileReader.onerror = () => reject(new Error('Failed to read file'));
                fileReader.readAsArrayBuffer(file);
            });
        }
        
        // For text files
        else if (fileType === 'text/plain' || fileType === 'text/csv' || 
                fileType === 'application/json' || fileType === 'text/markdown' ||
                file.name.endsWith('.md')) {
            return new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }
        
        // For Word documents
        else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                fileType === 'application/msword') {
            // For Word docs we'd need a specialized library like mammoth.js
            // For now we'll just show a message that it's not supported directly
            throw new Error('Word documents are not fully supported yet. Please copy and paste the content instead.');
        }
        
        // Unsupported file type
        else {
            throw new Error(`Unsupported file type: ${fileType}`);
        }
    }
    
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            // Load PDF.js scripts
            const pdfScript = document.createElement('script');
            pdfScript.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';
            pdfScript.onload = () => {
                // Configure worker
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
                resolve();
            };
            pdfScript.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(pdfScript);
        });
    }
}