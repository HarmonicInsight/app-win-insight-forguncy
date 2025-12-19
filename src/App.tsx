import { useState, useEffect, useCallback } from 'react';
import FileDropZone from './components/FileDropZone';
import AnalysisOptions from './components/AnalysisOptions';
import ProgressBar from './components/ProgressBar';
import ResultsSummary from './components/ResultsSummary';
import OutputActions from './components/OutputActions';
import Header from './components/Header';
import { useAnalysis } from './hooks/useAnalysis';

export interface AnalysisOptionsState {
  generateSpec: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [options, setOptions] = useState<AnalysisOptionsState>({
    generateSpec: true,
    codeReview: true,
    orgAnalysis: true,
    fixGuide: true,
  });

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
        setOptions(settings.options);
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
    await startAnalysis(selectedFile, options);
  }, [selectedFile, options, startAnalysis]);

  const handleSelectOutputFolder = async () => {
    const folder = await window.electronAPI.selectOutputFolder();
    if (folder) {
      setOutputFolder(folder);
      await window.electronAPI.saveSettings({ outputFolder: folder, options });
    }
  };

  const handleOptionsChange = async (newOptions: AnalysisOptionsState) => {
    setOptions(newOptions);
    await window.electronAPI.saveSettings({ outputFolder, options: newOptions });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <Header />

        <main className="bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn">
          {/* ファイルドロップゾーン */}
          <FileDropZone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            disabled={isAnalyzing}
          />

          {/* 解析オプション */}
          <AnalysisOptions
            options={options}
            onChange={handleOptionsChange}
            disabled={isAnalyzing}
          />

          {/* 出力フォルダ設定 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">出力フォルダ</h3>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {outputFolder || '未設定'}
                </p>
              </div>
              <button
                onClick={handleSelectOutputFolder}
                disabled={isAnalyzing}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                変更
              </button>
            </div>
          </div>

          {/* 解析開始ボタン */}
          <div className="mt-8">
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
                  解析中...
                </span>
              ) : (
                '解析開始'
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
                reviewResult={result.reviewResult}
              />
              <OutputActions
                outputDir={result.outputDir!}
                generatedFiles={result.generatedFiles!}
              />
            </>
          )}
        </main>

        {/* フッター */}
        <footer className="text-center mt-6 text-white/70 text-sm">
          <p>Forguncy Analyzer Pro v1.0.0</p>
          <p className="mt-1">Powered by HarmonicInsight</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
