const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssociationsAndRentree() {
  try {
    // Recherche associations
    const assoc = await prisma.knowledgeBase.findMany({
      where: {
        OR: [
          { question: { contains: 'association' } },
          { answer: { contains: 'association' } }
        ]
      },
      take: 5
    });

    console.log('═══════════════════════════════════════════');
    console.log('🏢 ASSOCIATIONS');
    console.log('═══════════════════════════════════════════');
    if (assoc.length > 0) {
      assoc.forEach((a, i) => {
        console.log(`\n${i + 1}. Question: ${a.question}`);
        console.log(`   Réponse (extrait): ${a.answer.substring(0, 150)}...`);
      });
    } else {
      console.log('❌ Aucune entrée trouvée sur les associations');
    }

    // Recherche rentrée
    const rentree = await prisma.knowledgeBase.findMany({
      where: {
        OR: [
          { question: { contains: 'rentrée' } },
          { answer: { contains: 'rentrée' } },
          { question: { contains: 'rentree' } },
          { answer: { contains: 'rentree' } }
        ]
      },
      take: 5
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('📅 RENTRÉE');
    console.log('═══════════════════════════════════════════');
    if (rentree.length > 0) {
      rentree.forEach((r, i) => {
        console.log(`\n${i + 1}. Question: ${r.question}`);
        console.log(`   Réponse (extrait): ${r.answer.substring(0, 150)}...`);
      });
    } else {
      console.log('❌ Aucune entrée trouvée sur la rentrée');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('📊 RÉSUMÉ');
    console.log('═══════════════════════════════════════════');
    console.log(`✓ Associations: ${assoc.length} entrée(s)`);
    console.log(`✓ Rentrée: ${rentree.length} entrée(s)`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssociationsAndRentree();

