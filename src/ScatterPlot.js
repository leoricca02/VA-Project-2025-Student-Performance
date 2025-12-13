import * as d3 from 'd3';
import CONST from './constants';

export default class ScatterPlot {
    constructor() {
        this.svg = null;
        this.width = 0;
        this.height = 0;
    }

    initChart(selector, data) {
        const container = d3.select(selector);
        const rect = container.node().getBoundingClientRect();
        
        this.width = rect.width || 600;
        this.height = rect.height || 400;

        const { MARGIN } = CONST;
        const innerWidth = this.width - MARGIN.left - MARGIN.right;
        const innerHeight = this.height - MARGIN.top - MARGIN.bottom;

        container.selectAll('*').remove();

        this.svg = container.append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

        // Scales
        const maxAbsences = d3.max(data, d => d.absences) || 93;
        this.xScale = d3.scaleLinear()
            .domain([0, maxAbsences])
            .range([0, innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain([0, 20]) 
            .range([innerHeight, 0]);

        // Axes
        this.svg.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(this.xScale));
            
        this.svg.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 40)
            .style('text-anchor', 'middle')
            .text('Number of Absences');

        this.svg.append('g')
            .call(d3.axisLeft(this.yScale));

        this.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -40)
            .style('text-anchor', 'middle')
            .text('Final Grade (G3)');

        // Tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('padding', '5px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Initial Draw (All points)
        this.drawPoints(data);
    }

    drawPoints(data) {
        // Data binding using ID
        const circles = this.svg.selectAll('circle')
            .data(data, d => d.id); 

        // EXIT
        circles.exit()
            .transition().duration(CONST.TRANSITION_DURATION)
            .attr('r', 0)
            .remove();

        // UPDATE
        circles.transition().duration(CONST.TRANSITION_DURATION)
            .attr('cx', d => this.xScale(d.absences))
            .attr('cy', d => this.yScale(d.G3));

        // ENTER
        circles.enter()
            .append('circle')
            .attr('cx', d => this.xScale(d.absences))
            .attr('cy', d => this.yScale(d.G3))
            .attr('r', 0)
            .attr('fill', CONST.COLOR_PRIMARY)
            .attr('opacity', 0.7)
            .attr('stroke', '#333')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', .9);
                this.tooltip.html(`
                    <strong>Student ID:</strong> ${d.id}<br/>
                    <strong>Grade:</strong> ${d.G3}/20<br/>
                    <strong>Absences:</strong> ${d.absences}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
                
                d3.select(event.currentTarget).attr('r', 8).attr('fill', CONST.COLOR_ACCENT);
            })
            .on('mouseout', (event, d) => {
                this.tooltip.transition().duration(500).style('opacity', 0);
                d3.select(event.currentTarget).attr('r', 5).attr('fill', CONST.COLOR_PRIMARY);
            })
            .transition().duration(CONST.TRANSITION_DURATION)
            .attr('r', 5);
    }

    /**
     * Updates the chart to show only filtered data.
     * We don't remove points, we just hide/show them or gray them out.
     */
    updateSelection(filteredData) {
        // Create a Set of active IDs for O(1) lookup speed
        const activeIds = new Set(filteredData.map(d => d.id));

        this.svg.selectAll('circle')
            .transition().duration(200)
            .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_PRIMARY : '#ddd') // Active vs Inactive color
            .attr('opacity', d => activeIds.has(d.id) ? 0.7 : 0.1) // Active vs Inactive opacity
            .attr('r', d => activeIds.has(d.id) ? 5 : 3)
            .style('pointer-events', d => activeIds.has(d.id) ? 'all' : 'none'); // Disable tooltip for inactive
    }
}