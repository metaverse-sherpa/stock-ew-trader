// Simple in-memory cache implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private static instance: Cache;
  private cache: Record<string, CacheItem<any>> = {};
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {}

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache[key] = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };
  }

  public get<T>(key: string): T | null {
    const item = this.cache[key];
    if (!item) return null;

    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    return item.data as T;
  }

  public getAll(): Record<string, any> {
    const result = {};
    for (const key in this.cache) {
      if (Date.now() <= this.cache[key].expiresAt) {
        result[key] = this.cache[key].data;
      } else {
        this.delete(key);
      }
    }
    return result;
  }

  public delete(key: string): void {
    delete this.cache[key];
  }

  public clear(): void {
    this.cache = {};
  }

  public has(key: string): boolean {
    const item = this.cache[key];
    if (!item) return false;

    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }
}

export const globalCache = Cache.getInstance();
