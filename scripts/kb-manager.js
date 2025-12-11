#!/usr/bin/env node

/**
 * ESILV Knowledge Base Management Script
 * Permet de gérer la base de connaissances RAG
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHeader() {
  colorLog('cyan', '\n🧠 ESILV Knowledge Base Management');
  colorLog('cyan', '='.repeat(40));
}

async function checkKnowledgeBase() {
  try {
    const response = await fetch('http://localhost:3000/api/knowledge');
    const data = await response.json();
    
    if (data.success) {
      colorLog('green', `✅ Knowledge base contains ${data.count} entries`);
      
      if (data.count > 0) {
        colorLog('blue', '\n📊 Knowledge Base Statistics:');
        
        // Get detailed stats
        const searchResponse = await fetch('http://localhost:3000/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search', query: '' })
        });
        const searchData = await searchResponse.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const categories = {};
          searchData.results.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + 1;
          });
          
          Object.entries(categories).forEach(([category, count]) => {
            colorLog('cyan', `   ${category}: ${count} entries`);
          });
        }
      }
    } else {
      colorLog('red', '❌ Error checking knowledge base');
    }
  } catch (error) {
    colorLog('red', `❌ Error: ${error.message}`);
    return false;
  }
  return true;
}

async function seedKnowledgeBase() {
  try {
    colorLog('yellow', '🔄 Seeding knowledge base...');
    
    const response = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      colorLog('green', `✅ ${data.message}`);
    } else {
      colorLog('red', `❌ Error: ${data.error}`);
    }
  } catch (error) {
    colorLog('red', `❌ Error: ${error.message}`);
  }
}

async function searchKnowledgeBase(query) {
  try {
    colorLog('blue', `🔍 Searching for: "${query}"`);
    
    const response = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', query })
    });
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      colorLog('green', `✅ Found ${data.results.length} results:`);
      data.results.forEach((result, index) => {
        colorLog('cyan', `\n${index + 1}. ${result.question}`);
        colorLog('blue', `   Category: ${result.category} (Confidence: ${result.confidence})`);
        colorLog('yellow', `   Answer: ${result.answer.substring(0, 150)}...`);
      });
    } else {
      colorLog('yellow', '📝 No results found');
    }
  } catch (error) {
    colorLog('red', `❌ Error: ${error.message}`);
  }
}

function showMenu() {
  colorLog('bright', '\n📋 Available Commands:');
  colorLog('cyan', '1. check      - Check knowledge base status');
  colorLog('cyan', '2. seed       - Seed/Reset knowledge base');
  colorLog('cyan', '3. search     - Search knowledge base');
  colorLog('cyan', '4. stats      - Show detailed statistics');
  colorLog('cyan', '5. help       - Show this help');
}

function showStats() {
  colorLog('bright', '\n📈 Knowledge Base Details:');
  colorLog('blue', '• Total entries: 50+');
  colorLog('blue', '• Categories: programs, admissions, careers, campus, student_life,');
  colorLog('blue', '               international, companies, specializations, internships,');
  colorLog('blue', '               research, practical, skills, technology, contact,');
  colorLog('blue', '               accreditation');
  colorLog('blue', '• Languages: French');
  colorLog('blue', '• Confidence: 0.8-0.95');
  colorLog('blue', '• Coverage: Complete ESILV information');
}

async function main() {
  const command = process.argv[2];
  
  showHeader();
  
  switch (command) {
    case 'check':
      await checkKnowledgeBase();
      break;
      
    case 'seed':
      await seedKnowledgeBase();
      break;
      
    case 'search':
      const query = process.argv[3];
      if (!query) {
        colorLog('red', '❌ Please provide a search query');
        colorLog('yellow', 'Usage: node kb-manager.js search "your query"');
        return;
      }
      await searchKnowledgeBase(query);
      break;
      
    case 'stats':
      showStats();
      await checkKnowledgeBase();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showMenu();
      break;
      
    default:
      colorLog('red', '❌ Unknown command');
      showMenu();
      colorLog('yellow', '\n💡 Usage: node kb-manager.js [command]');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };