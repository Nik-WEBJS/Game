export const en = {
  // General
  lang: 'EN',
  langFull: 'English',
  businessTycoon: 'Business Tycoon',
  week: 'Week',
  xp: 'XP',

  // Setup Screen
  setupSubtitle: 'Build your empire. Make strategic decisions. Dominate the market.',
  startingCapital: 'Starting Capital',
  chooseNiche: '1. Choose Your Niche',
  chooseProduct: '2. Choose Your Product',
  chooseMonetization: '3. Monetization Strategy',
  chooseTech: '4. Adopt Technologies',
  optional: 'optional',
  launchBusiness: 'Launch Business',
  selectToBegin: 'Select a niche, product, and monetization strategy to begin.',
  demand: 'Demand',
  complexity: 'Complexity',
  fit: 'Fit',
  efficiency: 'Efficiency',
  risk: 'Risk',
  quality: 'Quality',
  cost: 'Cost',

  // Dashboard Tabs / Menu
  tabOverview: 'Overview',
  tabTeam: 'Team',
  tabTech: 'Tech',
  tabISO: 'ISO',
  tabLog: 'Log',
  tabMarket: 'Market',
  tabResearch: 'Research',
  tabOffice: 'Office',
  nextWeek: 'Next Week',

  // Time Controls
  weekShort: 'W',
  paused: 'Paused',
  speed1x: '1x',
  speed2x: '2x',
  speed3x: '3x',

  // Furniture
  furniture: 'Furniture',
  buy: 'Buy',
  place: 'Place',
  move: 'Move',
  unplace: 'Remove',
  owned: 'Owned',
  placementMode: 'Click on the grid to place furniture',
  noFurniture: 'No furniture yet. Buy some!',
  desk: 'Desk',
  meetingRoom: 'Meeting Room',
  serverRoom: 'Server Room',
  lounge: 'Lounge',
  stage: 'Stage',

  // Employee-Desk
  noDesk: 'No desk',
  occupied: 'occupied',
  noZone: 'No zone',

  // Language
  language: 'Language',

  // Market Panel
  employeeMarket: 'Employee Market',
  refreshesIn: (weeks: number) => `Refreshes in ${weeks} weeks`,
  noCandidates: 'No candidates available. Wait for market refresh.',
  talent: 'Talent',
  resist: 'Resist',
  salary: 'Salary',
  hireFor: 'Hire',

  // Rarity
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  legendary: 'legendary',

  // Research / Tech Tree
  researchTree: 'Research Tree',
  techCore: 'Technology Core',
  marketingInfluence: 'Marketing & Influence',
  done: 'Done',
  researching: 'Researching',
  research: 'Research',
  repRequired: (rep: number) => `Rep ≥ ${rep}`,
  weeksShort: (w: number) => `${w}w`,

  // Furniture Panel
  officeCustomization: 'Office Customization',
  clickToPlace: 'Click a green cell in the office to place the item',
  placed: 'Placed',
  removeFromOffice: 'Remove from office',
  shop: 'Shop',

  // Metrics Panel
  businessMetrics: 'Business Metrics',
  revenue: 'Revenue',
  costs: 'Costs',
  profit: 'Profit',
  growth: 'Growth',
  teamEfficiency: 'Team Efficiency',
  perWeek: '/wk',

  // Business Info
  yourBusiness: 'Your Business',
  niche: 'Niche',
  product: 'Product',
  monetization: 'Monetization',
  market: 'Market',
  technologies: 'Technologies',
  none: 'None',

  // Team Panel
  team: 'Team',
  hire: 'Hire',
  noTeamYet: 'No team members yet. Hire someone!',
  experience: 'Experience',
  burnout: 'Burnout',
  morale: 'Morale',

  // Roles
  roleDeveloper: 'Developer',
  roleManager: 'Manager',
  roleQA: 'QA Engineer',
  roleSecurity: 'Security Specialist',
  roleMarketing: 'Marketing',

  // Tech Panel
  active: 'Active',
  synergy: 'Synergy',
  qualityLabel: 'quality',
  complexityLabel: 'complexity',

  // ISO Panel
  isoStandards: 'ISO Standards',
  certified: 'Certified',
  notStarted: 'Not Started',
  audit: 'Audit',
  implementation: 'Implementation',
  internalCheck: 'Internal Check',
  certification: 'Certification',
  maintenance: 'Maintenance',
  startAudit: 'Start Audit',
  advanceTo: 'Advance to',
  inProgress: 'In progress... advance turns to complete this stage.',
  maintenanceCostLabel: 'Maintenance cost',
  weeksMaintained: 'Weeks maintained',
  riskReduction: 'risk',
  reputation: 'reputation',
  burnoutReduction: 'burnout',

  // Event Log
  eventLog: 'Event Log',

  // Quick Stats
  quickStats: 'Quick Stats',
  teamComposition: 'Team Composition',
  noTeam: 'No team',
  isoStatus: 'ISO Status',
  isoInProgress: 'In Progress',
  winConditions: 'Win Conditions',
  ipoCondition: 'IPO ($500K + 80 rep)',
  dominanceCondition: 'Dominance (95 rep + 90% quality)',
  money: 'Money',
  rep: 'Rep',

  // Game End
  victory: 'Victory!',
  gameOver: 'Game Over',
  victoryMessage: 'Congratulations! You built a successful business empire.',
  defeatMessage: 'Your business could not survive. Better luck next time.',
  weeksSurvived: 'Weeks Survived',
  finalBalance: 'Final Balance',
  teamSize: 'Team Size',
  isoCertified: 'ISO Certified',
  playAgain: 'Play Again',

  // Game Logs (dynamic)
  welcomeMessage: 'Welcome to Business Tycoon! Choose your niche, product, and strategy to begin.',
  launchedMessage: '🚀 Your business is launched! Good luck!',
  hiredMessage: (name: string, role: string, cost: string) => `Hired ${name} as ${role}. Cost: ${cost}`,
  firedMessage: (name: string, role: string) => `${name} (${role}) left the company.`,
  quitBurnoutMessage: (name: string, role: string) => `💀 ${name} (${role}) quit due to extreme burnout!`,
  adoptedTechMessage: (name: string, cost: string) => `Adopted ${name} for ${cost}.`,
  isoStartedMessage: 'Started ISO audit process.',
  isoAdvancedMessage: (stage: string) => `ISO advanced to: ${stage}.`,
  isoCertifiedMessage: '🎉 ISO 9001 Certified! Entering maintenance phase.',
  isoNotEnoughMoney: (stage: string) => `Not enough money to advance ISO to ${stage}.`,
  isoMaintenanceIssue: '⚠️ ISO maintenance issue detected! Progress reduced.',
  bankruptMessage: '💸 BANKRUPT! Your company ran out of money.',
  reputationCollapsed: '📉 Your reputation has collapsed. Game over.',
  ipoSuccess: '🎉 IPO SUCCESS! You took your company public!',
  marketDominance: '🏆 MARKET DOMINANCE! Your company rules the industry!',

  // Niches
  nicheFintechName: 'FinTech',
  nicheFintechDesc: 'Financial technology — payments, banking, insurance.',
  nicheHealthtechName: 'HealthTech',
  nicheHealthtechDesc: 'Digital health — telemedicine, fitness, diagnostics.',
  nicheEdtechName: 'EdTech',
  nicheEdtechDesc: 'Education technology — e-learning, LMS, tutoring.',

  // Products
  productSaasName: 'SaaS Platform',
  productSaasDesc: 'Cloud-based subscription software.',
  productMobileName: 'Mobile App',
  productMobileDesc: 'Consumer-facing mobile application.',
  productMarketplaceName: 'Marketplace',
  productMarketplaceDesc: 'Two-sided platform connecting buyers and sellers.',

  // Technologies
  techCloudName: 'Cloud Infrastructure',
  techCloudDesc: 'AWS/GCP/Azure hosting and scaling.',
  techMicroName: 'Microservices',
  techMicroDesc: 'Distributed architecture for scalability.',
  techAiName: 'AI / Machine Learning',
  techAiDesc: 'Intelligent features and automation.',
  techBlockchainName: 'Blockchain',
  techBlockchainDesc: 'Decentralized ledger for trust and transparency.',
  techCyberName: 'Cybersecurity Suite',
  techCyberDesc: 'Advanced security and compliance tooling.',

  // Markets
  marketDomesticName: 'Domestic Market',
  marketDomesticDesc: 'Your home country. Easiest entry, moderate demand.',

  // Monetization
  monSubName: 'Subscription (SaaS)',
  monSubDesc: 'Recurring monthly/annual fees.',
  monFreemiumName: 'Freemium',
  monFreemiumDesc: 'Free base + paid premium features.',
  monTxName: 'Transaction Fee',
  monTxDesc: 'Take a cut of each transaction.',

  // ISO
  iso9001Name: 'ISO 9001',
  iso9001Desc: 'Quality Management System — improves process quality, reduces risk, boosts reputation.',

  // Events
  eventMarketBoomTitle: 'Market Boom',
  eventMarketBoomDesc: 'Demand in your niche surges unexpectedly!',
  eventMarketDownturnTitle: 'Market Downturn',
  eventMarketDownturnDesc: 'Economic slowdown reduces demand across the board.',
  eventNewCompetitorTitle: 'New Competitor',
  eventNewCompetitorDesc: 'A well-funded competitor enters your niche.',
  eventTeamConflictTitle: 'Team Conflict',
  eventTeamConflictDesc: 'Internal disagreements slow down productivity.',
  eventInnovationTitle: 'Innovation Spark',
  eventInnovationDesc: 'Your team discovers a breakthrough approach!',
  eventDataBreachTitle: 'Data Breach!',
  eventDataBreachDesc: 'A security incident exposes customer data.',
  eventServerOutageTitle: 'Server Outage',
  eventServerOutageDesc: 'Your infrastructure goes down for hours.',
  eventRegulatoryFineTitle: 'Regulatory Fine',
  eventRegulatoryFineDesc: 'You failed a compliance check. Heavy fine imposed.',
  eventViralGrowthTitle: 'Viral Growth',
  eventViralGrowthDesc: 'Your product goes viral on social media!',
  eventMediaFeatureTitle: 'Media Feature',
  eventMediaFeatureDesc: 'A major publication features your company.',
  eventTalentTitle: 'Talent Magnet',
  eventTalentDesc: 'Your reputation attracts top talent — team morale soars.',
  eventIsoAuditTitle: 'Surprise ISO Audit',
  eventIsoAuditDesc: 'An unscheduled audit checks your compliance.',
  eventIsoRecognitionTitle: 'ISO Excellence Award',
  eventIsoRecognitionDesc: 'Your quality management earns industry recognition.',
};

export type TranslationKeys = {
  [K in keyof typeof en]: (typeof en)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string;
};
