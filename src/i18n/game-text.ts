import { TranslationKeys } from './en';

type T = TranslationKeys;

const NICHE_NAMES: Record<string, keyof T> = {
  fintech: 'nicheFintechName',
  healthtech: 'nicheHealthtechName',
  edtech: 'nicheEdtechName',
  gamedev: 'nicheGamedevName',
  ecommerce: 'nicheEcommerceName',
  cybersec: 'nicheCybersecName',
};
const NICHE_DESCS: Record<string, keyof T> = {
  fintech: 'nicheFintechDesc',
  healthtech: 'nicheHealthtechDesc',
  edtech: 'nicheEdtechDesc',
  gamedev: 'nicheGamedevDesc',
  ecommerce: 'nicheEcommerceDesc',
  cybersec: 'nicheCybersecDesc',
};

const PRODUCT_NAMES: Record<string, keyof T> = {
  saas_platform: 'productSaasName',
  mobile_app: 'productMobileName',
  marketplace: 'productMarketplaceName',
  api_service: 'productApiName',
  desktop_app: 'productDesktopName',
};
const PRODUCT_DESCS: Record<string, keyof T> = {
  saas_platform: 'productSaasDesc',
  mobile_app: 'productMobileDesc',
  marketplace: 'productMarketplaceDesc',
  api_service: 'productApiDesc',
  desktop_app: 'productDesktopDesc',
};

const TECH_NAMES: Record<string, keyof T> = {
  cloud_infra: 'techCloudName',
  microservices: 'techMicroName',
  ai_ml: 'techAiName',
  blockchain: 'techBlockchainName',
  cybersecurity: 'techCyberName',
};
const TECH_DESCS: Record<string, keyof T> = {
  cloud_infra: 'techCloudDesc',
  microservices: 'techMicroDesc',
  ai_ml: 'techAiDesc',
  blockchain: 'techBlockchainDesc',
  cybersecurity: 'techCyberDesc',
};

const MARKET_NAMES: Record<string, keyof T> = {
  domestic: 'marketDomesticName',
  europe: 'marketEuropeName',
  asia: 'marketAsiaName',
};
const MARKET_DESCS: Record<string, keyof T> = {
  domestic: 'marketDomesticDesc',
  europe: 'marketEuropeDesc',
  asia: 'marketAsiaDesc',
};

const MON_NAMES: Record<string, keyof T> = {
  subscription: 'monSubName',
  freemium: 'monFreemiumName',
  transaction_fee: 'monTxName',
  advertising: 'monAdsName',
  licensing: 'monLicenseName',
};
const MON_DESCS: Record<string, keyof T> = {
  subscription: 'monSubDesc',
  freemium: 'monFreemiumDesc',
  transaction_fee: 'monTxDesc',
  advertising: 'monAdsDesc',
  licensing: 'monLicenseDesc',
};

const ISO_NAMES: Record<string, keyof T> = {
  iso_9001: 'iso9001Name',
};
const ISO_DESCS: Record<string, keyof T> = {
  iso_9001: 'iso9001Desc',
};

const ROLE_KEYS: Record<string, keyof T> = {
  developer: 'roleDeveloper',
  manager: 'roleManager',
  qa: 'roleQA',
  security: 'roleSecurity',
  marketing: 'roleMarketing',
};

const EVENT_TITLES: Record<string, keyof T> = {
  market_boom: 'eventMarketBoomTitle',
  market_downturn: 'eventMarketDownturnTitle',
  new_competitor: 'eventNewCompetitorTitle',
  team_conflict: 'eventTeamConflictTitle',
  innovation_spark: 'eventInnovationTitle',
  data_breach: 'eventDataBreachTitle',
  server_outage: 'eventServerOutageTitle',
  regulatory_fine: 'eventRegulatoryFineTitle',
  viral_growth: 'eventViralGrowthTitle',
  media_feature: 'eventMediaFeatureTitle',
  talent_arrives: 'eventTalentTitle',
  iso_audit_surprise: 'eventIsoAuditTitle',
  iso_recognition: 'eventIsoRecognitionTitle',
};
const EVENT_DESCS: Record<string, keyof T> = {
  market_boom: 'eventMarketBoomDesc',
  market_downturn: 'eventMarketDownturnDesc',
  new_competitor: 'eventNewCompetitorDesc',
  team_conflict: 'eventTeamConflictDesc',
  innovation_spark: 'eventInnovationDesc',
  data_breach: 'eventDataBreachDesc',
  server_outage: 'eventServerOutageDesc',
  regulatory_fine: 'eventRegulatoryFineDesc',
  viral_growth: 'eventViralGrowthDesc',
  media_feature: 'eventMediaFeatureDesc',
  talent_arrives: 'eventTalentDesc',
  iso_audit_surprise: 'eventIsoAuditDesc',
  iso_recognition: 'eventIsoRecognitionDesc',
};

function lookup(map: Record<string, keyof T>, id: string, t: T, fallback: string): string {
  const key = map[id];
  if (key) return t[key] as string;
  return fallback;
}

