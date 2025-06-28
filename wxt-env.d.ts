/// <reference types="wxt/browser" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  function defineBackground(callback: () => void): void;
  function defineContentScript(config: {
    matches: string[];
    main: () => void;
  }): void;
}

export {};