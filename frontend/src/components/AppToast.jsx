import { useEffect } from 'react'

const severityStyles = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-amber-50 border-amber-400 text-amber-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
}

const severityIcon = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export default function AppToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast.open) return
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [toast.open, toast.text])

  if (!toast.open) return null

  return (
    <div className="fixed top-4 right-4 z-[2000] min-w-[280px] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${severityStyles[toast.severity] || severityStyles.info}`}
      >
        <span className="mt-0.5 text-base font-bold">{severityIcon[toast.severity]}</span>
        <span className="flex-1 text-sm font-medium leading-snug">{toast.text}</span>
        <button
          onClick={onClose}
          className="ml-1 text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
