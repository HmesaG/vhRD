import React, { useState, useEffect, useCallback } from 'react';
import { visitsApi } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { Camera, Calendar, User, Building, LogOut, Mail, Send, Trash2, Search, Shield, Users, BarChart3, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VisitModal from '../components/VisitModal';
import { useOrganizationLabels } from '../hooks/useOrganizationLabels';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const StatCard = ({ title, value, icon, color = "text-primary" }) => (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{title}</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
        </div>
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${color} shadow-inner shrink-0`}>
            {icon}
        </div>
    </div>
);

const Dashboard = () => {
    const { role, companyId } = useAuth();
    const { hostSingular, singularLow } = useOrganizationLabels();
    const toast = useToast();
    const confirm = useConfirm();
    const [stats, setStats] = useState({ today: 0, active: 0, pending: 0 });
    const [recentVisits, setRecentVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [now, setNow] = useState(new Date());
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
    const navigate = useNavigate();

    const quickActions = [
        { name: 'Nueva Visita', icon: <PlusCircle size={24} />, path: 'modal', color: 'bg-primary/10 text-primary', roles: ['administrador', 'recepcion', 'seguridad'] },
        { name: 'Registrar Acceso', icon: <Shield size={24} />, path: '/seguridad', color: 'bg-blue-500/10 text-blue-500', roles: ['administrador', 'seguridad', 'punto_de_control'] },
        { name: 'Listado Visitas', icon: <Calendar size={24} />, path: '/listado', color: 'bg-green-500/10 text-green-500', roles: ['administrador', 'recepcion', 'seguridad'] },
        { name: 'Gestión Usuarios', icon: <Users size={24} />, path: '/usuarios', color: 'bg-purple-500/10 text-purple-500', roles: ['administrador', 'superadmin'] },
        { name: 'Reportes', icon: <BarChart3 size={24} />, path: '/reportes', color: 'bg-amber-500/10 text-amber-500', roles: ['administrador', 'recepcion'] },
        { name: 'Acerca de', icon: <User size={24} />, path: '/acerca', color: 'bg-slate-500/10 text-slate-500', roles: ['administrador', 'recepcion', 'seguridad', 'superadmin', 'punto_de_control'] },
    ].filter(action => role === 'superadmin' || action.roles.includes(role));

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (start, end) => {
        if (!start) return '--';
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : now;
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
        const docs = [...fetchedVisits].sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
        setRecentVisits(docs);
        const today = new Date().toDateString();
        const todayVisits = docs.filter(v => v.check_in && new Date(v.check_in).toDateString() === today);
        setStats({
            today: todayVisits.length,
            active: docs.filter(v => !v.check_out).length,
            pending: docs.filter(v => {
                if (!v.check_in) return false;
                const diff = new Date() - new Date(v.check_in);
                return !v.check_out && diff > (4 * 60 * 60 * 1000);
            }).length
        });
        setLoading(false);
    }, [fetchedVisits]);

    const filteredVisits = recentVisits.filter(v =>
        (v.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.employee || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCheckOut = async (id) => {
        const ok = await confirm({
            title: '¿Registrar salida?',
            message: '¿Confirmas que este visitante ha abandonado las instalaciones?',
            confirmLabel: 'Registrar Salida',
        });
        if (ok) {
            try {
                await visitsApi.update(id, { check_out: true, status: 'Salida' });
                refreshVisits();
                toast.success('Salida registrada correctamente.');
            } catch (err) { toast.error('Error al registrar salida: ' + err.message); }
        }
    };

    const handleEmail = (row) => {
        if (!row.visitor_email) return toast.warning(`El ${singularLow} no tiene email registrado.`);
        const subject = encodeURIComponent(`Aviso de Visita: ${row.full_name}`);
        const body = encodeURIComponent(`Hola ${row.employee},\n\nTe informamos que ${row.full_name} de la empresa ${row.company} se encuentra en recepción para una visita por el motivo: ${row.reason}.\n\nSaludos,\nSistema de Visitas.`);
        window.location.href = `mailto:${row.visitor_email}?subject=${subject}&body=${body}`;
    };

    const handleWhatsApp = (row) => {
        if (!row.visitor_phone) return toast.warning(`El ${singularLow} no tiene WhatsApp registrado.`);
        const phone = row.visitor_phone.replace(/\D/g, '');
        const text = encodeURIComponent(`Hola, ${row.employee}. El visitante ${row.full_name} de la empresa ${row.company} ha llegado para verte.`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

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
                    <div className="flex items-center gap-2">
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
                    {row.check_in ? new Date(row.check_in).toLocaleDateString() : '--/--/----'}
                </div>
            )
        },
        {
            header: 'Horarios',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-xs flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                        {row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                    {row.check_out && (
                        <p className="text-xs flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                            {new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        <button
                            onClick={() => handleCheckOut(row.id)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Registrar Salida"
                        >
                            <LogOut size={15} />
                        </button>
                    )}
                    <button
                        onClick={() => handleEmail(row)}
                        className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Notificar por Email"
                    >
                        <Mail size={15} />
                    </button>
                    <button
                        onClick={() => handleWhatsApp(row)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Notificar por WhatsApp"
                    >
                        <Send size={15} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Visitas Hub RD">
            <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-10">
                {/* Mobile Quick Actions Hub - Only on small screens */}
                <div className="lg:hidden animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-primary rounded-full" />
                            <h3 className="font-black uppercase text-[11px] tracking-[0.15em] text-slate-400">Panel de Acciones</h3>
                        </div>
                        <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/50 uppercase tracking-tighter shadow-sm flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            Mobile Experience
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-8">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (action.path === 'modal') setIsVisitModalOpen(true);
                                    else navigate(action.path);
                                }}
                                className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-all gap-3"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.color}`}>
                                    {action.icon}
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter text-center">{action.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Stats and Recent - Hidden for restricted roles on mobile if desired, or kept for everyone */}
                <div className={`${role === 'punto_de_control' ? 'hidden lg:block' : ''} space-y-6 sm:space-y-8`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <StatCard title="VISITAS HOY" value={stats.today} icon={<Calendar size={16} />} />
                        <StatCard title="EN PLANTA" value={stats.active} icon={<Building size={16} />} color="text-green-500" />
                        <StatCard title="ALERTAS" value={stats.pending} icon={<User size={16} />} color="text-red-500" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1">
                            <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Actividad Reciente</h3>
                            <div className="relative w-full sm:w-64">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search size={14} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar visita..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-2 focus:ring-primary shadow-sm"
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={columns}
                            data={filteredVisits}
                            loading={loading}
                            emptyMessage="No se encontraron visitas."
                            paginate={true}
                            pageSize={10}
                        />
                    </div>
                </div>

                <VisitModal isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} />
            </div>
        </Layout>
    );
};

export default Dashboard;
