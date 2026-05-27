import { Redis } from '@upstash/redis';

const url = process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const client = url && token ? new Redis({ url, token }) : null;

export async function cacheGet<T>(key: string): Promise<T | null> {
    if (!client) return null;
    try {
        return await client.get<T>(key);
    } catch {
        return null;
    }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!client) return;
    try {
        await client.set(key, value, { ex: ttlSeconds });
    } catch {
        // cache is best-effort
    }
}

export async function cacheDelete(pattern: string): Promise<void> {
    if (!client) return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    } catch {
        // cache is best-effort
    }
}

export function cacheKey(prefix: string, ...parts: (string | undefined)[]): string {
    return [prefix, ...parts.filter(Boolean)].join(':');
}
