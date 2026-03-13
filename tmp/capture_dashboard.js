const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("Lancement du navigateur headless...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('[CHOa Debug]')) {
             console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
        }
    });

    console.log("Navigation vers /login...");
    await page.goto('http://localhost:3000/login');
    
    await page.waitForTimeout(2000);
    console.log("Remplissage du formulaire de connexion...");
    await page.fill('input[type="email"]', 'pacousstar01@gmail.com');
    await page.fill('input[type="password"]', 'Mignon29@');
    
    console.log("Clic sur le bouton de connexion...");
    await page.click('button:has-text("Se connecter")');
    
    console.log("Attente de la redirection vers /choa...");
    await page.waitForURL('**/choa', { timeout: 15000 });
    
    console.log("Arrivé sur /choa. Attente du chargement initial...");
    await page.waitForTimeout(3000);
    
    console.log("Capture d'écran de l'onglet par défaut (À valider)...");
    await page.screenshot({ path: 'C:\\Users\\GSN-EXPERTISES\\.gemini\\antigravity\\brain\\ed24593c-e629-484f-ba43-5532d3132103\\browser_choa_tab1.png', fullPage: true });

    console.log("Clic sur 'Envoyés au CHO'...");
    await page.click('text="Envoyés au CHO"');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\GSN-EXPERTISES\\.gemini\\antigravity\\brain\\ed24593c-e629-484f-ba43-5532d3132103\\browser_choa_tab2.png', fullPage: true });

    console.log("Clic sur 'Activité Quartier'...");
    await page.click('text="Activité Quartier"');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\GSN-EXPERTISES\\.gemini\\antigravity\\brain\\ed24593c-e629-484f-ba43-5532d3132103\\browser_choa_tab3.png', fullPage: true });

    console.log("Test terminé. Fermeture du navigateur.");
    await browser.close();
})();
