const colorMap = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  primary: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  secondary: 'bg-purple-100 text-purple-700 border-purple-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function StatusTag({ label, color = 'default', size = 'md', onDelete }) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClass} ${colorMap[color] || colorMap.default}`}
    >
      {label}
      {onDelete && (
        <button onClick={onDelete} className="ml-0.5 opacity-60 hover:opacity-100 leading-none text-base">×</button>
      )}
    </span>
  )
}
