import * as d3 from 'd3'

export default {
  // VISUAL ANALYTICS STANDARD: Use Blue/Orange or Purple/Green for accessibility.
  COLOR_PRIMARY: '#2196f3', // Blue primary
  COLOR_BG: '#ffffff',

  // Color Scale for Grades (0-20)
  // Diverging scale: Orange (Fail) -> White (Average) -> Blue (Pass/Excellent)
  COLOR_SCALE: d3.scaleLinear()
    .domain([0, 10, 20])
    .range(['#d6604d', '#f7f7f7', '#2166ac']) // Brewer RdBu scale roughly
    .clamp(true),

  // Chart Configurations
  MARGIN: { top: 40, right: 40, bottom: 50, left: 60 },
  TRANSITION_DURATION: 500,

  // Parallel Plot Dimensions
  // REVISED: Logical flow from Effort (Study) -> Lifestyle (Free/GoOut/Alc) -> Outcome (G3)
  PARALLEL_DIMENSIONS: ['studytime', 'freetime', 'goout', 'Dalc', 'Walc', 'absences', 'G3'],
  PARALLEL_DIM_LABELS: {
    studytime: 'Study Time (1-4)',
    freetime: 'Free Time (1-5)',
    goout: 'Going Out (1-5)',
    Dalc: 'Workday Alc. (1-5)',
    Walc: 'Weekend Alc. (1-5)',
    absences: 'Absences (n)',
    G3: 'Final Grade (0-20)'
  },

  // Formatters
  FORMAT_NUMBER: d3.format('.2f')
}
