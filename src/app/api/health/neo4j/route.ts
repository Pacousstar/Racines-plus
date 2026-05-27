import { NextRequest } from 'next/server';
import { healthcheck } from '@/lib/neo4j';
import { success, error } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
    const result = await healthcheck();
    if (result.ok) {
        return success({ latency: result.latency }, 200);
    }
    return error('Neo4j is not reachable', 503, result.error);
}
