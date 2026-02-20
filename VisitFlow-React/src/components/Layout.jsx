import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, signOut } from '../firebase';
import { LogOut, Sun, Moon, Bell, Menu, Plus, MessageCircle, X } from 'lucide-react';
import VisitModal from './VisitModal';

const SidebarContent = ({ companyData, role, location, handleLogout, user }) => {
    const menuSections = [
        {
            title: 'Operaciones',
            items: [
                { name: 'Dashboard', path: '/', icon: 'dashboard', roles: ['administrador', 'recepcion', 'seguridad'] },
                { name: 'Listado de Visitas', path: '/listado', icon: 'groups', roles: ['administrador', 'recepcion', 'seguridad'] },
                { name: 'Panel Seguridad', path: '/seguridad', icon: 'security', roles: ['administrador', 'seguridad', 'punto_de_control'] },
                { name: 'Tracking Visitantes', path: '/tracking', icon: 'route', roles: ['administrador', 'seguridad', 'superadmin'] },
            ]
        },
        {
            title: 'Catálogos',
            items: [
                { name: 'Empleados', path: '/empleados', icon: 'person_search', roles: ['administrador'] },
                { name: 'Empresas', path: '/empresas', icon: 'business', roles: ['administrador'] },
                { name: 'Carnets', path: '/carnets', icon: 'badge', roles: ['administrador'] },
            ]
        },
        {
            title: 'Configuracion',
            items: [
                { name: 'Áreas y Niveles', path: '/areas', icon: 'layers', roles: ['administrador', 'seguridad'] },
                { name: 'Motivos de Visita', path: '/motivos', icon: 'assignment', roles: ['administrador'] },
                { name: 'Usuarios', path: '/usuarios', icon: 'manage_accounts', roles: ['administrador', 'seguridad', 'superadmin'] },
                { name: 'Organizaciones', path: '/organizaciones', icon: 'corporate_fare', roles: ['superadmin'] },
            ]
        },
        {
            title: 'Análisis',
            items: [
                { name: 'Reportes', path: '/reportes', icon: 'analytics', roles: ['administrador', 'recepcion'] },
            ]
        },
        {
            title: 'Información',
            items: [
                { name: 'Acerca de', path: '/acerca', icon: 'info', roles: ['administrador', 'recepcion', 'seguridad', 'superadmin'] },
            ]
        }
    ];

    return (
        <>
            <div className="p-6">
                <div className="flex items-center gap-2 text-white">
                    <div className="w-14 h-14 bg-slate-900/50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-white/[0.05] shadow-xl">
                        <img
                            src="/logo.png"
                            alt="VF Logo"
                            className="w-full h-full object-contain p-2"
                        />
                    </div>
                    <div className="overflow-hidden">
                        <span className="text-xl font-bold tracking-tight uppercase block leading-none truncate">VisitFlow</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate block">{companyData?.name || 'Multi-Project'}</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto custom-scrollbar">
                {menuSections.map((section, idx) => {
                    const hasPuntoDeControl = companyData?.hasPuntoDeControl ?? true;
                    const filteredItems = section.items.filter(item => {
                        const hasRole = role === 'superadmin' || item.roles.includes(role);
                        const isSecurityFeature = item.path === '/seguridad';
                        const isCheckpointFeature = role === 'punto_de_control';
                        if (!hasPuntoDeControl) {
                            if (isSecurityFeature) return false;
                            if (isCheckpointFeature) return false;
                        }
                        return hasRole;
                    });
                    if (filteredItems.length === 0) return null;
                    return (
                        <div key={idx} className="space-y-1">
                            <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{section.title}</h4>
                            {filteredItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${location.pathname === item.path
                                        ? 'bg-primary/10 border border-primary/20 text-white shadow-lg shadow-primary/5'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <span className={`material-icons-outlined text-lg transition-transform group-hover:scale-110 ${location.pathname === item.path ? 'text-primary' : ''}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-white truncate capitalize">{role || 'Cargando...'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors shrink-0" title="Cerrar Sesión">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </>
    );
};

const Layout = ({ children, title }) => {
    const { user, role, companyData } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(
        localStorage.getItem('darkMode') === 'true' ||
        (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');

    const handleLogout = () => signOut(auth);

    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => { setIsSidebarOpen(false); }, [location]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden relative">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebars */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 dark:bg-black text-slate-300 z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent companyData={companyData} role={role} location={location} handleLogout={handleLogout} user={user} />
            </aside>
            <aside className="w-64 bg-slate-900 dark:bg-black text-slate-300 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-800">
                <SidebarContent companyData={companyData} role={role} location={location} handleLogout={handleLogout} user={user} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 shrink-0">
                    <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
                            <Menu size={20} />
                        </button>
                        <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white truncate uppercase tracking-tight">{title}</h1>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                        {role !== 'punto_de_control' && (
                            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white p-2 lg:px-4 lg:py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95">
                                <Plus size={18} className="lg:w-4 lg:h-4" />
                                <span className="hidden md:inline text-xs lg:text-sm">Nueva Visita</span>
                            </button>
                        )}
                        <button onClick={toggleDarkMode} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto px-4 py-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Modals & Floating Buttons */}
            <VisitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <button
                onClick={() => setIsSupportModalOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[99] border-4 border-white dark:border-slate-900 group"
            >
                <div className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-20 pointer-events-none" />
                <MessageCircle size={32} fill="currentColor" className="relative z-10" />
            </button>

            {isSupportModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 relative overflow-hidden">
                        <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 transition-colors z-20">
                            <X size={20} />
                        </button>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Soporte <span className="text-[#25D366]">GMV</span></h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">Confirma tus datos para enviarlos a soporte técnico:</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Empresa</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{companyData?.name || 'No especificada'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Usuario</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción del problema</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-[#25D366] min-h-[80px] resize-none"
                                    placeholder="¿Cómo podemos ayudarte?..."
                                    value={supportMessage}
                                    onChange={(e) => setSupportMessage(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const text = `*SOPORTE TÉCNICO VISITFLOW*\n\n🏢 *Empresa:* ${companyData?.name || 'No especificada'}\n👤 *Usuario:* ${user?.email}\n📅 *Fecha:* ${new Date().toLocaleString()}\n📝 *Caso:* ${supportMessage || 'Sin descripción'}`;
                                    window.open(`https://wa.me/18299369811?text=${encodeURIComponent(text)}`, '_blank');
                                    setIsSupportModalOpen(false);
                                    setSupportMessage('');
                                }}
                                className="w-full bg-[#25D366] hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Enviar WhatsApp
                                <MessageCircle size={18} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
