// URL utility functions for site analysis

/**
 * Extract the base/parent domain from a hostname
 * Removes all subdomains to get the root domain
 * IMPORTANT: www is treated as part of the base domain, not a subdomain
 * Examples:
 * - www.example.com -> example.com (www is removed)
 * - example.com -> example.com
 * - blog.example.com -> example.com
 * - api.v2.example.com -> example.com
 * - example.co.uk -> example.co.uk (handles multi-part TLDs)
 */
export function extractBaseDomain(hostname: string): string {
  // Remove any protocol if accidentally included
  hostname = hostname.replace(/^https?:\/\//, "").toLowerCase();

  // Remove port if present
  hostname = hostname.split(":")[0] || hostname;

  // Remove path if present
  hostname = hostname.split("/")[0] || hostname;

  // Remove www prefix first since it's not a real subdomain
  if (hostname.startsWith("www.")) {
    hostname = hostname.substring(4);
  }

  const parts = hostname.split(".");

  // Common multi-part TLDs (this list can be expanded)
  const multiPartTLDs = [
    "co.uk",
    "co.jp",
    "co.kr",
    "co.nz",
    "co.za",
    "co.id",
    "co.in",
    "com.au",
    "com.br",
    "com.cn",
    "com.mx",
    "com.sg",
    "com.tw",
    "ac.uk",
    "gov.uk",
    "org.uk",
    "net.uk",
    "ac.jp",
    "go.jp",
    "or.jp",
    "ne.jp",
    "org.au",
    "net.au",
    "gov.au",
    "edu.au",
  ];

  // Check if the domain ends with a multi-part TLD
  for (const tld of multiPartTLDs) {
    const tldParts = tld.split(".");
    if (parts.length > tldParts.length) {
      const domainEnd = parts.slice(-tldParts.length).join(".");
      if (domainEnd === tld) {
        // Return domain + multi-part TLD
        return parts.slice(-(tldParts.length + 1)).join(".");
      }
    }
  }

  // For standard TLDs, return last 2 parts
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }

  return hostname;
}

/**
 * Generate a clean display name from a URL for sorting and display
 * Removes protocol and www prefix but keeps other subdomains
 * Examples:
 * - https://www.example.com -> example.com
 * - http://blog.example.com -> blog.example.com
 * - https://shop.store.com -> shop.store.com
 */
export function generateDisplayName(url: string): string {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();

    // Remove www. prefix if present
    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }

    // Include pathname if it's not just /
    const pathname = urlObj.pathname;
    if (pathname && pathname !== "/" && pathname !== "") {
      // Clean up the pathname - remove trailing slashes
      const cleanPath = pathname.replace(/\/+$/, "");
      return hostname + cleanPath;
    }

    return hostname;
  } catch (error) {
    // If URL parsing fails, try to extract domain from the string
    let display = url.toLowerCase();
    display = display.replace(/^https?:\/\//, ""); // Remove protocol
    display = display.replace(/^www\./, ""); // Remove www
    display = display.replace(/\/$/, ""); // Remove trailing slash
    return display || url; // Fallback to original if all else fails
  }
}

/**
 * Normalizes a URL to prevent duplicate crawling
 * - Removes trailing slashes
 * - Removes common tracking parameters
 * - Sorts query parameters
 * - Lowercases the hostname
 * - Removes fragments
 * - IMPORTANT: Keeps www prefix as-is (handled separately by canonicalizeWww)
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Lowercase the hostname
    urlObj.hostname = urlObj.hostname.toLowerCase();

    // Remove fragment
    urlObj.hash = "";

    // Remove trailing slash from pathname (except for root)
    if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    // Remove common tracking parameters
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "ref",
      "source",
    ];

    trackingParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    // Sort query parameters for consistency
    const sortedParams = Array.from(urlObj.searchParams.entries()).sort();
    urlObj.search = "";
    sortedParams.forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Canonicalizes www/non-www URLs to prevent duplicates
 * Since www and non-www are almost always the same site, we normalize to non-www
 * unless the site explicitly requires www (very rare)
 *
 * @param url - The URL to canonicalize
 * @param preferWww - If true, adds www; if false, removes www (default: false)
 */
export function canonicalizeWww(
  url: string,
  preferWww: boolean = false
): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (preferWww) {
      // Add www if not present and not a subdomain
      if (!hostname.startsWith("www.") && hostname.split(".").length === 2) {
        urlObj.hostname = "www." + hostname;
      }
    } else {
      // Remove www if present
      if (hostname.startsWith("www.")) {
        urlObj.hostname = hostname.substring(4);
      }
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}


/**
 * Gets all variations of a domain that should be considered duplicates
 * e.g., www.example.com and example.com
 */
export function getDomainVariations(domain: string): string[] {
  const variations = [domain];

  if (domain.startsWith("www.")) {
    variations.push(domain.slice(4));
  } else {
    variations.push(`www.${domain}`);
  }

  return variations;
}

