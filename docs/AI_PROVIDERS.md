# Configuration Ollama et Gemini pour ESILV Smart Assistant

## ✅ Configuration Complète

Le projet a été configuré pour utiliser **Ollama** (local) et **Gemini** (Google) comme fournisseurs IA.

## 🔧 Configuration du fichier .env

Le fichier `.env` a été mis à jour avec les variables suivantes :

```env
# AI Provider Configuration
AI_PROVIDER=ollama  # ou 'gemini' pour utiliser Gemini

# Ollama Configuration (pour LLM local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Gemini Configuration (Google Gen AI)
GEMINI_API_KEY=votre-clé-api-gemini
GEMINI_MODEL=gemini-2.0-flash-exp
```

## 🦙 Configuration Ollama (Local)

### 1. Installation d'Ollama

**Windows :**
- Télécharger depuis : https://ollama.ai/download
- Installer l'exécutable

**Linux/Mac :**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Configuration du répertoire des modèles (Windows)

Si vos modèles sont dans un répertoire personnalisé (ex: `E:\ollama_models`) :

**Option 1 : Variable d'environnement système**
1. Ouvrir "Variables d'environnement" dans Windows
2. Ajouter une nouvelle variable système : `OLLAMA_MODELS=E:\ollama_models`
3. Redémarrer Ollama

**Option 2 : Variable d'environnement PowerShell (temporaire)**
```powershell
$env:OLLAMA_MODELS="E:\ollama_models"
ollama serve
```

### 3. Démarrer Ollama

```bash
# Avec répertoire personnalisé (si configuré)
$env:OLLAMA_MODELS="E:\ollama_models"
ollama serve

# Ou normalement
ollama serve
```

### 3. Modèles disponibles

Vos modèles sont stockés dans `E:\ollama_models`. Modèles actuellement disponibles :
- `qwen2.5:7b` / `qwen2.5:latest`
- `mistral:7b`
- `ministral-3:latest`
- `llama3:latest`
- `mistral-large-3:675b-cloud`

Pour télécharger d'autres modèles :
```bash
ollama pull llama3.1:8b
ollama pull llama2
ollama pull codellama
```

**Note :** Les modèles sont automatiquement sauvegardés dans `E:\ollama_models` grâce à la variable `OLLAMA_MODELS`.

### 4. Vérifier que Ollama fonctionne

```bash
ollama list
```

### 5. Configuration dans .env

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

## 🌟 Configuration Gemini (Google)

### 1. Obtenir une clé API

1. Aller sur : https://aistudio.google.com/apikey
2. Créer une nouvelle clé API
3. Copier la clé

### 2. Configuration dans .env

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=votre-clé-api-ici
GEMINI_MODEL=gemini-2.0-flash-exp
```

### 3. Modèles Gemini disponibles

- `gemini-2.0-flash-exp` (recommandé - rapide et gratuit)
- `gemini-1.5-pro` (plus puissant)
- `gemini-1.5-flash` (rapide)
- `gemini-pro` (ancien modèle)

## 🔄 Changer de fournisseur

### Méthode 1 : Modifier .env

1. Ouvrir le fichier `.env`
2. Changer `AI_PROVIDER` :
   - `AI_PROVIDER=ollama` pour Ollama
   - `AI_PROVIDER=gemini` pour Gemini
3. Redémarrer le serveur : `npm run dev`

### Méthode 2 : Via l'API

```bash
# Changer vers Ollama
curl -X POST http://localhost:3000/api/ai-config \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama", "model": "llama3.1:8b"}'

# Changer vers Gemini
curl -X POST http://localhost:3000/api/ai-config \
  -H "Content-Type: application/json" \
  -d '{"provider": "gemini", "model": "gemini-2.0-flash-exp"}'
```

## 🧪 Tester la configuration

### Tester Ollama

```bash
# Vérifier que Ollama répond
curl http://localhost:11434/api/tags

# Tester un modèle
ollama run llama3.1:8b "Bonjour, comment ça va ?"
```

### Tester Gemini

```bash
# Vérifier la configuration
curl http://localhost:3000/api/ai-config
```

### Tester le chatbot

1. Démarrer le serveur : `npm run dev`
2. Ouvrir http://localhost:3000
3. Envoyer un message de test

## 📝 Notes importantes

### Ollama
- ✅ **Gratuit** et **local** (données privées)
- ✅ Pas besoin de clé API
- ⚠️ Nécessite que `ollama serve` soit en cours d'exécution
- ⚠️ Nécessite assez de RAM (8GB+ recommandé pour llama3.1:8b)

### Gemini
- ✅ **Rapide** et **puissant**
- ✅ Gratuit jusqu'à un certain quota
- ⚠️ Nécessite une clé API Google
- ⚠️ Les données sont envoyées à Google

## 🐛 Dépannage

### Ollama ne répond pas

1. Vérifier que `ollama serve` est en cours d'exécution
2. Vérifier l'URL dans `.env` : `OLLAMA_BASE_URL=http://localhost:11434`
3. Tester : `curl http://localhost:11434/api/tags`

### Gemini erreur "API key not found"

1. Vérifier que `GEMINI_API_KEY` est défini dans `.env`
2. Vérifier que la clé est valide sur https://aistudio.google.com/apikey
3. Redémarrer le serveur après modification de `.env`

### Le chatbot ne répond pas

1. Vérifier les logs du serveur pour voir les erreurs
2. Vérifier la configuration : `curl http://localhost:3000/api/ai-config`
3. Tester avec un autre fournisseur

## 🚀 Démarrage rapide

```bash
# 1. Installer Ollama (si pas déjà fait)
# Windows : télécharger depuis https://ollama.ai/download

# 2. Démarrer Ollama
ollama serve

# 3. Télécharger un modèle
ollama pull llama3.1:8b

# 4. Configurer .env (déjà fait)
# AI_PROVIDER=ollama
# OLLAMA_MODEL=llama3.1:8b

# 5. Démarrer le serveur Next.js
npm run dev

# 6. Tester
# Ouvrir http://localhost:3000
```

---

**Le projet est maintenant configuré pour utiliser Ollama et Gemini !** 🎉

