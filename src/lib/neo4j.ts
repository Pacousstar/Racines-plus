import neo4j from 'neo4j-driver'

// On crée une seule instance du driver pour toute l'application
const driver = neo4j.driver(
    process.env.NEO4J_URI || '',
    neo4j.auth.basic(
        process.env.NEO4J_USERNAME || '',
        process.env.NEO4J_PASSWORD || ''
    )
)

export async function getSession() {
    return driver.session()
}

// Fonction utilitaire pour fermer la connexion
export async function closeDriver() {
    await driver.close()
}
