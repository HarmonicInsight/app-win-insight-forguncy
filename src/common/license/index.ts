/**
 * Insight Series ライセンス管理モジュール
 *
 * ライセンスキー形式: INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
 * 例: INS-FGCY-STD-A1B2-C3D4-X7
 */

import { PRODUCT_CONFIG, getFeatureLimits, FeatureFlags } from '../config/products';

export interface LicenseInfo {
  isValid: boolean;
  productCode: string;
  tier: 'TRIAL' | 'STD' | 'PRO' | 'ENT' | 'FREE';
  expiresAt: Date | null;
  machineId: string | null;
  features: FeatureFlags;
  errorCode?: LicenseErrorCode;
  errorMessage?: string;
}

export type LicenseErrorCode =
  | 'INVALID_FORMAT'
  | 'INVALID_PRODUCT'
  | 'INVALID_CHECKSUM'
  | 'EXPIRED'
  | 'MACHINE_MISMATCH'
  | 'NOT_ACTIVATED';

export interface StoredLicense {
  key: string;
  activatedAt: string;
  machineId: string;
  expiresAt?: string;
}

const LICENSE_STORAGE_KEY = 'insight_license';
const MACHINE_ID_KEY = 'insight_machine_id';

/**
 * ライセンスバリデーター
 */
export class LicenseValidator {
  private productCode: string;

  constructor(productCode: string = PRODUCT_CONFIG.code) {
    this.productCode = productCode;
  }

  /**
   * ライセンスキーを検証
   */
  validate(licenseKey: string): LicenseInfo {
    // 空の場合は無料版
    if (!licenseKey || licenseKey.trim() === '') {
      return this.createFreeInfo();
    }

    // 形式チェック: INS-XXXX-XXX-XXXX-XXXX-XX
    const pattern = /^INS-([A-Z]{2,5})-([A-Z]{2,5})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$/;
    const match = licenseKey.toUpperCase().match(pattern);

    if (!match) {
      return this.createInvalidInfo('INVALID_FORMAT', 'ライセンスキーの形式が正しくありません');
    }

    const [, productCode, tierCode, seg1, seg2, checksum] = match;

    // 製品コードチェック
    if (productCode !== this.productCode) {
      return this.createInvalidInfo('INVALID_PRODUCT', `この製品（${this.productCode}）用のライセンスキーではありません`);
    }

    // チェックサム検証
    const expectedChecksum = this.calculateChecksum(productCode, tierCode, seg1, seg2);
    if (checksum !== expectedChecksum) {
      return this.createInvalidInfo('INVALID_CHECKSUM', 'ライセンスキーが無効です');
    }

    // 有効期限チェック
    const expiresAt = this.decodeExpiration(seg1, seg2);
    if (expiresAt && expiresAt < new Date()) {
      return this.createInvalidInfo('EXPIRED', 'ライセンスの有効期限が切れています');
    }

    // 有効なライセンス
    const tier = tierCode as 'TRIAL' | 'STD' | 'PRO' | 'ENT';
    return {
      isValid: true,
      productCode,
      tier,
      expiresAt,
      machineId: null,
      features: getFeatureLimits(tier),
    };
  }

  /**
   * チェックサム計算（簡易版）
   */
  private calculateChecksum(product: string, tier: string, seg1: string, seg2: string): string {
    const input = `${product}${tier}${seg1}${seg2}`;
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += input.charCodeAt(i) * (i + 1);
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const c1 = chars[sum % chars.length];
    const c2 = chars[Math.floor(sum / chars.length) % chars.length];
    return c1 + c2;
  }

  /**
   * 有効期限をデコード（セグメントから日付を復元）
   */
  private decodeExpiration(seg1: string, seg2: string): Date | null {
    try {
      // セグメントから年月日をデコード（簡易実装）
      // 実際の実装では暗号化されたタイムスタンプを使用
      const combined = seg1 + seg2;
      const yearOffset = parseInt(combined.slice(0, 2), 36);
      const month = parseInt(combined.slice(2, 4), 36) % 12;
      const day = (parseInt(combined.slice(4, 6), 36) % 28) + 1;

      const year = 2024 + yearOffset;
      return new Date(year, month, day);
    } catch {
      return null;
    }
  }

  /**
   * 無料版の情報を作成
   */
  private createFreeInfo(): LicenseInfo {
    return {
      isValid: true,
      productCode: this.productCode,
      tier: 'FREE',
      expiresAt: null,
      machineId: null,
      features: getFeatureLimits('FREE'),
    };
  }

  /**
   * 無効なライセンス情報を作成
   */
  private createInvalidInfo(errorCode: LicenseErrorCode, errorMessage: string): LicenseInfo {
    return {
      isValid: false,
      productCode: this.productCode,
      tier: 'FREE',
      expiresAt: null,
      machineId: null,
      features: getFeatureLimits('FREE'),
      errorCode,
      errorMessage,
    };
  }
}

/**
 * ライセンスキー生成（開発・テスト用）
 */
export function generateLicenseKey(
  productCode: string,
  tierCode: string,
  _expiresAt?: Date
): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  // セグメント生成
  const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  // チェックサム計算
  const input = `${productCode}${tierCode}${seg1}${seg2}`;
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i) * (i + 1);
  }
  const c1 = chars[sum % chars.length];
  const c2 = chars[Math.floor(sum / chars.length) % chars.length];
  const checksum = c1 + c2;

  return `INS-${productCode}-${tierCode}-${seg1}-${seg2}-${checksum}`;
}

/**
 * ライセンスマネージャー（永続化対応）
 */
export class LicenseManager {
  private validator: LicenseValidator;
  private storage: Storage | null;

  constructor(storage?: Storage) {
    this.validator = new LicenseValidator();
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  /**
   * 保存されたライセンスを読み込む
   */
  loadLicense(): LicenseInfo {
    if (!this.storage) {
      return this.validator.validate('');
    }

    try {
      const stored = this.storage.getItem(LICENSE_STORAGE_KEY);
      if (stored) {
        const data: StoredLicense = JSON.parse(stored);
        return this.validator.validate(data.key);
      }
    } catch {
      // 読み込みエラー時は無料版
    }

    return this.validator.validate('');
  }

  /**
   * ライセンスを保存
   */
  saveLicense(licenseKey: string): LicenseInfo {
    const result = this.validator.validate(licenseKey);

    if (result.isValid && this.storage) {
      const stored: StoredLicense = {
        key: licenseKey,
        activatedAt: new Date().toISOString(),
        machineId: this.getMachineId(),
        expiresAt: result.expiresAt?.toISOString(),
      };
      this.storage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(stored));
    }

    return result;
  }

  /**
   * ライセンスを削除
   */
  clearLicense(): void {
    if (this.storage) {
      this.storage.removeItem(LICENSE_STORAGE_KEY);
    }
  }

  /**
   * マシンIDを取得（簡易実装）
   */
  private getMachineId(): string {
    if (!this.storage) return 'unknown';

    let machineId = this.storage.getItem(MACHINE_ID_KEY);
    if (!machineId) {
      machineId = `M${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
      this.storage.setItem(MACHINE_ID_KEY, machineId);
    }
    return machineId;
  }
}

export { getFeatureLimits };
