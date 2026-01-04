/**
 * Script pour supprimer des entrées spécifiques invalides du RAG
 * Usage: node scripts/clean-specific-entries.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanSpecificEntries() {
  try {
    console.log('🧹 Nettoyage d\'entrées spécifiques invalides...\n');

    let totalDeleted = 0;

    // 1. Supprimer les entrées avec des questions non pertinentes (hors sujet ESILV)
    const invalidPhrases = [
      'président des etats unis',
      'président des États-Unis',
      'president of the united states',
      'who is the president'
    ];

    for (const phrase of invalidPhrases) {
      const deleted = await prisma.knowledgeBase.deleteMany({
        where: {
          OR: [
            { question: { contains: phrase } },
            { answer: { contains: phrase } }
          ]
        }
      });
      
      if (deleted.count > 0) {
        console.log(`❌ Supprimé ${deleted.count} entrée(s) contenant: "${phrase}"`);
        totalDeleted += deleted.count;
      }
    }

    // 2. Supprimer les entrées avec des entités HTML encodées (mauvais scraping)
    const htmlEntities = ['&#039;', '&#038;', '&rsquo;', '&nbsp;', '&amp;'];
    
    const htmlEntriesCount = await prisma.knowledgeBase.count({
      where: {
        OR: htmlEntities.map(entity => ({
          answer: { contains: entity }
        }))
      }
    });

    if (htmlEntriesCount > 0) {
      console.log(`\n⚠️  Trouvé ${htmlEntriesCount} entrée(s) avec entités HTML`);
      console.log('   Ces entrées seront supprimées car elles contiennent du HTML mal parsé.');
      
      for (const entity of htmlEntities) {
        const deleted = await prisma.knowledgeBase.deleteMany({
          where: {
            answer: { contains: entity }
          }
        });
        
        if (deleted.count > 0) {
          console.log(`   ❌ Supprimé ${deleted.count} entrée(s) avec "${entity}"`);
          totalDeleted += deleted.count;
        }
      }
    }

    // 3. Supprimer les entrées avec des balises HTML (scraping échoué)
    const htmlTags = ['<div', '<span', '<script', '<style', '<head', '<body'];
    
    for (const tag of htmlTags) {
      const deleted = await prisma.knowledgeBase.deleteMany({
        where: {
          answer: { contains: tag }
        }
      });
      
      if (deleted.count > 0) {
        console.log(`❌ Supprimé ${deleted.count} entrée(s) avec balise HTML "${tag}"`);
        totalDeleted += deleted.count;
      }
    }

    console.log(`\n✅ Nettoyage terminé: ${totalDeleted} entrée(s) supprimée(s)`);

    // Afficher les nouvelles statistiques
    const newTotal = await prisma.knowledgeBase.count();
    console.log(`📊 Nouveau total d'entrées: ${newTotal}`);

    // Afficher la répartition par catégorie
    const categories = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      _count: true
    });

    console.log('\n📁 Répartition par catégorie:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count} entrées`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSpecificEntries();

