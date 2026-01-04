const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Copie de la fonction extractKeywords de chat/route.ts
function extractKeywords(query) {
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'à', 'au', 'aux', 'et', 'ou', 'est', 'sont',
    'quoi', 'quel', 'quelle', 'quels', 'quelles', 'comment', 'où', 'qui', 'que', 'quand', 'pourquoi',
    'pourrais', 'pourrait', 'peux', 'peut', 'faire', 'fais', 'fait', 'donner', 'donne',
    'me', 'te', 'nous', 'vous', 'leur', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
    'tableau', 'liste', 'détails', 'infos', 'information', 'informations',
    'esilv', 'école', 'ecole',
    'l', 'd', 'c', 'j', 's', 'n', 'm', 't', 'y'
  ];
  
  const words = query.toLowerCase()
    .replace(/[?!.,;:]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  const keywords = new Set();
  words.forEach(word => {
    keywords.add(word);
    if (word.endsWith('s') && word.length > 3) {
      keywords.add(word.slice(0, -1));
    }
    if (!word.endsWith('s')) {
      keywords.add(word + 's');
    }
    
    const deaccented = word
      .replace(/é|è|ê|ë/g, 'e')
      .replace(/à|â|ä/g, 'a')
      .replace(/ù|û|ü/g, 'u')
      .replace(/ô|ö/g, 'o')
      .replace(/ï|î/g, 'i');
    if (deaccented !== word) {
      keywords.add(deaccented);
    }
  });
  
  return Array.from(keywords).slice(0, 6);
}

async function testSearch(query) {
  console.log('\n' + '═'.repeat(70));
  console.log(`🔍 TEST DE RECHERCHE: "${query}"`);
  console.log('═'.repeat(70));
  
  const keywords = extractKeywords(query);
  console.log(`\n📝 Mots-clés extraits: ${keywords.join(', ')}`);
  
  const searchConditions = keywords.flatMap(keyword => {
    const lower = keyword.toLowerCase();
    const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
    const upper = keyword.toUpperCase();
    
    return [
      { question: { contains: lower } },
      { answer: { contains: lower } },
      { category: { contains: lower } },
      { question: { contains: capitalized } },
      { answer: { contains: capitalized } },
      { question: { contains: upper } },
      { answer: { contains: upper } }
    ];
  });
  
  const results = await prisma.knowledgeBase.findMany({
    where: {
      OR: searchConditions
    },
    orderBy: [
      { confidence: 'desc' },
      { lastVerified: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 15
  });
  
  console.log(`\n📊 Résultats trouvés: ${results.length}`);
  
  if (results.length > 0) {
    console.log('\n' + '─'.repeat(70));
    results.forEach((r, i) => {
      console.log(`\n${i + 1}. Question: ${r.question}`);
      console.log(`   Catégorie: ${r.category}`);
      console.log(`   Confiance: ${r.confidence}`);
      console.log(`   Réponse (150 premiers caractères):`);
      console.log(`   ${r.answer.substring(0, 150)}...`);
    });
  } else {
    console.log('\n❌ Aucun résultat trouvé avec cette recherche');
  }
}

async function main() {
  await testSearch('quelles sont les différentes associations de l\'esilv ?');
  await testSearch('quelles sont les majeures de l\'esilv ?');
  await testSearch('quand est la rentrée ?');
  
  await prisma.$disconnect();
}

main();

