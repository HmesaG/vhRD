import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword, auth, sendPasswordResetEmail } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail, ArrowLeft, Send, Phone, Globe, Instagram, Facebook, Linkedin, X, User } from 'lucide-react';

const Login = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestData, setRequestData] = useState({ name: '', email: '', phone: '' });

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Credenciales incorrectas. Por favor, intenta de nuevo.');
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Por favor, ingresa tu correo electrónico.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('Se ha enviado un enlace de recuperación a tu correo.');
            setLoading(false);
        } catch (err) {
            setError('Error al enviar el correo. Verifica que la dirección sea correcta.');
            setLoading(false);
        }
    };

    const handleRequestService = (e) => {
        e.preventDefault();
        const message = `*SOLICITUD DE SERVICIO - VISITFLOW*\n\n` +
            `*Nombre:* ${requestData.name}\n` +
            `*Correo:* ${requestData.email}\n` +
            `*Número:* ${requestData.phone}\n\n` +
            `Hola, me gustaría recibir más información sobre VisitFlow.`;

        const waUrl = `https://wa.me/18097649811?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
        setIsRequestModalOpen(false);
        setRequestData({ name: '', email: '', phone: '' });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 sm:p-6 relative overflow-x-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,130,32,0.15),transparent_70%)] pointer-events-none" />

            {/* Login Form Container */}
            <div className="w-full max-w-md relative z-10 flex-shrink-0 flex flex-col pt-12 pb-20 sm:py-24">
                <div className="text-center mb-10 group">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-8 sm:mb-10 transform group-hover:scale-105 transition-all duration-700">
                        <img
                            src="/logo.png"
                            alt="VisitFlow Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(245,130,32,0.4)]"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white text-center tracking-tighter mb-2 italic">VisitFlow</h1>
                    <div className="h-1 w-10 sm:w-12 bg-primary mx-auto rounded-full mb-4" />
                    <p className="text-slate-500 text-[10px] sm:text-[11px] font-black text-center uppercase tracking-[0.3em]">Access Control System</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        {isResetMode && (
                            <button
                                onClick={() => {
                                    setIsResetMode(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-white">
                            {isResetMode ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
                        </h2>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
                            {success}
                        </div>
                    )}

                    <form onSubmit={isResetMode ? handleResetPassword : handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    required
                                    type="email"
                                    placeholder="correo@empresa.com"
                                    className="w-full bg-slate-950 border-none ring-1 ring-slate-800 focus:ring-2 focus:ring-primary rounded-xl py-3.5 pl-12 text-sm text-white transition-all outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isResetMode && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResetMode(true);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-slate-950 border-none ring-1 ring-slate-800 focus:ring-2 focus:ring-primary rounded-xl py-3.5 pl-12 text-sm text-white transition-all outline-none"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-primary hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isResetMode ? <Send size={18} /> : <LogIn size={18} />}
                                    {isResetMode ? 'Enviar Enlace de Recuperación' : 'Acceder al Sistema'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full max-w-6xl relative z-10 pt-16 pb-12 mt-12 border-t border-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 text-left px-6 sm:px-8">
                    <div className="space-y-6">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Propiedad Intelectual</h3>
                        <div className="space-y-4">
                            <p className="text-white text-lg sm:text-base font-black tracking-tight leading-none italic">
                                GRUPO MESA<br /><span className="text-primary">VASQUEZ (GMV)</span>
                            </p>
                            <div className="space-y-2">
                                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.1em]">© 2026 VISITFLOW</p>
                                <p className="text-slate-600 text-[10px] sm:text-[9px] font-bold uppercase tracking-[0.15em] leading-relaxed">
                                    SISTEMAS DE CONTROL DE ACCESO<br />TODOS LOS DERECHOS RESERVADOS
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Canales Oficiales</h3>
                        <div className="space-y-4">
                            <a href="tel:8097649811" className="flex items-center gap-4 text-slate-400 hover:text-white transition-all duration-300 group">
                                <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl group-hover:bg-primary/20 border border-white/[0.02] group-hover:border-primary/30 transition-all">
                                    <Phone size={16} className="text-primary/60 group-hover:text-primary" />
                                </div>
                                <span className="text-xs font-black tracking-tight">809.764.9811</span>
                            </a>
                            <a href="https://grupomvrd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-slate-400 hover:text-white transition-all duration-300 group">
                                <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl group-hover:bg-primary/20 border border-white/[0.02] group-hover:border-primary/30 transition-all">
                                    <Globe size={16} className="text-primary/60 group-hover:text-primary" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-tight">grupomvrd.com</span>
                            </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Soporte Técnico</h3>
                        <div className="space-y-4">
                            <a href="mailto:grupomv.rd@outlook.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300">
                                <span className="text-xs font-black tracking-tight">grupomv.rd@outlook.com</span>
                            </a>
                            <a href="mailto:grupomv.rd@gmail.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300">
                                <span className="text-xs font-black tracking-tight">grupomv.rd@gmail.com</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 px-6 sm:px-8">
                    <div className="flex items-center gap-8 sm:gap-10">
                        <a href="#" className="text-slate-600 hover:text-primary transition-all hover:scale-125 duration-300">
                            <Instagram size={20} />
                        </a>
                        <a href="#" className="text-slate-600 hover:text-blue-500 transition-all hover:scale-125 duration-300">
                            <Facebook size={20} />
                        </a>
                        <a href="https://www.linkedin.com/company/grupo-mesa-vasquez/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-blue-400 transition-all hover:scale-125 duration-300">
                            <Linkedin size={20} />
                        </a>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] text-center">Visits Management System v2.0</span>
                    </div>
                </div>
            </div>

            {/* Floating button for Request Service */}
            <button
                onClick={() => setIsRequestModalOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[99] group border-4 border-slate-950"
            >
                <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20 pointer-events-none" />
                <Send size={28} className="relative z-10 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Request Service Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-800 shadow-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                            <Send size={120} className="text-primary" />
                        </div>

                        <button
                            onClick={() => setIsRequestModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white italic tracking-tight uppercase leading-none">Solicitar <span className="text-primary">Servicio</span></h3>
                                <p className="text-slate-400 text-xs font-bold leading-relaxed">Completa tus datos para enviarte una propuesta personalizada via WhatsApp.</p>
                            </div>

                            <form onSubmit={handleRequestService} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tu Nombre</label>
                                    <div className="relative group">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Nombre completo"
                                            className="w-full bg-slate-950 border-none ring-1 ring-slate-800 focus:ring-2 focus:ring-primary rounded-xl py-3 pl-11 text-sm text-white transition-all outline-none"
                                            value={requestData.name}
                                            onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <div className="relative group">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="email"
                                            placeholder="ejemplo@correo.com"
                                            className="w-full bg-slate-950 border-none ring-1 ring-slate-800 focus:ring-2 focus:ring-primary rounded-xl py-3 pl-11 text-sm text-white transition-all outline-none"
                                            value={requestData.email}
                                            onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono / WhatsApp</label>
                                    <div className="relative group">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="tel"
                                            placeholder="809.123.4567"
                                            className="w-full bg-slate-950 border-none ring-1 ring-slate-800 focus:ring-2 focus:ring-primary rounded-xl py-3 pl-11 text-sm text-white transition-all outline-none"
                                            value={requestData.phone}
                                            onChange={(e) => setRequestData({ ...requestData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:brightness-110 text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    Enviar solicitud
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
