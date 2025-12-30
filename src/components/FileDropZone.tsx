import { useState, useCallback, DragEvent } from 'react';
import { useI18n } from '../hooks/useI18n';

interface Props {
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  disabled: boolean;
}

export default function FileDropZone({ selectedFile, onFileSelect, disabled }: Props) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.fgcp')) {
        // Electronでは file.path でフルパスが取得できる
        const filePath = (file as unknown as { path: string }).path;
        if (filePath) {
          onFileSelect(filePath);
        }
      } else {
        alert(t('errors.invalidFile'));
      }
    }
  }, [disabled, onFileSelect, t]);

  const handleClick = useCallback(async () => {
    if (disabled) return;
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      onFileSelect(filePath);
    }
  }, [disabled, onFileSelect]);

  const fileName = selectedFile ? selectedFile.split(/[/\\]/).pop() : null;

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
        ${isDragging ? 'border-indigo-500 bg-indigo-100 scale-[1.02]' : 'border-gray-300 bg-gray-50'}
        ${selectedFile ? 'border-green-400 bg-green-50' : ''}
      `}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center">
          <svg
            className="w-16 h-16 text-green-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700">{t('fileSelect.selected')}</p>
          <p className="mt-2 text-indigo-600 font-mono text-sm break-all px-4">
            {fileName}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            {t('fileSelect.changeFile')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg
            className={`w-16 h-16 mb-4 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700">
            {t('fileSelect.dropzone')}
          </p>
          <p className="mt-2 text-gray-500">
            {t('fileSelect.orClick')}
          </p>
          <p className="mt-4 text-sm text-gray-400">
            {t('fileSelect.supportedFormat')}
          </p>
        </div>
      )}
    </div>
  );
}
