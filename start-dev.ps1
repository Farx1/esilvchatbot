# Script de démarrage pour le serveur de développement
# Résout les problèmes de compatibilité Node.js 22 avec Next.js 15

Write-Host "🚀 Démarrage du serveur ESILV Smart Assistant..." -ForegroundColor Green

# Configuration de l'environnement Node.js pour Next.js 15
$env:NODE_OPTIONS = "--experimental-global-web-streams"

# Vérification de la base de données
if (-not (Test-Path "db\custom.db")) {
    Write-Host "📦 Initialisation de la base de données..." -ForegroundColor Yellow
    npm run db:push
}

# Démarrage du serveur
Write-Host "🌐 Démarrage sur http://localhost:3000..." -ForegroundColor Cyan
npm run dev

