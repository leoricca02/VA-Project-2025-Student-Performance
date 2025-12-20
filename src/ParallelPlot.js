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
    const node = container.node()

    if (!node) {
      console.warn(`ParallelPlot: Selector "${selector}" not found.`)
      return
    }

    const rect = node.getBoundingClientRect()

    this.width = rect.width || 800
    this.height = rect.height || 400

    // DEFENSIVE CODING: Fallback if CONST.MARGIN is undefined for any reason
    const MARGIN = CONST.MARGIN || { top: 40, right: 40, bottom: 50, left: 60 }

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
      // Handle cases where data might be missing the key
      const values = data.map(d => d[dim]).filter(v => v !== undefined && v !== null)
      let domain = d3.extent(values)

      // If domain is flat (e.g. min == max), extend it slightly
      if (!domain[0] && domain[0] !== 0) domain = [0, 10] // Default fallback
      else if (domain[0] === domain[1]) {
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

    // Line Generator
    const lineGenerator = d => {
      return d3.line()(this.dimensions.map(p => {
        // Safety check if dimension data exists
        if (d[p] === undefined) return [0, 0]
        return [this.xScale(p), this.yScales[p](d[p])]
      }))
    }

    // Draw Lines
    this.paths = this.svg.selectAll('path')
      .data(data)
      .enter().append('path')
      .attr('class', 'line')
      .attr('d', lineGenerator)
      .style('fill', 'none')
      .style('stroke', CONST.COLOR_PRIMARY)
      .style('opacity', 0.4)
      .style('stroke-width', 1)

    // Axes & Brushes
    const yScales = this.yScales
    // const dimensions = this.dimensions
    const that = this

    const axes = this.svg.selectAll('myAxis')
      .data(this.dimensions).enter()
      .append('g')
      .attr('class', 'axis')
      .attr('transform', d => `translate(${this.xScale(d)})`)

    axes.each(function (d) {
      d3.select(this).call(d3.axisLeft(yScales[d]).ticks(5))
    })

    // Axis Labels
    axes.append('text')
      .style('text-anchor', 'middle')
      .attr('y', -9)
      .text(d => this.dimLabels[d] || d)
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-size', '10px')
      .style('cursor', 'default')

    // Add Brushes
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

    this.paths
      .transition().duration(200) // Small transition for smoothness
      .style('stroke', d => activeIds.has(d.id) ? CONST.COLOR_PRIMARY : '#ddd')
      .style('opacity', d => activeIds.has(d.id) ? 0.6 : 0.05) // Lower opacity for inactive
      .style('stroke-width', d => activeIds.has(d.id) ? 1.5 : 1)

    // Move active lines to front
    this.paths.filter(d => activeIds.has(d.id)).raise()
  }
}
