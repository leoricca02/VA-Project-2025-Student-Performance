import * as d3 from 'd3'
import CONST from './constants'

export default class HistogramPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.margin = { top: 20, right: 10, bottom: 30, left: 30 }
  }

  initChart (selector, data) {
    const container = d3.select(selector)

    container.append('h4')
      .style('margin', '10px 0 5px 0')
      .style('text-align', 'center')
      .style('font-size', '12px')
      .text('Grade Distribution (G3)')

    const rect = container.node().getBoundingClientRect()
    this.width = rect.width || 250
    this.height = 150

    const innerWidth = this.width - this.margin.left - this.margin.right
    const innerHeight = this.height - this.margin.top - this.margin.bottom

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)

    // X Scale (Grades 0-20)
    this.xScale = d3.scaleLinear()
      .domain([0, 20])
      .range([0, innerWidth])

    // Histogram Binning
    this.histogram = d3.bin()
      .value(d => d.G3)
      .domain(this.xScale.domain())
      .thresholds(d3.range(0, 21)) // Bins for every grade 0,1,2...20

    const bins = this.histogram(data)

    // Y Scale
    this.yScale = d3.scaleLinear()
      .range([innerHeight, 0])

    this.yScale.domain([0, d3.max(bins, d => d.length)])

    // Axes
    this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(5))

    this.yAxis = this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(3))

    // Initial Bars (Background - Total)
    this.svg.selectAll('.bar-hist-bg')
      .data(bins)
      .enter().append('rect')
      .attr('class', 'bar-hist-bg')
      .attr('x', 1)
      .attr('transform', d => `translate(${this.xScale(d.x0)}, ${this.yScale(d.length)})`)
      .attr('width', d => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 1))
      .attr('height', d => innerHeight - this.yScale(d.length))
      .style('fill', '#e0e0e0')

    // Foreground Bars (Filtered)
    this.fgBars = this.svg.selectAll('.bar-hist-fg')
      .data(bins)
      .enter().append('rect')
      .attr('class', 'bar-hist-fg')
      .attr('x', 1)
      .attr('transform', d => `translate(${this.xScale(d.x0)}, ${this.yScale(d.length)})`)
      .attr('width', d => Math.max(0, this.xScale(d.x1) - this.xScale(d.x0) - 1))
      .attr('height', d => innerHeight - this.yScale(d.length))
      .style('fill', CONST.COLOR_PRIMARY)
      .style('opacity', 0.8)
  }

  updateSelection (filteredData) {
    const bins = this.histogram(filteredData)
    const innerHeight = this.height - this.margin.top - this.margin.bottom

    // Note: Y scale stays constant to show proportion relative to max!
    // Or should it zoom? Standard VA practice: keep Y scale fixed to compare with background.

    this.fgBars
      .data(bins)
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('transform', d => `translate(${this.xScale(d.x0)}, ${this.yScale(d.length)})`)
      .attr('height', d => innerHeight - this.yScale(d.length))
  }
}
