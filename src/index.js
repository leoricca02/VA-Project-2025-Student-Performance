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
  }

  run () {
    console.log('1. Starting Application...')

    // --- DATA LOADING ---
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

    // --- DATA CLEANING & FILTERING ---
    const originalCount = this.data.length
    this.data = this.data.filter(d => {
      // 1. Basic Validity
      if (isNaN(d.G3) || !d.school) return false

      // 2. "GHOST" DATA REMOVAL
      // Remove students with 0 Absences AND 0 Grade.
      // Rationale: High likelihood of data entry error or dropout.
      if (d.absences === 0 && d.G3 === 0) return false

      return true
    })

    console.log(`Removed ${originalCount - this.data.length} invalid/ghost records.`)

    // --- INIT CHARTS ---

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

    // 3. PCA Chart
    const pcaContainer = d3.select('.pca-plot')
    pcaContainer.style('display', 'flex').style('flex-direction', 'column').style('height', '100%')
    const pcaChartDiv = pcaContainer.append('div').attr('class', 'pca-chart-container').style('flex', '1').style('width', '100%').style('position', 'relative')
    const pcaTextDiv = pcaContainer.append('div').attr('class', 'pca-text-container').style('flex-shrink', '0').style('padding', '10px').style('background', '#fafafa').style('border-top', '1px solid #ddd')

    pcaTextDiv.html(`
        <strong>Interpretation:</strong><br>
        <span style="color: #333;">PC1:</span> Academic Performance (Grades)<br> </span> G2 -> 0.467762, G3 -> 0.452654, G1 -> 0.451066, failures -> 0.317766, Medu -> 0.230058 <br>
        <span style="color: #333;">PC2:</span> Lifestyle (Alcohol/Going Out) <br> </span> Walc -> 0.518704, Dalc -> 0.500410, goout -> 0.374682, freetime -> 0.290236, studytime -> 0.216797 <br>
    `)

    this.pcaChart.initChart(pcaChartDiv.node(), this.data)

    // Left Panel
    const leftPanel = d3.select('.left')
    this.updateStats(this.data)

    // Reset Button
    leftPanel.append('button')
      .text('↺ Reset Filters & Selection')
      .style('width', '100%').style('padding', '8px').style('margin', '10px 0').style('background', '#607d8b').style('color', 'white').style('border', 'none').style('cursor', 'pointer')
      .on('click', () => window.location.reload())

    // Bar Charts
    const barContainer = leftPanel.append('div').attr('class', 'bar-charts-container')
    const createBar = (attr, label) => {
      const div = barContainer.append('div').attr('class', 'bar-chart-box')
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
    const boxContainer = leftPanel.append('div').style('display', 'flex').style('justify-content', 'space-between')
    const ageDiv = boxContainer.append('div').style('width', '48%')
    const absDiv = boxContainer.append('div').style('width', '48%')

    this.ageBoxPlot.initChart(ageDiv.node(), this.data, 'age', 'Age Distribution')
    this.absBoxPlot.initChart(absDiv.node(), this.data, 'absences', 'Absences Distribution')

    // Histogram
    const histDiv = leftPanel.append('div').attr('class', 'histogram-box').style('margin-top', '10px')
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

    // Global Fail Rate
    const globalFailCount = this.data.filter(d => d.G3 < 10).length
    const globalFailRate = totalStudents > 0 ? (globalFailCount / totalStudents) * 100 : 0

    const COLOR_GOOD = CONST.COLOR_PRIMARY
    const COLOR_BAD = '#d6604d'

    const gradeColor = selectedAvgGrade >= globalAvgGrade ? COLOR_GOOD : COLOR_BAD
    const absenceColor = selectedAvgAbsences <= globalAvgAbsences ? COLOR_GOOD : COLOR_BAD
    const failColor = failRate > 33 ? COLOR_BAD : COLOR_GOOD

    let statsContainer = d3.select('.left .stats-container')
    if (statsContainer.empty()) {
      statsContainer = d3.select('.left').insert('div', ':first-child').attr('class', 'stats-container')
    }

    const html = `
          <div style="font-family: sans-serif; padding-bottom: 10px; border-bottom: 2px solid #ddd; margin-bottom: 10px;">
            <h3 style="margin-top:0; text-align:center;">Real-time Analytics</h3>
            ${this.selectedStudentId !== null ? '<div style="text-align:center; background:#fff9c4; padding:4px; margin-bottom:5px; font-size:12px; border:1px solid #fbc02d; border-radius:4px;">User Selected (Click again to reset)</div>' : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Count</div>
                    <div style="font-weight: bold; font-size: 16px;">${selectedCount}</div>
                    <div style="font-size: 10px; color: #999;">/ ${totalStudents}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Avg Grade</div>
                    <div style="font-weight: bold; font-size: 16px; color: ${gradeColor};">${selectedAvgGrade.toFixed(1)}</div>
                    <div style="font-size: 10px; color: #999;">Global: ${globalAvgGrade.toFixed(1)}</div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Avg Absences</div>
                    <div style="font-weight: bold; font-size: 16px; color: ${absenceColor};">${selectedAvgAbsences.toFixed(1)}</div>
                    <div style="font-size: 10px; color: #999;">Global: ${globalAvgAbsences.toFixed(1)}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Fail Rate</div>
                    <div style="font-weight: bold; font-size: 16px; color: ${failColor};">${failRate.toFixed(1)}%</div>
                    <div style="font-size: 10px; color: #999;">Global: ${globalFailRate.toFixed(1)}%</div>
                </div>
            </div>
          </div>
      `
    statsContainer.html(html)
  }
}())

window.app.run()
