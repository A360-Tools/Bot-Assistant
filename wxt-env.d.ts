/// <reference types="wxt/browser" />

declare global {
  function defineBackground(callback: () => void): void;
  function defineContentScript(config: {
    matches: string[];
    main: () => void;
  }): void;
}

export {};