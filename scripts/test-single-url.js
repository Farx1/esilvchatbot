/**
 * Script de test pour une seule URL
 */

const cheerio = require('cheerio');
const { adminHeaders } = require('./admin-session');

const testUrl = "https://www.esilv.fr/entreprises-debouches/reseau-des-anciens/";

async function scrapeAndAdd() {
  try {
    console.log(`📥 Scraping: ${testUrl}`);
    const response = await fetch(testUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; ESILVBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraire le titre
    let title = $('h1').first().text().trim() || $('title').text().trim() || 'Réseau des anciens ESILV';
    console.log(`📌 Titre: ${title}`);

    // Extraire le contenu
    let content = '';
    $('p, h2, h3, li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 30 && text.length < 500) {
        content += text + ' ';
      }
    });

    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1500);

    console.log(`📄 Contenu extrait (${content.length} caractères):`);
    console.log(content.substring(0, 200) + '...');

    const pageData = {
      question: title,
      answer: content,
      source: testUrl,
      category: 'entreprises_debouches',
      confidence: 0.95,
      // Ne pas envoyer createdAt/updatedAt, Prisma les gère
      // lastVerified sera défini à now() par défaut dans le schema
    };

    console.log(`\n📤 Envoi au RAG...`);
    const addResponse = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: await adminHeaders(),
      body: JSON.stringify({
        action: 'create',
        item: pageData
      })
    });

    const result = await addResponse.json();
    console.log(`\n📊 Résultat de l'API:`, JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`✅ Succès !`);
    } else {
      console.error(`❌ Échec:`, result.error || result.message);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

scrapeAndAdd();

