const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkForumEntry() {
  try {
    const forumEntries = await prisma.knowledgeBase.findMany({
      where: {
        question: { contains: 'forum' }
      }
    });
    
    console.log(`\n📊 Entrées contenant "forum": ${forumEntries.length}\n`);
    
    if (forumEntries.length > 0) {
      forumEntries.forEach((e, i) => {
        console.log(`${i + 1}. ${e.question}`);
        console.log(`   Catégorie: ${e.category}`);
        console.log(`   Contient "association"?: ${e.answer.includes('association') || e.answer.includes('Association')}`);
        console.log(``);
      });
    } else {
      console.log('❌ Aucune entrée trouvée');
    }
    
    // Test direct: chercher "association" dans answer
    console.log('\n═══════════════════════════════════════');
    console.log('Test: Recherche "association" dans answer');
    console.log('═══════════════════════════════════════\n');
    
    const assocInAnswer = await prisma.knowledgeBase.findMany({
      where: {
        answer: { contains: 'association' }
      },
      take: 10
    });
    
    console.log(`Résultats: ${assocInAnswer.length} entrée(s)\n`);
    assocInAnswer.forEach((e, i) => {
      console.log(`${i + 1}. ${e.question.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForumEntry();

