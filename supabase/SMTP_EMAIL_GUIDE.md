# 📧 Guide de configuration Email Supabase

> **Objectif** : activer l'envoi d'emails automatiques (invitations, confirmations, reset mdp) dans Racines+

## Pourquoi ça ne fonctionne pas encore ?

Par défaut, Supabase fournit un serveur SMTP de test avec des **limites très strictes** (2 emails/heure en développement). Il faut configurer un serveur SMTP externe pour la production.

---

## Option recommandée : Resend (gratuit — 3 000 emails/mois)

### Étape 1 — Créer un compte Resend

1. Aller sur [resend.com](https://resend.com) → **Get Started** (gratuit)
2. Créer un compte avec `pacous2000@gmail.com`
3. Dans le dashboard Resend → **API Keys** → **Create API Key** → Nommer : `Racines+`
4. **Copier la clé** (commence par `re_...`) — elle n'apparaît qu'une fois

> [!IMPORTANT]
> Sans domaine personnalisé (`@racines-plus.ci` par exemple), les emails partiront de `onboarding@resend.dev`. C'est parfait pour le MVP.

---

### Étape 2 — Configurer Supabase SMTP

1. Aller dans **[supabase.com](https://supabase.com)** → ton projet → **Project Settings**
2. Cliquer sur **Authentication** dans le menu gauche
3. Scroller jusqu'à **SMTP Settings**
4. Activer **"Enable Custom SMTP"**
5. Remplir les champs :

| Champ | Valeur |
|---|---|
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | `re_VOTRE_CLE_API_RESEND` |
| **Sender Email** | `noreply@resend.dev` |
| **Sender Name** | `Racines+` |

6. Cliquer **Save**

---

### Étape 3 — Personnaliser les templates d'email

Dans **Supabase → Authentication → Email Templates** :

#### Template "Invitation" (pour les invitations famille)
```
Objet : {{ .SenderName }} vous invite à rejoindre Racines+

Bonjour,

{{ .SenderName }} vous invite à rejoindre l'arbre généalogique du village de Toa-Zéo sur Racines+.

Cliquez sur le lien ci-dessous pour créer votre profil :
{{ .ConfirmationURL }}

Ce lien expire dans 7 jours.

— L'équipe Racines+
```

#### Template "Confirm Signup" (confirmation email)
```
Objet : Confirmez votre inscription à Racines+

Bonjour,

Merci de rejoindre Racines+ — la forteresse numérique souveraine de votre lignée africaine.

Cliquez pour confirmer votre email :
{{ .ConfirmationURL }}

— L'équipe Racines+, Village de Toa-Zéo
```

---

### Étape 4 — Tester l'envoi

1. Aller sur [racines-plus.vercel.app/onboarding](https://racines-plus.vercel.app/onboarding)
2. S'inscrire avec un email valide
3. Vérifier la réception de l'email de confirmation
4. Cliquer le lien dans l'email → connexion automatique

> [!TIP]
> Si l'email arrive dans les spams, ajouter un domaine personnalisé dans Resend et configurer les DNS. Guide Resend : [resend.com/docs/send-with-custom-domain](https://resend.com/docs/send-with-custom-domain)

---

## Alternative si tu veux utiliser Gmail

> [!WARNING]
> Gmail bloque les connexions SMTP directes. Il faut utiliser un "Mot de passe d'application".

1. Activer la **validation en 2 étapes** sur `pacous2000@gmail.com`
2. Aller sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Créer un mot de passe pour "Autre" → nommer "Racines+"
4. Copier le mot de passe généré (16 caractères)
5. Dans Supabase SMTP :

| Champ | Valeur |
|---|---|
| **Host** | `smtp.gmail.com` |
| **Port** | `465` |
| **Username** | `pacous2000@gmail.com` |
| **Password** | *(mot de passe d'application 16 car.)* |
| **Sender Email** | `pacous2000@gmail.com` |

> [!CAUTION]
> Gmail limite à 500 emails/jour. Resend est plus adapté pour une app en production.

---

## Variables Vercel à ajouter (optionnel, pour emails custom via API)

Si tu veux un endpoint API `/api/send-email` dans Next.js, ajouter dans **Vercel → Settings → Environment Variables** :

```
RESEND_API_KEY=re_VOTRE_CLE_API
EMAIL_FROM=noreply@resend.dev
```
