/**
 * Main application initializer
 */
class DatasetCreatorApp {
  constructor() {
    this.datasetManager = new DatasetManager();
    this.uiManager = new UIManager(this.datasetManager);

    // Only initialize ModalManager if it exists
    if (typeof ModalManager !== "undefined") {
      this.modalManager = new ModalManager(this.datasetManager);
      window.modalManager = this.modalManager;
    }

    // Only initialize ImportExportManager if it exists
    if (typeof ImportExportManager !== "undefined") {
      this.importExportManager = new ImportExportManager(this.datasetManager);
    }

    // Make UI manager globally accessible
    window.uiManager = this.uiManager;

    this.init();
  }

  init() {
    // Load existing data
    this.datasetManager.load();

    // Seed sample data if dataset is empty (for testing)
    if (this.datasetManager.getAll().length === 0) {
      this.seedSampleData();
    }

    // Initialize file handler
    if (typeof FileHandler !== "undefined") {
      window.fileHandler = new FileHandler(DataExtractor);
    }

    // Setup feature event listeners
    this.setupTransformFeature();
    this.setupAugmentFeature();
    this.setupCleanFeature();
    this.setupAnalyzeFeature();
    this.setupManualAdd();
    this.setupExport();

    console.log("Dataset Creator App initialized successfully!");
  }

  seedSampleData() {
    const samplePairs = [
      {
        prompt: "What is a function?",
        completion:
          "A function is a reusable block of code that performs a specific task.",
        tags: ["programming", "basics"],
      },
      {
        prompt: "What is a variable?",
        completion: "A variable is a container for storing data values.",
        tags: ["programming", "basics"],
      },
      {
        prompt: "What is JavaScript?",
        completion:
          "JavaScript is a high-level, interpreted programming language that is one of the core technologies of the World Wide Web.",
        tags: ["javascript", "web"],
      },
      {
        prompt: "How do you declare a variable in JavaScript?",
        completion:
          "You can declare a variable using var, let, or const keywords. For example: let myVariable = 'value';",
        tags: ["javascript", "syntax"],
      },
      {
        prompt: "What is an array?",
        completion:
          "An array is a data structure that can hold multiple values in a single variable, accessed by index.",
        tags: ["programming", "data-structures"],
      },
    ];

    samplePairs.forEach((pair) => {
      this.datasetManager.add(pair);
    });

    if (window.uiManager) {
      window.uiManager.showNotification(
        `Loaded ${samplePairs.length} sample training pairs!`,
        "success"
      );
    }
  }

  setupTransformFeature() {
    const transformBtn = document.getElementById("transform-btn");
    const previewBtn = document.getElementById("preview-transform-btn");
    const addTransformedBtn = document.getElementById("add-transformed-btn");

    if (transformBtn) {
      transformBtn.addEventListener("click", () => {
        const contentType = document.getElementById("content-type").value;
        const rawContent = document.getElementById("raw-content").value.trim();

        if (!rawContent) {
          this.uiManager.showNotification(
            "Please paste some content first!",
            "error"
          );
          return;
        }

        // Transform content based on type
        const pairs = this.transformContent(rawContent, contentType);

        if (pairs.length > 0) {
          this.uiManager.displayTransformResults(pairs);
          this.uiManager.showNotification(
            `Extracted ${pairs.length} training pairs!`,
            "success"
          );

          // Store temporarily
          this.tempTransformedPairs = pairs;
        } else {
          this.uiManager.showNotification(
            "No pairs could be extracted. Try a different format.",
            "warning"
          );
        }
      });
    }

    // Add preview button functionality
    if (previewBtn) {
      previewBtn.addEventListener("click", () => {
        const contentType = document.getElementById("content-type").value;
        const rawContent = document.getElementById("raw-content").value.trim();

        if (!rawContent) {
          this.uiManager.showNotification(
            "Please paste some content first!",
            "error"
          );
          return;
        }

        // Transform content based on type (same as transform button)
        const pairs = this.transformContent(rawContent, contentType);

        if (pairs.length > 0) {
          this.uiManager.displayTransformResults(pairs);
          this.uiManager.showNotification(
            `Preview: Found ${pairs.length} training pairs!`,
            "info"
          );

          // Store temporarily for potential adding
          this.tempTransformedPairs = pairs;
        } else {
          this.uiManager.showNotification(
            "No pairs could be extracted. Try a different format.",
            "warning"
          );
        }
      });
    }

    if (addTransformedBtn) {
      addTransformedBtn.addEventListener("click", () => {
        if (this.tempTransformedPairs && this.tempTransformedPairs.length > 0) {
          this.tempTransformedPairs.forEach((pair) => {
            this.datasetManager.add(pair);
          });
          this.uiManager.showNotification(
            `Added ${this.tempTransformedPairs.length} pairs to dataset!`,
            "success"
          );

          // Hide results and clear
          const transformResult = document.getElementById("transform-result");
          if (transformResult) transformResult.style.display = "none";

          const rawContent = document.getElementById("raw-content");
          if (rawContent) rawContent.value = "";

          this.tempTransformedPairs = null;
        }
      });
    }
  }

