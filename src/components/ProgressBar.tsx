import { useI18n } from '../hooks/useI18n';

interface Props {
  progress: number;
  message: string;
}

export default function ProgressBar({ progress, message }: Props) {
  const { t } = useI18n();

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-content-secondary">{message}</span>
        <span className="text-sm font-medium text-accent">{progress}%</span>
      </div>
      <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-center text-content-muted text-sm">
        <svg
          className="animate-spin mr-2 h-4 w-4 text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {t('common.processing')}
      </div>
    </div>
  );
}
