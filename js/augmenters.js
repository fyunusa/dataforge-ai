/**
 * Advanced data augmentation techniques for NLP datasets
 */
class DataAugmenters {
  /**
   * Synonym replacement - replaces random words with their synonyms
   */
  static synonymReplacement(text, replacementRate = 0.3) {
    // Common English synonyms for frequently used words
    const synonymMap = {
      // Verbs
      create: ["make", "generate", "produce", "form", "develop"],
      use: ["utilize", "employ", "apply", "leverage", "operate"],
      make: ["create", "build", "form", "construct", "produce"],
      get: ["obtain", "acquire", "receive", "gain", "fetch"],
      find: ["discover", "locate", "identify", "uncover", "detect"],
      change: ["modify", "alter", "adjust", "transform", "vary"],
      improve: ["enhance", "upgrade", "refine", "boost", "strengthen"],
      increase: ["grow", "rise", "expand", "enhance", "raise"],
      decrease: ["reduce", "lower", "diminish", "lessen", "shrink"],
      help: ["assist", "aid", "support", "facilitate", "enable"],

      // Adjectives
      good: ["great", "excellent", "fine", "quality", "superior"],
      bad: ["poor", "inferior", "substandard", "inadequate", "faulty"],
      big: ["large", "huge", "substantial", "enormous", "significant"],
      small: ["tiny", "little", "compact", "minor", "miniature"],
      important: ["significant", "crucial", "essential", "critical", "vital"],
      different: [
        "diverse",
        "distinct",
        "various",
        "alternative",
        "dissimilar",
      ],
      simple: ["easy", "straightforward", "uncomplicated", "basic", "plain"],
      complex: [
        "complicated",
        "intricate",
        "elaborate",
        "sophisticated",
        "multifaceted",
      ],
      fast: ["quick", "rapid", "swift", "speedy", "prompt"],
      slow: ["gradual", "unhurried", "leisurely", "measured", "moderate"],

      // Nouns
      problem: ["issue", "challenge", "difficulty", "complication", "obstacle"],
      solution: ["answer", "resolution", "remedy", "fix", "approach"],
      example: ["instance", "case", "illustration", "sample", "model"],
      idea: ["concept", "thought", "notion", "plan", "inspiration"],
      feature: ["characteristic", "aspect", "attribute", "quality", "property"],
      process: ["procedure", "method", "technique", "system", "operation"],
      result: ["outcome", "effect", "consequence", "product", "output"],
      person: ["individual", "human", "people", "user", "customer"],
      information: ["data", "details", "facts", "knowledge", "input"],
      system: [
        "framework",
        "structure",
        "organization",
        "network",
        "arrangement",
      ],
    };

    // Split text into words
    const words = text.split(/\s+/);

    // Determine how many words to replace
    const wordsToReplace = Math.ceil(words.length * replacementRate);

    // Create array of indices that can be replaced (words found in the synonym map)
    const replaceable = words
      .map((word, index) => {
        // Strip punctuation for checking
        const cleanWord = word
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        return synonymMap[cleanWord] ? index : -1;
      })
      .filter((index) => index !== -1);

    // If no replaceable words, return original text
    if (replaceable.length === 0) return text;

    // Shuffle and take only the number of words we want to replace
    for (let i = 0; i < Math.min(wordsToReplace, replaceable.length); i++) {
      const randomIndex = Math.floor(Math.random() * replaceable.length);
      const wordIndex = replaceable[randomIndex];

      // Remove this index so we don't replace it twice
      replaceable.splice(randomIndex, 1);

      if (wordIndex !== undefined) {
        // Get the original word and strip punctuation
        const originalWord = words[wordIndex];
        const cleanWord = originalWord
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

        // Get punctuation and capitalization info
        const hasPunctuation = originalWord.match(
          /[.,\/#!$%\^&\*;:{}=\-_`~()]/g
        );
        const punctuation = hasPunctuation ? hasPunctuation[0] : "";
        const isCapitalized = originalWord[0] === originalWord[0].toUpperCase();

        // Get synonyms and pick one randomly
        const synonyms = synonymMap[cleanWord];
        if (synonyms && synonyms.length > 0) {
          let synonym = synonyms[Math.floor(Math.random() * synonyms.length)];

          // Apply original capitalization
          if (isCapitalized) {
            synonym = synonym.charAt(0).toUpperCase() + synonym.slice(1);
          }

          // Apply original punctuation
          if (hasPunctuation) {
            synonym = synonym + punctuation;
          }

          // Replace the word
          words[wordIndex] = synonym;
        }
      }
    }

    return words.join(" ");
  }

  /**
   * Random insertion - inserts common words in random positions
   */
  static randomInsertion(text, insertionCount = 2) {
    const commonFiller = [
      "really",
      "actually",
      "basically",
      "certainly",
      "definitely",
      "extremely",
      "absolutely",
      "clearly",
      "obviously",
      "simply",
      "indeed",
      "notably",
      "particularly",
      "specifically",
      "generally",
      "occasionally",
      "sometimes",
      "often",
      "usually",
      "commonly",
      "perhaps",
      "maybe",
      "possibly",
      "probably",
      "likely",
    ];

    // Split text into words
    const words = text.split(/\s+/);

    // If text is very short, reduce insertion count
    const actualInsertions = Math.min(
      insertionCount,
      Math.floor(words.length / 4)
    );

    for (let i = 0; i < actualInsertions; i++) {
      // Pick a random position to insert
      const position = Math.floor(Math.random() * words.length);

      // Pick a random filler word
      const fillerWord =
        commonFiller[Math.floor(Math.random() * commonFiller.length)];

      // Insert the word
      words.splice(position, 0, fillerWord);
    }

    return words.join(" ");
  }

  /**
   * Change case - modifies the capitalization pattern of the text
   */
  static changeCase(text, caseType = "random") {
    if (!text) return text;

    switch (caseType) {
      case "lower":
        return text.toLowerCase();

      case "upper":
        return text.toUpperCase();

      case "title":
        return text
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");

      case "sentence":
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

      case "random":
        // Randomly choose one of the above
        const cases = ["lower", "title", "sentence"];
        return this.changeCase(
          text,
          cases[Math.floor(Math.random() * cases.length)]
        );

      default:
        return text;
    }
  }

  /**
   * Add context - wraps the prompt in additional context
   */
  static addContext(prompt, contextType = "random") {
    const contexts = {
      question: [
        "Can you tell me about {prompt}?",
        "I'm curious about {prompt}?",
        "Could you explain {prompt}?",
        "What exactly is {prompt}?",
        "I'd like to know more about {prompt}.",
        "Help me understand {prompt}.",
      ],
      instruction: [
        "Explain {prompt} in detail.",
        "Describe what {prompt} means.",
        "Define {prompt} and give examples.",
        "Elaborate on the concept of {prompt}.",
        "Provide information about {prompt}.",
      ],
      scenario: [
        "Imagine I'm new to {prompt} and need guidance.",
        "Let's say I'm learning about {prompt} for the first time.",
        "In a situation where I need to use {prompt}, what should I know?",
        "As someone unfamiliar with {prompt}, what would you tell me?",
        "If I were studying {prompt} in a class, what would be important to understand?",
      ],
    };

    // Choose context type if random
    if (contextType === "random") {
      const types = Object.keys(contexts);
      contextType = types[Math.floor(Math.random() * types.length)];
    }

    // Get contexts for the selected type
    const selectedContexts = contexts[contextType] || contexts.question;

    // Choose a random context template
    const template =
      selectedContexts[Math.floor(Math.random() * selectedContexts.length)];

    // Replace {prompt} placeholder with the actual prompt
    return template.replace("{prompt}", prompt);
  }

  /**
   * Rephrase prompt by adding or removing words while preserving meaning
   */
  static rephrase(text) {
    // First, apply synonym replacement
    let rephrased = this.synonymReplacement(text, 0.2);

    // Then, randomly choose another technique
    const techniques = [
      () => this.randomInsertion(rephrased, 1),
      () => this.addContext(rephrased, "random"),
      () => rephrased, // Do nothing more
    ];

    const selectedTechnique =
      techniques[Math.floor(Math.random() * techniques.length)];
    return selectedTechnique();
  }

  /**
   * Generate multiple variations of a training pair
   * @param {Object} pair - The original prompt-completion pair
   * @param {Object} options - Options for augmentation
   * @returns {Array} - Array of augmented pairs
   */
  static augmentPair(pair, options = {}) {
    const {
      count = 3,
      synonymRate = 0.3,
      insertionCount = 2,
      techniques = ["synonym", "case", "context", "insertion"],
    } = options;

    const results = [];

    // Always include original pair
    results.push({ ...pair });

    // Generate variations
    for (let i = 0; i < count; i++) {
      // Clone the original pair
      const augmented = { ...pair };

      // Randomly select techniques for this variation
      const usedTechniques = techniques.filter(() => Math.random() > 0.5);

      if (usedTechniques.length === 0) {
        // Ensure at least one technique is used
        usedTechniques.push(
          techniques[Math.floor(Math.random() * techniques.length)]
        );
      }

      // Apply techniques to prompt
      if (usedTechniques.includes("synonym")) {
        augmented.prompt = this.synonymReplacement(
          augmented.prompt,
          synonymRate
        );
      }

      if (usedTechniques.includes("insertion")) {
        augmented.prompt = this.randomInsertion(
          augmented.prompt,
          insertionCount
        );
      }

      if (usedTechniques.includes("case")) {
        augmented.prompt = this.changeCase(augmented.prompt, "sentence");
      }

      if (usedTechniques.includes("context")) {
        augmented.prompt = this.addContext(augmented.prompt);
      }

      // Generate a tag for this augmented pair
      augmented.tags = [...(pair.tags || []), "augmented"];

      results.push(augmented);
    }

    return results;
  }

  /**
   * Augment multiple pairs at once
   */
  static augmentDataset(pairs, options = {}) {
    let augmented = [];

    pairs.forEach((pair) => {
      const variations = this.augmentPair(pair, options);
      augmented = augmented.concat(variations);
    });

    return augmented;
  }
}