  transformContent(content, type) {
    // Use the smart extractor
    if (type === "auto") {
      return DataExtractor.smartExtract(content);
    }

    // Original logic for specific types
    const pairs = [];

    switch (type) {
      case "cv":
        return DataExtractor.extractFromCV(content);

      case "faq":
        return DataExtractor.extractFAQ(content);

      case "conversation":
        return DataExtractor.extractConversation(content);

      case "json":
        return DataExtractor.extractFromJSON(content);

      case "email":
        return DataExtractor.extractFromEmail(content);

      case "documentation":
      default:
        return DataExtractor.extractGeneric(content);
    }
  }

  setupAugmentFeature() {
    const generateBtn = document.getElementById("generate-variations-btn");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => {
        this.uiManager.showNotification(
          "Augmentation feature coming soon!",
          "warning"
        );
      });
    }
  }

  setupCleanFeature() {
    const cleanBtn = document.getElementById("run-cleaning-btn");
    if (cleanBtn) {
      cleanBtn.addEventListener("click", () => {
        const dataset = this.datasetManager.getAll();
        const issues = [];

        // Check for duplicates
        if (document.getElementById("remove-duplicates")?.checked) {
          const seen = new Set();
          const duplicates = [];

          dataset.forEach((pair, index) => {
            const key = `${pair.prompt}|${pair.completion}`;
            if (seen.has(key)) {
              duplicates.push(index);
            } else {
              seen.add(key);
            }
          });

          if (duplicates.length > 0) {
            issues.push({
              type: "duplicates",
              description: `Found ${duplicates.length} duplicate pair(s)`,
              affectedPairs: duplicates,
              canFix: true,
            });
          }
        }

        // Check for short responses
        if (document.getElementById("check-length")?.checked) {
          const shortPairs = [];

          dataset.forEach((pair, index) => {
            if (
              (pair.prompt && pair.prompt.length < 20) ||
              (pair.completion && pair.completion.length < 20)
            ) {
              shortPairs.push(index);
            }
          });

          if (shortPairs.length > 0) {
            issues.push({
              type: "short-text",
              description: `Found ${shortPairs.length} pair(s) with short text (<20 chars)`,
              affectedPairs: shortPairs,
              canFix: true,
            });
          }
        }

        // Check for empty fields
        const emptyPairs = [];
        dataset.forEach((pair, index) => {
          if (
            !pair.prompt ||
            !pair.prompt.trim() ||
            !pair.completion ||
            !pair.completion.trim()
          ) {
            emptyPairs.push(index);
          }
        });

        if (emptyPairs.length > 0) {
          issues.push({
            type: "empty-fields",
            description: `Found ${emptyPairs.length} pair(s) with empty fields`,
            affectedPairs: emptyPairs,
            canFix: true,
          });
        }

        if (issues.length > 0) {
          this.uiManager.displayCleaningResults(issues);
          this.uiManager.showNotification(
            "Cleaning analysis complete!",
            "success"
          );
        } else {
          this.uiManager.showNotification(
            "No issues found! Your dataset looks clean.",
            "success"
          );
        }
      });
    }
  }

  setupAnalyzeFeature() {
    const analyzeBtn = document.getElementById("analyze-btn");
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => {
        const dataset = this.datasetManager.getAll();

        if (dataset.length === 0) {
          this.uiManager.showNotification("No data to analyze!", "warning");
          return;
        }

        // Perform comprehensive analysis
        const analysis = DataAnalyzers.analyzeDataset(dataset);

        if (analysis) {
          this.uiManager.displayAnalysisResults(analysis);
          this.uiManager.showNotification("Analysis complete!", "success");
        } else {
          this.uiManager.showNotification("Error analyzing dataset", "error");
        }
      });
    }
  }

  setupManualAdd() {
    const manualAddBtn = document.getElementById("manual-add-btn");
    if (manualAddBtn && this.modalManager) {
      manualAddBtn.addEventListener("click", () => {
        this.modalManager.openAddModal();
      });
    }
  }

  setupExport() {
    const exportBtn = document.getElementById("export-dataset-btn");
    if (exportBtn && this.importExportManager) {
      exportBtn.addEventListener("click", () => {
        // Use the ImportExportManager instead of direct export
        this.importExportManager.openExportModal();
      });
    } else if (exportBtn) {
      // Fallback to direct export if ImportExportManager is not available
      exportBtn.addEventListener("click", () => {
        const dataset = this.datasetManager.getAll();
        if (dataset.length === 0) {
          this.uiManager.showNotification("No data to export!", "warning");
          return;
        }

        const json = JSON.stringify(dataset, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dataset-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.uiManager.showNotification(
          "Dataset exported successfully!",
          "success"
        );
      });
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new DatasetCreatorApp();
});
