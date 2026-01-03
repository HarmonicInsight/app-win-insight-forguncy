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
    <div className="mt-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center">
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-content-primary">
          {t('analysis.results')}
        </h2>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
          label={t('analysis.tables')}
          value={summary.tableCount}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          label={t('analysis.pages')}
          value={summary.pageCount}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          label={t('analysis.workflows')}
          value={summary.workflowCount}
        />
      </div>

      {/* Review Results */}
      {reviewResult && (
        <div className="mt-4 bg-surface-secondary rounded-lg p-4 border border-border-light">
          <h3 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {t('review.issues')}
          </h3>
          <div className="flex items-center gap-3">
            <IssueBadge severity="high" count={reviewResult.summary.high} label={t('review.high')} />
            <IssueBadge severity="medium" count={reviewResult.summary.medium} label={t('review.medium')} />
            <IssueBadge severity="low" count={reviewResult.summary.low} label={t('review.low')} />
            <div className="text-xs text-content-muted ml-auto">
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
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-surface-secondary rounded-lg p-3 border border-border-light">
      <div className="flex items-center gap-3">
        <div className="text-accent">{icon}</div>
        <div>
          <div className="text-xl font-semibold text-content-primary">{value}</div>
          <div className="text-xs text-content-muted">{label}</div>
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
    high: 'bg-error-light text-error',
    medium: 'bg-warning-light text-warning',
    low: 'bg-surface-tertiary text-content-secondary',
  };

  return (
    <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${config[severity]}`}>
      {label}: {count}
    </div>
  );
}
