import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
    ShieldCheck, 
    Users, 
    Building2, 
    Cpu, 
    Database, 
    Zap, 
    Phone, 
    Mail as MailIcon, 
    Instagram, 
    Facebook, 
    Linkedin, 
    Filter, 
    BarChart3, 
    MessageCircle,
    Fingerprint,
    Camera,
    QrCode,
    MapPin,
    Server,
    HardDrive
} from 'lucide-react';

const About = () => {
    const { user, companyData } = useAuth();
    
    const features = [
        { 
            icon: <Fingerprint size={24} />, 
            title: 'Identidad & Cédula API', 
            desc: 'Registro avanzado con integración de Cédula Dominicana (API/Lector), consulta de RNC de la DGII para validación de contribuyentes, captura de fotos en vivo y autocompletado inteligente "Empresa Independiente" para agilizar el registro.' 
        },
        { 
            icon: <ShieldCheck size={24} />, 
            title: 'Seguridad en Checkpoints', 
            desc: 'Terminal de acceso zonal que permite a los guardias de seguridad en cada punto (entrada, almacén, oficinas) verificar carnets y autorizar tránsitos en tiempo real.' 
        },
        { 
            icon: <MapPin size={24} />, 
            title: 'Tracking & Rutas en Vivo', 
            desc: 'Rastreo y bitácora cronológica detallada del camino recorrido por cada visitante a través de los diferentes puntos de control dentro de la organización.' 
        },
        { 
            icon: <QrCode size={24} />, 
            title: 'Carnets & Credenciales QR', 
            desc: 'Generación instantánea e impresión de tickets térmicos con códigos QR únicos y logotipos personalizados para una rápida identificación digital.' 
        },
        { 
            icon: <Users size={24} />, 
            title: 'Catálogos Corporativos', 
            desc: 'Bases de datos centralizadas de empleados anfitriones, empresas externas contratistas, motivos parametrizables y áreas físicas con sus niveles de acceso.' 
        },
        { 
            icon: <BarChart3 size={24} />, 
            title: 'Dashboard y Analítica', 
            desc: 'Panel de control interactivo con métricas dinámicas de visitas activas, ingresos diarios, y gráficos de tendencias de flujo peatonal en tiempo real.' 
        },
        { 
            icon: <Filter size={24} />, 
            title: 'Reportes y Descarga de Datos', 
            desc: 'Generación de informes con filtros inteligentes por fechas, estados, empresas, áreas y motivos, ideal para auditorías de seguridad física.' 
        },
        { 
            icon: <Building2 size={24} />, 
            title: 'Arquitectura Multi-Tenant', 
            desc: 'Aislamiento seguro y segregación total de datos entre múltiples organizaciones independientes, administradas centralizadamente por el Superadmin.' 
        },
        { 
            icon: <MessageCircle size={24} />, 
            title: 'Soporte Directo WhatsApp', 
            desc: 'Módulo de soporte express integrado que compila datos del usuario y la organización para enviar un reporte de caso directo al equipo de Grupo Mesa Vasquez.' 
        }
    ];

    const techStack = [
        { icon: <Cpu />, name: 'React 19 & Vite', color: 'text-blue-400' },
        { icon: <Zap />, name: 'Tailwind CSS', color: 'text-cyan-400' },
        { icon: <Database />, name: 'PostgreSQL 16', color: 'text-indigo-400' },
        { icon: <Server />, name: 'Node.js & Express', color: 'text-emerald-400' },
        { icon: <HardDrive />, name: 'Docker & Nginx', color: 'text-sky-400' }
    ];

    return (
        <Layout title="Acerca de Visitas Hub RD">
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="w-44 h-44 mx-auto mb-10 transform hover:scale-105 transition-transform duration-700">
                        <img
                            src="/logo.png"
                            alt="Visitas Hub RD Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(245,130,32,0.25)]"
                        />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                        Visitas Hub RD <span className="text-primary text-2xl sm:text-4xl">v2.5.0</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                        Solución integral de vanguardia y de nivel corporativo para la gestión, control, registro y seguridad de accesos en entornos modernos.
                    </p>
                </div>

                {/* Grid de Características */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight leading-snug">{f.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Tech Stack & Version Info */}
                <div className="bg-slate-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                        <Building2 size={120} />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-primary rounded-full" />
                                Tecnología y Arquitectura
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                {techStack.map((tech, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center text-center p-4 bg-slate-900/50 rounded-2xl border border-white/[0.03]">
                                        <div className={`${tech.color} bg-white/5 p-3 rounded-xl mb-3`}>
                                            {React.cloneElement(tech.icon, { size: 24 })}
                                        </div>
                                        <span className="font-bold text-xs tracking-wide text-slate-200">{tech.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Propiedad Intelectual</p>
                                <p className="text-sm font-black text-white uppercase tracking-tight">Grupo Mesa Vasquez (GMV)</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2026 Visitas Hub RD - Todos los derechos reservados</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Redes Oficiales</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                            <Phone size={12} className="text-primary" /> 829-936-9811
                                        </div>
                                        <a href="https://www.grupomvrd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-slate-300 hover:text-primary transition-colors">
                                            <Zap size={12} className="text-primary" /> www.grupomvrd.com
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Servicios y Soporte</p>
                                    <div className="space-y-2">
                                        <a
                                            href="mailto:grupomv.rd@outlook.com?subject=[SOLICITUD%20DE%20SERVICIOS]%20-%20Visitas%20Hub%20RD&body=Estimado%20Equipo%20de%20Grupo%20Mesa%20Vasquez%20(GMV)%2C%0A%0AEspero%20que%20se%20encuentren%20bien.%0A%0AA%20trav%C3%A9s%20del%20presente%2C%20deseo%20solicitar%20informaci%C3%B3n%20detallada%20sobre%20los%20servicios%20y%20soluciones%20tecnol%C3%B3gicas%20que%20ofrecen%20para%20optimizar%20nuestros%20procesos%20de%20seguridad%20y%20gesti%C3%B3n%20de%20accesos.%0A%0APor%20favor%2C%20incluyan%20informaci%C3%B3n%20sobre%3A%0A-%20Implementaci%C3%B3n%20de%20Visitas%20Hub%20RD%0A-%20Sistemas%20de%20Control%20de%20Flotas%0A-%20Consultor%C3%ADa%20en%20Seguridad%20Digital%%0A%0AMis%20datos%20de%20contacto%3A%0A-%20Nombre%3A%0A-%20Empresa%3A%0A-%20Tel%C3%A9fono%3A%0A%0AQuedo%20a%20la%20espera%20de%20su%20respuesta.%%0A%0AAtentamente%2C%0A%5BNombre%5D"
                                            className="flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:text-primary transition-colors lowercase"
                                        >
                                            <MailIcon size={12} className="text-primary" /> grupomv.rd@outlook.com
                                        </a>
                                        <a
                                            href="mailto:grupomv.rd@gmail.com?subject=[SOLICITUD%20DE%20SERVICIOS]%20-%20Visitas%20Hub%20RD&body=Estimado%20Equipo%20de%20Grupo%20Mesa%20Vasquez%20(GMV)%2C%0A%0AEspero%20que%20se%20encuentren%20bien.%0A%0AA%20trav%C3%A9s%20del%20presente%2C%20deseo%20solicitar%20informaci%C3%B3n%20detallada%20sobre%20los%20servicios%20y%20soluciones%20tecnol%C3%B3gicas%20que%20ofrecen%20para%20optimizar%20nuestros%20procesos%20de%20seguridad%20y%20gesti%C3%B3n%20de%20accesos.%0A%0APor%20favor%2C%20incluyan%20informaci%C3%B3n%20sobre%3A%0A-%20Implementaci%C3%B3n%20de%20Visitas%20Hub%20RD%0A-%20Sistemas%20de%20Control%20de%20Flotas%0A-%20Consultor%C3%ADa%20en%20Seguridad%20Digital%0A%0AMis%20datos%20de%20contacto%3A%0A-%20Nombre%3A%0A-%20Empresa%3A%0A-%20Tel%C3%A9fono%3A%0A%0AQuedo%20a%20la%20espera%20de%20su%20respuesta.%0A%0AAtentamente%2C%0A%5BNombre%5D"
                                            className="flex items-center gap-2 text-[10px] font-bold text-slate-300 hover:text-primary transition-colors lowercase"
                                        >
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
