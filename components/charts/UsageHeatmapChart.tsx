
import React, { useMemo } from 'react';
import { CombinedDataRow } from '../../types';

interface UsageHeatmapChartProps {
    data: CombinedDataRow[];
}

const UsageHeatmapChart: React.FC<UsageHeatmapChartProps> = ({ data }) => {
    const heatmapData = useMemo(() => {
        const validationsByDay: Record<number, number> = {};
        const month = data.length > 0 ? new Date(data[0].Fecha).getMonth() : new Date().getMonth();
        const year = data.length > 0 ? new Date(data[0].Fecha).getFullYear() : new Date().getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for(let i=1; i <= daysInMonth; i++) {
            validationsByDay[i] = 0;
        }

        data.forEach(row => {
            if (row.Validado === 'Sí') {
                const day = new Date(row.Fecha).getUTCDate(); // Use UTC date to avoid timezone shifts
                if (validationsByDay[day] !== undefined) {
                    validationsByDay[day]++;
                }
            }
        });
        
        return validationsByDay;
    }, [data]);
    
    const maxValidations = Math.max(1, ...Object.values(heatmapData)); // Avoid division by zero

    const getColor = (value: number) => {
        if (value === 0) return 'bg-gray-700';
        const intensity = Math.min(1, value / maxValidations);
        if (intensity < 0.2) return 'bg-anahuac-orange/20';
        if (intensity < 0.4) return 'bg-anahuac-orange/40';
        if (intensity < 0.6) return 'bg-anahuac-orange/60';
        if (intensity < 0.8) return 'bg-anahuac-orange/80';
        return 'bg-anahuac-orange';
    };

    return (
        <div className="grid grid-cols-7 gap-2" style={{ minHeight: '300px' }}>
            {Object.entries(heatmapData).map(([day, count]) => (
                <div key={day} className={`rounded-md p-2 flex flex-col justify-between items-center transition-all ${getColor(count)}`}>
                    <span className="font-bold text-xs text-gray-200">{day}</span>
                    <span className="font-mono text-lg font-extrabold text-white">{count}</span>
                </div>
            ))}
        </div>
    );
};

export default UsageHeatmapChart;
