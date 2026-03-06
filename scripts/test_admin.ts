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

async function runAdminTests() {
    console.log('🚀 Démarrage des tests du Backoffice Admin Racines+...\n');
    let testAssistantId: string | null = null;
    let testUserId: string | null = null;

    try {
        // --- 1. TEST : CRÉATION D'ASSISTANT ADMIN ---
        console.log('1️⃣ Création d\'un compte Assistant Admin de test...');
        const emailAssistant = `test.assistant.${Date.now()}@example.com`;

        // Simuler la création via service_role (comme l'API)
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: emailAssistant,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { full_name: 'Assistant Test' }
        });

        if (authErr || !authData.user) throw new Error("Échec création Auth: " + authErr?.message);
        testAssistantId = authData.user.id;
        console.log(`✅ Compte Auth Assistant créé: ${testAssistantId}`);

        // Créer le profil public en 'admin' (+upsert pour écraser le défaut)
        const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
            id: testAssistantId,
            first_name: 'Assistant',
            last_name: 'Test',
            email: emailAssistant,
            phone_1: '0102030405',
            role: 'admin',
            status: 'confirmed', // statuts par défaut de l'API
            created_at: new Date().toISOString()
        });
        if (profileErr) throw new Error("Échec upsert profil Assistant: " + profileErr.message);
        console.log(`✅ Profil Assistant créé avec succès.`);

        // Créer les permissions Admin
        const { error: permErr } = await supabaseAdmin.from('admin_permissions').insert({
            user_id: testAssistantId,
            can_validate_users: true,
            can_export_data: true,
            can_manage_villages: false
        });
        if (permErr) throw new Error("Échec insertion permissions: " + permErr.message);
        console.log(`✅ Permissions Assistant insérées avec succès.`);


        // --- VERIFICATIONS 1 ---
        const { data: checkRole } = await supabaseAdmin.from('profiles').select('role, status').eq('id', testAssistantId).single();
        if (checkRole?.role !== 'admin' || checkRole?.status !== 'confirmed') {
            throw new Error(`Statut ou Rôle incorrect. Obtenu: ${JSON.stringify(checkRole)}`);
        }

        const { data: checkPerms } = await supabaseAdmin.from('admin_permissions').select('*').eq('user_id', testAssistantId).single();
        if (!checkPerms?.can_validate_users || !checkPerms?.can_export_data) {
            throw new Error(`Permissions incorrectes. Obtenu: ${JSON.stringify(checkPerms)}`);
        }
        console.log(`✨ Vérification Création Assistant : SUCCÈS - Rôle, Statut et Permissions corrects.\n`);


        // --- 2. TEST : SUPPRESSION D'UN UTILISATEUR (DELETE-USER) ---
        console.log('2️⃣ Création d\'un compte Utilisateur Lambda pour tester la suppression...');
        const emailUser = `test.tobedeleted.${Date.now()}@example.com`;
        const { data: userAuth, error: uAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: emailUser,
            password: 'Password123!',
            email_confirm: true
        });
        if (uAuthErr || !userAuth.user) throw new Error("Échec création Auth User: " + uAuthErr?.message);
        testUserId = userAuth.user.id;
        console.log(`✅ Compte Lambda créé: ${testUserId}`);

        // Supprimer via la même logique que delete-user/route.ts
        console.log('⏳ Suppression du compte Lambda en cours (comme l\'API le fait)...');
        // Cleanup exhaustif
        await supabaseAdmin.from('activity_logs').delete().eq('user_id', testUserId);
        await supabaseAdmin.from('activity_logs').delete().eq('target_user_id', testUserId);
        await supabaseAdmin.from('admin_permissions').delete().eq('user_id', testUserId);
        await supabaseAdmin.from('validations').delete().eq('profile_id', testUserId);
        await supabaseAdmin.from('validations').delete().eq('validator_id', testUserId);
        await supabaseAdmin.from('invitations').delete().eq('inviter_id', testUserId);
        await supabaseAdmin.from('validation_comments').delete().eq('profile_id', testUserId);
        await supabaseAdmin.from('validation_comments').delete().eq('author_id', testUserId);
        await supabaseAdmin.from('notifications').delete().eq('user_id', testUserId);
        await supabaseAdmin.from('link_validations').delete().eq('created_by', testUserId);
        await supabaseAdmin.from('link_validations').delete().eq('validated_by', testUserId);

        const { error: profDelErr } = await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
        if (profDelErr) {
            console.error("❌ ERREUR SUPPRESSION PROFIL BD :", profDelErr);
            throw new Error(`Échec suppression profil BD: [${profDelErr.code}] ${profDelErr.message}${profDelErr.details ? ' - ' + profDelErr.details : ''}`);
        }

        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(testUserId);
        if (deleteErr) throw new Error("Échec delete Auth User: " + deleteErr.message);

        // --- VERIFICATIONS 2 ---
        // Vérifier qu'il n'est plus dans Auth
        try {
            await supabaseAdmin.auth.admin.getUserById(testUserId);
            // S'il ne throw pas d'erreur, c'est qu'il existe encore
            throw new Error("L'utilisateur existe toujours dans Auth après suppression !");
        } catch (e: any) {
            if (e.message && e.message.includes('toujours')) {
                throw e;
            }
            // L'erreur de l'API signifiant Not Found est attendue ici.
        }

        const { data: checkDelProfile } = await supabaseAdmin.from('profiles').select('id').eq('id', testUserId).single();
        if (checkDelProfile) {
            throw new Error("Le profil existe toujours dans la DB !");
        }
        console.log(`✨ Vérification Suppression User : SUCCÈS - Utilisateur totalement supprimé.\n`);

        console.log('🎉 TOUS LES TESTS ADMIN SONT PASSÉS AVEC SUCCÈS !');

    } catch (e: any) {
        console.error('\n❌ UNE ERREUR EST SURVENUE PENDANT LE TEST :', e.message);
    } finally {
        // --- NETTOYAGE ASSISTANT ---
        if (testAssistantId) {
            console.log('\n🧹 Nettoyage de la base de données (suppression de l\'assistant de test)...');
            // Les objets dépendants doivent être supprimés en premier si pas de cascade
            await supabaseAdmin.from('admin_permissions').delete().eq('user_id', testAssistantId);
            await supabaseAdmin.from('profiles').delete().eq('id', testAssistantId);
            await supabaseAdmin.auth.admin.deleteUser(testAssistantId);
            console.log('✅ Base nettoyée.');
        }

        // Au cas où le compte de test User n'a pas été supprimé par l'étape 2 (erreur intermédiaire)
        if (testUserId) {
            try {
                await supabaseAdmin.from('profiles').delete().eq('id', testUserId);
                await supabaseAdmin.auth.admin.deleteUser(testUserId);
            } catch (e) { }
        }
    }
}

runAdminTests();
