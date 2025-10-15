// Data Transformers
class DataTransformers {
  static toLowerCase(data) {
    return data.map(item => {
      const transformed = { ...item };
      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'string') {
          transformed[key] = transformed[key].toLowerCase();
        }
      });
      return transformed;
    });
  }

  static toUpperCase(data) {
    return data.map(item => {
      const transformed = { ...item };
      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'string') {
          transformed[key] = transformed[key].toUpperCase();
        }
      });
      return transformed;
    });
  }

  static trimWhitespace(data) {
    return data.map(item => {
      const transformed = { ...item };
      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'string') {
          transformed[key] = transformed[key].trim();
        }
      });
      return transformed;
    });
  }

  static normalizeSpaces(data) {
    return data.map(item => {
      const transformed = { ...item };
      Object.keys(transformed).forEach(key => {
        if (typeof transformed[key] === 'string') {
          transformed[key] = transformed[key].replace(/\s+/g, ' ').trim();
        }
      });
      return transformed;
    });
  }
}