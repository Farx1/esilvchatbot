/**
 * Script de validation automatisée du RAG
 * Teste les réponses du chatbot pour vérifier la qualité des données
 * Usage: node scripts/validate-rag-data.js
 */

// Liste des tests à effectuer
const tests = [
  {
    url: 'https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-genai',
    question: 'Parle-moi du parcours GenAI à l\'ESILV',
    expectedKeywords: ['GenAI', 'intelligence artificielle générative', 'IA générative'],
    expectedSource: 'parcours-genai',
    minConfidence: 0.8
  },
  {
    url: 'https://www.esilv.fr/entreprises-debouches/reseau-des-anciens/',
    question: 'Quels services propose le réseau alumni de l\'ESILV ?',
    expectedKeywords: ['carrière', 'alumni', 'réseau', 'anciens'],
    expectedSource: 'reseau-des-anciens',
    minConfidence: 0.8
  },
  {
    url: 'https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-quantique',
    question: 'Qu\'est-ce que le parcours Quantique à l\'ESILV ?',
    expectedKeywords: ['quantique', 'quantum', 'informatique quantique'],
    expectedSource: 'parcours-quantique',
    minConfidence: 0.8
  },
  {
    url: 'https://www.esilv.fr/formations/cycle-ingenieur/majeures/cybersecurite-cloud-computing',
    question: 'Parle-moi de la majeure Cybersécurité et Cloud Computing',
    expectedKeywords: ['cybersécurité', 'cloud', 'sécurité', 'computing'],
    expectedSource: 'cybersecurite-cloud-computing',
    minConfidence: 0.8
  },
  {
    url: 'https://www.esilv.fr/admissions/rencontrez-nous/journees-portes-ouvertes',
    question: 'Quand ont lieu les journées portes ouvertes de l\'ESILV ?',
    expectedKeywords: ['portes ouvertes', 'JPO', 'visite', 'campus'],
    expectedSource: 'journees-portes-ouvertes',
    minConfidence: 0.7
  },
  {
    url: 'https://www.esilv.fr/international/programme-erasmus',
    question: 'Comment fonctionne le programme Erasmus à l\'ESILV ?',
    expectedKeywords: ['Erasmus', 'international', 'échange', 'Europe'],
    expectedSource: 'programme-erasmus',
    minConfidence: 0.7
  },
  {
    url: 'https://www.esilv.fr/formations/cycle-ingenieur/majeures/data-et-intelligence-artificielle',
    question: 'Quelle est la majeure Data et IA ?',
    expectedKeywords: ['data', 'intelligence artificielle', 'IA', 'données'],
    expectedSource: 'data-et-intelligence-artificielle',
    minConfidence: 0.8
  },
  {
    url: 'https://www.esilv.fr/lecole/vie-etudiante/sport',
    question: 'Quelles activités sportives sont proposées à l\'ESILV ?',
    expectedKeywords: ['sport', 'activités', 'sportif'],
    expectedSource: 'sport',
    minConfidence: 0.7
  }
];

// Fonction pour poser une question au chatbot
async function askChatbot(question) {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        conversationHistory: []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Erreur lors de l'appel API:`, error);
    return null;
  }
}

// Fonction pour vérifier si la réponse contient les mots-clés attendus
function checkKeywords(response, expectedKeywords) {
  const responseLower = response.toLowerCase();
  const foundKeywords = expectedKeywords.filter(kw => 
    responseLower.includes(kw.toLowerCase())
  );
  
  return {
    found: foundKeywords.length,
    total: expectedKeywords.length,
    percentage: Math.round((foundKeywords.length / expectedKeywords.length) * 100),
    foundKeywords,
    missingKeywords: expectedKeywords.filter(kw => !foundKeywords.includes(kw))
  };
}

// Fonction pour vérifier si la source est citée
function checkSource(response, expectedSource) {
  const responseLower = response.toLowerCase();
  return responseLower.includes(expectedSource.toLowerCase());
}

