import * as d3 from 'd3'
import PCA from 'pca-js' // The library performing the Linear Algebra
import CONST from './constants'

export default class PCAChart {
  constructor () {
    this.svg = null
    this.width = 0
    this.height = 0
    this.tooltip = null
    this.pcaData = [] // Cache calculated data
  }

  initChart (selector, data, onSelection) {
    const container = d3.select(selector)
    container.selectAll('*').remove()

    // 1. DYNAMIC SIZING (Responsive Design)
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

    // =========================================================
    //               PCA ALGORITHM EXPLANATION
    // =========================================================

    // STEP 1: FEATURE SELECTION
    const numericKeys = ['age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
      'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 'G1', 'G2', 'G3']

    console.group('PCA PROCESS EXPLANATION')
    console.log('1. Features Selected:', numericKeys)

    const rawVectors = data.map(d => numericKeys.map(key => d[key]))

    // STEP 2: STANDARDIZATION
    const m = rawVectors[0].length
    const stats = Array.from({ length: m }, (_, colIndex) => {
      const column = rawVectors.map(row => row[colIndex])
      const mean = d3.mean(column)
      const deviation = d3.deviation(column) || 1
      return { mean, deviation }
    })

    console.log('2. Standardization Stats (Mean & Deviation per variable):')
    console.table(stats.map((s, i) => ({ Variable: numericKeys[i], Mean: s.mean.toFixed(2), StdDev: s.deviation.toFixed(2) })))

    const standardizedVectors = rawVectors.map(row =>
      row.map((val, colIndex) => (val - stats[colIndex].mean) / stats[colIndex].deviation)
    )

    console.log('   Example Student (ID 0) Raw:', rawVectors[0])
    console.log('   Example Student (ID 0) Standardized:', standardizedVectors[0])

    // STEP 3: EIGENDECOMPOSITION
    const vectors = PCA.getEigenVectors(standardizedVectors)

    console.log('3. Eigenvectors (The "Loadings"):')
    console.log('   Raw PC1 Object:', vectors[0])
    console.log('   Raw PC2 Object:', vectors[1])

    // --- AUTOMATIC INTERPRETATION SCRIPT ---
    // This part extracts the weights and sorts them to tell you WHAT the axis means.
    const analyzeComponent = (vectorObj, name) => {
      const weights = vectorObj.eigenvector || vectorObj.vector || vectorObj

      if (!Array.isArray(weights) || weights.length !== numericKeys.length) {
        console.warn(`   ⚠️ Could not interpret ${name} automatically. Check structure.`, weights)
        return
      }

      // Map weights to variable names
      const contributions = weights.map((w, i) => ({
        variable: numericKeys[i],
        weight: w,
        absWeight: Math.abs(w)
      }))

      // Sort by absolute influence (highest first)
      contributions.sort((a, b) => b.absWeight - a.absWeight)

      console.log(`   🔎 INTERPRETATION of ${name}:`)
      console.log('      Top 5 Contributors (Variables that drive this axis):')
      console.table(contributions.slice(0, 5).map(c => ({
        Variable: c.variable,
        Influence: c.weight.toFixed(3) // Positive/Negative matters
      })))
    }

    try {
      analyzeComponent(vectors[0], 'PC1 (X-Axis)')
      analyzeComponent(vectors[1], 'PC2 (Y-Axis)')
    } catch (e) {
      console.error('Error in auto-interpretation:', e)
    }
    // ---------------------------------------

    // STEP 4: PROJECTION
    const adData = PCA.computeAdjustedData(standardizedVectors, vectors[0], vectors[1])

    this.pcaData = adData.formattedAdjustedData[0].map((val, i) => ({
      id: data[i].id,
      x: val * -1,
      y: adData.formattedAdjustedData[1][i],
      G3: data[i].G3
    }))

    console.groupEnd()

    // =========================================================
    //                 VISUALIZATION (D3.js)
    // =========================================================

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

    // Axis Labels
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

    // --- BRUSH IMPLEMENTATION ---
    const brush = d3.brush()
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on('start brush end', (event) => {
        if (!event.selection) {
          if (event.type === 'end' && event.sourceEvent) {
            onSelection(null)
          }
          return
        }
        const [[x0, y0], [x1, y1]] = event.selection
        const selectedPoints = this.pcaData.filter(d => {
          const cx = this.xScale(d.x)
          const cy = this.yScale(d.y)
          return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1
        })
        const selectedIds = selectedPoints.map(d => d.id)
        onSelection(selectedIds)
      })

    this.svg.append('g')
      .attr('class', 'brush')
      .call(brush)

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
      .style('pointer-events', 'all')
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
