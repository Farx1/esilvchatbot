# Aceternity UI - MCP Server

## 🎨 Vue d'ensemble

Aceternity UI est un serveur MCP (Model Context Protocol) qui donne accès à une collection de composants React/Next.js modernes avec animations et effets visuels avancés.

## 📦 Configuration

Le serveur MCP est configuré dans `.mcprc.json` :

```json
{
  "mcpServers": {
    "aceternityui": {
      "command": "npx",
      "args": ["-y", "aceternityui-mcp"],
      "description": "Aceternity UI MCP Server - Provides access to modern React/Next.js UI components with animations"
    }
  }
}
```

## 🚀 Utilisation

### 1. Vérifier la configuration

```bash
npm run mcp:list
```

### 2. Utiliser les composants Aceternity UI

Le serveur MCP Aceternity UI fournit des composants prêts à l'emploi pour améliorer l'interface :

#### Composants disponibles (exemples) :

- **Hero Sections** : Sections d'accueil animées
- **Cards** : Cartes avec effets hover 3D
- **Backgrounds** : Arrière-plans animés (particules, grilles, etc.)
- **Buttons** : Boutons avec animations avancées
- **Forms** : Formulaires stylisés
- **Navigation** : Barres de navigation modernes
- **Text Effects** : Effets de texte (typing, gradient, etc.)

### 3. Exemple d'amélioration de l'UI

#### Avant (actuel) :
```tsx
// src/app/page.tsx - Interface basique
<div className="chat-container">
  <h1>ESILV Smart Assistant</h1>
  <div className="messages">
    {/* Messages */}
  </div>
</div>
```

#### Après (avec Aceternity UI) :
```tsx
// Utilisation de composants Aceternity
import { HeroHighlight } from '@/components/ui/hero-highlight'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { SparklesCore } from '@/components/ui/sparkles'

<div className="relative">
  <BackgroundBeams className="absolute inset-0" />
  <HeroHighlight>
    <TextGenerateEffect words="ESILV Smart Assistant" />
  </HeroHighlight>
  <SparklesCore
    background="transparent"
    minSize={0.4}
    maxSize={1}
    particleDensity={1200}
    className="w-full h-full"
  />
</div>
```

## 🎯 Améliorations UI futures prévues

### Phase 1 : Page d'accueil
- [ ] Hero section animée avec gradient
- [ ] Background beams ou particules
- [ ] Effet de typing pour le titre
- [ ] Boutons avec animations hover

### Phase 2 : Chat Interface
- [ ] Messages avec animations d'apparition fluides
- [ ] Cards 3D pour les réponses
- [ ] Effets de glow sur les messages actifs
- [ ] Transitions smooth entre les états

### Phase 3 : Analytics & RAG Viewer
- [ ] Graphiques animés
- [ ] Cards statistiques avec effets hover
- [ ] Grid backgrounds
- [ ] Tooltips animés

### Phase 4 : Mobile & Responsive
- [ ] Animations optimisées pour mobile
- [ ] Gestures tactiles
- [ ] Transitions entre les vues

## 📚 Ressources

- [Aceternity UI Documentation](https://ui.aceternity.com)
- [Exemples de composants](https://ui.aceternity.com/components)
- [MCP Protocol](https://modelcontextprotocol.io)

## 💡 Comment demander des améliorations UI

Pour utiliser Aceternity UI via MCP, vous pouvez simplement demander :

```
"Améliore la page d'accueil du chatbot avec un hero section animé utilisant Aceternity UI"

"Ajoute des effets de particules en arrière-plan de la page chat avec Aceternity UI"

"Crée des cards 3D pour afficher les statistiques dans le dashboard avec Aceternity UI"
```

L'IA aura alors accès aux composants Aceternity UI via MCP et pourra les intégrer dans le projet.

## 🔧 Dépendances requises

Les composants Aceternity UI nécessitent :

```json
{
  "framer-motion": "^10.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

Ces dépendances sont déjà présentes dans le projet.

## ⚠️ Notes importantes

1. **Performance** : Les animations peuvent impacter les performances sur mobile
2. **Accessibilité** : S'assurer que les animations peuvent être désactivées
3. **Bundle size** : Importer uniquement les composants nécessaires
4. **Compatibilité** : Tester sur différents navigateurs

## 🎨 Exemples de styles ESILV

Pour maintenir la cohérence avec la charte graphique ESILV :

```tsx
// Couleurs ESILV
const colors = {
  primary: '#ce1052',    // Rose ESILV
  secondary: '#5B061D',  // Bordeaux foncé
  dark: '#0C0C0C',       // Noir
  light: '#f9f9f9'       // Gris clair
}

// Utilisation dans les composants Aceternity
<BackgroundBeams className="bg-[#ce1052]/10" />
<Button className="bg-[#ce1052] hover:bg-[#5B061D]" />
```

---

**Prochaines étapes** :
1. Le serveur MCP est configuré ✅
2. Quand vous voudrez améliorer l'UI, demandez simplement et je pourrai utiliser les composants Aceternity UI
3. Les composants seront intégrés avec la charte graphique ESILV

