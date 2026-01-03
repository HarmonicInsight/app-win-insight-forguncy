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
        relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer
        transition-all duration-150 ease-out
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isDragging
          ? 'border-accent bg-accent-light'
          : selectedFile
          ? 'border-success bg-success-light'
          : 'border-border hover:border-accent/50 hover:bg-surface-secondary'
        }
      `}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center">
          {/* Success Icon */}
          <div className="w-12 h-12 rounded-full bg-success-muted flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-content-primary">
            {t('fileSelect.selected')}
          </p>
          <p className="mt-2 font-mono text-sm text-accent break-all px-4 max-w-full">
            {fileName}
          </p>
          <p className="mt-4 text-xs text-content-muted">
            {t('fileSelect.changeFile')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Upload Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isDragging ? 'bg-accent-muted' : 'bg-surface-tertiary'
          }`}>
            <svg
              className={`w-6 h-6 transition-colors ${isDragging ? 'text-accent' : 'text-content-muted'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-content-primary">
            {t('fileSelect.dropzone')}
          </p>
          <p className="mt-1 text-sm text-content-secondary">
            {t('fileSelect.orClick')}
          </p>
          <p className="mt-4 text-xs text-content-muted font-mono">
            {t('fileSelect.supportedFormat')}
          </p>
        </div>
      )}
    </div>
  );
}
