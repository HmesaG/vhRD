import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail, ArrowLeft, Send, Phone, Globe, Instagram, Facebook, Linkedin, X, User, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
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

    useEffect(() => {
        const savedEmail = localStorage.getItem('vhrd_remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await login(email, password);
            if (rememberMe) {
                localStorage.setItem('vhrd_remembered_email', email);
            } else {
                localStorage.removeItem('vhrd_remembered_email');
            }
        } catch (err) {
            setError(err.message || 'Credenciales incorrectas. Por favor, intenta de nuevo.');
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
            // TODO: Implement password reset endpoint in backend
            setSuccess('Funcionalidad de recuperación en desarrollo. Contacte al administrador.');
            setLoading(false);
        } catch (err) {
            setError('Error al procesar la solicitud.');
            setLoading(false);
        }
    };

    const handleRequestService = (e) => {
        e.preventDefault();
        const message = `*SOLICITUD DE SERVICIO - VISITAS HUB RD*\n\n` +
            `*Nombre:* ${requestData.name}\n` +
            `*Correo:* ${requestData.email}\n` +
            `*Número:* ${requestData.phone}\n\n` +
            `Hola, me gustaría recibir más información sobre Visitas Hub RD.`;

        const waUrl = `https://wa.me/18097649811?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
        setIsRequestModalOpen(false);
        setRequestData({ name: '', email: '', phone: '' });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Background Gradient for Mobile/Tablet */}
            <div className="absolute lg:hidden inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,130,32,0.15),transparent_70%)] pointer-events-none" />

            {/* Left Side: Branding (Desktop Only) */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-slate-900 relative flex-col items-center justify-center border-r border-slate-800/60 p-12 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,130,32,0.15),transparent_60%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                
                <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-48 h-48 xl:w-56 xl:h-56 mb-12 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out">
                        <img
                            src="/logo.png"
                            alt="Visitas Hub RD Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(245,130,32,0.4)]"
                        />
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tighter mb-4 italic">
                        Visitas Hub RD
                    </h1>
                    <div className="h-1.5 w-16 bg-primary rounded-full mb-6 shadow-[0_0_15px_rgba(245,130,32,0.5)]" />
                    <p className="text-slate-400 text-xs xl:text-sm font-black uppercase tracking-[0.4em]">
                        Access Control System
                    </p>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute bottom-12 left-12 right-12 flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sistema Activo</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">v2.0 Enterprise</span>
                </div>
            </div>

            {/* Right Side: Login Form & Footer Container */}
            <div className="w-full lg:w-[55%] xl:w-1/2 h-screen overflow-y-auto flex flex-col relative custom-scrollbar">
                
                {/* Login Form Container */}
                <div className="flex-grow flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 w-full max-w-2xl mx-auto pt-10 sm:pt-16 lg:pt-0">
                    
                    {/* Mobile/Tablet Branding (Hidden on Desktop) */}
                    <div className="text-center mb-8 sm:mb-10 lg:hidden group w-full">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8 transform group-hover:scale-105 transition-all duration-700">
                        <img
                            src="/logo.png"
                            alt="Visitas Hub RD Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(245,130,32,0.4)]"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white text-center tracking-tighter mb-2 italic">Visitas Hub RD</h1>
                    <div className="h-1 w-10 sm:w-12 bg-primary mx-auto rounded-full mb-4" />
                    <p className="text-slate-500 text-[10px] sm:text-[11px] font-black text-center uppercase tracking-[0.3em]">Access Control System</p>
                </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-[2rem] border border-slate-800/80 shadow-2xl w-full max-w-md relative z-10">
                        <div className="flex items-center gap-3 mb-8">
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
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-950 border-none ring-1 ring-slate-800 focus:ring-2 focus:ring-primary rounded-xl py-3.5 pl-12 pr-12 text-sm text-white transition-all outline-none"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="pt-2 flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                            <div className="w-4 h-4 bg-slate-950 border border-slate-700 rounded peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-wider">Recordarme</span>
                                    </label>
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

                    {/* Footer Inside Right Pane */}
                    <div className="w-full max-w-md lg:max-w-xl mx-auto mt-12 sm:mt-16 lg:mt-20 pt-8 border-t border-slate-900/50 pb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                            <div className="space-y-4">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Propiedad Intelectual</h3>
                                <div className="space-y-2">
                                    <p className="text-white text-sm sm:text-base font-black tracking-tight leading-none italic">
                                        GRUPO MESA<br /><span className="text-primary">VASQUEZ (GMV)</span>
                                    </p>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] pt-2">© 2026 VISITAS HUB RD</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Contacto y Soporte</h3>
                                <div className="space-y-3">
                                    <a href="tel:8097649811" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300 group">
                                        <Phone size={14} className="text-primary/60 group-hover:text-primary" />
                                        <span className="text-[11px] font-black tracking-tight">809.764.9811</span>
                                    </a>
                                    <a href="https://www.grupomvrd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300 group">
                                        <Globe size={14} className="text-primary/60 group-hover:text-primary" />
                                        <span className="text-[11px] font-black uppercase tracking-tight">www.grupomvrd.com</span>
                                    </a>
                                    <a href="mailto:grupomv.rd@outlook.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-300 group">
                                        <Mail size={14} className="text-primary/60 group-hover:text-primary" />
                                        <span className="text-[11px] font-black tracking-tight">grupomv.rd@outlook.com</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <a href="#" className="text-slate-600 hover:text-primary transition-all hover:scale-125 duration-300">
                                    <Instagram size={18} />
                                </a>
                                <a href="#" className="text-slate-600 hover:text-blue-500 transition-all hover:scale-125 duration-300">
                                    <Facebook size={18} />
                                </a>
                                <a href="https://www.linkedin.com/company/grupo-mesa-vasquez/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-blue-400 transition-all hover:scale-125 duration-300">
                                    <Linkedin size={18} />
                                </a>
                            </div>
                            <div className="flex items-center gap-3 lg:hidden">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">v2.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating button for Request Service */}
            <button
                onClick={() => setIsRequestModalOpen(true)}
                className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[99] group border-4 border-slate-950"
            >
                <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20 pointer-events-none" />
                <Send size={24} className="sm:w-7 sm:h-7 relative z-10 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Request Service Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                            <Send size={120} className="text-primary" />
                        </div>

                        <button
                            onClick={() => setIsRequestModalOpen(false)}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-slate-500 hover:text-white transition-colors z-20"
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
