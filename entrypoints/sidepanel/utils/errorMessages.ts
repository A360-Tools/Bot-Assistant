export const ERROR_MESSAGES = {
  // Authentication errors
  NOT_AUTHENTICATED: 'Authentication required. Please log in to the Control Room.',
  AUTH_TOKEN_MISSING: 'Unable to retrieve authentication token. Please refresh the page.',
  
  // Connection errors
  CONTENT_SCRIPT_NOT_READY: 'Extension not connected to this page. Please refresh and try again.',
  CONNECTION_FAILED: 'Unable to establish connection with the page.',
  
  // API errors
  API_REQUEST_FAILED: 'Request failed. Please try again.',
  API_TIMEOUT: 'Request timed out. Please try again.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

export type ErrorType = 'authentication' | 'connection' | 'api' | 'generic';

export function getErrorType(error: unknown): ErrorType {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('authenticated') || message.includes('auth') || message.includes('token')) {
    return 'authentication';
  }
  
  if (message.includes('connection') || message.includes('content script') || message.includes('Receiving end')) {
    return 'connection';
  }
  
  if (message.includes('API') || message.includes('request')) {
    return 'api';
  }
  
  return 'generic';
}