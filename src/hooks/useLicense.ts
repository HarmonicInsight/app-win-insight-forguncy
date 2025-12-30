/**
 * ライセンス管理 React フック
 */
import { useState, useCallback, useEffect } from 'react';
import { LicenseManager, LicenseInfo, generateLicenseKey } from '../common/license';
import { PRODUCT_CONFIG } from '../common/config/products';

const licenseManager = new LicenseManager();

export function useLicense() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にライセンスを読み込み
  useEffect(() => {
    const loadedLicense = licenseManager.loadLicense();
    setLicense(loadedLicense);
    setIsLoading(false);
  }, []);

  // ライセンスをアクティベート
  const activateLicense = useCallback((licenseKey: string) => {
    const result = licenseManager.saveLicense(licenseKey);
    setLicense(result);
    return result;
  }, []);

  // ライセンスをクリア
  const clearLicense = useCallback(() => {
    licenseManager.clearLicense();
    const freeLicense = licenseManager.loadLicense();
    setLicense(freeLicense);
  }, []);

  // 機能が利用可能かチェック
  const canUseFeature = useCallback(
    (feature: keyof LicenseInfo['features']) => {
      if (!license) return false;
      const value = license.features[feature];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      return false;
    },
    [license]
  );

  // 制限内かチェック
  const isWithinLimit = useCallback(
    (feature: 'maxProjects' | 'maxTables' | 'maxPages', count: number) => {
      if (!license) return false;
      const limit = license.features[feature];
      if (limit === -1) return true; // unlimited
      return count <= limit;
    },
    [license]
  );

  // ティア名を取得
  const getTierName = useCallback(() => {
    if (!license) return '';
    const tierConfig = PRODUCT_CONFIG.tiers.find((t) => t.code === license.tier);
    return tierConfig?.nameJa || license.tier;
  }, [license]);

  return {
    license,
    isLoading,
    activateLicense,
    clearLicense,
    canUseFeature,
    isWithinLimit,
    getTierName,
    // 開発用
    generateTestKey: (tier: 'TRIAL' | 'STD' | 'PRO' | 'ENT') =>
      generateLicenseKey(PRODUCT_CONFIG.code, tier),
  };
}
