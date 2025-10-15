/**
 * Advanced Dataset Analytics
 */
class DataAnalyzers {
    
    /**
     * Comprehensive dataset analysis
     */
    static analyzeDataset(dataset) {
        if (!dataset || dataset.length === 0) {
            return null;
        }

        return {
            overview: this.getOverview(dataset),
            quality: this.assessQuality(dataset),
            diversity: this.analyzeDiversity(dataset),
            distribution: this.analyzeDistribution(dataset),
            readability: this.analyzeReadability(dataset),
            balance: this.analyzeBalance(dataset),
            trends: this.analyzeTrends(dataset),
            insights: this.generateInsights(dataset),
            recommendations: this.generateRecommendations(dataset)
        };
    }

    /**
     * Basic overview statistics
     */
    static getOverview(dataset) {
        const totalPairs = dataset.length;
        const totalPromptChars = dataset.reduce((sum, p) => sum + (p.prompt?.length || 0), 0);
        const totalCompletionChars = dataset.reduce((sum, p) => sum + (p.completion?.length || 0), 0);
        
        return {
            totalPairs,
            totalWords: Math.round((totalPromptChars + totalCompletionChars) / 5),
            avgPromptLength: Math.round(totalPromptChars / totalPairs),
            avgCompletionLength: Math.round(totalCompletionChars / totalPairs),
            totalCharacters: totalPromptChars + totalCompletionChars,
            estimatedTokens: Math.round((totalPromptChars + totalCompletionChars) / 4), // Rough estimate
            uniqueTags: new Set(dataset.flatMap(p => p.tags || [])).size
        };
    }

