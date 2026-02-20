import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination component
 * @param {number} currentPage - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Items per page
 * @param {function} onPageChange - Callback when page changes
 */
const Pagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Build page number array with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const delta = 1; // pages around current

        const left = Math.max(2, currentPage - delta);
        const right = Math.min(totalPages - 1, currentPage + delta);

        pages.push(1);

        if (left > 2) pages.push('...');

        for (let i = left; i <= right; i++) {
            pages.push(i);
        }

        if (right < totalPages - 1) pages.push('...');

        if (totalPages > 1) pages.push(totalPages);

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 mt-3">
            {/* Info */}
            <p className="text-xs text-slate-400 font-medium order-2 sm:order-1">
                Mostrando <span className="font-bold text-slate-600 dark:text-slate-300">{startItem}–{endItem}</span> de{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">{totalItems}</span> registros
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
                {/* Prev */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={15} />
                </button>

                {/* Page numbers */}
                {pages.map((page, idx) =>
                    page === '...' ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs select-none"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === currentPage
                                    ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                >
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
