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