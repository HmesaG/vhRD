import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, where } from '../firebase';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import { LogOut, Mail, Send, Trash2, Camera, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VisitsList = () => {
    const { companyId } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
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
        const q = query(
            collection(db, 'visits'),
            where('companyId', '==', companyId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            docs.sort((a, b) => {
                const dateA = a.check_in?.toDate ? a.check_in.toDate() : new Date(0);
                const dateB = b.check_in?.toDate ? b.check_in.toDate() : new Date(0);
                return dateB - dateA;
            });
            setVisits(docs);
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

    const filteredVisits = visits.filter(v =>
        v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            header: 'Motivo / Empleado',
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
                    {row.check_in ? row.check_in.toDate().toLocaleDateString() : '--/--/----'}
                </div>
            )
        },
        {
            header: 'Horarios',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-xs flex items-center gap-1.5 font-medium whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                        {row.check_in ? row.check_in.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                    {row.check_out && (
                        <p className="text-xs flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                            {row.check_out.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <Layout title="Control de Visitas">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Search bar */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary shadow-inner"
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredVisits}
                    loading={loading}
                    emptyMessage="No se encontraron visitas."
                />
            </div>
        </Layout>
    );
};

export default VisitsList;
