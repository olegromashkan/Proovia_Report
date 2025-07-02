export interface CacheEntry<T> {
  value: T;
  expiry: number;
  etag: string;
}

const MAX_SIZE = 100;
const cache = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): CacheEntry<T> | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item as CacheEntry<T>;
}

export function setCache<T>(key: string, value: T, ttl: number, etag: string): void {
  if (cache.size >= MAX_SIZE && !cache.has(key)) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { value, expiry: Date.now() + ttl, etag });
}
