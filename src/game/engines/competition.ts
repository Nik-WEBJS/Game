import {
  CampaignMilestoneState,
  CompetitorCompany,
  GameState,
  MnaActionType,
  OFFICE_LEVELS,
  TeamRole,
} from '../types';
import { CAMPAIGN_MILESTONES } from '../data-competition';
import { TECHNOLOGIES } from '../data';
import { createTeamMember } from './team';
import { BALANCE } from '../config/balance';

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getCompetitorById(state: GameState, competitorId: string): CompetitorCompany | undefined {
  return state.business.competition.competitors.find(c => c.id === competitorId);
}

function getOfficeFreeSlots(state: GameState): number {
  const officeLevel = OFFICE_LEVELS.find(level => level.level === state.business.office.level);
  const maxEmployees = officeLevel?.maxEmployees ?? state.business.team.length;
  return Math.max(0, maxEmployees - state.business.team.length);
}

function scoreCompetitorGrowth(state: GameState, competitor: CompetitorCompany): number {
  const cfg = BALANCE.competition.growthModel;
  const playerQuality = state.business.metrics.quality;
  const reputationPressure = (competitor.reputation - state.player.reputation) / cfg.reputationPressureDivisor;
  const qualityPressure = (competitor.quality - playerQuality) * cfg.qualityPressureScale;
  const randomNoise = (Math.random() - 0.5) * cfg.randomNoiseScale;
  return clamp(cfg.growthFloor, cfg.growthCap, competitor.growth + reputationPressure + qualityPressure + randomNoise);
}

function getCompetitorsSortedByUsers(competitors: CompetitorCompany[]): CompetitorCompany[] {
  return [...competitors].sort((a, b) => b.users - a.users);
}

function getLifecyclePressureScale(state: GameState): number {
  const lifecycle = state.business.companyProducts[0]?.lifecycle ?? 'prototype';
  const map = BALANCE.competition.lifecyclePressureScale;
  return map[lifecycle] ?? 1;
}

