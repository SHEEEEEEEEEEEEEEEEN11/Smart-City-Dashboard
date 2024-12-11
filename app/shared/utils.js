export const formatNumber = (num) => {
  return Number(num).toFixed(1);
};

export const getColorForValue = (value, ranges) => {
  for (const [max, color] of ranges) {
    if (value <= max) return color;
  }
  return ranges[ranges.length - 1][1];
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};