# 🚀 Guide de Déploiement sur Vercel

## Prérequis

- Compte Vercel (gratuit)
- Compte GitHub
- Projet poussé sur GitHub

## 📋 Étapes de Déploiement

### 1. Préparer les Variables d'Environnement

Avant de déployer, vous devez configurer les variables d'environnement suivantes sur Vercel :

#### Variables OBLIGATOIRES :

```bash
# Admin Authentication
ADMIN_PASSWORD=VotreMotDePasseSecurise123!

# NextAuth Secret (générez avec: openssl rand -base64 32)
NEXTAUTH_SECRET=votre_secret_nextauth_32_caracteres

# NextAuth URL (votre URL Vercel)
NEXTAUTH_URL=https://votre-app.vercel.app

# Session Secret (générez avec: openssl rand -base64 32)
SESSION_SECRET=votre_secret_session_32_caracteres

# AI Provider
AI_PROVIDER=ollama

# Database
DATABASE_URL=file:./prisma/db/esilv.db
```

#### Variables OPTIONNELLES (selon votre provider AI) :

```bash
# Si vous utilisez OpenAI
OPENAI_API_KEY=sk-...

# Si vous utilisez Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Si vous utilisez HuggingFace
HUGGINGFACE_API_KEY=hf_...

# Si vous utilisez Gemini
GEMINI_API_KEY=AIza...

# Si vous utilisez Ollama (local uniquement)
OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Déployer sur Vercel

#### Option A : Via l'interface Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub : `Farx1/esilvchatbot`
4. Configurez les variables d'environnement (voir ci-dessus)
5. Cliquez sur "Deploy"

#### Option B : Via CLI Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Suivez les instructions interactives
```

### 3. Configuration Post-Déploiement

#### A. Mettre à jour NEXTAUTH_URL

Une fois déployé, mettez à jour la variable `NEXTAUTH_URL` avec votre vraie URL :

```bash
NEXTAUTH_URL=https://votre-app.vercel.app
```

#### B. Générer les Secrets

Pour générer des secrets sécurisés :

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 4. Accès Admin

Une fois déployé :

1. Visitez `https://votre-app.vercel.app/admin/login`
2. Entrez le mot de passe défini dans `ADMIN_PASSWORD`
3. Vous aurez accès à :
   - `/admin` - Panel d'administration
   - `/admin/analytics` - Analytics avancés
   - `/rag-viewer` - Visualisation RAG

### 5. Sécurité

#### ✅ Ce qui est sécurisé :

- ✅ Toutes les clés API sont dans les variables d'environnement
- ✅ Le fichier `.env` est dans `.gitignore`
- ✅ Les routes admin sont protégées par middleware
- ✅ Authentification par cookie HTTP-only
- ✅ Cookies sécurisés en production (HTTPS)

#### ⚠️ Recommandations :

1. **Utilisez un mot de passe fort** pour `ADMIN_PASSWORD`
2. **Ne partagez JAMAIS** vos secrets
3. **Régénérez les secrets** régulièrement
4. **Activez 2FA** sur votre compte Vercel
5. **Limitez l'accès** au projet Vercel

### 6. Base de Données

⚠️ **Important** : SQLite ne fonctionne pas bien sur Vercel (système de fichiers éphémère).

Pour la production, vous devriez :

#### Option A : Utiliser Vercel Postgres

```bash
# Installer le package
npm install @vercel/postgres

# Mettre à jour DATABASE_URL
DATABASE_URL=postgres://...
```

#### Option B : Utiliser un service externe

- **Supabase** (PostgreSQL gratuit)
- **PlanetScale** (MySQL serverless)
- **Railway** (PostgreSQL)
- **Neon** (PostgreSQL serverless)

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // ou "mysql"
  url      = env("DATABASE_URL")
}
```

Puis :

```bash
npm run db:push
```

### 7. Vérification du Déploiement

Après le déploiement, vérifiez :

- [ ] Le chatbot fonctionne sur `/`
- [ ] La page de login admin est accessible sur `/admin/login`
- [ ] Les routes admin redirigent vers le login si non authentifié
- [ ] L'authentification admin fonctionne
- [ ] Les analytics s'affichent correctement
- [ ] Le RAG Viewer fonctionne

### 8. Monitoring

Vercel fournit automatiquement :

- **Analytics** : Visiteurs, performance
- **Logs** : Logs en temps réel
- **Speed Insights** : Performance web
- **Web Vitals** : Métriques UX

Accédez-y via le dashboard Vercel.

### 9. Domaine Personnalisé (Optionnel)

Pour ajouter votre propre domaine :

1. Allez dans "Settings" > "Domains"
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions
4. Mettez à jour `NEXTAUTH_URL` avec votre nouveau domaine

### 10. Mises à Jour

Pour mettre à jour votre application :

```bash
# Commitez vos changements
git add .
git commit -m "Update: description des changements"
git push origin main

# Vercel redéploiera automatiquement !
```

## 🆘 Dépannage

### Erreur : "ADMIN_PASSWORD not set"

➡️ Ajoutez la variable `ADMIN_PASSWORD` dans Vercel Settings > Environment Variables

### Erreur : Database connection

➡️ SQLite ne fonctionne pas sur Vercel. Utilisez PostgreSQL ou MySQL.

### Erreur : 401 Unauthorized sur les routes admin

➡️ Vérifiez que les cookies sont activés et que vous êtes bien authentifié.

### Les analytics ne s'affichent pas

➡️ Vérifiez que la base de données contient des données. Utilisez le seed script :

```bash
npm run db:push
node scripts/seed-esilv-complete-v2.js
```

## 📞 Support

Pour toute question :

- 📧 Email : votre-email@example.com
- 🐛 Issues : https://github.com/Farx1/esilvchatbot/issues
- 📚 Docs : Voir `docs/` dans le repository

---

**Bon déploiement ! 🚀**

