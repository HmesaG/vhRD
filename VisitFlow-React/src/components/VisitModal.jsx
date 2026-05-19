import React, { useState, useEffect, useRef } from 'react';
import { companiesApi, reasonsApi, badgesApi, visitsApi, employeesApi, areasApi } from '../services/api';
import { 
    X, Printer, Loader2, Plus, User, 
    Building2, MapPin, CreditCard, Search, CheckCircle2,
    Calendar, Clock, Fingerprint, Briefcase, Globe, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useOrganizationLabels } from '../hooks/useOrganizationLabels';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useToast } from '../context/ToastContext';

const VisitModal = ({ isOpen, onClose }) => {
    const { companyId, companyData } = useAuth();
    const { hostSingular } = useOrganizationLabels();
    const toast = useToast();
    const [formData, setFormData] = useState({
        full_name: '',
        document_id: '',
        company: '',
        reason: '',
        employee: '',
        badge_number: '',
        areaId: '',
        accessMethod: 'badge', // 'badge' or 'ticket'
        printTicket: false,
        document_id_empresa: ''
    });

    const [isIndependent, setIsIndependent] = useState(false);
    const [lastVisit, setLastVisit] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [badges, setBadges] = useState([]);
    const [areas, setAreas] = useState([]);
    const [activeBadgeNumbers, setActiveBadgeNumbers] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [searchingRnc, setSearchingRnc] = useState(false);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const html5QrCodeRef = useRef(null);

    // Parser for new JCE cédula QR (pipe-separated format from JCE)
    const parseCedulaQR = (rawText) => {
        // New cédula QR uses pipe | as separator
        // Common format: "CEDULA|NOMBRE|APELLIDO1|APELLIDO2|BIRTHDATE|SEX|..."
        const parts = rawText.split(/[|,;]/).map(p => p.trim()).filter(Boolean);

        if (parts.length >= 2) {
            // Find the 11-digit cedula number
            const cedula = parts.find(p => /^\d{11}$/.test(p));

            // Name fields are non-numeric strings with letters only
            const nameFields = parts.filter(p =>
                /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s\-']+$/.test(p) && p.length > 1
            );
            const fullName = nameFields.slice(0, 3).join(' ').trim();

            return { cedula: cedula || rawText.replace(/\D/g, ''), fullName };
        }

        // Fallback: assume it's just a cedula number (old barcode)
        const digitsOnly = rawText.replace(/\D/g, '');
        return { cedula: digitsOnly, fullName: '' };
    };

    // Compress photo to max 800px wide, JPEG 0.75 quality before sending to backend
    const compressImage = (dataUrl) => new Promise((resolve) => {
        if (!dataUrl || !dataUrl.startsWith('data:image')) return resolve(dataUrl);
        const img = new Image();
        img.onload = () => {
            const MAX = 800;
            let { width, height } = img;
            if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

    const startScanner = async () => {
        try {
            setIsCameraActive(true);
            setTimeout(async () => {
                try {
                    const html5QrCode = new Html5Qrcode("modal-reader", {
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.CODE_39,
                            Html5QrcodeSupportedFormats.PDF_417,
                            Html5QrcodeSupportedFormats.QR_CODE
                        ]
                    });
                    html5QrCodeRef.current = html5QrCode;
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 15, qrbox: (viewfinderWidth, viewfinderHeight) => {
                            // Square box — works better for the square JCE cédula QR
                            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.85;
                            return { width: size, height: size };
                        } },
                        (decodedText) => {
                            const { cedula, fullName } = parseCedulaQR(decodedText);
                            setFormData(prev => ({
                                ...prev,
                                document_id: cedula,
                                ...(fullName ? { full_name: toTitleCase(fullName) } : {})
                            }));
                            stopScanner();
                        },
                        () => {}
                    );
                } catch (err) {
                    console.error(err);
                    setIsCameraActive(false);
                }
            }, 100);
        } catch (err) { setIsCameraActive(false); }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
            await html5QrCodeRef.current.clear();
        }
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) stopScanner();
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setIsIndependent(false);
            if (html5QrCodeRef.current) stopScanner();
            return;
        }
        if (!companyId) return;

        const loadData = async () => {
            try {
                const [comps, rsns, bdgs, vsts, emps, ars] = await Promise.all([
                    companiesApi.getAll(companyId),
                    reasonsApi.getAll(companyId),
                    badgesApi.getAll(companyId),
                    visitsApi.getAll(companyId),
                    employeesApi.getAll(companyId),
                    areasApi.getAll(companyId)
                ]);

                setCompanies(comps.map(c => c.name).sort((a, b) => a.localeCompare(b)));
                setReasons(rsns.map(r => ({ label: r.label })).sort((a, b) => a.label.localeCompare(b.label)));
                setBadges(bdgs.map(b => b.number).sort());
                setActiveBadgeNumbers(vsts.filter(v => !v.check_out).map(v => v.badge_number).filter(Boolean));
                setEmployees(emps.map(e => ({ name: e.name, area: e.area, email: e.email, whatsapp: e.whatsapp })).sort((a, b) => a.name.localeCompare(b.name)));
                setAreas([...ars].sort((a, b) => a.level.localeCompare(b.level, undefined, { numeric: true })));
            } catch (err) {
                console.error('Error loading modal data:', err);
            }
        };
        loadData();
    }, [isOpen, companyId]);

    const handleCedulaLookup = async () => {
        const cleanId = formData.document_id.replace(/\D/g, '');
        if (cleanId.length !== 11) return;
        
        setIsFetching(true);
        try {
            const response = await fetch(`https://cedula.jeshuatech.com/?cedula=${cleanId}`);
            const result = await response.json();
            if (result.success && result.data?.nombre_completo) {
                setFormData(prev => ({
                    ...prev,
                    full_name: toTitleCase(result.data.nombre_completo)
                }));
            }
        } catch (error) {
            console.error("Error fetching cedula:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleRncLookup = async () => {
        const cleanRnc = formData.document_id_empresa.replace(/\D/g, '');
        if (cleanRnc.length < 9) return;

        setSearchingRnc(true);
        try {
            const response = await fetch('/api-dgii/Contribuyentes', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ "RNC": cleanRnc })
            });

            if (response.ok) {
                const data = await response.json();
                const validData = Array.isArray(data) ? (data[0] || {}) : data;
                const nameKey = Object.keys(validData).find(k => 
                    /nomb|razon|social/i.test(k)
                );
                if (nameKey && validData[nameKey]) {
                    setFormData(prev => ({ ...prev, company: toTitleCase(validData[nameKey]) }));
                }
            }
        } catch (error) {
            console.error("Error fetching company:", error);
        } finally {
            setSearchingRnc(false);
        }
    };

    // Auto-triggers
    useEffect(() => {
        const cleanId = formData.document_id.replace(/\D/g, '');
        if (cleanId.length === 11) handleCedulaLookup();
    }, [formData.document_id]);

    useEffect(() => {
        if (isIndependent) return;
        const len = formData.document_id_empresa.replace(/\D/g, '').length;
        if (len === 9 || len === 11) handleRncLookup();
    }, [formData.document_id_empresa, isIndependent]);

    useEffect(() => {
        if (isIndependent) {
            setFormData(prev => ({
                ...prev,
                document_id_empresa: prev.document_id,
                company: prev.full_name
            }));
        }
    }, [isIndependent, formData.document_id, formData.full_name]);

    const availableBadges = badges.filter(num => !activeBadgeNumbers.includes(num));

    const toTitleCase = (str) => str ? str.toLowerCase().replace(/(^|\s)\S/g, L => L.toUpperCase()) : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.accessMethod === 'badge' && !formData.badge_number) {
            toast.warning('Por favor asigna un carnet antes de continuar.');
            return;
        }

        try {
            const selectedEmployee = employees.find(emp => emp.name === formData.employee);

            // Compress photo before sending to reduce payload size
            const compressedPhoto = formData.photo_url
                ? await compressImage(formData.photo_url)
                : null;

            const response = await visitsApi.create({
                ...formData,
                photo_url: compressedPhoto,
                company_id: companyId,
                status: 'Ingresado',
                visitor_phone: selectedEmployee?.whatsapp || '',
                visitor_email: selectedEmployee?.email || ''
            });

            toast.success('Visita registrada correctamente.');

            if (formData.printTicket) {
                const area = areas.find(a => a.id === formData.areaId);
                setLastVisit({
                    ...response,
                    area_name: area?.name || 'N/A',
                    floor: area?.level || '01',
                    host_name: response.employee,
                    visitor_name: response.full_name,
                    visitor_company: response.company_name,
                    visit_reason: response.reason,
                    created_at: response.check_in || new Date().toISOString()
                });
                
                setTimeout(() => {
                    window.print();
                    onClose();
                }, 500);
            } else {
                onClose();
            }
            setFormData({ full_name: '', document_id: '', company: '', reason: '', employee: '', badge_number: '', areaId: '', accessMethod: 'badge', printTicket: false, document_id_empresa: '' });
            setIsIndependent(false);
        } catch (err) { toast.error('Error al registrar visita: ' + err.message); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg lg:text-xl font-black text-slate-800 dark:text-white tracking-tight">Registro de Visita</h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Control Operativo • {companyData?.name || 'Visitas Hub RD'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 active:scale-95">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 lg:p-5 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col md:flex-row gap-5 items-start">
                        <form onSubmit={handleSubmit} className={`flex flex-col gap-4 transition-all duration-300 ${isCameraActive ? 'md:w-[55%] lg:w-[65%]' : 'w-full'}`}>
                        
                        {/* 1. Identity Section */}
                        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md space-y-4 transition-all hover:border-primary/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 ring-2 ring-blue-500/5"><Fingerprint size={16} /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Identidad del Visitante</h4>
                                        <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Validación Biográfica • Cédula JCE</p>
                                    </div>
                                </div>
                                {formData.full_name && !isFetching && (
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-bold uppercase tracking-wide border border-emerald-500/20 animate-in zoom-in">
                                        <CheckCircle2 size={10} /> Validado
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento de Identidad</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <input
                                                required
                                                type="text"
                                                className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono font-bold text-slate-700 dark:text-white ${isFetching ? 'opacity-50' : ''}`}
                                                placeholder="000-0000000-0"
                                                value={formData.document_id}
                                                onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleCedulaLookup}
                                                disabled={isFetching || !formData.document_id}
                                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-all z-10"
                                                title="Buscar Cédula"
                                            >
                                                {isFetching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={isCameraActive ? stopScanner : startScanner}
                                            className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-black uppercase transition-all shadow-sm shrink-0 ${
                                                isCameraActive 
                                                    ? 'bg-red-500 border-red-500 text-white hover:bg-red-650 shadow-md shadow-red-500/20' 
                                                    : 'bg-primary border-primary text-white hover:bg-primary/90'
                                            }`}
                                            title={isCameraActive ? "Cerrar Escáner" : "Escanear con Cámara"}
                                        >
                                            {isCameraActive ? <X size={15} /> : <Camera size={15} />}
                                            <span>{isCameraActive ? 'Cerrar' : 'Cámara'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                            placeholder="Nombre del visitante..."
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Company Section */}
                        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md space-y-4 transition-all hover:border-primary/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 ring-2 ring-amber-500/5"><Building2 size={16} /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Empresa / Procedencia</h4>
                                        <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Filiación Corporativa • RNC DGII</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none border border-slate-200 dark:border-slate-700 active:scale-[0.98] shadow-sm">
                                    <input
                                        type="checkbox"
                                        checked={isIndependent}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setIsIndependent(checked);
                                            if (checked) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    document_id_empresa: prev.document_id,
                                                    company: prev.full_name
                                                }));
                                            } else {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    document_id_empresa: '',
                                                    company: ''
                                                }));
                                            }
                                        }}
                                        className="accent-primary h-4 w-4 rounded border-slate-350 text-primary focus:ring-primary focus:ring-offset-0"
                                    />
                                    <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">Empresa Independiente</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RNC (Registro Nacional)</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={formData.document_id_empresa}
                                            onChange={(e) => setFormData({ ...formData, document_id_empresa: e.target.value })}
                                            readOnly={isIndependent}
                                            className={`w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                                                isIndependent 
                                                    ? 'opacity-60 cursor-not-allowed select-none bg-slate-200/20 dark:bg-slate-800/25 border-dashed' 
                                                    : ''
                                            }`}
                                            placeholder={isIndependent ? "Sincronizado con cédula" : "Ej: 130252181"}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleRncLookup}
                                            disabled={searchingRnc || !formData.document_id_empresa || isIndependent}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-all z-10"
                                            title="Buscar RNC"
                                        >
                                            {searchingRnc ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre / Razón Social</label>
                                    <div className="relative">
                                        <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="text"
                                            list={isIndependent ? undefined : "companies-list"}
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            readOnly={isIndependent}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-805 dark:text-white transition-all ${
                                                isIndependent 
                                                    ? 'opacity-65 cursor-not-allowed select-none bg-slate-200/20 dark:bg-slate-800/25 border-dashed' 
                                                    : ''
                                            }`}
                                            placeholder={isIndependent ? "Sincronizado con nombre" : "Nombre de la empresa..."}
                                        />
                                    </div>
                                    <datalist id="companies-list">
                                        {companies.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* 3. Bottom Row: Details, Access, Destination inside subgrid to prevent squishing */}
                        <div className={`grid grid-cols-1 gap-4 ${isCameraActive ? 'sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3'}`}>
                            
                            {/* Details Card */}
                            <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-500"><Briefcase size={15} /></div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motivo & {hostSingular}</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            required
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold appearance-none cursor-pointer text-slate-700 dark:text-white focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        >
                                            <option value="">Motivo de visita...</option>
                                            {reasons.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            required
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold appearance-none cursor-pointer text-slate-700 dark:text-white focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                                            value={formData.employee}
                                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                                        >
                                            <option value="">{hostSingular} / Contacto...</option>
                                            {employees.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Access Card */}
                            <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500"><CreditCard size={15} /></div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acceso</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, accessMethod: 'badge', printTicket: false })}
                                        className={`flex-1 py-2 rounded-lg border text-[9px] font-black uppercase transition-all ${formData.accessMethod === 'badge' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        Carnet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, accessMethod: 'ticket', printTicket: true, badge_number: '' })}
                                        className={`flex-1 py-2 rounded-lg border text-[9px] font-black uppercase transition-all ${formData.accessMethod === 'ticket' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}
                                    >
                                        Ticket QR
                                    </button>
                                </div>
                                {formData.accessMethod === 'badge' && (
                                    <select
                                        required
                                        className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs font-black text-primary cursor-pointer outline-none"
                                        value={formData.badge_number}
                                        onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                                    >
                                        <option value="">N° Carnet...</option>
                                        {availableBadges.map(num => <option key={num} value={num}>#{num}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Destination Card */}
                            <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><MapPin size={15} /></div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destino</h4>
                                    </div>
                                    <select
                                        required
                                        className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs font-black text-primary cursor-pointer outline-none"
                                        value={formData.areaId}
                                        onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                                    >
                                        <option value="">Área...</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.level} - {a.name}</option>)}
                                    </select>
                                </div>
                                <p className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-tighter mt-1">Nivel de acceso restringido</p>
                            </div>

                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                Confirmar Registro de Visita
                            </button>
                        </div>
                    </form>

                    {isCameraActive && (
                        <div className="w-full md:w-[45%] lg:w-[35%] flex flex-col items-center justify-start bg-slate-100 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 animate-in slide-in-from-right duration-300 shrink-0 md:sticky md:top-0">
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Camera size={15} /></div>
                                    <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">Escáner de Cámara</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={stopScanner}
                                    className="text-[9px] font-black uppercase text-red-500 hover:text-red-650 dark:hover:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg transition-all"
                                >
                                    Detener
                                </button>
                            </div>
                            
                            <div className="relative w-full min-h-[250px] shrink-0 aspect-square lg:aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-slate-800">
                                <div id="modal-reader" className="w-full h-full" />
                                <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-950/60">
                                    <div className="w-full h-full border border-primary/50 relative">
                                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-primary" />
                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-primary" />
                                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-primary" />
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-primary" />
                                        <div className="w-full h-0.5 bg-primary/40 absolute top-0 animate-scan-line shadow-[0_0_10px_rgba(245,130,32,0.8)]" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-wide px-2 leading-relaxed">
                                Coloque el código de barras o QR de la cédula frente a la cámara para escanear automáticamente.
                            </p>
                        </div>
                    )}
                    </div>
                </div>              </div>

                {/* Printable Ticket - Dynamic Data */}
                {lastVisit && (
                    <div id="printable-ticket" className="print-only">
                        <div className="ticket-branding">
                            <div className="branding-text">
                                <h1 className="ticket-company-name">{companyData?.name || 'Visitas Hub RD'}</h1>
                                <p className="ticket-slogan">Seguridad y Control de Accesos</p>
                            </div>
                            {companyData?.logo_url && (
                                <img src={companyData.logo_url} alt="Logo" className="ticket-logo-small" />
                            )}
                        </div>
                        
                        <div className="ticket-visitor-section">
                            <h2 className="visitor-name-large">{lastVisit.visitor_name}</h2>
                            <p className="visitor-role">
                                <span className="label">Empresa:</span> <span className="value">{lastVisit.visitor_company || 'PARTICULAR'}</span>
                            </p>
                        </div>

                        <div className="divider-solid" />

                        <div className="ticket-bottom-grid">
                            <div className="ticket-details-section">
                                <div className="detail-row">
                                    <span className="label">{hostSingular}:</span>
                                    <span className="value">{lastVisit.host_name || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Destino:</span>
                                    <span className="value">{lastVisit.area_name || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Nivel:</span>
                                    <span className="value">{lastVisit.floor || '01'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Ingreso:</span>
                                    <span className="value">{new Date(lastVisit.created_at).toLocaleString('es-DO', { 
                                        day: '2-digit', month: '2-digit', year: '2-digit', 
                                        hour: '2-digit', minute: '2-digit', hour12: true 
                                    }).replace(',', '')}</span>
                                </div>
                            </div>

                            <div className="ticket-qr-section">
                                <div className="qr-code-wrapper">
                                    <QRCodeCanvas value={lastVisit.id?.toString() || ''} size={75} level="M" />
                                </div>
                                <div className="barcode-fallback">
                                    ID: {lastVisit.id?.toString().padStart(6, '0')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default VisitModal;
