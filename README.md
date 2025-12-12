# ESILV Smart Assistant

Assistant intelligent pour l'École Supérieure d'Ingénieurs Léonard-de-Vinci, développé avec Next.js et TypeScript.

**Version stable :** `v1.0.0-stable`

## État du Projet

### ✅ Fonctionnalités Stables
- Système multi-agents (RAG, Form-filling, Orchestration)
- Base de connaissances avec recherche intelligente
- Interface utilisateur complète
- Support multi-LLM (Ollama, Gemini, OpenAI, Claude, HuggingFace)
- Vérification parallèle intelligente des données RAG
- Analytics et statistiques

### 🚧 En Développement
- **Scraping automatique** : Le système de scraping web est fonctionnel mais la mise à jour automatique du RAG basée sur les résultats du scraper n'est pas encore finalisée. Le scraper fonctionne en parallèle pour vérifier les données, mais la comparaison et la mise à jour automatique sont en cours d'implémentation.

## Fonctionnalités

### Système Multi-Agents
- Agent de recherche dans la base de connaissances (RAG)
- Agent de collecte d'informations avec génération de formulaires
- Agent conversationnel pour le dialogue général

### Base de Connaissances
- 29 entrées couvrant les programmes, admissions et campus
- Informations sur les 15 majeures de spécialisation
- Détails sur l'alternance, l'international et la vie étudiante
- Recherche intelligente avec gestion des variantes linguistiques
- Vérification parallèle intelligente : le système vérifie automatiquement l'âge des données et lance un scraper en parallèle si nécessaire (> 30 jours ou > 7 jours pour questions sensibles)
- Tracking de la dernière vérification via le champ `lastVerified`

### Scraping Web (En Développement)
- Scraper fonctionnel pour extraire des informations du site ESILV
- Navigation intelligente : mapping automatique des requêtes vers les pages pertinentes
- Deep scraping : extraction du contenu complet des pages d'actualités
- **Note** : La comparaison automatique et la mise à jour du RAG basées sur les résultats du scraper sont en cours d'implémentation

### Interface Utilisateur
- Design responsive avec Tailwind CSS
- Composants UI modernes (shadcn/ui)
- Panneau d'administration pour la gestion
- Statistiques et analytics

### Support Multi-LLM
Compatible avec plusieurs modèles de langage :
- Ollama (modèles locaux recommandés pour le développement)
- Google Gemini
- OpenAI
- Anthropic Claude
- Hugging Face

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Git

### Étapes d'installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd llmgenaip

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Initialiser la base de données
npm run db:push

# Charger les données ESILV
npm run kb:seed-esilv

# Lancer le serveur
npm run dev
```

L'application sera disponible sur http://localhost:3000

## Configuration

### Fichier .env

```env
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=votre-secret
NEXTAUTH_URL=http://localhost:3000

AI_PROVIDER=ollama

# Ollama (recommandé pour le développement local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest

# Ou Gemini
# GEMINI_API_KEY=votre-clé
# GEMINI_MODEL=gemini-2.0-flash-exp
```

### Utilisation avec Ollama

```bash
# Installer Ollama
# Windows: télécharger depuis https://ollama.ai/download

# Télécharger un modèle
ollama pull llama3:latest

# Démarrer Ollama
ollama serve

# Ou utiliser le script (Windows)
npm run ollama:start
```

## Structure du Projet

```
llmgenaip/
├── src/
│   ├── app/              # Pages et API Routes
│   │   ├── api/         # Endpoints API
│   │   │   ├── chat/    # Logique du chatbot
│   │   │   ├── ai-config/ # Configuration des modèles
│   │   │   └── knowledge/ # Gestion de la base de connaissances
│   │   ├── admin/       # Interface d'administration
│   │   └── page.tsx     # Page principale
│   ├── components/       # Composants React
│   ├── lib/             # Utilitaires
│   └── hooks/           # Hooks personnalisés
├── prisma/              # Schéma de base de données
├── scripts/             # Scripts utilitaires
├── docs/                # Documentation
└── public/              # Assets statiques
```

## Scripts Disponibles

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Démarrer en production

npm run db:push          # Synchroniser le schéma Prisma
npm run db:migrate       # Créer une migration
npm run db:reset         # Réinitialiser la base

npm run kb:seed-esilv    # Charger les données ESILV
npm run kb:check         # Vérifier la base de connaissances
npm run kb:stats         # Statistiques

npm run lint             # Vérifier le code
```

## Technologies Utilisées

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query

### Backend
- Next.js API Routes
- Prisma ORM
- SQLite
- NextAuth.js

### Modèles de Langage
- Ollama (local)
- Google Generative AI SDK
- OpenAI API
- Anthropic SDK

## Documentation

- [Guide de développement](docs/DEVELOPMENT.md)
- [Configuration des fournisseurs IA](docs/AI_PROVIDERS.md)
- [Documentation technique](docs/TECHNICAL_DOCUMENTATION.md)

## Contribution

Les contributions sont les bienvenues. Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus d'informations.

## Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

## Informations

Projet développé dans le cadre d'un projet d'école pour l'ESILV.
Données basées sur les informations officielles disponibles publiquement sur le site de l'ESILV.
