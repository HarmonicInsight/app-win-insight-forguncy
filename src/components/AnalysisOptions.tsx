import { AnalysisOptionsState } from '../App';

interface Props {
  options: AnalysisOptionsState;
  onChange: (options: AnalysisOptionsState) => void;
  disabled: boolean;
}

export default function AnalysisOptions({ options, onChange, disabled }: Props) {
  const handleChange = (key: keyof AnalysisOptionsState) => {
    onChange({
      ...options,
      [key]: !options[key],
    });
  };

  const optionItems = [
    {
      key: 'generateSpec' as const,
      label: '仕様書生成',
      description: 'Word形式の詳細仕様書を生成',
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
      label: 'コードレビュー',
      description: 'セキュリティ・バグリスクを検出',
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
      label: '組織変更分析',
      description: '人事異動時の影響箇所を特定',
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
      label: '修正ガイド',
      description: '問題の修正手順書を生成',
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
        解析オプション
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {optionItems.map((item) => (
          <label
            key={item.key}
            className={`
              flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300 hover:bg-indigo-50'}
              ${options[item.key] ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}
            `}
          >
            <input
              type="checkbox"
              checked={options[item.key]}
              onChange={() => !disabled && handleChange(item.key)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={`
                flex-shrink-0 w-5 h-5 rounded border-2 mr-3 mt-0.5 flex items-center justify-center
                ${options[item.key] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}
              `}
            >
              {options[item.key] && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className={`mr-2 ${options[item.key] ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span className="font-medium text-gray-800">{item.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
