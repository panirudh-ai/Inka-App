import { useEffect, useState } from 'react'
import { G8 } from '../theme'

// Severity colors matching the app's MUI theme palette
const config = {
  success: { color: '#4ade80', icon: '✓', label: 'Success' },
  error:   { color: '#f87171', icon: '✗', label: 'Error'   },
  warning: { color: '#fbbf24', icon: '⚠', label: 'Warning' },
  info:    { color: '#60a5fa', icon: 'ℹ', label: 'Info'    },
}

const DURATION = 3200

export default function AppToast({ toast, onClose }) {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!toast.open) { setVisible(false); setProgress(100); return }

    const show = setTimeout(() => setVisible(true), 10)

    const start = Date.now()
    const tick = setInterval(() => {
      setProgress(Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100))
    }, 20)

    const close = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 350)
    }, DURATION)

    return () => { clearTimeout(show); clearTimeout(close); clearInterval(tick) }
  }, [toast.open, toast.text])

  if (!toast.open) return null

  const c = config[toast.severity] || config.info

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        width: 300,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(24px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
      }}
    >
      <div style={{
        background: G8.black2,
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        border: `1px solid ${G8.darkBorder2}`,
        borderLeft: `3px solid ${c.color}`,
      }}>
        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          {/* Icon circle */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${c.color}22`,
            border: `1.5px solid ${c.color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: c.color, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{c.icon}</span>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: c.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1, marginBottom: 3 }}>
              {c.label}
            </div>
            <div style={{ color: G8.offWhite, fontSize: 12, fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {toast.text}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
            style={{
              flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
              color: G8.muted, fontSize: 16, fontWeight: 700, lineHeight: 1,
              padding: '0 2px', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.target.style.color = G8.offWhite}
            onMouseLeave={e => e.target.style.color = G8.muted}
          >×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: G8.darkBorder2 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: c.color,
            transition: 'width 0.02s linear',
            boxShadow: `0 0 6px ${c.color}`,
          }} />
        </div>
      </div>
    </div>
  )
}
