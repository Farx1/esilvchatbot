# Contributing to ESILV Smart Assistant

Merci de votre intérêt pour contribuer à ce projet ! 🎉

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Processus de développement](#processus-de-développement)
- [Style de code](#style-de-code)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Rapport de bugs](#rapport-de-bugs)
- [Suggestions de fonctionnalités](#suggestions-de-fonctionnalités)

## 📜 Code de conduite

Ce projet adhère à un code de conduite. En participant, vous vous engagez à maintenir un environnement respectueux et inclusif pour tous.

## 🤝 Comment contribuer

### 1. Fork et clone

```bash
# Fork le repository sur GitHub, puis :
git clone https://github.com/votre-username/esilvchatbot.git
cd esilvchatbot
```

### 2. Configuration de l'environnement

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Initialiser la base de données
npm run db:push
npm run kb:seed-esilv

# Lancer le serveur de développement
npm run dev
```

### 3. Créer une branche

```bash
# Créer une branche pour votre fonctionnalité/fix
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

### 4. Faire vos modifications

- Écrivez du code propre et documenté
- Suivez les conventions de style du projet
- Testez vos modifications localement
- Vérifiez qu'il n'y a pas d'erreurs de linting

```bash
npx tsc --noEmit
npm run lint
npm test
```

Ces trois commandes sont celles de la CI (`.github/workflows/ci.yml`).

### 5. Commit et push

```bash
git add .
git commit -m "feat: ajout de ma nouvelle fonctionnalité"
git push origin feature/ma-nouvelle-fonctionnalite
```

### 6. Créer une Pull Request

- Allez sur GitHub et créez une Pull Request
- Décrivez clairement vos modifications
- Référencez les issues concernées

## 🔄 Processus de développement

### Structure du projet

```
esilvchatbot/
├── src/
│   ├── app/              # Pages et API routes
│   ├── components/       # Composants React
│   ├── lib/             # Utilitaires
│   └── hooks/           # Hooks personnalisés
├── prisma/              # Schéma base de données
├── scripts/             # Scripts utilitaires
├── docs/                # Documentation
└── public/              # Assets statiques
```

### Technologies utilisées

- **Frontend** : Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend** : Next.js API Routes, Prisma, SQLite
- **IA** : Ollama, Google Gemini, OpenAI, Anthropic

## 🎨 Style de code

### TypeScript/JavaScript

- Utiliser TypeScript pour tout nouveau code
- Préférer les fonctions fléchées pour les composants React
- Utiliser les interfaces pour les types complexes
- Éviter les `any`, typer explicitement

```typescript
// ✅ Bon
interface UserData {
  id: string
  name: string
  email: string
}

const UserCard = ({ user }: { user: UserData }) => {
  return <div>{user.name}</div>
}

// ❌ Mauvais
const UserCard = ({ user }: any) => {
  return <div>{user.name}</div>
}
```

### React

- Utiliser les hooks fonctionnels
- Extraire la logique complexe dans des hooks personnalisés
- Utiliser les composants shadcn/ui pour l'UI

### CSS

- Utiliser Tailwind CSS pour le styling
- Éviter les styles inline sauf cas exceptionnels
- Utiliser les classes utilitaires Tailwind

## 📝 Commits

Suivre la convention [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, point-virgules manquants, etc.
- `refactor:` Refactoring du code
- `test:` Ajout de tests
- `chore:` Maintenance, config, etc.

Exemples :
```
feat: ajout du support pour Claude 3
fix: correction de la recherche RAG avec accents
docs: mise à jour du README avec instructions Ollama
refactor: extraction de la logique AI dans un service séparé
```

## 🔍 Pull Requests

### Checklist avant de soumettre

- [ ] Le code compile sans erreurs
- [ ] Pas d'erreurs de linting (`npm run lint`)
- [ ] Pas d'erreur de types (`npx tsc --noEmit`)
- [ ] Les tests passent (`npm test`)
- [ ] La documentation est à jour
- [ ] Les commits suivent la convention
- [ ] La PR a une description claire

### Template de PR

```markdown
## Description
[Décrivez vos modifications]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
[Comment avez-vous testé ?]

## Screenshots (si applicable)
[Ajoutez des captures d'écran]

## Checklist
- [ ] Code testé localement
- [ ] Documentation mise à jour
- [ ] Pas d'erreurs de linting
```

## 🐛 Rapport de bugs

Pour rapporter un bug, créez une [issue](../../issues/new) avec :

- **Titre clair** : Résumé du problème
- **Description** : Détails du bug
- **Étapes pour reproduire** : Comment reproduire le bug
- **Comportement attendu** : Ce qui devrait se passer
- **Comportement actuel** : Ce qui se passe
- **Environnement** : OS, Node version, navigateur
- **Screenshots** : Si applicable

## 💡 Suggestions de fonctionnalités

Pour suggérer une fonctionnalité :

1. Vérifiez qu'elle n'existe pas déjà dans les issues
2. Créez une [issue](../../issues/new) avec :
   - Description détaillée de la fonctionnalité
   - Cas d'usage
   - Bénéfices pour les utilisateurs
   - Propositions d'implémentation (optionnel)

## 📚 Ressources

- [Documentation technique](docs/TECHNICAL_DOCUMENTATION.md)
- [Guide de développement](docs/DEVELOPMENT.md)
- [Configuration IA](docs/AI_PROVIDERS.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🙏 Remerciements

Merci de contribuer à rendre ce projet meilleur ! Chaque contribution, petite ou grande, est appréciée. 🎉

## ❓ Questions

Si vous avez des questions, n'hésitez pas à :
- Ouvrir une [issue](../../issues)
- Demander dans les [discussions](../../discussions)

---

Merci encore pour votre contribution ! 🚀

