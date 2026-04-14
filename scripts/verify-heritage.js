const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage de la vérification technique (Axes 2 & 3)...');

const filesToCheck = [
    'src/components/VillageHeritageManager.tsx',
    'src/components/FamilyBook.tsx',
    'src/components/PremiumTreeTemplate.tsx',
    'src/components/ExportTreeModal.tsx',
    'src/app/choa/page.tsx'
];

let success = true;

// 1. Vérification de l'existence des fichiers
filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ Fichier présent : ${file}`);
    } else {
        console.error(`❌ Fichier MANQUANT : ${file}`);
        success = false;
    }
});

// 2. Vérification de la logique "Orientation" dans FamilyBook
const familyBookContent = fs.readFileSync('src/components/FamilyBook.tsx', 'utf8');
if (familyBookContent.includes('format?: \'portrait\' | \'landscape\'')) {
    console.log('✅ FamilyBook supporte le multi-format (Portrait/Paysage).');
} else {
    console.error('❌ FamilyBook ne semble pas supporter le multi-format.');
    success = false;
}

// 3. Vérification de la logique "DNA Side" dans PersonalLineageTree
const treeContent = fs.readFileSync('src/components/PersonalLineageTree.tsx', 'utf8');
if (treeContent.includes('sideThemes') && treeContent.includes('paternal') && treeContent.includes('maternal')) {
    console.log('✅ PersonalLineageTree possède la coloration ADN spécialisée (Bleu/Rouge).');
} else {
    console.error('❌ PersonalLineageTree est manquant de la logique ADN.');
    success = false;
}

// 4. Vérification de l'onglet Patrimoine dans le dashboard
const choPageContent = fs.readFileSync('src/app/choa/page.tsx', 'utf8');
if (choPageContent.includes('key: \'patrimoine\'') && choPageContent.includes('VillageHeritageManager')) {
    console.log('✅ Dashboard CHO : Onglet Patrimoine intégré.');
} else {
    console.error('❌ Dashboard CHO : Onglet Patrimoine manquant ou mal intégré.');
    success = false;
}

if (success) {
    console.log('\n✨ TOUS LES TESTS TECHNIQUES ONT RÉUSSI !');
    process.exit(0);
} else {
    console.error('\n⚠️ CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ.');
    process.exit(1);
}
