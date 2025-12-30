import { useI18n } from '../hooks/useI18n';

interface AnalysisResult {
  projectName: string;
  summary: {
    tableCount: number;
    pageCount: number;
    workflowCount: number;
    serverCommandCount: number;
    totalColumns: number;
    totalRelations: number;
  };
}

interface ReviewResult {
  summary: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

interface Props {
  analysisResult: AnalysisResult;
  reviewResult?: ReviewResult | null;
}

export default function ResultsSummary({ analysisResult, reviewResult }: Props) {
  const { t } = useI18n();
  const summary = analysisResult.summary;

  return (
    <div className="mt-8 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {t('analysis.results')}
      </h2>

      {/* プロジェクト統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          }
          label={t('analysis.tables')}
          value={summary.tableCount}
          color="blue"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          label={t('analysis.pages')}
          value={summary.pageCount}
          color="green"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          }
          label={t('analysis.workflows')}
          value={summary.workflowCount}
          color="purple"
        />
      </div>

      {/* レビュー結果 */}
      {reviewResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {t('review.issues')}
          </h3>
          <div className="flex items-center space-x-4">
            <IssueBadge severity="high" count={reviewResult.summary.high} label={t('review.high')} />
            <IssueBadge severity="medium" count={reviewResult.summary.medium} label={t('review.medium')} />
            <IssueBadge severity="low" count={reviewResult.summary.low} label={t('review.low')} />
            <div className="text-sm text-gray-500 ml-auto">
              {t('review.total')}: {reviewResult.summary.total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="mr-3">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-75">{label}</div>
        </div>
      </div>
    </div>
  );
}

interface IssueBadgeProps {
  severity: 'high' | 'medium' | 'low';
  count: number;
  label: string;
}

function IssueBadge({ severity, count, label }: IssueBadgeProps) {
  const config = {
    high: {
      bg: 'bg-red-100',
      text: 'text-red-800',
    },
    medium: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
    },
    low: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
    },
  };

  const { bg, text } = config[severity];

  return (
    <div className={`px-3 py-1 rounded-full ${bg}`}>
      <span className={`text-sm font-medium ${text}`}>
        {label}: {count}
      </span>
    </div>
  );
}
