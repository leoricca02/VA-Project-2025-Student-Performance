import * as d3 from 'd3'
import CONST from './constants'

export default class ScatterPlot {
  constructor () {
    this.svg = null
    this.onClickCallback = null
    // Cache jitter to keep points stable
    this.jitterMapX = new Map()
    this.jitterMapY = new Map()
    this.baseRadius = 5
  }

  initChart (selector, data, onSelect) {
    this.onClickCallback = onSelect
    const container = d3.select(selector)

    // 1. CLEAR
    container.selectAll('*').remove()

    // 2. DYNAMIC SIZING
    const rect = container.node().getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const minDim = Math.min(width, height)
    const titleSize = Math.max(16, minDim * 0.05)
    const axisLabelSize = Math.max(12, minDim * 0.035)
    this.baseRadius = Math.max(3, minDim * 0.015)

    const margin = {
      top: titleSize + 20,
      right: width * 0.15,
      bottom: axisLabelSize + 30,
      left: axisLabelSize + 30
    }

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // 3. TITLE
    container.append('h3')
      .style('text-align', 'center')
      .style('margin', '0')
      .style('position', 'absolute')
      .style('width', '100%')
      .style('top', '5px')
      .style('font-size', `${titleSize}px`)
      .text('Study Efficiency: Time vs. Final Grade')

    this.svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Clip Path
    this.svg.append('defs')
      .append('clipPath')
      .attr('id', 'scatter-clip')
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)

    // 4. JITTER CALCULATION
    // Studytime is categorical (1-4), so we need WIDE jitter on X to spread points
    // Grades (0-20) need small jitter on Y
    data.forEach(d => {
      if (!this.jitterMapX.has(d.id)) {
        this.jitterMapX.set(d.id, (Math.random() - 0.5) * 0.6) // +/- 0.3 units width
        this.jitterMapY.set(d.id, (Math.random() - 0.5) * 0.5)
      }
    })

    // 5. SCALES
    // X: Studytime 1 to 4
    this.xScale = d3.scaleLinear()
      .domain([0.5, 4.5]) // Padding for categories
      .range([0, innerWidth])

    // Y: Grades 0-20
    this.yScale = d3.scaleLinear()
      .domain([0, 21])
      .range([innerHeight, 0])

    // 6. ANNOTATION REGIONS (Optional but "Smart")
    // High Study / Low Grade area
    this.svg.append('rect')
      .attr('x', this.xScale(3.5))
      .attr('y', this.yScale(9))
      .attr('width', this.xScale(4.5) - this.xScale(3.5))
      .attr('height', this.yScale(0) - this.yScale(9))
      .attr('fill', '#ffebee') // Light red
      .attr('opacity', 0.5)

    this.svg.append('text')
      .attr('x', this.xScale(4))
      .attr('y', this.yScale(2))
      .text('Struggling?')
      .attr('text-anchor', 'middle')
      .style('font-size', `${axisLabelSize * 0.8}px`)
      .style('fill', '#d32f2f')

    // 7. AXES
    const timeLabels = ['<2h', '2-5h', '5-10h', '>10h']

    const xAxis = this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale)
        .ticks(4)
        .tickFormat(d => timeLabels[d - 1] || d)
      )

    xAxis.selectAll('text').style('font-size', `${axisLabelSize * 0.8}px`)

    const yAxis = this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(10))

    yAxis.selectAll('text').style('font-size', `${axisLabelSize * 0.8}px`)

    // Labels
    this.svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .style('font-size', `${axisLabelSize}px`)
      .text('Weekly Study Time')

    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 15)
      .style('text-anchor', 'middle')
      .style('font-size', `${axisLabelSize}px`)
      .text('Final Grade (G3)')

    // 8. PLOT AREA
    this.plotArea = this.svg.append('g')
      .attr('clip-path', 'url(#scatter-clip)')

    // 9. LEGEND
    const legendX = innerWidth + 10
    const legendGroup = this.svg.append('g').attr('transform', `translate(${legendX}, 0)`)

    legendGroup.append('text')
      .text('Grade:')
      .style('font-weight', 'bold')
      .style('font-size', `${axisLabelSize}px`)

    const drawLegendItem = (y, color, text) => {
      legendGroup.append('circle').attr('cx', 5).attr('cy', y).attr('r', this.baseRadius).attr('fill', color)
      legendGroup.append('text').attr('x', 15).attr('y', y + 4).text(text).style('font-size', `${axisLabelSize * 0.9}px`)
    }

    drawLegendItem(25, CONST.COLOR_SCALE(5), 'Fail')
    drawLegendItem(45, CONST.COLOR_SCALE(15), 'Pass')

    // 10. TOOLTIP
    this.tooltip = d3.select('body').selectAll('.tooltip').data([0]).join('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)

    this.drawPoints(data)
  }

  drawPoints (data) {
    const timeLabels = ['<2h', '2-5h', '5-10h', '>10h']

    const circles = this.plotArea.selectAll('circle.dot')
      .data(data, d => d.id)

    circles.exit().remove()

    circles.enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => this.xScale(d.studytime + this.jitterMapX.get(d.id)))
      .attr('cy', d => this.yScale(d.G3 + this.jitterMapY.get(d.id)))
      .attr('r', 0)
      .attr('fill', d => CONST.COLOR_SCALE(d.G3))
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 0.9)
        this.tooltip.html(`
            <strong>ID:</strong> ${d.id}<br/>
            <strong>Study:</strong> ${timeLabels[d.studytime - 1]}<br/>
            <strong>Grade:</strong> ${d.G3}<br/>
            <strong>Failures:</strong> ${d.failures}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')

        d3.select(event.currentTarget)
          .attr('r', this.baseRadius * 2)
          .attr('stroke-width', 2)
      })
      .on('mouseout', (event) => {
        this.tooltip.transition().duration(500).style('opacity', 0)
        d3.select(event.currentTarget)
          .attr('r', this.baseRadius)
          .attr('stroke-width', 0.5)
      })
      .on('click', (event, d) => {
        if (this.onClickCallback) this.onClickCallback(d.id)
      })
      .transition().duration(500)
      .attr('r', this.baseRadius)
  }

  updateSelection (filteredData) {
    const activeIds = new Set(filteredData.map(d => d.id))

    this.plotArea.selectAll('circle.dot')
      .transition().duration(200)
      .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_SCALE(d.G3) : '#ccc')
      .attr('opacity', d => activeIds.has(d.id) ? 1.0 : 0.1)
      .attr('r', d => activeIds.has(d.id) ? this.baseRadius * 1.2 : this.baseRadius * 0.8)
      .style('pointer-events', d => activeIds.has(d.id) ? 'all' : 'none')
  }
}
