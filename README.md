# ESILV Smart Assistant 🤖

Assistant intelligent pour l'École Supérieure d'Ingénieurs Léonard-de-Vinci (ESILV), développé avec Next.js, TypeScript et IA générative.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)](https://nextjs.org/)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Utilisation](#-utilisation)
- [Architecture](#️-architecture)
- [Technologies](#-technologies)
- [Documentation](#-documentation)
- [Contribution](#-contribution)

---

## ✨ Fonctionnalités

### 🤖 Routage d'intention par mots-clés

Un seul orchestrateur (`src/app/api/chat/route.ts`) choisit, par mots-clés, l'un de 3 handlers LLM :

- **Retrieval** : RAG par recherche de mots-clés sur SQLite (sans embeddings) ; peut appeler le scraper web pour vérifier/compléter (badge `SCRAPER` dans ce cas)
- **Form-filling** : prompt LLM qui demande les coordonnées dans la conversation (aucun formulaire n'est rendu)
- **Orchestration** : dialogue général sur l'ESILV

### 📚 Base de Connaissances (RAG) Enrichie

- **~30 entrées** saisies manuellement (`scripts/seed-esilv-complete-v2.js`)
- **200+ URLs** du site ESILV intégrées automatiquement
- **15 majeures** de spécialisation documentées
- Informations complètes sur :
  - Programmes (Prépa intégrée, Cycle ingénieur, MSc, Bachelors)
  - Admissions (Concours Avenir, Avenir Prépas, Parallèles)
  - Vie étudiante, International, Alternance, Débouchés
- **Vérification intelligente** : Données vérifiées automatiquement (scraping parallèle)
- **Citations de sources** : Chaque réponse cite ses sources

### 📄 Upload de Documents au RAG

- **Drag & Drop** : Interface intuitive pour uploader des documents
- **Multi-formats** : Support PDF, DOCX, TXT, MD
- **Parsing intelligent** : Extraction automatique du texte
- **Chunking optimisé** : Découpage intelligent (~1500 caractères/chunk)
- **Limite** : 50MB par fichier
- **Intégration automatique** : Les documents deviennent interrogeables immédiatement

### 🔍 Scraping Web Intelligent

- **Navigation automatique** : Mapping intelligent des requêtes vers les pages ESILV
- **Deep scraping** : Extraction complète du contenu des actualités
- **Détection de conflits** : Compare les données web avec le RAG
- **Mise à jour automatique** : Remplace les informations obsolètes
- **Logging** : Historique complet des modifications RAG

### 📊 Analytics & Monitoring

- **Dashboard analytics** : Visualisation en temps réel
- **Health Check** : Monitoring des services (Ollama, Gemini, Database)
- **Status dynamique** : Indicateur "En ligne" conditionnel
- **Badges de confiance** : Score de confiance par réponse
- **Historique des conversations** : Persistence en localStorage

### 🎨 Interface Utilisateur

- **Design moderne** : UI premium avec Tailwind CSS et shadcn/ui
- **Responsive** : Adapté mobile, tablette, desktop
- **Dark mode ready** : Support du mode sombre
- **Feedback utilisateur** : Like/Dislike sur les réponses
- **Suggestions** : Recommandations de questions pertinentes
- **RAG Viewer** : Visualisation et gestion de la base de connaissances

### 🔧 Support Multi-LLM

Compatible avec plusieurs fournisseurs d'IA :
- **Ollama** (recommandé) : Modèles locaux (llama3, mistral, etc.)
- **Google Gemini** : gemini-2.0-flash-exp
- **OpenAI** : GPT-4, GPT-3.5-turbo
- **Anthropic Claude** : claude-3-sonnet
- **Hugging Face** : Modèles open-source

---

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- npm ou pnpm
- Git
- Ollama (recommandé pour le développement local)

### Installation rapide

```bash
# 1. Cloner le repository
git clone https://github.com/Farx1/esilvchatbot.git
cd esilvchatbot

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env (voir .env.example pour la liste complète)

# 4. Initialiser la base de données
npm run db:push

# 5. ⚠️ IMPORTANT : Enrichir la base de connaissances AVANT de lancer l'app
# Charger les données ESILV (~30 entrées manuelles)
node scripts/seed-esilv-complete-v2.js

# Enrichir avec 200+ URLs ESILV (recommandé)
node scripts/update-rag-with-urls.js

# 6. Lancer le serveur
npm run dev
```

> **⚠️ Important** : Il est **obligatoire** d'exécuter les scripts de seed (`update-rag-with-urls.js`) **AVANT** de lancer l'application pour la première fois. Sinon, la base de connaissances sera vide et le chatbot ne pourra pas répondre correctement.

L'application sera disponible sur **http://localhost:3000**

---

## ⚙️ Configuration

### Fichier `.env`

```env
# Database
DATABASE_URL=file:./db/custom.db

# AI Provider (choisir un)
AI_PROVIDER=ollama

# Ollama (recommandé pour le développement)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest

# Ou Gemini
GEMINI_API_KEY=votre-clé-api
GEMINI_MODEL=gemini-2.0-flash-exp

# Ou OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Admin (/admin/*, /rag-viewer, routes d'écriture)
ADMIN_PASSWORD=mot-de-passe-admin
SESSION_SECRET=chaine-aleatoire-longue
```

Liste complète des variables lues par le code : [`.env.example`](.env.example).

### Configuration d'Ollama

```bash
# Installer Ollama
# Windows: https://ollama.ai/download
# Mac: brew install ollama
# Linux: curl https://ollama.ai/install.sh | sh

# Télécharger un modèle
ollama pull llama3:latest

# Démarrer Ollama (auto-démarre sur Windows/Mac)
ollama serve

# Ou utiliser le script (Windows)
npm run ollama:start
```

---

## 💻 Utilisation

### Interface Chatbot

1. Accéder à **http://localhost:3000**
2. Poser une question sur l'ESILV
3. Observer l'agent utilisé (badge : RAG / SCRAPER / FORM / ORCHESTRATION)
4. Voir le score de confiance
5. Donner un feedback (👍/👎)

### Upload de Documents

1. Aller sur **http://localhost:3000/rag-viewer**
2. Glisser-déposer un fichier (PDF, DOCX, TXT, MD)
3. Attendre le traitement (quelques secondes)
4. Le document est maintenant interrogeable !

### Administration

1. Se connecter sur **/admin/login** (mot de passe `ADMIN_PASSWORD`)
2. Visualiser les analytics **/admin/analytics**
3. Gérer la base de connaissances **/admin/knowledge** ou **/rag-viewer**

---

## 🏗️ Architecture

### Stack Technique

```
Frontend (Next.js 15 + React 19 + TypeScript)
    ↓
API Routes (Next.js API)
    ├─ /api/chat          → Routage par mots-clés vers 3 handlers LLM
    ├─ /api/knowledge     → Gestion RAG (CRUD)
    ├─ /api/scraper       → Web scraping ESILV
    ├─ /api/documents     → Upload & parsing
    └─ /api/health        → Health check
    ↓
Services
    ├─ RAG (Prisma + SQLite, recherche par mots-clés)
    ├─ AI Providers (Ollama / Gemini / OpenAI)
    ├─ Scraper (Cheerio + Node Fetch)
    └─ Document Parser (pdf-parse-fork, mammoth)
```

### Structure du Projet

```
esilvchatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/           # Orchestration chatbot
│   │   │   ├── knowledge/      # CRUD RAG
│   │   │   ├── scraper/        # Web scraping
│   │   │   ├── documents/      # Upload & parsing
│   │   │   ├── health/         # Health check
│   │   │   └── ai-config/      # Config AI providers
│   │   ├── admin/              # login, analytics, knowledge
│   │   ├── rag-viewer/         # Visualisation RAG
│   │   └── page.tsx            # Interface chatbot
│   ├── components/             # Composants React
│   ├── lib/                    # Utilitaires & DB
│   └── hooks/                  # Custom hooks
├── prisma/
│   └── schema.prisma           # Schéma DB (SQLite)
├── scripts/
│   ├── seed-esilv-complete-v2.js    # Seed ~30 entrées
│   ├── update-rag-with-urls.js      # Ajouter 200+ URLs
│   └── validate-rag-data.js         # Tests automatisés
├── docs/                       # Documentation complète
├── public/                     # Assets statiques
└── db/
    └── custom.db               # Base de données SQLite
```

---

## 🛠️ Technologies

### Frontend

- **Next.js 15** (App Router, Server Components)
- **React 19** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Framer Motion** (animations)
- **Lucide React** (icônes)

### Backend

- **Next.js API Routes**
- **Prisma ORM** + SQLite
- **NextAuth.js** (authentification)
- **Cheerio** (web scraping)
- **pdf-parse-fork** (parsing PDF)
- **mammoth** (parsing DOCX)

### AI / ML

- **Ollama** (modèles locaux)
- **Google Generative AI SDK** (`@google/generative-ai`)
- **OpenAI, Anthropic, Hugging Face** : appels HTTP directs (`fetch`), sans SDK

---

## 📖 Documentation

### Guides Utilisateur

- **[Guide d'utilisation Drag & Drop](docs/DRAG_DROP_GUIDE.md)** : Comment uploader des documents
- **[Résumé Final v1.2](docs/FINAL_SUMMARY_V1.2.md)** : Vue d'ensemble complète

### Guides Techniques

- **[Documentation Technique](docs/TECHNICAL_DOCUMENTATION.md)** : Architecture détaillée
- **[Configuration AI Providers](docs/AI_PROVIDERS.md)** : Configuration des LLMs
- **[Guide de Développement](docs/DEVELOPMENT.md)** : Contribuer au projet
- **[Historique du Projet](docs/PROJECT_JOURNEY.md)** : Évolution et décisions

### Guides de Déploiement

- **[Déploiement Vercel](DEPLOYMENT.md)** : Déployer en production

---

## 📊 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement (port 3000)
npm run build            # Build de production
npm run start            # Démarrer en production
npm run lint             # Vérifier le code

# Base de données
npm run db:push          # Synchroniser le schéma Prisma
npm run db:migrate       # Créer une migration
npm run db:reset         # Réinitialiser la base
npx prisma studio        # Interface visuelle Prisma

# Base de connaissances
node scripts/seed-esilv-complete-v2.js     # Seed ~30 entrées
node scripts/update-rag-with-urls.js       # Ajouter 200+ URLs
node scripts/validate-rag-data.js          # Valider les données

# Ollama
npm run ollama:start     # Démarrer Ollama (Windows)
ollama list              # Lister les modèles
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

---

## 📝 Changelog

### v1.2.0 (2026-01-04) - Upload de Documents

- ✅ Upload de documents PDF, DOCX, TXT, MD via drag-and-drop
- ✅ Parsing automatique avec pdf-parse-fork et mammoth
- ✅ Chunking intelligent et intégration au RAG
- ✅ Limite augmentée à 50MB par fichier
- ✅ Health check API + status UI dynamique
- ✅ Enrichissement RAG avec 200+ URLs ESILV
- ✅ Badges de confiance sur les réponses
- ✅ Script de validation automatisé

### v1.1.0 (2025-12) - Scraping Intelligent

- ✅ Scraping web automatique du site ESILV
- ✅ Détection de conflits et mise à jour RAG
- ✅ Citations de sources obligatoires
- ✅ Vérification parallèle des données

### v1.0.0 (2025-11) - Version Initiale

- ✅ Routage par mots-clés (RAG, Form, Orchestration)
- ✅ Interface chatbot complète
- ✅ Support multi-LLM (Ollama, Gemini, OpenAI)
- ✅ Base de connaissances initiale

---

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👤 À propos

Projet développé par **Jules Barth** dans le cadre d'un projet académique pour l'ESILV.

- 🎓 **M2 Data & IA Engineering** - ESILV (Paris)
- 💼 **Spécialisations** : LLMs, IA générative, ML privacy-preserving, Quantum Computing
- 🌐 **Portfolio** : [julesbarth-myportfolio.fr](https://julesbarth-myportfolio.fr)
- 💼 **LinkedIn** : [jules-barth](https://www.linkedin.com/in/jules-barth)
- 📧 **Email** : julesbarth13@gmail.com

---

## 🙏 Remerciements

- Données basées sur les informations officielles de l'ESILV
- Icônes par [Lucide](https://lucide.dev/)
- UI Components par [shadcn/ui](https://ui.shadcn.com/)
- Framework par [Next.js](https://nextjs.org/)

---

**⭐ Si ce projet vous a été utile, n'hésitez pas à laisser une étoile sur GitHub !**

[🔗 Repository GitHub](https://github.com/Farx1/esilvchatbot)
