import { useState, useEffect, useCallback } from 'react';
import FileDropZone from './components/FileDropZone';
import ProgressBar from './components/ProgressBar';
import ResultsSummary from './components/ResultsSummary';
import OutputActions from './components/OutputActions';
import ProjectViewer from './components/ProjectViewer';
import LanguageSelector from './components/LanguageSelector';
import { useAnalysis } from './hooks/useAnalysis';
import { useI18n } from './hooks/useI18n';

export interface AnalysisOptionsState {
  generateSpec: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
}

function App() {
  const { t } = useI18n();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'generate' | 'view'>('generate');

  const {
    isAnalyzing,
    progress,
    progressMessage,
    result,
    error,
    startAnalysis,
    reset,
  } = useAnalysis();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getSettings();
        setOutputFolder(settings.outputFolder);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedFile(filePath);
    reset();
  }, [reset]);

  const handleStartAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    const options: AnalysisOptionsState = {
      generateSpec: true,
      codeReview: false,
      orgAnalysis: false,
      fixGuide: false,
    };

    await startAnalysis(selectedFile, options);
  }, [selectedFile, startAnalysis]);

  const handleSelectOutputFolder = async () => {
    const folder = await window.electronAPI.selectOutputFolder();
    if (folder) {
      setOutputFolder(folder);
      await window.electronAPI.saveSettings({
        outputFolder: folder,
        options: { generateSpec: true, codeReview: false, orgAnalysis: false, fixGuide: false },
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Header */}
      <header className="bg-surface-primary border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo/Icon */}
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-content-primary leading-tight">
                {t('app.title')}
              </h1>
              <p className="text-2xs text-content-muted">{t('app.subtitle')}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6">
        <div className="bg-surface-primary border border-border rounded-xl shadow-card overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="flex px-1" aria-label="Tabs">
              <TabButton
                active={activeTab === 'generate'}
                onClick={() => setActiveTab('generate')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                仕様書生成
              </TabButton>
              <TabButton
                active={activeTab === 'view'}
                onClick={() => setActiveTab('view')}
                disabled={!result?.analysisResult}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                }
              >
                プロジェクト内容
              </TabButton>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'generate' ? (
              <div className="space-y-6 animate-fade-in">
                {/* File Drop Zone */}
                <FileDropZone
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  disabled={isAnalyzing}
                />

                {/* Output Settings Card */}
                <div className="bg-surface-secondary rounded-lg border border-border-light p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-content-primary">
                        {t('output.folder')}
                      </h3>
                      <p className="text-sm text-content-secondary truncate mt-0.5">
                        {outputFolder || (
                          <span className="text-content-muted italic">{t('output.notSet')}</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleSelectOutputFolder}
                      disabled={isAnalyzing}
                      className="px-3 py-1.5 text-sm font-medium text-content-secondary bg-surface-primary border border-border rounded-lg hover:bg-surface-secondary hover:border-border-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('output.change')}
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStartAnalysis}
                  disabled={!selectedFile || isAnalyzing}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
                    !selectedFile || isAnalyzing
                      ? 'bg-border text-content-muted cursor-not-allowed'
                      : 'bg-accent text-white hover:bg-accent-hover shadow-soft hover:shadow-medium'
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('analysis.analyzing')}
                    </span>
                  ) : (
                    t('analysis.start')
                  )}
                </button>

                {/* Progress */}
                {isAnalyzing && (
                  <ProgressBar progress={progress} message={progressMessage} />
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-error-light border border-error/20 rounded-lg animate-slide-up">
                    <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* Results */}
                {result && result.success && (
                  <div className="space-y-4 animate-slide-up">
                    <ResultsSummary
                      analysisResult={result.analysisResult!}
                      reviewResult={null}
                    />
                    <OutputActions
                      outputDir={result.outputDir!}
                      generatedFiles={result.generatedFiles!}
                    />
                  </div>
                )}
              </div>
            ) : (
              result?.analysisResult && (
                <div className="animate-fade-in">
                  <ProjectViewer analysisResult={result.analysisResult} />
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-primary">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-content-muted">
            Forguncy Analyzer v1.0.0
          </p>
          <p className="text-xs text-content-muted">
            {t('app.footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  disabled,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-accent'
          : disabled
          ? 'text-content-muted cursor-not-allowed'
          : 'text-content-secondary hover:text-content-primary'
      }`}
    >
      {icon}
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
      )}
    </button>
  );
}

export default App;
