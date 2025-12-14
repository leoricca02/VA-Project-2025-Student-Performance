import * as d3 from 'd3'
import CONST from './constants'

export default class ParallelPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0

    // Use dimensions from constants
    this.dimensions = CONST.PARALLEL_DIMENSIONS
    this.dimLabels = CONST.PARALLEL_DIM_LABELS

    this.filters = {}
    this.onBrushCallback = null
  }

  initChart (selector, data, onBrush) {
    this.onBrushCallback = onBrush
    const container = d3.select(selector)
    const rect = container.node().getBoundingClientRect()

    this.width = rect.width || 800
    this.height = rect.height || 400

    const { MARGIN } = CONST
    const innerWidth = this.width - MARGIN.left - MARGIN.right
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom

    container.selectAll('*').remove()

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Scales
    this.yScales = {}
    this.dimensions.forEach(dim => {
      const domain = d3.extent(data, d => d[dim])
      if (domain[0] === domain[1]) {
        domain[0] -= 1
        domain[1] += 1
      }
      this.yScales[dim] = d3.scaleLinear()
        .domain(domain)
        .range([innerHeight, 0])
    })

    this.xScale = d3.scalePoint()
      .domain(this.dimensions)
      .range([0, innerWidth])
      .padding(0)

    // Lines
    const lineGenerator = d => {
      return d3.line()(this.dimensions.map(p => [this.xScale(p), this.yScales[p](d[p])]))
    }

    this.paths = this.svg.selectAll('path')
      .data(data)
      .enter().append('path')
      .attr('class', 'line')
      .attr('d', lineGenerator)
      .style('fill', 'none')
      .style('stroke', CONST.COLOR_PRIMARY) // Or use CONST.COLOR_SCALE(d.G3) if passed
      .style('opacity', 0.4)
      .style('stroke-width', 1)

    // Axes & Brushes
    const yScales = this.yScales
    const dimensions = this.dimensions
    const that = this

    const axes = this.svg.selectAll('myAxis')
      .data(dimensions).enter()
      .append('g')
      .attr('class', 'axis')
      .attr('transform', d => `translate(${this.xScale(d)})`)

    axes.each(function (d) {
      d3.select(this).call(d3.axisLeft(yScales[d]))
    })

    axes.append('text')
      .style('text-anchor', 'middle')
      .attr('y', -9)
      .text(d => this.dimLabels[d])
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-size', '10px')

    axes.each(function (d) {
      const axisGroup = d3.select(this)
      const scale = yScales[d]

      const brush = d3.brushY()
        .extent([[-10, 0], [10, innerHeight]])
        .on('start brush end', (event) => {
          that.handleBrush(event, d, scale)
        })

      axisGroup.append('g')
        .attr('class', 'brush')
        .call(brush)
    })
  }

  handleBrush (event, dimension, scale) {
    if (!event.selection) {
      delete this.filters[dimension]
    } else {
      const [y0, y1] = event.selection
      const val1 = scale.invert(y0)
      const val2 = scale.invert(y1)
      this.filters[dimension] = [Math.min(val1, val2), Math.max(val1, val2)]
    }

    if (this.onBrushCallback) {
      this.onBrushCallback(this.filters)
    }
  }

  updateSelection (filteredData) {
    const activeIds = new Set(filteredData.map(d => d.id))

    this.paths.style('stroke', d => activeIds.has(d.id) ? CONST.COLOR_PRIMARY : '#ddd')
      .style('opacity', d => activeIds.has(d.id) ? 0.5 : 0.1)
      .style('stroke-width', d => activeIds.has(d.id) ? 1.5 : 1)

    this.paths.filter(d => activeIds.has(d.id)).raise()
  }
}
