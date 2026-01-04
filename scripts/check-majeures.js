/**
 * Script pour vérifier les entrées sur les majeures ESILV
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMajeures() {
  try {
    // Rechercher les entrées contenant "majeure" ou "majeures"
    const results = await prisma.knowledgeBase.findMany({
      where: {
        OR: [
          { question: { contains: 'majeure' } },
          { answer: { contains: 'majeure' } }
        ]
      },
      take: 10
    });

    console.log(`\n📚 Trouvé ${results.length} entrée(s) sur les majeures:\n`);

    results.forEach((entry, i) => {
      console.log(`${i + 1}. Question: ${entry.question}`);
      console.log(`   Catégorie: ${entry.category}`);
      console.log(`   Source: ${entry.source}`);
      console.log(`   Réponse (preview): ${entry.answer.substring(0, 200)}...`);
      console.log('');
    });

    // Lister les majeures mentionnées
    console.log('📋 Majeures détectées dans le contenu:');
    const majeuresSet = new Set();
    results.forEach(entry => {
      const text = entry.answer.toLowerCase();
      if (text.includes('informatique')) majeuresSet.add('Informatique & Objets Connectés');
      if (text.includes('data') || text.includes('intelligence artificielle')) majeuresSet.add('Data & IA');
      if (text.includes('cybersécurité') || text.includes('cybersecurite')) majeuresSet.add('Cybersécurité');
      if (text.includes('fintech')) majeuresSet.add('Fintech');
      if (text.includes('mécanique')) majeuresSet.add('Mécanique');
      if (text.includes('énergie') || text.includes('energie')) majeuresSet.add('Énergies Nouvelles');
      if (text.includes('genai') || text.includes('génératif')) majeuresSet.add('GenAI');
      if (text.includes('réalité virtuelle') || text.includes('realite virtuelle')) majeuresSet.add('Réalités Virtuelles & Augmentées');
    });

    majeuresSet.forEach(maj => console.log(`   ✓ ${maj}`));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMajeures();

