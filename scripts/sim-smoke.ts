import { GameState, TeamMember, TeamRole } from '../src/game/types';
import { NICHES, PRODUCTS, TECHNOLOGIES, MARKETS, MONETIZATIONS, ROLE_SALARIES, createISO9001 } from '../src/game/data';
import { NICHE_VARIANTS, BUSINESS_STYLES, createTechTree, generateMarketPool } from '../src/game/data-advanced';
import { createInitialProduct } from '../src/game/engines/product';
import { runDeterministicSimulationTest } from '../src/game/engines/simulation';
import { BALANCE } from '../src/game/config/balance';

function createMember(id: string, role: TeamRole, experience: number, talent: number): TeamMember {
  return {
    id,
    role,
    name: `${role}_${id}`,
    salary: ROLE_SALARIES[role],
    level: 1,
    experience,
    burnout: 5,
    morale: 75,
    talent,
    burnoutResistance: 0.35,
    trait: null,
    zoneId: null,
    deskId: null,
    status: 'office',
    freelanceTask: null,
    workProgress: 0,
    workCyclesCompleted: 0,
  };
}

function createSmokeState(): GameState {
  const product = createInitialProduct('saas_platform', 'SaaS Platform', 'subscription');

  return {
    saveVersion: BALANCE.saveVersion,
    player: {
      money: BALANCE.start.money,
      reputation: BALANCE.start.reputation,
      experience: 0,
      unlockedNiches: NICHES.map(n => n.id),
      unlockedProducts: PRODUCTS.map(p => p.id),
      unlockedTechnologies: TECHNOLOGIES.map(t => t.id),
      currentWeek: 1,
      gameSpeed: 1,
      weekProgress: 0,
      totalTimePlayed: 0,
    },
    business: {
      companyName: 'Smoke Co',
      logoId: 'rocket',
      office: {
        level: 1,
        wallMaterials: { back: 'concrete', left: 'concrete', right: 'concrete' },
      },
      nicheId: 'fintech',
      nicheVariantId: null,
      productId: 'saas_platform',
      monetizationId: 'subscription',
      styleId: null,
      technologies: ['cloud_infra'],
      marketId: 'domestic',
      team: [
        createMember('m1', 'developer', 35, 0.5),
        createMember('m2', 'marketing', 30, 0.4),
        createMember('m3', 'manager', 25, 0.35),
      ],
      isoStandards: [createISO9001()],
      metrics: {
        revenue: 0,
        costs: 0,
        profit: 0,
        risk: 0.1,
        quality: 0,
        demand: 0,
        growthRate: 0,
        teamEfficiency: 0.5,
      },
      companyProducts: [product],
      techTree: createTechTree(),
      furniture: [],
      employeeMarket: generateMarketPool(5, 10),
      marketRefreshWeek: 0,
    },
    phase: 'playing',
    logs: [{ week: 1, message: 'Smoke test start', type: 'info' }],
    activeEvents: [],
    availableNiches: NICHES,
    availableProducts: PRODUCTS,
    availableTechnologies: TECHNOLOGIES,
    availableMarkets: MARKETS,
    availableMonetizations: MONETIZATIONS,
    availableNicheVariants: NICHE_VARIANTS,
    availableBusinessStyles: BUSINESS_STYLES,
    weekHistory: [],
  };
}

function run(): number {
  const scenarios = [
    { weeks: 52, seed: 1337 },
    { weeks: 104, seed: 42 },
    { weeks: 156, seed: 2026 },
  ];

  let failed = false;
  for (const scenario of scenarios) {
    const state = createSmokeState();
    const result = runDeterministicSimulationTest(state, scenario.weeks, scenario.seed);
    const status = result.ok ? 'PASS' : 'FAIL';
    process.stdout.write(
      `[${status}] weeks=${result.weeks} seed=${result.seed} start=${result.startWeek} end=${result.endWeek} :: ${result.summary}\n`,
    );
    if (!result.ok) {
      failed = true;
      process.stdout.write(`  issues: ${result.issues.join(', ')}\n`);
    }
  }

  return failed ? 1 : 0;
}

process.exitCode = run();
