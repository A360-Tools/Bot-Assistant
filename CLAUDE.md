# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bot Assistant is a Chrome extension for Automation Anywhere Control Room that enhances bot development with real-time best practices analysis, file management, and development tools. It uses Chrome's Side Panel API and supports both cloud and on-premise Control Room instances.

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run compile

# Create distribution ZIP
npm run zip

# Firefox variants
npm run dev:firefox
npm run build:firefox
npm run zip:firefox
```

## Architecture

The extension uses WXT framework with Vue 3 and TypeScript. Key architectural components:

### Entry Points
- `entrypoints/background.ts` - Service worker handling API requests and CORS bypass
- `entrypoints/content.ts` - Content script for DOM manipulation and page detection
- `entrypoints/sidepanel/App.vue` - Main Vue application
- `entrypoints/popup.html` - Fallback interface

### Communication Flow
1. Content script detects Control Room pages and extracts context
2. Background script proxies API requests to bypass CORS
3. Side panel receives data via message passing
4. User actions trigger DOM updates through content script

### Tool System
Tools are dynamically shown based on URL context:
- Private/Public Taskbots: Best practices, download files, copy files
- Private/Public Folders: Best practices settings
- Credentials: Content modification
- Packages: Package download

Routes are defined in `sidepanel/config/routes.ts` with visibility rules.

## Key Technical Details

- **State Management**: Vue 3 composition API with composables (`usePageContext`, `useTabState`)
- **Storage**: Chrome storage sync API for settings persistence
- **Message Passing**: Background script acts as message broker between content and sidepanel
- **API Proxy**: Background script forwards requests to Control Room API with proper headers
- **Error Handling**: Centralized error messages in `utils/errorMessages.ts`

## Best Practices Analysis

The extension analyzes bots for:
- Error handling (try-catch blocks)
- Code documentation
- Variable naming conventions (I_, O_, IO_ prefixes)
- No hardcoded values
- No empty containers
- Code complexity limits

Analysis rules are configurable per profile in settings.

## WXT Configuration

The project uses WXT's module system with:
- Auto-imports for Vue components and composables
- TypeScript support with proper extension APIs typing
- Manifest V3 with appropriate permissions (storage, tabs, sidePanel)