export function tickCompetition(state: GameState): GameState {
  const live = state.business.liveProduct;
  if (!live) return state;
  const previous = state.business.competition;
  const previousRank = previous.lastWeek.playerRank;
  const growthCfg = BALANCE.competition.growthModel;
  const impactCfg = BALANCE.competition.playerImpact;
  const eventCfg = BALANCE.competition.pressureEvents;
  const lifecycleScale = getLifecyclePressureScale(state);

  const competitors = previous.competitors.map((competitor) => {
    const growth = scoreCompetitorGrowth(state, competitor);
    const users = Math.max(growthCfg.usersFloor, Math.round(competitor.users * (1 + growth)));
    const quality = clamp(
      growthCfg.qualityFloor,
      growthCfg.qualityCap,
      competitor.quality + (Math.random() - 0.5) * growthCfg.qualityNoiseScale + growth * growthCfg.qualityGrowthInfluence,
    );
    const reputation = Math.round(clamp(
      growthCfg.reputationFloor,
      growthCfg.reputationCap,
      competitor.reputation + growth * growthCfg.reputationGrowthScale + (Math.random() - 0.5) * growthCfg.reputationNoiseScale,
    ));
    const pressure = clamp(
      growthCfg.pressureFloor,
      growthCfg.pressureCap,
      growthCfg.pressureBase + users / growthCfg.pressureUsersDivisor + quality * growthCfg.pressureQualityScale,
    );
    return {
      ...competitor,
      users,
      growth: clamp(
        growthCfg.smoothedGrowthFloor,
        growthCfg.smoothedGrowthCap,
        competitor.growth * growthCfg.blendPrevGrowth + growth * growthCfg.blendNewGrowth,
      ),
      quality,
      reputation,
      pressure,
    };
  });

  const playerUsers = Math.max(0, live.metrics.activeUsers);
  const totalCompetitorUsers = competitors.reduce((sum, competitor) => sum + competitor.users, 0);
  const totalUsers = Math.max(1, playerUsers + totalCompetitorUsers);
  const playerMarketShare = playerUsers / totalUsers;

  const weightedPressure = competitors.reduce((sum, competitor) => {
    const share = competitor.users / totalUsers;
    return sum + share * competitor.pressure;
  }, 0);
  const marketPressure = clamp(0, growthCfg.marketPressureCap, weightedPressure * lifecycleScale);

  const ranking = [...competitors, {
    id: 'player',
    name: state.business.companyName,
    users: playerUsers,
  }].sort((a, b) => b.users - a.users);
  const playerRank = Math.max(1, ranking.findIndex(item => item.id === 'player') + 1);
  const lastRankDelta = previousRank > 0 ? previousRank - playerRank : 0;

  const pressureEvents: string[] = [];
  let repDelta = 0;
  const liveAdjust = {
    traffic: live.metrics.traffic,
    signups: live.metrics.signups,
    activeUsers: live.metrics.activeUsers,
    payingUsers: live.metrics.payingUsers,
    satisfaction: live.metrics.satisfaction,
    conversion: live.metrics.conversion,
    churn: live.metrics.churn,
  };

  const baseTrafficPenalty = marketPressure * impactCfg.trafficPenaltyScale;
  const baseConversionPenalty = marketPressure * impactCfg.conversionPenaltyScale;
  const baseChurnBoost = marketPressure * impactCfg.churnBoostScale;
  const baseSatisfactionPenalty = marketPressure * impactCfg.satisfactionPenaltyScale;

  liveAdjust.traffic = Math.max(80, Math.round(liveAdjust.traffic * (1 - baseTrafficPenalty)));
  liveAdjust.conversion = clamp(0.02, 0.45, liveAdjust.conversion - baseConversionPenalty);
  liveAdjust.churn = clamp(0.01, 0.45, liveAdjust.churn + baseChurnBoost);
  liveAdjust.satisfaction = clamp(0.1, 0.99, liveAdjust.satisfaction - baseSatisfactionPenalty);
  liveAdjust.signups = Math.max(0, Math.round(liveAdjust.traffic * liveAdjust.conversion));
  liveAdjust.activeUsers = Math.max(0, Math.round(liveAdjust.activeUsers * (1 - marketPressure * impactCfg.activeUsersPenaltyScale)));
  liveAdjust.payingUsers = Math.min(liveAdjust.activeUsers, Math.max(0, Math.round(liveAdjust.payingUsers * (1 - marketPressure * impactCfg.payingUsersPenaltyScale))));

  if (
    playerMarketShare < eventCfg.surgeShareThreshold
    && marketPressure > eventCfg.surgePressureThreshold
    && Math.random() < eventCfg.surgeChance
  ) {
    pressureEvents.push('competitor_campaign_surge');
    liveAdjust.traffic = Math.max(80, Math.round(liveAdjust.traffic * eventCfg.surgeTrafficMultiplier));
    liveAdjust.satisfaction = clamp(0.1, 0.99, liveAdjust.satisfaction - eventCfg.surgeSatisfactionPenalty);
    repDelta += eventCfg.surgeReputationDelta;
  }
  if (playerRank <= eventCfg.breakthroughRankRequired && Math.random() < eventCfg.breakthroughChance) {
    pressureEvents.push('competitive_breakthrough');
    liveAdjust.traffic = Math.max(80, Math.round(liveAdjust.traffic * eventCfg.breakthroughTrafficMultiplier));
    liveAdjust.satisfaction = clamp(0.1, 0.99, liveAdjust.satisfaction + eventCfg.breakthroughSatisfactionBonus);
    repDelta += eventCfg.breakthroughReputationDelta;
  }

  liveAdjust.signups = Math.max(0, Math.round(liveAdjust.traffic * liveAdjust.conversion));
  liveAdjust.activeUsers = Math.max(0, Math.round(liveAdjust.activeUsers * (1 - liveAdjust.churn * 0.01)));
  liveAdjust.payingUsers = Math.min(liveAdjust.activeUsers, liveAdjust.payingUsers);

  const deltaTraffic = liveAdjust.traffic - live.metrics.traffic;
  const deltaSignups = liveAdjust.signups - live.metrics.signups;
  const deltaActive = liveAdjust.activeUsers - live.metrics.activeUsers;
  const deltaPaying = liveAdjust.payingUsers - live.metrics.payingUsers;
  const deltaSatisfaction = liveAdjust.satisfaction - live.metrics.satisfaction;
  const deltaConversion = liveAdjust.conversion - live.metrics.conversion;
  const deltaChurn = liveAdjust.churn - live.metrics.churn;

  const nextLive = {
    ...live,
    metrics: liveAdjust,
    lastWeek: {
      ...live.lastWeek,
      topNegativeFactors: unique(['Competitor market pressure', ...live.lastWeek.topNegativeFactors]).slice(0, 3),
      bottlenecks: unique([
        ...(marketPressure > impactCfg.bottleneckPressureThreshold ? ['Competition pressure is limiting growth'] : []),
        ...live.lastWeek.bottlenecks,
      ]).slice(0, 5),
      deltas: {
        traffic: live.lastWeek.deltas.traffic + deltaTraffic,
        signups: live.lastWeek.deltas.signups + deltaSignups,
        activeUsers: live.lastWeek.deltas.activeUsers + deltaActive,
        payingUsers: live.lastWeek.deltas.payingUsers + deltaPaying,
        satisfaction: live.lastWeek.deltas.satisfaction + deltaSatisfaction,
        conversion: live.lastWeek.deltas.conversion + deltaConversion,
        churn: live.lastWeek.deltas.churn + deltaChurn,
      },
    },
  };

  const topCompetitor = getCompetitorsSortedByUsers(competitors)[0];
  const nextCompetition = {
    ...previous,
    competitors,
    pendingPressureEvents: pressureEvents,
    lastWeek: {
      totalUsers,
      playerUsers,
      playerMarketShare,
      playerRank,
      marketPressure,
      lastRankDelta,
      topCompetitorName: topCompetitor?.name ?? null,
    },
  };

  const logs = [...state.logs];
  if (lastRankDelta !== 0) {
    logs.push({
      week: state.player.currentWeek,
      type: lastRankDelta > 0 ? 'success' : 'warning',
      message: `Ranking update: now #${playerRank} (${lastRankDelta > 0 ? '+' : ''}${lastRankDelta}).`,
    });
  }
  if (pressureEvents.includes('competitor_campaign_surge')) {
    logs.push({
      week: state.player.currentWeek,
      type: 'warning',
      message: 'Competitive pressure event: rival campaign surge reduced conversion momentum.',
    });
  }
  if (pressureEvents.includes('competitive_breakthrough')) {
    logs.push({
      week: state.player.currentWeek,
      type: 'success',
      message: 'Competitive pressure event: your product outperformed rivals this week.',
    });
  }

  return {
    ...state,
    player: repDelta === 0
      ? state.player
      : { ...state.player, reputation: Math.round(clamp(0, 100, state.player.reputation + repDelta)) },
    business: {
      ...state.business,
      liveProduct: nextLive,
      competition: nextCompetition,
    },
    logs,
  };
}

