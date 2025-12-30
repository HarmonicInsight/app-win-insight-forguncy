import { AnalysisOptionsState } from '../App';
import { useI18n } from '../hooks/useI18n';

interface RestrictedFeatures {
  codeReview?: boolean;
  orgAnalysis?: boolean;
  fixGuide?: boolean;
}

interface Props {
  options: AnalysisOptionsState;
  onChange: (options: AnalysisOptionsState) => void;
  disabled: boolean;
  restrictedFeatures?: RestrictedFeatures;
  onUpgradeClick?: () => void;
}

export default function AnalysisOptions({
  options,
  onChange,
  disabled,
  restrictedFeatures = {},
  onUpgradeClick,
}: Props) {
  const { t } = useI18n();

  const handleChange = (key: keyof AnalysisOptionsState) => {
    // If feature is restricted, show upgrade prompt instead
    if (restrictedFeatures[key as keyof RestrictedFeatures] && onUpgradeClick) {
      onUpgradeClick();
      return;
    }

    onChange({
      ...options,
      [key]: !options[key],
    });
  };

  const optionItems = [
    {
      key: 'generateSpec' as const,
      label: t('options.generateSpec'),
      description: t('options.generateSpecDesc'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      key: 'codeReview' as const,
      label: t('options.codeReview'),
      description: t('options.codeReviewDesc'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      key: 'orgAnalysis' as const,
      label: t('options.orgAnalysis'),
      description: t('options.orgAnalysisDesc'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      key: 'fixGuide' as const,
      label: t('options.fixGuide'),
      description: t('options.fixGuideDesc'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  const isRestricted = (key: keyof AnalysisOptionsState): boolean => {
    return !!restrictedFeatures[key as keyof RestrictedFeatures];
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {t('options.title')}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {optionItems.map((item) => {
          const restricted = isRestricted(item.key);
          const checked = options[item.key] && !restricted;

          return (
            <label
              key={item.key}
              className={`
                relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${restricted ? 'border-gray-200 bg-gray-50' : 'hover:border-indigo-300 hover:bg-indigo-50'}
                ${checked ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}
              `}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => !disabled && handleChange(item.key)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={`
                  flex-shrink-0 w-5 h-5 rounded border-2 mr-3 mt-0.5 flex items-center justify-center
                  ${restricted ? 'bg-gray-200 border-gray-300' : ''}
                  ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}
                `}
              >
                {restricted ? (
                  <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : checked ? (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className={`mr-2 ${checked ? 'text-indigo-600' : restricted ? 'text-gray-400' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`font-medium ${restricted ? 'text-gray-500' : 'text-gray-800'}`}>
                    {item.label}
                  </span>
                  {restricted && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${restricted ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.description}
                </p>
                {restricted && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onUpgradeClick?.();
                    }}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {t('license.upgradeCta')} →
                  </button>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
