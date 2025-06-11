export const NAVIGATION_SECTIONS = {
  PRIVATE_BOTS: {
    name: 'Private Bot Editor',
    path: 'Automation > Private > Bot',
    description: 'Navigate to Control Room > Automation > Private tab > Open any bot'
  },
  PUBLIC_BOTS: {
    name: 'Public Bot Viewer', 
    path: 'Automation > Public > Bot',
    description: 'Navigate to Control Room > Automation > Public tab > Open any bot'
  },
  CREDENTIALS: {
    name: 'Credential Details',
    path: 'Manage > Credentials > Credential',
    description: 'Navigate to Control Room > Manage > Credentials > Open any credential'
  },
  PRIVATE_FOLDERS: {
    name: 'Private Folder Contents',
    path: 'Automation > Private > Folder',
    description: 'Navigate to Control Room > Automation > Private tab > Open any folder'
  },
  PUBLIC_FOLDERS: {
    name: 'Public Folder Contents',
    path: 'Automation > Public > Folder',
    description: 'Navigate to Control Room > Automation > Public tab > Open any folder'
  },
  PACKAGES: {
    name: 'Packages',
    path: 'Manage > Packages',
    description: 'Navigate to Control Room > Manage > Packages'
  }
} as const;

export const SUPPORTED_SECTIONS = [
  NAVIGATION_SECTIONS.PRIVATE_BOTS,
  NAVIGATION_SECTIONS.PUBLIC_BOTS,
  NAVIGATION_SECTIONS.CREDENTIALS,
  NAVIGATION_SECTIONS.PRIVATE_FOLDERS,
  NAVIGATION_SECTIONS.PUBLIC_FOLDERS,
  NAVIGATION_SECTIONS.PACKAGES
];