# Script de démarrage Ollama avec répertoire personnalisé
# Pour Windows - Configure Ollama pour utiliser E:\ollama_models

Write-Host "🦙 Démarrage d'Ollama avec répertoire personnalisé..." -ForegroundColor Green

# Définir le répertoire des modèles
$env:OLLAMA_MODELS = "E:\ollama_models"

Write-Host "📁 Répertoire des modèles : $env:OLLAMA_MODELS" -ForegroundColor Cyan

# Vérifier que le répertoire existe
if (-not (Test-Path $env:OLLAMA_MODELS)) {
    Write-Host "⚠️ Le répertoire $env:OLLAMA_MODELS n'existe pas." -ForegroundColor Yellow
    Write-Host "   Création du répertoire..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $env:OLLAMA_MODELS -Force | Out-Null
}

# Vérifier si Ollama est installé
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaPath) {
    Write-Host "❌ Ollama n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "   Téléchargez-le depuis : https://ollama.ai/download" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Ollama trouvé : $($ollamaPath.Source)" -ForegroundColor Green

# Lister les modèles disponibles
Write-Host "`n📦 Modèles disponibles dans $env:OLLAMA_MODELS :" -ForegroundColor Cyan
$models = Get-ChildItem $env:OLLAMA_MODELS -ErrorAction SilentlyContinue
if ($models) {
    $models | ForEach-Object {
        $sizeGB = [math]::Round($_.Length / 1GB, 2)
        Write-Host "   - $($_.Name) ($sizeGB GB)" -ForegroundColor White
    }
} else {
    Write-Host "   Aucun modèle trouvé" -ForegroundColor Yellow
    Write-Host "   Pour télécharger un modèle : ollama pull llama3.1:8b" -ForegroundColor Gray
}

Write-Host "`n🚀 Démarrage d'Ollama..." -ForegroundColor Green
Write-Host "   (Appuyez sur Ctrl+C pour arrêter)`n" -ForegroundColor Gray

# Démarrer Ollama
ollama serve

