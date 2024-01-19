// portManager.js

// This variable holds the global port instance
let globalPort = null;

/**
 * Returns the global port instance.
 * @returns {Port} The global port instance.
 */
export function getGlobalPort() {
  return globalPort;
}

/**
 * Sets the global port instance.
 * @param {Port} port The port instance to set as global.
 */
export function setGlobalPort(port) {
  globalPort = port;
}