    /**
     * Quality assessment with scoring
     */
    static assessQuality(dataset) {
        let scores = {
            completeness: 0,
            consistency: 0,
            uniqueness: 0,
            lengthQuality: 0
        };

        // Completeness: Check for empty fields
        const completeCount = dataset.filter(p => 
            p.prompt?.trim() && p.completion?.trim()
        ).length;
        scores.completeness = (completeCount / dataset.length) * 100;

        // Consistency: Check for similar structure
        const avgPromptWords = dataset.reduce((sum, p) => 
            sum + (p.prompt?.split(' ').length || 0), 0) / dataset.length;
        const promptVariance = dataset.reduce((sum, p) => {
            const words = p.prompt?.split(' ').length || 0;
            return sum + Math.pow(words - avgPromptWords, 2);
        }, 0) / dataset.length;
        scores.consistency = Math.max(0, 100 - (Math.sqrt(promptVariance) / avgPromptWords * 100));

        // Uniqueness: Check for duplicates
        const seen = new Set();
        const unique = dataset.filter(p => {
            const key = `${p.prompt}|${p.completion}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).length;
        scores.uniqueness = (unique / dataset.length) * 100;

        // Length Quality: Check if responses are adequate
        const adequateLength = dataset.filter(p => 
            (p.prompt?.length || 0) >= 10 && 
            (p.completion?.length || 0) >= 20
        ).length;
        scores.lengthQuality = (adequateLength / dataset.length) * 100;

        const overallScore = (
            scores.completeness + 
            scores.consistency + 
            scores.uniqueness + 
            scores.lengthQuality
        ) / 4;

        return {
            scores,
            overallScore: Math.round(overallScore),
            grade: this.getGrade(overallScore),
            issues: this.identifyQualityIssues(dataset, scores)
        };
    }

    static getGrade(score) {
        if (score >= 90) return { letter: 'A+', color: '#10b981', message: 'Excellent!' };
        if (score >= 80) return { letter: 'A', color: '#10b981', message: 'Great!' };
        if (score >= 70) return { letter: 'B', color: '#3b82f6', message: 'Good' };
        if (score >= 60) return { letter: 'C', color: '#f59e0b', message: 'Fair' };
        return { letter: 'D', color: '#ef4444', message: 'Needs Work' };
    }

    /**
     * Diversity analysis
     */
    static analyzeDiversity(dataset) {
        // Unique words in prompts
        const allPromptWords = dataset.flatMap(p => 
            (p.prompt || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        const uniquePromptWords = new Set(allPromptWords);
        
        // Unique words in completions
        const allCompletionWords = dataset.flatMap(p => 
            (p.completion || '').toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        const uniqueCompletionWords = new Set(allCompletionWords);

        // Tag distribution
        const tagCounts = {};
        dataset.forEach(p => {
            (p.tags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return {
            vocabularySize: uniquePromptWords.size + uniqueCompletionWords.size,
            uniquePromptWords: uniquePromptWords.size,
            uniqueCompletionWords: uniqueCompletionWords.size,
            lexicalDiversity: ((uniquePromptWords.size + uniqueCompletionWords.size) / 
                              (allPromptWords.length + allCompletionWords.length) * 100).toFixed(2),
            tagDistribution: tagCounts,
            topWords: this.getTopWords(allPromptWords.concat(allCompletionWords), 10)
        };
    }

    static getTopWords(words, limit = 10) {
        const counts = {};
        words.forEach(w => counts[w] = (counts[w] || 0) + 1);
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
    }

    /**
     * Length distribution analysis
     */
    static analyzeDistribution(dataset) {
        const promptLengths = dataset.map(p => p.prompt?.length || 0);
        const completionLengths = dataset.map(p => p.completion?.length || 0);

        return {
            prompt: this.getDistributionStats(promptLengths),
            completion: this.getDistributionStats(completionLengths),
            histogram: this.createHistogram(completionLengths)
        };
    }

    static getDistributionStats(lengths) {
        const sorted = [...lengths].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;
        
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: Math.round(mean),
            median: sorted[Math.floor(sorted.length / 2)],
            mode: this.getMode(sorted),
            range: sorted[sorted.length - 1] - sorted[0]
        };
    }

    static getMode(arr) {
        const counts = {};
        arr.forEach(n => counts[n] = (counts[n] || 0) + 1);
        let maxCount = 0;
        let mode = arr[0];
        Object.entries(counts).forEach(([num, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mode = parseInt(num);
            }
        });
        return mode;
    }

    static createHistogram(data, bins = 5) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binSize = (max - min) / bins;
        const histogram = Array(bins).fill(0);

        data.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
            histogram[binIndex]++;
        });

        return histogram.map((count, i) => ({
            range: `${Math.round(min + i * binSize)}-${Math.round(min + (i + 1) * binSize)}`,
            count
        }));
    }

    /**
     * Readability analysis
     */
    static analyzeReadability(dataset) {
        const avgSentenceLength = dataset.reduce((sum, p) => {
            const sentences = (p.completion || '').split(/[.!?]+/).filter(s => s.trim());
            return sum + (sentences.length > 0 ? (p.completion?.split(' ').length || 0) / sentences.length : 0);
        }, 0) / dataset.length;

        const avgSyllablesPerWord = 1.5; // Simplified estimate

        // Flesch Reading Ease
        const flesch = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
        
        return {
            avgSentenceLength: Math.round(avgSentenceLength),
            fleschScore: Math.round(flesch),
            readabilityLevel: this.getReadabilityLevel(flesch),
            complexity: avgSentenceLength > 20 ? 'Complex' : avgSentenceLength > 15 ? 'Moderate' : 'Simple'
        };
    }

    static getReadabilityLevel(score) {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        return 'Difficult';
    }

    /**
     * Balance analysis
     */
    static analyzeBalance(dataset) {
        const ratios = dataset.map(p => {
            const pLen = p.prompt?.length || 1;
            const cLen = p.completion?.length || 1;
            return cLen / pLen;
        });

        const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        
        return {
            avgCompletionToPromptRatio: avgRatio.toFixed(2),
            balanceScore: this.getBalanceScore(avgRatio),
            recommendation: avgRatio < 2 ? 'Completions are too short' : 
                          avgRatio > 10 ? 'Completions might be too long' : 'Well balanced'
        };
    }

    static getBalanceScore(ratio) {
        // Ideal ratio is between 3-7
        if (ratio >= 3 && ratio <= 7) return 100;
        if (ratio >= 2 && ratio <= 10) return 80;
        if (ratio >= 1.5 && ratio <= 15) return 60;
        return 40;
    }

    /**
     * Trend analysis
     */
    static analyzeTrends(dataset) {
        // Assuming data is ordered chronologically
        const chunks = 5;
        const chunkSize = Math.ceil(dataset.length / chunks);
        const trends = [];

        for (let i = 0; i < chunks && i * chunkSize < dataset.length; i++) {
            const chunk = dataset.slice(i * chunkSize, (i + 1) * chunkSize);
            trends.push({
                period: `Batch ${i + 1}`,
                avgLength: Math.round(chunk.reduce((sum, p) => 
                    sum + (p.completion?.length || 0), 0) / chunk.length),
                count: chunk.length
            });
        }

        return trends;
    }

    /**
     * Generate actionable insights
     */
    static generateInsights(dataset) {
        const insights = [];
        const quality = this.assessQuality(dataset);
        const diversity = this.analyzeDiversity(dataset);
        const overview = this.getOverview(dataset);

        if (dataset.length < 50) {
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                message: `Your dataset has only ${dataset.length} pairs. Consider adding at least 50-100 pairs for better model training.`
            });
        }

        if (quality.scores.uniqueness < 95) {
            insights.push({
                type: 'info',
                icon: 'fa-clone',
                message: `Found duplicate pairs. Run the cleaning tool to remove them.`
            });
        }

        if (parseFloat(diversity.lexicalDiversity) < 30) {
            insights.push({
                type: 'warning',
                icon: 'fa-book',
                message: `Low vocabulary diversity (${diversity.lexicalDiversity}%). Try adding more varied examples.`
            });
        }

        if (overview.avgCompletionLength < 50) {
            insights.push({
                type: 'warning',
                icon: 'fa-text-height',
                message: `Average completion length is quite short. Consider adding more detailed responses.`
            });
        }

        if (insights.length === 0) {
            insights.push({
                type: 'success',
                icon: 'fa-check-circle',
                message: `Your dataset looks great! It's well-balanced and ready for training.`
            });
        }

