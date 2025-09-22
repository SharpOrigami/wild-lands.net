
import * as allIllustrations from '../assets/card-illustrations/index.ts';
import { getCacheBustedUrl } from './cardUtils.ts';
import { CHARACTERS_LIST, NG_PLUS_THEME_MILESTONE_INTERVAL } from '../constants.ts';

const BACKGROUND_ASSETS: { [key: number]: string[] } = {
    0: [
        'https://storage.googleapis.com/wild-lands-card-images/background_image.png',
        'https://storage.googleapis.com/wild-lands-card-images/background_image2.png'
    ],
    10: [
        'https://storage.googleapis.com/wild-lands-card-images/background_image_fj.png',
        'https://storage.googleapis.com/wild-lands-card-images/background_image_fj2.png'
    ],
    20: [
        'https://storage.googleapis.com/wild-lands-card-images/background_image_as.png',
        'https://storage.googleapis.com/wild-lands-card-images/background_image_as2.png'
    ],
    30: [
        'https://storage.googleapis.com/wild-lands-card-images/background_image_sh.png',
        'https://storage.googleapis.com/wild-lands-card-images/background_image_sh2.png'
    ],
    40: [
        'https://storage.googleapis.com/wild-lands-card-images/background_image_cp.png',
        'https://storage.googleapis.com/wild-lands-card-images/background_image_cp2.png'
    ],
};

const allIllustrationMaps = {
    common: allIllustrations.COMMON_ILLUSTRATIONS,
    western: allIllustrations.WESTERN_ILLUSTRATIONS,
    japan: allIllustrations.JAPAN_ILLUSTRATIONS,
    africa: allIllustrations.AFRICA_ILLUSTRATIONS,
    horror: allIllustrations.HORROR_ILLUSTRATIONS,
    cyberpunk: allIllustrations.CYBERPUNK_ILLUSTRATIONS,
};

export type ThemeName = keyof typeof allIllustrationMaps;
export const ALL_THEMES = Object.keys(allIllustrationMaps) as ThemeName[];

class ImageManager {
    private preloadedUrls = new Set<string>();
    private assetTimeout = 45000; // 45 seconds per image

    public getUrlsForThemes(themes: ThemeName[]): string[] {
        const urls = new Set<string>();
        const themeMilestones: { [key in ThemeName]?: number } = { western: 0, japan: 10, africa: 20, horror: 30, cyberpunk: 40 };
        
        themes.forEach(theme => {
            if (theme !== 'common') {
                const milestone = themeMilestones[theme];
                if (milestone !== undefined && BACKGROUND_ASSETS[milestone]) {
                    BACKGROUND_ASSETS[milestone].forEach(url => urls.add(url));
                }
            }
            const illustrationMap = allIllustrationMaps[theme];
            if (illustrationMap) {
                Object.values(illustrationMap).forEach(url => url && urls.add(url));
            }
        });
        return Array.from(urls);
    }

    public async preloadBatch(urls: string[], onAssetLoaded?: () => void) {
        const urlsToProcess = urls.filter(url => url && !this.preloadedUrls.has(url));
        if (urlsToProcess.length === 0) {
            // If there's nothing to process but a callback exists, call it for each skipped URL
            if (onAssetLoaded) {
                urls.forEach(() => onAssetLoaded());
            }
            return;
        }
        
        let successfulLoads = 0;

        const promises = urlsToProcess.map(url =>
            new Promise<void>(resolve => {
                const timeout = setTimeout(() => {
                    console.warn(`Timeout preloading image: ${url}`);
                    if (onAssetLoaded) onAssetLoaded();
                    resolve();
                }, this.assetTimeout);
                
                // Use 'no-cors' to populate the browser's HTTP cache.
                // We cannot read the response, but the browser will cache it for subsequent <img> tag requests.
                // This avoids the CORS errors that a standard fetch() would cause.
                fetch(getCacheBustedUrl(url), { mode: 'no-cors' })
                    .then(() => {
                        // With 'no-cors', we can't check response.ok, so we optimistically assume success.
                        // The primary goal is to get the request into the browser's network stack.
                        this.preloadedUrls.add(url);
                        successfulLoads++;
                        clearTimeout(timeout);
                        if (onAssetLoaded) onAssetLoaded();
                        resolve();
                    })
                    .catch(error => {
                        // This will likely only catch network errors, not HTTP status errors like 404.
                        console.warn(`Failed to preload image (network error?): ${url}`, error);
                        clearTimeout(timeout);
                        if (onAssetLoaded) onAssetLoaded();
                        resolve(); 
                    });
            })
        );
        await Promise.all(promises);
        if (successfulLoads > 0) {
            console.log(`${successfulLoads}/${urlsToProcess.length} new image assets requested for preload to browser cache.`);
        }
    }
    
    public async preloadThemes(themes: ThemeName[], onAssetLoaded?: () => void) {
        const urlsToLoad = this.getUrlsForThemes(themes);
        await this.preloadBatch(urlsToLoad, onAssetLoaded);
    }
    
    public isPreloaded(url: string): boolean {
        return this.preloadedUrls.has(url);
    }

    public getCachedUrl(originalUrl: string | undefined): string {
        if (!originalUrl) {
            return '';
        }
        // Rely on the browser's HTTP cache, which we populated during preloading.
        return getCacheBustedUrl(originalUrl);
    }
}

export const imageManager = new ImageManager();