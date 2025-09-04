
import React from 'react';
import { BackupData } from '../types';

interface BackupTablesProps {
    backupData: BackupData;
}

const renderTable = (data: any[] | undefined, title: string) => {
    if (!data || data.length === 0) {
        return null;
    }

    const headers = Object.keys(data[0]);

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-anahuac-orange mb-2">{title}</h3>
            <div className="overflow-x-auto max-h-96 bg-anahuac-gray rounded-lg">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-white uppercase bg-gray-700 sticky top-0">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" className="px-4 py-3 whitespace-nowrap">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 100).map((row, index) => ( // Show first 100 rows
                            <tr key={index} className="border-b border-gray-700 hover:bg-gray-600">
                                {headers.map(header => (
                                    <td key={`${index}-${header}`} className="px-4 py-2 whitespace-nowrap">
                                        {String(row[header] !== null && row[header] !== undefined ? row[header] : '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length > 100 && <p className="text-xs text-gray-400 mt-2">Mostrando las primeras 100 de {data.length} filas.</p>}
        </div>
    );
};

const BackupTables: React.FC<BackupTablesProps> = ({ backupData }) => {
    return (
        <div className="bg-anahuac-gray p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Tablas de Respaldo</h2>
            <p className="text-gray-300 mb-6">
                Ocurrió un error durante la validación o el cruce de datos.
                Revisa que las columnas de tus archivos coincidan con el contrato de datos requerido.
                A continuación se muestran los datos detectados en cada archivo cargado.
            </p>
            {renderTable(backupData.tickets, 'Tickets Detectados')}
            {renderTable(backupData.servicios, 'Servicios Detectados')}
            {renderTable(backupData.validaciones, 'Validaciones Detectadas')}
        </div>
    );
};

export default BackupTables;
