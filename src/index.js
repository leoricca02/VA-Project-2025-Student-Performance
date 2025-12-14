import 'normalize.css'
import './styles/index.scss'
import * as d3 from 'd3'
import rawImport from '../data/student-mat.csv'

import ScatterPlot from './ScatterPlot'
import ParallelPlot from './ParallelPlot'
import PCAChart from './PCAChart'
import BarChart from './BarChart'
import HistogramPlot from './HistogramPlot'
import { calculateCorrelation } from './utils'

window.app = (new class {
  constructor () {
    this.data = []

    this.scatterPlot = new ScatterPlot()
    this.parallelPlot = new ParallelPlot()
    this.pcaChart = new PCAChart()
    this.histogramPlot = new HistogramPlot()
    this.barCharts = []

    this.categoricalFilters = {}
    this.rangeFilters = {}
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

    this.data = this.data.filter(d => !isNaN(d.G3) && d.school)
    console.log('2. Data Loaded. Rows:', this.data.length)

    // --- CLEAR UI ---
    d3.select('.center .top').html('')
    d3.select('.center .down').html('')
    d3.select('.pca-plot').html('')
    d3.select('.left').html('')

    // --- INIT CHARTS ---
    this.parallelPlot.initChart('.center .top', this.data, (activeFilters) => {
      this.rangeFilters = activeFilters
      this.applyAllFilters()
    })

    this.scatterPlot.initChart('.center .down', this.data)

    // PCA Chart Setup
    const pcaContainer = d3.select('.pca-plot')

    // 1. Configure Parent Flex Container
    pcaContainer
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('height', '100%')
      .style('overflow', 'hidden')

    // 2. Create Chart Container (Flex Grow)
    const pcaChartDiv = pcaContainer.append('div')
      .attr('class', 'pca-chart-container')
      .style('flex', '1') // Fill remaining space
      .style('width', '100%')
      .style('position', 'relative')
      .style('overflow', 'hidden') // Clip any internal overflow

    // 3. Create Text Container (Fixed/Natural Height)
    const pcaTextDiv = pcaContainer.append('div')
      .attr('class', 'pca-text-container')
      .style('flex-shrink', '0') // Don't shrink
      .style('padding', '10px')
      .style('background', '#fafafa') // Ensure background covers any under-draw
      .style('border-top', '1px solid #ddd')
      .style('z-index', '10') // Ensure text sits on top if needed

    // 4. POPULATE TEXT FIRST (Matches Python Scaled Result)
    pcaTextDiv.html(`
        <strong>Interpretation (Standardized):</strong><br>
        <span style="color: #333;">PC1 (X-Axis):</span> <em>Academic Performance</em><br>
        Driven by G1, G2, G3 and Failures.<br>
        <span style="color: #333;">PC2 (Y-Axis):</span> <em>Social/Alcohol Behavior</em><br>
        Driven by Walc, Dalc, and GoOut.
    `)

    // 5. Initialize Chart
    this.pcaChart.initChart(pcaChartDiv.node(), this.data)

    // Re-apply Text (safety)
    pcaTextDiv.html(`
        <strong>Interpretation (Standardized):</strong><br>
        <span style="color: #333;">PC1 (X-Axis):</span> <em>Academic Performance</em><br>
        Driven by G1, G2, G3 and Failures.<br>
        <span style="color: #333;">PC2 (Y-Axis):</span> <em>Social/Alcohol Behavior</em><br>
        Driven by Walc, Dalc, and GoOut.
    `)

    // Stats & UI Controls
    this.updateStats(this.data)

    const leftPanel = d3.select('.left')

    // Reset Button
    leftPanel.append('button')
      .text('↺ Reset All Filters')
      .style('width', '100%')
      .style('padding', '8px')
      .style('margin', '10px 0')
      .style('background', '#607d8b')
      .style('color', 'white')
      .style('border', 'none')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .on('click', () => window.location.reload())

    // Bar Charts Container
    const barContainer = leftPanel.append('div').attr('class', 'bar-charts-container')

    const createBar = (attr, label) => {
      const div = barContainer.append('div').attr('class', 'bar-chart-box')
      const chart = new BarChart()
      chart.initChart(div.node(), this.data, attr, label, (attribute, value) => {
        if (this.categoricalFilters[attribute] === value) {
          delete this.categoricalFilters[attribute]
        } else {
          this.categoricalFilters[attribute] = value
        }
        this.applyAllFilters()
      })
      this.barCharts.push(chart)
    }

    createBar('internet', 'Internet Access')
    createBar('romantic', 'Romantic Relationship')

    // Histogram Container
    const histDiv = leftPanel.append('div').attr('class', 'histogram-box').style('margin-top', '10px')
    this.histogramPlot.initChart(histDiv.node(), this.data)
  }

  applyAllFilters () {
    const filteredData = this.data.filter(d => {
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
    const correlation = calculateCorrelation(filteredData, 'absences', 'G3')

    const gradeColor = selectedAvgGrade >= globalAvgGrade ? '#2e7d32' : '#c62828'
    const failColor = failRate > 33 ? '#c62828' : '#2e7d32'

    let statsContainer = d3.select('.left .stats-container')
    if (statsContainer.empty()) {
      statsContainer = d3.select('.left').insert('div', ':first-child').attr('class', 'stats-container')
    }

    const html = `
          <div style="font-family: sans-serif; padding-bottom: 10px; border-bottom: 2px solid #ddd; margin-bottom: 10px;">
            <h3 style="margin-top:0; text-align:center;">Real-time Analytics</h3>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Count</div>
                    <div style="font-weight: bold; font-size: 16px;">${selectedCount}</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Avg Grade</div>
                    <div style="font-weight: bold; font-size: 16px; color: ${gradeColor};">${selectedAvgGrade.toFixed(1)}</div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between;">
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Fail Rate</div>
                    <div style="font-weight: bold; font-size: 16px; color: ${failColor};">${failRate.toFixed(1)}%</div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="font-size: 12px; color: #555;">Corr(Abs,G3)</div>
                    <div style="font-weight: bold; font-size: 16px;">${correlation.toFixed(2)}</div>
                </div>
            </div>
          </div>
      `

    statsContainer.html(html)
  }
}())

window.app.run()
