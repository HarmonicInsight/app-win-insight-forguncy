import { useState } from 'react';
import { useLicense } from '../hooks/useLicense';
import { useI18n } from '../hooks/useI18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LicensePanel({ isOpen, onClose }: Props) {
  const { t, formatDate } = useI18n();
  const { license, activateLicense, clearLicense, getTierName, generateTestKey } = useLicense();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);

  if (!isOpen) return null;

  const handleActivate = () => {
    setError(null);
    const result = activateLicense(inputKey.trim());
    if (!result.isValid) {
      setError(result.errorMessage || t('license.invalidKey'));
    } else {
      setInputKey('');
    }
  };

  const handleGenerateTestKey = (tier: 'TRIAL' | 'STD' | 'PRO' | 'ENT') => {
    const key = generateTestKey(tier);
    setInputKey(key);
  };

  const tierColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-800',
    TRIAL: 'bg-blue-100 text-blue-800',
    STD: 'bg-green-100 text-green-800',
    PRO: 'bg-purple-100 text-purple-800',
    ENT: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{t('license.title')}</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 現在のライセンス状態 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('license.currentTier')}</h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierColors[license?.tier || 'FREE']}`}>
                {getTierName()}
              </span>
              {license?.expiresAt && (
                <span className="text-sm text-gray-500">
                  {t('license.expiresAt')}: {formatDate(license.expiresAt, 'long')}
                </span>
              )}
            </div>
          </div>

          {/* 機能制限 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('license.restrictions')}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">{t('license.maxProjects')}</div>
                <div className="font-medium">
                  {license?.features.maxProjects === -1 ? t('license.unlimited') : license?.features.maxProjects}
                </div>
              </div>
              <div>
                <div className="text-gray-500">{t('license.maxTables')}</div>
                <div className="font-medium">
                  {license?.features.maxTables === -1 ? t('license.unlimited') : license?.features.maxTables}
                </div>
              </div>
              <div>
                <div className="text-gray-500">{t('license.maxPages')}</div>
                <div className="font-medium">
                  {license?.features.maxPages === -1 ? t('license.unlimited') : license?.features.maxPages}
                </div>
              </div>
            </div>
          </div>

          {/* ライセンスキー入力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('license.enterKey')}
            </label>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value.toUpperCase())}
              placeholder="INS-FGCY-STD-XXXX-XXXX-XX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleActivate}
              disabled={!inputKey.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {t('license.activate')}
            </button>
            {license?.tier !== 'FREE' && (
              <button
                onClick={clearLicense}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.delete')}
              </button>
            )}
          </div>

          {/* 開発者ツール（開発時のみ表示） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowDevTools(!showDevTools)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {showDevTools ? '開発者ツールを隠す' : '開発者ツールを表示'}
              </button>
              {showDevTools && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-500">テスト用ライセンスキー生成:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['TRIAL', 'STD', 'PRO', 'ENT'] as const).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => handleGenerateTestKey(tier)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
