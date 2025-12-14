import * as d3 from 'd3'

export default {
  // Colors
  COLOR_PRIMARY: '#4caf50',
  COLOR_BG: '#ffffff',

  // Color Scale for Grades (0-20)
  // We use a diverging scale: Red (0) -> Yellow (10) -> Green (20)
  COLOR_SCALE: d3.scaleLinear()
    .domain([0, 10, 20])
    .range(['#d32f2f', '#fbc02d', '#388e3c'])
    .clamp(true), // Ensure values outside 0-20 don't break color

  // Chart Configurations
  MARGIN: { top: 40, right: 40, bottom: 50, left: 60 },
  TRANSITION_DURATION: 500,

  // Formatters
  FORMAT_NUMBER: d3.format('.2f')
}
