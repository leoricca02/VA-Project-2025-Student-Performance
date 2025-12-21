import * as d3 from 'd3'
import PCA from 'pca-js'
import CONST from './constants'

export default class PCAChart {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.tooltip = null
    this.pcaData = [] // Cache calculated data
  }

  initChart (selector, data) {
    const container = d3.select(selector)
    container.selectAll('*').remove()

    // 1. DYNAMIC SIZING
    const rect = container.node().getBoundingClientRect()
    this.width = rect.width
    this.height = rect.height

    const minDim = Math.min(this.width, this.height)

    // Calculate Font Sizes
    const titleSize = Math.max(14, minDim * 0.06)
    const axisLabelSize = Math.max(12, minDim * 0.05)

    // Dynamic Margins to fit labels
    const margin = {
      top: titleSize + 10,
      right: 20,
      bottom: axisLabelSize + 25,
      left: axisLabelSize + 30
    }

    const innerWidth = this.width - margin.left - margin.right
    const innerHeight = this.height - margin.top - margin.bottom

    // Title
    container.append('h3')
      .style('text-align', 'center')
      .style('font-size', `${titleSize}px`)
      .style('margin', '0')
      .style('position', 'absolute')
      .style('width', '100%')
      .text('PCA Projection')

    this.svg = container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    this.tooltip = d3.select('body').selectAll('.pca-tooltip').data([0]).join('div')
      .attr('class', 'pca-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '5px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')
      .style('z-index', 9999)

    // --- PCA CALCULATION ---
    const numericKeys = ['age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
      'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 'G1', 'G2', 'G3']

    const rawVectors = data.map(d => numericKeys.map(key => d[key]))

    // Standardization
    const m = rawVectors[0].length
    const stats = Array.from({ length: m }, (_, colIndex) => {
      const column = rawVectors.map(row => row[colIndex])
      const mean = d3.mean(column)
      const deviation = d3.deviation(column) || 1
      return { mean, deviation }
    })

    const standardizedVectors = rawVectors.map(row =>
      row.map((val, colIndex) => (val - stats[colIndex].mean) / stats[colIndex].deviation)
    )

    const vectors = PCA.getEigenVectors(standardizedVectors)
    const adData = PCA.computeAdjustedData(standardizedVectors, vectors[0], vectors[1])

    this.pcaData = adData.formattedAdjustedData[0].map((val, i) => ({
      id: data[i].id,
      x: val * -1,
      y: adData.formattedAdjustedData[1][i],
      G3: data[i].G3
    }))

    // Scales
    this.xScale = d3.scaleLinear()
      .domain(d3.extent(this.pcaData, d => d.x))
      .range([0, innerWidth])

    this.yScale = d3.scaleLinear()
      .domain(d3.extent(this.pcaData, d => d.y))
      .range([innerHeight, 0])

    // Axes
    const xAxis = this.svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(5))

    xAxis.selectAll('text').style('font-size', `${axisLabelSize * 0.8}px`)

    const yAxis = this.svg.append('g')
      .call(d3.axisLeft(this.yScale).ticks(5))

    yAxis.selectAll('text').style('font-size', `${axisLabelSize * 0.8}px`)

    // --- ADDED AXIS LABELS ---
    this.svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .style('font-size', `${axisLabelSize}px`)
      .style('font-weight', 'bold')
      .text('PC1')

    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 15)
      .style('text-anchor', 'middle')
      .style('font-size', `${axisLabelSize}px`)
      .style('font-weight', 'bold')
      .text('PC2')

    // Draw Points
    const radius = Math.max(2.5, minDim * 0.015)

    this.svg.selectAll('circle')
      .data(this.pcaData)
      .enter()
      .append('circle')
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', radius)
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
    const minDim = Math.min(this.width, this.height) || 300
    const radius = Math.max(2.5, minDim * 0.015)

    this.svg.selectAll('circle')
      .transition().duration(200)
      .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_SCALE(d.G3) : '#eee')
      .attr('opacity', d => activeIds.has(d.id) ? 0.9 : 0.1)
      .attr('r', d => activeIds.has(d.id) ? radius * 1.3 : radius * 0.7)
  }
}
