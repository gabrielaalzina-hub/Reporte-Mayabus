
import React, { useMemo } from 'react';
import { CombinedDataRow } from '../../types';

interface TopUsersTableProps {
    data: CombinedDataRow[];
}

const TopUsersTable: React.FC<TopUsersTableProps> = ({ data }) => {
    const topUsers = useMemo(() => {
        const userCounts: Record<string, { trips: number }> = {};

        data.forEach(row => {
            const user = row.Usuario;
            if (!user) return;

            if (!userCounts[user]) {
                userCounts[user] = { trips: 0 };
            }
            if (row.Validado === 'Sí') {
                userCounts[user].trips += 1;
            }
        });

        return Object.entries(userCounts)
            .map(([usuario, counts]) => ({ usuario, ...counts }))
            .sort((a, b) => b.trips - a.trips)
            .slice(0, 10);

    }, [data]);

    return (
        <div className="overflow-x-auto" style={{ height: '400px' }}>
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-white uppercase bg-gray-700 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3">#</th>
                        <th scope="col" className="px-4 py-3">Usuario</th>
                        <th scope="col" className="px-4 py-3 text-right">Viajes Validados</th>
                    </tr>
                </thead>
                <tbody>
                    {topUsers.map((user, index) => (
                        <tr key={user.usuario} className="border-b border-gray-700 hover:bg-gray-600">
                            <td className="px-4 py-2 font-medium">{index + 1}</td>
                            <td className="px-4 py-2 font-medium text-white truncate max-w-xs">{user.usuario}</td>
                            <td className="px-4 py-2 text-right text-anahuac-orange font-bold text-base">{user.trips.toLocaleString()}</td>
                        </tr>
                    ))}
                     {topUsers.length === 0 && (
                        <tr>
                            <td colSpan={3} className="text-center py-4 text-gray-400">No hay datos de usuarios para mostrar.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TopUsersTable;
