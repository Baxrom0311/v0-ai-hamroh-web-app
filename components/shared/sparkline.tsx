export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "var(--primary)",
  fill = true,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}) {
  if (data.length === 0) return null
  const max = Math.max(...data, 100)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = width / (data.length - 1 || 1)
  const points = data
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      {fill && (
        <polygon
          points={areaPoints}
          fill={color}
          opacity={0.15}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
