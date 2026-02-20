import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Calendar, Users, Building2, BadgeCheck, Cpu, Database, Zap, Phone, Mail as MailIcon, Instagram, Facebook, Linkedin, Filter, BarChart3, MessageCircle } from 'lucide-react';

const About = () => {
    const { user, companyData } = useAuth();
    const features = [
        { icon: <img src="/logo.png" className="w-10 h-10 object-contain" />, title: 'Seguridad Avanzada', desc: 'Control de acceso granular por roles y validación de puntos de control.' },
        { icon: <Calendar size={24} />, title: 'Gestión en Tiempo Real', desc: 'Monitoreo dinámico de entradas y salidas de visitantes.' },
        { icon: <Users size={24} />, title: 'Multi-Empresa', desc: 'Arquitectura diseñada para gestionar múltiples organizaciones de forma segregada.' },
        { icon: <BadgeCheck size={24} />, title: 'Identificación QR', desc: 'Generación y validación de carnets mediante códigos QR únicos.' },
        { icon: <Filter size={24} />, title: 'Filtros Dinámicos', desc: 'Búsqueda avanzada y filtrado de datos por múltiples criterios.' },
        { icon: <BarChart3 size={24} />, title: 'Análisis de Datos', desc: 'Visualización estadística y reportes personalizados del flujo de visitas.' },
        { icon: <MessageCircle size={24} />, title: 'Soporte WhatsApp', desc: 'Asistencia técnica inmediata y resolución de dudas en tiempo real.' }
    ];

    const techStack = [
        { icon: <Cpu />, name: 'React 19', color: 'text-blue-400' },
        { icon: <Database />, name: 'Firebase', color: 'text-orange-400' },
        { icon: <Zap />, name: 'Tailwind CSS', color: 'text-cyan-400' }
    ];

    return (
        <Layout title="Acerca de VisitFlow">
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="w-44 h-44 mx-auto mb-10 transform hover:scale-105 transition-transform duration-700">
                        <img
                            src="/logo.png"
                            alt="VisitFlow Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(245,130,32,0.25)]"
                        />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                        VisitFlow <span className="text-primary">v2.1.0</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                        Solución integral de vanguardia para la gestión, control y seguridad de accesos en entornos corporativos modernos.
                    </p>
                </div>

                {/* Grid de Características */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{f.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Tech Stack & Version Info */}
                <div className="bg-navy rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Building2 size={120} />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-primary rounded-full" />
                                Tecnología y Arquitectura
                            </h3>
                            <div className="flex flex-wrap gap-8">
                                {techStack.map((tech, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`${tech.color} bg-white/10 p-2 rounded-xl`}>
                                            {React.cloneElement(tech.icon, { size: 20 })}
                                        </div>
                                        <span className="font-bold text-sm tracking-wide">{tech.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Propiedad Intelectual</p>
                                <p className="text-sm font-black text-white uppercase tracking-tight">Grupo Mesa Vasquez (GMV)</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 VisitFlow - Todos los derechos reservados</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Canales Oficiales</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                            <Phone size={12} className="text-primary" /> 809.764.9811
                                        </div>
                                        <a href="https://www.grupomvrd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-slate-300 hover:text-primary transition-colors">
                                            <Zap size={12} className="text-primary" /> grupomvrd.com
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Soporte Técnico</p>
                                    <div className="space-y-2">
                                        <a href="mailto:grupomv.rd@outlook.com" className="flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:text-primary transition-colors lowercase">
                                            <MailIcon size={12} className="text-primary" /> grupomv.rd@outlook.com
                                        </a>
                                        <a href="mailto:grupomv.rd@gmail.com" className="flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:text-primary transition-colors lowercase">
                                            <MailIcon size={12} className="text-primary" /> grupomv.rd@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Redes Sociales */}
                        <div className="pt-6 border-t border-white/5 flex justify-center gap-6">
                            <a href="https://www.instagram.com/grupomesavasquez" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-all hover:scale-110">
                                <Instagram size={20} />
                            </a>
                            <a href="https://www.facebook.com/people/Grupo-Mesa-Vasquez/pfbid0U7gxNN1qzzjXHCZdanc3vRUV3PMWtALnXdUSbz3BLpYkr1t7yh9Lso2FViwhdKqSl/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-all hover:scale-110">
                                <Facebook size={20} />
                            </a>
                            <a href="https://www.linkedin.com/company/grupo-mesa-vasquez/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-all hover:scale-110">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="text-center pb-8 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                        Desarrollado con excelencia técnica para garantizar <br /> la integridad y eficiencia de cada visita.
                    </p>
                </div>


            </div>
        </Layout>
    );
};

export default About;
