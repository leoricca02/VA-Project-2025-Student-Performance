import * as d3 from 'd3'

export const calculateCorrelation = (data, xKey, yKey) => {
  const n = data.length
  if (n < 2) return 0

  const meanX = d3.mean(data, d => d[xKey])
  const meanY = d3.mean(data, d => d[yKey])

  let num = 0
  let denX = 0
  let denY = 0

  for (let i = 0; i < n; i++) {
    const dx = data[i][xKey] - meanX
    const dy = data[i][yKey] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const den = Math.sqrt(denX * denY)
  return den === 0 ? 0 : num / den
}
