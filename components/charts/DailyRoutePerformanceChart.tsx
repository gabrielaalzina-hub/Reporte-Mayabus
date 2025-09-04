
import React, { useEffect, useRef } from 'react';
import { CombinedDataRow } from '../../types';

interface ChartProps {
  data: CombinedDataRow[];
  selectedRoute: string;
}

const DailyRoutePerformanceChart: React.FC<ChartProps> = ({ data, selectedRoute }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        return;
    };

    // 1. Filter data by selected route
    const filteredData = selectedRoute === 'all'
      ? data
      : data.filter(row => row['Descripcion ruta'] === selectedRoute);
    
    // 2. Aggregate data by day
    const dataByDay = filteredData.reduce((acc, row) => {
      const day = new Date(row.Fecha).getUTCDate(); // Use UTC date to avoid timezone shifts
      if (!acc[day]) {
        acc[day] = { totalTickets: 0, totalOcupacion: 0, count: 0 };
      }
      acc[day].totalTickets += row['Tickets utilizados'] ?? 0;
      acc[day].totalOcupacion += row['% Ocupacion'] ?? 0;
      acc[day].count++;
      return acc;
    }, {} as Record<number, { totalTickets: number; totalOcupacion: number; count: number }>);
    
    // 3. Prepare chart labels and datasets
    const date = new Date(data[0].Fecha);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const ticketsData = labels.map(day => dataByDay[day]?.totalTickets || 0);
    const ocupacionData = labels.map(day => {
        const dayData = dataByDay[day];
        if (!dayData || dayData.count === 0) return 0;
        const avg = dayData.totalOcupacion / dayData.count;
        return (avg * 100).toFixed(2); // Convert to percentage
    });

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
            title: {
              display: true,
              text: 'Día del Mes',
              color: '#FFFFFF'
            },
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
                callback: function(value: any) {
                    return value + '%'
                }
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, selectedRoute]);

  return <div style={{ height: '400px' }}><canvas ref={chartRef}></canvas></div>;
};

export default DailyRoutePerformanceChart;