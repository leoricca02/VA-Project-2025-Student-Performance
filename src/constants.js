import * as d3 from 'd3';

export default {
    // Colors
    COLOR_PRIMARY: '#4caf50',   // Green (promoted/good)
    COLOR_ACCENT: '#ff9800',    // Orange (selection)
    COLOR_BG: '#ffffff',
    
    // Chart Configurations
    MARGIN: { top: 40, right: 40, bottom: 50, left: 60 },
    TRANSITION_DURATION: 500,
    
    // Formatters
    FORMAT_NUMBER: d3.format(".2f"), // 2 decimal places
}