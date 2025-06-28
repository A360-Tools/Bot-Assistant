import { ERROR_MESSAGES } from '../utils/errorMessages';

interface FilterOperand {
  operator: string;
  field: string;
  value: string;
}

interface Filter {
  operator: string;
  operands?: FilterOperand[];
  field?: string;
  value?: string;
}

interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

interface Page {
  offset: number;
  length: number;
}

export interface ApiRequestBody {
  filter?: Filter;
  sort?: Sort[];
  page?: Page;
}

export interface FolderItem {
  id: string;
  parentId: string;
  name: string;
  folder: boolean;
  type: string;
  path: string;
  size: string;
  lastModified: string;
  lastModifiedBy: string;
  createdBy: string;
  permission: Record<string, boolean>;
  workspaceType: string;
  [key: string]: any;
}

export interface FolderListResponse {
  page: {
    offset: number;
    total: number;
    totalFilter: number;
  };
  list: FolderItem[];
}

export interface PackageItem {
  id: string;
  name: string;
  packageVersion: string;
  status: string;
  [key: string]: any;
}

export interface PackageListResponse {
  page: {
    offset: number;
    total: number;
    totalFilter: number;
  };
  list: PackageItem[];
}

export interface BotContent {
  packages: Array<{
    name: string;
    version: string;
  }>;
  [key: string]: any;
}

