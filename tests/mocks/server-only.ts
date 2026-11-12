// Mock for 'server-only' package - does nothing in test environment
// This package throws at build time if imported in client code
// In tests we just need it to not throw
export {};