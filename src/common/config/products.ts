// 製品定義・機能フラグ
export interface ProductConfig {
  code: string;
  name: string;
  version: string;
  description: string;
  features: FeatureFlags;
  tiers: TierConfig[];
}

export interface FeatureFlags {
  maxProjects: number;
  maxTables: number;
  maxPages: number;
  specGeneration: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
  customRules: boolean;
  batchProcessing: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface TierConfig {
  code: 'TRIAL' | 'STD' | 'PRO' | 'ENT';
  name: string;
  nameJa: string;
  duration: 'trial' | 'annual' | 'perpetual';
  trialDays?: number;
  price?: number;
  features: Partial<FeatureFlags>;
}

export const PRODUCT_CONFIG: ProductConfig = {
  code: 'FGCY',
  name: 'Forguncy Analyzer Pro',
  version: '1.0.0',
  description: 'Forguncyプロジェクト解析・仕様書自動生成ツール',
  features: {
    maxProjects: 1,
    maxTables: 10,
    maxPages: 20,
    specGeneration: true,
    codeReview: false,
    orgAnalysis: false,
    fixGuide: false,
    customRules: false,
    batchProcessing: false,
    apiAccess: false,
    prioritySupport: false,
  },
  tiers: [
    {
      code: 'TRIAL',
      name: 'Trial',
      nameJa: 'トライアル',
      duration: 'trial',
      trialDays: 14,
      features: {
        maxProjects: 3,
        maxTables: 100,
        maxPages: 200,
        specGeneration: true,
        codeReview: true,
        orgAnalysis: true,
        fixGuide: true,
      },
    },
    {
      code: 'STD',
      name: 'Standard',
      nameJa: 'スタンダード',
      duration: 'annual',
      price: 49800,
      features: {
        maxProjects: 10,
        maxTables: 100,
        maxPages: 200,
        specGeneration: true,
        codeReview: true,
        orgAnalysis: true,
        fixGuide: true,
      },
    },
    {
      code: 'PRO',
      name: 'Professional',
      nameJa: 'プロフェッショナル',
      duration: 'annual',
      price: 98000,
      features: {
        maxProjects: -1, // unlimited
        maxTables: -1,
        maxPages: -1,
        specGeneration: true,
        codeReview: true,
        orgAnalysis: true,
        fixGuide: true,
        customRules: true,
        batchProcessing: true,
        prioritySupport: true,
      },
    },
    {
      code: 'ENT',
      name: 'Enterprise',
      nameJa: 'エンタープライズ',
      duration: 'perpetual',
      features: {
        maxProjects: -1,
        maxTables: -1,
        maxPages: -1,
        specGeneration: true,
        codeReview: true,
        orgAnalysis: true,
        fixGuide: true,
        customRules: true,
        batchProcessing: true,
        apiAccess: true,
        prioritySupport: true,
      },
    },
  ],
};

export function getFeatureLimits(tierCode: string): FeatureFlags {
  const tier = PRODUCT_CONFIG.tiers.find((t) => t.code === tierCode);
  if (!tier) {
    return PRODUCT_CONFIG.features; // デフォルト（無料版）の制限
  }
  return { ...PRODUCT_CONFIG.features, ...tier.features };
}

export function getTierByCode(tierCode: string): TierConfig | undefined {
  return PRODUCT_CONFIG.tiers.find((t) => t.code === tierCode);
}
