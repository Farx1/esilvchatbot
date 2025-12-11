/**
 * Script pour ingérer le dossier complet ESILV (VERSION COMPLÈTE)
 * Basé sur les informations officielles ESILV
 * Usage: node scripts/seed-esilv-complete-v2.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Données ESILV complètes structurées en Q/R
const esilvCompleteData = [
  // IDENTITÉ ET POSITIONNEMENT
  {
    question: "Qu'est-ce que l'ESILV ?",
    answer: "L'ESILV (École Supérieure d'Ingénieurs Léonard-de-Vinci) est une école d'ingénieurs généraliste post-bac, centrée sur les technologies numériques et l'ingénierie des systèmes complexes. Elle fait partie du Pôle Léonard de Vinci, qui regroupe également l'EMLV (école de management) et l'IIM (école du digital / création numérique). L'école est accréditée par la CTI pour délivrer le diplôme d'ingénieur (grade de master) et membre de la Conférence des Grandes Écoles.",
    category: "identity",
    confidence: 0.95
  },
  {
    question: "Quels diplômes délivre l'ESILV ?",
    answer: "L'ESILV délivre plusieurs types de diplômes : 1) Cursus ingénieur en 5 ans (prépa intégrée + cycle ingénieur), 2) Bachelors (Bac+3) en numérique et en Tech & Management, 3) MS/MSc spécialisés (niveau Bac+5) dans la data, la cybersécurité, la modélisation numérique.",
    category: "programs",
    confidence: 0.95
  },
  {
    question: "Qu'est-ce que le Pôle Léonard de Vinci ?",
    answer: "Le Pôle Léonard de Vinci est un ensemble d'établissements d'enseignement supérieur situé à Paris-La Défense, avec des campus également à Nantes et Montpellier. Il regroupe : ESILV (école d'ingénieurs généraliste numérique), EMLV (école de commerce et de management), et IIM Digital School (école des métiers du digital, du jeu vidéo, du design, de l'animation, du web). Le campus est partagé avec une vie étudiante commune et de nombreuses associations et projets transverses.",
    category: "identity",
    confidence: 0.95
  },
  
  // CAMPUS
  {
    question: "Quels sont les campus de l'ESILV ?",
    answer: "L'ESILV dispose de trois campus : 1) Campus Paris – La Défense (campus historique) : au cœur du quartier d'affaires, avec amphithéâtres, labs (numérique, mécanique, data, cybersécurité), fablabs et espaces de coworking. 2) Campus Nantes : pôle technologique de la Chantrerie, avec cursus ingénieur en alternance (IA, industrie, développement durable), en partenariat avec l'ITII Pays de la Loire. 3) Campus Montpellier : quartier Euromédecine, orienté santé, biotech, MedTech, avec déploiement progressif du cursus ingénieur.",
    category: "campus",
    confidence: 0.95
  },
  
  // CURSUS INGÉNIEUR - STRUCTURE
  {
    question: "Comment est organisé le cursus ingénieur ESILV ?",
    answer: "Le cursus ingénieur ESILV est structuré en 5 ans : Prépa intégrée (2 ans) + Cycle ingénieur (3 ans avec 3A, 4A, 5A). Globalement : 5 ans d'études après le bac (grade de master), tronc commun + majeure de spécialisation, environ 13 mois de stages en entreprises sur l'ensemble du cursus.",
    category: "programs",
    confidence: 0.95
  },
  {
    question: "Qu'est-ce que la prépa intégrée à l'ESILV ?",
    answer: "La prépa intégrée (années 1 et 2) vise à installer un socle scientifique solide (mathématiques, physique, informatique, sciences de l'ingénieur), développer les compétences numériques (programmation Python, C/C++, développement logiciel), et travailler les soft skills (communication, travail en équipe, gestion de projet). Elle inclut les projets PIX1 (1ère année) et PIX2 (2ème année) et un premier stage court de découverte.",
    category: "programs",
    confidence: 0.95
  },
  {
    question: "Qu'est-ce que le cycle ingénieur ESILV ?",
    answer: "Le cycle ingénieur (années 3, 4, 5) suit la structure : Année 3 (tronc commun) : consolidation des bases en mathématiques appliquées, informatique, management. Année 4 (début de la majeure) : spécialisation, projets d'innovation PI²4, cours entièrement en anglais. Année 5 (approfondissement) : approfondissement technique, projet PI²5, stage de fin d'études (5-6 mois).",
    category: "programs",
    confidence: 0.95
  },
  
  // MAJEURES - LISTE COMPLÈTE
  {
    question: "Quelles sont toutes les majeures proposées à l'ESILV ?",
    answer: "L'ESILV propose 15 majeures en cycle ingénieur (14 possibles en alternance) : 1. Objets connectés & cybersécurité, 2. Data et intelligence artificielle, 3. Ingénierie financière, 4. Cloud computing & cybersécurité, 5. Actuariat, 6. Fintech, 7. Modélisation et mécanique numérique, 8. Industrie et robotique, 9. Creative Technology, 10. Énergie et villes durables, 11. MedTech & Santé, 12. Ingénierie logicielle & IA, 13. Conception mécanique et Industrie durable, 14. Éco-innovation, 15. Aérospatial et Défense.",
    category: "programs",
    confidence: 0.98
  },
  
  // MAJEURES - DÉTAILS
  {
    question: "Qu'est-ce que la majeure Data et intelligence artificielle ?",
    answer: "La majeure Data et intelligence artificielle couvre : collecte, stockage et traitement de données massives, machine learning, deep learning, data engineering, mise en production de modèles (MLOps) et cas d'usage IA (industrie, finance, marketing). Elle forme des data scientists, data engineers et machine learning engineers.",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure Objets connectés & cybersécurité ?",
    answer: "La majeure Objets connectés & cybersécurité traite de la conception de systèmes et objets connectés (IoT), la sécurisation des systèmes embarqués, communications, réseaux, et l'intégration des objets dans les architectures d'entreprise.",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure Ingénierie financière ?",
    answer: "La majeure Ingénierie financière couvre la finance de marché, produits dérivés, gestion des risques, modélisation stochastique, pricing, simulations Monte Carlo, et l'informatique financière (C++, Python, outils quantitatifs).",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure Cloud computing & cybersécurité ?",
    answer: "La majeure Cloud computing & cybersécurité traite des architectures cloud (IaaS, PaaS, SaaS), sécurité des systèmes d'information, audit, conformité, DevOps, CI/CD, automatisation, et durcissement des infrastructures.",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure MedTech & Santé ?",
    answer: "La majeure MedTech & Santé couvre les technologies pour la santé : capteurs, biomédical, imagerie, IA et machine learning appliqués à la santé (diagnostic, prédiction), normes et réglementation en santé, systèmes d'information hospitaliers.",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure Ingénierie logicielle & IA ?",
    answer: "La majeure Ingénierie logicielle & IA couvre la conception et développement d'applications logicielles complexes, qualité logicielle, tests, architecture logicielle, et intégration de briques IA dans les produits logiciels (recommandation, NLP, vision).",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure Énergie et villes durables ?",
    answer: "La majeure Énergie et villes durables traite des bâtiments intelligents, réseaux énergétiques, smart grids, efficacité énergétique, énergies renouvelables, et planification énergétique et urbanisme durable.",
    category: "programs",
    confidence: 0.9
  },
  {
    question: "Qu'est-ce que la majeure Aérospatial et Défense ?",
    answer: "La majeure Aérospatial et Défense couvre les technologies spatiales, systèmes de défense, sécurité, modélisation et pilotage de systèmes complexes (satellites, drones, systèmes de surveillance), et enjeux stratégiques de souveraineté technologique.",
    category: "programs",
    confidence: 0.9
  },
  
  // PARCOURS TRANSVERSES
  {
    question: "Quels sont les parcours transverses à l'ESILV ?",
    answer: "L'ESILV propose des parcours complémentaires qui se superposent à la majeure : Parcours Start-Up (entrepreneuriat, business plan), Parcours Recherche (préparation au doctorat), Parcours UX Design (expérience utilisateur, ergonomie), Parcours Ingénieurs d'affaires (dimension commerciale), Parcours GenAI (IA générative, LLM), Parcours Souveraineté numérique et Défense (cybersécurité, systèmes souverains).",
    category: "programs",
    confidence: 0.9
  },
  
  // BACHELORS
  {
    question: "Quels bachelors propose l'ESILV ?",
    answer: "L'ESILV propose plusieurs bachelors (Bac+3) : 1) Bachelor Informatique & Cybersécurité (grade de licence) : parcours généraliste en numérique avec spécialisation cybersécurité (développement logiciel, réseaux, systèmes, sécurité, audits). 2) Bachelor Technologie & Management (avec l'EMLV) : programme hybride avec compétences numériques et managériales, orientation vers chef de projet digital, business developer tech.",
    category: "programs",
    confidence: 0.9
  },
  
  // MSc/MS
  {
    question: "Quels MSc/MS propose l'ESILV ?",
    answer: "L'ESILV propose plusieurs programmes MSc/MS (post-bac+3) : MSc Computer Science & Data Science (former des spécialistes data en 2 ans), MSc Cyber Resilience & Crisis Leadership (experts en résilience cyber, gestion de crise), MS Modélisation Numérique & Industrie (programme labellisé CGE, simulation numérique et industrie).",
    category: "programs",
    confidence: 0.9
  },
  
  // ALTERNANCE
  {
    question: "Comment fonctionne l'alternance à l'ESILV ?",
    answer: "L'ESILV propose un large dispositif d'alternance au niveau ingénieur : contrats d'apprentissage de 2 ou 3 ans sur le cycle ingénieur, rythme classique 3 semaines à l'école / 2 semaines en entreprise, campus Paris & Nantes. Dispositifs : FISA (Formation d'Ingénieur sous Statut Apprenti) avec 3 ans d'apprentissage, 11 majeures accessibles dont plusieurs à Nantes, et FISEA (statut étudiant puis apprenti). Sur le campus de Nantes, l'alternance est déployée en partenariat avec l'ITII Pays de la Loire.",
    category: "admissions",
    confidence: 0.95
  },
  
  // INTERNATIONAL
  {
    question: "Quelles sont les possibilités d'international à l'ESILV ?",
    answer: "L'ESILV offre plusieurs dispositifs internationaux : mobilités académiques (possibilité de partir en échange dès la 3e année dans plus de 100 universités partenaires), 4e année entièrement en anglais (cours de 4A en anglais), stages à l'étranger (possibilité de faire les stages de 4A ou 5A à l'étranger), programme Erasmus+ (accords avec diverses universités européennes). Environ 20% des diplômés débutent leur carrière à l'étranger.",
    category: "international",
    confidence: 0.95
  },
  
  // DOUBLES DIPLÔMES
  {
    question: "Quels doubles diplômes propose l'ESILV ?",
    answer: "L'ESILV propose plusieurs doubles diplômes : 1) Double diplôme Ingénieur–Manager (ESILV–EMLV) : parcours en 5 ans permettant d'obtenir le diplôme d'ingénieur ESILV et le diplôme de l'EMLV. 2) Doubles diplômes avec d'autres écoles : CentraleSupélec (spécialisations Automatique, Data Sciences, Énergie, etc.), CNAM, Strate École de Design. 3) Doubles diplômes internationaux via les universités partenaires (Data Science, actuariat, transformation digitale).",
    category: "programs",
    confidence: 0.9
  },
  
  // VIE ÉTUDIANTE
  {
    question: "Comment se déroule la vie étudiante à l'ESILV ?",
    answer: "La vie étudiante au Pôle Léonard de Vinci est très développée avec de nombreuses associations : BDE (Bureau des Élèves), associations techniques (robotique, data/IA, cybersécurité, finance), Junior-Entreprise (missions de conseil), associations sportives (compétitions, sports co et individuels), associations culturelles et solidaires (humanitaire, environnement, art). Installations : espaces de coworking, salles de projet, fablabs, équipements sportifs, services d'accompagnement (Relations Entreprises, International, santé, handicap).",
    category: "student_life",
    confidence: 0.9
  },
  
  // STAGES
  {
    question: "Combien de stages sont prévus dans le cursus ingénieur ESILV ?",
    answer: "Sur l'ensemble du cursus ingénieur ESILV, environ 13 mois sont consacrés aux stages en entreprise. Typiquement : premier stage (après la prépa ou début cycle ingénieur) : découverte / assistant ingénieur. Stage de 4A : mission plus technique ou orientée projet. Stage de 5A (fin d'études) : mission d'ingénieur à part entière (5-6 mois), souvent sur des sujets stratégiques.",
    category: "careers",
    confidence: 0.95
  },
  
  // INSERTION PROFESSIONNELLE
  {
    question: "Quelle est l'insertion professionnelle des diplômés ESILV ?",
    answer: "Les indicateurs d'insertion sont excellents (promo 2024) : salaire annuel moyen ~47 700€ (France + primes), fourchette ~33 000€ à 140 300€. 20% des diplômés commencent à l'étranger (salaire plus élevé). 85% des contrats sont des CDI, 97% obtiennent le statut cadre. 52% des embauches issues du stage de fin d'études, 70% signent avant la diplomation, 93% trouvent un emploi en moins de 4 mois. Types de postes : Data Scientist, Data Engineer, Ingénieur cybersécurité, Ingénieur efficacité énergétique, Actuaire, Ingénieur mécanique, DevOps, Project Management Officer, consultants IT/tech.",
    category: "careers",
    confidence: 0.95
  },
  
  // ADMISSIONS
  {
    question: "Comment postuler à l'ESILV après le bac ?",
    answer: "Pour l'admission post-bac (prépa intégrée), le recrutement se fait principalement via Concours Avenir Bac (sur Parcoursup), pour les élèves de Terminale Générale et certains profils technologiques. Procédure : inscription sur Parcoursup, dossier + épreuves spécifiques (écrit/oral selon les années). L'affectation campus Paris / Nantes / Montpellier dépend des vœux et des capacités d'accueil.",
    category: "admissions",
    confidence: 0.95
  },
  {
    question: "Comment intégrer l'ESILV en admission parallèle ?",
    answer: "Pour les admissions parallèles (cycle ingénieur), il existe : Concours Avenir Prépas (pour étudiants de classes préparatoires scientifiques), et Concours Avenir Plus (pour admissions sur titre après Bac+2/Bac+3 : BUT, licences scientifiques, bachelors, autres écoles). Procédure : dossier + éventuel entretien de motivation.",
    category: "admissions",
    confidence: 0.95
  },
  {
    question: "Comment intégrer l'ESILV en alternance ?",
    answer: "Pour intégrer l'ESILV en alternance, il existe des procédures dédiées (FISA/FISEA). Rythme : 3 semaines école / 2 semaines entreprise. Campus disponibles : Paris et Nantes. Le service Relations Entreprises accompagne pour trouver une entreprise d'accueil.",
    category: "admissions",
    confidence: 0.95
  },
  
  // ÉVÉNEMENTS ET DÉCOUVERTE
  {
    question: "Comment découvrir l'ESILV avant de postuler ?",
    answer: "L'ESILV organise régulièrement : Journées Portes Ouvertes (JPO) sur chaque campus, journées d'immersion Inside ESILV (Paris, Nantes), webinaires, rendez-vous personnalisés avec les équipes admissions, événements comme la De Vinci International Week, forums alternance, showroom projets. Contact : téléphone ESILV (Paris) +33 (0)1 81 00 28 38, mail admissions@esilv.fr.",
    category: "admissions",
    confidence: 0.9
  }
]

async function seedKnowledgeBaseV2() {
  try {
    console.log('🔄 Début de l\'ingestion des données ESILV COMPLÈTES V2...\n')

    // Vider la base existante pour éviter les doublons
    console.log('🗑️  Suppression des données existantes...')
    await prisma.knowledgeBase.deleteMany({})
    console.log('✅ Base nettoyée\n')

    // Compter les entrées à ajouter
    console.log(`📝 ${esilvCompleteData.length} entrées préparées`)

    // Insérer toutes les entrées
    let inserted = 0
    for (const entry of esilvCompleteData) {
      try {
        await prisma.knowledgeBase.create({
          data: entry
        })
        inserted++
      } catch (error) {
        console.error(`Erreur lors de l'insertion: ${error.message}`)
      }
    }

    const finalCount = await prisma.knowledgeBase.count()
    
    console.log('\n✅ Ingestion terminée !')
    console.log(`📊 Statistiques :`)
    console.log(`   - Entrées ajoutées : ${inserted}`)
    console.log(`   - Total dans la base : ${finalCount}`)

    // Afficher les statistiques par catégorie
    const stats = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })

    console.log('\n📈 Répartition par catégorie :')
    for (const stat of stats) {
      console.log(`   - ${stat.category}: ${stat._count.id} entrées`)
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'ingestion :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
if (require.main === module) {
  seedKnowledgeBaseV2()
    .then(() => {
      console.log('\n🎉 Script terminé avec succès !')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Erreur fatale :', error)
      process.exit(1)
    })
}

module.exports = { seedKnowledgeBaseV2 }

