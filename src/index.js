import 'normalize.css'
import './styles/index.scss'
import * as d3 from 'd3'
import rawImport from '../data/student-mat.csv'

import ScatterPlot from './ScatterPlot'
import ParallelPlot from './ParallelPlot'
import PCAChart from './PCAChart'
import BarChart from './BarChart'
import HistogramPlot from './HistogramPlot'
import BoxPlot from './BoxPlot'
import CONST from './constants'

window.app = (new class {
  constructor () {
    this.data = []

    this.scatterPlot = new ScatterPlot()
    this.parallelPlot = new ParallelPlot()
    this.pcaChart = new PCAChart()
    this.histogramPlot = new HistogramPlot()
    this.ageBoxPlot = new BoxPlot()
    this.absBoxPlot = new BoxPlot()
    this.barCharts = []

    this.categoricalFilters = {}
    this.rangeFilters = {}

    // State for single student selection
    this.selectedStudentId = null

    // Resize debouncer
    this.resizeTimer = null
  }

  run () {
    console.log('1. Starting Application...')

    // --- DATA LOADING & PARSING ---
    let objectsData = []
    if (Array.isArray(rawImport[0])) {
      const headers = rawImport[0]
      const rows = rawImport.slice(1)
      objectsData = rows.map(row => {
        const obj = {}
        headers.forEach((key, index) => {
          const cleanKey = key.trim().replace(/^"|"$/g, '')
          obj[cleanKey] = row[index]
        })
        return obj
      })
    } else {
      const firstObj = rawImport[0]
      const keys = Object.keys(firstObj)
      const brokenKey = keys.find(k => k.includes(';'))
      if (brokenKey) {
        let csvString = brokenKey + '\n'
        csvString += rawImport.map(d => d[brokenKey]).join('\n')
        objectsData = d3.dsvFormat(';').parse(csvString)
      } else {
        objectsData = rawImport
      }
    }

    this.data = objectsData.map((d, i) => {
      const safeGet = (val) => val === undefined ? null : val
      return {
        id: i,
        school: safeGet(d.school),
        sex: safeGet(d.sex),
        age: +d.age,
        address: safeGet(d.address),
        famsize: safeGet(d.famsize),
        Pstatus: safeGet(d.Pstatus),
        Medu: +d.Medu,
        Fedu: +d.Fedu,
        Mjob: safeGet(d.Mjob),
        Fjob: safeGet(d.Fjob),
        guardian: safeGet(d.guardian),
        traveltime: +d.traveltime,
        studytime: +d.studytime,
        failures: +d.failures,
        schoolsup: safeGet(d.schoolsup),
        famsup: safeGet(d.famsup),
        paid: safeGet(d.paid),
        activities: safeGet(d.activities),
        nursery: safeGet(d.nursery),
        higher: safeGet(d.higher),
        internet: safeGet(d.internet),
        romantic: safeGet(d.romantic),
        famrel: +d.famrel,
        freetime: +d.freetime,
        goout: +d.goout,
        Dalc: +d.Dalc,
        Walc: +d.Walc,
        health: +d.health,
        absences: +d.absences,
        G1: +d.G1,
        G2: +d.G2,
        G3: +d.G3
      }
    })

    // --- DATA CLEANING ---
    const originalCount = this.data.length
    this.data = this.data.filter(d => {
      if (isNaN(d.G3) || !d.school) return false
      // Remove students with 0 Absences AND 0 Grade (Ghost data)
      if (d.absences === 0 && d.G3 === 0) return false
      return true
    })
    console.log(`Removed ${originalCount - this.data.length} invalid/ghost records.`)

    // --- INITIAL DRAW ---
    this.initAllCharts()

    // --- RESIZE LISTENER ---
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        console.log('Window resized - Redrawing charts...')
        this.initAllCharts()
      }, 200) // Debounce delay
    })
  }

  initAllCharts () {
    // 1. Parallel Plot
    this.parallelPlot.initChart('.center .top', this.data, (activeFilters) => {
      this.rangeFilters = activeFilters
      this.selectedStudentId = null
      this.applyAllFilters()
    })

    // 2. Scatter Plot
    this.scatterPlot.initChart('.center .down', this.data, (studentId) => {
      if (this.selectedStudentId === studentId) {
        this.selectedStudentId = null
      } else {
        this.selectedStudentId = studentId
      }
      this.applyAllFilters()
    })

    // 3. PCA Chart & Interface
    this.initPCAInterface()

    // 4. Left Panel Controls
    this.initLeftPanel()

    // Re-apply filters to restore state after redraw
    this.applyAllFilters()
  }

  initPCAInterface () {
    const pcaContainer = d3.select('.pca-plot')
    pcaContainer.selectAll('*').remove() // Clear previous

    // 1. Text Container (NOW ON TOP)
    const pcaTextDiv = pcaContainer.append('div')
      .attr('class', 'pca-text-container')
      .style('flex', '0 0 auto') // Don't grow, don't shrink
      .style('padding-bottom', '1rem')
      .style('border-bottom', '1px solid #ddd')
      .style('margin-bottom', '1rem')
      .style('font-size', '0.8rem') // Responsive font

    pcaTextDiv.html(`
        <strong style="font-size: 1rem;">Interpretation:</strong><br>
        <span style="color: #333; font-weight:bold;">PC1:</span> Academic Performance (Grades)<br> 
        <span style="color: #666; font-size: 0.75rem;">G2 (0.47), G3 (0.45), G1 (0.45), Failures (0.32)</span> <br>
        <div style="margin-top:0.5rem"></div>
        <span style="color: #333; font-weight:bold;">PC2:</span> Lifestyle (Alcohol/Social) <br> 
        <span style="color: #666; font-size: 0.75rem;">Walc (0.52), Dalc (0.50), GoOut (0.37)</span> <br>
    `)

    // 2. Chart Container (NOW ON BOTTOM)
    const pcaChartDiv = pcaContainer.append('div')
      .attr('class', 'pca-chart-container')
      .style('flex', '1') // Fill remaining space
      .style('width', '100%')
      .style('position', 'relative')
      .style('min-height', '200px') // Ensure visibility

    this.pcaChart.initChart(pcaChartDiv.node(), this.data)
  }

  initLeftPanel () {
    const leftPanel = d3.select('.left')
    leftPanel.selectAll('*').remove()

    // Stats Container
    leftPanel.append('div').attr('class', 'stats-container')
    this.updateStats(this.data) // Initial stats

    // Reset Button
    leftPanel.append('button')
      .text('↺ Reset Filters')
      .style('width', '100%')
      .style('padding', '0.5rem')
      .style('margin-bottom', '1rem')
      .style('background', '#607d8b')
      .style('color', 'white')
      .style('border', 'none')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .style('font-size', '0.9rem')
      .on('click', () => window.location.reload())

    // Bar Charts
    this.barCharts = []
    const barContainer = leftPanel.append('div').attr('class', 'bar-charts-container')

    const createBar = (attr, label) => {
      const div = barContainer.append('div').attr('class', 'bar-chart-box').style('margin-bottom', '1rem')
      const chart = new BarChart()
      chart.initChart(div.node(), this.data, attr, label, (attribute, value) => {
        if (this.categoricalFilters[attribute] === value) delete this.categoricalFilters[attribute]
        else this.categoricalFilters[attribute] = value
        this.selectedStudentId = null
        this.applyAllFilters()
      })
      this.barCharts.push(chart)
    }
    createBar('internet', 'Internet Access')
    createBar('romantic', 'Romantic Relationship')

    // Box Plots
    const boxContainer = leftPanel.append('div').style('display', 'flex').style('justify-content', 'space-between').style('margin-bottom', '1rem')
    const ageDiv = boxContainer.append('div').style('width', '48%')
    const absDiv = boxContainer.append('div').style('width', '48%')

    this.ageBoxPlot.initChart(ageDiv.node(), this.data, 'age', 'Age Dist.')
    this.absBoxPlot.initChart(absDiv.node(), this.data, 'absences', 'Absences Dist.')

    // Histogram
    const histDiv = leftPanel.append('div').attr('class', 'histogram-box')
    this.histogramPlot.initChart(histDiv.node(), this.data)
  }

  applyAllFilters () {
    const filteredData = this.data.filter(d => {
      if (this.selectedStudentId !== null) {
        return d.id === this.selectedStudentId
      }
      for (const [key, range] of Object.entries(this.rangeFilters)) {
        const value = d[key]
        if (value < range[0] || value > range[1]) return false
      }
      for (const [key, value] of Object.entries(this.categoricalFilters)) {
        if (d[key] !== value) return false
      }
      return true
    })

    this.scatterPlot.updateSelection(filteredData)
    this.parallelPlot.updateSelection(filteredData)
    this.pcaChart.updateSelection(filteredData)
    this.barCharts.forEach(chart => chart.updateSelection(filteredData))
    this.histogramPlot.updateSelection(filteredData)
    this.ageBoxPlot.updateSelection(filteredData)
    this.absBoxPlot.updateSelection(filteredData)
    this.updateStats(filteredData)
  }

  updateStats (filteredData) {
    const totalStudents = this.data.length
    const globalAvgGrade = d3.mean(this.data, d => d.G3)
    const globalAvgAbsences = d3.mean(this.data, d => d.absences)

    const selectedCount = filteredData.length
    const selectedAvgGrade = d3.mean(filteredData, d => d.G3) || 0
    const selectedAvgAbsences = d3.mean(filteredData, d => d.absences) || 0

    const failCount = filteredData.filter(d => d.G3 < 10).length
    const failRate = selectedCount > 0 ? (failCount / selectedCount) * 100 : 0
    const globalFailRate = totalStudents > 0 ? (this.data.filter(d => d.G3 < 10).length / totalStudents) * 100 : 0

    const COLOR_GOOD = CONST.COLOR_PRIMARY
    const COLOR_BAD = '#d6604d'
    const gradeColor = selectedAvgGrade >= globalAvgGrade ? COLOR_GOOD : COLOR_BAD
    const failColor = failRate > 33 ? COLOR_BAD : COLOR_GOOD

    const container = d3.select('.stats-container')

    const html = `
      <h3>Real-time Analytics</h3>
      ${this.selectedStudentId !== null ? '<div style="text-align:center; background:#fff9c4; padding:0.3rem; margin-bottom:0.5rem; font-size:0.8rem; border-radius:4px;">Selection Active</div>' : ''}
      
      <div class="stat-row">
         <div class="stat-box">
            <div class="label">Count</div>
            <div class="value">${selectedCount}</div>
            <div class="sub">/ ${totalStudents}</div>
         </div>
         <div class="stat-box">
            <div class="label">Avg Grade</div>
            <div class="value" style="color: ${gradeColor};">${selectedAvgGrade.toFixed(1)}</div>
            <div class="sub">Global: ${globalAvgGrade.toFixed(1)}</div>
         </div>
      </div>
      <div class="stat-row">
         <div class="stat-box">
            <div class="label">Avg Abs.</div>
            <div class="value">${selectedAvgAbsences.toFixed(1)}</div>
            <div class="sub">Global: ${globalAvgAbsences.toFixed(1)}</div>
         </div>
         <div class="stat-box">
            <div class="label">Fail Rate</div>
            <div class="value" style="color: ${failColor};">${failRate.toFixed(1)}%</div>
            <div class="sub">Global: ${globalFailRate.toFixed(1)}%</div>
         </div>
      </div>
    `
    container.html(html)
  }
}())

window.app.run()
