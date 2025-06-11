import {
  FileText,
  FileJson,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  File,
  Folder,
  Bot,
  Package,
  FileInput,
  type LucideIcon
} from 'lucide-vue-next';

export interface FileTypeConfig {
  icon: LucideIcon;
  color: string;
}

const fileTypeMap: Record<string, FileTypeConfig> = {
  // Automation Anywhere specific
  'application/vnd.aa.taskbot': {
    icon: Bot,
    color: '#2563eb'
  },
  'application/vnd.aa.metabot': {
    icon: Bot,
    color: '#7c3aed'
  },
  'application/vnd.aa.package': {
    icon: Package,
    color: '#dc2626'
  },
  'application/vnd.aa.directory': {
    icon: Folder,
    color: '#f59e0b'
  },
  'application/vnd.aa.form': {
    icon: FileInput,
    color: '#10b981'
  },
  
  // Documents
  'application/pdf': {
    icon: FileText,
    color: '#ef4444'
  },
  'application/msword': {
    icon: FileText,
    color: '#2563eb'
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    icon: FileText,
    color: '#2563eb'
  },
  
  // Spreadsheets
  'application/vnd.ms-excel': {
    icon: FileSpreadsheet,
    color: '#10b981'
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    icon: FileSpreadsheet,
    color: '#10b981'
  },
  'text/csv': {
    icon: FileSpreadsheet,
    color: '#10b981'
  },
  
  // Data files
  'application/json': {
    icon: FileJson,
    color: '#f59e0b'
  },
  'application/xml': {
    icon: FileCode,
    color: '#8b5cf6'
  },
  'text/xml': {
    icon: FileCode,
    color: '#8b5cf6'
  },
  
  // Images
  'image/jpeg': {
    icon: FileImage,
    color: '#ec4899'
  },
  'image/png': {
    icon: FileImage,
    color: '#ec4899'
  },
  'image/gif': {
    icon: FileImage,
    color: '#ec4899'
  },
  'image/svg+xml': {
    icon: FileImage,
    color: '#ec4899'
  },
  
  // Archives
  'application/zip': {
    icon: FileArchive,
    color: '#6366f1'
  },
  'application/x-zip-compressed': {
    icon: FileArchive,
    color: '#6366f1'
  },
  'application/x-rar-compressed': {
    icon: FileArchive,
    color: '#6366f1'
  },
  'application/java-archive': {
    icon: Package,
    color: '#dc2626'
  },
  
  // Code files
  'text/javascript': {
    icon: FileCode,
    color: '#f59e0b'
  },
  'application/javascript': {
    icon: FileCode,
    color: '#f59e0b'
  },
  'text/html': {
    icon: FileCode,
    color: '#ef4444'
  },
  'text/css': {
    icon: FileCode,
    color: '#3b82f6'
  },
  
  // Text files
  'text/plain': {
    icon: FileText,
    color: '#6b7280'
  }
};

export function getFileIcon(mimeType: string): FileTypeConfig {
  return fileTypeMap[mimeType] || {
    icon: File,
    color: '#6b7280'
  };
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  
  if (isNaN(size) || size === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}