# ESILV Smart Assistant - Documentation Technique Complète

**Version actuelle :** `v1.2.0`  
**Dernière mise à jour :** 2026-01-04

---

## 📋 Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [API Endpoints](#api-endpoints)
3. [Système Multi-Agents](#système-multi-agents)
4. [Base de Connaissances (RAG)](#base-de-connaissances-rag)
5. [Upload de Documents](#upload-de-documents)
6. [Scraping Web](#scraping-web)
7. [Base de Données](#base-de-données)
8. [Configuration AI Providers](#configuration-ai-providers)
9. [Health Check & Monitoring](#health-check--monitoring)
10. [Sécurité](#sécurité)
11. [Performance & Optimisation](#performance--optimisation)
12. [Tests](#tests)
13. [Déploiement](#déploiement)

---

## 🏗️ Architecture Globale

### Stack Technique

```
┌──────────────────────────────────────────────────┐
│           Frontend (Next.js 15 + React)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Chatbot  │  │   Admin  │  │  RAG     │      │
│  │ Interface│  │ Dashboard│  │ Viewer   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
├──────────────────────────────────────────────────┤
│            API Routes (Next.js)                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │  Chat  │ │ Knowledge│ │Scraper │ │Documents│ │
│  │  /api  │ │   /api   │ │  /api  │ │  /api   │ │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
├──────────────────────────────────────────────────┤
│                 Services Layer                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │  RAG   │ │  AI    │ │ Scraper│ │ Parser │  │
│  │        │ │Provider│ │        │ │        │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
├──────────────────────────────────────────────────┤
│              Data Layer (Prisma)                 │
│  ┌────────────────────────────────────────────┐ │
│  │        SQLite Database (custom.db)         │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Technologies Clés

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Next.js API Routes, Prisma ORM, NextAuth.js |
| **AI/ML** | Ollama, Google Gemini, OpenAI, Anthropic Claude |
| **Scraping** | Cheerio, Node Fetch API |
| **Parsing** | pdf-parse-fork, mammoth, TextDecoder |
| **Database** | SQLite (dev), PostgreSQL (prod recommandé) |

---

## 🔌 API Endpoints

### Chat API (`/api/chat`)

**POST** `/api/chat`

Endpoint principal pour l'interaction avec le chatbot.

**Request Body :**
```json
{
  "message": "Quelles sont les majeures à l'ESILV ?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Bonjour"
    },
    {
      "role": "assistant",
      "content": "Bonjour ! Comment puis-je vous aider ?"
    }
  ]
}
```

**Response :**
```json
{
  "response": "L'ESILV propose 15 majeures de spécialisation...",
  "agentType": "retrieval",
  "confidence": 0.95,
  "ragSources": [
    {
      "question": "Quelles sont les majeures ?",
      "answer": "15 majeures disponibles...",
      "source": "https://www.esilv.fr/formations/majeures",
      "confidence": 0.95
    }
  ]
}
```

**Agents disponibles :**
- `retrieval` : Recherche dans le RAG
- `scraper` : Scraping web en temps réel
- `form_filling` : Collecte d'informations
- `orchestration` : Dialogue général

---

### Knowledge API (`/api/knowledge`)

**POST** `/api/knowledge`

CRUD pour la base de connaissances.

**Actions :**

1. **Recherche** (`search`)
```json
{
  "action": "search",
  "query": "admission",
  "limit": 10
}
```

2. **Création** (`create`)
```json
{
  "action": "create",
  "item": {
    "question": "Comment s'inscrire ?",
    "answer": "Via le Concours Avenir...",
    "category": "admissions",
    "confidence": 0.9,
    "source": "https://www.esilv.fr/admissions"
  }
}
```

3. **Mise à jour** (`update`)
```json
{
  "action": "update",
  "id": "clx123...",
  "updates": {
    "answer": "Nouvelle réponse...",
    "lastVerified": "2026-01-04T12:00:00Z"
  }
}
```

4. **Suppression** (`delete`)
```json
{
  "action": "delete",
  "id": "clx123..."
}
```

---

### Scraper API (`/api/scraper`)

**POST** `/api/scraper`

Scraping intelligent du site ESILV.

**Request Body :**
```json
{
  "query": "actualités cybersécurité",
  "deepScrape": true,
  "limit": 6
}
```

**Response :**
```json
{
  "success": true,
  "results": [
    {
      "title": "Hackathon Cybersécurité 2026",
      "url": "https://www.esilv.fr/actualites/hackathon-2026",
      "date": "10 Déc 2025",
      "excerpt": "L'ESILV organise...",
      "fullContent": "Contenu complet de l'article...",
      "tags": ["hackathon", "cybersécurité"]
    }
  ]
}
```

---

### Documents API (`/api/documents/upload`)

**POST** `/api/documents/upload`

Upload et parsing de documents.

**Headers :**
```
Content-Type: multipart/form-data
```

**Form Data :**
```
file: [PDF/DOCX/TXT/MD file]
```

**Response :**
```json
{
  "success": true,
  "filename": "plaquette-alpha-web.pdf",
  "chunks": 25,
  "knowledgeEntries": 25,
  "message": "Document uploaded and processed successfully"
}
```

**Formats supportés :**
- PDF (via `pdf-parse-fork`)
- DOCX (via `mammoth`)
- TXT (TextDecoder)
- MD (TextDecoder)

**Limite :** 50MB par fichier

---

### Health Check API (`/api/health`)

**GET** `/api/health`

Vérification de l'état des services.

**Response :**
```json
{
  "status": "healthy",
  "services": {
    "ollama": {
      "status": "up",
      "latency": 45
    },
    "gemini": {
      "status": "configured"
    },
    "database": {
      "status": "up"
    }
  }
}
```

**Status possibles :**
- `healthy` : Tous les services fonctionnent
- `degraded` : Certains services indisponibles
- `down` : Services critiques hors ligne

---

## 🤖 Système Multi-Agents

### ChatOrchestrator

Classe principale qui gère l'orchestration des agents.

**Fichier :** `src/app/api/chat/route.ts`

```typescript
class ChatOrchestrator {
  // Détermine l'agent approprié
  async determineAgent(message: string): Promise<AgentType>
  
  // Agent RAG avec vérification parallèle
  async handleRetrieval(message: string, history: any[]): Promise<Response>
  
  // Agent scraping web
  async handleScraper(message: string): Promise<Response>
  
  // Agent formulaire
  async handleFormFilling(message: string, history: any[]): Promise<Response>
  
  // Agent conversationnel
  async handleOrchestration(message: string, history: any[]): Promise<Response>
}
```

### Détermination d'Agent

**Logique :**
1. Détection de mots-clés spécifiques
2. Analyse du contexte conversationnel
3. Vérification de l'âge des données RAG
4. Choix de l'agent le plus approprié

**Exemples :**

| Query | Agent | Raison |
|-------|-------|--------|
| "Quelles sont les majeures ?" | `retrieval` | Données statiques dans le RAG |
| "Actualités de l'ESILV ?" | `scraper` | Données dynamiques (actualités) |
| "Qui est le responsable alumni ?" | `scraper` | Données variables (personnel) |
| "Je veux candidater" | `form_filling` | Collecte d'informations |
| "Raconte-moi une blague" | `orchestration` | Hors sujet ESILV |

---

## 📚 Base de Connaissances (RAG)

### Structure

**Modèle Prisma :**
```prisma
model KnowledgeBase {
  id            String   @id @default(cuid())
  question      String
  answer        String
  category      String
  confidence    Float?
  source        String?
  lastVerified  DateTime @default(now())
  
  // Métadonnées documents uploadés
  documentName    String?
  documentType    String?
  uploadedAt      DateTime?
  chunkIndex      Int?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Catégories

- `formations` : Programmes, cycles, majeures
- `admissions` : Concours, procédures d'admission
- `informations_generales` : Présentation, histoire, campus
- `vie_etudiante` : Associations, sports, logement
- `international` : Échanges, Erasmus, doubles diplômes
- `entreprises_debouches` : Alternance, stages, carrières
- `documents_uploadés` : Documents ajoutés par upload

### Recherche

**Algorithme :**
1. Recherche par mots-clés dans `question` et `answer`
2. Filtrage par catégorie si pertinent
3. Tri par `confidence` décroissant
4. Vérification de `lastVerified` (âge des données)
5. Scraping parallèle si données > 30 jours

**Exemple :**
```typescript
const results = await searchKnowledgeBase(
  "majeures cybersécurité",
  {
    category: "formations",
    minConfidence: 0.7,
    maxAge: 30 // jours
  }
)
```

### Mise à Jour Automatique

**Workflow :**
1. Question utilisateur détecte données potentiellement obsolètes
2. Scraping parallèle du site ESILV
3. Comparaison données RAG vs données web
4. Détection de conflits
5. Mise à jour automatique si conflit détecté
6. Logging de la modification

**Logging :**
```prisma
model RAGUpdate {
  id          String   @id @default(cuid())
  action      String   // "add", "delete", "modify", "verify"
  entryId     String?
  oldValue    String?
  newValue    String?
  source      String?
  reason      String?
  timestamp   DateTime @default(now())
}
```

---

## 📄 Upload de Documents

### Architecture

**Flux complet :**
```
User (Drag & Drop) 
  ↓
Frontend (rag-viewer/page.tsx)
  ├─ Validation (type, taille)
  └─ FormData POST → /api/documents/upload
      ↓
API Route (runtime: nodejs)
  ├─ request.formData()
  ├─ Parsing selon extension
  │   ├─ PDF → pdf-parse-fork
  │   ├─ DOCX → mammoth
  │   └─ TXT/MD → TextDecoder
  ├─ Chunking intelligent (~1500 chars)
  ├─ Génération questions
  └─ INSERT INTO KnowledgeBase
      ↓
Database (Prisma)
  ├─ KnowledgeBase (chunks)
  └─ Document (métadonnées)
      ↓
RAG Updated ✅
```

### Parsers

**PDF (pdf-parse-fork) :**
```typescript
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  const pdfParse = (await import('pdf-parse-fork')).default
  const nodeBuffer = Buffer.from(buffer)
  const data = await pdfParse(nodeBuffer)
  return data.text
}
```

**DOCX (mammoth) :**
```typescript
async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}
```

**TXT/MD (TextDecoder) :**
```typescript
function parseText(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(buffer)
}
```

### Chunking

**Algorithme :**
1. Split par double saut de ligne (`\n\n`)
2. Regroupement par paragraphes jusqu'à ~1500 caractères
3. Création de chunks cohérents (pas de coupure au milieu d'une phrase)

```typescript
function chunkText(text: string, maxSize: number = 1500): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  
  let currentChunk = ''
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxSize && currentChunk) {
      chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim())
  return chunks
}
```

---

## 🕷️ Scraping Web

### Cheerio Scraper

**Fichier :** `src/app/api/scraper/route.ts`

**Fonctionnalités :**
- Extraction HTML avec Cheerio
- Navigation intelligente (mapping URLs)
- Deep scraping (pages d'articles)
- Extraction de métadonnées (dates, tags)

**Exemple d'extraction :**
```typescript
function extractNewsFromHTML(html: string, limit: number = 6) {
  const $ = cheerio.load(html)
  const articles: Article[] = []
  
  $('.post_wrapper').each((i, elem) => {
    if (i >= limit) return false
    
    const title = $(elem).find('h5 a').text().trim()
    const url = $(elem).find('h5 a').attr('href')
    const date = $(elem).find('.post_date').text().trim()
    const excerpt = $(elem).find('.post_excerpt').text().trim()
    const tags = $(elem).find('.post_categories a')
                        .map((_, tag) => $(tag).text()).get()
    
    if (deepScrape && url) {
      const fullContent = await scrapeArticlePage(url)
      article.fullContent = fullContent
    }
    
    articles.push(article)
  })
  
  return articles
}
```

### Mapping Intelligent

**Fichier :** `src/app/api/scraper/route.ts`

```typescript
function mapQueryToURL(query: string): string {
  const lowerQuery = query.toLowerCase()
  
  // Actualités
  if (/actuali|news|nouveau/.test(lowerQuery)) {
    return 'https://www.esilv.fr/actualites/'
  }
  
  // Admissions
  if (/admission|concours|candidat/.test(lowerQuery)) {
    return 'https://www.esilv.fr/admissions/'
  }
  
  // Majeures
  if (/majeure|spécialis/.test(lowerQuery)) {
    return 'https://www.esilv.fr/formations/majeures/'
  }
  
  // Default
  return 'https://www.esilv.fr/'
}
```

---

## 💾 Base de Données

### Schéma Prisma Complet

```prisma
datasource db {
  provider = "sqlite"  // "postgresql" en production
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model KnowledgeBase {
  id            String   @id @default(cuid())
  question      String
  answer        String
  category      String
  confidence    Float?
  source        String?
  lastVerified  DateTime @default(now())
  documentName  String?
  documentType  String?
  uploadedAt    DateTime?
  chunkIndex    Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Document {
  id          String   @id @default(cuid())
  title       String
  content     String
  source      String
  type        String
  embedding   String?
  metadata    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RAGUpdate {
  id          String   @id @default(cuid())
  action      String
  entryId     String?
  oldValue    String?
  newValue    String?
  source      String?
  reason      String?
  timestamp   DateTime @default(now())
}

model Conversation {
  id          String   @id @default(cuid())
  messages    String   // JSON
  feedback    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Migrations

```bash
# Créer une migration
npx prisma migrate dev --name add_document_metadata

# Appliquer en production
npx prisma migrate deploy

# Synchroniser sans migration (dev)
npx prisma db push

# Studio visuel
npx prisma studio
```

---

## 🤖 Configuration AI Providers

### Ollama (Recommandé)

**Installation :**
```bash
# Windows
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh
```

**Configuration :**
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest
```

**Modèles recommandés :**
- `llama3:latest` (8B, rapide)
- `mistral:latest` (7B, performant)
- `mixtral:latest` (8x7B, très performant)

### Google Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash-exp
```

**Modèles :**
- `gemini-2.0-flash-exp` (rapide)
- `gemini-pro` (général)

### OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```

**Modèles :**
- `gpt-4` (le meilleur)
- `gpt-3.5-turbo` (rapide, économique)

---

## ❤️ Health Check & Monitoring

### Health Check Hook

**Fichier :** `src/hooks/useHealthCheck.ts`

```typescript
export const useHealthCheck = (interval: number = 30000) => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    services: {...}
  })
  
  useEffect(() => {
    const fetchHealth = async () => {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    }
    
    fetchHealth()
    const intervalId = setInterval(fetchHealth, interval)
    return () => clearInterval(intervalId)
  }, [interval])
  
  return { healthStatus: health.status, services: health.services }
}
```

### Affichage UI

```typescript
const { healthStatus } = useHealthCheck()

{healthStatus === 'healthy' && (
  <span className="text-green-500">En ligne</span>
)}
```

---

## 🔒 Sécurité

### Variables d'Environnement

**Obligatoires :**
- `NEXTAUTH_SECRET` : Secret pour NextAuth
- `SESSION_SECRET` : Secret pour les sessions
- `ADMIN_PASSWORD` : Mot de passe admin

**Génération de secrets :**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | %{ Get-Random -Min 0 -Max 256 }))
```

### Protection des Routes

**Middleware :** `src/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  
  return NextResponse.next()
}
```

---

## ⚡ Performance & Optimisation

### Caching

- **React Query** : Cache des requêtes API côté client
- **Next.js Cache** : Cache des pages statiques
- **Prisma Connection Pool** : Réutilisation des connexions DB

### Optimisations

1. **Lazy Loading** : Composants chargés à la demande
2. **Code Splitting** : Bundle divisé par route
3. **Image Optimization** : Next.js Image component
4. **Server Components** : Rendu côté serveur pour performance

---

## 🧪 Tests

### Scripts de Validation

**1. Validation RAG :**
```bash
node scripts/validate-rag-data.js
```

**Tests :**
- Pertinence des réponses
- Citations de sources
- Scores de confiance
- Temps de réponse

**2. Test URLs :**
```bash
node scripts/test-single-url.js
```

---

## 🚀 Déploiement

### Vercel (Recommandé)

**Variables d'environnement requises :**
```env
DATABASE_URL=postgres://...  # PostgreSQL obligatoire
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://votre-app.vercel.app
SESSION_SECRET=...
ADMIN_PASSWORD=...
GEMINI_API_KEY=...  # Ou autre AI provider
```

**Commandes :**
```bash
# Deploy
vercel

# Deploy en production
vercel --prod
```

### Autres Plateformes

- **Railway** : Supporte SQLite + PostgreSQL
- **Fly.io** : Bon pour Ollama (persistent storage)
- **Netlify** : Fonctionne mais PostgreSQL requis

**Voir :** [DEPLOYMENT.md](../DEPLOYMENT.md) pour plus de détails.

---

## 📚 Ressources

### Documentation Externe

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Ollama Docs](https://ollama.ai/docs)
- [Gemini API](https://ai.google.dev/docs)

### Fichiers Importants

- `README.md` : Vue d'ensemble
- `DEPLOYMENT.md` : Guide de déploiement
- `docs/AI_PROVIDERS.md` : Configuration AI
- `docs/DRAG_DROP_GUIDE.md` : Guide utilisateur

---

**Dernière mise à jour : 2026-01-04**  
**Auteur : Jules Barth**  
**Version : 1.2.0**
