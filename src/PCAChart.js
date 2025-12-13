import * as d3 from 'd3';
import PCA from 'pca-js';
import CONST from './constants';

export default class PCAChart {
    constructor() {
        this.svg = null;
        this.margin = { top: 30, right: 30, bottom: 50, left: 50 };
        this.width = 0;
        this.height = 0;
    }

    initChart(selector, data) {
        const container = d3.select(selector);
        const rect = container.node().getBoundingClientRect();
        this.width = rect.width || 300;
        this.height = rect.height || 300;

        const innerWidth = this.width - this.margin.left - this.margin.right;
        const innerHeight = this.height - this.margin.top - this.margin.bottom;

        container.selectAll('*').remove();

        // Title
        container.append('h3')
            .style('text-align', 'center')
            .style('font-size', '14px')
            .style('margin', '5px 0')
            .text('PCA Projection (Cluster Analysis)');

        this.svg = container.append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // --- 1. PREPARE DATA FOR PCA ---
        // Select only numeric columns suitable for PCA
        const numericKeys = ['age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures', 
                             'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 'G1', 'G2', 'G3'];
        
        // Extract raw values (array of arrays)
        const rawVectors = data.map(d => numericKeys.map(key => d[key]));
        
        // Calculate PCA using the library
        // vectors: [PC1, PC2] for each data point
        const vectors = PCA.getEigenVectors(rawVectors);
        const adData = PCA.computeAdjustedData(rawVectors, vectors[0], vectors[1]);

        // Merge PCA coordinates back with original IDs
        this.pcaData = adData.formattedAdjustedData[0].map((val, i) => ({
            id: data[i].id,
            x: val,
            y: adData.formattedAdjustedData[1][i]
        }));

        // --- 2. SCALES ---
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.pcaData, d => d.x))
            .range([0, innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain(d3.extent(this.pcaData, d => d.y))
            .range([innerHeight, 0]);

        // --- 3. AXES ---
        this.svg.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(this.xScale).ticks(5));

        this.svg.append('text')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .style('text-anchor', 'middle')
            .style('font-size', '10px')
            .text('Principal Component 1');

        this.svg.append('g')
            .call(d3.axisLeft(this.yScale).ticks(5));

        this.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -35)
            .style('text-anchor', 'middle')
            .style('font-size', '10px')
            .text('Principal Component 2');

        // --- 4. DRAW POINTS ---
        this.circles = this.svg.selectAll('circle')
            .data(this.pcaData)
            .enter()
            .append('circle')
            .attr('cx', d => this.xScale(d.x))
            .attr('cy', d => this.yScale(d.y))
            .attr('r', 4)
            .attr('fill', CONST.COLOR_PRIMARY)
            .attr('opacity', 0.6)
            .attr('stroke', '#333')
            .attr('stroke-width', 0.5);
    }

    updateSelection(filteredData) {
        const activeIds = new Set(filteredData.map(d => d.id));

        this.svg.selectAll('circle')
            .transition().duration(200)
            .attr('fill', d => activeIds.has(d.id) ? CONST.COLOR_PRIMARY : '#ddd')
            .attr('opacity', d => activeIds.has(d.id) ? 0.8 : 0.1)
            .attr('r', d => activeIds.has(d.id) ? 5 : 2);
    }
}