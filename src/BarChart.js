import * as d3 from 'd3'
import CONST from './constants'

export default class BarChart {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.margin = { top: 20, right: 10, bottom: 30, left: 30 }
    this.onFilterCallback = null
  }

  initChart (selector, data, attribute, label, onFilter) {
    this.data = data
    this.attribute = attribute
    this.onFilterCallback = onFilter

    const container = d3.select(selector)

    container.append('h4')
      .style('margin', '10px 0 5px 0')
      .style('text-align', 'center')
      .style('font-size', '16px')
      .text(label)

    const rect = container.node().getBoundingClientRect()
    this.width = rect.width || 200
    this.height = 120

    const innerWidth = this.width - this.margin.left - this.margin.right
    const innerHeight = this.height - this.margin.top - this.margin.bottom

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)

    // Tooltip
    this.tooltip = d3.select('body').selectAll('.bar-tooltip').data([0]).join('div')
      .attr('class', 'bar-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '5px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')

    this.counts = d3.rollups(data, v => v.length, d => d[attribute])
      .sort((a, b) => d3.ascending(a[0], b[0]))

    this.xScale = d3.scaleBand()
      .domain(this.counts.map(d => d[0]))
      .range([0, innerWidth])
      .padding(0.2)

    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(this.counts, d => d[1])])
      .range([innerHeight, 0])

    this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale))

    this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(4))

    // Background Bars
    this.svg.selectAll('.bar-bg')
      .data(this.counts)
      .enter().append('rect')
      .attr('class', 'bar-bg')
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => innerHeight - this.yScale(d[1]))
      .attr('fill', '#eee')
      .attr('stroke', '#ccc')
      .on('click', (event, d) => {
        if (this.onFilterCallback) {
          this.onFilterCallback(this.attribute, d[0])
          this.svg.selectAll('.bar-bg').attr('stroke', '#ccc').attr('stroke-width', 1)
          d3.select(event.currentTarget).attr('stroke', '#333').attr('stroke-width', 2)
        }
      })
    // Tooltip on Background Bars (Total)
      .on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 1)
        this.tooltip.html(`Value: ${d[0]}<br>Total: ${d[1]}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(200).style('opacity', 0)
      })

    // Foreground Bars (Filtered)
    this.foregroundBars = this.svg.selectAll('.bar-fg')
      .data(this.counts)
      .enter().append('rect')
      .attr('class', 'bar-fg')
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => innerHeight - this.yScale(d[1]))
      .attr('fill', CONST.COLOR_PRIMARY)
      .style('pointer-events', 'none') // Allow clicks to pass through

    // Labels (New Feature)
    this.labels = this.svg.selectAll('.bar-label')
      .data(this.counts)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => this.xScale(d[0]) + this.xScale.bandwidth() / 2)
      .attr('y', d => this.yScale(d[1]) - 5) // Initially above the total bar
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#333')
      .style('font-weight', 'bold')
      .text(d => d[1]) // Initially show total
  }

  updateSelection (filteredData) {
    const filteredCountsMap = d3.rollup(filteredData, v => v.length, d => d[this.attribute])
    const innerHeight = this.height - this.margin.top - this.margin.bottom

    // Update Foreground Bars
    this.foregroundBars
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('y', d => {
        const count = filteredCountsMap.get(d[0]) || 0
        return this.yScale(count)
      })
      .attr('height', d => {
        const count = filteredCountsMap.get(d[0]) || 0
        return innerHeight - this.yScale(count)
      })

    // Update Labels
    this.labels
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('y', d => {
        const count = filteredCountsMap.get(d[0]) || 0
        // Position label slightly above the *filtered* bar height
        // If count is 0, position at bottom
        return count > 0 ? this.yScale(count) - 5 : innerHeight - 5
      })
      .text(d => {
        const count = filteredCountsMap.get(d[0]) || 0
        return count
      })
      .style('opacity', d => {
        const count = filteredCountsMap.get(d[0]) || 0
        return count > 0 ? 1 : 0 // Hide 0 counts to reduce clutter
      })
  }
}
