import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot } from '../firebase';
import Layout from '../components/Layout';
import {
    MapPin, Clock, User, Building2, LogIn, LogOut,
    Search, Activity, Users, Timer,
    ChevronDown, ChevronUp, Badge, Route,
    CheckCircle2, XCircle, Circle,
    Calendar, Eye, RefreshCw
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (ts) => {
    if (!ts) return '--:--';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
    if (!ts) return '---';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDuration = (start, end) => {
    if (!start) return '--';
    const s = start.toDate ? start.toDate() : new Date(start);
    const e = end ? (end.toDate ? end.toDate() : new Date(end)) : new Date();
    const diffMs = e - s;
    if (diffMs < 0) return '0m';
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getStatusConfig = (visit) => {
    if (visit.check_out) return {
        label: 'Salida',
        labelFull: 'Salida Registrada',
        color: 'text-slate-500',
        bg: 'bg-slate-100 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
        pulse: false
    };
    return {
        label: 'Activo',
        labelFull: 'En Instalaciones',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        pulse: true
    };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, color = 'primary' }) => {
    const colorMap = {
        primary: {
            wrap: 'from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/30',
            icon: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
            text: 'text-orange-600 dark:text-orange-400',
        },
        emerald: {
            wrap: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/30',
            icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        blue: {
            wrap: 'from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/30',
            icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
            text: 'text-blue-600 dark:text-blue-400',
        },
        violet: {
            wrap: 'from-violet-500/10 to-violet-600/5 border-violet-200/50 dark:border-violet-800/30',
            icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
            text: 'text-violet-600 dark:text-violet-400',
        },
    };
    const c = colorMap[color];
    return (
        <div className={`bg-gradient-to-br ${c.wrap} border rounded-2xl p-3 sm:p-4 flex items-center gap-3`}>
            {/* Icon — hidden on very small screens to save space */}
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-none">{value}</p>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 leading-tight">{label}</p>
                {sub && <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
};

const TimelineNode = ({ type, time, label, area, isLast, isActive }) => {
    const isEntry = type === 'entry';
    return (
        <div className="flex gap-3 items-start">
            <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all
                    ${isEntry
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30'
                        : isActive
                            ? 'bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/30 animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
                    }`}>
                    {isEntry
                        ? <LogIn size={14} />
                        : isActive
                            ? <Circle size={10} className="fill-current" />
                            : <LogOut size={14} />}
                </div>
                {!isLast && (
                    <div className={`w-0.5 h-8 mt-1 ${isEntry
                        ? 'bg-gradient-to-b from-emerald-400 to-slate-300 dark:to-slate-700'
                        : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
            </div>
            <div className="pb-5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-black uppercase tracking-wide
                        ${isEntry ? 'text-emerald-600 dark:text-emerald-400'
                            : isActive ? 'text-orange-500'
                                : 'text-slate-500'}`}>
                        {label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {time}
                    </span>
                </div>
                {area && (
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-500 truncate">{area}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const VisitorCard = ({ visit, areas, isExpanded, onToggle }) => {
    const status = getStatusConfig(visit);
    const duration = formatDuration(visit.check_in, visit.check_out);
    const areaName = areas[visit.areaId]?.name || 'Área no especificada';
    const areaLevel = areas[visit.areaId]?.level || '---';

    return (
        <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition-all duration-300
            ${isExpanded ? 'border-primary/30 shadow-primary/5' : 'border-slate-200 dark:border-slate-800'}`}>

            {/* ── Card Header ── */}
            <div className="p-3 sm:p-4 cursor-pointer select-none" onClick={onToggle}>
                <div className="flex items-center gap-3">

                    {/* Photo */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                        {visit.photo_url
                            ? <img src={visit.photo_url} alt={visit.full_name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={22} /></div>
                        }
                    </div>

                    {/* Info block */}
                    <div className="flex-1 min-w-0">

                        {/* Row 1: name + status badge + chevron */}
                        <div className="flex items-center justify-between gap-1.5">
                            <p className="font-black text-slate-800 dark:text-white truncate text-sm">{visit.full_name}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {/* Status badge — short label on mobile, full on sm+ */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.color} ${status.border}`}>
                                    {status.pulse && <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />}
                                    <span className="sm:hidden">{status.label}</span>
                                    <span className="hidden sm:inline">{status.labelFull}</span>
                                </span>
                                {isExpanded
                                    ? <ChevronUp size={15} className="text-slate-400" />
                                    : <ChevronDown size={15} className="text-slate-400" />}
                            </div>
                        </div>

                        {/* Row 2: company */}
                        <div className="flex items-center gap-1 mt-0.5">
                            <Building2 size={10} className="text-slate-400 shrink-0" />
                            <p className="text-xs text-slate-500 truncate">{visit.company || 'Sin empresa'}</p>
                        </div>

                        {/* Row 3: quick chips — scroll horizontally on mobile */}
                        <div className="flex items-center gap-2 mt-1.5 overflow-x-auto no-scrollbar">
                            <Chip icon={<Badge size={10} className="text-primary" />} label={`#${visit.badge_number || '---'}`} mono />
                            <Chip icon={<Clock size={10} />} label={duration} />
                            <Chip icon={<MapPin size={10} className="text-orange-400" />} label={areaName} />
                            <Chip icon={<Calendar size={10} />} label={formatDate(visit.check_in)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Expanded Detail ── */}
            {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800">
                    {/* On mobile: stacked. On md+: 2 columns */}
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Timeline */}
                        <div>
                            <SectionTitle icon={<Route size={11} />} label="Recorrido del Visitante" />
                            <div className="pl-1 mt-3">
                                <TimelineNode
                                    type="entry"
                                    time={formatTime(visit.check_in)}
                                    label="Ingreso"
                                    area={`${areaLevel} — ${areaName}`}
                                    isLast={!visit.check_out}
                                    isActive={false}
                                />
                                {!visit.check_out ? (
                                    <TimelineNode
                                        type="current"
                                        time="Ahora"
                                        label="En Planta"
                                        area={`Transcurrido: ${duration}`}
                                        isLast={true}
                                        isActive={true}
                                    />
                                ) : (
                                    <TimelineNode
                                        type="exit"
                                        time={formatTime(visit.check_out)}
                                        label="Salida"
                                        area={`Duración: ${duration}`}
                                        isLast={true}
                                        isActive={false}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <SectionTitle icon={<Eye size={11} />} label="Datos del Expediente" />

                            {/* 2-col grid for fields — works well even on small screens */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <DetailField label="Cédula / ID" value={visit.document_id} />
                                <DetailField label="Carnet #" value={visit.badge_number ? `#${visit.badge_number}` : '---'} highlight />
                                <DetailField label="Motivo" value={visit.reason} />
                                <DetailField label="Persona Visitada" value={visit.employee} />
                                <DetailField label="Área Destino" value={areaName} />
                                <DetailField label="Nivel" value={areaLevel} />
                                <DetailField label="Hora Entrada" value={formatTime(visit.check_in)} />
                                <DetailField label="Hora Salida" value={visit.check_out ? formatTime(visit.check_out) : 'En planta'} />
                            </div>

                            {/* Duration bar */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tiempo en instalaciones</span>
                                    <span className={`text-sm font-black ${visit.check_out ? 'text-slate-600 dark:text-slate-300' : 'text-emerald-500'}`}>
                                        {duration}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${visit.check_out
                                            ? 'bg-slate-400'
                                            : 'bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pulse'}`}
                                        style={{ width: visit.check_out ? '100%' : '60%' }}
                                    />
                                </div>
                                {!visit.check_out && (
                                    <p className="text-[10px] text-emerald-500 mt-1.5 font-bold">● Visita activa en tiempo real</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Tiny reusable chip for quick stats row
const Chip = ({ icon, label, mono }) => (
    <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
        {icon}
        <span className={mono ? 'font-mono font-bold' : ''}>{label}</span>
    </div>
);

const SectionTitle = ({ icon, label }) => (
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
        {icon}{label}
    </p>
);

const DetailField = ({ label, value, highlight }) => (
    <div className="space-y-0.5 min-w-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={`text-xs font-bold truncate ${highlight ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
            {value || '---'}
        </p>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const VisitorTracking = () => {
    const { companyId } = useAuth();
    const [visits, setVisits] = useState([]);
    const [areas, setAreas] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [now, setNow] = useState(new Date());
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!companyId) return;
        const q = query(collection(db, 'areas'), where('companyId', '==', companyId));
        const unsub = onSnapshot(q, (snap) => {
            const map = {};
            snap.docs.forEach(d => { map[d.id] = d.data(); });
            setAreas(map);
        });
        return () => unsub();
    }, [companyId]);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        const q = query(collection(db, 'visits'), where('companyId', '==', companyId));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => {
                if (!a.check_out && b.check_out) return -1;
                if (a.check_out && !b.check_out) return 1;
                const da = a.check_in?.toDate ? a.check_in.toDate() : new Date(0);
                const db2 = b.check_in?.toDate ? b.check_in.toDate() : new Date(0);
                return db2 - da;
            });
            setVisits(docs);
            setLoading(false);
            setLastRefresh(new Date());
        });
        return () => unsub();
    }, [companyId]);

    const stats = useMemo(() => {
        const active = visits.filter(v => !v.check_out).length;
        const completed = visits.filter(v => v.check_out).length;
        const today = visits.filter(v => {
            if (!v.check_in) return false;
            const d = v.check_in.toDate ? v.check_in.toDate() : new Date(v.check_in);
            return d.toDateString() === new Date().toDateString();
        }).length;
        const completedVisits = visits.filter(v => v.check_out && v.check_in);
        const avgDuration = completedVisits.length > 0
            ? Math.round(completedVisits.reduce((acc, v) => {
                const s = v.check_in.toDate ? v.check_in.toDate() : new Date(v.check_in);
                const e = v.check_out.toDate ? v.check_out.toDate() : new Date(v.check_out);
                return acc + (e - s) / 60000;
            }, 0) / completedVisits.length)
            : 0;
        return { active, completed, today, avgDuration };
    }, [visits, now]);

    const filtered = useMemo(() => visits.filter(v => {
        const matchSearch = !searchTerm ||
            v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(v.badge_number).includes(searchTerm);
        const matchStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && !v.check_out) ||
            (statusFilter === 'completed' && v.check_out);
        return matchSearch && matchStatus;
    }), [visits, searchTerm, statusFilter]);

    const handleToggle = (id) => setExpandedId(prev => prev === id ? null : id);

    return (
        <Layout title="Tracking de Visitantes">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">

                {/* ── Header Banner ── */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-hidden border border-slate-700/50 shadow-xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

                    <div className="relative flex items-center justify-between gap-3">
                        {/* Left: icon + title */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                                <Route size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                                    Panel de Recorrido
                                </h2>
                                <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">
                                    Monitoreo en tiempo real del tránsito de visitantes
                                </p>
                            </div>
                        </div>

                        {/* Right: live badge + time */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">En Vivo</span>
                            </div>
                            <p className="text-slate-500 text-[9px] font-mono">
                                {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Stats Grid — 2 cols on mobile, 4 on md+ ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    <StatCard icon={<Activity />} label="Activos ahora" value={stats.active} sub="En planta" color="emerald" />
                    <StatCard icon={<Users />} label="Visitas hoy" value={stats.today} sub="En el día" color="blue" />
                    <StatCard icon={<CheckCircle2 />} label="Completadas" value={stats.completed} sub="Con salida" color="violet" />
                    <StatCard icon={<Timer />} label="Prom. duración" value={stats.avgDuration > 0 ? `${stats.avgDuration}m` : '--'} sub="Por visita" color="primary" />
                </div>

                {/* ── Filters Bar ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar visitante, empresa o carnet..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Filter buttons — always in a row, scroll if needed */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                            {[
                                { key: 'all', label: 'Todos', count: visits.length },
                                { key: 'active', label: 'Activos', count: stats.active },
                                { key: 'completed', label: 'Finalizados', count: stats.completed },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setStatusFilter(f.key)}
                                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border
                                        ${statusFilter === f.key
                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:text-primary'
                                        }`}
                                >
                                    {f.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black
                                        ${statusFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                        {f.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Visits List ── */}
                <div className="space-y-2 sm:space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-500 text-sm font-medium">Cargando recorridos...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                <Route size={32} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-500">Sin resultados</p>
                                <p className="text-slate-400 text-sm mt-1 max-w-xs">
                                    {searchTerm
                                        ? `No coincide con "${searchTerm}".`
                                        : 'No hay visitas con los filtros seleccionados.'}
                                </p>
                            </div>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-primary text-sm font-bold hover:underline">
                                    Limpiar búsqueda
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Counter row */}
                            <div className="flex items-center justify-between px-1">
                                <p className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{filtered.length}</span> de {visits.length} registros
                                </p>
                                {stats.active > 0 && (
                                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {stats.active} en planta
                                    </div>
                                )}
                            </div>

                            {filtered.map(visit => (
                                <VisitorCard
                                    key={visit.id}
                                    visit={visit}
                                    areas={areas}
                                    isExpanded={expandedId === visit.id}
                                    onToggle={() => handleToggle(visit.id)}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && visits.length > 0 && (
                    <div className="flex items-center justify-center gap-2 py-3 text-slate-400 text-xs">
                        <RefreshCw size={11} />
                        <span>Actualización automática en tiempo real</span>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default VisitorTracking;
