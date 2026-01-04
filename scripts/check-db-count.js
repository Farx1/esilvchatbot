/**
 * Script rapide pour vérifier le nombre d'entrées dans la DB
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const totalCount = await prisma.knowledgeBase.count();
    console.log(`📊 Total d'entrées dans la base: ${totalCount}`);
    
    // Compter par catégorie
    const categories = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      _count: true
    });
    
    console.log('\n📁 Répartition par catégorie:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat._count} entrées`);
    });
    
    // Compter les entrées scrapées (avec source URL)
    const scrapedCount = await prisma.knowledgeBase.count({
      where: {
        source: {
          contains: 'esilv.fr'
        }
      }
    });
    console.log(`\n🌐 Entrées scrapées depuis esilv.fr: ${scrapedCount}`);
    
    // Compter les documents uploadés
    const uploadedCount = await prisma.knowledgeBase.count({
      where: {
        source: {
          startsWith: 'upload:'
        }
      }
    });
    console.log(`📄 Documents uploadés: ${uploadedCount}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

