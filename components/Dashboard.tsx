
import React, { useMemo, useState } from 'react';
import { ProcessedData } from '../types';
import RoutePerformanceChart from './charts/RoutePerformanceChart';
import BackupTables from './BackupTables';
import TopUsersTable from './charts/TopUsersTable';
import UsageHeatmapChart from './charts/UsageHeatmapChart';
import DailyRoutePerformanceChart from './charts/DailyRoutePerformanceChart';

interface DashboardProps {
    data: ProcessedData | null;
    error: string | null;
}

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-anahuac-gray p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-gray-400 text-md font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-4xl font-bold text-anahuac-orange mt-2">{value !== undefined && value !== null ? value : '0'}</p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data, error }) => {
    // Case 1: Validation error occurred, show backup tables
    if (error && data?.backupData && Object.values(data.backupData).some(d => d && d.length > 0)) {
        return <BackupTables backupData={data.backupData} />;
    }

    // Case 2: No data loaded or filtered to empty
    if (!data || !data.combinedData || data.combinedData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="text-center p-8 bg-anahuac-gray rounded-lg shadow-xl">
                    <svg className="mx-auto h-12 w-12 text-anahuac-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold text-white">No hay datos para mostrar</h2>
                    <p className="mt-2 text-gray-300">
                        Por favor, cargue los archivos de datos o ajuste los filtros para ver las visualizaciones.
                    </p>
                </div>
            </div>
        );
    }

    const { kpis, combinedData } = data;

    const availableRoutes = useMemo(() => {
        if (!combinedData) return [];
        return [...new Set(combinedData.map(d => d['Descripcion ruta']))].sort();
    }, [combinedData]);

    const [selectedRoute, setSelectedRoute] = useState<string>('all');

    const mainKpis = [
        { title: 'Tickets Vendidos', value: kpis?.totalTickets.toLocaleString() },
        { title: 'Viajes Estudiantes', value: kpis?.totalEstudiantes.toLocaleString() },
        { title: 'Viajes Colaboradores', value: kpis?.totalColaboradores.toLocaleString() },
    ];
    
    const passKpis = [
        { title: 'Pases Semestrales', value: kpis?.pasesSemestrales.toLocaleString() },
        { title: 'Pases Semanales', value: kpis?.pasesSemanales.toLocaleString() },
        { title: 'Pases Redondos', value: kpis?.pasesRedondos.toLocaleString() },
        { title: 'Pases de Verano', value: kpis?.pasesVerano.toLocaleString() },
        { title: 'Mensual Colaborador', value: kpis?.pasesMensualColaborador.toLocaleString() },
        { title: 'Pases Especiales', value: kpis?.pasesEspeciales.toLocaleString() },
    ];

    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-2xl font-bold text-white mb-4">Resumen General</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mainKpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                </div>
            </section>

             <section>
                <h2 className="text-2xl font-bold text-white mb-4">Tipos de Pase (Viajes Realizados)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {passKpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-white mb-4">Visualizaciones</h2>
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="bg-anahuac-gray p-6 rounded-lg shadow-lg col-span-1 xl:col-span-2">
                        <h3 className="text-xl font-semibold mb-4">Rendimiento de Rutas</h3>
                       <RoutePerformanceChart data={combinedData} />
                    </div>
                     <div className="bg-anahuac-gray p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Top 10 Usuarios (por Viajes)</h3>
                       <TopUsersTable data={combinedData} />
                    </div>
                     <div className="bg-anahuac-gray p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Calor de Uso por Día del Mes</h3>
                       <UsageHeatmapChart data={combinedData} />
                    </div>
                    <div className="bg-anahuac-gray p-6 rounded-lg shadow-lg col-span-1 xl:col-span-2">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                            <h3 className="text-xl font-semibold">Rendimiento de Ruta por Día</h3>
                            <div className="w-full sm:w-auto">
                                <label htmlFor="route-day-filter" className="sr-only">Seleccionar Ruta</label>
                                <select 
                                    id="route-day-filter"
                                    value={selectedRoute} 
                                    onChange={e => setSelectedRoute(e.target.value)} 
                                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-anahuac-orange"
                                >
                                    <option value="all">Todas las Rutas</option>
                                    {availableRoutes.map(route => <option key={route} value={route}>{route}</option>)}
                                </select>
                            </div>
                        </div>
                       <DailyRoutePerformanceChart data={combinedData} selectedRoute={selectedRoute} />
                    </div>
                 </div>
            </section>
        </div>
    );
};

export default Dashboard;
