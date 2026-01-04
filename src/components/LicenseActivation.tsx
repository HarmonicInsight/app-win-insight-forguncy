import { useState } from 'react';
import { useLicenseStore } from '../stores/licenseStore';
import { TIER_NAMES } from '@insight/license';
import { useI18n } from '../contexts/I18nContext';

export function LicenseActivation() {
  const [inputKey, setInputKey] = useState('');
  const { licenseInfo, isActivated, setLicense, clearLicense } = useLicenseStore();
  const { t } = useI18n();

  const handleActivate = () => {
    if (inputKey.trim()) {
      setLicense(inputKey.trim());
    }
  };

  if (isActivated && licenseInfo) {
    return (
      <div className="bg-surface-secondary rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-light text-success">
              {t('license.activated')}
            </span>
            <span className="text-sm font-medium text-content-primary">
              {TIER_NAMES[licenseInfo.tier!]}
            </span>
          </div>
        </div>
        {licenseInfo.expiresAt && (
          <p className="text-sm text-content-secondary">
            {t('license.expiresAt')}: {licenseInfo.expiresAt.toLocaleDateString('ja-JP')}
          </p>
        )}
        <button
          onClick={clearLicense}
          className="text-sm text-content-muted hover:text-error transition-colors"
        >
          {t('license.deactivate')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary rounded-lg border border-border p-4 space-y-3">
      <h3 className="text-sm font-medium text-content-primary">{t('license.title')}</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="INS-SLIDE-XXX-XXXX-XXXX-XX"
          className="flex-1 px-3 py-2 text-sm bg-surface-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
        <button
          onClick={handleActivate}
          disabled={!inputKey.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('license.activate')}
        </button>
      </div>
      {licenseInfo && !licenseInfo.isValid && (
        <p className="text-sm text-error">{licenseInfo.error}</p>
      )}
      <p className="text-xs text-content-muted">
        {t('license.currentTier')}: {t('license.free')}
      </p>
    </div>
  );
}
