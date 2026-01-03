import { useI18n } from '../hooks/useI18n';

interface Props {
  outputDir: string;
  generatedFiles: string[];
}

export default function OutputActions({ outputDir, generatedFiles }: Props) {
  const { t } = useI18n();

  const handleOpenFolder = async () => {
    await window.electronAPI.openFolder(outputDir);
  };

  const handleOpenFile = async (filePath: string) => {
    await window.electronAPI.openFile(filePath);
  };

  const getFileName = (path: string) => {
    return path.split(/[/\\]/).pop() || path;
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.includes('仕様書') || fileName.includes('Spec')) {
      return (
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (fileName.includes('レビュー') || fileName.includes('Review')) {
      return (
        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="animate-slide-up">
      <h3 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-3 flex items-center">
        <svg className="w-4 h-4 mr-1.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        {t('output.generatedFiles')}
      </h3>

      <div className="space-y-2">
        {generatedFiles.map((file, index) => (
          <button
            key={index}
            onClick={() => handleOpenFile(file)}
            className="w-full flex items-center p-3 bg-surface-primary border border-border rounded-lg hover:border-accent/50 hover:bg-accent-light/30 transition-all group"
          >
            {getFileIcon(getFileName(file))}
            <span className="ml-3 text-sm text-content-primary group-hover:text-accent flex-1 text-left truncate">
              {getFileName(file)}
            </span>
            <svg className="w-4 h-4 text-content-muted group-hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        ))}
      </div>

      <button
        onClick={handleOpenFolder}
        className="mt-3 w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-accent bg-accent-light rounded-lg hover:bg-accent-muted transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        {t('output.openFolder')}
      </button>
    </div>
  );
}
