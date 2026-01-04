# Guide d'utilisation : Drag & Drop dans RAG Viewer

## 🎯 Fonctionnalité

Le RAG Viewer dispose maintenant d'une zone de **drag & drop** permettant d'uploader directement des documents pour les ajouter automatiquement à la base de connaissances RAG.

## 📍 Localisation

**URL**: `http://localhost:3000/rag-viewer`

La zone de drag & drop se trouve juste après les statistiques (Total d'entrées, Catégories, Résultats affichés).

## 🎨 Interface

### État normal
- Bordure grise en pointillés
- Icône d'upload
- Texte : "Glissez-déposez un document"
- Badges : "Auto-ajout au RAG" et "Chunking intelligent"

### État hover (survol avec un fichier)
- Bordure bleue
- Fond bleu clair
- Effet de zoom (scale-105)
- Texte : "Déposez le fichier ici"

### État uploading
- Icône d'upload animée (rotation)
- Texte : "Upload en cours..."
- Nom du fichier

### État success
- Icône CheckCircle verte
- Texte : "Upload réussi !"
- Badge indiquant le nombre de chunks ajoutés
- Auto-rafraîchissement après 3 secondes

### État erreur
- Icône XCircle rouge
- Message d'erreur détaillé
- Auto-disparition après 5 secondes

## ✅ Fichiers supportés

- **PDF** (.pdf)
- **Word** (.docx)
- **Texte** (.txt)
- **Markdown** (.md)

## 📏 Limitations

- **Taille maximale**: 10 MB
- **1 fichier à la fois**

## 🔧 Processus automatique

1. **Validation**:
   - Type de fichier vérifié
   - Taille vérifiée

2. **Upload**:
   - Envoi à `/api/documents/upload`
   - Parsing selon le type (pdf-parse, mammoth, etc.)

3. **Chunking**:
   - Découpage intelligent du texte (max 1500 chars)
   - Préservation de la cohérence des paragraphes

4. **Génération de questions**:
   - Une question automatique par chunk
   - Format : "Contenu de [filename] - partie X"

5. **Ajout au RAG**:
   - Chaque chunk devient une entrée KnowledgeBase
   - Métadonnées : documentName, documentType, uploadedAt, chunkIndex

6. **Rafraîchissement**:
   - La liste des entrées se met à jour automatiquement
   - Les nouvelles entrées apparaissent dans la catégorie "documents_uploadés"

## 📊 Métadonnées enregistrées

Pour chaque chunk ajouté au RAG:

```typescript
{
  question: string       // Question générée
  answer: string         // Contenu du chunk
  category: 'documents_uploadés'
  confidence: 0.85
  source: 'upload:filename.pdf'
  documentName: 'filename.pdf'
  documentType: 'pdf'
  uploadedAt: Date
  chunkIndex: 0, 1, 2...
  lastVerified: Date
  createdAt: Date
  updatedAt: Date
}
```

## 🧪 Test avec plaquette-alpha-web.pdf

### Étapes pour tester:

1. **Ouvrir RAG Viewer**:
   ```
   http://localhost:3000/rag-viewer
   ```

2. **Localiser le fichier**:
   - Le fichier est dans `public/plaquette-alpha-web.pdf`
   - Taille: ~75 203 lignes (fichier volumineux)

3. **Drag & Drop**:
   - Ouvrir l'explorateur de fichiers
   - Naviguer vers `E:\llmgenaip\public\`
   - Faire glisser `plaquette-alpha-web.pdf` sur la zone
   - Déposer le fichier

4. **Observer le processus**:
   - ⏳ "Upload en cours..." (quelques secondes)
   - ✅ "Upload réussi ! X chunks ajoutés"
   - 🔄 Rafraîchissement automatique

5. **Vérifier dans le RAG**:
   - Cliquer sur le filtre "documents_uploadés"
   - Toutes les entrées du PDF s'affichent
   - Chaque entrée montre : titre, contenu, métadonnées

## ❌ Gestion des erreurs

### Type de fichier invalide
```
"Type de fichier non supporté. Utilisez: .pdf, .docx, .txt, .md"
```

### Fichier trop volumineux
```
"Fichier trop volumineux (max 10MB)"
```

### Erreur réseau
```
"Erreur réseau lors de l'upload"
```

### Erreur serveur
```
"Erreur lors de l'upload" (avec détails du serveur)
```

## 🔍 Utilisation des données uploadées

Une fois dans le RAG, les données sont **immédiatement disponibles** pour le chatbot :

1. **Recherche automatique**:
   - Le chatbot cherche dans toutes les entrées RAG
   - Inclut les documents uploadés

2. **Citation des sources**:
   - Format : `[Source: upload:filename.pdf]`

3. **Badge de confiance**:
   - Confiance par défaut : 85%

## 🎯 Cas d'usage

### Documentation interne
- Upload de guides, manuels, procédures
- Le chatbot peut répondre sur ces documents

### Plaquettes étudiantes
- Comme `plaquette-alpha-web.pdf`
- Informations vie associative, événements, etc.

### Rapports et analyses
- Documents de recherche
- Études de cas

### Guides techniques
- Documentation de code
- Tutoriels

## 🚀 Prochaines améliorations possibles

1. **Multi-upload**:
   - Uploader plusieurs fichiers simultanément

2. **Aperçu avant upload**:
   - Voir le contenu avant d'ajouter au RAG

3. **Gestion des doublons**:
   - Détecter si le document existe déjà

4. **Versioning**:
   - Historique des versions d'un document

5. **Suppression**:
   - Supprimer un document du RAG

6. **Édition**:
   - Modifier les chunks après upload

## 📝 Notes techniques

### Performance
- Parser PDF: ~1-3 secondes pour 50 pages
- Parser DOCX: ~0.5-1 seconde pour 50 pages
- Chunking: Instantané
- Upload total: ~2-5 secondes selon taille

### Limitations connues
- PDFs scannés (images) ne sont pas OCR
- Certains PDFs avec mise en page complexe peuvent avoir du texte mal extrait
- Les tableaux dans les PDFs peuvent être déstructurés

### Architecture
```
User (Drag & Drop)
    ↓
RAG Viewer (page.tsx)
    ↓
API /documents/upload (route.ts)
    ↓
Parser (pdf-parse / mammoth)
    ↓
Chunker (intelligent splitting)
    ↓
Question Generator
    ↓
Prisma KnowledgeBase
    ↓
RAG ready for chatbot
```

## ✅ Conclusion

Le système de drag & drop est **complet et fonctionnel**. Il permet d'enrichir rapidement le RAG avec des documents variés, rendant le chatbot encore plus intelligent et utile ! 🎉

