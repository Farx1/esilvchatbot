# Politique de sécurité

## Signaler une vulnérabilité

N'ouvrez pas d'issue publique. Écrivez à **julesbarth13@gmail.com** avec :

- la route ou le fichier concerné ;
- les étapes pour reproduire (requête HTTP, message envoyé au chat, fichier uploadé) ;
- l'impact constaté.

Accusé de réception visé sous 7 jours. Projet académique maintenu par une personne : pas de programme de bug bounty.

Version supportée : la branche `main` uniquement.

## Modèle de menace

L'application expose un chat public, une base de connaissances (RAG) alimentée par plusieurs sources et un espace admin. Références : [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/). Le flux complet est décrit dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### 1. Injection de prompt (LLM01)

- **Directe** : le message utilisateur est interpolé tel quel dans le prompt (`Question: "${message}"` dans `src/app/api/chat/route.ts`). Un utilisateur peut demander au modèle d'ignorer ses consignes.
- **Indirecte** : les entrées de la base de connaissances, les pages scrapées sur www.esilv.fr et le texte des documents uploadés sont aussi collés dans le prompt. Un document piégé devient une consigne pour toutes les questions qui le retrouvent.
- **Impact actuel** : le LLM n'a ni outils ni accès en écriture ; le risque est une réponse fausse ou trompeuse affichée comme officielle (LLM09). Aucune donnée secrète n'est placée dans le prompt.
- **Non traité** : pas de délimitation ni de filtrage du contenu injecté. Ne pas ajouter d'outils (envoi d'e-mail, écriture en base) au LLM sans revoir ce point.

### 2. Routes d'administration

- Pages `/admin/*`, `/rag-viewer` et routes d'écriture (`/api/knowledge`, `/api/documents/upload`, `/api/rag-updates`, `POST /api/ai-config`, `GET /api/form-submit`) : protégées par un cookie de session signé HMAC vérifié dans `src/middleware.ts` (PR #2, `fix/admin-auth-middleware`). Variables requises : `ADMIN_PASSWORD`, `SESSION_SECRET`.
- `GET /api/ai-config` ne renvoie plus les clés API des fournisseurs (PR #1, `fix/ai-config-key-leak`).
- **Non couvert par #2** : `POST /api/scraper` (paramètre `autoSave`) et `/api/chat` écrivent dans la base de connaissances sans authentification. Le contenu vient uniquement de www.esilv.fr (URL de base fixe), mais un appelant peut provoquer des écritures et des requêtes sortantes en volume.
- Les appels internes du chat vers `/api/knowledge` et `/api/rag-updates` partent sans cookie : avec #2, ils reçoivent 401 et la mise à jour automatique du RAG échoue.

### 3. Upload de documents

- `POST /api/documents/upload` : extensions PDF, DOCX, TXT, MD, 50 Mo max, parsing par `pdf-parse-fork` et `mammoth` côté serveur.
- Risques : fichier malformé visant les parseurs, consommation mémoire (fichier entier en mémoire), empoisonnement du RAG (voir §1).
- Doit rester réservé aux admins (middleware de #2).

### 4. Données personnelles

- Les conversations et messages sont enregistrés en base (`Conversation`, `Message`). Les coordonnées données au handler « formulaire » y figurent en clair.
- `GET /api/form-submit` renvoie les soumissions : admin uniquement avec #2.
- Le fichier SQLite (`db/custom.db`) et `.env` ne doivent jamais être commités (déjà dans `.gitignore`).

### 5. Coût et déni de service (LLM10)

- Pas de limite de débit sur `/api/chat` : chaque message déclenche un appel LLM et parfois un scraping. Avec un fournisseur payant, un appelant peut faire grimper la facture. Mettre une limite de débit (reverse proxy ou middleware) avant une exposition publique.
