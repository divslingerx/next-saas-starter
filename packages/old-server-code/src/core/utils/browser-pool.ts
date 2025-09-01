import puppeteer, { Browser } from 'puppeteer';

class BrowserPool {
  private static instance: BrowserPool;
  private browsers: Browser[] = [];
  private maxBrowsers = 3;
  private currentIndex = 0;
  
  static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }
  
  async getBrowser(): Promise<Browser> {
    if (this.browsers.length === 0) {
      await this.initializeBrowsers();
    }
    
    const browser = this.browsers[this.currentIndex];
    if (!browser) {
      throw new Error('Browser pool not properly initialized');
    }
    this.currentIndex = (this.currentIndex + 1) % this.browsers.length;
    return browser;
  }
  
  private async initializeBrowsers(): Promise<void> {
    for (let i = 0; i < this.maxBrowsers; i++) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.browsers.push(browser);
    }
  }
  
  async cleanup(): Promise<void> {
    await Promise.all(this.browsers.map(browser => browser.close()));
    this.browsers = [];
  }
}

export const browserPool = BrowserPool.getInstance();