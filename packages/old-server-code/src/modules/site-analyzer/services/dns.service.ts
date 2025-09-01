/**
 * DNS Service
 * Handles DNS record lookups and analysis
 */

import dns from "dns/promises";
import type { DnsRecordsDto } from "../dto/site-analyzer.dto";
import { ValidationException } from "@/core/exceptions/base.exception";
import { withCancellation } from "@/core/utils/cancellation";
import { globalContext } from "@/core/context/global-context";
import type { ServiceOptions } from "@/core/types/service-options";

export interface DnsAnalysisOptions {
  timeout?: number;
  includeAll?: boolean;
}

export class DnsService {
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds for DNS operations
  /**
   * Analyze DNS records for a domain
   */
  async analyzeDns(
    dto: { url: string; includeAll?: boolean; timeout?: number },
    options?: ServiceOptions
  ): Promise<DnsRecordsDto> {
    const signal = options?.signal || globalContext.signal;
    const serviceTimeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { url, includeAll = true, timeout = 5000 } = dto;

    return withCancellation(
      this.performDnsAnalysis(url, { includeAll, timeout }),
      signal,
      serviceTimeout
    );
  }

  /**
   * Internal DNS analysis implementation
   */
  private async performDnsAnalysis(url: string, options: DnsAnalysisOptions = {}): Promise<DnsRecordsDto> {
    try {
      const { includeAll = true } = options;

      // Extract hostname from URL
      const hostname = this.extractHostname(url);
      console.log(`[DNS] Analyzing records for ${hostname}`);

      const dnsRecords: DnsRecordsDto = {};

      // Parallel DNS lookups with error handling for each
      const lookups = [];

      // A records
      lookups.push(
        this.lookupWithTimeout(() => dns.resolve4(hostname), options.timeout)
          .then((records) => { dnsRecords.a = records; })
          .catch((err) => this.handleDnsError('A', err))
      );

      // AAAA records (IPv6)
      if (includeAll) {
        lookups.push(
          this.lookupWithTimeout(() => dns.resolve6(hostname), options.timeout)
            .then((records) => { dnsRecords.aaaa = records; })
            .catch((err) => this.handleDnsError('AAAA', err))
        );
      }

      // MX records
      lookups.push(
        this.lookupWithTimeout(() => dns.resolveMx(hostname), options.timeout)
          .then((records) => { dnsRecords.mx = records; })
          .catch((err) => this.handleDnsError('MX', err))
      );

      // TXT records
      lookups.push(
        this.lookupWithTimeout(() => dns.resolveTxt(hostname), options.timeout)
          .then((records) => { 
            dnsRecords.txt = records.map(r => Array.isArray(r) ? r.join('') : r);
          })
          .catch((err) => this.handleDnsError('TXT', err))
      );

      // NS records
      lookups.push(
        this.lookupWithTimeout(() => dns.resolveNs(hostname), options.timeout)
          .then((records) => { dnsRecords.ns = records; })
          .catch((err) => this.handleDnsError('NS', err))
      );

      // CNAME records
      lookups.push(
        this.lookupWithTimeout(() => dns.resolveCname(hostname), options.timeout)
          .then((records) => { 
            if (records && records.length > 0) {
              dnsRecords.cname = records[0];
            }
          })
          .catch((err) => {
            // CNAME errors are common for domains with A records
            if (!err.message?.includes('ENODATA')) {
              this.handleDnsError('CNAME', err);
            }
          })
      );

      // SOA records
      if (includeAll) {
        lookups.push(
          this.lookupWithTimeout(() => dns.resolveSoa(hostname), options.timeout)
            .then((record) => { dnsRecords.soa = record; })
            .catch((err) => this.handleDnsError('SOA', err))
        );
      }

      // Wait for all lookups to complete
      await Promise.allSettled(lookups);

      return dnsRecords;
    } catch (error) {
      console.error(`[DNS] Error analyzing DNS:`, error);
      throw error;
    }
  }

  /**
   * Analyze with fallback for www/non-www
   */
  async analyzeWithFallback(
    dto: { url: string; includeAll?: boolean; timeout?: number },
    options?: ServiceOptions
  ): Promise<DnsRecordsDto & { finalHostname: string }> {
    const signal = options?.signal || globalContext.signal;
    const serviceTimeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { url, includeAll = true, timeout = 5000 } = dto;

    return withCancellation(
      this.performAnalysisWithFallback(url, { includeAll, timeout }),
      signal,
      serviceTimeout
    );
  }

