// Data Cleaners
class DataCleaners {
  static removeDuplicates(data) {
    const seen = new Set();
    return data.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  static removeEmpty(data) {
    return data.filter(item => {
      return Object.values(item).some(value => 
        value !== null && value !== undefined && value !== ''
      );
    });
  }

  static fillMissing(data, fillValue = 'N/A') {
    return data.map(item => {
      const cleaned = { ...item };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
          cleaned[key] = fillValue;
        }
      });
      return cleaned;
    });
  }

  static removeNulls(data) {
    return data.map(item => {
      const cleaned = { ...item };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === null || cleaned[key] === undefined) {
          delete cleaned[key];
        }
      });
      return cleaned;
    }).filter(item => Object.keys(item).length > 0);
  }

  static standardizeKeys(data) {
    return data.map(item => {
      const standardized = {};
      Object.keys(item).forEach(key => {
        const newKey = key.toLowerCase().replace(/\s+/g, '_');
        standardized[newKey] = item[key];
      });
      return standardized;
    });
  }
}