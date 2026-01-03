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

  // 設定を読み込む
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

    // 仕様書生成のみ
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              {t('app.title')}
            </h1>
            <LanguageSelector />
          </div>
          <p className="text-white/80">{t('app.subtitle')}</p>
        </header>

        <main className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* タブ */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                仕様書生成
              </div>
            </button>
            <button
              onClick={() => setActiveTab('view')}
              disabled={!result?.analysisResult}
              className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
                activeTab === 'view'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : result?.analysisResult
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                プロジェクト内容
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'generate' ? (
              <>
                {/* ファイルドロップゾーン */}
                <FileDropZone
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  disabled={isAnalyzing}
                />

                {/* 出力フォルダ設定 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">{t('output.folder')}</h3>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {outputFolder || t('output.notSet')}
                      </p>
                    </div>
                    <button
                      onClick={handleSelectOutputFolder}
                      disabled={isAnalyzing}
                      className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t('output.change')}
                    </button>
                  </div>
                </div>

                {/* 解析開始ボタン */}
                <div className="mt-6">
                  <button
                    onClick={handleStartAnalysis}
                    disabled={!selectedFile || isAnalyzing}
                    className={`w-full py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-[1.02] ${
                      !selectedFile || isAnalyzing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        {t('analysis.analyzing')}
                      </span>
                    ) : (
                      t('analysis.start')
                    )}
                  </button>
                </div>

                {/* 進捗表示 */}
                {isAnalyzing && (
                  <ProgressBar progress={progress} message={progressMessage} />
                )}

                {/* エラー表示 */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* 結果表示 */}
                {result && result.success && (
                  <>
                    <ResultsSummary
                      analysisResult={result.analysisResult!}
                      reviewResult={null}
                    />
                    <OutputActions
                      outputDir={result.outputDir!}
                      generatedFiles={result.generatedFiles!}
                    />
                  </>
                )}
              </>
            ) : (
              /* ビューワータブ */
              result?.analysisResult && (
                <ProjectViewer analysisResult={result.analysisResult} />
              )
            )}
          </div>
        </main>

        {/* フッター */}
        <footer className="text-center mt-6 text-white/70 text-sm">
          <p>Forguncy Analyzer v1.0.0</p>
          <p className="mt-1">{t('app.footer')}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