export function getMnaActionCost(state: GameState, action: MnaActionType, competitorId: string): number | null {
  const competitor = getCompetitorById(state, competitorId);
  if (!competitor) return null;
  const mna = BALANCE.competition.mna;
  switch (action) {
    case 'buy_user_base':
      return Math.max(
        mna.buyUserBase.minCost,
        Math.round(competitor.users * mna.buyUserBase.usersCost + competitor.reputation * mna.buyUserBase.reputationCost),
      );
    case 'acquire_technology':
      return Math.max(
        mna.acquireTechnology.minCost,
        Math.round(competitor.quality * mna.acquireTechnology.qualityCost + competitor.reputation * mna.acquireTechnology.reputationCost),
      );
    case 'acqui_hire':
      return Math.max(
        mna.acquiHire.minCost,
        Math.round(mna.acquiHire.baseCost + competitor.users * mna.acquiHire.usersCost),
      );
    case 'brand_boost':
      return Math.max(
        mna.brandBoost.minCost,
        Math.round(mna.brandBoost.baseCost + competitor.reputation * mna.brandBoost.reputationCost),
      );
    default:
      return null;
  }
}

export function canExecuteMnaAction(
  state: GameState,
  action: MnaActionType,
  competitorId: string,
): { ok: boolean; reason?: string; cost?: number } {
  const competitor = getCompetitorById(state, competitorId);
  if (!competitor) return { ok: false, reason: 'competitor_not_found' };
  const cost = getMnaActionCost(state, action, competitorId);
  if (cost == null) return { ok: false, reason: 'invalid_action' };
  if (state.player.money < cost) return { ok: false, reason: 'not_enough_money', cost };
  if (action === 'buy_user_base' && competitor.users < BALANCE.competition.mna.buyUserBase.minTargetUsers) {
    return { ok: false, reason: 'target_too_small', cost };
  }
  if (action === 'acquire_technology') {
    const available = TECHNOLOGIES.filter(tech => !state.business.technologies.includes(tech.id));
    if (available.length === 0) return { ok: false, reason: 'no_technology_left', cost };
  }
  if (action === 'acqui_hire' && getOfficeFreeSlots(state) <= 0) {
    return { ok: false, reason: 'no_office_capacity', cost };
  }
  return { ok: true, cost };
}

