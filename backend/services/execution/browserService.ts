export class BrowserService {
    static async navigateAndExtract(url: string): Promise<string> {
        console.log(`[BrowserService] Attempting to automate browser for URL: ${url}`);
        
        try {
            // Dynamically import to avoid crashing if playwright is not installed
            // @ts-ignore
            const { chromium } = await import('playwright');
            
            console.log(`[BrowserService] Launching headless chromium...`);
            const browser = await chromium.launch({ headless: true });
            const page = await browser.newPage();
            
            await page.goto(url, { waitUntil: 'networkidle' });
            
            // Extract visible text (simplified)
            const textContent = await page.evaluate(() => document.body.innerText);
            
            await browser.close();
            console.log(`[BrowserService] Extraction successful. Extracted ${textContent.length} characters.`);
            
            return textContent.substring(0, 5000); // Limit output length
            
        } catch (error: any) {
            console.warn(`[BrowserService] Playwright failed or is not installed: ${error.message}`);
            console.log(`[BrowserService] Falling back to mocked browser response...`);
            return `[Simulated Browser Output for ${url}]:\nPlaywright is either not installed or failed to launch. To enable full automation, run 'npm install playwright'.`;
        }
    }
}
