import type { TranslationKeys } from './en';

export const ru: TranslationKeys = {
  // General
  lang: 'RU',
  langFull: 'Русский',
  businessTycoon: 'Business Tycoon',
  week: 'Неделя',
  xp: 'Опыт',

  // Setup Screen
  setupSubtitle: 'Постройте империю. Принимайте стратегические решения. Захватите рынок.',
  startingCapital: 'Стартовый капитал',
  companyName: 'Название компании',
  companyNamePlaceholder: 'Введите название компании...',
  chooseLogo: 'Логотип',
  chooseNiche: '1. Выберите нишу',
  chooseProduct: '2. Выберите продукт',
  chooseMonetization: '3. Стратегия монетизации',
  chooseTech: '4. Внедрите технологии',
  optional: 'необязательно',
  launchBusiness: 'Запустить бизнес',
  selectToBegin: 'Выберите нишу, продукт и стратегию монетизации, чтобы начать.',
  demand: 'Спрос',
  complexity: 'Сложность',
  fit: 'Совместимость',
  efficiency: 'Эффективность',
  risk: 'Риск',
  quality: 'Качество',
  cost: 'Стоимость',

  // Dashboard Tabs / Menu
  tabOverview: 'Обзор',
  tabTeam: 'Команда',
  tabTech: 'Технологии',
  tabISO: 'ISO',
  tabLog: 'Журнал',
  tabMarket: 'Рынок',
  tabResearch: 'Исследования',
  tabOffice: 'Офис',
  nextWeek: 'Следующая неделя',

  // Time Controls
  weekShort: 'Н',
  paused: 'Пауза',
  speed1x: '1x',
  speed2x: '2x',
  speed3x: '3x',

  // Furniture
  furniture: 'Мебель',
  buy: 'Купить',
  place: 'Поставить',
  move: 'Переместить',
  unplace: 'Убрать',
  owned: 'В наличии',
  placementMode: 'Нажмите на сетку, чтобы разместить мебель',
  noFurniture: 'Мебели пока нет. Купите что-нибудь!',
  desk: 'Стол',
  meetingRoom: 'Переговорная',
  serverRoom: 'Серверная',
  lounge: 'Зона отдыха',
  stage: 'Сцена',

  // Employee-Desk
  noDesk: 'Нет стола',
  occupied: 'занято',
  noZone: 'Нет зоны',

  // Language
  language: 'Язык',

  // Market Panel
  employeeMarket: 'Рынок сотрудников',
  refreshesIn: (weeks: number) => `Обновление через ${weeks} нед.`,
  noCandidates: 'Нет кандидатов. Дождитесь обновления рынка.',
  talent: 'Талант',
  resist: 'Стойкость',
  salary: 'Зарплата',
  hireFor: 'Нанять',

  // Rarity
  common: 'обычный',
  uncommon: 'необычный',
  rare: 'редкий',
  legendary: 'легендарный',

  // Research / Tech Tree
  researchTree: 'Дерево исследований',
  techCore: 'Технологическое ядро',
  marketingInfluence: 'Маркетинг и влияние',
  operationsProcess: 'Операции и процессы',

  // Employee Levels
  employeeLevel: 'Уровень',
  levelUp: 'Повышение!',

  // Product Lifecycle
  productStage: 'Стадия',
  prototype: 'Прототип',
  beta: 'Бета',
  releaseStage: 'Релиз',
  growthStage: 'Рост',
  maturityStage: 'Зрелость',
  declineStage: 'Упадок',
  done: 'Готово',
  researching: 'Исследуется',
  research: 'Исследовать',
  repRequired: (rep: number) => `Реп. ≥ ${rep}`,
  weeksShort: (w: number) => `${w}н`,

  // Office Levels
  officeLevel: 'Уровень офиса',
  officeLevelLabel: (lvl: number) => `Уровень ${lvl}`,
  maxEmployees: 'Макс. сотрудников',
  upgradeOffice: 'Улучшить офис',
  maxLevel: 'Макс. уровень',
  employeeLimitReached: 'Лимит сотрудников достигнут. Улучшите офис!',
  wallBack: 'Задняя стена',
  wallLeft: 'Левая стена',
  wallRight: 'Правая стена',
  concrete: 'Бетон',
  glass: 'Стекло',
  wallMaterials: 'Материалы стен',

  // Furniture Panel
  officeCustomization: 'Обустройство офиса',
  clickToPlace: 'Нажмите на зелёную клетку в офисе, чтобы разместить предмет',
  placed: 'Размещено',
  removeFromOffice: 'Убрать из офиса',
  shop: 'Магазин',

  // Metrics Panel
  businessMetrics: 'Метрики бизнеса',
  revenue: 'Доход',
  costs: 'Расходы',
  profit: 'Прибыль',
  growth: 'Рост',
  teamEfficiency: 'Эффективность команды',
  perWeek: '/нед',

  // Business Info
  yourBusiness: 'Ваш бизнес',
  niche: 'Ниша',
  product: 'Продукт',
  monetization: 'Монетизация',
  market: 'Рынок',
  technologies: 'Технологии',
  none: 'Нет',

  // Team Panel
  team: 'Команда',
  hire: 'Нанять',
  noTeamYet: 'Пока нет сотрудников. Наймите кого-нибудь!',
  experience: 'Опыт',
  burnout: 'Выгорание',
  morale: 'Мораль',

  // Roles
  roleDeveloper: 'Разработчик',
  roleManager: 'Менеджер',
  roleQA: 'QA-инженер',
  roleSecurity: 'Специалист по безопасности',
  roleMarketing: 'Маркетолог',

  // Tech Panel
  active: 'Активно',
  synergy: 'Синергия',
  qualityLabel: 'качество',
  complexityLabel: 'сложность',

  // ISO Panel
  isoStandards: 'Стандарты ISO',
  certified: 'Сертифицирован',
  notStarted: 'Не начат',
  audit: 'Аудит',
  implementation: 'Внедрение',
  internalCheck: 'Внутренняя проверка',
  certification: 'Сертификация',
  maintenance: 'Обслуживание',
  startAudit: 'Начать аудит',
  advanceTo: 'Перейти к',
  inProgress: 'В процессе... продвигайте ходы для завершения этапа.',
  maintenanceCostLabel: 'Стоимость обслуживания',
  weeksMaintained: 'Недель на обслуживании',
  riskReduction: 'риск',
  reputation: 'репутация',
  burnoutReduction: 'выгорание',

  // Event Log
  eventLog: 'Журнал событий',

  // Quick Stats
  quickStats: 'Быстрая статистика',
  teamComposition: 'Состав команды',
  noTeam: 'Нет команды',
  isoStatus: 'Статус ISO',
  isoInProgress: 'В процессе',
  winConditions: 'Условия победы',
  ipoCondition: 'IPO ($500K + 80 репутации)',
  dominanceCondition: 'Доминирование (95 реп. + 90% качества)',
  money: 'Деньги',
  rep: 'Реп.',

  // Game End
  victory: 'Победа!',
  gameOver: 'Игра окончена',
  victoryMessage: 'Поздравляем! Вы построили успешную бизнес-империю.',
  defeatMessage: 'Ваш бизнес не выжил. Удачи в следующий раз.',
  weeksSurvived: 'Недель прожито',
  finalBalance: 'Итоговый баланс',
  teamSize: 'Размер команды',
  isoCertified: 'ISO сертификаты',
  playAgain: 'Играть снова',

  // Game Logs (dynamic)
  welcomeMessage: 'Добро пожаловать в Business Tycoon! Выберите нишу, продукт и стратегию.',
  launchedMessage: '🚀 Ваш бизнес запущен! Удачи!',
  hiredMessage: (name: string, role: string, cost: string) => `Нанят ${name} как ${role}. Стоимость: ${cost}`,
  firedMessage: (name: string, role: string) => `${name} (${role}) покинул компанию.`,
  quitBurnoutMessage: (name: string, role: string) => `💀 ${name} (${role}) уволился из-за выгорания!`,
  adoptedTechMessage: (name: string, cost: string) => `Внедрена технология ${name} за ${cost}.`,
  isoStartedMessage: 'Начат процесс ISO-аудита.',
  isoAdvancedMessage: (stage: string) => `ISO перешёл на этап: ${stage}.`,
  isoCertifiedMessage: '🎉 ISO 9001 сертифицирован! Переход к обслуживанию.',
  isoNotEnoughMoney: (stage: string) => `Недостаточно средств для перехода ISO к ${stage}.`,
  isoMaintenanceIssue: '⚠️ Обнаружена проблема обслуживания ISO! Прогресс снижен.',
  bankruptMessage: '💸 БАНКРОТСТВО! У компании закончились деньги.',
  reputationCollapsed: '📉 Ваша репутация рухнула. Игра окончена.',
  ipoSuccess: '🎉 IPO УСПЕШНО! Вы вывели компанию на биржу!',
  marketDominance: '🏆 ДОМИНИРОВАНИЕ НА РЫНКЕ! Ваша компания правит индустрией!',

  // Niches
  nicheFintechName: 'ФинТех',
  nicheFintechDesc: 'Финансовые технологии — платежи, банкинг, страхование.',
  nicheHealthtechName: 'ЗдоровьеТех',
  nicheHealthtechDesc: 'Цифровое здоровье — телемедицина, фитнес, диагностика.',
  nicheEdtechName: 'ОбрТех',
  nicheEdtechDesc: 'Образовательные технологии — e-learning, LMS, репетиторство.',

  // Products
  productSaasName: 'SaaS-платформа',
  productSaasDesc: 'Облачное ПО по подписке.',
  productMobileName: 'Мобильное приложение',
  productMobileDesc: 'Потребительское мобильное приложение.',
  productMarketplaceName: 'Маркетплейс',
  productMarketplaceDesc: 'Двусторонняя платформа для покупателей и продавцов.',

  // Technologies
  techCloudName: 'Облачная инфраструктура',
  techCloudDesc: 'AWS/GCP/Azure хостинг и масштабирование.',
  techMicroName: 'Микросервисы',
  techMicroDesc: 'Распределённая архитектура для масштабируемости.',
  techAiName: 'ИИ / Машинное обучение',
  techAiDesc: 'Интеллектуальные функции и автоматизация.',
  techBlockchainName: 'Блокчейн',
  techBlockchainDesc: 'Децентрализованный реестр для доверия и прозрачности.',
  techCyberName: 'Кибербезопасность',
  techCyberDesc: 'Продвинутые инструменты безопасности и соответствия.',

  // Markets
  marketDomesticName: 'Внутренний рынок',
  marketDomesticDesc: 'Ваша страна. Лёгкий вход, умеренный спрос.',

  // Monetization
  monSubName: 'Подписка (SaaS)',
  monSubDesc: 'Регулярные ежемесячные/годовые платежи.',
  monFreemiumName: 'Фримиум',
  monFreemiumDesc: 'Бесплатная база + платные премиум-функции.',
  monTxName: 'Комиссия с транзакций',
  monTxDesc: 'Процент с каждой транзакции.',

  // ISO
  iso9001Name: 'ISO 9001',
  iso9001Desc: 'Система менеджмента качества — улучшает процессы, снижает риски, повышает репутацию.',

  // Events
  eventMarketBoomTitle: 'Бум на рынке',
  eventMarketBoomDesc: 'Спрос в вашей нише неожиданно вырос!',
  eventMarketDownturnTitle: 'Спад на рынке',
  eventMarketDownturnDesc: 'Экономический спад снижает спрос повсюду.',
  eventNewCompetitorTitle: 'Новый конкурент',
  eventNewCompetitorDesc: 'Хорошо финансируемый конкурент входит в вашу нишу.',
  eventTeamConflictTitle: 'Конфликт в команде',
  eventTeamConflictDesc: 'Внутренние разногласия замедляют работу.',
  eventInnovationTitle: 'Искра инноваций',
  eventInnovationDesc: 'Ваша команда нашла прорывной подход!',
  eventDataBreachTitle: 'Утечка данных!',
  eventDataBreachDesc: 'Инцидент безопасности раскрыл данные клиентов.',
  eventServerOutageTitle: 'Сбой серверов',
  eventServerOutageDesc: 'Ваша инфраструктура упала на несколько часов.',
  eventRegulatoryFineTitle: 'Штраф регулятора',
  eventRegulatoryFineDesc: 'Вы не прошли проверку. Наложен крупный штраф.',
  eventViralGrowthTitle: 'Вирусный рост',
  eventViralGrowthDesc: 'Ваш продукт стал вирусным в соцсетях!',
  eventMediaFeatureTitle: 'Публикация в СМИ',
  eventMediaFeatureDesc: 'Крупное издание написало о вашей компании.',
  eventTalentTitle: 'Магнит талантов',
  eventTalentDesc: 'Ваша репутация привлекает лучших специалистов — мораль растёт.',
  eventIsoAuditTitle: 'Внеплановый ISO-аудит',
  eventIsoAuditDesc: 'Внеплановая проверка вашего соответствия.',
  eventIsoRecognitionTitle: 'Награда ISO за качество',
  eventIsoRecognitionDesc: 'Ваше управление качеством получило отраслевое признание.',
};
