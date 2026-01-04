const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showAssociationsDetail() {
  try {
    const result = await prisma.knowledgeBase.findFirst({
      where: {
        question: { contains: 'forum des associations' }
      }
    });

    if (result) {
      console.log('QUESTION:', result.question);
      console.log('\n' + '='.repeat(60));
      console.log('RÉPONSE COMPLÈTE:');
      console.log('='.repeat(60));
      console.log(result.answer);
    } else {
      console.log('Aucune entrée trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showAssociationsDetail();