        return insights;
    }

    /**
     * Generate recommendations
     */
    static generateRecommendations(dataset) {
        const recommendations = [];
        const quality = this.assessQuality(dataset);
        const overview = this.getOverview(dataset);

        if (dataset.length < 100) {
            recommendations.push({
                priority: 'high',
                title: 'Increase Dataset Size',
                description: `Add ${100 - dataset.length} more training pairs for better model performance.`,
                action: 'Use the Transform or Augment features to generate more data.'
            });
        }

        if (quality.overallScore < 70) {
            recommendations.push({
                priority: 'high',
                title: 'Improve Data Quality',
                description: `Your quality score is ${quality.overallScore}%. Focus on completeness and consistency.`,
                action: 'Run the cleaning tool and review flagged pairs.'
            });
        }

        if (overview.uniqueTags < 3) {
            recommendations.push({
                priority: 'medium',
                title: 'Add More Tags',
                description: 'Tags help organize and analyze your dataset.',
                action: 'Edit pairs and add relevant category tags.'
            });
        }

        return recommendations;
    }

    static identifyQualityIssues(dataset, scores) {
        const issues = [];
        
        if (scores.completeness < 100) {
            issues.push('Some pairs have empty fields');
        }
        if (scores.uniqueness < 100) {
            issues.push('Dataset contains duplicates');
        }
        if (scores.lengthQuality < 80) {
            issues.push('Some responses are too short');
        }
        
        return issues;
    }
}