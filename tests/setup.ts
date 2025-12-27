import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Polyfills / global setup can be added here if needed

afterEach(() => {
  // Restore any mocks/stubs and remove global.fetch to avoid leakage between tests
  vi.restoreAllMocks();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch;
  } catch (_e) {
    // ignore
  }
});
