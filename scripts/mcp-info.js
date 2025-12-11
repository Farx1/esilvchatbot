#!/usr/bin/env node

/**
 * Script pour afficher les informations sur les serveurs MCP configurés
 */

const fs = require('fs')
const path = require('path')

const mcpConfigPath = path.join(process.cwd(), '.mcprc.json')

console.log('\n' + '='.repeat(60))
console.log('📡 SERVEURS MCP CONFIGURÉS')
console.log('='.repeat(60) + '\n')

try {
  if (!fs.existsSync(mcpConfigPath)) {
    console.log('❌ Aucun fichier .mcprc.json trouvé')
    process.exit(1)
  }

  const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'))
  
  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log('⚠️  Aucun serveur MCP configuré')
    process.exit(0)
  }

  Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
    console.log(`🔌 ${name}`)
    console.log(`   Commande: ${serverConfig.command} ${(serverConfig.args || []).join(' ')}`)
    if (serverConfig.description) {
      console.log(`   Description: ${serverConfig.description}`)
    }
    console.log()
  })

  console.log('='.repeat(60))
  console.log('✅ Total:', Object.keys(config.mcpServers).length, 'serveur(s) MCP')
  console.log('='.repeat(60) + '\n')

} catch (error) {
  console.error('❌ Erreur lors de la lecture de la configuration:', error.message)
  process.exit(1)
}

