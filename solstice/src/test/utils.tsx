import { cleanup, render } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatically unmount and cleanup DOM after the test is finished
afterEach(() => {
  cleanup();
});

// Custom render function to wrap components with providers as needed
const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    // Wrap provider(s) here if needed
    // Example: <AppProvider>
    //            {ui}
    //          </AppProvider>
    wrapper: ({ children }) => children,
    ...options,
  });

export * from '@testing-library/react';
export { customRender as render };