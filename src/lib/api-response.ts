import { NextResponse } from 'next/server';

type ApiPayload = Record<string, unknown> | unknown[] | null;

export function success(data: ApiPayload, status: number = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status: number = 400, details?: string) {
    return NextResponse.json({ success: false, error: message, ...(details && { details }) }, { status });
}

export function paginated<T>(items: T[], total: number, page: number, limit: number) {
    return NextResponse.json({
        success: true,
        data: items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    });
}
