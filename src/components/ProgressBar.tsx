interface Props {
  progress: number;
  message: string;
}

export default function ProgressBar({ progress, message }: Props) {
  return (
    <div className="mt-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{message}</span>
        <span className="text-sm font-medium text-indigo-600">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-center text-gray-500 text-sm">
        <svg
          className="animate-spin mr-2 h-4 w-4 text-indigo-500"
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
        処理中...
      </div>
    </div>
  );
}
