import * as d3 from 'd3'
import CONST from './constants'

export default class ScatterPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
  }

  initChart (selector, data) {
    const container = d3.select(selector)
    const rect = container.node().getBoundingClientRect()

    this.width = rect.width || 600
    this.height = rect.height || 400

    const { MARGIN } = CONST
    const innerWidth = this.width - MARGIN.left - MARGIN.right
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom

    container.selectAll('*').remove()

    // ADD TITLE
    container.append('h3')
      .style('text-align', 'center')
      .style('margin', '5px 0')
      .style('font-size', '16px')
      .text('Performance Analysis: Grades vs. Absences')

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Scales
    const maxAbsences = d3.max(data, d => d.absences) || 93
    this.xScale = d3.scaleLinear()
      .domain([0, maxAbsences])
      .range([0, innerWidth])

    this.yScale = d3.scaleLinear()
      .domain([0, 20])
      .range([innerHeight, 0])

    // Axes
    this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale))

    this.svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .style('text-anchor', 'middle')
      .text('Number of Absences (Count)')

    this.svg.append('g')
      .call(d3.axisLeft(this.yScale))

    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .style('text-anchor', 'middle')
      .text('Final Grade (G3: 0-20)')

    // LEGEND (Simple)
    const legend = this.svg.append('g').attr('transform', `translate(${innerWidth - 100}, 0)`)
    legend.append('text').text('Grade Color:').style('font-weight', 'bold').style('font-size', '10px')
    legend.append('circle').attr('cx', 0).attr('cy', 15).attr('r', 4).attr('fill', '#d32f2f')
    legend.append('text').attr('x', 10).attr('y', 18).text('Fail (<10)').style('font-size', '10px')
    legend.append('circle').attr('cx', 0).attr('cy', 30).attr('r', 4).attr('fill', '#388e3c')
    legend.append('text').attr('x', 10).attr('y', 33).text('Pass (>=10)').style('font-size', '10px')

    // Tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px')
      .style('border', '1px solid #333')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)

    // Initial Draw
    this.drawPoints(data)
  }

  drawPoints (data) {
    const circles = this.svg.selectAll('circle.dot')
      .data(data, d => d.id)

    circles.exit().transition().duration(CONST.TRANSITION_DURATION).attr('r', 0).remove()

    circles.enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => this.xScale(d.absences))
      .attr('cy', d => this.yScale(d.G3))
      .attr('r', 0)
    // USE COLOR SCALE HERE
      .attr('fill', d => CONST.COLOR_SCALE(d.G3))
      .attr('opacity', 0.8)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 0.9)
        this.tooltip.html(`
                    <strong>Student ID:</strong> ${d.id}<br/>
                    <strong>Grade:</strong> <span style="color:${CONST.COLOR_SCALE(d.G3)}">${d.G3}/20</span><br/>
                    <strong>Absences:</strong> ${d.absences}
                `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')

        d3.select(event.currentTarget).attr('r', 8).attr('stroke-width', 2)
      })
      .on('mouseout', (event, d) => {
        this.tooltip.transition().duration(500).style('opacity', 0)
        d3.select(event.currentTarget).attr('r', 5).attr('stroke-width', 0.5)
      })
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('r', 5)

    // Handle updates for existing circles if data changes (not filtering, but data swap)
    circles
      .transition().duration(CONST.TRANSITION_DURATION)
      .attr('cx', d => this.xScale(d.absences))
      .attr('cy', d => this.yScale(d.G3))
      .attr('fill', d => CONST.COLOR_SCALE(d.G3))
  }

  updateSelection (filteredData) {
    const activeIds = new Set(filteredData.map(d => d.id))

    this.svg.selectAll('circle.dot')
      .transition().duration(200)
    // Color logic: if active, use scale. If inactive, gray.
      .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_SCALE(d.G3) : '#eee')
      .attr('stroke', d => activeIds.has(d.id) ? '#333' : '#ccc')
      .attr('opacity', d => activeIds.has(d.id) ? 0.8 : 0.2)
      .attr('r', d => activeIds.has(d.id) ? 5 : 3)
    // Disable interaction for inactive points
      .style('pointer-events', d => activeIds.has(d.id) ? 'all' : 'none')
  }
}
