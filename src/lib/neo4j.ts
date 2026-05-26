import neo4j, { Driver } from 'neo4j-driver'

let driver: Driver | null = null

function getDriver() {
    if (!driver) {
        const uri = process.env.NEO4J_URI;
        const user = process.env.NEO4J_USER;
        const password = process.env.NEO4J_PASSWORD;
        if (!uri || !user || !password) {
            throw new Error('Neo4j credentials are not configured');
        }
        driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
    }
    return driver
}

export async function getSession() {
    return getDriver().session()
}

export async function closeDriver() {
    if (driver) {
        await driver.close()
        driver = null
    }
}