export function nicheName(id: string, t: T, fallback: string) { return lookup(NICHE_NAMES, id, t, fallback); }
export function nicheDesc(id: string, t: T, fallback: string) { return lookup(NICHE_DESCS, id, t, fallback); }
export function productName(id: string, t: T, fallback: string) { return lookup(PRODUCT_NAMES, id, t, fallback); }
export function productDesc(id: string, t: T, fallback: string) { return lookup(PRODUCT_DESCS, id, t, fallback); }
export function techName(id: string, t: T, fallback: string) { return lookup(TECH_NAMES, id, t, fallback); }
export function techDesc(id: string, t: T, fallback: string) { return lookup(TECH_DESCS, id, t, fallback); }
export function marketName(id: string, t: T, fallback: string) { return lookup(MARKET_NAMES, id, t, fallback); }
export function marketDesc(id: string, t: T, fallback: string) { return lookup(MARKET_DESCS, id, t, fallback); }
export function monName(id: string, t: T, fallback: string) { return lookup(MON_NAMES, id, t, fallback); }
export function monDesc(id: string, t: T, fallback: string) { return lookup(MON_DESCS, id, t, fallback); }
export function isoName(id: string, t: T, fallback: string) { return lookup(ISO_NAMES, id, t, fallback); }
export function isoDesc(id: string, t: T, fallback: string) { return lookup(ISO_DESCS, id, t, fallback); }
export function roleName(role: string, t: T) { return lookup(ROLE_KEYS, role, t, role); }
export function eventTitle(id: string, t: T, fallback: string) { return lookup(EVENT_TITLES, id, t, fallback); }
export function eventDesc(id: string, t: T, fallback: string) { return lookup(EVENT_DESCS, id, t, fallback); }

// Business Styles
const STYLE_NAMES: Record<string, keyof T> = {
  bootstrapped: 'styleBootstrappedName',
  vc_backed: 'styleVcName',
  enterprise_first: 'styleEnterpriseName',
};
const STYLE_DESCS: Record<string, keyof T> = {
  bootstrapped: 'styleBootstrappedDesc',
  vc_backed: 'styleVcDesc',
  enterprise_first: 'styleEnterpriseDesc',
};
export function styleName(id: string, t: T, fallback: string) { return lookup(STYLE_NAMES, id, t, fallback); }
export function styleDesc(id: string, t: T, fallback: string) { return lookup(STYLE_DESCS, id, t, fallback); }

// Tech Tree Nodes
const TT_NAMES: Record<string, keyof T> = {
  tt_architecture: 'ttArchitectureName',
  tt_infra: 'ttInfraName',
  tt_ai_ml: 'ttAiMlName',
  tt_security: 'ttSecurityName',
  tt_microservices: 'ttMicroservicesName',
  tt_social: 'ttSocialName',
  tt_shorts: 'ttShortsName',
  tt_community: 'ttCommunityName',
  tt_documentary: 'ttDocumentaryName',
  tt_conferences: 'ttConferencesName',
  tt_agile: 'ttAgileName',
  tt_ci_cd: 'ttCiCdName',
  tt_analytics: 'ttAnalyticsName',
  tt_devops: 'ttDevopsName',
  tt_automation: 'ttAutomationName',
};
const TT_DESCS: Record<string, keyof T> = {
  tt_architecture: 'ttArchitectureDesc',
  tt_infra: 'ttInfraDesc',
  tt_ai_ml: 'ttAiMlDesc',
  tt_security: 'ttSecurityDesc',
  tt_microservices: 'ttMicroservicesDesc',
  tt_social: 'ttSocialDesc',
  tt_shorts: 'ttShortsDesc',
  tt_community: 'ttCommunityDesc',
  tt_documentary: 'ttDocumentaryDesc',
  tt_conferences: 'ttConferencesDesc',
  tt_agile: 'ttAgileDesc',
  tt_ci_cd: 'ttCiCdDesc',
  tt_analytics: 'ttAnalyticsDesc',
  tt_devops: 'ttDevopsDesc',
  tt_automation: 'ttAutomationDesc',
};
export function ttNodeName(id: string, t: T, fallback: string) { return lookup(TT_NAMES, id, t, fallback); }
export function ttNodeDesc(id: string, t: T, fallback: string) { return lookup(TT_DESCS, id, t, fallback); }

// Furniture
const FURN_NAMES: Record<string, keyof T> = {
  desk: 'furnitureDeskName',
  meeting_room: 'furnitureMeetingName',
  server_room: 'furnitureServerName',
  lounge: 'furnitureLoungeName',
  stage: 'furnitureStageName',
};
const FURN_DESCS: Record<string, keyof T> = {
  desk: 'furnitureDeskDesc',
  meeting_room: 'furnitureMeetingDesc',
  server_room: 'furnitureServerDesc',
  lounge: 'furnitureLoungeDesc',
  stage: 'furnitureStageDesc',
};
export function furnitureName(type: string, t: T, fallback: string) { return lookup(FURN_NAMES, type, t, fallback); }
export function furnitureDesc(type: string, t: T, fallback: string) { return lookup(FURN_DESCS, type, t, fallback); }
