import * as d3 from 'd3'
import CONST from './constants'

export default class ScatterPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.onClickCallback = null
    // Cache jitter to keep points stable during updates
    this.jitterMap = new Map()
  }

  initChart (selector, data, onSelect) {
    this.onClickCallback = onSelect
    const container = d3.select(selector)
    const rect = container.node().getBoundingClientRect()

    this.width = rect.width || 600
    this.height = rect.height || 400

    const { MARGIN } = CONST
    const innerWidth = this.width - MARGIN.left - MARGIN.right
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom

    container.selectAll('*').remove()

    // Title
    container.append('h3')
      .style('text-align', 'center')
      .style('margin', '5px 0')
      .style('font-size', '18px')
      .text('Performance Analysis: Grades vs. Absences (Jittered)')

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // --- FIX: ADD CLIP PATH ---
    // This prevents points from drawing outside the axes (e.g., in the margins)
    this.svg.append('defs')
      .append('clipPath')
      .attr('id', 'scatter-clip')
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)

    // Pre-calculate Jitter
    // We add a random offset to the X position to separate overlapping points
    data.forEach(d => {
      if (!this.jitterMap.has(d.id)) {
        // Jitter: +/- 3 units.
        this.jitterMap.set(d.id, (Math.random() - 0.5) * 6)
      }
    })

    // Scales
    // Extend domain slightly so points at edges (0 or max) aren't cut off immediately by the clip
    const maxAbsences = d3.max(data, d => d.absences) || 93
    this.xScale = d3.scaleLinear()
      .domain([-2, maxAbsences + 2]) // Add small padding to domain for "breathing room"
      .range([0, innerWidth])

    this.yScale = d3.scaleLinear()
      .domain([0, 20])
      .range([innerHeight, 0])

    // Axes (Draw these BEFORE the plot area so lines are behind, or keep standard)
    this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale))

    this.svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Number of Absences')

    this.svg.append('g')
      .call(d3.axisLeft(this.yScale))

    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Final Grade (G3: 0-20)')

    // Create a group for points and apply the CLIP PATH
    this.plotArea = this.svg.append('g')
      .attr('clip-path', 'url(#scatter-clip)')

    // LEGEND
    const legend = this.svg.append('g').attr('transform', `translate(${innerWidth - 120}, 0)`)

    legend.append('text')
      .text('Grade Color:')
      .style('font-weight', 'bold')
      .style('font-size', '14px')

    legend.append('circle').attr('cx', 0).attr('cy', 20).attr('r', 6).attr('fill', CONST.COLOR_SCALE(5))
    legend.append('text').attr('x', 15).attr('y', 25).text('Fail (<10)').style('font-size', '12px')

    legend.append('circle').attr('cx', 0).attr('cy', 40).attr('r', 6).attr('fill', CONST.COLOR_SCALE(15))
    legend.append('text').attr('x', 15).attr('y', 45).text('Pass (>=10)').style('font-size', '12px')

    // Instruction Hint
    this.svg.append('text')
      .attr('x', 10)
      .attr('y', -10)
      .text('💡 Click a point to select student')
      .style('font-size', '12px')
      .style('fill', '#666')

    // Tooltip
    this.tooltip = d3.select('body').selectAll('.tooltip').data([0]).join('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px')
      .style('border', '1px solid #333')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)

    this.drawPoints(data)
  }

  drawPoints (data) {
    // Select from plotArea, not svg
    const circles = this.plotArea.selectAll('circle.dot')
      .data(data, d => d.id)

    circles.exit().transition().duration(CONST.TRANSITION_DURATION).attr('r', 0).remove()

    circles.enter()
      .append('circle')
      .attr('class', 'dot')
      // Apply Jitter to X
      .attr('cx', d => this.xScale(d.absences + this.jitterMap.get(d.id)))
      .attr('cy', d => this.yScale(d.G3))
      .attr('r', 0)
      .attr('fill', d => CONST.COLOR_SCALE(d.G3))
      .attr('opacity', 0.8)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 0.9)
        this.tooltip.html(`
                    <strong>Student ID:</strong> ${d.id}<br/>
                    <strong>Grade:</strong> <span style="color:${CONST.COLOR_SCALE(d.G3)}">${d.G3}/20</span><br/>
                    <strong>Absences:</strong> ${d.absences}
                `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')

        d3.select(event.currentTarget).attr('r', 10).attr('stroke-width', 2)
      })
      .on('mouseout', (event, d) => {
        this.tooltip.transition().duration(500).style('opacity', 0)
        d3.select(event.currentTarget).attr('r', 5).attr('stroke-width', 0.5)
      })
      // CLICK EVENT to Select Student
      .on('click', (event, d) => {
        if (this.onClickCallback) {
          this.onClickCallback(d.id)
        }
      })
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('r', 5)

    circles
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('cx', d => this.xScale(d.absences + this.jitterMap.get(d.id))) // Keep jitter consistent
      .attr('cy', d => this.yScale(d.G3))
      .attr('fill', d => CONST.COLOR_SCALE(d.G3))
  }

  updateSelection (filteredData) {
    const activeIds = new Set(filteredData.map(d => d.id))

    // Update on plotArea
    this.plotArea.selectAll('circle.dot')
      .transition().duration(200)
      .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_SCALE(d.G3) : '#eee')
      .attr('stroke', d => activeIds.has(d.id) ? '#333' : '#e0e0e0')
      .attr('opacity', d => activeIds.has(d.id) ? 1.0 : 0.1)
      .attr('r', d => activeIds.has(d.id) ? 6 : 3)
      .style('pointer-events', d => activeIds.has(d.id) ? 'all' : 'none')
  }
}
