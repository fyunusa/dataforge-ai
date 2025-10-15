/**
 * Advanced data extraction and cleaning utilities
 */
class DataExtractor {
    
    /**
     * Extract structured data from CV/Resume
     */
    static extractFromCV(text) {
        const pairs = [];
        
        // Extract education section
        const educationMatch = text.match(/EDUCATION\s+([\s\S]*?)(?=WORK EXPERIENCE|RESEARCH|$)/i);
        if (educationMatch) {
            const education = educationMatch[1].trim();
            pairs.push({
                prompt: "What is the candidate's educational background?",
                completion: education,
                tags: ['cv', 'education']
            });
        }
        
        // Extract work experience
        const workMatch = text.match(/WORK EXPERIENCE\s+([\s\S]*?)(?=RESEARCH|EDUCATION|$)/i);
        if (workMatch) {
            const work = workMatch[1].trim();
            pairs.push({
                prompt: "What is the candidate's work experience?",
                completion: work,
                tags: ['cv', 'experience']
            });
        }
        
        // Extract research experience
        const researchMatch = text.match(/RESEARCH\s+EXPERIENCE\s+([\s\S]*?)$/i);
        if (researchMatch) {
            const research = researchMatch[1].trim();
            pairs.push({
                prompt: "What research experience does the candidate have?",
                completion: research,
                tags: ['cv', 'research']
            });
        }
        
        // Extract contact info
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        const phoneMatch = text.match(/(\+?\d{10,15})/);
        const nameMatch = text.match(/^([A-Z][A-Z\s]+)\n/);
        
        if (nameMatch) {
            let contactInfo = `Name: ${nameMatch[1].trim()}`;
            if (emailMatch) contactInfo += `\nEmail: ${emailMatch[1]}`;
            if (phoneMatch) contactInfo += `\nPhone: ${phoneMatch[1]}`;
            
            pairs.push({
                prompt: "What are the candidate's contact details?",
                completion: contactInfo,
                tags: ['cv', 'contact']
            });
        }
        
        return pairs;
    }
    
    /**
     * Auto-detect content type and extract accordingly
     */
    static smartExtract(text) {
        // Clean the text first
        text = this.cleanText(text);
        
        // Try to detect format
        const format = this.detectFormat(text);
        
        switch(format) {
            case 'cv':
                return this.extractFromCV(text);
            case 'faq':
                return this.extractFAQ(text);
            case 'conversation':
                return this.extractConversation(text);
            case 'json':
                return this.extractFromJSON(text);
            case 'email':
                return this.extractFromEmail(text);
            default:
                return this.extractGeneric(text);
        }
    }
    
    /**
     * Detect the format of the input text
     */
    static detectFormat(text) {
        // Check for CV/Resume indicators
        if (text.match(/EDUCATION|WORK EXPERIENCE|RESEARCH EXPERIENCE|SKILLS/i)) {
            return 'cv';
        }
        
        // Check for FAQ format
        if (text.match(/Q:\s*.+?\s*A:/i)) {
            return 'faq';
        }
        
        // Check for conversation format
        if (text.match(/(?:User|Human|Customer|Assistant|AI|Agent):/i)) {
            return 'conversation';
        }
        
        // Check for JSON
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            return 'json';
        }
        
        // Check for email
        if (text.match(/From:|To:|Subject:/i)) {
            return 'email';
        }
        
        return 'generic';
    }
    
    /**
     * Clean messy text data
     */
    static cleanText(text) {
        return text
            // Remove multiple spaces
            .replace(/[ \t]+/g, ' ')
            // Remove excessive newlines (keep max 2)
            .replace(/\n{3,}/g, '\n\n')
            // Remove special characters at start of lines
            .replace(/^[•\-*]\s*/gm, '')
            // Trim each line
            .split('\n').map(line => line.trim()).join('\n')
            // Remove leading/trailing whitespace
            .trim();
    }
    
    /**
     * Extract from FAQ format
     */
    static extractFAQ(text) {
        const pairs = [];
        const faqRegex = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs;
        let match;
        
        while ((match = faqRegex.exec(text)) !== null) {
            pairs.push({
                prompt: match[1].trim(),
                completion: match[2].trim(),
                tags: ['faq']
            });
        }
        
        return pairs;
    }
    
    /**
     * Extract from conversation format
     */
    static extractConversation(text) {
        const pairs = [];
        const convRegex = /(?:User|Human|Customer):\s*(.+?)\s*(?:Assistant|AI|Agent):\s*(.+?)(?=(?:User|Human|Customer):|$)/gs;
        let match;
        
        while ((match = convRegex.exec(text)) !== null) {
            pairs.push({
                prompt: match[1].trim(),
                completion: match[2].trim(),
                tags: ['conversation']
            });
        }
        
        return pairs;
    }
    
    /**
     * Extract from JSON/JSONL
     */
    static extractFromJSON(text) {
        try {
            let data;
            
            if (text.trim().startsWith('[')) {
                data = JSON.parse(text);
            } else {
                // JSONL format
                data = text.split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));
            }
            
            return data.map(item => ({
                prompt: item.prompt || item.question || item.input || '',
                completion: item.completion || item.answer || item.output || item.response || '',
                tags: item.tags || ['json']
            })).filter(pair => pair.prompt && pair.completion);
            
        } catch (e) {
            console.error('JSON parsing error:', e);
            return [];
        }
    }
    
    /**
     * Extract from email format
     */
    static extractFromEmail(text) {
        const pairs = [];
        
        const subjectMatch = text.match(/Subject:\s*(.+)/i);
        const bodyMatch = text.match(/\n\n([\s\S]+)$/);
        
        if (subjectMatch && bodyMatch) {
            pairs.push({
                prompt: `Email about: ${subjectMatch[1].trim()}`,
                completion: bodyMatch[1].trim(),
                tags: ['email']
            });
        }
        
        return pairs;
    }
    
    /**
     * Generic extraction - split by paragraphs
     */
    static extractGeneric(text) {
        const pairs = [];
        const paragraphs = text.split('\n\n').filter(p => p.trim() && p.length > 20);
        
        // Create pairs from consecutive paragraphs
        for (let i = 0; i < paragraphs.length - 1; i++) {
            pairs.push({
                prompt: paragraphs[i].trim(),
                completion: paragraphs[i + 1].trim(),
                tags: ['generic']
            });
        }
        
        // If we have sections with headings, extract those
        const sections = text.split(/\n([A-Z][A-Z\s]{2,})\n/).filter(s => s.trim());
        for (let i = 0; i < sections.length - 1; i += 2) {
            if (sections[i + 1]) {
                pairs.push({
                    prompt: `What about ${sections[i].trim().toLowerCase()}?`,
                    completion: sections[i + 1].trim(),
                    tags: ['section']
                });
            }
        }
        
        return pairs;
    }
}