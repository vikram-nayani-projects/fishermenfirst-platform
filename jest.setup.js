// Jest setup file for global test configuration

// Set environment variables for testing
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Global test utilities can be added here
global.console = {
  ...console,
  // Uncomment to ignore specific log levels during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};