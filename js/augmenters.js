// Data Augmenters
class DataAugmenters {
  static duplicateData(data, count = 2) {
    const augmented = [];
    for (let i = 0; i < count; i++) {
      augmented.push(...data);
    }
    return augmented;
  }

  static addNoise(data, noiseLevel = 0.1) {
    return data.map(item => {
      const augmented = { ...item };
      Object.keys(augmented).forEach(key => {
        if (typeof augmented[key] === 'number') {
          const noise = (Math.random() - 0.5) * 2 * noiseLevel;
          augmented[key] = augmented[key] * (1 + noise);
        }
      });
      return augmented;
    });
  }

  static shuffle(data) {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static sample(data, percentage = 50) {
    const sampleSize = Math.floor(data.length * (percentage / 100));
    const shuffled = this.shuffle(data);
    return shuffled.slice(0, sampleSize);
  }
}