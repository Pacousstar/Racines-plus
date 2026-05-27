import { NextResponse } from 'next/server';

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;

const limits: Record<string, number> = {
    register: 5,
    ai: 20,
    default: 30,
};

function getClientIp(request: Request): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
}

export function checkRateLimit(ip: string, endpoint: string = 'default'): { allowed: boolean; remaining: number; resetIn: number } {
    const maxRequests = limits[endpoint] || limits.default;
    const now = Date.now();
    const record = ipRequestCounts.get(ip);

    if (!record || now > record.resetAt) {
        ipRequestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: maxRequests - 1, resetIn: WINDOW_MS };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetAt - now };
}

export function rateLimitMiddleware(request: Request, endpoint: string = 'default'): NextResponse | null {
    const ip = getClientIp(request);
    const result = checkRateLimit(ip, endpoint);

    if (!result.allowed) {
        return NextResponse.json(
            { error: 'Trop de requêtes. Réessayez dans quelques secondes.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil(result.resetIn / 1000)),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    return null;
}
