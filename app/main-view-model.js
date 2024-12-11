// ... (previous imports remain the same)

export function createViewModel() {
    const viewModel = new Observable();
    
    // ... (previous properties remain the same)
    
    viewModel.timeRange = 0; // 0: 24h, 1: week, 2: month
    viewModel.statisticsSummary = '';

    const updateChartData = (data, type = 'aqi') => {
        const timeRangeMap = ['24h', 'week', 'month'];
        const currentRange = timeRangeMap[viewModel.timeRange];
        const stats = historyService.getStatistics(type, currentRange);
        
        const labels = data.map(d => d.timestamp);
        const values = data.map(d => d[type]);
        
        viewModel.set('statisticsSummary', 
            `Average: ${stats.average} | Max: ${stats.max} | Min: ${stats.min} | Trend: ${stats.trend}`);
        
        const chartConfig = {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: type.toUpperCase(),
                    data: values,
                    borderColor: '#3498db',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };
        
        viewModel.set('chartHtml', `
            <html>
                <body style="margin: 0; padding: 0;">
                    <canvas id="chart"></canvas>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <script>
                        new Chart(document.getElementById('chart'), ${JSON.stringify(chartConfig)});
                    </script>
                </body>
            </html>
        `);
    };

    // ... (previous methods remain the same)

    viewModel.exportData = () => {
        const data = historyService.exportData();
        // Implementation for exporting data (e.g., share as CSV)
        console.log('Exporting data:', data);
    };

    return viewModel;
}