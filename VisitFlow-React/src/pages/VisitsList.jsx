import React, { useState, useEffect, useCallback } from 'react';
import { visitsApi } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { LogOut, Mail, Send, Camera, Search, Filter, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrganizationLabels } from '../hooks/useOrganizationLabels';

const VisitsList = () => {
    const { companyId } = useAuth();
    const { hostSingular, singularLow, placeholderSearch } = useOrganizationLabels();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');   // 'all' | 'active' | 'finished'
    const [filterDate, setFilterDate] = useState('all');       // 'all' | 'today' | 'week' | 'month'
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const parseDate = (val) => {
        if (!val) return null;
        if (val.toDate) return val.toDate();
        return new Date(val);
    };

    const formatDuration = (start, end) => {
        if (!start) return '--';
        const startTime = parseDate(start);
        const endTime = end ? parseDate(end) : now;
        const diffMs = endTime - startTime;
        if (diffMs < 0) return '0m';
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
        return `${diffMins}m`;
    };

    const fetchVisits = useCallback(() => visitsApi.getAll(companyId), [companyId]);
    const { data: fetchedVisits, refresh: refreshVisits } = usePolling(fetchVisits, 5000, [companyId]);

    useEffect(() => {
        if (!fetchedVisits) return;
        const docs = [...fetchedVisits].sort((a, b) => {
            const dateA = parseDate(a.check_in) || new Date(0);
            const dateB = parseDate(b.check_in) || new Date(0);
            return dateB - dateA;
        });
        setVisits(docs);
        setLoading(false);
    }, [fetchedVisits]);

    const handleCheckOut = async (id) => {
        if (confirm('¿Registrar salida de este visitante?')) {
            try {
                await visitsApi.update(id, { check_out: new Date().toISOString(), status: 'Salida' });
                refreshVisits();
            } catch (err) { alert('Error: ' + err.message); }
        }
    };

    const handleEmail = (row) => {
        if (!row.visitor_email) return alert(`El ${singularLow} no tiene email registrado.`);
        const subject = encodeURIComponent(`Aviso de Visita: ${row.full_name}`);
        const body = encodeURIComponent(`Hola ${row.employee},\n\nTe informamos que ${row.full_name} de la empresa ${row.company} se encuentra en recepción.\n\nSaludos,\nSistema de Visitas.`);
        window.location.href = `mailto:${row.visitor_email}?subject=${subject}&body=${body}`;
    };

    const handleWhatsApp = (row) => {
        if (!row.visitor_phone) return alert(`El ${singularLow} no tiene WhatsApp registrado.`);
        const phone = row.visitor_phone.replace(/\D/g, '');
        const text = encodeURIComponent(`Hola, ${row.employee}. El visitante ${row.full_name} de ${row.company} ha llegado para verte.`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    // ── Filtering logic ──────────────────────────────────────────────────────
    const isInDateRange = (visit) => {
        if (filterDate === 'all') return true;
        if (!visit.check_in) return false;
        const d = parseDate(visit.check_in);
        const today = new Date();
        if (filterDate === 'today') {
            return d.toDateString() === today.toDateString();
        }
        if (filterDate === 'week') {
            const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
            return d >= weekAgo;
        }
        if (filterDate === 'month') {
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }
        return true;
    };

    const filteredVisits = visits.filter(v => {
        const matchSearch =
            v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.reason?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && !v.check_out) ||
            (filterStatus === 'finished' && !!v.check_out);
        return matchSearch && matchStatus && isInDateRange(v);
    });

    const activeFilters = (filterStatus !== 'all' ? 1 : 0) + (filterDate !== 'all' ? 1 : 0);

    const clearFilters = () => {
        setFilterStatus('all');
        setFilterDate('all');
        setSearchTerm('');
    };

    // ── Columns ──────────────────────────────────────────────────────────────
    const columns = [
        {
            header: 'Foto',
            render: (row) => (
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    {row.photo_url ? (
                        <img src={row.photo_url} alt="Visitante" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera size={14} />
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Visitante / Empresa',
            render: (row) => (
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{row.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{row.company}</p>
                </div>
            )
        },
        {
            header: `Motivo / ${hostSingular}`,
            render: (row) => (
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{row.reason}</p>
                        {row.badge_number && (
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 shrink-0">
                                #{row.badge_number}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-tight truncate">{row.employee}</p>
                </div>
            )
        },
        {
            header: 'Fecha',
            render: (row) => (
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.check_in ? parseDate(row.check_in).toLocaleDateString() : '--/--/----'}
                </div>
            )
        },
        {
            header: 'Horarios',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-xs flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                        {row.check_in ? parseDate(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                    {row.check_out && (
                        <p className="text-xs flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                            {parseDate(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            )
        },
        {
            header: 'Duración',
            render: (row) => (
                <div className="flex flex-col whitespace-nowrap">
                    <span className={`text-xs font-bold ${row.check_out ? 'text-slate-500' : 'text-primary'}`}>
                        {formatDuration(row.check_in, row.check_out)}
                    </span>
                    {!row.check_out && (
                        <span className="text-[9px] text-slate-400 uppercase tracking-tighter">en curso</span>
                    )}
                </div>
            )
        },
        {
            header: 'Estado',
            render: (row) => (
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap ${row.check_out
                    ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                    {row.check_out ? 'Finalizado' : 'En Planta'}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            render: (row) => (
                <div className="flex justify-end gap-0.5">
                    {!row.check_out && (
                        <button onClick={() => handleCheckOut(row.id)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Registrar Salida">
                            <LogOut size={15} />
                        </button>
                    )}
                    <button onClick={() => handleEmail(row)} className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Notificar por Email">
                        <Mail size={15} />
                    </button>
                    <button onClick={() => handleWhatsApp(row)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Notificar por WhatsApp">
                        <Send size={15} />
                    </button>
                </div>
            )
        }
    ];

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Layout title="Control de Visitas">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">

                {/* Filter bar */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={15} />
                        </span>
                        <input
                            type="text"
                            placeholder={placeholderSearch}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner"
                        />
                    </div>

                    {/* Filter chips row */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                            <Filter size={11} /> Filtros
                        </span>

                        {/* Status filter */}
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                            {[
                                { val: 'all', label: 'Todos' },
                                { val: 'active', label: 'En Planta' },
                                { val: 'finished', label: 'Finalizados' },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => setFilterStatus(opt.val)}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${filterStatus === opt.val
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Date filter */}
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                            {[
                                { val: 'all', label: 'Siempre' },
                                { val: 'today', label: 'Hoy' },
                                { val: 'week', label: '7 días' },
                                { val: 'month', label: 'Este mes' },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => setFilterDate(opt.val)}
                                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${filterDate === opt.val
                                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Clear filters */}
                        {(activeFilters > 0 || searchTerm) && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800"
                            >
                                <X size={11} /> Limpiar
                            </button>
                        )}

                        {/* Result count */}
                        <span className="ml-auto text-[10px] text-slate-400 font-medium">
                            {filteredVisits.length} resultado{filteredVisits.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredVisits}
                    loading={loading}
                    emptyMessage="No se encontraron visitas con los filtros aplicados."
                />
            </div>
        </Layout>
    );
};

export default VisitsList;
