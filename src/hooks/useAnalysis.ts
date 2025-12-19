import { useState, useCallback, useEffect } from 'react';
import { AnalysisOptionsState } from '../App';

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

interface AnalysisResponse {
  success: boolean;
  analysisResult?: AnalysisResult;
  reviewResult?: ReviewResult;
  outputDir?: string;
  generatedFiles?: string[];
  error?: string;
}

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 進捗イベントのリスナー設定
  useEffect(() => {
    const unsubscribe = window.electronAPI.onAnalysisProgress((data) => {
      setProgress(data.progress);
      setProgressMessage(data.message);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const startAnalysis = useCallback(async (filePath: string, options: AnalysisOptionsState) => {
    setIsAnalyzing(true);
    setProgress(0);
    setProgressMessage('解析を開始しています...');
    setResult(null);
    setError(null);

    try {
      const response = await window.electronAPI.analyzeProject(filePath, options);

      if (response.success) {
        setResult(response);
      } else {
        setError(response.error || '解析中にエラーが発生しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setProgressMessage('');
    setResult(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    progress,
    progressMessage,
    result,
    error,
    startAnalysis,
    reset,
  };
}
