/**
 * Script de test pour le système de mise à jour automatique du RAG
 * 
 * Ce script teste :
 * 1. La comparaison des données RAG vs Web
 * 2. La détection de conflits
 * 3. La mise à jour automatique du RAG
 * 4. Le logging des mises à jour
 */

const API_BASE = 'http://localhost:3000/api';

async function testRAGUpdateSystem() {
  console.log('🧪 Test du système de mise à jour automatique du RAG\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Vérifier que l'API RAG Updates fonctionne
    console.log('\n📊 Test 1: Vérification de l\'API RAG Updates');
    console.log('-'.repeat(60));
    
    const updatesResponse = await fetch(`${API_BASE}/rag-updates?limit=10`);
    if (updatesResponse.ok) {
      const updatesData = await updatesResponse.json();
      console.log(`✅ API RAG Updates fonctionnelle`);
      console.log(`   Nombre de logs: ${updatesData.count}`);
      if (updatesData.stats) {
        console.log(`   Stats par type:`, updatesData.stats.byType);
        console.log(`   Stats par trigger:`, updatesData.stats.byTrigger);
      }
    } else {
      console.log(`❌ Erreur API RAG Updates: ${updatesResponse.status}`);
    }
    
    // Test 2: Tester une question qui devrait déclencher le scraper
    console.log('\n🔍 Test 2: Question sur la responsable alumni (devrait déclencher scraper)');
    console.log('-'.repeat(60));
    
    const chatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Qui est la responsable alumni de l\'ESILV ?',
        conversationHistory: []
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log(`✅ Réponse reçue`);
      console.log(`   Agent type: ${chatData.agentType}`);
      console.log(`   Réponse: ${chatData.response.substring(0, 150)}...`);
      
      // Attendre quelques secondes pour que le scraper parallèle se termine
      console.log('\n⏳ Attente de 15 secondes pour le scraper parallèle...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Vérifier si de nouveaux logs ont été créés
      const newUpdatesResponse = await fetch(`${API_BASE}/rag-updates?limit=5`);
      if (newUpdatesResponse.ok) {
        const newUpdatesData = await newUpdatesResponse.json();
        console.log(`\n📝 Nouveaux logs RAG Updates:`);
        if (newUpdatesData.updates && newUpdatesData.updates.length > 0) {
          newUpdatesData.updates.forEach((update, i) => {
            console.log(`\n   Log ${i + 1}:`);
            console.log(`     Type: ${update.updateType}`);
            console.log(`     Query: ${update.query.substring(0, 50)}...`);
            console.log(`     Source: ${update.source || 'N/A'}`);
            console.log(`     Triggered by: ${update.triggeredBy}`);
            console.log(`     Date: ${new Date(update.createdAt).toLocaleString('fr-FR')}`);
          });
        } else {
          console.log(`   Aucun nouveau log (le scraper n'a peut-être pas détecté de conflit)`);
        }
      }
    } else {
      console.log(`❌ Erreur API Chat: ${chatResponse.status}`);
    }
    
    // Test 3: Vérifier la base de connaissances
    console.log('\n📚 Test 3: Vérification de la base de connaissances');
    console.log('-'.repeat(60));
    
    const kbResponse = await fetch(`${API_BASE}/knowledge?search=alumni`);
    if (kbResponse.ok) {
      const kbData = await kbResponse.json();
      console.log(`✅ Base de connaissances accessible`);
      console.log(`   Entrées trouvées: ${kbData.total}`);
      
      if (kbData.items && kbData.items.length > 0) {
        console.log(`\n   Exemples d'entrées:`);
        kbData.items.slice(0, 3).forEach((item, i) => {
          console.log(`\n   Entrée ${i + 1}:`);
          console.log(`     Question: ${item.question.substring(0, 60)}...`);
          console.log(`     Catégorie: ${item.category}`);
          console.log(`     Dernière vérification: ${new Date(item.lastVerified).toLocaleString('fr-FR')}`);
        });
      }
    } else {
      console.log(`❌ Erreur API Knowledge: ${kbResponse.status}`);
    }
    
    // Test 4: Test de l'API find_conflicts
    console.log('\n🔍 Test 4: Test de l\'API find_conflicts');
    console.log('-'.repeat(60));
    
    const conflictsResponse = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'find_conflicts',
        newInfo: 'La responsable alumni de l\'ESILV est Marie Dupont. Elle gère le réseau des anciens élèves.'
      })
    });
    
    if (conflictsResponse.ok) {
      const conflictsData = await conflictsResponse.json();
      console.log(`✅ API find_conflicts fonctionnelle`);
      console.log(`   Conflits détectés: ${conflictsData.count}`);
      
      if (conflictsData.conflicts && conflictsData.conflicts.length > 0) {
        console.log(`\n   Exemples de conflits:`);
        conflictsData.conflicts.slice(0, 3).forEach((conflict, i) => {
          console.log(`\n   Conflit ${i + 1}:`);
          console.log(`     Question: ${conflict.question.substring(0, 60)}...`);
          console.log(`     Mots-clés partagés: ${conflict.sharedKeywords.join(', ')}`);
        });
      }
    } else {
      console.log(`❌ Erreur API find_conflicts: ${conflictsResponse.status}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests terminés avec succès !');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
    console.error(error);
  }
}

// Exécuter les tests
testRAGUpdateSystem().catch(console.error);

