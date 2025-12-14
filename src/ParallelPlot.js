import * as d3 from 'd3'
import CONST from './constants'

export default class ParallelPlot {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0

    // The dimensions we want to visualize in this chart
    this.dimensions = ['age', 'studytime', 'failures', 'Dalc', 'Walc', 'health']

    // Friendly names for axes labels with units.
    // Data Source mappings (UCI Student Performance):
    // - studytime: 1 (<2h), 2 (2 to 5h), 3 (5 to 10h), 4 (>10h)
    // - Dalc/Walc: 1 (very low) to 5 (very high)
    // - health: 1 (very bad) to 5 (very good)
    this.dimLabels = {
      age: 'Age (Years)',
      studytime: 'Weekly Study (1:<2h ... 4:>10h)',
      failures: 'Past Failures (Count)',
      Dalc: 'Workday Alc. (1=Low...5=High)',
      Walc: 'Weekend Alc. (1=Low...5=High)',
      health: 'Health (1=Bad...5=Good)'
    }

    // Store active filters: { 'age': [15, 18], 'health': [1, 3] }
    this.filters = {}

    // Callback function to notify parent when selection changes
    this.onBrushCallback = null
  }

  /**
     * Initializes the chart structure.
     * @param {string} selector - CSS selector for the container
     * @param {Array} data - Full dataset
     * @param {Function} onBrush - Callback function (filters) => { ... }
     */
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

    // --- SCALES ---
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

    // --- DRAW LINES ---
    const lineGenerator = d => {
      return d3.line()(this.dimensions.map(p => [this.xScale(p), this.yScales[p](d[p])]))
    }

    // Draw all lines (background)
    this.paths = this.svg.selectAll('path')
      .data(data)
      .enter().append('path')
      .attr('class', 'line')
      .attr('d', lineGenerator)
      .style('fill', 'none')
      .style('stroke', CONST.COLOR_PRIMARY)
      .style('opacity', 0.4)
      .style('stroke-width', 1)

    // --- DRAW AXES & BRUSHES ---
    const yScales = this.yScales
    const dimensions = this.dimensions
    const that = this // Capture 'this' for the drag/brush functions

    const axes = this.svg.selectAll('myAxis')
      .data(dimensions).enter()
      .append('g')
      .attr('class', 'axis')
      .attr('transform', d => `translate(${this.xScale(d)})`)

    // Add Axis lines and labels
    axes.each(function (d) {
      d3.select(this).call(d3.axisLeft(yScales[d]))
    })

    axes.append('text')
      .style('text-anchor', 'middle')
      .attr('y', -9)
      .text(d => this.dimLabels[d])
      .style('fill', 'black')
      .style('font-weight', 'bold')
      .style('font-size', '10px') // Slightly smaller font to fit longer labels

    // --- ADD BRUSHING ---
    // We add a D3 brush on each axis (1D brush)
    axes.each(function (d) {
      const axisGroup = d3.select(this)
      const scale = yScales[d]

      const brush = d3.brushY()
        .extent([[-10, 0], [10, innerHeight]]) // Brush area width 20px
        .on('start brush end', (event) => {
          // This function is called when user drags the brush
          that.handleBrush(event, d, scale)
        })

      axisGroup.append('g')
        .attr('class', 'brush')
        .call(brush)
    })
  }

  handleBrush (event, dimension, scale) {
    // If selection is null, user cleared the brush
    if (!event.selection) {
      delete this.filters[dimension]
    } else {
      // Convert pixels (selection) back to data values (invert)
      // Note: d3.brushY selection is [y0, y1]
      const [y0, y1] = event.selection

      // scale.invert gives us the value. Since Y axis is inverted (0 at bottom),
      // y0 (top) corresponds to higher value, y1 (bottom) to lower value.
      // We need to sort them [min, max]
      const val1 = scale.invert(y0)
      const val2 = scale.invert(y1)

      this.filters[dimension] = [Math.min(val1, val2), Math.max(val1, val2)]
    }

    // Notify the main app
    if (this.onBrushCallback) {
      this.onBrushCallback(this.filters)
    }
  }

  /**
     * Updates the visualization based on filtered data from other charts
     */
  updateSelection (filteredData) {
    // We want to "dim" (make transparent) lines that are not in filteredData
    // Ideally, we match by ID.

    const activeIds = new Set(filteredData.map(d => d.id))

    this.paths.style('stroke', d => {
      if (activeIds.has(d.id)) return CONST.COLOR_PRIMARY // Active
      return '#ddd' // Inactive (grey)
    })
      .style('opacity', d => {
        if (activeIds.has(d.id)) return 0.5
        return 0.1 // Very faint
      })
      .style('stroke-width', d => activeIds.has(d.id) ? 1.5 : 1)

    // Raise active lines to top
    this.paths.filter(d => activeIds.has(d.id)).raise()
  }
}
