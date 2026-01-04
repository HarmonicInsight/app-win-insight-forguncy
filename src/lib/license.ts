/**
 * Insight Series License Management - TypeScript
 * Tauri/React製品向けライセンス管理モジュール
 */

export interface LicenseInfo {
  isValid: boolean;
  product: ProductCode | null;
  tier: LicenseTier | null;
  expiresAt: Date | null;
  error?: string;
}

export type ProductCode = 'SALES' | 'SLIDE' | 'PY' | 'INTV' | 'FORG' | 'ALL';
export type LicenseTier = 'TRIAL' | 'STD' | 'PRO' | 'ENT';

export const PRODUCT_NAMES: Record<ProductCode, string> = {
  SALES: 'SalesInsight',
  SLIDE: 'InsightSlide',
  PY: 'InsightPy',
  INTV: 'InterviewInsight',
  FORG: 'InsightForguncy',
  ALL: 'Insight Series Bundle',
};

export const TIER_NAMES: Record<LicenseTier, string> = {
  TRIAL: 'Trial',
  STD: 'Standard',
  PRO: 'Professional',
  ENT: 'Enterprise',
};

/**
 * ティア定義
 * - durationDays: 日数ベースの期限（TRIAL用）
 * - durationMonths: 月数ベースの期限（STD/PRO用）
 * - null: 永久ライセンス（ENT用）
 */
export const TIERS: Record<LicenseTier, {
  name: string;
  nameJa: string;
  durationMonths: number | null;
  durationDays?: number;
}> = {
  TRIAL: { name: 'Trial', nameJa: 'トライアル', durationMonths: null, durationDays: 14 },
  STD: { name: 'Standard', nameJa: 'スタンダード', durationMonths: 12 },
  PRO: { name: 'Professional', nameJa: 'プロフェッショナル', durationMonths: 12 },
  ENT: { name: 'Enterprise', nameJa: 'エンタープライズ', durationMonths: null },
};

/**
 * 機能制限定義
 */
export interface FeatureLimits {
  maxFiles: number;
  maxRecords: number;
  batchProcessing: boolean;
  export: boolean;
  cloudSync: boolean;
  priority: boolean;
}

export const TIER_LIMITS: Record<LicenseTier, FeatureLimits> = {
  TRIAL: {
    maxFiles: 10,
    maxRecords: 500,
    batchProcessing: true,
    export: true,
    cloudSync: false,
    priority: false,
  },
  STD: {
    maxFiles: 50,
    maxRecords: 5000,
    batchProcessing: true,
    export: true,
    cloudSync: false,
    priority: false,
  },
  PRO: {
    maxFiles: Infinity,
    maxRecords: 50000,
    batchProcessing: true,
    export: true,
    cloudSync: true,
    priority: true,
  },
  ENT: {
    maxFiles: Infinity,
    maxRecords: Infinity,
    batchProcessing: true,
    export: true,
    cloudSync: true,
    priority: true,
  },
};

/**
 * ライセンスキーのフォーマット検証用正規表現
 * 形式: INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
 */
const LICENSE_KEY_REGEX = /^INS-(SALES|SLIDE|PY|INTV|FORG|ALL)-(TRIAL|STD|PRO|ENT)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$/;

/**
 * チェックサムを計算する
 */
function calculateChecksum(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i) * (i + 1);
  }
  const checksum = (sum % 1296).toString(36).toUpperCase().padStart(2, '0');
  return checksum;
}

/**
 * ライセンスバリデーター
 */
export class LicenseValidator {
  /**
   * ライセンスキーを検証する
   * @param licenseKey ライセンスキー
   * @param storedExpiresAt 保存されている有効期限（任意）
   */
  validate(licenseKey: string, storedExpiresAt?: Date): LicenseInfo {
    if (!licenseKey) {
      return {
        isValid: false,
        product: null,
        tier: null,
        expiresAt: null,
        error: 'License key is required',
      };
    }

    const normalized = licenseKey.trim().toUpperCase();
    const match = normalized.match(LICENSE_KEY_REGEX);

    if (!match) {
      return {
        isValid: false,
        product: null,
        tier: null,
        expiresAt: null,
        error: 'Invalid license key format',
      };
    }

    const [, product, tier, part1, part2, providedChecksum] = match;

    // チェックサム検証
    const baseKey = `INS-${product}-${tier}-${part1}-${part2}`;
    const expectedChecksum = calculateChecksum(baseKey);

    if (providedChecksum !== expectedChecksum) {
      return {
        isValid: false,
        product: null,
        tier: null,
        expiresAt: null,
        error: 'Invalid checksum',
      };
    }

    // 有効期限の決定
    let expiresAt: Date | null = storedExpiresAt || null;

    // 期限切れチェック (ENT は期限なし)
    if (tier !== 'ENT' && expiresAt) {
      if (expiresAt < new Date()) {
        return {
          isValid: false,
          product: product as ProductCode,
          tier: tier as LicenseTier,
          expiresAt,
          error: 'License expired',
        };
      }
    }

    return {
      isValid: true,
      product: product as ProductCode,
      tier: tier as LicenseTier,
      expiresAt,
    };
  }

  /**
   * 製品がライセンスでカバーされているかチェック
   */
  isProductCovered(licenseInfo: LicenseInfo, targetProduct: ProductCode): boolean {
    if (!licenseInfo.isValid || !licenseInfo.product) {
      return false;
    }

    // ALLライセンスは全製品をカバー
    if (licenseInfo.product === 'ALL') {
      return true;
    }

    return licenseInfo.product === targetProduct;
  }
}

/**
 * 機能制限を取得
 */
export function getFeatureLimits(tier: LicenseTier | null): FeatureLimits {
  if (!tier) {
    return TIER_LIMITS.TRIAL; // デフォルトはTRIAL制限
  }
  return TIER_LIMITS[tier];
}

/**
 * ライセンスキー生成オプション
 */
export interface GenerateOptions {
  productCode: ProductCode;
  tier: LicenseTier;
  expiresAt?: Date;  // 指定しない場合はティアのデフォルト期間
}

/**
 * デフォルトの有効期限を計算
 */
function calculateDefaultExpiry(tier: LicenseTier): Date | null {
  const tierConfig = TIERS[tier];

  // 日数ベースの期限 (TRIAL用)
  if (tierConfig.durationDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + tierConfig.durationDays);
    return expiry;
  }

  // 月数ベースの期限 (STD, PRO用)
  if (tierConfig.durationMonths) {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + tierConfig.durationMonths);
    return expiry;
  }

  return null; // 永久ライセンス (ENT)
}

/**
 * ライセンスキーを生成する
 */
export function generateLicenseKey(options: GenerateOptions): string {
  const { productCode, tier, expiresAt } = options;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const part1 = randomPart();
  const part2 = randomPart();
  const baseKey = `INS-${productCode}-${tier}-${part1}-${part2}`;
  const checksum = calculateChecksum(baseKey);

  return `${baseKey}-${checksum}`;
}

/**
 * ライセンスキーと有効期限を一緒に生成
 */
export function generateLicenseWithExpiry(options: GenerateOptions): {
  licenseKey: string;
  expiresAt: Date | null;
} {
  const licenseKey = generateLicenseKey(options);
  const expiresAt = options.expiresAt || calculateDefaultExpiry(options.tier);

  return { licenseKey, expiresAt };
}

export default LicenseValidator;