class ApiService {
  private static instance: ApiService;
  private authToken: string | null = null;
  private baseUrl: string = '';

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Initialize API service with current tab's hostname
   */
  async initialize(): Promise<void> {
    try {
      // Get current tab to extract hostname
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        this.baseUrl = `${url.protocol}//${url.host}`;
      }

      // Get auth token from page's localStorage
      const token = await this.getAuthTokenFromPage();
      this.authToken = token;
    } catch (error) {
      // Failed to initialize API service
    }
  }

  /**
   * Get auth token from page's localStorage via content script
   */
  private async getAuthTokenFromPage(): Promise<string | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return null;

      // Send message to content script to get auth token
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id!,
          { action: 'getAuthToken' },
          (response) => {
            if (chrome.runtime.lastError) {
              // Failed to communicate with content script
              resolve(null);
              return;
            }
            
            if (response?.success) {
              resolve(response.authToken);
            } else {
              // Failed to get auth token
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      // Failed to get auth token
      return null;
    }
  }

  /**
   * Make authenticated API request via background script
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.authToken) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);
    }

    if (!this.baseUrl) {
      throw new Error('API base URL not initialized');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': this.authToken,
      ...options.headers,
    };

    // Use background script to make the request (avoids CORS)
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'apiRequest',
          config: {
            url,
            method: options.method || 'GET',
            headers,
            body: options.body,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const message = chrome.runtime.lastError.message;
            if (message && message.includes('Receiving end does not exist')) {
              reject(new Error(ERROR_MESSAGES.CONTENT_SCRIPT_NOT_READY));
            } else {
              reject(new Error(message || 'Unknown runtime error'));
            }
            return;
          }

          if (response?.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || ERROR_MESSAGES.API_REQUEST_FAILED));
          }
        }
      );
    });
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * List folder contents with filtering
   */
  async listFolderContents(
    folderId: string,
    excludeFolders: boolean = false
  ): Promise<FolderListResponse> {
    const body: ApiRequestBody = {
      page: {
        offset: 0,
        length: 200,
      },
      sort: [
        {
          field: 'name',
          direction: 'asc',
        },
      ],
    };

    // Add filter to exclude folders if requested
    if (excludeFolders) {
      body.filter = {
        operator: 'ne',
        field: 'type',
        value: 'application/vnd.aa.directory',
      };
    }

    return this.post<FolderListResponse>(
      `/v2/repository/folders/${folderId}/list`,
      body
    );
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.authToken || !this.baseUrl) {
      throw new Error('API not initialized');
    }

    const url = `${this.baseUrl}/v2/repository/files/${fileId}/content`;
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'apiRequest',
          config: {
            url,
            method: 'GET',
            headers: {
              'X-Authorization': this.authToken,
              'X-Download': 'true', // Flag to indicate this is a download request
            },
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response?.success && response.data?.blob) {
            // Convert base64 back to blob
            const base64Data = response.data.blob.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: response.data.type });
            resolve(blob);
          } else {
            reject(new Error(response?.error || 'Failed to download file'));
          }
        }
      );
    });
  }

  /**
   * Get current auth status
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * List bots in folder (filters for taskbot type)
   */
  async listBotsInFolder(folderId: string): Promise<FolderListResponse> {
    const body: ApiRequestBody = {
      filter: {
        operator: 'eq',
        field: 'type',
        value: 'application/vnd.aa.taskbot',
      },
      page: {
        offset: 0,
        length: 200,
      },
      sort: [
        {
          field: 'name',
          direction: 'asc',
        },
      ],
    };

    return this.post<FolderListResponse>(
      `/v2/repository/folders/${folderId}/list`,
      body
    );
  }

  /**
   * Get default package versions
   */
  async getDefaultPackageVersions(): Promise<PackageListResponse> {
    const body: ApiRequestBody = {
      filter: {
        operator: 'eq',
        field: 'status',
        value: 'DEFAULT',
      },
      page: {
        offset: 0,
        length: 1000,
      },
    };

    return this.post<PackageListResponse>('/v2/packages/package/list', body);
  }

  /**
   * Get bot content (JSON)
   */
  async getBotContent(fileId: string): Promise<BotContent> {
    if (!this.authToken || !this.baseUrl) {
      throw new Error('API not initialized');
    }

    const url = `${this.baseUrl}/v2/repository/files/${fileId}/content`;
    
    // For bot content, we need to handle it specially since it returns as application/vnd.aa.taskbot
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'apiRequest',
          config: {
            url,
            method: 'GET',
            headers: {
              'X-Authorization': this.authToken,
              'X-Bot-Content': 'true', // Flag to indicate this is bot content request
            },
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response?.success) {
            // If we got a blob response, decode it
            if (response.data?.blob && response.data?.type === 'application/vnd.aa.taskbot') {
              try {
                // Extract base64 data
                const base64Data = response.data.blob.split(',')[1];
                // Decode base64 to string
                const jsonString = atob(base64Data);
                // Parse JSON
                const botContent = JSON.parse(jsonString);
                resolve(botContent);
              } catch (error) {
                reject(new Error('Failed to parse bot content'));
              }
            } else {
              // If it's already JSON, use it directly
              resolve(response.data);
            }
          } else {
            reject(new Error(response?.error || 'Failed to get bot content'));
          }
        }
      );
    });
  }

  /**
   * Update bot content
   */
  async updateBotContent(fileId: string, content: BotContent): Promise<any> {
    return this.put(`/v2/repository/files/${fileId}/content`, content);
  }

  /**
   * Copy a file to another folder
   */
  async copyFile(fileId: string, newFileName: string, destinationFolderId: string): Promise<any> {
    const body = {
      name: newFileName,
      parentId: destinationFolderId
    };

    return this.post(`/v2/repository/files/${fileId}/copy`, body);
  }

  /**
   * Update packages for multiple bots with live progress callback
   */
  async updateBotsPackages(
    fileIds: string[],
    onProgress?: (fileId: string, status: 'updating' | 'success' | 'skipped' | 'failed', error?: string) => void
  ): Promise<{
    success: string[];
    skipped: string[];
    failed: Array<{ fileId: string; error: string }>;
  }> {
    const results = {
      success: [] as string[],
      skipped: [] as string[],
      failed: [] as Array<{ fileId: string; error: string }>,
    };

    try {
      // Get default package versions
      const packageResponse = await this.getDefaultPackageVersions();
      const packageVersionsMap = new Map<string, string>();
      
      packageResponse.list.forEach((pkg) => {
        packageVersionsMap.set(pkg.name, pkg.packageVersion);
      });

      // Update each bot
      for (const fileId of fileIds) {
        try {
          // Notify that we're starting to update this bot
          onProgress?.(fileId, 'updating');
          
          // Get bot content
          const botContent = await this.getBotContent(fileId);
          // Bot content retrieved
          
          // Update package versions
          if (botContent.packages && Array.isArray(botContent.packages) && botContent.packages.length > 0) {
            let updatedCount = 0;
            botContent.packages.forEach((pkg) => {
              const defaultVersion = packageVersionsMap.get(pkg.name);
              if (defaultVersion && pkg.version !== defaultVersion) {
                // Updating package version
                pkg.version = defaultVersion;
                updatedCount++;
              }
            });
            
            if (updatedCount > 0) {
              // Save updated content
              await this.updateBotContent(fileId, botContent);
              results.success.push(fileId);
              onProgress?.(fileId, 'success');
            } else {
              // Skip if already up to date
              results.skipped.push(fileId);
              onProgress?.(fileId, 'skipped');
            }
          } else {
            // Skip if bot has no packages
            results.skipped.push(fileId);
            onProgress?.(fileId, 'skipped');
          }
        } catch (error) {
          // Failed to update bot
          const errorMsg = error instanceof Error ? error.message : 'Failed to update bot';
          results.failed.push({ fileId, error: errorMsg });
          onProgress?.(fileId, 'failed', errorMsg);
        }
      }
    } catch (error) {
      throw new Error('Failed to get default package versions');
    }

    return results;
  }

  /**
   * Get credential by ID
   */
  async getCredentialById(credentialId: string): Promise<any> {
    const body: ApiRequestBody = {
      filter: {
        operator: 'eq',
        field: 'id',
        value: credentialId,
      },
      page: {
        offset: 0,
        length: 1,
      },
    };

    const response = await this.post<any>('/v2/credentialvault/credentials/list', body);
    if (response.list && response.list.length > 0) {
      return response.list[0];
    }
    throw new Error('Credential not found');
  }

  /**
   * Get credential attribute values
   */
  async getCredentialAttributes(credentialId: string, userId?: string): Promise<any> {
    let endpoint = `/v2/credentialvault/credentials/${credentialId}/attributevalues`;
    
    // Add userId if provided (for specific user attributes)
    if (userId) {
      endpoint += `?userId=${userId}`;
    }
    
    return this.get<any>(endpoint);
  }

  /**
   * Get credential attribute with specific credentialAttributeId and userId
   */
  async getCredentialAttributeWithUser(credentialId: string, credentialAttributeId: string, userId: string): Promise<any> {
    const endpoint = `/v2/credentialvault/credentials/${credentialId}/attributevalues?credentialAttributeId=${credentialAttributeId}&userId=${userId}`;
    return this.get<any>(endpoint);
  }

  /**
   * Get current auth token
   */
  async getAuthToken(): Promise<string | null> {
    return this.authToken;
  }
}

export const apiService = ApiService.getInstance();