export interface RouteConfig {
  paths: (string | RegExp)[];
  type: string;
  name: string;
  icon: string;
  tools: Tool[];
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  description: string;
  action?: string;
}

// Route configs work on any domain - only path matters
export const routeConfigs: RouteConfig[] = [
  {
    paths: [
      /#\/bots\/repository\/private\/files\/task\/\d+\/edit/,
      /#\/bots\/repository\/private\/taskbots\//
    ],
    type: 'privateBot',
    name: 'Private Taskbot',
    icon: 'Bot',
    tools: [
      {
        id: 'best-practices',
        name: 'Best Practices',
        icon: 'CheckCircle',
        description: 'Analyze bot for best practices and coding standards',
        action: 'BEST_PRACTICES'
      },
      {
        id: 'content-modification',
        name: 'Content Modification',
        icon: 'Code',
        description: 'Copy and modify bot content JSON',
        action: 'CONTENT_MODIFICATION'
      }
    ]
  },
  {
    paths: [
      /#\/bots\/repository\/public\/taskbots\/\d+\/view/,
      /#\/bots\/repository\/public\/taskbots\//
    ],
    type: 'publicBot',
    name: 'Public Taskbot',
    icon: 'Bot',
    tools: [
      {
        id: 'best-practices',
        name: 'Best Practices',
        icon: 'CheckCircle',
        description: 'Analyze bot for best practices and coding standards',
        action: 'BEST_PRACTICES'
      }
    ]
  },
  {
    paths: [/#\/bots\/repository\/private\/folders\//],
    type: 'privateFolder',
    name: 'Private Folders',
    icon: 'Folder',
    tools: [
      {
        id: 'download-files',
        name: 'Download Files',
        icon: 'Download',
        description: 'Browse and download files from this folder',
        action: 'DOWNLOAD_FILES'
      },
      {
        id: 'update-packages',
        name: 'Update Packages',
        icon: 'Package',
        description: 'Update bot packages to their default versions',
        action: 'UPDATE_PACKAGES'
      },
      {
        id: 'copy-files',
        name: 'Copy Files',
        icon: 'Copy',
        description: 'Copy files to another folder',
        action: 'COPY_FILES'
      },
      {
        id: 'patch-content',
        name: 'Patch Files',
        icon: 'Code',
        description: 'Find and replace text in selected bot files',
        action: 'PATCH_CONTENT'
      }
    ]
  },
  {
    paths: [/#\/bots\/repository\/public\/folders\//],
    type: 'publicFolder',
    name: 'Public Folders',
    icon: 'FolderOpen',
    tools: [
      {
        id: 'download-files',
        name: 'Download Files',
        icon: 'Download',
        description: 'Browse and download files from this folder',
        action: 'DOWNLOAD_FILES'
      }
    ]
  },
  {
    paths: [/#\/bots\/credentials\/mycredentials\/\d+\//],
    type: 'credentials',
    name: 'Credentials',
    icon: 'Key',
    tools: [
      {
        id: 'view-attributes',
        name: 'View Attributes',
        icon: 'Eye',
        description: 'View and copy credential attributes',
        action: 'VIEW_ATTRIBUTES'
      }
    ]
  },
  {
    paths: [/#\/bots\/packages\/versions/],
    type: 'packages',
    name: 'Packages',
    icon: 'Package',
    tools: [
      {
        id: 'package-download',
        name: 'Package Download',
        icon: 'Download',
        description: 'Download package JAR files',
        action: 'PACKAGE_DOWNLOAD'
      }
    ]
  },
  {
    paths: [/#\/devices\/mydevices/],
    type: 'devices',
    name: 'Devices',
    icon: 'HardDrive',
    tools: [
      {
        id: 'device-reset',
        name: 'Device Reset',
        icon: 'RotateCcw',
        description: 'Reset selected devices',
        action: 'DEVICE_RESET'
      }
    ]
  }
];

// Helper function to get current route config
export function getCurrentRouteConfig(url: string): RouteConfig | null {
  return routeConfigs.find(config => {
    return config.paths.some(path => {
      if (typeof path === 'string') {
        return url.includes(path);
      }
      return path.test(url);
    });
  }) || null;
}

// Get all unique tools across all routes
export function getAllTools(): Tool[] {
  const toolMap = new Map<string, Tool>();
  routeConfigs.forEach(config => {
    config.tools.forEach(tool => {
      toolMap.set(tool.id, tool);
    });
  });
  return Array.from(toolMap.values());
}

// Get navigation text for a route type
export function getNavigationText(type: string): string {
  const navigationMap: Record<string, string> = {
    'privateBot': 'Navigate to Control Room > Automation > Private tab > Open any bot',
    'publicBot': 'Navigate to Control Room > Automation > Public tab > Open any bot',
    'credentials': 'Navigate to Control Room > Manage > Credentials > Open any credential',
    'privateFolder': 'Navigate to Control Room > Automation > Private tab > Open any folder',
    'publicFolder': 'Navigate to Control Room > Automation > Public tab > Open any folder',
    'packages': 'Navigate to Control Room > Manage > Packages',
    'devices': 'Navigate to Control Room > Manage > Devices'
  };
  
  return navigationMap[type] || '';
}

// Get all supported sections dynamically from route configs
export function getSupportedSections() {
  return routeConfigs.map(config => ({
    name: config.name,
    description: getNavigationText(config.type)
  }));
}

// Get tools for a specific page type
export function getToolsForPageType(pageType: string): Tool[] {
  const config = routeConfigs.find(c => c.type === pageType);
  return config?.tools || [];
}