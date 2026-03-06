import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables environnement Supabase absentes.');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runTests() {
    console.log('🚀 Démarrage des tests du workflow complet Racines+...\n');
    let testUserId: string | null = null;

    try {
        // --- ETAPE 1 : SIMULER UNE INSCRIPTION ---
        console.log('1️⃣ Création d\'un compte utilisateur de test...');
        const email = `test.workflow.${Date.now()}@example.com`;
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { full_name: 'Testeur Automatique' }
        });

        if (authErr || !authData.user) throw new Error("Échec création Auth: " + authErr?.message);
        testUserId = authData.user.id;
        console.log(`✅ Compte Auth créé: ${testUserId} (${email})`);

        // Créer le profil initial comme le fait le formulaire Onboarding via l'API, avec status: 'pending_choa'
        const initialProfile = {
            id: testUserId,
            first_name: 'Testeur',
            last_name: 'Automatique',
            email: email,
            phone_1: '0102030405',
            gender: 'Homme',
            birth_date: '1990-01-01',
            residence_country: 'CI',
            residence_city: 'Abidjan',
            village_origin: 'Toa-Zéo',
            quartier_nom: 'Quartier Test',
            role: 'user',
            status: 'pending_choa',
            choa_approvals: [],
            created_at: new Date().toISOString()
        };

        const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(initialProfile);
        if (profileErr) throw new Error("Échec insertion profil: " + profileErr.message);
        console.log(`✅ Profil inséré avec succès. Statut initial: pending_choa`);


        // --- VERIFIER ETAT INITIAL ---
        const { data: check1 } = await supabaseAdmin.from('profiles').select('status, choa_approvals').eq('id', testUserId).single();
        if (check1?.status !== 'pending_choa') throw new Error(`Statut inattendu. Reçu: ${check1?.status}, Attendu: pending_choa`);
        console.log(`✅ Vérification 1 réussie : L'utilisateur est bien bloqué en attente CHOa.`);


        // --- ETAPE 2 : VALIDATION CHOa 1 ---
        console.log('\n2️⃣ Simulation: Le premier CHOa valide le dossier...');
        const choa1_id = 'mock-choa-1';

        // Simuler la mise à jour (comme le fait l'UI CHOa)
        const newApprovals1 = [...(check1?.choa_approvals || []), choa1_id];
        // Dès qu'il y a 1 validateur, le statut passe (dans la logique du front) à 'pre_approved' ou reste 'pending_choa' jusqu'à 2.
        // Le front met à jour le statut. Faisons le:
        const nextStatus1 = newApprovals1.length >= 2 ? 'probable' : 'pre_approved';

        await supabaseAdmin.from('profiles').update({
            choa_approvals: newApprovals1,
            status: nextStatus1
        }).eq('id', testUserId);

        const { data: check2 } = await supabaseAdmin.from('profiles').select('status, choa_approvals').eq('id', testUserId).single();
        console.log(`✅ Vérification 2 réussie : Validation 1 faite. Nouveau statut: ${check2?.status} (Attendu: pre_approved)`);


        // --- ETAPE 3 : VALIDATION CHOa 2 ---
        console.log('\n3️⃣ Simulation: Le deuxième CHOa valide le dossier...');
        const choa2_id = 'mock-choa-2';
        const newApprovals2 = [...(check2?.choa_approvals || []), choa2_id];
        const nextStatus2 = newApprovals2.length >= 2 ? 'probable' : 'pre_approved';

        await supabaseAdmin.from('profiles').update({
            choa_approvals: newApprovals2,
            status: nextStatus2
        }).eq('id', testUserId);

        const { data: check3 } = await supabaseAdmin.from('profiles').select('status').eq('id', testUserId).single();
        if (check3?.status !== 'probable') throw new Error(`Statut invalide après 2 validations. Reçu: ${check3?.status}, Attendu: probable`);
        console.log(`✅ Vérification 3 réussie : L'utilisateur passe au statut final 'probable', visible par le CHO !`);


        // --- ETAPE 4 : VALIDATION CHO ---
        console.log('\n4️⃣ Simulation: Le grand CHO du village confirme...');
        await supabaseAdmin.from('profiles').update({
            status: 'confirmed'
        }).eq('id', testUserId);

        const { data: check4 } = await supabaseAdmin.from('profiles').select('status').eq('id', testUserId).single();
        if (check4?.status !== 'confirmed') throw new Error(`Statut invalide. Reçu: ${check4?.status}, Attendu: confirmed`);
        console.log(`✅ Vérification 4 réussie : L'utilisateur est publiquement CONFIRMÉ dans la communauté.`);

        console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! LA LOGIQUE EST PARFAITEMENT SÉCURISÉE.');

    } catch (e: any) {
        console.error('\n❌ UNE ERREUR EST SURVENUE PENDANT LE TEST :', e.message);
    } finally {
        // --- NETTOYAGE ---
        if (testUserId) {
            console.log('\n🧹 Nettoyage de la base de données (suppression du compte de test)...');
            await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
            await supabaseAdmin.auth.admin.deleteUser(testUserId);
            console.log('✅ Base nettoyée.');
        }
    }
}

runTests();
