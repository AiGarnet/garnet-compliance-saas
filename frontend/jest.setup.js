// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Setup global test environment
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
}; 