  /**
   * Internal analysis with fallback implementation
   */
  private async performAnalysisWithFallback(
    url: string,
    options: DnsAnalysisOptions = {}
  ): Promise<DnsRecordsDto & { finalHostname: string }> {
    const hostname = this.extractHostname(url);
    
    try {
      const result = await this.performDnsAnalysis(url, options);
      
      // Check if we got any meaningful results
      if (this.hasValidRecords(result)) {
        return { ...result, finalHostname: hostname };
      }
    } catch (error) {
      console.log(`[DNS] Initial lookup failed for ${hostname}: ${error}`);
    }

    // Try alternate hostname
    let alternateHostname: string | null = null;
    
    if (!hostname.startsWith('www.')) {
      alternateHostname = `www.${hostname}`;
    } else if (hostname.startsWith('www.')) {
      alternateHostname = hostname.substring(4);
    }

    if (alternateHostname) {
      console.log(`[DNS] Trying alternate hostname: ${alternateHostname}`);
      try {
        const alternateUrl = url.replace(hostname, alternateHostname);
        const result = await this.performDnsAnalysis(alternateUrl, options);
        
        if (this.hasValidRecords(result)) {
          return { ...result, finalHostname: alternateHostname };
        }
      } catch (altError) {
        console.log(`[DNS] Alternate hostname also failed: ${altError}`);
      }
    }

    // Return empty result
    return { finalHostname: hostname };
  }

  /**
   * Extract hostname from URL
   */
  private extractHostname(url: string): string {
    try {
      // Handle URLs without protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      throw new ValidationException(`Invalid URL format: ${url}`);
    }
  }

  /**
   * Perform DNS lookup with timeout
   */
  private async lookupWithTimeout<T>(
    lookupFn: () => Promise<T>,
    timeout: number = 5000
  ): Promise<T> {
    return Promise.race([
      lookupFn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('DNS lookup timeout')), timeout)
      ),
    ]);
  }

  /**
   * Handle DNS lookup errors
   */
  private handleDnsError(recordType: string, error: any): void {
    const errorMessage = error?.message || String(error);
    
    // Only log unexpected errors
    if (!errorMessage.includes('ENODATA') && 
        !errorMessage.includes('ENOTFOUND') &&
        !errorMessage.includes('queryA') &&
        !errorMessage.includes('queryCname')) {
      console.log(`[DNS] ${recordType} lookup error: ${errorMessage}`);
    }
  }

  /**
   * Check if DNS results contain valid records
   */
  private hasValidRecords(records: DnsRecordsDto): boolean {
    return !!(
      records.a?.length ||
      records.aaaa?.length ||
      records.cname ||
      records.mx?.length ||
      records.ns?.length
    );
  }

  /**
   * Get simplified DNS info for quick checks
   */
  async getBasicDnsInfo(
    dto: { url: string },
    options?: ServiceOptions
  ): Promise<{
    hasARecord: boolean;
    hasMxRecord: boolean;
    hasWww: boolean;
    hostname: string;
  }> {
    const signal = options?.signal || globalContext.signal;
    const serviceTimeout = options?.timeout || this.DEFAULT_TIMEOUT;
    const { url } = dto;

    return withCancellation(
      this.performBasicDnsInfo(url),
      signal,
      serviceTimeout
    );
  }

  /**
   * Internal basic DNS info implementation
   */
  private async performBasicDnsInfo(url: string): Promise<{
    hasARecord: boolean;
    hasMxRecord: boolean;
    hasWww: boolean;
    hostname: string;
  }> {
    const hostname = this.extractHostname(url);
    const records = await this.performAnalysisWithFallback(url, { includeAll: false });

    // Check for www subdomain
    let hasWww = false;
    if (!hostname.startsWith('www.')) {
      try {
        const wwwRecords = await this.lookupWithTimeout(
          () => dns.resolve4(`www.${hostname}`),
          3000
        );
        hasWww = wwwRecords.length > 0;
      } catch {
        hasWww = false;
      }
    } else {
      hasWww = true;
    }

    return {
      hasARecord: (records.a?.length || 0) > 0,
      hasMxRecord: (records.mx?.length || 0) > 0,
      hasWww,
      hostname: records.finalHostname,
    };
  }
}