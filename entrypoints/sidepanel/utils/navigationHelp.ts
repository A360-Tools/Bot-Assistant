export const NAVIGATION_SECTIONS = {
  PRIVATE_BOTS: {
    name: 'Private Bot Editor',
    path: 'Bots > Private > Bot',
    description: 'Navigate to Control Room > Bots > Private tab > Open any bot'
  },
  PUBLIC_BOTS: {
    name: 'Public Bot Viewer', 
    path: 'Bots > Public > Bot',
    description: 'Navigate to Control Room > Bots > Public tab > Open any bot'
  },
  CREDENTIALS: {
    name: 'Credential Details',
    path: 'Manage > Credentials > Credential',
    description: 'Navigate to Control Room > Manage > Credentials > Open any credential'
  },
  PRIVATE_FOLDERS: {
    name: 'Private Folder Contents',
    path: 'Bots > Private > Folder',
    description: 'Navigate to Control Room > Bots > Private tab > Open any folder'
  },
  PUBLIC_FOLDERS: {
    name: 'Public Folder Contents',
    path: 'Bots > Public > Folder',
    description: 'Navigate to Control Room > Bots > Public tab > Open any folder'
  }
} as const;

export const SUPPORTED_SECTIONS = [
  NAVIGATION_SECTIONS.PRIVATE_BOTS,
  NAVIGATION_SECTIONS.PUBLIC_BOTS,
  NAVIGATION_SECTIONS.CREDENTIALS,
  NAVIGATION_SECTIONS.PRIVATE_FOLDERS,
  NAVIGATION_SECTIONS.PUBLIC_FOLDERS
];