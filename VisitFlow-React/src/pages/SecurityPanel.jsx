import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, getDocs, onSnapshot } from '../firebase';
import Layout from '../components/Layout';
import { Shield, Search, Camera, User, Building, MapPin, CheckCircle2, XCircle, AlertTriangle, Scan } from 'lucide-react';

const SecurityPanel = () => {
    const { companyId, role, user } = useAuth();
    const [badgeInput, setBadgeInput] = useState('');
    const [scannedVisit, setScannedVisit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [areas, setAreas] = useState({});
    const [userAssignedAreas, setUserAssignedAreas] = useState([]);

    // Fetch user assigned areas if punto_de_control
    useEffect(() => {
        if (!user || role !== 'punto_de_control') return;
        const fetchUserData = async () => {
            const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
            if (!userDoc.empty) {
                const data = userDoc.docs[0].data();
                setUserAssignedAreas(data.assignedAreas || []);
            }
        };
        fetchUserData();
    }, [user, role]);

    // Fetch areas for mapping
    useEffect(() => {
        if (!companyId) return;
        const q = query(collection(db, 'areas'), where('companyId', '==', companyId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const areaMap = {};
            snapshot.docs.forEach(doc => {
                areaMap[doc.id] = doc.data();
            });
            setAreas(areaMap);
        });
        return () => unsubscribe();
    }, [companyId]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!badgeInput.trim() || !companyId) return;

        setLoading(true);
        setError('');
        setScannedVisit(null);

        try {
            // Fetch all active visits for this company and filter client-side to avoid index issues
            const q = query(
                collection(db, 'visits'),
                where('companyId', '==', companyId)
            );

            const querySnapshot = await getDocs(q);
            const allVisits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const activeVisit = allVisits.find(v =>
                String(v.badge_number) === badgeInput.trim() &&
                v.status !== 'Salida' &&
                !v.check_out
            );

            if (!activeVisit) {
                setError('No se encontró ninguna visita activa con este carnet (# ' + badgeInput + ').');
                setScannedVisit(null);
            } else {
                setScannedVisit(activeVisit);
            }
        } catch (err) {
            setError('Error al validar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ visit }) => {
        if (!visit) return null;

        const targetArea = areas[visit.areaId];
        const isAuthorizedArea = role !== 'punto_de_control' || userAssignedAreas.includes(visit.areaId);

        if (visit.check_out) {
            return (
                <div className="p-6 rounded-2xl flex items-center gap-4 border bg-red-500/10 border-red-500/20 text-red-500">
                    <XCircle size={40} />
                    <div>
                        <p className="text-xl font-black uppercase">Acceso Denegado</p>
                        <p className="text-sm opacity-80">Esta visita ya registró su salida del edificio.</p>
                    </div>
                </div>
            );
        }

        if (!isAuthorizedArea) {
            return (
                <div className="p-6 rounded-2xl flex items-center gap-4 border bg-amber-500/10 border-amber-500/20 text-amber-500">
                    <AlertTriangle size={40} />
                    <div>
                        <p className="text-xl font-black uppercase">Área No Autorizada</p>
                        <p className="text-sm opacity-80">
                            No tienes permisos para validar el acceso a: <span className="font-bold">{targetArea?.name || 'Área Desconocida'}</span>.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-6 rounded-2xl flex items-center gap-4 border bg-green-500/10 border-green-500/20 text-green-500">
                <CheckCircle2 size={40} />
                <div>
                    <p className="text-xl font-black uppercase">Acceso Autorizado</p>
                    <p className="text-sm opacity-80">Área permitida: {targetArea ? `${targetArea.level} - ${targetArea.name}` : 'Cualquiera'}</p>
                </div>
            </div>
        );
    };

    return (
        <Layout title="Centro de Validación de Seguridad">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Panel: Scanner/Input */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 lg:p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                            <div className="relative">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Punto de Control</h3>
                                <p className="text-slate-400 text-sm mb-8">Escanee el código QR o ingrese el número de carnet físico.</p>

                                <form onSubmit={handleSearch} className="space-y-4">
                                    <div className="relative">
                                        <Scan size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                        <input
                                            type="text"
                                            placeholder="N° de Carnet"
                                            className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-12 text-white font-mono text-lg focus:ring-2 focus:ring-primary uppercase"
                                            value={badgeInput}
                                            onChange={(e) => setBadgeInput(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        disabled={loading}
                                        className="w-full bg-primary hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Search size={18} />
                                                Validar Identidad
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                <p className="text-red-400 text-sm font-bold">{error}</p>
                            </div>
                        )}

                        {!scannedVisit && !error && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Camera size={24} />
                                </div>
                                <p className="text-slate-500 text-sm font-medium italic">Esperando lectura de carnet...</p>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Result Data */}
                    <div className="lg:col-span-2">
                        {scannedVisit ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <StatusBadge visit={scannedVisit} />

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <User className="text-primary" size={20} />
                                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-sm">Ficha del Visitante</h4>
                                        </div>
                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase">Expediente Activo</span>
                                    </div>

                                    <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                        <div className="md:col-span-1">
                                            <div className="aspect-[4/3] md:aspect-[3/4] rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                                                {scannedVisit.photo_url ? (
                                                    <img src={scannedVisit.photo_url} alt="Visitante" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <User size={64} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                                <DataField label="Nombre Completo" value={scannedVisit.full_name} />
                                                <DataField label="Cédula / ID" value={scannedVisit.document_id} />
                                                <DataField label="Empresa de Origen" value={scannedVisit.company} icon={<Building size={14} />} />
                                                <DataField label="Motivo de Visita" value={scannedVisit.reason} />
                                            </div>

                                            <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destino Autorizado</p>
                                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                            <MapPin size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white">
                                                                {areas[scannedVisit.areaId]?.name || 'Área no especificada'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 uppercase tracking-tighter">
                                                                Nivel: {areas[scannedVisit.areaId]?.level || '---'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DataField label="Persona que Recibe" value={scannedVisit.employee} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DataField label="Hora Entrada" value={scannedVisit.check_in?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                                                    <DataField label="Carnet Asignado" value={`#${scannedVisit.badge_number}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50 space-y-4">
                                <div className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex items-center justify-center text-slate-300">
                                    <Scan size={48} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-400">Escaneo de Identidad</h3>
                                    <p className="text-sm max-w-xs text-slate-400">La información del visitante aparecerá en este panel una vez sea validado su carnet.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const DataField = ({ label, value, icon }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <p className="font-bold text-slate-700 dark:text-slate-200">{value || '---'}</p>
        </div>
    </div>
);

export default SecurityPanel;