// Fonction pour exécuter tous les tests
async function runAllTests() {
  console.log('🧪 Démarrage des tests de validation du RAG\n');
  console.log(`📋 Nombre de tests: ${tests.length}\n`);
  
  const results = [];
  let passedTests = 0;
  let failedTests = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testNumber = i + 1;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Test ${testNumber}/${tests.length}: ${test.question}`);
    console.log(`${'='.repeat(80)}`);
    
    const startTime = Date.now();
    const response = await askChatbot(test.question);
    const responseTime = Date.now() - startTime;
    
    if (!response || !response.response) {
      console.log('❌ Pas de réponse du chatbot');
      failedTests++;
      results.push({
        testNumber,
        question: test.question,
        passed: false,
        error: 'No response from chatbot'
      });
      continue;
    }
    
    // Vérifications
    const keywordCheck = checkKeywords(response.response, test.expectedKeywords);
    const sourceCheck = checkSource(response.response, test.expectedSource);
    
    // Déterminer si le test passe
    const keywordsPassed = keywordCheck.percentage >= 50; // Au moins 50% des mots-clés
    const sourcesPassed = sourceCheck;
    const timePassed = responseTime < 5000; // Moins de 5 secondes
    
    const testPassed = keywordsPassed && timePassed;
    
    if (testPassed) {
      console.log('✅ Test PASSED');
      passedTests++;
    } else {
      console.log('❌ Test FAILED');
      failedTests++;
    }
    
    console.log(`\n📊 Détails:`);
    console.log(`   ⏱️  Temps de réponse: ${responseTime}ms ${timePassed ? '✅' : '❌ (> 5s)'}`);
    console.log(`   🔑 Mots-clés trouvés: ${keywordCheck.found}/${keywordCheck.total} (${keywordCheck.percentage}%) ${keywordsPassed ? '✅' : '❌'}`);
    if (keywordCheck.foundKeywords.length > 0) {
      console.log(`      Trouvés: ${keywordCheck.foundKeywords.join(', ')}`);
    }
    if (keywordCheck.missingKeywords.length > 0) {
      console.log(`      Manquants: ${keywordCheck.missingKeywords.join(', ')}`);
    }
    console.log(`   📚 Source citée: ${sourceCheck ? '✅' : '❌ (non trouvée)'}`);
    
    console.log(`\n💬 Réponse (extrait):`);
    console.log(`   ${response.response.substring(0, 200)}...`);
    
    results.push({
      testNumber,
      question: test.question,
      url: test.url,
      passed: testPassed,
      responseTime,
      keywordCheck,
      sourceCheck,
      response: response.response.substring(0, 500)
    });
    
    // Attendre un peu entre les tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Afficher le résumé
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(80));
  console.log(`✅ Tests réussis: ${passedTests}/${tests.length} (${Math.round((passedTests / tests.length) * 100)}%)`);
  console.log(`❌ Tests échoués: ${failedTests}/${tests.length}`);
  
  if (failedTests > 0) {
    console.log(`\n⚠️  Tests problématiques:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - Test ${r.testNumber}: ${r.question}`);
      if (r.error) {
        console.log(`     Erreur: ${r.error}`);
      }
    });
  }
  
  // Générer le rapport
  return {
    timestamp: new Date().toISOString(),
    totalTests: tests.length,
    passed: passedTests,
    failed: failedTests,
    successRate: Math.round((passedTests / tests.length) * 100) + '%',
    tests: results
  };
}

// Fonction pour sauvegarder le rapport
async function saveReport(report) {
  const fs = require('fs');
  const path = require('path');
  
  // Créer le contenu Markdown
  let markdown = `# Rapport de Validation du RAG\n\n`;
  markdown += `**Date**: ${new Date(report.timestamp).toLocaleString('fr-FR')}\n\n`;
  markdown += `## Résumé\n\n`;
  markdown += `- **Tests exécutés**: ${report.totalTests}\n`;
  markdown += `- **Tests réussis**: ${report.passed} ✅\n`;
  markdown += `- **Tests échoués**: ${report.failed} ❌\n`;
  markdown += `- **Taux de réussite**: ${report.successRate}\n\n`;
  
  if (report.failed > 0) {
    markdown += `## ⚠️ Tests Échoués\n\n`;
    report.tests.filter(t => !t.passed).forEach(test => {
      markdown += `### Test ${test.testNumber}: ${test.question}\n\n`;
      if (test.error) {
        markdown += `**Erreur**: ${test.error}\n\n`;
      } else {
        markdown += `- **URL**: ${test.url}\n`;
        markdown += `- **Temps de réponse**: ${test.responseTime}ms\n`;
        markdown += `- **Mots-clés**: ${test.keywordCheck.found}/${test.keywordCheck.total} (${test.keywordCheck.percentage}%)\n`;
        markdown += `- **Source citée**: ${test.sourceCheck ? 'Oui' : 'Non'}\n\n`;
      }
    });
  }
  
  markdown += `## ✅ Tests Réussis\n\n`;
  report.tests.filter(t => t.passed).forEach(test => {
    markdown += `### Test ${test.testNumber}: ${test.question}\n\n`;
    markdown += `- **URL**: ${test.url}\n`;
    markdown += `- **Temps de réponse**: ${test.responseTime}ms\n`;
    markdown += `- **Mots-clés**: ${test.keywordCheck.found}/${test.keywordCheck.total} (${test.keywordCheck.percentage}%)\n`;
    markdown += `- **Source citée**: ${test.sourceCheck ? 'Oui' : 'Non'}\n\n`;
  });
  
  markdown += `## Recommandations\n\n`;
  if (report.failed === 0) {
    markdown += `✅ Tous les tests ont réussi ! Le RAG fonctionne correctement.\n\n`;
  } else {
    markdown += `- Vérifier les entrées RAG pour les tests échoués\n`;
    markdown += `- S'assurer que les sources sont correctement citées\n`;
    markdown += `- Améliorer l'extraction de contenu pour les mots-clés manquants\n\n`;
  }
  
  // Sauvegarder le fichier
  const docsPath = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath);
  }
  
  const reportPath = path.join(docsPath, 'VALIDATION_REPORT.md');
  fs.writeFileSync(reportPath, markdown);
  
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
}

// Fonction principale
async function main() {
  try {
    const report = await runAllTests();
    await saveReport(report);
    
    console.log('\n✅ Validation terminée !');
    
    // Exit avec code approprié
    process.exit(report.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Erreur lors de la validation:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();

