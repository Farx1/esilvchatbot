/**
 * Script pour tester l'upload du PDF plaquette-alpha-web.pdf
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function uploadPDF() {
  const pdfPath = path.join(__dirname, 'public', 'plaquette-alpha-web.pdf');
  
  console.log('🔍 Vérification du fichier...');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Fichier introuvable: ${pdfPath}`);
    return;
  }
  
  const stats = fs.statSync(pdfPath);
  console.log(`📄 Fichier trouvé: ${path.basename(pdfPath)}`);
  console.log(`📊 Taille: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  if (stats.size > 50 * 1024 * 1024) {
    console.error(`❌ Fichier trop volumineux (> 50MB)`);
    return;
  }
  
  console.log('\n📤 Début de l\'upload...\n');
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(pdfPath));
  
  try {
    const response = await fetch('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log(`📥 Réponse reçue: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`📋 Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Réponse non-JSON:');
      console.error(text.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('\n✅ Upload réussi !');
      console.log(`📦 Chunks créés: ${data.chunksCreated || data.chunks}`);
      console.log(`📝 Caractères totaux: ${data.totalCharacters}`);
      console.log(`💾 Fichier: ${data.filename}`);
    } else {
      console.error('\n❌ Upload échoué:');
      console.error(`   Erreur: ${data.error}`);
      console.error(`   Message: ${data.message || 'N/A'}`);
      if (data.details) {
        console.error(`   Détails: ${data.details}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'upload:');
    console.error(error.message);
    console.error(error.stack);
  }
}

console.log('🚀 Test d\'upload de plaquette-alpha-web.pdf\n');
uploadPDF().catch(console.error);

