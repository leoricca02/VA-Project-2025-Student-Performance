import * as d3 from 'd3';
import CONST from './constants';

export default class BarChart {
    constructor() {
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 20, right: 10, bottom: 30, left: 30 };
        this.onFilterCallback = null;
    }

    /**
     * @param {string} selector - CSS selector
     * @param {Array} data - Full dataset
     * @param {string} attribute - The categorical attribute to visualize (e.g., 'internet')
     * @param {Function} onFilter - Callback(attribute, selectedValue)
     */
    initChart(selector, data, attribute, label, onFilter) {
        this.data = data;
        this.attribute = attribute;
        this.onFilterCallback = onFilter;

        const container = d3.select(selector);
        
        // Add Title
        container.append('h4')
            .style('margin', '10px 0 5px 0')
            .style('text-align', 'center')
            .style('font-size', '12px')
            .text(label);

        const rect = container.node().getBoundingClientRect();
        this.width = rect.width || 200;
        this.height = 120; // Fixed height for small multiples

        const innerWidth = this.width - this.margin.left - this.margin.right;
        const innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.svg = container.append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // 1. Group Data
        this.counts = d3.rollups(data, v => v.length, d => d[attribute])
            .sort((a, b) => d3.ascending(a[0], b[0])); // Sort alphabetically
        
        // 2. Scales
        this.xScale = d3.scaleBand()
            .domain(this.counts.map(d => d[0]))
            .range([0, innerWidth])
            .padding(0.2);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(this.counts, d => d[1])])
            .range([innerHeight, 0]);

        // 3. Axes
        this.svg.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(this.xScale));

        this.svg.append('g')
            .call(d3.axisLeft(this.yScale).ticks(4));

        // 4. Draw Bars (Background - Total)
        this.svg.selectAll('.bar-bg')
            .data(this.counts)
            .enter().append('rect')
            .attr('class', 'bar-bg')
            .attr('x', d => this.xScale(d[0]))
            .attr('y', d => this.yScale(d[1]))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => innerHeight - this.yScale(d[1]))
            .attr('fill', '#eee')
            .attr('stroke', '#ccc')
            .on('click', (event, d) => {
                // Handle Click -> Filter
                if (this.onFilterCallback) {
                    // Toggle selection logic could go here, 
                    // for now simple selection
                    this.onFilterCallback(this.attribute, d[0]);
                    
                    // Highlight selected bar visually
                    this.svg.selectAll('.bar-bg').attr('stroke', '#ccc').attr('stroke-width', 1);
                    d3.select(event.currentTarget).attr('stroke', '#333').attr('stroke-width', 2);
                }
            });

        // 5. Draw Bars (Foreground - Filtered)
        // Initially full height
        this.foregroundBars = this.svg.selectAll('.bar-fg')
            .data(this.counts)
            .enter().append('rect')
            .attr('class', 'bar-fg')
            .attr('x', d => this.xScale(d[0]))
            .attr('y', d => this.yScale(d[1]))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => innerHeight - this.yScale(d[1]))
            .attr('fill', CONST.COLOR_PRIMARY)
            .style('pointer-events', 'none'); // Let clicks pass through to background bars
    }

    /**
     * Updates the foreground bars to show count of filtered data
     */
    updateSelection(filteredData) {
        // Recalculate counts for filtered data
        const filteredCountsMap = d3.rollup(filteredData, v => v.length, d => d[this.attribute]);

        const innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.foregroundBars
            .transition().duration(CONST.TRANSITION_DURATION)
            .attr('y', d => {
                const count = filteredCountsMap.get(d[0]) || 0;
                return this.yScale(count);
            })
            .attr('height', d => {
                const count = filteredCountsMap.get(d[0]) || 0;
                return innerHeight - this.yScale(count);
            });
    }
}