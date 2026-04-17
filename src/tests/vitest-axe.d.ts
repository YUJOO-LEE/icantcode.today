export {};

declare module 'vitest' {
  interface Assertion<_T> {
    toHaveNoViolations(): void;
  }
}
