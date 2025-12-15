import * as d3 from 'd3'
import CONST from './constants'

export default class BoxPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.margin = { top: 20, right: 10, bottom: 30, left: 40 }
  }

  initChart (selector, data, attribute, label) {
    this.attribute = attribute
    const container = d3.select(selector)
    container.html('') // Clear previous

    container.append('h4')
      .style('margin', '10px 0 5px 0')
      .style('text-align', 'center')
      .style('font-size', '12px')
      .text(label)

    const rect = container.node().getBoundingClientRect()
    this.width = rect.width || 200
    this.height = 150

    const innerWidth = this.width - this.margin.left - this.margin.right
    const innerHeight = this.height - this.margin.top - this.margin.bottom

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)

    // Compute summary statistics
    this.stats = this.computeStats(data)

    // Y Scale
    // CUSTOM LOGIC: If attribute is 'age', start from 15. Else start from 0.
    const yMin = attribute === 'age' ? 15 : 0
    const yMax = d3.max(data, d => d[attribute]) || (attribute === 'age' ? 22 : 100)

    this.yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0])

    // X Scale (Single Box)
    this.xScale = d3.scaleBand()
      .domain(['Selection'])
      .range([0, innerWidth])
      .padding(0.5)

    // Axes
    this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(5))

    this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale))

    this.drawBox(this.stats, innerWidth)
  }

  computeStats (data) {
    if (data.length === 0) return { q1: 0, median: 0, q3: 0, min: 0, max: 0 }

    const sorted = data.map(d => d[this.attribute]).sort(d3.ascending)
    const q1 = d3.quantile(sorted, 0.25)
    const median = d3.quantile(sorted, 0.5)
    const q3 = d3.quantile(sorted, 0.75)
    const min = d3.min(sorted)
    const max = d3.max(sorted)

    return { q1, median, q3, min, max }
  }

  drawBox (stats, innerWidth) {
    const center = this.xScale('Selection') + this.xScale.bandwidth() / 2
    const width = this.xScale.bandwidth()

    // Main vertical line
    this.svg.append('line')
      .attr('class', 'box-whisker')
      .attr('x1', center)
      .attr('x2', center)
      .attr('y1', this.yScale(stats.min))
      .attr('y2', this.yScale(stats.max))
      .attr('stroke', '#333')

    // Box
    this.svg.append('rect')
      .attr('class', 'box-rect')
      .attr('x', this.xScale('Selection'))
      .attr('y', this.yScale(stats.q3))
      .attr('height', Math.max(0, this.yScale(stats.q1) - this.yScale(stats.q3)))
      .attr('width', width)
      .attr('stroke', '#333')
      .attr('fill', CONST.COLOR_PRIMARY)
      .style('opacity', 0.6)

    // Median line
    this.svg.append('line')
      .attr('class', 'box-median')
      .attr('x1', this.xScale('Selection'))
      .attr('x2', this.xScale('Selection') + width)
      .attr('y1', this.yScale(stats.median))
      .attr('y2', this.yScale(stats.median))
      .attr('stroke', 'black')
      .style('stroke-width', 2)
  }

  updateSelection (filteredData) {
    const stats = this.computeStats(filteredData)

    // Update Box Elements
    this.svg.select('.box-whisker')
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('y1', this.yScale(stats.min))
      .attr('y2', this.yScale(stats.max))

    this.svg.select('.box-rect')
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('y', this.yScale(stats.q3))
      .attr('height', Math.max(0, this.yScale(stats.q1) - this.yScale(stats.q3)))

    this.svg.select('.box-median')
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('y1', this.yScale(stats.median))
      .attr('y2', this.yScale(stats.median))
  }
}
