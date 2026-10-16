# Architecture

Ce document décrit ce que fait réellement le code (`src/app/api/chat/route.ts` en premier lieu). Ce n'est pas un système multi-agents : un seul orchestrateur choisit **par mots-clés** un des trois prompts LLM.

## Parcours d'une question

```mermaid
flowchart TD
    UI["page.tsx<br/>(navigateur)"] -->|POST /api/chat| R{"determineAgentType<br/>hasKeyword, mots entiers,<br/>sans accents ni casse"}
    R -->|"mot-clé ESILV<br/>(frais, campus, stage, école...)"| RET[handleRetrieval]
    R -->|"mot-clé formulaire<br/>(inscrire, téléphone, nom...)"| FORM[handleFormFilling]
    R -->|"aucun mot-clé,<br/>historique > 1 message"| RET
    R -->|sinon| ORCH[handleOrchestration]

    RET --> KB[("searchKnowledgeBase<br/>SQLite LIKE sur question,<br/>answer, category")]
    KB --> SCORE["score par mot-clé<br/>question +5, catégorie +3, réponse +2<br/>top 5, 500 caractères max"]
    SCORE --> NEED{"question d'actualité / contact<br/>ou données > 30 jours ?"}
    NEED -->|oui| SCR["/api/scraper<br/>(Cheerio sur www.esilv.fr)"]
    NEED -->|non| P
    SCR --> P["prompt = consignes + historique<br/>+ message + données"]
    FORM --> P
    ORCH --> P
    P --> LLM["AIChatOrchestrator.generateCompletion<br/>(src/app/api/ai-config/route.ts)"]
    LLM --> PROV["AI_PROVIDER : ollama | gemini |<br/>openai | anthropic | huggingface"]
    LLM --> SAVE[("Conversation + Message<br/>(Prisma)")]
    SAVE --> UI
```

Points à connaître :

- **Routage** : `src/lib/keyword-match.ts`. Les mots-clés ESILV passent avant ceux du formulaire (« frais d'inscription » reste une question RAG). « nombre » ne déclenche pas « nom ». Le handler formulaire ne rend aucun formulaire : il demande les coordonnées dans la conversation.
- **RAG** : recherche par mots-clés (`extractKeywords` retire les mots vides, ajoute singulier/pluriel et version sans accents, 6 mots-clés max). Pas d'embeddings, pas de base vectorielle.
- **Scraper** : `src/app/api/scraper/route.ts`, URL de base fixe `https://www.esilv.fr`. Sur `main`, le chat l'appelle en HTTP sur `localhost:3000`. Avec #8, il l'appelle en interne, dans le même processus.
- **Confiance** : `calculateConfidence` combine nombre de sources, score moyen, âge des données et usage du scraper. C'est une heuristique, pas une probabilité.
- `/api/chat/stream` existe mais l'interface n'appelle que `/api/chat`.

## Qui écrit dans la base de connaissances

```mermaid
flowchart LR
    SEED["scripts/seed-esilv-complete-v2.js<br/>scripts/update-rag-with-urls.js"] --> KB[("KnowledgeBase")]
    ADMIN["/admin/knowledge, /rag-viewer<br/>→ /api/knowledge"] --> KB
    UP["/api/documents/upload<br/>PDF, DOCX, TXT, MD ≤ 50 Mo<br/>chunks de ~1500 caractères"] --> KB
    CHAT["/api/chat (retrieval)"] -->|"evaluateAndSaveToRAG :<br/>résultats du scraper"| KB
    CHAT -->|"vérification en arrière-plan :<br/>conflit RAG/web → bulk_delete + ajout<br/>via /api/knowledge"| KB
    KB --> LOG[("RAGUpdate (journal)")]
```

Le texte de toutes ces sources finit tel quel dans le prompt du LLM. Voir [SECURITY.md](../SECURITY.md).

## Données

`prisma/schema.prisma`, SQLite (`DATABASE_URL`) : `User`, `Conversation`, `Message`, `FormSubmission`, `Document`, `KnowledgeBase`, `RAGUpdate`.

## Limites connues

- Routage et RAG par mots-clés : pas de synonymes ni de lemmatisation au-delà du pluriel en s/x ; une question sans mot-clé de la liste part en orchestration.
- Une base vide renvoie le texte « Aucune information spécifique trouvée… », qui n'est pas vide : la branche « fallback (RAG vide) » vers le scraper ne s'exécute pas (test `it.fails` dans `src/app/api/chat/route.test.ts`).
- Les scripts de `scripts/` appellent `/api/knowledge` en HTTP sur `localhost:3000` sans cookie admin : ils reçoivent 401 une fois #8 mergée.
- SQLite fichier : une seule instance, pas de déploiement serverless multi-instances (voir `DEPLOYMENT.md`).
