// Centralized Wappalyzer configuration and analysis functions

import { config } from '@/core/config';

// Get wappalyzer configuration from centralized config
const wappalyzerConfig = config.get('services').wappalyzer;

export const wappalyzerOptions = {
  debug: config.isDevelopment(),
  delay: 500,
  maxDepth: wappalyzerConfig.maxDepth,
  maxUrls: wappalyzerConfig.maxUrls,
  maxWait: wappalyzerConfig.timeout,
  recursive: false,
  probe: false, // Disable DNS probing to avoid DNS TXT timeouts
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
  noScripts: false,
  noRedirect: false,
};

// Lazy load Wappalyzer to avoid blocking on import
export function getWappalyzer() {
  return require("wappalyzer-rm");
}

export async function createWappalyzerInstance() {
  if (!wappalyzerConfig.enabled) {
    throw new Error('Wappalyzer service is disabled');
  }
  
  const Wappalyzer = getWappalyzer();
  const wappalyzer = new Wappalyzer(wappalyzerOptions);
  await wappalyzer.init();
  return wappalyzer;
}

export async function destroyWappalyzerInstance(wappalyzer: any, site: any) {
  // Always clean up Wappalyzer resources
  if (site) {
    try {
      // Check if removeAllListeners exists before calling
      if (typeof site.removeAllListeners === "function") {
        site.removeAllListeners();
      } else if (typeof site.off === "function") {
        // Try alternative method to remove listeners
        site.off("error");
      }
    } catch (e) {
      // Silently ignore listener removal errors
    }
  }

  if (wappalyzer) {
    try {
      await wappalyzer.destroy();
    } catch (destroyError) {
      // Silently ignore destroy errors
    }
  }
}