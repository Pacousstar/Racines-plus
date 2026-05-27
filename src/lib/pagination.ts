export function parsePagination(searchParams: URLSearchParams): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    return { page, limit, offset: (page - 1) * limit };
}
