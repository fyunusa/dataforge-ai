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
    const educationMatch = text.match(
      /EDUCATION\s+([\s\S]*?)(?=WORK EXPERIENCE|RESEARCH|$)/i
    );
    if (educationMatch) {
      const education = educationMatch[1].trim();
      pairs.push({
        prompt: "What is the candidate's educational background?",
        completion: education,
        tags: ["cv", "education"],
      });
    }

    // Extract work experience
    const workMatch = text.match(
      /WORK EXPERIENCE\s+([\s\S]*?)(?=RESEARCH|EDUCATION|$)/i
    );
    if (workMatch) {
      const work = workMatch[1].trim();
      pairs.push({
        prompt: "What is the candidate's work experience?",
        completion: work,
        tags: ["cv", "experience"],
      });
    }

    // Extract research experience
    const researchMatch = text.match(/RESEARCH\s+EXPERIENCE\s+([\s\S]*?)$/i);
    if (researchMatch) {
      const research = researchMatch[1].trim();
      pairs.push({
        prompt: "What research experience does the candidate have?",
        completion: research,
        tags: ["cv", "research"],
      });
    }

    // Extract contact info
    const emailMatch = text.match(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
    );
    const phoneMatch = text.match(/(\+?\d{10,15})/);
    const nameMatch = text.match(/^([A-Z][A-Z\s]+)\n/);

    if (nameMatch) {
      let contactInfo = `Name: ${nameMatch[1].trim()}`;
      if (emailMatch) contactInfo += `\nEmail: ${emailMatch[1]}`;
      if (phoneMatch) contactInfo += `\nPhone: ${phoneMatch[1]}`;

      pairs.push({
        prompt: "What are the candidate's contact details?",
        completion: contactInfo,
        tags: ["cv", "contact"],
      });
    }

    return pairs;
  }

  /**
   * Auto-detect content type and extract accordingly
   */
  static smartExtract(text) {
    console.log("Original Text:", text);
    // Clean the text first
    text = this.cleanText(text);

    console.log("Cleaned Text:", text);

    // Try to detect format
    const format = this.detectFormat(text);

    console.log("Detected Format:", format);

    switch (format) {
      case "cv":
        return this.extractFromCV(text);
      case "faq":
        return this.extractFAQ(text);
      case "conversation":
        return this.extractConversation(text);
      case "json":
        return this.extractFromJSON(text);
      case "email":
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
      return "cv";
    }

    // Check for FAQ format
    if (text.match(/Q:\s*.+?\s*A:/i)) {
      return "faq";
    }

    // Check for conversation format
    if (text.match(/(?:User|Human|Customer|Assistant|AI|Agent):/i)) {
      return "conversation";
    }

    // Check for JSON
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return "json";
    }

    // Check for email
    if (text.match(/From:|To:|Subject:/i)) {
      return "email";
    }

    return "generic";
  }

  /**
   * Clean messy text data
   */
  static cleanText(text) {
    return (
      text
        // Remove multiple spaces
        .replace(/[ \t]+/g, " ")
        // Remove excessive newlines (keep max 2)
        .replace(/\n{3,}/g, "\n\n")
        // Remove special characters at start of lines
        .replace(/^[•\-*]\s*/gm, "")
        // Trim each line
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        // Remove leading/trailing whitespace
        .trim()
    );
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
        tags: ["faq"],
      });
    }

    return pairs;
  }

  /**
   * Extract from conversation format
   */
  static extractConversation(text) {
    const pairs = [];
    const convRegex =
      /(?:User|Human|Customer):\s*(.+?)\s*(?:Assistant|AI|Agent):\s*(.+?)(?=(?:User|Human|Customer):|$)/gs;
    let match;

    while ((match = convRegex.exec(text)) !== null) {
      pairs.push({
        prompt: match[1].trim(),
        completion: match[2].trim(),
        tags: ["conversation"],
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

      if (text.trim().startsWith("[")) {
        data = JSON.parse(text);
      } else {
        // JSONL format
        data = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => JSON.parse(line));
      }

      return data
        .map((item) => ({
          prompt: item.prompt || item.question || item.input || "",
          completion:
            item.completion ||
            item.answer ||
            item.output ||
            item.response ||
            "",
          tags: item.tags || ["json"],
        }))
        .filter((pair) => pair.prompt && pair.completion);
    } catch (e) {
      console.error("JSON parsing error:", e);
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
        tags: ["email"],
      });
    }

    return pairs;
  }

  /**
   * Generic extraction - improved for PDF and irregular text
   */
  static extractGeneric(text) {
    const pairs = [];

    // First, try to identify sentence boundaries more intelligently
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    // console.log("Sentences Found:", sentences.length);

    // Strategy 1: Split by double newlines (traditional paragraphs)
    const paragraphs = text
      .split("\n\n")
      .filter((p) => p.trim() && p.length > 20);

    // console.log("Paragraphs Found:", paragraphs.length);

    if (paragraphs.length > 1) {
      // Create pairs from consecutive paragraphs
      for (let i = 0; i < paragraphs.length - 1; i++) {
        const prompt = paragraphs[i].trim();
        const completion = paragraphs[i + 1].trim();

        // Only add if both have substance
        if (prompt.length > 20 && completion.length > 20) {
          pairs.push({
            prompt: prompt,
            completion: completion,
            tags: ["generic", "paragraph"],
          });
        }
      }
    }

    // Strategy 2: Extract based on numbered sections (common in PDFs)
    const numberedSections = text.match(
      /(\d+\.[\d.]*\s+[^\n]+)\n([^]*?)(?=\d+\.[\d.]*\s+|$)/g
    );
    if (numberedSections && numberedSections.length > 0) {
      //   console.log("Numbered Sections Found:", numberedSections.length);

      numberedSections.forEach((section) => {
        const match = section.match(/(\d+\.[\d.]*\s+)([^\n]+)\n([^]*)/);
        if (match && match[2] && match[3]) {
          const heading = match[2].trim();
          const content = match[3].trim();

          if (content.length > 30) {
            pairs.push({
              prompt: `Explain about "${heading}"`,
              completion: content,
              tags: ["generic", "numbered-section"],
            });
          }
        }
      });
    }

    // Strategy 3: Extract based on headings (all caps or Title Case)
    const headingPattern =
      /\n([A-Z][A-Z\s]{3,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\n([^]*?)(?=\n[A-Z][A-Z\s]{3,}|\n[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|$)/g;
    let match;

    while ((match = headingPattern.exec(text)) !== null) {
      const heading = match[1].trim();
      const content = match[2].trim();

      if (content.length > 30 && !content.match(/^\d+$/)) {
        pairs.push({
          prompt: `What is explained in the section about "${heading}"?`,
          completion: content,
          tags: ["generic", "section"],
        });
      }
    }

    // Strategy 4: If we still have few pairs, try sentence-based extraction
    if (pairs.length < 3 && sentences.length > 4) {
      //   console.log("Using sentence-based extraction...");

      // Group sentences into chunks of 2-3
      for (let i = 0; i < sentences.length - 2; i += 2) {
        const prompt = sentences[i].trim();
        const completion = (
          sentences[i + 1] +
          " " +
          (sentences[i + 2] || "")
        ).trim();

        if (prompt.length > 20 && completion.length > 30) {
          pairs.push({
            prompt: prompt,
            completion: completion,
            tags: ["generic", "sentence-based"],
          });
        }
      }
    }

    // Strategy 5: Extract bullet points or list items
    const bulletPoints = text.match(/[•\-*]\s+(.+?)(?=[•\-*]|\n\n|$)/gs);
    if (bulletPoints && bulletPoints.length > 2) {
      //   console.log("Bullet Points Found:", bulletPoints.length);

      // Group bullet points
      for (let i = 0; i < bulletPoints.length - 1; i++) {
        const point1 = bulletPoints[i].replace(/^[•\-*]\s+/, "").trim();
        const point2 = bulletPoints[i + 1].replace(/^[•\-*]\s+/, "").trim();

        if (point1.length > 15 && point2.length > 15) {
          pairs.push({
            prompt: point1,
            completion: point2,
            tags: ["generic", "list-item"],
          });
        }
      }
    }

    // Strategy 6: Extract Q&A style content that might not have explicit Q: A: markers
    const questionPattern =
      /(What|How|Why|When|Where|Who|Can|Should|Is|Are|Do|Does)[^.?!]+[?]/gi;
    const questions = text.match(questionPattern);

    if (questions && questions.length > 0) {
      //   console.log("Implicit Questions Found:", questions.length);

      questions.forEach((question) => {
        const qIndex = text.indexOf(question);
        const afterQuestion = text.substring(qIndex + question.length).trim();
        const answer = afterQuestion.split(/\n\n|\. [A-Z]|[?!](?=[A-Z])/)[0];

        if (answer && answer.length > 20 && answer.length < 500) {
          pairs.push({
            prompt: question.trim(),
            completion: answer.trim(),
            tags: ["generic", "implicit-qa"],
          });
        }
      });
    }

    // Remove duplicates based on content similarity
    const uniquePairs = [];
    const seen = new Set();

    pairs.forEach((pair) => {
      const key = `${pair.prompt.substring(0, 50)}|${pair.completion.substring(
        0,
        50
      )}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePairs.push(pair);
      }
    });

    // console.log("Total Unique Pairs Extracted:", uniquePairs.length);

    return uniquePairs;
  }

  /**
   * Enhanced cleanText for PDF content
   */
  static cleanText(text) {
    return (
      text
        // Remove page numbers
        .replace(/\n\s*\d+\s*\n/g, "\n")
        // Remove headers/footers (repeated lines)
        .replace(/(.{10,})\n(?=\1)/g, "")
        // Fix hyphenated words at line breaks
        .replace(/(\w+)-\n(\w+)/g, "$1$2")
        // Remove multiple spaces
        .replace(/[ \t]+/g, " ")
        // Remove excessive newlines (keep max 2)
        .replace(/\n{3,}/g, "\n\n")
        // Remove special characters at start of lines (but keep bullet points)
        .replace(/^[^\w\s•\-*\d]\s*/gm, "")
        // Trim each line
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        // Remove leading/trailing whitespace
        .trim()
    );
  }
}