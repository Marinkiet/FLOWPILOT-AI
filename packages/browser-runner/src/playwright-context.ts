/**
 * Playwright implementation of the BrowserContext interface.
 *
 * This is the concrete implementation — the agent-core only knows about
 * the BrowserContext interface, keeping the automation layer swappable.
 */

import { chromium, type Browser, type Page, type BrowserContext as PlaywrightBC } from 'playwright';
import type {
  BrowserContext,
  NavigationResult,
  ConsoleCapture,
  NetworkFailure,
} from '@flowpilot/shared';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';

export interface PlaywrightContextOptions {
  headless?: boolean;
  screenshotDir?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  /** Extra HTTP headers to set on all requests (e.g. for auth tokens) */
  extraHTTPHeaders?: Record<string, string>;
}

export class PlaywrightBrowserContext implements BrowserContext {
  readonly id: string;
  private browser: Browser | null = null;
  private context: PlaywrightBC | null = null;
  private page: Page | null = null;
  private readonly options: Required<PlaywrightContextOptions>;

  // Capture buffers
  private readonly consoleBuffer: ConsoleCapture[] = [];
  private readonly networkFailureBuffer: NetworkFailure[] = [];

  constructor(options?: PlaywrightContextOptions) {
    this.id = `browser_${randomBytes(4).toString('hex')}`;
    this.options = {
      headless: options?.headless ?? true,
      screenshotDir: options?.screenshotDir ?? './screenshots',
      viewportWidth: options?.viewportWidth ?? 1280,
      viewportHeight: options?.viewportHeight ?? 800,
      extraHTTPHeaders: options?.extraHTTPHeaders ?? {},
    };
  }

  private async ensurePage(): Promise<Page> {
    if (this.page) return this.page;

    this.browser = await chromium.launch({ headless: this.options.headless });
    this.context = await this.browser.newContext({
      viewport: {
        width: this.options.viewportWidth,
        height: this.options.viewportHeight,
      },
      extraHTTPHeaders: this.options.extraHTTPHeaders,
    });

    this.page = await this.context.newPage();

    // Wire up console capture
    this.page.on('console', (msg) => {
      this.consoleBuffer.push({
        level: msg.type() as ConsoleCapture['level'],
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
    });

    // Wire up network failure capture
    this.page.on('requestfailed', (request) => {
      this.networkFailureBuffer.push({
        url: request.url(),
        method: request.method(),
        failureReason: request.failure()?.errorText ?? 'unknown',
        timestamp: new Date().toISOString(),
      });
    });

    // Capture API errors (4xx, 5xx) as network failures
    this.page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        this.networkFailureBuffer.push({
          url: response.url(),
          method: response.request().method(),
          status,
          statusText: response.statusText(),
          failureReason: `HTTP ${status}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return this.page;
  }

  async goto(url: string): Promise<NavigationResult> {
    const page = await this.ensurePage();
    const start = Date.now();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const loadTimeMs = Date.now() - start;

    return {
      url: page.url(),
      status: response?.status(),
      loadTimeMs,
    };
  }

  async click(selector: string): Promise<void> {
    const page = await this.ensurePage();
    await page.click(selector, { timeout: 8000 });
  }

  async fill(selector: string, value: string): Promise<void> {
    const page = await this.ensurePage();
    await page.fill(selector, value, { timeout: 5000 });
  }

  async select(selector: string, value: string): Promise<void> {
    const page = await this.ensurePage();
    await page.selectOption(selector, value, { timeout: 5000 });
  }

  async screenshot(label: string): Promise<string> {
    const page = await this.ensurePage();
    await fs.mkdir(this.options.screenshotDir, { recursive: true });

    // Sanitize label for use as a filename
    const sanitized = label.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const filename = `${sanitized}_${timestamp}.png`;
    const filepath = join(this.options.screenshotDir, filename);

    await page.screenshot({ path: filepath, fullPage: false });
    return filepath;
  }

  async currentUrl(): Promise<string> {
    const page = await this.ensurePage();
    return page.url();
  }

  async pageTitle(): Promise<string> {
    const page = await this.ensurePage();
    return page.title();
  }

  async drainConsoleMessages(): Promise<ConsoleCapture[]> {
    const messages = [...this.consoleBuffer];
    this.consoleBuffer.length = 0;
    return messages;
  }

  async drainNetworkFailures(): Promise<NetworkFailure[]> {
    const failures = [...this.networkFailureBuffer];
    this.networkFailureBuffer.length = 0;
    return failures;
  }

  async getHTML(selector: string): Promise<string> {
    const page = await this.ensurePage();
    return page.$eval(selector, (el) => el.outerHTML).catch(() => '');
  }

  async exists(selector: string): Promise<boolean> {
    const page = await this.ensurePage();
    const element = await page.$(selector).catch(() => null);
    return element !== null;
  }

  async waitForSelector(selector: string, timeoutMs = 5000): Promise<boolean> {
    const page = await this.ensurePage();
    try {
      await page.waitForSelector(selector, { timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  async evaluate<T>(fn: string): Promise<T> {
    const page = await this.ensurePage();
    return page.evaluate(fn) as Promise<T>;
  }

  async close(): Promise<void> {
    await this.page?.close().catch(() => {});
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}
