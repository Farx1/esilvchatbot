# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Reconstruit à partir de l'historique git de `main` et des tags `v1.0.0-stable`, `v1.1.0-complete`. Aucune version n'est publiée sur un registre.

## [Non publié]

### Ajouté
- Score de pertinence des résultats RAG (question +5, catégorie +3, réponse +2), top 5 (291f7fb).
- Score de confiance calculé par réponse : sources, pertinence, âge des données, scraper (1ce011e).
- Scripts utilitaires RAG et prompts système réécrits (8b69a6c).
- Rapport technique LaTeX `docs/TECHNICAL_REPORT.tex` (883205b).

### Corrigé
- Recherche RAG : extraction de mots-clés, variantes de noms, tri (5239ac4, 16723c3, d4c5741).
- Format des réponses : retours à la ligne Markdown forcés, consignes anti-hallucination (1db3b0c, 3579cd1).

## [1.2.0] - 2026-01-04

### Ajouté
- Upload de documents PDF, DOCX, TXT, MD par glisser-déposer dans le RAG Viewer, découpage en chunks (9faedec).
- API `/api/health` et statut « En ligne » conditionnel dans l'interface (9faedec).
- Limite d'upload portée de 10 à 50 Mo (ced8d6c).

### Corrigé
- Parsing PDF : `pdf-parse` remplacé par `pdf-parse-fork`, runtime Node.js forcé pour l'upload (3cf7636, daf424b).
- Erreurs TypeScript de la route chat : type `scraper`, `ragSources` (fe676e7).

## [1.1.0] - 2026-01-04 (tag `v1.1.0-complete`)

### Ajouté
- Mise à jour automatique du RAG à partir du scraper (5482b07).
- Enrichissement du RAG avec des URLs du site ESILV et script associé (aaa1013).

## [1.0.0] - 2025-12-12 (tag `v1.0.0-stable`)

### Ajouté
- Première version : chat Next.js, routage par mots-clés vers 3 handlers LLM, base de connaissances SQLite, analytics, espace admin (3ea59e7, 342b5a7).
- Sessions multi-utilisateurs en local et feedback sur les réponses (237e9f2, 49459ce).
- Scraper du site ESILV : actualités, deep scraping, extraction Cheerio (51c6041, 6cf2eed, 8146e8b).
- Détection de conflits entre RAG et web, vérification en parallèle (1bed296, 26ea4da).

[Non publié]: https://github.com/Farx1/esilvchatbot/compare/v1.1.0-complete...main
[1.1.0]: https://github.com/Farx1/esilvchatbot/compare/v1.0.0-stable...v1.1.0-complete
[1.0.0]: https://github.com/Farx1/esilvchatbot/releases/tag/v1.0.0-stable
