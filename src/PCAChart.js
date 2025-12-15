import * as d3 from 'd3'
import PCA from 'pca-js'
import CONST from './constants'

export default class PCAChart {
  constructor () {
    this.svg = null
    this.margin = { top: 30, right: 30, bottom: 50, left: 50 }
    this.width = 0
    this.height = 0
    this.tooltip = null
  }

  initChart (selector, data) {
    const container = d3.select(selector)
    const rect = container.node().getBoundingClientRect()
    this.width = rect.width || 300
    this.height = rect.height || 300

    const innerWidth = this.width - this.margin.left - this.margin.right
    const innerHeight = this.height - this.margin.top - this.margin.bottom

    container.selectAll('*').remove()

    container.append('h3')
      .style('text-align', 'center')
      .style('font-size', '14px')
      .style('margin', '5px 0')
      .text('PCA Projection (colored by Grade)')

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)

    this.tooltip = d3.select('body').append('div')
      .attr('class', 'pca-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '5px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')

    // --- 1. DATA PREPARATION ---
    const numericKeys = ['age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
      'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 'G1', 'G2', 'G3']

    // Extract raw values: Array of Arrays
    const rawVectors = data.map(d => numericKeys.map(key => d[key]))

    // --- 2. STANDARDIZATION (Z-Score) ---
    // We must manually standardize (Mean=0, Std=1) to match Python's StandardScaler
    // otherwise variables with large ranges (absences) dominate.

    // Transpose to get columns
    const m = rawVectors[0].length

    // Calculate Mean and Std for each column
    const stats = Array.from({ length: m }, (_, colIndex) => {
      const column = rawVectors.map(row => row[colIndex])
      const mean = d3.mean(column)
      const deviation = d3.deviation(column) || 1 // Avoid divide by zero
      return { mean, deviation }
    })

    // Apply Standardization: (Value - Mean) / Std
    const standardizedVectors = rawVectors.map(row =>
      row.map((val, colIndex) => (val - stats[colIndex].mean) / stats[colIndex].deviation)
    )

    // --- 3. PCA CALCULATION ---
    // Now feed the standardized data to the library
    const vectors = PCA.getEigenVectors(standardizedVectors)
    const adData = PCA.computeAdjustedData(standardizedVectors, vectors[0], vectors[1])

    this.pcaData = adData.formattedAdjustedData[0].map((val, i) => ({
      id: data[i].id,
      x: val * -1, // Invert X axis for better visual alignment
      y: adData.formattedAdjustedData[1][i],
      G3: data[i].G3
    }))

    // --- 4. SCALES ---
    this.xScale = d3.scaleLinear()
      .domain(d3.extent(this.pcaData, d => d.x))
      .range([0, innerWidth])

    this.yScale = d3.scaleLinear()
      .domain(d3.extent(this.pcaData, d => d.y))
      .range([innerHeight, 0])

    // --- 5. AXES ---
    this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(5))

    this.svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .text('PC 1 (Standardized)')

    this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(5))

    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .text('PC 2 (Standardized)')

    // --- 6. DRAW POINTS ---
    this.circles = this.svg.selectAll('circle')
      .data(this.pcaData)
      .enter()
      .append('circle')
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', 4)
      .attr('fill', d => CONST.COLOR_SCALE(d.G3))
      .attr('opacity', 0.8)
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', 1)
        this.tooltip.html(`ID: ${d.id}<br>Grade: ${d.G3}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(200).style('opacity', 0)
      })
  }

  updateSelection (filteredData) {
    const activeIds = new Set(filteredData.map(d => d.id))

    this.svg.selectAll('circle')
      .transition().duration(200)
      .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_SCALE(d.G3) : '#eee')
      .attr('opacity', d => activeIds.has(d.id) ? 0.9 : 0.1)
      .attr('r', d => activeIds.has(d.id) ? 5 : 2)
  }
}
