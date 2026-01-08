# 🎓 Visual Analysis of Student Performance

**Visual Analytics Course – Fall 2025**  
**Sapienza University of Rome**

---

## 📖 Overview

This project is a **web-based Visual Analytics Dashboard** designed to analyze the factors influencing **student academic performance in secondary education**.

Using the **UCI Student Performance Data Set**, the system enables **school counselors** and **educational policymakers** to identify **at-risk students** by visually correlating academic outcomes with **social, demographic, and behavioral factors**.

The dashboard implements:
- **Coordinated Multiple Views (CMV)** with *Brushing & Linking*
- **Mandatory dimensionality reduction** via **Principal Component Analysis (PCA)**
- **On-demand statistical analysis** triggered by user interaction

---

## ✨ Key Features

### 1. Interactive Visualizations

- **Parallel Coordinates (Multidimensional Profiles)**  
  Visualizes complex student profiles across variables such as:
  - Age
  - Study Time
  - Alcohol Consumption
  - Health
  
  Supports **range filtering (brushing)** on individual axes.

- **Scatter Plot (Performance vs. Study Time)**  
  Displays the relationship between:
  - Final Grade (G3)
  - Weekly Study Time
  
  Quickly highlights **outliers**, such as students with high absences but passing grades.

- **PCA Projection (Cluster Analysis)**  
  A **2D projection** of the original **33-dimensional dataset** using PCA, revealing clusters of students with similar behavioral and academic characteristics.

- **Contextual Bar Charts**  
  Categorical breakdowns for social and family-related factors, including:
  - Internet Access
  - Romantic Relationships

---

### 2. Advanced Interaction

- **Brushing & Linking**  
  Selections performed in one view (e.g., high alcohol consumption in Parallel Coordinates) automatically propagate to all other views:
  - Scatter plot points update dynamically
  - Bar chart counts recompute in real time
  - PCA Chart points update dynamically

- **On-Demand Analytics Panel**  
  Displays real-time statistical comparisons between:
  - Selected student subset
  - Global dataset
  
  Metrics include **average final grade** and **average absences**.

---

## 📊 Dataset

The project uses the **Student Performance Data Set (Math course)** from the **UCI Machine Learning Repository**.

- **Source:** UCI Machine Learning Repository  
- **Size:** ~395 students × 33 attributes  
- **Compliance:** Meets the **AS Index requirement**  
  *(10,000 < N × M < 50,000)*

---

## 🚀 Installation & Usage

### Prerequisites

- **Node.js** (v14+ recommended)
- **npm** (included with Node.js)

---

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/leoricca02/VA-Project-2025-Student-Performance.git
   ```
   
2. **Install dependencies**
  ```bash
  npm install
  ```

3. **Start the development server**
  ```bash
  npm run start
  ```

4. **Open the application in your browser**
  ```bash
  http://localhost:9000  
  ```

🛠 **Technologies**
- D3.js (v7) — Data visualization and DOM manipulation
- PCA-js — Principal Component Analysis computation
- Webpack — Module bundling and development server
- Sass / SCSS — Styling and layout management


👨‍💻 **Authors**

Leonardo Ricca — ID: 2211129

Federico Turrini — ID: 2175431

Developed for the Visual Analytics exam
Winter 2026 Session
