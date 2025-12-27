import '@testing-library/jest-dom';

// Minimal ResizeObserver polyfill for jsdom in tests
// Recharts' ResponsiveContainer expects window.ResizeObserver to exist.
// This simple mock calls the callback immediately with a fake contentRect when observe is called.
class SimpleResizeObserver {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {
    try {
      this.cb([
        {
          contentRect: { width: 800, height: 600 }
        }
      ]);
    } catch (_) {
      // ignore
    }
  }
  unobserve() {}
  disconnect() {}
}

// @ts-ignore
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  // @ts-ignore
  (globalThis as any).ResizeObserver = SimpleResizeObserver;
}

// Polyfills / global setup can be added here if needed

