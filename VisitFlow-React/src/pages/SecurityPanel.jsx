import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, getDocs, onSnapshot } from '../firebase';
import Layout from '../components/Layout';
import { Shield, Search, Camera, User, Building, MapPin, CheckCircle2, XCircle, AlertTriangle, Scan } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const SecurityPanel = () => {
    const { companyId, role, user } = useAuth();
    const [badgeInput, setBadgeInput] = useState('');
    const [scannedVisit, setScannedVisit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [areas, setAreas] = useState({});
    const [userAssignedAreas, setUserAssignedAreas] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const html5QrCodeRef = React.useRef(null);
    const [secondsLeft, setSecondsLeft] = useState(10);

    // Auto-refresh timer when a visit is scanned
    useEffect(() => {
        let timer;
        let countdown;
        if (scannedVisit) {
            setSecondsLeft(10);
            countdown = setInterval(() => {
                setSecondsLeft(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);

            timer = setTimeout(() => {
                handleReset();
            }, 10000);
        }
        return () => {
            clearTimeout(timer);
            clearInterval(countdown);
        };
    }, [scannedVisit]);

    const handleReset = () => {
        setScannedVisit(null);
        setBadgeInput('');
        setError('');
        startCamera();
    };

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
                // Si encontramos la visita, cerramos la cámara por comodidad
                stopCamera();
            }
        } catch (err) {
            setError('Error al validar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            setIsCameraActive(true);
            setError('');

            // Usar setImmediate o setTimeout para asegurar que el DOM cargó el div del lector
            setTimeout(async () => {
                try {
                    const html5QrCode = new Html5Qrcode("reader");
                    html5QrCodeRef.current = html5QrCode;

                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            setBadgeInput(decodedText);
                            handleAutoSearch(decodedText);
                        },
                        (errorMessage) => {
                            // Ignorar errores de escaneo (no encontró QR en este frame)
                        }
                    );
                    setIsScanning(true);
                } catch (err) {
                    console.error("Error starting html5-qrcode:", err);
                    setError("Error al iniciar el escáner: " + err.message);
                    setIsCameraActive(false);
                }
            }, 100);

        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("No se pudo acceder a la cámara. Verifique los permisos.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                await html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Error stopping camera:", err);
            }
        }
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
        setIsScanning(false);
    };

    const handleAutoSearch = async (code) => {
        if (!companyId) {
            setError('Error: ID de compañía no encontrado. Por favor reinicie sesión.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const q = query(collection(db, 'visits'), where('companyId', '==', companyId));
            const querySnapshot = await getDocs(q);
            const allVisits = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const activeVisit = allVisits.find(v =>
                Number(v.badge_number) === Number(code.trim()) ||
                String(v.badge_number) === String(code.trim())
            );

            if (!activeVisit) {
                setError('No se encontró visita activa para el carnet: ' + code);
            } else {
                setScannedVisit(activeVisit);
                stopCamera();
            }
        } catch (err) {
            setError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Al desmontar, asegurarnos de apagar la cámara
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const StatusBadge = ({ visit }) => {
        if (!visit) return null;

        const targetArea = areas[visit.areaId];
        const isAuthorizedArea = role !== 'punto_de_control' || userAssignedAreas.includes(visit.areaId);

        if (visit.check_out) {
            return (
                <div className="p-4 sm:p-6 rounded-2xl flex items-center gap-3 sm:gap-4 border bg-red-500/10 border-red-500/20 text-red-500">
                    <XCircle size={28} className="sm:w-10 sm:h-10 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-base sm:text-xl font-black uppercase">Acceso Denegado</p>
                        <p className="text-xs sm:text-sm opacity-80">Esta visita ya registró su salida del edificio.</p>
                    </div>
                </div>
            );
        }

        if (!isAuthorizedArea) {
            return (
                <div className="p-4 sm:p-6 rounded-2xl flex items-center gap-3 sm:gap-4 border bg-amber-500/10 border-amber-500/20 text-amber-500">
                    <AlertTriangle size={28} className="sm:w-10 sm:h-10 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-base sm:text-xl font-black uppercase">Área No Autorizada</p>
                        <p className="text-xs sm:text-sm opacity-80">
                            No tienes permisos para validar el acceso a: <span className="font-bold">{targetArea?.name || 'Área Desconocida'}</span>.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-4 sm:p-6 rounded-2xl flex items-center gap-3 sm:gap-4 border bg-green-500/10 border-green-500/20 text-green-500">
                <CheckCircle2 size={28} className="sm:w-10 sm:h-10 shrink-0" />
                <div className="min-w-0">
                    <p className="text-base sm:text-xl font-black uppercase">Acceso Autorizado</p>
                    <p className="text-xs sm:text-sm opacity-80">Área permitida: {targetArea ? `${targetArea.level} - ${targetArea.name}` : 'Cualquiera'}</p>
                </div>
            </div>
        );
    };

    return (
        <Layout title="Centro de Validación de Seguridad">
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Left Panel: Scanner/Input */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
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
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                                {isCameraActive ? (
                                    <div className="relative aspect-square sm:aspect-video lg:aspect-square bg-black overflow-hidden">
                                        <div
                                            id="reader"
                                            className="w-full h-full"
                                        />
                                        {/* Scanner Overlay */}
                                        <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none">
                                            <div className="w-full h-full border-2 border-primary/50 relative">
                                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary" />
                                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary" />
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary" />
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary" />

                                                {/* Scanning Animation Line */}
                                                <div className="w-full h-0.5 bg-primary/40 absolute top-0 animate-scan-line shadow-[0_0_15px_rgba(245,130,32,0.8)]" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={stopCamera}
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase transition-colors"
                                        >
                                            Cerrar Cámara
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-10 text-center space-y-4">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                            <Camera size={32} />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">Escáner de Carnet</p>
                                            <p className="text-slate-500 text-xs mt-1">Habilite su cámara para leer el código QR del visitante.</p>
                                        </div>
                                        <button
                                            onClick={startCamera}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Camera size={16} />
                                            Activar Cámara
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Result Data */}
                    <div className="lg:col-span-2">
                        {scannedVisit ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col sm:flex-row items-stretch gap-4">
                                    <div className="flex-1">
                                        <StatusBadge visit={scannedVisit} />
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-10 py-4 sm:py-0 rounded-2xl font-black uppercase text-sm shadow-lg shadow-indigo-500/20 transition-all flex flex-col items-center justify-center gap-0.5 group active:scale-95"
                                    >
                                        <span className="group-hover:scale-110 transition-transform tracking-widest">Siguiente</span>
                                        <span className="text-[10px] opacity-70 group-hover:opacity-100 normal-case font-bold">Reiniciar en {secondsLeft}s</span>
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                <User size={16} />
                                            </div>
                                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Ficha del Visitante</h4>
                                        </div>
                                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase border border-emerald-500/20">Expediente Vivo</span>
                                    </div>

                                    <div className="p-5 sm:p-8 space-y-8">
                                        <div className="flex flex-col sm:flex-row gap-6">
                                            <div className="w-full sm:w-1/3">
                                                <div className="aspect-[4/3] sm:aspect-[3/4] rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-inner group">
                                                    {scannedVisit.photo_url ? (
                                                        <img src={scannedVisit.photo_url} alt="Visitante" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                            <User size={48} />
                                                            <span className="text-[10px] uppercase font-bold opacity-50">Sin Foto</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <DataField label="Nombre Completo" value={scannedVisit.full_name} />
                                                    <DataField label="Documento ID" value={scannedVisit.document_id} />
                                                    <DataField label="Empresa" value={scannedVisit.company} icon={<Building size={14} />} />
                                                    <DataField label="Asunto / Motivo" value={scannedVisit.reason} />
                                                </div>

                                                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Punto de Destino</p>
                                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                                                <MapPin size={20} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-800 dark:text-white truncate uppercase tracking-tight">
                                                                    {areas[scannedVisit.areaId]?.name || 'Área no especificada'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase">
                                                                    Nivel: {areas[scannedVisit.areaId]?.level || '---'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DataField label="Hora de Ingreso" value={scannedVisit.check_in?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                                                        <DataField label="Carnet ID" value={`# ${scannedVisit.badge_number}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={handleReset}
                                                className="w-full bg-slate-900 border border-slate-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] hover:bg-slate-800 flex items-center justify-center gap-3 group"
                                            >
                                                Finalizar Proceso
                                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <CheckCircle2 size={12} />
                                                </div>
                                            </button>
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
