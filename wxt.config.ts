import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Bot Assistant',
    description: 'Automation Anywhere A360 Assistant',
    version: '3.0.2',
    permissions: ['sidePanel', 'storage', 'tabs'],
    // No host_permissions - works on all sites
    icons: {
      '16': 'icon16.png',
      '48': 'icon48.png',
      '128': 'icon128.png'
    },
    side_panel: {
      default_path: 'sidepanel.html'
    },
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icon16.png',
        '48': 'icon48.png',
        '128': 'icon128.png'
      }
    }
  }
});