function markCampaignMnaUsed(campaign: CampaignMilestoneState): CampaignMilestoneState {
  return {
    ...campaign,
    flags: {
      ...campaign.flags,
      usedMna: true,
    },
  };
}

export function executeMnaAction(state: GameState, action: MnaActionType, competitorId: string): GameState {
  const check = canExecuteMnaAction(state, action, competitorId);
  if (!check.ok) return state;
  const cost = check.cost ?? 0;
  const competitor = getCompetitorById(state, competitorId)!;
  const mna = BALANCE.competition.mna;

  let nextState: GameState = {
    ...state,
    player: { ...state.player, money: state.player.money - cost },
    business: {
      ...state.business,
      campaign: markCampaignMnaUsed(state.business.campaign),
    },
  };

  if (action === 'buy_user_base') {
    const transfer = Math.max(
      mna.buyUserBase.transferMin,
      Math.round(competitor.users * (mna.buyUserBase.transferShareBase + Math.random() * mna.buyUserBase.transferShareRange)),
    );
    const updatedCompetitors = nextState.business.competition.competitors.map((entry) =>
      entry.id === competitorId
        ? {
          ...entry,
          users: Math.max(BALANCE.competition.growthModel.usersFloor, entry.users - transfer),
          pressure: clamp(
            BALANCE.competition.growthModel.pressureFloor,
            BALANCE.competition.growthModel.pressureCap,
            entry.pressure - mna.buyUserBase.pressureReduction,
          ),
        }
        : entry,
    );
    const live = nextState.business.liveProduct;
    if (live) {
      const active = live.metrics.activeUsers + transfer;
      const paying = Math.min(
        active,
        live.metrics.payingUsers + Math.round(
          transfer * Math.max(
            mna.buyUserBase.payingShareMin,
            live.metrics.conversion * mna.buyUserBase.payingShareFromConversionScale,
          ),
        ),
      );
      nextState = {
        ...nextState,
        player: {
          ...nextState.player,
          reputation: Math.round(clamp(0, 100, nextState.player.reputation + mna.buyUserBase.reputationReward)),
        },
        business: {
          ...nextState.business,
          liveProduct: {
            ...live,
            metrics: {
              ...live.metrics,
              activeUsers: active,
              payingUsers: paying,
            },
          },
          competition: {
            ...nextState.business.competition,
            competitors: updatedCompetitors,
          },
        },
      };
    }
  }

  if (action === 'acquire_technology') {
    const available = TECHNOLOGIES.filter(tech => !nextState.business.technologies.includes(tech.id));
    if (available.length > 0) {
      const tech = available[Math.floor(Math.random() * available.length)];
      const updatedCompetitors = nextState.business.competition.competitors.map((entry) =>
        entry.id === competitorId
          ? {
            ...entry,
            quality: clamp(
              BALANCE.competition.growthModel.qualityFloor,
              BALANCE.competition.growthModel.qualityCap,
              entry.quality - mna.acquireTechnology.competitorQualityPenalty,
            ),
          }
          : entry,
      );
      nextState = {
        ...nextState,
        player: {
          ...nextState.player,
          reputation: Math.round(clamp(0, 100, nextState.player.reputation + mna.acquireTechnology.reputationReward)),
        },
        business: {
          ...nextState.business,
          technologies: [...nextState.business.technologies, tech.id],
          competition: {
            ...nextState.business.competition,
            competitors: updatedCompetitors,
          },
        },
        logs: [
          ...nextState.logs,
          {
            week: state.player.currentWeek,
            type: 'success',
            message: `M&A action complete: acquired technology ${tech.name} from ${competitor.name}.`,
          },
        ],
      };
    }
  }

  if (action === 'acqui_hire') {
    const slots = getOfficeFreeSlots(nextState);
    const hires = Math.min(slots, mna.acquiHire.maxHires);
    const preferredRoles: TeamRole[] = ['qa', 'security', 'developer', 'marketing', 'manager'];
    const newMembers = Array.from({ length: hires }).map((_, idx) => {
      const role = preferredRoles[idx % preferredRoles.length];
      const member = createTeamMember(role);
      return {
        ...member,
        experience: clamp(20, 100, member.experience + mna.acquiHire.experienceBonus),
        morale: clamp(45, 100, member.morale + mna.acquiHire.moraleBonus),
      };
    });
    const updatedCompetitors = nextState.business.competition.competitors.map((entry) =>
      entry.id === competitorId
        ? {
          ...entry,
          users: Math.max(
            BALANCE.competition.growthModel.usersFloor,
            Math.round(entry.users * mna.acquiHire.competitorUsersMultiplier),
          ),
          pressure: clamp(
            BALANCE.competition.growthModel.pressureFloor,
            BALANCE.competition.growthModel.pressureCap,
            entry.pressure - mna.acquiHire.pressureReduction,
          ),
        }
        : entry,
    );
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        reputation: Math.round(clamp(0, 100, nextState.player.reputation + mna.acquiHire.reputationReward)),
      },
      business: {
        ...nextState.business,
        team: [...nextState.business.team, ...newMembers],
        competition: {
          ...nextState.business.competition,
          competitors: updatedCompetitors,
        },
      },
    };
  }

  if (action === 'brand_boost') {
    const updatedCompetitors = nextState.business.competition.competitors.map((entry) =>
      entry.id === competitorId
        ? {
          ...entry,
          reputation: Math.max(
            BALANCE.competition.growthModel.reputationFloor,
            entry.reputation - mna.brandBoost.competitorReputationPenalty,
          ),
          pressure: clamp(
            BALANCE.competition.growthModel.pressureFloor,
            BALANCE.competition.growthModel.pressureCap,
            entry.pressure - mna.brandBoost.pressureReduction,
          ),
        }
        : entry,
    );
    const live = nextState.business.liveProduct;
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        reputation: Math.round(clamp(0, 100, nextState.player.reputation + mna.brandBoost.reputationReward)),
      },
      business: {
        ...nextState.business,
        liveProduct: live
          ? {
            ...live,
            metrics: {
              ...live.metrics,
              traffic: Math.round(live.metrics.traffic * mna.brandBoost.trafficMultiplier),
              satisfaction: clamp(0.1, 0.99, live.metrics.satisfaction + mna.brandBoost.satisfactionBonus),
            },
          }
          : live,
        competition: {
          ...nextState.business.competition,
          competitors: updatedCompetitors,
        },
      },
    };
  }

  return {
    ...nextState,
    logs: [
      ...nextState.logs,
      {
        week: state.player.currentWeek,
        type: 'info',
        message: `M&A action executed: ${action} against ${competitor.name} (${cost.toLocaleString()}).`,
      },
    ],
  };
}

