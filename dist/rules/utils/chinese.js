// Simple LRU cache for Chinese detection results
const CACHE_SIZE = 1000;
const cache = new Map();
const CHINESE_PATTERN = /[一-鿿]/;
export function hasChinese(text) {
    // Check cache first
    if (cache.has(text)) {
        return cache.get(text);
    }
    const result = CHINESE_PATTERN.test(text);
    // Only cache if we have something worth caching
    if (text.length > 0) {
        // Evict oldest entry if cache is full
        if (cache.size >= CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(text, result);
    }
    return result;
}
// Helper to clear cache (for testing)
export function clearChineseCache() {
    cache.clear();
}
