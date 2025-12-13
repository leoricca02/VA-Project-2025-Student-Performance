import 'normalize.css'
import './styles/index.scss'
import * as d3 from 'd3'
import rawImport from '../data/student-mat.csv'

import ScatterPlot from './ScatterPlot';
import ParallelPlot from './ParallelPlot';
import PCAChart from './PCAChart';
import BarChart from './BarChart'; // Import new component

window.app = (new class {
  constructor() {
    this.data = []
    
    // Charts
    this.scatterPlot = new ScatterPlot();
    this.parallelPlot = new ParallelPlot();
    this.pcaChart = new PCAChart();
    
    // Bar Charts Array
    this.barCharts = [];
    
    // State for categorical filters: { 'internet': 'yes', 'sex': 'F' }
    this.categoricalFilters = {};
    // State for range filters (from ParallelPlot)
    this.rangeFilters = {};
  }

  run() {
    console.log("1. Starting Application...");

    // --- DATA LOADING ---
    let objectsData = [];
    if (Array.isArray(rawImport[0])) {
        const headers = rawImport[0];
        const rows = rawImport.slice(1);
        objectsData = rows.map(row => {
            let obj = {};
            headers.forEach((key, index) => {
                const cleanKey = key.trim().replace(/^"|"$/g, ''); 
                obj[cleanKey] = row[index];
            });
            return obj;
        });
    } else {
        const firstObj = rawImport[0];
        const keys = Object.keys(firstObj);
        const brokenKey = keys.find(k => k.includes(';'));
        if (brokenKey) {
            let csvString = brokenKey + "\n"; 
            csvString += rawImport.map(d => d[brokenKey]).join("\n");
            objectsData = d3.dsvFormat(";").parse(csvString);
        } else {
            objectsData = rawImport;
        }
    }

    this.data = objectsData.map((d, i) => {
        const safeGet = (val) => val === undefined ? null : val;
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
    });

    this.data = this.data.filter(d => !isNaN(d.G3) && d.school);
    console.log("2. Data Loaded. Rows:", this.data.length);

    // --- CLEAR UI ---
    d3.select('.center .top').html(''); 
    d3.select('.center .down').html(''); 
    d3.select('.pca-plot').html(''); 
    d3.select('.left').html('');     

    // --- INIT CHARTS ---

    // 1. Parallel Plot (Top)
    this.parallelPlot.initChart('.center .top', this.data, (activeFilters) => {
        this.rangeFilters = activeFilters; // Update state
        this.applyAllFilters();            // Re-apply all
    });

    // 2. Scatter Plot (Bottom)
    this.scatterPlot.initChart('.center .down', this.data);

    // 3. PCA Chart (Right)
    this.pcaChart.initChart('.pca-plot', this.data);

    // 4. Stats & Bar Charts (Left)
    this.updateStats(this.data); // Initial stats render
    
    // Container for Bar Charts (below stats)
    const barContainer = d3.select('.left').append('div').attr('class', 'bar-charts-container');

    // Helper to create a bar chart
    const createBar = (attr, label) => {
        const div = barContainer.append('div').attr('class', 'bar-chart-box'); // Wrapper div
        // FIX: Pass the DOM node, not the D3 selection
        const chart = new BarChart();
        chart.initChart(div.node(), this.data, attr, label, (attribute, value) => {
            // Toggle Logic: If clicking same value, clear filter. Else set it.
            if (this.categoricalFilters[attribute] === value) {
                 delete this.categoricalFilters[attribute];
            } else {
                this.categoricalFilters[attribute] = value;
            }
            this.applyAllFilters();
        });
        this.barCharts.push(chart);
    }

    // Create 3 Bar Charts
    createBar('internet', 'Internet Access');
    createBar('romantic', 'Romantic Relationship');
    createBar('Pstatus', 'Parent Cohabitation (T=Together)');

  }

  /**
   * Applies both Range filters (ParallelPlot) and Categorical filters (BarCharts)
   */
  applyAllFilters() {
    const filteredData = this.data.filter(d => {
        // 1. Check Range Filters
        for (const [key, range] of Object.entries(this.rangeFilters)) {
            const value = d[key];
            if (value < range[0] || value > range[1]) return false; 
        }
        
        // 2. Check Categorical Filters
        for (const [key, value] of Object.entries(this.categoricalFilters)) {
            if (d[key] !== value) return false;
        }

        return true;
    });

    // Update all views
    this.scatterPlot.updateSelection(filteredData);
    this.parallelPlot.updateSelection(filteredData);
    this.pcaChart.updateSelection(filteredData);
    
    // Update Bar Charts (Foreground)
    this.barCharts.forEach(chart => chart.updateSelection(filteredData));

    // Update Stats
    this.updateStats(filteredData);
  }

  updateStats(filteredData) {
      const totalStudents = this.data.length;
      const globalAvgGrade = d3.mean(this.data, d => d.G3);
      const globalAvgAbsences = d3.mean(this.data, d => d.absences);

      const selectedCount = filteredData.length;
      const selectedAvgGrade = d3.mean(filteredData, d => d.G3) || 0;
      const selectedAvgAbsences = d3.mean(filteredData, d => d.absences) || 0;

      const gradeColor = selectedAvgGrade >= globalAvgGrade ? '#2e7d32' : '#c62828';
      const absenceColor = selectedAvgAbsences <= globalAvgAbsences ? '#2e7d32' : '#c62828';

      // NOTE: We prepend this HTML to .left, careful not to overwrite bar charts if calling repeatedly
      // Strategy: Only update the stats container, assume it exists.
      
      let statsContainer = d3.select('.left .stats-container');
      if (statsContainer.empty()) {
          statsContainer = d3.select('.left').insert('div', ':first-child').attr('class', 'stats-container');
      }

      const html = `
          <div style="font-family: sans-serif; padding-bottom: 20px; border-bottom: 2px solid #ddd; margin-bottom: 20px;">
            <h3 style="margin-top:0; text-align:center;">Statistics</h3>
            
            <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 10px;">
                <h5 style="margin:0 0 5px 0; color: #555;">Selection</h5>
                <div style="font-size: 18px; font-weight: bold;">
                    ${selectedCount} / ${totalStudents}
                </div>
                <div style="width: 100%; background: #eee; height: 4px; border-radius: 2px; margin-top: 5px;">
                    <div style="width: ${(selectedCount/totalStudents)*100}%; background: #2196f3; height: 100%; border-radius: 2px; transition: width 0.3s;"></div>
                </div>
            </div>
            
            <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 10px;">
                <h5 style="margin:0 0 5px 0; color: #555;">Avg Grade (G3)</h5>
                <div style="font-size: 18px; font-weight: bold; color: ${gradeColor};">
                    ${selectedAvgGrade.toFixed(2)}
                </div>
                <small style="color: #666; font-size: 10px;">Global: ${globalAvgGrade.toFixed(2)}</small>
            </div>

            <div style="background: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
                <h5 style="margin:0 0 5px 0; color: #555;">Avg Absences</h5>
                <div style="font-size: 18px; font-weight: bold; color: ${absenceColor};">
                    ${selectedAvgAbsences.toFixed(2)}
                </div>
                <small style="color: #666; font-size: 10px;">Global: ${globalAvgAbsences.toFixed(2)}</small>
            </div>
          </div>
      `;

      statsContainer.html(html);
  }

}())

window.app.run()