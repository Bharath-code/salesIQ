import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Estimate processing time based on file size (rough: ~1 min per 10MB)
  const estimateProcessingTime = (bytes: number) => {
    const minutes = Math.max(1, Math.ceil(bytes / (10 * 1024 * 1024)));
    if (minutes <= 1) return '~1 minute';
    if (minutes <= 2) return '~1-2 minutes';
    return `~${minutes} minutes`;
  };

  const validateAndSelectFile = (file: File) => {
    setError(null);
    setSelectedFile(null);

    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (MP3, WAV, M4A)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    // Show file info before processing
    setSelectedFile(file);
  };

  const confirmUpload = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      setSelectedFile(null);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(false);
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  }, []);

  return (
    <div
      className={`relative group border border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-300 ease-out
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="audio/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        onChange={handleFileInput}
        disabled={disabled}
      />

      <div className="flex flex-col items-center space-y-5 pointer-events-none relative z-20">
        {selectedFile ? (
          // File Selected - Show Preview with Processing Time
          <div className="flex flex-col items-center space-y-4 animate-fade-in-up pointer-events-auto">
            <div className="p-4 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-base font-semibold text-slate-900 truncate max-w-[250px]">
                {selectedFile.name}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Estimated Processing Time */}
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Est. processing: {estimateProcessingTime(selectedFile.size)}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={cancelSelection}
                className="px-4 py-2 text-slate-600 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Analyze Call
              </button>
            </div>
          </div>
        ) : (
          // Default Upload State
          <>
            <div className={`p-4 rounded-2xl transition-colors duration-300 ${isDragging ? 'bg-indigo-100 shadow-sm' : 'bg-white shadow-sm ring-1 ring-slate-900/5'}`}>
              <svg className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Upload Sales Call</h3>
              <p className="text-slate-500 mt-1.5 text-sm">Drag and drop MP3, WAV, or M4A</p>
              <p className="text-slate-400 mt-1 text-xs">Max size: 100MB</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <div className="pt-2">
              <span className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-all">
                Select File
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;