function checkMilestoneComplete(state: GameState, milestoneId: string): boolean {
  const live = state.business.liveProduct;
  switch (milestoneId) {
    case 'unlock_first_feature':
      return (live?.features.filter(feature => feature.installed).length ?? 0) >= 2;
    case 'reach_1k_active_users':
      return (live?.metrics.activeUsers ?? 0) >= 1000;
    case 'survive_first_overload':
      return state.business.campaign.flags.hadOverload;
    case 'hire_first_ops_specialist':
      return state.business.team.some(member => member.role === 'qa' || member.role === 'security');
    case 'improve_satisfaction':
      return (live?.metrics.satisfaction ?? 0) >= 0.7;
    case 'execute_first_mna':
      return state.business.campaign.flags.usedMna;
    default:
      return false;
  }
}

export function tickCampaignMilestones(state: GameState): GameState {
  const campaign = state.business.campaign;
  if (!campaign.activeId) return state;

  const hadOverload = state.business.infrastructure.lastWeek.load > 1.02;
  const updatedCampaignFlags = {
    ...campaign.flags,
    hadOverload: campaign.flags.hadOverload || hadOverload,
  };
  let nextCampaign: CampaignMilestoneState = {
    ...campaign,
    flags: updatedCampaignFlags,
  };

  const milestone = CAMPAIGN_MILESTONES.find(item => item.id === campaign.activeId);
  if (!milestone || !checkMilestoneComplete({ ...state, business: { ...state.business, campaign: nextCampaign } }, campaign.activeId)) {
    if (nextCampaign !== campaign) {
      return {
        ...state,
        business: {
          ...state.business,
          campaign: nextCampaign,
        },
      };
    }
    return state;
  }

  const completedIds = [...campaign.completedIds, milestone.id];
  const currentIndex = CAMPAIGN_MILESTONES.findIndex(item => item.id === milestone.id);
  const nextMilestone = currentIndex >= 0 ? CAMPAIGN_MILESTONES[currentIndex + 1] : undefined;
  const discoveredIds = nextMilestone
    ? unique([...campaign.discoveredIds, nextMilestone.id])
    : campaign.discoveredIds;
  nextCampaign = {
    ...nextCampaign,
    completedIds,
    discoveredIds,
    activeId: nextMilestone?.id ?? null,
    lastCompletedWeek: state.player.currentWeek,
  };

  return {
    ...state,
    player: {
      ...state.player,
      money: state.player.money + milestone.rewardMoney,
      reputation: Math.round(clamp(0, 100, state.player.reputation + milestone.rewardReputation)),
    },
    business: {
      ...state.business,
      campaign: nextCampaign,
    },
    logs: [
      ...state.logs,
      {
        week: state.player.currentWeek,
        type: 'success',
        message: `Milestone complete: ${milestone.title} (+$${milestone.rewardMoney.toLocaleString()}, +${milestone.rewardReputation} rep).`,
      },
      ...(nextMilestone
        ? [{
          week: state.player.currentWeek,
          type: 'info' as const,
          message: `New milestone: ${nextMilestone.title}. ${nextMilestone.description}`,
        }]
        : []),
    ],
  };
}
