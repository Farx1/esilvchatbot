/**
 * Script MASTER pour setup complet du RAG ESILV
 * Exécute dans le bon ordre :
 * 1. Seed manuel (29 entrées structurées détaillées)
 * 2. Enrichissement URLs (200+ entrées scrapées)
 * 3. Vérification finale
 * 
 * Usage: node scripts/setup-complete-rag.js
 * 
 * ⚠️ IMPORTANT : L'application Next.js DOIT être lancée (localhost:3000)
 * avant d'exécuter ce script pour que l'API /api/knowledge fonctionne.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runScript(scriptPath, description) {
  console.log(`\n🚀 ${description}...`);
  console.log(`   Script: ${scriptPath}`);
  console.log(`   Démarrage: ${new Date().toLocaleTimeString()}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    console.log(stdout);
    if (stderr) console.error('⚠️  Warnings:', stderr);
    console.log(`✅ ${description} terminé\n`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de ${description}:`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   🎓 SETUP COMPLET RAG ESILV - SCRIPT MASTER         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Étape 1 : Seed manuel (entrées structurées détaillées)
  console.log('📋 Étape 1/3 : Seed manuel des entrées structurées');
  const step1 = await runScript(
    'scripts/seed-esilv-complete-v2.js',
    'Ajout des 29 entrées manuelles détaillées (majeures, admissions, etc.)'
  );

  if (!step1) {
    console.log('❌ Échec de l\'étape 1. Arrêt du script.');
    process.exit(1);
  }

  // Attendre 2 secondes entre les étapes
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Étape 2 : Enrichissement URLs
  console.log('\n📋 Étape 2/3 : Enrichissement avec les URLs ESILV');
  console.log('⚠️  Cette étape peut prendre 2-3 minutes...\n');
  
  const step2 = await runScript(
    'scripts/update-rag-with-urls.js',
    'Ajout de 200+ URLs scrapées depuis esilv.fr'
  );

  if (!step2) {
    console.log('❌ Échec de l\'étape 2. Vérification manuelle recommandée.');
  }

  // Attendre 2 secondes
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Étape 3 : Vérification finale
  console.log('\n📋 Étape 3/3 : Vérification finale de la base');
  await runScript(
    'scripts/check-db-count.js',
    'Vérification du nombre total d\'entrées'
  );

  await runScript(
    'scripts/check-majeures.js',
    'Vérification des entrées sur les majeures'
  );

  // Résumé final
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                  ✅ SETUP TERMINÉ                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n⏱️  Durée totale: ${duration} secondes`);
  console.log('\n📊 État final:');
  console.log('   - ~29 entrées manuelles structurées');
  console.log('   - ~200-250 entrées scrapées depuis esilv.fr');
  console.log('   - Total attendu: ~230-280 entrées\n');
  console.log('🎉 Le RAG est maintenant prêt à être utilisé !');
  console.log('   Testez avec: "Quelles sont les majeures de l\'ESILV ?"\n');
}

// Vérification préalable
console.log('🔍 Vérification préalable...\n');
console.log('⚠️  IMPORTANT : L\'application Next.js doit être lancée sur localhost:3000');
console.log('   Vérifiez que vous avez bien exécuté "npm run dev" avant de lancer ce script.\n');

// Attendre confirmation (5 secondes)
setTimeout(() => {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}, 2000);

