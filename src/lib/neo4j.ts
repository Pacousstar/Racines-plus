import neo4j, { Driver, Session } from 'neo4j-driver'

let driver: Driver | null = null

function getDriver() {
    if (!driver) {
        const uri = process.env.NEO4J_URI;
        const user = process.env.NEO4J_USER;
        const password = process.env.NEO4J_PASSWORD;
        if (!uri || !user || !password) {
            throw new Error('Neo4j credentials are not configured');
        }
        driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
            maxConnectionPoolSize: 10,
            connectionTimeout: 10_000,
            maxTransactionRetryTime: 5_000,
        })
    }
    return driver
}

export async function getSession(): Promise<Session> {
    return getDriver().session()
}

export async function closeDriver(): Promise<void> {
    if (driver) {
        await driver.close()
        driver = null
    }
}

export async function healthcheck(): Promise<{ ok: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
        const session = getDriver().session();
        await session.run('RETURN 1');
        await session.close();
        return { ok: true, latency: Date.now() - start };
    } catch (err) {
        return { ok: false, latency: Date.now() - start, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function withRetry<T>(fn: (session: Session) => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const session = getDriver().session();
        try {
            const result = await fn(session);
            return result;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
            }
        } finally {
            await session.close();
        }
    }
    throw lastError || new Error('Max retries reached');
}
