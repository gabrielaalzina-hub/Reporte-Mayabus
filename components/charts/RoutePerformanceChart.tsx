import React, { useEffect, useRef } from 'react';
import { CombinedDataRow } from '../../types';

interface ChartProps {
  data: CombinedDataRow[];
}

const RoutePerformanceChart: React.FC<ChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null); // Using any for Chart.js instance

  useEffect(() => {
    if (!chartRef.current) return;

    // Aggregate data by route
    const dataByRoute = data.reduce((acc, row) => {
      const route = row['Descripcion ruta'];
      if (!acc[route]) {
        acc[route] = { totalTickets: 0, totalOcupacion: 0, count: 0 };
      }
      acc[route].totalTickets += row['Tickets utilizados'];
      acc[route].totalOcupacion += row['% Ocupacion'];
      acc[route].count++;
      return acc;
    }, {} as Record<string, { totalTickets: number; totalOcupacion: number; count: number }>);

    const labels = Object.keys(dataByRoute);
    const ticketsData = labels.map(route => dataByRoute[route].totalTickets);
    const ocupacionData = labels.map(route => {
        const avg = dataByRoute[route].totalOcupacion / dataByRoute[route].count;
        return (avg * 100).toFixed(2); // Convert to percentage
    });

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new (window as any).Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tickets Utilizados',
            data: ticketsData,
            backgroundColor: '#F26622',
            borderColor: '#D95B1E',
            borderWidth: 1,
            yAxisID: 'y',
          },
          {
            label: 'Ocupación Promedio (%)',
            data: ocupacionData,
            backgroundColor: 'rgba(242, 102, 34, 0.2)',
            borderColor: 'rgba(217, 91, 30, 0.5)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1',
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#FFFFFF'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
          x: {
            ticks: { color: '#D1D5DB' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Tickets Utilizados',
                color: '#FFFFFF'
            },
            ticks: { color: '#D1D5DB' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Ocupación (%)',
                color: '#FFFFFF'
            },
            ticks: { 
                color: '#D1D5DB',
                callback: function(value) {
                    return value + '%'
                }
            },
            grid: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            },
          },
        },
      },
    });

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <div style={{ height: '400px' }}><canvas ref={chartRef}></canvas></div>;
};

export default RoutePerformanceChart;
