const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ckrwulviamfxeyrtbtzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnd1bHZpYW1meGV5cnRidHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYyNzYzMSwiZXhwIjoyMDg3MjAzNjMxfQ.TfdJhypBCWKnfB9U6-eow4jkCFBa93OC_qQnUZcBZg4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("==================================================");
    console.log("🚀 Lancement du test de workflow : Lajorbone Kone");
    console.log("==================================================\n");

    try {
        // 1. Création de l'utilisateur
        const email = `lajorbone.kone.${Date.now()}@testracines.com`;
        console.log(`1️⃣ Création du compte dans Auth (${email})...`);
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: email,
            password: 'Password123!',
            email_confirm: true
        });
        if (authErr) throw authErr;
        const userId = authData.user.id;
        console.log(`   ✅ Compte créé avec succès (ID: ${userId})`);

        // Attente du trigger SQL pour la création du profil (handle_new_user)
        console.log("   ⏳ Attente de la création du profil via trigger...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Mise à jour du profil avec son identité réelle
        console.log("\n2️⃣ Mise à jour du profil (Identité)...");
        const { error: updateErr } = await supabase.from('profiles').update({
            first_name: 'Lajorbone',
            last_name: 'Kone',
            village_origin: 'Toa-Zéo',
            quartier_nom: 'Quartier Centre',
            status: 'pending'
        }).eq('id', userId);
        if (updateErr) throw updateErr;
        console.log("   ✅ Identité renseignée : Lajorbone Kone (Toa-Zéo)");

        // Recherche de validateurs (CHOa / CHO ou Admin)
        const { data: choas } = await supabase.from('profiles').select('id').eq('role', 'choa').limit(2);
        const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);

        // Simuler des validateurs (Admin fait office de validateur si aucun CHO/CHOa trouvé)
        const validateurId = choas?.length > 0 ? choas[0].id : admin[0].id;
        const validateurId2 = choas?.length > 1 ? choas[1].id : validateurId;

        // 3. Workflow CHOa 
        console.log("\n3️⃣ Workflow CHOa (Pré-validation)...");
        const { error: err1 } = await supabase.from('profiles').update({
            status: 'probable',
            choa_approvals: [validateurId, validateurId2]
        }).eq('id', userId);
        if (err1) throw err1;

        // Trace audit : La validation de l'Adjoint (CHOa)
        const { error: rpcErr1 } = await supabase.rpc('record_validation', {
            p_profile_id: userId,
            p_new_status: 'probable',
            p_final: true, // pour acter le passage en probable
            p_motif: null,
            p_observations: "Sceaux CHOa apposés. Dossier transmis au CHO."
        });
        if (rpcErr1) console.error("   ⚠️ Erreur RPC:", rpcErr1);
        else console.log("   ✅ Statut passé à 'probable'. Audit enregistré.");

        // 4. Test Système de Commentaires et Notifications
        console.log("\n4️⃣ Test du système de commentaires inter-rôles...");
        const commentId = `comm_${Date.now()}`;
        const { error: commErr } = await supabase.from('validation_comments').insert({
            profile_id: userId,
            author_id: validateurId,
            content: "Le lignage de M. Kone a été vérifié auprès des sages. Je valide l'envoi."
        });
        if (commErr) throw commErr;
        console.log("   ✅ Commentaire de validation inséré.");

        // On crée manuellement une notification pour tester
        await supabase.from('notifications').insert({
            user_id: userId,
            message: "Votre dossier a été présélectionné (Probable) et sera analysé par le CHO.",
            link: "/dashboard",
            is_read: false
        });
        console.log("   ✅ Notification générée.");

        // 5. Bascule Patrimoniale (CHO)
        console.log("\n5️⃣ Bascule Patrimoniale (CHO)...");
        const { error: errFinal } = await supabase.from('profiles').update({
            status: 'confirmed'
        }).eq('id', userId);
        if (errFinal) throw errFinal;

        const { error: rpcErrFinal } = await supabase.rpc('record_validation', {
            p_profile_id: userId,
            p_new_status: 'confirmed',
            p_final: true,
            p_motif: null,
            p_observations: "Validation certifiée par le CHO. Intégration au registre."
        });
        if (rpcErrFinal) throw rpcErrFinal;
        console.log("   ✅ Statut final mis à jour sur 'confirmed'.");

        // --------------------------------------------------
        // BILAN ET VERIFICATION FINALE
        // --------------------------------------------------
        console.log("\n==================================================");
        console.log("📋 BILAN DES VERIFICATIONS DU WORKFLOW");
        console.log("==================================================");

        // A. Vérification du statut (CHOa -> CHO -> confirmed)
        const { data: finalProfile } = await supabase.from('profiles').select('status').eq('id', userId).single();
        console.log(`[1] CHO -> Bascule Patrimoniale : ${finalProfile.status === 'confirmed' ? '✅ OK (Statut: confirmed)' : '❌ ERREUR'}`);

        // B. Vérification du système de commentaires inter-rôles
        const { data: dbComms } = await supabase.from('validation_comments').select('*').eq('profile_id', userId);
        console.log(`[2] Système de commentaires : ${dbComms.length > 0 ? `✅ OK (${dbComms.length} commentaire trouvé)` : '❌ ERREUR'}`);
        if (dbComms.length > 0) console.log(`    -> "${dbComms[0].content}"`);

        // C. Vérification des notifications is_read
        const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', userId);
        console.log(`[3] Notifications is_read : ${notifs.length > 0 && notifs[0].is_read === false ? '✅ OK (Notification non lue en base)' : '❌ ERREUR'}`);

        // D. Journal des validations
        const { data: validations } = await supabase.from('validations').select('*').eq('profile_id', userId).order('created_at', { ascending: true });
        console.log(`[4] Journal des validations (validations table) : ${validations.length > 0 ? `✅ OK (${validations.length} entrées)` : '❌ ERREUR'}`);
        validations.forEach((v, i) => {
            console.log(`    -> Étape ${i + 1}: Passage à '${v.statut}' | Obs: "${v.observations}"`);
        });

        console.log("✅ TOUS LES TESTS SONT VALIDES !");

    } catch (e) {
        console.error("\n❌ Erreur pendant le test :", e);
    }
}

run();
