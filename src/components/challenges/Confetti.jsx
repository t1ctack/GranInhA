import { useMemo } from 'react'

const COLORS = ['#22c55e', '#4ade80', '#eab308', '#3b82f6', '#ec4899', '#f97316']

function makePieces() {
  return Array.from({ length: 28 }, (_, i) => ({
    left:  Math.round(Math.random() * 100),
    delay: (Math.random() * 0.6).toFixed(2),
    color: COLORS[i % COLORS.length],
    size:  6 + Math.round(Math.random() * 4),
  }))
}

/** Pure-CSS confetti burst — freshly randomized on every mount, no library needed. */
export default function Confetti() {
  const PIECES = useMemo(makePieces, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm animate-confetti"
          style={{
            left:            `${p.left}%`,
            width:           p.size,
            height:          p.size * 0.4,
            backgroundColor: p.color,
            animationDelay:  `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
