/**
 * Script pour mettre à jour le RAG avec les URLs correctes et ajouter de nouvelles pages
 * Usage: node scripts/update-rag-with-urls.js
 */

const cheerio = require('cheerio');

// Liste des URLs à ajouter au RAG (~200 URLs)
const urlsToAdd = [
  "https://www.esilv.fr/en/2025-salary-guide-what-traders-analysts-and-quants-really-earn-in-fintech",
  "https://www.esilv.fr/en/ufaq",
  "https://www.esilv.fr/ingenieur/video",
  "https://www.esilv.fr/ingenieur/alternance",
  "https://www.esilv.fr/team/walter-peretti",
  "https://www.esilv.fr/team/guillaume-guerard",
  "https://www.esilv.fr/entreprises-debouches/projets",
  "https://www.esilv.fr/ingenieur/prepa-integree",
  "https://www.esilv.fr/team/nicolas-lebon",
  "https://www.esilv.fr/recherche/corps-professoral",
  "https://www.esilv.fr/international/programme-erasmus",
  "https://www.esilv.fr/admissions/concours-avenir-prepas",
  "https://www.esilv.fr/en/team/zhiqiang-wang",
  "https://www.esilv.fr/team/quoc-huy-vu",
  "https://www.esilv.fr/eva-semestre-madrid-uem",
  "https://www.esilv.fr/lecole/le-titre-dingenieur",
  "https://www.esilv.fr/formations/cycle-ingenieur/apprentissage",
  "https://www.esilv.fr/team/laetitia-della-maestra",
  "https://www.esilv.fr/comment-devenir-ingenieur-aeronautique",
  "https://www.esilv.fr/cest-dur-une-ecole-dingenieur",
  "https://www.esilv.fr/portfolios/algorithme-de-credit-scoring",
  "https://www.esilv.fr/portfolios/calibration-du-modele-dheston",
  "https://www.esilv.fr/en/international/degree-seeking-students",
  "https://www.esilv.fr/comment-devenir-ingenieur-en-robotique",
  "https://www.esilv.fr/clea-promo-2023-stage-cnrs-japon",
  "https://www.esilv.fr/rentree-2024-lintegration-en-ecole-dingenieurs",
  "https://www.esilv.fr/en/the-school/french-title-engineer",
  "https://www.esilv.fr/en/programmes/msc-aeronautical-aerospatial-engineering",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/creative-technology",
  "https://www.esilv.fr/parcoursup-comment-repondre-aux-propositions-dadmission",
  "https://www.esilv.fr/formations/msc-cyber-resilience-crisis-leadership",
  "https://www.esilv.fr/admissions/rencontrez-nous/journees-portes-ouvertes",
  "https://www.esilv.fr/formations/projets/projet-dimagination-et-dexploration-1",
  "https://www.esilv.fr/en/engineering-and-teamwork-3-fundamental-skills",
  "https://www.esilv.fr/parcours-bi-diplomant-centralesupelec-eleves-ingenieurs-esilv",
  "https://www.esilv.fr/en/portfolios/markowitz-method-for-efficient-portfolio",
  "https://www.esilv.fr/en/programmes/master-degree-engineering/majors/fintech",
  "https://www.esilv.fr/lecole/vie-etudiante/le-campus/campus-montpellier",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/cybersecurite-cloud-computing",
  "https://www.esilv.fr/comment-ameliorer-son-anglais-en-ecole-dingenieurs",
  "https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-convergence-hpc-ia",
  "https://www.esilv.fr/bachelor-ingenierie-numerique-devenir-specialiste-digital-3-ans",
  "https://www.esilv.fr/en/inside-the-biggest-contributions-of-medical-technology",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/energie-et-villes-durable",
  "https://www.esilv.fr/le-forum-des-associations-etudiantes-2024-a-nantes",
  "https://www.esilv.fr/pierick-promo-2025-un-double-diplome-dingenieur-manager",
  "https://www.esilv.fr/lingenieur-systemes-embarques-incontournable-dans-lautomobile-et-laeronautique",
  "https://www.esilv.fr/coup2boost-premier-prix-connected-traffic-lights-business-decision",
  "https://www.esilv.fr/thomas-promo-2022-un-semestre-a-montevideo-uruguay",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/objets-connectes-et-cybersecurite",
  "https://www.esilv.fr/en/how-to-work-in-finance-engineering-degree",
  "https://www.esilv.fr/prix-etudiants-de-la-fondation-sopra-steria-easytalk-finaliste",
  "https://www.esilv.fr/les-majeures-du-cycle-ingenieur-en-quete-de-perfectionnement",
  "https://www.esilv.fr/cspace-2025-trois-fusees-esilv-lancees-par-lequipe-leofly",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/conception-mecanique-et-industrie-durable",
  "https://www.esilv.fr/cest-quoi-un-ingenieur-esilv-definition-competences-et-qualites",
  "https://www.esilv.fr/research-day-a-la-rencontre-des-projets-du-parcours-recherche",
  "https://www.esilv.fr/les-pix-2013-projets-dimagination-et-dexploration-en-prepa-integree",
  "https://www.esilv.fr/louis-promo-2022-rugbyman-professionnel-et-etudiant-en-ecole-dingenieurs",
  "https://www.esilv.fr/titouan-promo-2024-un-semestre-a-luniversity-of-california-los-angeles",
  "https://www.esilv.fr/nicolas-promo-2000-plm-cto-head-of-digital-continuity-chez-capgemini",
  "https://www.esilv.fr/usine-du-futur-la-majeure-industrie-robotique-en-visite-chez-nexans",
  "https://www.esilv.fr/en/energy-efficiency-in-the-food-industry-pascal-clains-research-contribution",
  "https://www.esilv.fr/en/swaminath-venkateswaran-at-the-university-of-vic-uvic-in-catalunya",
  "https://www.esilv.fr/limpression-3d-dans-tous-ses-etats-au-de-vinci-innovation-center",
  "https://www.esilv.fr/applications-big-data-exemples-de-projets-de-fin-detudes-ecole-dingenieurs",
  "https://www.esilv.fr/robafis-2025-les-eleves-ingenieurs-de-lesilv-decrochent-la-4eme-place",
  "https://www.esilv.fr/thales-devient-parrain-des-futures-promotions-du-pole-leonard-de-vinci",
  "https://www.esilv.fr/en/how-do-you-prepare-for-the-french-engineering-school-test",
  "https://www.esilv.fr/bien-preparer-son-concours-dentree-en-ecole-dingenieurs-les-annales-e3a-2015",
  "https://www.esilv.fr/travailler-dans-lit-pour-la-maison-chanel-oui-apres-une-ecole-dingenieurs",
  "https://www.esilv.fr/dg-sur-ecoute-les-specificites-de-lesilv-interview-de-pascal-pinot-directeur",
  "https://www.esilv.fr/marie-promo-2025-un-semestre-international-a-riga-en-echange-a-rtu",
  "https://www.esilv.fr/innovation-des-planches-de-skate-en-fibres-naturelles-pour-reduire-lempreinte-ecologique",
  "https://www.esilv.fr/ines-promo-2025-une-experience-au-sein-dun-projet-de-recherche-europeen",
  "https://www.esilv.fr/la-recherche-sur-le-stockage-dhydrogene-au-service-du-plan-france-relance",
  "https://www.esilv.fr/alex-esilv-promo-2027-triple-champion-du-monde-et-qualifie-pour-paris-2024",
  "https://www.esilv.fr/en/the-hidden-heroes-of-ai-why-data-engineers-are-in-high-demand",
  "https://www.esilv.fr/benjamin-promo-2022-en-alternance-chez-thales-mon-parcours-dans-lindustrie-4-0",
  "https://www.esilv.fr/stage-militaire-grandes-ecoles-de-saint-cyr-accessible-aux-eleves-ingenieurs-de-lesilv",
  "https://www.esilv.fr/celine-et-daniel-promo-2020-deux-anciens-esilv-mobilises-pour-les-girls-in-tech",
  "https://www.esilv.fr/thomas-poinsignon-promo-2017-laureat-du-prix-du-jeune-actuaire-du-prix-scor-2019",
  "https://www.esilv.fr/european-cyber-week-2020-4e-place-pour-lesilv-a-la-finale-du-capture-the-flag",
  "https://www.esilv.fr/partir-a-letranger-en-ecole-dingenieurs-les-explications-du-directeur-des-relations-internationales-de-lesilv",
  "https://www.esilv.fr/adrien-promo-2024-un-stage-au-mit-media-lab-dans-le-groupe-du-professeur-hiroshi-ishii",
  "https://www.esilv.fr/en/esilv-at-the-27th-non-linear-encounter-conference-la-rencontre-du-non-lineaire-in-paris",
  "https://www.esilv.fr/mathilde-promo-2024-une-rentree-decalee-et-un-parcours-restart-post-bac-abouti-en-ecole-dingenieurs",
  "https://www.esilv.fr/no-arbitrage-with-multiple-priors-un-article-publie-par-laurence-carassus-dans-stochastic-processes-and-their-applications",
  "https://www.esilv.fr/en/bloomberg-trading-challenge-2024-esilv-team-ranks-8th-in-europe-2nd-in-france-and-37th-globally",
  "https://www.esilv.fr/ecole-ingenieur/emailing/2014-12-16-jpo",
  "https://www.esilv.fr/ingenieur/double-diplome",
  "https://www.esilv.fr/international/universites-partenaires",
  "https://www.esilv.fr/team/gilles-nocture",
  "https://www.esilv.fr/team/nicolas-travers",
  "https://www.esilv.fr/team/berengere-branchet",
  "https://www.esilv.fr/en/the-school/rankings",
  "https://www.esilv.fr/semestre-lettonie-mathilde-echange-riga",
  "https://www.esilv.fr/en/international/double-degrees-abroad",
  "https://www.esilv.fr/portfolios/dictee-vocale-dequations-mathematiques",
  "https://www.esilv.fr/en/studying-in-sweden-jonkoping-university",
  "https://www.esilv.fr/preparer-concours-e3a-entrer-ecole-dingenieurs",
  "https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-quantique",
  "https://www.esilv.fr/formations/cycle-ingenieur/parcours/parcours-genai",
  "https://www.esilv.fr/en/demonstrating-frances-attractiveness-for-engineering-studies",
  "https://www.esilv.fr/robot-humanoide-evolue-exit-inmoov-welcome-jasper",
  "https://www.esilv.fr/etre-forme-soft-skills-favoriser-avenir-professionnel",
  "https://www.esilv.fr/comment-classer-ses-voeux-scei-math-spe",
  "https://www.esilv.fr/en/4-professional-benefits-to-studying-engineering-abroad",
  "https://www.esilv.fr/robot-open-source-imprime-3d-davincibot-projet-inmoov",
  "https://www.esilv.fr/marwan-promo-2024-un-double-diplome-avec-luniversite-cranfield",
  "https://www.esilv.fr/en/10-little-known-facts-about-the-engineering-world",
  "https://www.esilv.fr/pourquoi-le-bim-va-devenir-incontournable-en-maitrise-doeuvre",
  "https://www.esilv.fr/etudier-angleterre-romane-promo-2020-echange-a-coventry-university",
  "https://www.esilv.fr/johan-promo-2009-ingenieur-conception-mecanique-chez-subsea-7",
  "https://www.esilv.fr/en/the-weirdest-engineering-jobs-you-never-knew-existed",
  "https://www.esilv.fr/batiments-resilients-une-equipe-esilv-remporte-le-hackathon-onepoint",
  "https://www.esilv.fr/showroom-projets-p2ip-les-projets-dinnovation-a-impact-positif-2024",
  "https://www.esilv.fr/hackathon-hussar-academy-une-immersion-dans-la-cybersecurite-au-campus-cyber",
  "https://www.esilv.fr/en/throwback-the-5-engineering-breakthroughs-that-changed-the-21st-century",
  "https://www.esilv.fr/construire-un-aero-rouleur-les-projets-pix1-de-la-promo-2029",
  "https://www.esilv.fr/en/from-student-to-fintech-innovator-career-paths-in-financial-technology",
  "https://www.esilv.fr/etudier-au-mexique-thierno-un-semestre-au-tec-de-monterrey",
  "https://www.esilv.fr/double-diplome-ingenieur-manager-esilvemlv-en-premiere-annee-post-bac",
  "https://www.esilv.fr/planete-grandes-ecoles-le-parcours-dedouard-hausseguy-promo-2013-de-lesilv",
  "https://www.esilv.fr/devinci-connexion-une-soiree-a-londres-avec-les-alumni-de-lesilv",
  "https://www.esilv.fr/nathan-promo-2024-un-parcours-en-majeure-sante-biotech-pour-devenir-ingenieur-medical",
  "https://www.esilv.fr/jumeaux-numeriques-la-revolution-de-lindustrie-4-0-enseignee-aux-etudiants-de-lesilv",
  "https://www.esilv.fr/startup-challenge-2024-gabriel-promo-2022-et-co-fondateur-dastora-remporte-la-finale",
  "https://www.esilv.fr/bien-preparer-le-concours-avenir-2015-avec-lapplication-mobile-disponible-sur-iphone-et-android",
  "https://www.esilv.fr/challenges-citoyens-2017-prix-de-linnovation-numerique-coup-de-coeur-membres-cgi-equipes-esilv",
  "https://www.esilv.fr/julie-promo-2023-un-stage-au-canada-dans-le-domaine-des-biotechnologies-et-du-sport",
  "https://www.esilv.fr/devinci-student-life-55-assos-pour-profiter-au-mieux-de-sa-vie-etudiante-en-ecole-dingenieurs",
  "https://www.esilv.fr/hackathon-autour-du-robot-nao-36h-pour-imaginer-et-prototyper-le-futur-de-la-robotique-humanoide",
  "https://www.esilv.fr/lecole/reseaux",
  "https://www.esilv.fr/welcome-prepas",
  "https://www.esilv.fr/team/raafat-talhouk",
  "https://www.esilv.fr/admissions/candidats-etrangers",
  "https://www.esilv.fr/admissions/concours-avenir",
  "https://www.esilv.fr/smart-grid-energies-renouvelables",
  "https://www.esilv.fr/classement-change-now-ecoles-engagees",
  "https://www.esilv.fr/en/programmes/master-degree-engineering",
  "https://www.esilv.fr/bim-manager-nouveau-metier-batiment",
  "https://www.esilv.fr/en/uc-riverside-studying-californian-sun",
  "https://www.esilv.fr/portfolios/hydroelec-lhydrolienne-pour-canalisations-deau",
  "https://www.esilv.fr/en/how-to-boost-your-creativity-engineer",
  "https://www.esilv.fr/en/programmes/msc-cyber-resilience-crisis-leadership",
  "https://www.esilv.fr/en/cybersecurity-how-to-choose-the-safest-password-possible",
  "https://www.esilv.fr/un-nouveau-souffle-pour-le-pole-universitaire-leonard-de-vinci",
  "https://www.esilv.fr/rentree-decalee-en-ecole-dingenieurs-grace-a-restart-post-bac",
  "https://www.esilv.fr/rentree-hybride-2020-2021-a-lesilv-respect-des-mesures-sanitaires",
  "https://www.esilv.fr/parcoursup-post-bac-dates-cles-voeux-inscriptions-et-choix-finaux",
  "https://www.esilv.fr/trouver-son-stage-ingenieur-les-conseils-de-yann-esilv-promo-2021",
  "https://www.esilv.fr/en/aeronautics-and-aerospace-leo-flys-student-projects-for-2020-2021",
  "https://www.esilv.fr/en/naila-hfaiedh-professor-researcher-at-esilv-presented-a-paper-during-the-icf15",
  "https://www.esilv.fr/drone-concu-a-lesilv-remporte-prix-project-of-the-year-2016-concours-3ds-academy",
  "https://www.esilv.fr/pour-etudier-en-coree-du-sud-deux-nouveaux-accords-avec-soongsil-university-et-seoul-tech",
  "https://www.esilv.fr/coup2boost-pour-e-nero-projet-esilv-finaliste-2019-une-douche-intelligente-et-connectee",
  "https://www.esilv.fr/ophelie-promo-2025-se-reorienter-et-integrer-lesilv-a-travers-le-parcours-restart-postbac",
  "https://www.esilv.fr/lecole/vae",
  "https://www.esilv.fr/ingenieur/universites-partenaires",
  "https://www.esilv.fr/international/welcome-desk",
  "https://www.esilv.fr/team/mehdi-achemaoui",
  "https://www.esilv.fr/formations/bachelor-technologie-management",
  "https://www.esilv.fr/entreprises-debouches/filieres-en-alternance",
  "https://www.esilv.fr/portfolios/pi%C2%B25-concours-les-olympiades-fanuc",
  "https://www.esilv.fr/en/student-life/international-student-guide",
  "https://www.esilv.fr/je-veux-etre-ingenieur-mais-en-quoi",
  "https://www.esilv.fr/devenir-ingenieur-sans-passer-par-la-prepa",
  "https://www.esilv.fr/en/student-life/campus/campus-paris-la-defense",
  "https://www.esilv.fr/purple-pill-challenge-davincicode-remporte-la-premiere-place",
  "https://www.esilv.fr/apprendre-de-leonard-ou-la-soif-de-connaissances",
  "https://www.esilv.fr/en/meet-our-partners-newcastle-university-best-australian-universities",
  "https://www.esilv.fr/en/programmes/master-degree-engineering/majors/it-iot-security",
  "https://www.esilv.fr/un-nouveau-mooc-trading-quantitatif-pour-mieux-comprendre-les-marches-financiers",
  "https://www.esilv.fr/passion-aeronautique-7-projets-ingenieurs-proposes-par-leofly-en-2021",
  "https://www.esilv.fr/quelles-specialites-choisir-au-lycee-pour-integrer-une-ecole-dingenieurs",
  "https://www.esilv.fr/en/how-engineering-education-works-in-france-understanding-your-diploma",
  "https://www.esilv.fr/cybersecurite-gestion-des-risques-3-projets-de-4e-annee-de-la-promo-2022",
  "https://www.esilv.fr/le-defi-de-lucas-promo-2022-nager-380-km-pour-denoncer-la-pollution-des-megots",
  "https://www.esilv.fr/gwendoline-promo-2024-prix-de-la-meilleure-vulgarisation-de-la-semaine-orientation-science-et-culture",
  "https://www.esilv.fr/devinci-alumni-awards-2025-chantal-dioh-remporte-le-prix-alumni-de-lannee-esilv",
  "https://www.esilv.fr/a-celebration-of-achievement-esilvs-2024-graduates-honoured-at-paris-la-defense-arena",
  "https://www.esilv.fr/en/french-engineering-school-ranking-by-lusine-nouvelle-2018-esilv-in-the-top-10",
  "https://www.esilv.fr/ethglobal-paris-2023-victoire-pour-les-eleves-ingenieurs-esilv-et-le-projet-cypher-deposit",
  "https://www.esilv.fr/en/programmes",
  "https://www.esilv.fr/team/pascal-clain",
  "https://www.esilv.fr/team/xiao-xiao",
  "https://www.esilv.fr/en/student-life/campus",
  "https://www.esilv.fr/lecole/vie-etudiante/sport",
  "https://www.esilv.fr/innoprix-medef-2016-transversalite-entrepreneuriat",
  "https://www.esilv.fr/ecole-ingenieurs/cursus/page/16",
  "https://www.esilv.fr/portfolios/li-li-application-pour-dyslexiques",
  "https://www.esilv.fr/en/how-can-engineers-overcome-presentation-anxiety",
  "https://www.esilv.fr/pierre-courbin-nomme-responsable-de-la-majeure-nouvelles-energies",
  "https://www.esilv.fr/nicolas-promo-2021-un-semestre-en-roumanie-pendant-le-confinement",
  "https://www.esilv.fr/en/programmes/master-degree-engineering/majors/eco-design-and-sustainable-innovation",
  "https://www.esilv.fr/se-specialiser-en-ecole-dingenieurs-les-doubles-diplomes-proposes-par-lesilv",
  "https://www.esilv.fr/la-fresque-du-climat-les-etudiants-de-lesilv-sensibilises-au-changement-climatique",
  "https://www.esilv.fr/monaco-energy-boat-challenge-2025-lesilv-et-hydrovinci-engages-pour-une-propulsion-maritime-durable",
  "https://www.esilv.fr/robots-serie-parallele-un-papier-de-recherche-esilv-presente-a-boston-pour-lasme-idetc-2023",
  "https://www.esilv.fr/hiba-promo-2020-de-la-data-science-a-la-robotic-process-automation-comment-lia-transforme-lautomatisation",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/data-et-intelligence-artificielle",
  "https://www.esilv.fr/formations/cycle-ingenieur/majeures/ingenierie-financiere"
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

async function addUrlsToRag(options = {}) {
  const { skipExisting = true, dryRun = false } = options;
  
  try {
    console.log(`\n📋 ${dryRun ? 'Test (DRY RUN) - ' : ''}Ajout de ${urlsToAdd.length} URLs au RAG...\n`);
    
    let addedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const totalUrls = urlsToAdd.length;

    for (let i = 0; i < urlsToAdd.length; i++) {
      const url = urlsToAdd[i];
      const progress = Math.round(((i + 1) / totalUrls) * 100);
      
      console.log(`\n[${progress}%] (${i + 1}/${totalUrls}) Processing: ${url.substring(0, 80)}...`);

      // Vérifier si l'URL existe déjà
      if (skipExisting) {
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
          console.log(`⏭️  URL déjà dans le RAG - SKIP`);
          skippedCount++;
          continue;
        }
      }

      // Scraper le contenu
      const pageData = await scrapePageContent(url);

      if (!pageData) {
        console.error(`❌ Échec du scraping - FAILED`);
        failedCount++;
        continue;
      }

      if (dryRun) {
        console.log(`✅ [DRY RUN] Serait ajouté: ${pageData.question.substring(0, 60)}...`);
        console.log(`   Catégorie: ${pageData.category}, Confiance: ${pageData.confidence}`);
        addedCount++;
      } else {
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
          console.error(`❌ Échec de l'ajout`);
          console.error(`   Raison: ${result.error || result.message || 'Inconnue'}`);
          failedCount++;
        }
      }

      // Attendre un peu entre chaque requête pour ne pas surcharger le serveur
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Résumé:');
    console.log(`✅ ${dryRun ? 'Seraient ajoutées' : 'Ajoutées'}: ${addedCount}`);
    console.log(`⏭️  Ignorées (déjà présentes): ${skippedCount}`);
    console.log(`❌ Échecs: ${failedCount}`);
    console.log(`📝 Total: ${totalUrls}`);
    
    return { addedCount, skippedCount, failedCount, totalUrls };
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des URLs:', error);
    return null;
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipExisting = !args.includes('--no-skip-existing');
  
  console.log('🚀 Démarrage de la mise à jour du RAG...\n');
  
  if (dryRun) {
    console.log('⚠️  MODE DRY RUN - Aucune modification ne sera effectuée\n');
  }
  
  if (skipExisting) {
    console.log('📌 Skip existing URLs: ENABLED\n');
  } else {
    console.log('📌 Skip existing URLs: DISABLED (all URLs will be processed)\n');
  }

  // Étape 1: Corriger l'URL incorrecte (sauf en dry-run)
  if (!dryRun) {
    await correctIncorrectUrl();
  }

  // Étape 2: Ajouter les nouvelles URLs
  const result = await addUrlsToRag({ skipExisting, dryRun });

  if (result && !dryRun) {
    // Générer un rapport JSON
    const report = {
      timestamp: new Date().toISOString(),
      totalUrls: result.totalUrls,
      added: result.addedCount,
      skipped: result.skippedCount,
      failed: result.failedCount,
      successRate: Math.round((result.addedCount / result.totalUrls) * 100) + '%'
    };
    
    console.log('\n📄 Rapport JSON:');
    console.log(JSON.stringify(report, null, 2));
  }

  console.log('\n✅ Mise à jour du RAG terminée !');
}

// Exécuter le script
main().catch(console.error);

