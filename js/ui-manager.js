/**
 * Handles UI rendering and updates
 */
class UIManager {
  constructor(datasetManager) {
    this.datasetManager = datasetManager;

    // Only get elements that exist in the DOM
    this.elements = {
      datasetList: document.getElementById("dataset-list"),
      pairCount: document.getElementById("pair-count"),
    };

    // Subscribe to dataset changes
    this.datasetManager.subscribe(() => {
      this.updateStats();
      this.renderDatasetList();
    });

    // Setup tab switching
    this.setupTabSwitching();
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;

        // Remove active class from all tabs and contents
        tabButtons.forEach((b) => b.classList.remove("active"));
        tabContents.forEach((c) => c.classList.remove("active"));

        // Add active class to clicked tab and corresponding content
        btn.classList.add("active");
        document.getElementById(`${tabName}-tab`).classList.add("active");
      });
    });
  }

  renderDatasetList() {
    const dataset = this.datasetManager.getAll();

    if (!this.elements.datasetList) return;

    if (dataset.length === 0) {
      this.elements.datasetList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No data pairs yet</h3>
                <p>Start by transforming content, augmenting data, or adding pairs manually</p>
            </div>
        `;
    } else {
      this.elements.datasetList.innerHTML = dataset
        .map((pair, index) => {
          const maxLength = 200; // Maximum characters before truncation
          const promptTruncated = (pair.prompt || "").length > maxLength;
          const completionTruncated =
            (pair.completion || "").length > maxLength;

          return `
                <div class="data-pair">
                    <div class="pair-header">
                        <span class="pair-number">#${index + 1}</span>
                        <div class="pair-actions">
                            <button class="edit-btn" data-index="${index}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" data-index="${index}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="pair-content">
                        <div class="pair-label">Prompt:</div>
                        <div class="pair-text ${
                          promptTruncated ? "truncated" : ""
                        }" data-index="${index}" data-type="prompt">
                            ${this.escapeHtml(
                              promptTruncated
                                ? (pair.prompt || "").substring(0, maxLength) +
                                    "..."
                                : pair.prompt || ""
                            )}
                            ${
                              promptTruncated
                                ? `
                                <button class="expand-btn" data-index="${index}" data-type="prompt">
                                    <i class="fas fa-chevron-down"></i> Show more
                                </button>
                            `
                                : ""
                            }
                        </div>
                        <div class="pair-label">Completion:</div>
                        <div class="pair-text ${
                          completionTruncated ? "truncated" : ""
                        }" data-index="${index}" data-type="completion">
                            ${this.escapeHtml(
                              completionTruncated
                                ? (pair.completion || "").substring(
                                    0,
                                    maxLength
                                  ) + "..."
                                : pair.completion || ""
                            )}
                            ${
                              completionTruncated
                                ? `
                                <button class="expand-btn" data-index="${index}" data-type="completion">
                                    <i class="fas fa-chevron-down"></i> Show more
                                </button>
                            `
                                : ""
                            }
                        </div>
                        ${
                          pair.tags && pair.tags.length > 0
                            ? `
                            <div class="pair-tags">
                                ${pair.tags
                                  .map(
                                    (tag) =>
                                      `<span class="tag">${this.escapeHtml(
                                        tag
                                      )}</span>`
                                  )
                                  .join("")}
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `;
        })
        .join("");

      // Attach event listeners to dynamically created buttons
      this.attachDatasetListeners();
    }
  }

  attachDatasetListeners() {
    const dataset = this.datasetManager.getAll();

    // Edit buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        if (window.modalManager) {
          window.modalManager.openEditModal(index);
        }
      });
    });

    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        const pair = this.datasetManager.get(index);
        const itemName = pair.prompt
          ? `"${pair.prompt.substring(0, 30)}..."`
          : "this pair";

        const confirmed = await window.confirmModal.confirmDelete(itemName);
        if (confirmed) {
          this.datasetManager.delete(index);
          this.showNotification("Pair deleted successfully!", "success");
        }
      });
    });

    // Expand/Collapse buttons
    document.querySelectorAll(".expand-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        const type = e.currentTarget.dataset.type;
        const pair = dataset[index];
        const pairText = e.currentTarget.closest(".pair-text");
        const isExpanded = pairText.classList.contains("expanded");

        if (isExpanded) {
          // Collapse
          const maxLength = 200;
          const text = type === "prompt" ? pair.prompt : pair.completion;
          pairText.innerHTML = `
                    ${this.escapeHtml(text.substring(0, maxLength) + "...")}
                    <button class="expand-btn" data-index="${index}" data-type="${type}">
                        <i class="fas fa-chevron-down"></i> Show more
                    </button>
                `;
          pairText.classList.remove("expanded");
        } else {
          // Expand
          const text = type === "prompt" ? pair.prompt : pair.completion;
          pairText.innerHTML = `
                    ${this.escapeHtml(text)}
                    <button class="expand-btn" data-index="${index}" data-type="${type}">
                        <i class="fas fa-chevron-up"></i> Show less
                    </button>
                `;
          pairText.classList.add("expanded");
        }

        // Re-attach listeners after DOM update
        this.attachDatasetListeners();
      });
    });
  }

  updateStats() {
    const stats = this.datasetManager.getStats();

    if (this.elements.pairCount) {
      this.elements.pairCount.textContent = stats.total;
    }
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `message message-${type}`;
    notification.innerHTML = `
            <i class="fas fa-${
              type === "success"
                ? "check-circle"
                : type === "error"
                ? "exclamation-circle"
                : "info-circle"
            }"></i>
            ${message}
        `;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Helper methods for the new features
  displayTransformResults(pairs) {
    const resultSection = document.getElementById("transform-result");
    const extractedPairs = document.getElementById("extracted-pairs");

    if (!resultSection || !extractedPairs) return;

    if (pairs.length === 0) {
      extractedPairs.innerHTML =
        "<p>No pairs could be extracted from the content.</p>";
    } else {
      extractedPairs.innerHTML = pairs
        .map(
          (pair, index) => `
                <div class="data-pair" style="margin-bottom: 1rem;">
                    <div class="pair-header">
                        <span class="pair-number">#${index + 1}</span>
                    </div>
                    <div class="pair-content">
                        <div class="pair-label">Prompt:</div>
                        <div class="pair-text">${this.escapeHtml(
                          pair.prompt
                        )}</div>
                        <div class="pair-label">Completion:</div>
                        <div class="pair-text">${this.escapeHtml(
                          pair.completion
                        )}</div>
                    </div>
                </div>
            `
        )
        .join("");
    }

    resultSection.style.display = "block";
  }

  displayCleaningResults(results) {
    const resultsSection = document.getElementById("cleaning-results");
    const issuesFound = document.getElementById("issues-found");

    if (!resultsSection || !issuesFound) return;

    issuesFound.innerHTML = `
        <h5>Issues Found:</h5>
        <div class="issues-list">
            ${results
              .map(
                (result) => `
                <div class="issue-item">
                    <div class="issue-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>${result.type}</strong>
                    </div>
                    <p>${result.description}</p>
                    ${
                      result.affectedPairs && result.affectedPairs.length > 0
                        ? `
                        <div class="affected-pairs">
                            <span class="affected-label">Affected pairs:</span>
                            <div class="pair-badges">
                                ${result.affectedPairs
                                  .map(
                                    (index) => `
                                    <button class="pair-badge" data-index="${index}" title="Jump to pair #${
                                      index + 1
                                    }">
                                        #${index + 1}
                                    </button>
                                `
                                  )
                                  .join("")}
                            </div>
                            ${
                              result.canFix
                                ? `
                                <button class="btn btn-sm btn-primary fix-issues-btn" data-issue-type="${result.type}">
                                    <i class="fas fa-magic"></i> Auto-fix
                                </button>
                            `
                                : ""
                            }
                        </div>
                    `
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>
    `;

    resultsSection.style.display = "block";

    // Attach event listeners to pair badges
    document.querySelectorAll(".pair-badge").forEach((badge) => {
      badge.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.highlightPair(index);
      });
    });

    // Attach event listeners to fix buttons
    document.querySelectorAll(".fix-issues-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const issueType = e.currentTarget.dataset.issueType;
        this.autoFixIssues(issueType);
      });
    });
  }

  highlightPair(index) {
    // Scroll to the pair and highlight it
    const datasetList = document.getElementById("dataset-list");
    if (!datasetList) return;

    const pairs = datasetList.querySelectorAll(".data-pair");
    if (pairs[index]) {
      // Remove previous highlights
      pairs.forEach((p) => p.classList.remove("highlighted"));

      // Scroll to and highlight the target pair
      pairs[index].scrollIntoView({ behavior: "smooth", block: "center" });
      pairs[index].classList.add("highlighted");

      // Remove highlight after 3 seconds
      setTimeout(() => {
        pairs[index].classList.remove("highlighted");
      }, 3000);

      this.showNotification(`Jumped to pair #${index + 1}`, "info");
    }
  }

  autoFixIssues(issueType) {
    const dataset = this.datasetManager.getAll();
    let fixed = 0;

    switch (issueType) {
      case "duplicates":
        // Remove duplicates
        const seen = new Set();
        const uniqueDataset = dataset.filter((pair) => {
          const key = `${pair.prompt}|${pair.completion}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        fixed = dataset.length - uniqueDataset.length;

        // Clear and re-add unique pairs
        this.datasetManager.clear();
        uniqueDataset.forEach((pair) => this.datasetManager.add(pair));
        break;

      case "short-text":
        // Remove pairs with very short text
        const filtered = dataset.filter((pair, index) => {
          const isShort =
            (pair.prompt && pair.prompt.length < 20) ||
            (pair.completion && pair.completion.length < 20);
          return !isShort;
        });

        fixed = dataset.length - filtered.length;

        // Clear and re-add filtered pairs
        this.datasetManager.clear();
        filtered.forEach((pair) => this.datasetManager.add(pair));
        break;

      case "empty-fields":
        // Remove pairs with empty fields
        const cleaned = dataset.filter(
          (pair) =>
            pair.prompt &&
            pair.prompt.trim() &&
            pair.completion &&
            pair.completion.trim()
        );

        fixed = dataset.length - cleaned.length;

        // Clear and re-add cleaned pairs
        this.datasetManager.clear();
        cleaned.forEach((pair) => this.datasetManager.add(pair));
        break;
    }

    if (fixed > 0) {
      this.showNotification(`Fixed ${fixed} issue(s)!`, "success");

      // Hide cleaning results
      const resultsSection = document.getElementById("cleaning-results");
      if (resultsSection) resultsSection.style.display = "none";
    } else {
      this.showNotification("No issues to fix!", "info");
    }
  }

  displayAnalysisResults(analysis) {
    // Update Quality Metrics
    const qualityMetrics = document.getElementById('quality-metrics');
    if (qualityMetrics) {
        qualityMetrics.innerHTML = `
            <div class="quality-score-card">
                <div class="score-circle" style="--score: ${analysis.quality.overallScore}; --color: ${analysis.quality.grade.color}">
                    <div class="score-value">${analysis.quality.overallScore}</div>
                    <div class="score-label">${analysis.quality.grade.letter}</div>
                </div>
                <p class="score-message">${analysis.quality.grade.message}</p>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-item">
                    <i class="fas fa-check-circle"></i>
                    <span class="metric-label">Completeness</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${analysis.quality.scores.completeness}%"></div>
                    </div>
                    <span class="metric-value">${Math.round(analysis.quality.scores.completeness)}%</span>
                </div>
                
                <div class="metric-item">
                    <i class="fas fa-balance-scale"></i>
                    <span class="metric-label">Consistency</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${analysis.quality.scores.consistency}%"></div>
                    </div>
                    <span class="metric-value">${Math.round(analysis.quality.scores.consistency)}%</span>
                </div>
                
                <div class="metric-item">
                    <i class="fas fa-fingerprint"></i>
                    <span class="metric-label">Uniqueness</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${analysis.quality.scores.uniqueness}%"></div>
                    </div>
                    <span class="metric-value">${Math.round(analysis.quality.scores.uniqueness)}%</span>
                </div>
                
                <div class="metric-item">
                    <i class="fas fa-text-height"></i>
                    <span class="metric-label">Length Quality</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${analysis.quality.scores.lengthQuality}%"></div>
                    </div>
                    <span class="metric-value">${Math.round(analysis.quality.scores.lengthQuality)}%</span>
                </div>
            </div>

            <div class="overview-stats">
                <div class="stat-card">
                    <i class="fas fa-database"></i>
                    <div class="stat-value">${analysis.overview.totalPairs}</div>
                    <div class="stat-label">Total Pairs</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-coins"></i>
                    <div class="stat-value">${analysis.overview.estimatedTokens.toLocaleString()}</div>
                    <div class="stat-label">Est. Tokens</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-book"></i>
                    <div class="stat-value">${analysis.diversity.vocabularySize}</div>
                    <div class="stat-label">Vocabulary</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-tags"></i>
                    <div class="stat-value">${analysis.overview.uniqueTags}</div>
                    <div class="stat-label">Unique Tags</div>
                </div>
            </div>
        `;
    }

    // Update Coverage Analysis (Topic Coverage)
    const topicCoverageChart = document.getElementById('topic-coverage-chart');
    if (topicCoverageChart && analysis.diversity) {
        const container = topicCoverageChart.parentElement;
        const tagDistribution = analysis.diversity.tagDistribution;
        const topWords = analysis.diversity.topWords || [];
        
        if (Object.keys(tagDistribution).length > 0) {
            const totalTags = Object.values(tagDistribution).reduce((a, b) => a + b, 0);
            
            container.innerHTML = `
                <h4>Coverage Analysis</h4>
                <div class="coverage-section">
                    <h5>Tag Distribution</h5>
                    <div class="tag-coverage">
                        ${Object.entries(tagDistribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([tag, count]) => {
                                const percentage = ((count / totalTags) * 100).toFixed(1);
                                return `
                                    <div class="tag-coverage-item">
                                        <div class="tag-coverage-header">
                                            <span class="tag-name">
                                                <i class="fas fa-tag"></i> ${this.escapeHtml(tag)}
                                            </span>
                                            <span class="tag-count">${count} pairs (${percentage}%)</span>
                                        </div>
                                        <div class="tag-coverage-bar">
                                            <div class="tag-coverage-fill" style="width: ${percentage}%"></div>
                                        </div>
                                    </div>
                                `;
                            })
                            .join('')}
                    </div>
                    
                    ${topWords.length > 0 ? `
                        <h5 style="margin-top: 2rem;">Top Keywords</h5>
                        <div class="top-words-cloud">
                            ${topWords.map(({ word, count }) => {
                                const size = Math.min(2.5, 1 + (count / topWords[0].count));
                                return `
                                    <span class="word-badge" style="font-size: ${size}rem" title="${count} occurrences">
                                        ${this.escapeHtml(word)}
                                    </span>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            container.innerHTML = `
                <h4>Coverage Analysis</h4>
                <div class="empty-analysis">
                    <i class="fas fa-tags"></i>
                    <p>No tags found. Add tags to your training pairs to see coverage analysis.</p>
                </div>
            `;
        }
    }

    // Update Length Distribution
    const lengthDistChart = document.getElementById('length-distribution-chart');
    if (lengthDistChart && analysis.distribution) {
        const container = lengthDistChart.parentElement;
        container.innerHTML = `
            <h4>Length Distribution</h4>
            <div class="distribution-stats">
                <div class="stat-row">
                    <span class="stat-name">Prompt Length:</span>
                    <div class="stat-details">
                        <span class="stat-badge">Min: ${analysis.distribution.prompt.min}</span>
                        <span class="stat-badge">Avg: ${analysis.distribution.prompt.mean}</span>
                        <span class="stat-badge">Max: ${analysis.distribution.prompt.max}</span>
                    </div>
                </div>
                <div class="stat-row">
                    <span class="stat-name">Completion Length:</span>
                    <div class="stat-details">
                        <span class="stat-badge">Min: ${analysis.distribution.completion.min}</span>
                        <span class="stat-badge">Avg: ${analysis.distribution.completion.mean}</span>
                        <span class="stat-badge">Max: ${analysis.distribution.completion.max}</span>
                    </div>
                </div>
            </div>
            
            <div class="histogram-chart">
                <h5>Completion Length Distribution</h5>
                ${analysis.distribution.histogram.map(bin => {
                    const maxCount = Math.max(...analysis.distribution.histogram.map(b => b.count));
                    const percentage = (bin.count / maxCount) * 100;
                    return `
                        <div class="histogram-bar">
                            <div class="bar-label">${bin.range} chars</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="bar-count">${bin.count} pairs</div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="readability-section">
                <h5>Readability Analysis</h5>
                <div class="readability-metrics">
                    <div class="readability-item">
                        <i class="fas fa-book-open"></i>
                        <div>
                            <strong>Reading Level:</strong>
                            <span>${analysis.readability.readabilityLevel}</span>
                        </div>
                    </div>
                    <div class="readability-item">
                        <i class="fas fa-gauge"></i>
                        <div>
                            <strong>Flesch Score:</strong>
                            <span>${analysis.readability.fleschScore}</span>
                        </div>
                    </div>
                    <div class="readability-item">
                        <i class="fas fa-layer-group"></i>
                        <div>
                            <strong>Complexity:</strong>
                            <span>${analysis.readability.complexity}</span>
                        </div>
                    </div>
                    <div class="readability-item">
                        <i class="fas fa-comments"></i>
                        <div>
                            <strong>Avg Sentence Length:</strong>
                            <span>${analysis.readability.avgSentenceLength} words</span>
                        </div>
                    </div>
                </div>
                
                <div class="balance-info">
                    <h5>Content Balance</h5>
                    <p>
                        <strong>Completion to Prompt Ratio:</strong> 
                        ${analysis.balance.avgCompletionToPromptRatio}:1
                    </p>
                    <p class="balance-recommendation">
                        <i class="fas fa-info-circle"></i> ${analysis.balance.recommendation}
                    </p>
                    <div class="balance-score-bar">
                        <div class="balance-score-fill" style="width: ${analysis.balance.balanceScore}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Update Recommendations
    const recommendations = document.getElementById('recommendations');
    if (recommendations) {
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            recommendations.innerHTML = `
                ${analysis.recommendations.map(rec => `
                    <div class="recommendation-card priority-${rec.priority}">
                        <div class="rec-header">
                            <i class="fas fa-lightbulb"></i>
                            <strong>${rec.title}</strong>
                        </div>
                        <p>${rec.description}</p>
                        <div class="rec-action">
                            <i class="fas fa-arrow-right"></i> ${rec.action}
                        </div>
                    </div>
                `).join('')}
                
                ${analysis.insights && analysis.insights.length > 0 ? `
                    <div class="insights-section">
                        <h5>Key Insights</h5>
                        ${analysis.insights.map(insight => `
                            <div class="insight-item ${insight.type}">
                                <i class="fas ${insight.icon}"></i>
                                <p>${insight.message}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
        } else {
            recommendations.innerHTML = `
                <div class="no-recommendations">
                    <i class="fas fa-check-circle"></i> 
                    No recommendations - your dataset looks great!
                </div>
            `;
        }
    }
}
}
