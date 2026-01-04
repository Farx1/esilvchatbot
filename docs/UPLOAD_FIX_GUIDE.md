# 🔧 Guide de résolution : Erreur Upload Documents

## ❌ Problème rencontré

```
Error: Server returned non-JSON response (possibly an error page)
<!DOCTYPE html>...
```

L'API `/api/documents/upload` retourne du HTML au lieu de JSON, ce qui indique que l'API route **crash avant de s'exécuter**.

---

## 🔍 Cause identifiée

**`pdf-parse` et `mammoth` nécessitent le runtime Node.js**, mais Next.js utilise par défaut le **Edge Runtime** pour les API routes, qui ne supporte pas certains modules Node.js natifs (comme `fs`, `buffer`, etc.).

---

## ✅ Solution appliquée

### 1. **Ajout de la configuration runtime dans `route.ts`**

```typescript
// Force Node.js runtime (required for pdf-parse and mammoth)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

Cette configuration force Next.js à utiliser le runtime Node.js complet au lieu du Edge Runtime.

### 2. **Création d'une API de test** (`/api/documents/test`)

Une API simple sans dépendances lourdes pour diagnostiquer si le problème vient de Next.js ou des imports.

---

## 🧪 Étapes de test

### Étape 1 : **Redémarrer le serveur Next.js**

**IMPORTANT** : Les changements de runtime nécessitent un redémarrage complet du serveur.

```bash
# Dans le terminal où Next.js tourne
# Arrêter avec Ctrl+C

# Relancer
npm run dev
```

### Étape 2 : **Tester l'API de test**

Ouvrir dans le navigateur :
```
http://localhost:3000/api/documents/test
```

Vous devriez voir :
```json
{
  "message": "Test API is running"
}
```

✅ **Si ça fonctionne** : Next.js est opérationnel
❌ **Si page blanche ou erreur** : Problème avec Next.js lui-même

### Étape 3 : **Tester l'upload avec `test-upload.txt`**

1. Aller sur `http://localhost:3000/rag-viewer`
2. Ouvrir la **console du navigateur** (F12)
3. Glisser-déposer le fichier `test-upload.txt`
4. Observer les logs :

**Logs attendus (succès)** :
```
📤 Uploading file: test-upload.txt Size: XXX
📥 Response received: 200 OK
Content-Type: application/json
📦 Response data: { success: true, ... }
✅ Upload successful!
```

**Logs attendus (échec)** :
```
📤 Uploading file: test-upload.txt Size: XXX
📥 Response received: 500 Internal Server Error
❌ Non-JSON response: <!DOCTYPE html>...
```

### Étape 4 : **Vérifier les logs du serveur Next.js**

Dans le terminal où `npm run dev` tourne, vous devriez voir :

**Si succès** :
```
📤 Upload API called
📄 File received: test-upload.txt Size: XXX
🔍 File extension: txt Max size: 52428800
📥 Reading file buffer...
🔧 Parsing file as txt...
📄 Reading text file...
✅ Text file read, length: XXX
✂️ Chunking content...
✅ Created X chunks
💾 Saving to database...
✅ Upload complete! X chunks saved
```

**Si erreur** :
```
❌ PDF parsing error: ...
ou
Error: Cannot find module '...'
ou
Error [ERR_REQUIRE_ESM]: ...
```

---

## 🔧 Solutions alternatives si le problème persiste

### Solution A : Réinstaller les dépendances

```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

### Solution B : Utiliser `pdf-lib` au lieu de `pdf-parse`

`pdf-parse` a des dépendances natives qui peuvent causer des problèmes. `pdf-lib` est plus moderne et compatible Edge Runtime.

```bash
npm uninstall pdf-parse @types/pdf-parse
npm install pdf-lib
```

Modifier `route.ts` :
```typescript
import { PDFDocument } from 'pdf-lib'

async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  const pdfDoc = await PDFDocument.load(buffer)
  const pages = pdfDoc.getPages()
  // Extraction de texte avec pdf-lib (plus complexe)
  // ...
}
```

### Solution C : Utiliser un worker externe pour le parsing PDF

Créer un endpoint séparé qui gère uniquement le parsing PDF dans un environnement Node.js pur, puis appeler cet endpoint depuis l'API upload.

---

## 📊 Checklist de débogage

- [ ] Serveur Next.js redémarré après ajout `runtime = 'nodejs'`
- [ ] `/api/documents/test` accessible et retourne JSON
- [ ] Console navigateur ouverte pendant le test d'upload
- [ ] Terminal Next.js visible pour voir les logs serveur
- [ ] `pdf-parse` et `mammoth` installés (`npm list pdf-parse mammoth`)
- [ ] Fichier `test-upload.txt` utilisé pour le premier test (petit fichier)
- [ ] Fichier PDF testé après succès avec TXT

---

## 🐛 Erreurs courantes et solutions

### Erreur 1 : `Error [ERR_REQUIRE_ESM]`
**Cause** : Conflit ESM/CommonJS
**Solution** : Ajouter `"type": "module"` dans `package.json` OU utiliser `dynamic import()`

### Erreur 2 : `Cannot find module 'canvas'`
**Cause** : `pdf-parse` nécessite `canvas` pour certains PDFs
**Solution** : `npm install canvas` (peut nécessiter des dépendances système)

### Erreur 3 : `EPERM: operation not permitted`
**Cause** : Prisma verrouillé pendant le build
**Solution** : Arrêter le serveur dev avant `npm run build`

### Erreur 4 : `Unexpected token '<'`
**Cause** : L'API route n'est pas accessible (erreur 404 ou crash)
**Solution** : Vérifier que le fichier `route.ts` est à `src/app/api/documents/upload/route.ts`

---

## 📞 Si le problème persiste

1. **Copier les logs complets** du terminal Next.js
2. **Copier les logs console** du navigateur
3. **Vérifier la version de Node.js** : `node --version` (doit être >= 18.17)
4. **Vérifier la version de Next.js** : `npm list next`

---

## ✅ Test final avec le PDF de 50MB

Une fois que `test-upload.txt` fonctionne :

1. Tester avec `plaquette-alpha-web.pdf`
2. **Attendre 15-30 secondes** (gros fichier)
3. Surveiller l'utilisation mémoire du serveur
4. Si timeout, augmenter le timeout dans `next.config.js` :

```javascript
module.exports = {
  // ...
  experimental: {
    proxyTimeout: 300_000, // 5 minutes
  },
}
```

---

**Dernière mise à jour** : 2026-01-04
**Version** : 1.2
**Status** : En diagnostic 🔍

