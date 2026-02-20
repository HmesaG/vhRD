import React, { useState, useEffect } from 'react';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

/**
 * DataTable with built-in pagination.
 * Pass `paginate={false}` to disable pagination (e.g. Dashboard recent visits).
 */
const DataTable = ({
    columns,
    data,
    loading,
    emptyMessage = "No hay datos disponibles.",
    paginate = true,
    pageSize = PAGE_SIZE,
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 whenever data changes (e.g. after search filter)
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedData = paginate
        ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : data;

    return (
        <div className="space-y-2">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[540px]">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th key={idx} className={`px-3 sm:px-5 py-3 sm:py-4 ${col.className || ''}`}>
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            Cargando...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500 italic text-sm">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, rowIdx) => (
                                    <tr
                                        key={item.id || rowIdx}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={`px-3 sm:px-5 py-3 sm:py-4 ${col.className || ''}`}>
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination controls */}
            {paginate && !loading && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};

export default DataTable;
