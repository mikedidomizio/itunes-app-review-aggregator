import { vi } from 'vitest';

// Helper to mock global.fetch with a sequence of responses.
// Each response can be any object; it's returned as-is (so structure should match Response-like { ok, json }).
export function mockFetchSequence(...responses: any[]) {
  const fn = vi.fn();
  responses.forEach((r, i) => {
    fn.mockResolvedValueOnce(r);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = fn;
  return fn;
}

