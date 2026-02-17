import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, limit, doc, updateDoc, deleteDoc, serverTimestamp, where } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { Camera, Calendar, User, Building, LogOut, Mail, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon, color = "text-primary" }) => (
    <div className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
        </div>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${color} shadow-inner shrink-0`}>
            {icon}
        </div>
    </div>
);

const Dashboard = () => {
    const { role, companyId } = useAuth();
    const [stats, setStats] = useState({ today: 0, active: 0, pending: 0 });
    const [recentVisits, setRecentVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Actualiza cada minuto
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (start, end) => {
        if (!start) return '--';
        const startTime = start.toDate ? start.toDate() : start;
        const endTime = end ? (end.toDate ? end.toDate() : end) : now;

        const diffMs = endTime - startTime;
        if (diffMs < 0) return '0m';

        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);

        if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
        return `${diffMins}m`;
    };

    useEffect(() => {
        if (!companyId) return;

        // FIX: Removed orderBy/limit from query to avoid "Missing Index" error.
        // Fetching all company visits to calculate stats and sorting client-side.
        const q = query(
            collection(db, 'visits'),
            where('companyId', '==', companyId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side sort: newest first
            docs.sort((a, b) => {
                const dateA = a.check_in?.toDate ? a.check_in.toDate() : new Date(0);
                const dateB = b.check_in?.toDate ? b.check_in.toDate() : new Date(0);
                return dateB - dateA;
            });

            setRecentVisits(docs.slice(0, 10)); // Take top 10 for table

            const today = new Date().toDateString();
            const todayVisits = docs.filter(v => v.check_in && v.check_in.toDate().toDateString() === today);

            setStats({
                today: todayVisits.length,
                active: docs.filter(v => !v.check_out).length,
                pending: docs.filter(v => {
                    if (!v.check_in) return false;
                    const diff = new Date() - v.check_in.toDate();
                    return !v.check_out && diff > (4 * 60 * 60 * 1000); // 4 hours without checkout
                }).length
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [companyId]);

    const handleCheckOut = async (id) => {
        if (confirm('¿Registrar salida de este visitante?')) {
            try {
                await updateDoc(doc(db, 'visits', id), {
                    check_out: serverTimestamp(),
                    status: 'Salida'
                });
            } catch (err) { alert('Error: ' + err.message); }
        }
    };

    const handleEmail = (row) => {
        if (!row.visitor_email) return alert('El empleado no tiene email registrado.');
        const subject = encodeURIComponent(`Aviso de Visita: ${row.full_name}`);
        const body = encodeURIComponent(`Hola ${row.employee},\n\nTe informamos que ${row.full_name} de la empresa ${row.company} se encuentra en recepción para una visita por el motivo: ${row.reason}.\n\nSaludos,\nSistema de Visitas.`);
        window.location.href = `mailto:${row.visitor_email}?subject=${subject}&body=${body}`;
    };

    const handleWhatsApp = (row) => {
        if (!row.visitor_phone) return alert('El empleado no tiene WhatsApp registrado.');
        const phone = row.visitor_phone.replace(/\D/g, '');
        const text = encodeURIComponent(`Hola, ${row.employee}. El visitante ${row.full_name} de la empresa ${row.company} ha llegado para verte.`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };


    const columns = [
        {
            header: 'Foto',
            render: (row) => (
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                    {row.photo_url ? (
                        <img src={row.photo_url} alt="Visitante" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera size={16} />
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Visitante / Empresa',
            render: (row) => (
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.company}</p>
                </div>
            )
        },
        {
            header: 'Motivo / Empleado',
            render: (row) => (
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.reason}</p>
                        {row.badge_number && (
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                #{row.badge_number}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-tight">{row.employee}</p>
                </div>
            )
        },
        {
            header: 'Fecha',
            render: (row) => (
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {row.check_in ? row.check_in.toDate().toLocaleDateString() : '--/--/----'}
                </div>
            )
        },
        {
            header: 'Horarios',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-xs flex items-center gap-2 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {row.check_in ? row.check_in.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                    {row.check_out && (
                        <p className="text-xs flex items-center gap-2 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            {row.check_out ? row.check_out.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                    )}
                </div>
            )
        },
        {
            header: 'Duración',
            render: (row) => (
                <div className="flex flex-col">
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
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${row.check_out
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
                <div className="flex justify-end gap-1">
                    {!row.check_out && (
                        <button
                            onClick={() => handleCheckOut(row.id)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Registrar Salida"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => handleEmail(row)}
                        className="p-2 text-slate-400 hover:text-navy hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Notificar por Email"
                    >
                        <Mail size={16} />
                    </button>
                    <button
                        onClick={() => handleWhatsApp(row)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Notificar por WhatsApp"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <Layout title="Dashboard Overview">
            <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    <StatCard title="Visitas Hoy" value={stats.today} icon={<Calendar size={18} />} />
                    <StatCard title="En Planta" value={stats.active} icon={<Building size={18} />} color="text-green-500" />
                    <StatCard title="Alertas" value={stats.pending} icon={<User size={18} />} color="text-red-500" />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-bold text-slate-800 dark:text-white uppercase text-[10px] tracking-widest text-slate-400 font-bold">Visitas Recientes</h3>
                    </div>
                    <DataTable
                        columns={columns}
                        data={recentVisits}
                        loading={loading}
                        emptyMessage="Aún no hay visitas registradas hoy."
                    />
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
