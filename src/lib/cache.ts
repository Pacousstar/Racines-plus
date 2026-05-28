import { Redis } from '@upstash/redis';

let client: Redis | null = null;

function getClient(): Redis | null {
    if (client) return client;
    try {
        client = Redis.fromEnv();
    } catch {
        const url = process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
        if (url && token) {
            client = new Redis({ url, token });
        }
    }
    return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    const c = getClient();
    if (!c) return null;
    try {
        return await c.get<T>(key);
    } catch {
        return null;
    }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const c = getClient();
    if (!c) return;
    try {
        await c.set(key, value, { ex: ttlSeconds });
    } catch {
        // cache is best-effort
    }
}

export async function cacheDelete(pattern: string): Promise<void> {
    const c = getClient();
    if (!c) return;
    try {
        const keys = await c.keys(pattern);
        if (keys.length > 0) {
            await c.del(...keys);
        }
    } catch {
        // cache is best-effort
    }
}

export function cacheKey(prefix: string, ...parts: (string | undefined)[]): string {
    return [prefix, ...parts.filter(Boolean)].join(':');
}
