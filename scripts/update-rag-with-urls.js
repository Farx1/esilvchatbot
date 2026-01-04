/**
 * Script pour mettre à jour le RAG avec les URLs correctes et ajouter de nouvelles pages
 * Usage: node scripts/update-rag-with-urls.js
 */

const cheerio = require('cheerio');

// Liste des URLs à ajouter au RAG
const urlsToAdd = [
  "https://www.esilv.fr/entreprises-debouches/reseau-des-anciens/",
  "https://www.esilv.fr/en/2025-salary-guide-what-traders-analysts-and-quants-really-earn-in-fintech",
  "https://www.esilv.fr/en/ufaq",
  "https://www.esilv.fr/entreprises-debouches/projets",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/creative-technology",
  "https://www.esilv.fr/formations/msc-cyber-resilience-crisis-leadership",
  "https://www.esilv.fr/admissions/rencontrez-nous/journees-portes-ouvertes",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/objets-connectes-et-cybersecurite",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/energie-et-villes-durable",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/data-et-intelligence-artificielle",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/ingenierie-financiere",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/cybersecurite-cloud-computing",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/conception-mecanique-et-industrie-durable",
  "https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-genai",
  "https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-quantique",
  "https://www.esilv.fr/formations/bachelor-technologie-management",
  "https://www.esilv.fr/international/universites-partenaires",
  "https://www.esilv.fr/lecole/vie-etudiante/sport",
  "https://www.esilv.fr/entreprises-debouches/filieres-en-alternance"
];

async function scrapePageContent(url) {
  try {
    console.log(`📥 Scraping: ${url}`);
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; ESILVBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraire le titre
    let title = $('h1').first().text().trim() || $('title').text().trim() || 'Information ESILV';

    // Extraire le contenu principal en excluant les éléments de navigation
    let content = '';
    
    // Supprimer les éléments de navigation avant d'extraire le contenu
    $('nav, header, footer, .menu, .navigation, .sidebar, aside, .breadcrumb').remove();
    
    // Cibler le contenu principal
    const mainContent = $('main, article, .post_content, .content, #content, .main-content').first();
    
    if (mainContent.length) {
      // Extraire les paragraphes et titres du contenu principal
      mainContent.find('p, h2, h3, ul li, ol li').each((i, el) => {
        const text = $(el).text().trim();
        // Filtrer le bruit
        if (text.length > 40 && text.length < 800 && !text.includes('Close')) {
          content += text + ' ';
        }
      });
    } else {
      // Fallback si pas de contenu principal identifiable
      $('p, h2, h3').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 40 && text.length < 800) {
          content += text + ' ';
        }
      });
    }

    // Nettoyer le contenu
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 2000); // Limiter à 2000 caractères

    if (!content || content.length < 100) {
      console.warn(`⚠️  Contenu insuffisant pour ${url}`);
      return null;
    }

    // Extraire la catégorie depuis l'URL
    let category = 'informations_generales';
    if (url.includes('/formations/')) category = 'formations';
    else if (url.includes('/entreprises-debouches/')) category = 'entreprises_debouches';
    else if (url.includes('/international/')) category = 'international';
    else if (url.includes('/admissions/')) category = 'admissions';
    else if (url.includes('/lecole/')) category = 'vie_etudiante';

    return {
      question: title,
      answer: content,
      source: url,
      category: category,
      confidence: 0.95
      // lastVerified, createdAt et updatedAt sont gérés automatiquement par Prisma
    };
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return null;
  }
}

async function correctIncorrectUrl() {
  try {
    console.log('🔍 Recherche de l\'URL incorrecte dans le RAG...');
    
    const searchResponse = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'search',
        query: 'alumni',
        limit: 50
      })
    });

    const responseData = await searchResponse.json();
    const results = responseData.results || responseData.data || [];
    
    // Chercher les entrées avec l'ancienne URL incorrecte
    const incorrectEntries = results.filter(r => 
      r.source && r.source.includes('/fr/alumni')
    );

    if (incorrectEntries.length > 0) {
      console.log(`❌ Trouvé ${incorrectEntries.length} entrées avec l'URL incorrecte`);
      
      // Supprimer les anciennes entrées
      for (const entry of incorrectEntries) {
        console.log(`🗑️  Suppression de l'entrée: ${entry.id}`);
        await fetch('http://localhost:3000/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            id: entry.id
          })
        });
      }
      console.log('✅ Anciennes entrées supprimées');
    } else {
      console.log('✅ Aucune URL incorrecte trouvée');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la correction de l\'URL:', error);
  }
}

async function addUrlsToRag() {
  try {
    console.log(`\n📋 Ajout de ${urlsToAdd.length} URLs au RAG...\n`);
    
    let addedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const url of urlsToAdd) {
      // Vérifier si l'URL existe déjà
      const searchResponse = await fetch('http://localhost:3000/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: url,
          limit: 1
        })
      });

      const responseData = await searchResponse.json();
      const results = responseData.results || responseData.data || [];
      const existingEntry = results.find(r => r.source === url);

      if (existingEntry) {
        console.log(`⏭️  URL déjà dans le RAG: ${url}`);
        skippedCount++;
        continue;
      }

      // Scraper le contenu
      const pageData = await scrapePageContent(url);

      if (!pageData) {
        console.error(`❌ Échec du scraping pour: ${url}`);
        failedCount++;
        continue;
      }

      // Ajouter au RAG
      const addResponse = await fetch('http://localhost:3000/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          item: pageData
        })
      });

      const result = await addResponse.json();

      if (result.success) {
        console.log(`✅ Ajouté: ${pageData.question.substring(0, 60)}...`);
        addedCount++;
      } else {
        console.error(`❌ Échec de l'ajout pour: ${url}`);
        console.error(`   Raison: ${result.error || result.message || 'Inconnue'}`);
        console.error(`   Données envoyées:`, JSON.stringify(pageData, null, 2));
        failedCount++;
      }

      // Attendre un peu entre chaque requête pour ne pas surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Résumé:');
    console.log(`✅ Ajoutées: ${addedCount}`);
    console.log(`⏭️  Ignorées (déjà présentes): ${skippedCount}`);
    console.log(`❌ Échecs: ${failedCount}`);
    console.log(`📝 Total: ${urlsToAdd.length}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des URLs:', error);
  }
}

async function main() {
  console.log('🚀 Démarrage de la mise à jour du RAG...\n');

  // Étape 1: Corriger l'URL incorrecte
  await correctIncorrectUrl();

  // Étape 2: Ajouter les nouvelles URLs
  await addUrlsToRag();

  console.log('\n✅ Mise à jour du RAG terminée !');
}

// Exécuter le script
main().catch(console.error);

