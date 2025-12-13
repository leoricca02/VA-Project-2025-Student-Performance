# Visual Analysis of Student Performance



## Visual Analytics Course - Fall 2025 Sapienza University of Rome



##### **Overview**



This project is a web-based Visual Analytics Dashboard designed to analyze the factors influencing student academic performance in secondary education. Using the UCI Student Performance Data Set, the tool helps school counselors and educational policymakers identify "at-risk" students by visually correlating their grades with social, demographic, and behavioral factors.



The system features coordinated multiple views (Brushing \& Linking), mandatory dimensionality reduction (PCA), and on-demand statistical analysis triggered by user interaction.



##### **Features**



###### **1. Interactive Visualizations**



Parallel Coordinates (Multidimensional Profile): Visualizes complex student profiles across variables like Age, Study Time, Alcohol Consumption, and Health. Allows range filtering (Brushing) on axes.



Scatter Plot (Performance Analysis): Maps Final Grade (G3) against Absences, instantly highlighting outliers (e.g., high absences but passing grades).



PCA Projection (Cluster Analysis): A 2D projection of the 33-dimensional dataset using Principal Component Analysis, revealing clusters of students with similar behaviors.



Context Bar Charts: Categorical filters for social factors like Internet Access, Romantic Relationships, and Parent Cohabitation.



###### **2. Advanced Interaction**



Brushing \& Linking: Selections in one chart (e.g., filtering for high alcohol consumption in Parallel Coordinates) automatically update all other views (Scatter Plot points fade, Bar Charts update counts).



On-Demand Analytics: A dynamic statistics panel calculates and compares the Average Grade and Absences of the selected subset versus the global population in real-time.



##### **Dataset**



The project uses the Student Performance Data Set (Math course) from the UCI Machine Learning Repository.



**Source**: UCI Machine Learning Repository



**Dimensions**: ~395 Instances (Students) x 33 Attributes.



**Compliance**: Meets the AS Index requirement (10,000 < N\*M < 50,000).



##### **Installation \& Usage**



###### **Prerequisites**



Node.js (Version 14+ recommended)



npm (comes with Node.js)



###### **Setup**



1. **Clone the repository:**



git clone https://github.com/leoricca02/VA-Project-2025-Student-Performance.git





2\. **Install dependencies:**



npm install





3\. **Run the development server:**



npm run start





4\. **Open your browser at:**

http://localhost:9000



##### **Technologies**



D3.js (v7): For all data visualizations and DOM manipulation.



PCA-js: For computing Principal Component Analysis.



Webpack: For bundling and development server.



Sass/SCSS: For styling.



##### **Authors**



**Leonardo Ricca - ID: 2211129**



**Federico Turrini - ID: 2175431**



Project developed for the Visual Analytics exam, Winter 2026 session.

