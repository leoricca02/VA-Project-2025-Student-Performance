import * as d3 from 'd3'

export default {
  // Colors
  COLOR_PRIMARY: '#4caf50',
  COLOR_BG: '#ffffff',

  // Color Scale for Grades (0-20)
  COLOR_SCALE: d3.scaleLinear()
    .domain([0, 10, 20])
    .range(['#d32f2f', '#fbc02d', '#388e3c'])
    .clamp(true),

  // Chart Configurations
  MARGIN: { top: 40, right: 40, bottom: 50, left: 60 },
  TRANSITION_DURATION: 500,

  // Parallel Plot Dimensions
  PARALLEL_DIMENSIONS: ['age', 'studytime', 'failures', 'Dalc', 'Walc', 'health'],
  PARALLEL_DIM_LABELS: {
    age: 'Age (Years)',
    studytime: 'Weekly Study (1:<2h ... 4:>10h)',
    failures: 'Past Failures (Count)',
    Dalc: 'Workday Alc. (1=Low...5=High)',
    Walc: 'Weekend Alc. (1=Low...5=High)',
    health: 'Health (1=Bad...5=Good)'
  },

  // Formatters
  FORMAT_NUMBER: d3.format('.2f')
}
