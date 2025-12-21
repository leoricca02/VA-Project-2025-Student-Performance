import * as d3 from 'd3'
import CONST from './constants'

export default class HistogramPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.xScale = null
    this.yScale = null
    this.histogram = null
    this.yAxis = null
    this.xAxis = null
  }

  initChart (selector, data) {
    const container = d3.select(selector)
    const node = container.node()
    if (!node) return

    const rect = node.getBoundingClientRect()
    this.width = rect.width || 400
    this.height = rect.height || 200

    const { MARGIN } = CONST
    const innerWidth = this.width - MARGIN.left - MARGIN.right
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom

    container.selectAll('*').remove()

    // Title
    container.append('h4')
      .text('Grade Distribution (G3)')
      .style('text-align', 'center')
      .style('margin', '5px 0')
      .style('font-size', '20px')

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // X Scale: Grades 0-20
    this.xScale = d3.scaleLinear()
      .domain([0, 20])
      .range([0, innerWidth])

    // Setup Histogram
    // Check for d3.bin (v6+) or fallback to d3.histogram (v4/v5)
    const binGenerator = d3.bin ? d3.bin() : d3.histogram()

    this.histogram = binGenerator
      .value(d => d.G3)
      .domain(this.xScale.domain())
      .thresholds(this.xScale.ticks(20)) // Approx 1 bin per grade

    const bins = this.histogram(data)

    // Y Scale
    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 10]) // Default max if empty
      .range([innerHeight, 0])
      .nice()

    // Axes
    this.xAxis = this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(10))

    this.yAxis = this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(5))

    // Initial Draw
    this.drawBars(bins, innerHeight)
  }

  drawBars (bins, innerHeight) {
    // --- 1. Draw Rects ---
    this.svg.selectAll('rect.bar')
      .data(bins)
      .join(
        enter => enter.append('rect')
          .attr('class', 'bar')
          .attr('x', d => this.xScale(d.x0) + 1)
          .attr('width', d => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 1))
          .attr('y', innerHeight)
          .attr('height', 0)
          .attr('fill', '#90caf9')
          .call(enter => enter.transition().duration(CONST.TRANSITION_DURATION)
            .attr('y', d => this.yScale(d.length))
            .attr('height', d => innerHeight - this.yScale(d.length))
            .attr('fill', d => {
              const midPoint = (d.x0 + d.x1) / 2
              return CONST.COLOR_SCALE(midPoint)
            })
          ),
        update => update.transition().duration(CONST.TRANSITION_DURATION)
          .attr('x', d => this.xScale(d.x0) + 1)
          .attr('width', d => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 1))
          .attr('y', d => this.yScale(d.length))
          .attr('height', d => innerHeight - this.yScale(d.length))
          .attr('fill', d => {
            const midPoint = (d.x0 + d.x1) / 2
            return CONST.COLOR_SCALE(midPoint)
          }),
        exit => exit.transition().duration(200).attr('height', 0).remove()
      )

    // --- 2. Draw Labels (Student Count) ---
    this.svg.selectAll('.bar-label')
      .data(bins)
      .join(
        enter => enter.append('text')
          .attr('class', 'bar-label')
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px') // Slightly larger font
          .attr('font-weight', 'bold')
          .attr('fill', '#333')
          .style('pointer-events', 'none')
          .attr('x', d => this.xScale(d.x0) + (this.xScale(d.x1) - this.xScale(d.x0)) / 2)
          .attr('y', d => this.yScale(d.length) - 5)
          .text(d => d.length > 0 ? d.length : '')
          .attr('opacity', 0)
          .call(enter => enter.transition().duration(CONST.TRANSITION_DURATION).attr('opacity', 1)),
        update => update.transition().duration(CONST.TRANSITION_DURATION)
          .attr('x', d => this.xScale(d.x0) + (this.xScale(d.x1) - this.xScale(d.x0)) / 2)
          .attr('y', d => this.yScale(d.length) - 5)
          .text(d => d.length > 0 ? d.length : '')
          .attr('opacity', 1),
        exit => exit.remove()
      )
      .raise() // Ensure text is always on top of bars
  }

  updateSelection (filteredData) {
    if (!this.histogram || !this.yScale) return

    const bins = this.histogram(filteredData)
    const { MARGIN } = CONST
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom

    // Recalculate Y domain to fit new max (Dynamic scaling)
    this.yScale.domain([0, d3.max(bins, d => d.length) || 10]).nice()

    // Animate Axis Update
    this.yAxis.transition().duration(CONST.TRANSITION_DURATION)
      .call(d3.axisLeft(this.yScale).ticks(5))

    this.drawBars(bins, innerHeight)
  }
}
